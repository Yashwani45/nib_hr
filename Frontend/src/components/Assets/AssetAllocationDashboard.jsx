import React, { useState, useEffect, useMemo } from "react";
import {
  CubeIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  FunnelIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  DevicePhoneMobileIcon,
  IdentificationIcon,
  KeyIcon,
  SignalIcon,
  CommandLineIcon,
  ComputerDesktopIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon
} from "@heroicons/react/24/outline";
import { apiFetch } from "../../services/hrApi";
import { useAuth } from "../../auth/AuthProvider";

// Helper to format date strings to DD-MM-YYYY
const formatDate = (dateStr) => {
  if (!dateStr || dateStr === "—" || dateStr === "N/A") return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateStr;
  }
};

// Helper to get category icon and color
const getCategoryIcon = (category) => {
  const cat = String(category || "").toLowerCase();
  if (cat.includes("laptop") || cat.includes("computer") || cat.includes("macbook")) {
    return { icon: "💻", label: "Laptop", type: "Hardware / Compute" };
  }
  if (cat.includes("mobile") || cat.includes("phone") || cat.includes("iphone")) {
    return { icon: "📱", label: "Mobile", type: "Mobile Device" };
  }
  if (cat.includes("sim")) {
    return { icon: "📶", label: "SIM Card", type: "Telecommunication" };
  }
  if (cat.includes("id card") || cat.includes("identity")) {
    return { icon: "🪪", label: "ID Card", type: "Identity & Badge" };
  }
  if (cat.includes("access") || cat.includes("rfid") || cat.includes("key")) {
    return { icon: "🔑", label: "Access Card", type: "Physical Security" };
  }
  if (cat.includes("license") || cat.includes("software")) {
    return { icon: "💾", label: "Software License", type: "Digital License" };
  }
  if (cat.includes("monitor") || cat.includes("display")) {
    return { icon: "🖥️", label: "Monitor", type: "Peripheral / Display" };
  }
  if (cat.includes("printer")) {
    return { icon: "🖨️", label: "Printer", type: "Office Equipment" };
  }
  return { icon: "📦", label: "Other", type: "Hardware Equipment" };
};

