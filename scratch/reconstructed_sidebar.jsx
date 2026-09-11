import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setDbData } from "../redux/hrSlice";
import { getTableData } from "../services/hrApi";
import { useAuth } from "../auth/AuthProvider";
import {
  HomeIcon,
  BuildingOffice2Icon,
  AcademicCapIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  UserGroupIcon,
  CircleStackIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ArrowRightOnRectangleIcon,
  InboxStackIcon,
  DocumentDuplicateIcon,
  BellIcon,
  Cog6ToothIcon,
  UserIcon,
  PresentationChartBarIcon,
  CheckCircleIcon,
  CubeIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  MegaphoneIcon
} from "@heroicons/react/24/outline";
import technoLogo from "../assets/shortlogo1.png";

const ConnectedNodesIcon = (props) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="8" cy="16" r="2.5" fill="currentColor" />
      <circle cx="16" cy="8" r="2.5" fill="currentColor" />
      <line x1="9.4" y1="14.6" x2="14.6" y2="9.4" />
    </svg>
  );
};


const PinIcon = ({ className, pinned }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={pinned ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ transform: pinned ? "none" : "rotate(45deg)", transition: "transform 0.25s ease" }}
  >
    <line x1="12" x2="12" y1="17" y2="22" />
    <path d="M5 12V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6" />
    <path d="M2 12h20" />
    <path d="M9 12a3 3 0 1 0 6 0" />
  </svg>
);

