import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/hrApi";
import { useAuth } from "../../auth/AuthProvider";
import { 
  CommandLineIcon, 
  BriefcaseIcon,
  WrenchScrewdriverIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  CreditCardIcon,
  ArchiveBoxIcon,
  UserGroupIcon,
  UserPlusIcon,
  UserMinusIcon,
  CheckCircleIcon,
  ClockIcon,
  CheckBadgeIcon,
  ExclamationCircleIcon,
  DocumentChartBarIcon,
  CalendarIcon,
  PaperAirplaneIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  DocumentArrowDownIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  WrenchIcon,
  ClipboardDocumentCheckIcon,
  TicketIcon,
  StarIcon,
  DocumentCheckIcon,
  DocumentPlusIcon,
  ChartBarIcon,
  FolderIcon,
  CheckIcon,
  PlusIcon,
  ArrowPathIcon,
  QueueListIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EnvelopeIcon,
  PhoneIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  BellAlertIcon
} from "@heroicons/react/24/outline";

import { getDynamicWidgetsForModules } from "../../config/departmentWidgetRegistry";

// Helper map to render heroicon components dynamically by string name
const ICON_MAP = {
  UserGroupIcon,
  UserPlusIcon,
  UserMinusIcon,
  CheckCircleIcon,
  ClockIcon,
  CheckBadgeIcon,
  ExclamationCircleIcon,
  DocumentChartBarIcon,
  CalendarIcon,
  PaperAirplaneIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  BanknotesIcon,
  DocumentArrowDownIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  WrenchIcon,
  ClipboardDocumentCheckIcon,
  TicketIcon,
  CpuChipIcon,
  BriefcaseIcon,
  StarIcon,
  DocumentCheckIcon,
  DocumentPlusIcon,
  ChartBarIcon,
  FolderIcon,
  CheckIcon,
  PlusIcon,
  QueueListIcon,
  FunnelIcon,
  ArrowDownTrayIcon
};

// Helper to match icons dynamically based on department name
const getDepartmentIcon = (name = "") => {
  const cleanName = name.toLowerCase();
  if (cleanName.includes("operation")) return CommandLineIcon;
  if (cleanName.includes("sale")) return BriefcaseIcon;
  if (cleanName.includes("support")) return WrenchScrewdriverIcon;
  if (cleanName.includes("marketing")) return MegaphoneIcon;
  if (cleanName.includes("claim")) return ShieldCheckIcon;
  if (cleanName.includes("it") || cleanName.includes("tech") || cleanName.includes("software")) return CpuChipIcon;
  if (cleanName.includes("account") || cleanName.includes("finance")) return CreditCardIcon;
  if (cleanName.includes("inventory")) return ArchiveBoxIcon;
  return UserGroupIcon;
};

// Helper to match background gradient dynamically based on department name
const getDepartmentGradient = (name = "") => {
  const cleanName = name.toLowerCase();
  if (cleanName.includes("operation")) return "from-blue-700 via-indigo-800 to-slate-900";
  if (cleanName.includes("sale")) return "from-amber-600 via-orange-600 to-red-800";
  if (cleanName.includes("support")) return "from-emerald-600 via-teal-700 to-slate-900";
  if (cleanName.includes("marketing")) return "from-rose-600 via-pink-600 to-purple-800";
  if (cleanName.includes("it") || cleanName.includes("tech") || cleanName.includes("software")) return "from-cyan-700 via-blue-800 to-indigo-950";
  if (cleanName.includes("account") || cleanName.includes("finance")) return "from-violet-700 via-fuchsia-800 to-slate-900";
  return "from-indigo-700 via-purple-800 to-slate-900";
};

