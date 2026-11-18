import React, { useState, useEffect, useMemo } from "react";
import {
  CurrencyRupeeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanknotesIcon,
  PlusIcon,
  ReceiptPercentIcon,
  PaperClipIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  BuildingOfficeIcon,
  EllipsisHorizontalIcon,
  SparklesIcon,
  BoltIcon,
  LightBulbIcon,
  ChartPieIcon,
  HomeIcon,
  DocumentTextIcon,
  ArrowUpRightIcon,
  TagIcon,
  GlobeAltIcon
} from "@heroicons/react/24/outline";
import { apiFetch, uploadEmployeeFile } from "../../services/hrApi";

export const resolveFileUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:") || url.startsWith("data:")) return url;
  const base = import.meta.env.VITE_API_BASE || "http://localhost:5000";
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
};

const CATEGORIES = [
  "Travel",
  "Food & Meals",
  "Accommodation",
  "Fuel",
  "Office Supplies",
  "Communication",
  "Hardware & Peripherals",
  "Software & Tools",
  "Training & Certification",
  "Medical & Health",
  "Miscellaneous"
];

const PAYMENT_METHODS = [
  "Corporate Card",
  "Personal Credit Card",
  "Debit Card",
  "UPI / Net Banking",
  "Cash"
];

export const normalizeCategory = (category) => {
  const s = String(category || "").trim().toLowerCase();
  if (s.includes("travel") || s.includes("flight") || s.includes("cab") || s.includes("transport")) return "Travel";
  if (s.includes("food") || s.includes("meal") || s.includes("din") || s.includes("lunch") || s.includes("restaurant")) return "Food & Meals";
  if (s.includes("hotel") || s.includes("stay") || s.includes("accommodat")) return "Accommodation";
  if (s.includes("fuel") || s.includes("petrol") || s.includes("diesel") || s.includes("toll")) return "Fuel";
  if (s.includes("suppl") || s.includes("stationery") || s.includes("office")) return "Office Supplies";
  if (s.includes("communicat") || s.includes("internet") || s.includes("phone") || s.includes("mobile") || s.includes("broadband")) return "Communication";
  if (s.includes("hardw") || s.includes("peripher") || s.includes("device") || s.includes("router")) return "Hardware & Peripherals";
  if (s.includes("softw") || s.includes("tool") || s.includes("license")) return "Software & Tools";
  if (s.includes("train") || s.includes("certif") || s.includes("course") || s.includes("learn")) return "Training & Certification";
  if (s.includes("medic") || s.includes("health")) return "Medical & Health";
  return category || "Miscellaneous";
};

