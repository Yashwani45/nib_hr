import { useState, useRef, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { 
  MapPinIcon,
  Bars3Icon, 
  BellIcon, 
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon,
  PaperAirplaneIcon,
  ShieldCheckIcon,
  ArrowTopRightOnSquareIcon,
  CheckBadgeIcon,
  PlusIcon,
  TrashIcon,
  BuildingOffice2Icon,
  BriefcaseIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import technoLogo from "../assets/shortlogo1.png";
import { getTableData, deleteTableRecord, updateTableRecord, createTableRecord, invalidateTableCache } from "../services/hrApi";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const Navbar = ({ isOpen, setIsOpen }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // Dropdown visibility states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [allTenants, setAllTenants] = useState([]);

  // Live Dynamic Branch Switcher States
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(() => localStorage.getItem("selected_branch_id") || "ALL");
  const [selectedBranchName, setSelectedBranchName] = useState(() => localStorage.getItem("selected_branch_name") || "All Branches");

  const reduxBranches = useSelector((state) => 
    state.hr?.dbData?.["Branch"] || 
    state.hr?.dbData?.["branch"] || 
    state.hr?.dbData?.["branches"]
  );

  // Live Database States (Initialized empty, populated directly from MySQL)
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [notifFilter, setNotifFilter] = useState("all");
  const [msgSearch, setMsgSearch] = useState("");

  // Quick message / compose modal
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeForm, setComposeForm] = useState({
    recipient: "General Support",
    message: ""
  });

  // Refs for click outside
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const messagesRef = useRef(null);
  const companyDropdownRef = useRef(null);
  const branchDropdownRef = useRef(null);

  // SuperAdmin & Access Role detection
  const activeUserRole = typeof user?.role === "object" ? user?.role?.name : user?.role;
  const roleStr = String(activeUserRole || "").toLowerCase().trim();
  const userEmail = String(user?.email || "").toLowerCase().trim();
  const isSuperAdminUser = (
    roleStr === "superadmin" || 
    userEmail === "superadmin@nib.com"
  );
  const isAdmin = (
    roleStr === "admin" || 
    roleStr === "hr admin" || 
    roleStr.includes("admin") ||
    userEmail.includes("admin")
  );
  const isEmployee = !isSuperAdminUser && !isAdmin;
  const hasCompanyWideAccess = isSuperAdminUser || isAdmin || user?.hasCompanyWideAccess === true;

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

  const rawCompName = localStorage.getItem("selected_company_name") || user?.companyName || "";
  const activeCompanyName = rawCompName === "NIB Master Operations" ? "NIB Insurance" : rawCompName;
  const activeCompanyCode = localStorage.getItem("selected_company_code") || user?.companyCode || "";
  const activeTenantDb = localStorage.getItem("selected_tenant_db") || "";

  // Employee assigned branch, company and department states
  const [employeeAssignedBranch, setEmployeeAssignedBranch] = useState(() => {
    return user?.branchName || user?.branch || localStorage.getItem("selected_branch_name") || "";
  });
  const [employeeAssignedCompany, setEmployeeAssignedCompany] = useState(() => {
    return user?.companyName || user?.company || localStorage.getItem("selected_company_name") || "";
  });
  const [employeeDepartment, setEmployeeDepartment] = useState(() => {
    return user?.departmentName || user?.department || localStorage.getItem("user_department") || "";
  });

  const currentDepartment = employeeDepartment || user?.departmentName || user?.department || localStorage.getItem("user_department") || "";

  useEffect(() => {
    if (isEmployee && user?.email) {
      getTableData("employees").then(emps => {
        if (Array.isArray(emps)) {
          const myEmp = emps.find(e => 
            String(e.email || '').toLowerCase() === String(user.email).toLowerCase() ||
            String(e.officialEmail || '').toLowerCase() === String(user.email).toLowerCase() ||
            String(e.personalEmail || '').toLowerCase() === String(user.email).toLowerCase() ||
            (user.employeeCode && String(e.employeeCode || e.emp_code || e.id) === String(user.employeeCode)) ||
            (user.employeeName && String(e.employee_name || e.employeeName) === String(user.employeeName))
          );
          if (myEmp) {
            const bName = myEmp.branch || myEmp.branchName || myEmp.branch_name || "";
            const bId = myEmp.branch_id || myEmp.branchId || "";
            if (bName) {
              setEmployeeAssignedBranch(bName);
              setSelectedBranchName(bName);
              localStorage.setItem("selected_branch_name", bName);
            }
            if (bId) {
              setSelectedBranchId(bId);
              localStorage.setItem("selected_branch_id", bId);
            }
            const cName = myEmp.company || user?.companyName || "";
            if (cName) {
              setEmployeeAssignedCompany(cName);
              localStorage.setItem("selected_company_name", cName);
            }
            const dName = myEmp.department || myEmp.departmentName || myEmp.department_name || "";
            if (dName) {
              setEmployeeDepartment(dName);
              localStorage.setItem("user_department", dName);
            }
          }
        }
      }).catch(() => {});
    }
  }, [user, isEmployee]);

  // Load tenants list dynamically from backend without fake hardcoded fallbacks
  const loadTenants = () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API_BASE}/api/super-admin/tenants`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(res => {
      if (res && res.success && Array.isArray(res.data)) {
        setAllTenants(res.data);
      } else {
        setAllTenants([]);
      }
    })
    .catch(() => {
      setAllTenants([]);
    });
  };

  useEffect(() => {
    loadTenants();
    window.addEventListener("companies_updated", loadTenants);
    return () => window.removeEventListener("companies_updated", loadTenants);
  }, []);

  // Load branches dynamically from active company tenant database
  const loadBranches = async () => {
    try {
      let data = await getTableData("branch", true);
      if (!Array.isArray(data) || data.length === 0) {
        if (Array.isArray(reduxBranches) && reduxBranches.length > 0) {
          data = reduxBranches;
        }
      }
      if (Array.isArray(data) && data.length > 0) {
        setBranches(data);
        if (isEmployee) {
          // Employee is strictly locked to their assigned branch
          return;
        }
        const curId = localStorage.getItem("selected_branch_id");
        if (curId && curId !== "ALL") {
          const match = data.find(b => String(b.id) === String(curId) || String(b.branchCode || b.branch_code) === String(curId));
          if (match) {
            setSelectedBranchId(match.id);
            setSelectedBranchName(match.branchName || match.branch_name || "Branch");
          } else {
            setSelectedBranchId("ALL");
            setSelectedBranchName("All Branches");
            localStorage.setItem("selected_branch_id", "ALL");
            localStorage.setItem("selected_branch_name", "All Branches");
            localStorage.setItem("selected_branch_code", "ALL");
            window.dispatchEvent(new Event("branches_updated"));
            window.dispatchEvent(new Event("branch_changed"));
            window.dispatchEvent(new CustomEvent("branch_switched", { detail: { branchId: "ALL", branchName: "All Branches", branchCode: "ALL" } }));
          }
        } else {
          setSelectedBranchId("ALL");
          setSelectedBranchName("All Branches");
        }
      } else {
        if (Array.isArray(reduxBranches) && reduxBranches.length > 0) {
          setBranches(reduxBranches);
        } else {
          setBranches([]);
        }
      }
    } catch (e) {
      console.warn("Could not load branches for active tenant:", e.message);
      if (Array.isArray(reduxBranches) && reduxBranches.length > 0) {
        setBranches(reduxBranches);
      } else {
        setBranches([]);
      }
    }
  };

  // Sync with reduxBranches instantly when available
  useEffect(() => {
    if (Array.isArray(reduxBranches) && reduxBranches.length > 0 && branches.length === 0) {
      setBranches(reduxBranches);
    }
  }, [reduxBranches, branches.length]);

  useEffect(() => {
    loadBranches();
    window.addEventListener("branches_updated", loadBranches);
    window.addEventListener("companies_updated", loadBranches);
    window.addEventListener("focus", loadBranches);
    window.addEventListener("storage", loadBranches);
    return () => {
      window.removeEventListener("branches_updated", loadBranches);
      window.removeEventListener("companies_updated", loadBranches);
      window.removeEventListener("focus", loadBranches);
      window.removeEventListener("storage", loadBranches);
    };
  }, [activeCompanyCode, activeTenantDb]);

  const handleSwitchCompany = (tenant) => {
    setIsCompanyDropdownOpen(false);
    try {
      const userObj = JSON.parse(localStorage.getItem("user") || "{}");
      userObj.companyCode = tenant.id;
      userObj.companyName = tenant.name;
      userObj.tenantDb = tenant.db;
      if (isSuperAdminUser) {
        userObj.isSuperAdminImpersonating = true;
        localStorage.setItem("superadmin_impersonating", "true");
      } else {
        delete userObj.isSuperAdminImpersonating;
        localStorage.removeItem("superadmin_impersonating");
      }
      localStorage.setItem("user", JSON.stringify(userObj));
      localStorage.setItem("selected_company_code", tenant.id);
      localStorage.setItem("selected_company_name", tenant.name);
      localStorage.setItem("selected_tenant_db", tenant.db || "");

      // Reset branch selection whenever company changes
      localStorage.setItem("selected_branch_id", "ALL");
      localStorage.setItem("selected_branch_name", "All Branches");
      localStorage.setItem("selected_branch_code", "ALL");
    } catch (e) {}
    invalidateTableCache();
    window.location.href = "/admin/dashboard";
  };

  const handleSwitchBranch = (b) => {
    setIsBranchDropdownOpen(false);
    let targetId = "ALL";
    let targetName = "All Branches";
    let targetCode = "ALL";

    if (!b || b === "ALL") {
      localStorage.setItem("selected_branch_id", "ALL");
      localStorage.setItem("selected_branch_name", "All Branches");
      localStorage.setItem("selected_branch_code", "ALL");
      setSelectedBranchId("ALL");
      setSelectedBranchName("All Branches");
    } else {
      targetId = b.id;
      targetName = b.branchName || b.branch_name || "Branch";
      targetCode = b.branchCode || b.branch_code || "";
      localStorage.setItem("selected_branch_id", targetId);
      localStorage.setItem("selected_branch_name", targetName);
      localStorage.setItem("selected_branch_code", targetCode);
      setSelectedBranchId(targetId);
      setSelectedBranchName(targetName);
    }
    invalidateTableCache();
    window.dispatchEvent(new Event("branches_updated"));
    window.dispatchEvent(new Event("branch_changed"));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("branch_switched", { detail: { branchId: targetId, branchName: targetName, branchCode: targetCode } }));
  };

  // Load notifications directly from MySQL database
  const loadNotificationsFromDb = async () => {
    try {
      setLoadingNotifs(true);
      const data = await getTableData("notifications");
      if (Array.isArray(data)) {
        const formatted = data.map((n) => ({
          id: n.id,
          title: n.title || "Notification",
          description: n.message || n.description || "",
          category: n.type || "System",
          time: n.created_at ? new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Recently",
          unread: n.isRead === 0 || n.isRead === false || !n.isRead,
          priority: n.type === "Admin" ? "high" : "normal",
          link: "/hr-hub?tab=Notifications%20Dashboard&category=NOTIFICATIONS"
        }));
        setNotifications(formatted);
      } else {
        setNotifications([]);
      }
    } catch (e) {
      console.error("Error loading notifications from DB:", e);
      setNotifications([]);
    } finally {
      setLoadingNotifs(false);
    }
  };

  // Load messages directly from MySQL database (hr_tickets)
  const loadMessagesFromDb = async () => {
    try {
      const data = await getTableData("hr_tickets");
      if (Array.isArray(data)) {
        const formatted = data.map((t) => ({
          id: t.id,
          sender: t.empName || t.employee || "Staff Member",
          avatar: (t.empName || "ST").slice(0, 2).toUpperCase(),
          role: t.category || "General",
          department: t.department || "Operations",
          message: t.subject || t.description || "Support inquiry",
          time: t.created_at ? new Date(t.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Recent",
          unread: t.status === "Open" || t.status === "Pending",
          online: false
        }));
        setMessages(formatted);
      } else {
        setMessages([]);
      }
    } catch (e) {
      console.error("Error loading messages from DB:", e);
      setMessages([]);
    }
  };

  // Initial load & window focus synchronization
  useEffect(() => {
    loadNotificationsFromDb();
    loadMessagesFromDb();

    const onWindowFocus = () => {
      loadNotificationsFromDb();
      loadMessagesFromDb();
    };
    window.addEventListener("focus", onWindowFocus);
    return () => window.removeEventListener("focus", onWindowFocus);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (messagesRef.current && !messagesRef.current.contains(event.target)) {
        setIsMessagesOpen(false);
      }
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target)) {
        setIsCompanyDropdownOpen(false);
      }
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target)) {
        setIsBranchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleNotifications = () => {
    const next = !isNotificationsOpen;
    setIsNotificationsOpen(next);
    setIsMessagesOpen(false);
    setIsDropdownOpen(false);
    if (next) {
      loadNotificationsFromDb();
    }
  };

  const toggleMessages = () => {
    const next = !isMessagesOpen;
    setIsMessagesOpen(next);
    setIsNotificationsOpen(false);
    setIsDropdownOpen(false);
    if (next) {
      loadMessagesFromDb();
    }
  };

  const toggleProfile = () => {
    setIsDropdownOpen(prev => !prev);
    setIsNotificationsOpen(false);
    setIsMessagesOpen(false);
  };

  const handleMenuItemClick = (tabName) => {
    setIsDropdownOpen(false);
    if (tabName === "Logout") {
      logout();
    } else if (tabName === "Preferences") {
      if (isEmployee) {
        navigate(`/employee/dashboard?category=SETTINGS&tab=Settings%20Dashboard`);
      } else {
        navigate(`/hr-hub?category=SETTINGS&tab=Settings%20Dashboard`);
      }
    } else {
      if (isEmployee) {
        navigate(`/employee/dashboard?category=EMPLOYEE_MGMT&tab=Employee%20Profile`);
      } else {
        navigate(`/hr-hub?category=EMPLOYEE_MGMT&tab=Employee%20Profile`);
      }
    }
  };

  // Delete notification from MySQL and state
  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteTableRecord("notifications", id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification from DB:", err);
    }
  };

  // Mark all notifications read in MySQL database
  const handleMarkAllNotificationsRead = async () => {
    const unreadList = notifications.filter(n => n.unread);
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    try {
      for (const item of unreadList) {
        await updateTableRecord("notifications", item.id, { isRead: 1 });
      }
    } catch (e) {
      console.error("Failed to update notification read status:", e);
    }
  };

  // Clear all notifications from MySQL database
  const handleClearAllNotifications = async () => {
    const currentIds = notifications.map(n => n.id);
    setNotifications([]);
    try {
      for (const id of currentIds) {
        await deleteTableRecord("notifications", id);
      }
    } catch (e) {
      console.error("Failed to clear notifications:", e);
    }
  };

  // Click single notification
  const handleNotificationClick = async (item) => {
    if (item.unread) {
      setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, unread: false } : n));
      try {
        await updateTableRecord("notifications", item.id, { isRead: 1 });
      } catch (e) {}
    }
    setIsNotificationsOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  // Delete single message from MySQL database
  const handleDeleteMessage = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteTableRecord("hr_tickets", id);
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error("Failed to delete message from DB:", err);
    }
  };

  // Mark all messages read
  const handleMarkAllMessagesRead = async () => {
    setMessages(prev => prev.map(m => ({ ...m, unread: false })));
    try {
      for (const item of messages) {
        if (item.unread) {
          await updateTableRecord("hr_tickets", item.id, { status: "Resolved" });
        }
      }
    } catch (e) {
      console.error("Failed to update messages status:", e);
    }
  };

  // Clear all messages from MySQL database
  const handleClearAllMessages = async () => {
    const currentIds = messages.map(m => m.id);
    setMessages([]);
    try {
      for (const id of currentIds) {
        await deleteTableRecord("hr_tickets", id);
      }
    } catch (e) {
      console.error("Failed to clear messages from DB:", e);
    }
  };

  // Click single message
  const handleMessageClick = (msg) => {
    setIsMessagesOpen(false);
    navigate(`/hr-hub?tab=Helpdesk%20Dashboard&category=HELPDESK`);
  };

  // Handle Send Compose -> Persist directly to MySQL database
  const handleSendCompose = async (e) => {
    e.preventDefault();
    if (!composeForm.message.trim()) return;

    try {
      await createTableRecord("hr_tickets", {
        ticketNo: `TKT-${Date.now().toString().slice(-4)}`,
        empName: composeForm.recipient.split("(")[0].trim() || user?.name || "Admin",
        category: "General Inquiry",
        subject: composeForm.message,
        priority: "Medium",
        status: "Open"
      });
      await loadMessagesFromDb();
      setShowComposeModal(false);
      setComposeForm({ recipient: "General Support", message: "" });
      alert("Message successfully sent and saved in MySQL database!");
    } catch (err) {
      alert("Failed to send message: " + err.message);
    }
  };

  const unreadNotifsCount = notifications.filter(n => n.unread).length;
  const unreadMsgsCount = messages.filter(m => m.unread).length;

  const filteredNotifications = useMemo(() => {
    if (notifFilter === "unread") return notifications.filter(n => n.unread);
    return notifications;
  }, [notifications, notifFilter]);

  const filteredMessages = useMemo(() => {
    if (!msgSearch.trim()) return messages;
    const q = msgSearch.toLowerCase();
    return messages.filter(m => 
      m.sender.toLowerCase().includes(q) || 
      m.message.toLowerCase().includes(q) || 
      m.department.toLowerCase().includes(q)
    );
  }, [messages, msgSearch]);

  const userRole = useMemo(() => {
    const rawRole = typeof user?.role === "object" ? user?.role?.name : (user?.role || "Employee");
    if (rawRole === "DepartmentHR") return "Department HR";
    if (rawRole === "Employee") return "Employee";
    if (rawRole === "Admin") return "Admin";
    if (rawRole === "SuperAdmin") return "Super Admin";
    return rawRole;
  }, [user]);

  const userName = useMemo(() => {
    const rawRole = typeof user?.role === "object" ? user?.role?.name : (user?.role || "");
    const email = String(user?.email || "").toLowerCase();

    // 1. Prioritize user's actual personal name
    if (user?.firstName) {
      return `${user.firstName} ${user.lastName || ''}`.trim();
    }
    if (user?.employeeName && user.employeeName !== "Employee" && user.employeeName !== "Department HR" && user.employeeName !== "Admin") {
      return user.employeeName;
    }
    if (user?.name && user.name !== "Employee" && user.name !== "Department HR" && user.name !== user?.departmentName && user.name !== "Admin") {
      return user.name;
    }

    // 2. Department HR fallback
    if (rawRole === "DepartmentHR") {
      if (user?.departmentName && user.departmentName !== "Employee") {
        return `${user.departmentName} HR`;
      }
      return "Department HR";
    }

    // 3. Admin & SuperAdmin fallback
    if (rawRole === "Admin" || email.includes("admin")) {
      return "Rahul Sharma";
    }
    if (rawRole === "SuperAdmin") {
      return "Super Admin";
    }

    if (user?.email) return user.email.split("@")[0];
    return "Staff Member";
  }, [user]);

  const initials = useMemo(() => {
    if (!userName) return "HR";
    const parts = userName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return userName.slice(0, 2).toUpperCase();
  }, [userName]);

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs z-20 flex items-center justify-between px-4 transition-all duration-300 sm:px-6 ${
        isOpen ? "lg:left-72" : "lg:left-20"
      }`}
    >
      {/* Left: Sidebar Toggle + Logo & HRMS Brand */}
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition focus:outline-none cursor-pointer"
          title="Toggle Navigation"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2.5">
          <img
            src={technoLogo}
            alt="TechnoVani"
            className="h-8 w-8 object-contain shrink-0"
          />
          <span className="text-lg font-black text-gray-900 tracking-tight">HRMS</span>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <MagnifyingGlassIcon className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search settings, employees, policies, reports..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                navigate(`/hr-hub?tab=Employee%20Dashboard&category=EMPLOYEE_MGMT`);
              }
            }}
            className="w-full bg-slate-50/80 border border-gray-200/80 text-gray-700 text-xs rounded-xl pl-9 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
          <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <kbd className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">⌘K</kbd>
          </span>
        </div>
      </div>

      {/* Right: Quick Actions & User Profile */}
      <div className="flex items-center gap-2.5 sm:gap-4">

        {/* Dynamic Context Header: Employee vs Admin / SuperAdmin */}
        {isEmployee ? (
          /* =========================================================================
             EMPLOYEE VIEW: Clean Read-Only Badges (No 0/100, No 2/50, No Dropdowns)
             Shows ONLY the specific company and branch the employee belongs to
             ========================================================================= */
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Employee Company Badge */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1 sm:py-1.5 shadow-2xs select-none">
              <BuildingOffice2Icon className="h-4 w-4 text-blue-600 shrink-0" />
              <div className="flex flex-col text-left leading-none">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
                  Company
                </span>
                <span className="text-[11px] sm:text-xs font-black text-slate-800 truncate max-w-[110px] xs:max-w-[140px] sm:max-w-[180px]">
                  {employeeAssignedCompany || activeCompanyName || "NIB Insurance"}
                </span>
              </div>
            </div>

            {/* Employee Branch Badge */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1 sm:py-1.5 shadow-2xs select-none">
              <MapPinIcon className="h-4 w-4 text-emerald-600 shrink-0" />
              <div className="flex flex-col text-left leading-none">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
                  Branch
                </span>
                <span className="text-[11px] sm:text-xs font-black text-slate-800 truncate max-w-[110px] xs:max-w-[140px] sm:max-w-[180px]">
                  {employeeAssignedBranch || selectedBranchName || "Main Branch"}
                </span>
              </div>
            </div>

            {/* Employee Department Badge */}
            {currentDepartment && (
              <div className="hidden xs:flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1 sm:py-1.5 shadow-2xs select-none">
                <BriefcaseIcon className="h-4 w-4 text-indigo-600 shrink-0" />
                <div className="flex flex-col text-left leading-none">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
                    Department
                  </span>
                  <span className="text-[11px] sm:text-xs font-black text-slate-800 truncate max-w-[110px] xs:max-w-[140px] sm:max-w-[180px]">
                    {currentDepartment}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* =========================================================================
             ADMIN / SUPERADMIN VIEW: Switchers (Company & Branch)
             ========================================================================= */
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Company Switcher Dropdown UI */}
            {isSuperAdminUser || (isAdmin && allTenants.length > 1) ? (
              <div className="relative flex items-center">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white hover:bg-slate-50 border border-slate-300 hover:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 rounded-xl px-2.5 py-1 sm:py-1.5 shadow-2xs transition group cursor-pointer">
                  <BuildingOffice2Icon className="h-4 w-4 text-blue-600 shrink-0 pointer-events-none" />
                  <div className="flex flex-col text-left leading-none">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5 select-none flex items-center gap-1">
                      <span>Company</span>
                      <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-1 py-0.5 rounded border border-blue-100">
                        {allTenants.length}
                      </span>
                    </span>
                    <select
                      value={
                        allTenants.find(t => 
                          t.name === activeCompanyName || 
                          t.db === activeTenantDb || 
                          t.id === activeCompanyCode
                        )?.id || allTenants[0]?.id || ""
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        const match = allTenants.find(t => (t.id || t.db) === val);
                        if (match) {
                          handleSwitchCompany(match);
                        }
                      }}
                      className="appearance-none bg-transparent text-[11px] sm:text-xs font-black text-slate-800 pr-5 focus:outline-none cursor-pointer truncate max-w-[110px] xs:max-w-[140px] sm:max-w-[180px]"
                      title="Select Active Company Context"
                    >
                      {allTenants.map((t) => (
                        <option key={t.id || t.db} value={t.id || t.db} className="font-semibold text-slate-800 py-1">
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <ChevronDownIcon className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 transition shrink-0 pointer-events-none -ml-3" />
                </div>
              </div>
            ) : (
              /* Admin: Shows Company Name without dropdown switcher across tenants */
              <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1 sm:py-1.5 shadow-2xs select-none">
                <BuildingOffice2Icon className="h-4 w-4 text-blue-600 shrink-0" />
                <div className="flex flex-col text-left leading-none">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
                    Company
                  </span>
                  <span className="text-[11px] sm:text-xs font-black text-slate-800 truncate max-w-[110px] xs:max-w-[140px] sm:max-w-[180px]">
                    {activeCompanyName || "NIB Insurance"}
                  </span>
                </div>
              </div>
            )}

            {/* Branch Switcher Dropdown UI */}
            <div className="relative flex items-center">
              <div className={`flex items-center gap-1.5 sm:gap-2 bg-white hover:bg-slate-50 border border-slate-300 hover:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 rounded-xl px-2.5 py-1 sm:py-1.5 shadow-2xs transition group cursor-pointer ${
                branches.length === 0 ? "opacity-75" : ""
              }`}>
                <MapPinIcon className="h-4 w-4 text-emerald-600 shrink-0 pointer-events-none" />
                <div className="flex flex-col text-left leading-none">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5 select-none flex items-center gap-1">
                    <span>Branch</span>
                    <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100">
                      {branches.length}/50
                    </span>
                  </span>
                  <select
                    value={
                      selectedBranchId === "ALL" || branches.some(b => String(b.id) === String(selectedBranchId) || String(b.branchCode || b.branch_code) === String(selectedBranchId))
                        ? selectedBranchId
                        : "ALL"
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "ALL") {
                        handleSwitchBranch("ALL");
                      } else {
                        const match = branches.find(b => String(b.id) === String(val) || String(b.branchCode || b.branch_code) === String(val));
                        if (match) {
                          handleSwitchBranch(match);
                        }
                      }
                    }}
                    onFocus={() => {
                      if (branches.length === 0) loadBranches();
                    }}
                    onClick={() => {
                      if (branches.length === 0) loadBranches();
                    }}
                    className={`appearance-none bg-transparent text-[11px] sm:text-xs font-black text-slate-800 pr-5 focus:outline-none cursor-pointer truncate max-w-[105px] xs:max-w-[130px] sm:max-w-[170px] ${
                      branches.length === 0 ? "text-slate-400 font-semibold" : ""
                    }`}
                    title="Select Active Branch Filter"
                  >
                    {branches.length === 0 ? (
                      <option value="">No Branches (Single Location)</option>
                    ) : (
                      <>
                        <option value="ALL" className="font-semibold text-slate-800 py-1">
                          All Branches ({branches.length})
                        </option>
                        {branches.map((b) => {
                          const bId = b.id;
                          const bName = b.branchName || b.branch_name || "Branch";
                          const bCode = b.branchCode || b.branch_code || "";
                          return (
                            <option key={bId} value={bId} className="font-semibold text-slate-800 py-1">
                              {bName} {bCode ? `(${bCode})` : ""}
                            </option>
                          );
                        })}
                      </>
                    )}
                  </select>
                </div>
                {branches.length > 0 && (
                  <ChevronDownIcon className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600 transition shrink-0 pointer-events-none -ml-3" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Messages / Chat Container */}
        <div className="relative" ref={messagesRef}>
          <button 
            onClick={toggleMessages}
            className={`relative p-2 rounded-xl transition focus:outline-none cursor-pointer ${
              isMessagesOpen ? "bg-emerald-50 text-emerald-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
            title="Messages"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            {unreadMsgsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-emerald-500 text-white text-[10px] font-black rounded-full ring-2 ring-white flex items-center justify-center animate-pulse">
                {unreadMsgsCount}
              </span>
            )}
          </button>

          {/* Messages Dropdown Panel */}
          {isMessagesOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in font-sans">
              {/* Header */}
              <div className="p-3.5 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Internal Messages</h3>
                  {unreadMsgsCount > 0 && (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black rounded-full">
                      {unreadMsgsCount} New
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowComposeModal(true)}
                    className="text-[11px] text-emerald-600 hover:text-emerald-800 font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    <span>Compose</span>
                  </button>
                  {unreadMsgsCount > 0 && (
                    <button
                      onClick={handleMarkAllMessagesRead}
                      className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold transition cursor-pointer"
                    >
                      Read all
                    </button>
                  )}
                  {messages.length > 0 && (
                    <button
                      onClick={handleClearAllMessages}
                      className="text-[10px] text-rose-500 hover:text-rose-700 font-bold transition cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              {/* Search filter */}
              <div className="p-2 border-b border-slate-100 bg-white">
                <div className="relative">
                  <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search messages by colleague or text..."
                    value={msgSearch}
                    onChange={(e) => setMsgSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold focus:outline-emerald-500"
                  />
                </div>
              </div>

              {/* Message Items List */}
              <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100">
                {filteredMessages.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleMessageClick(item)}
                    className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition cursor-pointer group ${
                      item.unread ? "bg-emerald-50/20" : ""
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-black text-xs flex items-center justify-center">
                        {item.avatar}
                      </div>
                      {item.online && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-baseline gap-2">
                        <h4 className="text-xs font-bold text-slate-800 truncate">
                          {item.sender}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                          {item.time}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium truncate">
                        {item.department} • {item.role}
                      </p>
                      <p className={`text-xs mt-1 line-clamp-2 ${item.unread ? "font-bold text-slate-800" : "text-slate-500"}`}>
                        {item.message}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-center">
                      {item.unread && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      )}
                      <button
                        onClick={(e) => handleDeleteMessage(e, item.id)}
                        title="Delete message from database"
                        className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredMessages.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    {messages.length === 0 
                      ? "No tickets or messages in database." 
                      : "No messages found matching your search."}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    setIsMessagesOpen(false);
                    navigate("/hr-hub?tab=Helpdesk%20Dashboard&category=HELPDESK");
                  }}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition flex items-center justify-center gap-1.5 w-full cursor-pointer"
                >
                  <span>Open Helpdesk & Tickets Portal</span>
                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Bell Container */}
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={toggleNotifications}
            className={`relative p-2 rounded-xl transition focus:outline-none cursor-pointer ${
              isNotificationsOpen ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
            title="Notifications"
          >
            <BellIcon className="w-5 h-5" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-blue-600 text-white text-[10px] font-black rounded-full ring-2 ring-white flex items-center justify-center animate-pulse">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in font-sans">
              {/* Header */}
              <div className="p-3.5 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">System Notifications</h3>
                  {unreadNotifsCount > 0 && (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black rounded-full">
                      {unreadNotifsCount} Unread
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadNotifsCount > 0 && (
                    <button
                      onClick={handleMarkAllNotificationsRead}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-bold transition cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAllNotifications}
                      className="text-[10px] text-rose-500 hover:text-rose-700 font-bold transition cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 p-2 border-b border-slate-100 bg-white">
                <button
                  onClick={() => setNotifFilter("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    notifFilter === "all" ? "bg-slate-900 text-white shadow-xs" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setNotifFilter("unread")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    notifFilter === "unread" ? "bg-blue-600 text-white shadow-xs" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Unread ({unreadNotifsCount})
                </button>
              </div>

              {/* Notifications List */}
              <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100">
                {filteredNotifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition cursor-pointer group ${
                      item.unread ? "bg-blue-50/20" : ""
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      item.category === "Assets" ? "bg-indigo-50 text-indigo-600" :
                      item.category === "Leave" ? "bg-amber-50 text-amber-600" :
                      item.category === "Payroll" ? "bg-emerald-50 text-emerald-600" :
                      "bg-blue-50 text-blue-600"
                    }`}>
                      <BellIcon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-baseline gap-2">
                        <h4 className={`text-xs ${item.unread ? "font-black text-slate-900" : "font-bold text-slate-700"}`}>
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                          {item.time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">
                          {item.category}
                        </span>
                        {item.priority === "high" && (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded text-[9px] font-black border border-rose-200">
                            Urgent
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-center">
                      {item.unread && (
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      )}
                      <button
                        onClick={(e) => handleDeleteNotification(e, item.id)}
                        title="Delete notification"
                        className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredNotifications.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    {notifications.length === 0
                      ? "No notifications in database."
                      : "No notifications in this filter view."}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    navigate("/hr-hub?tab=Notifications%20Dashboard&category=NOTIFICATIONS");
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 transition flex items-center justify-center gap-1.5 w-full cursor-pointer"
                >
                  <span>Open Full Notifications Hub</span>
                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleProfile}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-gray-100 transition focus:outline-none cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs uppercase select-none">
              {initials}
            </div>
            <div className="hidden sm:flex flex-col text-left leading-tight justify-center">
              <span className="text-xs font-extrabold text-gray-800 capitalize truncate max-w-[180px]">
                {userName}
              </span>
              {!isAdmin && !isSuperAdminUser && (
                <div className="flex items-center gap-1 text-[10px] truncate max-w-[180px]">
                  {currentDepartment && currentDepartment !== "Administration" ? (
                    <>
                      <span className="font-bold text-indigo-600 truncate">{currentDepartment}</span>
                      <span className="text-gray-400 font-medium shrink-0">• {userRole}</span>
                    </>
                  ) : (
                    <span className="font-semibold text-gray-400 truncate">{userRole}</span>
                  )}
                </div>
              )}
            </div>
            <ChevronDownIcon className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-30 font-sans">
              <div className="px-4 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-black text-slate-800 truncate">{userName}</p>
                <p className="text-[11px] text-slate-400 truncate font-medium">{user?.email}</p>
                {currentDepartment && !isAdmin && !isSuperAdminUser && currentDepartment !== "Administration" && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                    <BriefcaseIcon className="w-3 h-3 text-indigo-500 shrink-0" />
                    <span className="truncate">Department: {currentDepartment}</span>
                  </div>
                )}
                {employeeAssignedBranch && (
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                    <MapPinIcon className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="truncate">Branch: {employeeAssignedBranch}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleMenuItemClick("Employee Profile")}
                className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-slate-50 transition cursor-pointer"
              >
                My Profile
              </button>
              <button
                onClick={() => handleMenuItemClick("Preferences")}
                className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Preferences & Security
              </button>
              <hr className="my-1 border-gray-100" />
              <button
                onClick={() => handleMenuItemClick("Logout")}
                className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 hover:text-red-700 transition cursor-pointer"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Compose Quick Message Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center border-b pb-2.5">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Compose Quick Message</h3>
              <button onClick={() => setShowComposeModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSendCompose} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">To (Colleague / Team) *</label>
                <select
                  value={composeForm.recipient}
                  onChange={(e) => setComposeForm({ ...composeForm, recipient: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-emerald-500"
                >
                  <option value="Rahul Sharma (Engineering)">Rahul Sharma (Senior SWE, Engineering)</option>
                  <option value="Priya Patel (Human Resources)">Priya Patel (HR Executive, HR)</option>
                  <option value="Amit Verma (Finance)">Amit Verma (Finance Lead, Finance)</option>
                  <option value="Neha Gupta (Design)">Neha Gupta (Product Designer, Design)</option>
                  <option value="IT Support Desk (IT)">IT Support Desk (Hardware & Accounts)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Message Content *</label>
                <textarea
                  required
                  placeholder="Type your message, query or feedback..."
                  value={composeForm.message}
                  onChange={(e) => setComposeForm({ ...composeForm, message: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 h-24 focus:outline-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <PaperAirplaneIcon className="w-3.5 h-3.5" />
                  <span>Send Message</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
