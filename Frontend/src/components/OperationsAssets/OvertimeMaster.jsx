import React, { useState, useMemo } from "react";
import {
  ClockIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  DocumentCheckIcon
} from "@heroicons/react/24/outline";
import { updateTableRecord, createTableRecord } from "../../services/hrApi";

const OvertimeMaster = ({
  records = [],
  dbData = {},
  selectedTab = "Overtime",
  user,
  openCreateTrigger,
  onOpenEdit,
  onDelete,
  onRefreshData,
  onExport
}) => {
  const [activeTab, setActiveTab] = useState("policies"); // "policies" | "assign" | "requests" | "summary"
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Assignment states
  const [assignDept, setAssignDept] = useState("");
  const [assignPolicy, setAssignPolicy] = useState("");
  const [assignEmpIds, setAssignEmpIds] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState("");
  const [assignError, setAssignError] = useState("");

  // Extracted data from Redux / DB
  const allEmployees = useMemo(() => {
    return dbData["employees"] || dbData["employee_profile"] || dbData["Employee Profile"] || [];
  }, [dbData]);

  const allDepartments = useMemo(() => {
    const raw = dbData["Department"] || dbData["department"] || dbData["departments"] || [];
    const fromDb = raw.map(d => d.deptName || d.dept_name || d.name).filter(Boolean);
    const fromEmps = allEmployees.map(e => e.department).filter(Boolean);
    return Array.from(new Set([...fromDb, ...fromEmps, "Sales & Marketing", "Information Technology", "Finance & Accounts", "Human Resources", "Operations"])).sort();
  }, [dbData, allEmployees]);

  // Combined OT policies
  const overtimePolicies = useMemo(() => {
    if (Array.isArray(records) && records.length > 0) return records;
    const fromDb = dbData["Overtime Master"] || dbData["overtime_masters"] || dbData["Overtime"] || [];
    if (fromDb.length > 0) return fromDb;
    return [
      { id: "1", overtimeName: "Standard Workday OT (1.5x)", policyCode: "OT-STD-WD", rateMultiplier: 1.5, minHours: 1.0, maxHours: 4.0, maxDailyHours: 4.0, maxMonthlyHours: 40.0, applicableDept: "All Departments", calculationType: "Salary-Based Multiplier", requiresManagerApproval: "Yes", requiresHrApproval: "Yes", payrollIntegrated: "Yes", status: "Active" },
      { id: "2", overtimeName: "Weekend / Sunday OT (2.0x)", policyCode: "OT-WKND-2X", rateMultiplier: 2.0, minHours: 2.0, maxHours: 8.0, maxDailyHours: 8.0, maxMonthlyHours: 40.0, applicableDept: "All Departments", calculationType: "Salary-Based Multiplier", requiresManagerApproval: "Yes", requiresHrApproval: "Yes", payrollIntegrated: "Yes", status: "Active" },
      { id: "3", overtimeName: "Public Holiday Double Pay (2.5x)", policyCode: "OT-PUB-HOL", rateMultiplier: 2.5, minHours: 2.0, maxHours: 8.0, maxDailyHours: 8.0, maxMonthlyHours: 40.0, applicableDept: "Sales & Marketing", calculationType: "Salary-Based Multiplier", requiresManagerApproval: "Yes", requiresHrApproval: "Yes", payrollIntegrated: "Yes", status: "Active" },
      { id: "4", overtimeName: "Night Shift Extra OT (1.75x)", policyCode: "OT-IT-NIGHT", rateMultiplier: 1.75, minHours: 1.5, maxHours: 5.0, maxDailyHours: 5.0, maxMonthlyHours: 50.0, applicableDept: "Information Technology", calculationType: "Salary-Based Multiplier", requiresManagerApproval: "Yes", requiresHrApproval: "No", payrollIntegrated: "Yes", status: "Active" },
    ];
  }, [records, dbData]);

  // Overtime attendance / logs
  const overtimeLogs = useMemo(() => {
    const rawAttendance = dbData["Daily Attendance"] || dbData["daily_attendance"] || [];
    const withOt = rawAttendance.filter(a => Number(a.overtime || 0) > 0);
    if (withOt.length > 0) {
      return withOt.map((att, idx) => ({
        id: att.id || idx,
        employeeName: att.name || "Employee",
        empId: att.empId || "EMP",
        date: att.date || "2026-10-31",
        shift: att.shift || "General Shift",
        otHours: Number(att.overtime || 0),
        multiplier: 1.5,
        estimatedPay: Math.round(Number(att.overtime || 0) * 250 * 1.5),
        managerStatus: "Approved",
        hrStatus: "Approved",
        payrollStatus: "Synced"
      }));
    }
    return [
      { id: "ot-1", employeeName: "Akansha Mishra", empId: "EMP-071440", date: "2026-10-30", shift: "General Shift (09:00 - 18:00)", otHours: 2.5, multiplier: 1.5, estimatedPay: 937.50, managerStatus: "Approved", hrStatus: "Approved", payrollStatus: "Synced" },
      { id: "ot-2", employeeName: "Palak Malviya", empId: "EMP-698604", date: "2026-10-29", shift: "General Shift (09:00 - 18:00)", otHours: 1.5, multiplier: 1.5, estimatedPay: 562.50, managerStatus: "Approved", hrStatus: "Pending", payrollStatus: "Pending" },
      { id: "ot-3", employeeName: "Rahul Sharma", empId: "EMP-091623", date: "2026-10-28", shift: "General Shift (09:00 - 18:00)", otHours: 3.0, multiplier: 1.75, estimatedPay: 1312.50, managerStatus: "Approved", hrStatus: "Approved", payrollStatus: "Synced" }
    ];
  }, [dbData]);

  // Filtered policies
  const filteredPolicies = useMemo(() => {
    return overtimePolicies.filter(item => {
      const q = searchTerm.toLowerCase().trim();
      const name = String(item.overtimeName || item.overtime_name || "").toLowerCase();
      const code = String(item.policyCode || item.policy_code || "").toLowerCase();
      const dept = String(item.applicableDept || item.applicable_dept || item.department || "").toLowerCase();

      const matchesSearch = !q || name.includes(q) || code.includes(q) || dept.includes(q);
      const matchesDept = deptFilter === "ALL" || dept.includes(deptFilter.toLowerCase()) || deptFilter.toLowerCase().includes(dept);
      const matchesStatus = statusFilter === "ALL" || String(item.status || "Active").toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [overtimePolicies, searchTerm, deptFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalRules = overtimePolicies.length;
    const activeRules = overtimePolicies.filter(o => (o.status || "Active").toLowerCase() === "active").length;
    const totalOtHours = overtimeLogs.reduce((sum, log) => sum + (Number(log.otHours) || 0), 0);
    const totalEstimatedPayout = overtimeLogs.reduce((sum, log) => sum + (Number(log.estimatedPay) || 0), 0);
    return { totalRules, activeRules, totalOtHours, totalEstimatedPayout };
  }, [overtimePolicies, overtimeLogs]);

  // Employees in selected dept for assignment
  const deptEmployees = useMemo(() => {
    if (!assignDept) return [];
    return allEmployees.filter(e => {
      const d = String(e.department || "").trim().toLowerCase();
      const target = assignDept.trim().toLowerCase();
      return d === target || d.includes(target) || target.includes(d);
    });
  }, [allEmployees, assignDept]);

  const handleToggleSelectAllDept = () => {
    if (assignEmpIds.length === deptEmployees.length) {
      setAssignEmpIds([]);
    } else {
      setAssignEmpIds(deptEmployees.map(e => e.id));
    }
  };

  const handleToggleEmp = (id) => {
    setAssignEmpIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSavePolicyAssignment = async (e) => {
    e.preventDefault();
    setAssignError("");
    setAssignSuccess("");

    if (!assignDept) {
      setAssignError("Please select a target department.");
      return;
    }
    if (!assignPolicy) {
      setAssignError("Please select an Overtime Policy to apply.");
      return;
    }
    if (assignEmpIds.length === 0) {
      setAssignError("Please select at least one employee.");
      return;
    }

    try {
      setAssignLoading(true);
      // Update employee metadata with overtime policy
      for (const empId of assignEmpIds) {
        await updateTableRecord("employees", empId, { overtimePolicy: assignPolicy });
      }
      setAssignSuccess(`Successfully mapped policy '${assignPolicy}' to ${assignEmpIds.length} employees in ${assignDept}.`);
      setAssignEmpIds([]);
      if (onRefreshData) await onRefreshData();
    } catch (err) {
      setAssignError(err.message || "Failed to assign overtime policy.");
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-700 via-orange-800 to-slate-900 text-white p-6 sm:p-7 shadow-2xl border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
              <ClockIcon className="h-9 w-9 text-amber-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-amber-400/20 text-amber-200 border border-amber-400/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Attendance & Payroll
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 rounded-full text-[10px] font-bold">
                  ● Enterprise OT Management
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Overtime Master & Configuration</h2>
              <p className="text-xs sm:text-sm text-amber-100/80 font-medium max-w-xl mt-1">
                Configure rate multipliers (1.5x / 2.0x), eligibility rules, approval chains, and payroll integration.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total OT Policies</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalRules}</p>
            <span className="text-[10px] text-emerald-600 font-bold">{stats.activeRules} Operational</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <ClockIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total OT Hours</span>
            <p className="text-2xl font-black text-blue-600 mt-1">{stats.totalOtHours} hrs</p>
            <span className="text-[10px] text-slate-400 font-bold">Logged in Cycle</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <DocumentCheckIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Est. Overtime Payout</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">₹{stats.totalEstimatedPayout.toLocaleString()}</p>
            <span className="text-[10px] text-emerald-700 font-bold">Ready for Payroll</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CurrencyDollarIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Covered Departments</span>
            <p className="text-2xl font-black text-purple-900 mt-1">{allDepartments.length}</p>
            <span className="text-[10px] text-purple-600 font-bold">Policy Enabled</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <UserGroupIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => setActiveTab("policies")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "policies"
                ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>📋 Overtime Master Policies</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === "policies" ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-700"}`}>
              {filteredPolicies.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("assign")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "assign"
                ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>🏢 Department Policy Mapping</span>
          </button>

          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "requests"
                ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>📝 OT Attendance & Approvals ({overtimeLogs.length})</span>
          </button>
        </div>

        <button
          onClick={() => onExport && onExport("excel")}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer"
        >
          <ArrowDownTrayIcon className="w-4 h-4" /> Export Report
        </button>
      </div>

      {/* ==================== TAB 1: OVERTIME POLICIES ==================== */}
      {activeTab === "policies" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search policy name, policy code, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Departments</option>
                {allDepartments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Policy Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
            {filteredPolicies.map((item) => {
              const name = item.overtimeName || item.overtime_name || "Standard OT";
              const code = item.policyCode || item.policy_code || `OT-${item.id}`;
              const mult = item.rateMultiplier || item.rate_multiplier || 1.5;
              const minH = item.minHours || item.min_hours || 1.0;
              const maxH = item.maxHours || item.max_hours || item.maxDailyHours || 4.0;
              const dept = item.applicableDept || item.applicable_dept || item.department || "All Departments";
              const calcType = item.calculationType || item.calculation_type || "Salary-Based Multiplier";
              const status = item.status || "Active";
              const requiresMgr = item.requiresManagerApproval === "Yes" || item.requires_manager_approval === 1 || item.requiresManagerApproval === true;
              const requiresHr = item.requiresHrApproval === "Yes" || item.requires_hr_approval === 1 || item.requiresHrApproval === true;

              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200/90 hover:border-amber-400 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200 tracking-wider">
                          {code}
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900 mt-1.5 tracking-tight group-hover:text-amber-700 transition">
                          {name}
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

                    <div className="my-3.5 bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">Rate Multiplier:</span>
                        <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 font-black rounded-lg border border-amber-200 text-xs">
                          {mult}x Pay Rate
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Method:</span>
                        <span className="font-bold text-slate-800">{calcType}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                        <div>
                          <span className="text-slate-400">Min Duration:</span>
                          <p className="font-bold text-slate-800">{minH} hrs</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Max Daily OT:</span>
                          <p className="font-bold text-slate-800">{maxH} hrs</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[11px] border-t border-slate-100 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Department:</span>
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                          {dept}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Approval Chain:</span>
                        <span className="font-bold text-indigo-700 text-[10px]">
                          {requiresMgr && requiresHr ? "Manager + Department HR" : requiresMgr ? "Manager Only" : "Direct Approval"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Payroll Sync:</span>
                        <span className="font-bold text-emerald-600 text-[10px] flex items-center gap-1">
                          <CheckCircleIcon className="w-3.5 h-3.5" /> Auto-Integrated
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-end gap-2">
                    {onOpenEdit && (
                      <button
                        onClick={() => onOpenEdit(item)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-300 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <PencilSquareIcon className="w-3.5 h-3.5" />
                        <span>Edit Policy</span>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete policy "${name}"?`)) {
                            onDelete(item.id);
                          }
                        }}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-300 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: DEPARTMENT MAPPING ==================== */}
      {activeTab === "assign" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">🏢 Department Overtime Policy Mapping</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Map and activate an overtime policy for specific departments or personnel.
            </p>
          </div>

          {assignSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
              <span>{assignSuccess}</span>
            </div>
          )}
          {assignError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold">
              {assignError}
            </div>
          )}

          <form onSubmit={handleSavePolicyAssignment} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Target Department *
                </label>
                <select
                  value={assignDept}
                  onChange={(e) => {
                    setAssignDept(e.target.value);
                    setAssignEmpIds([]);
                  }}
                  required
                  className="w-full text-xs font-bold border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 cursor-pointer text-slate-900"
                >
                  <option value="">-- Choose Department --</option>
                  {allDepartments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Overtime Policy to Apply *
                </label>
                <select
                  value={assignPolicy}
                  onChange={(e) => setAssignPolicy(e.target.value)}
                  required
                  className="w-full text-xs font-bold border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 cursor-pointer text-slate-900"
                >
                  <option value="">-- Choose Policy --</option>
                  {overtimePolicies.map(p => {
                    const pName = p.overtimeName || p.overtime_name;
                    const mult = p.rateMultiplier || p.rate_multiplier || 1.5;
                    return (
                      <option key={p.id} value={pName}>
                        {pName} ({mult}x Multiplier)
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {assignDept && (
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                  <span className="text-xs font-extrabold text-slate-900">
                    Employees in {assignDept} ({deptEmployees.length} Found)
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleSelectAllDept}
                    className="text-xs font-bold text-amber-700 hover:text-amber-900 transition cursor-pointer"
                  >
                    {assignEmpIds.length === deptEmployees.length ? "Deselect All" : `Select All (${deptEmployees.length})`}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {deptEmployees.map(emp => {
                    const name = `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.employeeName || emp.email;
                    const code = emp.employeeCode || emp.empCode || emp.employeeId || "";
                    const isSelected = assignEmpIds.includes(emp.id);

                    return (
                      <div
                        key={emp.id}
                        onClick={() => handleToggleEmp(emp.id)}
                        className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? "bg-amber-50/90 border-amber-400 text-amber-900"
                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <div className="truncate">
                          <p className="text-xs font-extrabold truncate">{name}</p>
                          <p className="text-[10px] text-slate-500 font-semibold">{code} • {emp.designation || "Staff"}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={assignLoading || assignEmpIds.length === 0}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md shadow-amber-500/20 transition cursor-pointer"
              >
                {assignLoading ? "Mapping Policy..." : `Confirm Policy Mapping for ${assignEmpIds.length} Employees`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== TAB 3: OVERTIME REQUESTS & APPROVALS ==================== */}
      {activeTab === "requests" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">📝 Overtime Attendance Records & Approval Ledger</h3>
              <p className="text-xs text-slate-500 mt-0.5">Dual-authorization approval workflow for overtime compensation.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Shift Timings</th>
                  <th className="py-3 px-4 text-center">OT Hours</th>
                  <th className="py-3 px-4 text-center">Multiplier</th>
                  <th className="py-3 px-4 text-right">Est. Payout</th>
                  <th className="py-3 px-4 text-center">Manager Approval</th>
                  <th className="py-3 px-4 text-center">HR Desk</th>
                  <th className="py-3 px-4 text-center">Payroll Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {overtimeLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-extrabold text-slate-900">{log.employeeName}</span>
                        <p className="text-[10px] text-slate-500">{log.empId}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{log.date}</td>
                    <td className="py-3.5 px-4 text-slate-600">{log.shift}</td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-blue-700">
                      {log.otHours} hrs
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                        {log.multiplier}x
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-700">
                      ₹{log.estimatedPay.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ✓ {log.managerStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        log.hrStatus === "Approved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {log.hrStatus === "Approved" ? "✓ Approved" : "⏳ Pending"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {log.payrollStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OvertimeMaster;