export default function AssetAllocationDashboard({
  records: externalRecords,
  onOpenEdit,
  onDelete,
  onAllocateNew,
  onRefreshData,
  dbData,
  title = "Asset Allocation",
  subtitle = "Manage and configure Asset Allocation records, settings, and operations.",
  initialScope = "auto" // 'my', 'all', or 'auto'
}) {
  const { user } = useAuth();
  const [internalRecords, setInternalRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());

  // Modal & Persistence States
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [editTargetAsset, setEditTargetAsset] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [toastBanner, setToastBanner] = useState(null);
  const [employeeOptions, setEmployeeOptions] = useState([]);

  const defaultFormData = {
    assetCode: "",
    assetName: "",
    assetCategory: "Laptop",
    assetType: "Hardware / Compute",
    model: "",
    serialNumber: "",
    employee: "",
    empId: "",
    department: "IT",
    status: "Assigned",
    issueDate: new Date().toISOString().split("T")[0],
    warrantyExpiry: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    purchaseCost: "",
    vendor: "",
    operatingSystem: "Windows 11 Pro",
    processor: "Intel Core i7",
    memory: "16 GB",
    storage: "512 GB SSD"
  };

  const [allocateFormData, setAllocateFormData] = useState(defaultFormData);

  // Filter States
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDept, setFilterDept] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [uniquePersonsOnly, setUniquePersonsOnly] = useState(true);

  // Pagination states
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // User role & identity resolution
  const userRole = typeof user?.role === "object" ? user?.role?.name : user?.role;
  const isEmployee = String(userRole || "").toLowerCase().trim() === "employee";
  const userEmail = String(user?.email || "").toLowerCase().trim();
  const isAdminUser = !isEmployee || userEmail.includes("admin") || userEmail.includes("yashtech");

  // Load employee directory for dropdown selection
  useEffect(() => {
    const loadEmployees = async () => {
      if (dbData?.employees && Array.isArray(dbData.employees) && dbData.employees.length > 0) {
        setEmployeeOptions(dbData.employees);
        return;
      }
      try {
        const res = await apiFetch("/api/table/employees");
        if (res?.data && Array.isArray(res.data)) {
          setEmployeeOptions(res.data);
        }
      } catch (e) {}
    };
    loadEmployees();
  }, [dbData]);

  // View Mode: 'my' (My Assigned Assets) vs 'all' (All Company Assets)
  const [viewScope, setViewScope] = useState(() => {
    if (initialScope === "my") return "my";
    if (initialScope === "all") return "all";
    return isEmployee ? "my" : "all";
  });

  // Fetch records if not provided externally or when requested
  const fetchAssetRecords = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/table/asset_allocation?all=true");
      if (res?.data && Array.isArray(res.data)) {
        setInternalRecords(res.data);
      }
    } catch (err) {
      console.warn("Could not fetch assets via API, using fallback data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (externalRecords && externalRecords.length > 0) {
      setInternalRecords(externalRecords);
    } else {
      fetchAssetRecords();
    }
  }, [externalRecords]);

  // Combine or choose active record set
  const allRecords = useMemo(() => {
    if (internalRecords && internalRecords.length > 0) {
      return internalRecords;
    }
    if (externalRecords && externalRecords.length > 0) {
      return externalRecords;
    }
    return [];
  }, [externalRecords, internalRecords]);

  // Open Modal in Create / Allocate Mode
  const handleOpenAllocateModal = () => {
    const nextCodeNum = Math.floor(10 + Math.random() * 90);
    setEditTargetAsset(null);
    setAllocateFormData({
      ...defaultFormData,
      assetCode: `AST-LAP-0${nextCodeNum}`,
      serialNumber: `SN-${Date.now().toString().slice(-6)}`
    });
    setModalError("");
    setShowAllocateModal(true);
  };

  // Open Modal in Edit Mode
  const handleOpenEditModal = (asset) => {
    setEditTargetAsset(asset);
    setAllocateFormData({
      assetCode: asset.assetCode || asset.asset_code || "",
      assetName: asset.assetName || asset.asset_name || "",
      assetCategory: asset.assetCategory || asset.asset_category || "Laptop",
      assetType: asset.assetType || getCategoryIcon(asset.assetCategory || asset.asset_category).type,
      model: asset.model || "",
      serialNumber: asset.serialNumber || asset.serial_number || "",
      employee: asset.employee || "",
      empId: asset.empId || asset.emp_id || "",
      department: asset.department || "IT",
      status: asset.status || "Assigned",
      issueDate: asset.issueDate ? String(asset.issueDate).slice(0, 10) : (asset.issue_date ? String(asset.issue_date).slice(0, 10) : new Date().toISOString().split("T")[0]),
      warrantyExpiry: asset.warrantyExpiry ? String(asset.warrantyExpiry).slice(0, 10) : "",
      purchaseDate: asset.purchaseDate ? String(asset.purchaseDate).slice(0, 10) : "",
      purchaseCost: asset.purchaseCost || "",
      vendor: asset.vendor || "",
      operatingSystem: asset.operatingSystem || asset.operating_system || "",
      processor: asset.processor || "",
      memory: asset.memory || "",
      storage: asset.storage || ""
    });
    setModalError("");
    setShowAllocateModal(true);
  };

  // Handle Employee Dropdown Selection in Modal
  const handleEmployeeSelect = (val) => {
    if (!val) {
      setAllocateFormData(prev => ({ ...prev, employee: "", empId: "" }));
      return;
    }
    const found = employeeOptions.find(e => {
      const code = e.employeeCode || e.emp_code || e.empId || e.id;
      const name = e.employeeName || e.employee_name || `${e.firstName || ""} ${e.lastName || ""}`.trim() || e.name;
      return String(code) === String(val) || String(name) === String(val);
    });
    if (found) {
      const name = found.employeeName || found.employee_name || `${found.firstName || ""} ${found.lastName || ""}`.trim() || found.name;
      const code = found.employeeCode || found.emp_code || found.empId || found.id;
      setAllocateFormData(prev => ({
        ...prev,
        employee: name,
        empId: code,
        department: found.department || prev.department,
        status: "Assigned"
      }));
    } else {
      setAllocateFormData(prev => ({
        ...prev,
        employee: val,
        status: "Assigned"
      }));
    }
  };

  // Save Asset to MySQL Database (POST / PUT)
  const handleSaveAssetAllocation = async (e) => {
    if (e) e.preventDefault();
    if (!allocateFormData.assetName || !allocateFormData.assetName.trim()) {
      setModalError("Asset Name is required.");
      return;
    }

    const categoryMeta = getCategoryIcon(allocateFormData.assetCategory);
    const payload = {
      assetCode: allocateFormData.assetCode || `AST-${String(allocateFormData.assetCategory || 'GEN').substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      assetName: allocateFormData.assetName.trim(),
      assetCategory: allocateFormData.assetCategory || "Laptop",
      assetType: allocateFormData.assetType || categoryMeta.type,
      model: allocateFormData.model || "",
      serialNumber: allocateFormData.serialNumber || `SN-${Date.now().toString().slice(-6)}`,
      employee: allocateFormData.employee ? allocateFormData.employee.trim() : (allocateFormData.status === "Assigned" ? "Assigned Employee" : "Unassigned"),
      empId: allocateFormData.empId || "",
      department: allocateFormData.department || "IT",
      status: allocateFormData.status || "Assigned",
      issueDate: allocateFormData.issueDate || new Date().toISOString().split("T")[0],
      warrantyExpiry: allocateFormData.warrantyExpiry || null,
      purchaseDate: allocateFormData.purchaseDate || null,
      purchaseCost: allocateFormData.purchaseCost ? Number(allocateFormData.purchaseCost) : null,
      vendor: allocateFormData.vendor || null,
      operatingSystem: allocateFormData.operatingSystem || null,
      processor: allocateFormData.processor || null,
      memory: allocateFormData.memory || null,
      storage: allocateFormData.storage || null
    };

    setIsSaving(true);
    setModalError("");

    try {
      if (editTargetAsset && editTargetAsset.id) {
        await apiFetch(`/api/table/asset_allocation/${editTargetAsset.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        setInternalRecords(prev => prev.map(r => r.id === editTargetAsset.id ? { ...r, ...payload } : r));
        setToastBanner({ type: "success", text: `Asset "${payload.assetName}" (${payload.assetCode}) updated successfully in database!` });
      } else {
        const createRes = await apiFetch("/api/table/asset_allocation", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        const createdRecord = createRes?.data || { ...payload, id: `ast-${Date.now()}` };
        setInternalRecords(prev => [createdRecord, ...prev]);
        setToastBanner({ type: "success", text: `New asset "${payload.assetName}" (${payload.assetCode}) allocated and saved to database successfully!` });
      }

      setShowAllocateModal(false);
      if (onRefreshData) onRefreshData();
      fetchAssetRecords();
    } catch (err) {
      console.error("Save asset allocation error:", err);
      setModalError(err.message || "Failed to save asset allocation to database.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Asset from MySQL Database (DELETE)
  const handleDeleteAsset = async (id, assetName) => {
    if (window.confirm(`Are you sure you want to delete "${assetName || "this asset"}" from the allocation registry?`)) {
      try {
        await apiFetch(`/api/table/asset_allocation/${id}`, { method: "DELETE" });
        setInternalRecords(prev => prev.filter(r => r.id !== id));
        setToastBanner({ type: "success", text: `Asset "${assetName || id}" deleted successfully from database.` });
        if (onRefreshData) onRefreshData();
        fetchAssetRecords();
      } catch (err) {
        console.error("Failed to delete asset:", err);
        alert("Failed to delete asset from database: " + err.message);
      }
    }
  };

  // Scope filter: If viewScope === 'my', filter to records matching current logged-in employee
  const scopedRecords = useMemo(() => {
    if (viewScope === "all" || (!isEmployee && isAdminUser && viewScope !== "my")) {
      return allRecords;
    }

    // Match by employeeCode, email, username or name
    const loginUserIdentifier = String(user?.username || user?.email?.split("@")[0] || "").toLowerCase().trim();
    const loginEmail = String(user?.email || "").toLowerCase().trim();

    return allRecords.filter((item) => {
      const empId = String(item.empId || item.employeeCode || item.employeeId || "").toLowerCase().trim();
      const empName = String(item.employee || item.employeeName || item.name || "").toLowerCase().trim();
      const empEmail = String(item.email || item.companyEmail || "").toLowerCase().trim();

      return (
        (empId && (empId === "tvn2007" || empId === loginUserIdentifier)) ||
        (empEmail && empEmail === loginEmail) ||
        (loginUserIdentifier && empName.includes(loginUserIdentifier)) ||
        (loginUserIdentifier.includes("yashwani") && (empName.includes("yashwani") || empId === "tvn2007"))
      );
    });
  }, [allRecords, viewScope, isEmployee, isAdminUser, user]);

  // Dynamic Statistics
  const stats = useMemo(() => {
    const recordsToCalculate = viewScope === "my" ? scopedRecords : allRecords;
    const total = recordsToCalculate.length;
    const assigned = recordsToCalculate.filter((r) => {
      const s = String(r.status || "").toLowerCase();
      return s === "assigned" || s === "allocated";
    }).length;
    const available = recordsToCalculate.filter((r) => {
      const s = String(r.status || "").toLowerCase();
      return s === "available" || s === "in stock" || s === "returned";
    }).length;
    const maintenance = recordsToCalculate.filter((r) => {
      const s = String(r.status || "").toLowerCase();
      return s.includes("maintenance") || s.includes("repair");
    }).length;
    const retired = recordsToCalculate.filter((r) => {
      const s = String(r.status || "").toLowerCase();
      return s.includes("retired") || s.includes("scrap") || s.includes("disposed");
    }).length;

    return { total, assigned, available, maintenance, retired };
  }, [allRecords, scopedRecords, viewScope]);

  // Categories with count badges
  const categoryTabs = [
    { key: "All", label: "All Assets", icon: "🖥️" },
    { key: "Laptop", label: "Laptop", icon: "💻" },
    { key: "Mobile", label: "Mobile", icon: "📱" },
    { key: "SIM Card", label: "SIM Card", icon: "📶" },
    { key: "ID Card", label: "ID Card", icon: "🪪" },
    { key: "Access Card", label: "Access Card", icon: "🔑" },
    { key: "Software License", label: "Software License", icon: "💾" },
    { key: "Other", label: "Other", icon: "⋯" }
  ];

  // Dynamic Department list
  const departments = useMemo(() => {
    const depts = new Set(scopedRecords.map((r) => r.department).filter(Boolean));
    return ["All", ...Array.from(depts)];
  }, [scopedRecords]);

  // Filtered Records based on user filters
  const filteredRecords = useMemo(() => {
    return scopedRecords.filter((item) => {
      // Category filter
      let categoryMatch = true;
      if (filterCategory !== "All") {
        const itemCat = String(item.assetCategory || "").toLowerCase();
        if (filterCategory === "Other") {
          const known = ["laptop", "mobile", "sim card", "id card", "access card", "software license"];
          categoryMatch = !known.some((k) => itemCat.includes(k));
        } else {
          categoryMatch = itemCat.includes(filterCategory.toLowerCase());
        }
      }

      // Status filter
      let statusMatch = true;
      if (filterStatus !== "All") {
        const itemStatus = String(item.status || "").toLowerCase();
        if (filterStatus === "Assigned") {
          statusMatch = itemStatus === "assigned" || itemStatus === "allocated";
        } else if (filterStatus === "Available") {
          statusMatch = itemStatus === "available" || itemStatus === "returned" || itemStatus === "in stock";
        } else if (filterStatus === "Maintenance") {
          statusMatch = itemStatus.includes("maintenance") || itemStatus.includes("repair");
        } else if (filterStatus === "Retired") {
          statusMatch = itemStatus.includes("retired") || itemStatus.includes("scrap");
        }
      }

      // Department filter
      const deptMatch =
        filterDept === "All" ||
        String(item.department || "").toLowerCase() === filterDept.toLowerCase();

      // Search Query
      const q = searchQuery.toLowerCase().trim();
      const searchMatch =
        !q ||
        String(item.assetName || "").toLowerCase().includes(q) ||
        String(item.assetCode || "").toLowerCase().includes(q) ||
        String(item.serialNumber || "").toLowerCase().includes(q) ||
        String(item.employee || "").toLowerCase().includes(q) ||
        String(item.empId || "").toLowerCase().includes(q) ||
        String(item.department || "").toLowerCase().includes(q);

      return categoryMatch && statusMatch && deptMatch && searchMatch;
    });

    if (!uniquePersonsOnly) return list;

    // Deduplicate so the same person is NOT repeated
    const seenPersons = new Set();
    return list.filter((item) => {
      const personKey = String(item.empId || item.employee || "").toLowerCase().trim();
      if (!personKey || personKey === "unassigned" || personKey.includes("stock") || personKey.includes("available")) {
        return true; // Keep distinct inventory/stock items
      }
      if (seenPersons.has(personKey)) {
        return false; // Prevent duplicate person
      }
      seenPersons.add(personKey);
      return true;
    });
  }, [scopedRecords, filterCategory, filterStatus, filterDept, searchQuery, uniquePersonsOnly]);

  // Paginated records
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;

  // Reset Filters
  const handleResetFilters = () => {
    setFilterCategory("All");
    setFilterStatus("All");
    setFilterDept("All");
    setSearchQuery("");
    setUniquePersonsOnly(true);
    setCurrentPage(1);
    setSelectedRows(new Set());
  };

  // Row selection
  const handleToggleSelectAll = () => {
    if (selectedRows.size === paginatedRecords.length && paginatedRecords.length > 0) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedRecords.map((r) => r.id)));
    }
  };

  const handleToggleSelectRow = (id) => {
    const next = new Set(selectedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRows(next);
  };

  // Export CSV helper
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;
    const headers = [
      "Asset Code",
      "Asset Name",
      "Category",
      "Assigned To",
      "Employee ID",
      "Department",
      "Purchase Date",
      "Warranty Expiry",
      "Status",
      "Serial Number"
    ];
    const rows = filteredRecords.map((r) => [
      `"${r.assetCode || ""}"`,
      `"${r.assetName || ""}"`,
      `"${r.assetCategory || ""}"`,
      `"${r.employee || ""}"`,
      `"${r.empId || ""}"`,
      `"${r.department || ""}"`,
      `"${formatDate(r.purchaseDate || r.issueDate)}"`,
      `"${formatDate(r.warrantyExpiry)}"`,
      `"${r.status || "Assigned"}"`,
      `"${r.serialNumber || ""}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Asset_Allocation_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* Toast Feedback Notification Banner */}
      {toastBanner && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold border shadow-xs transition animate-fade-in ${
          toastBanner.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="text-base">{toastBanner.type === "success" ? "✅" : "⚠️"}</span>
            <span>{toastBanner.text}</span>
          </div>
          <button onClick={() => setToastBanner(null)} className="text-slate-400 hover:text-slate-700 font-bold text-sm px-2 cursor-pointer">✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP HEADER BANNER (Matching Modern High-Fidelity Banner with Devices) */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            {/* 3D Isometric Blue Cube Icon */}
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/25 text-white shrink-0">
              <svg className="w-8 h-8 drop-shadow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{title}</h2>
                {viewScope === "my" ? (
                  <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-blue-200 tracking-wider">
                    My Assets ({scopedRecords.length})
                  </span>
                ) : (
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-indigo-200 tracking-wider">
                    Company Inventory ({allRecords.length})
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Right Action Bar & View Scope Switcher */}
          <div className="flex items-center gap-2.5 flex-wrap self-stretch md:self-auto justify-end">
            {/* View Scope Toggle (Visible for all to easily view my vs all) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-bold">
              <button
                onClick={() => { setViewScope("my"); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewScope === "my"
                    ? "bg-white text-blue-600 shadow-xs font-black"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                👤 My Assets
              </button>
              <button
                onClick={() => { setViewScope("all"); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewScope === "all"
                    ? "bg-white text-indigo-600 shadow-xs font-black"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                🏢 All Company Assets
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchAssetRecords}
              disabled={loading}
              title="Refresh Asset Records"
              className="p-2 bg-white border border-slate-200/80 hover:bg-slate-50 rounded-xl text-slate-600 hover:text-indigo-600 transition shadow-xs cursor-pointer"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            </button>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              title="Export Current Assets to CSV"
              className="p-2 bg-white border border-slate-200/80 hover:bg-slate-50 rounded-xl text-slate-600 hover:text-emerald-600 transition shadow-xs cursor-pointer"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
            </button>

            {/* Allocate New Asset Button (Admin/HR) */}
            {(isAdminUser || onAllocateNew) && (
              <button
                onClick={() => onAllocateNew ? onAllocateNew() : handleOpenAllocateModal()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <PlusIcon className="w-4 h-4" />
                <span>+ Allocate Asset</span>
              </button>
            )}
          </div>
        </div>

        {/* Isometric Device Graphic Decoration (Aligned Right) */}
        <div className="hidden lg:block absolute right-6 -bottom-4 opacity-25 pointer-events-none transform scale-90 origin-bottom-right">
          <svg width="220" height="110" viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="20" width="120" height="80" rx="8" fill="#4F46E5" fillOpacity="0.15" stroke="#4F46E5" strokeWidth="2.5" />
            <rect x="30" y="30" width="100" height="60" rx="4" fill="#3B82F6" fillOpacity="0.2" />
            <line x1="80" y1="100" x2="80" y2="125" stroke="#4F46E5" strokeWidth="4" strokeLinecap="round" />
            <path d="M55 125H105" stroke="#4F46E5" strokeWidth="4" strokeLinecap="round" />
            <rect x="150" y="45" width="80" height="55" rx="6" fill="#6366F1" fillOpacity="0.15" stroke="#6366F1" strokeWidth="2" />
            <path d="M140 100L150 100H230L240 100" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" />
            <rect x="235" y="60" width="28" height="45" rx="4" fill="#10B981" fillOpacity="0.2" stroke="#10B981" strokeWidth="2" />
            <circle cx="249" cy="98" r="2.5" fill="#10B981" />
          </svg>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FIVE METRIC CARDS (TOTAL, ASSIGNED, AVAILABLE, MAINTENANCE, RETIRED)   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Assets Card */}
        <div className="bg-white p-4 rounded-2xl border-l-4 border-l-blue-600 border border-slate-200/70 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition">
          <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base shrink-0 shadow-inner">
            <CubeIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
              Total Assets
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight">
              {stats.total}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold block">
              {viewScope === "my" ? "Personal Assigned" : "Registered Stock"}
            </span>
          </div>
        </div>

        {/* Assigned Card */}
        <div className="bg-white p-4 rounded-2xl border-l-4 border-l-emerald-500 border border-slate-200/70 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base shrink-0 shadow-inner">
            <CheckCircleIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
              Assigned
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight">
              {stats.assigned}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold block">
              Active In Use
            </span>
          </div>
        </div>

        {/* Available Card */}
        <div className="bg-white p-4 rounded-2xl border-l-4 border-l-purple-500 border border-slate-200/70 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition">
          <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-base shrink-0 shadow-inner">
            <ShieldCheckIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
              Available
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight">
              {stats.available}
            </span>
            <span className="text-[10px] text-purple-600 font-bold block">
              Ready to Allocate
            </span>
          </div>
        </div>

        {/* Under Maintenance Card */}
        <div className="bg-white p-4 rounded-2xl border-l-4 border-l-amber-500 border border-slate-200/70 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition">
          <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-base shrink-0 shadow-inner">
            <WrenchScrewdriverIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
              Maintenance
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight">
              {stats.maintenance}
            </span>
            <span className="text-[10px] text-amber-600 font-bold block">
              Under Service
            </span>
          </div>
        </div>

        {/* Retired Card */}
        <div className="bg-white p-4 rounded-2xl border-l-4 border-l-rose-500 border border-slate-200/70 shadow-xs flex items-center gap-3.5 col-span-2 md:col-span-1 hover:shadow-sm transition">
          <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-base shrink-0 shadow-inner">
            <XMarkIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
              Retired
            </span>
            <span className="text-xl font-black text-slate-900 block leading-tight">
              {stats.retired}
            </span>
            <span className="text-[10px] text-rose-600 font-bold block">
              Decommissioned
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ADVANCED FILTERS PANEL (4-Fields with Reset & Apply)                   */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-3.5 h-3.5 text-indigo-600" />
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Advanced Filters
            </h4>
          </div>
          {(filterCategory !== "All" || filterStatus !== "All" || filterDept !== "All" || searchQuery) && (
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              Filters Active
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Search Asset / User */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Search Asset / User
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter name, code or S/N..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition shadow-inner"
              />
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Asset Category */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Asset Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition shadow-inner"
            >
              <option value="All">All Categories</option>
              <option value="Laptop">Laptop</option>
              <option value="Mobile">Mobile</option>
              <option value="SIM Card">SIM Card</option>
              <option value="ID Card">ID Card</option>
              <option value="Access Card">Access Card</option>
              <option value="Software License">Software License</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Allocation Status */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Allocation Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition shadow-inner"
            >
              <option value="All">All Statuses</option>
              <option value="Assigned">Assigned</option>
              <option value="Available">Available / Returned</option>
              <option value="Maintenance">Under Maintenance</option>
              <option value="Retired">Retired / Scrapped</option>
            </select>
          </div>

          {/* Department */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Department
            </label>
            <select
              value={filterDept}
              onChange={(e) => { setFilterDept(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition shadow-inner"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === "All" ? "All Departments" : dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Action Buttons & Unique Persons Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/80 transition">
            <input
              type="checkbox"
              checked={uniquePersonsOnly}
              onChange={(e) => { setUniquePersonsOnly(e.target.checked); setCurrentPage(1); }}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
            />
            <span className="flex items-center gap-1.5">
              <span>👤</span>
              <span>Unique Persons Only (No Duplicate Employees)</span>
            </span>
          </label>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Reset Filters
            </button>
            <button
              onClick={() => setCurrentPage(1)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <FunnelIcon className="w-3.5 h-3.5" />
              <span>Apply Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. QUICK CATEGORY TABS & TABLE                                            */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-3 border-b border-slate-100">
          {/* Category Pill Tabs */}
          <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/70">
            {categoryTabs.map((tab) => {
              const isSelected = filterCategory === tab.key;
              const count = scopedRecords.filter((r) => {
                if (tab.key === "All") return true;
                const cat = String(r.assetCategory || "").toLowerCase();
                if (tab.key === "Other") {
                  const known = ["laptop", "mobile", "sim card", "id card", "access card", "software license"];
                  return !known.some((k) => cat.includes(k));
                }
                return cat.includes(tab.key.toLowerCase());
              }).length;

              return (
                <button
                  key={tab.key}
                  onClick={() => { setFilterCategory(tab.key); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-xs font-black"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? "bg-indigo-700/80 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Show Entries Dropdown */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 self-end lg:self-auto">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>
        </div>

        {/* Main Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bold text-slate-600">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] tracking-wider bg-slate-50/50">
                <th className="py-3 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={
                      paginatedRecords.length > 0 &&
                      selectedRows.size === paginatedRecords.length
                    }
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-2">Asset Code</th>
                <th className="py-3 px-2">Asset Name</th>
                <th className="py-3 px-2">Asset Type</th>
                <th className="py-3 px-2">Category</th>
                <th className="py-3 px-2">Assigned To</th>
                <th className="py-3 px-2">Purchase Date</th>
                <th className="py-3 px-2">Warranty Expiry</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-3 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRecords.map((row) => {
                const catMeta = getCategoryIcon(row.assetCategory);
                const isChecked = selectedRows.has(row.id);
                const statusStr = row.status || "Assigned";
                const isAssigned = statusStr === "Assigned" || statusStr === "Allocated";
                const isAvailable = statusStr === "Available" || statusStr === "In Stock" || statusStr === "Returned";
                const isMaint = statusStr.includes("Maintenance") || statusStr.includes("Repair");

                return (
                  <tr
                    key={row.id}
                    className={`hover:bg-slate-50/70 transition ${
                      isChecked ? "bg-indigo-50/30" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSelectRow(row.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>

                    {/* Asset Code */}
                    <td className="py-3.5 px-2 font-mono text-slate-800 text-[11px] font-black whitespace-nowrap">
                      {row.assetCode || "AST-GEN-001"}
                    </td>

                    {/* Asset Name with Category Icon */}
                    <td className="py-3.5 px-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{catMeta.icon}</span>
                        <div>
                          <span className="text-slate-900 font-extrabold block whitespace-nowrap">
                            {row.assetName || "Company Asset"}
                          </span>
                          {row.model && (
                            <span className="text-[10px] text-slate-400 font-semibold block truncate max-w-[150px]">
                              {row.model}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Asset Type */}
                    <td className="py-3.5 px-2 text-slate-600 font-semibold whitespace-nowrap">
                      {row.assetType || catMeta.type}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-2 font-bold text-slate-700 whitespace-nowrap">
                      {row.assetCategory || catMeta.label}
                    </td>

                    {/* Assigned To (Avatar + Name + Subtitle) */}
                    <td className="py-3.5 px-2">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full border border-slate-200 overflow-hidden bg-gradient-to-br from-indigo-100 to-blue-100 text-indigo-700 font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                          {row.employee ? (
                            row.employee.charAt(0).toUpperCase()
                          ) : (
                            <span>📦</span>
                          )}
                        </div>
                        <div>
                          <span className="block text-slate-800 font-black truncate max-w-[130px]">
                            {row.employee || "Unassigned"}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-medium">
                            {row.empId
                              ? `${row.empId} • ${row.department || "IT"}`
                              : "In Stock Inventory"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Purchase Date */}
                    <td className="py-3.5 px-2 text-slate-500 font-semibold whitespace-nowrap">
                      {formatDate(row.purchaseDate || row.issueDate)}
                    </td>

                    {/* Warranty Expiry */}
                    <td className="py-3.5 px-2 text-slate-500 font-semibold whitespace-nowrap">
                      {formatDate(row.warrantyExpiry)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-2 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          isAssigned
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : isAvailable
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : isMaint
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {statusStr}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className="py-3.5 px-3 text-right pr-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {/* View Specs Button */}
                        <button
                          onClick={() => setSelectedAsset(row)}
                          className="p-1.5 rounded-lg border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50 text-blue-600 hover:text-blue-800 transition cursor-pointer"
                          title="View Asset Specifications"
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Button */}
                        {(isAdminUser || onOpenEdit) && (
                          <button
                            onClick={() => onOpenEdit ? onOpenEdit(row) : handleOpenEditModal(row)}
                            className="p-1.5 rounded-lg border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-800 transition cursor-pointer"
                            title="Edit Asset Details"
                          >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete Button */}
                        {(isAdminUser || onDelete) && (
                          <button
                            onClick={() => onDelete ? onDelete(row.id, row.assetName) : handleDeleteAsset(row.id, row.assetName)}
                            className="p-1.5 rounded-lg border border-slate-200/80 hover:border-rose-300 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Delete Asset Record"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedRecords.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
                      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-xl">
                        🔍
                      </div>
                      <p className="text-xs font-bold text-slate-500">
                        No asset records found matching your filters.
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="text-indigo-600 hover:underline text-xs font-bold"
                      >
                        Reset all filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-100 text-xs font-bold text-slate-400">
          <span>
            Showing {filteredRecords.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
            {Math.min(currentPage * pageSize, filteredRecords.length)} of {filteredRecords.length} entries
          </span>

          <div className="flex gap-1 items-center">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer font-bold"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                  currentPage === i + 1
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer font-bold"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. VIEW ASSET SPECIFICATIONS MODAL                                        */}
      {/* ========================================================================= */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto scrollbar-thin animate-fadeIn">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b pb-3 border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-slate-900">
                    Asset Specification Details
                  </h3>
                  <span className="bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-indigo-200">
                    {selectedAsset.assetCode || "AST-001"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Category: {selectedAsset.assetCategory || "General Asset"}
                </p>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center font-black transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Asset Header Info Card */}
            <div className="flex items-center gap-3.5 bg-gradient-to-r from-slate-50 to-indigo-50/30 p-3.5 rounded-2xl border border-slate-200/70">
              <div className="h-12 w-12 rounded-xl bg-white border border-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xl shadow-xs shrink-0">
                {getCategoryIcon(selectedAsset.assetCategory).icon}
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  {selectedAsset.assetName}
                </h4>
                <p className="text-xs text-slate-500 font-bold">
                  Model: {selectedAsset.model || "Enterprise Standard Model"}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Assigned User: {selectedAsset.employee || "Unassigned"} ({selectedAsset.empId || "N/A"})
                </p>
              </div>
            </div>

            {/* Hardware Specifications Grid */}
            <div>
              <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                Hardware Specifications
              </h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="border border-slate-100 p-2.5 rounded-xl bg-slate-50/50">
                  <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-bold">
                    Serial Number
                  </span>
                  <span className="text-slate-800 font-mono font-bold mt-0.5 block truncate">
                    {selectedAsset.serialNumber || "N/A"}
                  </span>
                </div>

                <div className="border border-slate-100 p-2.5 rounded-xl bg-slate-50/50">
                  <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-bold">
                    Operating System
                  </span>
                  <span className="text-slate-800 font-bold mt-0.5 block truncate">
                    {selectedAsset.operatingSystem || selectedAsset.operating_system || selectedAsset.os || "N/A"}
                  </span>
                </div>

                <div className="border border-slate-100 p-2.5 rounded-xl bg-slate-50/50">
                  <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-bold">
                    Processor
                  </span>
                  <span className="text-slate-800 font-bold mt-0.5 block truncate">
                    {selectedAsset.processor || "N/A"}
                  </span>
                </div>

                <div className="border border-slate-100 p-2.5 rounded-xl bg-slate-50/50">
                  <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-bold">
                    Memory (RAM)
                  </span>
                  <span className="text-slate-800 font-bold mt-0.5 block truncate">
                    {selectedAsset.memory || "N/A"}
                  </span>
                </div>

                <div className="border border-slate-100 p-2.5 rounded-xl bg-slate-50/50">
                  <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-bold">
                    Storage Capacity
                  </span>
                  <span className="text-slate-800 font-bold mt-0.5 block truncate">
                    {selectedAsset.storage || "N/A"}
                  </span>
                </div>

                <div className="border border-slate-100 p-2.5 rounded-xl bg-slate-50/50">
                  <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-bold">
                    Display Specs
                  </span>
                  <span className="text-slate-800 font-bold mt-0.5 block truncate">
                    {selectedAsset.display || "N/A"}
                  </span>
                </div>

                <div className="border border-slate-100 p-2.5 rounded-xl bg-slate-50/50">
                  <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-bold">
                    Graphics Card
                  </span>
                  <span className="text-slate-800 font-bold mt-0.5 block truncate">
                    {selectedAsset.graphicsCard || selectedAsset.graphics_card || "N/A"}
                  </span>
                </div>

                <div className="border border-slate-100 p-2.5 rounded-xl bg-slate-50/50">
                  <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-bold">
                    Color / Form Factor
                  </span>
                  <span className="text-slate-800 font-bold mt-0.5 block truncate">
                    {selectedAsset.color || "Standard"}
                  </span>
                </div>
              </div>
            </div>

            {/* Lifecycle & Vendor Info */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 text-xs font-semibold text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Allocation Status:</span>
                <span className="font-bold text-slate-800">{selectedAsset.status || "Assigned"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Purchase / Issue Date:</span>
                <span className="font-bold text-slate-800">{formatDate(selectedAsset.purchaseDate || selectedAsset.issueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Warranty Expiry:</span>
                <span className="font-bold text-slate-800">{formatDate(selectedAsset.warrantyExpiry)}</span>
              </div>
              {selectedAsset.purchaseCost && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Purchase Cost:</span>
                  <span className="font-bold text-slate-800">₹{Number(selectedAsset.purchaseCost).toLocaleString("en-IN")}</span>
                </div>
              )}
              {selectedAsset.vendor && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Vendor:</span>
                  <span className="font-bold text-slate-800">{selectedAsset.vendor}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedAsset(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Close Specs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. ALLOCATE / EDIT ASSET MODAL (Direct DB Persistence via API)            */}
      {/* ========================================================================= */}
      {showAllocateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200/80 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 via-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 font-black text-lg">
                  {editTargetAsset ? "✏️" : "📦"}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">
                    {editTargetAsset ? "Edit Asset Allocation" : "Allocate Asset to Employee"}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {editTargetAsset ? `Modifying ${editTargetAsset.assetCode || "Asset"}` : "Register and assign corporate equipment to employee"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAllocateModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {modalError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <span>⚠️</span>
                <span>{modalError}</span>
              </div>
            )}

            {/* Form Body */}
            <form onSubmit={handleSaveAssetAllocation} className="p-6 overflow-y-auto space-y-4 text-xs font-semibold">
              {/* Section 1: Asset Core Details */}
              <div>
                <h4 className="text-[10px] font-black uppercase text-indigo-950 tracking-wider mb-2.5 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                  <span>💻</span> Asset Identity & Classification
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Asset Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dell Latitude 5440"
                      value={allocateFormData.assetName}
                      onChange={e => setAllocateFormData({ ...allocateFormData, assetName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500 font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Asset Category *</label>
                    <select
                      value={allocateFormData.assetCategory}
                      onChange={e => {
                        const newCat = e.target.value;
                        const meta = getCategoryIcon(newCat);
                        setAllocateFormData({
                          ...allocateFormData,
                          assetCategory: newCat,
                          assetType: meta.type
                        });
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500 font-bold text-slate-800 cursor-pointer"
                    >
                      <option value="Laptop">Laptop</option>
                      <option value="Mobile">Mobile Device</option>
                      <option value="SIM Card">SIM Card</option>
                      <option value="ID Card">ID Card</option>
                      <option value="Access Card">Access Card</option>
                      <option value="Software License">Software License</option>
                      <option value="Monitor">Monitor / Display</option>
                      <option value="Printer">Printer / Peripheral</option>
                      <option value="Other">Other Equipment</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Asset Code</label>
                    <input
                      type="text"
                      placeholder="e.g. AST-LAP-015"
                      value={allocateFormData.assetCode}
                      onChange={e => setAllocateFormData({ ...allocateFormData, assetCode: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800 focus:outline-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Model / Serial Number</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Model"
                        value={allocateFormData.model}
                        onChange={e => setAllocateFormData({ ...allocateFormData, model: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="Serial Number"
                        value={allocateFormData.serialNumber}
                        onChange={e => setAllocateFormData({ ...allocateFormData, serialNumber: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono focus:outline-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Allocation & Assignment Details */}
              <div className="pt-2">
                <h4 className="text-[10px] font-black uppercase text-indigo-950 tracking-wider mb-2.5 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                  <span>👤</span> Assignment & Deployment
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Allocation Status</label>
                    <select
                      value={allocateFormData.status}
                      onChange={e => {
                        const st = e.target.value;
                        setAllocateFormData({
                          ...allocateFormData,
                          status: st,
                          employee: st === "Available" ? "Unassigned" : allocateFormData.employee,
                          empId: st === "Available" ? "" : allocateFormData.empId
                        });
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-indigo-500 cursor-pointer"
                    >
                      <option value="Assigned">Assigned (In Field)</option>
                      <option value="Available">Available (In Stock)</option>
                      <option value="Under Maintenance">Under Maintenance</option>
                      <option value="Retired">Retired / Decommissioned</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Choose Existing Employee</label>
                    <select
                      value={allocateFormData.empId || allocateFormData.employee}
                      onChange={e => handleEmployeeSelect(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-indigo-500 cursor-pointer"
                    >
                      <option value="">-- Select or type below --</option>
                      {employeeOptions.map(emp => {
                        const code = emp.employeeCode || emp.emp_code || emp.empId || emp.id;
                        const name = emp.employeeName || emp.employee_name || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.name;
                        return (
                          <option key={code} value={code}>
                            {name} ({code}) - {emp.department || "General"}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Assigned Employee Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Yashwani"
                      value={allocateFormData.employee}
                      onChange={e => setAllocateFormData({ ...allocateFormData, employee: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Employee ID & Department</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="EMP ID (e.g. TVN2007)"
                        value={allocateFormData.empId}
                        onChange={e => setAllocateFormData({ ...allocateFormData, empId: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono focus:outline-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="Dept (e.g. IT)"
                        value={allocateFormData.department}
                        onChange={e => setAllocateFormData({ ...allocateFormData, department: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Issue / Allocation Date</label>
                    <input
                      type="date"
                      value={allocateFormData.issueDate}
                      onChange={e => setAllocateFormData({ ...allocateFormData, issueDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Warranty Expiry Date</label>
                    <input
                      type="date"
                      value={allocateFormData.warrantyExpiry}
                      onChange={e => setAllocateFormData({ ...allocateFormData, warrantyExpiry: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Hardware Specifications */}
              <div className="pt-2">
                <h4 className="text-[10px] font-black uppercase text-indigo-950 tracking-wider mb-2.5 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                  <span>⚙️</span> Hardware Specifications & Acquisition
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">OS</label>
                    <input
                      type="text"
                      placeholder="e.g. macOS Sonoma"
                      value={allocateFormData.operatingSystem}
                      onChange={e => setAllocateFormData({ ...allocateFormData, operatingSystem: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Processor</label>
                    <input
                      type="text"
                      placeholder="e.g. Apple M3 Pro"
                      value={allocateFormData.processor}
                      onChange={e => setAllocateFormData({ ...allocateFormData, processor: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">RAM</label>
                    <input
                      type="text"
                      placeholder="e.g. 16 GB"
                      value={allocateFormData.memory}
                      onChange={e => setAllocateFormData({ ...allocateFormData, memory: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Storage</label>
                    <input
                      type="text"
                      placeholder="e.g. 512 GB SSD"
                      value={allocateFormData.storage}
                      onChange={e => setAllocateFormData({ ...allocateFormData, storage: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2.5">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Vendor</label>
                    <input
                      type="text"
                      placeholder="e.g. Apple India"
                      value={allocateFormData.vendor}
                      onChange={e => setAllocateFormData({ ...allocateFormData, vendor: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Purchase Date</label>
                    <input
                      type="date"
                      value={allocateFormData.purchaseDate}
                      onChange={e => setAllocateFormData({ ...allocateFormData, purchaseDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Purchase Cost (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 85000"
                      value={allocateFormData.purchaseCost}
                      onChange={e => setAllocateFormData({ ...allocateFormData, purchaseCost: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  disabled={isSaving}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <span>{editTargetAsset ? "Save Changes" : "Confirm & Save Allocation"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
