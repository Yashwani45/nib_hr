import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { hrSchemas } from "../database/hrConsolidationData";
import {
  getTableData,
  createTableRecord,
  updateTableRecord,
  deleteTableRecord
} from "../services/hrApi";

// Category: CoreSetup
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

// Category: TalentLMS
import JobRequisition from "../components/TalentLMS/JobRequisition";
import CandidateDatabase from "../components/TalentLMS/CandidateDatabase";
import ATSApplicantTracking from "../components/TalentLMS/ATSApplicantTracking";
import KpiOkr from "../components/TalentLMS/KpiOkr";
import PerformanceReviews from "../components/TalentLMS/PerformanceReviews";
import Courses from "../components/TalentLMS/Courses";
import LmsProgress from "../components/TalentLMS/LmsProgress";

// Category: OperationsAssets
import DailyAttendance from "../components/OperationsAssets/DailyAttendance";
import ShiftMaster from "../components/OperationsAssets/ShiftMaster";
import LeaveTypes from "../components/OperationsAssets/LeaveTypes";
import LeaveRequests from "../components/OperationsAssets/LeaveRequests";
import Inventory from "../components/OperationsAssets/Inventory";

// Category: FinanceCompliance
import SalaryStructure from "../components/FinanceCompliance/SalaryStructure";
import IncentivesClaims from "../components/FinanceCompliance/IncentivesClaims";
import PfRegistry from "../components/FinanceCompliance/PfRegistry";
import TaxDeclarations from "../components/FinanceCompliance/TaxDeclarations";
import ExpenseClaims from "../components/FinanceCompliance/ExpenseClaims";
import ExitLogs from "../components/FinanceCompliance/ExitLogs";
import ApprovalsPending from "../components/FinanceCompliance/ApprovalsPending";

// Category: SupportEngagement
import DocumentLog from "../components/SupportEngagement/DocumentLog";
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
  }
};

// Maps frontend tab names to MySQL database table names
const tabToSqlTableMap = {
  "Company": "company",
  "Branch": "branch",
  "Department": "department",
  "Designation": "designation",
  "Business Unit": "business_unit",
  "Cost Center": "cost_center",
  "Reporting Hierarchy": "reporting_hierarchy",
  "Employee Profile": "employee_profile",
  "Job Requisition": "job_requisition",
  "Candidate Database": "candidate_database",
  "ATS (Applicant Tracking)": "ats_applicant_tracking",
  "Asset Allocation": "asset_allocation",
  "Daily Attendance": "daily_attendance",
  "Shift Master": "shift_master",
  "Leave Types": "leave_types",
  "Leave Requests": "leave_requests",
  "Salary Structure": "salary_structure",
  "Incentives & Claims": "incentives_claims",
  "PF Registry": "pf_registry",
  "Tax Declarations": "tax_declarations",
  "KPI & OKR": "kpi_okr",
  "Performance Reviews": "performance_reviews",
  "Courses": "courses",
  "LMS Progress": "lms_progress",
  "Inventory": "inventory",
  "Expense Claims": "expense_claims",
  "Document Log": "document_log",
  "Exit Logs": "exit_logs",
  "Approvals Pending": "approvals_pending",
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
  "Login History": "login_history"
};

const componentRegistry = {
  "Company": Company,
  "Branch": Branch,
  "Department": Department,
  "Designation": Designation,
  "Business Unit": BusinessUnit,
  "Cost Center": CostCenter,
  "Reporting Hierarchy": ReportingHierarchy,
  "Organizational Chart": OrganizationalChart,
  "Employee Profile": EmployeeProfile,
  "Asset Allocation": AssetAllocation,
  "Job Requisition": JobRequisition,
  "Candidate Database": CandidateDatabase,
  "ATS (Applicant Tracking)": ATSApplicantTracking,
  "KPI & OKR": KpiOkr,
  "Performance Reviews": PerformanceReviews,
  "Courses": Courses,
  "LMS Progress": LmsProgress,
  "Daily Attendance": DailyAttendance,
  "Shift Master": ShiftMaster,
  "Leave Types": LeaveTypes,
  "Leave Requests": LeaveRequests,
  "Inventory": Inventory,
  "Salary Structure": SalaryStructure,
  "Incentives & Claims": IncentivesClaims,
  "PF Registry": PfRegistry,
  "Tax Declarations": TaxDeclarations,
  "Expense Claims": ExpenseClaims,
  "Exit Logs": ExitLogs,
  "Approvals Pending": ApprovalsPending,
  "Document Log": DocumentLog,
  "Announcements & Surveys": AnnouncementsSurveys,
  "HR Tickets": HrTickets,
  "Complaint Management": ComplaintManagement,
  "Query Resolution": QueryResolution,
  "Service Requests": ServiceRequests,
  "Ticket Tracking": TicketTracking,
  "Logs": Logs,
  "Email Notifications": EmailNotifications,
  "SMS Notifications": SmsNotifications,
  "Push Notifications": PushNotifications,
  "Approval Alerts": ApprovalAlerts,
  "RBAC Roles": RbacRoles,
  "Audit Logs": AuditLogs,
  "Login History": LoginHistory
};