const Sidebar = ({ isOpen, setIsOpen, isPinned, setIsPinned }) => {
  const dispatch = useDispatch();
  const { logout, user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dbData = useSelector((state) => state.hr.dbData) || {};
  const departmentsList = dbData.Department || [];
  const [openMenus, setOpenMenus] = useState(() => {
    try {
      const saved = localStorage.getItem("sidebar_open_menus");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Save open menus to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("sidebar_open_menus", JSON.stringify(openMenus));
  }, [openMenus]);

  // Load department table if not populated yet
  useEffect(() => {
    if (!departmentsList || departmentsList.length === 0) {
      getTableData("department").then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          dispatch(setDbData({ ...dbData, Department: data }));
        }
      }).catch(err => console.error("Error loading departments in sidebar:", err));
    }
  }, [dispatch]);

  const menuItems = useMemo(() => {
    const dynamicDeptNames = (departmentsList || [])
      .map(d => d.deptName || d.dept_name || d.name)
      .filter(Boolean);

    const uniqueDeptNames = Array.from(new Set(dynamicDeptNames));

    const departmentChildren = uniqueDeptNames.map(name => ({
      name: name,
      tab: name
    }));

    const userRoleStr = typeof user?.role === "object" ? user?.role?.name : user?.role;
    const isSuperAdmin = String(userRoleStr || "").toLowerCase() === "superadmin" || String(userRoleStr || "").toLowerCase() === "super admin" || user?.email === "superadmin@nib.com";
    const isAdmin = String(userRoleStr || "").toLowerCase() === "admin";
    const showAddEmployee = isSuperAdmin || isAdmin;

    const roleClean = String(userRoleStr || "").toLowerCase().trim();
    const isManager = roleClean === "manager";
    const isEmployee = roleClean === "employee";

    let recruitmentChildren = [
      { name: "Dashboard", tab: "Recruitment Dashboard" },
      { name: "Job Requisition", tab: "Job Requisition" },
      { name: "Job Posting", tab: "Job Posting" },
      { name: "Candidate Database", tab: "Candidate Database" },
      { name: "Resume Parsing", tab: "Resume Parsing" },
      { name: "ATS", tab: "ATS (Applicant Tracking)" },
      { name: "Interview", tab: "Interview" },
      { name: "Offer Letter", tab: "Offer Letter" },
      { name: "Onboarding", tab: "Onboarding" },
      { name: "Joining", tab: "Joining" }
    ];

    let groupName = "Recruitment & Onboarding";

    if (isManager) {
      recruitmentChildren = [
        { name: "Dashboard", tab: "Recruitment Dashboard" },
        { name: "Job Requisition", tab: "Job Requisition" },
        { name: "Job Posting", tab: "Job Posting" },
        { name: "Candidates", tab: "Candidates" },
        { name: "Interviews", tab: "Interviews" },
        { name: "Hiring Status", tab: "Hiring Status" }
      ];
    } else if (isEmployee) {
      groupName = "My Joining";
      recruitmentChildren = [
        { name: "My Position", tab: "My Position" },
        { name: "Offer Letter", tab: "My Offer Letter" },
        { name: "Joining Date", tab: "My Joining Date" },
        { name: "Onboarding", tab: "My Onboarding" },
        { name: "Joining Status", tab: "My Joining Status" }
      ];
    }

    return [
      { path: "/admin/dashboard", name: "Dashboard Overview", icon: HomeIcon },
      {
        name: "Organization Setup",
        categoryKey: "ORG_SETUP",
        icon: BuildingOffice2Icon,
        children: [
          { name: "Company", tab: "Company" },
          { name: "Branch", tab: "Branch" },
          { name: "Department", tab: "Department" },
          { name: "Designation Master", tab: "Designation" },
          { name: "Business Unit", tab: "Business Unit" },
          { name: "Cost Center", tab: "Cost Center" },
          { name: "Reporting Hierarchy", tab: "Reporting Hierarchy" },
          { name: "Organizational Chart", tab: "Organizational Chart" }
        ]
      },
      {
        name: "Employee Management",
        categoryKey: "EMPLOYEE_MGMT",
        icon: UserGroupIcon,
        children: [
           { name: "Employee Dashboard", tab: "Employee Dashboard" },
           showAddEmployee && { name: "Add Employee", tab: "Add Employee" },
           (!showAddEmployee) && { name: "Fill Details", tab: "Employee Profile" },
           { name: "Documents", tab: "Document Log" },
          { name: "Assets", tab: "Asset Allocation" },
          { name: "Bank Details", tab: "Bank Details" },
          { name: "Salary Details", tab: "Salary Structure" },
          { name: "Reporting Manager", tab: "Reporting Hierarchy" },
          { name: "Employee Timeline", tab: "Employee Timeline" }
        ].filter(Boolean)
      },
      {
        name: groupName,
        categoryKey: "RECRUITMENT",
        icon: BriefcaseIcon,
        children: recruitmentChildren
      },
      {
        name: "Attendance",
        categoryKey: "ATTENDANCE",
        icon: ClockIcon,
        children: [
          { name: "Dashboard", tab: "Attendance Dashboard" },
          { name: "Daily Attendance", tab: "Daily Attendance" },
          { name: "Monthly Attendance", tab: "Monthly Attendance" },
          { name: "Shift Management", tab: "Shift Master" },
          { name: "Biometric", tab: "Biometric" },
          { name: "Attendance Regularization", tab: "Attendance Regularization" },
          { name: "Overtime Master", tab: "Overtime" },
          { name: "Reports", tab: "Reports" }
        ]
      },
      {
        name: "Leave Management",
        categoryKey: "LEAVE_MGMT",
        icon: CalendarDaysIcon,
        children: [
          { name: "Dashboard", tab: "Leave Dashboard" },
          { name: "Leave Type Master", tab: "Leave Types" },
          { name: "Holiday Master", tab: "Holiday Calendar" },
          { name: "Leave Request", tab: "Leave Requests" },
          { name: "Leave Approval", tab: "Approvals Pending" },
          { name: "Leave Balance", tab: "Leave Balance" },
          { name: "Reports", tab: "Reports" }
        ]
      },
      {
        name: "Payroll",
        categoryKey: "PAYROLL",
        icon: BanknotesIcon,
        children: [
          { name: "Payroll Process", tab: "Payroll Process" },
          { name: "Payslip", tab: "Payslip" },
          { name: "Loan Management", tab: "Loan Management" },
          { name: "ESI Management", tab: "ESI Management" },
          { name: "Professional Tax (PT)", tab: "Professional Tax (PT)" },
          { name: "Reports", tab: "Reports" },
          { name: "Salary Structure", tab: "Salary Structure" }
        ]
      },
      {
        name: "Performance",
        categoryKey: "PERFORMANCE",
        icon: PresentationChartBarIcon,
        children: [
          { name: "Dashboard", tab: "Performance Dashboard" },
          { name: "Performance Master", tab: "Performance Reviews" },
          { name: "KPI", tab: "KPI & OKR" },
          { name: "Goals", tab: "Goals" },
          { name: "Appraisal", tab: "Performance Reviews" },
          { name: "Promotion", tab: "Promotion" },
          { name: "Increment", tab: "Increment" },
          { name: "Reports", tab: "Reports" }
        ]
      },
      {
        name: "Learning",
        categoryKey: "LEARNING",
        icon: AcademicCapIcon,
        children: [
          { name: "Dashboard", tab: "Learning Dashboard" }
        ]
      },
      {
        name: "Asset Management",
        categoryKey: "ASSET_MGMT",
        icon: BuildingOffice2Icon,
        children: [
          { name: "Dashboard", tab: "Asset Dashboard" },
          { name: "Asset List", tab: "Inventory" },
          { name: "Asset Allocation", tab: "Asset Allocation" },
          { name: "Asset Return", tab: "Asset Return" },
          { name: "Asset History", tab: "Asset History" },
          { name: "Maintenance", tab: "Maintenance" },
          { name: "Reports", tab: "Reports" }
        ]
      },
      {
        name: "Document Management",
        categoryKey: "DOCUMENT_MGMT",
        icon: DocumentDuplicateIcon,
        children: [
          { name: "Letter Workspace", tab: "Letter Workspace" }
        ]
      },
      {
        name: "Employee Exit",
        categoryKey: "EXIT_MGMT",
        icon: ArrowRightOnRectangleIcon,
        children: [
          { name: "Exit Dashboard", tab: "Exit Dashboard" },
          { name: "Resignation", tab: "Resignation" },
          { name: "Notice Period", tab: "Notice Period" },
          { name: "Exit Clearance", tab: "Exit Clearance" },
          { name: "Asset Return", tab: "Asset Return" },
          { name: "No Dues", tab: "No Dues" },
          { name: "F&F Settlement", tab: "F&F Settlement" },
          { name: "Exit Interview", tab: "Exit Interview" },
          { name: "Experience Letter", tab: "Experience Letter" },
          { name: "Exit History", tab: "Exit History" }
        ]
      },
      {
        name: "Workflow & Approval",
        categoryKey: "WORKFLOW",
        icon: InboxStackIcon,
        children: [
          { name: "Dashboard", tab: "Workflow Dashboard" },
          { name: "Leave Approval", tab: "Approvals Pending" },
          { name: "Expense Approval", tab: "Expense Claims" },
          { name: "Recruitment Approval", tab: "Recruitment Approval" },
          { name: "Promotion Approval", tab: "Promotion Approval" },
          { name: "Transfer Approval", tab: "Transfer Approval" },
          { name: "Separation Approval", tab: "Separation Approval" },
          { name: "Approval History", tab: "Approval History" }
        ]
      },
      {
        name: "Employee Engagement",
        categoryKey: "ENGAGEMENT",
        icon: ChatBubbleLeftRightIcon,
        children: [
          { name: "Announcements", tab: "Announcements & Surveys" },
          { name: "News", tab: "News" },
          { name: "Events", tab: "Events" },
          { name: "Birthday", tab: "Birthday" },
          { name: "Work Anniversary", tab: "Work Anniversary" },
          { name: "Rewards", tab: "Rewards" },
          { name: "Survey", tab: "Announcements & Surveys" },
          { name: "Feedback", tab: "Feedback" }
        ]
      },
      {
        name: "Helpdesk",
        categoryKey: "HELPDESK",
        icon: ChatBubbleLeftRightIcon,
        children: [
          { name: "Dashboard", tab: "Helpdesk Dashboard" },
          { name: "Tickets", tab: "HR Tickets" },
          { name: "Complaints", tab: "Complaint Management" },
          { name: "Service Request", tab: "Service Requests" },
          { name: "Query Resolution", tab: "Query Resolution" },
          { name: "Tracking", tab: "Ticket Tracking" }
        ]
      },
      {
        name: "Reports",
        categoryKey: "REPORTS",
        icon: PresentationChartBarIcon,
        children: [
          { name: "Employee", tab: "Employee Report" },
          { name: "Attendance", tab: "Attendance Report" },
          { name: "Leave", tab: "Leave Report" },
          { name: "Payroll", tab: "Payroll Report" },
          { name: "Recruitment", tab: "Recruitment Report" },
          { name: "Performance", tab: "Performance Report" },
          { name: "Training", tab: "Training Report" },
          { name: "Compliance", tab: "Compliance Report" },
          { name: "Attrition", tab: "Attrition Report" },
          { name: "Custom Reports", tab: "Custom Reports" }
        ]
      },
      {
        name: "Notifications",
        categoryKey: "NOTIFICATIONS",
        icon: BellIcon,
        children: [
          { name: "Email", tab: "Email Notifications" },
          { name: "SMS", tab: "SMS Notifications" },
          { name: "Push", tab: "Push Notifications" },
          { name: "Approval Alerts", tab: "Approval Alerts" },
          { name: "Birthday Alerts", tab: "Birthday Alerts" },
          { name: "Policy Updates", tab: "Policy Updates" }
        ]
      },
      {
        name: "Departments",
        categoryKey: "DEPARTMENT",
        icon: UserGroupIcon,
        children: departmentChildren
      },
      {
        name: "Settings",
        categoryKey: "SETTINGS",
        icon: Cog6ToothIcon,
        children: [
          { name: "Company Settings", tab: "Company Settings" },
          { name: "Attendance Settings", tab: "Attendance Settings" },
          { name: "Leave Settings", tab: "Leave Settings" },
          { name: "Payroll Settings", tab: "Payroll Settings" },
          { name: "Shift Settings", tab: "Shift Settings" },
          { name: "Notification Settings", tab: "Notification Settings" },
          { name: "Email Templates", tab: "Email Templates" },
          { name: "Document Templates", tab: "Document Templates" },
          { name: "Security", tab: "Security" },
          { name: "Audit Logs", tab: "Audit Logs" }
        ]
      }
    ];
  }, [departmentsList, user]);

  const employeeMenuItems = useMemo(() => {
    return [
      {
        name: "Dashboard",
        categoryKey: "EMP_DASHBOARD",
        icon: HomeIcon,
        children: [
          { name: "Dashboard Home", tab: "Dashboard Home" },
          { name: "Welcome Card", tab: "Welcome Card" },
          { name: "Employee Summary", tab: "Employee Summary" },
          { name: "Quick Actions", tab: "Quick Actions" },
          { name: "Today's Attendance", tab: "Today's Attendance" },
          { name: "Leave Balance", tab: "Leave Balance" },
          { name: "Working Hours", tab: "Working Hours" },
          { name: "Pending Requests", tab: "Pending Requests" },
          { name: "Assigned Assets", tab: "Assigned Assets" },
          { name: "Upcoming Holidays", tab: "Upcoming Holidays" },
          { name: "Upcoming Birthdays", tab: "Upcoming Birthdays" },
          { name: "Work Anniversary", tab: "Work Anniversary" },
          { name: "Announcements", tab: "Announcements" },
          { name: "Notifications", tab: "Notifications" },
          { name: "Performance Summary", tab: "Performance Summary" },
          { name: "Training Progress", tab: "Training Progress" },
          { name: "Recent Activities", tab: "Recent Activities" }
        ]
      },
      {
        name: "Employee Management",
        categoryKey: "EMPLOYEE_MGMT",
        icon: UserGroupIcon,
        children: [
          { name: "Employee Dashboard", tab: "Employee Dashboard" },
          { name: "Fill Details", tab: "Employee Profile" },
          { name: "Documents", tab: "Document Log" },
          { name: "Assets", tab: "Asset Allocation" },
          { name: "Bank Details", tab: "Bank Details" },
          { name: "Salary Details", tab: "Salary Structure" },
          { name: "Reporting Manager", tab: "Reporting Hierarchy" },
          { name: "Employee Timeline", tab: "Employee Timeline" }
        ]
      },

      {
        name: "Attendance",
        categoryKey: "EMP_ATTENDANCE",
        icon: ClockIcon,
        children: [
          { name: "Check In", tab: "Check In" },
          { name: "Check Out", tab: "Check Out" },
          { name: "Today's Attendance", tab: "Today's Attendance" },
          { name: "Attendance Calendar", tab: "Attendance Calendar" },
          { name: "Attendance History", tab: "Attendance History" },
          { name: "Monthly Attendance", tab: "Monthly Attendance" },
          { name: "Shift Details", tab: "Shift Details" },
          { name: "Overtime", tab: "Overtime" },
          { name: "Attendance Regularization", tab: "Attendance Regularization" },
          { name: "Biometric Logs", tab: "Biometric Logs" },
          { name: "Attendance Reports", tab: "Attendance Reports" }
        ]
      },
      {
        name: "Leave Management",
        categoryKey: "EMP_LEAVE",
        icon: CalendarDaysIcon,
        children: [
          { name: "Apply Leave", tab: "Apply Leave" },
          { name: "Leave Balance", tab: "Leave Balance" },
          { name: "Leave History", tab: "Leave History" },
          { name: "Leave Calendar", tab: "Leave Calendar" },
          { name: "Holiday Calendar", tab: "Holiday Calendar" },
          { name: "Comp-Off", tab: "Comp-Off" },
          { name: "Leave Status", tab: "Leave Status" },
          { name: "Leave Approval History", tab: "Leave Approval History" },
          { name: "Leave Reports", tab: "Leave Reports" }
        ]
      },
      {
        name: "Payroll",
        categoryKey: "EMP_PAYROLL",
        icon: BanknotesIcon,
        children: [
          { name: "Salary Slips", tab: "Salary Slips" },
          { name: "Salary Structure", tab: "Salary Structure" },
          { name: "Payroll History", tab: "Payroll History" },
          { name: "Tax Details", tab: "Tax Details" },
          { name: "PF Details", tab: "PF Details" },
          { name: "ESI Details", tab: "ESI Details" },
          { name: "Loan Details", tab: "Loan Details" },
          { name: "Reimbursements", tab: "Reimbursements" },
          { name: "Form-16", tab: "Form-16" },
          { name: "Payroll Reports", tab: "Payroll Reports" }
        ]
      },
      {
        name: "Performance",
        categoryKey: "EMP_PERFORMANCE",
        icon: PresentationChartBarIcon,
        children: [
          { name: "Goals", tab: "Goals" },
          { name: "KPI", tab: "KPI" },
          { name: "OKR", tab: "OKR" },
          { name: "Self Appraisal", tab: "Self Appraisal" },
          { name: "Manager Feedback", tab: "Manager Feedback" },
          { name: "Performance Rating", tab: "Performance Rating" },
          { name: "Promotions", tab: "Promotions" },
          { name: "Increments", tab: "Increments" },
          { name: "Performance History", tab: "Performance History" }
        ]
      },
      {
        name: "Learning & Training",
        categoryKey: "EMP_LEARNING",
        icon: AcademicCapIcon,
        children: [
          { name: "Assigned Courses", tab: "Assigned Courses" },
          { name: "My Learning", tab: "My Learning" },
          { name: "Training Calendar", tab: "Training Calendar" },
          { name: "Certifications", tab: "Certifications" },
          { name: "Assessments", tab: "Assessments" },
          { name: "Quiz", tab: "Quiz" },
          { name: "Training Feedback", tab: "Training Feedback" },
          { name: "Learning Reports", tab: "Learning Reports" }
        ]
      },
      {
        name: "Asset Management",
        categoryKey: "EMP_ASSETS",
        icon: BriefcaseIcon,
        children: [
          { name: "Assigned Assets", tab: "Assigned Assets" },
          { name: "Asset Requests", tab: "Asset Requests" },
          { name: "Asset Return", tab: "Asset Return" },
          { name: "Asset History", tab: "Asset History" },
          { name: "Software Licenses", tab: "Software Licenses" },
          { name: "Asset Documents", tab: "Asset Documents" }
        ]
      },
      {
        name: "Travel & Expense",
        categoryKey: "EMP_TRAVEL_EXPENSE",
        icon: InboxStackIcon,
        children: [
          { name: "Travel Request", tab: "Travel Request" },
          { name: "Travel History", tab: "Travel History" },
          { name: "Expense Claims", tab: "Expense Claims" },
          { name: "Bills Upload", tab: "Bills Upload" },
          { name: "Reimbursements", tab: "Reimbursements" },
          { name: "Expense Reports", tab: "Expense Reports" }
        ]
      },
      {
        name: "Documents",
        categoryKey: "EMP_DOCUMENTS",
        icon: DocumentDuplicateIcon,
        children: [
          { name: "Letter Workspace", tab: "Letter Workspace" }
        ]
      },
      {
        name: "Employee Exit",
        categoryKey: "EXIT_MGMT",
        icon: ArrowRightOnRectangleIcon,
        children: [
          { name: "Resignation", tab: "Resignation" },
          { name: "Notice Period", tab: "Notice Period" },
          { name: "Exit Clearance", tab: "Exit Clearance" },
          { name: "Asset Return", tab: "Asset Return" },
          { name: "No Dues", tab: "No Dues" },
          { name: "F&F Settlement", tab: "F&F Settlement" },
          { name: "Exit Interview", tab: "Exit Interview" },
          { name: "Experience Letter", tab: "Experience Letter" }
        ]
      },
      {
        name: "Helpdesk",
        categoryKey: "EMP_HELPDESK",
        icon: WrenchScrewdriverIcon,
        children: [
          { name: "Raise Ticket", tab: "Raise Ticket" },
          { name: "My Tickets", tab: "My Tickets" },
          { name: "Ticket Status", tab: "Ticket Status" },
          { name: "Service Requests", tab: "Service Requests" },
          { name: "Ticket History", tab: "Ticket History" }
        ]
      },
      {
        name: "Employee Engagement",
        categoryKey: "EMP_ENGAGEMENT",
        icon: MegaphoneIcon,
        children: [
          { name: "Announcements", tab: "Announcements" },
          { name: "Company News", tab: "Company News" },
          { name: "Events", tab: "Events" },
          { name: "Birthdays", tab: "Birthdays" },
          { name: "Work Anniversaries", tab: "Work Anniversaries" },
          { name: "Surveys", tab: "Surveys" },
          { name: "Polls", tab: "Polls" },
          { name: "Recognition", tab: "Recognition" },
          { name: "Rewards", tab: "Rewards" }
        ]
      },
      {
        name: "Notifications",
        categoryKey: "EMP_NOTIFICATIONS",
        icon: BellIcon,
        children: [
          { name: "Inbox", tab: "Inbox" },
          { name: "Email Notifications", tab: "Email Notifications" },
          { name: "Push Notifications", tab: "Push Notifications" },
          { name: "Approval Alerts", tab: "Approval Alerts" },
          { name: "HR Notifications", tab: "HR Notifications" },
          { name: "System Notifications", tab: "System Notifications" }
        ]
      },
      {
        name: "Reports",
        categoryKey: "EMP_REPORTS",
        icon: PresentationChartBarIcon,
        children: [
          { name: "Attendance Report", tab: "Attendance Report" },
          { name: "Leave Report", tab: "Leave Report" },
          { name: "Payroll Report", tab: "Payroll Report" },
          { name: "Performance Report", tab: "Performance Report" },
          { name: "Training Report", tab: "Training Report" },
          { name: "Asset Report", tab: "Asset Report" },
          { name: "Expense Report", tab: "Expense Report" }
        ]
      },
      {
        name: "Settings",
        categoryKey: "EMP_SETTINGS",
        icon: Cog6ToothIcon,
        children: [
          { name: "Change Password", tab: "Change Password" },
          { name: "Two-Factor Authentication", tab: "Two-Factor Authentication" },
          { name: "Security Settings", tab: "Security Settings" },
          { name: "Notification Preferences", tab: "Notification Preferences" },
          { name: "Language", tab: "Language" },
          { name: "Theme", tab: "Theme" },
          { name: "Privacy Settings", tab: "Privacy Settings" },
          { name: "Logout", tab: "Logout" }
        ]
      }
    ];
  }, []);

  // Auto-expand category accordions on mount or query updates
  useEffect(() => {
    const activeCategory = searchParams.get("category");
    if (activeCategory) {
      const match = menuItems.find((item) => item.categoryKey === activeCategory);
      if (match) {
        setOpenMenus((prev) => ({ ...prev, [match.name]: true }));
      }
    }
  }, [searchParams]);

  const toggleMenu = (name) => {
    setOpenMenus((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const closeOnMobile = () => {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setIsOpen(false);
    }
  };

  const userRoleStr = typeof user?.role === "object" ? user?.role?.name : user?.role;
  const isEmployee = String(userRoleStr || "").toLowerCase() === "employee";
  const isSuperAdmin = String(userRoleStr || "").toLowerCase() === "superadmin" || String(userRoleStr || "").toLowerCase() === "super admin" || user?.email === "superadmin@nib.com";
  const hasAssignedModules = Array.isArray(user?.assignedModules) && user.assignedModules.length > 0;

  const activeMenuItems = useMemo(() => {
































































      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => {
        if (!isPinned) {
          setIsOpen(false);
        }
      }}
      className={`fixed left-0 top-0 h-screen bg-white shadow-lg z-30 transition-all duration-300 overflow-hidden border-r flex flex-col ${
        isOpen
          ? "w-64 translate-x-0"
          : "w-64 -translate-x-full lg:w-20 lg:translate-x-0"
      }`}
    >
      {/* Logo Section with TechnoVani brand */}
      <div
        className={`h-16 flex items-center border-b border-gray-200/80 shrink-0 transition-all duration-300 ${
          isOpen ? "px-5 justify-start" : "px-0 justify-center"
        }`}
      >
        <Link to="/" className="flex items-center gap-2.5 min-w-0">
          <img 
            src={technoLogo} 
            alt="TechnoVani" 
            className="h-9 w-9 object-contain shrink-0"
          />
          {isOpen && (
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#0284c7] via-[#7c3aed] to-[#db2777] bg-clip-text text-transparent whitespace-nowrap truncate select-none">
              TechnoVani
            </span>
          )}
        </Link>
      </div>

      <nav className={`flex-1 p-2 ${isOpen ? "space-y-1.5" : "space-y-4"} overflow-y-auto max-h-[calc(100vh-4rem)] scrollbar-thin scrollbar-thumb-slate-300`}>
        {activeMenuItems.map((item) => {
          const Icon = item.icon;

          if (!item.children) {
            // Dashboard link
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeOnMobile}
                className={
                  isOpen
                    ? `flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-sm transition group relative ${
                        active
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                      }`
                    : `w-12 h-12 mx-auto flex items-center justify-center rounded-xl transition ${
                        active
                          ? "bg-gradient-to-b from-blue-600 to-blue-500 text-white shadow-md"
                          : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                      }`
                }
              >
                <Icon
                  className={`w-6 h-6 shrink-0 ${
                    active ? "sidebar-icon-active" : "sidebar-icon-inactive"
                  }`}
                />
                {isOpen && (
                  <>
                    <span className="whitespace-nowrap overflow-hidden transition-all duration-300">
                      {item.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsPinned(!isPinned);
                      }}
                      className={`ml-auto p-1 rounded transition-all ${
                        active
                          ? isPinned
                            ? "text-blue-200 hover:bg-blue-700 hover:text-white"
                            : "text-blue-200 opacity-0 group-hover:opacity-100 hover:bg-blue-700 hover:text-white"
                          : isPinned
                            ? "text-blue-600 hover:bg-blue-50"
                            : "text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-600"
                      }`}
                      title={isPinned ? "Unpin Sidebar" : "Pin Sidebar"}
                    >
                      <PinIcon pinned={isPinned} className="w-4 h-4" />
                    </button>
                  </>
                )}
              </Link>
            );
          }

          // Category accordion links
          const isCategoryExpanded = !!openMenus[item.name] && isOpen;
          const isCategoryActive =
            location.pathname === "/hr-hub" &&
            searchParams.get("category") === item.categoryKey;

          return (
            <div key={item.name} className="space-y-1">
              <button
                onClick={() => {
                  if (!isOpen) setIsOpen(true);
                  toggleMenu(item.name);
                }}
                className={
                  isOpen
                    ? `w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg font-bold text-sm transition ${
                        isCategoryActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700 hover:bg-blue-50/50 hover:text-blue-600"
                      }`
                    : `w-12 h-12 mx-auto flex items-center justify-center rounded-xl transition ${
                        isCategoryActive
                          ? "bg-gradient-to-b from-blue-600 to-blue-500 text-white shadow-md"
                          : "text-gray-700 hover:bg-blue-50/50 hover:text-blue-600"
                      }`
                }
              >
                {isOpen ? (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className="w-6 h-6 shrink-0 sidebar-icon-inactive"
                      />
                      <span className="whitespace-nowrap overflow-hidden transition-all duration-300 text-left">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-gray-400">
                      {isCategoryExpanded ? (
                        <ChevronDownIcon className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRightIcon className="w-3.5 h-3.5" />
                      )}
                    </span>
                  </>
                ) : (
                  <Icon
                    className={`w-6 h-6 shrink-0 ${
                      isCategoryActive ? "sidebar-icon-active" : "sidebar-icon-inactive"
                    }`}
                  />
                )}
              </button>

              {/* Sub-items list nested under expanded accordion - ENLARGED VERSION */}
              {isCategoryExpanded && (
                <div className="pl-4 pr-2 py-2 space-y-1.5 border-l border-blue-100 ml-5 bg-slate-50/50 rounded-lg">
                  {item.children.map((child) => {
                    if (child.name === "Logout") {
                      return (
                        <button
                          key={child.name}
                          onClick={() => {
                            closeOnMobile();
                            logout();
                          }}
                          className="w-full block text-left px-3 py-2.5 rounded text-sm font-bold transition text-red-500 hover:bg-red-50 hover:text-red-700"
                        >
                          • {child.name}
                        </button>
                      );
                    }

                    const isChildActive = isEmployee
                      ? location.pathname === "/employee/dashboard" &&
                        searchParams.get("category") === item.categoryKey &&
                        searchParams.get("tab") === child.name
                      : location.pathname === "/hr-hub" &&
                        searchParams.get("category") === item.categoryKey &&
                        searchParams.get("tab") === child.tab;

                    const childPath = isEmployee
                      ? `/employee/dashboard?category=${item.categoryKey}&tab=${encodeURIComponent(child.name)}`