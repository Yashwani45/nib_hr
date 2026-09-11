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
{ name: "Designation Master", tab: "Designation" }
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
{ name: "Reporting Manager", tab: "Reporting Hierarchy" }
].filter(Boolean)
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
name: "Exit Management",
categoryKey: "EXIT_MGMT",
icon: ArrowRightOnRectangleIcon,
children: [
{ name: "Dashboard", tab: "Exit Dashboard" }
]
},
{
name: "Workflow & Approval",
categoryKey: "WORKFLOW",
icon: InboxStackIcon,
children: [
{ name: "Dashboard", tab: "Workflow Dashboard" }
]
},
{
name: "Helpdesk",
categoryKey: "HELPDESK",
icon: ChatBubbleLeftRightIcon,
children: [
{ name: "Dashboard", tab: "Helpdesk Dashboard" }
]
},
{
name: "Reports",
categoryKey: "REPORTS",
icon: PresentationChartBarIcon,
children: [
{ name: "Dashboard", tab: "Reports Dashboard" }
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
{ name: "Reporting Manager", tab: "Reporting Hierarchy" }
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
name: "Exit Management",
categoryKey: "EXIT_MGMT",
icon: ArrowRightOnRectangleIcon,
children: [
{ name: "Dashboard", tab: "Exit Dashboard" }
]
},
{
name: "Helpdesk",
categoryKey: "EMP_HELPDESK",
icon: WrenchScrewdriverIcon,
children: [
{ name: "Dashboard", tab: "Helpdesk Dashboard" }
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

const navRef = useRef(null);

const handleNavScroll = (e) => {
if (e?.currentTarget) {
sessionStorage.setItem("sidebar_scroll_top", String(e.currentTarget.scrollTop));
}
};

useEffect(() => {
const savedScroll = sessionStorage.getItem("sidebar_scroll_top");
if (savedScroll && navRef.current) {
navRef.current.scrollTop = Number(savedScroll);
}
}, [isOpen, searchParams]);

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
let items = [];

if (isEmployee) {
items = [...employeeMenuItems];
} else if (!isSuperAdmin && hasAssignedModules) {
const allowed = user.assignedModules.map(m => String(m).toLowerCase().trim());

const filteredStandard = menuItems.map(item => {
const itemNameLower = String(item.name).toLowerCase().trim();

// Check if it's a top level link (like Dashboard Overview)
if (!item.children) {
const isAllowed = allowed.includes("dashboard") || allowed.includes("dashboard overview");
return isAllowed ? item : null;
}

if (item.categoryKey === "PROFILE") {
return item;
}

// The category must be explicitly checked in the assigned modules list
const isCatAllowed = allowed.includes(itemNameLower);
if (!isCatAllowed) {
return null;
}

return item;
}).filter(Boolean);

// Dynamically add custom modules assigned to this user/department
const customAssigned = user.assignedModules.filter(mod => {
const modLower = String(mod).toLowerCase().trim();
const matchesStandard = menuItems.some(item => {
if (!item.children) return modLower === "dashboard" || modLower === "dashboard overview";
const categoryName = String(item.name).toLowerCase().trim();
return categoryName === modLower;
});
return !matchesStandard;
});

if (customAssigned.length > 0) {
const customMenuItems = customAssigned.map(customMod => ({
name: customMod,
icon: CubeIcon,
children: [
{
name: `${customMod} Workspace`,
path: `/department/${customMod.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
icon: DocumentTextIcon
}
]
}));
items = [...filteredStandard, ...customMenuItems];
} else {
items = filteredStandard;
}
} else {
items = [...menuItems];
}
return items;
}, [isEmployee, isSuperAdmin, hasAssignedModules, user?.assignedModules, employeeMenuItems, menuItems]);

