import React, { useState, useEffect, useMemo } from "react";
import {
  CubeIcon,
  ComputerDesktopIcon,
  WrenchScrewdriverIcon,
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  SparklesIcon,
  DevicePhoneMobileIcon,
  IdentificationIcon
} from "@heroicons/react/24/outline";
import { apiFetch } from "../../services/hrApi";
import { useAuth } from "../../auth/AuthProvider";

const INITIAL_SAMPLE_ASSETS = [
  {
    id: 1,
    assetCode: "AST-LAP-001",
    assetName: "Dell Latitude 5440",
    assetCategory: "Laptop",
    brand: "Dell",
    model: "Latitude 5440",
    serialNumber: "DL45892",
    employee: "Rahul Sharma",
    empId: "EMP1024",
    department: "Engineering",
    issueDate: "2025-01-10",
    expectedReturnDate: "2026-09-20",
    warrantyExpiry: "2027-01-09",
    purchaseDate: "2025-01-05",
    purchaseCost: 78000,
    vendor: "Dell India Pvt Ltd",
    operatingSystem: "Windows 11 Pro",
    processor: "Intel Core i7 13th Gen",
    memory: "16 GB DDR5",
    storage: "512 GB NVMe SSD",
    display: "14-inch FHD IPS",
    graphicsCard: "Intel Iris Xe",
    color: "Titan Grey",
    status: "Assigned",
    condition: "Good"
  },
  {
    id: 2,
    assetCode: "AST-LAP-002",
    assetName: "MacBook Pro 14 M2",
    assetCategory: "Laptop",
    brand: "Apple",
    model: "MacBook Pro 14",
    serialNumber: "AP88921",
    employee: "Neha Gupta",
    empId: "EMP1055",
    department: "Design",
    issueDate: "2025-02-15",
    expectedReturnDate: "2026-10-15",
    warrantyExpiry: "2028-02-14",
    purchaseDate: "2025-02-10",
    purchaseCost: 165000,
    vendor: "Apple Authorized Reseller",
    operatingSystem: "macOS Sonoma",
    processor: "Apple M2 Pro (10-core)",
    memory: "16 GB Unified Memory",
    storage: "1 TB SSD",
    display: "14.2-inch Liquid Retina XDR",
    graphicsCard: "16-core GPU",
    color: "Space Grey",
    status: "Assigned",
    condition: "Good"
  },
  {
    id: 3,
    assetCode: "AST-LAP-003",
    assetName: "HP ProBook 440 G9",
    assetCategory: "Laptop",
    brand: "HP",
    model: "ProBook 440 G9",
    serialNumber: "HP78452",
    employee: "Priya Patel",
    empId: "EMP1087",
    department: "Human Resources",
    issueDate: "2025-03-15",
    expectedReturnDate: "2026-09-24",
    warrantyExpiry: "2027-03-14",
    purchaseDate: "2025-03-01",
    purchaseCost: 65000,
    vendor: "HP World Store",
    operatingSystem: "Windows 11 Home",
    processor: "Intel Core i5 12th Gen",
    memory: "16 GB DDR4",
    storage: "512 GB SSD",
    display: "14-inch Anti-glare",
    graphicsCard: "Intel UHD",
    color: "Pike Silver",
    status: "Assigned",
    condition: "Good"
  },
  {
    id: 4,
    assetCode: "AST-LAP-004",
    assetName: "Lenovo ThinkPad E14",
    assetCategory: "Laptop",
    brand: "Lenovo",
    model: "ThinkPad E14 Gen 4",
    serialNumber: "LN90123",
    employee: "Amit Verma",
    empId: "EMP1132",
    department: "Finance",
    issueDate: "2025-02-02",
    expectedReturnDate: "2026-09-17",
    warrantyExpiry: "2027-02-01",
    purchaseDate: "2025-01-20",
    purchaseCost: 72000,
    vendor: "Lenovo Corporate",
    operatingSystem: "Windows 11 Pro",
    processor: "AMD Ryzen 7 5825U",
    memory: "16 GB DDR4",
    storage: "512 GB NVMe SSD",
    display: "14-inch FHD IPS",
    graphicsCard: "AMD Radeon Graphics",
    color: "Black",
    status: "Assigned",
    condition: "Good"
  },
  {
    id: 5,
    assetCode: "AST-LAP-005",
    assetName: "Dell Latitude 3520",
    assetCategory: "Laptop",
    brand: "Dell",
    model: "Latitude 3520",
    serialNumber: "DL99142",
    employee: null,
    empId: null,
    department: null,
    issueDate: null,
    expectedReturnDate: null,
    warrantyExpiry: "2027-04-10",
    purchaseDate: "2025-04-05",
    purchaseCost: 58000,
    vendor: "Dell India Pvt Ltd",
    operatingSystem: "Windows 11 Pro",
    processor: "Intel Core i5 11th Gen",
    memory: "8 GB DDR4",
    storage: "256 GB SSD",
    display: "15.6-inch HD",
    graphicsCard: "Intel UHD",
    color: "Black",
    status: "Available",
    condition: "Good"
  },
  {
    id: 6,
    assetCode: "AST-MON-001",
    assetName: "Dell 24-inch USB-C Hub Monitor",
    assetCategory: "Monitor",
    brand: "Dell",
    model: "P2422HE",
    serialNumber: "DL-MON-5541",
    employee: "Rahul Sharma",
    empId: "EMP1024",
    department: "Engineering",
    issueDate: "2025-01-10",
    expectedReturnDate: "2026-09-20",
    warrantyExpiry: "2028-01-09",
    purchaseDate: "2025-01-05",
    purchaseCost: 22000,
    vendor: "Dell Direct",
    operatingSystem: "N/A",
    processor: "N/A",
    memory: "N/A",
    storage: "N/A",
    display: "23.8-inch FHD IPS 60Hz",
    graphicsCard: "N/A",
    color: "Silver/Black",
    status: "Assigned",
    condition: "Good"
  },
  {
    id: 7,
    assetCode: "AST-MOB-001",
    assetName: "Samsung Galaxy A54 5G",
    assetCategory: "Mobile",
    brand: "Samsung",
    model: "Galaxy A54",
    serialNumber: "SM-A54-8841",
    employee: null,
    empId: null,
    department: null,
    issueDate: null,
    expectedReturnDate: null,
    warrantyExpiry: "2026-11-20",
    purchaseDate: "2024-11-15",
    purchaseCost: 34000,
    vendor: "Samsung India",
    operatingSystem: "Android 14",
    processor: "Exynos 1380",
    memory: "8 GB",
    storage: "128 GB",
    display: "6.4-inch Super AMOLED 120Hz",
    graphicsCard: "Mali-G68 MP5",
    color: "Awesome Violet",
    status: "Available",
    condition: "Good"
  },
  {
    id: 8,
    assetCode: "AST-LAP-006",
    assetName: "Lenovo ThinkPad L14",
    assetCategory: "Laptop",
    brand: "Lenovo",
    model: "ThinkPad L14 Gen 2",
    serialNumber: "LN33890",
    employee: null,
    empId: null,
    department: null,
    issueDate: null,
    expectedReturnDate: null,
    warrantyExpiry: "2026-08-15",
    purchaseDate: "2024-08-10",
    purchaseCost: 62000,
    vendor: "Lenovo Corporate",
    operatingSystem: "Windows 10 Pro",
    processor: "Intel Core i5 11th Gen",
    memory: "16 GB DDR4",
    storage: "512 GB SSD",
    display: "14-inch FHD",
    graphicsCard: "Intel Iris Xe",
    color: "Black",
    status: "Maintenance",
    condition: "Fair"
  },
  {
    id: 9,
    assetCode: "AST-LIC-001",
    assetName: "Figma Organization License",
    assetCategory: "Software License",
    brand: "Figma",
    model: "Enterprise Annual",
    serialNumber: "FIG-ENT-2026-04",
    employee: "Neha Gupta",
    empId: "EMP1055",
    department: "Design",
    issueDate: "2025-01-01",
    expectedReturnDate: "2026-12-31",
    warrantyExpiry: "2026-12-31",
    purchaseDate: "2025-01-01",
    purchaseCost: 45000,
    vendor: "Figma Inc",
    operatingSystem: "Cloud Web",
    processor: "N/A",
    memory: "N/A",
    storage: "N/A",
    display: "N/A",
    graphicsCard: "N/A",
    color: "N/A",
    status: "Assigned",
    condition: "Good"
  }
];

