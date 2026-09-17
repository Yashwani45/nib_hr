import React, { useState, useMemo } from "react";
import {
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  TableCellsIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";
import { apiFetch } from "../../services/hrApi";
import { useAuth } from "../../auth/AuthProvider";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MonthlyAttendance = ({ records = [], dbData = {}, onRefreshData }) => {
  const { user } = useAuth();
  const employees = dbData["employees"] || dbData["employee_profile"] || [];

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth()); // 0-indexed
  const [selectedEmp, setSelectedEmp] = useState("ALL");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("calendar"); // "calendar" | "table"
  const [activeDayDetail, setActiveDayDetail] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    checkIn: "",
    checkOut: "",
    status: "Present",
    overtime: "0",
    remarks: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  // Departments list for dropdown
  const departments = useMemo(() => {
    const set = new Set();
    employees.forEach(e => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set).sort();
  }, [employees]);

  // Filter records for the selected month and year
  const monthFilteredRecords = useMemo(() => {
    return records.filter(r => {
      if (!r.date) return false;
      const d = new Date(r.date);
      if (isNaN(d.getTime())) return false;
      const isSameMonth = d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      if (!isSameMonth) return false;

      if (selectedEmp !== "ALL") {
        const empCode = String(r.empId || r.employeeId || "").toLowerCase();
        if (empCode !== selectedEmp.toLowerCase()) return false;
      }

      if (selectedDept !== "ALL") {
        const rDept = String(r.department || "").toLowerCase();
        if (rDept !== selectedDept.toLowerCase()) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = String(r.name || "").toLowerCase().includes(q);
        const codeMatch = String(r.empId || r.employeeId || "").toLowerCase().includes(q);
        if (!nameMatch && !codeMatch) return false;
      }

      return true;
    });
  }, [records, selectedYear, selectedMonth, selectedEmp, selectedDept, searchQuery]);

  // Days in selected month
  const totalDaysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay();

  // Metrics
  const metrics = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let halfDay = 0;
    let overtimeHrs = 0;

    monthFilteredRecords.forEach(r => {
      const status = String(r.status || "").toLowerCase();
      if (status.includes("present")) present++;
      else if (status.includes("absent")) absent++;
      else if (status.includes("half")) halfDay++;
      else if (status.includes("late")) late++;

      if (r.lateComing && Number(r.lateComing) > 0) late++;
      if (r.overtime) overtimeHrs += Number(r.overtime) || 0;
      if (r.overtimeHours) overtimeHrs += Number(r.overtimeHours) || 0;
    });

    const totalDays = monthFilteredRecords.length || 1;
    const rate = ((present / totalDays) * 100).toFixed(1);

    return {
      totalRecords: monthFilteredRecords.length,
      present,
      absent,
      late,
      halfDay,
      overtimeHrs: overtimeHrs.toFixed(1),
      rate
    };
  }, [monthFilteredRecords]);

  // Group records by day of month: day (1..31) -> array of records
  const dayRecordsMap = useMemo(() => {
    const map = {};
    for (let day = 1; day <= totalDaysInMonth; day++) {
      map[day] = [];
    }
    monthFilteredRecords.forEach(r => {
      const d = new Date(r.date);
      const dayNum = d.getDate();
      if (map[dayNum]) {
        map[dayNum].push(r);
      }
    });
    return map;
  }, [monthFilteredRecords, totalDaysInMonth]);

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  // Quick edit modal
  const handleOpenEdit = (record) => {
    setEditingRecord(record);
    setEditForm({
      checkIn: record.checkIn || "09:00:00",
      checkOut: record.checkOut || "18:00:00",
      status: record.status || "Present",
      overtime: String(record.overtime || record.overtimeHours || 0),
      remarks: record.remarks || ""
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingRecord) return;
    setIsSaving(true);
    try {
      let workingHours = 8.0;
      if (editForm.checkIn && editForm.checkOut && editForm.checkOut !== "--") {
        const [ciH, ciM] = editForm.checkIn.split(":").map(Number);
        const [coH, coM] = editForm.checkOut.split(":").map(Number);
        const diffHrs = (coH + (coM || 0)/60) - (ciH + (ciM || 0)/60);
        workingHours = Math.max(0, diffHrs - 1.0);
      }

      await apiFetch(`/api/table/daily_attendance/${editingRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkIn: editForm.checkIn,
          checkOut: editForm.checkOut,
          status: editForm.status,
          workingHours: Number(workingHours.toFixed(2)),
          overtime: Number(editForm.overtime) || 0,
          remarks: editForm.remarks
        })
      });

      setEditingRecord(null);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error("Failed to update attendance:", err);
      alert("Failed to update record: " + (err.message || "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ["Date", "Employee Code", "Employee Name", "Department", "Check In", "Check Out", "Hours", "Overtime", "Status", "Remarks"];
    const rows = monthFilteredRecords.map(r => [
      r.date || "",
      r.empId || r.employeeId || "",
      `"${r.name || ""}"`,
      `"${r.department || ""}"`,
      r.checkIn || "--",
      r.checkOut || "--",
      r.workingHours || "0",
      r.overtime || r.overtimeHours || "0",
      r.status || "Present",
      `"${r.remarks || ""}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Monthly_Attendance_${MONTH_NAMES[selectedMonth]}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <CalendarDaysIcon className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                Monthly Attendance Summary & Calendar
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Live attendance logs, shift records, and overtime tracking for {MONTH_NAMES[selectedMonth]} {selectedYear}
            </p>
          </div>

          {/* Controls: Month Navigation, Filters, and View Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month Nav Buttons */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs font-bold text-slate-800 min-w-[120px] text-center">
                {MONTH_NAMES[selectedMonth]} {selectedYear}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition cursor-pointer"
                title="Next Month"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Employee Filter */}
            <select
              value={selectedEmp}
              onChange={(e) => setSelectedEmp(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Employees</option>
              {employees.map(emp => {
                const code = emp.employeeCode || emp.emp_code || emp.id;
                const name = `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.employeeName || code;
                return (
                  <option key={emp.id} value={code}>
                    {code} - {name}
                  </option>
                );
              })}
            </select>

            {/* Department Filter */}
            {departments.length > 0 && (
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            )}

            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode("calendar")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === "calendar" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                Calendar
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === "table" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <TableCellsIcon className="w-3.5 h-3.5" />
                Table
              </button>
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <ArrowDownTrayIcon className="w-3.5 h-3.5" />
              Export CSV
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => onRefreshData && onRefreshData()}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition cursor-pointer"
              title="Refresh Data"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Search */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by employee name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Monthly Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Days in Month</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <CalendarDaysIcon className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-slate-800 mt-2">{totalDaysInMonth}</p>
          <span className="text-[10px] text-slate-500 font-medium">Calendar days</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Present</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircleIcon className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">{metrics.present}</p>
          <span className="text-[10px] text-emerald-600 font-medium">{metrics.rate}% attendance rate</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Absent</span>
            <span className="p-1.5 bg-red-50 text-red-600 rounded-lg">
              <XCircleIcon className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-red-600 mt-2">{metrics.absent}</p>
          <span className="text-[10px] text-red-500 font-medium">Missed shifts</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Late Arrivals</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <ClockIcon className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-2">{metrics.late}</p>
          <span className="text-[10px] text-amber-600 font-medium">After grace period</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Half Day</span>
            <span className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
              <ExclamationTriangleIcon className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-orange-600 mt-2">{metrics.halfDay}</p>
          <span className="text-[10px] text-orange-600 font-medium">&lt; 4.5 working hours</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Overtime</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <ClockIcon className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-indigo-600 mt-2">{metrics.overtimeHrs} <span className="text-xs font-bold text-slate-500">hrs</span></p>
          <span className="text-[10px] text-indigo-600 font-medium">Logged extra hours</span>
        </div>
      </div>

      {/* Main View: Calendar Grid or Detailed Table */}
      {viewMode === "calendar" ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">
              Punch Calendar Grid • {MONTH_NAMES[selectedMonth]} {selectedYear}
            </h3>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Present
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Absent
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Late
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Weekend
              </span>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {DAYS_OF_WEEK.map((day, idx) => (
              <div
                key={day}
                className={`text-center py-2 rounded-xl text-xs font-extrabold ${
                  idx === 0 || idx === 6 ? "text-slate-400 bg-slate-50" : "text-slate-700 bg-slate-100/70"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty prefix cells for days before day 1 */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="min-h-[90px] rounded-xl bg-slate-50/50 border border-slate-100/50"></div>
            ))}

            {/* Days of the month */}
            {Array.from({ length: totalDaysInMonth }).map((_, idx) => {
              const dayNumber = idx + 1;
              const dateObj = new Date(selectedYear, selectedMonth, dayNumber);
              const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
              const dayPunches = dayRecordsMap[dayNumber] || [];
              const hasRecords = dayPunches.length > 0;

              // Aggregate day status
              let dayBadgeColor = "bg-slate-50 text-slate-400 border-slate-200";
              let dayStatusLabel = isWeekend ? "Weekend" : "No Punch";

              if (hasRecords) {
                const anyPresent = dayPunches.some(p => String(p.status).toLowerCase().includes("present"));
                const anyLate = dayPunches.some(p => String(p.status).toLowerCase().includes("late") || (p.lateComing && p.lateComing > 0));
                const anyAbsent = dayPunches.some(p => String(p.status).toLowerCase().includes("absent"));

                if (anyLate) {
                  dayBadgeColor = "bg-amber-50 text-amber-700 border-amber-200";
                  dayStatusLabel = "Late";
                } else if (anyPresent) {
                  dayBadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  dayStatusLabel = "Present";
                } else if (anyAbsent) {
                  dayBadgeColor = "bg-red-50 text-red-700 border-red-200";
                  dayStatusLabel = "Absent";
                }
              }

              return (
                <div
                  key={`day-${dayNumber}`}
                  onClick={() => hasRecords && setActiveDayDetail({ dayNumber, punches: dayPunches })}
                  className={`min-h-[100px] p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                    hasRecords
                      ? "cursor-pointer hover:shadow-md hover:border-blue-300 bg-white"
                      : isWeekend
                      ? "bg-slate-50/60 border-slate-100"
                      : "bg-white border-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isWeekend ? "text-slate-400" : "text-slate-800"}`}>
                      {dayNumber}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${dayBadgeColor}`}>
                      {dayStatusLabel}
                    </span>
                  </div>

                  {hasRecords ? (
                    <div className="mt-2 space-y-1">
                      {dayPunches.slice(0, 2).map((p, pIdx) => (
                        <div key={p.id || pIdx} className="text-[10px] text-slate-600 bg-slate-50 rounded px-1.5 py-0.5 flex items-center justify-between">
                          <span className="font-semibold truncate max-w-[65px]">
                            {p.checkIn ? p.checkIn.slice(0, 5) : "--"}
                          </span>
                          <span className="text-slate-400">→</span>
                          <span className="font-semibold truncate max-w-[65px]">
                            {p.checkOut ? p.checkOut.slice(0, 5) : "--"}
                          </span>
                        </div>
                      ))}
                      {dayPunches.length > 2 && (
                        <p className="text-[9px] text-blue-600 font-bold text-center">
                          +{dayPunches.length - 2} more punches
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-300 text-center py-2">
                      {isWeekend ? "Off Day" : "--"}
                    </div>
                  )}

                  {hasRecords && (
                    <div className="text-[9px] text-slate-400 font-medium mt-1">
                      {dayPunches.length} punch log{dayPunches.length > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Detailed Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              Detailed Monthly Attendance Register ({monthFilteredRecords.length} records)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Check In</th>
                  <th className="px-4 py-3">Check Out</th>
                  <th className="px-4 py-3">Working Hours</th>
                  <th className="px-4 py-3">Overtime</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Remarks</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {monthFilteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                      No attendance records found for {MONTH_NAMES[selectedMonth]} {selectedYear}.
                    </td>
                  </tr>
                ) : (
                  monthFilteredRecords.map(rec => {
                    const status = String(rec.status || "Present");
                    const isPres = status.toLowerCase().includes("present");
                    const isAbs = status.toLowerCase().includes("absent");
                    const isLt = status.toLowerCase().includes("late");

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                          {rec.date || "--"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-bold text-slate-800">{rec.name || "Employee"}</div>
                          <div className="text-[10px] text-slate-400">{rec.empId || rec.employeeId || "--"}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{rec.department || "General"}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-800">{rec.checkIn || "--"}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-800">{rec.checkOut || "--"}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-bold text-slate-800">{rec.workingHours || "8.0"}</span> hrs
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-indigo-600 font-bold">
                          {rec.overtime || rec.overtimeHours || "0"} hrs
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isPres ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : isAbs ? "bg-red-50 text-red-700 border-red-200"
                            : isLt ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-[150px] truncate text-slate-500">
                          {rec.remarks || "--"}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEdit(rec)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition cursor-pointer"
                            title="Edit Attendance"
                          >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                          </button>
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

      {/* Day Punches Detail Modal */}
      {activeDayDetail && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <CalendarDaysIcon className="w-5 h-5" />
                </span>
                <h3 className="text-base font-bold text-slate-800">
                  Punch Records for {MONTH_NAMES[selectedMonth]} {activeDayDetail.dayNumber}, {selectedYear}
                </h3>
              </div>
              <button
                onClick={() => setActiveDayDetail(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {activeDayDetail.punches.map(punch => (
                <div
                  key={punch.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between hover:bg-slate-50 transition"
                >
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{punch.name || "Employee"}</div>
                    <div className="text-xs text-slate-400 font-medium">
                      Code: {punch.empId || punch.employeeId} • Dept: {punch.department || "General"}
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs font-mono text-slate-700">
                      <span>In: <b className="text-emerald-600">{punch.checkIn || "--"}</b></span>
                      <span>Out: <b className="text-blue-600">{punch.checkOut || "--"}</b></span>
                      <span>Hours: <b>{punch.workingHours || "8.0"}h</b></span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {punch.status || "Present"}
                    </span>
                    <button
                      onClick={() => {
                        setActiveDayDetail(null);
                        handleOpenEdit(punch);
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <PencilSquareIcon className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveDayDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Attendance Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <PencilSquareIcon className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Edit Attendance Record</h3>
                  <p className="text-xs text-slate-400">
                    {editingRecord.name} ({editingRecord.date})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Check In Time</label>
                  <input
                    type="time"
                    step="1"
                    value={editForm.checkIn}
                    onChange={(e) => setEditForm(prev => ({ ...prev, checkIn: e.target.value }))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Check Out Time</label>
                  <input
                    type="time"
                    step="1"
                    value={editForm.checkOut}
                    onChange={(e) => setEditForm(prev => ({ ...prev, checkOut: e.target.value }))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                    <option value="Half Day">Half Day</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Holiday">Holiday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Overtime (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={editForm.overtime}
                    onChange={(e) => setEditForm(prev => ({ ...prev, overtime: e.target.value }))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
                <textarea
                  rows={2}
                  value={editForm.remarks}
                  onChange={(e) => setEditForm(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Reason or notes for manual adjustment..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyAttendance;
