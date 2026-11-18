import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  QrCodeIcon,
  CameraIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
  BuildingOffice2Icon,
  PrinterIcon,
  Squares2X2Icon,
  TableCellsIcon,
  ArrowDownTrayIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { apiFetch } from "../../services/hrApi";
import { useAuth } from "../../auth/AuthProvider";
import EmployeeQrScannerModal from "./EmployeeQrScannerModal";
import EmployeeQrCardModal from "./EmployeeQrCardModal";
import AdminEmployeeQrScannerPage from "../../pages/AdminEmployeeQrScannerPage";

export default function QrAttendanceAdminSection({ dbData = {}, onRefreshData }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("subtab") === "scanner" || params.get("mode") === "scanner") {
        return "scanner";
      }
    } catch (e) {}
    return "directory";
  });
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [selectedEmployeeForQr, setSelectedEmployeeForQr] = useState(null);
  const [zoomedQrEmployee, setZoomedQrEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("table"); // "table" | "grid"
  const [employeeQrs, setEmployeeQrs] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_employee_qrs");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    const fromProps = dbData["Employee Profile"] || dbData["Employee List"] || dbData["employees"] || [];
    if (Array.isArray(fromProps) && fromProps.length > 0) {
      return fromProps.map((emp) => {
        const empCode = emp.employeeCode || emp.emp_code || emp.employeeId || emp.id;
        return {
          id: emp.id,
          employeeId: emp.id,
          employeeCode: empCode,
          fullName: `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.employee_name || emp.name || "Employee",
          department: emp.department || "Operations",
          designation: emp.designation || "Staff Professional",
          companyCode: emp.company || "Technovani",
          photo: emp.photo || "",
          qrDataUrl: emp.qr_code_data_url || emp.qrDataUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(empCode)}`,
          status: "ACTIVE"
        };
      });
    }
    return [];
  });

  const [attendanceLogs, setAttendanceLogs] = useState(() => {
    return Array.isArray(dbData["Daily Attendance"]) ? dbData["Daily Attendance"] : (Array.isArray(dbData["daily_attendance"]) ? dbData["daily_attendance"] : []);
  });

  const [loading, setLoading] = useState(false);
  const [quickPunchLoadingId, setQuickPunchLoadingId] = useState(null);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Sync state whenever parent dbData finishes loading or changes
  useEffect(() => {
    const fromProps = dbData["Employee Profile"] || dbData["Employee List"] || dbData["employees"] || [];
    if (Array.isArray(fromProps) && fromProps.length > 0) {
      setEmployeeQrs((prev) => {
        // If local state is empty, or if props has different length, sync from props
        if (!prev || prev.length === 0 || prev.length !== fromProps.length) {
          return fromProps.map((emp) => {
            const empCode = emp.employeeCode || emp.emp_code || emp.employeeId || emp.id;
            return {
              id: emp.id,
              employeeId: emp.id,
              employeeCode: empCode,
              fullName: `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.employee_name || emp.name || "Employee",
              department: emp.department || "Operations",
              designation: emp.designation || "Staff Professional",
              companyCode: emp.company || "Technovani",
              photo: emp.photo || "",
              qrDataUrl: emp.qr_code_data_url || emp.qrDataUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(empCode)}`,
              status: "ACTIVE"
            };
          });
        }
        return prev;
      });
    }

    const attList = dbData["Daily Attendance"] || dbData["daily_attendance"];
    if (Array.isArray(attList) && attList.length > 0) {
      setAttendanceLogs(attList);
    }
  }, [dbData]);

  // Fetch all employee QRs directly from backend API in parallel with zero lag
  const fetchAllEmployeeData = useCallback(async () => {
    setLoading(true);
    try {
      let activeCompany = "";
      try {
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        activeCompany = localStorage.getItem("selected_company_code") || localStorage.getItem("selected_tenant_db") || u.companyCode || u.company_code || "";
      } catch (e) {}

      const qrUrl = activeCompany
        ? `/api/operations/attendance/employee-qr/all?companyCode=${encodeURIComponent(activeCompany)}`
        : "/api/operations/attendance/employee-qr/all";

      const [qrRes, attRes] = await Promise.allSettled([
        apiFetch(qrUrl),
        apiFetch("/api/table/daily_attendance")
      ]);

      if (qrRes.status === "fulfilled" && qrRes.value?.success && Array.isArray(qrRes.value.data) && qrRes.value.data.length > 0) {
        setEmployeeQrs(qrRes.value.data);
        try {
          localStorage.setItem("cached_employee_qrs", JSON.stringify(qrRes.value.data));
        } catch (e) {}
      } else {
        // Fallback 1: check dbData props
        const fromProps = dbData["Employee Profile"] || dbData["Employee List"] || dbData["employees"] || [];
        if (Array.isArray(fromProps) && fromProps.length > 0) {
          const mapped = fromProps.map((emp) => {
            const empCode = emp.employeeCode || emp.emp_code || emp.employeeId || emp.id;
            return {
              id: emp.id,
              employeeId: emp.id,
              employeeCode: empCode,
              fullName: `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.employee_name || emp.name || "Employee",
              department: emp.department || "Operations",
              designation: emp.designation || "Staff Professional",
              companyCode: emp.company || "Technovani",
              photo: emp.photo || "",
              qrDataUrl: emp.qr_code_data_url || emp.qrDataUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(empCode)}`,
              status: "ACTIVE"
            };
          });
          setEmployeeQrs(mapped);
          try {
            localStorage.setItem("cached_employee_qrs", JSON.stringify(mapped));
          } catch (e) {}
        } else {
          // Fallback 2: query /api/table/employees
          const empRes = await apiFetch("/api/table/employees").catch(() => null);
          const rawEmps = Array.isArray(empRes?.data) ? empRes.data : (Array.isArray(empRes) ? empRes : []);
          if (rawEmps.length > 0) {
            const mapped = rawEmps.map((emp) => {
              const empCode = emp.employeeCode || emp.emp_code || emp.employeeId || emp.id;
              return {
                id: emp.id,
                employeeId: emp.id,
                employeeCode: empCode,
                fullName: `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.employee_name || emp.name || "Employee",
                department: emp.department || "Operations",
                designation: emp.designation || "Staff Professional",
                companyCode: emp.company || "Technovani",
                photo: emp.photo || "",
                qrDataUrl: emp.qr_code_data_url || emp.qrDataUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(empCode)}`,
                status: "ACTIVE"
              };
            });
            setEmployeeQrs(mapped);
            try {
              localStorage.setItem("cached_employee_qrs", JSON.stringify(mapped));
            } catch (e) {}
          }
        }
      }

      if (attRes.status === "fulfilled" && attRes.value?.success && Array.isArray(attRes.value.data)) {
        setAttendanceLogs(attRes.value.data);
      }
    } catch (err) {
      console.warn("Failed to fetch employee QR badges directly:", err);
    } finally {
      setLoading(false);
    }
  }, [dbData]);

  useEffect(() => {
    fetchAllEmployeeData();

    const handleSilentRefresh = () => {
      fetchAllEmployeeData();
    };

    window.addEventListener("silent-refresh", handleSilentRefresh);
    return () => {
      window.removeEventListener("silent-refresh", handleSilentRefresh);
    };
  }, [fetchAllEmployeeData]);

  // Combine Employee QR data with today's attendance punch status
  const employeeRoster = useMemo(() => {
    return employeeQrs.map((emp) => {
      const empCode = emp.employeeCode || emp.employeeId || emp.id;
      const empName = emp.fullName || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "Employee";

      // Match today's attendance record
      const todayPunch = attendanceLogs.find((att) => {
        const attEmpCode = att.empId || att.emp_id || att.employeeId;
        return (
          String(attEmpCode).toLowerCase().trim() === String(empCode).toLowerCase().trim() &&
          att.date === todayStr
        );
      });

      const hasCheckIn = todayPunch && todayPunch.checkIn && todayPunch.checkIn !== "--";
      const hasCheckOut = todayPunch && todayPunch.checkOut && todayPunch.checkOut !== "--";

      let status = "Not Punched In";
      if (hasCheckIn && hasCheckOut) {
        status = "Shift Completed";
      } else if (hasCheckIn && !hasCheckOut) {
        status = "Punched In";
      }

      // Always guarantee valid scannable QR badge
      const qrDataUrl = emp.qrDataUrl || emp.qr_code_data_url || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(empCode)}`;

      return {
        ...emp,
        id: emp.id || empCode,
        employeeCode: empCode,
        fullName: empName,
        department: emp.department || "Operations",
        designation: emp.designation || "Staff Professional",
        company: emp.companyCode || emp.company || user?.companyName || "Technovani",
        todayPunch,
        hasCheckIn,
        hasCheckOut,
        checkInTime: hasCheckIn ? todayPunch.checkIn : "--",
        checkOutTime: hasCheckOut ? todayPunch.checkOut : "--",
        workingHours: todayPunch ? (todayPunch.workingHours || todayPunch.working_hours || 0) : 0,
        status,
        qrDataUrl,
      };
    });
  }, [employeeQrs, attendanceLogs, todayStr, user]);

  // Unique departments for filter dropdown
  const uniqueDepartments = useMemo(() => {
    return Array.from(new Set(employeeRoster.map((e) => e.department).filter(Boolean)));
  }, [employeeRoster]);

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return employeeRoster.filter((emp) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = String(emp.fullName || "").toLowerCase().includes(q);
        const matchCode = String(emp.employeeCode || "").toLowerCase().includes(q);
        const matchDept = String(emp.department || "").toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchDept) return false;
      }

      if (deptFilter !== "ALL" && emp.department !== deptFilter) {
        return false;
      }

      if (statusFilter !== "ALL" && emp.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [employeeRoster, searchQuery, deptFilter, statusFilter]);

  // Statistics Summary
  const stats = useMemo(() => {
    let present = 0;
    let completed = 0;
    let activeInOffice = 0;
    let absent = 0;

    employeeRoster.forEach((e) => {
      if (e.status === "Shift Completed") {
        present++;
        completed++;
      } else if (e.status === "Punched In") {
        present++;
        activeInOffice++;
      } else {
        absent++;
      }
    });

    return {
      total: employeeRoster.length,
      present,
      completed,
      activeInOffice,
      absent,
    };
  }, [employeeRoster]);

  // Quick Manual Punch fallback
  const handleQuickPunch = async (emp) => {
    setQuickPunchLoadingId(emp.employeeCode);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

    try {
      if (!emp.hasCheckIn) {
        await apiFetch("/api/table/daily_attendance", {
          method: "POST",
          body: JSON.stringify({
            empId: String(emp.employeeCode),
            employeeId: emp.employeeId || emp.id,
            name: emp.fullName,
            date: todayStr,
            checkIn: timeStr,
            checkOut: "--",
            workingHours: 0,
            status: "Present",
            verification_method: "MANUAL",
            company: emp.company,
            department: emp.department,
            remarks: `Admin Quick Punch In (${user?.email || "Admin"})`
          })
        });
      } else if (emp.hasCheckIn && !emp.hasCheckOut) {
        let workingHours = 8.0;
        if (emp.todayPunch.checkIn && emp.todayPunch.checkIn !== "--") {
          const [ciH, ciM] = emp.todayPunch.checkIn.split(":").map(Number);
          const [coH, coM] = timeStr.split(":").map(Number);
          const diffHrs = (coH + coM / 60) - (ciH + ciM / 60);
          workingHours = Math.max(0, parseFloat(diffHrs.toFixed(2)));
        }

        await apiFetch(`/api/table/daily_attendance/${emp.todayPunch.id}`, {
          method: "PUT",
          body: JSON.stringify({
            ...emp.todayPunch,
            checkOut: timeStr,
            workingHours,
            remarks: `${emp.todayPunch.remarks || ""} | Admin Quick Punch Out`
          })
        });
      }

      await fetchAllEmployeeData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to record quick punch: " + err.message);
    } finally {
      setQuickPunchLoadingId(null);
    }
  };

  // Bulk Print All Badges
  const handlePrintAllBadges = () => {
    const printWindow = window.open("", "_blank", "width=900,height=800");
    if (!printWindow) return;

    const cardsHtml = filteredRoster.map((emp) => `
      <div style="width: 260px; border: 1.5px solid #0f172a; border-radius: 12px; padding: 14px; text-align: center; background: #fff; page-break-inside: avoid; margin: 8px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; box-sizing: border-box; display: inline-block; vertical-align: top;">
        <div style="background: #0f172a; color: #38bdf8; font-weight: 900; font-size: 11px; padding: 6px; border-radius: 6px; letter-spacing: 1px; text-transform: uppercase;">
          ${emp.company || "TECHNOVANI HRMS"}
        </div>
        <div style="margin-top: 10px;">
          ${emp.photo ? `<img src="${emp.photo}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #e2e8f0; margin: 0 auto;" />` : `<div style="width: 50px; height: 50px; border-radius: 50%; background: #e0e7ff; color: #4338ca; font-weight: 900; font-size: 18px; line-height: 50px; margin: 0 auto;">${(emp.fullName || "E").charAt(0)}</div>`}
        </div>
        <div style="font-weight: 800; font-size: 13px; color: #0f172a; margin-top: 6px;">${emp.fullName}</div>
        <div style="font-size: 10px; color: #4338ca; font-weight: 700; font-family: monospace; background: #eef2ff; display: inline-block; padding: 2px 8px; border-radius: 4px; margin-top: 3px;">${emp.employeeCode}</div>
        <div style="font-size: 10px; color: #64748b; font-weight: 600; margin-top: 2px;">${emp.department} • ${emp.designation}</div>
        <div style="margin-top: 10px; padding: 6px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px;">
          ${emp.qrDataUrl ? `<img src="${emp.qrDataUrl}" style="width: 140px; height: 140px; object-fit: contain; display: block; margin: 0 auto;" />` : `<div style="padding: 20px; font-size: 10px; color: #94a3b8;">QR Code Ready</div>`}
        </div>
        <div style="font-size: 8px; color: #94a3b8; margin-top: 6px; font-weight: 700; letter-spacing: 0.5px;">ADMIN SCAN ONLY • OFFICIAL ATTENDANCE BADGE</div>
      </div>
    `).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>All Employee QR Badges - Technovani HRMS</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f1f5f9; padding: 20px; margin: 0; text-align: center; }
            .print-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }
            @media print {
              body { background: #fff; padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px;">
            <button onclick="window.print()" style="padding: 10px 24px; background: #4f46e5; color: #fff; font-weight: bold; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
              🖨️ Print Badges Now
            </button>
            <span style="margin-left: 12px; font-size: 12px; color: #64748b;">Total Badges: ${filteredRoster.length}</span>
          </div>
          <div class="print-grid">
            ${cardsHtml}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 font-sans select-none">
      {/* 0. Unified Top Navigation: Mode Switcher (Directory vs Live Scanner) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("directory")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer ${
              activeTab === "directory"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <TableCellsIcon className="w-4 h-4" />
            <span>QR Code Directory</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("scanner")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer ${
              activeTab === "scanner"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-600/30"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <CameraIcon className="w-4 h-4 text-emerald-300" />
            <span>Scan Employee QR 📷</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-semibold px-2 flex items-center gap-2">
          {activeTab === "scanner" ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Admin Camera Scanner Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              <SparklesIcon className="w-3.5 h-3.5 text-indigo-500" />
              Showing {stats.total} Employee Badges
            </span>
          )}
        </div>
      </div>

      {activeTab === "scanner" ? (
        <div className="space-y-4">
          <AdminEmployeeQrScannerPage
            standalone={false}
            onBackToDirectory={() => {
              setActiveTab("directory");
              fetchAllEmployeeData();
            }}
          />
        </div>
      ) : (
        <>
          {/* 1. Main Hero Command Strip */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

            <div className="space-y-2 max-w-2xl z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-wide">
                <SparklesIcon className="w-4 h-4 text-cyan-400" />
                <span>Official Employee QR Attendance Module</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <span>Employee QR Directory & Live Attendance</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                Har employee ki unique QR badge list me live render ho rahi hai. Admin unka QR code scan karke check-in / check-out mark kar sakte hain, ya card se directly scan kar sakte hain.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 z-10">
              <button
                type="button"
                onClick={() => setShowScannerModal(true)}
                className="flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-600/30 transition cursor-pointer"
              >
                <CameraIcon className="w-5 h-5 text-white" />
                <span>Scan Employee QR 📷</span>
              </button>
            </div>
          </div>

      {/* 2. Today's Live Attendance Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Total Headcount</span>
          <span className="text-2xl font-black text-slate-800 mt-2">{stats.total}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-emerald-600 uppercase font-black tracking-wider">Present Today</span>
          <span className="text-2xl font-black text-emerald-600 mt-2">{stats.present}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-indigo-100 bg-indigo-50/20 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-indigo-600 uppercase font-black tracking-wider">Active In Office</span>
          <span className="text-2xl font-black text-indigo-600 mt-2">{stats.activeInOffice}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-blue-100 bg-blue-50/20 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-blue-600 uppercase font-black tracking-wider">Shift Completed</span>
          <span className="text-2xl font-black text-blue-600 mt-2">{stats.completed}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-rose-100 bg-rose-50/20 shadow-xs flex flex-col justify-between col-span-2 md:col-span-1">
          <span className="text-[10px] text-rose-500 uppercase font-black tracking-wider">Not Punched In</span>
          <span className="text-2xl font-black text-rose-500 mt-2">{stats.absent}</span>
        </div>
      </div>

      {/* 3. Employee Roster with QR Code Actions */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-indigo-600" />
              <span>Employee Directory & QR Badges</span>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {filteredRoster.length} of {employeeRoster.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Har employee ke samne unka QR code render ho raha hai. Click karke zoom/print karein ya camera se scan karein.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === "table" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
                title="Table View"
              >
                <TableCellsIcon className="w-4 h-4" />
                <span>Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === "grid" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
                title="ID Badges Grid View"
              >
                <Squares2X2Icon className="w-4 h-4" />
                <span>ID Badges</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, code, dept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {uniqueDepartments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="Punched In">Punched In</option>
              <option value="Shift Completed">Shift Completed</option>
              <option value="Not Punched In">Not Punched In</option>
            </select>

            {/* Refresh */}
            <button
              onClick={fetchAllEmployeeData}
              className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 transition cursor-pointer"
              title="Refresh Roster"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Subtle Top Loading Line (Non-blocking) */}
        {loading && (
          <div className="w-full h-1 bg-indigo-100 overflow-hidden rounded-full mb-3">
            <div className="h-full bg-indigo-600 animate-pulse w-2/3 rounded-full"></div>
          </div>
        )}

        {/* 3A. TABLE VIEW (With Visible QR Code Image Column - Instant Render) */}
        {viewMode === "table" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-black tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-3">Emp Code</th>
                  <th className="py-3 px-3">Department & Role</th>
                  <th className="py-3 px-4 text-center">QR Code Badge</th>
                  <th className="py-3 px-3">Today's Status</th>
                  <th className="py-3 px-3">Check-In / Out</th>
                  <th className="py-3 px-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRoster.length > 0 ? (
                  filteredRoster.map((emp) => (
                    <tr key={emp.employeeCode} className="hover:bg-indigo-50/40 transition group">
                      {/* 1. Employee Photo & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 shadow-2xs">
                            {emp.photo ? (
                              <img src={emp.photo} alt={emp.fullName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-black text-xs text-indigo-600">
                                {emp.fullName.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-slate-900 text-xs truncate">{emp.fullName}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">{emp.company}</p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Employee Code */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {emp.employeeCode}
                        </span>
                      </td>

                      {/* 3. Department & Designation */}
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-800">{emp.department}</p>
                        <p className="text-[10px] text-slate-500">{emp.designation}</p>
                      </td>

                      {/* 4. VISIBLE QR CODE BADGE (Thumbnail with click-to-enlarge) */}
                      <td className="py-2.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div
                            onClick={() => setZoomedQrEmployee(emp)}
                            className="relative group/qr cursor-pointer p-1 bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-lg hover:border-indigo-500 transition active:scale-95"
                            title="Click to zoom and view large QR Code"
                          >
                            <img
                              src={emp.qrDataUrl}
                              alt={`QR ${emp.employeeCode}`}
                              className="w-14 h-14 object-contain rounded-lg group-hover/qr:scale-105 transition-transform"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(emp.employeeCode)}`;
                              }}
                            />
                            <div className="absolute inset-0 bg-indigo-950/60 rounded-xl opacity-0 group-hover/qr:opacity-100 flex flex-col items-center justify-center transition text-white text-[9px] font-black tracking-tight p-0.5 pointer-events-none">
                              <span className="text-xs">🔍</span>
                              <span>Zoom</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedEmployeeForQr(emp)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition cursor-pointer"
                            title={`Open ID Badge & Print Card for ${emp.fullName}`}
                          >
                            <PrinterIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                      {/* 5. Today's Attendance Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                            emp.status === "Punched In"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : emp.status === "Shift Completed"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              emp.status === "Punched In"
                                ? "bg-emerald-500 animate-pulse"
                                : emp.status === "Shift Completed"
                                ? "bg-blue-500"
                                : "bg-amber-400"
                            }`}
                          />
                          <span>{emp.status}</span>
                        </span>
                      </td>

                      {/* 6. In / Out Timestamps */}
                      <td className="py-3 px-3 font-mono text-[11px]">
                        <div className="space-y-0.5">
                          <p className="text-slate-600">
                            In: <b className="text-slate-900">{emp.checkInTime}</b>
                          </p>
                          <p className="text-slate-400">
                            Out: <b className="text-slate-700">{emp.checkOutTime}</b>
                          </p>
                        </div>
                      </td>

                      {/* 7. Quick Punch Manual Fallback */}
                      <td className="py-3 px-3 text-right">
                        {emp.status === "Shift Completed" ? (
                          <span className="text-[10px] text-slate-400 font-bold">Done ({emp.workingHours} hrs)</span>
                        ) : (
                          <button
                            type="button"
                            disabled={quickPunchLoadingId === emp.employeeCode}
                            onClick={() => handleQuickPunch(emp)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase text-white shadow-2xs transition cursor-pointer ${
                              emp.status === "Punched In"
                                ? "bg-rose-500 hover:bg-rose-600"
                                : "bg-emerald-600 hover:bg-emerald-700"
                            }`}
                          >
                            {quickPunchLoadingId === emp.employeeCode ? "..." : (emp.status === "Punched In" ? "Punch Out" : "Punch In")}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 font-bold">
                      {employeeRoster.length > 0 ? (
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <p className="text-sm font-extrabold text-slate-700">No employees match current filters.</p>
                          <p className="text-xs text-slate-400">Showing 0 of {employeeRoster.length} loaded employees.</p>
                          <button
                            type="button"
                            onClick={() => { setSearchQuery(""); setDeptFilter("ALL"); setStatusFilter("ALL"); }}
                            className="mt-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            Reset Filters
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <ArrowPathIcon className={`w-7 h-7 text-indigo-500 ${loading ? "animate-spin" : ""}`} />
                          <p className="text-sm font-extrabold text-slate-700">
                            {loading ? "Loading employee QR badges..." : "No employee badges found."}
                          </p>
                          <button
                            type="button"
                            onClick={fetchAllEmployeeData}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition cursor-pointer"
                          >
                            Sync Employee Badges
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3B. GRID VIEW (PVC-style ID Badges with Large Scannable QR Codes) */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRoster.length > 0 ? (
              filteredRoster.map((emp) => (
                <div
                  key={emp.employeeCode}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  {/* Card Header Strip */}
                  <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 truncate">
                      {emp.company}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                      QR Badge
                    </span>
                  </div>

                  {/* Employee Identity */}
                  <div className="p-4 flex flex-col items-center text-center space-y-2">
                    <div className="w-14 h-14 rounded-full border-2 border-indigo-200 overflow-hidden bg-slate-100 flex items-center justify-center shadow-xs">
                      {emp.photo ? (
                        <img src={emp.photo} alt={emp.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-black text-lg text-indigo-600">
                          {emp.fullName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm leading-snug">{emp.fullName}</h4>
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 inline-block mt-0.5">
                        {emp.employeeCode}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-semibold">{emp.department} • {emp.designation}</p>

                    {/* LARGE SCANNABLE QR CODE DIRECTLY ON THE CARD */}
                    <div
                      onClick={() => setZoomedQrEmployee(emp)}
                      className="p-2.5 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 cursor-pointer transition group/cardqr mt-2 active:scale-98"
                      title="Click to zoom / scan / print"
                    >
                      <img
                        src={emp.qrDataUrl}
                        alt={`QR ${emp.employeeCode}`}
                        className="w-36 h-36 object-contain group-hover/cardqr:scale-105 transition-transform mx-auto bg-white rounded-xl p-1 shadow-2xs"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(emp.employeeCode)}`;
                        }}
                      />
                      <span className="text-[9px] font-bold text-slate-400 block mt-1">
                        Scan from screen or camera
                      </span>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border ${
                        emp.status === "Punched In"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : emp.status === "Shift Completed"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          emp.status === "Punched In" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                        }`}
                      />
                      <span>{emp.status}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setSelectedEmployeeForQr(emp)}
                      className="flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-white text-[10px] font-bold rounded-lg border border-slate-200 transition cursor-pointer"
                    >
                      <PrinterIcon className="w-3.5 h-3.5" />
                      <span>Print Card</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-slate-400 font-bold">
                {employeeRoster.length > 0 ? (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="text-sm font-extrabold text-slate-700">No employees match current filters.</p>
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(""); setDeptFilter("ALL"); setStatusFilter("ALL"); }}
                      className="mt-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <ArrowPathIcon className={`w-7 h-7 text-indigo-500 ${loading ? "animate-spin" : ""}`} />
                    <p className="text-sm font-extrabold text-slate-700">
                      {loading ? "Loading employee badges..." : "No employee badges found."}
                    </p>
                    <button
                      type="button"
                      onClick={fetchAllEmployeeData}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition cursor-pointer"
                    >
                      Sync Employee Badges
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      </>
      )}

      {/* 4. Scanner Modal (Admin Camera) */}
      <EmployeeQrScannerModal
        isOpen={showScannerModal}
        onClose={() => {
          setShowScannerModal(false);
          fetchAllEmployeeData();
          if (onRefreshData) onRefreshData();
        }}
        onSwitchToFullConsole={() => {
          setShowScannerModal(false);
          setActiveTab("scanner");
        }}
        onSuccess={() => {
          fetchAllEmployeeData();
          if (onRefreshData) onRefreshData();
        }}
      />

      {/* 5. Employee QR Card / Printable Badge Modal */}
      {selectedEmployeeForQr && (
        <EmployeeQrCardModal
          isOpen={!!selectedEmployeeForQr}
          onClose={() => setSelectedEmployeeForQr(null)}
          employee={selectedEmployeeForQr}
          onUpdated={() => {
            fetchAllEmployeeData();
            if (onRefreshData) onRefreshData();
          }}
        />
      )}

      {/* 6. Instant QR Code Zoom & Enlarge Modal */}
      {zoomedQrEmployee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setZoomedQrEmployee(null)}
        >
          <div
            className="relative bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full text-center shadow-2xl border border-slate-100 space-y-4 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <QrCodeIcon className="w-5 h-5" />
                </span>
                <div className="text-left">
                  <h3 className="font-black text-slate-900 text-sm">QR Code Zoom Preview</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Official Attendance Badge QR</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setZoomedQrEmployee(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Employee Info Header */}
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-indigo-200 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                {zoomedQrEmployee.photo ? (
                  <img src={zoomedQrEmployee.photo} alt={zoomedQrEmployee.fullName} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-black text-lg text-indigo-600">
                    {(zoomedQrEmployee.fullName || "E").charAt(0)}
                  </span>
                )}
              </div>
              <div className="text-left">
                <h4 className="font-black text-slate-900 text-base leading-tight">{zoomedQrEmployee.fullName}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {zoomedQrEmployee.employeeCode}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">{zoomedQrEmployee.department}</span>
                </div>
              </div>
            </div>

            {/* BIG CRISP QR CODE */}
            <div className="relative mx-auto bg-slate-50 p-4 rounded-3xl border-2 border-indigo-200 shadow-inner inline-block">
              <img
                src={zoomedQrEmployee.qrDataUrl}
                alt={`Large QR ${zoomedQrEmployee.employeeCode}`}
                className="w-64 h-64 sm:w-72 sm:h-72 object-contain bg-white rounded-2xl p-2 shadow-xs"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(zoomedQrEmployee.employeeCode)}`;
                }}
              />
              <div className="mt-2 text-[11px] font-extrabold text-emerald-700 bg-emerald-100/70 border border-emerald-200 rounded-xl py-1 px-3 inline-block">
                📷 Ready to scan from screen or camera
              </div>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = zoomedQrEmployee.qrDataUrl;
                  link.download = `QR_${zoomedQrEmployee.employeeCode}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                <ArrowDownTrayIcon className="w-4 h-4 text-slate-600" />
                <span>Save PNG</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const empToPrint = zoomedQrEmployee;
                  setZoomedQrEmployee(null);
                  setSelectedEmployeeForQr(empToPrint);
                }}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-600/30 transition cursor-pointer"
              >
                <PrinterIcon className="w-4 h-4 text-white" />
                <span>Print Badge</span>
              </button>
            </div>

            {/* Quick Punch Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={async () => {
                  await handleQuickPunch(zoomedQrEmployee);
                  setZoomedQrEmployee(null);
                }}
                className={`w-full py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-white shadow-sm transition cursor-pointer ${
                  zoomedQrEmployee.status === "Punched In"
                    ? "bg-rose-500 hover:bg-rose-600"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {quickPunchLoadingId === zoomedQrEmployee.employeeCode
                  ? "Recording..."
                  : zoomedQrEmployee.status === "Punched In"
                  ? "Mark Check-Out Now"
                  : "Mark Check-In Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
