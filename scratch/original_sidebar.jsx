import { useState, useEffect } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  HomeIcon,
  BuildingOffice2Icon,
  AcademicCapIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import nib from "../../public/NIB logo.webp";
import short from "../../public/NIB short logo.jpg";

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
  const location = useLocation();
  const [searchParams] = useSearchParams();
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

  const menuItems = [
    { path: "/", name: "Dashboard", icon: HomeIcon },
    {
      name: "Core & Setup",
      categoryKey: "CORE",
      icon: BuildingOffice2Icon,
      children: [
        { name: "Company", tab: "Company" },
        { name: "Branch", tab: "Branch" },
        { name: "Department", tab: "Department" },
        { name: "Designation", tab: "Designation" },
        // { name: "Business Unit", tab: "Business Unit" },
        { name: "Cost Center", tab: "Cost Center" },
        { name: "Reporting Hierarchy", tab: "Reporting Hierarchy" },
        { name: "Organizational Chart", tab: "Organizational Chart" },
        { name: "Employee Profile", tab: "Employee Profile" },
        { name: "Asset Allocation", tab: "Asset Allocation" },
      ],
    },
    {
      name: "Talent & LMS",
      categoryKey: "TALENT",
      icon: AcademicCapIcon,
      children: [
        { name: "Job Requisition", tab: "Job Requisition" },
        { name: "Candidate Database", tab: "Candidate Database" },
        { name: "ATS (Applicant Tracking)", tab: "ATS (Applicant Tracking)" },
        { name: "KPI & OKR", tab: "KPI & OKR" },
        { name: "Performance Reviews", tab: "Performance Reviews" },
        { name: "Courses", tab: "Courses" },
        { name: "LMS Progress", tab: "LMS Progress" },
      ],
    },
    {
      name: "Operations & Assets",
      categoryKey: "OPERATIONS",
      icon: ClockIcon,
      children: [
        { name: "Daily Attendance", tab: "Daily Attendance" },
        { name: "Shift Master", tab: "Shift Master" },
        { name: "Leave Types", tab: "Leave Types" },
        { name: "Leave Requests", tab: "Leave Requests" },
        { name: "Inventory", tab: "Inventory" },
      ],
    },
    {
      name: "Finance & Compliance",
      categoryKey: "FINANCE",
      icon: ConnectedNodesIcon,
      children: [
        { name: "Salary Structure", tab: "Salary Structure" },
        { name: "Incentives & Claims", tab: "Incentives & Claims" },
        { name: "PF Registry", tab: "PF Registry" },
        { name: "Tax Declarations", tab: "Tax Declarations" },
        { name: "Expense Claims", tab: "Expense Claims" },
        { name: "Exit Logs", tab: "Exit Logs" },
        { name: "Approvals Pending", tab: "Approvals Pending" },
      ],
    },
    {
      name: "Support & Engagement",
      categoryKey: "SUPPORT",
      icon: ChatBubbleLeftRightIcon,
      children: [
        { name: "Document Log", tab: "Document Log" },
        { name: "Announcements & Surveys", tab: "Announcements & Surveys" },
        { name: "HR Tickets", tab: "HR Tickets" },
        { name: "Complaint Management", tab: "Complaint Management" },
        { name: "Query Resolution", tab: "Query Resolution" },
        { name: "Service Requests", tab: "Service Requests" },
        { name: "Ticket Tracking", tab: "Ticket Tracking" },
        { name: "Logs", tab: "Logs" },
        { name: "Email Notifications", tab: "Email Notifications" },
        { name: "SMS Notifications", tab: "SMS Notifications" },
        { name: "Push Notifications", tab: "Push Notifications" },
        { name: "Approval Alerts", tab: "Approval Alerts" },
        { name: "RBAC Roles", tab: "RBAC Roles" },
        { name: "Audit Logs", tab: "Audit Logs" },
        { name: "Login History", tab: "Login History" },
      ],
    },
  ];

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

  return (
    <aside
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
      {/* Logo Section with Image - Using standard img tag for React */}
      <div className="h-20 flex items-center justify-center border-b px-3 shrink-0">
        {isOpen ? (
          <img 
            src={nib} 
            alt="NIB HR Logo" 
            className="h-16 w-auto max-w-full object-contain"
          />
        ) : (
          <img 
            src={short} 
            alt="NIB HR" 
            className="h-12 w-auto max-w-full object-contain"
          />
        )}
      </div>

      <nav className={`flex-1 p-2 ${isOpen ? "space-y-1.5" : "space-y-4"} overflow-y-auto max-h-[calc(100vh-5rem)] scrollbar-thin scrollbar-thumb-slate-300`}>
        {menuItems.map((item) => {
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
                    const isChildActive =
                      location.pathname === "/hr-hub" &&
                      searchParams.get("category") === item.categoryKey &&
                      searchParams.get("tab") === child.tab;

                    const childPath = `/hr-hub?category=${item.categoryKey}&tab=${encodeURIComponent(
                      child.tab
                    )}`;

                    return (
                      <Link
                        key={child.name}
                        to={childPath}
                        onClick={closeOnMobile}
                        className={`block text-left px-3 py-2.5 rounded text-sm font-semibold transition ${
                          isChildActive
                            ? "text-blue-600 bg-blue-100/50 font-black"
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
                        }`}
                      >
                        GÇó {child.name}
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
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true" width="0" height="0">
        <defs>
          <linearGradient id="active-icon-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#93c5fd" />
          </linearGradient>
          <linearGradient id="inactive-icon-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
      </svg>
    </aside>
  );
};

export default Sidebar;
