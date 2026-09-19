import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  DocumentTextIcon,
  DocumentIcon,
  EyeIcon, 
  ArrowDownTrayIcon, 
  ShieldCheckIcon, 
  ClockIcon, 
  ExclamationTriangleIcon, 
  MagnifyingGlassIcon, 
  CalendarIcon, 
  ArrowPathIcon, 
  EllipsisVerticalIcon, 
  AcademicCapIcon, 
  CreditCardIcon, 
  IdentificationIcon, 
  GlobeAltIcon, 
  HeartIcon, 
  BriefcaseIcon, 
  XMarkIcon, 
  ArrowUpTrayIcon
} from "@heroicons/react/24/outline";
import { apiFetch } from "../../services/hrApi";

// Helper to determine category from doc title or type
const getDocCategory = (title = "", docType = "") => {
  const t = (title + " " + docType).toLowerCase();
  if (t.includes("aadhaar") || t.includes("pan") || t.includes("passport") || t.includes("license") || t.includes("voter") || t.includes("profile") || t.includes("photo") || t.includes("id")) return "Personal";
  if (t.includes("marksheet") || t.includes("degree") || t.includes("certificate") || t.includes("10th") || t.includes("12th") || t.includes("diploma") || t.includes("graduation") || t.includes("post graduation")) return "Education";
  if (t.includes("resume") || t.includes("offer") || t.includes("contract") || t.includes("experience") || t.includes("relieving") || t.includes("salary") || t.includes("employment")) return "Experience";
  return "Other";
};

// Avatar colors
const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-indigo-600",
  "bg-rose-500",
  "bg-teal-600",
  "bg-violet-600",
  "bg-amber-600",
  "bg-sky-600",
  "bg-fuchsia-600",
  "bg-emerald-600"
];

