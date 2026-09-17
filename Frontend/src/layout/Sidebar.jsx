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
  DocumentTextIcon
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
    return [
      { path: "/admin/dashboard", name: "Dashboard Overview", icon: HomeIcon },
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
          { name: "Employee Dashboard", tab: "Employee Dashboard" },
          { name: "Add Employee", tab: "Add Employee" },
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
    if (!user || userRole === "SuperAdmin" || userRole === "Admin") {
      return menuItems;
    }

    const userDept = String(user?.departmentName || user?.department || "").toLowerCase();
    const isHrDept = userDept.includes("hr") || userDept.includes("human");

    if (userRole === "DepartmentHR" || isHrDept || (user?.assignedModules && Array.isArray(user.assignedModules) && user.assignedModules.length > 0)) {
      const allowed = (user?.assignedModules && Array.isArray(user.assignedModules) && user.assignedModules.length > 0)
        ? user.assignedModules.map((m) => String(m).toLowerCase().trim())
        : ["dashboard", "organization setup", "employee management", "recruitment", "attendance", "leave management", "payroll", "performance", "training", "asset", "helpdesk", "reports"];

      return menuItems
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
    }

    // Role: Employee -> Pure Employee Self-Service (ESS). Absolutely no Department, Org Setup, or HR Admin rights!
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
            { name: "Bank Details", tab: "Bank Details", path: "/employee/dashboard?category=EMPLOYEE_MGMT&tab=Bank%20Details" },
            { name: "Salary Details", tab: "Salary Details", path: "/employee/dashboard?category=EMPLOYEE_MGMT&tab=Salary%20Details" }
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
          name: "Payroll",
          categoryKey: "EMP_PAYROLL",
          icon: BanknotesIcon,
          children: [
            { name: "My Payslips", tab: "Salary Details", path: "/employee/dashboard?category=EMPLOYEE_MGMT&tab=Salary%20Details" }
          ]
        }
      ];
    }

    return menuItems;
  }, [menuItems, user]);

  // Auto-expand category accordions on mount or query updates
  useEffect(() => {
    const activeCategory = searchParams.get("category");
    if (activeCategory) {
      const match = activeMenuItems.find((item) => item.categoryKey === activeCategory);
      if (match) {
        setOpenMenus((prev) => ({ ...prev, [match.name]: true }));
      }
    }
  }, [searchParams, activeMenuItems]);

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
    <aside
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => {
        if (!isPinned) {
          setIsOpen(false);
        }
      }}
      className={`fixed left-0 top-0 h-screen bg-white shadow-lg z-30 transition-all duration-300 overflow-hidden border-r border-gray-100 flex flex-col ${
        isOpen
          ? "w-72 translate-x-0"
          : "w-72 -translate-x-full lg:w-20 lg:translate-x-0"
      }`}
    >
      {/* 1. Header Brand Section with Diamond Logo + Solid TechnoVani Text */}
      <div
        className={`h-16 flex items-center border-b border-gray-100 shrink-0 transition-all duration-300 ${
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
            <span className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap truncate select-none">
              TechnoVani
            </span>
          )}
        </Link>
      </div>

      {/* 2. Menu Navigation */}
      <nav className={`flex-1 p-2 ${isOpen ? "space-y-1" : "space-y-2"} overflow-y-auto max-h-[calc(100vh-4rem)] scrollbar-thin scrollbar-thumb-slate-200`}>
        {activeMenuItems.map((item) => {
          const Icon = item.icon;

          if (!item.children) {
            // Single Link (Dashboard Overview)
            const active = location.pathname === item.path && (!searchParams.get("category") || searchParams.get("category") === "EMP_DASHBOARD");
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeOnMobile}
                title={!isOpen ? item.name : undefined}
                className={
                  isOpen
                    ? `w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-150 group relative ${
                        active
                          ? "bg-blue-50 text-blue-600 font-semibold shadow-sm"
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
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="w-6 h-6 shrink-0 sidebar-icon-inactive" />
                      <span className="whitespace-nowrap overflow-hidden transition-all duration-300 truncate font-semibold">
                        {item.name}
                      </span>
                    </div>
                    {item.badge ? (
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
                        className={`ml-auto p-1 rounded transition-all shrink-0 ${
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
          const isCategoryActive = (location.pathname === "/hr-hub" || location.pathname === "/employee/dashboard") && searchParams.get("category") === item.categoryKey;

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
                    ? `w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-150 ${
                        isCategoryActive
                          ? "bg-blue-50 text-blue-600 font-semibold shadow-sm"
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
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="w-6 h-6 shrink-0 sidebar-icon-inactive" />
                      <span className="whitespace-nowrap overflow-hidden transition-all duration-300 text-left truncate font-semibold">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-slate-400 shrink-0 ml-1">
                      {isCategoryExpanded ? (
                        <ChevronDownIcon className="w-4 h-4" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4" />
                      )}
                    </span>
                  </>
                ) : (
                  <Icon className="w-6 h-6 shrink-0 sidebar-icon-inactive" />
                )}
              </button>

              {/* Sub-items list nested under expanded accordion */}
              {isCategoryExpanded && (
                <div className="pl-3 pr-1 py-1 space-y-0.5 border-l-2 border-slate-100 ml-5">
                  {item.children.map((child) => {
                    if (child.name === "Logout") {
                      return (
                        <button
                          key={child.name}
                          onClick={() => {
                            closeOnMobile();
                            logout();
                          }}
                          className="w-full block text-left px-3 py-1.5 rounded-md text-xs font-medium transition text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                        >
                          • {child.name}
                        </button>
                      );
                    }

                    const isChildActive = (location.pathname === "/hr-hub" || location.pathname === "/employee/dashboard") &&
                      searchParams.get("category") === item.categoryKey &&
                      (searchParams.get("tab") === (child.tab || child.name) || (!searchParams.get("tab") && item.children[0]?.tab === (child.tab || child.name)));

                    const childPath = child.path 
                      ? child.path 
                      : `/hr-hub?category=${item.categoryKey}&tab=${encodeURIComponent(child.tab || child.name)}`;

                    return (
                      <Link
                        key={child.name}
                        to={childPath}
                        onClick={closeOnMobile}
                        className={`block text-left px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          isChildActive
                            ? "text-blue-600 bg-blue-50 font-semibold"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        • {child.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

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
  );
};

export default Sidebar;
