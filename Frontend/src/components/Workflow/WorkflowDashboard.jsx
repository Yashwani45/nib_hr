// Frontend/src/components/Workflow/WorkflowDashboard.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  InboxStackIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowsRightLeftIcon,
  ArrowRightOnRectangleIcon,
  ArchiveBoxIcon,
  EyeIcon,
  DocumentTextIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import {
  WORKFLOW_STAGES,
  getApprovalBadgeClass,
  SAMPLE_LEAVE_APPROVALS,
  SAMPLE_EXPENSE_APPROVALS,
  SAMPLE_RECRUITMENT_APPROVALS,
  SAMPLE_PROMOTION_APPROVALS,
  SAMPLE_TRANSFER_APPROVALS,
  SAMPLE_SEPARATION_APPROVALS,
  SAMPLE_APPROVAL_HISTORY
} from "./workflowData";

const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6", "#3B82F6", "#EF4444"];

const WORKFLOW_TABS = [
  { id: "Overview", label: "1. Overview", shortName: "Overview", step: 1, icon: InboxStackIcon },
  { id: "Leave Approval", label: "2. Leave Approval", shortName: "Leave", step: 2, icon: CalendarDaysIcon },
  { id: "Expense Approval", label: "3. Expense Approval", shortName: "Expense", step: 3, icon: CurrencyDollarIcon },
  { id: "Recruitment Approval", label: "4. Recruitment Approval", shortName: "Recruitment", step: 4, icon: UserGroupIcon },
  { id: "Promotion Approval", label: "5. Promotion Approval", shortName: "Promotion", step: 5, icon: ArrowTrendingUpIcon },
  { id: "Transfer Approval", label: "6. Transfer Approval", shortName: "Transfer", step: 6, icon: ArrowsRightLeftIcon },
  { id: "Separation Approval", label: "7. Separation Approval", shortName: "Separation", step: 7, icon: ArrowRightOnRectangleIcon },
  { id: "Approval History", label: "8. Approval History", shortName: "History", step: 8, icon: ArchiveBoxIcon }
];

