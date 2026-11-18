import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Badge, Modal, DynamicForm } from "../components/ui";
import Button from "../components/ui/Button";
import technoLogo from "../assets/shortlogo1.png";
import { 
  BuildingOffice2Icon,
  BuildingOfficeIcon,
  MapPinIcon,
  CircleStackIcon, 
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
  ServerStackIcon,
  ClockIcon,
  IdentificationIcon,
  EyeIcon,
  EyeSlashIcon,
  PhoneIcon,
  GlobeAltIcon,
  BriefcaseIcon,
  CurrencyRupeeIcon,
  EnvelopeIcon,
  ArrowsRightLeftIcon,
  BanknotesIcon,
  UserGroupIcon,
  QuestionMarkCircleIcon,
  UserPlusIcon
} from "@heroicons/react/24/outline";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const MAX_COMPANIES = 50;

const companyRegistrationFields = [
  { name: "companyName", label: "Company Name", type: "text", required: true, placeholder: "Enter registered company name", halfWidth: true, autoComplete: "off" },
  { name: "companyEmail", label: "Company Email", type: "email", required: true, placeholder: "company@example.com", halfWidth: true, autoComplete: "off" },
  { name: "gst", label: "GSTIN / GST Number", type: "text", required: false, placeholder: "Enter GSTIN (optional)", halfWidth: true, autoComplete: "off" },
  { name: "state", label: "State", type: "text", required: false, placeholder: "Enter state", halfWidth: true, autoComplete: "off" },
  { name: "city", label: "City", type: "text", required: false, placeholder: "Enter city", halfWidth: true, autoComplete: "off" },
  { name: "pincode", label: "Pincode", type: "text", required: false, placeholder: "Enter 6-digit postal code", halfWidth: true, autoComplete: "off" },
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
  { name: "firstName", label: "Owner First Name", type: "text", required: true, placeholder: "Enter owner first name", halfWidth: true, autoComplete: "off" },
  { name: "lastName", label: "Owner Last Name", type: "text", required: true, placeholder: "Enter owner last name", halfWidth: true, autoComplete: "off" },
  { name: "adminEmail", label: "Admin Email", type: "email", required: true, placeholder: "admin@example.com", halfWidth: true, autoComplete: "off" },
  { name: "mobileNumber", label: "Mobile / Phone", type: "text", required: false, placeholder: "Enter 10-digit mobile number", halfWidth: true, autoComplete: "off" },
  { name: "password", label: "Admin Password", type: "password", required: true, placeholder: "Create strong admin password", halfWidth: true, autoComplete: "new-password" },
  { name: "confirmPassword", label: "Confirm Admin Password", type: "password", required: true, placeholder: "Confirm admin password", halfWidth: true, autoComplete: "new-password" }
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
  // Company, Multi-Company & Branch setup states for registration
  const [setupMode, setSetupMode] = useState("FULL_COMPANY_BRANCH");
  const [addCompanyChoice, setAddCompanyChoice] = useState("YES");
  const [multiCompanyChoice, setMultiCompanyChoice] = useState("NO");
  const [selectedAdditionalCompanies, setSelectedAdditionalCompanies] = useState([]);
  const [addBranchesChoice, setAddBranchesChoice] = useState("NO");
  const [targetCompanyId, setTargetCompanyId] = useState("");
  const [totalCompanies, setTotalCompanies] = useState(1);
  const [branchesPerCompany, setBranchesPerCompany] = useState(0);
  const [initialBranchesList, setInitialBranchesList] = useState([]);

  const toggleAdditionalCompany = (compCode) => {
    setSelectedAdditionalCompanies(prev =>
      prev.includes(compCode) ? prev.filter(c => c !== compCode) : [...prev, compCode]
    );
  };

  const handleBranchesCountChange = (count) => {
    const val = isNaN(count) ? 0 : Math.max(0, Math.min(50, count));
    setBranchesPerCompany(val);
    setInitialBranchesList(prev => {
      const updated = [];
      for (let i = 0; i < val; i++) {
        updated.push(prev[i] || {
          branchName: i === 0 ? "Main Headquarters" : `Branch ${i + 1}`,
          branchCode: i === 0 ? "HQ-01" : `BR-${String(i + 1).padStart(3, "0")}`,
          branchType: i === 0 ? "HQ" : "Branch",
          city: formData.city || "",
          state: formData.state || "",
          address: ""
        });
      }
      return updated;
    });
  };

  const updateBranchField = (index, field, value) => {
    setInitialBranchesList(prev => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], [field]: value };
      }
      return copy;
    });
  };

  const handleOpenRegisterModal = () => {
    if (tenants.length >= MAX_COMPANIES) return;

    setFormData({
      companyName: "",
      companyCode: "",
      companyEmail: "",
      companyPhone: "",
      website: "",
      companyType: "Pvt Ltd",
      industry: "Insurance & Financial Services",
      gst: "",
      panNumber: "",
      cinNumber: "",
      status: "Active",
      address: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      currency: "INR (₹)",
      timezone: "IST (GMT+5:30)",
      firstName: "",
      lastName: "",
      adminEmail: "",
      mobileNumber: "",
      adminDesignation: "Managing Director",
      password: "",
      confirmPassword: ""
    });
    setSetupMode("FULL_COMPANY_BRANCH");
    setAddCompanyChoice("YES");
    setMultiCompanyChoice("NO");
    setSelectedAdditionalCompanies([]);
    setAddBranchesChoice("NO");
    setTargetCompanyId(tenants[0]?.id || tenants[0]?.db || "");
    setTotalCompanies(1);
    setBranchesPerCompany(0);
    setInitialBranchesList([]);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFormError("");
    setFormSuccess("");
    setIsModalOpen(true);
  };
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

  // Current Company Live Data Hub State
  const [selectedCompanyForData, setSelectedCompanyForData] = useState(null);
  const [companyLiveData, setCompanyLiveData] = useState(null);
  const [loadingLiveData, setLoadingLiveData] = useState(false);
  const [liveDataError, setLiveDataError] = useState("");

  // Branch Management States for SuperAdmin
  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false);
  const [branchSubmitting, setBranchSubmitting] = useState(false);
  const [branchError, setBranchError] = useState("");
  const [branchSuccess, setBranchSuccess] = useState("");
  const [togglingBranchId, setTogglingBranchId] = useState(null);
  const [newBranchData, setNewBranchData] = useState({
    branchName: "",
    branchCode: "",
    branchType: "Branch",
    address: "",
    city: "",
    state: "",
    pincode: "",
    manager: "",
    email: "",
    phone: "",
    status: "Active"
  });

  const handleToggleTenantBranchStatus = async (branch) => {
    if (!selectedCompanyForData || !branch) return;
    const companyCode = selectedCompanyForData.code || selectedCompanyForData.id || selectedCompanyForData.db;
    const newStatus = branch.status === "Active" ? "Inactive" : "Active";
    setTogglingBranchId(branch.id);

    try {
      const response = await fetchWithAuth(`${API_BASE}/api/super-admin/tenants/${companyCode}/branches/${branch.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      if (response.ok && result.success) {
        setCompanyLiveData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            branches: (prev.branches || []).map(b => b.id === branch.id ? { ...b, status: newStatus } : b)
          };
        });
      } else {
        throw new Error(result.message || "Failed to toggle branch status.");
      }
    } catch (err) {
      alert("Error updating branch status: " + err.message);
      loadCompanyLiveData(selectedCompanyForData);
    } finally {
      setTogglingBranchId(null);
    }
  };

  const handleCreateTenantBranch = async (e) => {
    e.preventDefault();
    setBranchError("");
    setBranchSuccess("");

    if (!selectedCompanyForData) {
      setBranchError("Please select a company tenant first.");
      return;
    }

    const currentBranchesCount = companyLiveData?.branches?.length || 0;
    if (currentBranchesCount >= 50) {
      setBranchError("This company tenant has reached the maximum limit of 50 branches.");
      return;
    }

    if (!newBranchData.branchName.trim()) {
      setBranchError("Branch Name is required.");
      return;
    }
    if (!newBranchData.branchCode.trim()) {
      setBranchError("Branch Code is required.");
      return;
    }

    setBranchSubmitting(true);
    try {
      const companyCode = selectedCompanyForData.code || selectedCompanyForData.id || selectedCompanyForData.db;
      const response = await fetchWithAuth(`${API_BASE}/api/super-admin/tenants/${companyCode}/branches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBranchData)
      });
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      if (response.ok && result.success) {
        setBranchSuccess("Branch created successfully!");
        setNewBranchData({
          branchName: "",
          branchCode: "",
          branchType: "Branch",
          address: "",
          city: "",
          state: "",
          pincode: "",
          manager: "",
          email: "",
          phone: "",
          status: "Active"
        });
        await loadCompanyLiveData(selectedCompanyForData);
        setTimeout(() => {
          setIsAddBranchModalOpen(false);
          setBranchSuccess("");
        }, 1200);
      } else {
        throw new Error(result.message || result.error || "Failed to create branch.");
      }
    } catch (err) {
      setBranchError(err.message || "Error adding branch to tenant.");
    } finally {
      setBranchSubmitting(false);
    }
  };

  const loadCompanyLiveData = async (tenant, switchTab = false) => {
    if (!tenant) return;
    setSelectedCompanyForData(tenant);
    if (switchTab) setActiveTab("company_data");
    setLoadingLiveData(true);
    setLiveDataError("");
    try {
      const response = await fetchWithAuth(`${API_BASE}/api/super-admin/tenants/${tenant.code || tenant.id}/live-data`);
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      if (response.ok && result.success) {
        setCompanyLiveData(result.data);
      } else {
        throw new Error(result.error || result.message || "Failed to load live company data.");
      }
    } catch (err) {
      console.error(err);
      setLiveDataError(err.message || "Error querying tenant database.");
    } finally {
      setLoadingLiveData(false);
    }
  };

  // Form fields state
  const [formData, setFormData] = useState({
    companyName: "",
    companyCode: "",
    companyEmail: "",
    companyPhone: "",
    website: "",
    companyType: "Pvt Ltd",
    industry: "Insurance & Financial Services",
    gst: "",
    panNumber: "",
    cinNumber: "",
    status: "Active",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    currency: "INR (₹)",
    timezone: "IST (GMT+5:30)",
    firstName: "",
    lastName: "",
    adminEmail: "",
    mobileNumber: "",
    adminDesignation: "Managing Director",
    password: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        const tenantList = result.data || [];
        setTenants(tenantList);
        if (tenantList.length > 0) {
          const savedCode = localStorage.getItem("selected_company_code") || localStorage.getItem("selected_tenant_db");
          const defaultTenant = tenantList.find(t => t.id === savedCode || t.db === savedCode) || tenantList[0];
          setSelectedCompanyForData(defaultTenant);
          loadCompanyLiveData(defaultTenant, false);
        }
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

  // Submit Handler for New Company Registration & Admin Creation
  const handleRegisterCompany = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    if (!formData.firstName || !formData.firstName.trim()) {
      setFormError("First Name is required.");
      return;
    }

    if (!formData.adminEmail || !formData.adminEmail.trim()) {
      setFormError("Admin Email is required.");
      return;
    }

    // PATH 1: Admin Only (No new company, assign to existing company)
    if (addCompanyChoice === "NO" || setupMode === "ADMIN_ONLY") {
      if (!targetCompanyId) {
        setFormError("Please select a target company for this Admin.");
        return;
      }

      setFormLoading(true);
      try {
        const payload = {
          setupMode: "ADMIN_ONLY",
          createNewCompany: false,
          targetCompanyId,
          additionalCompanyIds: multiCompanyChoice === "YES" ? selectedAdditionalCompanies : [],
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          adminEmail: formData.adminEmail.trim(),
          mobileNumber: formData.mobileNumber.trim(),
          adminDesignation: formData.adminDesignation || "Administrator",
          password: formData.password
        };

        const response = await fetchWithAuth(`${API_BASE}/api/super-admin/tenants`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const text = await response.text();
        const result = text ? JSON.parse(text) : {};
        if (response.ok && result.success) {
          setFormSuccess(result.message || "Admin account successfully created and assigned!");
          await loadTenants();
          setTimeout(() => {
            setIsModalOpen(false);
            setFormSuccess("");
          }, 1500);
        } else {
          throw new Error(result.message || result.error || "Failed to create Admin account.");
        }
      } catch (err) {
        setFormError(err.message || "An error occurred while creating the Admin.");
      } finally {
        setFormLoading(false);
      }
      return;
    }

    // PATH 2: Full Company & Branch Provisioning
    const numCompanies = Number(totalCompanies);
    const numBranches = addBranchesChoice === "NO" ? 0 : Number(branchesPerCompany);

    if (isNaN(numCompanies) || numCompanies < 1 || numCompanies > 50) {
      setFormError("Total Companies must be a number between 1 and 50.");
      return;
    }

    if (isNaN(numBranches) || numBranches < 0 || numBranches > 50) {
      setFormError("Branches per Company must be a number between 0 and 50.");
      return;
    }

    if (tenants.length + numCompanies > MAX_COMPANIES) {
      setFormError(`Registering ${numCompanies} company(ies) exceeds the maximum limit of ${MAX_COMPANIES} companies. Currently registered: ${tenants.length}.`);
      return;
    }

    if (!formData.companyName || !formData.companyName.trim()) {
      setFormError("Company Name is required.");
      return;
    }

    if (!formData.companyEmail || !formData.companyEmail.trim()) {
      setFormError("Company Official Email is required.");
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        ...formData,
        createNewCompany: true,
        setupMode: "FULL_COMPANY_BRANCH",
        totalCompanies: multiCompanyChoice === "YES" ? numCompanies : 1,
        additionalCompanyIds: multiCompanyChoice === "YES" ? selectedAdditionalCompanies : [],
        branchesPerCompany: numBranches,
        branchesList: addBranchesChoice === "YES" ? initialBranchesList : []
      };

      const response = await fetchWithAuth(`${API_BASE}/api/super-admin/tenants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      if (response.ok && result.success) {
        setFormSuccess("Company registered and database provisioned successfully!");
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
        setTotalCompanies(1);
        setBranchesPerCompany(0);
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
  const isCompanyLimitReached = totalTenants >= MAX_COMPANIES;
  const activeTenants = tenants.filter(t => t.status === "Active").length;
  const suspendedTenants = tenants.filter(t => t.status !== "Active").length;
  const platformUsersCount = tenants.reduce((acc, curr) => acc + (curr.activeUsers || 0), 0);
  const monthlySaasIncome = activeTenants * 9000;

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          
          {/* Brand Logo & SuperAdmin Title (Matching Admin Dashboard & 1st line only) */}
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-800 p-1 shadow-lg shadow-blue-500/20 flex items-center justify-center shrink-0">
              <img src={technoLogo} alt="TechnoVani" className="h-7 w-auto object-contain brightness-0 invert" />
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Multi-Tenant Platform
              </h1>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                SUPERADMIN
              </span>
            </div>
          </div>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center gap-3">

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

            <button
              onClick={() => {
                if (selectedCompanyForData) {
                  loadCompanyLiveData(selectedCompanyForData, true);
                } else if (tenants.length > 0) {
                  loadCompanyLiveData(tenants[0], true);
                } else {
                  setActiveTab("company_data");
                }
              }}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                activeTab === "company_data" 
                  ? "bg-white text-indigo-600 shadow-sm shadow-slate-200 border border-slate-200/60" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <BuildingOfficeIcon className="w-4 h-4 text-indigo-500" />
              <span>Company Inspector & Branches</span>
              {companyLiveData?.branches?.length !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  activeTab === "company_data" ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-600"
                }`}>
                  {companyLiveData.branches.length}
                </span>
              )}
            </button>
          </div>

          {/* Action Buttons: Total Companies Badge & Register */}
          <div className="flex items-center gap-2.5 justify-end">
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border transition bg-blue-50 text-blue-700 border-blue-200">
              <BuildingOffice2Icon className="h-4 w-4 shrink-0 text-blue-600" />
              <span>Companies: <strong>{tenants.length}</strong></span>
            </span>

            <button
              onClick={handleOpenRegisterModal}
              disabled={isCompanyLimitReached}
              className={`inline-flex items-center justify-center gap-2 font-black text-xs px-4 py-2.5 rounded-xl transition shadow-md text-white ${
                isCompanyLimitReached
                  ? "bg-slate-400 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              }`}
              title={isCompanyLimitReached ? `Maximum of ${MAX_COMPANIES} companies reached` : "Register a new company"}
            >
              <PlusIcon className="h-4 w-4 stroke-[2.5]" />
              <span>Create Admin / Company</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              
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
                                
                                {/* Inspect Live Data */}
                                <button
                                  onClick={() => loadCompanyLiveData(tenant, true)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-[11px] font-bold rounded-lg border border-indigo-200 transition cursor-pointer shadow-2xs group/btn"
                                  title={`Inspect Live Data for ${tenant.name}`}
                                >
                                  <BuildingOffice2Icon className="h-3.5 w-3.5" />
                                  <span>Inspect</span>
                                </button>

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
                          onClick={() => loadCompanyLiveData(tenant, true)}
                          className="px-3 py-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 rounded-xl transition shadow-sm border border-indigo-200 cursor-pointer flex items-center gap-1.5 text-xs font-bold" 
                          title="Inspect Tenant Data"
                        >
                          <BuildingOffice2Icon className="h-4 w-4" />
                          <span>Inspect</span>
                        </button>

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

        {/* =========================================================================
            TAB 3: CURRENT COMPANY LIVE DATA HUB (REAL-TIME TENANT INSPECTOR)
            ========================================================================= */}
        {activeTab === "company_data" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Top Toolbar: Company Switcher & Status Banner */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <BuildingOffice2Icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                      {selectedCompanyForData?.name || selectedCompanyForData?.companyName || "Select Company"}
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Live Isolated DB</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Physical Database: <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-mono text-[11px] font-bold">{companyLiveData?.tenant?.db || selectedCompanyForData?.db || "connecting..."}</code> | Code: <span className="font-mono text-slate-700 font-bold">{companyLiveData?.tenant?.id || selectedCompanyForData?.id}</span>
                  </p>
                </div>
              </div>

              {/* Selector and Actions */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <label htmlFor="companySelectDropdown" className="text-xs font-bold text-slate-600">Switch Company:</label>
                  <select
                    id="companySelectDropdown"
                    value={selectedCompanyForData?.id || ""}
                    onChange={(e) => {
                      const t = tenants.find(item => item.id === e.target.value);
                      if (t) loadCompanyLiveData(t);
                    }}
                    className="bg-white text-xs font-bold text-slate-800 rounded-lg px-2.5 py-1.5 border border-slate-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.db})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => loadCompanyLiveData(selectedCompanyForData)}
                  disabled={loadingLiveData}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50"
                  title="Refresh live data from tenant database"
                >
                  <ArrowPathIcon className={`h-4 w-4 ${loadingLiveData ? "animate-spin text-indigo-600" : "text-slate-500"}`} />
                  <span>Refresh</span>
                </button>

                <button
                  onClick={() => selectedCompanyForData && handleEnterCompanyPortal(selectedCompanyForData)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition shadow-sm cursor-pointer"
                  title="Switch application context to this company and open Admin portal"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  <span>Enter as Company Admin</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {liveDataError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-rose-600 shrink-0" />
                  <span>{liveDataError}</span>
                </div>
                <button
                  onClick={() => loadCompanyLiveData(selectedCompanyForData)}
                  className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-lg text-xs font-extrabold cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Live KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Total Employees */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-blue-300 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">Live Employees</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition">
                    <UsersIcon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {loadingLiveData ? "..." : (companyLiveData?.stats?.employeesCount ?? 0)}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Records in tenant <code className="font-mono text-slate-700 font-bold">employees</code> table
                  </p>
                </div>
              </div>

              {/* Total Departments */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">Departments</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition">
                    <BuildingOffice2Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {loadingLiveData ? "..." : (companyLiveData?.stats?.departmentsCount ?? 0)}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Configured operational units
                  </p>
                </div>
              </div>

              {/* Today's Attendance */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-indigo-300 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">Today's Clock-Ins</span>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition">
                    <ClockIcon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {loadingLiveData ? "..." : (companyLiveData?.stats?.attendanceTodayCount ?? 0)}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Records in <code className="font-mono text-slate-700 font-bold">daily_attendance</code> for today
                  </p>
                </div>
              </div>

              {/* Registered Users */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-amber-300 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">Tenant Users</span>
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition">
                    <IdentificationIcon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {loadingLiveData ? "..." : (companyLiveData?.stats?.usersCount ?? 0)}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    User logins in tenant database
                  </p>
                </div>
              </div>

            </div>

            {/* Company Profile Details Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BuildingOffice2Icon className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">
                    Company Profile Details ({companyLiveData?.tenant?.name || selectedCompanyForData?.name})
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-500">
                  DB: {companyLiveData?.tenant?.db || selectedCompanyForData?.db}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Company Name</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block">
                    {companyLiveData?.companyProfile?.companyName || companyLiveData?.tenant?.name || "N/A"}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Admin Email</span>
                  <span className="text-xs font-bold text-slate-800 mt-1 block font-mono">
                    {companyLiveData?.companyProfile?.companyEmail || companyLiveData?.tenant?.adminEmail || "N/A"}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">GSTIN / Tax ID</span>
                  <span className="text-xs font-bold text-slate-800 mt-1 block font-mono">
                    {companyLiveData?.companyProfile?.gst || companyLiveData?.companyProfile?.gstNumber || "Not Registered"}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Location / City</span>
                  <span className="text-xs font-bold text-slate-800 mt-1 block">
                    {[companyLiveData?.companyProfile?.city, companyLiveData?.companyProfile?.state].filter(Boolean).join(", ") || "India"}
                  </span>
                </div>
              </div>
            </div>

            {/* Two Column Layout: Employees Roster & Departments Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column (2 cols): Employees Roster */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">Active Employee Roster</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Live records from tenant database</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-black rounded-lg border border-blue-100">
                    {companyLiveData?.recentEmployees?.length || 0} shown of {companyLiveData?.stats?.employeesCount || 0}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-black uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Contact</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Designation</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loadingLiveData ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                            <ArrowPathIcon className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
                            Loading live records from database...
                          </td>
                        </tr>
                      ) : (!companyLiveData?.recentEmployees || companyLiveData.recentEmployees.length === 0) ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                            No employee records found in this tenant database.
                          </td>
                        </tr>
                      ) : (
                        companyLiveData.recentEmployees.map((emp, idx) => {
                          const fullName = [emp.first_name || emp.firstName, emp.last_name || emp.lastName].filter(Boolean).join(" ") || emp.name || "Employee";
                          const empCode = emp.employee_code || emp.emp_code || emp.empCode || emp.code || `#${idx + 1}`;
                          const email = emp.email || emp.official_email || "N/A";
                          const phone = emp.phone || emp.mobile || emp.mobile_number || "-";
                          const dept = emp.department || emp.department_name || "-";
                          const desig = emp.designation || "-";
                          const status = emp.status || "Active";

                          return (
                            <tr key={emp.id || idx} className="hover:bg-slate-50/70 transition">
                              <td className="px-4 py-3">
                                <div className="font-black text-slate-800">{fullName}</div>
                                <div className="font-mono text-[10px] text-slate-400 font-bold">{empCode}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-slate-700 font-mono text-[11px]">{email}</div>
                                <div className="text-slate-400 text-[10px]">{phone}</div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                                  {dept}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-600 font-medium">
                                {desig}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  status.toLowerCase() === "active" 
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}>
                                  {status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column (1 col): Departments Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BuildingOffice2Icon className="h-5 w-5 text-emerald-600" />
                    <div>
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">Departments</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Operational Units</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-black rounded-lg border border-emerald-100">
                    {companyLiveData?.departments?.length || 0}
                  </span>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-black uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                        <th className="px-4 py-3">Dept Name</th>
                        <th className="px-4 py-3 text-right">Code</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loadingLiveData ? (
                        <tr>
                          <td colSpan={2} className="py-8 text-center text-slate-400 font-medium">
                            <ArrowPathIcon className="h-5 w-5 animate-spin mx-auto mb-1 text-emerald-500" />
                            Loading...
                          </td>
                        </tr>
                      ) : (!companyLiveData?.departments || companyLiveData.departments.length === 0) ? (
                        <tr>
                          <td colSpan={2} className="py-8 text-center text-slate-400 font-medium">
                            No departments found.
                          </td>
                        </tr>
                      ) : (
                        companyLiveData.departments.map((dept, idx) => (
                          <tr key={dept.id || idx} className="hover:bg-slate-50/70 transition">
                            <td className="px-4 py-3 font-bold text-slate-800">
                              {dept.department_name || dept.departmentName || dept.name || "Department"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="font-mono text-[10px] font-black bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                                {dept.department_code || dept.departmentCode || dept.code || `#${idx + 1}`}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Quick Action Card */}
                <div className="p-4 bg-slate-50/70 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      if (selectedCompanyForData) {
                        handleEnterCompanyPortal(selectedCompanyForData);
                      }
                    }}
                    className="w-full py-2.5 px-4 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-indigo-700 font-black text-xs rounded-xl transition shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 text-indigo-600" />
                    <span>Open Company Admin Console</span>
                  </button>
                </div>

              </div>

            </div>

            {/* =========================================================================
                SECTION: TENANT BRANCH NETWORK & OPERATIONAL POLICIES (MAX 50)
                ========================================================================= */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                    <BuildingOffice2Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">
                        Branch Network & Operational Policies
                      </h3>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-black rounded-md border border-blue-100">
                        {(companyLiveData?.branches || []).length} / 50 Facilities
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Multi-facility controls, working hours, manager assignments, holiday calendars, and transfer audit
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setBranchError("");
                      setBranchSuccess("");
                      setIsAddBranchModalOpen(true);
                    }}
                    disabled={(companyLiveData?.branches || []).length >= 50}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer text-white shadow-2xs ${
                      (companyLiveData?.branches || []).length >= 50
                        ? "bg-slate-300 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    <PlusIcon className="w-4 h-4 stroke-[2.5]" />
                    <span>Add Branch (Max 50)</span>
                  </button>
                </div>
              </div>

              {/* Branch Directory Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-black uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                      <th className="px-4 py-3">Branch / Facility</th>
                      <th className="px-4 py-3">Branch Manager</th>
                      <th className="px-4 py-3">Working Hours & Weekly Off</th>
                      <th className="px-4 py-3">Attendance & Grace</th>
                      <th className="px-4 py-3">Payroll & Compliance</th>
                      <th className="px-4 py-3 text-center">Headcount</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingLiveData ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                          <ArrowPathIcon className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
                          Querying live tenant branch network...
                        </td>
                      </tr>
                    ) : (!companyLiveData?.branches || companyLiveData.branches.length === 0) ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                          No branches configured for this company yet. Click "Add Branch" above to create one.
                        </td>
                      </tr>
                    ) : (
                      companyLiveData.branches.map((b) => {
                        const isBranchActive = (b.status || "Active").toLowerCase() === "active";
                        const isToggling = togglingBranchId === b.id;

                        return (
                          <tr key={b.id} className="hover:bg-slate-50/70 transition">
                            {/* Branch Name & Code */}
                            <td className="px-4 py-3.5">
                              <div className="font-black text-slate-900 flex items-center gap-1.5">
                                <BuildingOfficeIcon className="w-4 h-4 text-blue-600 shrink-0" />
                                <span>{b.branch_name || b.branchName || "Main Facility"}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                                <span className="font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                  {b.branch_code || b.branchCode || "HQ"}
                                </span>
                                <span className="text-slate-400">
                                  {[b.city, b.state].filter(Boolean).join(", ") || "India"}
                                </span>
                              </div>
                            </td>

                            {/* Branch Manager */}
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-slate-800">
                                {b.manager || "Unassigned"}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {b.email || b.phone || "No contact"}
                              </div>
                            </td>

                            {/* Working Hours & Shifts */}
                            <td className="px-4 py-3.5">
                              <div className="font-mono font-bold text-slate-800 flex items-center gap-1">
                                <ClockIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span>{b.opening_time || "09:00"} - {b.closing_time || "18:00"}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Off: <strong className="text-slate-600">{b.weekly_off || "Sunday"}</strong>
                              </div>
                            </td>

                            {/* Attendance & Grace */}
                            <td className="px-4 py-3.5">
                              <div className="text-slate-700 font-semibold">
                                Grace: <strong className="text-slate-900">{b.grace_period_mins || 15}m</strong>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Half: {b.half_day_hours || 4.5}h | Full: {b.full_day_hours || 8.5}h
                              </div>
                            </td>

                            {/* Payroll & Compliance */}
                            <td className="px-4 py-3.5">
                              <div className="text-slate-700 font-semibold flex items-center gap-1">
                                <BanknotesIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>PT: {b.pt_state || b.state || "Default"}</span>
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                CC: {b.cost_center || "CC-01"}
                              </div>
                            </td>

                            {/* Headcount */}
                            <td className="px-4 py-3.5 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-100">
                                <UsersIcon className="w-3 h-3" />
                                <span>{b.employee_count ?? 0}</span>
                              </span>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3.5 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                isBranchActive
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isBranchActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
                                <span>{isBranchActive ? "Active" : "Inactive"}</span>
                              </span>
                            </td>

                            {/* 1-Click Status Toggle Action */}
                            <td className="px-4 py-3.5 text-right">
                              <button
                                onClick={() => handleToggleTenantBranchStatus(b)}
                                disabled={isToggling}
                                className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer border ${
                                  isBranchActive
                                    ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                } disabled:opacity-50`}
                                title={isBranchActive ? "Deactivate branch" : "Activate branch"}
                              >
                                {isToggling ? (
                                  <ArrowPathIcon className="w-3.5 h-3.5 animate-spin mx-auto" />
                                ) : isBranchActive ? (
                                  "Deactivate"
                                ) : (
                                  "Activate"
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* =========================================================================
                TWO COLUMNS: EMPLOYEE TRANSFERS AUDIT & BRANCH HOLIDAY CALENDARS
                ========================================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column: Tenant Employee Transfers Log */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowsRightLeftIcon className="h-5 w-5 text-indigo-600" />
                    <div>
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">Employee Branch Transfers</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Inter-facility relocation audit log</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-black rounded-lg border border-indigo-100">
                    {(companyLiveData?.transfers || []).length} Recorded
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-black uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Transfer Route</th>
                        <th className="px-4 py-3">Effective Date</th>
                        <th className="px-4 py-3 text-right">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loadingLiveData ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400 font-medium">
                            <ArrowPathIcon className="h-5 w-5 animate-spin mx-auto mb-1 text-indigo-500" />
                            Loading transfers...
                          </td>
                        </tr>
                      ) : (!companyLiveData?.transfers || companyLiveData.transfers.length === 0) ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400 font-medium">
                            No employee transfer records in this tenant.
                          </td>
                        </tr>
                      ) : (
                        companyLiveData.transfers.map((t, idx) => (
                          <tr key={t.id || idx} className="hover:bg-slate-50/70 transition">
                            <td className="px-4 py-3 font-bold text-slate-800">
                              <div>{t.employee_name || "Employee"}</div>
                              <div className="font-mono text-[10px] text-slate-400">{t.employee_code || `#${t.employee_id}`}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs">
                                <span className="text-slate-500">{t.from_branch_name || "HQ"}</span>
                                <span className="text-indigo-600">→</span>
                                <span className="text-indigo-700 font-black">{t.to_branch_name || "Target"}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                              {t.effective_date ? new Date(t.effective_date).toLocaleDateString("en-GB") : "--"}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-500 text-[11px] max-w-[150px] truncate">
                              {t.reason || "Operational Transfer"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Branch Holiday Calendars */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="h-5 w-5 text-amber-600" />
                    <div>
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">Regional Holiday Calendar</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Branch-specific and regional observances</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-black rounded-lg border border-amber-100">
                    {(companyLiveData?.holidays || []).length} Holidays
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-black uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                        <th className="px-4 py-3">Holiday Name</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Applicable Branch</th>
                        <th className="px-4 py-3 text-right">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loadingLiveData ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400 font-medium">
                            <ArrowPathIcon className="h-5 w-5 animate-spin mx-auto mb-1 text-amber-500" />
                            Loading holidays...
                          </td>
                        </tr>
                      ) : (!companyLiveData?.holidays || companyLiveData.holidays.length === 0) ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400 font-medium">
                            No specific branch holidays registered. Standard statutory rules apply.
                          </td>
                        </tr>
                      ) : (
                        companyLiveData.holidays.map((h, idx) => (
                          <tr key={h.id || idx} className="hover:bg-slate-50/70 transition">
                            <td className="px-4 py-3 font-bold text-slate-800">
                              {h.holiday_name || h.name || "Holiday"}
                            </td>
                            <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                              {h.holiday_date ? new Date(h.holiday_date).toLocaleDateString("en-GB") : "--"}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                                {h.branch_name || "All Branches"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                {h.holiday_type || "Regional"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* =========================================================================
          MODAL: REGISTER NEW COMPANY WITH BRANCH MANAGEMENT & CAPACITY CONTROLS
          ========================================================================= */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={addCompanyChoice === "YES" ? "CREATE ADMIN & PROVISION COMPANY" : "CREATE ADMIN FOR EXISTING COMPANY"}
        size="xl"
      >
        <form onSubmit={handleRegisterCompany} className="space-y-6">
          {/* Multi-Tenant Database Provisioning Banner */}
          <div className="p-3.5 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200/80 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs font-bold text-blue-900">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <SparklesIcon className="h-4 w-4" />
              </div>
              <div>
                <span className="block font-black text-slate-900">Admin Account & Enterprise Architecture</span>
                <span className="text-[10px] text-slate-500 font-medium">Provision new physical tenant databases or assign directly to existing company networks</span>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full border bg-blue-100 text-blue-800 border-blue-300 shrink-0">
              {tenants.length} / {MAX_COMPANIES} Companies
            </span>
          </div>

          {/* =========================================================================
              PROMPT: Ask whether to add Company & Branch Network (User Requirement)
              ========================================================================= */}
          <div className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <QuestionMarkCircleIcon className="h-5 w-5 text-indigo-600 shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Step 1: Configuration Prompt (Company, Multi-Company & Branch Options)
                </span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Action Required
              </span>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Configure the exact enterprise scope for this Administrator: whether to register a <strong className="text-slate-900">New Company</strong>, manage <strong className="text-slate-900">Multiple Companies</strong>, or setup a <strong className="text-slate-900">Branch Network</strong>.
            </p>

            {/* Prompt Question 1: Company Setup */}
            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700">
                1. Do you want to add / register a new Company for this Admin?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setAddCompanyChoice("YES");
                    setSetupMode("FULL_COMPANY_BRANCH");
                  }}
                  className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    addCompanyChoice === "YES"
                      ? "border-blue-600 bg-blue-50/60 text-slate-900 shadow-xs ring-1 ring-blue-500/30"
                      : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <div>
                    <span className="block text-xs font-black text-slate-900">Yes, Register New Company</span>
                    <span className="text-[10px] text-slate-500 font-medium">Create isolated database & corporate profile</span>
                  </div>
                  {addCompanyChoice === "YES" && <CheckCircleIcon className="h-5 w-5 text-blue-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAddCompanyChoice("NO");
                    setSetupMode("ADMIN_ONLY");
                  }}
                  className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    addCompanyChoice === "NO"
                      ? "border-emerald-600 bg-emerald-50/60 text-slate-900 shadow-xs ring-1 ring-emerald-500/30"
                      : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <div>
                    <span className="block text-xs font-black text-slate-900">No, Assign to Existing Company</span>
                    <span className="text-[10px] text-slate-500 font-medium">Create Admin only (skip company setup)</span>
                  </div>
                  {addCompanyChoice === "NO" && <CheckCircleIcon className="h-5 w-5 text-emerald-600 shrink-0" />}
                </button>
              </div>
            </div>

            {/* Prompt Question 2: Multi-Company Management for Admin */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700">
                  2. Does this Administrator need to manage multiple companies?
                </label>
                <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  {multiCompanyChoice === "YES" ? "Multi-Company Group" : "Single Company"}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setMultiCompanyChoice("NO");
                    setSelectedAdditionalCompanies([]);
                    setTotalCompanies(1);
                  }}
                  className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    multiCompanyChoice === "NO"
                      ? "border-indigo-600 bg-indigo-50/60 text-slate-900 shadow-xs ring-1 ring-indigo-500/30"
                      : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <div>
                    <span className="block text-xs font-black text-slate-900">No, Dedicated Single Company</span>
                    <span className="text-[10px] text-slate-500 font-medium">Admin manages only this primary company</span>
                  </div>
                  {multiCompanyChoice === "NO" && <CheckCircleIcon className="h-5 w-5 text-indigo-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMultiCompanyChoice("YES");
                    if (totalCompanies < 2 && addCompanyChoice === "YES") setTotalCompanies(2);
                  }}
                  className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    multiCompanyChoice === "YES"
                      ? "border-violet-600 bg-violet-50/60 text-slate-900 shadow-xs ring-1 ring-violet-500/30"
                      : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <div>
                    <span className="block text-xs font-black text-slate-900">Yes, Multi-Company Group Admin</span>
                    <span className="text-[10px] text-slate-500 font-medium">Admin can oversee &amp; switch between multiple companies</span>
                  </div>
                  {multiCompanyChoice === "YES" && <CheckCircleIcon className="h-5 w-5 text-violet-600 shrink-0" />}
                </button>
              </div>

              {/* Sub-Panel when Multi-Company is selected */}
              {multiCompanyChoice === "YES" && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 mt-2 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <BuildingOffice2Icon className="h-4 w-4 text-indigo-600" />
                      <span>Assign Access to Existing Companies:</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {selectedAdditionalCompanies.length} selected
                    </span>
                  </div>

                  {tenants.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                      {tenants.map((t) => {
                        const compId = t.id || t.db || t.code;
                        const isChecked = selectedAdditionalCompanies.includes(compId);
                        return (
                          <label
                            key={compId}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                              isChecked
                                ? "bg-white border-indigo-600 text-indigo-950 font-bold shadow-xs"
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleAdditionalCompany(compId)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="truncate">{t.name}</span>
                            <span className="text-[9px] font-mono text-slate-400 ml-auto shrink-0">({t.db || t.id})</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">No other existing companies registered yet.</p>
                  )}

                  <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-[11px] text-indigo-900 flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>The Admin's dashboard header will include a <strong>Unified Company Switcher</strong> to jump between assigned companies seamlessly.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Prompt Question 3: Branch Network Setup */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700">
                3. Do you want to configure Branch Network?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setAddBranchesChoice("NO");
                    setBranchesPerCompany(0);
                    setInitialBranchesList([]);
                  }}
                  className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    addBranchesChoice === "NO"
                      ? "border-amber-600 bg-amber-50/60 text-slate-900 shadow-xs ring-1 ring-amber-500/30"
                      : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <div>
                    <span className="block text-xs font-black text-slate-900">No, Single Headquarters Only</span>
                    <span className="text-[10px] text-slate-500 font-medium">Head office only (0 extra branches)</span>
                  </div>
                  {addBranchesChoice === "NO" && <CheckCircleIcon className="h-5 w-5 text-amber-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAddBranchesChoice("YES");
                    if (!branchesPerCompany || branchesPerCompany === 0) {
                      handleBranchesCountChange(2);
                    }
                  }}
                  className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    addBranchesChoice === "YES"
                      ? "border-indigo-600 bg-indigo-50/60 text-slate-900 shadow-xs ring-1 ring-indigo-500/30"
                      : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <div>
                    <span className="block text-xs font-black text-slate-900">Yes, Add Multi-Branch Network</span>
                    <span className="text-[10px] text-slate-500 font-medium">Configure up to 50 branch facilities</span>
                  </div>
                  {addBranchesChoice === "YES" && <CheckCircleIcon className="h-5 w-5 text-indigo-600 shrink-0" />}
                </button>
              </div>

              {/* Informative Guidance: Branch Addition Anytime Later */}
              {addBranchesChoice === "NO" ? (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-center gap-2 mt-1">
                  <CheckCircleIcon className="h-4 w-4 text-amber-600 shrink-0" />
                  <span><strong>Headquarters Only mode:</strong> Only the primary Head Office will be provisioned. Additional branches can easily be added at any time later through <strong>Core Setup → Branches</strong> or the Branches tab.</span>
                </div>
              ) : (
                <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 flex items-center gap-2 mt-1">
                  <SparklesIcon className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>You can configure initial branch details below. More branches can also be created dynamically at any time in the future.</span>
                </div>
              )}
            </div>
          </div>

          {isCompanyLimitReached && addCompanyChoice === "YES" && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800">
              The maximum limit of {MAX_COMPANIES} companies has been reached. Choose "No, Assign to Existing Company" or delete an existing company.
            </div>
          )}

          {/* Form Level Error / Success Messages */}
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          {/* SECTION: Administrator Master Credentials */}
          <div className="space-y-3.5 p-4 bg-slate-50/70 border border-slate-200/90 rounded-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <ShieldCheckIcon className="h-4 w-4 text-indigo-600" />
                <span>Administrator Master Credentials</span>
              </h4>
              <div className="flex items-center gap-2">
                {multiCompanyChoice === "YES" && (
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
                    Multi-Company Access
                  </span>
                )}
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  Primary Root User
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Owner First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Rahul"
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Owner Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Sharma"
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Admin Login Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleInputChange}
                  required
                  autoComplete="off"
                  placeholder="e.g. admin@apexlogistics.com"
                  className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Mobile Phone / Contact
                </label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  autoComplete="tel"
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Designation / Role Title
                </label>
                <input
                  type="text"
                  name="adminDesignation"
                  value={formData.adminDesignation}
                  onChange={handleInputChange}
                  placeholder="e.g. Managing Director / Head of HR"
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Admin Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    autoComplete="new-password"
                    placeholder="Enter strong password..."
                    className="w-full px-3 py-2 pr-10 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    autoComplete="new-password"
                    placeholder="Re-type password..."
                    className="w-full px-3 py-2 pr-10 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
                {formData.confirmPassword && (
                  <p className={`text-[10px] font-bold mt-1 ${
                    formData.password === formData.confirmPassword ? "text-emerald-600" : "text-rose-600"
                  }`}>
                    {formData.password === formData.confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION: If No New Company, render Target Existing Company Picker */}
          {addCompanyChoice === "NO" ? (
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200/70">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-2">
                  <BuildingOffice2Icon className="h-4 w-4 text-emerald-600" />
                  <span>Primary Target Company Assignment</span>
                </h4>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  Target Company
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Select Primary Company <span className="text-rose-500">*</span>
                </label>
                <select
                  value={targetCompanyId}
                  onChange={(e) => setTargetCompanyId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs font-bold border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-800"
                >
                  {tenants.map(t => (
                    <option key={t.id || t.db} value={t.id || t.db}>
                      {t.name} ({t.db || t.id})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-emerald-700 font-medium mt-1">
                  The administrator will receive master access to this company and its existing branches.
                </p>
              </div>
            </div>
          ) : (
            /* SECTION: Enterprise Company Profile Information */
            <div className="space-y-3.5 p-4 bg-slate-50/70 border border-slate-200/90 rounded-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <BuildingOffice2Icon className="h-4 w-4 text-blue-600" />
                  <span>Enterprise Company Profile</span>
                </h4>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Corporate Identity</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Apex Global Logistics Pvt Ltd"
                    className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Company Code / Identifier
                  </label>
                  <input
                    type="text"
                    name="companyCode"
                    value={formData.companyCode}
                    onChange={handleInputChange}
                    placeholder="e.g. APEX-HQ"
                    className="w-full px-3 py-2 text-xs font-mono uppercase font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Company Official Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="companyEmail"
                    value={formData.companyEmail}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. contact@apexlogistics.com"
                    className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Company Phone / Helpline
                  </label>
                  <input
                    type="tel"
                    name="companyPhone"
                    value={formData.companyPhone}
                    onChange={handleInputChange}
                    placeholder="e.g. +91 11 4567 8900"
                    className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="e.g. https://apexlogistics.com"
                    className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Entity / Company Type
                  </label>
                  <select
                    name="companyType"
                    value={formData.companyType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Pvt Ltd">Private Limited (Pvt Ltd)</option>
                    <option value="Public Ltd">Public Limited (Public Ltd)</option>
                    <option value="LLP">Limited Liability Partnership (LLP)</option>
                    <option value="Proprietorship">Sole Proprietorship</option>
                    <option value="Partnership">Partnership Firm</option>
                    <option value="LLC">Limited Liability Company (LLC)</option>
                    <option value="One Person Company (OPC)">One Person Company (OPC)</option>
                    <option value="Non-Profit">Non-Profit / NGO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Industry / Domain
                  </label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Insurance & Financial Services">Insurance & Financial Services</option>
                    <option value="Information Technology & Software">Information Technology & Software</option>
                    <option value="Banking & Fintech">Banking & Fintech</option>
                    <option value="Healthcare & Pharmaceuticals">Healthcare & Pharmaceuticals</option>
                    <option value="Logistics & Supply Chain">Logistics & Supply Chain</option>
                    <option value="Manufacturing & Automobiles">Manufacturing & Automobiles</option>
                    <option value="Retail & E-commerce">Retail & E-commerce</option>
                    <option value="Education & EdTech">Education & EdTech</option>
                    <option value="Construction & Real Estate">Construction & Real Estate</option>
                    <option value="Hospitality & Tourism">Hospitality & Tourism</option>
                    <option value="Other">Other Enterprise Services</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    GSTIN / Tax ID
                  </label>
                  <input
                    type="text"
                    name="gst"
                    value={formData.gst}
                    onChange={handleInputChange}
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    className="w-full px-3 py-2 text-xs font-mono font-bold uppercase border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Corporate PAN / Tax Number
                  </label>
                  <input
                    type="text"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full px-3 py-2 text-xs font-mono font-bold uppercase border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    CIN / Registration Number
                  </label>
                  <input
                    type="text"
                    name="cinNumber"
                    value={formData.cinNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. U72200DL2021PTC384591"
                    className="w-full px-3 py-2 text-xs font-mono font-bold uppercase border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Registered Headquarters Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="e.g. Suite 400, Global Tech Tower, Outer Ring Road"
                    className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 md:col-span-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="e.g. Bengaluru"
                      className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="e.g. Karnataka"
                      className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="e.g. 560066"
                      className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      placeholder="e.g. India"
                      className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 md:col-span-2 pt-1 border-t border-slate-200/60">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Operating Currency</label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                      <option value="USD ($)">USD ($) - US Dollar</option>
                      <option value="ETB (Br)">ETB (Br) - Ethiopian Birr</option>
                      <option value="EUR (€)">EUR (€) - Euro</option>
                      <option value="GBP (£)">GBP (£) - British Pound</option>
                      <option value="AED (د.إ)">AED (د.إ) - UAE Dirham</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Timezone</label>
                    <select
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleInputChange}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="IST (GMT+5:30)">IST (GMT+5:30) - India</option>
                      <option value="EAT (GMT+3:00)">EAT (GMT+3:00) - East Africa</option>
                      <option value="UTC (GMT+0:00)">UTC (GMT+0:00) - Universal</option>
                      <option value="EST (GMT-5:00)">EST (GMT-5:00) - US Eastern</option>
                      <option value="PST (GMT-8:00)">PST (GMT-8:00) - US Pacific</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Initial Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="Active">Active (Production Ready)</option>
                      <option value="Maintenance">Maintenance Mode</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: Multi-Branch Network Configuration */}
          {addBranchesChoice === "YES" && (
            <div className="space-y-3.5 p-4 bg-slate-50/70 border border-slate-200/90 rounded-2xl animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <BuildingOfficeIcon className="h-4 w-4 text-indigo-600" />
                  <span>Branch Network Facilities Setup</span>
                </h4>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  {branchesPerCompany} Branches Configured (Max 50)
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Number of Branches to Provision
                  </label>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    Max: 50 Facilities
                  </span>
                </div>
                <div className="flex items-center gap-2 max-w-xs">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={branchesPerCompany}
                    onChange={(e) => handleBranchesCountChange(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                  <span className="text-xs font-bold text-slate-600 shrink-0 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                    Branches
                  </span>
                </div>
              </div>

              {/* Dynamic Branch Customization Cards (up to first 5) */}
              {initialBranchesList.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200/60">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    Branch Facility Details:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {initialBranchesList.map((branch, idx) => (
                      <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-indigo-900 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[9px] font-bold">
                              {idx + 1}
                            </span>
                            <span>{idx === 0 ? "Main Headquarters" : `Branch ${idx + 1}`}</span>
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">
                            {idx === 0 ? "HQ Facility" : "Sub-Branch"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={branch.branchName}
                            onChange={(e) => updateBranchField(idx, "branchName", e.target.value)}
                            placeholder="Branch Name"
                            className="px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          />
                          <input
                            type="text"
                            value={branch.branchCode}
                            onChange={(e) => updateBranchField(idx, "branchCode", e.target.value)}
                            placeholder="Branch Code"
                            className="px-2 py-1 text-xs font-mono uppercase font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          />
                          <input
                            type="text"
                            value={branch.city}
                            onChange={(e) => updateBranchField(idx, "city", e.target.value)}
                            placeholder="City"
                            className="px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          />
                          <input
                            type="text"
                            value={branch.state}
                            onChange={(e) => updateBranchField(idx, "state", e.target.value)}
                            placeholder="State"
                            className="px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Informative Guidance about adding branches anytime later */}
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800 flex items-center gap-2">
                <BuildingOfficeIcon className="h-4 w-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Need more branches later?</strong> You can add up to 50 branch facilities at any time after registration via <strong>Core Setup → Branches</strong> or the Branches management tab in this dashboard.
                </span>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="text-[11px] text-slate-500 font-medium">
              {addCompanyChoice === "YES" ? (
                <span>Provisioning: <strong>{formData.companyName || "New Company"}</strong> {multiCompanyChoice === "YES" && selectedAdditionalCompanies.length > 0 ? `+ ${selectedAdditionalCompanies.length} existing companies` : ""}</span>
              ) : (
                <span>Assigning Admin to: <strong>{targetCompanyId || "Selected Company"}</strong> {multiCompanyChoice === "YES" && selectedAdditionalCompanies.length > 0 ? `+ ${selectedAdditionalCompanies.length} other companies` : ""}</span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading || (isCompanyLimitReached && addCompanyChoice === "YES")}
                className={`inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition cursor-pointer ${
                  formLoading || (isCompanyLimitReached && addCompanyChoice === "YES")
                    ? "bg-slate-400 cursor-not-allowed"
                    : addCompanyChoice === "YES"
                      ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/25 active:scale-98"
                      : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25 active:scale-98"
                }`}
              >
                {formLoading && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                <span>
                  {formLoading
                    ? "Provisioning Account..."
                    : addCompanyChoice === "YES"
                      ? "Register Company & Provision Admin"
                      : "Create & Assign Admin Account"}
                </span>
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL: ADD TENANT BRANCH FOR SUPERADMIN (MAX 50 ENFORCED)
          ========================================================================= */}
      <Modal
        isOpen={isAddBranchModalOpen}
        onClose={() => setIsAddBranchModalOpen(false)}
        title={`ADD BRANCH FACILITY TO ${selectedCompanyForData?.name || "TENANT"} (MAX 50)`}
        size="lg"
      >
        <form onSubmit={handleCreateTenantBranch} className="space-y-4">
          <div className="bg-blue-50/80 p-3.5 rounded-xl border border-blue-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-blue-800 font-bold">
              <BuildingOffice2Icon className="w-5 h-5 text-blue-600 shrink-0" />
              <span>Current Registered Branches: <strong>{companyLiveData?.branches?.length || 0} / 50 Max</strong></span>
            </div>
            <span className="text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
              Quota: {50 - (companyLiveData?.branches?.length || 0)} Remaining
            </span>
          </div>

          {branchError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{branchError}</span>
            </div>
          )}

          {branchSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-bold flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{branchSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                Branch Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newBranchData.branchName}
                onChange={(e) => setNewBranchData({ ...newBranchData, branchName: e.target.value })}
                placeholder="e.g. Bhopal Central Hub"
                className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                Branch Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newBranchData.branchCode}
                onChange={(e) => setNewBranchData({ ...newBranchData, branchCode: e.target.value.toUpperCase() })}
                placeholder="e.g. BR-BHO-01"
                className="w-full px-3 py-2 text-xs font-bold font-mono text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                Branch Type
              </label>
              <select
                value={newBranchData.branchType}
                onChange={(e) => setNewBranchData({ ...newBranchData, branchType: e.target.value })}
                className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Branch">Branch</option>
                <option value="Regional Office">Regional Office</option>
                <option value="Headquarters">Headquarters</option>
                <option value="Warehouse / Hub">Warehouse / Hub</option>
                <option value="Sales Outlet">Sales Outlet</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                Initial Status
              </label>
              <select
                value={newBranchData.status}
                onChange={(e) => setNewBranchData({ ...newBranchData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                Branch Manager Name
              </label>
              <input
                type="text"
                value={newBranchData.manager}
                onChange={(e) => setNewBranchData({ ...newBranchData, manager: e.target.value })}
                placeholder="e.g. Rajesh Kumar"
                className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                Manager Email
              </label>
              <input
                type="email"
                value={newBranchData.email}
                onChange={(e) => setNewBranchData({ ...newBranchData, email: e.target.value })}
                placeholder="manager@company.com"
                className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                Manager Phone
              </label>
              <input
                type="text"
                value={newBranchData.phone}
                onChange={(e) => setNewBranchData({ ...newBranchData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                City & State
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newBranchData.city}
                  onChange={(e) => setNewBranchData({ ...newBranchData, city: e.target.value })}
                  placeholder="City"
                  className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={newBranchData.state}
                  onChange={(e) => setNewBranchData({ ...newBranchData, state: e.target.value })}
                  placeholder="State"
                  className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
              Physical Address
            </label>
            <input
              type="text"
              value={newBranchData.address}
              onChange={(e) => setNewBranchData({ ...newBranchData, address: e.target.value })}
              placeholder="Full street address and building number"
              className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddBranchModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={branchSubmitting}
              className="px-5 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {branchSubmitting && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
              <span>{branchSubmitting ? "Provisioning..." : "Provision Branch Facility"}</span>
            </button>
          </div>
        </form>
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
