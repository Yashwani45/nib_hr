import React, { useState, useMemo } from "react";
import { updateTableRecord, createTableRecord } from "../../services/hrApi";

const ShiftMaster = ({
  records = [],
  dbData = {},
  selectedTab = "Shift Master",
  user,
  openCreateTrigger,
  onOpenEdit,
  onDelete,
  onRefreshData
}) => {
  const [activeSubTab, setActiveSubTab] = useState("catalog"); // "catalog" | "dept_assign" | "emp_assign" | "roster"
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Department-Wise Assignment States
  const [selectedDeptForAssign, setSelectedDeptForAssign] = useState("");
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);
  const [deptShiftToAssign, setDeptShiftToAssign] = useState("");
  const [deptEffectiveFrom, setDeptEffectiveFrom] = useState(new Date().toISOString().split("T")[0]);
  const [deptEffectiveTo, setDeptEffectiveTo] = useState("");
  const [deptRemarks, setDeptRemarks] = useState("");
  const [deptAssignLoading, setDeptAssignLoading] = useState(false);
  const [deptAssignSuccess, setDeptAssignSuccess] = useState("");
  const [deptAssignError, setDeptAssignError] = useState("");

  // Individual Assignment States
  const [empSearchQuery, setEmpSearchQuery] = useState("");
  const [selectedIndividualEmp, setSelectedIndividualEmp] = useState(null);
  const [indShiftToAssign, setIndShiftToAssign] = useState("");
  const [indEffectiveFrom, setIndEffectiveFrom] = useState(new Date().toISOString().split("T")[0]);
  const [indEffectiveTo, setIndEffectiveTo] = useState("");
  const [indRemarks, setIndRemarks] = useState("");
  const [indAssignLoading, setIndAssignLoading] = useState(false);
  const [indAssignSuccess, setIndAssignSuccess] = useState("");
  const [indAssignError, setIndAssignError] = useState("");

  // Roster Filter
  const [rosterDeptFilter, setRosterDeptFilter] = useState("ALL");
  const [rosterSearch, setRosterSearch] = useState("");

  // Extract employees and departments from database
  const allEmployees = useMemo(() => {
    return dbData["employees"] || dbData["employee_profile"] || dbData["Employee Profile"] || [];
  }, [dbData]);

  const allDepartments = useMemo(() => {
    const raw = dbData["Department"] || dbData["department"] || dbData["departments"] || [];
    const fromDb = raw.map(d => d.deptName || d.dept_name || d.name).filter(Boolean);
    const fromEmployees = allEmployees.map(e => e.department).filter(Boolean);
    return Array.from(new Set([...fromDb, ...fromEmployees, "Sales & Marketing", "Information Technology", "Finance & Accounts", "Human Resources", "Operations"])).sort();
  }, [dbData, allEmployees]);

  // Calculate KPIs
  const totalShifts = records.length;
  const activeShiftsCount = records.filter(r => (r.status || "Active").toLowerCase() === "active").length;
  const assignedEmployeesCount = allEmployees.filter(e => e.shift && String(e.shift).trim() !== "").length;
  const coveredDeptsCount = new Set(allEmployees.filter(e => e.shift).map(e => e.department).filter(Boolean)).size;

  // Filtered shifts for catalog view
  const filteredShifts = useMemo(() => {
    return records.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const code = String(item.shiftCode || item.shift_code || "").toLowerCase();
      const name = String(item.shiftName || item.shift_name || "").toLowerCase();
      const dept = String(item.department || "").toLowerCase();
      const matchesSearch = !q || code.includes(q) || name.includes(q) || dept.includes(q);

      const matchesDept = filterDept === "ALL" || String(item.department || "").toLowerCase() === filterDept.toLowerCase();
      const matchesStatus = filterStatus === "ALL" || String(item.status || "Active").toLowerCase() === filterStatus.toLowerCase();

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [records, searchQuery, filterDept, filterStatus]);

  // Employees in selected department for department-wise assignment
  const deptEmployees = useMemo(() => {
    if (!selectedDeptForAssign) return [];
    return allEmployees.filter(e => {
      const d = String(e.department || "").trim().toLowerCase();
      const target = selectedDeptForAssign.trim().toLowerCase();
      return d === target || d.includes(target) || target.includes(d);
    });
  }, [allEmployees, selectedDeptForAssign]);

  // Handle Select All for department employees
  const handleToggleSelectAllDept = () => {
    if (selectedEmpIds.length === deptEmployees.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(deptEmployees.map(e => e.id));
    }
  };

  const handleToggleEmp = (id) => {
    setSelectedEmpIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Perform Department-Wise Shift Assignment
  const handleSaveDeptAssignment = async (e) => {
    e.preventDefault();
    setDeptAssignError("");
    setDeptAssignSuccess("");

    if (!selectedDeptForAssign) {
      setDeptAssignError("Please select a target Department.");
      return;
    }
    if (selectedEmpIds.length === 0) {
      setDeptAssignError("Please select at least one employee from this department.");
      return;
    }
    if (!deptShiftToAssign) {
      setDeptAssignError("Please select an Active Shift to assign.");
      return;
    }

    try {
      setDeptAssignLoading(true);
      const chosenShiftObj = records.find(r => (r.shiftName || r.shift_name) === deptShiftToAssign || (r.shiftCode || r.shift_code) === deptShiftToAssign);
      const shiftName = chosenShiftObj ? (chosenShiftObj.shiftName || chosenShiftObj.shift_name) : deptShiftToAssign;
      const startTime = chosenShiftObj ? (chosenShiftObj.startTime || chosenShiftObj.start_time || "09:00 AM") : "09:00 AM";
      const endTime = chosenShiftObj ? (chosenShiftObj.endTime || chosenShiftObj.end_time || "06:00 PM") : "06:00 PM";
      const shiftLabel = `${shiftName} (${startTime} - ${endTime})`;

      for (const empId of selectedEmpIds) {
        const emp = allEmployees.find(e => e.id === empId);
        await updateTableRecord("employees", empId, { shift: shiftLabel });
        
        // Also record in shift_assignment_history
        try {
          await createTableRecord("shift_assignment_history", {
            employee_id: empId,
            employee_code: emp?.employeeCode || "",
            employee_name: `${emp?.firstName || ""} ${emp?.lastName || ""}`.trim() || emp?.employeeName || "",
            department: selectedDeptForAssign,
            previous_shift: emp?.shift || "General Shift",
            new_shift: shiftLabel,
            effective_from: deptEffectiveFrom || null,
            effective_to: deptEffectiveTo || null,
            assignment_type: "Department",
            assigned_by: user?.email || user?.name || "Admin",
            remarks: deptRemarks || `Assigned via Department-wise assignment for ${selectedDeptForAssign}`
          });
        } catch (hErr) {}
      }

      setDeptAssignSuccess(`Successfully assigned '${shiftLabel}' to ${selectedEmpIds.length} employees in ${selectedDeptForAssign}.`);
      setSelectedEmpIds([]);
      setDeptRemarks("");
      if (onRefreshData) await onRefreshData();
    } catch (err) {
      setDeptAssignError(err.message || "Failed to update department shift assignment.");
    } finally {
      setDeptAssignLoading(false);
    }
  };

  // Filtered employees for individual search
  const searchedIndividualEmployees = useMemo(() => {
    if (!empSearchQuery.trim()) return [];
    const q = empSearchQuery.toLowerCase().trim();
    return allEmployees.filter(emp => {
      const name = `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.employeeName || "";
      const code = emp.employeeCode || emp.empCode || emp.employeeId || "";
      const dept = emp.department || "";
      return name.toLowerCase().includes(q) || code.toLowerCase().includes(q) || dept.toLowerCase().includes(q);
    }).slice(0, 8);
  }, [allEmployees, empSearchQuery]);

  // Perform Individual Shift Assignment
  const handleSaveIndividualAssignment = async (e) => {
    e.preventDefault();
    setIndAssignError("");
    setIndAssignSuccess("");

    if (!selectedIndividualEmp) {
      setIndAssignError("Please select an employee first.");
      return;
    }
    if (!indShiftToAssign) {
      setIndAssignError("Please select an Active Shift to assign.");
      return;
    }

    try {
      setIndAssignLoading(true);
      const chosenShiftObj = records.find(r => (r.shiftName || r.shift_name) === indShiftToAssign || (r.shiftCode || r.shift_code) === indShiftToAssign);
      const shiftName = chosenShiftObj ? (chosenShiftObj.shiftName || chosenShiftObj.shift_name) : indShiftToAssign;
      const startTime = chosenShiftObj ? (chosenShiftObj.startTime || chosenShiftObj.start_time || "09:00 AM") : "09:00 AM";
      const endTime = chosenShiftObj ? (chosenShiftObj.endTime || chosenShiftObj.end_time || "06:00 PM") : "06:00 PM";
      const shiftLabel = `${shiftName} (${startTime} - ${endTime})`;

      await updateTableRecord("employees", selectedIndividualEmp.id, { shift: shiftLabel });

      // Record in shift_assignment_history
      try {
        await createTableRecord("shift_assignment_history", {
          employee_id: selectedIndividualEmp.id,
          employee_code: selectedIndividualEmp.employeeCode || "",
          employee_name: `${selectedIndividualEmp.firstName || ""} ${selectedIndividualEmp.lastName || ""}`.trim() || selectedIndividualEmp.employeeName || "",
          department: selectedIndividualEmp.department || "",
          previous_shift: selectedIndividualEmp.shift || "General Shift",
          new_shift: shiftLabel,
          effective_from: indEffectiveFrom || null,
          effective_to: indEffectiveTo || null,
          assignment_type: "Individual",
          assigned_by: user?.email || user?.name || "Admin",
          remarks: indRemarks || "Individual shift assignment via Shift Master"
        });
      } catch (hErr) {}

      const empName = `${selectedIndividualEmp.firstName || ""} ${selectedIndividualEmp.lastName || ""}`.trim() || selectedIndividualEmp.employeeName || "Employee";
      setIndAssignSuccess(`Successfully assigned '${shiftLabel}' to ${empName}.`);
      setSelectedIndividualEmp(null);
      setEmpSearchQuery("");
      setIndRemarks("");
      if (onRefreshData) await onRefreshData();
    } catch (err) {
      setIndAssignError(err.message || "Failed to assign shift to employee.");
    } finally {
      setIndAssignLoading(false);
    }
  };

  // Filtered employees for Roster view
  const rosterEmployees = useMemo(() => {
    return allEmployees.filter(emp => {
      const q = rosterSearch.toLowerCase().trim();
      const name = `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.employeeName || "";
      const code = emp.employeeCode || emp.empCode || emp.employeeId || "";
      const shift = emp.shift || "";
      const dept = emp.department || "";

      const matchesSearch = !q || name.toLowerCase().includes(q) || code.toLowerCase().includes(q) || shift.toLowerCase().includes(q);
      const matchesDept = rosterDeptFilter === "ALL" || dept.toLowerCase() === rosterDeptFilter.toLowerCase();
      return matchesSearch && matchesDept;
    });
  }, [allEmployees, rosterSearch, rosterDeptFilter]);

  return (
    <div className="space-y-6">
      {/* 1. Header KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 via-blue-50/50 to-white border border-blue-200/80 rounded-2xl p-4.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Total Defined Shifts</span>
            <span className="p-2 bg-blue-100/80 text-blue-600 rounded-xl">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">{totalShifts}</span>
            <span className="text-xs font-semibold text-gray-500">Shifts Configured</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-50/50 to-white border border-emerald-200/80 rounded-2xl p-4.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Active Shifts</span>
            <span className="p-2 bg-emerald-100/80 text-emerald-600 rounded-xl">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-800">{activeShiftsCount}</span>
            <span className="text-xs font-semibold text-emerald-600">Operational</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-50/50 to-white border border-indigo-200/80 rounded-2xl p-4.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Assigned Employees</span>
            <span className="p-2 bg-indigo-100/80 text-indigo-600 rounded-xl">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-900">{assignedEmployeesCount}</span>
            <span className="text-xs font-semibold text-gray-500">of {allEmployees.length} Total</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 via-purple-50/50 to-white border border-purple-200/80 rounded-2xl p-4.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Covered Departments</span>
            <span className="p-2 bg-purple-100/80 text-purple-600 rounded-xl">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-900">{coveredDeptsCount}</span>
            <span className="text-xs font-semibold text-gray-500">Departments Active</span>
          </div>
        </div>
      </div>

      {/* 2. Sub-Navigation Tabs & Actions */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => setActiveSubTab("catalog")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === "catalog"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>📋 Shift Master Catalog</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeSubTab === "catalog" ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-700"}`}>
              {filteredShifts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("dept_assign")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === "dept_assign"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>🏢 Department-Wise Assignment</span>
          </button>

          <button
            onClick={() => setActiveSubTab("emp_assign")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === "emp_assign"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>👤 Individual Employee Assignment</span>
          </button>

          <button
            onClick={() => setActiveSubTab("roster")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === "roster"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>🗓️ Shift Roster ({allEmployees.length})</span>
          </button>
        </div>
      </div>

      {/* ==================== TAB 1: SHIFT MASTER CATALOG ==================== */}
      {activeSubTab === "catalog" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                placeholder="Search shifts by code, title, timing..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">All Departments</option>
                {allDepartments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Shift Cards Grid */}
          {filteredShifts.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h4 className="text-sm font-bold text-slate-800">No Shifts Found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Use the Department-Wise Assignment or Individual Assignment tabs to configure and assign organization shifts.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
              {filteredShifts.map((shift) => {
                const shiftCode = shift.shiftCode || shift.shift_code || `SHFT-${shift.id}`;
                const shiftName = shift.shiftName || shift.shift_name || "General Shift";
                const startTime = shift.startTime || shift.start_time || "09:00 AM";
                const endTime = shift.endTime || shift.end_time || "06:00 PM";
                const graceTime = shift.graceTime ?? shift.grace_time ?? 15;
                const breakMin = shift.breakDuration ?? shift.break_duration ?? 60;
                const dept = shift.department || "All Departments";
                const empAssigned = shift.employee || "All in Dept";
                const status = shift.status || "Active";
                const isOvernight = shift.isOvernight || shift.is_overnight || startTime.toLowerCase().includes("pm") && endTime.toLowerCase().includes("am");

                // Count employees assigned to this shift
                const shiftLabelPrefix = shiftName.toLowerCase();
                const matchedEmps = allEmployees.filter(e => e.shift && e.shift.toLowerCase().includes(shiftLabelPrefix));

                return (
                  <div
                    key={shift.id}
                    className="bg-white border border-slate-200/90 hover:border-blue-400 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 tracking-wider">
                            {shiftCode}
                          </span>
                          <h4 className="font-extrabold text-sm text-slate-900 mt-1.5 tracking-tight group-hover:text-blue-600 transition">
                            {shiftName}
                          </h4>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          status.toLowerCase() === "active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>
                          {status}
                        </span>
                      </div>

                      {/* Shift Timings & Overnight Pill */}
                      <div className="my-3.5 bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Hours:
                          </span>
                          <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            {startTime} — {endTime}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                          <div className="flex items-center gap-1 text-slate-600">
                            <span className="text-slate-400">Grace:</span>
                            <span className="font-bold text-slate-800">{graceTime} mins</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-600">
                            <span className="text-slate-400">Break:</span>
                            <span className="font-bold text-slate-800">{breakMin} mins</span>
                          </div>
                        </div>

                        {isOvernight && (
                          <div className="mt-1 pt-1 border-t border-slate-200/60 flex items-center gap-1 text-[10px] font-bold text-amber-700">
                            <span>🌙 Overnight Shift (crosses midnight)</span>
                          </div>
                        )}
                      </div>

                      {/* Department & Employee Mapping Information */}
                      <div className="space-y-1.5 text-[11px] border-t border-slate-100 pt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium">Department:</span>
                          <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                            {dept}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium">Assigned To:</span>
                          <span className="font-bold text-indigo-700 text-[10px]">
                            {empAssigned}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium">Mapped Employees:</span>
                          <span className="font-black text-blue-600 text-xs">
                            {matchedEmps.length} Employees
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-end gap-2">
                      {onOpenEdit && (
                        <button
                          onClick={() => onOpenEdit(shift)}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          <span>Edit</span>
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete shift "${shiftName}"?`)) {
                              onDelete(shift.id);
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-300 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 2: DEPARTMENT-WISE ASSIGNMENT ==================== */}
      {activeSubTab === "dept_assign" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">🏢 Department-Wise Shift Assignment</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select an entire department or choose specific employees to assign a shift schedule in bulk.
            </p>
          </div>

          {deptAssignSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              <span>{deptAssignSuccess}</span>
            </div>
          )}
          {deptAssignError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
              <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              <span>{deptAssignError}</span>
            </div>
          )}

          <form onSubmit={handleSaveDeptAssignment} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Select Department */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Target Department *
                </label>
                <select
                  value={selectedDeptForAssign}
                  onChange={(e) => {
                    setSelectedDeptForAssign(e.target.value);
                    setSelectedEmpIds([]);
                  }}
                  required
                  className="w-full text-xs font-bold border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer text-slate-900"
                >
                  <option value="">-- Choose Department --</option>
                  {allDepartments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* 2. Select Shift */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Select Shift to Assign *
                </label>
                <select
                  value={deptShiftToAssign}
                  onChange={(e) => setDeptShiftToAssign(e.target.value)}
                  required
                  className="w-full text-xs font-bold border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer text-slate-900"
                >
                  <option value="">-- Choose Active Shift --</option>
                  {records.map(r => {
                    const name = r.shiftName || r.shift_name;
                    const st = r.startTime || r.start_time || "09:00 AM";
                    const et = r.endTime || r.end_time || "06:00 PM";
                    return (
                      <option key={r.id} value={name}>
                        {name} ({st} — {et})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* 3. Effective Dates */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Effective From Date *
                </label>
                <input
                  type="date"
                  value={deptEffectiveFrom}
                  onChange={(e) => setDeptEffectiveFrom(e.target.value)}
                  required
                  className="w-full text-xs font-bold border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Effective To Date (Optional)
                </label>
                <input
                  type="date"
                  value={deptEffectiveTo}
                  onChange={(e) => setDeptEffectiveTo(e.target.value)}
                  className="w-full text-xs font-bold border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900"
                />
              </div>
            </div>

            {/* 4. Employee Selection Box */}
            {selectedDeptForAssign && (
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                  <span className="text-xs font-extrabold text-slate-900">
                    Employees in {selectedDeptForAssign} ({deptEmployees.length} Found)
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleSelectAllDept}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                  >
                    {selectedEmpIds.length === deptEmployees.length ? "Deselect All" : `Select All (${deptEmployees.length})`}
                  </button>
                </div>

                {deptEmployees.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">No active employees found currently mapped to {selectedDeptForAssign}.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                    {deptEmployees.map((emp) => {
                      const name = `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.employeeName || emp.email;
                      const code = emp.employeeCode || emp.empCode || emp.employeeId || "";
                      const isSelected = selectedEmpIds.includes(emp.id);

                      return (
                        <div
                          key={emp.id}
                          onClick={() => handleToggleEmp(emp.id)}
                          className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? "bg-blue-50/80 border-blue-400 text-blue-900"
                              : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <div className="truncate">
                            <p className="text-xs font-extrabold truncate">{name}</p>
                            <p className="text-[10px] text-slate-500 font-semibold">{code} • Curr: {emp.shift || "General Shift"}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">
                Assignment Remarks (Optional)
              </label>
              <textarea
                rows={2}
                value={deptRemarks}
                onChange={(e) => setDeptRemarks(e.target.value)}
                placeholder="E.g., Department rotation for Q4 peak load support..."
                className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={deptAssignLoading || selectedEmpIds.length === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center gap-2"
              >
                {deptAssignLoading ? (
                  <span>Applying shift to database...</span>
                ) : (
                  <span>Confirm & Assign Shift to {selectedEmpIds.length} Selected Employees</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== TAB 3: INDIVIDUAL EMPLOYEE ASSIGNMENT ==================== */}
      {activeSubTab === "emp_assign" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">👤 Individual Employee Shift Assignment</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Change or assign shifts for an individual employee without affecting their department's baseline configuration.
            </p>
          </div>

          {indAssignSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              <span>{indAssignSuccess}</span>
            </div>
          )}
          {indAssignError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
              <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              <span>{indAssignError}</span>
            </div>
          )}

          {/* Search Box */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Search Employee by Name, ID, or Department
            </label>
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                placeholder="Type employee name (e.g., Akansha, Rahul, TVN2007, EMP-071440)..."
                value={empSearchQuery}
                onChange={(e) => setEmpSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            {searchedIndividualEmployees.length > 0 && !selectedIndividualEmp && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-2 max-h-56 overflow-y-auto space-y-1">
                {searchedIndividualEmployees.map(emp => {
                  const name = `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.employeeName || emp.email;
                  const code = emp.employeeCode || emp.empCode || emp.employeeId || "";
                  return (
                    <div
                      key={emp.id}
                      onClick={() => {
                        setSelectedIndividualEmp(emp);
                        setEmpSearchQuery(name);
                      }}
                      className="px-3.5 py-2 hover:bg-blue-50/80 rounded-xl cursor-pointer flex items-center justify-between text-xs transition"
                    >
                      <div>
                        <span className="font-extrabold text-slate-900">{name}</span>
                        <span className="text-slate-500 ml-2 font-medium">({code}) • {emp.department || "No Department"}</span>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded">
                        Curr: {emp.shift || "General Shift"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Employee Card */}
          {selectedIndividualEmp && (
            <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                  {(selectedIndividualEmp.firstName || selectedIndividualEmp.employeeName || "E")[0].toUpperCase()}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    {`${selectedIndividualEmp.firstName || ""} ${selectedIndividualEmp.lastName || ""}`.trim() || selectedIndividualEmp.employeeName}
                  </h4>
                  <p className="text-[11px] text-slate-600 font-semibold">
                    Code: {selectedIndividualEmp.employeeCode || selectedIndividualEmp.employeeId || "EMP"} • Dept: {selectedIndividualEmp.department || "Operations"} • Desig: {selectedIndividualEmp.designation || "Staff"}
                  </p>
                  <p className="text-[11px] text-blue-700 font-bold mt-0.5">
                    Current Shift: {selectedIndividualEmp.shift || "General Shift (09:00 - 18:00)"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedIndividualEmp(null);
                  setEmpSearchQuery("");
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 transition cursor-pointer"
              >
                Change Employee
              </button>
            </div>
          )}

          {/* Form */}
          {selectedIndividualEmp && (
            <form onSubmit={handleSaveIndividualAssignment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">
                    New Active Shift *
                  </label>
                  <select
                    value={indShiftToAssign}
                    onChange={(e) => setIndShiftToAssign(e.target.value)}
                    required
                    className="w-full text-xs font-bold border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer text-slate-900"
                  >
                    <option value="">-- Choose Shift --</option>
                    {records.map(r => {
                      const name = r.shiftName || r.shift_name;
                      const st = r.startTime || r.start_time || "09:00 AM";
                      const et = r.endTime || r.end_time || "06:00 PM";
                      return (
                        <option key={r.id} value={name}>
                          {name} ({st} — {et})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Effective From *
                  </label>
                  <input
                    type="date"
                    value={indEffectiveFrom}
                    onChange={(e) => setIndEffectiveFrom(e.target.value)}
                    required
                    className="w-full text-xs font-bold border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Effective To (Optional)
                  </label>
                  <input
                    type="date"
                    value={indEffectiveTo}
                    onChange={(e) => setIndEffectiveTo(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Remarks / Reason for Individual Shift Change
                </label>
                <textarea
                  rows={2}
                  value={indRemarks}
                  onChange={(e) => setIndRemarks(e.target.value)}
                  placeholder="E.g., Special project night shift deployment requested by employee manager..."
                  className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={indAssignLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center gap-2"
                >
                  {indAssignLoading ? (
                    <span>Assigning Shift...</span>
                  ) : (
                    <span>Confirm & Update Employee Shift</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ==================== TAB 4: SHIFT ROSTER & ALLOCATIONS ==================== */}
      {activeSubTab === "roster" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">🗓️ Shift Allocation Roster</h3>
              <p className="text-xs text-slate-500 mt-0.5">Live view of current shifts assigned across all active company personnel.</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search roster..."
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <select
                value={rosterDeptFilter}
                onChange={(e) => setRosterDeptFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Departments</option>
                {allDepartments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Assigned Shift</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rosterEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">No matching employees in roster.</td>
                  </tr>
                ) : (
                  rosterEmployees.map((emp) => {
                    const name = `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.employeeName || emp.email;
                    const code = emp.employeeCode || emp.empCode || emp.employeeId || "—";
                    const dept = emp.department || "Operations";
                    const desig = emp.designation || "Staff";
                    const shift = emp.shift || "General Shift (09:00 - 18:00)";

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 transition font-medium">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">
                              {name[0].toUpperCase()}
                            </div>
                            <span className="font-extrabold text-slate-900">{name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-600">{code}</td>
                        <td className="py-3 px-4 text-slate-800">{dept}</td>
                        <td className="py-3 px-4 text-slate-600">{desig}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-200/60 inline-block text-[11px]">
                            {shift}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftMaster;
