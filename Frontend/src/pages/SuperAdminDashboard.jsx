import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Badge, Card, Modal, DynamicForm } from "../components/ui";
import technoLogo from "../assets/shortlogo1.png";
import { 
  BuildingOfficeIcon, 
  CircleStackIcon, 
  CpuChipIcon, 
  KeyIcon,
  PlusIcon,
  ArrowRightOnRectangleIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowLeftIcon,
  CreditCardIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  ArrowTopRightOnSquareIcon
} from "@heroicons/react/24/outline";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";



const companyRegistrationFields = [
  { name: "companyName", label: "Company Name", type: "text", required: true, placeholder: "e.g. NIB Technologies Pvt. Ltd.", halfWidth: true },
  { name: "companyEmail", label: "Company Email", type: "email", required: true, placeholder: "info@nibtechnologies.com", halfWidth: true },
  { name: "gst", label: "GSTIN / GST Number", type: "text", required: false, placeholder: "e.g. 23ABCDE1234F1Z5", halfWidth: true },
  { name: "state", label: "State", type: "text", required: false, placeholder: "e.g. Madhya Pradesh", halfWidth: true },
  { name: "city", label: "City", type: "text", required: false, placeholder: "e.g. Bhopal", halfWidth: true },
  { name: "pincode", label: "Pincode", type: "text", required: false, placeholder: "e.g. 422001", halfWidth: true },
  { name: "status", label: "Status", type: "select", required: false, options: [
      { label: "Active", value: "Active" },
      { label: "Suspended", value: "Suspended" },
      { label: "Maintenance", value: "Maintenance" }




      
    ], halfWidth: true },
  { name: "firstName", label: "Owner First Name", type: "text", required: true, placeholder: "e.g. Ayaan", halfWidth: true },
  { name: "lastName", label: "Owner Last Name", type: "text", required: true, placeholder: "e.g. Shaikh", halfWidth: true },
  { name: "adminEmail", label: "Admin Email", type: "email", required: true, placeholder: "ayyan23062005@gmail.com", halfWidth: true },
  { name: "mobileNumber", label: "Mobile / Phone", type: "text", required: false, placeholder: "admin@nibtechnologies.com", halfWidth: true },
  { name: "password", label: "Admin Password", type: "password", required: true, placeholder: "••••••••", halfWidth: true },
  { name: "confirmPassword", label: "Confirm Admin Password", type: "password", required: true, placeholder: "••••••••", halfWidth: true }
];

import Button from "../components/ui/Button";

