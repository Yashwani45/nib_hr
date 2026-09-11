import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { hrSchemas } from "../database/hrConsolidationData";
import {
  getTableData,
  createTableRecord,
  updateTableRecord,
  deleteTableRecord
} from "../services/hrApi";
import {
  setDbData,
  setLoading,
  setSelectedCategory,
  setSelectedModule,
  setSelectedTab,
  setViewMode,



  


  


  
  setSearchText,
  setShowSchema,
  setCheckedInState,
  updateTableRecord as reduxUpdateTableRecord,
  deleteTableRecord as reduxDeleteTableRecord,
  createTableRecord as reduxCreateTableRecord
} from "../redux/hrSlice";
import AdminDashboard from "./AdminDashboard";
import EmployeeDashboard from "./EmployeeDashboard";

import Company from "../components/CoreSetup/Company";
import Branch from "../components/CoreSetup/Branch";
import Department from "../components/CoreSetup/Department";
import Designation from "../components/CoreSetup/Designation";
import BusinessUnit from "../components/CoreSetup/BusinessUnit";
import CostCenter from "../components/CoreSetup/CostCenter";
import ReportingHierarchy from "../components/CoreSetup/ReportingHierarchy";
import OrganizationalChart from "../components/CoreSetup/OrganizationalChart";
import EmployeeProfile from "../components/CoreSetup/EmployeeProfile";
import AssetAllocation from "../components/CoreSetup/AssetAllocation";

import { useAuth } from "../auth/AuthProvider";
import { updateUserProfile } from "../redux/authSlice";


// Category: Department
import DepartmentDashboard from "../components/Department/DepartmentDashboard";

// Category: TalentLMS
import JobRequisition from "../components/TalentLMS/JobRequisition";
import CandidateDatabase from "../components/TalentLMS/CandidateDatabase";
import ATSApplicantTracking from "../components/TalentLMS/ATSApplicantTracking";
import KpiOkr from "../components/TalentLMS/KpiOkr";
import PerformanceReviews from "../components/TalentLMS/PerformanceReviews";
import Courses from "../components/TalentLMS/Courses";
import LmsProgress from "../components/TalentLMS/LmsProgress";
import LearningDashboard from "../components/TalentLMS/LearningDashboard";
import PerformanceMaster from "../components/TalentLMS/PerformanceMaster";
import PerformanceDashboard from "../components/TalentLMS/PerformanceDashboard";
import PerformanceKpi from "../components/TalentLMS/PerformanceKpi";
import PerformanceGoals from "../components/TalentLMS/PerformanceGoals";
import PerformanceAppraisals from "../components/TalentLMS/PerformanceAppraisals";
import PerformancePromotions from "../components/TalentLMS/PerformancePromotions";
import PerformanceIncrements from "../components/TalentLMS/PerformanceIncrements";
import PerformanceReports from "../components/TalentLMS/PerformanceReports";
import RecruitmentDashboard from "../components/TalentLMS/RecruitmentDashboard";
import JobPosting from "../components/TalentLMS/JobPosting";
import ResumeParsing from "../components/TalentLMS/ResumeParsing";
import Interview from "../components/TalentLMS/Interview";
import OfferLetter from "../components/TalentLMS/OfferLetter";
import Onboarding from "../components/TalentLMS/Onboarding";
import Joining from "../components/TalentLMS/Joining";

// Category: OperationsAssets
import DailyAttendance from "../components/OperationsAssets/DailyAttendance";
import AttendanceDashboard from "../components/OperationsAssets/AttendanceDashboard";
import AttendanceRegularizationAdmin from "../components/OperationsAssets/AttendanceRegularizationAdmin";
import AttendanceReportsAdmin from "../components/OperationsAssets/AttendanceReportsAdmin";
import ShiftMaster from "../components/OperationsAssets/ShiftMaster";
import LeaveTypes from "../components/OperationsAssets/LeaveTypes";
import LeaveRequests from "../components/OperationsAssets/LeaveRequests";
import LeaveDashboard from "../components/OperationsAssets/LeaveDashboard";
import LeaveReports from "../components/OperationsAssets/LeaveReports";
import LeaveBalanceReports from "../components/OperationsAssets/LeaveBalanceReports";
import Inventory from "../components/OperationsAssets/Inventory";
import HolidayMaster from "../components/OperationsAssets/HolidayMaster";
import OvertimeMaster from "../components/OperationsAssets/OvertimeMaster";

// Category: FinanceCompliance
import SalaryStructure from "../components/FinanceCompliance/SalaryStructure";
import PayrollProcess from "../components/FinanceCompliance/PayrollProcess";
import PayslipManagement from "../components/FinanceCompliance/PayslipManagement";
import LoanManagement from "../components/FinanceCompliance/LoanManagement";
import ESIManagement from "../components/FinanceCompliance/ESIManagement";
import ProfessionalTax from "../components/FinanceCompliance/ProfessionalTax";
import PayrollReports from "../components/FinanceCompliance/PayrollReports";
import IncentivesClaims from "../components/FinanceCompliance/IncentivesClaims";
import PfRegistry from "../components/FinanceCompliance/PfRegistry";
import TaxDeclarations from "../components/FinanceCompliance/TaxDeclarations";
import ExpenseClaims from "../components/FinanceCompliance/ExpenseClaims";
import ExitLogs from "../components/FinanceCompliance/ExitLogs";
import ApprovalsPending from "../components/FinanceCompliance/ApprovalsPending";
import BonusMaster from "../components/FinanceCompliance/BonusMaster";
import TdsMaster from "../components/FinanceCompliance/TdsMaster";
import BankDetailsDashboard from "../components/FinanceCompliance/BankDetailsDashboard";

// Category: SupportEngagement
import DocumentLog from "../components/SupportEngagement/DocumentLog";
import ExitWorkspace from "../components/SupportEngagement/ExitWorkspace";
import AnnouncementsSurveys from "../components/SupportEngagement/AnnouncementsSurveys";
import HrTickets from "../components/SupportEngagement/HrTickets";
import ComplaintManagement from "../components/SupportEngagement/ComplaintManagement";
import QueryResolution from "../components/SupportEngagement/QueryResolution";
import ServiceRequests from "../components/SupportEngagement/ServiceRequests";
import TicketTracking from "../components/SupportEngagement/TicketTracking";
import Logs from "../components/SupportEngagement/Logs";
import EmailNotifications from "../components/SupportEngagement/EmailNotifications";
import SmsNotifications from "../components/SupportEngagement/SmsNotifications";
import PushNotifications from "../components/SupportEngagement/PushNotifications";
import ApprovalAlerts from "../components/SupportEngagement/ApprovalAlerts";
import RbacRoles from "../components/SupportEngagement/RbacRoles";
import AuditLogs from "../components/SupportEngagement/AuditLogs";
import LoginHistory from "../components/SupportEngagement/LoginHistory";
// Dedicated Enterprise Dashboards
import ExitDashboard from "../components/Exit/ExitDashboard";
import WorkflowDashboard from "../components/Workflow/WorkflowDashboard";
import HelpdeskDashboard from "../components/Helpdesk/HelpdeskDashboard";
import ReportsDashboard from "../components/Reports/ReportsDashboard";
import NotificationsDashboard from "../components/Notifications/NotificationsDashboard";
import SettingsDashboard from "../components/Settings/SettingsDashboard";
import EngagementDashboard from "../components/Engagement/EngagementDashboard";
import {
  ShieldCheckIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  ReceiptPercentIcon,
  ChatBubbleLeftRightIcon,
  ComputerDesktopIcon,
  PresentationChartBarIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  InboxStackIcon,
  TicketIcon,
  BellIcon,
  PaperClipIcon
} from "@heroicons/react/24/outline";

