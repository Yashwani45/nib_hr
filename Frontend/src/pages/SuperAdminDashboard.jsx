import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Badge, Modal, DynamicForm } from "../components/ui";
import Button from "../components/ui/Button";
import technoLogo from "../assets/shortlogo1.png";
import { 
  BuildingOffice2Icon,
  CircleStackIcon, 
  CpuChipIcon, 
  KeyIcon,
  PlusIcon,
  ArrowRightOnRectangleIcon,
  TrashIcon,
  ArrowLeftIcon,
  CreditCardIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  SparklesIcon,
  ShieldCheckIcon,
  UsersIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  XMarkIcon,
  CalendarDaysIcon,
  ServerStackIcon
} from "@heroicons/react/24/outline";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const companyRegistrationFields = [
  { name: "companyName", label: "Company Name", type: "text", required: true, placeholder: "e.g. NIB Technologies Pvt. Ltd.", halfWidth: true },
  { name: "companyEmail", label: "Company Email", type: "email", required: true, placeholder: "info@nibtechnologies.com", halfWidth: true },
  { name: "gst", label: "GSTIN / GST Number", type: "text", required: false, placeholder: "e.g. 23ABCDE1234F1Z5", halfWidth: true },
  { name: "state", label: "State", type: "text", required: false, placeholder: "e.g. Madhya Pradesh", halfWidth: true },
  { name: "city", label: "City", type: "text", required: false, placeholder: "e.g. Bhopal", halfWidth: true },
  { name: "pincode", label: "Pincode", type: "text", required: false, placeholder: "e.g. 422001", halfWidth: true },
  { 
    name: "status", 
    label: "Status", 
    type: "select", 
    required: false, 
    options: [
      { label: "Active", value: "Active" },
      { label: "Suspended", value: "Suspended" },
      { label: "Maintenance", value: "Maintenance" }
    ], 
    halfWidth: true 
  },
  { name: "firstName", label: "Owner First Name", type: "text", required: true, placeholder: "e.g. Ayaan", halfWidth: true },
  { name: "lastName", label: "Owner Last Name", type: "text", required: true, placeholder: "e.g. Shaikh", halfWidth: true },
  { name: "adminEmail", label: "Admin Email", type: "email", required: true, placeholder: "admin@company.com", halfWidth: true },
  { name: "mobileNumber", label: "Mobile / Phone", type: "text", required: false, placeholder: "+91 98765 43210", halfWidth: true },
  { name: "password", label: "Admin Password", type: "password", required: true, placeholder: "••••••••", halfWidth: true },
  { name: "confirmPassword", label: "Confirm Admin Password", type: "password", required: true, placeholder: "••••••••", halfWidth: true }
];

// Vibrant gradients for company avatars
const AVATAR_GRADIENTS = [
  "from-blue-600 to-indigo-700 text-white",
  "from-emerald-500 to-teal-700 text-white",
  "from-purple-600 to-violet-800 text-white",
  "from-amber-500 to-orange-600 text-white",
  "from-rose-500 to-pink-600 text-white",
  "from-cyan-600 to-blue-700 text-white"
];

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "CO";
};