const getCategoryColor = (category) => {
  const norm = normalizeCategory(category);
  switch (norm) {
    case "Travel":
      return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", fill: "#3b82f6" };
    case "Food & Meals":
      return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", fill: "#f59e0b" };
    case "Accommodation":
      return { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", fill: "#6366f1" };
    case "Fuel":
      return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", fill: "#10b981" };
    case "Office Supplies":
      return { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", fill: "#06b6d4" };
    case "Communication":
      return { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", fill: "#f97316" };
    case "Hardware & Peripherals":
      return { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", fill: "#8b5cf6" };
    case "Software & Tools":
      return { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", fill: "#14b8a6" };
    case "Training & Certification":
      return { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", fill: "#a855f7" };
    case "Medical & Health":
      return { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", fill: "#f43f5e" };
    default:
      return { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", fill: "#8b5cf6" };
  }
};

const getApprovalBadge = (status) => {
  const s = String(status || "Pending").toLowerCase();
  if (s === "approved") {
    return {
      label: "Approved",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dotClass: "bg-emerald-500"
    };
  }
  if (s === "rejected") {
    return {
      label: "Rejected",
      className: "bg-rose-50 text-rose-700 border-rose-200",
      dotClass: "bg-rose-500"
    };
  }
  return {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dotClass: "bg-amber-500"
  };
};

const getReimbursementBadge = (status) => {
  const s = String(status || "Pending").toLowerCase();
  if (s === "reimbursed") {
    return {
      label: "Reimbursed",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold",
      dotClass: "bg-emerald-500"
    };
  }
  if (s === "processing") {
    return {
      label: "Processing",
      className: "bg-blue-50 text-blue-700 border-blue-200 font-bold",
      dotClass: "bg-blue-500"
    };
  }
  return {
    label: "Pending",
    className: "bg-slate-100 text-slate-600 border-slate-200 font-semibold",
    dotClass: "bg-slate-400"
  };
};

const formatCurrency = (amount) => {
  const num = Number(amount || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(num);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "--";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr).split("T")[0];
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch (e) {
    return String(dateStr);
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "--";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}, ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}`;
  } catch (e) {
    return String(dateStr);
  }
};

const ExpenseReimbursementSection = ({ 
  employeeProfile, 
  currentUser, 
  canManageEmployees = false, 
  isRegularEmployee = true, 
  dashboardViewMode = "personal", 
  selectedDeptFilter = "All Departments", 
  onNavigateTab 
}) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Scope: regular employees are strictly locked to "my" (their own claims).
  // Admins & Managers can toggle between "my" and "overall" (all department / company claims).
  const [viewScope, setViewScope] = useState(() => {
    if (isRegularEmployee || !canManageEmployees) return "my";
    return dashboardViewMode === "workforce" ? "overall" : "my";
  });

  const isPersonalScope = isRegularEmployee || !canManageEmployees || viewScope === "my";

  // Modals state
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Filters State matching mockup
  const [fromDate, setFromDate] = useState("2026-09-01");
  const [toDate, setToDate] = useState("2026-09-30");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [activeFiltersApplied, setActiveFiltersApplied] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Submit Form State
  const effectiveEmpId = employeeProfile?.employeeCode || employeeProfile?.emp_code || employeeProfile?.id || currentUser?.employeeCode || currentUser?.id || "TVN2007";
  const effectiveEmpName = employeeProfile?.firstName 
    ? `${employeeProfile.firstName} ${employeeProfile.lastName || ''}`.trim() 
    : (employeeProfile?.employeeName || currentUser?.name || currentUser?.employeeName || "Yashwani");
  const effectiveDept = employeeProfile?.department || currentUser?.departmentName || "IT & Software Engineering";

  const [formState, setFormState] = useState({
    expense_name: "",
    category: "Travel",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    department_project: `${effectiveDept} - Client Delivery`,
    payment_method: "Corporate Card",
    description: "",
    receipt_file: null,
    receipt_url: ""
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(false);

  // Load claims directly from database - personal vs overall filtering
  const fetchExpenses = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const endpoint = isPersonalScope
        ? `/api/table/expense_claims?employeeId=${encodeURIComponent(effectiveEmpId)}&scope=my`
        : `/api/table/expense_claims?scope=overall${selectedDeptFilter && selectedDeptFilter !== 'All Departments' ? `&department=${encodeURIComponent(selectedDeptFilter)}` : ''}`;

      const res = await apiFetch(endpoint);
      const backendData = Array.isArray(res) ? res : res?.data;
      if (Array.isArray(backendData)) {
        let mappedBackend = backendData.map((exp, idx) => ({
          id: exp.id || `EXP-${idx + 1}`,
          claim_number: exp.claim_number || exp.claim_id || exp.claimNumber || `EXP-2026-${String(idx + 1).padStart(4, "0")}`,
          expense_name: exp.expense_name || exp.expense_title || exp.title || exp.description || "Expense Claim",
          category: normalizeCategory(exp.category),
          amount: Number(exp.amount ?? exp.total_amount ?? 0),
          expense_date: exp.expense_date || exp.date || exp.claim_date || new Date().toISOString().split("T")[0],
          submitted_date: exp.submitted_date || exp.created_at || exp.expense_date,
          employee_id: exp.employee_id || exp.employeeId || "",
          employee_name: exp.employee_name || exp.employeeName || "",
          department: exp.department || "",
          project: exp.project || exp.department || "Client Delivery - Alpha",
          payment_method: exp.payment_method || "Corporate Card",
          approval_status: exp.approval_status || exp.status || "Pending",
          reimbursement_status: exp.reimbursement_status || "Pending",
          receipt_url: exp.receipt_url || "",
          description: exp.description || exp.expense_name || "",
          approver: exp.approver || "Department Manager / Accounts",
          remarks: exp.remarks || "",
          payment_date: exp.payment_date || null,
          payment_reference: exp.payment_reference || null
        }));

        // Strict Personal Scope Frontend Guard:
        // When in Personal View, ensure each employee ONLY ever sees their own submitted claims!
        if (isPersonalScope) {
          const myEmpId = String(effectiveEmpId || "").toLowerCase().trim();
          const myUserId = String(currentUser?.id || "").toLowerCase().trim();
          const myName = String(effectiveEmpName || "").toLowerCase().trim();

          mappedBackend = mappedBackend.filter((claim) => {
            const claimEmpId = String(claim.employee_id || "").toLowerCase().trim();
            const claimEmpName = String(claim.employee_name || "").toLowerCase().trim();

            return (
              (claimEmpId && (claimEmpId === myEmpId || claimEmpId === myUserId)) ||
              (claimEmpName && (claimEmpName === myName || (myName.includes(claimEmpName) && claimEmpName.length > 2)))
            );
          });
        }

        setExpenses(mappedBackend);
      } else {
        setExpenses([]);
      }
    } catch (err) {
      console.warn("Using empty state, backend fetch error:", err.message);
      setExpenses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpdateClaimStatus = async (claimId, newStatus, remarks = "") => {
    try {
      await apiFetch(`/api/table/expense_claims/${claimId}`, {
        method: "PUT",
        body: JSON.stringify({
          approval_status: newStatus,
          approver: effectiveEmpName,
          remarks: remarks || `Status marked as ${newStatus} by ${effectiveEmpName}`
        })
      });
      await fetchExpenses(true);
      if (selectedExpense && selectedExpense.id === claimId) {
        setSelectedExpense(prev => ({ ...prev, approval_status: newStatus, remarks: remarks || prev.remarks }));
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [viewScope, selectedDeptFilter]);

  // Summary Metrics Calculation
  const metrics = useMemo(() => {
    let totalClaimedAmt = 0;
    let totalClaimedCount = 0;
    let pendingApprovalAmt = 0;
    let pendingApprovalCount = 0;
    let approvedAmt = 0;
    let approvedCount = 0;
    let reimbursedAmt = 0;
    let reimbursedCount = 0;
    let rejectedCount = 0;

    expenses.forEach((item) => {
      const amt = Number(item.amount ?? item.total_amount ?? 0);
      totalClaimedAmt += amt;
      totalClaimedCount += 1;

      const appStatus = String(item.approval_status || item.status || "Pending").toLowerCase();
      const reimbStatus = String(item.reimbursement_status || "Pending").toLowerCase();

      if (appStatus === "pending") {
        pendingApprovalAmt += amt;
        pendingApprovalCount += 1;
      } else if (appStatus === "approved") {
        approvedAmt += amt;
        approvedCount += 1;
      } else if (appStatus === "rejected") {
        rejectedCount += 1;
      }

      if (reimbStatus === "reimbursed") {
        reimbursedAmt += amt;
        reimbursedCount += 1;
      }
    });

    return {
      totalClaimedAmt,
      totalClaimedCount,
      pendingApprovalAmt,
      pendingApprovalCount,
      approvedAmt,
      approvedCount,
      reimbursedAmt,
      reimbursedCount,
      rejectedCount
    };
  }, [expenses]);

  // Category Breakdown for the Donut Chart
  const categoryBreakdown = useMemo(() => {
    const map = {};
    let total = 0;

    expenses.forEach((item) => {
      const cat = normalizeCategory(item.category);
      const amt = Number(item.amount ?? item.total_amount ?? 0);
      total += amt;
      map[cat] = (map[cat] || 0) + amt;
    });

    const list = Object.entries(map).map(([category, amount]) => {
      const col = getCategoryColor(category);
      const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
      return {
        category,
        amount,
        pct,
        fill: col.fill,
        bg: col.bg,
        text: col.text
      };
    }).sort((a, b) => b.amount - a.amount);

    return { total, list };
  }, [expenses]);

  // Filtered Expense Claims
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const itemDate = String(item.expense_date || item.date || item.claim_date || item.created_at || "").split("T")[0];

      // If active filters are applied, enforce fromDate, toDate, status, and category
      if (activeFiltersApplied) {
        if (fromDate && itemDate && itemDate < fromDate) return false;
        if (toDate && itemDate && itemDate > toDate) return false;

        if (statusFilter !== "ALL") {
          const appMatch = String(item.approval_status || item.status || "").toLowerCase() === statusFilter.toLowerCase();
          const reimbMatch = String(item.reimbursement_status || "").toLowerCase() === statusFilter.toLowerCase();
          if (!appMatch && !reimbMatch) return false;
        }

        if (categoryFilter !== "ALL") {
          const cat = normalizeCategory(item.category).toLowerCase();
          const targetCat = categoryFilter.toLowerCase();
          if (cat !== targetCat && !cat.includes(targetCat)) return false;
        }
      }

      return true;
    });
  }, [expenses, fromDate, toDate, statusFilter, categoryFilter, activeFiltersApplied]);

  // Paginated Expenses
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredExpenses.slice(start, start + pageSize);
  }, [filteredExpenses, currentPage]);

  const totalPages = Math.ceil(filteredExpenses.length / pageSize) || 1;

  // Handle Filter Actions
  const handleApplyFilters = () => {
    setActiveFiltersApplied(true);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFromDate("");
    setToDate("");
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
    setActiveFiltersApplied(false);
    setCurrentPage(1);
  };

  // CSV Report Downloader
  const handleDownloadReport = () => {
    const headers = [
      "Claim ID",
      "Expense Title",
      "Category",
      "Expense Date",
      "Amount (INR)",
      "Department / Project",
      "Payment Method",
      "Approval Status",
      "Reimbursement Status",
      "Submitted On",
      "Remarks"
    ];

    const rows = filteredExpenses.map((exp) => [
      `"${exp.claim_number || exp.id}"`,
      `"${(exp.expense_name || "").replace(/"/g, '""')}"`,
      `"${exp.category || "General"}"`,
      `"${exp.expense_date || ""}"`,
      Number(exp.amount || 0),
      `"${(exp.department || exp.project || "").replace(/"/g, '""')}"`,
      `"${exp.payment_method || "N/A"}"`,
      `"${exp.approval_status || "Pending"}"`,
      `"${exp.reimbursement_status || "Pending"}"`,
      `"${exp.submitted_date || exp.expense_date || ""}"`,
      `"${(exp.remarks || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TechnoVani_Expense_Claims_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Form Input Change Handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError("");
  };

  // Receipt File Upload Handler
  const handleReceiptChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setFormError("Receipt file size cannot exceed 10MB");
      return;
    }

    setUploadProgress(true);
    setFormError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "expense-receipts");

      const uploadRes = await uploadEmployeeFile(formData);
      const uploadedUrl = uploadRes?.url || uploadRes?.file_url || uploadRes?.data?.file_url || "";

      setFormState((prev) => ({
        ...prev,
        receipt_file: file,
        receipt_url: uploadedUrl || URL.createObjectURL(file)
      }));
    } catch (uploadErr) {
      console.warn("Upload fallback to local object preview:", uploadErr);
      const tempUrl = URL.createObjectURL(file);
      setFormState((prev) => ({
        ...prev,
        receipt_file: file,
        receipt_url: tempUrl
      }));
    } finally {
      setUploadProgress(false);
    }
  };

  // Submit New Expense Claim
  const handleSubmitExpense = async (e) => {
    e.preventDefault();

    if (!formState.expense_name.trim()) {
      setFormError("Please enter an expense title / purpose.");
      return;
    }

    const amt = parseFloat(formState.amount);
    if (isNaN(amt) || amt <= 0) {
      setFormError("Please enter a valid expense amount greater than 0.");
      return;
    }

    if (!formState.expense_date) {
      setFormError("Please select the date when the expense occurred.");
      return;
    }

    setFormSubmitting(true);
    setFormError("");

    const randomSuffix = String(Math.floor(1000 + Math.random() * 9000));
    const newClaimNumber = `EXP-2026-${randomSuffix}`;
    const newUuid = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });

    const newRecord = {
      id: newUuid,
      claim_number: newClaimNumber,
      claim_id: newClaimNumber,
      expense_name: formState.expense_name.trim(),
      expense_title: formState.expense_name.trim(),
      category: formState.category,
      amount: amt,
      expense_date: formState.expense_date,
      date: formState.expense_date,
      submitted_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      employee_id: effectiveEmpId,
      employee_name: effectiveEmpName,
      department: effectiveDept,
      project: formState.department_project.trim(),
      payment_method: formState.payment_method,
      approval_status: "Pending",
      reimbursement_status: "Pending",
      receipt_url: formState.receipt_url || "",
      description: formState.description.trim() || formState.expense_name.trim(),
      remarks: "Claim submitted by employee for audit.",
      approver: "Department Manager / Accounts",
      payment_date: null,
      payment_reference: null
    };

    try {
      await apiFetch("/api/table/expense_claims", {
        method: "POST",
        body: JSON.stringify(newRecord)
      });
      // Immediately refresh claims from database to guarantee database persistence
      await fetchExpenses(true);
    } catch (err) {
      console.warn("Backend save failed, keeping in local view:", err);
      setExpenses((prev) => [newRecord, ...prev]);
    } finally {
      setFormState({
        expense_name: "",
        category: "Travel",
        amount: "",
        expense_date: new Date().toISOString().split("T")[0],
        department_project: `${effectiveDept} - Client Delivery`,
        payment_method: "Corporate Card",
        description: "",
        receipt_file: null,
        receipt_url: ""
      });
      setFormSubmitting(false);
      setIsSubmitOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans">
      {/* 0. VIEW SCOPE SWITCHER (Only shown for Admins / Managers / Dept Heads) */}
      {canManageEmployees && !isRegularEmployee && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expense Scope:</span>
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewScope("my")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewScope === "my"
                    ? "bg-white text-blue-600 shadow-2xs font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                My Personal Expenses
              </button>
              <button
                type="button"
                onClick={() => setViewScope("overall")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewScope === "overall"
                    ? "bg-white text-blue-600 shadow-2xs font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Overall / Department Claims
              </button>
            </div>
          </div>

          <div className="text-xs font-semibold">
            {viewScope === "my" ? (
              <span className="text-blue-600 font-bold">Personal claims submitted by you ({effectiveEmpName})</span>
            ) : (
              <span className="text-indigo-600 font-bold">Overall workforce claims across {selectedDeptFilter || "All Departments"}</span>
            )}
          </div>
        </div>
      )}

      {/* 1. SUMMARY CARDS: Total Claimed, Pending Approval, Approved, and Reimbursed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Claimed */}
        <div className="bg-[#f0f7ff] border border-blue-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Total Claimed</span>
            <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
              <DocumentTextIcon className="h-5 w-5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(metrics.totalClaimedAmt)}
            </h3>
          </div>
          <div className="mt-3 pt-2.5 border-t border-blue-100/60 flex items-center justify-between text-[11px] font-semibold text-blue-700">
            <span>{metrics.totalClaimedCount} Claims Total</span>
            <span className="flex items-center text-blue-500 hover:text-blue-700">
              This Month <ChevronRightIcon className="h-3 w-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Card 2: Pending Approval */}
        <div className="bg-[#fffbeb] border border-amber-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Pending Approval</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
              <ClockIcon className="h-5 w-5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-amber-800 tracking-tight">
              {formatCurrency(metrics.pendingApprovalAmt)}
            </h3>
          </div>
          <div className="mt-3 pt-2.5 border-t border-amber-100/60 flex items-center justify-between text-[11px] font-semibold text-amber-700">
            <span>{metrics.pendingApprovalCount} Requests Awaiting</span>
            <span className="flex items-center text-amber-600 hover:text-amber-800">
              This Month <ChevronRightIcon className="h-3 w-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Card 3: Approved */}
        <div className="bg-[#f0fdf4] border border-emerald-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Approved</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <CheckCircleIcon className="h-5 w-5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-800 tracking-tight">
              {formatCurrency(metrics.approvedAmt)}
            </h3>
          </div>
          <div className="mt-3 pt-2.5 border-t border-emerald-100/60 flex items-center justify-between text-[11px] font-semibold text-emerald-700">
            <span>{metrics.approvedCount} Claims Verified</span>
            <span className="flex items-center text-emerald-600 hover:text-emerald-800">
              This Month <ChevronRightIcon className="h-3 w-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Card 4: Reimbursed */}
        <div className="bg-[#f5f3ff] border border-purple-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Reimbursed</span>
            <div className="w-9 h-9 rounded-xl bg-purple-100/80 text-purple-600 flex items-center justify-center group-hover:scale-110 transition">
              <BanknotesIcon className="h-5 w-5 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-purple-800 tracking-tight">
              {formatCurrency(metrics.reimbursedAmt)}
            </h3>
          </div>
          <div className="mt-3 pt-2.5 border-t border-purple-100/60 flex items-center justify-between text-[11px] font-semibold text-purple-700">
            <span>{metrics.reimbursedCount} Claims Settled</span>
            <span className="flex items-center text-purple-600 hover:text-purple-800">
              This Month <ChevronRightIcon className="h-3 w-3 ml-0.5" />
            </span>
          </div>
        </div>
      </div>

      {/* 3. MAIN SECTION: 2-COLUMN GRID (Table Area + Sidebar Widgets) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Filter Bar + Recent Expense Claims Table (8 Cols) */}
        <div className="xl:col-span-8 space-y-6">
          {/* FILTER BAR CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              {/* From Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  From Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    style={{ colorScheme: "light" }}
                    className="w-full pl-3.5 pr-2.5 py-2.5 bg-slate-50/90 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* To Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  To Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    style={{ colorScheme: "light" }}
                    className="w-full pl-3.5 pr-2.5 py-2.5 bg-slate-50/90 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ colorScheme: "light" }}
                  className="w-full px-3 py-2.5 bg-slate-50/90 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition cursor-pointer"
                >
                  <option value="ALL" className="text-slate-900 bg-white">All Status</option>
                  <option value="Approved" className="text-slate-900 bg-white">Approved</option>
                  <option value="Pending" className="text-slate-900 bg-white">Pending</option>
                  <option value="Rejected" className="text-slate-900 bg-white">Rejected</option>
                  <option value="Reimbursed" className="text-slate-900 bg-white">Reimbursed</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{ colorScheme: "light" }}
                  className="w-full px-3 py-2.5 bg-slate-50/90 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition cursor-pointer"
                >
                  <option value="ALL" className="text-slate-900 bg-white">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="text-slate-900 bg-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Action Buttons */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold transition shadow-2xs"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleApplyFilters}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs shadow-blue-600/25 flex items-center gap-1.5"
              >
                <FunnelIcon className="h-3.5 w-3.5" />
                <span>Apply Filters</span>
              </button>
            </div>
          </div>

          {/* RECENT EXPENSE CLAIMS TABLE CARD */}
          <div id="expense-claims-table" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Table Header */}
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  {isPersonalScope ? "My Recent Expense Claims" : "Overall Employee Expense Claims"}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {isPersonalScope 
                    ? `Showing ${filteredExpenses.length} personal claims submitted by ${effectiveEmpName}` 
                    : `Showing ${filteredExpenses.length} claims recorded across workforce`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSubmitOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-extrabold transition shadow-xs shadow-blue-600/25 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <PlusIcon className="h-4 w-4 stroke-[3]" />
                <span>Submit Expense</span>
              </button>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-10 text-center">#</th>
                    {!isPersonalScope && <th className="py-3.5 px-4 min-w-[150px]">Employee</th>}
                    <th className="py-3.5 px-4 min-w-[200px]">Expense Title</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 font-black">Amount</th>
                    <th className="py-3.5 px-4">Approval Status</th>
                    <th className="py-3.5 px-4">Reimbursement Status</th>
                    <th className="py-3.5 px-4 min-w-[140px]">Submitted Date</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {paginatedExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={!isPersonalScope ? 10 : 9} className="py-16 text-center text-slate-400">
                        {expenses.length === 0 ? (
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                              <DocumentTextIcon className="h-7 w-7 stroke-[1.8]" />
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-800 text-sm">No Expense Claims Yet</p>
                              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                {isPersonalScope
                                  ? "You have not submitted any expense claims. Submit your first reimbursement request to start tracking."
                                  : "No expense claims found for the selected scope/department."}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsSubmitOpen(true)}
                              className="mt-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-xs shadow-blue-600/25 cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <PlusIcon className="h-4 w-4 stroke-[3]" />
                              <span>+ Submit Expense Claim</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <DocumentTextIcon className="h-10 w-10 text-slate-300 mb-1" />
                            <p className="font-bold text-slate-600 text-sm">No expense claims match your search</p>
                            <p className="text-xs text-slate-400">Try adjusting date range or category filters.</p>
                            <button
                              type="button"
                              onClick={handleResetFilters}
                              className="mt-2 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs"
                            >
                              Reset Filters
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    paginatedExpenses.map((exp, idx) => {
                      const expName = exp.expense_name || exp.expense_title || exp.title || exp.description || "Expense Claim";
                      const claimNumber = exp.claim_number || exp.claim_id || exp.claimNumber || `EXP-2026-${String(idx + 1).padStart(4, "0")}`;
                      const categoryName = normalizeCategory(exp.category);
                      const catStyle = getCategoryColor(categoryName);
                      const expDate = exp.expense_date || exp.date || exp.claim_date;
                      const expAmount = Number(exp.amount ?? exp.total_amount ?? 0);
                      const appStatus = exp.approval_status || exp.status || "Pending";
                      const reimbStatus = exp.reimbursement_status || "Pending";
                      const submittedOn = exp.submitted_date || exp.created_at || expDate;
                      const appBadge = getApprovalBadge(appStatus);
                      const reimbBadge = getReimbursementBadge(reimbStatus);
                      const rowIndex = (currentPage - 1) * pageSize + idx + 1;

                      return (
                        <tr
                          key={exp.id || claimNumber}
                          className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                          onClick={() => setSelectedExpense(exp)}
                        >
                          {/* 1. # */}
                          <td className="py-3.5 px-4 text-center font-bold text-slate-400 text-xs">
                            {rowIndex}
                          </td>

                          {/* 1B. Employee (shown in Overall view) */}
                          {!isPersonalScope && (
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="font-bold text-slate-900">{exp.employee_name || "Employee"}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {exp.employee_id} {exp.department ? `• ${exp.department}` : ""}
                              </div>
                            </td>
                          )}

                          {/* 2. Expense Title & Request ID */}
                          <td className="py-3.5 px-4">
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-blue-600 transition flex items-center gap-1.5">
                                <span>{expName}</span>
                                {exp.receipt_url && (
                                  <span title="Receipt Attached" className="text-slate-400">
                                    <PaperClipIcon className="h-3.5 w-3.5 text-blue-500" />
                                  </span>
                                )}
                              </p>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {claimNumber}
                              </span>
                            </div>
                          </td>

                          {/* 3. Category */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catStyle.fill }}></span>
                              <span>{categoryName}</span>
                            </span>
                          </td>

                          {/* 4. Date */}
                          <td className="py-3.5 px-4 font-semibold text-slate-600 whitespace-nowrap">
                            {formatDate(expDate)}
                          </td>

                          {/* 5. Amount */}
                          <td className="py-3.5 px-4 font-black text-slate-900 whitespace-nowrap">
                            {formatCurrency(expAmount)}
                          </td>

                          {/* 6. Approval Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${appBadge.className}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${appBadge.dotClass}`}></span>
                              <span>{appBadge.label}</span>
                            </span>
                          </td>

                          {/* 7. Reimbursement Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] border ${reimbBadge.className}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${reimbBadge.dotClass}`}></span>
                              <span>{reimbBadge.label}</span>
                            </span>
                          </td>

                          {/* 8. Submitted Date */}
                          <td className="py-3.5 px-4 text-[11px] font-medium text-slate-500 whitespace-nowrap">
                            {formatDateTime(submittedOn)}
                          </td>

                          {/* 9. Actions */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedExpense(exp);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition border border-transparent hover:border-blue-200"
                              title="View Claim Details"
                            >
                              <EllipsisHorizontalIcon className="h-5 w-5 stroke-[2.5]" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Pagination */}
            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/40 text-xs">
              <span className="text-slate-500 font-semibold">
                Showing {paginatedExpenses.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
                {Math.min(currentPage * pageSize, filteredExpenses.length)} of {filteredExpenses.length} results
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeftIcon className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setCurrentPage(pg)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                      currentPage === pg
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {pg}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Quick Actions + Expense by Category + Need Help? (4 Cols) */}
        <div className="xl:col-span-4 space-y-6">
          {/* CARD 1: QUICK ACTIONS */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 text-slate-900 pb-2 border-b border-slate-100">
              <BoltIcon className="h-4 w-4 text-blue-600" />
              <h4 className="font-extrabold text-sm">Quick Actions</h4>
            </div>

            <div className="space-y-2.5">
              {/* View My Requests */}
              <button
                type="button"
                onClick={() => {
                  handleResetFilters();
                  const el = document.getElementById("expense-claims-table");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-2 shadow-2xs"
              >
                <DocumentTextIcon className="h-4 w-4 text-slate-500" />
                <span>View My Requests</span>
              </button>

              {/* Download Reports */}
              <button
                type="button"
                onClick={handleDownloadReport}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-2 shadow-2xs"
              >
                <ArrowDownTrayIcon className="h-4 w-4 text-slate-500" />
                <span>Download Reports</span>
              </button>
            </div>
          </div>

          {/* CARD 2: EXPENSE BY CATEGORY (SVG DONUT CHART) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 pb-2 border-b border-slate-100">
              <ChartPieIcon className="h-4 w-4 text-blue-600" />
              <h4 className="font-extrabold text-sm">Expense by Category</h4>
            </div>

            {/* Donut Chart SVG */}
            <div className="flex flex-col items-center justify-center pt-2">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                  {(() => {
                    const radius = 52;
                    const circ = 2 * Math.PI * radius;
                    let currentOffset = 0;

                    if (!categoryBreakdown.total || categoryBreakdown.list.length === 0) {
                      return (
                        <circle
                          cx="80"
                          cy="80"
                          r={radius}
                          fill="transparent"
                          stroke="#f1f5f9"
                          strokeWidth="18"
                        />
                      );
                    }

                    return categoryBreakdown.list.map((item) => {
                      const strokeVal = (item.amount / (categoryBreakdown.total || 1)) * circ;
                      const segment = (
                        <circle
                          key={item.category}
                          cx="80"
                          cy="80"
                          r={radius}
                          fill="transparent"
                          stroke={item.fill}
                          strokeWidth="18"
                          strokeDasharray={`${strokeVal} ${circ}`}
                          strokeDashoffset={-currentOffset}
                          className="transition-all duration-500 hover:opacity-80"
                        />
                      );
                      currentOffset += strokeVal;
                      return segment;
                    });
                  })()}
                </svg>

                {/* Donut Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-base font-black text-slate-900 tracking-tight">
                    {formatCurrency(categoryBreakdown.total)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                    Total Amount
                  </span>
                </div>
              </div>
            </div>

            {/* Category Breakdown Legend */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              {categoryBreakdown.list.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400 font-medium">
                  No expense categories to display yet
                </div>
              ) : (
                categoryBreakdown.list.slice(0, 5).map((item) => (
                  <div key={item.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }}></span>
                      <span className="font-semibold text-slate-700 truncate">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-slate-900">{formatCurrency(item.amount)}</span>
                      <span className="text-[11px] font-semibold text-slate-400 w-8 text-right">{item.pct}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CARD 3: NEED HELP? CARD */}
          <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-white rounded-2xl border border-blue-100/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                <LightBulbIcon className="h-5 w-5 stroke-[2]" />
              </div>
              <div>
                <h5 className="font-extrabold text-sm text-slate-900">Need Help?</h5>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  For any reimbursement related queries, contact your HR team.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onNavigateTab) {
                  onNavigateTab("HELPDESK", "Helpdesk Dashboard");
                }
              }}
              className="w-full pt-2 flex items-center justify-between text-xs font-extrabold text-blue-600 hover:text-blue-800 group"
            >
              <span>View Helpdesk</span>
              <ChevronRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. MODAL: + SUBMIT EXPENSE CLAIM */}
      {isSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs shadow-blue-600/25">
                  <PlusIcon className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Submit Expense Claim</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Record out-of-pocket expenses for supervisor review and company reimbursement.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSubmitOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitExpense} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
                  <XCircleIcon className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Expense Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Expense Title / Purpose <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="expense_name"
                  value={formState.expense_name}
                  onChange={handleInputChange}
                  placeholder="e.g. Flight Tickets to Client Site, Sprint Lunch, Router Hardware..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-semibold text-slate-900 bg-white placeholder:text-slate-400"
                  required
                />
              </div>

              {/* 2. Category & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formState.category}
                    onChange={handleInputChange}
                    style={{ colorScheme: "light" }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-semibold text-slate-900 bg-white cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="text-slate-900 bg-white font-medium py-1">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Amount Paid (₹ INR) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 font-bold">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      value={formState.amount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-black text-slate-900 bg-white placeholder:text-slate-400"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 3. Expense Date & Department/Project */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Expense Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="expense_date"
                    value={formState.expense_date}
                    onChange={handleInputChange}
                    style={{ colorScheme: "light" }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-semibold text-slate-900 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Department / Project
                  </label>
                  <input
                    type="text"
                    name="department_project"
                    value={formState.department_project}
                    onChange={handleInputChange}
                    placeholder="e.g. IT Engineering - Client Delivery"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-semibold text-slate-900 bg-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* 4. Payment Method */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  name="payment_method"
                  value={formState.payment_method}
                  onChange={handleInputChange}
                  style={{ colorScheme: "light" }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-semibold text-slate-900 bg-white cursor-pointer"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm} value={pm} className="text-slate-900 bg-white font-medium py-1">
                      {pm}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Description / Business Justification
                </label>
                <textarea
                  rows="2"
                  name="description"
                  value={formState.description}
                  onChange={handleInputChange}
                  placeholder="Provide context and rationale on why this expense was required for business..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-semibold text-slate-900 bg-white placeholder:text-slate-400"
                />
              </div>

              {/* 6. Receipt Upload */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Upload Receipt Voucher / Tax Invoice
                </label>
                <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-4 transition bg-slate-50/50">
                  <div className="flex flex-col items-center justify-center space-y-2 text-center">
                    <PaperClipIcon className="h-6 w-6 text-blue-600" />
                    <div className="text-xs text-slate-600">
                      <label className="font-bold text-blue-600 hover:underline cursor-pointer">
                        Click to upload receipt
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.webp"
                          onChange={handleReceiptChange}
                          className="hidden"
                        />
                      </label>{" "}
                      <span>or drag and drop</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Supported formats: PDF, PNG, JPG, WEBP (Max 10MB)</p>
                  </div>

                  {uploadProgress && (
                    <p className="text-[11px] font-bold text-blue-600 text-center mt-2 animate-pulse">
                      Uploading receipt file...
                    </p>
                  )}

                  {formState.receipt_url && (
                    <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800 font-semibold">
                      <div className="flex items-center gap-1.5 truncate">
                        <CheckCircleIcon className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="truncate">
                          {formState.receipt_file?.name || "Receipt document attached"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormState((prev) => ({ ...prev, receipt_file: null, receipt_url: "" }))}
                        className="text-rose-500 hover:underline font-bold text-[10px] shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSubmitOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider transition shadow-xs shadow-blue-600/25 flex items-center gap-2 cursor-pointer"
                >
                  {formSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Expense</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: VIEW EXPENSE DETAILS */}
      {selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-blue-600/25">
                  <DocumentTextIcon className="h-5 w-5 stroke-[2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">
                      {selectedExpense.expense_name || selectedExpense.expense_title || selectedExpense.title || "Expense Claim"}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-600 border border-slate-200">
                      {selectedExpense.claim_number || selectedExpense.claim_id || selectedExpense.claimNumber || "EXP-CLAIM"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Filed on {formatDate(selectedExpense.expense_date || selectedExpense.date)} • Category: {normalizeCategory(selectedExpense.category)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedExpense(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              {/* Highlight Stat Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Amount</span>
                  <p className="text-base font-black text-slate-900 mt-0.5">{formatCurrency(selectedExpense.amount)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Approval</span>
                  <div className="mt-1">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getApprovalBadge(selectedExpense.approval_status).className}`}>
                      {getApprovalBadge(selectedExpense.approval_status).label}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Reimbursement</span>
                  <div className="mt-1">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getReimbursementBadge(selectedExpense.reimbursement_status).className}`}>
                      {getReimbursementBadge(selectedExpense.reimbursement_status).label}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Payment Method</span>
                  <p className="text-xs font-bold text-slate-800 mt-1 truncate">{selectedExpense.payment_method || "Corporate Card"}</p>
                </div>
              </div>

              {/* 4-Stage Reimbursement Lifecycle Audit Tracker */}
              <div className="p-4 bg-gradient-to-r from-blue-50/50 via-indigo-50/20 to-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                  <ShieldCheckIcon className="h-4 w-4" /> Reimbursement Lifecycle Audit
                </span>
                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                  {/* Step 1 */}
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black mb-1">
                      ✓
                    </div>
                    <span className="text-slate-800">1. Submitted</span>
                    <span className="text-[9px] text-slate-400 font-semibold">{formatDate(selectedExpense.expense_date)}</span>
                  </div>
                  {/* Step 2 */}
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black mb-1 text-white ${
                      String(selectedExpense.approval_status).toLowerCase() === "approved"
                        ? "bg-emerald-600"
                        : String(selectedExpense.approval_status).toLowerCase() === "rejected"
                        ? "bg-rose-600"
                        : "bg-amber-500"
                    }`}>
                      {String(selectedExpense.approval_status).toLowerCase() === "approved" ? "✓" : "2"}
                    </div>
                    <span className="text-slate-800">2. Manager Review</span>
                    <span className="text-[9px] text-slate-400 font-semibold">{selectedExpense.approval_status || "Pending"}</span>
                  </div>
                  {/* Step 3 */}
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black mb-1 text-white ${
                      String(selectedExpense.reimbursement_status).toLowerCase() === "reimbursed" || String(selectedExpense.reimbursement_status).toLowerCase() === "processing"
                        ? "bg-emerald-600"
                        : "bg-slate-300"
                    }`}>
                      {String(selectedExpense.reimbursement_status).toLowerCase() === "reimbursed" ? "✓" : "3"}
                    </div>
                    <span className="text-slate-800">3. Finance Audit</span>
                    <span className="text-[9px] text-slate-400 font-semibold">
                      {String(selectedExpense.reimbursement_status).toLowerCase() === "reimbursed" ? "Verified" : "Under Audit"}
                    </span>
                  </div>
                  {/* Step 4 */}
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black mb-1 text-white ${
                      String(selectedExpense.reimbursement_status).toLowerCase() === "reimbursed"
                        ? "bg-emerald-600"
                        : "bg-slate-300"
                    }`}>
                      {String(selectedExpense.reimbursement_status).toLowerCase() === "reimbursed" ? "✓" : "4"}
                    </div>
                    <span className="text-slate-800">4. Disbursed</span>
                    <span className="text-[9px] text-slate-400 font-semibold">
                      {selectedExpense.payment_date ? formatDate(selectedExpense.payment_date) : "Pending"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-2.5">
                <h5 className="font-extrabold text-slate-900 border-b border-slate-100 pb-1.5">
                  Claim Breakdown & Justification
                </h5>
                <div className="grid grid-cols-2 gap-y-2.5 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold">Employee Name:</span>
                    <p className="font-bold text-slate-800">{selectedExpense.employee_name || effectiveEmpName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">Employee ID:</span>
                    <p className="font-bold text-slate-800">{selectedExpense.employee_id || effectiveEmpId}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">Expense Date:</span>
                    <p className="font-bold text-slate-800">{formatDate(selectedExpense.expense_date)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">Department / Project:</span>
                    <p className="font-bold text-slate-800">{selectedExpense.project || selectedExpense.department || effectiveDept}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 font-semibold">Business Justification:</span>
                    <p className="font-bold text-slate-800 mt-0.5">{selectedExpense.description || "--"}</p>
                  </div>
                  {selectedExpense.remarks && (
                    <div className="col-span-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                      <span className="text-slate-400 font-semibold text-[10px] uppercase">Approver / Audit Remarks:</span>
                      <p className="font-bold text-slate-700 text-xs mt-0.5">{selectedExpense.remarks}</p>
                    </div>
                  )}
                  {selectedExpense.payment_reference && (
                    <div className="col-span-2 p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
                      <span className="text-emerald-700 font-semibold text-[10px] uppercase">Payment Reference:</span>
                      <p className="font-black text-emerald-900 text-xs mt-0.5">
                        {selectedExpense.payment_reference} {selectedExpense.payment_date && `(Paid on ${formatDate(selectedExpense.payment_date)})`}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Attached Receipt Preview */}
              <div className="space-y-2">
                <h5 className="font-extrabold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                  <span>Attached Receipt</span>
                  {selectedExpense.receipt_url && (
                    <a
                      href={resolveFileUrl(selectedExpense.receipt_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <span>Open in New Tab</span>
                      <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                    </a>
                  )}
                </h5>

                {selectedExpense.receipt_url ? (
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                        <PaperClipIcon className="h-4 w-4" />
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-slate-800 truncate">
                          {selectedExpense.receipt_url.split("/").pop() || "Receipt_Voucher.pdf"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold">Attached Tax Invoice</p>
                      </div>
                    </div>
                    <a
                      href={resolveFileUrl(selectedExpense.receipt_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                    >
                      View Receipt
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">No receipt document was attached for this claim.</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                {canManageEmployees && !isRegularEmployee && selectedExpense && selectedExpense.approval_status === "Pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleUpdateClaimStatus(selectedExpense.id, "Approved")}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold transition text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      <span>Approve Claim</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const reason = window.prompt("Enter rejection reason:");
                        if (reason) handleUpdateClaimStatus(selectedExpense.id, "Rejected", reason);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold transition text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircleIcon className="h-4 w-4" />
                      <span>Reject Claim</span>
                    </button>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedExpense(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseReimbursementSection;
