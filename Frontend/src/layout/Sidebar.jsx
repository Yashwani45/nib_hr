import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setDbData } from "../redux/hrSlice";
import { getTableData } from "../services/hrApi";
import { useAuth } from "../auth/AuthProvider";
import {
  HomeIcon,
  BuildingOffice2Icon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  UserGroupIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  PresentationChartBarIcon,
  DocumentTextIcon,
  ReceiptPercentIcon,
  XMarkIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";
import technoLogo from "../assets/shortlogo1.png";

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

  // Synchronize dynamic custom modules from localStorage and event notifications
  const [customModulesList, setCustomModulesList] = useState(() => {
    try {
      const stored = localStorage.getItem("hrms_custom_modules");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    const handleSync = () => {
      try {
        const stored = localStorage.getItem("hrms_custom_modules");
        if (stored) {
          setCustomModulesList(JSON.parse(stored));
        }
      } catch (e) {}
    };
    window.addEventListener("custom_modules_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("custom_modules_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const activeCompanyName = localStorage.getItem("selected_company_name") || user?.companyName || "NIB Insurance";
  const userRole = typeof user?.role === "object" ? user?.role?.name : (user?.role || "Employee");
  const userName = user?.firstName 
    ? `${user.firstName} ${user.lastName || ''}`.trim() 
    : (user?.name || user?.employeeName || user?.email?.split('@')[0] || "User");
  const userInitial = (userName.charAt(0) || "U").toUpperCase();

  // Handle mobile body scroll lock & Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && window.innerWidth < 1024) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    if (isOpen && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, setIsOpen]);

  const handleMouseEnter = () => {
    if (window.innerWidth >= 1024) {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth >= 1024 && !isPinned) {
      setIsOpen(false);
    }
  };

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
    const resolvedRole = typeof user?.role === "object" ? user?.role?.name : user?.role;
    const roleLower = String(resolvedRole || "").toLowerCase();
    const defaultDashboardPath = roleLower === "superadmin"
      ? "/super-admin/dashboard"
      : roleLower === "manager"
        ? "/manager/dashboard"
        : roleLower === "departmenthr"
          ? "/hr-hub?category=DEPARTMENT&tab=Department%20Dashboard"
          : roleLower === "employee"
            ? "/employee/dashboard"
            : "/admin/dashboard";

    return [
      { path: defaultDashboardPath, name: "Dashboard Overview", icon: HomeIcon },
      {
        name: "Organization Setup",
        categoryKey: "ORG_SETUP",
        icon: BuildingOffice2Icon,
        children: [
          { name: "Company Profile", tab: "Company" },
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
          { name: "Add Employee", tab: "Add Employee" },
          { name: "Documents", tab: "Document Log" },
          { name: "Assets", tab: "Asset Allocation" },
          { name: "Bank Details", tab: "Bank Details" },
        ]
      },
      {
        name: "Attendance",
        categoryKey: "ATTENDANCE",
        icon: ClockIcon,
        children: [
          { name: "Dashboard", tab: "Attendance Dashboard" },
          { name: "QR Attendance", tab: "QR Attendance" },
          { name: "Monthly Attendance", tab: "Monthly Attendance" },
          { name: "Face Attendance", tab: "Face Attendance" },
          { name: "Shift Management", tab: "Shift Master" },
          { name: "Biometric", tab: "Biometric" },
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
          { name: "Reports", tab: "Reports" }
        ]
      },
      {
        name: "Payroll",
        categoryKey: "PAYROLL",
        icon: BanknotesIcon,
        children: [
          { name: "Payroll Dashboard", path: "/payroll/dashboard", tab: "Payroll Dashboard" },
          { name: "Salary Structure", path: "/payroll/salary-structure", tab: "Salary Structure" },
          { name: "Payroll Process", path: "/payroll/process", tab: "Payroll Process" },
          { name: "Payslips", path: "/payroll/payslips", tab: "Payslips" },
          { name: "Loan & Advance", path: "/payroll/loan-advance", tab: "Loan & Advance" },
          { name: "ESI Management", path: "/payroll/esi", tab: "ESI Management" },
          { name: "Professional Tax (PT)", path: "/payroll/pt", tab: "Professional Tax (PT)" },
          { name: "Payroll Reports", path: "/payroll/reports", tab: "Payroll Reports" }
        ]
      },
      {
        name: "Expense Claims",
        categoryKey: "EMP_EXPENSES",
        icon: ReceiptPercentIcon,
        children: [
          { name: "Expense Reimbursement", tab: "Expense Reimbursement", path: "/employee/dashboard?category=EMP_EXPENSES&tab=Expense%20Reimbursement" }
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
        name: "Settings",
        categoryKey: "SETTINGS",
        icon: Cog6ToothIcon,
        children: [
          { name: "Dashboard", tab: "Settings Dashboard" }
        ]
      }
    ];
  }, []);

  const activeMenuItems = useMemo(() => {
    const userRole = typeof user?.role === "object" ? user?.role?.name : user?.role;

    // Collect all unique custom modules
    const standardModuleNames = [
      "dashboard", "organization setup", "employee management", "recruitment", 
      "attendance", "leave management", "payroll", "expense claims", 
      "exit management", "helpdesk", "reports", "settings"
    ];
    
    const assigned = Array.isArray(user?.assignedModules) ? user.assignedModules : [];
    const allCustomNames = Array.from(new Set([
      ...customModulesList,
      ...assigned
    ])).filter(m => !standardModuleNames.includes(String(m).toLowerCase().trim()));

    const customMenuItems = allCustomNames.map(customName => ({
      name: customName,
      categoryKey: `CUSTOM_${customName.replace(/\s+/g, '_').toUpperCase()}`,
      icon: SparklesIcon,
      path: `/admin/dashboard?category=CUSTOM&tab=${encodeURIComponent(customName)}`,
      tab: customName,
      isCustom: true
    }));

    if (!user || userRole === "SuperAdmin" || userRole === "Admin") {
      return [...menuItems, ...customMenuItems];
    }

    // Role: Employee -> Pure Employee Self-Service (ESS).
    if (userRole === "Employee") {
      return [
        { path: "/employee/dashboard", name: "Dashboard Overview", icon: HomeIcon },
        {
          name: "My Profile",
          categoryKey: "EMPLOYEE_MGMT",
          icon: UserGroupIcon,
          children: [
            { name: "Personal Information", tab: "Employee Profile", path: "/employee/dashboard?category=EMPLOYEE_MGMT&tab=Employee%20Profile" },
            { name: "My Documents", tab: "Documents", path: "/employee/dashboard?category=EMPLOYEE_MGMT&tab=Documents" },
            { name: "My Assets", tab: "Assets", path: "/employee/dashboard?category=EMPLOYEE_MGMT&tab=Assets" },
            { name: "Bank Details", tab: "Bank Details", path: "/employee/dashboard?category=EMPLOYEE_MGMT&tab=Bank%20Details" }
          ]
        },
        {
          name: "Attendance",
          categoryKey: "EMP_ATTENDANCE",
          icon: ClockIcon,
          children: [
            { name: "Monthly Attendance", tab: "Monthly Attendance", path: "/employee/dashboard?category=EMP_ATTENDANCE&tab=Monthly%20Attendance" }
          ]
        },
        {
          name: "Leave",
          categoryKey: "EMP_LEAVE",
          icon: CalendarDaysIcon,
          children: [
            { name: "Apply Leave", tab: "Apply Leave", path: "/employee/dashboard?category=EMP_LEAVE&tab=Apply%20Leave" }
          ]
        },
        {
          name: "Payroll",
          categoryKey: "EMP_PAYROLL",
          icon: BanknotesIcon,
          children: [
            { name: "My Payslips", tab: "My Payslips", path: "/employee/dashboard?category=EMP_PAYROLL&tab=My%20Payslips" }
          ]
        },
        {
          name: "Expense Claims",
          categoryKey: "EMP_EXPENSES",
          icon: ReceiptPercentIcon,
          children: [
            { name: "Expense Reimbursement", tab: "Expense Reimbursement", path: "/employee/dashboard?category=EMP_EXPENSES&tab=Expense%20Reimbursement" }
          ]
        },
        {
          name: "Helpdesk",
          categoryKey: "HELPDESK",
          icon: ChatBubbleLeftRightIcon,
          children: [
            { name: "Support Tickets", tab: "Helpdesk Dashboard", path: "/employee/dashboard?category=HELPDESK&tab=Helpdesk%20Dashboard" }
          ]
        }
      ];
    }

    // Role: Manager -> Team pulse, leave approvals, attendance
    if (userRole === "Manager") {
      return [
        { path: "/manager/dashboard", name: "Dashboard Overview", icon: HomeIcon },
        {
          name: "Team Attendance",
          categoryKey: "ATTENDANCE",
          icon: ClockIcon,
          children: [
            { name: "Attendance Dashboard", tab: "Attendance Dashboard", path: "/hr-hub?category=ATTENDANCE&tab=Attendance%20Dashboard" },
            { name: "Monthly Attendance", tab: "Monthly Attendance", path: "/hr-hub?category=ATTENDANCE&tab=Monthly%20Attendance" }
          ]
        },
        {
          name: "Leave Approvals",
          categoryKey: "LEAVE_MGMT",
          icon: CalendarDaysIcon,
          children: [
            { name: "Pending Approvals", tab: "Approvals Pending", path: "/hr-hub?category=LEAVE_MGMT&tab=Approvals%20Pending" },
            { name: "Leave Requests", tab: "Leave Requests", path: "/hr-hub?category=LEAVE_MGMT&tab=Leave%20Requests" }
          ]
        },
        {
          name: "Expense Claims",
          categoryKey: "EMP_EXPENSES",
          icon: ReceiptPercentIcon,
          children: [
            { name: "Expense Reimbursement", tab: "Expense Reimbursement", path: "/employee/dashboard?category=EMP_EXPENSES&tab=Expense%20Reimbursement" }
          ]
        }
      ];
    }

    if (userRole === "DepartmentHR" || (user?.assignedModules && Array.isArray(user.assignedModules) && user.assignedModules.length > 0)) {
      const baseAllowed = (user?.assignedModules && Array.isArray(user.assignedModules) && user.assignedModules.length > 0)
        ? user.assignedModules.map((m) => String(m).toLowerCase().trim())
        : ["dashboard", "organization setup", "employee management", "recruitment", "attendance", "leave management", "payroll", "performance", "training", "asset", "helpdesk", "reports"];

      // Guarantee expense claims is always accessible to Department HR and managers
      const allowed = [...baseAllowed, "expense claims", "expense", "expenses", "expense reimbursement", "claims"];

      const standardFiltered = menuItems
        .filter((item) => {
          const itemName = item.name.toLowerCase().trim();
          if (itemName === "dashboard overview" && allowed.some((m) => m.includes("dashboard"))) {
            return true;
          }
          return allowed.some((m) => itemName.includes(m) || m.includes(itemName));
        })
        .map((item) => {
          // If Organization Setup, restrict corporate setup items (Company Profile, Branch) for Department HR
          if (item.name === "Organization Setup" && item.children) {
            return {
              ...item,
              children: item.children.filter((child) => {
                const childName = (child.name || "").toLowerCase();
                return !["company profile", "branch"].includes(childName);
              })
            };
          }
          return item;
        })
        .filter((item) => !item.children || item.children.length > 0);

      // Include custom modules assigned to this user/department
      const userCustomItems = customMenuItems.filter(ci => 
        allowed.some(m => m === ci.name.toLowerCase().trim() || ci.name.toLowerCase().trim().includes(m))
      );

      return [...standardFiltered, ...userCustomItems];
    }

    return [...menuItems, ...customMenuItems];
  }, [menuItems, user, customModulesList]);

  // Auto-expand category accordions on mount or query/route updates
  useEffect(() => {
    const activeCategory = searchParams.get("category");
    if (activeCategory) {
      const match = activeMenuItems.find((item) => item.categoryKey === activeCategory);
      if (match) {
        setOpenMenus((prev) => ({ ...prev, [match.name]: true }));
      }
    }
    // Keep Payroll expanded whenever any /payroll route is active
    if (location.pathname.startsWith("/payroll")) {
      setOpenMenus((prev) => ({ ...prev, Payroll: true }));
    }
  }, [searchParams, location.pathname, activeMenuItems]);

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

  return (
    <>
      {/* Mobile Dimmer Backdrop: closes sidebar when clicking outside */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          aria-label="Close navigation overlay"
        />
      )}

      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed left-0 top-0 h-screen bg-white shadow-2xl lg:shadow-md z-50 lg:z-30 transition-all duration-300 ease-in-out border-r border-slate-200/80 flex flex-col ${
          isOpen
            ? "w-[82vw] max-w-[270px] sm:w-72 translate-x-0"
            : "w-[82vw] max-w-[270px] sm:w-72 -translate-x-full lg:w-20 lg:translate-x-0"
        }`}
      >
        {/* 1. Header Brand Section with Logo, Title & Mobile Close Button */}
        <div
          className={`h-16 flex items-center border-b border-slate-100 shrink-0 transition-all duration-300 ${
            isOpen ? "px-4 sm:px-5 justify-between" : "px-0 justify-center"
          }`}
        >
          <Link to="/" onClick={closeOnMobile} className="flex items-center gap-2.5 min-w-0">
            <img 
              src={technoLogo} 
              alt="TechnoVani" 
              className="h-8 w-8 sm:h-9 sm:w-9 object-contain shrink-0"
            />
            {isOpen && (
              <div className="flex flex-col min-w-0">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 whitespace-nowrap truncate select-none leading-tight">
                  TechnoVani
                </span>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider truncate">
                  HRMS Portal
                </span>
              </div>
            )}
          </Link>

          {/* Mobile Close Button (X) - visible only on mobile screens when open */}
          {isOpen && (
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition cursor-pointer"
              title="Close menu"
              aria-label="Close menu"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 2. Menu Navigation */}
        <nav className={`flex-1 p-2 sm:p-2.5 ${isOpen ? "space-y-0.5 sm:space-y-1" : "space-y-2"} overflow-y-auto max-h-[calc(100vh-8.5rem)] lg:max-h-[calc(100vh-4rem)] scrollbar-thin scrollbar-thumb-slate-200`}>
          {activeMenuItems.map((item) => {
            const Icon = item.icon;

            if (!item.children) {
              // Single Link (Dashboard Overview or Custom Modules)
              const active = item.path?.includes("?")
                ? location.pathname === item.path.split("?")[0] && searchParams.get("tab") === item.tab
                : location.pathname === item.path && (!searchParams.get("category") || searchParams.get("category") === "EMP_DASHBOARD");
              return (
                <Link
                  key={item.name || item.path}
                  to={item.path}
                  onClick={closeOnMobile}
                  title={!isOpen ? item.name : undefined}
                  className={
                    isOpen
                      ? `w-full flex items-center justify-between gap-2.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 group relative ${
                          active
                            ? "bg-blue-50 text-blue-600 font-bold shadow-2xs border border-blue-100/60"
                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        }`
                      : `w-12 h-12 mx-auto flex items-center justify-center rounded-xl transition ${
                          active
                            ? "bg-blue-50 text-blue-600 shadow-sm"
                            : "hover:bg-blue-50/50 text-slate-700"
                        }`
                  }
                >
                  {isOpen ? (
                    <>
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 sidebar-icon-inactive" />
                        <span className="whitespace-nowrap overflow-hidden transition-all duration-300 truncate font-semibold">
                          {item.name}
                        </span>
                      </div>
                      {item.isCustom ? (
                        <span className="ml-auto bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-2xs border border-amber-200 uppercase tracking-wider shrink-0">
                          Custom
                        </span>
                      ) : item.badge ? (
                        <span className="ml-auto bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                          {item.badge}
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsPinned(!isPinned);
                          }}
                          className={`hidden lg:block ml-auto p-1 rounded transition-all shrink-0 ${
                            active
                              ? isPinned
                                ? "text-blue-600 hover:bg-blue-100"
                                : "text-blue-400 opacity-0 group-hover:opacity-100 hover:bg-blue-100 hover:text-blue-700"
                              : isPinned
                                ? "text-slate-600 hover:bg-slate-200"
                                : "text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-slate-200 hover:text-slate-700"
                          }`}
                          title={isPinned ? "Unpin Sidebar" : "Pin Sidebar"}
                        >
                          <PinIcon pinned={isPinned} className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  ) : (
                    <Icon className="w-6 h-6 shrink-0 sidebar-icon-inactive" />
                  )}
                </Link>
              );
            }

            // Category accordion links
            const isCategoryExpanded = !!openMenus[item.name] && isOpen;
            const isCategoryActive = ((location.pathname === "/hr-hub" || location.pathname === "/employee/dashboard") && searchParams.get("category") === item.categoryKey) ||
              (item.categoryKey === "PAYROLL" && location.pathname.startsWith("/payroll"));

            return (
              <div key={item.name} className="space-y-0.5">
                <button
                  onClick={() => {
                    if (!isOpen) setIsOpen(true);
                    toggleMenu(item.name);
                  }}
                  title={!isOpen ? item.name : undefined}
                  className={
                    isOpen
                      ? `w-full flex items-center justify-between gap-2.5 px-3 py-2 sm:px-3 sm:py-2 rounded-xl font-bold text-xs transition-all duration-150 ${
                          isCategoryActive
                            ? "bg-blue-50 text-blue-700 font-bold shadow-2xs border border-blue-100"
                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        }`
                      : `w-12 h-12 mx-auto flex items-center justify-center rounded-xl transition ${
                          isCategoryActive
                            ? "bg-blue-50 text-blue-600 shadow-sm"
                            : "hover:bg-blue-50/50 text-slate-700"
                        }`
                  }
                >
                  {isOpen ? (
                    <>
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 sidebar-icon-inactive" />
                        <span className="whitespace-nowrap overflow-hidden transition-all duration-300 text-left truncate font-semibold">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-slate-400 shrink-0 ml-1">
                        {isCategoryExpanded ? (
                          <ChevronDownIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        ) : (
                          <ChevronRightIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        )}
                      </span>
                    </>
                  ) : (
                    <Icon className="w-6 h-6 shrink-0 sidebar-icon-inactive" />
                  )}
                </button>

                {/* Sub-items list nested under expanded accordion */}
                {isCategoryExpanded && (
                  <div className="pl-2.5 sm:pl-3 pr-1 py-1 space-y-0.5 border-l-2 border-slate-100 ml-4 sm:ml-5">
                    {item.children.map((child) => {
                      if (child.name === "Logout") {
                        return (
                          <button
                            key={child.name}
                            onClick={() => {
                              closeOnMobile();
                              logout();
                            }}
                            className="w-full block text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition text-rose-500 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                          >
                            • {child.name}
                          </button>
                        );
                      }

                      const isDedicatedActive = child.path && (location.pathname === child.path || (child.path.startsWith("/payroll/") && location.pathname === child.path));
                      const isHubActive = (location.pathname === "/hr-hub" || location.pathname === "/employee/dashboard") &&
                        searchParams.get("category") === item.categoryKey &&
                        (
                          searchParams.get("tab") === (child.tab || child.name) ||
                          (!searchParams.get("tab") && item.children[0]?.tab === (child.tab || child.name)) ||
                          (child.tab === "Leave Requests" && ["Approvals Pending", "Leave Balance", "Leave Request", "Leave Requests"].includes(searchParams.get("tab")))
                        );
                      const isChildActive = isDedicatedActive || isHubActive;

                      const childPath = child.path 
                        ? child.path 
                        : `/hr-hub?category=${item.categoryKey}&tab=${encodeURIComponent(child.tab || child.name)}`;

                      return (
                        <Link
                          key={child.name}
                          to={childPath}
                          onClick={closeOnMobile}
                          className={`group flex items-center text-left px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-all duration-150 ${
                            isChildActive
                              ? "text-blue-600 bg-blue-50/80 font-bold shadow-2xs"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 mr-2 transition-colors ${
                            isChildActive ? "bg-blue-600 ring-2 ring-blue-200" : "bg-slate-300 group-hover:bg-slate-400"
                          }`} />
                          <span className="truncate">{child.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* 3. Mobile Footer Section (Concise User & Company Card) */}
        {isOpen && (
          <div className="lg:hidden p-3 border-t border-slate-100 bg-slate-50/80 shrink-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs uppercase">
                  {userInitial}
                </div>
                <div className="min-w-0 leading-tight">
                  <p className="text-xs font-black text-slate-800 truncate">{userName}</p>
                  <p className="text-[10px] font-bold text-slate-500 truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>{activeCompanyName}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  closeOnMobile();
                  logout();
                }}
                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                title="Logout"
                aria-label="Logout"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Gradients definition for sidebar icons */}
        <svg className="absolute w-0 h-0 pointer-events-none overflow-hidden" aria-hidden="true" width="0" height="0">
          <defs>
            <linearGradient id="active-icon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <linearGradient id="inactive-icon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
        </svg>
      </aside>
    </>
  );
};

export default Sidebar;