const WorkflowDashboard = ({ selectedTab, activeTab: propActiveTab, user }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Resolve incoming tab to valid tab id
  const resolveTab = (target) => {
    if (!target) return "Overview";
    const cleaned = target.trim().toLowerCase();
    if (cleaned === "workflow dashboard" || cleaned === "dashboard" || cleaned === "overview") return "Overview";
    if (cleaned.includes("leave") || cleaned.includes("approvals pending")) return "Leave Approval";
    if (cleaned.includes("expense")) return "Expense Approval";
    if (cleaned.includes("recruitment")) return "Recruitment Approval";
    if (cleaned.includes("promotion")) return "Promotion Approval";
    if (cleaned.includes("transfer")) return "Transfer Approval";
    if (cleaned.includes("separation")) return "Separation Approval";
    if (cleaned.includes("history")) return "Approval History";
    const found = WORKFLOW_TABS.find(t => t.id.toLowerCase() === cleaned || t.label.toLowerCase() === cleaned);
    if (found) return found.id;
    return "Overview";
  };

  const initialTab = resolveTab(selectedTab || propActiveTab || searchParams.get("tab"));
  const [activeTab, setActiveTab] = useState(initialTab);
  const [search, setSearch] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // Datasets State
  const [leaves, setLeaves] = useState(SAMPLE_LEAVE_APPROVALS);
  const [expenses, setExpenses] = useState(SAMPLE_EXPENSE_APPROVALS);
  const [recruitments, setRecruitments] = useState(SAMPLE_RECRUITMENT_APPROVALS);
  const [promotions, setPromotions] = useState(SAMPLE_PROMOTION_APPROVALS);
  const [transfers, setTransfers] = useState(SAMPLE_TRANSFER_APPROVALS);
  const [separations, setSeparations] = useState(SAMPLE_SEPARATION_APPROVALS);
  const [history, setHistory] = useState(SAMPLE_APPROVAL_HISTORY);

  // Review Modal State
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    item: null,
    category: "",
    actionType: "",
    remarks: ""
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  useEffect(() => {
    const target = selectedTab || propActiveTab || searchParams.get("tab");
    if (target) {
      setActiveTab(resolveTab(target));
    }
  }, [selectedTab, propActiveTab, searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("category", "WORKFLOW");
    newParams.set("tab", tabId);
    setSearchParams(newParams, { replace: true });
  };

  const currentStepIndex = Math.max(0, WORKFLOW_TABS.findIndex(t => t.id === activeTab));
  const prevTab = currentStepIndex > 0 ? WORKFLOW_TABS[currentStepIndex - 1] : null;
  const nextTab = currentStepIndex < WORKFLOW_TABS.length - 1 ? WORKFLOW_TABS[currentStepIndex + 1] : null;

  const goToNextStep = () => {
    if (nextTab) handleTabChange(nextTab.id);
  };

  const goToPrevStep = () => {
    if (prevTab) handleTabChange(prevTab.id);
  };

  // Generic Approval Submission
  const handleConfirmDecision = (e) => {
    e.preventDefault();
    if (!reviewModal.item) return;

    const { item, category, actionType, remarks } = reviewModal;
    const newStatus = actionType === "Approve" ? "Approved" : "Rejected";

    // Update state based on category
    if (category === "leave") {
      setLeaves(prev => prev.map(r => r.id === item.id ? { ...r, status: newStatus } : r));
    } else if (category === "expense") {
      setExpenses(prev => prev.map(r => r.id === item.id ? { ...r, status: newStatus } : r));
    } else if (category === "recruitment") {
      setRecruitments(prev => prev.map(r => r.id === item.id ? { ...r, status: newStatus } : r));
    } else if (category === "promotion") {
      setPromotions(prev => prev.map(r => r.id === item.id ? { ...r, status: newStatus } : r));
    } else if (category === "transfer") {
      setTransfers(prev => prev.map(r => r.id === item.id ? { ...r, status: newStatus } : r));
    } else if (category === "separation") {
      setSeparations(prev => prev.map(r => r.id === item.id ? { ...r, status: newStatus, hrStatus: newStatus } : r));
    }

    // Add entry to history
    const historyEntry = {
      id: Date.now(),
      dateTime: new Date().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      category: category.toUpperCase() + " APPROVAL",
      employee: item.employee || item.roleTitle || "Applicant",
      employeeId: item.employeeId || item.requisitionId || `REQ${item.id}`,
      details: item.leaveType || item.category || item.proposedDesignation || "Request Review",
      decision: newStatus,
      approver: user?.name || "HR Admin",
      turnaround: "Just now",
      remarks: remarks || "Processed from Workflow Dashboard."
    };
    setHistory([historyEntry, ...history]);

    showToast(`${actionType === "Approve" ? "Approved" : "Rejected"} ${item.employee || item.roleTitle} successfully.`);
    setReviewModal({ isOpen: false, item: null, category: "", actionType: "", remarks: "" });
  };

  // Analytics Chart Data
  const categoryChartData = [
    { name: "Leave", value: leaves.length },
    { name: "Expense", value: expenses.length },
    { name: "Recruitment", value: recruitments.length },
    { name: "Promotion", value: promotions.length },
    { name: "Transfer", value: transfers.length },
    { name: "Separation", value: separations.length }
  ];

  const resolutionTrend = [
    { day: "Mon", count: 18 },
    { day: "Tue", count: 24 },
    { day: "Wed", count: 32 },
    { day: "Thu", count: 28 },
    { day: "Fri", count: 39 },
    { day: "Sat", count: 12 }
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Success Notification Banner */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center justify-between text-xs font-bold animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-white shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage("")} className="p-1 hover:bg-white/20 rounded-lg">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Global Actions */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Multi-Level Approvals
              </span>
              <span className="text-[10px] font-bold text-slate-400">• Full Governance Lifecycle</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Workflow & Approval</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Consolidated governance hub for approving leaves, claims, requisitions, promotions, branch transfers, and exit settlements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-48 sm:w-60">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search requests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold focus:outline-indigo-500"
              />
            </div>

            <button
              onClick={() => alert("Exporting Governance Audit Report...")}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition flex items-center gap-1.5 shadow-sm"
            >
              <ArrowDownTrayIcon className="w-4 h-4 text-slate-500" />
              <span>Export Audit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Numbered Sub-Tabs (Series 1 to 8) */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {WORKFLOW_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all duration-150 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 ring-2 ring-indigo-300"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Series Lifecycle Stepper Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 px-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">
            Approval Series Flow:
          </span>
          <span className="font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full text-xs">
            Step {currentStepIndex + 1} of {WORKFLOW_TABS.length} — {WORKFLOW_TABS[currentStepIndex]?.shortName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevStep}
            disabled={!prevTab}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
              prevTab ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm" : "opacity-40 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400"
            }`}
          >
            <span>← Previous: {prevTab ? prevTab.shortName : "Start"}</span>
          </button>
          <button
            onClick={goToNextStep}
            disabled={!nextTab}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm ${
              nextTab ? "bg-indigo-600 text-white hover:bg-indigo-700" : "opacity-40 cursor-not-allowed bg-slate-200 text-slate-400"
            }`}
          >
            <span>Next: {nextTab ? nextTab.shortName : "End"} →</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. OVERVIEW PAGE */}
      {/* ========================================================================= */}
      {activeTab === "Overview" && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {[
              { label: "Pending Approvals", value: 38, color: "text-amber-700 bg-amber-50 border-amber-200" },
              { label: "Approved (Month)", value: 142, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
              { label: "Rejected Requests", value: 12, color: "text-rose-700 bg-rose-50 border-rose-200" },
              { label: "Avg Turnaround", value: "1.4 Days", color: "text-blue-700 bg-blue-50 border-blue-200" },
              { label: "SLA Adherence", value: "98.2%", color: "text-purple-700 bg-purple-50 border-purple-200" },
              { label: "Multi-level Pending", value: 9, color: "text-indigo-700 bg-indigo-50 border-indigo-200" }
            ].map((c) => (
              <div key={c.label} className={`rounded-2xl p-4 border shadow-sm ${c.color}`}>
                <span className="text-[10px] font-black uppercase tracking-wider block opacity-70">{c.label}</span>
                <p className="text-2xl font-black mt-1 tracking-tight">{c.value}</p>
              </div>
            ))}
          </div>

          {/* Multi-Level Approval Pipeline Visualizer */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  Corporate Governance Multi-Level Approval Pipeline
                </h3>
                <p className="text-[11px] text-slate-400">Sequential review levels enforcing internal controls and policy compliance.</p>
              </div>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Automated Routing
              </span>
            </div>

            <div className="overflow-x-auto pt-2 pb-2">
              <div className="flex items-center min-w-[750px] justify-between">
                {[
                  { step: 1, title: "Initiation", desc: "Employee Submits Request" },
                  { step: 2, title: "Line Manager", desc: "Initial Feasibility Check" },
                  { step: 3, title: "Department Head", desc: "Budget & Work Allocation" },
                  { step: 4, title: "HR / Finance", desc: "Policy & Statutory Audit" },
                  { step: 5, title: "Executive Sign-Off", desc: "Final Authorization" },
                  { step: 6, title: "Completed", desc: "Disbursement & Notification" }
                ].map((s, i) => (
                  <React.Fragment key={s.step}>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                        {s.step}
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 mt-1">{s.title}</span>
                      <span className="text-[9px] text-slate-400 text-center max-w-[100px]">{s.desc}</span>
                    </div>
                    {i < 5 && <div className="flex-1 h-0.5 mx-2 bg-indigo-200" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Sequential Series Stages Grid */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  Approval Modules — Sequential Series Execution
                </h3>
                <p className="text-[11px] text-slate-400">Click any approval series stage to inspect requests and process approvals.</p>
              </div>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                7 Core Approval Streams
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
              {[
                { step: 2, id: "Leave Approval", title: "Leave Approval", desc: "Approve vacation, sick leaves, and verify balance allowances.", count: `${leaves.filter(l => l.status === "Pending").length} Pending`, badge: "bg-amber-50 text-amber-700" },
                { step: 3, id: "Expense Approval", title: "Expense Claim Approval", desc: "Audit business travel bills, client dining, and certification vouchers.", count: `${expenses.filter(e => e.status === "Pending").length} Pending`, badge: "bg-blue-50 text-blue-700" },
                { step: 4, id: "Recruitment Approval", title: "Recruitment Requisition", desc: "Sanction new headcounts, budget limits, and job requisitions.", count: `${recruitments.filter(r => r.status === "Pending").length} Pending`, badge: "bg-indigo-50 text-indigo-700" },
                { step: 5, id: "Promotion Approval", title: "Promotion & Salary Revision", desc: "Verify annual appraisal ratings and sign off CTC grade increments.", count: `${promotions.filter(p => p.status === "Pending").length} Pending`, badge: "bg-purple-50 text-purple-700" },
                { step: 6, id: "Transfer Approval", title: "Transfer & Relocation", desc: "Authorize branch shifts, reporting lines, and relocation allowances.", count: `${transfers.filter(t => t.status === "Pending").length} Pending`, badge: "bg-emerald-50 text-emerald-700" },
                { step: 7, id: "Separation Approval", title: "Separation & Resignation", desc: "Sign off resignation acceptance, notice buyout, and final working dates.", count: `${separations.filter(s => s.status === "Pending").length} Pending`, badge: "bg-rose-50 text-rose-700" },
                { step: 8, id: "Approval History", title: "Governance History & Audit", desc: "Inspect completed historical approvals with timestamps and remarks.", count: `${history.length} Logs`, badge: "bg-slate-100 text-slate-700" }
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className="group p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                        {item.step}
                      </span>
                      <h4 className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition">
                        {item.title}
                      </h4>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${item.badge}`}>
                      {item.count}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold text-indigo-600 group-hover:text-indigo-700">
                    <span>Manage {item.title}</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                Approvals Distribution by Category
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                      {categoryChartData.map((_, idx) => (
                        <Cell key={`c-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                Weekly Turnaround Volume
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resolutionTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fontWeight: "bold" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366F1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. LEAVE APPROVAL */}
      {/* ========================================================================= */}
      {activeTab === "Leave Approval" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Leave Approvals</h3>
              <p className="text-xs text-slate-400">Review time-off requests, statutory medical certificates, and remaining leave balances.</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              Requests: {leaves.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">EMP ID</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Leave Type</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Days</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y font-semibold">
                {leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{l.employee}</td>
                    <td className="px-4 py-3.5 font-mono text-indigo-600 font-bold">{l.employeeId}</td>
                    <td className="px-4 py-3.5 text-slate-600">{l.department}</td>
                    <td className="px-4 py-3.5 font-bold">{l.leaveType}</td>
                    <td className="px-4 py-3.5 text-slate-600">{l.dates}</td>
                    <td className="px-4 py-3.5 font-black text-slate-900">{l.days} Days</td>
                    <td className="px-4 py-3.5 text-slate-500 max-w-xs truncate">{l.reason}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${getApprovalBadgeClass(l.status)}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {l.status === "Pending" ? (
                          <>
                            <button
                              onClick={() => setReviewModal({ isOpen: true, item: l, category: "leave", actionType: "Approve", remarks: "" })}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setReviewModal({ isOpen: true, item: l, category: "leave", actionType: "Reject", remarks: "" })}
                              className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-[11px] hover:bg-rose-700"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Completed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EXPENSE APPROVAL */}
      {/* ========================================================================= */}
      {activeTab === "Expense Approval" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Expense Claim Approvals</h3>
              <p className="text-xs text-slate-400">Validate business meal expenses, flight tickets, hardware peripherals, and reimbursement vouchers.</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              Claims: {expenses.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Claim ID</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Receipt</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y font-semibold">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{e.employee}</td>
                    <td className="px-4 py-3.5 font-mono text-indigo-600 font-bold">{e.claimId}</td>
                    <td className="px-4 py-3.5 text-slate-600">{e.category}</td>
                    <td className="px-4 py-3.5 font-mono font-black text-slate-900 text-right">₹{e.amount?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3.5 text-slate-500">{e.claimDate}</td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-indigo-600">{e.receiptAttached}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${getApprovalBadgeClass(e.status)}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {e.status === "Pending" ? (
                          <>
                            <button
                              onClick={() => setReviewModal({ isOpen: true, item: e, category: "expense", actionType: "Approve", remarks: "" })}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setReviewModal({ isOpen: true, item: e, category: "expense", actionType: "Reject", remarks: "" })}
                              className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-[11px] hover:bg-rose-700"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Settled</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. RECRUITMENT APPROVAL */}
      {/* ========================================================================= */}
      {activeTab === "Recruitment Approval" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Recruitment Requisition Approvals</h3>
              <p className="text-xs text-slate-400">Review department headcount justifications, open vacancies, and compensation budgets.</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              Requisitions: {recruitments.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b">
                <tr>
                  <th className="px-4 py-3">Position / Role</th>
                  <th className="px-4 py-3">Requisition ID</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Openings</th>
                  <th className="px-4 py-3">Target CTC</th>
                  <th className="px-4 py-3">Hiring Manager</th>
                  <th className="px-4 py-3">Budget Status</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y font-semibold">
                {recruitments.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{r.roleTitle}</td>
                    <td className="px-4 py-3.5 font-mono text-indigo-600 font-bold">{r.requisitionId}</td>
                    <td className="px-4 py-3.5 text-slate-600">{r.department}</td>
                    <td className="px-4 py-3.5 font-black text-slate-800">{r.openings}</td>
                    <td className="px-4 py-3.5 font-bold text-emerald-700">{r.targetCTC}</td>
                    <td className="px-4 py-3.5 text-slate-700">{r.hiringManager}</td>
                    <td className="px-4 py-3.5 text-slate-500">{r.budgetStatus}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${getApprovalBadgeClass(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {r.status === "Pending" ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setReviewModal({ isOpen: true, item: r, category: "recruitment", actionType: "Approve", remarks: "" })}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-700"
                          >
                            Authorize
                          </button>
                          <button
                            onClick={() => setReviewModal({ isOpen: true, item: r, category: "recruitment", actionType: "Reject", remarks: "" })}
                            className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-[11px] hover:bg-rose-700"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. PROMOTION APPROVAL */}
      {/* ========================================================================= */}
      {activeTab === "Promotion Approval" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Promotion & Compensation Revision Approvals</h3>
              <p className="text-xs text-slate-400">Authorize role promotions, annual performance appraisal ratings, and compensation hike revisions.</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              Nominations: {promotions.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Current Role</th>
                  <th className="px-4 py-3">Proposed Role</th>
                  <th className="px-4 py-3">Current CTC</th>
                  <th className="px-4 py-3">Proposed CTC</th>
                  <th className="px-4 py-3">Hike %</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y font-semibold">
                {promotions.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{p.employee}</td>
                    <td className="px-4 py-3.5 text-slate-600">{p.currentDesignation}</td>
                    <td className="px-4 py-3.5 font-black text-indigo-900">{p.proposedDesignation}</td>
                    <td className="px-4 py-3.5 font-mono">{p.currentCTC}</td>
                    <td className="px-4 py-3.5 font-mono font-bold text-emerald-700">{p.proposedCTC}</td>
                    <td className="px-4 py-3.5 font-black text-emerald-600">{p.hikePercent}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-800">{p.appraisalRating}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${getApprovalBadgeClass(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {p.status === "Pending" ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setReviewModal({ isOpen: true, item: p, category: "promotion", actionType: "Approve", remarks: "" })}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setReviewModal({ isOpen: true, item: p, category: "promotion", actionType: "Reject", remarks: "" })}
                            className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-[11px] hover:bg-rose-700"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Approved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TRANSFER APPROVAL */}
      {/* ========================================================================= */}
      {activeTab === "Transfer Approval" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Branch & Department Transfer Approvals</h3>
              <p className="text-xs text-slate-400">Verify branch relocations, relocation allowances, and cross-departmental reporting changes.</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              Transfers: {transfers.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Current Location</th>
                  <th className="px-4 py-3">Proposed Location</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Effective Date</th>
                  <th className="px-4 py-3">Relocation Allowance</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y font-semibold">
                {transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{t.employee}</td>
                    <td className="px-4 py-3.5 text-slate-600">{t.currentBranch}</td>
                    <td className="px-4 py-3.5 font-black text-indigo-900">{t.proposedBranch}</td>
                    <td className="px-4 py-3.5 text-slate-600">{t.transferType}</td>
                    <td className="px-4 py-3.5 text-slate-500">{t.effectiveDate}</td>
                    <td className="px-4 py-3.5 font-mono font-bold text-emerald-700">{t.relocationAllowance}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${getApprovalBadgeClass(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {t.status === "Pending" ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setReviewModal({ isOpen: true, item: t, category: "transfer", actionType: "Approve", remarks: "" })}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-700"
                          >
                            Authorize
                          </button>
                          <button
                            onClick={() => setReviewModal({ isOpen: true, item: t, category: "transfer", actionType: "Reject", remarks: "" })}
                            className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-[11px] hover:bg-rose-700"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Authorized</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. SEPARATION APPROVAL */}
      {/* ========================================================================= */}
      {activeTab === "Separation Approval" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Employee Separation Sign-Offs</h3>
              <p className="text-xs text-slate-400">Authorize formal resignation acceptances, notice period start dates, and departure clearances.</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              Separations: {separations.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Resignation Date</th>
                  <th className="px-4 py-3">Last Working Day</th>
                  <th className="px-4 py-3">Notice Period</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y font-semibold">
                {separations.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{s.employee}</td>
                    <td className="px-4 py-3.5 text-slate-600">{s.department}</td>
                    <td className="px-4 py-3.5 text-slate-500">{s.resignationDate}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{s.proposedLWD}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-700">{s.noticePeriod}</td>
                    <td className="px-4 py-3.5 text-slate-600">{s.reason}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${getApprovalBadgeClass(s.status)}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {s.status === "Pending" ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setReviewModal({ isOpen: true, item: s, category: "separation", actionType: "Approve", remarks: "" })}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-700"
                          >
                            Approve Exit
                          </button>
                          <button
                            onClick={() => setReviewModal({ isOpen: true, item: s, category: "separation", actionType: "Reject", remarks: "" })}
                            className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-[11px] hover:bg-rose-700"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Approved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. APPROVAL HISTORY */}
      {/* ========================================================================= */}
      {activeTab === "Approval History" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Governance & Audit History Log</h3>
              <p className="text-xs text-slate-400">Complete audit trail of all historical approvals, rejections, turnaround times, and approver decisions.</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              Logged Decisions: {history.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b">
                <tr>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Requestor</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3 text-center">Decision</th>
                  <th className="px-4 py-3">Approver</th>
                  <th className="px-4 py-3">Turnaround</th>
                  <th className="px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y font-semibold">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3.5 font-mono text-slate-500">{h.dateTime}</td>
                    <td className="px-4 py-3.5 font-bold text-indigo-600">{h.category}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{h.employee}</td>
                    <td className="px-4 py-3.5 text-slate-700">{h.details}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${getApprovalBadgeClass(h.decision)}`}>
                        {h.decision}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-800 font-bold">{h.approver}</td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono">{h.turnaround}</td>
                    <td className="px-4 py-3.5 text-slate-500 italic max-w-xs truncate">{h.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REVIEW (APPROVE / REJECT) MODAL */}
      {/* ========================================================================= */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase">
                {reviewModal.actionType} {reviewModal.category.toUpperCase()} Request
              </h3>
              <button
                onClick={() => setReviewModal({ isOpen: false, item: null, category: "", actionType: "", remarks: "" })}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Applicant</span>
              <p className="font-extrabold text-slate-900">
                {reviewModal.item?.employee || reviewModal.item?.roleTitle} ({reviewModal.item?.employeeId || reviewModal.item?.requisitionId})
              </p>
              <p className="text-slate-500">
                {reviewModal.item?.department || reviewModal.item?.leaveType || reviewModal.item?.category}
              </p>
            </div>

            <form onSubmit={handleConfirmDecision} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Reviewer Remarks & Audit Notes *
                </label>
                <textarea
                  value={reviewModal.remarks}
                  onChange={(e) => setReviewModal({ ...reviewModal, remarks: e.target.value })}
                  placeholder={`Reason for ${reviewModal.actionType.toLowerCase()}ing this request...`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-indigo-500 h-24"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setReviewModal({ isOpen: false, item: null, category: "", actionType: "", remarks: "" })}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-xl text-xs font-bold shadow-sm ${
                    reviewModal.actionType === "Approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  Confirm {reviewModal.actionType}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowDashboard;