const EmployeeDocumentsMasterView = ({ 
  deptFilter = "ALL", 
  deptName = "", 
  readOnlyDepartment = false,
  user = null,
  onRefresh = null
}) => {
  // Pure Live Database States - NO DUMMY DATA
  const [employees, setEmployees] = useState([]);
  const [rawDbDocs, setRawDbDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLiveRefreshing, setIsLiveRefreshing] = useState(false);

  // Selected Employee for the right detail drawer
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [activeDocCategory, setActiveDocCategory] = useState("All Documents");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState(deptFilter !== "ALL" ? deptFilter : "All Departments");
  const [selectedDocType, setSelectedDocType] = useState("All Document Types");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [dateRange, setDateRange] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Upload Form
  const [uploadForm, setUploadForm] = useState({
    employee_id: "",
    document_type: "Aadhaar Card",
    title: "",
    document_number: "",
    issue_date: new Date().toISOString().split("T")[0],
    expiry_date: "",
    remarks: ""
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Live Database Fetcher
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsLiveRefreshing(true);

    try {
      const [empRes, docRes] = await Promise.all([
        apiFetch("/api/table/employees").catch(() => ({ success: false, data: [] })),
        apiFetch("/api/table/documents").catch(() => ({ success: false, data: [] }))
      ]);

      const dbEmps = Array.isArray(empRes?.data) ? empRes.data : [];
      const dbDocs = Array.isArray(docRes?.data) ? docRes.data : [];

      setRawDbDocs(dbDocs);

      // Clean, format, and map live database employees
      const formattedEmps = dbEmps.map(e => {
        const fullName = `${e.firstName || e.employeeName || e.employee_name || ""} ${e.lastName || ""}`.trim() || e.name || "Employee";
        const code = e.employeeCode || e.emp_code || e.employeeId || e.empId || e.id;
        const dept = e.department || e.department_name || e.departmentName || "General";
        return {
          id: code,
          rawId: e.id,
          employeeCode: code,
          name: fullName,
          firstName: e.firstName || fullName.split(" ")[0],
          lastName: e.lastName || fullName.split(" ")[1] || "",
          email: e.email || e.officialEmail || (code ? `${code.toLowerCase()}@nib.com` : "--"),
          department: dept,
          status: e.status || "Active"
        };
      });

      setEmployees(formattedEmps);

      // Auto-select first employee if none selected yet
      setSelectedEmpId(prev => {
        if (prev && formattedEmps.some(e => e.id === prev)) return prev;
        return formattedEmps.length > 0 ? formattedEmps[0].id : null;
      });
    } catch (err) {
      console.error("Failed to load live documents data:", err);
    } finally {
      if (!silent) setLoading(false);
      else setIsLiveRefreshing(false);
    }
  }, []);

  // Initial load and Real-Time Polling setup (Updates automatically when any employee adds documents)
  useEffect(() => {
    loadData();

    // 1. Periodic background polling every 5 seconds for live updates
    const interval = setInterval(() => {
      loadData(true);
    }, 5000);

    // 2. Real-time refresh whenever user focuses window / returns to tab
    const handleFocus = () => loadData(true);
    window.addEventListener("focus", handleFocus);

    // 3. Custom event listener when documents are uploaded in the system
    const handleDocEvent = () => loadData(true);
    window.addEventListener("document_uploaded", handleDocEvent);
    window.addEventListener("storage", handleDocEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("document_uploaded", handleDocEvent);
      window.removeEventListener("storage", handleDocEvent);
    };
  }, [loadData]);

  // Update selectedDept if deptFilter changes
  useEffect(() => {
    if (deptFilter && deptFilter !== "ALL") {
      setSelectedDept(deptFilter);
    }
  }, [deptFilter]);

  // Dynamically extract unique departments from actual live employees
  const departmentOptions = useMemo(() => {
    const set = new Set();
    employees.forEach(e => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [employees]);

  // Standard Document types list
  const documentTypeOptions = [
    "Aadhaar Card",
    "PAN Card",
    "10th Marksheet",
    "12th Marksheet",
    "Graduation Degree",
    "Passport",
    "Driving License",
    "Medical Certificate",
    "Resume",
    "Offer Letter",
    "Employment Contract",
    "Experience Letter",
    "Other"
  ];

  // Resolve ONLY REAL uploaded documents for a given employee from MySQL
  const getEmployeeDocuments = useCallback((emp) => {
    if (!emp) return [];

    const empCode = String(emp.employeeCode || emp.id || "").trim().toLowerCase();
    const empRawId = String(emp.rawId || "").trim().toLowerCase();
    const empName = String(emp.name || "").toLowerCase().trim();

    // Match live DB documents
    const matchedDocs = rawDbDocs.filter(d => {
      const docEmpId = String(d.employee_id || d.employeeId || "").trim().toLowerCase();
      const docEmpName = String(d.employee_name || "").toLowerCase().trim();

      const matchId = docEmpId && (docEmpId === empCode || (empRawId && docEmpId === empRawId));
      const matchName = docEmpName && (docEmpName === empName || (empName && docEmpName.includes(empName)) || (empName && empName.includes(docEmpName)));

      return matchId || matchName;
    });

    return matchedDocs.map(d => {
      let cat = d.category || getDocCategory(d.title, d.document_type);
      let s = d.status || "Pending Approval";
      if (s.toLowerCase() === "pending approval") s = "Pending";
      if (s.toLowerCase() === "approved") s = "Verified";
      if (s.toLowerCase() === "revision required" || s.toLowerCase() === "declined") s = "Rejected";

      const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
      let fullUrl = d.file_url || d.storage_key || "";
      if (fullUrl && !fullUrl.startsWith("http")) {
        fullUrl = `${API_BASE}${fullUrl.startsWith("/") ? "" : "/"}${fullUrl}`;
      }

      return {
        id: d.id,
        title: d.title || "Document",
        category: cat,
        docNumber: d.document_number || d.verification_id || d.file_name || "--",
        issueDate: d.issue_date || (d.created_at ? new Date(d.created_at).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }) : "--"),
        expiryDate: d.expiry_date || null,
        status: s,
        fileType: d.mime_type || "application/octet-stream",
        fileUrl: fullUrl,
        isRealDb: true,
        raw: d
      };
    });
  }, [rawDbDocs]);

  // Overall status based on real documents
  const getEmployeeOverallStatus = (docs) => {
    if (!docs || docs.length === 0) return "Pending";
    const hasRejected = docs.some(d => d.status.toLowerCase() === "rejected");
    if (hasRejected) return "Rejected";
    const hasPending = docs.some(d => d.status.toLowerCase() === "pending");
    if (hasPending) return "Pending";
    return "Verified";
  };

  // Enrich all live employees with their real docs and status
  const enrichedEmployees = useMemo(() => {
    return employees.map(emp => {
      const docs = getEmployeeDocuments(emp);
      const overallStatus = getEmployeeOverallStatus(docs);
      return {
        ...emp,
        docs,
        docCount: docs.length,
        docStatus: overallStatus
      };
    });
  }, [employees, getEmployeeDocuments]);

  // Filtered employees list based on search and dropdown filters
  const filteredEmployees = useMemo(() => {
    return enrichedEmployees.filter(emp => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        emp.name.toLowerCase().includes(q) || 
        emp.employeeCode.toLowerCase().includes(q) || 
        emp.email.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.docs.some(d => d.title.toLowerCase().includes(q));

      const matchDept = selectedDept === "All Departments" || 
        emp.department.toLowerCase() === selectedDept.toLowerCase();

      const matchStatus = selectedStatus === "All Status" || 
        emp.docStatus.toLowerCase() === selectedStatus.toLowerCase();

      const matchDocType = selectedDocType === "All Document Types" || 
        emp.docs.some(d => d.title.toLowerCase().includes(selectedDocType.toLowerCase()));

      return matchSearch && matchDept && matchStatus && matchDocType;
    });
  }, [enrichedEmployees, searchQuery, selectedDept, selectedStatus, selectedDocType]);

  // 100% REAL LIVE Statistics for KPI Cards directly from database
  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    let verifiedCount = 0;
    let pendingCount = 0;
    let expiredCount = 0;

    rawDbDocs.forEach(doc => {
      const s = String(doc.status || "").toLowerCase().trim();
      if (s === "approved" || s === "verified") {
        verifiedCount++;
      } else if (s === "pending approval" || s === "pending" || s === "draft") {
        pendingCount++;
      } else if (s === "expired") {
        expiredCount++;
      }
    });

    return {
      totalEmployees,
      verified: verifiedCount,
      pending: pendingCount,
      expired: expiredCount
    };
  }, [employees, rawDbDocs]);

  // Active Selected Employee Details
  const activeEmployee = useMemo(() => {
    if (!selectedEmpId && filteredEmployees.length > 0) return filteredEmployees[0];
    return enrichedEmployees.find(e => e.id === selectedEmpId) || filteredEmployees[0] || null;
  }, [enrichedEmployees, filteredEmployees, selectedEmpId]);

  // Filter active employee docs by Category Tab
  const activeEmployeeDocs = useMemo(() => {
    if (!activeEmployee) return [];
    if (activeDocCategory === "All Documents") return activeEmployee.docs;
    return activeEmployee.docs.filter(d => d.category === activeDocCategory);
  }, [activeEmployee, activeDocCategory]);

  // Pagination slice
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));

  // Handle Approve in Backend
  const handleApprove = async (doc) => {
    if (!doc.id) return;
    try {
      await apiFetch(`/api/documents/${doc.id}/approve`, {
        method: "POST",
        body: JSON.stringify({ comments: `Verified and approved by ${user?.name || "Admin"}` })
      });
      await loadData(true);
      alert("✅ Document approved successfully.");
    } catch (err) {
      alert("Approval failed: " + err.message);
    }
  };

  // Handle Reject in Backend
  const handleReject = async (doc) => {
    if (!doc.id) return;
    const reason = window.prompt("Please enter rejection / revision reason:");
    if (!reason) return;

    try {
      await apiFetch(`/api/documents/${doc.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason })
      });
      await loadData(true);
      alert("Document marked for revision.");
    } catch (err) {
      alert("Reject failed: " + err.message);
    }
  };

  // Handle Document Upload directly to Backend
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      alert("Please select a file to upload.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("employee_id", uploadForm.employee_id || (activeEmployee?.employeeCode || ""));
      formData.append("title", uploadForm.title || `${uploadForm.document_type} - ${activeEmployee?.name || "Employee"}`);
      formData.append("document_type_id", uploadForm.document_type);
      formData.append("document_number", uploadForm.document_number);
      formData.append("issue_date", uploadForm.issue_date);
      formData.append("expiry_date", uploadForm.expiry_date);
      formData.append("remarks", uploadForm.remarks);

      await apiFetch("/api/documents", {
        method: "POST",
        body: formData
      });

      alert("✅ Document uploaded successfully!");
      setShowUploadModal(false);
      setUploadFile(null);
      await loadData(true);
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    if (!readOnlyDepartment) setSelectedDept("All Departments");
    setSelectedDocType("All Document Types");
    setSelectedStatus("All Status");
    setDateRange("");
    setCurrentPage(1);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Employee Code", "Full Name", "Email", "Department", "Document Title", "Document Number", "Category", "Status", "Issue Date", "Expiry Date"];
    const rows = [];

    filteredEmployees.forEach(emp => {
      if (emp.docs.length === 0) {
        rows.push([
          `"${emp.employeeCode}"`,
          `"${emp.name}"`,
          `"${emp.email}"`,
          `"${emp.department}"`,
          `"No Documents Uploaded"`,
          `"--"`,
          `"--"`,
          `"Pending"`,
          `"--"`,
          `"--"`
        ]);
      } else {
        emp.docs.forEach(doc => {
          rows.push([
            `"${emp.employeeCode}"`,
            `"${emp.name}"`,
            `"${emp.email}"`,
            `"${emp.department}"`,
            `"${doc.title}"`,
            `"${doc.docNumber || ""}"`,
            `"${doc.category || ""}"`,
            `"${doc.status}"`,
            `"${doc.issueDate || ""}"`,
            `"${doc.expiryDate || ""}"`
          ]);
        });
      }
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `employee_documents_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Themed icon based on document name
  const renderDocIcon = (title = "") => {
    const t = title.toLowerCase();
    if (t.includes("aadhaar")) {
      return (
        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
          <IdentificationIcon className="w-5 h-5" />
        </div>
      );
    }
    if (t.includes("pan")) {
      return (
        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
          <CreditCardIcon className="w-5 h-5" />
        </div>
      );
    }
    if (t.includes("marksheet") || t.includes("10th") || t.includes("12th")) {
      return (
        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
          <DocumentTextIcon className="w-5 h-5" />
        </div>
      );
    }
    if (t.includes("degree") || t.includes("graduation")) {
      return (
        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
          <AcademicCapIcon className="w-5 h-5" />
        </div>
      );
    }
    if (t.includes("passport")) {
      return (
        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <GlobeAltIcon className="w-5 h-5" />
        </div>
      );
    }
    if (t.includes("driving") || t.includes("license")) {
      return (
        <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
          <IdentificationIcon className="w-5 h-5" />
        </div>
      );
    }
    if (t.includes("medical")) {
      return (
        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
          <HeartIcon className="w-5 h-5" />
        </div>
      );
    }
    if (t.includes("resume") || t.includes("contract") || t.includes("experience") || t.includes("offer") || t.includes("employment")) {
      return (
        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
          <BriefcaseIcon className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
        <DocumentIcon className="w-5 h-5" />
      </div>
    );
  };

  // Initials for avatar
  const getInitials = (name = "") => {
    return name
      .split(" ")
      .filter(Boolean)
      .map(w => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "EM";
  };

  const getAvatarColor = (idx) => {
    return AVATAR_COLORS[idx % AVATAR_COLORS.length];
  };

  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* 1. Top Header with Title, Live Status Indicator and Upload Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Employee Documents
            </h1>
            {isLiveRefreshing && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                Syncing Live
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            View and manage all employee documents and verification records.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadData(false)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer shadow-2xs active:scale-95"
            title="Refresh documents from database"
          >
            <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : "text-slate-500"}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setUploadForm({
                employee_id: activeEmployee?.employeeCode || "",
                document_type: "Aadhaar Card",
                title: "",
                document_number: "",
                issue_date: new Date().toISOString().split("T")[0],
                expiry_date: "",
                remarks: ""
              });
              setShowUploadModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition duration-150 cursor-pointer active:scale-95"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* 2. Four KPI Metric Cards (100% Real Live Database Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4 transition hover:shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <DocumentIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Total Employees</span>
            <span className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5 block">{stats.totalEmployees}</span>
          </div>
        </div>

        {/* Verified Documents */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4 transition hover:shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheckIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Verified Documents</span>
            <span className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5 block">{stats.verified}</span>
          </div>
        </div>

        {/* Pending Verification */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4 transition hover:shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <ClockIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Pending Verification</span>
            <span className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5 block">{stats.pending}</span>
          </div>
        </div>

        {/* Expired Documents */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4 transition hover:shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
            <ExclamationTriangleIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Expired Documents</span>
            <span className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5 block">{stats.expired}</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-3 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee name / ID..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={e => {
              setSelectedDept(e.target.value);
              setCurrentPage(1);
            }}
            disabled={readOnlyDepartment}
            className="px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer transition"
          >
            <option value="All Departments">All Departments</option>
            {departmentOptions.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {/* Document Type Filter */}
          <select
            value={selectedDocType}
            onChange={e => {
              setSelectedDocType(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer transition"
          >
            <option value="All Document Types">All Document Types</option>
            {documentTypeOptions.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer transition"
          >
            <option value="All Status">All Status</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
            <option value="Expired">Expired</option>
          </select>

          {/* Date Range Picker Trigger */}
          <div className="relative">
            <input 
              type="date" 
              value={dateRange} 
              onChange={e => setDateRange(e.target.value)} 
              title="Filter by upload or issue date"
              className="px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer" 
            />
          </div>
        </div>

        {/* Action Buttons: Reset & Export */}
        <div className="flex items-center gap-2 self-end lg:self-center">
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 4. Split Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: EMPLOYEE LIST TABLE */}
        <div className={`${drawerOpen && activeEmployee ? "lg:col-span-7" : "lg:col-span-12"} transition-all duration-200`}>
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Employee List
              </h2>
              <span className="text-[11px] font-medium text-slate-400">
                {filteredEmployees.length} employees found
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-3">Emp ID</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3 text-center">Documents</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {paginatedEmployees.length > 0 ? (
                    paginatedEmployees.map((emp, idx) => {
                      const isSelected = selectedEmpId === emp.id;
                      const avatarBg = getAvatarColor(idx);

                      return (
                        <tr 
                          key={emp.id || idx} 
                          onClick={() => {
                            setSelectedEmpId(emp.id);
                            setDrawerOpen(true);
                          }}
                          className={`cursor-pointer transition ${
                            isSelected 
                              ? "bg-blue-50/50 hover:bg-blue-50/70" 
                              : "hover:bg-slate-50/80"
                          }`}
                        >
                          {/* Employee Name & Initials */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full ${avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs`}>
                                {getInitials(emp.name)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-xs">{emp.name}</div>
                                <div className="text-[11px] text-slate-400 font-normal">{emp.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Emp ID */}
                          <td className="py-3.5 px-3 font-mono text-slate-500 text-xs">
                            {emp.employeeCode}
                          </td>

                          {/* Department */}
                          <td className="py-3.5 px-3 text-slate-600 font-medium">
                            {emp.department}
                          </td>

                          {/* Documents Count Pill */}
                          <td className="py-3.5 px-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                              emp.docCount > 0 
                                ? "bg-blue-50 text-blue-600 border-blue-100" 
                                : "bg-slate-50 text-slate-400 border-slate-200"
                            }`}>
                              <DocumentIcon className="w-3 h-3" />
                              <span>{emp.docCount}</span>
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-3 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                              emp.docCount === 0 
                                ? "bg-slate-50 text-slate-400 border-slate-200"
                                : emp.docStatus === "Verified"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : emp.docStatus === "Pending"
                                ? "bg-amber-50 text-amber-600 border-amber-100"
                                : "bg-rose-50 text-rose-600 border-rose-100"
                            }`}>
                              {emp.docCount === 0 ? "No Docs" : emp.docStatus}
                            </span>
                          </td>

                          {/* Actions: View & Dots */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedEmpId(emp.id);
                                  setDrawerOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-blue-50 border border-blue-200 text-blue-600 text-[11px] font-semibold rounded-lg transition cursor-pointer"
                              >
                                <EyeIcon className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedEmpId(emp.id);
                                  setDrawerOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                              >
                                <EllipsisVerticalIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        <DocumentIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600 text-xs">No employees found in the database.</p>
                        <p className="text-[11px] text-slate-400 mt-1">Add an employee to view their document records.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing {filteredEmployees.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredEmployees.length)} of {filteredEmployees.length} employees
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold cursor-pointer"
                >
                  &lt;
                </button>

                {Array.from({ length: totalPages }).map((_, pIdx) => {
                  const pNum = pIdx + 1;
                  if (pNum > 5 && pNum !== totalPages) return null;
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-7 h-7 rounded-md text-xs font-semibold flex items-center justify-center cursor-pointer transition ${
                        currentPage === pNum
                          ? "bg-blue-600 text-white"
                          : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold cursor-pointer"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: SELECTED EMPLOYEE DOCUMENTS INSPECTOR */}
        {drawerOpen && activeEmployee && (
          <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl shadow-xs p-5 space-y-4">
            {/* Inspector Header: Initials, Name, Code, Active Pill & Close button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  {getInitials(activeEmployee.name)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{activeEmployee.name}</h3>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    {activeEmployee.employeeCode} • {activeEmployee.department}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Active
                </span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  title="Close Inspector"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Category Navigation Tabs */}
            <div className="flex items-center gap-4 border-b border-slate-100 pb-2 overflow-x-auto text-xs font-semibold">
              {["All Documents", "Personal", "Education", "Experience", "Other"].map(cat => {
                const isActive = activeDocCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveDocCategory(cat)}
                    className={`pb-1 whitespace-nowrap cursor-pointer transition ${
                      isActive 
                        ? "text-blue-600 border-b-2 border-blue-600 font-bold" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Sub-header with document count */}
            <div className="flex items-center justify-between pt-1">
              <h4 className="text-xs font-bold text-slate-800">
                Employee Documents ({activeEmployeeDocs.length})
              </h4>
            </div>

            {/* Real Document Cards List */}
            <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
              {activeEmployeeDocs.length > 0 ? (
                activeEmployeeDocs.map(doc => {
                  return (
                    <div 
                      key={doc.id}
                      className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between gap-3 hover:border-slate-200 transition hover:shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {renderDocIcon(doc.title)}
                        <div className="min-w-0">
                          <h5 className="font-bold text-slate-800 text-xs truncate">{doc.title}</h5>
                          <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                            {doc.docNumber && <span>{doc.docNumber} • </span>}
                            <span>Issue: {doc.issueDate}</span>
                            {doc.expiryDate && <span> • Exp: {doc.expiryDate}</span>}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Status Badge */}
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          doc.status === "Verified"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : doc.status === "Pending"
                            ? "bg-amber-50 text-amber-600 border-amber-100"
                            : doc.status === "Expired"
                            ? "bg-rose-50 text-rose-600 border-rose-100"
                            : "bg-rose-50 text-rose-600 border-rose-100"
                        }`}>
                          {doc.status}
                        </span>

                        {/* Actions: Preview, Download, Approve / Reject */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewDoc(doc);
                              setShowPreviewModal(true);
                            }}
                            title="Preview Document"
                            className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>

                          {doc.fileUrl ? (
                            <a
                              href={doc.fileUrl}
                              download
                              target="_blank"
                              rel="noreferrer"
                              title="Download File"
                              className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                            >
                              <ArrowDownTrayIcon className="w-4 h-4" />
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => alert("No physical file attached to this document.")}
                              title="No File Attached"
                              className="p-1 text-slate-300 rounded-lg cursor-not-allowed"
                            >
                              <ArrowDownTrayIcon className="w-4 h-4" />
                            </button>
                          )}

                          {doc.status === "Pending" && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleApprove(doc)}
                                title="Approve"
                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold cursor-pointer transition shadow-2xs"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(doc)}
                                title="Reject"
                                className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-[10px] font-bold cursor-pointer transition"
                              >
                                Reject
                              </button>
                            </div>
                          )}

                          {doc.status !== "Pending" && (
                            <button
                              type="button"
                              onClick={() => {
                                const action = window.prompt(`Action for ${doc.title}:\n1: Mark Pending\n2: Mark Verified\nEnter number:`);
                                if (action === "1") handleReject(doc);
                                else if (action === "2") handleApprove(doc);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                            >
                              <EllipsisVerticalIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-14 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl p-6">
                  <DocumentIcon className="w-9 h-9 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    No documents uploaded in category "{activeDocCategory}".
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                    When this employee uploads a document, it will automatically sync and appear here live.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadForm({
                        employee_id: activeEmployee.employeeCode,
                        document_type: "Aadhaar Card",
                        title: "",
                        document_number: "",
                        issue_date: new Date().toISOString().split("T")[0],
                        expiry_date: "",
                        remarks: ""
                      });
                      setShowUploadModal(true);
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <ArrowUpTrayIcon className="w-3.5 h-3.5" />
                    <span>Upload Document for {activeEmployee.name}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. PREVIEW MODAL */}
      {showPreviewModal && previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{previewDoc.title}</h3>
                <p className="text-xs text-slate-400 font-medium">
                  {activeEmployee?.name} ({activeEmployee?.employeeCode}) • Issue: {previewDoc.issueDate}
                </p>
              </div>
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Viewer Body */}
            <div className="flex-1 overflow-y-auto bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-center min-h-[300px]">
              {previewDoc.fileUrl ? (
                previewDoc.fileUrl.endsWith(".pdf") ? (
                  <iframe 
                    src={previewDoc.fileUrl} 
                    title={previewDoc.title} 
                    className="w-full h-96 rounded-xl border border-slate-200"
                  />
                ) : (
                  <img 
                    src={previewDoc.fileUrl} 
                    alt={previewDoc.title} 
                    className="max-h-96 max-w-full object-contain rounded-xl shadow-xs" 
                  />
                )
              ) : (
                <div className="text-center p-8 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                    <DocumentTextIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{previewDoc.title}</h4>
                    <p className="text-xs text-slate-500 font-mono mt-1">Doc Number: {previewDoc.docNumber || "N/A"}</p>
                    <p className="text-xs text-slate-400 mt-1">Status: {previewDoc.status}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Status:</span>
                <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                  previewDoc.status === "Verified" ? "bg-emerald-50 text-emerald-700" :
                  previewDoc.status === "Pending" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                }`}>
                  {previewDoc.status}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {previewDoc.fileUrl && (
                  <a
                    href={previewDoc.fileUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    <span>Download</span>
                  </a>
                )}
                {previewDoc.status === "Pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleApprove(previewDoc);
                        setShowPreviewModal(false);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Approve Document
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleReject(previewDoc);
                        setShowPreviewModal(false);
                      }}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Reject
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. UPLOAD DOCUMENT MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <ArrowUpTrayIcon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Upload Employee Document</h3>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Employee</label>
                <select
                  value={uploadForm.employee_id}
                  onChange={e => setUploadForm({ ...uploadForm, employee_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white font-medium"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.employeeCode} value={emp.employeeCode}>
                      {emp.name} ({emp.employeeCode}) - {emp.department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Document Type</label>
                  <select
                    value={uploadForm.document_type}
                    onChange={e => setUploadForm({ ...uploadForm, document_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white font-medium"
                  >
                    {documentTypeOptions.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Document / ID Number</label>
                  <input
                    type="text"
                    placeholder="e.g. XXXX-XXXX-1234"
                    value={uploadForm.document_number}
                    onChange={e => setUploadForm({ ...uploadForm, document_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={uploadForm.issue_date}
                    onChange={e => setUploadForm({ ...uploadForm, issue_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={uploadForm.expiry_date}
                    onChange={e => setUploadForm({ ...uploadForm, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Document File (PDF, PNG, JPG)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50 transition cursor-pointer relative">
                  <input
                    type="file"
                    required
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={e => setUploadFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center justify-center pointer-events-none">
                    <ArrowUpTrayIcon className="w-8 h-8 text-blue-500 mb-1" />
                    <span className="text-xs font-bold text-slate-700">
                      {uploadFile ? uploadFile.name : "Click or drag file here to upload"}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Supports PDF, PNG, JPG up to 10MB
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Remarks / Notes</label>
                <textarea
                  rows="2"
                  placeholder="Additional verification details..."
                  value={uploadForm.remarks}
                  onChange={e => setUploadForm({ ...uploadForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer transition disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Save & Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDocumentsMasterView;
