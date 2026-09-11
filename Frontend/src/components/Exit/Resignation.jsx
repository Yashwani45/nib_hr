// Frontend/src/components/Exit/Resignation.jsx
import React, { useState, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon,
  ArrowUturnLeftIcon,
  DocumentArrowDownIcon,
  EllipsisVerticalIcon,
  XMarkIcon,
  ClockIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  PaperClipIcon
} from "@heroicons/react/24/outline";
import { SAMPLE_RESIGNATIONS, getStatusBadgeClass } from "./exitData";

// Employee Master Presets for New Submissions
const EMP_PRESETS = [
  {
    name: "Rahul Sharma",
    id: "EMP1024",
    dept: "Engineering",
    desig: "Senior Software Engineer",
    manager: "Rajesh Kumar",
    doj: "10 Jan 2024",
    empType: "Full-Time Permanent"
  },
  {
    name: "Priya Patel",
    id: "EMP1087",
    dept: "Human Resources",
    desig: "HR Executive",
    manager: "Anjali Mehta",
    doj: "15 Jun 2024",
    empType: "Full-Time Permanent"
  },
  {
    name: "Amit Verma",
    id: "EMP1132",
    dept: "Finance",
    desig: "Finance Executive",
    manager: "Suresh Pillai",
    doj: "01 Feb 2023",
    empType: "Full-Time Permanent"
  },
  {
    name: "Neha Singh",
    id: "EMP1156",
    dept: "Marketing",
    desig: "Marketing Executive",
    manager: "Deepak Chawla",
    doj: "12 Nov 2023",
    empType: "Full-Time Permanent"
  }
];