const SuperAdminDashboard = () => {
  const { fetchWithAuth, logout, user } = useAuth();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState("overview"); // "overview" or "registers"
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
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

  // Search Filter State
  const [searchQuery, setSearchQuery] = useState("");

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
      localStorage.setItem("user", JSON.stringify(userObj));
      localStorage.setItem("selected_company_code", tenant.id);
    } catch (e) {}
    window.location.href = "/admin/dashboard";
  };
  
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
  const loadTenants = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchWithAuth(`${API_BASE}/api/super-admin/tenants`);
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      if (response.ok && result.success) {
        setTenants(result.data);
      } else {
        throw new Error(result.error || result.message || "Failed to load registered companies.");
      }
    } catch (err) {
      console.error(err);
      setError("Error connecting to SaaS registry database. Displaying cached session data.");
      // Fallback visual mock data for robust local demo and developer visual alignment
      setTenants([
        // { 
        //   id: "1", 
        //   code: "NIB01", 
        //   name: "Technovani Pvt Ltd", 
        //   db: "nib_hr_nib01", 
        //   status: "Active", 
        //   createdAt: new Date().toISOString(),
        //   ownerName: "Aman Gupta",
        //   emailAddress: "aman@kiranaerp.com",
        //   phone: "9876543210",
        //   address: "12 MG Road, Indore, Madhya Pradesh",
        //   gst: "07AAAAA1111A1Z1",
        //   activeUsers: 5,
        //   plan: "YEARLY",
        //   trialStatus: "Trial Active",
        //   expiryDate: "15 Jul 2027",
        //   remainingDays: 363
        // },
        // { 
        //   id: "2", 
        //   code: "COCA02", 
        //   name: "Coca Cola Local", 
        //   db: "kirana_erp_tenant_1", 
        //   status: "Active", 
        //   createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        //   ownerName: "Deepesh Jain",
        //   emailAddress: "admin@kiranamart.com",
        //   phone: "9876543210",
        //   address: "102, Malviya Nagar, New Delhi",
        //   gst: "07BBBBB2222B2Z2",
        //   activeUsers: 2,
        //   plan: "YEARLY",
        //   trialStatus: "Trial Active",
        //   expiryDate: "11 Jul 2027",
        //   remainingDays: 359
        // }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  // Form input handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit Handler
  const handleRegisterCompany = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    // Front-end validations
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
          state: "",
          city: "",
          pincode: "",
          gst: ""
        });
        loadTenants();
      } else {
        throw new Error(result.message || result.error || "Failed to provision tenant resources.");
      }
    } catch (err) {
      setFormError(err.message || "An unexpected error occurred during database setup.");
    } finally {
      setFormLoading(false);
    }
  };

  // Calculate dynamic dashboard stats from state array
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.status === "Active").length;
  const suspendedTenants = tenants.filter(t => t.status !== "Active").length;
  const platformUsersCount = tenants.reduce((acc, curr) => acc + (curr.activeUsers || 0), 0);
  const monthlySaasIncome = activeTenants * 9000; // Calculated SaaS revenue (e.g. ₹9,000 per tenant/mo)
  const totalActiveSeats = platformUsersCount * 5; // Placeholder active seats mapping for HR alignment

  // Filtered tenants based on search input
  const filteredTenants = tenants.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.code && t.code.toLowerCase().includes(q)) ||
      (t.db && t.db.toLowerCase().includes(q)) ||
      (t.emailAddress && t.emailAddress.toLowerCase().includes(q)) ||
      (t.ownerName && t.ownerName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      
      {/* Top Header Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={technoLogo} alt="Logo" className="h-8 w-auto object-contain" />
            <div className="h-5 w-px bg-slate-200"></div>
            <div>
              <span className="text-sm font-extrabold text-slate-900 tracking-tight">Multi-Tenant Platform</span>
              <span className="ml-2 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">SuperAdmin</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Direct Switch to Admin / HR Dashboard */}
            <Link
              to="/admin/dashboard"
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition border border-slate-200"
            >
              <HomeIcon className="h-4 w-4" />
              <span>Go to Admin / HR Portal</span>
            </Link>

            <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-600 font-medium">
              <span className="font-semibold text-slate-700">{user?.email || "superadmin@nib.com"}</span>
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition border border-red-100"
              title="Sign out of SuperAdmin"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Navigation Tabs / Breadcrumb Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2.5 text-sm font-bold rounded-xl transition ${
                activeTab === "overview" 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" 
                  : "text-slate-600 hover:bg-white hover:text-slate-900"
              }`}
            >
              Platform Overview
            </button>
            <button
              onClick={() => setActiveTab("registers")}
              className={`px-4 py-2.5 text-sm font-bold rounded-xl transition ${
                activeTab === "registers" 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" 
                  : "text-slate-600 hover:bg-white hover:text-slate-900"
              }`}
            >
              Company Tenant Registers
            </button>
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-3 py-2 rounded-xl transition shadow-lg shadow-blue-600/10 hover:scale-102 active:scale-98"
          >
            <PlusIcon className="h-2 w-4.5 stroke-[3]" />
            <span>Register New Company</span>
          </Button>
        </div>

        {/* Global Connection / Registry Error banner */}
        {error && (
          <div className="flex items-center space-x-3 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl text-xs font-semibold shadow-sm animate-pulse">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
            <span>{error}</span>
          </div>
        )}

        {/* =========================================================================
            VIEW 1: PLATFORM OVERVIEW (TAB: overview)
            ========================================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            
            {/* Real-time stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card variant="elevated" padding="large" className="hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Registered Companies</p>
                    <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{totalTenants}</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      {activeTenants} Active / {suspendedTenants} Suspended
                    </p>
                  </div>
                  <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                    <BuildingOfficeIcon className="h-6 w-6" />
                  </div>
                </div>
              </Card>

              <Card variant="elevated" padding="large" className="hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Platform Users Count</p>
                    <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{platformUsersCount}</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      Registered Staff Personnel
                    </p>
                  </div>
                  <div className="bg-cyan-50 text-cyan-800 p-3 rounded-xl">
                    <KeyIcon className="h-6 w-6" />
                  </div>
                </div>
              </Card>

              <Card variant="elevated" padding="large" className="hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly SaaS Income</p>
                    <h3 className="text-3xl font-extrabold text-slate-900 mt-2">
                      ₹{monthlySaasIncome.toLocaleString("en-IN")}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      Active Subscribed Portals
                    </p>
                  </div>
                  <div className="bg-indigo-50 text-indigo-800 p-3 rounded-xl">
                    <CreditCardIcon className="h-6 w-6" />
                  </div>
                </div>
              </Card>

              <Card variant="elevated" padding="large" className="hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Licenses</p>
                    <h3 className="text-3xl font-extrabold text-slate-900 mt-2">250 Seats</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      Across all companies
                    </p>
                  </div>
                  <div className="bg-amber-50 text-amber-800 p-3 rounded-xl">
                    <CpuChipIcon className="h-6 w-6" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Registered Companies Table */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Recent Registered Companies</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Full specifications of active merchant tenants on the platform</p>
                </div>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search companies..."
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs w-full sm:w-60 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4">Company Name</th>
                      <th className="px-6 py-4">Tenant ID</th>
                      <th className="px-6 py-4">Owner Name</th>
                      <th className="px-6 py-4">Email Address</th>
                      <th className="px-6 py-4 text-center">Plan</th>
                      <th className="px-6 py-4 text-center">Trial Status</th>
                      <th className="px-6 py-4">Registration</th>
                      <th className="px-6 py-4">Expiry Date</th>
                      <th className="px-6 py-4 text-center">Active Users</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                    {loading ? (
                      <tr>
                        <td colSpan={11} className="px-6 py-12 text-center text-slate-400 font-semibold">
                          Loading company catalog...
                        </td>
                      </tr>
                    ) : filteredTenants.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-6 py-12 text-center text-slate-400 font-semibold">
                          {searchQuery ? "No companies match your search." : "No company registries found. Provision a company above."}
                        </td>
                      </tr>
                    ) : (
                      filteredTenants.map(tenant => (
                        <tr key={tenant.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-6 py-4 font-bold text-slate-900">{tenant.name}</td>
                          <td className="px-6 py-4">
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono text-[10px] border">
                              {tenant.code}
                            </span>
                          </td>
                          <td className="px-6 py-4">{tenant.ownerName}</td>
                          <td className="px-6 py-4 font-semibold text-slate-500">{tenant.emailAddress}</td>
                          <td className="px-6 py-4 text-center">
                            <Badge variant="primary" className="text-[10px] uppercase font-bold bg-indigo-50 text-indigo-700 border-indigo-100">
                              {tenant.plan}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-amber-100">
                              {tenant.trialStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-500">
                            {new Date(tenant.createdAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-500">
                            {new Date(tenant.expiryDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })}
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-900">{tenant.activeUsers}</td>
                          <td className="px-6 py-4 text-center">
                            <Badge variant={tenant.status === "Active" ? "success" : "danger"}>
                              {tenant.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => handleEnterCompanyPortal(tenant)}
                                className="p-1.5 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 text-slate-500 rounded-lg transition cursor-pointer"
                                title={`Open ${tenant.name} Admin Portal`}
                              >
                                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteError("");
                                  setDeleteModal({ open: true, tenant });
                                }}
                                className="p-1.5 border border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-lg transition cursor-pointer"
                                title="Delete company"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 2: COMPANY TENANT REGISTERS PAGE (TAB: registers)
            ========================================================================= */}
        {activeTab === "registers" && (
          <div className="space-y-6">
            
            {/* Header section with back click */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setActiveTab("overview")} 
                className="p-2 border bg-white border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition shadow-sm"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">COMPANY TENANT REGISTERS</h2>
                <p className="text-xs text-slate-500 font-semibold">Add, Suspend, or Modify Platform Companies</p>
              </div>
            </div>

            {/* List entries */}
            <div className="space-y-4">
              {loading ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 font-semibold shadow-sm">
                  Querying master registry pools...
                </div>
              ) : tenants.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 font-semibold shadow-sm">
                  No company configurations provisioned yet.
                </div>
              ) : (
                tenants.map(tenant => (
                  <div 
                    key={tenant.id} 
                    className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-md transition shadow-sm"
                  >
                    
                    {/* Company details (left) */}
                    <div className="flex items-start space-x-4 lg:w-1/4">
                      <div className="bg-blue-50 border border-blue-100 text-blue-600 p-3 rounded-2xl">
                        <BuildingOfficeIcon className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{tenant.name}</h4>
                        <p className="text-xs text-slate-400 font-semibold leading-tight">{tenant.address}</p>
                      </div>
                    </div>

                    {/* Database name */}
                    <div className="lg:w-1/6">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Database Name</p>
                      <p className="text-xs font-mono font-bold text-slate-800 mt-1">{tenant.db}</p>
                    </div>

                    {/* Admin ID / Owner */}
                    <div className="lg:w-1/4 space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Admin ID / Owner</p>
                      <p className="text-xs font-bold text-slate-900">{tenant.ownerName}</p>
                      <p className="text-[11px] font-medium text-slate-500">
                        {tenant.emailAddress} • {tenant.phone}
                      </p>
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-0.5">
                        Admin ID: {tenant.code}
                      </p>
                    </div>

                    {/* Plan Mappings */}
                    <div className="lg:w-1/6 space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plan Mappings</p>
                      <p className="text-xs font-bold text-slate-800">{tenant.plan} PLAN</p>
                      <p className="text-[11px] font-medium text-slate-500">
                        Expires: {new Date(tenant.expiryDate).toLocaleDateString("en-GB")}
                      </p>
                    </div>

                    {/* Remaining Days */}
                    <div className="lg:w-1/8">
                      <span className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-xl text-xs font-bold">
                        {tenant.remainingDays} Days
                      </span>
                    </div>

                    {/* Status badge */}
                    <div className="lg:w-1/12">
                      <Badge variant={tenant.status === "Active" ? "success" : "danger"}>
                        {tenant.status}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEnterCompanyPortal(tenant)}
                        className="px-3 py-2 border border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 text-slate-600 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5 text-xs font-bold" 
                        title="Enter Company Portal"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4 text-blue-600" />
                        <span>Enter Portal</span>
                      </button>
                      <button 
                        onClick={() => {
                          setDeleteError("");
                          setDeleteModal({ open: true, tenant });
                        }}
                        className="p-2 border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-400 rounded-xl transition shadow-xs cursor-pointer" 
                        title="Delete company"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                  </div>
                ))
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
        title="REGISTER NEW COMPANY"
        size="medium"
      >
        <DynamicForm
          fields={companyRegistrationFields}
          formData={formData}
          onChange={handleInputChange}
          onSubmit={handleRegisterCompany}
          onCancel={() => setIsModalOpen(false)}
          loading={formLoading}
          error={formError}
          success={formSuccess}
          submitButtonText="Register Company"
        />
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
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 text-red-800">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-sm text-red-900">Permanent Deletion Warning</p>
              <p>Are you sure you want to permanently delete <span className="font-bold underline text-red-900">{deleteModal.tenant?.name}</span>?</p>
              <p className="text-slate-600">
                This will permanently drop the physical database <span className="font-mono font-bold text-slate-800">`{deleteModal.tenant?.db}`</span>, clean up company resources, and purge it from the master registry.
              </p>
            </div>
          </div>

          {deleteError && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-700 text-xs rounded-xl font-medium">
              {deleteError}
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ open: false, tenant: null })}
              disabled={deleteLoading}
              className="text-xs font-semibold px-4 py-2 border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              loading={deleteLoading}
              className="text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-red-600/20"
            >
              Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default SuperAdminDashboard;