const DepartmentDashboard = ({ deptDetail = {}, dbData = {} }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [empSearchText, setEmpSearchText] = useState("");
  const [activeTabFilter, setActiveTabFilter] = useState("overview");

  const deptName = deptDetail.deptName || deptDetail.dept_name || deptDetail.name || user?.departmentName || "Department";
  const deptCode = deptDetail.deptCode || deptDetail.dept_code || deptDetail.code || user?.departmentCode || "DEPT";
  const headName = deptDetail.head || (deptDetail.headEmployeeDetails?.firstName ? `${deptDetail.headEmployeeDetails?.firstName} ${deptDetail.headEmployeeDetails?.lastName || ""}` : "Unassigned");
  const parentName = deptDetail.parentDept || deptDetail.parentDeptDetails?.deptName || "None";
  const companyName = deptDetail.company || user?.companyName || "Aarogya Homeopathy Clinic";
  const branchName = deptDetail.branch ? `(${deptDetail.branch})` : "";
  const statusStr = deptDetail.status || "Active";
  const descriptionStr = deptDetail.description || `${deptName} Operations Command Center.`;

  // Live Database States (Direct synchronization from MySQL)
  const [liveEmployees, setLiveEmployees] = useState(dbData?.["Employee Profile"] || dbData?.["employees"] || []);
  const [liveAttendance, setLiveAttendance] = useState(dbData?.["Daily Attendance"] || dbData?.["daily_attendance"] || []);
  const [liveLeaves, setLiveLeaves] = useState(dbData?.["Leave Requests"] || dbData?.["leave_requests"] || []);
  const [liveTickets, setLiveTickets] = useState(dbData?.["hr_tickets"] || []);
  const [loadingLive, setLoadingLive] = useState(false);

  const fetchLiveDeptData = useCallback(async () => {
    try {
      setLoadingLive(true);
      const [empRes, attRes, leaveRes, ticketRes] = await Promise.all([
        apiFetch("/api/table/employee_profile").catch(() => ({ success: false })),
        apiFetch("/api/table/daily_attendance").catch(() => ({ success: false })),
        apiFetch("/api/table/leave_requests").catch(() => ({ success: false })),
        apiFetch("/api/table/hr_tickets").catch(() => ({ success: false }))
      ]);

      if (empRes?.success && Array.isArray(empRes.data)) {
        setLiveEmployees(empRes.data);
      }
      if (attRes?.success && Array.isArray(attRes.data)) {
        setLiveAttendance(attRes.data);
      }
      if (leaveRes?.success && Array.isArray(leaveRes.data)) {
        setLiveLeaves(leaveRes.data);
      }
      if (ticketRes?.success && Array.isArray(ticketRes.data)) {
        setLiveTickets(ticketRes.data);
      }
    } catch (e) {
      console.error("Error loading department live metrics:", e);
    } finally {
      setLoadingLive(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveDeptData();
    window.addEventListener("focus", fetchLiveDeptData);
    return () => window.removeEventListener("focus", fetchLiveDeptData);
  }, [fetchLiveDeptData, deptName]);

  // Extract assigned modules for this department
  const assignedModules = useMemo(() => {
    let mods = deptDetail.assignedModules || deptDetail.assigned_modules;
    if (typeof mods === 'string') {
      try { mods = JSON.parse(mods); } catch (e) { mods = null; }
    }
    if (Array.isArray(mods)) return mods;
    if (user?.assignedModules && Array.isArray(user.assignedModules)) {
      return user.assignedModules;
    }
    return [];
  }, [deptDetail, user]);

  // Compute dynamic widgets automatically from predefined module registry
  const { kpis, quickActions, charts, tables } = useMemo(() => {
    return getDynamicWidgetsForModules(assignedModules);
  }, [assignedModules]);

  const isAll = String(deptName || "").toLowerCase().trim() === "all employees" || String(deptName || "").toLowerCase().trim() === "all departments";

  // Strict departmental employee resolution
  const deptEmployees = useMemo(() => {
    if (isAll) return liveEmployees;
    const targetName = String(deptName || "").toLowerCase().trim();
    const targetCode = String(deptCode || "").toLowerCase().trim();
    const targetId = String(deptDetail.id || user?.departmentId || "").toLowerCase().trim();

    return liveEmployees.filter(emp => {
      const empDept = String(emp.department || emp.department_name || emp.departmentName || "").toLowerCase().trim();
      const empDeptId = String(emp.department_id || emp.departmentId || "").toLowerCase().trim();
      const empDeptCode = String(emp.dept_code || emp.departmentCode || "").toLowerCase().trim();

      return (
        (targetName && (empDept === targetName || empDept.includes(targetName) || targetName.includes(empDept))) ||
        (targetId && empDeptId === targetId) ||
        (targetCode && empDeptCode === targetCode)
      );
    });
  }, [liveEmployees, isAll, deptName, deptCode, deptDetail.id, user?.departmentId]);

  const filteredEmployees = useMemo(() => {
    const q = empSearchText.toLowerCase().trim();
    if (!q) return deptEmployees;
    return deptEmployees.filter(emp => {
      const name = (emp.employee_name || emp.employeeName || `${emp.firstName || ""} ${emp.lastName || ""}`).toLowerCase();
      const code = String(emp.empCode || emp.emp_code || emp.employeeCode || "").toLowerCase();
      const desig = String(emp.designation || emp.designation_name || emp.designationName || "").toLowerCase();
      const email = String(emp.email || emp.officialEmail || emp.company_email || "").toLowerCase();
      return name.includes(q) || code.includes(q) || desig.includes(q) || email.includes(q);
    });
  }, [deptEmployees, empSearchText]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const metrics = useMemo(() => {
    const totalEmp = deptEmployees.length;
    
    const attendanceList = liveAttendance.length > 0 ? liveAttendance : (dbData?.["Daily Attendance"] || dbData?.["daily_attendance"] || []);
    const deptAttendance = attendanceList.filter(a => 
      deptEmployees.some(emp => {
        const empCode = String(emp.employeeCode || emp.emp_code || emp.empCode || "").toLowerCase().trim();
        const empId = String(emp.id || "").toLowerCase().trim();
        const attEmpCode = String(a.empId || a.employeeCode || "").toLowerCase().trim();
        return (empCode && attEmpCode === empCode) || (empId && attEmpCode === empId);
      })
    );
    
    const present = deptAttendance.filter(a => a.date === todayStr && String(a.status || "").toLowerCase() === 'present').length;
    const wfh = deptAttendance.filter(a => a.date === todayStr && String(a.status || "").toLowerCase() === 'wfh').length;
    const late = deptAttendance.filter(a => a.date === todayStr && Number(a.lateComing || a.late_coming || 0) > 0).length;
    const early = deptAttendance.filter(a => a.date === todayStr && Number(a.earlyLeaving || a.early_leaving || 0) > 0).length;
    
    const leavesList = liveLeaves.length > 0 ? liveLeaves : (dbData?.["Leave Requests"] || dbData?.["leave_requests"] || []);
    const deptLeaves = leavesList.filter(l => 
      deptEmployees.some(emp => {
        const empCode = String(emp.employeeCode || emp.emp_code || emp.empCode || "").toLowerCase().trim();
        const empId = String(emp.id || "").toLowerCase().trim();
        const leaveEmpCode = String(l.employeeCode || l.empId || "").toLowerCase().trim();
        return (empCode && leaveEmpCode === empCode) || (empId && leaveEmpCode === empId);
      })
    );
    const onLeave = deptLeaves.filter(l => String(l.status || "").toLowerCase() === 'approved' && todayStr >= l.fromDate && todayStr <= l.toDate).length;
    const pending = deptLeaves.filter(l => String(l.status || "").toLowerCase() === 'pending').length;
    
    const absent = Math.max(0, totalEmp - present - onLeave - wfh);
    const leaveTakenDays = deptLeaves
      .filter(l => String(l.status || "").toLowerCase() === 'approved')
      .reduce((sum, l) => sum + (Number(l.totalDays || l.days) || 1), 0);
    
    const permanent = deptEmployees.filter(e => String(e.employmentType || e.employment_type || "").toLowerCase().includes("permanent")).length;
    const contract = deptEmployees.filter(e => String(e.employmentType || e.employment_type || "").toLowerCase().includes("contract")).length;
    const probation = deptEmployees.filter(e => String(e.employmentType || e.employment_type || "").toLowerCase().includes("probation")).length;
    const intern = Math.max(0, totalEmp - permanent - contract - probation);
    
    const active = deptEmployees.filter(e => String(e.status || e.employeeStatus || "").toLowerCase() === "active" || !e.status).length;
    const notice = deptEmployees.filter(e => String(e.status || "").toLowerCase() === "notice" || String(e.status || "").toLowerCase() === "resigned").length;
    
    const male = deptEmployees.filter(e => String(e.gender || "").toLowerCase() === "male").length;
    const female = deptEmployees.filter(e => String(e.gender || "").toLowerCase() === "female").length;
    const others = Math.max(0, totalEmp - male - female);
    
    return {
      totalEmp,
      present,
      wfh,
      late,
      early,
      onLeave,
      pending,
      absent,
      permanent,
      contract,
      probation,
      intern,
      active,
      notice,
      male,
      female,
      others,
      leaveTakenDays,
      deptLeaves
    };
  }, [deptEmployees, liveAttendance, liveLeaves, dbData, todayStr]);

  const deptDistribution = useMemo(() => {
    const list = liveEmployees || [];
    const depts = list.reduce((acc, emp) => {
      const dept = emp.department || emp.department_name || emp.departmentName || 'Other';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});
    
    const maxVal = Math.max(...Object.values(depts), 1);
    return Object.entries(depts).slice(0, 8).map(([dept, count]) => ({
      label: dept.substring(0, 5),
      val: count,
      percent: (count / maxVal) * 80,
      col: dept.toLowerCase() === deptName.toLowerCase() ? "bg-indigo-600 font-extrabold" : "bg-blue-600"
    }));
  }, [liveEmployees, deptName]);

  const attendanceTrend = useMemo(() => {
    const dates = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 3);
      dates.push(d.toISOString().split('T')[0]);
    }
    
    const attendanceList = dbData?.["Daily Attendance"] || dbData?.["daily_attendance"] || [];
    return dates.map(dt => {
      const dayAtt = attendanceList.filter(a => a.date === dt);
      const dayDeptAtt = dayAtt.filter(a => deptEmployees.some(emp => String(emp.employeeCode || emp.emp_code || "").toLowerCase().trim() === String(a.empId || a.employeeCode).toLowerCase().trim()));
      const percent = deptEmployees.length > 0 ? ((dayDeptAtt.filter(a => String(a.status || "").toLowerCase() === 'present').length / deptEmployees.length) * 100).toFixed(0) : "0";
      
      const dateObj = new Date(dt);
      const label = dateObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
      return { day: label, val: `${percent}%`, heightPercent: Number(percent) };
    });
  }, [deptEmployees, dbData]);

  const leaveTrend = useMemo(() => {
    const dates = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 3);
      dates.push(d.toISOString().split('T')[0]);
    }
    
    const leavesList = dbData?.["Leave Requests"] || dbData?.["leave_requests"] || [];
    return dates.map(dt => {
      const dayLeaves = leavesList.filter(l => 
        String(l.status || "").toLowerCase() === 'approved' && dt >= l.fromDate && dt <= l.toDate &&
        deptEmployees.some(emp => String(emp.employeeCode || emp.emp_code || "").toLowerCase().trim() === String(l.employeeCode || l.empId || "").toLowerCase().trim())
      ).length;
      
      const dateObj = new Date(dt);
      const label = dateObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
      return { day: label, val: dayLeaves, heightPercent: deptEmployees.length > 0 ? (dayLeaves / deptEmployees.length) * 100 : 0 };
    });
  }, [deptEmployees, dbData]);

  const IconComponent = getDepartmentIcon(deptName);
  const gradientClass = getDepartmentGradient(deptName);

  return (
    <div className="space-y-4">
      {/* Top Header Bar & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 border-slate-200/80 gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
            <span>Home</span> ➔ <span>Department Dashboards</span> ➔ <span className="font-bold text-slate-700">{deptName}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            {deptName} Department Dashboard
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fetchLiveDeptData}
            title="Fetch Latest Data from Database"
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowPathIcon className={`w-3.5 h-3.5 text-blue-600 ${loadingLive ? "animate-spin" : ""}`} />
            <span>{loadingLive ? "Refreshing..." : "Refresh"}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(`/hr-hub?category=EMPLOYEE_MGMT&tab=Add%20Employee&dept=${encodeURIComponent(deptName)}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>+ Add Employee</span>
          </button>
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1.5 rounded-xl border border-indigo-200">
            {deptName}
          </span>
        </div>
      </div>

      {/* 1. Top 7 Horizontal Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
          <span className="text-[9px] font-black uppercase text-slate-400 block">Total Employees</span>
          <span className="text-lg font-black text-slate-900 block mt-1">{metrics.totalEmp}</span>
          <span className="text-[9px] font-bold text-blue-600">All Employees</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
          <span className="text-[9px] font-black uppercase text-slate-400 block">Present Today</span>
          <span className="text-lg font-black text-slate-900 block mt-1">{metrics.present}</span>
          <span className="text-[9px] font-bold text-emerald-600">
            {metrics.totalEmp > 0 ? ((metrics.present / metrics.totalEmp) * 100).toFixed(1) : "0.0"}%
          </span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
          <span className="text-[9px] font-black uppercase text-slate-400 block">On Leave</span>
          <span className="text-lg font-black text-slate-900 block mt-1">{metrics.onLeave}</span>
          <span className="text-[9px] font-bold text-amber-600">
            {metrics.totalEmp > 0 ? ((metrics.onLeave / metrics.totalEmp) * 100).toFixed(1) : "0.0"}%
          </span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
          <span className="text-[9px] font-black uppercase text-slate-400 block">Absent Today</span>
          <span className="text-lg font-black text-slate-900 block mt-1">{metrics.absent}</span>
          <span className="text-[9px] font-bold text-rose-600">
            {metrics.totalEmp > 0 ? ((metrics.absent / metrics.totalEmp) * 100).toFixed(1) : "0.0"}%
          </span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
          <span className="text-[9px] font-black uppercase text-slate-400 block">Late Arrivals</span>
          <span className="text-lg font-black text-slate-900 block mt-1">{metrics.late}</span>
          <span className="text-[9px] font-bold text-purple-600">
            {metrics.totalEmp > 0 ? ((metrics.late / metrics.totalEmp) * 100).toFixed(1) : "0.0"}%
          </span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
          <span className="text-[9px] font-black uppercase text-slate-400 block">Work From Home</span>
          <span className="text-lg font-black text-slate-900 block mt-1">{metrics.wfh}</span>
          <span className="text-[9px] font-bold text-cyan-600">
            {metrics.totalEmp > 0 ? ((metrics.wfh / metrics.totalEmp) * 100).toFixed(1) : "0.0"}%
          </span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs">
          <span className="text-[9px] font-black uppercase text-slate-400 block">Pending Approvals</span>
          <span className="text-lg font-black text-slate-900 block mt-1">{metrics.pending}</span>
          <span className="text-[9px] font-bold text-yellow-700">View all</span>
        </div>
      </div>

      {/* 2. 4 Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Employee Summary */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs space-y-2">
          <div className="flex justify-between items-center border-b pb-1.5 border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <UserGroupIcon className="w-3.5 h-3.5 text-blue-600" /> Employee Summary
            </h3>
            <span className="text-[9px] font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">Employee Management</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="space-y-1">
              <div className="flex justify-between"><span>Total</span> <strong>{metrics.totalEmp}</strong></div>
              <div className="flex justify-between"><span>Permanent</span> <strong>{metrics.permanent}</strong></div>
              <div className="flex justify-between"><span>Contract</span> <strong>{metrics.contract}</strong></div>
              <div className="flex justify-between"><span>Intern</span> <strong>{metrics.intern}</strong></div>
            </div>
            <div className="space-y-1 pl-2 border-l border-slate-100">
              <div className="flex justify-between"><span>Male</span> <strong>{metrics.male}</strong></div>
              <div className="flex justify-between"><span>Female</span> <strong>{metrics.female}</strong></div>
              <div className="flex justify-between"><span>Active</span> <strong className="text-emerald-600">{metrics.active}</strong></div>
              <div className="flex justify-between"><span>Notice</span> <strong className="text-amber-600">{metrics.notice}</strong></div>
            </div>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs space-y-2">
          <div className="flex justify-between items-center border-b pb-1.5 border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ClockIcon className="w-3.5 h-3.5 text-emerald-600" /> Attendance Summary
            </h3>
            <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Attendance</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full border-4 border-emerald-500 border-t-amber-500 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold">
                {metrics.totalEmp > 0 ? ((metrics.present / metrics.totalEmp) * 100).toFixed(0) : "0"}%
              </span>
            </div>
            <div className="space-y-0.5 text-[11px] w-full">
              <div className="flex justify-between"><span>Present</span> <strong className="text-emerald-600">{metrics.present} ({metrics.totalEmp > 0 ? ((metrics.present / metrics.totalEmp) * 100).toFixed(0) : "0"}%)</strong></div>
              <div className="flex justify-between"><span>Absent</span> <strong className="text-rose-600">{metrics.absent} ({metrics.totalEmp > 0 ? ((metrics.absent / metrics.totalEmp) * 100).toFixed(0) : "0"}%)</strong></div>
              <div className="flex justify-between"><span>Late</span> <strong className="text-amber-600">{metrics.late} ({metrics.totalEmp > 0 ? ((metrics.late / metrics.totalEmp) * 100).toFixed(0) : "0"}%)</strong></div>
              <div className="flex justify-between"><span>Early</span> <strong className="text-blue-600">{metrics.early} ({metrics.totalEmp > 0 ? ((metrics.early / metrics.totalEmp) * 100).toFixed(0) : "0"}%)</strong></div>
            </div>
          </div>
        </div>

        {/* Leave Summary */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs space-y-2">
          <div className="flex justify-between items-center border-b pb-1.5 border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-amber-600" /> Leave Summary
            </h3>
            <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Leave Management</span>
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between"><span>Total Balance</span> <strong>{metrics.totalEmp > 0 ? metrics.totalEmp * 24 : 0} Days</strong></div>
            <div className="flex justify-between"><span>Leave Taken</span> <strong className="text-blue-600">{metrics.leaveTakenDays || 0} Days</strong></div>
            <div className="flex justify-between"><span>Pending</span> <strong className="text-amber-600">{metrics.pending} Requests</strong></div>
            <div className="flex justify-between"><span>On Leave</span> <strong className="text-rose-600">{metrics.onLeave} Staff</strong></div>
          </div>
        </div>

        {/* Recruitment Summary */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs space-y-2">
          <div className="flex justify-between items-center border-b pb-1.5 border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <BriefcaseIcon className="w-3.5 h-3.5 text-purple-600" /> Recruitment Summary
            </h3>
            <span className="text-[9px] font-extrabold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">Recruitment</span>
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between"><span>Open Vacancies</span> <strong className="text-purple-600">{(dbData?.['job_postings'] || []).length} Roles</strong></div>
            <div className="flex justify-between"><span>Interviews</span> <strong className="text-blue-600">{(dbData?.['interviews'] || []).length} Candidates</strong></div>
            <div className="flex justify-between"><span>Shortlisted</span> <strong className="text-indigo-600">{(dbData?.['candidate_database'] || []).filter(c => String(c.status || '').toLowerCase().includes('shortlist')).length} Staff</strong></div>
            <div className="flex justify-between"><span>Offer Released</span> <strong className="text-emerald-600">{(dbData?.['offer_letters'] || []).length} Offers</strong></div>
          </div>
        </div>
      </div>

      {/* 3. 3 Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Employee Distribution Bar Chart */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs space-y-2">
          <div className="flex justify-between items-center border-b pb-1.5 border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ChartBarIcon className="w-3.5 h-3.5 text-indigo-600" /> Employee Distribution
            </h3>
            <span className="text-[9px] font-semibold text-slate-400">Total Employees</span>
          </div>
          <div className="h-32 flex items-end justify-between gap-1.5 pt-2">
            {deptDistribution.map((b, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <span className="text-[9px] font-bold text-slate-600">{b.val}</span>
                <div style={{ height: `${b.percent}%` }} className={`w-full max-w-[20px] rounded-t ${b.col}`}></div>
                <span className="text-[9px] text-slate-500 truncate w-full text-center" title={b.label}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Trend Line Chart */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs space-y-2">
          <div className="flex justify-between items-center border-b pb-1.5 border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ClockIcon className="w-3.5 h-3.5 text-blue-600" /> Attendance Trend
            </h3>
            <span className="text-[9px] font-semibold text-slate-400">This Month</span>
          </div>
          <div className="h-32 flex items-end justify-between gap-2 pt-2 px-2">
            {attendanceTrend.map((pt, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <span className="text-[9px] font-bold text-blue-600">{pt.val}</span>
                <div style={{ height: `${Math.max(10, pt.heightPercent * 0.8)}%` }} className="w-2.5 rounded-t bg-gradient-to-t from-blue-500 to-indigo-600"></div>
                <span className="text-[9px] text-slate-500">{pt.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Trend Line Chart */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs space-y-2">
          <div className="flex justify-between items-center border-b pb-1.5 border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-600" /> Leave Trend
            </h3>
            <span className="text-[9px] font-semibold text-slate-400">This Month</span>
          </div>
          <div className="h-32 flex items-end justify-between gap-2 pt-2 px-2">
            {leaveTrend.map((pt, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <span className="text-[9px] font-bold text-emerald-600">{pt.val}</span>
                <div style={{ height: `${Math.max(10, pt.heightPercent * 0.8)}%` }} className="w-2.5 rounded-t bg-gradient-to-t from-emerald-400 to-teal-600"></div>
                <span className="text-[9px] text-slate-500">{pt.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. 4 Breakdown Rings Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Gender Distribution */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-slate-800 border-b pb-1 border-slate-100">Gender Distribution</h3>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full border-4 border-blue-500 border-t-rose-500 shrink-0"></div>
            <div className="text-[11px] space-y-0.5">
              <div>Male: <strong>{metrics.male} ({metrics.totalEmp > 0 ? ((metrics.male / metrics.totalEmp) * 100).toFixed(0) : "0"}%)</strong></div>
              <div>Female: <strong>{metrics.female} ({metrics.totalEmp > 0 ? ((metrics.female / metrics.totalEmp) * 100).toFixed(0) : "0"}%)</strong></div>
              <div>Others: <strong>{metrics.others} ({metrics.totalEmp > 0 ? ((metrics.others / metrics.totalEmp) * 100).toFixed(0) : "0"}%)</strong></div>
            </div>
          </div>
        </div>

        {/* Employment Type */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-slate-800 border-b pb-1 border-slate-100">Employment Type</h3>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full border-4 border-emerald-500 border-r-indigo-500 shrink-0"></div>
            <div className="text-[11px] space-y-0.5">
              <div>Permanent: <strong>{metrics.permanent} ({metrics.totalEmp > 0 ? ((metrics.permanent / metrics.totalEmp) * 100).toFixed(0) : "0"}%)</strong></div>
              <div>Contract: <strong>{metrics.contract} ({metrics.totalEmp > 0 ? ((metrics.contract / metrics.totalEmp) * 100).toFixed(0) : "0"}%)</strong></div>
              <div>Probation: <strong>{metrics.probation} ({metrics.totalEmp > 0 ? ((metrics.probation / metrics.totalEmp) * 100).toFixed(0) : "0"}%)</strong></div>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-slate-800 border-b pb-1 border-slate-100">Performance Overview</h3>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <span className="text-lg font-black text-slate-900 block">
                {deptEmployees.some(e => e.rating) ? (deptEmployees.reduce((acc, e) => acc + (Number(e.rating) || 0), 0) / (deptEmployees.filter(e => e.rating).length || 1)).toFixed(1) : "0.0"}
              </span>
              <span className="text-[9px] text-amber-500 block">★★★★★</span>
            </div>
            <div className="text-[11px] space-y-0.5">
              <div>Average KPI: <strong>{deptEmployees.some(e => e.rating) ? `${Math.round(((deptEmployees.reduce((acc, e) => acc + (Number(e.rating) || 0), 0) / (deptEmployees.filter(e => e.rating).length || 1)) / 5) * 100)}%` : "0%"}</strong></div>
              <div>Top Performers: <strong>{deptEmployees.filter(e => Number(e.rating) >= 4).length}</strong></div>
              <div>Completed: <strong>{deptEmployees.filter(e => e.rating).length}</strong></div>
            </div>
          </div>
        </div>

        {/* Helpdesk Summary */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-slate-800 border-b pb-1 border-slate-100">Helpdesk Summary</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-rose-500 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold">{(dbData?.['hr_tickets'] || []).length}</span>
            </div>
            <div className="text-[11px] space-y-0.5">
              <div>Open: <strong>{(dbData?.['hr_tickets'] || []).filter(t => String(t.status || '').toLowerCase() === 'open').length}</strong> | In Progress: <strong>{(dbData?.['hr_tickets'] || []).filter(t => String(t.status || '').toLowerCase().includes('prog')).length}</strong></div>
              <div>Resolved: <strong>{(dbData?.['hr_tickets'] || []).filter(t => String(t.status || '').toLowerCase() === 'resolved').length}</strong> | Closed: <strong>{(dbData?.['hr_tickets'] || []).filter(t => String(t.status || '').toLowerCase() === 'closed').length}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom Actions & Activity Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Pending Approvals Actions */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-slate-800 border-b pb-1.5 border-slate-100">Pending Approvals</h3>
          <div className="flex items-center gap-2 text-[11px]">
            <div className="flex-1 p-2 bg-emerald-50 text-emerald-800 rounded-lg text-center font-bold">Leave: {metrics.pending}</div>
            <div className="flex-1 p-2 bg-blue-50 text-blue-800 rounded-lg text-center font-bold">Attn: 0</div>
            <div className="flex-1 p-2 bg-purple-50 text-purple-800 rounded-lg text-center font-bold">Expense: 0</div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-slate-800 border-b pb-1.5 border-slate-100">Recent Activities</h3>
          <div className="space-y-1 text-[11px]">
            {(metrics.deptLeaves && metrics.deptLeaves.length > 0) ? (
              metrics.deptLeaves.slice(0, 2).map((l, i) => (
                <div key={i}><strong>{l.employee_name || l.employeeName || "Employee"}</strong> applied for {l.leave_type || l.leaveType || "leave"}</div>
              ))
            ) : (
              <div className="text-slate-400 italic">No recent activities</div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-slate-800 border-b pb-1.5 border-slate-100">Upcoming Events</h3>
          <div className="space-y-1 text-[11px]">
            {(dbData?.['holidays'] || []).length > 0 ? (
              (dbData?.['holidays'] || []).slice(0, 2).map((h, i) => (
                <div key={i}><strong>{h.holiday_name || h.name || "Holiday"}</strong> ({h.date || "Upcoming"})</div>
              ))
            ) : (
              <div className="text-slate-400 italic">No upcoming events scheduled</div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Live Department Staff Directory Table (Real-Time Synchronized) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden font-sans">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <UserGroupIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight">
                {deptName} Staff Directory
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Live team members assigned to this department ({deptEmployees.length} total)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff by name, code, designation..."
                value={empSearchText}
                onChange={(e) => setEmpSearchText(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-blue-500 w-full sm:w-64"
              />
            </div>

            <button
              type="button"
              onClick={() => navigate(`/hr-hub?category=EMPLOYEE_MGMT&tab=Add%20Employee&dept=${encodeURIComponent(deptName)}`)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>+ Add Staff</span>
            </button>
          </div>
        </div>

        {/* Staff Table List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Emp Code</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Joining Date</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp, idx) => {
                  const empName = emp.employee_name || emp.employeeName || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "Employee";
                  const empCode = emp.empCode || emp.emp_code || emp.employeeCode || `EMP-${String(idx + 1).padStart(3, '0')}`;
                  const desig = emp.designation || emp.designation_name || emp.designationName || "Staff Member";
                  const email = emp.email || emp.officialEmail || emp.company_email || "--";
                  const phone = emp.mobileNumber || emp.phone || emp.mobile || "--";
                  const joinDate = emp.dateOfJoining || emp.joining_date || emp.created_at ? new Date(emp.dateOfJoining || emp.joining_date || emp.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "--";
                  const status = emp.status || emp.employeeStatus || "Active";
                  const initials = empName.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "EM";

                  return (
                    <tr key={emp.id || idx} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{empName}</div>
                            <div className="text-[10px] text-slate-400">{emp.department || deptName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[11px]">
                          {empCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{desig}</td>
                      <td className="py-3 px-4 text-slate-500">
                        <div>{email}</div>
                        {phone !== "--" && <div className="text-[10px] text-slate-400">{phone}</div>}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{joinDate}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          status === "Active" 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <UserGroupIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600 text-xs">
                      {empSearchText 
                        ? `Koi staff nahi mila search "${empSearchText}" ke liye.` 
                        : `Abhi ${deptName} department me koi employee add nahi hai.`}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                      Aap "Add Staff" button par click karke naya employee add kar sakte hain, entry hote hi live dashboard par update reflect ho jayega.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate("/hr-hub?category=EMPLOYEE_MGMT&tab=Add%20Employee")}
                      className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <PlusIcon className="w-4 h-4" />
                      <span>+ Naya Employee Add Karein</span>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DepartmentDashboard;