const SuperAdminDashboard = () => {
  const { fetchWithAuth, logout, user } = useAuth();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState("overview"); // "overview" or "registers"
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  
  // Register Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({ open: false, tenant: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPlan, setFilterPlan] = useState("All");
  const [copiedTenantId, setCopiedTenantId] = useState(null);

  // Form fields state
  const [formData, setFormData] = useState({
    companyName: "",
    companyEmail: "",
    firstName: "",
    lastName: "",
    adminEmail: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
    status: "Active",
    state: "",
    city: "",
    pincode: "",
    gst: ""
  });

  // Fetch Tenants from Master Registry
  const loadTenants = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await fetchWithAuth(`${API_BASE}/api/super-admin/tenants`);
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      if (response.ok && result.success) {
        setTenants(result.data || []);
      } else {
        throw new Error(result.error || result.message || "Failed to load registered companies.");
      }
    } catch (err) {
      console.error(err);
      setError("Error connecting to master SaaS registry. Please ensure backend server is operational.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  // 1-Click Copy Tenant UUID with feedback tooltip
  const handleCopyId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id).then(() => {
      setCopiedTenantId(id);
      setTimeout(() => {
        setCopiedTenantId(null);
      }, 2000);
    }).catch(() => {});
  };

  // Delete Tenant Confirmation Handler
  const handleConfirmDelete = async () => {
    if (!deleteModal.tenant) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const response = await fetchWithAuth(`${API_BASE}/api/super-admin/tenants/${deleteModal.tenant.id}`, {
        method: "DELETE"
      });
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      if (response.ok && result.success) {
        setDeleteModal({ open: false, tenant: null });
        await loadTenants();
      } else {
        throw new Error(result.message || result.error || "Failed to delete company.");
      }
    } catch (err) {
      setDeleteError(err.message || "An error occurred while deleting the company.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Switch to Company Admin Portal
  const handleEnterCompanyPortal = (tenant) => {
    try {
      const userObj = JSON.parse(localStorage.getItem("user") || "{}");
      userObj.companyCode = tenant.id;
      userObj.companyName = tenant.name;
      userObj.tenantDb = tenant.db;
      userObj.isSuperAdminImpersonating = true;
      localStorage.setItem("user", JSON.stringify(userObj));
      localStorage.setItem("selected_company_code", tenant.id);
      localStorage.setItem("selected_company_name", tenant.name);
      localStorage.setItem("selected_tenant_db", tenant.db || "");
      localStorage.setItem("superadmin_impersonating", "true");
    } catch (e) {}
    window.location.href = "/admin/dashboard";
  };

  // Form input handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit Handler for New Company Registration
  const handleRegisterCompany = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setFormLoading(true);
    try {
      const response = await fetchWithAuth(`${API_BASE}/api/super-admin/tenants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      if (response.ok && result.success) {
        setFormSuccess("Company registered and isolated database provisioned successfully!");
        setFormData({
          companyName: "",
          companyEmail: "",
          firstName: "",
          lastName: "",
          adminEmail: "",
          mobileNumber: "",
          password: "",
          confirmPassword: "",
          status: "Active",
          state: "",
          city: "",
          pincode: "",
          gst: ""
        });
        await loadTenants();
        setTimeout(() => {
          setIsModalOpen(false);
          setFormSuccess("");
        }, 1500);
      } else {
        throw new Error(result.message || result.error || "Failed to provision tenant resources.");
      }
    } catch (err) {
      setFormError(err.message || "An unexpected error occurred during database setup.");
    } finally {
      setFormLoading(false);
    }
  };

  // Export Table Data to CSV
  const handleExportCSV = () => {
    if (!tenants || tenants.length === 0) {
      alert("No tenant data available to export.");
      return;
    }
    const headers = ["Company Name", "Tenant ID", "Database", "Owner Name", "Email Address", "Plan", "Trial Status", "Registration Date", "Expiry Date", "Active Users", "Status"];
    const rows = tenants.map(t => [
      `"${t.name || ''}"`,
      `"${t.id || ''}"`,
      `"${t.db || ''}"`,
      `"${t.ownerName || ''}"`,
      `"${t.emailAddress || ''}"`,
      `"${t.plan || ''}"`,
      `"${t.trialStatus || ''}"`,
      `"${t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB') : ''}"`,
      `"${t.expiryDate ? new Date(t.expiryDate).toLocaleDateString('en-GB') : ''}"`,
      t.activeUsers || 0,
      `"${t.status || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `technovani_tenants_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate dynamic dashboard stats
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.status === "Active").length;
  const suspendedTenants = tenants.filter(t => t.status !== "Active").length;
  const platformUsersCount = tenants.reduce((acc, curr) => acc + (curr.activeUsers || 0), 0);
  const monthlySaasIncome = activeTenants * 9000;
  const totalCapacitySeats = 250;
  const seatUtilizationPct = totalCapacitySeats > 0 ? Math.min(100, Math.round((platformUsersCount / totalCapacitySeats) * 100)) : 0;

  // Filtered tenants based on search & dropdown filters
  const filteredTenants = useMemo(() => {
    return tenants.filter(t => {
      // Status Filter
      if (filterStatus !== "All" && String(t.status || "").toLowerCase() !== filterStatus.toLowerCase()) {
        return false;
      }
      // Plan Filter
      if (filterPlan !== "All" && String(t.plan || "").toLowerCase() !== filterPlan.toLowerCase()) {
        return false;
      }
      // Search Query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.id && t.id.toLowerCase().includes(q)) ||
        (t.code && t.code.toLowerCase().includes(q)) ||
        (t.db && t.db.toLowerCase().includes(q)) ||
        (t.emailAddress && t.emailAddress.toLowerCase().includes(q)) ||
        (t.ownerName && t.ownerName.toLowerCase().includes(q))
      );
    });
  }, [tenants, searchQuery, filterStatus, filterPlan]);

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      
      {/* 1. Sleek Glassmorphism Header Navbar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo & SuperAdmin Title */}
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-800 p-0.5 shadow-md shadow-blue-500/15 flex items-center justify-center">
              <img src={technoLogo} alt="TechnoVani" className="h-6 w-auto object-contain brightness-0 invert" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-slate-900 tracking-tight">Multi-Tenant Platform</span>
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                  SuperAdmin
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Master DB Active</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-semibold">Enterprise SaaS Engine</span>
              </div>
            </div>
          </div>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center gap-3">
            
            {/* Quick Switch to Company Admin / HR Portal */}
            <Link
              to="/admin/dashboard"
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 rounded-xl transition border border-slate-200/80 shadow-2xs"
            >
              <HomeIcon className="h-4 w-4 text-slate-500" />
              <span>Go to Admin / HR Portal</span>
            </Link>

            <div className="h-5 w-px bg-slate-200 hidden md:block"></div>

            {/* SuperAdmin User Chip */}
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-black text-[10px] shadow-xs">
                SA
              </div>
              <div className="hidden lg:block text-left leading-tight">
                <p className="text-[11px] font-bold text-slate-800 truncate max-w-[140px]">{user?.email || "superadmin@nib.com"}</p>
                <p className="text-[9px] font-extrabold text-blue-600 uppercase tracking-wider">Root Access</p>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded-xl transition border border-rose-200/70 shadow-2xs cursor-pointer"
              title="Sign out of SuperAdmin Console"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Body Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Navigation Tabs & Primary Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 shadow-xs">
          
          {/* Segmented Tab Controls */}
          <div className="inline-flex p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                activeTab === "overview" 
                  ? "bg-white text-blue-600 shadow-sm shadow-slate-200 border border-slate-200/60" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <span>Platform Overview</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeTab === "overview" ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-600"
              }`}>
                {totalTenants}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("registers")}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                activeTab === "registers" 
                  ? "bg-white text-blue-600 shadow-sm shadow-slate-200 border border-slate-200/60" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <span>Company Tenant Registers</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeTab === "registers" ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-600"
              }`}>
                {activeTenants}
              </span>
            </button>
          </div>

          {/* Action Buttons: Refresh & Register */}
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => loadTenants(true)}
              disabled={isRefreshing || loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              title="Refresh master registry"
            >
              <ArrowPathIcon className={`h-4 w-4 text-slate-600 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
              <span className="hidden md:inline">Refresh</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <PlusIcon className="h-4 w-4 stroke-[2.5]" />
              <span>Register New Company</span>
            </button>
          </div>
        </div>

        {/* Global Connection / Registry Error banner */}
        {error && (
          <div className="flex items-center space-x-3 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-bold shadow-xs animate-fadeIn">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => loadTenants(true)} className="underline hover:text-amber-800 font-extrabold cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {/* =========================================================================
            VIEW 1: PLATFORM OVERVIEW (TAB: overview)
            ========================================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Real-time KPI Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Card 1: Total Registered Companies */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition duration-200 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Registered Companies</p>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{totalTenants}</h3>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition duration-200 shadow-2xs">
                    <BuildingOffice2Icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 text-[10px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {activeTenants} Active
                  </span>
                  <span className="text-slate-400 text-[11px] font-medium">
                    {suspendedTenants} Suspended
                  </span>
                </div>
              </div>

              {/* Card 2: Platform Users Count */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition duration-200 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Platform Users Count</p>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{platformUsersCount}</h3>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition duration-200 shadow-2xs">
                    <UsersIcon className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500 text-[11px]">
                    Staff across organizations
                  </span>
                  <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md text-[10px] border border-indigo-200/80">
                    Avg {totalTenants > 0 ? Math.round(platformUsersCount / totalTenants) : 0} / org
                  </span>
                </div>
              </div>

              {/* Card 3: Monthly SaaS Income */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition duration-200 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-violet-600"></div>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Monthly SaaS Income</p>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                      ₹{monthlySaasIncome.toLocaleString("en-IN")}
                    </h3>
                  </div>
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition duration-200 shadow-2xs">
                    <CreditCardIcon className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500 text-[11px]">
                    ₹9,000 / tenant / mo
                  </span>
                  <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md text-[10px] border border-purple-200/80">
                    ARR: ₹{(monthlySaasIncome * 12).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Card 4: Active Licenses */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition duration-200 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600"></div>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Licenses</p>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{platformUsersCount} / {totalCapacitySeats}</h3>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition duration-200 shadow-2xs">
                    <CpuChipIcon className="h-6 w-6" />
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500">
                    <span>{seatUtilizationPct}% Allocated</span>
                    <span>{totalCapacitySeats - platformUsersCount} Seats Free</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500" 
                      style={{ width: `${seatUtilizationPct}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Recent Registered Companies Table Container */}
            <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm">
              
              {/* Header with Title, Search, and Filters */}
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-black text-slate-900 tracking-tight">Recent Registered Companies</h3>
                    <span className="bg-blue-50 text-blue-700 border border-blue-200/80 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                      {filteredTenants.length} of {totalTenants}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Specifications and operational controls of active merchant tenants on the platform</p>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-wrap items-center gap-2.5">
                  
                  {/* Search input */}
                  <div className="relative flex-1 sm:w-64">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search company, owner, ID..."
                      className="pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-xs w-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white font-medium"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <XMarkIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Status filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>

                  {/* Plan filter */}
                  <select
                    value={filterPlan}
                    onChange={(e) => setFilterPlan(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  >
                    <option value="All">All Plans</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>

                  {/* Export CSV button */}
                  <button
                    onClick={handleExportCSV}
                    className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition shadow-2xs cursor-pointer flex items-center gap-1 text-xs font-bold"
                    title="Export table to CSV"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 text-slate-500" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4">Company Name</th>
                      <th className="px-4 py-4">Tenant ID</th>
                      <th className="px-4 py-4">Owner Name</th>
                      <th className="px-4 py-4">Email Address</th>
                      <th className="px-3 py-4 text-center">Plan</th>
                      <th className="px-4 py-4 text-center">Trial Status</th>
                      <th className="px-4 py-4">Registration</th>
                      <th className="px-4 py-4">Expiry Date</th>
                      <th className="px-3 py-4 text-center">Active Users</th>
                      <th className="px-3 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                    {loading ? (
                      <tr>
                        <td colSpan={11} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <ArrowPathIcon className="h-7 w-7 text-blue-600 animate-spin" />
                            <span className="text-xs font-bold text-slate-500">Querying master tenant catalog...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredTenants.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <BuildingOffice2Icon className="h-10 w-10 text-slate-300" />
                            <p className="text-sm font-bold text-slate-700">No company records found</p>
                            <p className="text-xs text-slate-400">
                              {searchQuery ? "Try refining your search keyword or filters." : "Provision your first corporate tenant using the button above."}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredTenants.map((tenant, idx) => {
                        const avatarGradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
                        const initials = getInitials(tenant.name || "Company");
                        const isCopied = copiedTenantId === tenant.id;

                        return (
                          <tr key={tenant.id} className="hover:bg-slate-50/70 transition duration-150 group">
                            
                            {/* Company Name & DB Badge */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center font-black text-xs shadow-xs shrink-0 tracking-wider`}>
                                  {initials}
                                </div>
                                <div>
                                  <span className="font-extrabold text-slate-900 text-sm block group-hover:text-blue-600 transition">
                                    {tenant.name}
                                  </span>
                                  <span className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-400 font-semibold">
                                    <ServerStackIcon className="h-3 w-3 text-slate-400" />
                                    <span>{tenant.db}</span>
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Tenant ID with 1-Click Copy */}
                            <td className="px-4 py-4">
                              <div className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-2 py-1 rounded-lg transition">
                                <span className="font-mono text-[11px] font-bold text-slate-700" title={tenant.id}>
                                  {tenant.id ? `${tenant.id.slice(0, 8)}...${tenant.id.slice(-4)}` : "--"}
                                </span>
                                <button
                                  onClick={() => handleCopyId(tenant.id)}
                                  className="text-slate-400 hover:text-blue-600 transition cursor-pointer"
                                  title="Copy full UUID to clipboard"
                                >
                                  {isCopied ? (
                                    <ClipboardDocumentCheckIcon className="h-3.5 w-3.5 text-emerald-600" />
                                  ) : (
                                    <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                              {isCopied && (
                                <span className="block text-[9px] font-extrabold text-emerald-600 mt-0.5 animate-fadeIn">
                                  ✓ Copied!
                                </span>
                              )}
                            </td>

                            {/* Owner Name */}
                            <td className="px-4 py-4 font-bold text-slate-800">
                              <span className="capitalize">{tenant.ownerName || "Administrator"}</span>
                            </td>

                            {/* Email Address */}
                            <td className="px-4 py-4 text-slate-500 font-medium">
                              <span className="font-mono text-[11px] block">{tenant.emailAddress || "--"}</span>
                            </td>

                            {/* Plan Badge */}
                            <td className="px-3 py-4 text-center">
                              <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide">
                                <span>💎</span>
                                <span>{tenant.plan || "YEARLY"}</span>
                              </span>
                            </td>

                            {/* Trial Status */}
                            <td className="px-4 py-4 text-center">
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-amber-200/80">
                                <SparklesIcon className="h-3 w-3 text-amber-600" />
                                <span>{tenant.trialStatus || "Trial Active"}</span>
                              </span>
                            </td>

                            {/* Registration Date */}
                            <td className="px-4 py-4 text-slate-500 font-medium whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 text-[11px]">
                                <CalendarDaysIcon className="h-3.5 w-3.5 text-slate-400" />
                                {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric"
                                }) : "--"}
                              </span>
                            </td>

                            {/* Expiry Date */}
                            <td className="px-4 py-4 text-slate-500 font-medium whitespace-nowrap">
                              <div className="space-y-0.5">
                                <span className="text-[11px] block">
                                  {tenant.expiryDate ? new Date(tenant.expiryDate).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric"
                                  }) : "--"}
                                </span>
                                {tenant.remainingDays !== undefined && (
                                  <span className="text-[9px] font-bold text-slate-400 block">
                                    {tenant.remainingDays} days left
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Active Users */}
                            <td className="px-3 py-4 text-center">
                              <span className="inline-flex items-center justify-center px-2 py-0.5 bg-slate-100 text-slate-900 rounded-md font-black text-xs border border-slate-200">
                                {tenant.activeUsers || 0}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="px-3 py-4 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                tenant.status === "Active" 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  tenant.status === "Active" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                                }`}></span>
                                <span>{tenant.status || "Active"}</span>
                              </span>
                            </td>

                            {/* Action Buttons */}
                            <td className="px-6 py-4 text-center">
                              <div className="inline-flex items-center gap-1.5">
                                
                                {/* Enter Portal */}
                                <button
                                  onClick={() => handleEnterCompanyPortal(tenant)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 text-[11px] font-bold rounded-lg border border-blue-200 transition cursor-pointer shadow-2xs group/btn"
                                  title={`Switch to ${tenant.name} Admin Portal`}
                                >
                                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                                  <span>Enter</span>
                                </button>

                                {/* Delete Company */}
                                <button
                                  onClick={() => {
                                    setDeleteError("");
                                    setDeleteModal({ open: true, tenant });
                                  }}
                                  className="p-1.5 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition cursor-pointer"
                                  title="Delete merchant company"
                                >
                                  <TrashIcon className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Displaying {filteredTenants.length} of {totalTenants} merchant systems</span>
                <span className="text-[11px] text-slate-400">All tenant databases provisioned on MySQL port 3306</span>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 2: COMPANY TENANT REGISTERS PAGE (TAB: registers)
            ========================================================================= */}
        {activeTab === "registers" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Header section with back click */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setActiveTab("overview")} 
                  className="p-2 border bg-slate-50 hover:bg-slate-100 border-slate-200 rounded-xl text-slate-600 transition shadow-2xs cursor-pointer"
                  title="Back to Platform Overview"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                </button>
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight">Company Tenant Registers</h2>
                  <p className="text-xs text-slate-500 font-semibold">Detailed specifications, database mappings, and management actions</p>
                </div>
              </div>

              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                {tenants.length} Total Registered
              </span>
            </div>

            {/* List entries */}
            <div className="space-y-4">
              {loading ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 font-semibold shadow-sm">
                  <ArrowPathIcon className="h-7 w-7 text-blue-600 animate-spin mx-auto mb-2" />
                  <span>Querying master registry pools...</span>
                </div>
              ) : tenants.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 font-semibold shadow-sm">
                  No company configurations provisioned yet.
                </div>
              ) : (
                tenants.map((tenant, idx) => {
                  const avatarGradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
                  const initials = getInitials(tenant.name || "Company");

                  return (
                    <div 
                      key={tenant.id} 
                      className="bg-white border border-slate-200/90 rounded-3xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-md transition shadow-xs group"
                    >
                      {/* Company details (left) */}
                      <div className="flex items-start space-x-4 lg:w-1/4">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center font-black text-base shadow-xs shrink-0 tracking-wider`}>
                          {initials}
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-slate-900 text-base leading-tight group-hover:text-blue-600 transition">
                            {tenant.name}
                          </h4>
                          <p className="text-xs text-slate-400 font-semibold leading-tight">{tenant.address || "Main Office / HQ"}</p>
                          <span className="inline-block font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border">
                            ID: {tenant.id ? tenant.id.slice(0, 8) : "--"}
                          </span>
                        </div>
                      </div>

                      {/* Database name */}
                      <div className="lg:w-1/6 space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Database Name</p>
                        <p className="text-xs font-mono font-extrabold text-indigo-700 bg-indigo-50/70 border border-indigo-100 px-2.5 py-1 rounded-lg inline-block">
                          {tenant.db}
                        </p>
                      </div>

                      {/* Admin ID / Owner */}
                      <div className="lg:w-1/4 space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Owner & Admin</p>
                        <p className="text-xs font-extrabold text-slate-900 capitalize">{tenant.ownerName || "Admin"}</p>
                        <p className="text-[11px] font-semibold text-slate-500">
                          {tenant.emailAddress || "--"}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400">
                          Phone: {tenant.phone || "--"}
                        </p>
                      </div>

                      {/* Plan Mappings */}
                      <div className="lg:w-1/6 space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Plan & Expiry</p>
                        <p className="text-xs font-extrabold text-slate-800">{tenant.plan || "YEARLY"} PLAN</p>
                        <p className="text-[11px] font-semibold text-slate-500">
                          Expires: {tenant.expiryDate ? new Date(tenant.expiryDate).toLocaleDateString("en-GB") : "--"}
                        </p>
                        <span className="inline-block bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-bold">
                          {tenant.remainingDays} Days Left
                        </span>
                      </div>

                      {/* Status badge */}
                      <div className="lg:w-1/12">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${
                          tenant.status === "Active" 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            tenant.status === "Active" ? "bg-emerald-500" : "bg-rose-500"
                          }`}></span>
                          <span>{tenant.status}</span>
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleEnterCompanyPortal(tenant)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-sm cursor-pointer flex items-center gap-1.5 text-xs font-bold" 
                          title="Enter Company Portal"
                        >
                          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                          <span>Enter Portal</span>
                        </button>
                        <button 
                          onClick={() => {
                            setDeleteError("");
                            setDeleteModal({ open: true, tenant });
                          }}
                          className="p-2 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-400 rounded-xl transition shadow-xs cursor-pointer" 
                          title="Delete company"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

      </main>

      {/* =========================================================================
          MODAL: REGISTER NEW COMPANY
          ========================================================================= */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="REGISTER NEW MERCHANT TENANT"
        size="medium"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50/80 border border-blue-100 rounded-xl text-xs text-blue-800 font-semibold flex items-center gap-2">
            <SparklesIcon className="h-4 w-4 text-blue-600 shrink-0" />
            <span>Registering will automatically create an isolated MySQL database, provision schema tables, and set up super-admin credentials.</span>
          </div>

          <DynamicForm
            fields={companyRegistrationFields}
            formData={formData}
            onChange={handleInputChange}
            onSubmit={handleRegisterCompany}
            onCancel={() => setIsModalOpen(false)}
            loading={formLoading}
            error={formError}
            success={formSuccess}
            submitButtonText="Provision Company Database"
          />
        </div>
      </Modal>

      {/* =========================================================================
          MODAL: DELETE COMPANY CONFIRMATION
          ========================================================================= */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => !deleteLoading && setDeleteModal({ open: false, tenant: null })}
        title="DELETE COMPANY TENANT"
        size="small"
      >
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3 text-rose-800">
            <ExclamationTriangleIcon className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1.5">
              <p className="font-bold text-sm text-rose-900">Permanent Database Deletion</p>
              <p>Are you sure you want to permanently delete <span className="font-bold underline text-rose-900">{deleteModal.tenant?.name}</span>?</p>
              <p className="text-slate-600">
                This will permanently drop the physical database <span className="font-mono font-bold text-slate-800">`{deleteModal.tenant?.db}`</span> and purge it from the master registry. All employee records, assets, and payroll will be erased.
              </p>
            </div>
          </div>

          {deleteError && (
            <div className="p-3 bg-rose-100 border border-rose-300 text-rose-800 text-xs rounded-xl font-bold">
              {deleteError}
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ open: false, tenant: null })}
              disabled={deleteLoading}
              className="text-xs font-bold px-4 py-2 border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              loading={deleteLoading}
              className="text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-rose-600/20 cursor-pointer"
            >
              Permanently Drop & Delete
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default SuperAdminDashboard;
