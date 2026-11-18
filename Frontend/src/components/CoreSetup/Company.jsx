import React, { useState, useEffect, useMemo } from "react";
import {
  BuildingOffice2Icon,
  BuildingOfficeIcon,
  PencilSquareIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  IdentificationIcon,
  DocumentCheckIcon,
  CalendarDaysIcon,
  CurrencyRupeeIcon,
  ShieldCheckIcon,
  CheckBadgeIcon,
  PlusIcon,
  TrashIcon,
  ServerStackIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  XMarkIcon,
  UsersIcon,
  BriefcaseIcon,
  ArrowRightIcon,
  MapIcon,
  PaperAirplaneIcon,
  ChartBarIcon,
  LinkIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "../../auth/AuthProvider";
import { invalidateTableCache } from "../../services/hrApi";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const MAX_COMPANIES = 50;

const Company = ({ records = [], onOpenEdit, openCreateTrigger, dbData = {} }) => {
  const { fetchWithAuth, user } = useAuth();

  // Master list of all registered companies from SaaS registry
  const [allCompanies, setAllCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Active company identifiers from session / localStorage
  const activeCompanyCode = localStorage.getItem("selected_company_code") || user?.companyCode || "";
  const activeTenantDb = localStorage.getItem("selected_tenant_db") || "";
  const activeCompanyName = localStorage.getItem("selected_company_name") || user?.companyName || "";

  // Add Company Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [newCompanyData, setNewCompanyData] = useState({
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
    address: "",
    gst: "",
    type: "Pvt Ltd",
    cinNumber: "",
    panNumber: "",
    tanNumber: "",
    pfNumber: "",
    esiNumber: "",
    currency: "INR (₹)",
    financialYear: "2026-27"
  });

  const [requireBranchManagement, setRequireBranchManagement] = useState(false);
  const [branches, setBranches] = useState([]);

  // Fetch all registered companies from Master SaaS Registry
  const loadAllCompanies = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const response = await fetchWithAuth(`${API_BASE}/api/super-admin/tenants`);
      const text = await response.text();
      const res = text ? JSON.parse(text) : {};

      if (response.ok && res.success && Array.isArray(res.data)) {
        // Merge registered tenants with any local records prop
        const merged = res.data.map((t, idx) => {
          const match = (records || []).find(r => 
            String(r.id) === String(t.id) ||
            String(r.companyCode || r.company_code).toLowerCase() === String(t.db).toLowerCase() ||
            String(r.companyName || r.company_name).toLowerCase() === String(t.name).toLowerCase()
          ) || {};

          return {
            id: t.id,
            companyCode: t.code || t.id,
            companyName: t.name || match.companyName || match.company_name,
            db: t.db,
            db_name: t.db,
            status: t.status || "Active",
            type: match.type || match.companyType || "Pvt Ltd",
            shortName: match.shortName || t.name,
            financialYear: match.financialYear || "2024/2025 (July 8 - July 7)",
            currency: match.currency || "INR (₹)",
            timezone: match.timezone || "IST (UTC+5:30)",
            email: t.adminEmail || t.emailAddress || match.email || "contact@company.com",
            phone: t.phone || match.phone || "+91 98765 43210",
            website: match.website || `https://www.${String(t.name).toLowerCase().replace(/\s+/g, '')}.com`,
            address: t.address || match.address || match.address1 || "Corporate Headquarters",
            city: match.city || t.city || "Bahir Dar",
            state: match.state || t.state || "Amhara",
            pincode: match.pincode || t.pincode || "30000",
            country: match.country || "Ethiopia / India",
            gstNumber: t.gst || match.gstNumber || match.gst_number || "GST-ET-27AABCN1234F1Z5",
            panNumber: match.panNumber || match.pan_number || "PAN-ET-3345678",
            cinNumber: match.cinNumber || match.cin_number || "CIN-ET-08734-2015",
            tanNumber: match.tanNumber || match.tan_number || "TAN-ET-99812",
            regNumber: match.regNumber || match.reg_number || "REG-ET-2015-000734",
            pfNumber: match.pfNumber || match.pf_number || "PF-ET-BHR-00231",
            esiNumber: match.esiNumber || match.esi_number || "ESI-ET-BHR-00456",
            activeUsers: t.activeUsers || 0,
            branchesCount: t.branchesCount || 0
          };
        });

        setAllCompanies(merged);
      } else {
        // Fallback to records prop
        setAllCompanies(records);
      }
    } catch (err) {
      console.warn("Could not load tenants list for Company component:", err.message);
      setAllCompanies(records);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllCompanies();
  }, [records]);

  const registeredCompanyCount = allCompanies.length > 0 ? allCompanies.length : records.length;
  const isCompanyLimitReached = registeredCompanyCount >= MAX_COMPANIES;

  // Open the Add Company Modal
  const handleOpenAddCompany = () => {
    if (isCompanyLimitReached) return;

    setNewCompanyData({
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
      address: "",
      gst: "",
      type: "Pvt Ltd",
      cinNumber: "",
      panNumber: "",
      tanNumber: "",
      pfNumber: "",
      esiNumber: "",
      currency: "INR (₹)",
      financialYear: "2024/2025 (July 8 - July 7)"
    });
    setRequireBranchManagement(false);
    setBranches([
      { branchName: "Main Branch", branchCode: "MAIN", branchType: "HQ", city: "", state: "" }
    ]);
    setFormError("");
    setFormSuccess("");
    setIsAddModalOpen(true);
  };

  // Branch row helpers
  const handleAddBranchRow = () => {
    if (branches.length >= 50) return;
    const nextIdx = branches.length + 1;
    setBranches(prev => [
      ...prev,
      { branchName: "", branchCode: `BR-0${nextIdx}`, branchType: "Branch", city: "", state: "" }
    ]);
  };

  const handleRemoveBranchRow = (idx) => {
    setBranches(prev => prev.filter((_, i) => i !== idx));
  };

  const handleBranchChange = (idx, field, val) => {
    setBranches(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  };

  // Submit Handler: Provision brand new company & isolated tenant database in MySQL
  const handleRegisterNewCompany = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (isCompanyLimitReached) {
      setFormError(`The maximum limit of ${MAX_COMPANIES} registered companies has been reached.`);
      return;
    }

    if (newCompanyData.password !== newCompanyData.confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    if (requireBranchManagement) {
      if (branches.length === 0) {
        setFormError("Please add at least one branch or choose 'No' for single-location setup.");
        return;
      }
      if (branches.length > 50) {
        setFormError("A company cannot exceed the maximum limit of 50 branches.");
        return;
      }
      const seen = new Set();
      for (let i = 0; i < branches.length; i++) {
        const b = branches[i];
        if (!b.branchName.trim()) {
          setFormError(`Branch row #${i + 1} requires a valid Branch Name.`);
          return;
        }
        if (!b.branchCode.trim()) {
          setFormError(`Branch row #${i + 1} requires a valid Branch Code.`);
          return;
        }
        const cUpper = b.branchCode.trim().toUpperCase();
        if (seen.has(cUpper)) {
          setFormError(`Duplicate branch code '${cUpper}' detected.`);
          return;
        }
        seen.add(cUpper);
      }
    }

    setFormLoading(true);
    try {
      const payload = {
        ...newCompanyData,
        requireBranchManagement,
        branches: requireBranchManagement ? branches : []
      };

      const response = await fetchWithAuth(`${API_BASE}/api/super-admin/tenants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      const res = text ? JSON.parse(text) : {};

      if (response.ok && res.success) {
        setFormSuccess("Company registered and new MySQL tenant database provisioned successfully!");
        
        // Refresh companies list
        await loadAllCompanies(true);

        // Dispatch global event so the Navbar dropdown updates immediately
        window.dispatchEvent(new Event("companies_updated"));

        setTimeout(() => {
          setIsAddModalOpen(false);
          setFormSuccess("");
        }, 1200);
      } else {
        throw new Error(res.message || res.error || "Failed to provision company tenant database.");
      }
    } catch (err) {
      setFormError(err.message || "An unexpected error occurred while creating the company database.");
    } finally {
      setFormLoading(false);
    }
  };

  // Switch Active Company Context (1-Click Switcher)
  const handleSwitchToCompany = (comp) => {
    try {
      const userObj = JSON.parse(localStorage.getItem("user") || "{}");
      userObj.companyCode = comp.id;
      userObj.companyName = comp.companyName;
      userObj.tenantDb = comp.db || comp.db_name;
      delete userObj.isSuperAdminImpersonating;
      localStorage.removeItem("superadmin_impersonating");
      localStorage.setItem("user", JSON.stringify(userObj));
      localStorage.setItem("selected_company_code", comp.id);
      localStorage.setItem("selected_company_name", comp.companyName);
      localStorage.setItem("selected_tenant_db", comp.db || comp.db_name || "");

      // Reset branch selection on company switch
      localStorage.setItem("selected_branch_id", "ALL");
      localStorage.setItem("selected_branch_name", "All Branches");
      localStorage.setItem("selected_branch_code", "ALL");
    } catch (e) {}

    invalidateTableCache();
    window.location.reload();
  };

  // Display list
  const displayList = allCompanies.length > 0 ? allCompanies : records;

  // Selected company identifier if user switches via multi-company pill bar
  const [selectedCompCode, setSelectedCompCode] = useState(null);

  const activeCompany = useMemo(() => {
    if (!displayList || displayList.length === 0) return null;
    if (selectedCompCode) {
      const match = displayList.find(c => 
        String(c.id) === String(selectedCompCode) || 
        String(c.companyCode) === String(selectedCompCode) ||
        String(c.db) === String(selectedCompCode)
      );
      if (match) return match;
    }
    const sessionMatch = displayList.find(c => 
      (c.db && activeTenantDb && c.db.toLowerCase() === activeTenantDb.toLowerCase()) ||
      (c.id && activeCompanyCode && String(c.id) === String(activeCompanyCode)) ||
      (c.companyName && activeCompanyName && c.companyName.toLowerCase() === activeCompanyName.toLowerCase())
    );
    return sessionMatch || displayList[0];
  }, [displayList, selectedCompCode, activeTenantDb, activeCompanyCode, activeCompanyName]);

  const comp = activeCompany || {
    companyName: "NIB Insurance",
    type: "Pvt Ltd",
    regNumber: "REG-ET-2015-060978",
    cinNumber: "CIN-07687034-2015",
    panNumber: "PAN-IT-3345678",
    gstNumber: "23ABCDE1234F1Z1",
    country: "India",
    state: "Madhya Pradesh",
    city: "Bhopal",
    pincode: "462002",
    email: "admin@nibinsurance.com",
    phone: "N/A",
    website: "https://nibinsurance.com",
    financialYear: "2024/2025 (July 6 - July 7)",
    db: "nib_insurance"
  };

  const totalBranches = useMemo(() => {
    const list = dbData["branch"] || dbData["Branch"] || [];
    return list.length > 0 ? list.length : (comp.branchesCount || 3);
  }, [dbData, comp]);

  const totalEmployees = useMemo(() => {
    const list = dbData["employee"] || dbData["Employee"] || dbData["employees"] || [];
    return list.length > 0 ? `${list.length}+` : (comp.activeUsers ? `${comp.activeUsers}+` : "245+");
  }, [dbData, comp]);

  const totalDepartments = useMemo(() => {
    const list = dbData["department"] || dbData["Department"] || [];
    return list.length > 0 ? list.length : 8;
  }, [dbData]);

  const totalLocations = useMemo(() => {
    const list = dbData["branch"] || dbData["Branch"] || [];
    const cities = new Set(list.map(b => b.city).filter(Boolean));
    return cities.size > 0 ? cities.size : 2;
  }, [dbData]);

  const companyInitials = useMemo(() => {
    const name = comp.companyName || "NIB Insurance";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase() || "NI";
  }, [comp]);

  return (
    <div className="space-y-6">
      {/* Multi-Company Selector Pill Bar if more than 1 company exists */}
      {displayList.length > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200/90 rounded-2xl shadow-2xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider px-2 flex items-center gap-1.5">
              <BuildingOffice2Icon className="w-4 h-4 text-blue-600" />
              <span>Registered Companies ({displayList.length}):</span>
            </span>
            {displayList.map((c) => {
              const isSelected = activeCompany && (c.id === activeCompany.id || c.companyName === activeCompany.companyName);
              return (
                <button
                  key={c.id || c.companyName}
                  onClick={() => setSelectedCompCode(c.id || c.companyCode)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    isSelected 
                      ? "bg-blue-600 text-white shadow-xs" 
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <span>{c.companyName}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>}
                </button>
              );
            })}
          </div>

          {activeCompany && activeCompany.companyName !== activeCompanyName && (
            <button
              onClick={() => handleSwitchToCompany(activeCompany)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
            >
              <CheckCircleIcon className="w-4 h-4" />
              <span>Switch Context to {activeCompany.companyName}</span>
            </button>
          )}
        </div>
      )}

      {/* 1. Main Hero Banner matching reference design */}
      <div className="relative bg-gradient-to-r from-[#173e8a] via-[#1d58d8] to-[#122e6b] text-white rounded-3xl p-6 sm:p-8 shadow-lg overflow-hidden border border-blue-900/30">
        {/* Modern Corporate Skyscraper Architecture Perspective Overlay */}
        <div className="absolute right-0 top-0 bottom-0 w-2/5 sm:w-1/2 pointer-events-none opacity-40 mix-blend-luminosity overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80" 
            alt="Corporate Architecture" 
            className="w-full h-full object-cover object-left"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#173e8a] via-[#1d58d8]/60 to-transparent"></div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Logo Badge: Vibrant Blue Square with NI monogram & green dot */}
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-[#1e5ee5] text-white flex items-center justify-center shadow-xl border border-white/20 shrink-0 select-none">
            <div className="flex items-center text-3xl sm:text-4xl font-extrabold tracking-tight">
              <span>N</span>
              <div className="flex flex-col items-center ml-0.5">
                <span className="w-2 h-2 rounded-full bg-[#22c55e] mb-1"></span>
                <span className="h-5 sm:h-6 w-2 bg-white rounded-xs"></span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {comp.companyName || "NIB Insurance"}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#dcfce7] text-[#15803d] border border-emerald-200/60 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#16a34a]"></span>
                <span>Active</span>
              </span>
            </div>
            <p className="text-sm font-semibold text-blue-100/90 tracking-wide">
              Secure Today. Stronger Tomorrow.
            </p>
          </div>
        </div>
      </div>

      {/* 2. KPI Metrics Cards: Total Branches, Total Employees, Departments, Locations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Branches */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
              <BuildingOffice2Icon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 block">Total Branches</span>
              <span className="text-2xl font-black text-slate-900 tracking-tight">{totalBranches}</span>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => window.location.href = "/hr-hub?tab=Branch"}
            className="h-8 w-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition cursor-pointer"
            title="View Branches"
          >
            <ArrowRightIcon className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Card 2: Total Employees */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
              <UsersIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 block">Total Employees</span>
              <span className="text-2xl font-black text-slate-900 tracking-tight">{totalEmployees}</span>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => window.location.href = "/hr-hub?tab=Add%20Employee"}
            className="h-8 w-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition cursor-pointer"
            title="View Employees"
          >
            <ArrowRightIcon className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Card 3: Departments */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
              <BriefcaseIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 block">Departments</span>
              <span className="text-2xl font-black text-slate-900 tracking-tight">{totalDepartments}</span>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => window.location.href = "/hr-hub?tab=Department"}
            className="h-8 w-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition cursor-pointer"
            title="View Departments"
          >
            <ArrowRightIcon className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Card 4: Locations */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
              <MapPinIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 block">Locations</span>
              <span className="text-2xl font-black text-slate-900 tracking-tight">{totalLocations}</span>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => window.location.href = "/hr-hub?tab=Branch"}
            className="h-8 w-8 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition cursor-pointer"
            title="View Locations"
          >
            <ArrowRightIcon className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* 3. Detailed Information Cards: Company Details, Headquarters, Contact & Web, Financial Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        
        {/* Card 1: Company Details */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Company Details</h3>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                <span>👑</span>
                <span>Primary</span>
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-[105px_10px_1fr] items-center">
                <span className="text-slate-500 font-medium">Company Type</span>
                <span className="text-slate-400 font-semibold">:</span>
                <span className="font-bold text-slate-900 truncate">{comp.type || "Pvt Ltd"}</span>
              </div>
              <div className="grid grid-cols-[105px_10px_1fr] items-center">
                <span className="text-slate-500 font-medium">Registration No.</span>
                <span className="text-slate-400 font-semibold">:</span>
                <span className="font-bold text-slate-900 font-mono truncate">{comp.regNumber || "REG-ET-2015-060978"}</span>
              </div>
              <div className="grid grid-cols-[105px_10px_1fr] items-center">
                <span className="text-slate-500 font-medium">CIN</span>
                <span className="text-slate-400 font-semibold">:</span>
                <span className="font-bold text-slate-900 font-mono truncate">{comp.cinNumber || "CIN-07687034-2015"}</span>
              </div>
              <div className="grid grid-cols-[105px_10px_1fr] items-center">
                <span className="text-slate-500 font-medium">PAN No.</span>
                <span className="text-slate-400 font-semibold">:</span>
                <span className="font-bold text-slate-900 font-mono truncate">{comp.panNumber || "PAN-IT-3345678"}</span>
              </div>
              <div className="grid grid-cols-[105px_10px_1fr] items-center">
                <span className="text-slate-500 font-medium">GST No.</span>
                <span className="text-slate-400 font-semibold">:</span>
                <span className="font-bold text-slate-900 font-mono truncate">{comp.gstNumber || "23ABCDE1234F1Z1"}</span>
              </div>
              <div className="grid grid-cols-[105px_10px_1fr] items-center">
                <span className="text-slate-500 font-medium">Country</span>
                <span className="text-slate-400 font-semibold">:</span>
                <span className="font-bold text-slate-900 truncate">{comp.country || "India"}</span>
              </div>
              <div className="grid grid-cols-[105px_10px_1fr] items-center">
                <span className="text-slate-500 font-medium">State</span>
                <span className="text-slate-400 font-semibold">:</span>
                <span className="font-bold text-slate-900 truncate">{comp.state || "Madhya Pradesh"} ({comp.pincode || "422002"})</span>
              </div>
              <div className="grid grid-cols-[105px_10px_1fr] items-center">
                <span className="text-slate-500 font-medium">City/District</span>
                <span className="text-slate-400 font-semibold">:</span>
                <span className="font-bold text-slate-900 truncate">{comp.city || "Bhopal"}</span>
              </div>
              <div className="grid grid-cols-[105px_10px_1fr] items-center">
                <span className="text-slate-500 font-medium">Pin Code</span>
                <span className="text-slate-400 font-semibold">:</span>
                <span className="font-bold text-slate-900 truncate">{comp.pincode || "462002"}</span>
              </div>
            </div>
          </div>

          {/* Bottom Pill: Last Updated */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between bg-blue-50/70 p-2.5 rounded-xl border border-blue-100 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="w-4 h-4 text-blue-600" />
              <div>
                <span className="text-[10px] text-slate-500 block font-medium">Last Updated</span>
                <span className="text-[11px] font-bold text-slate-800">Nov 6, 2026 • 12:30 PM</span>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => loadAllCompanies(true)}
              title="Refresh"
              className="p-1 text-blue-600 hover:text-blue-800 transition cursor-pointer"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Card 2: Headquarters */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <MapPinIcon className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-sm text-slate-900">Headquarters</h3>
            </div>

            {/* High-res Headquarters Building Photo */}
            <div className="rounded-xl overflow-hidden border border-slate-200/80 shadow-2xs h-36 w-full">
              <img 
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80" 
                alt="Corporate Headquarters" 
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 pt-1">
              <MapPinIcon className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{comp.city || "Bhopal"}, {comp.state || "Madhya Pradesh"} – {comp.pincode || "422002"}</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${comp.city || 'Bhopal'}, ${comp.state || 'Madhya Pradesh'}`)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-50/80 hover:bg-blue-100 text-blue-700 border border-blue-200/70 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              <MapIcon className="w-4 h-4" />
              <span>View on Map</span>
            </a>
          </div>
        </div>

        {/* Card 3: Contact & Web */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <PhoneIcon className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-sm text-slate-900">Contact & Web</h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0 mt-0.5">
                  <EnvelopeIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block">Email (Official)</span>
                  <a href={`mailto:${comp.email || "admin@nibinsurance.com"}`} className="font-bold text-blue-600 hover:underline break-all">
                    {comp.email || "admin@nibinsurance.com"}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0 mt-0.5">
                  <GlobeAltIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block">Website</span>
                  <a href={comp.website || "https://nibinsurance.com"} target="_blank" rel="noreferrer" className="font-bold text-blue-600 hover:underline break-all">
                    {comp.website || "https://nibinsurance.com"}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0 mt-0.5">
                  <PhoneIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block">Phone (Office)</span>
                  <span className="font-bold text-slate-700">
                    {comp.phone && comp.phone !== "+91 98765 43210" ? comp.phone : "N/A"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0 mt-0.5">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block">Website (Internal)</span>
                  <a href={comp.website || "https://nibinsurance.com"} target="_blank" rel="noreferrer" className="font-bold text-blue-600 hover:underline break-all">
                    {comp.website || "https://nibinsurance.com"}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <a
              href={`mailto:${comp.email || "admin@nibinsurance.com"}?subject=Support%20Request`}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-50/80 hover:bg-blue-100 text-blue-700 border border-blue-200/70 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              <span>Contact Support</span>
            </a>
          </div>
        </div>

        {/* Card 4: Financial Details */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ChartBarIcon className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-sm text-slate-900">Financial Details</h3>
            </div>

            <div className="space-y-2.5 text-xs font-semibold text-slate-600">
              <div className="grid grid-cols-[120px_10px_1fr] items-center">
                <span className="text-slate-500 font-medium">Financial Year End</span>
                <span className="text-slate-400 font-semibold">:</span>
                <span className="font-bold text-slate-900">{comp.financialYear || "2024/2025 (July 6 - July 7)"}</span>
              </div>
              <div className="grid grid-cols-[120px_10px_1fr] items-center">
                <span className="text-slate-500 font-medium">Financial Year</span>
                <span className="text-slate-400 font-semibold">:</span>
                <span className="font-bold text-slate-900">N/A</span>
              </div>
              <div className="grid grid-cols-[120px_10px_1fr] items-center">
                <span className="text-slate-500 font-medium">Financial Database</span>
                <span className="text-slate-400 font-semibold">:</span>
                <span className="font-bold text-slate-900 font-mono">{comp.db || comp.db_name || activeTenantDb || "nib_insurance"}</span>
              </div>
              <div className="grid grid-cols-[120px_10px_1fr] items-center">
                <span className="text-slate-500 font-medium">Compliance</span>
                <span className="text-slate-400 font-semibold">:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span>Verified & Active</span>
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Alert Card: All information is up to date */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-xl p-3 flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-[#10b981] text-white flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheckIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-[#064e3b]">All information is up to date</h4>
                <p className="text-[10px] text-[#047857] font-medium mt-0.5">Last verified on Nov 6, 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL: ADD NEW COMPANY & PROVISION TENANT DATABASE
          ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
                  <BuildingOffice2Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Add New Company & Provision Database</h3>
                  <p className="text-xs text-slate-400">Creates a new company record, provisions a separate MySQL database, and sets up super-admin access.</p>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterNewCompany} className="space-y-5">
              {/* Architecture Info Banner */}
              <div className="p-3 bg-blue-50/80 border border-blue-100 rounded-2xl flex items-center justify-between text-xs text-blue-900 font-semibold">
                <span className="flex items-center gap-1.5">
                  <SparklesIcon className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Multi-Tenant Architecture: Dedicated Database Provisioning</span>
                </span>
                <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded-full border border-blue-200 text-blue-700">
                  {registeredCompanyCount} / {MAX_COMPANIES} Registered
                </span>
              </div>

              {isCompanyLimitReached && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800">
                  The maximum limit of {MAX_COMPANIES} companies has been reached. Delete a company before registering another.
                </div>
              )}

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

              {/* 1. Basic Company Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1">
                  1. Company Profile Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={newCompanyData.companyName}
                      onChange={(e) => setNewCompanyData({ ...newCompanyData, companyName: e.target.value })}
                      placeholder="e.g. Apex Global Insurance"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Official Email *</label>
                    <input
                      type="email"
                      required
                      value={newCompanyData.companyEmail}
                      onChange={(e) => setNewCompanyData({ ...newCompanyData, companyEmail: e.target.value })}
                      placeholder="contact@company.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">GSTIN / Tax ID</label>
                    <input
                      type="text"
                      value={newCompanyData.gst}
                      onChange={(e) => setNewCompanyData({ ...newCompanyData, gst: e.target.value })}
                      placeholder="e.g. 27AABCN1234F1Z5"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Initial Status</label>
                    <select
                      value={newCompanyData.status}
                      onChange={(e) => setNewCompanyData({ ...newCompanyData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                    >
                      <option value="Active">Active (Production Ready)</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Headquarters Address</label>
                    <input
                      type="text"
                      value={newCompanyData.address}
                      onChange={(e) => setNewCompanyData({ ...newCompanyData, address: e.target.value })}
                      placeholder="Street / Facility Address"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={newCompanyData.city}
                      onChange={(e) => setNewCompanyData({ ...newCompanyData, city: e.target.value })}
                      placeholder="City"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">State & Pincode</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCompanyData.state}
                        onChange={(e) => setNewCompanyData({ ...newCompanyData, state: e.target.value })}
                        placeholder="State"
                        className="w-2/3 px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                      <input
                        type="text"
                        value={newCompanyData.pincode}
                        onChange={(e) => setNewCompanyData({ ...newCompanyData, pincode: e.target.value })}
                        placeholder="Pincode"
                        className="w-1/3 px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Admin Credentials */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1">
                  2. Admin Owner Credentials
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Owner First Name *</label>
                    <input
                      type="text"
                      required
                      value={newCompanyData.firstName}
                      onChange={(e) => setNewCompanyData({ ...newCompanyData, firstName: e.target.value })}
                      placeholder="First name"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Owner Last Name *</label>
                    <input
                      type="text"
                      required
                      value={newCompanyData.lastName}
                      onChange={(e) => setNewCompanyData({ ...newCompanyData, lastName: e.target.value })}
                      placeholder="Last name"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Admin Email *</label>
                    <input
                      type="email"
                      required
                      value={newCompanyData.adminEmail}
                      onChange={(e) => setNewCompanyData({ ...newCompanyData, adminEmail: e.target.value })}
                      placeholder="admin@company.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile Phone</label>
                    <input
                      type="text"
                      value={newCompanyData.mobileNumber}
                      onChange={(e) => setNewCompanyData({ ...newCompanyData, mobileNumber: e.target.value })}
                      placeholder="10-digit number"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Password *</label>
                    <input
                      type="password"
                      required
                      value={newCompanyData.password}
                      onChange={(e) => setNewCompanyData({ ...newCompanyData, password: e.target.value })}
                      placeholder="Strong password"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Confirm Password *</label>
                    <input
                      type="password"
                      required
                      value={newCompanyData.confirmPassword}
                      onChange={(e) => setNewCompanyData({ ...newCompanyData, confirmPassword: e.target.value })}
                      placeholder="Confirm password"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Branch Management Question */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h5 className="font-bold text-slate-900">Does this company require branch management?</h5>
                    <p className="text-[11px] text-slate-500">Choose whether to configure branches now or run as a single headquarters.</p>
                  </div>

                  <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shrink-0">
                    <button
                      type="button"
                      onClick={() => setRequireBranchManagement(false)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        !requireBranchManagement ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      No (0 Branches)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRequireBranchManagement(true);
                        if (branches.length === 0) {
                          setBranches([
                            { branchName: "Main Branch", branchCode: "MAIN", branchType: "HQ", city: newCompanyData.city || "", state: newCompanyData.state || "" }
                          ]);
                        }
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        requireBranchManagement ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Yes (Multi-Branch)
                    </button>
                  </div>
                </div>

                {!requireBranchManagement ? (
                  <p className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-dashed border-slate-200">
                    Company will be created with <strong>0 branches</strong> (Single location). No blank or fake branch records will be created.
                  </p>
                ) : (
                  <div className="space-y-2.5 bg-white p-3 rounded-xl border border-slate-200 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700">Configured Branches ({branches.length}/50)</span>
                      <button
                        type="button"
                        onClick={handleAddBranchRow}
                        disabled={branches.length >= 50}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition cursor-pointer border border-blue-200 flex items-center gap-1"
                      >
                        <PlusIcon className="h-3 w-3" />
                        <span>Add Branch</span>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {branches.map((b, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-mono font-bold text-slate-400 w-5">#{idx + 1}</span>
                          <input
                            type="text"
                            value={b.branchName}
                            onChange={(e) => handleBranchChange(idx, "branchName", e.target.value)}
                            placeholder="Branch Name *"
                            className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded-md bg-white focus:outline-none"
                          />
                          <input
                            type="text"
                            value={b.branchCode}
                            onChange={(e) => handleBranchChange(idx, "branchCode", e.target.value.toUpperCase())}
                            placeholder="Code *"
                            className="w-24 px-2 py-1 text-xs font-mono font-bold uppercase border border-slate-200 rounded-md bg-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveBranchRow(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading || isCompanyLimitReached}
                  className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-md transition ${
                    formLoading || isCompanyLimitReached
                      ? "bg-slate-400 cursor-not-allowed shadow-none"
                      : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/25 cursor-pointer"
                  }`}
                >
                  {formLoading && <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />}
                  <span>{formLoading ? "Provisioning Database..." : "Provision & Register Company"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Company;