const Resignation = ({ user, onViewEmployee }) => {
  const [records, setRecords] = useState(SAMPLE_RESIGNATIONS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [sortField, setSortField] = useState("resignationDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Active Dropdown Row ID
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState("");

  // Modals State
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [detailModalRecord, setDetailModalRecord] = useState(null);
  const [editModal, setEditModal] = useState({ isOpen: false, record: null });
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    record: null,
    actionType: "",
    remarks: "",
    approvedLwd: ""
  });

  // Submit Resignation Form State
  const [newSubmission, setNewSubmission] = useState({
    employee: EMP_PRESETS[0].name,
    employeeId: EMP_PRESETS[0].id,
    department: EMP_PRESETS[0].dept,
    designation: EMP_PRESETS[0].desig,
    reportingManager: EMP_PRESETS[0].manager,
    doj: EMP_PRESETS[0].doj,
    empType: EMP_PRESETS[0].empType,
    resignationDate: new Date().toISOString().split("T")[0],
    proposedLastWorkingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    noticePeriod: 30,
    noticePeriodServed: 0,
    exitType: "Voluntary",
    reason: "Better Opportunity",
    comments: "",
    supportingDoc: null
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Filter & Search Logic
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        r.employee.toLowerCase().includes(search.toLowerCase()) ||
        r.employeeId.toLowerCase().includes(search.toLowerCase()) ||
        r.department.toLowerCase().includes(search.toLowerCase()) ||
        r.reason.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "ALL" || r.status.toLowerCase() === statusFilter.toLowerCase();
      const matchDept = deptFilter === "ALL" || r.department.toLowerCase() === deptFilter.toLowerCase();

      let matchDate = true;
      if (dateRange.start && dateRange.end) {
        matchDate = r.resignationDate >= dateRange.start && r.resignationDate <= dateRange.end;
      }

      return matchSearch && matchStatus && matchDept && matchDate;
    });
  }, [records, search, statusFilter, deptFilter, dateRange]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredRecords, currentPage]);

  // Summary Card Counts (Total Resignations: 128, Pending: 12, Manager Review: 8, Notice Period: 24, Completed: 59)
  const summaryCards = [
    { title: "Total Resignations", count: 128, color: "border-slate-200 bg-white text-slate-900" },
    { title: "Pending Approval", count: 12, color: "border-amber-200 bg-amber-50/50 text-amber-800" },
    { title: "Manager Review", count: 8, color: "border-blue-200 bg-blue-50/50 text-blue-800" },
    { title: "Notice Period", count: 24, color: "border-purple-200 bg-purple-50/50 text-purple-800" },
    { title: "Completed", count: 59, color: "border-emerald-200 bg-emerald-50/50 text-emerald-800" }
  ];

  // Actions Handlers
  const handleOpenDetail = (record) => {
    setDetailModalRecord(record);
    setActiveDropdownId(null);
  };

  const handleOpenEdit = (record) => {
    setEditModal({
      isOpen: true,
      record: { ...record }
    });
    setActiveDropdownId(null);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editModal.record) return;

    setRecords((prev) =>
      prev.map((item) => (item.id === editModal.record.id ? editModal.record : item))
    );

    if (detailModalRecord?.id === editModal.record.id) {
      setDetailModalRecord(editModal.record);
    }

    showToast(`Updated resignation details for ${editModal.record.employee}.`);
    setEditModal({ isOpen: false, record: null });
  };

  const handleQuickApprove = (record) => {
    setReviewModal({
      isOpen: true,
      record,
      actionType: "Approve",
      remarks: "Approved as per standard notice period.",
      approvedLwd: record.lastWorkingDay || record.proposedLWD
    });
    setActiveDropdownId(null);
  };

  const handleQuickReject = (record) => {
    setReviewModal({
      isOpen: true,
      record,
      actionType: "Reject",
      remarks: "",
      approvedLwd: record.lastWorkingDay
    });
    setActiveDropdownId(null);
  };

  const handleConfirmReview = (e) => {
    e.preventDefault();
    const isApprove = reviewModal.actionType === "Approve";
    const nextStatus = isApprove ? "Approved" : "Rejected";

    setRecords((prev) =>
      prev.map((item) => {
        if (item.id === reviewModal.record.id) {
          const updated = {
            ...item,
            status: nextStatus,
            lastWorkingDay: reviewModal.approvedLwd || item.lastWorkingDay,
            confirmedLwd: reviewModal.approvedLwd || item.confirmedLwd,
            hrApproval: {
              status: isApprove ? "Approved" : "Rejected",
              approvedBy: user?.name || "HR Admin",
              approvalDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
              remarks: reviewModal.remarks || (isApprove ? "Exit process initiated" : "Request declined")
            },
            historyTimeline: [
              ...(item.historyTimeline || []),
              {
                date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
                title: isApprove ? "HR approved resignation" : "HR rejected resignation",
                actor: user?.name || "HR Admin"
              }
            ]
          };
          if (detailModalRecord?.id === item.id) {
            setDetailModalRecord(updated);
          }
          return updated;
        }
        return item;
      })
    );

    showToast(`Resignation for ${reviewModal.record.employee} has been ${isApprove ? "Approved" : "Rejected"}.`);
    setReviewModal({ isOpen: false, record: null, actionType: "", remarks: "", approvedLwd: "" });
  };

  const handleWithdraw = (record) => {
    if (window.confirm(`Are you sure you want to withdraw the resignation for ${record.employee}?`)) {
      setRecords((prev) =>
        prev.map((item) =>
          item.id === record.id
            ? {
                ...item,
                status: "Withdrawn",
                historyTimeline: [
                  ...(item.historyTimeline || []),
                  {
                    date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
                    title: "Resignation withdrawn",
                    actor: record.employee
                  }
                ]
              }
            : item
        )
      );
      showToast(`Resignation for ${record.employee} has been withdrawn.`);
    }
    setActiveDropdownId(null);
  };

  const handleDownload = (record) => {
    const docketText = `======================================================================
               NATION INSURANCE BROKER (NIB)
         ENTERPRISE RESIGNATION MANAGEMENT DOCKET
======================================================================
Date Generated: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
Reference ID: NIB/EXIT/RES/${record.employeeId}

1. EMPLOYEE PROFILE
----------------------------------------------------------------------
Employee Name      : ${record.employee}
Employee ID        : ${record.employeeId}
Department         : ${record.department}
Designation        : ${record.designation}
Reporting Manager  : ${record.manager || "Rajesh Kumar"}
Date of Joining    : ${record.doj || "10 Jan 2024"}
Employment Type    : ${record.employmentType || "Full-Time Permanent"}

2. RESIGNATION SPECIFICATIONS
----------------------------------------------------------------------
Resignation Date   : ${record.resignationDate}
Proposed LWD       : ${record.proposedLWD || record.lastWorkingDay}
Confirmed LWD      : ${record.confirmedLwd || record.lastWorkingDay}
Notice Period      : ${record.noticePeriod}
Notice Served      : ${record.noticeServed || 0} Days
Notice Remaining   : ${record.noticeRemaining || 30} Days
Exit Type          : ${record.exitType}
Primary Reason     : ${record.reason}
Current Status     : ${record.status}

3. APPROVAL GOVERNANCE AUDIT
----------------------------------------------------------------------
Manager Approval   : ${record.managerApproval?.status || "Approved"}
Approved By        : ${record.managerApproval?.approvedBy || "Rajesh Kumar"}
Approval Remarks   : ${record.managerApproval?.remarks || "Approved as per notice period"}

HR Approval        : ${record.hrApproval?.status || "Approved"}
Approved By        : ${record.hrApproval?.approvedBy || "HR Admin"}
Approval Remarks   : ${record.hrApproval?.remarks || "Exit process initiated"}

4. NOTICE PERIOD PROGRESS
----------------------------------------------------------------------
Notice Duration    : ${record.noticePeriod} (${record.noticeServed || 18} Days Completed, ${record.noticeRemaining || 12} Days Remaining)
Leave Taken        : ${record.leaveDuringNotice || "0 Days"}
Attendance Status  : ${record.attendanceStatus || "100% Present"}

Corporate Seal: Nation Insurance Broker HR Governance & Compliance
======================================================================`;

    const blob = new Blob([docketText], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Resignation_Docket_${record.employeeId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloaded official resignation docket for ${record.employee}.`);
    setActiveDropdownId(null);
  };

  // Submit Resignation Logic
  const handleTriggerSubmit = (e) => {
    e.preventDefault();
    setConfirmSubmitOpen(true);
  };

  const handleFinalSubmit = () => {
    const newRecord = {
      id: Date.now(),
      employee: newSubmission.employee,
      employeeId: newSubmission.employeeId,
      department: newSubmission.department,
      designation: newSubmission.designation,
      manager: newSubmission.reportingManager,
      doj: newSubmission.doj,
      employmentType: newSubmission.empType,
      resignationDate: newSubmission.resignationDate,
      proposedLWD: newSubmission.proposedLastWorkingDate,
      lastWorkingDay: newSubmission.proposedLastWorkingDate,
      confirmedLwd: newSubmission.proposedLastWorkingDate,
      noticePeriod: `${newSubmission.noticePeriod} Days`,
      noticeServed: 0,
      noticeRemaining: newSubmission.noticePeriod,
      noticeStartDate: newSubmission.resignationDate,
      noticeEndDate: newSubmission.proposedLastWorkingDate,
      leaveDuringNotice: "0 Days",
      attendanceStatus: "100% Present",
      exitType: newSubmission.exitType,
      reason: newSubmission.reason,
      employeeRemarks: newSubmission.comments || "Submitted via Enterprise Resignation Portal.",
      managerRemarks: "Awaiting manager review.",
      hrRemarks: "Pending manager recommendation.",
      status: "Pending",
      avatar: newSubmission.employee.slice(0, 2).toUpperCase(),
      email: `${newSubmission.employeeId.toLowerCase()}@nibhr.com`,
      managerApproval: {
        status: "Pending",
        approvedBy: newSubmission.reportingManager,
        approvalDate: "—",
        remarks: "Under review"
      },
      hrApproval: {
        status: "Pending",
        approvedBy: "HR Admin",
        approvalDate: "—",
        remarks: "Pending manager sign-off"
      },
      historyTimeline: [
        {
          date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
          title: "Resignation submitted",
          actor: newSubmission.employee
        }
      ],
      currentStage: "Manager Review",
      stageIndex: 2
    };

    setRecords([newRecord, ...records]);
    setConfirmSubmitOpen(false);
    setSubmitModalOpen(false);
    showToast(`Resignation for ${newRecord.employee} submitted successfully!`);
  };

  const exportTableCSV = () => {
    const headers = [
      "Employee",
      "Employee ID",
      "Department",
      "Designation",
      "Resignation Date",
      "Last Working Day",
      "Reason",
      "Notice Period",
      "Status"
    ];
    const rows = filteredRecords.map((r) => [
      `"${r.employee}"`,
      `"${r.employeeId}"`,
      `"${r.department}"`,
      `"${r.designation}"`,
      `"${r.resignationDate}"`,
      `"${r.lastWorkingDay}"`,
      `"${r.reason}"`,
      `"${r.noticePeriod}"`,
      `"${r.status}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Resignation_Management_Export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Resignation records exported successfully.");
  };

  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between text-xs font-bold animate-fade-in border border-emerald-500">
          <div className="flex items-center gap-2.5">
            <CheckCircleIcon className="w-5 h-5 text-white shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage("")} className="p-1 hover:bg-white/20 rounded-lg">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Page Header */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Employee Exit Lifecycle
              </span>
              <span className="text-[10px] font-bold text-slate-400">• Step 2: Separation Governance</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Resignation Management</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Submit employee resignations, manage manager/HR review workflows, and monitor active notice periods.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setSubmitModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm shadow-indigo-100"
            >
              <PlusIcon className="w-4 h-4 stroke-[2.5]" />
              <span>+ Submit Resignation</span>
            </button>

            <button
              onClick={exportTableCSV}
              className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition flex items-center gap-1.5 shadow-sm"
            >
              <ArrowDownTrayIcon className="w-4 h-4 text-slate-500" />
              <span>Export</span>
            </button>

            <button
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              className={`px-4 py-2.5 border rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                showFilterDrawer || statusFilter !== "ALL" || deptFilter !== "ALL"
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <FunnelIcon className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by employee name, employee ID, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs font-semibold focus:outline-indigo-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Expandable Filter Drawer */}
        {showFilterDrawer && (
          <div className="mt-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="Pending">Pending (Yellow)</option>
                <option value="Manager Review">Manager Review (Blue)</option>
                <option value="Approved">Approved (Green)</option>
                <option value="Notice Period">Notice Period (Purple)</option>
                <option value="Rejected">Rejected (Red)</option>
                <option value="Completed">Completed (Green)</option>
                <option value="Withdrawn">Withdrawn (Gray)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Department</label>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-indigo-500"
              >
                <option value="ALL">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance">Finance</option>
                <option value="Marketing">Marketing</option>
                <option value="Design">Design</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={() => {
                  setStatusFilter("ALL");
                  setDeptFilter("ALL");
                  setSearch("");
                }}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-100 text-xs transition w-full"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards (Exact 5 Cards from Specification) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {summaryCards.map((c) => (
          <div key={c.title} className={`rounded-3xl p-5 border shadow-sm transition hover:shadow-md ${c.color}`}>
            <span className="text-[10px] font-black uppercase tracking-wider block opacity-70">
              {c.title}
            </span>
            <p className="text-3xl font-black mt-2 tracking-tight">{c.count}</p>
          </div>
        ))}
      </div>

      {/* Resignation Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Resignation Directory
            </h3>
            <p className="text-[11px] text-slate-400">Showing {filteredRecords.length} registered resignation records</p>
          </div>
          <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-4">Employee</th>
                <th className="px-4 py-4">Employee ID</th>
                <th className="px-4 py-4">Department</th>
                <th className="px-4 py-4">Designation</th>
                <th className="px-4 py-4">Resignation Date</th>
                <th className="px-4 py-4">Last Working Day</th>
                <th className="px-4 py-4">Reason</th>
                <th className="px-4 py-4">Notice Period</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold">
              {paginatedRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4 font-bold text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs shrink-0">
                        {r.avatar || r.employee?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="block font-black text-slate-900">{r.employee}</span>
                        <span className="text-[10px] text-slate-400">{r.email || `${r.employeeId.toLowerCase()}@nibhr.com`}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono font-bold text-indigo-600">{r.employeeId}</td>
                  <td className="px-4 py-4 text-slate-600">{r.department}</td>
                  <td className="px-4 py-4 text-slate-600">{r.designation}</td>
                  <td className="px-4 py-4 text-slate-500">{r.resignationDate}</td>
                  <td className="px-4 py-4 font-black text-slate-900">{r.lastWorkingDay}</td>
                  <td className="px-4 py-4 text-slate-700">{r.reason}</td>
                  <td className="px-4 py-4 font-semibold text-slate-600">{r.noticePeriod}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusBadgeClass(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center relative">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Primary View Details Button */}
                      <button
                        onClick={() => handleOpenDetail(r)}
                        className="px-2.5 py-1 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-slate-200 shadow-2xs"
                        title="View Details"
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>

                      {/* Dropdown Menu Toggle */}
                      <div className="relative">
                        <button
                          onClick={() => setActiveDropdownId(activeDropdownId === r.id ? null : r.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition border border-slate-200"
                          title="Actions Menu"
                        >
                          <EllipsisVerticalIcon className="w-4 h-4" />
                        </button>

                        {/* Action Menu Popover */}
                        {activeDropdownId === r.id && (
                          <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 py-1.5 text-left text-xs font-bold animate-fade-in">
                            <button
                              onClick={() => handleOpenDetail(r)}
                              className="w-full px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <EyeIcon className="w-4 h-4 text-slate-500" />
                              <span>View Details</span>
                            </button>

                            {r.status !== "Approved" && r.status !== "Completed" && (
                              <button
                                onClick={() => handleQuickApprove(r)}
                                className="w-full px-3.5 py-2 text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                              >
                                <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                                <span>Approve</span>
                              </button>
                            )}

                            {r.status !== "Rejected" && r.status !== "Completed" && (
                              <button
                                onClick={() => handleQuickReject(r)}
                                className="w-full px-3.5 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                              >
                                <XCircleIcon className="w-4 h-4 text-rose-600" />
                                <span>Reject</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenEdit(r)}
                              className="w-full px-3.5 py-2 text-indigo-600 hover:bg-indigo-50 flex items-center gap-2"
                            >
                              <PencilSquareIcon className="w-4 h-4 text-indigo-600" />
                              <span>Edit</span>
                            </button>

                            {r.status !== "Withdrawn" && r.status !== "Completed" && (
                              <button
                                onClick={() => handleWithdraw(r)}
                                className="w-full px-3.5 py-2 text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                              >
                                <ArrowUturnLeftIcon className="w-4 h-4 text-amber-600" />
                                <span>Withdraw</span>
                              </button>
                            )}

                            <div className="border-t border-slate-100 my-1" />

                            <button
                              onClick={() => handleDownload(r)}
                              className="w-full px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <DocumentArrowDownIcon className="w-4 h-4 text-slate-500" />
                              <span>Download</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400">
                    No resignation records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
          <span className="text-slate-400 font-semibold">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} entries
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
                currentPage === 1 ? "text-slate-300 border-slate-200 cursor-not-allowed" : "text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`w-7 h-7 rounded-xl text-xs font-black transition ${
                  currentPage === num ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
                currentPage === totalPages ? "text-slate-300 border-slate-200 cursor-not-allowed" : "text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SUBMIT RESIGNATION MODAL */}
      {/* ========================================================================= */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  Submit Resignation Application
                </h3>
                <p className="text-xs text-slate-400">Initiate separation request into the approval lifecycle</p>
              </div>
              <button
                onClick={() => setSubmitModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTriggerSubmit} className="space-y-5 text-xs">
              {/* Employee Information Section (Read-Only) */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">
                    Employee Information (Auto-Populated & Read-Only)
                  </h4>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    System Verified
                  </span>
                </div>

                {/* Preset Selector */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Select Identity To Submit For:
                  </label>
                  <select
                    value={newSubmission.employee}
                    onChange={(e) => {
                      const sel = EMP_PRESETS.find((p) => p.name === e.target.value);
                      if (sel) {
                        setNewSubmission({
                          ...newSubmission,
                          employee: sel.name,
                          employeeId: sel.id,
                          department: sel.dept,
                          designation: sel.desig,
                          reportingManager: sel.manager,
                          doj: sel.doj,
                          empType: sel.empType
                        });
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                  >
                    {EMP_PRESETS.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.id}) — {p.dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Employee Name</span>
                    <p className="font-extrabold text-slate-900 mt-0.5">{newSubmission.employee}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Employee ID</span>
                    <p className="font-mono font-extrabold text-indigo-600 mt-0.5">{newSubmission.employeeId}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
                    <p className="font-bold text-slate-800 mt-0.5">{newSubmission.department}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Designation</span>
                    <p className="font-bold text-slate-800 mt-0.5">{newSubmission.designation}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Reporting Manager</span>
                    <p className="font-bold text-slate-800 mt-0.5">{newSubmission.reportingManager}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Date of Joining</span>
                    <p className="font-bold text-slate-800 mt-0.5">{newSubmission.doj}</p>
                  </div>
                </div>
              </div>

              {/* Resignation Details */}
              <div className="space-y-3.5">
                <h4 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">
                  Resignation Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Resignation Date *
                    </label>
                    <input
                      type="date"
                      value={newSubmission.resignationDate}
                      onChange={(e) => setNewSubmission({ ...newSubmission, resignationDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold focus:outline-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Proposed Last Working Date *
                    </label>
                    <input
                      type="date"
                      value={newSubmission.proposedLastWorkingDate}
                      onChange={(e) => setNewSubmission({ ...newSubmission, proposedLastWorkingDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold focus:outline-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Notice Period (Days) *
                    </label>
                    <input
                      type="number"
                      value={newSubmission.noticePeriod}
                      onChange={(e) => setNewSubmission({ ...newSubmission, noticePeriod: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold focus:outline-indigo-500"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Notice Period Served (Days)
                    </label>
                    <input
                      type="number"
                      value={newSubmission.noticePeriodServed}
                      onChange={(e) => setNewSubmission({ ...newSubmission, noticePeriodServed: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold focus:outline-indigo-500"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Exit Type *
                    </label>
                    <select
                      value={newSubmission.exitType}
                      onChange={(e) => setNewSubmission({ ...newSubmission, exitType: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold focus:outline-indigo-500"
                    >
                      <option value="Voluntary">Voluntary</option>
                      <option value="Retirement">Retirement</option>
                      <option value="Contract End">Contract End</option>
                      <option value="Personal Reason">Personal Reason</option>
                      <option value="Higher Studies">Higher Studies</option>
                      <option value="Relocation">Relocation</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Reason for Resignation *
                    </label>
                    <select
                      value={newSubmission.reason}
                      onChange={(e) => setNewSubmission({ ...newSubmission, reason: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold focus:outline-indigo-500"
                    >
                      <option value="Better Opportunity">Better Opportunity</option>
                      <option value="Higher Salary">Higher Salary</option>
                      <option value="Career Growth">Career Growth</option>
                      <option value="Relocation">Relocation</option>
                      <option value="Higher Studies">Higher Studies</option>
                      <option value="Personal Reasons">Personal Reasons</option>
                      <option value="Work-Life Balance">Work-Life Balance</option>
                      <option value="Health/Family">Health/Family</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                    Additional Comments
                  </label>
                  <textarea
                    value={newSubmission.comments}
                    onChange={(e) => setNewSubmission({ ...newSubmission, comments: e.target.value })}
                    placeholder="Enter handover transition notes, feedback, or special requests..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-indigo-500 h-20"
                  />
                </div>

                {/* Upload Supporting Document (Optional) */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                    Upload Supporting Document (Optional)
                  </label>
                  <div className="flex items-center gap-3 p-3 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <PaperClipIcon className="w-5 h-5 text-slate-400" />
                    <input
                      type="file"
                      onChange={(e) => setNewSubmission({ ...newSubmission, supportingDoc: e.target.files[0]?.name })}
                      className="text-xs text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setSubmitModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast("Draft saved to offline browser cache.");
                    setSubmitModalOpen(false);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-100"
                >
                  Submit Resignation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Before Submission */}
      {confirmSubmitOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-sm space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
              <ClockIcon className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">
                Are you sure you want to submit your resignation?
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                This will trigger the multi-level approval workflow with your reporting manager and HR department.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setConfirmSubmitOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                No, Go Back
              </button>
              <button
                onClick={handleFinalSubmit}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-sm"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. RESIGNATION DETAIL PAGE / MODAL */}
      {/* ========================================================================= */}
      {detailModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] overflow-y-auto space-y-6">
            {/* Modal Header Bar */}
            <div className="flex justify-between items-center border-b pb-3">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Resignation Management · Case Review
              </span>
              <button
                onClick={() => setDetailModalRecord(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Employee Header */}
            <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                  {detailModalRecord.avatar || detailModalRecord.employee.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">{detailModalRecord.employee}</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    {detailModalRecord.employeeId} · {detailModalRecord.designation} · {detailModalRecord.department}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${getStatusBadgeClass(detailModalRecord.status)}`}>
                  Status: {detailModalRecord.status}
                </span>
                <button
                  onClick={() => handleDownload(detailModalRecord)}
                  className="px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 flex items-center gap-1 shadow-2xs"
                >
                  <DocumentArrowDownIcon className="w-3.5 h-3.5" />
                  <span>Docket</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Date of Joining</span>
                <span className="font-extrabold text-slate-800">{detailModalRecord.doj || "10 Jan 2024"}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Resignation Date</span>
                <span className="font-extrabold text-slate-800">{detailModalRecord.resignationDate}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Last Working Day</span>
                <span className="font-extrabold text-indigo-600">{detailModalRecord.lastWorkingDay}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Notice Period</span>
                <span className="font-extrabold text-slate-800">{detailModalRecord.noticePeriod}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Exit Type</span>
                <span className="font-extrabold text-slate-800">{detailModalRecord.exitType}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Employment Type</span>
                <span className="font-extrabold text-slate-800">{detailModalRecord.employmentType || "Full-Time"}</span>
              </div>
            </div>

            {/* Resignation Progress Tracker (Horizontal Workflow) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  Resignation Progress Tracker
                </h4>
                <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  Lifecycle Workflow
                </span>
              </div>

              <div className="overflow-x-auto pt-2 pb-2">
                <div className="flex items-center min-w-[620px] justify-between text-center">
                  {[
                    { name: "Submitted", status: "done" },
                    { name: "Manager Review", status: detailModalRecord.status === "Pending" ? "current" : "done" },
                    { name: "HR Review", status: detailModalRecord.status === "Manager Review" ? "current" : detailModalRecord.status === "Pending" ? "pending" : "done" },
                    { name: "Approved", status: detailModalRecord.status === "Approved" || detailModalRecord.status === "Notice Period" || detailModalRecord.status === "Completed" ? "done" : "pending" },
                    { name: "Notice Period", status: detailModalRecord.status === "Notice Period" ? "current" : detailModalRecord.status === "Completed" ? "done" : "pending" },
                    { name: "Exit Process", status: detailModalRecord.status === "Completed" ? "done" : "pending" }
                  ].map((step, idx) => (
                    <React.Fragment key={step.name}>
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs transition ${
                            step.status === "done"
                              ? "bg-emerald-600 text-white"
                              : step.status === "current"
                              ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                              : "bg-slate-100 text-slate-400 border border-slate-200"
                          }`}
                        >
                          {step.status === "done" ? "✓" : step.status === "current" ? "●" : "○"}
                        </div>
                        <span
                          className={`text-[11px] font-bold mt-1.5 whitespace-nowrap ${
                            step.status === "done"
                              ? "text-emerald-700"
                              : step.status === "current"
                              ? "text-indigo-600 font-black"
                              : "text-slate-400"
                          }`}
                        >
                          {step.name}
                        </span>
                      </div>
                      {idx < 5 && (
                        <div
                          className={`flex-1 h-0.5 mx-2 ${
                            step.status === "done" ? "bg-emerald-500" : "bg-slate-200"
                          }`}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Approval Section (Manager Approval & HR Approval Cards) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  Approval Governance Section
                </h4>
                {detailModalRecord.status === "Pending" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuickApprove(detailModalRecord)}
                      className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 shadow-2xs"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleQuickReject(detailModalRecord)}
                      className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 shadow-2xs"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Manager Approval Card */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-slate-900 flex items-center gap-1.5">
                      <UserCircleIcon className="w-4 h-4 text-indigo-600" />
                      Manager Approval
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${getStatusBadgeClass(detailModalRecord.managerApproval?.status || "Approved")}`}>
                      {detailModalRecord.managerApproval?.status || "Approved"}
                    </span>
                  </div>
                  <div className="space-y-1 text-slate-600 text-[11px] pt-1 border-t border-slate-100">
                    <p>
                      <strong>Approved By:</strong> {detailModalRecord.managerApproval?.approvedBy || detailModalRecord.manager || "Rajesh Kumar"}
                    </p>
                    <p>
                      <strong>Approval Date:</strong> {detailModalRecord.managerApproval?.approvalDate || "21 Aug 2026"}
                    </p>
                    <p className="text-slate-500 italic">
                      "{detailModalRecord.managerApproval?.remarks || "Approved as per notice period"}"
                    </p>
                  </div>
                </div>

                {/* HR Approval Card */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-slate-900 flex items-center gap-1.5">
                      <ShieldCheckIcon className="w-4 h-4 text-indigo-600" />
                      HR Approval
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${getStatusBadgeClass(detailModalRecord.hrApproval?.status || "Approved")}`}>
                      {detailModalRecord.hrApproval?.status || "Approved"}
                    </span>
                  </div>
                  <div className="space-y-1 text-slate-600 text-[11px] pt-1 border-t border-slate-100">
                    <p>
                      <strong>Approved By:</strong> {detailModalRecord.hrApproval?.approvedBy || "HR Admin"}
                    </p>
                    <p>
                      <strong>Approval Date:</strong> {detailModalRecord.hrApproval?.approvalDate || "22 Aug 2026"}
                    </p>
                    <p className="text-slate-500 italic">
                      "{detailModalRecord.hrApproval?.remarks || "Exit process initiated"}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Organized Resignation Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Resignation Details Card */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 text-xs">
                <h5 className="font-black text-slate-900 uppercase text-[11px] tracking-wider border-b pb-1.5">
                  Resignation Details
                </h5>
                <div className="space-y-1.5 text-slate-600 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Resignation Date:</span>
                    <span className="font-bold text-slate-800">{detailModalRecord.resignationDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Proposed LWD:</span>
                    <span className="font-bold text-slate-800">{detailModalRecord.proposedLWD || detailModalRecord.lastWorkingDay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Confirmed LWD:</span>
                    <span className="font-black text-indigo-600">{detailModalRecord.confirmedLwd || detailModalRecord.lastWorkingDay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Notice Period:</span>
                    <span className="font-bold text-slate-800">{detailModalRecord.noticePeriod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Notice Served:</span>
                    <span className="font-bold text-slate-800">{detailModalRecord.noticeServed || 18} Days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Remaining Notice:</span>
                    <span className="font-bold text-amber-700">{detailModalRecord.noticeRemaining || 12} Days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Exit Type:</span>
                    <span className="font-bold text-slate-800">{detailModalRecord.exitType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reason:</span>
                    <span className="font-bold text-slate-800">{detailModalRecord.reason}</span>
                  </div>
                </div>
              </div>

              {/* Employee Details Card */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 text-xs">
                <h5 className="font-black text-slate-900 uppercase text-[11px] tracking-wider border-b pb-1.5">
                  Employee Details
                </h5>
                <div className="space-y-1.5 text-slate-600 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Employee ID:</span>
                    <span className="font-mono font-bold text-indigo-600">{detailModalRecord.employeeId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Employee Name:</span>
                    <span className="font-bold text-slate-800">{detailModalRecord.employee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Department:</span>
                    <span className="font-bold text-slate-800">{detailModalRecord.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Designation:</span>
                    <span className="font-bold text-slate-800">{detailModalRecord.designation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Manager:</span>
                    <span className="font-bold text-slate-800">{detailModalRecord.manager || "Rajesh Kumar"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date of Joining:</span>
                    <span className="font-bold text-slate-800">{detailModalRecord.doj || "10 Jan 2024"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Employment Type:</span>
                    <span className="font-bold text-slate-800">{detailModalRecord.employmentType || "Full-Time Permanent"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Remarks Cards (Employee, Manager, and HR comments separately) */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 text-xs">
              <h5 className="font-black text-slate-900 uppercase text-[11px] tracking-wider">
                Remarks & Communications
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border">
                  <span className="text-[10px] font-black uppercase text-indigo-600 block mb-1">Employee Remarks</span>
                  <p className="text-slate-700 italic text-[11px]">
                    "{detailModalRecord.employeeRemarks || detailModalRecord.remarks || "No comments logged."}"
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border">
                  <span className="text-[10px] font-black uppercase text-emerald-600 block mb-1">Manager Remarks</span>
                  <p className="text-slate-700 italic text-[11px]">
                    "{detailModalRecord.managerRemarks || detailModalRecord.managerApproval?.remarks || "Approved as per notice period"}"
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border">
                  <span className="text-[10px] font-black uppercase text-purple-600 block mb-1">HR Remarks</span>
                  <p className="text-slate-700 italic text-[11px]">
                    "{detailModalRecord.hrRemarks || detailModalRecord.hrApproval?.remarks || "Exit process initiated"}"
                  </p>
                </div>
              </div>
            </div>

            {/* Notice Period Card (With Progress Bar) */}
            <div className="p-5 rounded-2xl border border-purple-200 bg-purple-50/30 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase text-purple-900 tracking-wider">
                  Notice Period Progress
                </span>
                <span className="text-xs font-extrabold text-purple-700">
                  {detailModalRecord.noticeServed || 18} of 30 Days Completed
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(((detailModalRecord.noticeServed || 18) / 30) * 100)}%` }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2 text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Notice Start</span>
                  <span className="font-extrabold text-slate-800">{detailModalRecord.noticeStartDate || "21 Aug 2026"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Notice End</span>
                  <span className="font-extrabold text-slate-800">{detailModalRecord.noticeEndDate || "20 Sep 2026"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Days Completed</span>
                  <span className="font-black text-emerald-600">{detailModalRecord.noticeServed || 18} Days</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Days Remaining</span>
                  <span className="font-black text-amber-700">{detailModalRecord.noticeRemaining || 12} Days</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Leave Taken</span>
                  <span className="font-extrabold text-slate-800">{detailModalRecord.leaveDuringNotice || "0 Days"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Attendance</span>
                  <span className="font-extrabold text-slate-800">{detailModalRecord.attendanceStatus || "100% Present"}</span>
                </div>
              </div>
            </div>

            {/* Resignation History (Activity Timeline) */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 text-xs">
              <h5 className="font-black text-slate-900 uppercase text-[11px] tracking-wider">
                Resignation History & Activity Timeline
              </h5>
              <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {(
                  detailModalRecord.historyTimeline || [
                    { date: "20 Aug 2026", title: "Resignation submitted", actor: detailModalRecord.employee },
                    { date: "21 Aug 2026", title: "Manager approved", actor: detailModalRecord.manager || "Rajesh Kumar" },
                    { date: "22 Aug 2026", title: "HR approved", actor: "HR Admin" },
                    { date: "22 Aug 2026", title: "Notice period started", actor: "System" }
                  ]
                ).map((t, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono text-[10px]">{t.date}</span>
                      <span className="text-slate-800 font-bold text-xs">{t.title}</span>
                      <span className="text-slate-400 text-[11px]">— {t.actor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EDIT RESIGNATION MODAL */}
      {/* ========================================================================= */}
      {editModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-lg space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">
                  Edit Resignation Details: {editModal.record?.employee}
                </h3>
                <p className="text-[11px] text-slate-400">{editModal.record?.employeeId} · {editModal.record?.department}</p>
              </div>
              <button
                onClick={() => setEditModal({ isOpen: false, record: null })}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Resignation Date *</label>
                  <input
                    type="date"
                    value={editModal.record?.resignationDate || ""}
                    onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, resignationDate: e.target.value } })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Last Working Day *</label>
                  <input
                    type="date"
                    value={editModal.record?.lastWorkingDay || ""}
                    onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, lastWorkingDay: e.target.value, confirmedLwd: e.target.value } })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Notice Period *</label>
                  <input
                    type="text"
                    value={editModal.record?.noticePeriod || "30 Days"}
                    onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, noticePeriod: e.target.value } })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Status *</label>
                  <select
                    value={editModal.record?.status || "Pending"}
                    onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, status: e.target.value } })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold"
                  >
                    <option value="Pending">Pending (Yellow)</option>
                    <option value="Manager Review">Manager Review (Blue)</option>
                    <option value="Approved">Approved (Green)</option>
                    <option value="Notice Period">Notice Period (Purple)</option>
                    <option value="Rejected">Rejected (Red)</option>
                    <option value="Completed">Completed (Green)</option>
                    <option value="Withdrawn">Withdrawn (Gray)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Exit Type *</label>
                  <select
                    value={editModal.record?.exitType || "Voluntary"}
                    onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, exitType: e.target.value } })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold"
                  >
                    <option value="Voluntary">Voluntary</option>
                    <option value="Retirement">Retirement</option>
                    <option value="Contract End">Contract End</option>
                    <option value="Personal Reason">Personal Reason</option>
                    <option value="Higher Studies">Higher Studies</option>
                    <option value="Relocation">Relocation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Reason *</label>
                  <select
                    value={editModal.record?.reason || "Better Opportunity"}
                    onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, reason: e.target.value } })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold"
                  >
                    <option value="Better Opportunity">Better Opportunity</option>
                    <option value="Higher Salary">Higher Salary</option>
                    <option value="Career Growth">Career Growth</option>
                    <option value="Relocation">Relocation</option>
                    <option value="Higher Studies">Higher Studies</option>
                    <option value="Personal Reasons">Personal Reasons</option>
                    <option value="Work-Life Balance">Work-Life Balance</option>
                    <option value="Health/Family">Health/Family</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Remarks & Notes</label>
                <textarea
                  value={editModal.record?.remarks || ""}
                  onChange={(e) => setEditModal({ ...editModal, record: { ...editModal.record, remarks: e.target.value } })}
                  placeholder="Update handover notes or audit remarks..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditModal({ isOpen: false, record: null })}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. APPROVE / REJECT MODAL */}
      {/* ========================================================================= */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-md space-y-4 text-xs">
            <h3 className="text-sm font-black text-slate-900 uppercase">
              {reviewModal.actionType} Resignation: {reviewModal.record?.employee}
            </h3>
            <p className="text-[11px] text-slate-400">
              {reviewModal.record?.employeeId} · {reviewModal.record?.department}
            </p>

            {reviewModal.actionType === "Approve" && (
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Confirmed Last Working Day
                </label>
                <input
                  type="date"
                  value={reviewModal.approvedLwd}
                  onChange={(e) => setReviewModal({ ...reviewModal, approvedLwd: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold"
                />
              </div>
            )}

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                {reviewModal.actionType === "Reject" ? "Rejection Reason *" : "Review Comments *"}
              </label>
              <textarea
                value={reviewModal.remarks}
                onChange={(e) => setReviewModal({ ...reviewModal, remarks: e.target.value })}
                placeholder={reviewModal.actionType === "Reject" ? "Specify exact reason for declining..." : "Enter approval handover remarks..."}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold h-24"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setReviewModal({ isOpen: false, record: null, actionType: "", remarks: "", approvedLwd: "" })}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReview}
                className={`px-4 py-2 text-white rounded-xl font-bold shadow-sm ${
                  reviewModal.actionType === "Approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                Confirm {reviewModal.actionType}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resignation;