// Premium Payroll Process dashboard list view
const PayrollProcessDashboard = ({ records, onOpenEdit, onDelete }) => {
  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Payroll Computations</h3>
        <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5 font-bold">Total: {records.length} Records</span>
      </div>

      <div className="space-y-3">
        {records.map((row) => {
          const netVal = Number(row.netSalary || 0).toLocaleString('en-IN');
          const grossVal = Number(row.grossSalary || 0).toLocaleString('en-IN');
          const dedVal = Number(row.totalDeductions || 0).toLocaleString('en-IN');
          
          return (
            <div 
              key={row.id} 
              className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md hover:border-slate-200/80 transition-all duration-200"
            >
              {/* Left: Icon & Employee Details */}
              <div className="flex items-center gap-3 min-w-[200px]">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-extrabold text-sm shrink-0 border border-indigo-100">
                  ₹
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    {row.employee || "Unknown Employee"}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5 mt-0.5">
                    <span>{row.employeeCode || "No Code"}</span>
                    <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                    <span>{row.department || "General"}</span>
                  </p>
                </div>
              </div>

              {/* Middle: Month & Salary Structure */}
              <div className="min-w-[120px]">
                <p className="text-xs text-slate-600 font-extrabold">
                  {row.payrollMonth || "January"} {row.payrollYear || "2024"}
                </p>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                  {row.payrollType || "Monthly"} • {row.salaryStructure || "Standard"}
                </p>
              </div>

              {/* Middle: Calculations */}
              <div className="min-w-[140px]">
                <p className="text-xs text-slate-600 font-bold">
                  Gross: <span className="text-slate-800 font-semibold">₹{grossVal}</span>
                </p>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                  Deductions: <span className="text-red-500 font-semibold">-₹{dedVal}</span>
                </p>
              </div>

              {/* Net Salary Highlight */}
              <div className="min-w-[100px]">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Net Payout</span>
                <span className="font-extrabold text-indigo-600 text-sm mt-0.5 block">
                  ₹{netVal}
                </span>
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-2 min-w-[130px]">
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                  row.payrollStatus === "Completed" 
                    ? "bg-green-50 text-green-700 border-green-200" 
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {row.payrollStatus || "Draft"}
                </span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                  row.paymentStatus === "Paid" 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                    : "bg-red-50 text-red-700 border-red-200"
                }`}>
                  {row.paymentStatus || "Pending"}
                </span>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 self-end md:self-auto">
                <button
                  onClick={() => onOpenEdit(row)}
                  className="p-1.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"
                  title="Edit Record"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(row.id)}
                  className="p-1.5 rounded-lg border border-slate-100 hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                  title="Delete Record"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Premium Asset Allocation dashboard list view matching high-fidelity layout
const AssetAllocationDashboard = ({ records = [], onOpenEdit, onDelete, dbData = [] }) => {
  const { user } = useAuth();
  const employees = dbData["employees"] || dbData["employee_profile"] || dbData["Employee Profile"] || [];

  // Filter records prop if user is standard Employee
  const userRole = typeof user?.role === "object" ? user?.role?.name : user?.role;
  const isEmployee = String(userRole || "").toLowerCase().trim() === "employee";
  const emailLower = String(user?.email || "").toLowerCase().trim();
  const isAdminEmail = emailLower.includes("admin") || emailLower.includes("yashtech");
  const shouldFilter = isEmployee || !isAdminEmail;
  
  const filteredInputRecords = useMemo(() => {
    if (!shouldFilter) return records;
    



    // Find matched profile
    const currentUserProfile = employees.find(e => {
      const dbEmail = String(e.email || "").toLowerCase().trim();
      const loginEmail = String(user?.email || "").toLowerCase().trim();
      const dbUsername = dbEmail.split('@')[0];
      const loginUsername = loginEmail.split('@')[0];
      return dbEmail === loginEmail || 
             (dbUsername && loginUsername && dbUsername === loginUsername) ||
             (e.companyEmail && String(e.companyEmail).toLowerCase().trim() === loginEmail) ||
             (e.employeeCode && user?.username && String(e.employeeCode).toLowerCase().trim() === String(user.username).toLowerCase().trim());
    });
    
    const empId = currentUserProfile?.employeeCode || currentUserProfile?.emp_code || "";
    if (!empId) {
      // Fallback check by display name split if profile is somehow missing
      const fallbackName = String(user?.email || "").split("@")[0].toLowerCase().trim();
      return records.filter(r => 
        String(r.employee || "").toLowerCase().includes(fallbackName)
      );
    }
    return records.filter(r => String(r.empId || "").toLowerCase().trim() === String(empId).toLowerCase().trim());
  }, [records, isEmployee, employees, user]);

  // Filter States
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDept, setFilterDept] = useState("All");
  const [searchEmployee, setSearchEmployee] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Pagination states
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Stats Calculator
  const stats = useMemo(() => {
    const total = filteredInputRecords.length;
    const assigned = filteredInputRecords.filter(r => r.status === "Assigned").length;
    const available = filteredInputRecords.filter(r => r.status === "Available" || r.status === "Returned").length;
    const maintenance = filteredInputRecords.filter(r => r.status === "Maintenance" || r.status === "Under Maintenance").length;
    const retired = filteredInputRecords.filter(r => r.status === "Retired" || r.status === "Scrapped").length;
    return { total, assigned, available, maintenance, retired };
  }, [filteredInputRecords]);

  // Unique lists for filters
  const categories = ["All", "Laptop", "Mobile", "SIM Card", "ID Card", "Access Card", "Software License", "Other"];
  const departments = useMemo(() => {
    const set = new Set(filteredInputRecords.map(r => r.department).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [filteredInputRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return filteredInputRecords.filter(r => {
      const typeMatch = filterType === "All" || String(r.assetCategory || "").toLowerCase() === filterType.toLowerCase();
      const statusMatch = filterStatus === "All" || String(r.status || "").toLowerCase() === filterStatus.toLowerCase();
      const deptMatch = filterDept === "All" || String(r.department || "").toLowerCase() === filterDept.toLowerCase();
      
      const empName = String(r.employee || r.name || "").toLowerCase();
      const empIdVal = String(r.empId || "").toLowerCase();
      const assetNameVal = String(r.assetName || "").toLowerCase();
      const searchLower = searchEmployee.toLowerCase();
      
      const empMatch = !searchEmployee || 
                        empName.includes(searchLower) || 
                        empIdVal.includes(searchLower) || 
                        assetNameVal.includes(searchLower);
                        
      return typeMatch && statusMatch && deptMatch && empMatch;
    });
  }, [filteredInputRecords, filterType, filterStatus, filterDept, searchEmployee]);

  // Paginated records
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRecords.slice(startIndex, startIndex + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;

  const handleReset = () => {
    setFilterType("All");
    setFilterStatus("All");
    setFilterDept("All");
    setSearchEmployee("");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Dynamic Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Assets */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
            📦
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Assets</span>
            <span className="text-lg font-black text-slate-800 block">{stats.total}</span>
          </div>
        </div>

        {/* Assigned */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-bold text-sm shrink-0">
            ✓
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Assigned</span>
            <span className="text-lg font-black text-slate-800 block">{stats.assigned}</span>
          </div>
        </div>

        {/* Available */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
            ★
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Available</span>
            <span className="text-lg font-black text-slate-800 block">{stats.available}</span>
          </div>
        </div>

        {/* Under Maintenance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm shrink-0">
            🛠
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Maintenance</span>
            <span className="text-lg font-black text-slate-800 block">{stats.maintenance}</span>
          </div>
        </div>

        {/* Retired */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm shrink-0">
            ✕
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Retired</span>
            <span className="text-lg font-black text-slate-800 block">{stats.retired}</span>
          </div>
        </div>
      </div>

      {/* 2. Filters Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Advanced Filters</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search employee / asset */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Search Asset / User</label>
            <input 
              type="text" 
              placeholder="Enter name, code or S/N..."
              value={searchEmployee}
              onChange={e => setSearchEmployee(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Asset Category */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Asset Category</label>
            <select 
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-750 focus:outline-none"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Allocation Status</label>
            <select 
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-750 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Assigned">Assigned</option>
              <option value="Available">Available / Returned</option>
              <option value="Maintenance">Under Maintenance</option>
              <option value="Retired">Retired / Scrapped</option>
            </select>
          </div>

          {/* Department */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Department</label>
            <select 
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-750 focus:outline-none"
            >
              {departments.map(dept => <option key={dept} value={dept}>{dept === "All" ? "All Departments" : dept}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button 
            onClick={handleReset}
            className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            Reset
          </button>
          <button 
            className="px-4 py-2 bg-indigo-605 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-1.2 0-2.4.4-3.4 1.2L3.2 8.4C2.5 9 2.1 9.8 2.1 10.7V19c0 1.1.9 2 2 2h15.8c1.1 0 2-.9 2-2v-8.3c0-.9-.4-1.7-1.1-2.3l-5.4-4.2c-1-.8-2.2-1.2-3.4-1.2z" />
            </svg>
            Apply Filters
          </button>
        </div>
      </div>

      {/* 3. Category tabs & Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap gap-1 bg-slate-50 p-1 rounded-xl border">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setFilterType(cat); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterType === cat 
                    ? "bg-white text-indigo-600 shadow-xs border border-slate-100" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                }`}
              >
                {cat === "All" ? "All Assets" : cat}
              </button>
            ))}
          </div>

          {/* Page size entries */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-slate-50 border rounded-lg px-2 py-1 focus:outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>
        </div>

        {/* 4. Table Layout matching the second image */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bold text-slate-600">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] tracking-wider">
                <th className="py-3 px-2 w-8"><input type="checkbox" className="rounded border-slate-300" /></th>
                <th className="py-3">Asset Code</th>
                <th>Asset Name</th>
                <th>Asset Type</th>
                <th>Category</th>
                <th>Assigned To</th>
                <th>Purchase Date</th>
                <th>Warranty Expiry</th>
                <th>Status</th>
                <th className="text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRecords.map(row => {
                const matchedEmp = employees.find(e => 
                  String(e.employeeCode || e.emp_code || e.id).toLowerCase() === String(row.empId).toLowerCase()
                );
                
                return (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-2"><input type="checkbox" className="rounded border-slate-350" /></td>
                    <td className="font-mono text-slate-800 text-[11px]">{row.assetCode || "AST-LAP-001"}</td>
                    <td className="text-slate-800 font-extrabold">{row.assetName || "Dell Laptop"}</td>
                    <td>{row.assetCategory || "Laptop"}</td>
                    <td>{row.assetCategory || "Laptop"}</td>
                    {/* Employee Profile Cell */}
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                          {matchedEmp?.photo ? (
                            <img src={matchedEmp.photo} alt="Avatar" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[10px]">👤</span>
                          )}
                        </div>
                        <div>
                          <span className="block text-slate-700 font-black truncate max-w-[120px]">
                            {row.employee || "Unassigned"}
                          </span>
                          <span className="block text-[9px] text-slate-400">
                            {row.empId ? `${row.empId} • ${row.department || "IT"}` : "Available"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>{row.issueDate || "10-01-2025"}</td>
                    <td>{row.warrantyExpiry || "09-01-2027"}</td>
                    <td>
                      <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase ${
                        row.status === "Assigned" ? "bg-green-50 text-green-700 border border-green-150" :
                        row.status === "Available" || row.status === "Returned" ? "bg-blue-50 text-blue-700 border border-blue-150" :
                        row.status === "Maintenance" ? "bg-orange-50 text-orange-700 border border-orange-150" :
                        "bg-red-50 text-red-700 border border-red-150"
                      }`}>
                        {row.status || "Assigned"}
                      </span>
                    </td>
                    {/* Action Column */}
                    <td className="text-right pr-4">
                      <div className="inline-flex items-center gap-1.5">
                        {/* View Action */}
                        <button
                          onClick={() => setSelectedAsset(row)}
                          className="p-1.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50 text-blue-500 hover:text-blue-700 transition"
                          title="View Details"
                        >
                          👁
                        </button>
                        {/* Edit Action */}
                        <button
                          onClick={() => onOpenEdit(row)}
                          className="p-1.5 rounded-lg border border-slate-100 hover:border-green-200 hover:bg-green-50 text-green-500 hover:text-green-700 transition"
                          title="Edit Record"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        {/* Delete Action */}
                        <button
                          onClick={() => onDelete(row.id)}
                          className="p-1.5 rounded-lg border border-slate-100 hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                          title="Delete Record"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedRecords.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-slate-400 font-bold">No assets found matching the criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-xs font-bold text-slate-400">
          <span>Showing {filteredRecords.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredRecords.length)} of {filteredRecords.length} entries</span>
          <div className="flex gap-1">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-2.5 py-1.5 border rounded-lg hover:bg-slate-50 disabled:opacity-50 transition"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1.5 rounded-lg border transition ${
                  currentPage === i + 1 ? "bg-indigo-600 text-white border-indigo-600" : "hover:bg-slate-50 text-slate-600"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-2.5 py-1.5 border rounded-lg hover:bg-slate-50 disabled:opacity-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* 6. View Specs Overlay Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white p-4 rounded-xl border border-slate-150 max-w-md w-full shadow-xl space-y-3 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex justify-between items-start border-b pb-1.5 border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">Asset Specification Details</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Code: {selectedAsset.assetCode || "AST-LAP-001"}
                </p>
              </div>
              <button 
                onClick={() => setSelectedAsset(null)}
                className="text-slate-400 hover:text-slate-600 font-black text-sm"
              >
                ✕
              </button>
            </div>

            {/* Asset Header Info */}
            <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0">
                {String(selectedAsset.assetCategory || "AS").substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-850">{selectedAsset.assetName}</h4>
                <p className="text-[10px] text-slate-500 font-black">
                  Type: {selectedAsset.assetCategory || "General"} {selectedAsset.model ? `• Model: ${selectedAsset.model}` : ""}
                </p>
                <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                  Assigned User: {selectedAsset.employee || "Unassigned"} ({selectedAsset.empId || "N/A"})
                </p>
              </div>
            </div>

            {/* Specifications Details Grid */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-650">
              <div className="border p-2 rounded-lg bg-slate-50/20">
                <span className="text-[8px] text-slate-450 block uppercase tracking-wider">Serial Number</span>
                <span className="text-slate-800 font-extrabold mt-0.5 block truncate">{selectedAsset.serialNumber || "N/A"}</span>
              </div>
              <div className="border p-2 rounded-lg bg-slate-50/20">
                <span className="text-[8px] text-slate-450 block uppercase tracking-wider">Operating System</span>
                <span className="text-slate-800 font-extrabold mt-0.5 block truncate">{selectedAsset.operatingSystem || selectedAsset.os || "N/A"}</span>
              </div>
              <div className="border p-2 rounded-lg bg-slate-50/20">
                <span className="text-[8px] text-slate-450 block uppercase tracking-wider">Processor</span>
                <span className="text-slate-800 font-extrabold mt-0.5 block truncate">{selectedAsset.processor || "N/A"}</span>
              </div>
              <div className="border p-2 rounded-lg bg-slate-50/20">
                <span className="text-[8px] text-slate-450 block uppercase tracking-wider">Memory (RAM)</span>
                <span className="text-slate-800 font-extrabold mt-0.5 block truncate">{selectedAsset.memory || "N/A"}</span>
              </div>
              <div className="border p-2 rounded-lg bg-slate-50/20">
                <span className="text-[8px] text-slate-450 block uppercase tracking-wider">Storage Capacity</span>
                <span className="text-slate-800 font-extrabold mt-0.5 block truncate">{selectedAsset.storage || "N/A"}</span>
              </div>
              <div className="border p-2 rounded-lg bg-slate-50/20">
                <span className="text-[8px] text-slate-450 block uppercase tracking-wider">Display Specs</span>
                <span className="text-slate-800 font-extrabold mt-0.5 block truncate">{selectedAsset.display || "N/A"}</span>
              </div>
              <div className="border p-2 rounded-lg bg-slate-50/20">
                <span className="text-[8px] text-slate-450 block uppercase tracking-wider">Graphics Card</span>
                <span className="text-slate-800 font-extrabold mt-0.5 block truncate">{selectedAsset.graphicsCard || "N/A"}</span>
              </div>
              <div className="border p-2 rounded-lg bg-slate-50/20">
                <span className="text-[8px] text-slate-450 block uppercase tracking-wider">Color / Aesthetics</span>
                <span className="text-slate-800 font-extrabold mt-0.5 block truncate">{selectedAsset.color || "N/A"}</span>
              </div>
            </div>

            {/* Additional info */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px] font-bold text-slate-500 space-y-0.5">
              <p><span className="font-extrabold text-slate-700">Allocation Status:</span> {selectedAsset.status || "Assigned"}</p>
              <p><span className="font-extrabold text-slate-700">Purchase/Issue Date:</span> {selectedAsset.issueDate || "N/A"}</p>
              <p><span className="font-extrabold text-slate-700">Warranty Expiry:</span> {selectedAsset.warrantyExpiry || "N/A"}</p>
              <p><span className="font-extrabold text-slate-700">Company:</span> {selectedAsset.company || "Yash Technologies"}</p>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button 
                onClick={() => setSelectedAsset(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow-xs transition"
              >
                Close Specifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Categories mapping modules together for a cleaner Sidebar experience
const CATEGORIES = {
  CORE: {
    label: "Core & Setup",
    icon: BuildingOffice2Icon,
    modules: ["1. Organization Setup", "2. Employee Management", "10. ESS & MSS", "20. Security & Admin"]
  },
  TALENT: {
    label: "Talent & LMS",
    icon: AcademicCapIcon,
    modules: ["3. Recruitment & Onboarding", "8. Performance Management", "9. Learning & Development"]
  },
  OPERATIONS: {
    label: "Operations & Assets",
    icon: ClockIcon,
    modules: ["4. Attendance & Shift", "5. Leave Management", "11. Asset Management"]
  },
  FINANCE: {
    label: "Finance & Compliance",
    icon: ReceiptPercentIcon,
    modules: ["6. Payroll & Compensation", "7. Statutory & Tax", "12. Travel & Expense", "14. Employee Exit", "15. Workflow & Approval"]
  },
  SUPPORT: {
    label: "Support & Engagement",
    icon: ChatBubbleLeftRightIcon,
    modules: ["13. Document Management", "16. Employee Engagement", "17. Helpdesk & HR Ticketing", "19. Notifications", "18. Reports & Analytics", "21. Settings & Configuration"]
  },
  DEPARTMENT: {
    label: "Department",
    icon: UserGroupIcon,
    modules: ["Department Workspace"]
  }
};

// Maps frontend tab names to MySQL database table names
const tabToSqlTableMap = {
  "Company": "company",
  "Branch": "branch",
  "Department": "department",
  "Designation": "designation",
  "Designation Master": "designation",
  "Designation Workspace": "designation",
  "Business Unit": "business_unit",
  "Cost Center": "cost_center",
  "Reporting Hierarchy": "reporting_hierarchy",
  "Employee Profile": "employees",
  "Employee List": "employees",
  "Add Employee": "employees",
  "Job Requisition": "job_requisition",
  "Candidate Database": "candidate_database",
  "ATS (Applicant Tracking)": "ats_applicant_tracking",
  "Recruitment Dashboard": "ats_applicant_tracking",
  "Job Posting": "job_postings",
  "Resume Parsing": "candidate_database",
  "Interview": "interviews",
  "Offer Letter": "offer_letters",
  "Letter Workspace": "documents",
  "Onboarding": "onboarding_tasks",
  "Joining": "joining_records",
  "Candidates": "candidate_database",
  "Interviews": "interviews",
  "Hiring Status": "joining_records",
  "My Position": "joining_records",
  "My Offer Letter": "offer_letters",
  "My Joining Date": "joining_records",
  "My Onboarding": "onboarding_tasks",
  "My Joining Status": "joining_records",
  "Asset Allocation": "asset_allocation",
  "Daily Attendance": "daily_attendance",
  "Attendance Regularization": "attendance_regularization",
  "Biometric": "biometric_logs",
  "Biometric Logs": "biometric_logs",
  "Shift Master": "shift_master",
  "Leave Types": "leave_types",
  "Leave Requests": "leave_requests",
  "Leave Dashboard": "leave_requests",
  "Leave Balance": "employees",
  "Salary Structure": "salary_structure",
  "Incentives & Claims": "incentives_claims",
  "PF Registry": "pf_registry",
  "Tax Declarations": "tax_declarations",
  "KPI & OKR": "performance_appraisals",
  "KPI": "performance_appraisals",
  "OKR": "performance_appraisals",
  "Goals": "performance_appraisals",
  "Performance Reviews": "performance_appraisals",
  "Performance Master": "performance_appraisals",
  "Performance Cycles": "performance_appraisals",
  "Performance Dashboard": "performance_appraisals",
  "Self Appraisal": "performance_appraisals",
  "Manager Review": "performance_appraisals",
  "Manager Feedback": "performance_appraisals",
  "360° Feedback": "performance_appraisals",
  "Competency Evaluation": "performance_appraisals",
  "Performance Rating": "performance_appraisals",
  "Performance History": "performance_appraisals",
  "Development Plan": "performance_appraisals",
  "PIP": "performance_appraisals",
  "Promotion": "performance_appraisals",
  "Increment": "performance_appraisals",
  "Promotions": "performance_appraisals",
  "Increments": "performance_appraisals",
  "Promotion & Increment": "performance_appraisals",
  "Learning Dashboard": "learning_dashboards",
  "Training": "training_records",
  "Courses": "courses",
  "LMS Progress": "lms_progress",
  "Certification": "certification_tracking",
  "Learning Reports": "training_feedback",
  "Inventory": "inventory",
  "Expense Claims": "expense_claims",
  "Document Log": "document_log",
  "Exit Logs": "exit_logs",
  "Exit Dashboard": "exit_requests",
  "Resignation": "exit_requests",
  "Notice Period": "notice_periods",
  "Exit Clearance": "exit_clearances",
  "Asset Return": "asset_returns",
  "No Dues": "no_dues",
  "F&F Settlement": "fnf_settlements",
  "Exit Interview": "exit_interviews",
  "Experience Letter": "experience_letters",
  "Exit History": "exit_requests",
  "Approvals Pending": "leave_requests",
  "Announcements & Surveys": "announcements_surveys",
  "HR Tickets": "hr_tickets",
  "Complaint Management": "complaint_management",
  "Query Resolution": "query_resolution",
  "Service Requests": "service_requests",
  "Ticket Tracking": "ticket_tracking",
  "Logs": "logs",
  "Email Notifications": "email_notifications",
  "SMS Notifications": "sms_notifications",
  "Push Notifications": "push_notifications",
  "Approval Alerts": "approval_alerts",
  "RBAC Roles": "rbac_roles",
  "Audit Logs": "audit_logs",
  "Login History": "login_history",
  "Holiday Calendar": "holidays",
  "Holiday Master": "holidays",
  "Leave Type Master": "leave_type_masters",
  "Overtime": "overtime_masters",
  "Overtime Master": "overtime_masters",
  "Bonus": "bonus_masters",
  "Bonus Master": "bonus_masters",
  "TDS": "tds_masters",
  "TDS Master": "tds_masters",
  "Performance": "performance_masters",
  "Payroll Process": "payroll_process",
  "Payslip": "payslips",
  "Loan Management": "loan_management",
  "ESI Management": "esi_management",
  "Professional Tax (PT)": "professional_tax",
  "Reports": "reports_management"
};

const componentRegistry = {
  "Payroll Process": PayrollProcess,
  "payroll_process": PayrollProcess,
  "Payslip": PayslipManagement,
  "payslips": PayslipManagement,
  "Loan Management": LoanManagement,
  "loan_management": LoanManagement,
  "ESI Management": ESIManagement,
  "esi_management": ESIManagement,
  "Professional Tax (PT)": ProfessionalTax,
  "professional_tax": ProfessionalTax,
  "Bank Details": BankDetailsDashboard,
  "Department Dashboard": DepartmentDashboard,
  "Department Workspace": DepartmentDashboard,
  "Company": Company,
  "Branch": Branch,
  "Department": Department,
  "Designation": Designation,
  "Designation Master": Designation,
  "Designation Workspace": Designation,
  "Business Unit": BusinessUnit,
  "Cost Center": CostCenter,
  "Reporting Hierarchy": ReportingHierarchy,
  "Organizational Chart": OrganizationalChart,
  "Employee Profile": EmployeeProfile,
  "Employee List": EmployeeProfile,
  "Add Employee": EmployeeProfile,
  "Employee Management": EmployeeProfile,
  "employee_profile": EmployeeProfile,
  "Asset Allocation": AssetAllocationDashboard,
  "Job Requisition": JobRequisition,
  "Candidate Database": CandidateDatabase,
  "Candidates": CandidateDatabase,
  "ATS (Applicant Tracking)": ATSApplicantTracking,
  "Recruitment Dashboard": RecruitmentDashboard,
  "Job Posting": JobPosting,
  "Resume Parsing": ResumeParsing,
  "Interview": Interview,
  "Interviews": Interview,
  "Offer Letter": OfferLetter,
  "Letter Workspace": DocumentLog,
  "My Offer Letter": OfferLetter,
  "Onboarding": Onboarding,
  "My Onboarding": Onboarding,
  "Joining": Joining,
  "Hiring Status": Joining,
  "My Position": Joining,
  "My Joining Date": Joining,
  "My Joining Status": Joining,
  "KPI & OKR": PerformanceReviews,
  "Performance Reviews": PerformanceReviews,
  "Performance Master": PerformanceMaster,
  "Performance Cycles": PerformanceReviews,
  "Performance Dashboard": PerformanceDashboard,
  "Goals": PerformanceReviews,
  "Self Appraisal": PerformanceReviews,
  "Manager Review": PerformanceReviews,
  "Manager Feedback": PerformanceReviews,
  "360° Feedback": PerformanceReviews,
  "Competency Evaluation": PerformanceReviews,
  "Performance Rating": PerformanceReviews,
  "Performance History": PerformanceReviews,
  "Development Plan": PerformanceReviews,
  "PIP": PerformanceReviews,
  "Promotion": PerformanceReviews,
  "Increment": PerformanceReviews,
  "Promotions": PerformanceReviews,
  "Increments": PerformanceReviews,
  "Promotion & Increment": PerformanceReviews,
  "OKR": PerformanceReviews,
  "KPI": PerformanceReviews,
  "Learning Dashboard": LearningDashboard,
  "Training": LearningDashboard,
  "Courses": LearningDashboard,
  "LMS Progress": LearningDashboard,
  "Certification": LearningDashboard,
  "Learning Reports": LearningDashboard,
  "Daily Attendance": DailyAttendance,
  "Attendance Dashboard": AttendanceDashboard,
  "Attendance Regularization": AttendanceRegularizationAdmin,
  "Biometric": DailyAttendance,
  "Biometric Logs": DailyAttendance,
  "Reports": AttendanceReportsAdmin,
  "reports_management": AttendanceReportsAdmin,
  "Shift Master": ShiftMaster,
  "Leave Types": LeaveTypes,
  "Leave Type Master": LeaveTypes,
  "Leave Request": LeaveRequests,
  "Leave Requests": LeaveRequests,
  "Leave Dashboard": LeaveDashboard,
  "Leave Balance": LeaveBalanceReports,
  "Holiday Calendar": HolidayMaster,
  "Holiday Master": HolidayMaster,
  "Overtime": OvertimeMaster,
  "Overtime Master": OvertimeMaster,
  "Asset Dashboard": AssetAllocationDashboard,
  "Inventory": Inventory,
  "Salary Structure": SalaryStructure,
  "Incentives & Claims": IncentivesClaims,
  "PF Registry": PfRegistry,
  "Tax Declarations": TaxDeclarations,
  "TDS Master": TdsMaster,
  "Bonus": BonusMaster,
  "Bonus Master": BonusMaster,
  "Expense Claims": ExpenseClaims,
  "Exit Logs": ExitLogs,
  "Workflow Dashboard": WorkflowDashboard,
  "Approvals Pending": ApprovalsPending,
  "Document Log": DocumentLog,
  "Announcements & Surveys": AnnouncementsSurveys,
  "Helpdesk Dashboard": HelpdeskDashboard,
  "HR Tickets": HrTickets,
  "Complaint Management": ComplaintManagement,
  "Query Resolution": QueryResolution,
  "Service Requests": ServiceRequests,
  "Ticket Tracking": TicketTracking,
  "Logs": Logs,
  "Email Notifications": EmailNotifications,
  "SMS Notifications": SmsNotifications,
  "Push Notifications": PushNotifications,
  "RBAC Roles": RbacRoles,
  "Audit Logs": SettingsDashboard,
  "Login History": LoginHistory,
  "Exit Dashboard": ExitDashboard,
  "Resignation": ExitDashboard,
  "Notice Period": ExitDashboard,
  "Exit Clearance": ExitDashboard,
  "Asset Return": ExitDashboard,
  "No Dues": ExitDashboard,
  "F&F Settlement": ExitDashboard,
  "Exit Interview": ExitDashboard,
  "Experience Letter": ExitDashboard,
  "Exit History": ExitDashboard,
  "Reports Dashboard": ReportsDashboard,
  "Notifications Dashboard": NotificationsDashboard,
  "Notifications": NotificationsDashboard,
  "Settings Dashboard": SettingsDashboard,
  "Settings": SettingsDashboard,
  "Company Settings": SettingsDashboard,
  "Attendance Settings": SettingsDashboard,
  "Leave Settings": SettingsDashboard,
  "Payroll Settings": SettingsDashboard,
  "Shift Settings": SettingsDashboard,
  "Notification Settings": SettingsDashboard,
  "Email Templates": SettingsDashboard,
  "Document Templates": SettingsDashboard,
  "Security": SettingsDashboard,
  "Engagement Dashboard": EngagementDashboard
};

const HrConsolidationHub = () => {
  const { user } = useAuth();
  const userRole = typeof user?.role === "object" ? user?.role?.name : user?.role;
  const isAuthorizedAdmin = userRole === "SuperAdmin" || userRole === "Admin";
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") || "CORE";
  const tabParam = searchParams.get("tab") || "Company";

  const dispatch = useDispatch();

  const [uploadProgress, setUploadProgress] = useState({});

  const checkSectionCompletion = (section, form) => {
    if (!form) return false;
    switch (section) {
      case "Basic Information":
        return !!(form.firstName && form.lastName && form.gender && form.dateOfBirth);
      case "Official Information":
        return !!(form.company || form.branch || form.department);
      case "Contact Information":
        return !!(form.mobileNumber && form.personalEmail && form.currentAddress);
      case "Identity Documents":
        return !!(form.aadhaarNumber || form.panNumber);
      case "Bank & Payroll":
        return !!(form.bankName && form.accountNumber && form.ifscCode);
      case "Emergency Contact":
        return !!(form.emergencyContactName && form.emergencyMobile);
      case "Education":
        return !!(form.education && (Array.isArray(form.education) ? form.education.length > 0 : Object.keys(form.education).length > 0));
      case "Experience":
        return !!(form.experience && (Array.isArray(form.experience) ? form.experience.length > 0 : Object.keys(form.experience).length > 0));
      case "Skills & Certifications":
        return !!(form.skills && String(form.skills).trim() !== "");
      case "Attendance Settings":
        return !!(form.shift || form.workingHours);
      case "Leave Settings":
        return !!(form.leavePolicy || form.casualLeave);
      case "Asset Assignment":
        return !!(form.assets && (Array.isArray(form.assets) ? form.assets.length > 0 : Object.keys(form.assets).length > 0));
      case "System Login":
        return !!(form.username && form.password);
      case "Documents":
        return !!(form.documents && (Array.isArray(form.documents) ? form.documents.length > 0 : Object.keys(form.documents).length > 0));
      case "Performance":
        return true;
      case "Exit Information":
        return true;
      case "Audit Information":
        return true;
      default:
        return false;
    }
  };

  const calculateCompletionPercentage = (form) => {
    let score = 0;
    let total = 0;
    
    const checkField = (val) => {
      total++;
      if (val && String(val).trim() !== "") score++;
    };

    checkField(form.firstName);
    checkField(form.lastName);
    checkField(form.gender);
    checkField(form.dateOfBirth);
    checkField(form.maritalStatus);
    checkField(form.bloodGroup);
    checkField(form.nationality);
    checkField(form.photo);

    checkField(form.mobileNumber);
    checkField(form.personalEmail);
    checkField(form.currentAddress);
    checkField(form.permanentAddress);
    checkField(form.city);
    checkField(form.state);
    checkField(form.pinCode);

    checkField(form.aadhaarNumber);
    checkField(form.panNumber);
    checkField(form.passportNumber);

    checkField(form.bankName);
    checkField(form.accountHolderName);
    checkField(form.accountNumber);
    checkField(form.ifscCode);

    checkField(form.emergencyContactName);
    checkField(form.emergencyMobile);

    total++;
    if (form.education && (Array.isArray(form.education) ? form.education.length > 0 : Object.keys(form.education).length > 0)) {
      score++;
    }
    total++;
    if (form.experience && (Array.isArray(form.experience) ? form.experience.length > 0 : Object.keys(form.experience).length > 0)) {
      score++;
    }
    total++;
    if (form.skills && String(form.skills).trim() !== "") {
      score++;
    }
    total++;
    if (form.documents && (Array.isArray(form.documents) ? form.documents.length > 0 : Object.keys(form.documents).length > 0)) {
      score++;
    }

    return Math.round((score / total) * 100);
  };

  const handleFileUpload = (e, docKey) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must not exceed 5MB.");
      return;
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (docKey !== "photo" && !allowedTypes.includes(file.type)) {
      alert("Only PDF, Word, and Image files are allowed.");
      return;
    }

    const reader = new FileReader();
    setUploadProgress(prev => ({ ...prev, [docKey]: 10 }));
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const current = prev[docKey] || 10;
        if (current >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return { ...prev, [docKey]: current + 20 };
      });
    }, 100);

    reader.onload = () => {
      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [docKey]: 100 }));
      
      if (docKey === "photo") {
        setEmployeeForm(prev => ({ ...prev, photo: reader.result }));
      } else {
        setEmployeeForm(prev => {
          const docs = prev.documents || {};
          return {
            ...prev,
            documents: {
              ...docs,
              [docKey]: file.name + " (" + (file.size / 1024).toFixed(1) + " KB)"
            }
          };
        });
      }
      setTimeout(() => {
        setUploadProgress(prev => {
          const copy = { ...prev };
          delete copy[docKey];
          return copy;
        });
      }, 1000);
    };

    reader.readAsDataURL(file);
  };


  // Selectors for global hub state from Redux Store
  const dbData = useSelector((state) => state.hr.dbData);
  const loading = useSelector((state) => state.hr.loading);
  const selectedCategory = useSelector((state) => state.hr.selectedCategory);
  const selectedModule = useSelector((state) => state.hr.selectedModule);
  const selectedTab = useSelector((state) => state.hr.selectedTab);
  const viewMode = useSelector((state) => state.hr.viewMode);
  const searchText = useSelector((state) => state.hr.searchText);
  const showSchema = useSelector((state) => state.hr.showSchema);
  const checkedIn = useSelector((state) => state.hr.checkedIn);
  const punchTime = useSelector((state) => state.hr.punchTime);

  useEffect(() => {
    if (userRole === "Employee" && viewMode !== "dashboard") {
      dispatch(setViewMode("dashboard"));
    }
    if (selectedTab === "Leave Dashboard" && viewMode !== "dashboard") {
      dispatch(setViewMode("dashboard"));
    }
    const isProfileIncomplete = user?.profileStatus === "Incomplete" || user?.profileStatus === "Profile Incomplete";
    if (userRole === "Employee" && isProfileIncomplete) {
      if (selectedTab !== "Employee Profile" && selectedTab !== "Employee Dashboard") {
        dispatch(setSelectedTab("Employee Dashboard"));
      }
    }
  }, [userRole, viewMode, user?.profileStatus, selectedTab, dispatch]);

  const isDynamicSubDept = selectedCategory === "DEPARTMENT";

  // Modal / Form state for CRUD (ephemeral component state)
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formFields, setFormFields] = useState({});
  const [validationError, setValidationError] = useState("");
  const [openDeptModalTrigger, setOpenDeptModalTrigger] = useState(0);

  const [employeeForm, setEmployeeForm] = useState({
    photo: "",
    employeeId: "",
    employeeCode: "",
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "Male",
    dateOfBirth: "",
    maritalStatus: "Single",
    bloodGroup: "",
    nationality: "Indian",
    company: "NIB Insurance",
    branch: "",
    department: "",
    designation: "",
    reportingManager: "",
    employeeType: "Full-Time",
    employeeStatus: "Active",
    officialEmail: "",
    dateOfJoining: "",
    mobileNumber: "",
    alternateMobile: "",
    personalEmail: "",
    currentAddress: "",
    permanentAddress: "",
    aadhaarNumber: "",
    panNumber: "",
    passportNumber: "",
    drivingLicense: "",
    uanNumber: "",
    esicNumber: "",
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    basicSalary: "",
    grossSalary: "",
    ctc: "",
    pfApplicable: false,
    esiApplicable: false,
    emergencyContactName: "",
    emergencyRelation: "",
    emergencyMobile: "",
    highestDegree: "",
    specialization: "",
    university: "",
    passingYear: "",
    educationGpa: "",
    prevCompany: "",
    prevDesignation: "",
    totalExpYears: "",
    prevSalary: "",
    technicalSkills: "",
    certifications: "",
    shift: "General Shift",
    weeklyOff: "Sunday",
    attendanceMode: "Biometric",
    casualLeaveBalance: 12,
    sickLeaveBalance: 8,
    earnedLeaveBalance: 15,
    assets: [],
    documents: {},
    kpiValue: "",
    rating: "3",
    resignationDate: "",
    lastWorkingDay: "",
    createdBy: "System Admin"
  });

  const [profileTab, setProfileTab] = useState("Basic Information");

  const empsList = dbData["Employee Profile"] || dbData["employee_profile"] || dbData["employees"] || [];
  const currentUserProfile = useMemo(() => {
    return empsList.find(e => {
      const dbEmail = String(e.email || "").toLowerCase().trim();
      const loginEmail = String(user?.email || "").toLowerCase().trim();
      const dbUsername = dbEmail.split('@')[0];
      const loginUsername = loginEmail.split('@')[0];
      
      return dbEmail === loginEmail || 
             (dbUsername && loginUsername && dbUsername === loginUsername) ||
             (e.employeeCode && user?.username && String(e.employeeCode).toLowerCase().trim() === String(user.username).toLowerCase().trim()) ||
             (e.companyEmail && String(e.companyEmail).toLowerCase().trim() === loginEmail);
    });
  }, [empsList, user]);

  // Filter records prop if user is standard Employee or non-admin
  const emailLower = String(user?.email || "").toLowerCase().trim();
  const isAdminEmail = emailLower.includes("admin") || emailLower.includes("yashtech");
  const shouldFilter = (userRole === "Employee") || !isAdminEmail;

  const filterRecordsForEmployee = (inputRecords, tabKey) => {
    const key = String(tabKey || "").toLowerCase().trim();
    const userRoleStr = String(userRole || '').toLowerCase().trim();

    // Check Employee Recruitment & Joining Portal tabs
    const recruitmentPersonalTables = ['offer_letters', 'onboarding_tasks', 'joining_records', 'my position', 'my offer letter', 'my joining date', 'my onboarding', 'my joining status', 'offer letter', 'onboarding', 'joining'];
    if (userRoleStr === 'employee' && recruitmentPersonalTables.some(t => key.includes(t) || t.includes(key))) {
      const userEmail = String(user?.email || "").toLowerCase().trim();
      return inputRecords.filter(r => 
        String(r.candidate_email || r.candidateEmail || r.email || "").toLowerCase().trim() === userEmail
      );
    } else if (userRoleStr === 'employee' && ['job_requisition', 'job_postings', 'job_posting', 'candidate_database', 'interviews', 'ats_applicant_tracking'].some(t => key.includes(t))) {
      return []; // Blocked
    }

    if (!shouldFilter) return inputRecords;
    
    const personalTables = [
      'daily_attendance', 'attendance_regularization', 'biometric_logs', 'asset_allocation', 'asset allocation',
      'payroll_process', 'payroll process', 'payslips', 'payslip', 'loan_management', 'loan management',
      'esi_management', 'esi management', 'professional_tax', 'professional tax (pt)', 'salary_structure', 'salary structure'
    ];
    
    const isPersonalTable = personalTables.some(t => key.includes(t) || t.includes(key));
    if (!isPersonalTable) return inputRecords;
    
    const empId = currentUserProfile?.employeeCode || currentUserProfile?.emp_code || "";
    if (!empId) {
      const fallbackName = String(user?.email || "").split("@")[0].toLowerCase().trim();
      return inputRecords.filter(r => {
        const empName = String(r.employee || r.empName || r.name || "").toLowerCase();
        return empName.includes(fallbackName);
      });
    }
    
    const empCodeCol = (key.includes('salary_structure') || key.includes('salary structure'))
      ? 'employeeId' 
      : ((key.includes('asset_allocation') || key.includes('asset allocation')) ? 'empId' : 'employeeCode');
      
    return inputRecords.filter(r => String(r[empCodeCol] || r.empId || r.employeeCode || "").toLowerCase().trim() === String(empId).toLowerCase().trim());
  };

  const filterRecordsForManager = (inputRecords, tabKey) => {
    const cleanRole = String(userRole || '').toLowerCase().trim();
    if (cleanRole !== 'manager') return inputRecords;

    const key = String(tabKey || "").toLowerCase().trim();
    const managerDept = String(currentUserProfile?.department || "").toLowerCase().trim();

    if (key.includes('job_requisition') || key.includes('job requisition')) {
      return inputRecords.filter(r => 
        String(r.department || r.deptName || '').toLowerCase().trim() === managerDept
      );
    }
    if (key.includes('job_posting') || key.includes('job posting') || key.includes('job_postings') || key.includes('job postings')) {
      return inputRecords.filter(r => 
        String(r.department || '').toLowerCase().trim() === managerDept
      );
    }
    if (key.includes('candidate_database') || key.includes('candidates')) {
      const interviews = dbData["ATS (Applicant Tracking)"] || dbData["interviews"] || [];
      const managerInterviews = filterRecordsForManager(interviews, 'interviews');
      const allowedEmails = managerInterviews.map(i => String(i.candidate_email || '').toLowerCase().trim());
      const allowedNames = managerInterviews.map(i => String(i.candidate || '').toLowerCase().trim());
      return inputRecords.filter(r => 
        allowedEmails.includes(String(r.email || '').toLowerCase().trim()) ||
        allowedNames.includes(String(r.candidateName || r.name || '').toLowerCase().trim())
      );
    }
    if (key.includes('interviews') || key.includes('interview') || key.includes('ats_applicant_tracking') || key.includes('ats (applicant tracking)')) {
      const jobPostings = dbData["Job Posting"] || dbData["job_postings"] || [];
      const managerJobTitles = jobPostings
        .filter(p => String(p.department || '').toLowerCase().trim() === managerDept)
        .map(p => String(p.title || '').toLowerCase().trim());

      const requisitions = dbData["Job Requisition"] || dbData["job_requisition"] || [];
      const managerReqTitles = requisitions
        .filter(r => String(r.department || '').toLowerCase().trim() === managerDept)
        .map(r => String(r.jobTitle || '').toLowerCase().trim());

      const allowedJobTitles = [...managerJobTitles, ...managerReqTitles];
      return inputRecords.filter(r => 
        allowedJobTitles.includes(String(r.job_title || r.jobPosting || '').toLowerCase().trim())
      );
    }
    if (['offer_letters', 'offer letter', 'onboarding_tasks', 'onboarding', 'joining_records', 'joining'].some(t => key.includes(t))) {
      return [];
    }

    return inputRecords;
  };

  useEffect(() => {
    if (currentUserProfile) {
      let parsed = {};
      try {
        if (currentUserProfile.profile_data) {
          parsed = JSON.parse(currentUserProfile.profile_data);
        } else if (currentUserProfile.profileData) {
          parsed = typeof currentUserProfile.profileData === "string" ? JSON.parse(currentUserProfile.profileData) : currentUserProfile.profileData;
        }
      } catch (e) {
        console.error("Error parsing profileData in Hub:", e);
      }

      const details = { ...currentUserProfile };
      const jsonCols = ['education', 'experience', 'skills', 'assets', 'documents', 'kpis', 'promotionHistory', 'awards', 'activityTimeline', 'weeklyOff'];
      jsonCols.forEach(col => {
        if (details[col] && typeof details[col] === 'string') {
          try {
            details[col] = JSON.parse(details[col]);
          } catch (err) {}
        }
      });

      setEmployeeForm(prev => ({
        ...prev,
        ...details,
        ...parsed,
        documents: parsed.documents || details.documents || prev.documents || {},
        assets: parsed.assets || details.assets || prev.assets || []
      }));
    }
  }, [currentUserProfile]);

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!employeeForm.firstName || !employeeForm.firstName.trim()) {
      alert("First Name is required.");
      return;
    }

    const compPercent = calculateCompletionPercentage(employeeForm);

    const isProfileFinished = !!(
      employeeForm.firstName &&
      employeeForm.lastName &&
      employeeForm.gender &&
      employeeForm.dateOfBirth &&
      employeeForm.mobileNumber &&
      employeeForm.personalEmail &&
      employeeForm.currentAddress &&
      employeeForm.bankName &&
      employeeForm.accountNumber &&
      employeeForm.ifscCode
    );

    const newStatus = isProfileFinished ? "Complete" : "Profile Incomplete";
    const finalCompletion = isProfileFinished ? 100 : compPercent;

    const constructedName = `${employeeForm.firstName} ${employeeForm.lastName || ""}`.trim();
    const profileDataStr = JSON.stringify({
      ...employeeForm,
      profileStatus: newStatus,
      profileCompletion: finalCompletion,
      updatedBy: user?.email || "Employee Self",
      updatedDate: new Date().toLocaleDateString()
    });
    const payload = {
      ...employeeForm,
      employee_name: constructedName,
      email: employeeForm.officialEmail || currentUserProfile?.email || user?.email,
      department: employeeForm.department || currentUserProfile?.department || "Operations",
      profile_data: profileDataStr,
      profileStatus: newStatus,
      profileCompletion: finalCompletion
    };

    delete payload.created_at;
    delete payload.updated_at;
    delete payload.createdAt;
    delete payload.updatedAt;

    try {
      if (currentUserProfile && currentUserProfile.id) {
        await updateTableRecord("employees", currentUserProfile.id, payload);
      } else {
        const newId = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : "emp-" + Math.random().toString(36).substring(2, 15);
        await createTableRecord("employees", {
          ...payload,
          id: newId,
          user_id: user?.id || null
        });
      }

      if (isProfileFinished) {
        dispatch(updateUserProfile({ profileStatus: "Complete", profileCompletion: 100 }));
        alert("Congratulations! Your onboarding profile is complete and your dashboard has been unlocked!");
      } else {
        dispatch(updateUserProfile({ profileCompletion: finalCompletion }));
        if (e) alert("Progress saved successfully!");
      }

      fetchAllData();
    } catch (err) {
      alert(err.message || "Failed to save profile.");
    }
  };

  const handleSaveAndContinue = async (e) => {
    e.preventDefault();
    await handleSaveProfile(null);

    const tabsList = [
      "Basic Information",
      "Official Information",
      "Contact Information",
      "Identity Documents",
      "Bank & Payroll",
      "Emergency Contact",
      "Education",
      "Experience",
      "Skills & Certifications",
      "Attendance Settings",
      "Leave Settings",
      "Asset Assignment",
      "System Login",
      "Documents",
      "Performance",
      "Exit Information",
      "Audit Information"
    ];
    const currentIndex = tabsList.indexOf(profileTab);
    if (currentIndex >= 0 && currentIndex < tabsList.length - 1) {
      setProfileTab(tabsList[currentIndex + 1]);
    }
  };

  // Sync state with URL category and tab parameters
  useEffect(() => {
    if (categoryParam) {
      dispatch(setSelectedCategory(categoryParam));
      
      if (tabParam) {
        dispatch(setSelectedTab(tabParam));
        
        // Special case mapping for shared tab name "Reports"
        if (tabParam === "Reports") {
          let resolvedModule = "18. Reports & Analytics";
          if (categoryParam === "LEAVE_MGMT") resolvedModule = "5. Leave Management";
          else if (categoryParam === "ATTENDANCE") resolvedModule = "4. Attendance & Shift";
          else if (categoryParam === "PAYROLL") resolvedModule = "6. Payroll & Compensation";
          else if (categoryParam === "PERFORMANCE") resolvedModule = "8. Performance Management";
          else if (categoryParam === "LEARNING") resolvedModule = "9. Learning & Development";
          else if (categoryParam === "ASSET_MGMT") resolvedModule = "11. Asset Management";
          else if (categoryParam === "DOCUMENT_MGMT") resolvedModule = "13. Document Management";
          
          dispatch(setSelectedModule(resolvedModule));
        } else {
          // Find which module this tab belongs to dynamically
          let found = false;
          for (const [modName, modSchema] of Object.entries(hrSchemas)) {
            if (modSchema[tabParam]) {
              dispatch(setSelectedModule(modName));
              found = true;
              break;
            }
          }
          if (!found) {
            // Fallback to first module of the category if tab is not found in schema
            const catData = CATEGORIES[categoryParam];
            if (catData && catData.modules.length > 0) {
              dispatch(setSelectedModule(catData.modules[0]));
            }
          }
        }
      } else {
        const catData = CATEGORIES[categoryParam];
        if (catData && catData.modules.length > 0) {
          const firstModule = catData.modules[0];
          dispatch(setSelectedModule(firstModule));
          const moduleSchema = hrSchemas[firstModule] || {};
          const tabs = Object.keys(moduleSchema);
          if (tabs.length > 0) {
            dispatch(setSelectedTab(tabs[0]));
          }
        }
      }
    }
  }, [categoryParam, tabParam, dispatch]);

  // Fetch all tables from MySQL database
  const fetchAllData = async () => {
    dispatch(setLoading(true));
    try {
      const keys = Object.keys(tabToSqlTableMap);
      const responses = await Promise.all(
        keys.map(tab => getTableData(tabToSqlTableMap[tab]))
      );
      
      const newDbState = {};
      keys.forEach((tab, index) => {
        newDbState[tab] = responses[index] || [];
      });
      dispatch(setDbData(newDbState));
    } catch (err) {
      console.error("Error loading data from database:", err);
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [dispatch]);

  // Synchronize checkedIn and punchTime state dynamically for the logged-in admin user
  useEffect(() => {
    const attendanceList = dbData["Daily Attendance"] || [];
    const empId = currentUserProfile?.employeeCode || currentUserProfile?.emp_code || "TVN2007";
    const todayStr = new Date().toISOString().split("T")[0];
    const todayAtt = attendanceList.find(a => 
      a.date === todayStr && 
      String(a.empId).toLowerCase().trim() === String(empId).toLowerCase().trim()
    );
    if (todayAtt && todayAtt.checkIn && (!todayAtt.checkOut || todayAtt.checkOut === "--")) {
      dispatch(setCheckedInState({ checkedIn: true, punchTime: todayAtt.checkIn }));
    } else {
      dispatch(setCheckedInState({ checkedIn: false, punchTime: "" }));
    }
  }, [dbData, currentUserProfile, dispatch]);

  // ATS Kanban Stage updates
  const handleAtsMove = async (appId, recordId, nextStage) => {
    try {
      await updateTableRecord("ats_applicant_tracking", recordId, { stage: nextStage });
      // Update Redux state reactively
      dispatch(reduxUpdateTableRecord({
        tableName: "ATS (Applicant Tracking)",
        id: recordId,
        fields: { stage: nextStage }
      }));
    } catch (err) {
      alert("Failed to update applicant stage in database.");
    }
  };

  // Get active fields based on active module & tab
  const activeFields = useMemo(() => {
    if (selectedModule === "Department Workspace") {
      // Dynamic sub-departments share the same schema structure
      return [
        { name: "deptCode", label: "Department Code", type: "text", required: true },
        { name: "deptName", label: "Department Name", type: "text", required: true },
        { name: "head", label: "Department Head", type: "text" },
        { name: "parentDept", label: "Parent Department", type: "text" },
        { name: "company", label: "Company", type: "text" },
        { name: "branch", label: "Branch", type: "text" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] }
      ];
    }
    const moduleSchema = hrSchemas[selectedModule] || {};
    return moduleSchema[selectedTab] || [];
  }, [selectedModule, selectedTab]);

  const sqlTableName = useMemo(() => {
    return tabToSqlTableMap[selectedTab] || "department";
  }, [selectedTab]);

  // Sync tab when changing modules
  const handleModuleChange = (moduleName) => {
    dispatch(setSelectedModule(moduleName));
    const moduleSchema = hrSchemas[moduleName] || {};
    const tabs = Object.keys(moduleSchema);
    if (tabs.length > 0) {
      dispatch(setSelectedTab(tabs[0]));
    } else {
      dispatch(setSelectedTab(""));
    }
    dispatch(setSearchText(""));
    setValidationError("");
  };

  // CRUD handlers
  const handleOpenCreate = () => {
    if (
      selectedTab === "Department" ||
      selectedModule === "Department Workspace" ||
      selectedTab?.toLowerCase().includes("dept") ||
      selectedModule?.toLowerCase().includes("dept") ||
      selectedCategory === "DEPARTMENT"
    ) {
      setOpenDeptModalTrigger(prev => prev + 1);
      return;
    }
    const emptyForm = {};
    activeFields.forEach(f => {
      if (f.name === "company" || f.name === "company_name") {
        emptyForm[f.name] = user?.companyName || user?.company || "Yash Technologies";
      } else {
        emptyForm[f.name] = f.type === "number" ? "" : f.type === "select" ? (f.options?.[0] || "") : "";
      }
    });
    setFormFields(emptyForm);
    setEditingRecord(null);
    setValidationError("");
    setShowModal(true);
  };

  const handleOpenEdit = (record) => {
    setFormFields({ ...record });
    setEditingRecord(record);
    setValidationError("");
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record in database?")) {
      try {
        const success = await deleteTableRecord(sqlTableName, id);
        if (success) {
          dispatch(reduxDeleteTableRecord({
            tableName: selectedTab,
            id
          }));
        }
      } catch (err) {
        alert("Failed to delete record from database: " + err.message);
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setValidationError("");

    const fieldsToValidate = (!editingRecord && (sqlTableName === "employees" || sqlTableName === "employee_profile"))
      ? [
          { name: "employeeName", label: "EMPLOYEE NAME", required: true },
          { name: "email", label: "EMAIL", required: true },
          { name: "password", label: "PASSWORD", required: true },
          { name: "department", label: "DEPARTMENT" }
        ]
      : activeFields;

    const missing = fieldsToValidate.find(f => f.required && (!formFields[f.name] || String(formFields[f.name]).trim() === ""));
    if (missing) {
      setValidationError(`"${missing.label}" is required.`);
      return;
    }

    try {
      if (editingRecord) {
        // Edit mode (database update)
        const updatedRecord = await updateTableRecord(sqlTableName, editingRecord.id, formFields);
        if (updatedRecord) {
          dispatch(reduxUpdateTableRecord({
            tableName: selectedTab,
            id: editingRecord.id,
            fields: formFields
          }));
        }
      } else {
        // Create mode (database insert)
        let payload = { ...formFields };
        if (sqlTableName === "employees" || sqlTableName === "employee_profile") {
          payload = {
            firstName: formFields.employeeName || "",
            lastName: "",
            email: formFields.email || "",
            password: formFields.password || "securepassword",
            department: formFields.department || "Operations",
            companyEmail: formFields.email || "",
            profileStatus: "Profile Incomplete",
            profileCompletion: 15
          };
        }

        const createdRecord = await createTableRecord(sqlTableName, payload);
        if (createdRecord) {
          dispatch(reduxCreateTableRecord({
            tableName: selectedTab,
            record: createdRecord
          }));
        }
      }
      setShowModal(false);
    } catch (err) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("email already exists") || msg.toLowerCase().includes("duplicate entry")) {
        setValidationError("Email already exists. Please use a unique email address.");
      } else {
        setValidationError("Failed to write to MySQL database: " + msg);
      }
    }
  };

  // Check in check out simulation with database storage
  const handlePunchClick = async () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const dateStr = now.toISOString().split("T")[0];

    const empId = currentUserProfile?.employeeCode || currentUserProfile?.emp_code || "TVN2007";
    const empName = `${currentUserProfile?.firstName || ""} ${currentUserProfile?.lastName || ""}`.trim() || currentUserProfile?.employeeName || "Yashwani";

    try {
      if (!checkedIn) {
        const newRecord = {
          empId: empId,
          name: empName,
          date: dateStr,
          checkIn: timeStr,
          checkOut: "--",
          workingHours: 0,
          status: "Present",
          lateComing: 0,
          earlyLeaving: 0,
          overtime: 0,
          company: currentUserProfile?.company || "Yashtech",
          branch: currentUserProfile?.branch || "Headquarters",
          department: currentUserProfile?.department || "Operations",
          shift: "General Shift"
        };
        const savedRecord = await createTableRecord("daily_attendance", newRecord);
        if (savedRecord) {
          dispatch(setCheckedInState({ checkedIn: true, punchTime: timeStr }));
          dispatch(reduxCreateTableRecord({
            tableName: "Daily Attendance",
            record: savedRecord
          }));
        }
      } else {
        // Find latest punch
        const attendanceList = dbData["Daily Attendance"] || [];
        const latestPunch = attendanceList.find(item => item.empId === empId && item.checkOut === "--");
        if (latestPunch) {
          const updatedRecord = await updateTableRecord("daily_attendance", latestPunch.id, {
            checkOut: timeStr,
            workingHours: 8.5
          });
          if (updatedRecord) {
            dispatch(setCheckedInState({ checkedIn: false, punchTime: "" }));
            dispatch(reduxUpdateTableRecord({
              tableName: "Daily Attendance",
              id: latestPunch.id,
              fields: { checkOut: timeStr, workingHours: 8.5 }
            }));
          }
        } else {
          dispatch(setCheckedInState({ checkedIn: false, punchTime: "" }));
        }
      }
    } catch (err) {
      alert("Failed to write check-in record to database.");
    }
  };

  // Payslip rendering selected employee state
  const [selectedPayslipEmp, setSelectedPayslipEmp] = useState("Rahul Sharma");

  const computedPayslip = useMemo(() => {
    const salarySheet = dbData["Salary Structure"] || [];
    return salarySheet.find(sheet => sheet.empName === selectedPayslipEmp) || salarySheet[0] || {};
  }, [dbData, selectedPayslipEmp]);

  // List of active tabs based on selected module
  const currentTabs = useMemo(() => {
    if (selectedModule === "Department Workspace") {
      const departmentsList = dbData["Department"] || [];
      const names = departmentsList.map(d => d.deptName || d.dept_name || d.name).filter(Boolean);
      return Array.from(new Set(names));
    }
    return Object.keys(hrSchemas[selectedModule] || {});
  }, [selectedModule, dbData]);

  // Filtered rows of the active tab table
  const filteredTableRows = useMemo(() => {
    let tableData = dbData[selectedTab] || [];
    tableData = filterRecordsForEmployee(tableData, selectedTab);
    if (!searchText) return tableData;

    return tableData.filter(row => {
      return Object.values(row).some(val =>
        String(val).toLowerCase().includes(searchText.toLowerCase())
      );
    });
  }, [dbData, selectedTab, searchText, filterRecordsForEmployee]);

  // Enforce Department HR module authorization guard
  const isModuleAllowed = useMemo(() => {
    const userRole = typeof user?.role === "object" ? user?.role?.name : user?.role;
    if (!user || userRole === "SuperAdmin" || userRole === "Admin") return true;

    const targetTab = String(selectedTab || "").toLowerCase().trim();
    const targetMod = String(selectedModule || "").toLowerCase().trim();
    const targetCat = String(selectedCategory || "").toLowerCase().trim();

    // Always permit Department Workspaces, Department Dashboards, and main Hub Dashboards
    if (
      targetCat === "department" ||
      targetMod.includes("department") ||
      targetMod.includes("workspace") ||
      targetTab.includes("workspace") ||
      targetTab.includes("dashboard") ||
      targetTab === "department"
    ) {
      return true;
    }

    if (userRole === "DepartmentHR" || (user.assignedModules && Array.isArray(user.assignedModules) && user.assignedModules.length > 0)) {
      const allowed = (user.assignedModules || []).map(m => String(m).toLowerCase().trim());
      
      return allowed.some(m => 
        targetTab.includes(m) || m.includes(targetTab) || 
        targetMod.includes(m) || m.includes(targetMod) ||
        m === "dashboard"
      );
    }

    return true;
  }, [user, selectedTab, selectedModule, selectedCategory]);

  // ==================== RENDERING CUSTOM TAB DASHBOARDS ====================
  const renderTabDashboard = (tabName) => {
    if (!isModuleAllowed) {
      return <AccessDenied403 moduleName={tabName || selectedModule} />;
    }

    // Check if this is a dynamic sub-department or Department HR user
    const departmentsList = dbData["Department"] || [];
    const matchedDept = departmentsList.find(d => 
      (d.deptName || d.dept_name || d.name || "").toLowerCase() === (tabName || "").toLowerCase() ||
      (d.deptCode || d.dept_code || d.code || "").toLowerCase() === (tabName || "").toLowerCase()
    );

    if (user?.role === "DepartmentHR" && (tabName === "Department" || tabName === "Departments" || tabName === "Department Dashboard" || tabName === "Department Workspace")) {
      const deptDetail = matchedDept || {
        id: user?.departmentId || "dept_hr",
        deptName: user?.departmentName || "Department Operations",
        deptCode: user?.departmentCode || "DEPT",
        assignedModules: user?.assignedModules || [],
        status: "Active",
        description: `${user?.departmentName || "Department"} Operations & HR Strategy Command Center.`
      };

      return (
        <DepartmentDashboard
          deptDetail={deptDetail}
          dbData={dbData}
        />
      );
    }

    if (tabName === "Department" || tabName === "Departments") {
      const Component = componentRegistry["Department"];
      if (Component) {
        return (
          <Component
            records={dbData["Department"] || []}
            dbData={dbData}
            openCreateTrigger={openDeptModalTrigger}
          />
        );
      }
    }

    if (matchedDept || selectedModule === "Department Workspace" || tabName === "Department Workspace" || tabName === "Department Dashboard") {
      const deptDetail = matchedDept || {
        id: tabName,
        deptName: tabName,
        deptCode: tabName.substring(0, 3).toUpperCase(),
        status: "Active",
        description: `${tabName} Department Workspace`
      };

      return (
        <DepartmentDashboard
          deptDetail={deptDetail}
          dbData={dbData}
        />
      );
    }

    if (tabName === "Employee Dashboard") {
      return <AdminDashboard />;
    }

    if (tabName === "Employee Profile") {
      return <EmployeeDashboard />;
    }

    if (tabName === "Attendance Dashboard") {
      return <AttendanceDashboard dbData={dbData} />;
    }

    if (tabName === "Recruitment Dashboard") {
      return <RecruitmentDashboard dbData={dbData} onRefreshData={fetchAllData} openCreateTrigger={handleOpenCreate} />;
    }

    if (tabName === "Leave Dashboard") {
      return <LeaveDashboard dbData={dbData} onRefreshData={fetchAllData} />;
    }

    if (tabName === "Performance Dashboard") {
      return <PerformanceDashboard dbData={dbData} onRefreshData={fetchAllData} />;
    }

    if (tabName === "Learning Dashboard") {
      return <LearningDashboard selectedTab={tabName} user={user} onRefreshData={fetchAllData} />;
    }

    if (tabName === "Asset Dashboard") {
      return <AssetAllocationDashboard records={dbData["Asset Allocation"] || dbData["asset_allocations"] || []} dbData={dbData} />;
    }

    if (tabName === "Workflow Dashboard" || selectedCategory === "WORKFLOW") {
      return <WorkflowDashboard selectedTab={tabName} user={user} onRefreshData={fetchAllData} />;
    }

    if (tabName === "Helpdesk Dashboard" || selectedCategory === "HELPDESK") {
      return <HelpdeskDashboard selectedTab={tabName} user={user} onRefreshData={fetchAllData} />;
    }

    if (tabName === "Exit Dashboard" || selectedCategory === "EXIT_MGMT") {
      return <ExitDashboard selectedTab={tabName} user={user} onRefreshData={fetchAllData} />;
    }

    if (tabName === "Reports Dashboard" || (selectedCategory === "REPORTS" && tabName === "Dashboard") || selectedCategory === "REPORTS") {
      return <ReportsDashboard selectedTab={tabName} user={user} onRefreshData={fetchAllData} />;
    }

    if (tabName === "Notifications Dashboard" || (selectedCategory === "NOTIFICATIONS" && tabName === "Dashboard") || selectedCategory === "NOTIFICATIONS") {
      return <NotificationsDashboard selectedTab={tabName} user={user} onRefreshData={fetchAllData} />;
    }

    if (tabName === "Settings Dashboard" || (selectedCategory === "SETTINGS" && tabName === "Dashboard")) {
      return <SettingsDashboard selectedTab={tabName} user={user} onRefreshData={fetchAllData} />;
    }

    if (tabName === "Engagement Dashboard" || (selectedCategory === "ENGAGEMENT" && tabName === "Dashboard") || selectedCategory === "ENGAGEMENT") {
      return <EngagementDashboard selectedTab={tabName} user={user} onRefreshData={fetchAllData} />;
    }

    if (tabName === "Attendance Regularization") {
      const sqlTabKey = tabToSqlTableMap[tabName] || tabName;
      let records = dbData[tabName] || dbData[sqlTabKey] || [];
      const userRole = typeof user?.role === "object" ? user?.role?.name : user?.role;
      if (userRole === "Employee") {
        const empId = currentUserProfile?.employeeCode || currentUserProfile?.emp_code || "";
        records = records.filter(r => String(r.empId || "").toLowerCase().trim() === String(empId).toLowerCase().trim());
      }
      return <AttendanceRegularizationAdmin records={records} dbData={dbData} openCreateTrigger={handleOpenCreate} />;
    }

    if (tabName === "Reports" && selectedModule === "4. Attendance & Shift") {
      return <AttendanceReportsAdmin dbData={dbData} />;
    }

    if (tabName === "Reports" && selectedModule === "5. Leave Management") {
      return <LeaveReports dbData={dbData} onRefreshData={fetchAllData} />;
    }

    if (tabName === "Reports" && selectedModule === "6. Payroll & Compensation") {
      return <PayrollReports dbData={dbData} onRefreshData={fetchAllData} />;
    }

    if (selectedModule === "8. Performance Management") {
      if (tabName === "Dashboard") return <PerformanceDashboard />;
      if (tabName === "Performance Master") return <PerformanceMaster onRefreshData={fetchAllData} />;
      if (tabName === "KPI & OKR") return <PerformanceKpi />;
      if (tabName === "Goals") return <PerformanceGoals />;
      if (tabName === "Appraisals") return <PerformanceAppraisals />;
      if (tabName === "Promotions") return <PerformancePromotions />;
      if (tabName === "Increments") return <PerformanceIncrements />;
      if (tabName === "Reports") return <PerformanceReports />;
    }

    const sqlTabKey = tabToSqlTableMap[tabName] || tabName;
    let records = dbData[tabName] || dbData[sqlTabKey] || dbData["Employee Profile"] || dbData["employee_profile"] || dbData["employees"] || [];
    records = filterRecordsForEmployee(records, tabName);
    records = filterRecordsForManager(records, tabName);
    
    if (tabName === "Asset Allocation") {
      const userRole = typeof user?.role === "object" ? user?.role?.name : user?.role;
      if (String(userRole || "").toLowerCase().trim() === "employee") {
        const empId = currentUserProfile?.employeeCode || currentUserProfile?.emp_code || "";
        records = records.filter(r => String(r.empId || "").toLowerCase().trim() === String(empId).toLowerCase().trim());
      }
    }

    const Component = componentRegistry[tabName] || componentRegistry[sqlTabKey];
    if (Component) {
      return (
        <Component
          records={records}
          dbData={dbData}
          selectedTab={tabName}
          user={user}
          openCreateTrigger={handleOpenCreate}
          onOpenEdit={handleOpenEdit}
          onDelete={handleDelete}
          onRefreshData={fetchAllData}
          handleAtsMove={handleAtsMove}
          checkedIn={checkedIn}
          punchTime={punchTime}
          handlePunchClick={handlePunchClick}
          selectedPayslipEmp={selectedPayslipEmp}
          setSelectedPayslipEmp={setSelectedPayslipEmp}
          computedPayslip={computedPayslip}
        />
      );
    }

    if (records.length === 0) {
      return (
        <div className="text-center py-12 border border-dashed rounded-2xl bg-gray-50/50 p-6">
          <div className="text-slate-300 text-4xl mb-2">📊</div>
          <h4 className="font-bold text-gray-800 text-sm">{tabName} Dashboard is Empty</h4>
          <p className="text-xs text-gray-500 mt-1 mb-4">No records currently exist in the database table.</p>
          <button
            onClick={() => dispatch(setViewMode("table"))}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
          >
            Go to Database Table to Add Data
          </button>
        </div>
      );
    }

    return null;
  };

  const isEmployeeWorkspaceTab = ["Employee List", "Add Employee", "employee_profile", "employees"].includes(selectedTab);
  const isDesignationTab = ["Designation", "Designation Master", "Designation Workspace", "designation", "designations"].includes(selectedTab);
  const isCustomSetupTab = ["Business Unit", "Cost Center", "Reporting Hierarchy", "Organizational Chart"].includes(selectedTab);

  useEffect(() => {
    if (selectedTab === "Add Employee") {
      setOpenDeptModalTrigger(prev => prev + 1);
    }
  }, [selectedTab]);

  return (
    <div className="min-h-screen text-gray-800 bg-gray-50/50 p-2">
      {/* Main Workspace */}
      <div className="w-full bg-white rounded-2xl border border-gray-200/80 shadow-md p-6 font-sans">
        {/* Module Header */}
        {!isEmployeeWorkspaceTab && !isDesignationTab && !isCustomSetupTab && selectedTab !== "Reports" && selectedModule !== "8. Performance Management" && (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-5 mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                    Module: {selectedModule}
                  </span>
                  <span className="inline-block text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-mono">
                    MySQL Table: {sqlTableName}
                  </span>
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                  {selectedTab || "Visual Settings"} Workspace
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Persist fields, inspect MySQL rows, perform CRUD operations, and verify queries.
                </p>
              </div>

              {!isDynamicSubDept && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => dispatch(setShowSchema(!showSchema))}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                      showSchema
                        ? "bg-slate-100 text-slate-800 border-slate-300"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                    <span>{showSchema ? "Hide Schema" : "Show Schema Fields"}</span>
                  </button>

                  {currentTabs.length > 0 && isAuthorizedAdmin && selectedTab !== "Employee Profile" && selectedTab !== "Employee Dashboard" && selectedTab !== "Add Employee" && selectedTab !== "employees" && (
                    <button
                      onClick={handleOpenCreate}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition"
                    >
                      <span>+ Add {selectedTab === "Department" ? "New Department" : selectedTab}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* View Mode Toggle Switch (Tab Dashboard vs Database CRUD Table) */}
            {currentTabs.length > 0 && !isDynamicSubDept && selectedModule !== "8. Performance Management" && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 border border-slate-200/50 p-2.5 rounded-xl mb-6 gap-3">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => dispatch(setViewMode("dashboard"))}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      viewMode === "dashboard"
                        ? "bg-white text-blue-600 shadow-sm border border-gray-200/40"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
                    }`}
                  >
                    <span>📊 {selectedTab} Dashboard</span>
                  </button>
                  <button
                    onClick={() => dispatch(setViewMode("table"))}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      viewMode === "table"
                        ? "bg-white text-blue-600 shadow-sm border border-gray-200/40"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
                    }`}
                  >
                    <span>📋 Database Table (CRUD)</span>
                  </button>
                </div>
                {/* Search Box */}
                {viewMode === "table" && (
                  <input
                    type="text"
                    placeholder={`Search ${selectedTab} rows...`}
                    value={searchText}
                    onChange={(e) => dispatch(setSearchText(e.target.value))}
                    className="w-full sm:w-64 px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                )}
              </div>
            )}
          </>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-xl mb-4 text-xs font-medium text-slate-600 gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            <span>Syncing database table row records...</span>
          </div>
        )}

        {/* Collapsible Schema Reference Box */}
        {showSchema && activeFields.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 transition-all">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="h-2 w-2 bg-slate-500 rounded-full animate-pulse"></span>
              Database Schema Mapping: {selectedTab}
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left text-slate-600">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 font-bold">Field Name</th>
                    <th className="py-2 font-bold">Label</th>
                    <th className="py-2 font-bold">Field Type</th>
                    <th className="py-2 font-bold">Validation / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeFields.map(f => (
                    <tr key={f.name}>
                      <td className="py-2 font-mono text-slate-800 font-semibold">{f.name}</td>
                      <td className="py-2">{f.label}</td>
                      <td className="py-2 text-indigo-600 font-medium">{f.type}</td>
                      <td className="py-2">
                        {f.required ? (
                          <span className="text-red-500 font-semibold">NOT NULL</span>
                        ) : (
                          <span className="text-gray-400">Nullable</span>
                        )}
                        {f.options && ` [Options: ${f.options.join(", ")}]`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Dynamic Display Mode Selection */}

        {viewMode === "dashboard" || selectedCategory === "EXIT_MGMT" || selectedCategory === "WORKFLOW" || selectedCategory === "HELPDESK" || selectedCategory === "REPORTS" || selectedCategory === "LEARNING" || selectedCategory === "PERFORMANCE" || selectedCategory === "ATTENDANCE" || selectedCategory === "LEAVE_MGMT" || selectedCategory === "RECRUITMENT" || selectedCategory === "NOTIFICATIONS" || selectedCategory === "ENGAGEMENT" || selectedTab === "Exit Dashboard" || selectedTab === "Workflow Dashboard" || selectedTab === "Helpdesk Dashboard" || selectedTab === "Reports Dashboard" || selectedTab === "Learning Dashboard" || selectedTab === "Performance Dashboard" || selectedTab === "Attendance Dashboard" || selectedTab === "Leave Dashboard" || selectedTab === "Recruitment Dashboard" || selectedTab === "Asset Dashboard" || selectedTab === "Notifications Dashboard" || selectedTab === "Settings Dashboard" || selectedTab === "Engagement Dashboard" || selectedModule === "6. Payroll & Compensation" || selectedModule === "8. Performance Management" || isDynamicSubDept || selectedTab === "Department" || selectedTab === "Leave Balance" || selectedTab === "Attendance Regularization" || (selectedTab === "Reports" && selectedModule === "4. Attendance & Shift") || (selectedTab === "Reports" && selectedModule === "5. Leave Management") ? (

          /* Dashboard Layout mode */
          <div className="space-y-6">
            {renderTabDashboard(selectedTab)}
          </div>
        ) : (
          /* Table Grid CRUD mode */
          <div className="space-y-6">
            {/* Module-Specific Specialized Component Viewers */}
            <div className="space-y-6">
              {/* 3.5 Recruitment Kanban ATS */}
              {selectedModule === "3. Recruitment & Onboarding" && selectedTab === "ATS (Applicant Tracking)" && (
                <ATSApplicantTracking
                  records={dbData["ATS (Applicant Tracking)"]}
                  handleAtsMove={handleAtsMove}
                  hideList={true}
                />
              )}

              {/* 4. Attendance Check-In Portal */}
              {selectedModule === "4. Attendance & Shift" && selectedTab === "Daily Attendance" && (
                <DailyAttendance
                  checkedIn={checkedIn}
                  punchTime={punchTime}
                  handlePunchClick={handlePunchClick}
                  hideList={true}
                />
              )}

              {/* 6. Payslip & Compensation Calculator */}
              {selectedModule === "6. Payroll & Compensation" && selectedTab === "Salary Structure" && (
                <SalaryStructure
                  records={filterRecordsForEmployee(dbData["Salary Structure"] || [], "Salary Structure")}
                  allEmployeesList={dbData["employees"] || dbData["employee_profile"] || dbData["Employee Profile"] || []}
                  selectedPayslipEmp={selectedPayslipEmp}
                  setSelectedPayslipEmp={setSelectedPayslipEmp}
                  computedPayslip={computedPayslip}
                  hideList={true}
                />
              )}
            </div>

            {/* Main CRUD table layout */}
            <div className="overflow-x-auto border border-gray-200/60 rounded-xl shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 text-left text-xs bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider">S.No</th>
                    {activeFields.slice(0, 5).map(f => (
                      <th key={f.name} className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider">
                        {f.label}
                      </th>
                    ))}
                    {isAuthorizedAdmin && (
                      <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTableRows.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                      {activeFields.slice(0, 5).map(f => {
                        const value = row[f.name];
                        return (
                          <td key={f.name} className="px-4 py-3 max-w-[180px] truncate">
                            {f.type === "select" && value === "Active" ? (
                              <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-bold text-[10px] border border-green-200">
                                Active
                              </span>
                            ) : f.type === "select" && ["Inactive", "Rejected", "Failed"].includes(value) ? (
                              <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded-full font-bold text-[10px] border border-red-200">
                                {value}
                              </span>
                            ) : f.type === "select" && ["Pending", "Draft", "In Progress"].includes(value) ? (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-bold text-[10px] border border-amber-200">
                                {value}
                              </span>
                            ) : String(value || "") || "--"}
                          </td>
                        );
                      })}
                      {isAuthorizedAdmin && (
                        <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEdit(row)}
                            className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(row.id)}
                            className="text-red-500 hover:text-red-700 font-semibold hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredTableRows.length === 0 && (
                    <tr>
                      <td colSpan={activeFields.slice(0, 5).length + 2} className="text-center py-10 text-gray-400">
                        No records found in MySQL table. Try adding a record.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* CRUD Side Drawer/Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-xl w-full max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  {editingRecord ? "Edit" : "Create New"} {selectedTab} Record
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Please write directly to the database table.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4 font-sans">
              {validationError && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded">
                  {validationError}
                </div>
              )}

              {(!editingRecord && (sqlTableName === "employees" || sqlTableName === "employee_profile")) ? (
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { name: "employeeName", label: "EMPLOYEE NAME", type: "text", required: true, placeholder: "Enter employee name..." },
                    { name: "email", label: "EMAIL", type: "text", required: true, placeholder: "technovani@gmail.com" },
                    { name: "password", label: "PASSWORD", type: "password", required: true, placeholder: "••••••••" },
                    { name: "department", label: "DEPARTMENT", type: "text", placeholder: "Enter department..." }
                  ].map(f => (
                    <div key={f.name}>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-0.5">
                        <span>{f.label}</span>
                        {f.required && <span className="text-red-500 font-bold">*</span>}
                      </label>
                      <input
                        type={f.type}
                        value={formFields[f.name] || ""}
                        onChange={(e) => setFormFields(prev => ({ ...prev, [f.name]: e.target.value }))}
                        className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none font-bold"
                        placeholder={f.placeholder}
                        required={f.required}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeFields.map(f => (
                    <div key={f.name} className={`${f.type === "textarea" ? "md:col-span-2" : ""}`}>
                      <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-0.5">
                        <span>{f.label}</span>
                        {f.required && <span className="text-red-500 font-bold">*</span>}
                      </label>

                      {f.type === "select" ? (
                        <select
                          value={formFields[f.name] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormFields(prev => {
                              const updated = { ...prev, [f.name]: val };
                              if (f.name === "employee" || f.name === "employee_id") {
                                const emps = dbData["employees"] || dbData["employee_profile"] || dbData["Employee Profile"] || [];
                                const selected = emps.find(emp => {
                                  const empName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.employeeName || emp.employee_name || emp.email;
                                  return empName === val || emp.id === val || emp.email === val;
                                });
                                if (selected) {
                                  updated.employeeCode = selected.employeeCode || selected.empCode || selected.employeeId || `EMP-${selected.id || '101'}`;
                                  updated.empId = selected.empCode || selected.employeeCode || selected.employeeId || `EMP-${selected.id || '101'}`;
                                  updated.department = selected.department || "Operations";
                                  updated.designation = selected.designation || "Staff Professional";
                                  updated.officialEmail = selected.officialEmail || selected.email || "";
                                  updated.bankAccount = selected.bankAccount || selected.accountNumber || "Primary Bank A/C";
                                  updated.uanNumber = selected.uanNumber || selected.uan || "UAN1008874";
                                  updated.panNumber = selected.panNumber || selected.pan || "ABCDE1234F";
                                  updated.esiNumber = selected.esiNumber || selected.esi || "ESI9005521";
                                }
                              }
                              return updated;
                            });
                          }}
                          className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none font-bold text-slate-800 cursor-pointer"
                        >
                          {(f.name === "employee" || f.name === "approvedBy" || f.name === "generatedBy" || f.name === "employee_id") ? (
                            <>
                              <option value="">-- Select Employee --</option>
                              {(dbData["employees"] || dbData["employee_profile"] || dbData["Employee Profile"] || []).map(emp => {
                                const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.employeeName || emp.employee_name || emp.email;
                                const code = emp.employeeCode || emp.empCode || emp.employeeId || "";
                                return (
                                  <option key={emp.id || name} value={name}>
                                    {name} {code ? `(${code})` : ""}
                                  </option>
                                );
                              })}
                            </>
                          ) : (f.name === "company" || f.name === "company_name") ? (
                            <>
                              <option value="">-- Select Company --</option>
                              {(() => {
                                const companiesFromDb = (dbData["Company"] || dbData["company"] || []).map(c => c.companyName || c.company_name || c.name).filter(Boolean);
                                const defaultCompany = user?.companyName || user?.company || "Yash Technologies";
                                const allCompanies = Array.from(new Set([...companiesFromDb, defaultCompany]));
                                return allCompanies.map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ));
                              })()}
                            </>
                          ) : (f.name === "department" || f.name === "department_id") ? (
                            <>
                              <option value="">-- Select Department --</option>
                              {(() => {
                                const deptsFromDb = (dbData["Department"] || dbData["department"] || []).map(d => d.deptName || d.dept_name || d.name).filter(Boolean);
                                const defaultDepts = f.options || ["IT", "Software Engineering", "Operations", "Finance", "Human Resources", "Sales & Marketing"];
                                const allDepts = Array.from(new Set([...deptsFromDb, ...defaultDepts]));
                                return allDepts.map(d => (
                                  <option key={d} value={d}>{d}</option>
                                ));
                              })()}
                            </>
                          ) : (
                            f.options?.map(opt => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))
                          )}
                        </select>
                      ) : f.type === "textarea" ? (
                        <textarea
                          rows={3}
                          value={formFields[f.name] || ""}
                          onChange={(e) => setFormFields(prev => ({ ...prev, [f.name]: e.target.value }))}
                          className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          placeholder={`Enter ${f.label.toLowerCase()}...`}
                        />
                      ) : (
                        <input
                          type={f.type || "text"}
                          value={formFields[f.name] || ""}
                          onChange={(e) => setFormFields(prev => ({ ...prev, [f.name]: e.target.value }))}
                          className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          placeholder={`Enter ${f.label.toLowerCase()}...`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-t pt-4 mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  {editingRecord ? "Save Changes" : "Create Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HrConsolidationHub;
