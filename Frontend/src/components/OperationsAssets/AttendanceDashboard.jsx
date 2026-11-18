import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  QrCodeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  InformationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserCircleIcon,
  XMarkIcon,
  BuildingOffice2Icon
} from "@heroicons/react/24/outline";
import { apiFetch } from "../../services/hrApi";
import EmployeeQrScannerModal from "../Attendance/EmployeeQrScannerModal";

const AttendanceDashboard = ({ dbData = {}, onRefreshData }) => {
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Filter States
  const [filterCompany, setFilterCompany] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  // Live roster data from backend for selectedDate
  const [liveRoster, setLiveRoster] = useState([]);
  const [isRosterLoading, setIsRosterLoading] = useState(false);
  const [loadingEmpId, setLoadingEmpId] = useState(null);

  // Notification Toast State
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }

  // Details Modal State
  const [detailModalItem, setDetailModalItem] = useState(null);

  // QR Scanner Modal State
  const [showQrModal, setShowQrModal] = useState(false);

  const showNotification = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  // Fetch Live Attendance Roster from Backend for Selected Date
  const fetchRoster = useCallback(async (date) => {
    setIsRosterLoading(true);
    try {
      const res = await apiFetch(`/api/operations/attendance/roster?date=${date}`);
      if (res && res.success && Array.isArray(res.data)) {
        setLiveRoster(res.data);
      }
    } catch (err) {
      console.warn("[AttendanceDashboard] Failed to fetch live roster:", err.message);
    } finally {
      setIsRosterLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoster(selectedDate);
  }, [selectedDate, fetchRoster]);

  // Merge dbData employees with live roster to ensure all employees are visible
  const rawEmployees = useMemo(() => {
    const list = dbData["employees"] || dbData["employee_profile"] || dbData["Employee Profile"] || dbData["Employee"] || [];
    return Array.isArray(list) ? list : [];
  }, [dbData]);

  const rawAttendanceLogs = useMemo(() => {
    const logs = dbData["Daily Attendance"] || dbData["daily_attendance"] || [];
    return Array.isArray(logs) ? logs : [];
  }, [dbData]);

  // Combined Roster Items
  const mergedRoster = useMemo(() => {
    if (liveRoster && liveRoster.length > 0) {
      return liveRoster.map(item => {
        const inTime = item.checkInTime || item.checkIn || item.check_in_time || (item.punch ? item.punch.checkIn : null);
        const outTime = item.checkOutTime || item.checkOut || item.check_out_time || (item.punch ? item.punch.checkOut : null);
        const isCheckedIn = Boolean(inTime && inTime !== "--");
        const isCheckedOut = Boolean(outTime && outTime !== "--");

        return {
          id: item.id || item.employeeId,
          code: item.employeeCode || item.empCode || item.code || item.id,
          name: item.employeeName || item.name || "Employee",
          company: item.company || "NIB Technologies Pvt Ltd",
          branch: item.branch || item.branchName || (localStorage.getItem("selected_branch_name") !== "All Branches" ? localStorage.getItem("selected_branch_name") : "") || "Branch",
          department: item.department || "Operations",
          attendanceDate: selectedDate,
          checkIn: isCheckedIn ? inTime : "--",
          checkOut: isCheckedOut ? outTime : "--",
          checkInMethod: item.checkInMethod || item.check_in_method || item.method || "WEB",
          checkOutMethod: item.checkOutMethod || item.check_out_method || (isCheckedOut ? "WEB" : "--"),
          workingHours: item.workingHours || (item.totalWorkingMinutes ? (item.totalWorkingMinutes / 60).toFixed(2) : "--"),
          totalWorkingMinutes: item.totalWorkingMinutes || item.total_working_minutes || 0,
          lateMinutes: item.lateMinutes || item.late_minutes || 0,
          status: item.status || (isCheckedIn ? (isCheckedOut ? "Present" : "Checked In") : "Absent"),
          isCheckedIn,
          isCheckedOut,
          deviceInfo: item.device_info || item.deviceInfo || "Web Console",
          ipAddress: item.ip_address || item.ipAddress || "Local",
          remarks: item.remarks || ""
        };
      });
    }

    return rawEmployees.map(emp => {
      const empCode = emp.employeeCode || emp.emp_code || emp.id;
      const punch = rawAttendanceLogs.find(a => 
        (a.date === selectedDate || a.attendance_date === selectedDate) &&
        (String(a.empId || a.emp_id || a.employeeId).toLowerCase() === String(empCode).toLowerCase() ||
         String(a.empId || a.emp_id || a.employeeId).toLowerCase() === String(emp.id).toLowerCase())
      );

      const inTime = punch ? (punch.checkIn || punch.check_in || punch.check_in_time) : null;
      const outTime = punch ? (punch.checkOut || punch.check_out || punch.check_out_time) : null;
      const isCheckedIn = Boolean(inTime && inTime !== "--");
      const isCheckedOut = Boolean(outTime && outTime !== "--");

      return {
        id: emp.id,
        code: empCode,
        name: `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.employeeName || "Employee",
        company: emp.company || "NIB Technologies Pvt Ltd",
        branch: emp.branch || emp.branchName || (localStorage.getItem("selected_branch_name") !== "All Branches" ? localStorage.getItem("selected_branch_name") : "") || "Branch",
        department: emp.department || "Operations",
        attendanceDate: selectedDate,
        checkIn: isCheckedIn ? inTime : "--",
        checkOut: isCheckedOut ? outTime : "--",
        checkInMethod: punch?.check_in_method || punch?.method || "WEB",
        checkOutMethod: punch?.check_out_method || (isCheckedOut ? "WEB" : "--"),
        workingHours: punch?.workingHours || punch?.working_hours || (punch?.total_working_minutes ? (punch.total_working_minutes / 60).toFixed(2) : "--"),
        totalWorkingMinutes: punch?.total_working_minutes || 0,
        lateMinutes: punch?.late_minutes || 0,
        status: punch?.status || punch?.attendance_status || (isCheckedIn ? (isCheckedOut ? "Present" : "Checked In") : "Absent"),
        isCheckedIn,
        isCheckedOut,
        deviceInfo: punch?.device_info || "Web Console",
        ipAddress: punch?.ip_address || "Local",
        remarks: punch?.remarks || ""
      };
    });
  }, [liveRoster, rawEmployees, rawAttendanceLogs, selectedDate]);

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return mergedRoster.filter(item => {
      if (filterCompany && item.company !== filterCompany) return false;
      if (filterBranch && item.branch !== filterBranch) return false;
      if (filterDept && item.department !== filterDept) return false;

      if (filterStatus) {
        if (filterStatus === "Checked In" && (!item.isCheckedIn || item.isCheckedOut)) return false;
        if (filterStatus === "Completed" && (!item.isCheckedIn || !item.isCheckedOut)) return false;
        if (filterStatus === "Absent" && item.isCheckedIn) return false;
        if (filterStatus === "Late" && !item.status.toLowerCase().includes("late")) return false;
        if (filterStatus === "Present" && item.status !== "Present" && item.status !== "Completed") return false;
      }

      if (filterSearch) {
        const query = filterSearch.toLowerCase().trim();
        return (
          item.name.toLowerCase().includes(query) ||
          String(item.code).toLowerCase().includes(query) ||
          item.department.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [mergedRoster, filterCompany, filterBranch, filterDept, filterStatus, filterSearch]);

  // Statistics
  const stats = useMemo(() => {
    let total = mergedRoster.length;
    let present = 0;
    let absent = 0;
    let activeCheckedIn = 0;
    let completed = 0;
    let late = 0;

    mergedRoster.forEach(emp => {
      if (emp.isCheckedIn && emp.isCheckedOut) {
        completed++;
        present++;
      } else if (emp.isCheckedIn && !emp.isCheckedOut) {
        activeCheckedIn++;
        present++;
      } else {
        absent++;
      }
      if (String(emp.status).toLowerCase().includes("late") || Number(emp.lateMinutes) > 0) {
        late++;
      }
    });

    return { total, present, absent, activeCheckedIn, completed, late };
  }, [mergedRoster]);

  // Unique Lists for Dropdown Filters
  const uniqueCompanies = useMemo(() => [...new Set(mergedRoster.map(e => e.company).filter(Boolean))], [mergedRoster]);
  const uniqueBranches = useMemo(() => [...new Set(mergedRoster.map(e => e.branch).filter(Boolean))], [mergedRoster]);
  const uniqueDepts = useMemo(() => [...new Set(mergedRoster.map(e => e.department).filter(Boolean))], [mergedRoster]);

  // Handle Independent Employee Check-In
  const handleCheckIn = async (employee) => {
    setLoadingEmpId(employee.id);
    try {
      const res = await apiFetch("/api/operations/attendance/check-in", {
        method: "POST",
        body: JSON.stringify({
          employeeId: employee.code || employee.id,
          date: selectedDate,
          method: "WEB"
        })
      });

      const punchData = res.data || res;
      const recordedTime = punchData.checkInTime || punchData.checkIn || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      showNotification("success", `✓ Check-In recorded for ${employee.name} (${employee.code}) at ${recordedTime}`);

      setLiveRoster(prev => {
        if (!prev || prev.length === 0) return prev;
        return prev.map(item => {
          const match = String(item.code || item.employeeCode || item.id).toLowerCase() === String(employee.code || employee.id).toLowerCase();
          if (!match) return item;
          return {
            ...item,
            isCheckedIn: true,
            isCheckedOut: false,
            checkIn: recordedTime,
            checkInTime: recordedTime,
            checkInMethod: "WEB",
            status: "Checked In"
          };
        });
      });

      fetchRoster(selectedDate);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      showNotification("error", `Check-In Failed: ${err.message}`);
    } finally {
      setLoadingEmpId(null);
    }
  };

  // Handle Independent Employee Check-Out
  const handleCheckOut = async (employee) => {
    setLoadingEmpId(employee.id);
    try {
      const res = await apiFetch("/api/operations/attendance/check-out", {
        method: "POST",
        body: JSON.stringify({
          employeeId: employee.code || employee.id,
          date: selectedDate,
          method: "WEB"
        })
      });

      const punchData = res.data || res;
      const recordedTime = punchData.checkOutTime || punchData.checkOut || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const durationHours = punchData.workingHours || (punchData.totalWorkingMinutes ? (punchData.totalWorkingMinutes / 60).toFixed(2) : "0.00");

      showNotification("success", `✓ Check-Out recorded for ${employee.name} (${employee.code}) at ${recordedTime}. Total: ${durationHours} hrs`);

      setLiveRoster(prev => {
        if (!prev || prev.length === 0) return prev;
        return prev.map(item => {
          const match = String(item.code || item.employeeCode || item.id).toLowerCase() === String(employee.code || employee.id).toLowerCase();
          if (!match) return item;
          return {
            ...item,
            isCheckedOut: true,
            checkOut: recordedTime,
            checkOutTime: recordedTime,
            checkOutMethod: "WEB",
            workingHours: durationHours,
            status: "Present"
          };
        });
      });

      fetchRoster(selectedDate);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      showNotification("error", `Check-Out Failed: ${err.message}`);
    } finally {
      setLoadingEmpId(null);
    }
  };

  // Date Shift Helpers
  const shiftDate = (days) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + days);
    setSelectedDate(cur.toISOString().split("T")[0]);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Alert */}
      {toast && (
        <div 
          className={`flex items-center justify-between p-4 rounded-xl border shadow-md transition-all ${
            toast.type === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-3">
            {toast.type === "success" ? (
              <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span className="text-xs font-bold">{toast.message}</span>
          </div>
          <button 
            onClick={() => setToast(null)} 
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Fast Action Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <span>👥 Multi-Employee Attendance Management</span>
            {isRosterLoading && (
              <ArrowPathIcon className="w-4 h-4 text-blue-500 animate-spin" />
            )}
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Maintain independent, transaction-safe check-in and check-out records for every employee.
          </p>
        </div>

        {/* Date Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker with Prev/Next shortcuts */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-inner">
            <button 
              onClick={() => shiftDate(-1)} 
              title="Previous Day"
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition hover:shadow-xs cursor-pointer"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <input 
              type="date" 
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-xs font-black text-slate-800 px-2 py-1 focus:outline-none"
            />
            <button 
              onClick={() => setSelectedDate(todayStr)} 
              className={`px-2 py-1 text-[10px] font-extrabold rounded-md transition cursor-pointer ${
                selectedDate === todayStr 
                  ? "bg-blue-600 text-white" 
                  : "text-slate-500 hover:bg-white"
              }`}
            >
              Today
            </button>
            <button 
              onClick={() => shiftDate(1)} 
              title="Next Day"
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition hover:shadow-xs cursor-pointer"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Launch QR Kiosk / Scanner Modal Button */}
          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer"
          >
            <QrCodeIcon className="w-4 h-4" />
            <span>Launch QR Scanner</span>
          </button>
        </div>
      </div>

      {/* Metrics Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-extrabold">Total Headcount</span>
          <span className="text-2xl text-slate-800 font-black mt-2">{stats.total}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-extrabold">Present / Punched</span>
          <span className="text-2xl text-emerald-600 font-black mt-2">{stats.present}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-extrabold">Currently Active</span>
          <span className="text-2xl text-blue-500 font-black mt-2">{stats.activeCheckedIn}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-extrabold">Completed Shift</span>
          <span className="text-2xl text-teal-600 font-black mt-2">{stats.completed}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-extrabold">Absent</span>
          <span className="text-2xl text-red-500 font-black mt-2">{stats.absent}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-extrabold">Late Arrivals</span>
          <span className="text-2xl text-amber-500 font-black mt-2">{stats.late}</span>
        </div>
      </div>

      {/* Roster & Filtering Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <h4 className="font-black text-sm text-slate-800">
              📋 Employee Attendance Roster
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-600">
              {filteredRoster.length} Employees
            </span>
          </div>

          {/* Search box */}
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Search by code, name, department..." 
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <select 
            value={filterCompany} 
            onChange={e => setFilterCompany(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All Companies</option>
            {uniqueCompanies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select 
            value={filterBranch} 
            onChange={e => setFilterBranch(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All Branches</option>
            {uniqueBranches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          <select 
            value={filterDept} 
            onChange={e => setFilterDept(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All Departments</option>
            {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All Attendance Statuses</option>
            <option value="Checked In">Checked In (Active)</option>
            <option value="Completed">Completed (Checked Out)</option>
            <option value="Present">Present</option>
            <option value="Late">Late Arrival</option>
            <option value="Absent">Absent (Not Checked In)</option>
          </select>
        </div>

        {/* Multi-Employee Attendance Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs font-bold text-slate-600">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[9px] tracking-wider">
                <th className="py-3 px-4">Employee ID</th>
                <th className="px-4">Employee Name</th>
                <th className="px-4">Attendance Date</th>
                <th className="px-4">Check-In</th>
                <th className="px-4">Check-Out</th>
                <th className="px-4">Working Hours</th>
                <th className="px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRoster.map(item => {
                const isLoadingThis = loadingEmpId === item.id;
                
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono text-slate-800 font-extrabold">
                      <span className="px-2 py-1 rounded bg-slate-100 text-slate-700">
                        {item.code}
                      </span>
                    </td>

                    <td className="px-4">
                      <div>
                        <span className="text-slate-900 font-black block">{item.name}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{item.department}</span>
                      </div>
                    </td>

                    <td className="px-4 text-slate-700 font-semibold">
                      {item.attendanceDate}
                    </td>

                    <td className="px-4">
                      {item.checkIn && item.checkIn !== "--" ? (
                        <div className="flex items-center gap-1.5 text-emerald-700">
                          <ClockIcon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="font-extrabold">{item.checkIn}</span>
                          <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-50 border border-emerald-200 uppercase font-black">
                            {item.checkInMethod}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium">--</span>
                      )}
                    </td>

                    <td className="px-4">
                      {item.checkOut && item.checkOut !== "--" ? (
                        <div className="flex items-center gap-1.5 text-blue-700">
                          <ClockIcon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="font-extrabold">{item.checkOut}</span>
                          <span className="text-[8px] px-1 py-0.5 rounded bg-blue-50 border border-blue-200 uppercase font-black">
                            {item.checkOutMethod}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium">--</span>
                      )}
                    </td>

                    <td className="px-4 font-mono font-black text-slate-800">
                      {item.workingHours && item.workingHours !== "--" ? (
                        <span>{item.workingHours} hrs</span>
                      ) : (
                        <span className="text-slate-400 font-normal">--</span>
                      )}
                    </td>

                    <td className="px-4">
                      {item.isCheckedIn && item.isCheckedOut ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-teal-50 text-teal-700 border border-teal-200">
                          Completed
                        </span>
                      ) : item.isCheckedIn ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200">
                          Checked In
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-red-50 text-red-700 border border-red-200">
                          Absent
                        </span>
                      )}
                      {String(item.status).toLowerCase().includes("late") && (
                        <span className="ml-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                          Late
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {!item.isCheckedIn ? (
                          <button
                            onClick={() => handleCheckIn(item)}
                            disabled={isLoadingThis}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                          >
                            {isLoadingThis ? (
                              <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <span>🟢 Check-In</span>
                            )}
                          </button>
                        ) : !item.isCheckedOut ? (
                          <button
                            onClick={() => handleCheckOut(item)}
                            disabled={isLoadingThis}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                          >
                            {isLoadingThis ? (
                              <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <span>🔴 Check-Out</span>
                            )}
                          </button>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-black text-teal-700 bg-teal-50 border border-teal-200 px-2 py-1 rounded-md">
                              ✓ Completed
                            </span>
                            <button
                              onClick={() => setDetailModalItem(item)}
                              title="View Attendance Details"
                              className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                            >
                              Details
                            </button>
                          </div>
                        )}

                        {item.isCheckedIn && !item.isCheckedOut && (
                          <button
                            onClick={() => setDetailModalItem(item)}
                            title="View Session Details"
                            className="p-1 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer"
                          >
                            <InformationCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRoster.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 font-bold">
                    No employee attendance records found matching filters for {selectedDate}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserCircleIcon className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-sm text-slate-800">
                  Attendance Details & Audit Info
                </h3>
              </div>
              <button 
                onClick={() => setDetailModalItem(null)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold">Employee:</span>
                <span className="font-black text-slate-800">{detailModalItem.name} ({detailModalItem.code})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold">Department / Branch:</span>
                <span className="font-extrabold text-slate-700">{detailModalItem.department} • {detailModalItem.branch}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold">Attendance Date:</span>
                <span className="font-mono font-bold text-slate-700">{detailModalItem.attendanceDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold">Check-In Time:</span>
                <span className="font-black text-emerald-700">
                  {detailModalItem.checkIn} ({detailModalItem.checkInMethod})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold">Check-Out Time:</span>
                <span className="font-black text-blue-700">
                  {detailModalItem.checkOut} ({detailModalItem.checkOutMethod})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold">Total Working Hours:</span>
                <span className="font-black text-slate-800">
                  {detailModalItem.workingHours} hrs ({detailModalItem.totalWorkingMinutes || 0} mins)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold">Late Arrival:</span>
                <span className={`font-black ${detailModalItem.lateMinutes > 0 ? "text-amber-600" : "text-slate-600"}`}>
                  {detailModalItem.lateMinutes || 0} minutes
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold">Device / Source:</span>
                <span className="font-mono text-slate-500">{detailModalItem.deviceInfo} ({detailModalItem.ipAddress})</span>
              </div>
              {detailModalItem.remarks && (
                <div className="pt-1">
                  <span className="text-slate-400 font-bold block mb-1">Remarks:</span>
                  <p className="bg-slate-50 p-2 rounded-lg text-slate-600 text-[11px] font-semibold border border-slate-100">
                    {detailModalItem.remarks}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setDetailModalItem(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal (Matching user image) */}
      {showQrModal && (
        <EmployeeQrScannerModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          onSuccess={() => {
            fetchRoster(selectedDate);
            if (onRefreshData) onRefreshData();
          }}
        />
      )}
    </div>
  );
};

export default AttendanceDashboard;
