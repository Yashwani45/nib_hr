import React, { useEffect, useMemo, useState } from "react";
import {
  UserGroupIcon,
  BuildingOffice2Icon,
  BriefcaseIcon,
  ClockIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  PresentationChartBarIcon,
  RectangleStackIcon,
  ShieldCheckIcon,
  EyeIcon,
  PencilSquareIcon,
  ArrowTopRightOnSquareIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
  SparklesIcon,
  ArrowPathIcon,
  UserIcon,
  CheckBadgeIcon,
  ComputerDesktopIcon
} from "@heroicons/react/24/outline";
import { Badge, Card, DynamicTable } from "../components/ui";
import { apiFetch } from "../services/hrApi";
import { useAuth } from "../auth/AuthProvider";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import DepartmentDashboard from "../components/Department/DepartmentDashboard";

const getStatusVariant = (status) => {
  if (["Active", "Approved", "Processed", "Open", "Hired"].includes(status)) return "success";
  if (["Pending", "Trial", "Draft", "Screening", "Interviewing"].includes(status)) return "warning";
  if (["Deactive", "Rejected", "Terminated", "Suspended", "Closed"].includes(status)) return "danger";
  return "neutral";
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dbData = useSelector((state) => state.hr.dbData) || {};

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

  const [currentTime, setCurrentTime] = useState(new Date());

  // Database Data States
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [assetAllocations, setAssetAllocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // SuperAdmin Tenant Context Detection
  const isSuperAdmin = user?.role === "SuperAdmin" || localStorage.getItem("superadmin_impersonating") === "true";
  const activeCompanyName = localStorage.getItem("selected_company_name") || user?.companyName || "Company Portal";
  const activeCompanyCode = localStorage.getItem("selected_company_code") || user?.companyCode || "";
  const activeTenantDb = localStorage.getItem("selected_tenant_db") || "";

  // Employee Directory Filtering & Modal States
  const [empSearch, setEmpSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [inspectingEmployee, setInspectingEmployee] = useState(null);
  const [inspectingTab, setInspectingTab] = useState("official");

  // Live Timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all dashboard stats dynamically
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [
        empRes, 
        leaveRes, 
        attendanceRes, 
        reqRes,
        deptRes,
        branchRes,
        salaryRes,
        assetRes
      ] = await Promise.all([
        apiFetch("/api/table/employee_profile"),
        apiFetch("/api/table/leave_requests"),
        apiFetch("/api/table/daily_attendance"),
        apiFetch("/api/table/job_requisition"),
        apiFetch("/api/table/department"),
        apiFetch("/api/table/branch"),
        apiFetch("/api/table/salary_structure"),
        apiFetch("/api/table/asset_allocation").catch(() => ({ data: [] }))
      ]);

      let empList = (empRes?.success && Array.isArray(empRes.data)) ? empRes.data : [];
      if (empList.length === 0) {
        const altEmpRes = await apiFetch("/api/table/employees").catch(() => null);
        if (altEmpRes?.data && Array.isArray(altEmpRes.data) && altEmpRes.data.length > 0) {
          empList = altEmpRes.data;
        }
      }
      setEmployees(empList);
      if (leaveRes?.success && leaveRes.data) setLeaves(leaveRes.data);
      if (attendanceRes?.success && attendanceRes.data) setAttendance(attendanceRes.data);
      if (reqRes?.success && reqRes.data) setRequisitions(reqRes.data);
      if (deptRes?.success && deptRes.data) setDepartments(deptRes.data);
      if (branchRes?.success && branchRes.data) setBranches(branchRes.data);
      if (salaryRes?.success && salaryRes.data) setSalaries(salaryRes.data);
      if (assetRes?.data && Array.isArray(assetRes.data)) setAssetAllocations(assetRes.data);
    } catch (err) {
      console.error("Dashboard database load error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
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
    window.location.href = "/super-admin";
  };

  // Helper to normalize employee fields and parse profileData JSON
  const normalizeEmployee = (emp) => {
    if (!emp) return {};
    let profileData = {};
    try {
      if (emp.profileData && typeof emp.profileData === "string") {
        profileData = JSON.parse(emp.profileData);
      } else if (emp.profileData && typeof emp.profileData === "object") {
        profileData = emp.profileData;
      }
    } catch (e) {}

    const firstName = emp.firstName || profileData.firstName || "";
    const lastName = emp.lastName || profileData.lastName || "";
    const fullName = emp.employeeName || emp.employee_name || `${firstName} ${lastName}`.trim() || emp.name || "Employee";
    const empCode = emp.employeeCode || emp.employee_code || emp.emp_code || emp.id?.slice(0, 8) || "--";
    const email = emp.companyEmail || emp.company_email || emp.email || profileData.officialEmail || profileData.email || "--";
    const mobile = emp.mobileNumber || emp.mobile_number || emp.mobile || emp.phone || profileData.mobileNumber || "--";
    const department = emp.department || profileData.department || "Operations";
    const designation = emp.designation || profileData.designation || "Staff Member";
    const status = emp.employmentStatus || emp.status || "Active";
    const dateOfJoining = emp.dateOfJoining || emp.date_of_joining || profileData.dateOfJoining || "--";

    return {
      ...profileData,
      ...emp,
      id: emp.id,
      fullName,
      firstName: firstName || fullName.split(" ")[0],
      lastName: lastName || fullName.split(" ").slice(1).join(" "),
      empCode,
      email,
      mobile,
      department,
      designation,
      status,
      dateOfJoining,
      profileData
    };
  };

  // Normalized list of filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.map(normalizeEmployee).filter(emp => {
      const search = empSearch.toLowerCase().trim();
      const matchesSearch = !search || 
        emp.fullName.toLowerCase().includes(search) ||
        String(emp.empCode).toLowerCase().includes(search) ||
        String(emp.email).toLowerCase().includes(search) ||
        String(emp.mobile).toLowerCase().includes(search) ||
        String(emp.department).toLowerCase().includes(search) ||
        String(emp.designation).toLowerCase().includes(search);

      const matchesDept = deptFilter === "ALL" || String(emp.department).toLowerCase() === deptFilter.toLowerCase();
      const matchesStatus = statusFilter === "ALL" || String(emp.status).toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, empSearch, deptFilter, statusFilter]);

  // Unique departments for filter dropdown
  const uniqueDepartments = useMemo(() => {
    const list = departments.map(d => d.deptName || d.dept_name || d.name).filter(Boolean);
    employees.forEach(e => {
      if (e.department) list.push(e.department);
    });
    return Array.from(new Set(list));
  }, [departments, employees]);

  // Calculation parameters
  const stats = useMemo(() => {
    const activeLeaves = leaves.filter(l => l.status === "Pending").length;
    const openReqs = requisitions.filter(r => r.status === "Open").length || requisitions.length;
    
    return [
      { title: "Workforce Size", value: employees.length, helper: "Total Active profiles", icon: UserGroupIcon, color: "text-blue-600 bg-blue-50 border border-blue-100" },
      { title: "Active Branches", value: branches.length, helper: "Regional workspaces", icon: BuildingOffice2Icon, color: "text-indigo-600 bg-indigo-50 border border-indigo-100" },
      { title: "Departments", value: departments.length, helper: "Operational groupings", icon: RectangleStackIcon, color: "text-slate-600 bg-slate-50 border border-slate-100" },
      { title: "Hiring Vacancies", value: openReqs, helper: "Open job requisitions", icon: BriefcaseIcon, color: "text-amber-600 bg-amber-50 border border-amber-100" },
      { title: "Leave Requests", value: leaves.length, helper: `${activeLeaves} pending review`, icon: CalendarDaysIcon, color: "text-red-600 bg-red-50 border border-red-100" },
      { title: "Payroll Configs", value: salaries.length, helper: "Active salary structures", icon: BanknotesIcon, color: "text-emerald-600 bg-emerald-50 border border-emerald-100" },
    ];
  }, [employees, leaves, requisitions, departments, branches, salaries]);

  // Tables Columns definitions
  const requisitionColumns = [
    { key: "jobTitle", label: "Job Position" },
    { key: "department", label: "Department" },
    { key: "vacancies", label: "Vacancies", render: (val) => <span className="font-bold">{val} seats</span> },
    { key: "status", label: "Status", render: (val) => <Badge variant={getStatusVariant(val)}>{val}</Badge> }
  ];

  const leaveColumns = [
    { key: "employeeName", label: "Employee Name", render: (val, row) => <span>{val || row.employee || "Anonymous"}</span> },
    { key: "leaveType", label: "Leave Type" },
    { key: "fromDate", label: "From Date" },
    { key: "status", label: "Status", render: (val) => <Badge variant={getStatusVariant(val)}>{val}</Badge> }
  ];

  const attendanceColumns = [
    { key: "name", label: "Employee" },
    { key: "date", label: "Date" },
    { key: "checkIn", label: "Check-In" },
    { key: "checkOut", label: "Check-Out" },
    { key: "status", label: "Status", render: (val) => <Badge variant={getStatusVariant(val)}>{val}</Badge> }
  ];

  return (
    <div className="space-y-6">
      {/* 1. SuperAdmin Active Tenant Impersonation Banner */}
      {isSuperAdmin && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 sm:p-5 rounded-3xl shadow-xl border border-blue-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-blue-500/20 border border-blue-400/30 rounded-2xl text-blue-300 shrink-0">
              <ShieldCheckIcon className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/40">
                  SuperAdmin Portal Access Active
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/40 text-blue-300 border border-white/10">
                  DB: {activeTenantDb || activeCompanyCode || "Tenant DB"}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ✓ Isolated Database Connected
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight flex items-center gap-2">
                {activeCompanyName}
              </h2>
              <p className="text-xs text-blue-200/80 mt-0.5 max-w-2xl">
                Full operational privileges active. You have unrestricted access to all {employees.length} employees, insider records, payroll setups, attendance, and corporate assets.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-center">
            <a
              href="#workforce-directory"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
            >
              <UserGroupIcon className="h-4 w-4" />
              <span>Employees ({employees.length})</span>
            </a>
            <button
              onClick={() => navigate("/hr-hub?category=ORG_SETUP&tab=Department")}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition flex items-center gap-1.5"
            >
              <BuildingOffice2Icon className="h-4 w-4" />
              <span>Org Setup</span>
            </button>
            <button
              onClick={() => navigate("/hr-hub?category=PAYROLL&tab=Payroll%20Process")}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition flex items-center gap-1.5"
            >
              <BanknotesIcon className="h-4 w-4" />
              <span>Payroll</span>
            </button>
            <button
              onClick={handleExitToSuperAdmin}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
              title="Return to Master SaaS Registry"
            >
              <span>← Exit to SuperAdmin</span>
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Top Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">HR Command Center</h1>
          <p className="text-slate-500 text-sm mt-1">
            Live corporate statistics, employee allocations, and operational controls for <strong className="text-slate-700">{activeCompanyName}</strong>.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 border border-slate-200/60 shadow-sm sm:w-auto">
          <ClockIcon className="h-5 w-5 text-blue-600 animate-pulse" />
          <div className="min-w-0">
            <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Live System Time</p>
            <p className="font-bold text-slate-700 text-xs">{currentTime.toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-xs text-slate-500 font-semibold mt-3">Compiling corporate dashboard metrics...</span>
        </div>
      ) : (
        <>
          {/* Key Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-5">
            {stats.map((card, idx) => {
              const Icon = card.icon;
              return (
                <Card key={idx} variant="elevated" padding="medium" className="hover:shadow-md transition">
                  <div className="flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{card.title}</p>
                      <div className={`p-1.5 rounded-lg ${card.color}`}>
                        <Icon className="h-5 w-5 shrink-0" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-black text-slate-800">{card.value}</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">{card.helper}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* 2. Workforce Directory & Employee Insides Card */}
          <div id="workforce-directory" className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header & Controls */}
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/60">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <UserGroupIcon className="w-5 h-5 text-blue-600" />
                    <span>Workforce Directory & Employee Insides</span>
                  </h2>
                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-black rounded-full">
                    {filteredEmployees.length} of {employees.length} Profiles
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspect comprehensive insider details, official data, contacts, identity docs, assets, attendance, and salary profiles.
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search Bar */}
                <div className="relative min-w-[220px]">
                  <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search name, code, email, role..."
                    value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs font-medium"
                  />
                  {empSearch && (
                    <button
                      onClick={() => setEmpSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Department Filter */}
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
                >
                  <option value="ALL">All Departments</option>
                  {uniqueDepartments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Deactive">Deactive / Suspended</option>
                </select>

                {/* Refresh Button */}
                <button
                  onClick={loadDashboardData}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition shadow-2xs cursor-pointer"
                  title="Reload employee directory"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-extrabold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Employee Details</th>
                    <th className="py-3 px-4">Dept & Designation</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">Joining & Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Inspect Insides</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp) => {
                      return (
                        <tr key={emp.id} className="hover:bg-blue-50/40 transition group">
                          {/* 1. Employee Photo & Name */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {emp.photo ? (
                                <img
                                  src={emp.photo}
                                  alt={emp.fullName}
                                  className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 uppercase shadow-2xs">
                                  {emp.firstName?.[0] || ""}{emp.lastName?.[0] || ""}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-black text-slate-900 truncate text-xs">{emp.fullName}</p>
                                <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  {emp.empCode}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Department & Designation */}
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-800 truncate">{emp.designation}</p>
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 mt-0.5">
                              🏢 {emp.department}
                            </span>
                          </td>

                          {/* 3. Contact Info */}
                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              <p className="flex items-center gap-1 text-[11px] text-slate-600 truncate">
                                <EnvelopeIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{emp.email}</span>
                              </p>
                              <p className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
                                <PhoneIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{emp.mobile}</span>
                              </p>
                            </div>
                          </td>

                          {/* 4. Joining & Type */}
                          <td className="py-3 px-4">
                            <p className="text-slate-800 font-semibold">{emp.dateOfJoining}</p>
                            <span className="text-[10px] text-slate-400">
                              {emp.employeeType || "Full Time"}
                            </span>
                          </td>

                          {/* 5. Status */}
                          <td className="py-3 px-4">
                            <Badge variant={getStatusVariant(emp.status)}>{emp.status}</Badge>
                          </td>

                          {/* 6. Action Buttons */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* View Insides Button */}
                              <button
                                onClick={() => {
                                  setInspectingEmployee(emp);
                                  setInspectingTab("official");
                                }}
                                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-lg font-bold text-xs transition flex items-center gap-1 shadow-2xs cursor-pointer"
                                title="Inspect all insider details (statutory, bank, assets, attendance)"
                              >
                                <EyeIcon className="w-3.5 h-3.5" />
                                <span>View Insides</span>
                              </button>

                              {/* Open Direct Employee Portal */}
                              <button
                                onClick={() => navigate(`/employee/dashboard?profileEmpId=${emp.id}`)}
                                className="p-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-lg transition shadow-2xs cursor-pointer"
                                title="Open full Employee Workspace"
                              >
                                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit in HR Hub */}
                              <button
                                onClick={() => navigate(`/hr-hub?category=EMPLOYEE_MGMT&tab=Employee%20Profile&empId=${emp.id}`)}
                                className="p-1.5 bg-slate-100 hover:bg-amber-600 hover:text-white text-slate-600 rounded-lg transition shadow-2xs cursor-pointer"
                                title="Edit employee record in HR Hub"
                              >
                                <PencilSquareIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        <UserGroupIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="text-xs font-semibold">No employee records match the active filters in this company.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Central Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Recent Job Openings */}
            <Card title="Active Job Requisitions" subtitle="Hiring and applicant status overview" className="xl:col-span-2 shadow-sm">
              <DynamicTable 
                columns={requisitionColumns} 
                data={requisitions.slice(0, 4)} 
                pagination={false} 
                emptyMessage="No job requisitions are currently active in the database." 
              />
            </Card>

            {/* Quick Metrics checklist */}
            <Card title="Corporate Overview" subtitle="System records checklists" className="xl:col-span-1 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                  <span className="text-xs font-semibold text-slate-600">Active branches</span>
                  <Badge variant="success">{branches.length} Registered</Badge>
                </div>
                <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                  <span className="text-xs font-semibold text-slate-600">Configured departments</span>
                  <Badge variant="primary">{departments.length} Active</Badge>
                </div>
                <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                  <span className="text-xs font-semibold text-slate-600">Total staff employee profiles</span>
                  <Badge variant="neutral">{employees.length} Profiles</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Hiring vacancies active</span>
                  <Badge variant="warning">{requisitions.reduce((acc, curr) => acc + (Number(curr.vacancies) || 0), 0)} Open</Badge>
                </div>
              </div>
            </Card>
          </div>

          {/* Bottom Stream Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Live Attendance stream */}
            <Card title="Workforce Attendance Logs" subtitle="Daily clock-in logs and shifts" className="shadow-sm">
              <DynamicTable 
                columns={attendanceColumns} 
                data={attendance.slice(0, 4)} 
                pagination={false} 
                emptyMessage="No attendance records logged today." 
              />
            </Card>

            {/* Recent Leave Requests */}
            <Card title="Recent Leave Requests" subtitle="Leave tracker alerts" className="shadow-sm">
              <DynamicTable 
                columns={leaveColumns} 
                data={leaves.slice(0, 4)} 
                pagination={false} 
                emptyMessage="No leave requests are currently pending review." 
              />
            </Card>
          </div>
        </>
      )}

      {/* 3. Comprehensive Employee Insides Inspector Modal */}
      {inspectingEmployee && (() => {
        const emp = inspectingEmployee;
        // Filter assets matching this employee
        const empAssets = assetAllocations.filter(a => {
          const itemEmpId = a.empId || a.employeeId || "";
          const itemEmployee = a.employee || a.employeeName || a.employee_name || "";
          return (
            (itemEmpId && String(itemEmpId).toLowerCase().trim() === String(emp.empCode).toLowerCase().trim()) ||
            (itemEmpId && String(itemEmpId).toLowerCase().trim() === String(emp.id).toLowerCase().trim()) ||
            (itemEmployee && String(itemEmployee).toLowerCase().trim() === String(emp.fullName).toLowerCase().trim())
          );
        });

        // Filter attendance for this employee
        const empAtt = attendance.filter(a => {
          const aId = a.empId || a.employeeId || "";
          const aName = a.name || a.employee || "";
          return (
            (aId && String(aId).toLowerCase().trim() === String(emp.empCode).toLowerCase().trim()) ||
            (aId && String(aId).toLowerCase().trim() === String(emp.id).toLowerCase().trim()) ||
            (aName && String(aName).toLowerCase().trim() === String(emp.fullName).toLowerCase().trim())
          );
        });

        // Filter leaves for this employee
        const empLeaves = leaves.filter(l => {
          const lId = l.employeeId || l.empId || "";
          const lName = l.employeeName || l.employee || "";
          return (
            (lId && String(lId).toLowerCase().trim() === String(emp.empCode).toLowerCase().trim()) ||
            (lId && String(lId).toLowerCase().trim() === String(emp.id).toLowerCase().trim()) ||
            (lName && String(lName).toLowerCase().trim() === String(emp.fullName).toLowerCase().trim())
          );
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs animate-fade-in font-sans">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
              
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white shrink-0">
                <div className="flex items-center gap-4">
                  {emp.photo ? (
                    <img
                      src={emp.photo}
                      alt={emp.fullName}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-400 shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-black text-xl flex items-center justify-center border-2 border-indigo-400/40 shrink-0 uppercase shadow-md">
                      {emp.firstName?.[0] || ""}{emp.lastName?.[0] || ""}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-white tracking-tight">{emp.fullName}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                        {emp.status}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-300 font-bold mt-0.5">
                      {emp.designation} • 🏢 {emp.department}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300 mt-1">
                      <span>Code: <strong className="text-white font-bold">{emp.empCode}</strong></span>
                      <span>•</span>
                      <span>ID: <span className="text-slate-400">{emp.id?.slice(0, 12)}...</span></span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setInspectingEmployee(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                  title="Close Inspector"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Inspector Sub-Tabs Navigation */}
              <div className="flex items-center gap-1 px-4 py-2 bg-slate-50 border-b border-slate-200 overflow-x-auto shrink-0 scrollbar-none text-xs font-bold">
                {[
                  { id: "official", label: "🏢 Official Info" },
                  { id: "personal", label: "👤 Personal & Contact" },
                  { id: "statutory", label: "🪪 Identity & Statutory" },
                  { id: "payroll", label: "💳 Bank & Payroll" },
                  { id: "assets", label: `💻 Assigned Assets (${empAssets.length})` },
                  { id: "attendance", label: `⏱️ Attendance & Leaves (${empAtt.length + empLeaves.length})` }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setInspectingTab(tab.id)}
                    className={`px-3.5 py-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
                      inspectingTab === tab.id
                        ? "bg-blue-600 text-white shadow-xs font-black"
                        : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Modal Body / Tab Panes */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
                {/* 1. Official Info Tab */}
                {inspectingTab === "official" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-slate-200 p-4 rounded-2xl space-y-3 bg-white shadow-2xs">
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider border-b pb-2 border-slate-100 flex items-center gap-1.5">
                        <span>🏢</span> Corporate Allocations
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Department</span>
                          <span className="font-bold text-slate-800">{emp.department || "--"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Designation</span>
                          <span className="font-bold text-slate-800">{emp.designation || "--"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Branch / Location</span>
                          <span className="font-bold text-slate-800">{emp.branch || emp.workLocation || "Main HQ"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Reporting Manager</span>
                          <span className="font-bold text-slate-800">{emp.reportingManager || "--"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-200 p-4 rounded-2xl space-y-3 bg-white shadow-2xs">
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider border-b pb-2 border-slate-100 flex items-center gap-1.5">
                        <span>📅</span> Employment Tenures
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Date of Joining</span>
                          <span className="font-bold text-slate-800">{emp.dateOfJoining || "--"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Employment Type</span>
                          <span className="font-bold text-slate-800">{emp.employeeType || "Full Time"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Confirmation Date</span>
                          <span className="font-bold text-slate-800">{emp.confirmationDate || "--"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Shift Schedule</span>
                          <span className="font-bold text-slate-800">{emp.shift || "General Shift (09:00 - 18:00)"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Personal & Contact Tab */}
                {inspectingTab === "personal" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-slate-200 p-4 rounded-2xl space-y-3 bg-white shadow-2xs">
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider border-b pb-2 border-slate-100 flex items-center gap-1.5">
                        <span>👤</span> Personal Demographics
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Gender</span>
                          <span className="font-bold text-slate-800">{emp.gender || "--"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Date of Birth</span>
                          <span className="font-bold text-slate-800">{emp.dateOfBirth || emp.dob || "--"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Marital Status</span>
                          <span className="font-bold text-slate-800">{emp.maritalStatus || "--"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Blood Group</span>
                          <span className="font-bold text-slate-800">{emp.bloodGroup || "--"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-200 p-4 rounded-2xl space-y-3 bg-white shadow-2xs">
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider border-b pb-2 border-slate-100 flex items-center gap-1.5">
                        <span>📞</span> Contact & Addresses
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Official Email</span>
                          <span className="font-bold text-blue-600">{emp.email}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Personal Email</span>
                          <span className="font-bold text-slate-700">{emp.personalEmail || "--"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Mobile Phone</span>
                          <span className="font-bold text-slate-800">{emp.mobile}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Permanent Address</span>
                          <span className="font-bold text-slate-700">{emp.permanentAddress || emp.currentAddress || emp.address1 || "--"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Statutory & Identity Tab */}
                {inspectingTab === "statutory" && (
                  <div className="border border-slate-200 p-5 rounded-2xl space-y-4 bg-white shadow-2xs">
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider border-b pb-2 border-slate-100 flex items-center gap-1.5">
                      <span>🪪</span> Official Government Identifiers
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Aadhaar Card No.</span>
                        <span className="font-mono font-black text-slate-800">{emp.aadhaarNumber || emp.aadhaar || "--"}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">PAN Card No.</span>
                        <span className="font-mono font-black text-slate-800">{emp.panNumber || emp.pan || "--"}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">UAN Number</span>
                        <span className="font-mono font-black text-slate-800">{emp.uanNumber || emp.uan || "--"}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">ESIC Number</span>
                        <span className="font-mono font-black text-slate-800">{emp.esicNumber || emp.esic || "--"}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Passport Number</span>
                        <span className="font-mono font-black text-slate-800">{emp.passportNumber || "--"}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Driving License</span>
                        <span className="font-mono font-black text-slate-800">{emp.drivingLicense || "--"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Bank & Payroll Tab */}
                {inspectingTab === "payroll" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-slate-200 p-4 rounded-2xl space-y-3 bg-white shadow-2xs">
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider border-b pb-2 border-slate-100 flex items-center gap-1.5">
                        <span>🏦</span> Banking Remittance Profile
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Bank Name</span>
                          <span className="font-bold text-slate-800">{emp.bankName || "--"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">A/C Holder Name</span>
                          <span className="font-bold text-slate-800">{emp.accountHolderName || emp.fullName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Account Number</span>
                          <span className="font-mono font-bold text-slate-800">{emp.accountNumber || "--"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">IFSC Code</span>
                          <span className="font-mono font-bold text-slate-800">{emp.ifscCode || "--"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-200 p-4 rounded-2xl space-y-3 bg-white shadow-2xs">
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider border-b pb-2 border-slate-100 flex items-center gap-1.5">
                        <span>💰</span> Salary & CTC Structure
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Structure Model</span>
                          <span className="font-bold text-slate-800">{emp.salaryStructure || "Standard Corporate"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Annual CTC</span>
                          <span className="font-black text-emerald-600">{emp.ctc ? `₹${Number(emp.ctc).toLocaleString()}` : "--"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Basic Monthly Salary</span>
                          <span className="font-bold text-slate-800">{emp.basicSalary ? `₹${Number(emp.basicSalary).toLocaleString()}` : "--"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Gross Monthly Salary</span>
                          <span className="font-bold text-slate-800">{emp.grossSalary ? `₹${Number(emp.grossSalary).toLocaleString()}` : "--"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Assigned Assets Tab */}
                {inspectingTab === "assets" && (
                  <div className="border border-slate-200 p-5 rounded-2xl space-y-3 bg-white shadow-2xs">
                    <div className="flex items-center justify-between border-b pb-2.5 border-slate-100">
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                        <ComputerDesktopIcon className="w-4 h-4 text-indigo-600" />
                        <span>Corporate Hardware & Assigned Assets</span>
                      </h4>
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-full">
                        {empAssets.length} Assets Assigned
                      </span>
                    </div>

                    {empAssets.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                              <th className="p-2">Asset Code</th>
                              <th className="p-2">Asset Name & Model</th>
                              <th className="p-2">Category</th>
                              <th className="p-2">Serial Number</th>
                              <th className="p-2">Assigned Date</th>
                              <th className="p-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {empAssets.map((asset, idx) => (
                              <tr key={asset.id || idx} className="hover:bg-slate-50">
                                <td className="p-2 font-mono font-bold text-indigo-600">{asset.assetCode || "--"}</td>
                                <td className="p-2 font-bold text-slate-800">{asset.assetName || asset.model || "Hardware Asset"}</td>
                                <td className="p-2">{asset.assetCategory || asset.category || "General"}</td>
                                <td className="p-2 font-mono">{asset.serialNumber || asset.serialNo || "--"}</td>
                                <td className="p-2">{asset.assignedDate || asset.issueDate || "--"}</td>
                                <td className="p-2">
                                  <Badge variant="success">{asset.status || "Assigned"}</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-slate-400">
                        <ComputerDesktopIcon className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                        <p className="text-xs">No physical or digital assets currently assigned to this employee profile.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. Attendance & Leaves Tab */}
                {inspectingTab === "attendance" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Attendance Logs */}
                    <div className="border border-slate-200 p-4 rounded-2xl space-y-3 bg-white shadow-2xs">
                      <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                          <ClockIcon className="w-4 h-4 text-blue-600" />
                          <span>Recent Attendance Logs</span>
                        </h4>
                        <span className="text-[10px] font-bold text-slate-500">{empAtt.length} Total Logs</span>
                      </div>
                      {empAtt.length > 0 ? (
                        <div className="space-y-2">
                          {empAtt.slice(0, 5).map((a, idx) => (
                            <div key={idx} className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                              <div>
                                <span className="font-bold text-slate-800">{a.date}</span>
                                <p className="text-[10px] text-slate-500">In: {a.checkIn || "--"} | Out: {a.checkOut || "--"}</p>
                              </div>
                              <Badge variant={getStatusVariant(a.status)}>{a.status || "Present"}</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 text-center py-6 text-xs">No attendance entries recorded for this employee.</p>
                      )}
                    </div>

                    {/* Leave Applications */}
                    <div className="border border-slate-200 p-4 rounded-2xl space-y-3 bg-white shadow-2xs">
                      <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                          <CalendarDaysIcon className="w-4 h-4 text-amber-600" />
                          <span>Leave Records</span>
                        </h4>
                        <span className="text-[10px] font-bold text-slate-500">{empLeaves.length} Applications</span>
                      </div>
                      {empLeaves.length > 0 ? (
                        <div className="space-y-2">
                          {empLeaves.slice(0, 5).map((l, idx) => (
                            <div key={idx} className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                              <div>
                                <span className="font-bold text-slate-800">{l.leaveType || "Casual Leave"}</span>
                                <p className="text-[10px] text-slate-500">From: {l.fromDate} To: {l.toDate || l.fromDate}</p>
                              </div>
                              <Badge variant={getStatusVariant(l.status)}>{l.status || "Pending"}</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 text-center py-6 text-xs">No leave applications filed by this employee.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="text-[11px] text-slate-500 font-medium">
                  Persisted HRMS record • Tenant: <strong className="text-slate-800">{activeCompanyName}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/employee/dashboard?profileEmpId=${emp.id}`)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>🚀 Launch Employee Portal</span>
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/hr-hub?category=EMPLOYEE_MGMT&tab=Employee%20Profile&empId=${emp.id}`)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                    <span>Edit Profile in HR Hub</span>
                  </button>
                  <button
                    onClick={() => setInspectingEmployee(null)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Close
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
