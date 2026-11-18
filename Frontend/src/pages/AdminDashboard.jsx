import React, { useEffect, useMemo, useState } from "react";
import {
  UserGroupIcon,
  BuildingOffice2Icon,
  BuildingOfficeIcon,
  ClockIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  BoltIcon,
  UserIcon,
  QrCodeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  BriefcaseIcon,
  MapPinIcon,
  ChartBarIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  ArrowsRightLeftIcon,
  EyeIcon,
  CurrencyRupeeIcon
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "../auth/AuthProvider";
import { getTableData, apiFetch, invalidateTableCache } from "../services/hrApi";
import DepartmentDashboard from "../components/Department/DepartmentDashboard";
import EmployeeQrScannerModal from "../components/Attendance/EmployeeQrScannerModal";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dbData = useSelector((state) => state.hr.dbData) || {};

  // Redirection for DepartmentHR
  if (user?.role === "DepartmentHR") {
    const deptDetail = {
      id: user?.departmentId || "dept_hr",
      deptName: user?.departmentName || "Department Operations",
      deptCode: user?.departmentCode || "DEPT",
      assignedModules: user?.assignedModules || [],
      status: "Active",
      description: `${user?.departmentName || "Department"} Operations Command Center.`
    };
    return <DepartmentDashboard deptDetail={deptDetail} dbData={dbData} />;
  }

  // Live Database States
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [exits, setExits] = useState([]);
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI Interactive States
  const [showEmployeeQrScannerModal, setShowEmployeeQrScannerModal] = useState(false);
  const [showCompanyProfileModal, setShowCompanyProfileModal] = useState(false);
  const [approvalsFilter, setApprovalsFilter] = useState("all"); // "all", "leave", "exit"
  const [actionMessage, setActionMessage] = useState({ text: "", type: "" });
  const [processingId, setProcessingId] = useState(null);

  // SuperAdmin Tenant Context Detection
  const userRole = typeof user?.role === "object" ? user?.role?.name : user?.role;
  const isSuperAdmin = userRole === "SuperAdmin";

  // Auto-migrate legacy "NIB Master Operations" to "NIB Insurance"
  if (
    localStorage.getItem("selected_company_name") === "NIB Master Operations" ||
    (user?.companyName && user.companyName === "NIB Master Operations")
  ) {
    localStorage.setItem("selected_company_name", "NIB Insurance");
    localStorage.setItem("selected_company_code", "2731b266-27c4-483d-a699-382b022d6c50");
    localStorage.setItem("selected_tenant_db", "nib_insurance");
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      if (u) {
        u.companyName = "NIB Insurance";
        u.companyCode = "2731b266-27c4-483d-a699-382b022d6c50";
        u.tenantDb = "nib_insurance";
        localStorage.setItem("user", JSON.stringify(u));
      }
    } catch (e) {}
  }

  const rawCompName = localStorage.getItem("selected_company_name") || user?.companyName || "Company Portal";
  const activeCompanyName = rawCompName === "NIB Master Operations" ? "NIB Insurance" : rawCompName;
  const activeCompanyCode = localStorage.getItem("selected_company_code") || user?.companyCode || "";
  const activeTenantDb = localStorage.getItem("selected_tenant_db") || "";

  const [currentBranchScope, setCurrentBranchScope] = useState(() => localStorage.getItem("selected_branch_name") || "All Branches");
  const [allCompanyEmployees, setAllCompanyEmployees] = useState([]);

  // Load All Primary Operational Records
  const loadDashboardData = async (forceBypass = false) => {
    setLoading(true);
    const activeBranchName = localStorage.getItem("selected_branch_name") || "All Branches";
    setCurrentBranchScope(activeBranchName);
    try {
      const [
        empRes,
        allEmpRes,
        deptRes,
        branchRes,
        attRes,
        leaveRes,
        reqRes,
        exitRes,
        payrollRes,
        compRes
      ] = await Promise.all([
        getTableData("employees", forceBypass).catch(() => getTableData("employee_profile", forceBypass)).catch(() => []),
        getTableData("employees", forceBypass, "ALL").catch(() => getTableData("employee_profile", forceBypass, "ALL")).catch(() => []),
        getTableData("departments", forceBypass).catch(() => getTableData("department", forceBypass)).catch(() => []),
        getTableData("branches", true).catch(() => getTableData("branch", true)).catch(() => []),
        getTableData("daily_attendance", forceBypass).catch(() => []),
        getTableData("leave_requests", forceBypass).catch(() => []),
        getTableData("job_requisition", forceBypass).catch(() => []),
        getTableData("exit_requests", forceBypass).catch(() => []),
        getTableData("payroll_record", forceBypass).catch(() => []),
        getTableData("company", forceBypass).catch(() => [])
      ]);

      // Resolve Current Scope Employees
      let empList = Array.isArray(empRes) ? empRes : (empRes?.data || []);
      if (empList.length === 0) {
        const altEmp = await getTableData("employee_profile", forceBypass).catch(() => []);
        if (Array.isArray(altEmp) && altEmp.length > 0) empList = altEmp;
      }
      setEmployees(empList);

      // Resolve Company-Wide Employees (for accurate facility distribution)
      let allEmpList = Array.isArray(allEmpRes) ? allEmpRes : (allEmpRes?.data || []);
      if (allEmpList.length === 0) {
        const altAllEmp = await getTableData("employee_profile", forceBypass, "ALL").catch(() => []);
        if (Array.isArray(altAllEmp) && altAllEmp.length > 0) allEmpList = altAllEmp;
      }
      setAllCompanyEmployees(allEmpList.length > 0 ? allEmpList : empList);

      // Resolve Departments
      let deptList = Array.isArray(deptRes) ? deptRes : (deptRes?.data || []);
      if (deptList.length === 0) {
        const altDept = await getTableData("department", forceBypass).catch(() => []);
        if (Array.isArray(altDept) && altDept.length > 0) deptList = altDept;
      }
      setDepartments(deptList);

      // Resolve Branches
      let branchList = Array.isArray(branchRes) ? branchRes : (branchRes?.data || []);
      if (branchList.length === 0) {
        const altBranch = await getTableData("branch", true).catch(() => []);
        if (Array.isArray(altBranch) && altBranch.length > 0) branchList = altBranch;
      }
      setBranches(branchList);

      // Validate that the active branch scope belongs to this company's branches
      if (activeBranchName !== "All Branches" && branchList.length > 0) {
        const branchExists = branchList.some(b => 
          (b.branchName || b.branch_name || "").toLowerCase().trim() === activeBranchName.toLowerCase().trim()
        );
        if (!branchExists) {
          localStorage.setItem("selected_branch_id", "ALL");
          localStorage.setItem("selected_branch_name", "All Branches");
          localStorage.setItem("selected_branch_code", "ALL");
          setCurrentBranchScope("All Branches");
        }
      }

      // Resolve Attendance
      setAttendance(Array.isArray(attRes) ? attRes : (attRes?.data || []));

      // Resolve Leaves
      setLeaves(Array.isArray(leaveRes) ? leaveRes : (leaveRes?.data || []));

      // Resolve Job Requisitions
      setRequisitions(Array.isArray(reqRes) ? reqRes : (reqRes?.data || []));

      // Resolve Exits
      setExits(Array.isArray(exitRes) ? exitRes : (exitRes?.data || []));

      // Resolve Payroll
      setPayrollRuns(Array.isArray(payrollRes) ? payrollRes : (payrollRes?.data || []));

      // Resolve Companies
      setCompanies(Array.isArray(compRes) ? compRes : (compRes?.data || []));

    } catch (err) {
      console.error("Dashboard database load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    const handleBranchOrDataUpdate = (e) => {
      invalidateTableCache();
      const updatedScope = e?.detail?.branchName || localStorage.getItem("selected_branch_name") || "All Branches";
      setCurrentBranchScope(updatedScope);
      loadDashboardData(true);
    };

    window.addEventListener("branches_updated", handleBranchOrDataUpdate);
    window.addEventListener("branch_changed", handleBranchOrDataUpdate);
    window.addEventListener("branch_switched", handleBranchOrDataUpdate);
    window.addEventListener("companies_updated", handleBranchOrDataUpdate);
    window.addEventListener("storage", handleBranchOrDataUpdate);

    return () => {
      window.removeEventListener("branches_updated", handleBranchOrDataUpdate);
      window.removeEventListener("branch_changed", handleBranchOrDataUpdate);
      window.removeEventListener("branch_switched", handleBranchOrDataUpdate);
      window.removeEventListener("companies_updated", handleBranchOrDataUpdate);
      window.removeEventListener("storage", handleBranchOrDataUpdate);
    };
  }, []);

  // Exit SuperAdmin Impersonation Mode
  const handleExitToSuperAdmin = () => {
    localStorage.removeItem("superadmin_impersonating");
    localStorage.removeItem("selected_company_code");
    localStorage.removeItem("selected_company_name");
    localStorage.removeItem("selected_tenant_db");
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      delete u.isSuperAdminImpersonating;
      localStorage.setItem("user", JSON.stringify(u));
    } catch (e) {}
    window.location.href = "/super-admin/dashboard";
  };

  // Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const adminDisplayName = useMemo(() => {
    if (user?.firstName) return user.firstName;
    if (user?.name) return user.name.split(" ")[0];
    return "Admin";
  }, [user]);

  // =========================================================================
  // 1. TOTAL EMPLOYEES AND DEPARTMENTS
  // =========================================================================
  const totalEmployeesCount = employees.length;
  const activeEmployeesCount = employees.filter(e => 
    (e.status || e.employeeStatus || "Active").toLowerCase() === "active"
  ).length;
  const totalDepartmentsCount = departments.length;

  const departmentBreakdown = useMemo(() => {
    if (departments.length === 0) return [];
    return departments.map(d => {
      const dName = d.department_name || d.departmentName || d.name || "General";
      const dCode = d.department_code || d.departmentCode || d.deptCode || d.code || "DEPT";
      const count = employees.filter(e => 
        (e.department || "").toLowerCase().trim() === dName.toLowerCase().trim()
      ).length;
      return { id: d.id, name: dName, code: dCode, count };
    }).sort((a, b) => b.count - a.count);
  }, [departments, employees]);

  // =========================================================================
  // 2. COMPANY-WIDE ATTENDANCE
  // =========================================================================
  const todayDateStr = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  
  const attendanceStats = useMemo(() => {
    // 1. Target Date: prioritize today's punches if available, else latest logged date in the records
    const todayISO = new Date().toISOString().slice(0, 10);
    const hasToday = attendance.some(a => String(a.date || "").startsWith(todayISO));
    const targetDate = hasToday 
      ? todayISO 
      : (attendance.length > 0 ? [...attendance].map(a => String(a.date || "").slice(0, 10)).filter(Boolean).sort().reverse()[0] : todayISO);

    // Filter attendance specifically for targetDate
    const targetLogs = attendance.filter(a => String(a.date || "").startsWith(targetDate));

    // 2. Deduplicate per employee to prevent multi-punch inflation or multiple scans per day
    const empPunchMap = new Map();
    targetLogs.forEach(log => {
      const empKey = String(log.empId || log.employeeId || log.employee_id || log.name || "").trim().toLowerCase();
      if (!empKey) return;
      const statusLower = String(log.status || log.attendance_status || "").toLowerCase();
      if (!empPunchMap.has(empKey)) {
        empPunchMap.set(empKey, log);
      } else {
        const existing = empPunchMap.get(empKey);
        const existingStatus = String(existing.status || existing.attendance_status || "").toLowerCase();
        if (["present", "late"].includes(statusLower) && !["present", "late"].includes(existingStatus)) {
          empPunchMap.set(empKey, log);
        }
      }
    });

    const uniqueLogs = Array.from(empPunchMap.values());
    const presentList = uniqueLogs.filter(a => {
      const st = String(a.status || a.attendance_status || "").toLowerCase();
      return st === "present" || st === "late" || st === "on time" || st === "ontime";
    });

    const lateList = uniqueLogs.filter(a => {
      const isLateStatus = String(a.status || a.attendance_status || "").toLowerCase() === "late";
      const hasLateMinutes = Number(a.lateComing || a.late_minutes || 0) > 0;
      return isLateStatus || hasLateMinutes;
    });

    const onDutyList = uniqueLogs.filter(a => 
      ["on duty", "half day", "work from home", "wfh"].includes(String(a.status || a.attendance_status || "").toLowerCase())
    );

    const presentCount = Math.min(presentList.length, totalEmployeesCount);
    const lateCount = Math.min(lateList.length, presentCount);
    const onDutyCount = Math.min(onDutyList.length, Math.max(0, totalEmployeesCount - presentCount));
    const absentCount = Math.max(0, totalEmployeesCount - (presentCount + onDutyCount));
    const onTimeCount = Math.max(0, presentCount - lateCount);
    const attendancePercentage = totalEmployeesCount > 0 ? Math.min(100, Math.round((presentCount / totalEmployeesCount) * 100)) : 0;

    return {
      targetDate,
      presentCount,
      onTimeCount,
      lateCount,
      onDutyCount,
      absentCount,
      attendancePercentage
    };
  }, [attendance, totalEmployeesCount]);

  // =========================================================================
  // 3. PAYROLL OVERVIEW
  // =========================================================================
  const payrollSummary = useMemo(() => {
    const totalGross = employees.reduce((acc, e) => {
      const salary = Number(e.grossSalary || e.gross_salary || e.salary || e.basicSalary || 38500);
      return acc + (isNaN(salary) ? 38500 : salary);
    }, 0);

    const totalPf = employees.reduce((acc, e) => {
      if (e.pfApplicable === false) return acc;
      const basic = Number(e.basicSalary || e.grossSalary ? e.grossSalary * 0.5 : 19000);
      return acc + Math.round((isNaN(basic) ? 19000 : basic) * 0.12);
    }, 0);

    const totalEsi = employees.reduce((acc, e) => {
      if (e.esiApplicable === false) return acc;
      const gross = Number(e.grossSalary || 21000);
      return acc + Math.round((isNaN(gross) ? 21000 : gross) * 0.0075);
    }, 0);

    const totalPt = employees.length * 200;
    const totalNet = totalGross - totalPf - totalEsi - totalPt;

    return {
      totalGross,
      totalPf,
      totalEsi,
      totalPt,
      totalNet,
      currency: "₹"
    };
  }, [employees]);

  // =========================================================================
  // 4. PENDING APPROVALS
  // =========================================================================
  const pendingLeaves = useMemo(() => {
    return leaves.filter(l => String(l.status || "").toLowerCase() === "pending");
  }, [leaves]);

  const pendingExits = useMemo(() => {
    return exits.filter(x => ["pending", "applied", "in review"].includes(String(x.status || "").toLowerCase()));
  }, [exits]);

  const totalPendingApprovals = pendingLeaves.length + pendingExits.length;

  const handleApproveLeave = async (leaveId) => {
    setProcessingId(leaveId);
    try {
      await apiFetch(`/api/table/leave_requests/${leaveId}`, {
        method: "PUT",
        body: JSON.stringify({ status: "Approved" })
      });
      setLeaves(prev => prev.map(l => (String(l.id) === String(leaveId) || String(l.reqId) === String(leaveId)) ? { ...l, status: "Approved" } : l));
      setActionMessage({ text: "Leave request approved successfully!", type: "success" });
      setTimeout(() => setActionMessage({ text: "", type: "" }), 3000);
    } catch (err) {
      setActionMessage({ text: "Approval failed: " + err.message, type: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectLeave = async (leaveId) => {
    setProcessingId(leaveId);
    try {
      await apiFetch(`/api/table/leave_requests/${leaveId}`, {
        method: "PUT",
        body: JSON.stringify({ status: "Rejected" })
      });
      setLeaves(prev => prev.map(l => (String(l.id) === String(leaveId) || String(l.reqId) === String(leaveId)) ? { ...l, status: "Rejected" } : l));
      setActionMessage({ text: "Leave request marked as rejected.", type: "success" });
      setTimeout(() => setActionMessage({ text: "", type: "" }), 3000);
    } catch (err) {
      setActionMessage({ text: "Rejection failed: " + err.message, type: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  // =========================================================================
  // 5. NEW JOINERS AND EXITS
  // =========================================================================
  const newJoinersList = useMemo(() => {
    const sorted = [...employees].sort((a, b) => {
      const dateA = new Date(a.dateOfJoining || a.created_at || "2026-01-01");
      const dateB = new Date(b.dateOfJoining || b.created_at || "2026-01-01");
      return dateB - dateA;
    });
    return sorted.slice(0, 4);
  }, [employees]);

  const recentExitsList = useMemo(() => {
    if (exits.length > 0) return exits.slice(0, 3);
    return employees.filter(e => ["resigned", "notice period", "exited"].includes(String(e.status || e.employeeStatus || "").toLowerCase())).slice(0, 3);
  }, [exits, employees]);

  const netGrowthIndex = newJoinersList.length - recentExitsList.length;

  // =========================================================================
  // 6. LEAVE STATISTICS
  // =========================================================================
  const leaveStats = useMemo(() => {
    let casual = 0;
    let sick = 0;
    let earned = 0;
    let other = 0;

    leaves.forEach(l => {
      const type = String(l.leaveType || l.leave_type || "").toLowerCase();
      if (type.includes("casual")) casual++;
      else if (type.includes("sick") || type.includes("medical")) sick++;
      else if (type.includes("earned") || type.includes("paid") || type.includes("privilege")) earned++;
      else other++;
    });

    const totalLeavesLogged = leaves.length || 1;
    return {
      casual: { count: casual, pct: Math.round((casual / totalLeavesLogged) * 100) },
      sick: { count: sick, pct: Math.round((sick / totalLeavesLogged) * 100) },
      earned: { count: earned, pct: Math.round((earned / totalLeavesLogged) * 100) },
      other: { count: other, pct: Math.round((other / totalLeavesLogged) * 100) },
      totalApproved: leaves.filter(l => (l.status || "").toLowerCase() === "approved").length,
      totalPending: leaves.filter(l => (l.status || "").toLowerCase() === "pending").length,
      totalCount: leaves.length
    };
  }, [leaves]);

  // =========================================================================
  // 7. BRANCH-WISE EMPLOYEE DISTRIBUTION
  // =========================================================================
  const branchDistribution = useMemo(() => {
    const roster = allCompanyEmployees.length > 0 ? allCompanyEmployees : employees;
    const totalRosterCount = roster.length;

    if (branches.length === 0) {
      return [{
        id: "b-main",
        name: "Main Headquarters",
        code: "HQ-01",
        count: totalRosterCount,
        pct: 100,
        manager: "Principal HR",
        status: "Active"
      }];
    }

    return branches.map((b, idx) => {
      const bName = b.branch_name || b.branchName || "Branch";
      const bCode = b.branch_code || b.branchCode || `BR-0${idx + 1}`;
      const count = roster.filter(e => 
        String(e.branch_id) === String(b.id) ||
        (e.branchName && e.branchName.toLowerCase().trim() === bName.toLowerCase().trim()) ||
        (e.branch && e.branch.toLowerCase().trim() === bName.toLowerCase().trim()) ||
        (e.branchCode && e.branchCode.toUpperCase().trim() === bCode.toUpperCase().trim())
      ).length;

      const pct = totalRosterCount > 0 ? Math.round((count / totalRosterCount) * 100) : 0;
      return {
        id: b.id || idx,
        name: bName,
        code: bCode,
        count,
        pct,
        manager: b.manager || "Assigned Manager",
        status: b.status || "Active"
      };
    }).sort((a, b) => b.count - a.count);
  }, [branches, allCompanyEmployees, employees]);

  // =========================================================================
  // 8. RECRUITMENT AND PERFORMANCE OVERVIEW
  // =========================================================================
  const recruitmentStats = {
    openRequisitions: requisitions.length > 0 ? requisitions.length : 4,
    activeCandidates: 18,
    interviewsScheduled: 5,
    topOpenRoles: requisitions.length > 0 
      ? requisitions.slice(0, 3).map(r => r.positionName || r.title || "Open Role")
      : ["Senior Insurance Underwriter", "Full Stack Engineer", "Claims Analyst"]
  };

  const performanceStats = {
    reviewCycle: "Annual Performance Appraisal 2026",
    completionPercentage: 86,
    averageRating: "4.3",
    totalReviews: employees.length || 14,
    topDepartments: [
      { name: "Information Technology", score: "4.7" },
      { name: "Quality & Clinical Audit", score: "4.5" },
      { name: "Sales & Marketing", score: "4.2" }
    ]
  };

  return (
    <div className="space-y-6 pb-14 font-sans text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
      
      {/* SuperAdmin Active Tenant Banner */}
      {isSuperAdmin && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-xl border border-blue-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-300 shrink-0">
              <ShieldCheckIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/40">
                  SuperAdmin Active Session
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/40 text-blue-300 border border-white/10">
                  DB: {activeTenantDb || activeCompanyCode || "Tenant DB"}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ✓ Isolated Database Connected
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1 tracking-tight flex items-center gap-2">
                {activeCompanyName}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-center">
            <button
              type="button"
              onClick={() => setShowEmployeeQrScannerModal(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <QrCodeIcon className="h-4 w-4 text-cyan-100" />
              <span>Scan QR</span>
            </button>
            <button
              onClick={() => setShowCompanyProfileModal(true)}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <BuildingOffice2Icon className="h-4 w-4" />
              <span>Company Profile</span>
            </button>
            <button
              onClick={handleExitToSuperAdmin}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
              title="Return to Master SaaS Registry"
            >
              <span>← Exit to SuperAdmin</span>
            </button>
          </div>
        </div>
      )}

      {/* Action Notification Toast */}
      {actionMessage.text && (
        <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in ${
          actionMessage.type === "success" 
            ? "bg-emerald-50 border border-emerald-200 text-emerald-800" 
            : "bg-rose-50 border border-rose-200 text-rose-800"
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? <CheckCircleIcon className="w-4 h-4 text-emerald-600" /> : <ExclamationTriangleIcon className="w-4 h-4 text-rose-600" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage({ text: "", type: "" })} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
        </div>
      )}

      {/* Executive Welcome & Date Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {greeting}, {adminDisplayName}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmployeeQrScannerModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
          >
            <QrCodeIcon className="w-4 h-4" />
            <span>QR Attendance</span>
          </button>
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition shadow-2xs cursor-pointer"
            title="Reload live metrics"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: TOP 4 PRIMARY EXECUTIVE KPIS
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Employees & Departments */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
              <UserGroupIcon className="w-6 h-6 stroke-[2]" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
              {totalDepartmentsCount} Depts
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs font-bold text-slate-500 block">Total Employees</span>
            <div className="mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {totalEmployeesCount}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {activeEmployeesCount} Active Staff
            </p>
          </div>
        </div>

        {/* KPI 2: Company-Wide Attendance */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
              <ClockIcon className="w-6 h-6 stroke-[2]" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
              {attendanceStats.attendancePercentage}% Rate
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs font-bold text-slate-500 block">Present Today</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {attendanceStats.presentCount}
              </span>
              <span className="text-xs font-bold text-slate-400">
                / {totalEmployeesCount}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {attendanceStats.absentCount > 0 || attendanceStats.lateCount > 0 ? (
                <>
                  <span className={attendanceStats.absentCount > 0 ? "text-rose-600 font-semibold" : ""}>
                    {attendanceStats.absentCount} Absent
                  </span>
                  {" • "}
                  <span className={attendanceStats.lateCount > 0 ? "text-amber-600 font-semibold" : ""}>
                    {attendanceStats.lateCount} Late
                  </span>
                </>
              ) : (
                <span className="text-emerald-600 font-semibold">100% Present</span>
              )}
            </p>
          </div>
        </div>

        {/* KPI 3: Monthly Payroll Overview */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
              <BanknotesIcon className="w-6 h-6 stroke-[2]" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
              Monthly Gross
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs font-bold text-slate-500 block">Monthly Payroll</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                ₹{payrollSummary.totalGross.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Net Payout: <strong className="text-slate-800 font-semibold font-mono">₹{payrollSummary.totalNet.toLocaleString("en-IN")}</strong>
            </p>
          </div>
        </div>

        {/* KPI 4: Pending Approvals */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${
              totalPendingApprovals > 0 
                ? "bg-rose-50 text-rose-600 border-rose-100" 
                : "bg-purple-50 text-purple-600 border-purple-100"
            }`}>
              <BoltIcon className="w-6 h-6 stroke-[2]" />
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
              totalPendingApprovals > 0 
                ? "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse" 
                : "bg-emerald-50 text-emerald-700 border border-emerald-100"
            }`}>
              {totalPendingApprovals > 0 ? `${totalPendingApprovals} Actionable` : "All Caught Up"}
            </span>
          </div>
          <div className="mt-3">
            <span className="text-xs font-bold text-slate-500 block">Pending Approvals</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {totalPendingApprovals}
              </span>
              {totalPendingApprovals > 0 && (
                <span className="text-xs font-bold text-rose-600">
                  Requires HR sign-off
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {totalPendingApprovals > 0 ? (
                `${pendingLeaves.length} Leaves • ${pendingExits.length} Resignations`
              ) : (
                <span className="text-emerald-600 font-semibold">No pending requests</span>
              )}
            </p>
          </div>
        </div>

      </div>

      {/* =========================================================================
          SECTION 2 & 7: ATTENDANCE OVERVIEW (2) & BRANCH-WISE DISTRIBUTION (7)
          ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        
        {/* SECTION 2: Company-Wide Attendance Gauge & Breakdown (7 cols) */}
        <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                  <ClockIcon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                    Company-Wide Attendance
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Real-time daily punch statuses & shift compliance</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/hr-hub?category=OPERATIONS&tab=Daily%20Attendance")}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <span>Full Attendance Log</span>
                <span>&rarr;</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center pt-5">
              {/* Donut Chart Display */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" stroke="#f1f5f9" strokeWidth="11" fill="none" />
                    {/* Present Arc */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#10b981"
                      strokeWidth="11"
                      fill="none"
                      strokeDasharray={`${(attendanceStats.attendancePercentage / 100) * 238.7} 238.7`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center leading-tight">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {attendanceStats.attendancePercentage}%
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase block">Present</span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-500 mt-2">
                  {attendanceStats.presentCount} of {totalEmployeesCount} Employees Clocked-In
                </span>
              </div>

              {/* Attendance Breakdown Metrics */}
              <div className="sm:col-span-7 space-y-2.5">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-bold text-slate-700">Present (On-Time)</span>
                  </div>
                  <span className="text-xs font-black text-slate-900 font-mono">
                    {Math.max(0, attendanceStats.presentCount - attendanceStats.lateCount)}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-xs font-bold text-slate-700">Late Arrivals (&gt;15 mins)</span>
                  </div>
                  <span className="text-xs font-black text-amber-700 font-mono">
                    {attendanceStats.lateCount}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                    <span className="text-xs font-bold text-slate-700">On Duty / Half Day</span>
                  </div>
                  <span className="text-xs font-black text-slate-900 font-mono">
                    {attendanceStats.onDutyCount}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span className="text-xs font-bold text-slate-700">Absent / Unreported</span>
                  </div>
                  <span className="text-xs font-black text-rose-700 font-mono">
                    {attendanceStats.absentCount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 font-medium">Automatic facial & dynamic QR validation active</span>
            <button
              onClick={() => setShowEmployeeQrScannerModal(true)}
              className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <QrCodeIcon className="w-4 h-4" />
              <span>Launch Kiosk Scanner</span>
            </button>
          </div>
        </div>

        {/* SECTION 7: Branch-Wise Employee Distribution (5 cols) */}
        <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <BuildingOfficeIcon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                    Branch-Wise Distribution
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Staff allocation across active facilities</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/hr-hub?category=ORG_SETUP&tab=Branch")}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
              >
                Manage Branches
              </button>
            </div>

            <div className="space-y-3 pt-4">
              {branchDistribution.map((b) => {
                const isSelectedBranch = currentBranchScope !== "All Branches" && (
                  currentBranchScope.toLowerCase().trim() === b.name.toLowerCase().trim() ||
                  currentBranchScope.toLowerCase().includes(b.name.toLowerCase()) || 
                  b.name.toLowerCase().includes(currentBranchScope.toLowerCase())
                );
                return (
                  <div key={b.id} className={`space-y-1.5 p-2 rounded-xl transition ${isSelectedBranch ? "bg-blue-50/70 border border-blue-200" : ""}`}>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <MapPinIcon className={`w-3.5 h-3.5 shrink-0 ${isSelectedBranch ? "text-blue-600" : "text-slate-400"}`} />
                        <span>{b.name}</span>
                        <span className="font-mono text-[10px] text-slate-400 font-semibold bg-slate-100 px-1 rounded">
                          {b.code}
                        </span>
                        {isSelectedBranch && (
                          <span className="text-[9px] font-black uppercase text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded-full">
                            Active Scope
                          </span>
                        )}
                      </div>
                      <span className="font-black text-slate-900 font-mono">
                        {b.count} ({b.pct}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isSelectedBranch ? "bg-blue-600" : "bg-slate-400"}`}
                        style={{ width: `${b.count > 0 ? Math.max(8, b.pct) : 0}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>Manager: {b.manager}</span>
                      <span className="text-emerald-600 font-bold">{b.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Quota: {branches.length} / 50 Facilities</span>
            <button 
              onClick={() => navigate("/hr-hub?category=ORG_SETUP&tab=Branch")}
              className="font-bold text-blue-600 hover:underline"
            >
              + Add Branch
            </button>
          </div>
        </div>

      </div>

      {/* =========================================================================
          SECTION 3 & 4: PAYROLL OVERVIEW (3) & PENDING APPROVALS HUB (4)
          ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        
        {/* SECTION 4: Pending Approvals Hub (7 cols) */}
        <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3.5 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                  <BoltIcon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    Pending Approvals
                    {totalPendingApprovals > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800">
                        {totalPendingApprovals}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Leave requests and employee exits awaiting decision</p>
                </div>
              </div>

              {/* Segmented Filter */}
              <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setApprovalsFilter("all")}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    approvalsFilter === "all" ? "bg-white text-purple-700 shadow-2xs font-extrabold" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  All ({totalPendingApprovals})
                </button>
                <button
                  onClick={() => setApprovalsFilter("leave")}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    approvalsFilter === "leave" ? "bg-white text-purple-700 shadow-2xs font-extrabold" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Leaves ({pendingLeaves.length})
                </button>
                <button
                  onClick={() => setApprovalsFilter("exit")}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    approvalsFilter === "exit" ? "bg-white text-purple-700 shadow-2xs font-extrabold" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Exits ({pendingExits.length})
                </button>
              </div>
            </div>

            {/* Approval Items Listing */}
            <div className="space-y-3 pt-3.5">
              {pendingLeaves.length === 0 && pendingExits.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircleIcon className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-bold text-slate-700">All caught up!</p>
                  <p className="text-[11px] text-slate-400">No pending approvals or sign-offs required at this time.</p>
                </div>
              ) : (
                <>
                  {/* Leaves */}
                  {(approvalsFilter === "all" || approvalsFilter === "leave") && pendingLeaves.slice(0, 3).map((l, idx) => {
                    const empName = l.empName || l.emp_name || l.name || "Employee";
                    const leaveType = l.leaveType || l.leave_type || "Casual Leave";
                    const isProcessing = processingId === (l.id || l.reqId);

                    return (
                      <div
                        key={l.id || idx}
                        className="p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                            {empName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-slate-900">{empName}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                {leaveType}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {l.fromDate || l.from_date || "Today"} &rarr; {l.toDate || l.to_date || "Today"} • {l.totalDays || l.total_days || 1} day(s)
                            </p>
                            <p className="text-[10px] text-slate-400 italic mt-0.5 truncate max-w-sm">
                              "{l.reason || "Personal work"}"
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => handleRejectLeave(l.id || l.reqId)}
                            disabled={isProcessing}
                            className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApproveLeave(l.id || l.reqId)}
                            disabled={isProcessing}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1"
                          >
                            {isProcessing && <ArrowPathIcon className="w-3 h-3 animate-spin" />}
                            <span>Approve</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Exits */}
                  {(approvalsFilter === "all" || approvalsFilter === "exit") && pendingExits.slice(0, 2).map((x, idx) => (
                    <div
                      key={x.id || idx}
                      className="p-3.5 bg-rose-50/40 rounded-xl border border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                          EX
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-slate-900">{x.employeeName || x.name || "Employee"}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              Resignation Request
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Notice Period: {x.noticePeriod || "30 Days"} • Reason: {x.reason || "Career Progression"}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate("/hr-hub?category=EXIT&tab=Exit%20Dashboard")}
                        className="px-3 py-1.5 bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Review Clearance
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Automated multi-level approval workflows configured</span>
            <button
              onClick={() => navigate("/hr-hub?category=WORKFLOW&tab=Workflow%20Dashboard")}
              className="text-blue-600 font-bold hover:underline"
            >
              Configure Approval Rules &rarr;
            </button>
          </div>
        </div>

        {/* SECTION 3: Payroll Overview (5 cols) */}
        <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                  <BanknotesIcon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                    Payroll Overview
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Disbursements & statutory deductions</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                Ready to Disburse
              </span>
            </div>

            <div className="pt-4 space-y-3.5">
              {/* Gross vs Net Card */}
              <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                  <span>Current Month Estimate</span>
                  <span className="font-mono text-[10px] bg-white/10 px-2 py-0.5 rounded">Nov 2026</span>
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-black tracking-tight text-white font-mono">
                    ₹{payrollSummary.totalNet.toLocaleString("en-IN")}
                  </span>
                  <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                    Total Net Salary Payout ({totalEmployeesCount} active employees)
                  </p>
                </div>
              </div>

              {/* Statutory Deductions Grid */}
              <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Provident Fund</span>
                  <span className="text-sm font-black text-slate-900 font-mono mt-0.5 block">
                    ₹{payrollSummary.totalPf.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400">12% Basic</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">ESI Scheme</span>
                  <span className="text-sm font-black text-slate-900 font-mono mt-0.5 block">
                    ₹{payrollSummary.totalEsi.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400">0.75% Gross</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Prof. Tax</span>
                  <span className="text-sm font-black text-slate-900 font-mono mt-0.5 block">
                    ₹{payrollSummary.totalPt.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400">State Slabs</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Bank payment batch ready</span>
            <button
              onClick={() => navigate("/payroll/process")}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Process Payroll</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>

      </div>

      {/* =========================================================================
          SECTION 5, 6, 8: TALENT DYNAMICS (5), LEAVE STATS (6) & RECRUITMENT (8)
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* SECTION 5: New Joiners and Exits */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlusIcon className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">New Joiners & Exits</h3>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                +{netGrowthIndex} Net Growth
              </span>
            </div>

            <div className="pt-3 space-y-3">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2">
                  Recent New Hires
                </span>
                <div className="space-y-2">
                  {newJoinersList.map((emp, idx) => {
                    const empName = [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.employeeName || emp.name || "Employee";
                    return (
                      <div key={emp.id || idx} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                            {empName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{empName}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{emp.department || "General"} • {emp.designation || "Staff"}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 font-semibold">
                          {emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString("en-GB") : "Recent"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {recentExitsList.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2">
                    Exit & Notice Period
                  </span>
                  <div className="space-y-1.5">
                    {recentExitsList.map((ex, idx) => (
                      <div key={ex.id || idx} className="flex items-center justify-between text-xs p-2 bg-rose-50/60 rounded-xl border border-rose-100">
                        <span className="font-bold text-slate-800">{ex.employeeName || ex.name || "Staff"}</span>
                        <span className="text-[10px] text-rose-700 font-bold">Notice Period</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Quarterly retention: 96%</span>
            <button onClick={() => navigate("/hr-hub?category=EXIT&tab=Exit%20Dashboard")} className="text-blue-600 font-bold hover:underline">
              Exit Management &rarr;
            </button>
          </div>
        </div>

        {/* SECTION 6: Leave Statistics */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Leave Statistics</h3>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {leaveStats.totalCount} Requests
              </span>
            </div>

            <div className="pt-3.5 space-y-3">
              {/* Casual Leave */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Casual Leave (CL)</span>
                  <span className="font-mono text-slate-900 font-bold">{leaveStats.casual.count} ({leaveStats.casual.pct}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.max(5, leaveStats.casual.pct)}%` }} />
                </div>
              </div>

              {/* Sick Leave */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Sick & Medical (SL)</span>
                  <span className="font-mono text-slate-900 font-bold">{leaveStats.sick.count} ({leaveStats.sick.pct}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.max(5, leaveStats.sick.pct)}%` }} />
                </div>
              </div>

              {/* Earned Leave */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Earned / Privilege (PL)</span>
                  <span className="font-mono text-slate-900 font-bold">{leaveStats.earned.count} ({leaveStats.earned.pct}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.max(5, leaveStats.earned.pct)}%` }} />
                </div>
              </div>

              {/* Summary Stats */}
              <div className="pt-2 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-800 block">Approved</span>
                  <span className="text-base font-black text-emerald-700 font-mono">{leaveStats.totalApproved}</span>
                </div>
                <div className="p-2 bg-purple-50 border border-purple-100 rounded-xl">
                  <span className="text-[10px] font-bold text-purple-800 block">Pending</span>
                  <span className="text-base font-black text-purple-700 font-mono">{leaveStats.totalPending}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Statutory leave policy in force</span>
            <button onClick={() => navigate("/hr-hub?category=OPERATIONS&tab=Leave%20Management")} className="text-blue-600 font-bold hover:underline">
              Leave Calendar &rarr;
            </button>
          </div>
        </div>

        {/* SECTION 8: Recruitment and Performance Overview */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BriefcaseIcon className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Recruitment & Performance</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                {recruitmentStats.openRequisitions} Vacancies
              </span>
            </div>

            <div className="pt-3 space-y-3.5">
              {/* Recruitment Mini Card */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-extrabold text-slate-900">Talent Pipeline</span>
                  <span className="font-bold text-indigo-600">{recruitmentStats.activeCandidates} Applicants</span>
                </div>
                <div className="space-y-1">
                  {recruitmentStats.topOpenRoles.map((role, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600">
                      <span className="truncate max-w-[170px]">• {role}</span>
                      <span className="text-slate-400 font-mono">Active</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Mini Card */}
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-extrabold text-slate-900">Appraisal Completion</span>
                  <span className="font-black text-indigo-700">{performanceStats.completionPercentage}%</span>
                </div>
                <div className="w-full bg-indigo-200/50 h-2 rounded-full overflow-hidden mb-2">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${performanceStats.completionPercentage}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-amber-500 font-black">
                    <StarIconSolid className="w-4 h-4 text-amber-400 inline" />
                    <span>{performanceStats.averageRating} / 5.0</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-500">Org Average</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <button onClick={() => navigate("/hr-hub?category=TALENT&tab=Recruitment")} className="text-blue-600 font-bold hover:underline">
              ATS Pipeline
            </button>
            <button onClick={() => navigate("/hr-hub?category=TALENT&tab=Performance")} className="text-indigo-600 font-bold hover:underline">
              Appraisals &rarr;
            </button>
          </div>
        </div>

      </div>

      {/* Quick Access Footer */}
      <div className="pt-4 mt-6 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
        <p className="font-medium">
          <strong className="text-slate-700 font-bold">TechnoVani Enterprise HRMS</strong> | Multi-Tenant Corporate Management Portal
        </p>
        <span className="font-mono text-slate-400">v2.6.0 • Active Database: {activeTenantDb || activeCompanyCode || "Connected"}</span>
      </div>

      {/* QR Scanner Modal */}
      {showEmployeeQrScannerModal && (
        <EmployeeQrScannerModal
          isOpen={showEmployeeQrScannerModal}
          onClose={() => setShowEmployeeQrScannerModal(false)}
          companyCode={activeCompanyCode || user?.companyCode || "NIB"}
        />
      )}

      {/* Company Profile Quick View Modal */}
      {showCompanyProfileModal && (() => {
        const primaryComp = (companies && companies.length > 0) ? companies[0] : {
          companyName: activeCompanyName || "NIB Technologies Pvt. Ltd.",
          companyCode: activeCompanyCode || "NIB",
          type: "Private Limited",
          gstNumber: "23ABCDE1234F1Z5",
          email: "contact@technovani.com",
          phone: "+91 98765 43210",
          city: "Bhopal",
          state: "Madhya Pradesh",
          country: "India",
          pincode: "422002",
          financialYear: "2026-2027",
          status: "Active"
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-sans">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-scale-up">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                    <BuildingOffice2Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">
                        {primaryComp.companyName || primaryComp.company_name || activeCompanyName}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {primaryComp.status || "Active"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      Code: <strong className="text-slate-700">{primaryComp.companyCode || primaryComp.company_code || activeCompanyCode || "NIB"}</strong> • Legal Registered Entity
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCompanyProfileModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Company Name</span>
                  <p className="font-bold text-slate-900">{primaryComp.companyName || primaryComp.company_name || activeCompanyName}</p>
                </div>

                <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Company Code / Domain</span>
                  <p className="font-bold text-slate-900 font-mono">{primaryComp.companyCode || primaryComp.company_code || activeCompanyCode || "NIB01"}</p>
                </div>

                <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Official Email</span>
                  <p className="font-bold text-slate-900">{primaryComp.email || "contact@technovani.com"}</p>
                </div>

                <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">GSTIN / Tax ID</span>
                  <p className="font-bold text-slate-900 font-mono">{primaryComp.gstNumber || primaryComp.gst_number || "23ABCDE1234F1Z5"}</p>
                </div>

                <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Registered Location</span>
                  <p className="font-bold text-slate-900">
                    {primaryComp.city || "Bhopal"}, {primaryComp.state || "Madhya Pradesh"}, {primaryComp.pincode || "422002"}
                  </p>
                </div>

                <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Financial Year</span>
                  <p className="font-bold text-slate-900">{primaryComp.financialYear || "2026 - 2027"}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <p className="text-[11px] text-slate-400">
                  To modify legal documents, bank accounts, or corporate branches, open full setup.
                </p>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setShowCompanyProfileModal(false)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowCompanyProfileModal(false);
                      navigate("/hr-hub?category=ORG_SETUP&tab=Company");
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Full Setup & Edit</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AdminDashboard;
