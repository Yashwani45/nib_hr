// Frontend/src/components/CoreSetup/Branch.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  BuildingOffice2Icon,
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  PencilSquareIcon,
  TrashIcon,
  UserIcon,
  CalendarDaysIcon,
  PlusIcon,
  ArrowPathIcon,
  ClockIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  ArrowsRightLeftIcon,
  UserGroupIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon
} from "@heroicons/react/24/outline";
import { 
  getTableData, 
  apiFetch, 
  toggleBranchStatus, 
  updateBranchPolicy, 
  transferEmployeeBranch, 
  getEmployeeTransferHistory, 
  getBranchHolidays, 
  addBranchHoliday, 
  deleteBranchHoliday 
} from "../../services/hrApi";

const MAX_BRANCHES = 50;

const Branch = ({ records = [], onOpenEdit, onDelete, openCreateTrigger, user, onRefreshData, dbData = {} }) => {
  // Navigation sub-tabs within Branch Management Hub
  const [activeSubTab, setActiveSubTab] = useState("facilities"); // "facilities", "shifts", "holidays", "policies", "payroll", "transfers", "reports"
  const [viewMode, setViewMode] = useState("cards"); // "cards" or "table"
  const [statusFilter, setStatusFilter] = useState("All"); // "All", "Active", "Inactive"
  const [searchQuery, setSearchQuery] = useState("");

  const [localRecords, setLocalRecords] = useState(records || []);
  const [employees, setEmployees] = useState([]);
  const [transferHistory, setTransferHistory] = useState([]);
  const [branchHolidays, setBranchHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncTick, setSyncTick] = useState(0);

  // Modals state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    employeeId: "",
    targetBranchId: "",
    effectiveDate: new Date().toISOString().slice(0, 10),
    reason: ""
  });
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferMsg, setTransferMsg] = useState({ error: "", success: "" });

  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [selectedBranchForPolicy, setSelectedBranchForPolicy] = useState(null);
  const [policyForm, setPolicyForm] = useState({
    manager: "",
    opening_time: "09:00",
    closing_time: "18:00",
    working_days: "Monday - Friday, 8:30 AM - 5:30 PM",
    weekly_off: "Sunday",
    grace_period_mins: 15,
    half_day_hours: 4.5,
    full_day_hours: 8.5,
    pt_state: "Madhya Pradesh",
    cost_center: "CC-BRANCH",
    geo_fencing: false,
    geo_radius: 200,
    status: "Active"
  });
  const [policySubmitting, setPolicySubmitting] = useState(false);
  const [policyMsg, setPolicyMsg] = useState({ error: "", success: "" });

  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    branchId: "",
    holidayName: "",
    holidayDate: new Date().toISOString().slice(0, 10),
    holidayType: "Regional",
    description: "",
    isMandatory: 1
  });
  const [holidaySubmitting, setHolidaySubmitting] = useState(false);

  // Sync branches from prop or fetch directly
  const loadBranches = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getTableData("branch", true);
      if (Array.isArray(data)) {
        setLocalRecords(data);
      }
    } catch (e) {
      if (records && records.length > 0) setLocalRecords(records);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Load Employees for transfer & manager assignment
  const loadEmployees = async () => {
    try {
      const data = await getTableData("employees", true);
      if (Array.isArray(data) && data.length > 0) {
        setEmployees(data);
      } else if (Array.isArray(dbData["employees"]) && dbData["employees"].length > 0) {
        setEmployees(dbData["employees"]);
      } else if (Array.isArray(dbData["employee"])) {
        setEmployees(dbData["employee"]);
      }
    } catch (e) {
      if (Array.isArray(dbData["employees"])) {
        setEmployees(dbData["employees"]);
      } else if (Array.isArray(dbData["employee"])) {
        setEmployees(dbData["employee"]);
      }
    }
  };

  // Load transfer history
  const loadTransfers = async () => {
    try {
      const history = await getEmployeeTransferHistory();
      setTransferHistory(Array.isArray(history) ? history : []);
    } catch (e) {
      setTransferHistory([]);
    }
  };

  // Load branch holidays
  const loadHolidays = async (branchId) => {
    try {
      const hols = await getBranchHolidays(branchId);
      setBranchHolidays(Array.isArray(hols) ? hols : []);
    } catch (e) {
      setBranchHolidays([]);
    }
  };

  useEffect(() => {
    loadBranches();
    loadEmployees();
    loadTransfers();
    loadHolidays();
  }, [records]);

  // Synchronize with top Navbar dropdown
  useEffect(() => {
    const handleSync = () => {
      setSyncTick((t) => t + 1);
      loadBranches(true);
      loadEmployees();
    };

    window.addEventListener("branches_updated", handleSync);
    window.addEventListener("branch_changed", handleSync);
    window.addEventListener("branch_switched", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("branches_updated", handleSync);
      window.removeEventListener("branch_changed", handleSync);
      window.removeEventListener("branch_switched", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const allBranches = useMemo(() => {
    return localRecords.length > 0 ? localRecords : (records || []);
  }, [localRecords, records]);

  const storedId = localStorage.getItem("selected_branch_id");
  const storedName = localStorage.getItem("selected_branch_name");
  const storedCode = localStorage.getItem("selected_branch_code");
  const isAllSelected = !storedId || storedId === "ALL" || storedName === "All Branches";

  // Helper to match a branch record with top navbar selection
  const isBranchMatch = (br) => {
    if (isAllSelected) return true;
    if (!br) return false;
    const brId = String(br.id || "").trim();
    const brCode = String(br.branchCode || br.branch_code || "").trim().toLowerCase();
    const brName = String(br.branchName || br.branch_name || "").trim().toLowerCase().replace(/[\u2013\u2014-]/g, '-');
    const targetId = String(storedId || "").trim();
    const targetCode = String(storedCode || "").trim().toLowerCase();
    const targetName = String(storedName || "").trim().toLowerCase().replace(/[\u2013\u2014-]/g, '-');

    if (targetId && targetId !== "ALL" && (brId === targetId || brCode === targetId.toLowerCase())) {
      return true;
    }
    if (targetCode && targetCode !== "ALL" && brCode === targetCode) {
      return true;
    }
    if (targetName && targetName !== "all branches" && (brName === targetName || brName.includes(targetName) || targetName.includes(brName))) {
      return true;
    }
    return false;
  };

  // Branch selected in top navbar
  const navbarSelectedBranch = useMemo(() => {
    if (!allBranches || allBranches.length === 0 || isAllSelected) return null;
    return allBranches.find(isBranchMatch) || allBranches[0];
  }, [allBranches, isAllSelected, storedId, storedName, storedCode, syncTick]);

  // Branches to display based on navbar dropdown (Specific Branch vs All Branches)
  const displayedBranches = useMemo(() => {
    if (isAllSelected) return allBranches;
    const matched = allBranches.filter(isBranchMatch);
    return matched.length > 0 ? matched : (navbarSelectedBranch ? [navbarSelectedBranch] : allBranches);
  }, [allBranches, isAllSelected, storedId, storedName, storedCode, syncTick, navbarSelectedBranch]);

  // Filtered branches for display (search + status applied on displayedBranches)
  const filteredBranches = useMemo(() => {
    return displayedBranches.filter((br) => {
      const name = (br.branchName || br.branch_name || "").toLowerCase();
      const code = (br.branchCode || br.branch_code || "").toLowerCase();
      const city = (br.city || "").toLowerCase();
      const manager = (br.manager || "").toLowerCase();
      const status = br.status || "Active";

      const matchesSearch = 
        !searchQuery || 
        name.includes(searchQuery.toLowerCase()) || 
        code.includes(searchQuery.toLowerCase()) || 
        city.includes(searchQuery.toLowerCase()) || 
        manager.includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "All" || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [displayedBranches, searchQuery, statusFilter]);

  // Headcount per branch map (robust normalization for id, code, and names)
  const branchHeadcountMap = useMemo(() => {
    const map = {};
    employees.forEach(emp => {
      const bId = emp.branch_id || emp.branchId;
      const bName = emp.branch || emp.branchName || emp.branch_name;
      const bCode = emp.branchCode || emp.branch_code;
      if (bId) {
        map[bId] = (map[bId] || 0) + 1;
      }
      if (bName) {
        map[bName] = (map[bName] || 0) + 1;
        const norm = String(bName).toLowerCase().trim().replace(/[\u2013\u2014-]/g, '-');
        map[norm] = (map[norm] || 0) + 1;
      }
      if (bCode) {
        map[String(bCode).toLowerCase().trim()] = (map[String(bCode).toLowerCase().trim()] || 0) + 1;
      }
    });
    return map;
  }, [employees]);

  // Accurate headcount resolver for a branch
  const getBranchHeadcount = (br) => {
    if (!br) return 0;
    if (br.id && branchHeadcountMap[br.id]) return branchHeadcountMap[br.id];
    const bName = br.branchName || br.branch_name || "";
    if (bName && branchHeadcountMap[bName]) return branchHeadcountMap[bName];
    const norm = bName.toLowerCase().trim().replace(/[\u2013\u2014-]/g, '-');
    if (norm && branchHeadcountMap[norm]) return branchHeadcountMap[norm];
    const bCode = br.branchCode || br.branch_code || "";
    if (bCode && branchHeadcountMap[bCode.toLowerCase().trim()]) return branchHeadcountMap[bCode.toLowerCase().trim()];
    return 0;
  };

  const displayedHolidays = useMemo(() => {
    if (isAllSelected) return branchHolidays;
    const targetName = (navbarSelectedBranch?.branchName || navbarSelectedBranch?.branch_name || "").toLowerCase().trim();
    const targetId = String(navbarSelectedBranch?.id || "").trim();
    return branchHolidays.filter(h => {
      const hBranch = (h.branch_name || h.branch || "").toLowerCase().trim();
      const hId = String(h.branch_id || h.branchId || "").trim();
      return !hBranch || hBranch === "all branches" || hBranch.includes("company-wide") || hId === targetId || (targetName && hBranch.includes(targetName));
    });
  }, [branchHolidays, isAllSelected, navbarSelectedBranch]);

  

  // 1. Action: Toggle Branch Status (Active / Inactive)
  const handleToggleStatus = async (branch, e) => {
    if (e) e.stopPropagation();
    const currentStatus = branch.status || "Active";
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";

    try {
      const res = await toggleBranchStatus(branch.id, newStatus);
      if (res) {
        setLocalRecords(prev => prev.map(b => b.id === branch.id ? { ...b, status: newStatus } : b));
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      alert(`Failed to update branch status: ${err.message || 'Error'}`);
    }
  };

  // 2. Action: Open Policy / Edit Modal for Branch
  const handleOpenPolicyModal = (branch) => {
    setSelectedBranchForPolicy(branch);
    setPolicyForm({
      manager: branch.manager || "",
      opening_time: branch.opening_time || "09:00",
      closing_time: branch.closing_time || "18:00",
      working_days: branch.workingDays || branch.working_days || "Monday - Friday, 8:30 AM - 5:30 PM",
      weekly_off: branch.weekly_off || "Sunday",
      grace_period_mins: branch.grace_period_mins || 15,
      half_day_hours: branch.half_day_hours || 4.5,
      full_day_hours: branch.full_day_hours || 8.5,
      pt_state: branch.pt_state || branch.state || "Madhya Pradesh",
      cost_center: branch.cost_center || `CC-${(branch.branchCode || 'BR').toUpperCase()}`,
      geo_fencing: !!branch.geo_fencing,
      geo_radius: branch.geo_radius || 200,
      status: branch.status || "Active",
      phone: branch.phone || "",
      email: branch.email || "",
      address: branch.address || "",
      city: branch.city || "",
      state: branch.state || "",
      pincode: branch.pincode || ""
    });
    setPolicyMsg({ error: "", success: "" });
    setIsPolicyModalOpen(true);
  };

  // Save Policy Form
  const handleSavePolicy = async (e) => {
    e.preventDefault();
    if (!selectedBranchForPolicy) return;

    setPolicySubmitting(true);
    setPolicyMsg({ error: "", success: "" });

    try {
      const updated = await updateBranchPolicy(selectedBranchForPolicy.id, policyForm);
      if (updated) {
        setLocalRecords(prev => prev.map(b => b.id === selectedBranchForPolicy.id ? { ...b, ...policyForm } : b));
        setPolicyMsg({ error: "", success: "Branch configuration and policies updated successfully!" });
        setTimeout(() => {
          setIsPolicyModalOpen(false);
          setPolicyMsg({ error: "", success: "" });
        }, 1200);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      setPolicyMsg({ error: err.message || "Failed to update branch policy.", success: "" });
    } finally {
      setPolicySubmitting(false);
    }
  };

  // 3. Action: Handle Employee Transfer
  const handleOpenTransferModal = (preselectedBranchId = "") => {
    setTransferForm({
      employeeId: "",
      targetBranchId: preselectedBranchId || (allBranches[0]?.id || ""),
      effectiveDate: new Date().toISOString().slice(0, 10),
      reason: ""
    });
    setTransferMsg({ error: "", success: "" });
    setIsTransferModalOpen(true);
  };

  const handleExecuteTransfer = async (e) => {
    e.preventDefault();
    if (!transferForm.employeeId || !transferForm.targetBranchId) {
      setTransferMsg({ error: "Please select both an employee and a target branch.", success: "" });
      return;
    }

    setTransferSubmitting(true);
    setTransferMsg({ error: "", success: "" });

    try {
      const targetBranch = allBranches.find(b => b.id === transferForm.targetBranchId);
      const res = await transferEmployeeBranch({
        ...transferForm,
        targetBranchName: targetBranch ? (targetBranch.branchName || targetBranch.branch_name) : ""
      });

      if (res) {
        setTransferMsg({ error: "", success: res.message || "Employee transferred successfully!" });
        await loadEmployees();
        await loadTransfers();
        setTimeout(() => {
          setIsTransferModalOpen(false);
          setTransferMsg({ error: "", success: "" });
        }, 1500);
      }
    } catch (err) {
      setTransferMsg({ error: err.message || "Transfer failed.", success: "" });
    } finally {
      setTransferSubmitting(false);
    }
  };

  // 4. Action: Add Branch Holiday
  const handleAddHoliday = async (e) => {
    e.preventDefault();
    setHolidaySubmitting(true);
    try {
      const targetBr = allBranches.find(b => b.id === holidayForm.branchId);
      await addBranchHoliday({
        ...holidayForm,
        branchName: targetBr ? (targetBr.branchName || targetBr.branch_name) : "All Branches (Company-Wide)"
      });
      await loadHolidays();
      setIsHolidayModalOpen(false);
      setHolidayForm({
        branchId: "",
        holidayName: "",
        holidayDate: new Date().toISOString().slice(0, 10),
        holidayType: "Regional",
        description: "",
        isMandatory: 1
      });
    } catch (err) {
      alert(`Failed to add holiday: ${err.message}`);
    } finally {
      setHolidaySubmitting(false);
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (!window.confirm("Are you sure you want to delete this holiday?")) return;
    try {
      await deleteBranchHoliday(id);
      setBranchHolidays(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      alert(`Failed to delete holiday: ${err.message}`);
    }
  };

  // Export Branch Report to CSV
  const handleExportCSV = () => {
    if (!allBranches || allBranches.length === 0) {
      alert("No branch data available to export.");
      return;
    }
    const headers = ["Branch Name", "Branch Code", "Status", "Manager", "City", "State", "Pincode", "Working Days", "Opening Time", "Closing Time", "Weekly Off", "Headcount", "PT State", "Cost Center"];
    const rows = allBranches.map(b => [
      `"${b.branchName || b.branch_name || ''}"`,
      `"${b.branchCode || b.branch_code || ''}"`,
      `"${b.status || 'Active'}"`,
      `"${b.manager || 'Not Assigned'}"`,
      `"${b.city || ''}"`,
      `"${b.state || ''}"`,
      `"${b.pincode || ''}"`,
      `"${b.workingDays || b.working_days || 'Mon - Fri'}"`,
      `"${b.opening_time || '09:00'}"`,
      `"${b.closing_time || '18:00'}"`,
      `"${b.weekly_off || 'Sunday'}"`,
      branchHeadcountMap[b.id] || branchHeadcountMap[b.branchName] || 0,
      `"${b.pt_state || ''}"`,
      `"${b.cost_center || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `branches_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isLimitReached = allBranches.length >= MAX_BRANCHES;
  const activeCount = displayedBranches.filter(b => (b.status || "Active") === "Active").length;
  const inactiveCount = displayedBranches.filter(b => b.status === "Inactive").length;
  const totalHeadcount = isAllSelected 
    ? employees.length 
    : displayedBranches.reduce((sum, br) => sum + getBranchHeadcount(br), 0);

  if (loading && allBranches.length === 0) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs">
        <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold text-slate-700">Loading branch facilities from database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 1. Header Banner & Limit Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
              <BuildingOffice2Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Branch Network & Facilities Management
                </h2>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  {allBranches.length} / {MAX_BRANCHES} Max
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage branch activation, operating hours, holiday schedules, attendance policies, payroll, and employee transfers.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenTransferModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition cursor-pointer"
            >
              <ArrowsRightLeftIcon className="w-4 h-4 stroke-[2]" />
              <span>Transfer Employee</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-2xs transition cursor-pointer"
              title="Export branch directory to CSV"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            {openCreateTrigger && !isLimitReached && (
              <button
                onClick={openCreateTrigger}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <PlusIcon className="w-4 h-4 stroke-[2.5]" />
                <span>+ Add Branch</span>
              </button>
            )}
          </div>
        </div>

        {/* Quota & Quick Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {isAllSelected ? "Total Facilities" : "Selected Facility"}
            </span>
            <span className="text-base font-black text-slate-900 mt-0.5 block">
              {displayedBranches.length} <span className="text-[11px] font-normal text-slate-400">{isAllSelected ? `/ ${MAX_BRANCHES} limit` : `of ${allBranches.length} total`}</span>
            </span>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Active Branches</span>
            <span className="text-base font-black text-emerald-700 mt-0.5 block">{activeCount}</span>
          </div>
          <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Inactive Branches</span>
            <span className="text-base font-black text-rose-700 mt-0.5 block">{inactiveCount}</span>
          </div>
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Total Headcount</span>
            <span className="text-base font-black text-indigo-700 mt-0.5 block">{totalHeadcount} personnel</span>
          </div>
        </div>
      </div>

      {/* Scope Banner when a single branch is selected */}
      {!isAllSelected && navbarSelectedBranch && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/90 px-4 py-2.5 rounded-2xl text-xs text-blue-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
            </span>
            <span>
              Scoped to Active Branch: <strong>{navbarSelectedBranch.branchName || navbarSelectedBranch.branch_name}</strong> (Showing 1 of {allBranches.length} facilities).
            </span>
          </div>
          <button
            onClick={() => {
              localStorage.setItem("selected_branch_id", "ALL");
              localStorage.setItem("selected_branch_name", "All Branches");
              localStorage.setItem("selected_branch_code", "ALL");
              window.dispatchEvent(new Event("branches_updated"));
              window.dispatchEvent(new Event("branch_changed"));
              window.dispatchEvent(new Event("storage"));
              window.dispatchEvent(new CustomEvent("branch_switched", { detail: { branchId: "ALL", branchName: "All Branches", branchCode: "ALL" } }));
            }}
            className="inline-flex items-center gap-1 font-bold text-blue-700 hover:text-blue-950 hover:underline cursor-pointer text-xs"
          >
            <span>View All Facilities ({allBranches.length})</span>
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      )}

      {/* 2. Top Navbar Selected Branch Context Card (if a single branch is selected in navbar) */}
      {navbarSelectedBranch && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4.5 rounded-2xl shadow-md border border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold border border-blue-400/30">
              <BuildingOfficeIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-400/30">
                  Active in Top Navigation:
                </span>
                <h3 className="font-extrabold text-sm text-white">
                  {navbarSelectedBranch.branchName || navbarSelectedBranch.branch_name}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  navbarSelectedBranch.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                }`}>
                  {navbarSelectedBranch.status || 'Active'}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-1">
                Manager: <strong>{navbarSelectedBranch.manager || 'Not Assigned'}</strong> • Hours: <strong>{navbarSelectedBranch.opening_time || '09:00'} - {navbarSelectedBranch.closing_time || '18:00'}</strong> • Assigned Personnel: <strong>{getBranchHeadcount(navbarSelectedBranch)}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleToggleStatus(navbarSelectedBranch)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                navbarSelectedBranch.status === 'Active'
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border-rose-400/40'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-400/40'
              }`}
            >
              {navbarSelectedBranch.status === 'Active' ? 'Deactivate Branch' : 'Activate Branch'}
            </button>

            <button
              onClick={() => handleOpenPolicyModal(navbarSelectedBranch)}
              className="px-3.5 py-1.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            >
              Configure Policy
            </button>
          </div>
        </div>
      )}

      {/* 3. Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab("facilities")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "facilities" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BuildingOffice2Icon className="w-4 h-4" />
            <span>Facilities Directory</span>
          </button>

          <button
            onClick={() => setActiveSubTab("shifts")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "shifts" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ClockIcon className="w-4 h-4" />
            <span>Working Hours & Shifts</span>
          </button>

          <button
            onClick={() => setActiveSubTab("holidays")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "holidays" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CalendarDaysIcon className="w-4 h-4" />
            <span>Holiday Calendars</span>
          </button>

          <button
            onClick={() => setActiveSubTab("policies")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "policies" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheckIcon className="w-4 h-4" />
            <span>Attendance Policies</span>
          </button>

          <button
            onClick={() => setActiveSubTab("payroll")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "payroll" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BanknotesIcon className="w-4 h-4" />
            <span>Payroll & Compliance</span>
          </button>

          <button
            onClick={() => setActiveSubTab("transfers")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "transfers" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ArrowsRightLeftIcon className="w-4 h-4" />
            <span>Employee Transfers</span>
            {transferHistory.length > 0 && (
              <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                {transferHistory.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab("reports")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "reports" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ChartBarIcon className="w-4 h-4" />
            <span>Branch Reporting</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search branch, city, manager..."
              className="pl-8 pr-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-60"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-bold border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none"
          >
            <option value="All">All Status</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* 4. Tab Contents */}

      {/* SUB-TAB 1: Facilities Directory (Cards & Table) */}
      {activeSubTab === "facilities" && (
        <div className="space-y-4">
          {filteredBranches.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
              <BuildingOffice2Icon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Branch Facilities Match Search</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No branch records found matching status '{statusFilter}' or query '{searchQuery}'.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBranches.map((br) => {
                const bName = br.branchName || br.branch_name || "Branch";
                const bCode = br.branchCode || br.branch_code || br.id?.slice(0, 8);
                const status = br.status || "Active";
                const manager = br.manager || "Not Assigned";
                const workingDays = br.workingDays || br.working_days || "Monday - Friday";
                const opTime = br.opening_time || "09:00";
                const clTime = br.closing_time || "18:00";
                const headcount = getBranchHeadcount(br);

                return (
                  <div
                    key={br.id}
                    className={`bg-white border rounded-2xl p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between ${
                      status === "Active" ? "border-slate-200/90" : "border-rose-200 bg-rose-50/10"
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Top Row: Name, Code & Quick Status Toggle */}
                      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                            status === "Active" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-100 text-slate-400 border-slate-200"
                          }`}>
                            <BuildingOffice2Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900 tracking-tight leading-snug">
                              {bName}
                            </h4>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Code: {bCode}
                            </span>
                          </div>
                        </div>

                        {/* 1-Click Status Activation/Deactivation Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleStatus(br, e)}
                          title={`Click to ${status === "Active" ? "Deactivate" : "Activate"}`}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border transition cursor-pointer ${
                            status === "Active"
                              ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${status === "Active" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}></span>
                          <span>{status}</span>
                        </button>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div className="p-2.5 bg-slate-50 rounded-xl">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <UserIcon className="w-3 h-3 text-slate-500" />
                            Manager
                          </span>
                          <p className="font-bold text-slate-800 text-xs mt-0.5 truncate">
                            {manager}
                          </p>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-xl">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <UserGroupIcon className="w-3 h-3 text-slate-500" />
                            Headcount
                          </span>
                          <p className="font-black text-slate-900 text-xs mt-0.5">
                            {headcount} Personnel
                          </p>
                        </div>

                        <div className="col-span-2 p-2.5 bg-slate-50 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <ClockIcon className="w-3 h-3 text-slate-500" />
                            Operating Hours
                          </span>
                          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                            <span>{opTime} - {clTime}</span>
                            <span className="text-[10px] text-slate-500 font-medium">Off: {br.weekly_off || 'Sunday'}</span>
                          </div>
                        </div>

                        <div className="col-span-2 text-xs text-slate-600">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                            <MapPinIcon className="w-3 h-3 text-slate-500" />
                            Address & Region
                          </span>
                          <p className="truncate text-[11px] font-medium text-slate-700">
                            {br.address ? `${br.address}, ` : ""}{br.city || ""}{br.state ? `, ${br.state}` : ""}{br.pincode ? ` - ${br.pincode}` : ""}
                            {!br.address && !br.city && "Location address not set"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenTransferModal(br.id)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowsRightLeftIcon className="w-3.5 h-3.5" />
                        <span>Transfer To</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenPolicyModal(br)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                          title="Configure branch policies, working hours, and manager"
                        >
                          <PencilSquareIcon className="w-3.5 h-3.5 inline mr-1" />
                          <span>Configure</span>
                        </button>

                        {onDelete && (
                          <button
                            onClick={() => onDelete(br.id)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete branch"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: Working Hours & Shifts */}
      {activeSubTab === "shifts" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">Branch-Wise Working Hours & Shift Schedules</h3>
              <p className="text-xs text-slate-500 mt-0.5">Customize branch opening times, shift closing cutoffs, weekly off days, and arrival grace periods.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Branch Name</th>
                  <th className="py-2.5 px-3">Operating Window</th>
                  <th className="py-2.5 px-3">Grace Period</th>
                  <th className="py-2.5 px-3">Working Days</th>
                  <th className="py-2.5 px-3">Weekly Off</th>
                  <th className="py-2.5 px-3">Half-Day Cutoff</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedBranches.map((br) => (
                  <tr key={br.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-extrabold text-slate-900">
                      {br.branchName || br.branch_name}
                      <span className="block text-[10px] text-slate-400 font-mono font-normal">{br.branchCode || br.branch_code}</span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800">
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {br.opening_time || "09:00"} - {br.closing_time || "18:00"}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">
                      {br.grace_period_mins || 15} Minutes
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {br.workingDays || br.working_days || "Mon - Fri"}
                    </td>
                    <td className="py-3 px-3 font-bold text-amber-700">
                      {br.weekly_off || "Sunday"}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">
                      {br.half_day_hours || 4.5} hrs minimum
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleOpenPolicyModal(br)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition cursor-pointer"
                      >
                        Edit Hours
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Holiday Calendars */}
      {activeSubTab === "holidays" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">Branch-Wise & Regional Holiday Calendars</h3>
              <p className="text-xs text-slate-500 mt-0.5">Assign holidays specific to branch locations or applicable to all company branches.</p>
            </div>
            <button
              onClick={() => setIsHolidayModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
              <span>+ Add Branch Holiday</span>
            </button>
          </div>

          {displayedHolidays.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl">
              <CalendarDaysIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              No branch-specific holidays recorded yet. Click "+ Add Branch Holiday" to add regional dates.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Holiday Name</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Applicable Branch</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Mandatory</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedHolidays.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-extrabold text-slate-900">{h.holiday_name}</td>
                      <td className="py-3 px-3 font-bold text-blue-700">{h.holiday_date}</td>
                      <td className="py-3 px-3 font-semibold text-slate-700">{h.branch_name || "All Branches"}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          {h.holiday_type || "Regional"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {h.is_mandatory ? (
                          <span className="text-emerald-700 font-bold text-[10px]">✓ Mandatory</span>
                        ) : (
                          <span className="text-slate-400 font-medium text-[10px]">Optional</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDeleteHoliday(h.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Holiday"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: Attendance Policies */}
      {activeSubTab === "policies" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">Branch-Wise Attendance Policies</h3>
              <p className="text-xs text-slate-500 mt-0.5">Control arrival tolerance, minimum work hours, and geo-fencing restrictions per facility.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedBranches.map((br) => (
              <div key={br.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="font-extrabold text-xs text-slate-900">{br.branchName || br.branch_name}</h4>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    Policy Active
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Late Grace Window:</span>
                    <span className="font-bold text-slate-800">{br.grace_period_mins || 15} Mins</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Half-Day Threshold:</span>
                    <span className="font-bold text-slate-800">{br.half_day_hours || 4.5} Hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Full-Day Minimum:</span>
                    <span className="font-bold text-slate-800">{br.full_day_hours || 8.5} Hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Geo-Fencing:</span>
                    <span className={`font-bold ${br.geo_fencing ? "text-emerald-600" : "text-slate-400"}`}>
                      {br.geo_fencing ? `Enabled (${br.geo_radius || 200}m)` : "Disabled"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Punch Methods:</span>
                    <span className="font-bold text-indigo-700">QR Code / Biometric</span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenPolicyModal(br)}
                  className="w-full mt-2 py-1.5 text-center text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition cursor-pointer"
                >
                  Configure Attendance Policy
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: Payroll & Compliance */}
      {activeSubTab === "payroll" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">Branch-Wise Payroll & Statutory Configurations</h3>
              <p className="text-xs text-slate-500 mt-0.5">Map state-level Professional Tax (PT) rules and operational cost centers per branch.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Branch</th>
                  <th className="py-2.5 px-3">State / Location</th>
                  <th className="py-2.5 px-3">PT State Slab Rule</th>
                  <th className="py-2.5 px-3">Cost Center Code</th>
                  <th className="py-2.5 px-3">ESI/PF Sub-Code</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedBranches.map((br) => (
                  <tr key={br.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-extrabold text-slate-900">{br.branchName || br.branch_name}</td>
                    <td className="py-3 px-3 text-slate-700 font-medium">{br.state || "Default State"}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        {br.pt_state || br.state || "Madhya Pradesh"}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">
                      {br.cost_center || `CC-${(br.branchCode || 'BR').toUpperCase()}`}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      Standard Corporate
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleOpenPolicyModal(br)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition cursor-pointer"
                      >
                        Edit Payroll
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: Employee Transfers & Transfer History */}
      {activeSubTab === "transfers" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">Employee Branch Transfers & Audit History</h3>
              <p className="text-xs text-slate-500 mt-0.5">Transfer employees across operational branches and inspect all historical transfer records.</p>
            </div>
            <button
              onClick={() => handleOpenTransferModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <ArrowsRightLeftIcon className="w-4 h-4" />
              <span>Initiate Employee Transfer</span>
            </button>
          </div>

          {transferHistory.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-xs bg-slate-50 rounded-xl">
              <ArrowsRightLeftIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              No employee branch transfers logged yet. Use "Initiate Employee Transfer" to move personnel between facilities.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Employee Name</th>
                    <th className="py-2.5 px-3">From Branch</th>
                    <th className="py-2.5 px-3">To Branch</th>
                    <th className="py-2.5 px-3">Effective Date</th>
                    <th className="py-2.5 px-3">Reason / Remarks</th>
                    <th className="py-2.5 px-3">Transferred By</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transferHistory.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-extrabold text-slate-900">
                        {t.employee_name}
                        {t.employee_code && <span className="block text-[10px] text-slate-400 font-mono font-normal">{t.employee_code}</span>}
                      </td>
                      <td className="py-3 px-3 font-semibold text-rose-700">
                        {t.from_branch_name || "Headquarters"}
                      </td>
                      <td className="py-3 px-3 font-semibold text-emerald-700">
                        → {t.to_branch_name}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700 font-medium">
                        {t.effective_date}
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                        {t.reason || "Operational Transfer"}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {t.transferred_by || "Admin"}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {t.status || "Completed"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 7: Branch Reporting & Analytics */}
      {activeSubTab === "reports" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">Branch-Wise Analytics & Resource Allocation Report</h3>
              <p className="text-xs text-slate-500 mt-0.5">Consolidated summary of personnel headcount, operational status, and facility utilization.</p>
            </div>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>Download CSV Report</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedBranches.map((br) => {
              const count = getBranchHeadcount(br);
              const pct = employees.length > 0 ? Math.round((count / employees.length) * 100) : 0;
              const status = br.status || "Active";

              return (
                <div key={br.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-sm text-slate-900">{br.branchName || br.branch_name}</h4>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Code: {br.branchCode || br.branch_code}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                      status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}>
                      {status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Headcount Share</span>
                      <span>{count} / {employees.length} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Branch Manager</span>
                      <span className="font-bold text-slate-800 truncate block">{br.manager || "Not Assigned"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">PT State Slab</span>
                      <span className="font-bold text-slate-800 truncate block">{br.pt_state || br.state || "Madhya Pradesh"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: TRANSFER EMPLOYEE
          ========================================================================= */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <ArrowsRightLeftIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Transfer Employee to Another Branch</h3>
                  <p className="text-[11px] text-slate-400">Reassign employee branch location with complete audit logging.</p>
                </div>
              </div>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {transferMsg.error && <p className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold">{transferMsg.error}</p>}
            {transferMsg.success && <p className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-bold">{transferMsg.success}</p>}

            <form onSubmit={handleExecuteTransfer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Employee <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={transferForm.employeeId}
                  onChange={(e) => setTransferForm({ ...transferForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employee_name || emp.employeeName} ({emp.employeeCode || emp.emp_code || 'ID'}) • Current: {emp.branchName || emp.branch || 'Headquarters'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Destination Branch <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={transferForm.targetBranchId}
                  onChange={(e) => setTransferForm({ ...transferForm, targetBranchId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose Destination Branch --</option>
                  {allBranches.map(br => (
                    <option key={br.id} value={br.id} disabled={br.status === "Inactive"}>
                      {br.branchName || br.branch_name} {br.status === "Inactive" ? "(Inactive - Disabled)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Effective Transfer Date <span className="text-rose-500">*</span></label>
                <input
                  type="date"
                  required
                  value={transferForm.effectiveDate}
                  onChange={(e) => setTransferForm({ ...transferForm, effectiveDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Transfer Reason / Remarks</label>
                <textarea
                  rows={2}
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                  placeholder="e.g. Operational requirement, promotion, regional expansion..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferSubmitting}
                  className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer"
                >
                  {transferSubmitting ? "Transferring..." : "Confirm & Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: CONFIGURE BRANCH POLICIES (WORKING HOURS, ATTENDANCE, MANAGER)
          ========================================================================= */}
      {isPolicyModalOpen && selectedBranchForPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <PencilSquareIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Configure Policies: {selectedBranchForPolicy.branchName || selectedBranchForPolicy.branch_name}</h3>
                  <p className="text-[11px] text-slate-400">Manage working hours, manager, attendance tolerance, and payroll settings.</p>
                </div>
              </div>
              <button onClick={() => setIsPolicyModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {policyMsg.error && <p className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold">{policyMsg.error}</p>}
            {policyMsg.success && <p className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-bold">{policyMsg.success}</p>}

            <form onSubmit={handleSavePolicy} className="space-y-4 text-xs">
              {/* Section 1: Activation & Manager */}
              <div className="p-3.5 bg-slate-50 rounded-2xl space-y-3">
                <h4 className="font-black text-[11px] uppercase tracking-wider text-slate-700">1. Facility Status & Branch Manager</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Branch Status</label>
                    <select
                      value={policyForm.status}
                      onChange={(e) => setPolicyForm({ ...policyForm, status: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-slate-800"
                    >
                      <option value="Active">Active (Operational)</option>
                      <option value="Inactive">Inactive (Deactivated)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Assign Branch Manager</label>
                    <input
                      type="text"
                      value={policyForm.manager}
                      onChange={(e) => setPolicyForm({ ...policyForm, manager: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Working Hours & Shifts */}
              <div className="p-3.5 bg-slate-50 rounded-2xl space-y-3">
                <h4 className="font-black text-[11px] uppercase tracking-wider text-slate-700">2. Working Hours & Weekly Off</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Opening Time</label>
                    <input
                      type="time"
                      value={policyForm.opening_time}
                      onChange={(e) => setPolicyForm({ ...policyForm, opening_time: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Closing Time</label>
                    <input
                      type="time"
                      value={policyForm.closing_time}
                      onChange={(e) => setPolicyForm({ ...policyForm, closing_time: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Weekly Off</label>
                    <select
                      value={policyForm.weekly_off}
                      onChange={(e) => setPolicyForm({ ...policyForm, weekly_off: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-slate-800"
                    >
                      <option value="Sunday">Sunday</option>
                      <option value="Saturday, Sunday">Saturday & Sunday</option>
                      <option value="Friday">Friday</option>
                      <option value="None">None</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Grace Period (Mins)</label>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={policyForm.grace_period_mins}
                      onChange={(e) => setPolicyForm({ ...policyForm, grace_period_mins: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Attendance Thresholds & Geo-Fencing */}
              <div className="p-3.5 bg-slate-50 rounded-2xl space-y-3">
                <h4 className="font-black text-[11px] uppercase tracking-wider text-slate-700">3. Attendance Policy & Geo-Fencing</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Half-Day Min (Hours)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={policyForm.half_day_hours}
                      onChange={(e) => setPolicyForm({ ...policyForm, half_day_hours: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full-Day Min (Hours)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={policyForm.full_day_hours}
                      onChange={(e) => setPolicyForm({ ...policyForm, full_day_hours: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Geo-Fence Radius (Meters)</label>
                    <input
                      type="number"
                      value={policyForm.geo_radius}
                      onChange={(e) => setPolicyForm({ ...policyForm, geo_radius: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Payroll & Statutory */}
              <div className="p-3.5 bg-slate-50 rounded-2xl space-y-3">
                <h4 className="font-black text-[11px] uppercase tracking-wider text-slate-700">4. Payroll, Cost Center & Professional Tax</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Professional Tax State</label>
                    <input
                      type="text"
                      value={policyForm.pt_state}
                      onChange={(e) => setPolicyForm({ ...policyForm, pt_state: e.target.value })}
                      placeholder="e.g. Madhya Pradesh, Maharashtra, Karnataka"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Branch Cost Center Code</label>
                    <input
                      type="text"
                      value={policyForm.cost_center}
                      onChange={(e) => setPolicyForm({ ...policyForm, cost_center: e.target.value })}
                      placeholder="e.g. CC-BHOPAL-01"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPolicyModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={policySubmitting}
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
                >
                  {policySubmitting ? "Saving..." : "Save Branch Policies"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: ADD BRANCH HOLIDAY
          ========================================================================= */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-sm text-slate-900">Add Regional / Branch Holiday</h3>
              </div>
              <button onClick={() => setIsHolidayModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddHoliday} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Applicable Branch</label>
                <select
                  value={holidayForm.branchId}
                  onChange={(e) => setHolidayForm({ ...holidayForm, branchId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-slate-800"
                >
                  <option value="">All Branches (Company-Wide Holiday)</option>
                  {allBranches.map(b => (
                    <option key={b.id} value={b.id}>{b.branchName || b.branch_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Holiday Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State Foundation Day / Regional Festival"
                  value={holidayForm.holidayName}
                  onChange={(e) => setHolidayForm({ ...holidayForm, holidayName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Holiday Date <span className="text-rose-500">*</span></label>
                <input
                  type="date"
                  required
                  value={holidayForm.holidayDate}
                  onChange={(e) => setHolidayForm({ ...holidayForm, holidayDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Holiday Type</label>
                <select
                  value={holidayForm.holidayType}
                  onChange={(e) => setHolidayForm({ ...holidayForm, holidayType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-800"
                >
                  <option value="Regional">Regional / State Holiday</option>
                  <option value="National">National Holiday</option>
                  <option value="Restricted">Restricted / Optional Holiday</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsHolidayModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={holidaySubmitting}
                  className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
                >
                  {holidaySubmitting ? "Saving..." : "Add Holiday"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branch;