const HrConsolidationHub = () => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") || "CORE";
  const tabParam = searchParams.get("tab") || "Company";

  // Global Local State for all modules' records
  const [dbData, setDbData] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("CORE");
  const [selectedModule, setSelectedModule] = useState("1. Organization Setup");
  const [selectedTab, setSelectedTab] = useState("Company");

  // Sync state with URL category and tab parameters
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
      
      if (tabParam) {
        setSelectedTab(tabParam);
        // Find which module this tab belongs to dynamically
        let found = false;
        for (const [modName, modSchema] of Object.entries(hrSchemas)) {
          if (modSchema[tabParam]) {
            setSelectedModule(modName);
            found = true;
            break;
          }
        }
        if (!found) {
          // Fallback to first module of the category if tab is not found in schema
          const catData = CATEGORIES[categoryParam];
          if (catData && catData.modules.length > 0) {
            setSelectedModule(catData.modules[0]);
          }
        }
      } else {
        const catData = CATEGORIES[categoryParam];
        if (catData && catData.modules.length > 0) {
          const firstModule = catData.modules[0];
          setSelectedModule(firstModule);
          const moduleSchema = hrSchemas[firstModule] || {};
          const tabs = Object.keys(moduleSchema);
          if (tabs.length > 0) {
            setSelectedTab(tabs[0]);
          }
        }
      }
    }
  }, [categoryParam, tabParam]);

  // Layout View Modes: "dashboard" (visual panel) vs "table" (CRUD grid)
  const [viewMode, setViewMode] = useState("dashboard");

  // Search & Filter
  const [searchText, setSearchText] = useState("");
  const [showSchema, setShowSchema] = useState(false);

  // Modal / Form state for CRUD
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formFields, setFormFields] = useState({});
  const [validationError, setValidationError] = useState("");

  // Attendance simulation check-in state
  const [checkedIn, setCheckedIn] = useState(false);
  const [punchTime, setPunchTime] = useState("");

  // Fetch all tables from MySQL database
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const keys = Object.keys(tabToSqlTableMap);
      const responses = await Promise.all(
        keys.map(tab => getTableData(tabToSqlTableMap[tab]))
      );
      
      const newDbState = {};
      keys.forEach((tab, index) => {
        newDbState[tab] = responses[index] || [];
      });
      setDbData(newDbState);
    } catch (err) {
      console.error("Error loading data from database:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // ATS Kanban Stage updates
  const handleAtsMove = async (appId, recordId, nextStage) => {
    try {
      await updateTableRecord("ats_applicant_tracking", recordId, { stage: nextStage });
      // Update local state reactively
      setDbData(prev => {
        const updated = prev["ATS (Applicant Tracking)"].map(app => {
          if (app.id === recordId) {
            return { ...app, stage: nextStage };
          }
          return app;
        });
        return { ...prev, "ATS (Applicant Tracking)": updated };
      });
    } catch (err) {
      alert("Failed to update applicant stage in database.");
    }
  };

  // Get active fields based on active module & tab
  const activeFields = useMemo(() => {
    const moduleSchema = hrSchemas[selectedModule] || {};
    return moduleSchema[selectedTab] || [];
  }, [selectedModule, selectedTab]);

  const sqlTableName = useMemo(() => {
    return tabToSqlTableMap[selectedTab];
  }, [selectedTab]);

  // Sync tab when changing modules
  const handleModuleChange = (moduleName) => {
    setSelectedModule(moduleName);
    const moduleSchema = hrSchemas[moduleName] || {};
    const tabs = Object.keys(moduleSchema);
    if (tabs.length > 0) {
      setSelectedTab(tabs[0]);
    } else {
      setSelectedTab("");
    }
    setSearchText("");
    setValidationError("");
  };

  // CRUD handlers
  const handleOpenCreate = () => {
    const emptyForm = {};
    activeFields.forEach(f => {
      emptyForm[f.name] = f.type === "number" ? "" : f.type === "select" ? (f.options?.[0] || "") : "";
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
          setDbData(prev => {
            const tableData = prev[selectedTab] || [];
            const filtered = tableData.filter(item => item.id !== id);
            return { ...prev, [selectedTab]: filtered };
          });
        }
      } catch (err) {
        alert("Failed to delete record from database: " + err.message);
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setValidationError("");

    // Validate required fields
    const missing = activeFields.find(f => f.required && (!formFields[f.name] || String(formFields[f.name]).trim() === ""));
    if (missing) {
      setValidationError(`"${missing.label}" is required.`);
      return;
    }

    try {
      if (editingRecord) {
        // Edit mode (database update)
        const updatedRecord = await updateTableRecord(sqlTableName, editingRecord.id, formFields);
        if (updatedRecord) {
          setDbData(prev => {
            const tableData = prev[selectedTab] || [];
            const updated = tableData.map(item => item.id === editingRecord.id ? { ...item, ...formFields } : item);
            return { ...prev, [selectedTab]: updated };
          });
        }
      } else {
        // Create mode (database insert)
        const createdRecord = await createTableRecord(sqlTableName, formFields);
        if (createdRecord) {
          setDbData(prev => {
            const tableData = prev[selectedTab] || [];
            return { ...prev, [selectedTab]: [createdRecord, ...tableData] };
          });
        }
      }
      setShowModal(false);
    } catch (err) {
      setValidationError("Failed to write to MySQL database: " + err.message);
    }
  };

  // Check in check out simulation with database storage
  const handlePunchClick = async () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toISOString().split("T")[0];

    try {
      if (!checkedIn) {
        const newRecord = {
          empId: "EMP001",
          name: "Rahul Sharma",
          date: dateStr,
          checkIn: timeStr,
          checkOut: "--",
          workingHours: 0,
          status: "Present",
          lateComing: 0,
          earlyLeaving: 0,
          overtime: 0
        };
        const savedRecord = await createTableRecord("daily_attendance", newRecord);
        if (savedRecord) {
          setCheckedIn(true);
          setPunchTime(timeStr);
          setDbData(prev => {
            const attendanceList = prev["Daily Attendance"] || [];
            return { ...prev, "Daily Attendance": [savedRecord, ...attendanceList] };
          });
        }
      } else {
        // Find latest punch
        const attendanceList = dbData["Daily Attendance"] || [];
        const latestPunch = attendanceList.find(item => item.empId === "EMP001" && item.checkOut === "--");
        if (latestPunch) {
          const updatedRecord = await updateTableRecord("daily_attendance", latestPunch.id, {
            checkOut: timeStr,
            workingHours: 8.5
          });
          if (updatedRecord) {
            setCheckedIn(false);
            setDbData(prev => {
              const updatedList = (prev["Daily Attendance"] || []).map(item =>
                item.id === latestPunch.id ? { ...item, checkOut: timeStr, workingHours: 8.5 } : item
              );
              return { ...prev, "Daily Attendance": updatedList };
            });
          }
        } else {
          setCheckedIn(false);
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
    return Object.keys(hrSchemas[selectedModule] || {});
  }, [selectedModule]);

  // Filtered rows of the active tab table
  const filteredTableRows = useMemo(() => {
    const tableData = dbData[selectedTab] || [];
    if (!searchText) return tableData;

    return tableData.filter(row => {
      return Object.values(row).some(val =>
        String(val).toLowerCase().includes(searchText.toLowerCase())
      );
    });
  }, [dbData, selectedTab, searchText]);

  // ==================== RENDERING CUSTOM TAB DASHBOARDS ====================
  const renderTabDashboard = (tabName) => {
    const records = dbData[tabName] || [];

    if (records.length === 0) {
      return (
        <div className="text-center py-12 border border-dashed rounded-2xl bg-gray-50/50 p-6">
          <div className="text-slate-300 text-4xl mb-2">📊</div>
          <h4 className="font-bold text-gray-800 text-sm">{tabName} Dashboard is Empty</h4>
          <p className="text-xs text-gray-500 mt-1 mb-4">No records currently exist in the database table.</p>
          <button
            onClick={() => setViewMode("table")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
          >
            Go to Database Table to Add Data
          </button>
        </div>
      );
    }
    const Component = componentRegistry[tabName];
    if (Component) {
      return (
        <Component
          records={records}
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

    return null;
  };

  return (
    <div className="min-h-screen text-gray-800 bg-gray-50/50 p-2">
      {/* Main Workspace */}
      <div className="w-full bg-white rounded-2xl border border-gray-200/80 shadow-md p-6 font-sans">
        {/* Module Header */}
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSchema(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                showSchema
                  ? "bg-slate-100 text-slate-800 border-slate-300"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
              <span>{showSchema ? "Hide Schema" : "Show Schema Fields"}</span>
            </button>

            {currentTabs.length > 0 && (
              <button
                onClick={handleOpenCreate}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <span>+ Add {selectedTab}</span>
              </button>
            )}
          </div>
        </div>



        {/* View Mode Toggle Switch (Tab Dashboard vs Database CRUD Table) */}
        {currentTabs.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 border border-slate-200/50 p-2.5 rounded-xl mb-6 gap-3">
            <div className="flex gap-1.5">
              <button
                onClick={() => setViewMode("dashboard")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "dashboard"
                    ? "bg-white text-blue-600 shadow-sm border border-gray-200/40"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
                }`}
              >
                <span>📊 {selectedTab} Dashboard</span>
              </button>
              <button
                onClick={() => setViewMode("table")}
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
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full sm:w-64 px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            )}
          </div>
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
        {viewMode === "dashboard" ? (
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
                  records={dbData["Salary Structure"]}
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
                    <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-right">Actions</th>
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
                        onChange={(e) => setFormFields(prev => ({ ...prev, [f.name]: e.target.value }))}
                        className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      >
                        {f.options?.map(opt => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
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