const SAMPLE_MAINTENANCE = [
  {
    id: 1,
    ticketId: "MNT-2026-001",
    assetCode: "AST-LAP-006",
    assetName: "Lenovo ThinkPad L14",
    reportedBy: "IT Helpdesk",
    issueType: "Battery Replacement",
    description: "Battery health depleted below 40%. Battery swelling reported.",
    vendor: "Lenovo Authorized Service",
    sentDate: "2026-09-02",
    expectedReturnDate: "2026-09-16",
    estimatedCost: 6500,
    status: "In Progress"
  },
  {
    id: 2,
    ticketId: "MNT-2026-002",
    assetCode: "AST-LAP-001",
    assetName: "Dell Latitude 5440",
    reportedBy: "Rahul Sharma",
    issueType: "Keyboard Malfunction",
    description: "Spacebar and 'E' keys unresponsive after liquid splash.",
    vendor: "Dell ProSupport On-Site",
    sentDate: "2026-08-10",
    expectedReturnDate: "2026-08-12",
    estimatedCost: 3200,
    status: "Repaired"
  }
];

const AssetAllocation = ({
  records = [],
  dbData = {},
  user,
  openCreateTrigger,
  onOpenEdit,
  onDelete,
  onRefreshData
}) => {
  const { user: authUser } = useAuth();
  const activeUser = user || authUser;

  // Workspace sub-tabs
  const [activeTab, setActiveTab] = useState("Dashboard");

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDept, setFilterDept] = useState("All");

  // Pagination states
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showSpecsModal, setShowSpecsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  // Selected item for actions
  const [targetAsset, setTargetAsset] = useState(null);

  // Assets data state: combine dbData records and comprehensive fallback
  const [assets, setAssets] = useState(() => {
    const rawList = records && records.length > 0
      ? records
      : (dbData["Asset Allocation"] || dbData["asset_allocations"] || dbData["inventory"] || []);
    
    if (rawList && rawList.length > 0) {
      // Merge with sample attributes to guarantee rich spec display
      return rawList.map((item, idx) => {
        const fallback = INITIAL_SAMPLE_ASSETS[idx % INITIAL_SAMPLE_ASSETS.length];
        return {
          id: item.id || idx + 1,
          assetCode: item.assetCode || item.assetId || fallback.assetCode,
          assetName: item.assetName || item.name || fallback.assetName,
          assetCategory: item.assetCategory || item.category || fallback.assetCategory,
          brand: item.brand || fallback.brand,
          model: item.model || fallback.model,
          serialNumber: item.serialNumber || item.serialNo || fallback.serialNumber,
          employee: item.employee || (item.status === "Assigned" ? fallback.employee : null),
          empId: item.empId || (item.status === "Assigned" ? fallback.empId : null),
          department: item.department || fallback.department,
          issueDate: item.issueDate || fallback.issueDate,
          expectedReturnDate: item.expectedReturnDate || fallback.expectedReturnDate,
          warrantyExpiry: item.warrantyExpiry || fallback.warrantyExpiry,
          purchaseDate: item.purchaseDate || fallback.purchaseDate,
          purchaseCost: item.purchaseCost || fallback.purchaseCost,
          vendor: item.vendor || fallback.vendor,
          operatingSystem: item.operatingSystem || item.os || fallback.operatingSystem,
          processor: item.processor || fallback.processor,
          memory: item.memory || fallback.memory,
          storage: item.storage || fallback.storage,
          display: item.display || fallback.display,
          graphicsCard: item.graphicsCard || fallback.graphicsCard,
          color: item.color || fallback.color,
          status: item.status || fallback.status,
          condition: item.condition || fallback.condition
        };
      });
    }
    return INITIAL_SAMPLE_ASSETS;
  });

  // Maintenance records
  const [maintenanceTickets, setMaintenanceTickets] = useState(SAMPLE_MAINTENANCE);

  // Return inspection form state
  const [returnForm, setReturnForm] = useState({
    returnDate: new Date().toISOString().split("T")[0],
    physicalCondition: "Good",
    accessories: ["Charger", "Laptop Bag", "Mouse"],
    damageDescription: "",
    recoveryAmount: 0,
    receivedBy: activeUser?.name || "IT Admin",
    verificationStatus: "Verified",
    remarks: ""
  });

  // Allocate Asset form state
  const [allocateForm, setAllocateForm] = useState({
    assetId: "",
    employeeId: "",
    employeeName: "",
    department: "",
    allocationDate: new Date().toISOString().split("T")[0],
    expectedReturnDate: "",
    condition: "Good",
    remarks: ""
  });

  // Add Asset form state
  const [assetForm, setAssetForm] = useState({
    assetCode: "",
    assetName: "",
    assetCategory: "Laptop",
    brand: "",
    model: "",
    serialNumber: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    purchaseCost: "",
    warrantyExpiry: "",
    vendor: "",
    operatingSystem: "",
    processor: "",
    memory: "",
    storage: "",
    status: "Available",
    condition: "Good"
  });

  // Maintenance form state
  const [maintenanceForm, setMaintenanceForm] = useState({
    assetId: "",
    issueType: "Hardware Malfunction",
    description: "",
    vendor: "",
    sentDate: new Date().toISOString().split("T")[0],
    expectedReturnDate: "",
    estimatedCost: 0,
    status: "In Progress"
  });

  // Sync when prop records change
  useEffect(() => {
    if (records && records.length > 0) {
      setAssets(prev => {
        return records.map((item, idx) => {
          const fallback = INITIAL_SAMPLE_ASSETS[idx % INITIAL_SAMPLE_ASSETS.length];
          return {
            id: item.id || idx + 1,
            assetCode: item.assetCode || item.assetId || fallback.assetCode,
            assetName: item.assetName || item.name || fallback.assetName,
            assetCategory: item.assetCategory || item.category || fallback.assetCategory,
            brand: item.brand || fallback.brand,
            model: item.model || fallback.model,
            serialNumber: item.serialNumber || item.serialNo || fallback.serialNumber,
            employee: item.employee || (item.status === "Assigned" ? fallback.employee : null),
            empId: item.empId || (item.status === "Assigned" ? fallback.empId : null),
            department: item.department || fallback.department,
            issueDate: item.issueDate || fallback.issueDate,
            expectedReturnDate: item.expectedReturnDate || fallback.expectedReturnDate,
            warrantyExpiry: item.warrantyExpiry || fallback.warrantyExpiry,
            purchaseDate: item.purchaseDate || fallback.purchaseDate,
            purchaseCost: item.purchaseCost || fallback.purchaseCost,
            vendor: item.vendor || fallback.vendor,
            operatingSystem: item.operatingSystem || item.os || fallback.operatingSystem,
            processor: item.processor || fallback.processor,
            memory: item.memory || fallback.memory,
            storage: item.storage || fallback.storage,
            display: item.display || fallback.display,
            graphicsCard: item.graphicsCard || fallback.graphicsCard,
            color: item.color || fallback.color,
            status: item.status || fallback.status,
            condition: item.condition || fallback.condition
          };
        });
      });
    }
  }, [records]);

  // Role based filtering: standard employees only see their assets
  const userRole = typeof activeUser?.role === "object" ? activeUser?.role?.name : activeUser?.role;
  const isEmployee = String(userRole || "").toLowerCase().trim() === "employee";
  const userEmail = String(activeUser?.email || "").toLowerCase().trim();
  const isAdmin = userEmail.includes("admin") || userEmail.includes("yashtech") || !isEmployee;

  const visibleAssets = useMemo(() => {
    if (!isEmployee || isAdmin) return assets;
    const userHandle = userEmail.split("@")[0];
    return assets.filter(a => {
      const empName = String(a.employee || "").toLowerCase();
      const empIdVal = String(a.empId || "").toLowerCase();
      return empName.includes(userHandle) || (activeUser?.username && empIdVal.includes(String(activeUser.username).toLowerCase()));
    });
  }, [assets, isEmployee, isAdmin, userEmail, activeUser]);

  // Executive KPI Statistics
  const stats = useMemo(() => {
    const total = visibleAssets.length;
    const assigned = visibleAssets.filter(a => a.status === "Assigned").length;
    const available = visibleAssets.filter(a => a.status === "Available" || a.status === "Returned").length;
    const maintenance = visibleAssets.filter(a => a.status === "Maintenance" || a.status === "Under Maintenance").length;
    const retired = visibleAssets.filter(a => a.status === "Retired" || a.status === "Scrapped").length;
    const pendingReturns = visibleAssets.filter(a => a.expectedReturnDate && a.status === "Assigned").length;
    const totalValuation = visibleAssets.reduce((acc, a) => acc + (Number(a.purchaseCost) || 0), 0);
    return { total, assigned, available, maintenance, retired, pendingReturns, totalValuation };
  }, [visibleAssets]);

  // Categories list
  const categories = ["All", "Laptop", "Desktop", "Mobile", "Monitor", "SIM Card", "Access Card", "Software License", "Other"];

  // Departments list
  const departments = useMemo(() => {
    const depts = new Set(visibleAssets.map(a => a.department).filter(Boolean));
    return ["All", ...Array.from(depts)];
  }, [visibleAssets]);

  // Filtered Assets for Table
  const filteredAssets = useMemo(() => {
    return visibleAssets.filter(a => {
      const matchCat = filterCategory === "All" || String(a.assetCategory || "").toLowerCase() === filterCategory.toLowerCase();
      const matchStatus = filterStatus === "All" || String(a.status || "").toLowerCase() === filterStatus.toLowerCase();
      const matchDept = filterDept === "All" || String(a.department || "").toLowerCase() === filterDept.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        String(a.assetName || "").toLowerCase().includes(q) ||
        String(a.assetCode || "").toLowerCase().includes(q) ||
        String(a.serialNumber || "").toLowerCase().includes(q) ||
        String(a.employee || "").toLowerCase().includes(q) ||
        String(a.empId || "").toLowerCase().includes(q) ||
        String(a.brand || "").toLowerCase().includes(q);

      return matchCat && matchStatus && matchDept && matchSearch;
    });
  }, [visibleAssets, filterCategory, filterStatus, filterDept, searchQuery]);

  // Paginated records
  const paginatedAssets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAssets.slice(start, start + pageSize);
  }, [filteredAssets, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAssets.length / pageSize) || 1;

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterCategory("All");
    setFilterStatus("All");
    setFilterDept("All");
    setCurrentPage(1);
  };

  // Status Badge Class
  const getBadgeClass = (status) => {
    const s = String(status || "").toLowerCase().trim();
    if (s === "assigned") return "bg-blue-50 text-blue-700 border-blue-200";
    if (s === "available" || s === "returned") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "maintenance" || s === "under repair") return "bg-amber-50 text-amber-700 border-amber-200";
    if (s === "retired" || s === "scrapped" || s === "damaged") return "bg-rose-50 text-rose-700 border-rose-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  // Handle Save New Asset
  const handleSaveNewAsset = (e) => {
    e.preventDefault();
    const newId = Date.now();
    const created = {
      id: newId,
      assetCode: assetForm.assetCode || `AST-${String(assetForm.assetCategory || 'GEN').substring(0, 3).toUpperCase()}-${String(newId).slice(-3)}`,
      assetName: assetForm.assetName || "Corporate Hardware",
      assetCategory: assetForm.assetCategory || "Laptop",
      brand: assetForm.brand || "Standard",
      model: assetForm.model || "Corporate Edition",
      serialNumber: assetForm.serialNumber || `SN-${Date.now().toString().slice(-6)}`,
      purchaseDate: assetForm.purchaseDate,
      purchaseCost: Number(assetForm.purchaseCost) || 50000,
      warrantyExpiry: assetForm.warrantyExpiry || "2027-12-31",
      vendor: assetForm.vendor || "Direct",
      operatingSystem: assetForm.operatingSystem || "Windows 11 Pro",
      processor: assetForm.processor || "Standard CPU",
      memory: assetForm.memory || "16 GB",
      storage: assetForm.storage || "512 GB SSD",
      display: "Standard Display",
      graphicsCard: "Integrated",
      color: "Standard",
      status: "Available",
      condition: assetForm.condition || "Good",
      employee: null,
      empId: null,
      department: null,
      issueDate: null,
      expectedReturnDate: null
    };

    setAssets(prev => [created, ...prev]);
    setShowAddModal(false);
    setAssetForm({
      assetCode: "",
      assetName: "",
      assetCategory: "Laptop",
      brand: "",
      model: "",
      serialNumber: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      purchaseCost: "",
      warrantyExpiry: "",
      vendor: "",
      operatingSystem: "",
      processor: "",
      memory: "",
      storage: "",
      status: "Available",
      condition: "Good"
    });
    alert("New asset registered successfully in inventory!");
  };

  // Handle Allocation Submit
  const handleAllocateSubmit = (e) => {
    e.preventDefault();
    if (!allocateForm.assetId) {
      alert("Please select an asset to allocate.");
      return;
    }

    setAssets(prev => prev.map(a => {
      if (String(a.id) === String(allocateForm.assetId)) {
        return {
          ...a,
          status: "Assigned",
          employee: allocateForm.employeeName || "Allocated Staff",
          empId: allocateForm.employeeId || "EMP-NEW",
          department: allocateForm.department || a.department || "General",
          issueDate: allocateForm.allocationDate,
          expectedReturnDate: allocateForm.expectedReturnDate,
          condition: allocateForm.condition
        };
      }
      return a;
    }));

    setShowAllocateModal(false);
    setAllocateForm({
      assetId: "",
      employeeId: "",
      employeeName: "",
      department: "",
      allocationDate: new Date().toISOString().split("T")[0],
      expectedReturnDate: "",
      condition: "Good",
      remarks: ""
    });
    alert("Asset successfully allocated to employee!");
  };

  // Handle Return Submit
  const handleReturnSubmit = (e) => {
    e.preventDefault();
    if (!targetAsset) return;

    setAssets(prev => prev.map(a => {
      if (a.id === targetAsset.id) {
        return {
          ...a,
          status: returnForm.physicalCondition === "Damaged" ? "Damaged" : "Available",
          condition: returnForm.physicalCondition,
          returnDate: returnForm.returnDate,
          employee: returnForm.physicalCondition === "Damaged" ? a.employee : null,
          empId: returnForm.physicalCondition === "Damaged" ? a.empId : null
        };
      }
      return a;
    }));

    setShowReturnModal(false);
    setTargetAsset(null);
    alert(`Asset return recorded for ${targetAsset.assetName}. Condition: ${returnForm.physicalCondition}.`);
  };

  // Handle Maintenance Submit
  const handleMaintenanceSubmit = (e) => {
    e.preventDefault();
    const newTicket = {
      id: Date.now(),
      ticketId: `MNT-2026-${String(maintenanceTickets.length + 1).padStart(3, '0')}`,
      assetCode: targetAsset?.assetCode || "AST-GEN-001",
      assetName: targetAsset?.assetName || "Hardware Device",
      reportedBy: activeUser?.name || "IT Admin",
      issueType: maintenanceForm.issueType,
      description: maintenanceForm.description,
      vendor: maintenanceForm.vendor || "Authorized Center",
      sentDate: maintenanceForm.sentDate,
      expectedReturnDate: maintenanceForm.expectedReturnDate,
      estimatedCost: Number(maintenanceForm.estimatedCost) || 0,
      status: "In Progress"
    };

    setMaintenanceTickets(prev => [newTicket, ...prev]);

    if (targetAsset) {
      setAssets(prev => prev.map(a => a.id === targetAsset.id ? { ...a, status: "Maintenance" } : a));
    }

    setShowMaintenanceModal(false);
    setTargetAsset(null);
    alert("Maintenance ticket registered successfully!");
  };

  // Available Assets for dropdown
  const availableAssetsList = useMemo(() => {
    return assets.filter(a => a.status === "Available" || a.status === "Returned");
  }, [assets]);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Workspace Header */}
      <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-2xl shadow-sm">
              <CubeIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Asset Management Workspace
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Unified corporate hardware inventory, allocation tracking, condition return inspection, and maintenance
              </p>
            </div>
          </div>

          {/* Quick Action Header Buttons */}
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add Asset</span>
              </button>
              <button
                onClick={() => setShowAllocateModal(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowPathIcon className="w-4 h-4" />
                <span>Allocate Asset</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex flex-wrap gap-1 pt-3 border-t border-slate-100">
          {[
            { key: "Dashboard", label: "Dashboard", icon: CubeIcon },
            { key: "Inventory", label: "Inventory / Asset List", icon: ComputerDesktopIcon },
            { key: "Asset Allocation", label: "Asset Allocation", icon: UserGroupIcon },
            { key: "Asset Return", label: "Asset Return & Recovery", icon: ArrowRightOnRectangleIcon },
            { key: "Maintenance", label: "Maintenance & Repairs", icon: WrenchScrewdriverIcon },
            { key: "Reports", label: "Reports & Audit Logs", icon: DocumentTextIcon }
          ].map(tabItem => {
            const Icon = tabItem.icon;
            const isSelected = activeTab === tabItem.key;
            return (
              <button
                key={tabItem.key}
                onClick={() => {
                  setActiveTab(tabItem.key);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition duration-150 flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-xs border border-indigo-600"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tabItem.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================== */}
      {/* 1. DASHBOARD TAB */}
      {/* ========================================================== */}
      {activeTab === "Dashboard" && (
        <div className="space-y-6">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Fleet</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
              <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">Hardware & Software</span>
            </div>

            <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned / Active</span>
              <p className="text-2xl font-black text-blue-600 mt-1">{stats.assigned}</p>
              <span className="text-[10px] text-blue-400 font-semibold mt-0.5 block">Deployed to staff</span>
            </div>

            <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">In Stock / Available</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{stats.available}</p>
              <span className="text-[10px] text-emerald-500 font-semibold mt-0.5 block">Ready to deploy</span>
            </div>

            <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">In Maintenance</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{stats.maintenance}</p>
              <span className="text-[10px] text-amber-500 font-semibold mt-0.5 block">Service / Repair</span>
            </div>

            <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Retired / Scrapped</span>
              <p className="text-2xl font-black text-rose-600 mt-1">{stats.retired}</p>
              <span className="text-[10px] text-rose-400 font-semibold mt-0.5 block">End of lifecycle</span>
            </div>

            <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Fleet Value</span>
              <p className="text-lg font-black text-indigo-700 mt-1.5 truncate">
                ₹{(stats.totalValuation / 100000).toFixed(1)} Lakhs
              </p>
              <span className="text-[10px] text-indigo-400 font-semibold block">CapEx purchase cost</span>
            </div>
          </div>

          {/* Quick Launch Banner */}
          <div className="bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-slate-50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                <SparklesIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  Asset Operations Fast-Actions
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Easily register hardware, assign to onboarded personnel, process exit returns, or track repairs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveTab("Inventory")}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Browse Inventory
              </button>
              <button
                onClick={() => setActiveTab("Asset Allocation")}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <UserGroupIcon className="w-3.5 h-3.5" />
                <span>Open Allocation Matrix</span>
              </button>
            </div>
          </div>

          {/* Two Columns: Category Breakdown & Warranties */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Fleet Breakdown */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Fleet Distribution by Category
                </h3>
                <span className="text-[10px] font-bold text-slate-400">
                  {visibleAssets.length} Total Units
                </span>
              </div>
              <div className="space-y-3">
                {["Laptop", "Desktop", "Mobile", "Monitor", "Software License", "Other"].map(cat => {
                  const count = visibleAssets.filter(a => a.assetCategory === cat).length;
                  const pct = visibleAssets.length ? Math.round((count / visibleAssets.length) * 100) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-700">{cat}</span>
                        <span className="text-slate-500">{count} units ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upcoming Warranties & Inspection Alerts */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Upcoming Warranties & Return Deadlines
                </h3>
                <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                  Action Recommended
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-[250px] overflow-y-auto">
                {visibleAssets.slice(0, 5).map(item => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{item.assetName}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        {item.assetCode} • {item.employee || "In Stock"} • Warranty: {item.warrantyExpiry || "N/A"}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedAsset(item);
                        setShowSpecsModal(true);
                      }}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold hover:bg-slate-100 transition cursor-pointer"
                    >
                      View Specs
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 2. ASSET INVENTORY TAB */}
      {/* ========================================================== */}
      {activeTab === "Inventory" && (
        <div className="space-y-5">
          {/* Inventory Controls Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative md:col-span-2">
                <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by asset code, model, brand, S/N..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold focus:outline-indigo-500"
                />
              </div>

              <div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-indigo-500"
                >
                  {categories.map(c => <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>)}
                </select>
              </div>

              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-indigo-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="Available">Available (In Stock)</option>
                  <option value="Assigned">Assigned (In Use)</option>
                  <option value="Maintenance">Under Maintenance</option>
                  <option value="Retired">Retired / Scrapped</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs font-bold text-slate-500">
              <span>Showing {filteredAssets.length} assets</span>
              <button
                onClick={handleResetFilters}
                className="text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Inventory Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets.map(item => (
              <div
                key={item.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-indigo-200 transition space-y-3.5 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0">
                        {String(item.assetCategory || "AS").substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                          {item.assetName}
                        </h4>
                        <span className="font-mono text-[10px] font-bold text-indigo-600">
                          {item.assetCode}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${getBadgeClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-2.5 rounded-xl text-[11px] font-semibold text-slate-600 border border-slate-100">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Brand / Model</span>
                      <span className="font-bold text-slate-800 truncate block">{item.brand} {item.model}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Serial Number</span>
                      <span className="font-mono text-slate-700 truncate block">{item.serialNumber || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Category</span>
                      <span className="text-slate-800 truncate block">{item.assetCategory}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Warranty Until</span>
                      <span className="text-slate-800 truncate block">{item.warrantyExpiry || "—"}</span>
                    </div>
                  </div>

                  {/* Assigned User Info */}
                  <div className="text-[11px]">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Current Holder</span>
                    {item.employee ? (
                      <p className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                        <span className="text-indigo-600">●</span> {item.employee} ({item.empId || "Staff"})
                      </p>
                    ) : (
                      <p className="text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
                        <span className="text-emerald-500">✓</span> Available in Corporate Store
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setSelectedAsset(item);
                      setShowSpecsModal(true);
                    }}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition flex items-center gap-1 cursor-pointer"
                  >
                    <EyeIcon className="w-3.5 h-3.5" />
                    <span>View Specs</span>
                  </button>

                  {isAdmin && (
                    <div className="flex items-center gap-1.5">
                      {item.status === "Available" && (
                        <button
                          onClick={() => {
                            setAllocateForm(prev => ({ ...prev, assetId: item.id }));
                            setShowAllocateModal(true);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition cursor-pointer"
                        >
                          Allocate
                        </button>
                      )}
                      {item.status === "Assigned" && (
                        <button
                          onClick={() => {
                            setTargetAsset(item);
                            setShowReturnModal(true);
                          }}
                          className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition cursor-pointer"
                        >
                          Return
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredAssets.length === 0 && (
            <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center text-slate-400 space-y-2">
              <CubeIcon className="w-10 h-10 mx-auto text-slate-300" />
              <h4 className="font-bold text-slate-700 text-sm">No Assets Found</h4>
              <p className="text-xs">Try adjusting your category or search filter criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* 3. ASSET ALLOCATION TAB */}
      {/* ========================================================== */}
      {activeTab === "Asset Allocation" && (
        <div className="space-y-6">
          {/* Advanced Filters */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Advanced Allocation Filters</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Search Asset / User</label>
                <input
                  type="text"
                  placeholder="Enter name, code or S/N..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Asset Category</label>
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-indigo-500"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat === "All" ? "All Categories" : cat}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Allocation Status</label>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-indigo-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Available">Available / Returned</option>
                  <option value="Maintenance">Under Maintenance</option>
                  <option value="Retired">Retired / Scrapped</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Department</label>
                <select
                  value={filterDept}
                  onChange={e => setFilterDept(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-indigo-500"
                >
                  {departments.map(dept => <option key={dept} value={dept}>{dept === "All" ? "All Departments" : dept}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Reset
              </button>
              {isAdmin && (
                <button
                  onClick={() => setShowAllocateModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  <span>Allocate New Asset</span>
                </button>
              )}
            </div>
          </div>

          {/* Allocation Table View */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-slate-100">
              <div className="flex flex-wrap gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/80">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setFilterCategory(cat); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filterCategory === cat
                        ? "bg-white text-indigo-600 shadow-xs border border-slate-200/80"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                    }`}
                  >
                    {cat === "All" ? "All Assets" : cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-slate-50 border rounded-lg px-2 py-1 focus:outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>entries</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-bold text-slate-600">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[9px] tracking-wider bg-slate-50/50">
                    <th className="py-3 px-3">Asset Code</th>
                    <th className="py-3">Asset Name</th>
                    <th>Category</th>
                    <th>Assigned To</th>
                    <th>Issue Date</th>
                    <th>Expected Return</th>
                    <th>Warranty Expiry</th>
                    <th>Status</th>
                    <th className="text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedAssets.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-3 font-mono text-slate-800 text-[11px]">{row.assetCode}</td>
                      <td className="text-slate-900 font-extrabold">{row.assetName}</td>
                      <td>{row.assetCategory}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                            <span className="text-[10px]">👤</span>
                          </div>
                          <div>
                            <span className="block text-slate-800 font-black truncate max-w-[130px]">
                              {row.employee || "Unassigned"}
                            </span>
                            <span className="block text-[9px] text-slate-400 font-semibold">
                              {row.empId ? `${row.empId} • ${row.department || "IT"}` : "Available in Stock"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="text-slate-500 font-semibold">{row.issueDate || "—"}</td>
                      <td className="text-slate-700 font-bold">{row.expectedReturnDate || "—"}</td>
                      <td className="text-slate-500 font-semibold">{row.warrantyExpiry || "—"}</td>
                      <td>
                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase ${getBadgeClass(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="text-right pr-4">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedAsset(row);
                              setShowSpecsModal(true);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50 text-blue-600 transition cursor-pointer"
                            title="View Hardware Specifications"
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => {
                                  setTargetAsset(row);
                                  setShowReturnModal(true);
                                }}
                                className="p-1.5 rounded-lg border border-slate-200 hover:border-amber-200 hover:bg-amber-50 text-amber-600 transition cursor-pointer"
                                title="Process Return"
                              >
                                <ArrowRightOnRectangleIcon className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setTargetAsset(row);
                                  setShowMaintenanceModal(true);
                                }}
                                className="p-1.5 rounded-lg border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-indigo-600 transition cursor-pointer"
                                title="Schedule Maintenance"
                              >
                                <WrenchScrewdriverIcon className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedAssets.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-10 text-slate-400 font-bold">
                        No asset allocation records found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-xs font-bold text-slate-400">
              <span>
                Showing {filteredAssets.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredAssets.length)} of {filteredAssets.length} entries
              </span>
              <div className="flex gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-2.5 py-1.5 border rounded-lg hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                      currentPage === i + 1 ? "bg-indigo-600 text-white border-indigo-600" : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-2.5 py-1.5 border rounded-lg hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 4. ASSET RETURN & RECOVERY TAB */}
      {/* ========================================================== */}
      {activeTab === "Asset Return" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Hardware Return & Physical Inspection Registry
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Track corporate hardware returns, inspect physical condition, recover chargers/peripherals, and manage damage deductions
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full shrink-0">
                {assets.filter(a => a.status === "Assigned").length} Assets Currently in Field
              </span>
            </div>

            {/* Quick search */}
            <div className="relative pt-1">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search return queue by employee, asset name, or serial number..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold focus:outline-indigo-500"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-4">Employee</th>
                    <th className="px-4 py-4">EMP ID</th>
                    <th className="px-4 py-4">Asset ID</th>
                    <th className="px-4 py-4">Asset Name</th>
                    <th className="px-4 py-4">Serial Number</th>
                    <th className="px-4 py-4">Issue Date</th>
                    <th className="px-4 py-4">Expected Return</th>
                    <th className="px-4 py-4">Condition</th>
                    <th className="px-4 py-4 text-center">Status</th>
                    <th className="px-5 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {filteredAssets.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4 font-bold text-slate-900">{r.employee || "—"}</td>
                      <td className="px-4 py-4 font-mono font-bold text-indigo-600">{r.empId || "—"}</td>
                      <td className="px-4 py-4 font-mono font-bold text-slate-700">{r.assetCode}</td>
                      <td className="px-4 py-4 font-bold text-slate-900">{r.assetName}</td>
                      <td className="px-4 py-4 font-mono text-slate-600">{r.serialNumber}</td>
                      <td className="px-4 py-4 text-slate-500">{r.issueDate || "—"}</td>
                      <td className="px-4 py-4 font-bold text-slate-700">{r.expectedReturnDate || "—"}</td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {r.condition || "Good"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${getBadgeClass(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {r.status === "Assigned" ? (
                          <button
                            onClick={() => {
                              setTargetAsset(r);
                              setShowReturnModal(true);
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            Receive & Inspect
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedAsset(r);
                              setShowSpecsModal(true);
                            }}
                            className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
                          >
                            Inspection Log
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredAssets.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center py-10 text-slate-400">
                        No asset records found in return tracking.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 5. MAINTENANCE & REPAIRS TAB */}
      {/* ========================================================== */}
      {activeTab === "Maintenance" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Hardware Service & Maintenance Tickets
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Track vendor warranty claims, hardware repairs, part replacements, and service costs
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowMaintenanceModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Log Maintenance Ticket</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-4">Ticket ID</th>
                    <th className="px-4 py-4">Asset Code</th>
                    <th className="px-4 py-4">Asset Name</th>
                    <th className="px-4 py-4">Reported By</th>
                    <th className="px-4 py-4">Issue Description</th>
                    <th className="px-4 py-4">Service Vendor</th>
                    <th className="px-4 py-4">Sent Date</th>
                    <th className="px-4 py-4">Est. Cost</th>
                    <th className="px-4 py-4 text-center">Status</th>
                    <th className="px-5 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {maintenanceTickets.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4 font-mono font-bold text-indigo-600">{t.ticketId}</td>
                      <td className="px-4 py-4 font-mono font-bold text-slate-700">{t.assetCode}</td>
                      <td className="px-4 py-4 font-bold text-slate-900">{t.assetName}</td>
                      <td className="px-4 py-4 text-slate-600">{t.reportedBy}</td>
                      <td className="px-4 py-4 text-slate-700 max-w-[200px] truncate">{t.description}</td>
                      <td className="px-4 py-4 text-slate-600">{t.vendor}</td>
                      <td className="px-4 py-4 text-slate-500">{t.sentDate}</td>
                      <td className="px-4 py-4 font-bold text-slate-800">₹{t.estimatedCost}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                          t.status === "Repaired" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {t.status !== "Repaired" ? (
                          <button
                            onClick={() => {
                              setMaintenanceTickets(prev => prev.map(m => m.id === t.id ? { ...m, status: "Repaired" } : m));
                              setAssets(prev => prev.map(a => a.assetCode === t.assetCode ? { ...a, status: "Available" } : a));
                              alert("Ticket marked as Repaired! Asset returned to available inventory.");
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Mark Repaired
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {maintenanceTickets.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center py-10 text-slate-400">
                        No active maintenance tickets recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 6. REPORTS & AUDIT LOGS TAB */}
      {/* ========================================================== */}
      {activeTab === "Reports" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Asset Lifecycle & Cost Valuation Reports
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Review CapEx hardware investments, department cost allocations, and allocation audit trails
                </p>
              </div>
              <button
                onClick={() => alert("Downloading Corporate Asset Audit Report (CSV)...")}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>Export Report (CSV)</span>
              </button>
            </div>
          </div>

          {/* Department-wise Allocation & Value */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-2 border-slate-100">
              Department-Wise Hardware Allocation & Valuation
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-700">
                <thead className="text-[10px] font-black uppercase text-slate-400 tracking-wider bg-slate-50">
                  <tr>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Allocated Units</th>
                    <th className="py-3 px-4">Available Units</th>
                    <th className="py-3 px-4">Total Fleet Value</th>
                    <th className="py-3 px-4">Depreciation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {["Engineering", "Human Resources", "Finance", "Design", "Marketing"].map(dept => {
                    const deptAssets = assets.filter(a => a.department === dept);
                    const val = deptAssets.reduce((acc, a) => acc + (Number(a.purchaseCost) || 0), 0);
                    return (
                      <tr key={dept} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">{dept}</td>
                        <td className="py-3 px-4 font-bold text-indigo-600">{deptAssets.length}</td>
                        <td className="py-3 px-4 text-emerald-600 font-bold">1</td>
                        <td className="py-3 px-4 font-bold text-slate-800">₹{val.toLocaleString("en-IN")}</td>
                        <td className="py-3 px-4 text-slate-400">Normal (SLM 3 Years)</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODALS */}
      {/* ========================================================== */}

      {/* 1. View Specs Overlay Modal */}
      {showSpecsModal && selectedAsset && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b pb-2 border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Asset Specification Details</h3>
                <p className="text-[10px] text-indigo-600 font-mono font-bold mt-0.5">
                  Code: {selectedAsset.assetCode}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSpecsModal(false);
                  setSelectedAsset(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-black text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0">
                {String(selectedAsset.assetCategory || "AS").substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900">{selectedAsset.assetName}</h4>
                <p className="text-[10px] text-slate-500 font-bold">
                  {selectedAsset.brand} {selectedAsset.model} • {selectedAsset.assetCategory}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Assigned User: {selectedAsset.employee || "Unassigned"} ({selectedAsset.empId || "Store"})
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600">
              <div className="border border-slate-100 p-2.5 rounded-xl bg-slate-50/50">
                <span className="text-[8px] text-slate-400 block uppercase tracking-wider">Serial Number</span>
                <span className="text-slate-800 font-mono font-bold mt-0.5 block truncate">{selectedAsset.serialNumber || "N/A"}</span>
              </div>
              <div className="border border-slate-100 p-2.5 rounded-xl bg-slate-50/50">
                <span className="text-[8px] text-slate-400 block uppercase tracking-wider">Operating System</span>
                <span className="text-slate-800 font-bold mt-0.5 block truncate">{selectedAsset.operatingSystem || "N/A"}</span>
              </div>
              <div className="border border-slate-100 p-2.5 rounded-xl bg-slate-50/50">
                <span className="text-[8px] text-slate-400 block uppercase tracking-wider">Processor</span>
                <span className="text-slate-800 font-bold mt-0.5 block truncate">{selectedAsset.processor || "N/A"}</span>
              </div>
              <div className="border border-slate-100 p-2.5 rounded-xl bg-slate-50/50">
                <span className="text-[8px] text-slate-400 block uppercase tracking-wider">Memory (RAM)</span>
                <span className="text-slate-800 font-bold mt-0.5 block truncate">{selectedAsset.memory || "N/A"}</span>
              </div>
              <div className="border border-slate-100 p-2.5 rounded-xl bg-slate-50/50">
                <span className="text-[8px] text-slate-400 block uppercase tracking-wider">Storage Capacity</span>
                <span className="text-slate-800 font-bold mt-0.5 block truncate">{selectedAsset.storage || "N/A"}</span>
              </div>
              <div className="border border-slate-100 p-2.5 rounded-xl bg-slate-50/50">
                <span className="text-[8px] text-slate-400 block uppercase tracking-wider">Display</span>
                <span className="text-slate-800 font-bold mt-0.5 block truncate">{selectedAsset.display || "N/A"}</span>
              </div>
              <div className="border border-slate-100 p-2.5 rounded-xl bg-slate-50/50">
                <span className="text-[8px] text-slate-400 block uppercase tracking-wider">Purchase Cost</span>
                <span className="text-slate-800 font-bold mt-0.5 block truncate">₹{Number(selectedAsset.purchaseCost || 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="border border-slate-100 p-2.5 rounded-xl bg-slate-50/50">
                <span className="text-[8px] text-slate-400 block uppercase tracking-wider">Warranty Expiry</span>
                <span className="text-slate-800 font-bold mt-0.5 block truncate">{selectedAsset.warrantyExpiry || "N/A"}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowSpecsModal(false);
                  setSelectedAsset(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Add New Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase">Register New Corporate Asset</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveNewAsset} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Asset Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dell Latitude 5440"
                    value={assetForm.assetName}
                    onChange={e => setAssetForm({ ...assetForm, assetName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Asset Code</label>
                  <input
                    type="text"
                    placeholder="Auto-generated if blank (e.g. AST-LAP-009)"
                    value={assetForm.assetCode}
                    onChange={e => setAssetForm({ ...assetForm, assetCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Category *</label>
                  <select
                    value={assetForm.assetCategory}
                    onChange={e => setAssetForm({ ...assetForm, assetCategory: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                  >
                    {categories.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Dell, Apple, HP"
                    value={assetForm.brand}
                    onChange={e => setAssetForm({ ...assetForm, brand: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Model</label>
                  <input
                    type="text"
                    placeholder="e.g. Latitude 5440"
                    value={assetForm.model}
                    onChange={e => setAssetForm({ ...assetForm, model: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Serial Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="Hardware S/N"
                    value={assetForm.serialNumber}
                    onChange={e => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    placeholder="₹ Amount"
                    value={assetForm.purchaseCost}
                    onChange={e => setAssetForm({ ...assetForm, purchaseCost: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={assetForm.purchaseDate}
                    onChange={e => setAssetForm({ ...assetForm, purchaseDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Warranty Expiry</label>
                  <input
                    type="date"
                    value={assetForm.warrantyExpiry}
                    onChange={e => setAssetForm({ ...assetForm, warrantyExpiry: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Processor</label>
                  <input
                    type="text"
                    placeholder="e.g. i7 13th Gen"
                    value={assetForm.processor}
                    onChange={e => setAssetForm({ ...assetForm, processor: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">RAM</label>
                  <input
                    type="text"
                    placeholder="e.g. 16 GB DDR5"
                    value={assetForm.memory}
                    onChange={e => setAssetForm({ ...assetForm, memory: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Storage</label>
                  <input
                    type="text"
                    placeholder="e.g. 512 GB SSD"
                    value={assetForm.storage}
                    onChange={e => setAssetForm({ ...assetForm, storage: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-xs cursor-pointer"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Allocate Asset Modal */}
      {showAllocateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase">Allocate Asset to Employee</h3>
              <button onClick={() => setShowAllocateModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAllocateSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Select Available Asset *</label>
                <select
                  required
                  value={allocateForm.assetId}
                  onChange={e => setAllocateForm({ ...allocateForm, assetId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                >
                  <option value="">-- Choose an available asset --</option>
                  {availableAssetsList.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.assetCode} - {a.assetName} ({a.assetCategory})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Employee Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Singh"
                    value={allocateForm.employeeName}
                    onChange={e => setAllocateForm({ ...allocateForm, employeeName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EMP1190"
                    value={allocateForm.employeeId}
                    onChange={e => setAllocateForm({ ...allocateForm, employeeId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Engineering, Finance, Operations"
                  value={allocateForm.department}
                  onChange={e => setAllocateForm({ ...allocateForm, department: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={allocateForm.allocationDate}
                    onChange={e => setAllocateForm({ ...allocateForm, allocationDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Expected Return</label>
                  <input
                    type="date"
                    value={allocateForm.expectedReturnDate}
                    onChange={e => setAllocateForm({ ...allocateForm, expectedReturnDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-xs cursor-pointer"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Asset Return Inspection Modal */}
      {showReturnModal && targetAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-lg space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase">
              Asset Return Inspection: {targetAsset.assetName}
            </h3>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl grid grid-cols-3 gap-2 text-[11px]">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Asset Code</span>
                <span className="font-mono font-bold text-slate-800">{targetAsset.assetCode}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Employee</span>
                <span className="font-bold text-slate-800">{targetAsset.employee || "Staff"}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Serial No</span>
                <span className="font-mono text-slate-600">{targetAsset.serialNumber}</span>
              </div>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-3 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Return Date *</label>
                  <input
                    type="date"
                    required
                    value={returnForm.returnDate}
                    onChange={(e) => setReturnForm({ ...returnForm, returnDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Physical Condition *</label>
                  <select
                    value={returnForm.physicalCondition}
                    onChange={(e) => setReturnForm({ ...returnForm, physicalCondition: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                  >
                    <option value="Good">Good (Normal Condition)</option>
                    <option value="Fair">Fair (Minor Wear & Tear)</option>
                    <option value="Damaged">Damaged (Requires Repair / Deduct)</option>
                    <option value="Lost">Lost / Not Returned</option>
                    <option value="Scrap">Scrap / Write-off</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Accessories Checklist</label>
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
                  {["Charger / Adapter", "Laptop Bag", "Mouse", "HDMI Cable", "Power Cord"].map((acc) => (
                    <label key={acc} className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                      <input type="checkbox" defaultChecked className="rounded text-indigo-600" />
                      <span>{acc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {returnForm.physicalCondition === "Damaged" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-rose-500 block mb-1">Damage Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Cracked screen"
                      value={returnForm.damageDescription}
                      onChange={(e) => setReturnForm({ ...returnForm, damageDescription: e.target.value })}
                      className="w-full bg-rose-50 border border-rose-200 rounded-xl p-2"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-rose-500 block mb-1">Recovery Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="₹ Amount"
                      value={returnForm.recoveryAmount}
                      onChange={(e) => setReturnForm({ ...returnForm, recoveryAmount: Number(e.target.value) })}
                      className="w-full bg-rose-50 border border-rose-200 rounded-xl p-2"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Received By</label>
                  <input
                    type="text"
                    value={returnForm.receivedBy}
                    onChange={(e) => setReturnForm({ ...returnForm, receivedBy: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Verification Status</label>
                  <select
                    value={returnForm.verificationStatus}
                    onChange={(e) => setReturnForm({ ...returnForm, verificationStatus: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2"
                  >
                    <option value="Verified">Verified & Cleared</option>
                    <option value="Under Inspection">Under Inspection</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Remarks</label>
                <textarea
                  value={returnForm.remarks}
                  onChange={(e) => setReturnForm({ ...returnForm, remarks: e.target.value })}
                  placeholder="Inspection notes, diagnostic result, or accessory status..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 h-14"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowReturnModal(false);
                    setTargetAsset(null);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-xs cursor-pointer"
                >
                  Submit Inspection Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Maintenance Ticket Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-lg space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase">Log Hardware Maintenance Ticket</h3>
              <button onClick={() => setShowMaintenanceModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleMaintenanceSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Issue Type *</label>
                <select
                  value={maintenanceForm.issueType}
                  onChange={e => setMaintenanceForm({ ...maintenanceForm, issueType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                >
                  <option value="Hardware Malfunction">Hardware Malfunction</option>
                  <option value="Battery Replacement">Battery Replacement</option>
                  <option value="Screen Replacement">Screen Replacement</option>
                  <option value="OS / Software Corruption">OS / Software Corruption</option>
                  <option value="Physical Impact Damage">Physical Impact Damage</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Issue Description *</label>
                <textarea
                  required
                  placeholder="Describe hardware behavior, error logs, or physical damage..."
                  value={maintenanceForm.description}
                  onChange={e => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 h-16 focus:outline-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Service Vendor</label>
                  <input
                    type="text"
                    placeholder="e.g. Dell ProSupport"
                    value={maintenanceForm.vendor}
                    onChange={e => setMaintenanceForm({ ...maintenanceForm, vendor: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Estimated Cost (₹)</label>
                  <input
                    type="number"
                    placeholder="₹ Repair cost"
                    value={maintenanceForm.estimatedCost}
                    onChange={e => setMaintenanceForm({ ...maintenanceForm, estimatedCost: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Handover Date</label>
                  <input
                    type="date"
                    value={maintenanceForm.sentDate}
                    onChange={e => setMaintenanceForm({ ...maintenanceForm, sentDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Expected Return Date</label>
                  <input
                    type="date"
                    value={maintenanceForm.expectedReturnDate}
                    onChange={e => setMaintenanceForm({ ...maintenanceForm, expectedReturnDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowMaintenanceModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-xs cursor-pointer"
                >
                  Log Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetAllocation;
