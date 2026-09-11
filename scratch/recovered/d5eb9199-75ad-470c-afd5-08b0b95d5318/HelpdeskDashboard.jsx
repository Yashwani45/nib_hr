// Frontend/src/components/Helpdesk/HelpdeskDashboard.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  LifebuoyIcon,
  TicketIcon,
  ExclamationTriangleIcon,
  DocumentDuplicateIcon,
  QuestionMarkCircleIcon,
  MapPinIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserCircleIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  PaperClipIcon,
  XMarkIcon,
  EyeIcon,
  EllipsisVerticalIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  StarIcon,
  FireIcon
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import {
  HELPDESK_METRICS,
  CHART_DATA,
  SAMPLE_TICKETS,
  SAMPLE_COMPLAINTS,
  SAMPLE_SERVICE_REQUESTS,
  SAMPLE_QUERIES,
  SAMPLE_TRACKING,
  getPriorityBadgeClass,
  getStatusBadgeClass,
  getSlaStatusBadgeClass
} from "./helpdeskData";

const HELPDESK_TABS = [
  { id: "Dashboard", label: "1. Dashboard", shortName: "Dashboard", step: 1, icon: LifebuoyIcon },
  { id: "Tickets", label: "2. Tickets", shortName: "Tickets", step: 2, icon: TicketIcon },
  { id: "Complaints", label: "3. Complaints", shortName: "Complaints", step: 3, icon: ExclamationTriangleIcon },
  { id: "Service Requests", label: "4. Service Requests", shortName: "Service Requests", step: 4, icon: DocumentDuplicateIcon },
  { id: "Query Resolution", label: "5. Query Resolution", shortName: "Query Resolution", step: 5, icon: QuestionMarkCircleIcon },
  { id: "Tracking", label: "6. Tracking", shortName: "Tracking", step: 6, icon: MapPinIcon }
];

const HelpdeskDashboard = ({ selectedTab, activeTab: propActiveTab, user }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Resolve incoming tab to valid tab id
  const resolveTab = (target) => {
    if (!target) return "Dashboard";
    const cleaned = target.trim().toLowerCase();
    if (cleaned.includes("dashboard") || cleaned === "overview") return "Dashboard";
    if (cleaned.includes("ticket") && !cleaned.includes("track")) return "Tickets";
    if (cleaned.includes("complaint")) return "Complaints";
    if (cleaned.includes("service")) return "Service Requests";
    if (cleaned.includes("quer")) return "Query Resolution";
    if (cleaned.includes("track")) return "Tracking";
    const found = HELPDESK_TABS.find(t => t.id.toLowerCase() === cleaned || t.label.toLowerCase() === cleaned);
    return found ? found.id : "Dashboard";
  };

  const initialTab = resolveTab(selectedTab || propActiveTab || searchParams.get("tab"));
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync state if selectedTab or URL param changes
  useEffect(() => {
    const target = selectedTab || propActiveTab || searchParams.get("tab");
    if (target) {
      setActiveTab(resolveTab(target));
    }
  }, [selectedTab, propActiveTab, searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("category", "HELPDESK");
    newParams.set("tab", tabId);
    setSearchParams(newParams, { replace: true });
  };

  const currentStepIndex = Math.max(0, HELPDESK_TABS.findIndex(t => t.id === activeTab));
  const prevTab = currentStepIndex > 0 ? HELPDESK_TABS[currentStepIndex - 1] : null;
  const nextTab = currentStepIndex < HELPDESK_TABS.length - 1 ? HELPDESK_TABS[currentStepIndex + 1] : null;

  const goToNextStep = () => {
    if (nextTab) handleTabChange(nextTab.id);
  };

  const goToPrevStep = () => {
    if (prevTab) handleTabChange(prevTab.id);
  };

  // Toast notification
  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Global & Section Search/Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");

  // Data Stores
  const [tickets, setTickets] = useState(SAMPLE_TICKETS);
  const [complaints, setComplaints] = useState(SAMPLE_COMPLAINTS);
  const [serviceRequests, setServiceRequests] = useState(SAMPLE_SERVICE_REQUESTS);
  const [queries, setQueries] = useState(SAMPLE_QUERIES);
  const [trackingList, setTrackingList] = useState(SAMPLE_TRACKING);

  // Detail Drawer States
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedServiceRequest, setSelectedServiceRequest] = useState(null);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [selectedTrackingItem, setSelectedTrackingItem] = useState(null);

  // Modals
  const [raiseTicketModal, setRaiseTicketModal] = useState(false);
  const [raiseTicketForm, setRaiseTicketForm] = useState({
    employee: "Rahul Sharma",
    employeeId: "EMP1024",
    department: "Engineering",
    category: "Payroll & Compensation",
    priority: "Medium",
    subject: "",
    description: ""
  });

  const [logComplaintModal, setLogComplaintModal] = useState(false);
  const [logComplaintForm, setLogComplaintForm] = useState({
    employee: "Rahul Sharma",
    employeeId: "EMP1024",
    department: "Engineering",
    complaintType: "Workplace Issue",
    priority: "Medium",
    subject: "",
    description: ""
  });

  const [actionModal, setActionModal] = useState({
    isOpen: false,
    item: null,
    type: "", // Assign, Priority, Resolve, Escalate, Close
    newStatus: "",
    noteText: ""
  });

  // Action Menu Dropdown row ID
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Ticket creation handler
  const handleRaiseTicketSubmit = (e) => {
    e.preventDefault();
    const newTkt = {
      id: "TKT-" + (1050 + tickets.length),
      employee: raiseTicketForm.employee,
      employeeId: raiseTicketForm.employeeId,
      email: `${raiseTicketForm.employeeId.toLowerCase()}@nibhr.com`,
      department: raiseTicketForm.department,
      designation: "Professional Staff",
      type: "Ticket",
      category: raiseTicketForm.category,
      subject: raiseTicketForm.subject,
      priority: raiseTicketForm.priority,
      status: "Open",
      assignedTo: "Auto-Assigned HR",
      assignedRole: "Support Specialist",
      createdDate: "Today, Just now",
      slaDue: "Tomorrow, 06:00 PM",
      slaStatus: "On Track",
      lastUpdated: "Just now",
      description: raiseTicketForm.description,
      attachments: [],
      comments: [],
      internalNotes: "Ticket created via Employee Portal.",
      resolution: "",
      statusHistory: [
        { status: "Open", time: "Just now", actor: raiseTicketForm.employee }
      ]
    };

    setTickets([newTkt, ...tickets]);

    // Also register in tracking
    const newTrack = {
      refId: newTkt.id,
      type: "Ticket",
      employee: newTkt.employee,
      employeeId: newTkt.employeeId,
      department: newTkt.department,
      subject: newTkt.subject,
      assignedTo: newTkt.assignedTo,
      createdDate: "Today",
      currentStatus: "Open",
      slaDueDate: "Tomorrow",
      slaStatus: "On Track",
      lastUpdated: "Just now",
      resolutionDate: "Pending",
      timelineStages: [
        { name: "Created", completed: true, time: "Just now", agent: newTkt.employee },
        { name: "Assigned", completed: true, time: "Just now", agent: "Auto-Assignment Engine" },
        { name: "Acknowledged", completed: false, time: "—", agent: "—" },
        { name: "In Progress", completed: false, time: "—", agent: "—" },
        { name: "Pending / Escalated", completed: false, time: "—", agent: "—" },
        { name: "Resolution", completed: false, time: "—", agent: "—" },
        { name: "Resolved", completed: false, time: "—", agent: "—" },
        { name: "Closed", completed: false, time: "—", agent: "—" }
      ]
    };
    setTrackingList([newTrack, ...trackingList]);

    setRaiseTicketModal(false);
    setRaiseTicketForm({
      employee: "Rahul Sharma",
      employeeId: "EMP1024",
      department: "Engineering",
      category: "Payroll & Compensation",
      priority: "Medium",
      subject: "",
      description: ""
    });
    showToast(`Ticket #${newTkt.id} submitted successfully!`);
  };

  // Complaint submission handler
  const handleLogComplaintSubmit = (e) => {
    e.preventDefault();
    const newCmp = {
      id: "CMP-" + (205 + complaints.length),
      employee: logComplaintForm.employee,
      employeeId: logComplaintForm.employeeId,
      email: `${logComplaintForm.employeeId.toLowerCase()}@nibhr.com`,
      department: logComplaintForm.department,
      complaintType: logComplaintForm.complaintType,
      subject: logComplaintForm.subject,
      priority: logComplaintForm.priority,
      assignedTo: "Grievance Officer",
      submittedDate: "Today",
      slaDueDate: "3 Days",
      status: "Submitted",
      description: logComplaintForm.description,
      investigationNotes: "Confidential grievance received. Preliminary review initiated.",
      resolution: "",
      resolutionDate: "",
      timeline: [
        { step: "Submitted", time: "Today", actor: logComplaintForm.employee }
      ]
    };

    setComplaints([newCmp, ...complaints]);
    setLogComplaintModal(false);
    showToast(`Grievance #${newCmp.id} logged confidentially.`);
  };

  // Action status update handler
  const handleExecuteAction = (e) => {
    e.preventDefault();
    const { item, type, newStatus, noteText } = actionModal;
    if (!item) return;

    if (type === "statusChange" || type === "resolve" || type === "close" || type === "escalate") {
      const targetStatus = type === "resolve" ? "Resolved" : type === "close" ? "Closed" : type === "escalate" ? "Escalated" : newStatus;

      setTickets(prev =>
        prev.map(t => (t.id === item.id ? {
          ...t,
          status: targetStatus,
          resolution: type === "resolve" ? noteText || "Resolved by support team." : t.resolution,
          statusHistory: [
            ...(t.statusHistory || []),
            { status: targetStatus, time: "Just now", actor: user?.name || "Support Lead" }
          ]
        } : t))
      );

      if (selectedTicket?.id === item.id) {
        setSelectedTicket(prev => ({
          ...prev,
          status: targetStatus,
          resolution: type === "resolve" ? noteText || "Resolved by support team." : prev.resolution,
          statusHistory: [
            ...(prev.statusHistory || []),
            { status: targetStatus, time: "Just now", actor: user?.name || "Support Lead" }
          ]
        }));
      }

      showToast(`Ticket #${item.id} transitioned to "${targetStatus}".`);
    }

    setActionModal({ isOpen: false, item: null, type: "", newStatus: "", noteText: "" });
  };

  // Comment addition to active ticket
  const [commentInput, setCommentInput] = useState("");
  const handleAddComment = (ticketId) => {
    if (!commentInput.trim()) return;
    const newComm = {
      author: user?.name || "Support Lead",
      role: "HR Operations",
      time: "Just now",
      text: commentInput.trim()
    };

    setTickets(prev =>
      prev.map(t => t.id === ticketId ? { ...t, comments: [...(t.comments || []), newComm] } : t)
    );

    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => ({ ...prev, comments: [...(prev.comments || []), newComm] }));
    }

    setCommentInput("");
    showToast("Comment posted.");
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

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <span className="hover:text-slate-600 transition cursor-pointer" onClick={() => handleTabChange("Dashboard")}>
          Helpdesk
        </span>
        <span>/</span>
        <span className="hover:text-slate-600 transition cursor-pointer" onClick={() => handleTabChange("Dashboard")}>
          Dashboard
        </span>
        <span>/</span>
        <span className="text-indigo-600 font-extrabold">{HELPDESK_TABS[currentStepIndex]?.shortName}</span>
      </div>

      {/* Horizontal Nav Sub-Tabs (Sequential Series 1 to 6) */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {HELPDESK_TABS.map((tab) => {
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

      {/* Series Stepper Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 px-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">
            Series Stage:
          </span>
          <span className="font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full text-xs">
            Step {currentStepIndex + 1} of {HELPDESK_TABS.length} — {HELPDESK_TABS[currentStepIndex]?.shortName}
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
      {/* 1. HELPDESK DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === "Dashboard" && (
        <div className="space-y-6">
          {/* Main Title & Action Bar */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    Employee Service Hub
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">• Helpdesk & Issue Resolution</span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Helpdesk Dashboard</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Central command center for employee tickets, grievances, service fulfillment requests, and policy queries.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setRaiseTicketModal(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm"
                >
                  <PlusIcon className="w-4 h-4 stroke-[2.5]" />
                  <span>+ Raise Ticket</span>
                </button>
                <button
                  onClick={() => setLogComplaintModal(true)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition flex items-center gap-1.5 shadow-sm"
                >
                  <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" />
                  <span>Log Grievance</span>
                </button>
              </div>
            </div>
          </div>

          {/* 9 Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
            {[
              { label: "Total Tickets", value: HELPDESK_METRICS.totalTickets, color: "bg-slate-50 border-slate-200 text-slate-900" },
              { label: "Open Tickets", value: HELPDESK_METRICS.openTickets, color: "bg-amber-50 border-amber-200 text-amber-900" },
              { label: "In Progress", value: HELPDESK_METRICS.inProgress, color: "bg-blue-50 border-blue-200 text-blue-900" },
              { label: "Resolved", value: HELPDESK_METRICS.resolvedTickets, color: "bg-emerald-50 border-emerald-200 text-emerald-900" },
              { label: "Pending", value: HELPDESK_METRICS.pendingTickets, color: "bg-purple-50 border-purple-200 text-purple-900" },
              { label: "Escalated", value: HELPDESK_METRICS.escalatedTickets, color: "bg-rose-50 border-rose-200 text-rose-900" },
              { label: "Complaints", value: HELPDESK_METRICS.complaints, color: "bg-pink-50 border-pink-200 text-pink-900" },
              { label: "Service Requests", value: HELPDESK_METRICS.serviceRequests, color: "bg-cyan-50 border-cyan-200 text-cyan-900" },
              { label: "Queries", value: HELPDESK_METRICS.queries, color: "bg-indigo-50 border-indigo-200 text-indigo-900" }
            ].map((c) => (
              <div key={c.label} className={`rounded-2xl p-3.5 border shadow-2xs ${c.color}`}>
                <span className="text-[9px] font-black uppercase tracking-wider block opacity-75 truncate">{c.label}</span>
                <p className="text-2xl font-black mt-1 tracking-tight">{c.value}</p>
              </div>
            ))}
          </div>

          {/* 4 Performance Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {[
              { label: "Avg Resolution Time", value: HELPDESK_METRICS.performance.avgResolutionTime, desc: "Within SLA target of 6.0h", icon: ClockIcon, color: "text-blue-600 bg-blue-50" },
              { label: "SLA Compliance Rate", value: HELPDESK_METRICS.performance.slaCompliance, desc: "Across all priority tiers", icon: ShieldCheckIcon, color: "text-emerald-600 bg-emerald-50" },
              { label: "First Response Time", value: HELPDESK_METRICS.performance.firstResponseTime, desc: "Median automated triage", icon: ArrowPathIcon, color: "text-purple-600 bg-purple-50" },
              { label: "Employee CSAT Score", value: HELPDESK_METRICS.performance.csatScore, desc: "Based on 342 ratings", icon: StarIconSolid, color: "text-amber-500 bg-amber-50" }
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0 ${m.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{m.label}</span>
                    <p className="text-lg font-black text-slate-900">{m.value}</p>
                    <span className="text-[10px] text-slate-400 font-semibold block">{m.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts & Analytics Visual Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Status Distribution */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                Ticket Status Distribution
              </h3>
              <div className="space-y-2 pt-1 text-xs">
                {CHART_DATA.statusDistribution.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="text-slate-900">{item.count} Tickets</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="h-2 rounded-full" style={{ width: `${(item.count / 142) * 100}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tickets by Priority */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                Tickets by Priority
              </h3>
              <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
                {CHART_DATA.priorityBreakdown.map((p) => (
                  <div key={p.label} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700">{p.label}</span>
                      <span className="text-[10px] font-bold text-slate-400">{p.pct}</span>
                    </div>
                    <p className="text-xl font-black mt-1" style={{ color: p.color }}>{p.count}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Complaint vs Service vs Query Breakdown */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                Workload Type Distribution
              </h3>
              <div className="space-y-2 pt-1 text-xs">
                {CHART_DATA.typeBreakdown.map((t) => (
                  <div key={t.label} className="flex items-center justify-between p-2.5 rounded-xl border bg-slate-50/40">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                      <span className="font-bold text-slate-800 text-[11px]">{t.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900">{t.count}</span>
                      <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border">{t.pct}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Tickets Table */}
          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Recent Helpdesk Tickets
                </h3>
                <p className="text-[11px] text-slate-400">Latest active issues queued for support resolution</p>
              </div>
              <button
                onClick={() => handleTabChange("Tickets")}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                View All Tickets in Section 2 →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Ticket ID</th>
                    <th className="px-4 py-3.5">Employee</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Subject</th>
                    <th className="px-4 py-3.5 text-center">Priority</th>
                    <th className="px-4 py-3.5">Assigned To</th>
                    <th className="px-4 py-3.5">Created Date</th>
                    <th className="px-4 py-3.5">SLA Due</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-mono font-bold text-indigo-600">{t.id}</td>
                      <td className="px-4 py-3.5">
                        <span className="block font-black text-slate-900">{t.employee}</span>
                        <span className="text-[10px] text-slate-400">{t.employeeId} · {t.department}</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{t.category}</td>
                      <td className="px-4 py-3.5 text-slate-900 max-w-xs truncate">{t.subject}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${getPriorityBadgeClass(t.priority)}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">{t.assignedTo}</td>
                      <td className="px-4 py-3.5 text-slate-400">{t.createdDate}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-800">{t.slaDue}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${getStatusBadgeClass(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => setSelectedTicket(t)}
                          className="px-2.5 py-1 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-bold transition border border-slate-200 shadow-2xs"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TICKETS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === "Tickets" && (
        <div className="space-y-5">
          {/* Header Bar */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Ticket Management</h2>
              <p className="text-xs text-slate-400 mt-0.5">Filter, assign, investigate, and resolve employee helpdesk support tickets.</p>
            </div>
            <button
              onClick={() => setRaiseTicketModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
            >
              <PlusIcon className="w-4 h-4 stroke-[2.5]" />
              <span>+ Raise Ticket</span>
            </button>
          </div>

          {/* Advanced Filters */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Search Tickets</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket ID, subject, employee..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold focus:outline-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold"
              >
                <option value="ALL">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold"
              >
                <option value="ALL">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
                <option value="Escalated">Escalated</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Department</label>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold"
              >
                <option value="ALL">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance">Finance</option>
                <option value="Marketing">Marketing</option>
                <option value="Underwriting">Underwriting</option>
              </select>
            </div>
          </div>

          {/* Ticket Table */}
          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Ticket ID</th>
                    <th className="px-4 py-3.5">Employee</th>
                    <th className="px-4 py-3.5">Department</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Subject</th>
                    <th className="px-4 py-3.5 text-center">Priority</th>
                    <th className="px-4 py-3.5">Assigned To</th>
                    <th className="px-4 py-3.5">Created Date</th>
                    <th className="px-4 py-3.5">SLA Due Date</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5">Last Updated</th>
                    <th className="px-5 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-mono font-bold text-indigo-600">{t.id}</td>
                      <td className="px-4 py-3.5 font-black text-slate-900">{t.employee}</td>
                      <td className="px-4 py-3.5 text-slate-600">{t.department}</td>
                      <td className="px-4 py-3.5 text-slate-600">{t.category}</td>
                      <td className="px-4 py-3.5 text-slate-900 max-w-xs truncate">{t.subject}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${getPriorityBadgeClass(t.priority)}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">{t.assignedTo}</td>
                      <td className="px-4 py-3.5 text-slate-400">{t.createdDate}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-800">{t.slaDue}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${getStatusBadgeClass(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">{t.lastUpdated}</td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => setSelectedTicket(t)}
                          className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition border border-indigo-200"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. COMPLAINTS (GRIEVANCE MANAGEMENT) */}
      {/* ========================================================================= */}
      {activeTab === "Complaints" && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Employee Grievances & Complaints</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-stage grievance workflow: <strong>Submitted → Under Review → Investigation → Resolution Proposed → Resolved → Closed</strong>
              </p>
            </div>
            <button
              onClick={() => setLogComplaintModal(true)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
            >
              <PlusIcon className="w-4 h-4 stroke-[2.5]" />
              <span>+ Log Complaint</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Complaint ID</th>
                    <th className="px-4 py-3.5">Employee</th>
                    <th className="px-4 py-3.5">Department</th>
                    <th className="px-4 py-3.5">Complaint Type</th>
                    <th className="px-4 py-3.5">Subject</th>
                    <th className="px-4 py-3.5 text-center">Priority</th>
                    <th className="px-4 py-3.5">Assigned To</th>
                    <th className="px-4 py-3.5">Submitted Date</th>
                    <th className="px-4 py-3.5">SLA Due Date</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {complaints.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-mono font-bold text-rose-600">{c.id}</td>
                      <td className="px-4 py-3.5 font-black text-slate-900">{c.employee}</td>
                      <td className="px-4 py-3.5 text-slate-600">{c.department}</td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {c.complaintType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-900 max-w-xs truncate">{c.subject}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${getPriorityBadgeClass(c.priority)}`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">{c.assignedTo}</td>
                      <td className="px-4 py-3.5 text-slate-400">{c.submittedDate}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-800">{c.slaDueDate}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${getStatusBadgeClass(c.status)}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => setSelectedComplaint(c)}
                          className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition border border-rose-200"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SERVICE REQUESTS */}
      {/* ========================================================================= */}
      {activeTab === "Service Requests" && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Employee Service Requests</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Process certificate requests, ID card replacements, and HR document verification requisitions.
              </p>
            </div>
            <button
              onClick={() => showToast("Service Request creation open.")}
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
            >
              <PlusIcon className="w-4 h-4 stroke-[2.5]" />
              <span>+ New Service Request</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Request ID</th>
                    <th className="px-4 py-3.5">Employee</th>
                    <th className="px-4 py-3.5">Department</th>
                    <th className="px-4 py-3.5">Request Type</th>
                    <th className="px-4 py-3.5">Subject</th>
                    <th className="px-4 py-3.5">Assigned To</th>
                    <th className="px-4 py-3.5 text-center">Priority</th>
                    <th className="px-4 py-3.5">Requested Date</th>
                    <th className="px-4 py-3.5">Expected Completion</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {serviceRequests.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-mono font-bold text-cyan-600">{s.id}</td>
                      <td className="px-4 py-3.5 font-black text-slate-900">{s.employee}</td>
                      <td className="px-4 py-3.5 text-slate-600">{s.department}</td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-100">
                          {s.requestType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-900 max-w-xs truncate">{s.subject}</td>
                      <td className="px-4 py-3.5 text-slate-700">{s.assignedTo}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${getPriorityBadgeClass(s.priority)}`}>
                          {s.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">{s.requestedDate}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-800">{s.expectedCompletion}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${getStatusBadgeClass(s.status)}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => setSelectedServiceRequest(s)}
                          className="px-3 py-1 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 rounded-lg text-xs font-bold transition border border-cyan-200"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. QUERY RESOLUTION */}
      {/* ========================================================================= */}
      {activeTab === "Query Resolution" && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Query Resolution & Knowledge Q&A</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Resolve policy, process, and benefits questions with verified HR answers and satisfaction ratings.
              </p>
            </div>
            <button
              onClick={() => showToast("Question submission modal opened.")}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
            >
              <PlusIcon className="w-4 h-4 stroke-[2.5]" />
              <span>+ Ask Question</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Query ID</th>
                    <th className="px-4 py-3.5">Employee</th>
                    <th className="px-4 py-3.5">Department</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Question</th>
                    <th className="px-4 py-3.5">Assigned To</th>
                    <th className="px-4 py-3.5">Submitted Date</th>
                    <th className="px-4 py-3.5">Resolution Date</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-center">Rating</th>
                    <th className="px-5 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {queries.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-mono font-bold text-indigo-600">{q.id}</td>
                      <td className="px-4 py-3.5 font-black text-slate-900">{q.employee}</td>
                      <td className="px-4 py-3.5 text-slate-600">{q.department}</td>
                      <td className="px-4 py-3.5 text-slate-600">{q.queryCategory}</td>
                      <td className="px-4 py-3.5 text-slate-900 max-w-xs truncate">{q.question}</td>
                      <td className="px-4 py-3.5 text-slate-700">{q.assignedTo}</td>
                      <td className="px-4 py-3.5 text-slate-400">{q.submittedDate}</td>
                      <td className="px-4 py-3.5 text-slate-400">{q.resolutionDate || "—"}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${getStatusBadgeClass(q.status)}`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {q.rating ? (
                          <div className="flex items-center justify-center gap-0.5 text-amber-500 font-bold">
                            <span>{q.rating}</span>
                            <StarIconSolid className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => setSelectedQuery(q)}
                          className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition border border-indigo-200"
                        >
                          View Answer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TRACKING (CENTRALIZED HELPDESK TRACKING) */}
      {/* ========================================================================= */}
      {activeTab === "Tracking" && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Centralized Helpdesk Tracking Matrix</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live audit trail and SLA status tracking across Tickets, Grievances, Service Requests, and Queries.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Reference ID</th>
                    <th className="px-4 py-3.5">Type</th>
                    <th className="px-4 py-3.5">Employee</th>
                    <th className="px-4 py-3.5">Subject</th>
                    <th className="px-4 py-3.5">Assigned To</th>
                    <th className="px-4 py-3.5">Created Date</th>
                    <th className="px-4 py-3.5 text-center">Current Status</th>
                    <th className="px-4 py-3.5">SLA Due Date</th>
                    <th className="px-4 py-3.5 text-center">SLA Status</th>
                    <th className="px-4 py-3.5">Resolution Date</th>
                    <th className="px-5 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {trackingList.map((tr) => (
                    <tr key={tr.refId} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-mono font-bold text-indigo-600">{tr.refId}</td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border">
                          {tr.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-black text-slate-900">{tr.employee}</td>
                      <td className="px-4 py-3.5 text-slate-900 max-w-xs truncate">{tr.subject}</td>
                      <td className="px-4 py-3.5 text-slate-700">{tr.assignedTo}</td>
                      <td className="px-4 py-3.5 text-slate-400">{tr.createdDate}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${getStatusBadgeClass(tr.currentStatus)}`}>
                          {tr.currentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">{tr.slaDueDate}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${getSlaStatusBadgeClass(tr.slaStatus)}`}>
                          {tr.slaStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">{tr.resolutionDate}</td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => setSelectedTrackingItem(tr)}
                          className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition border border-indigo-200"
                        >
                          View Timeline
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAIL DRAWERS / MODALS */}
      {/* ========================================================================= */}

      {/* 1. TICKET DETAIL DRAWER */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Ticket Information · #{selectedTicket.id}
              </span>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Header & Status */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${getPriorityBadgeClass(selectedTicket.priority)} mr-2`}>
                  {selectedTicket.priority} Priority
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${getStatusBadgeClass(selectedTicket.status)}`}>
                  {selectedTicket.status}
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-2">{selectedTicket.subject}</h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActionModal({ isOpen: true, item: selectedTicket, type: "resolve", newStatus: "Resolved", noteText: "" })}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs"
                >
                  Resolve Ticket
                </button>
                <button
                  onClick={() => setActionModal({ isOpen: true, item: selectedTicket, type: "escalate", newStatus: "Escalated", noteText: "" })}
                  className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-bold rounded-xl"
                >
                  Escalate
                </button>
              </div>
            </div>

            {/* Employee & SLA Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Employee</span>
                <span className="font-extrabold text-slate-900">{selectedTicket.employee}</span>
                <span className="text-[10px] text-slate-400 block">{selectedTicket.employeeId}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Department</span>
                <span className="font-extrabold text-slate-800">{selectedTicket.department}</span>
                <span className="text-[10px] text-slate-400 block">{selectedTicket.category}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Assigned Agent</span>
                <span className="font-extrabold text-indigo-600">{selectedTicket.assignedTo}</span>
                <span className="text-[10px] text-slate-400 block">{selectedTicket.assignedRole}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">SLA Target Due</span>
                <span className="font-extrabold text-slate-800">{selectedTicket.slaDue}</span>
                <span className={`text-[10px] font-bold block ${selectedTicket.slaStatus === "SLA Breached" ? "text-rose-600" : "text-emerald-600"}`}>
                  ● {selectedTicket.slaStatus}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5 text-xs">
              <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider">Issue Description</h4>
              <p className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 leading-relaxed text-slate-700">
                {selectedTicket.description}
              </p>
            </div>

            {/* Resolution if available */}
            {selectedTicket.resolution && (
              <div className="space-y-1.5 text-xs">
                <h4 className="font-black text-emerald-800 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                  Official Resolution
                </h4>
                <p className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 leading-relaxed text-emerald-900 font-semibold">
                  {selectedTicket.resolution}
                </p>
              </div>
            )}

            {/* Internal Notes */}
            <div className="space-y-1.5 text-xs">
              <h4 className="font-black text-purple-900 uppercase text-[11px] tracking-wider">Internal Support Notes (Confidential)</h4>
              <p className="p-3 bg-purple-50/30 rounded-xl border border-purple-200/80 italic text-purple-900">
                "{selectedTicket.internalNotes || "No internal notes recorded yet."}"
              </p>
            </div>

            {/* Comments Stream */}
            <div className="space-y-3 text-xs">
              <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider">Communication & Comments</h4>
              <div className="space-y-2">
                {(selectedTicket.comments || []).map((comm, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1">
                      <span className="text-slate-800">{comm.author} ({comm.role})</span>
                      <span>{comm.time}</span>
                    </div>
                    <p className="text-slate-700 text-xs">{comm.text}</p>
                  </div>
                ))}
              </div>

              {/* Add Comment Input */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Type an update or comment to employee..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-indigo-500"
                />
                <button
                  onClick={() => handleAddComment(selectedTicket.id)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-2xs"
                >
                  Send
                </button>
              </div>
            </div>

            {/* Status History & Timeline */}
            <div className="space-y-2 text-xs border-t pt-4">
              <h4 className="font-black text-slate-900 uppercase text-[11px] tracking-wider">Audit Timeline</h4>
              <div className="flex flex-wrap gap-4 text-[11px]">
                {(selectedTicket.statusHistory || []).map((st, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    <strong>{st.status}</strong>
                    <span className="text-slate-400">({st.time} by {st.actor})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. COMPLAINT INVESTIGATION DRAWER */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-5 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <span className="text-xs font-black text-rose-600 uppercase tracking-wider">
                  Grievance Investigation · #{selectedComplaint.id}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">{selectedComplaint.subject}</h3>
              </div>
              <button onClick={() => setSelectedComplaint(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* 6-Stage Visual Workflow Stepper */}
            <div className="p-4 bg-slate-50 rounded-2xl border space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Complaint Resolution Lifecycle</span>
              <div className="flex items-center justify-between text-center overflow-x-auto py-1">
                {["Submitted", "Under Review", "Investigation", "Resolution Proposed", "Resolved", "Closed"].map((st, idx) => {
                  const isDone = selectedComplaint.timeline?.some(t => t.step === st) || selectedComplaint.status === st;
                  return (
                    <div key={st} className="flex flex-col items-center px-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                        isDone ? "bg-rose-600 text-white" : "bg-slate-200 text-slate-500"
                      }`}>
                        {idx + 1}
                      </div>
                      <span className={`text-[9px] font-bold mt-1 ${isDone ? "text-rose-700" : "text-slate-400"}`}>{st}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white border rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Complainant</span>
                <span className="font-extrabold text-slate-900">{selectedComplaint.employee}</span>
                <span className="text-[10px] text-slate-400 block">{selectedComplaint.department}</span>
              </div>
              <div className="p-3 bg-white border rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Investigating HR</span>
                <span className="font-extrabold text-indigo-600">{selectedComplaint.assignedTo}</span>
                <span className="text-[10px] text-slate-400 block">SLA: {selectedComplaint.slaDueDate}</span>
              </div>
            </div>

            <div>
              <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-wider mb-1">Grievance Narrative</h4>
              <p className="p-3 bg-slate-50 rounded-xl border text-slate-700 leading-relaxed">{selectedComplaint.description}</p>
            </div>

            <div>
              <h4 className="font-black text-purple-900 uppercase text-[10px] tracking-wider mb-1">Confidential Investigation Findings</h4>
              <p className="p-3 bg-purple-50/40 rounded-xl border border-purple-200 text-purple-900 italic">{selectedComplaint.investigationNotes}</p>
            </div>

            {selectedComplaint.resolution && (
              <div>
                <h4 className="font-black text-emerald-800 uppercase text-[10px] tracking-wider mb-1">Proposed Resolution</h4>
                <p className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 font-semibold">{selectedComplaint.resolution}</p>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. TRACKING TIMELINE DRAWER */}
      {selectedTrackingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-5 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">
                  Lifecycle Progress Timeline · {selectedTrackingItem.refId}
                </span>
                <h3 className="text-sm font-black text-slate-900 mt-0.5">{selectedTrackingItem.subject}</h3>
              </div>
              <button onClick={() => setSelectedTrackingItem(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* 8-Stage Progress Timeline */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Full 8-Stage Triage & Resolution Path
              </span>
              <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {selectedTrackingItem.timelineStages.map((st, idx) => (
                  <div key={idx} className="relative">
                    <div
                      className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ring-4 ${
                        st.completed
                          ? "bg-indigo-600 ring-indigo-50"
                          : "bg-slate-300 ring-slate-100"
                      }`}
                    />
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-xs ${st.completed ? "text-slate-900 font-extrabold" : "text-slate-400"}`}>
                        {st.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{st.time}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">Assigned / Handled by: {st.agent}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setSelectedTrackingItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
              >
                Close Tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. RAISE TICKET MODAL */}
      {raiseTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans text-xs">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-lg space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase">Raise Helpdesk Ticket</h3>
              <button onClick={() => setRaiseTicketModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRaiseTicketSubmit} className="space-y-3.5">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Subject / Issue Summary *</label>
                <input
                  type="text"
                  value={raiseTicketForm.subject}
                  onChange={(e) => setRaiseTicketForm({ ...raiseTicketForm, subject: e.target.value })}
                  placeholder="e.g. Discrepancy in August Payslip Tax Calculation"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Category *</label>
                  <select
                    value={raiseTicketForm.category}
                    onChange={(e) => setRaiseTicketForm({ ...raiseTicketForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold"
                  >
                    <option value="Payroll & Compensation">Payroll & Compensation</option>
                    <option value="IT Hardware & Access">IT Hardware & Access</option>
                    <option value="Leave & Attendance">Leave & Attendance</option>
                    <option value="Benefits & Medical">Benefits & Medical</option>
                    <option value="Workplace & Admin">Workplace & Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Priority Tier *</label>
                  <select
                    value={raiseTicketForm.priority}
                    onChange={(e) => setRaiseTicketForm({ ...raiseTicketForm, priority: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold"
                  >
                    <option value="Low">Low (SLA 48h)</option>
                    <option value="Medium">Medium (SLA 24h)</option>
                    <option value="High">High (SLA 8h)</option>
                    <option value="Critical">Critical (SLA 4h)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Description & Reproduction Steps *</label>
                <textarea
                  value={raiseTicketForm.description}
                  onChange={(e) => setRaiseTicketForm({ ...raiseTicketForm, description: e.target.value })}
                  placeholder="Describe your issue with all required details..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold h-24"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setRaiseTicketModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. LOG COMPLAINT MODAL */}
      {logComplaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans text-xs">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-lg space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-rose-600 uppercase">Log Employee Grievance</h3>
              <button onClick={() => setLogComplaintModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogComplaintSubmit} className="space-y-3.5">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Complaint Subject *</label>
                <input
                  type="text"
                  value={logComplaintForm.subject}
                  onChange={(e) => setLogComplaintForm({ ...logComplaintForm, subject: e.target.value })}
                  placeholder="Specify subject matter..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Grievance Type *</label>
                  <select
                    value={logComplaintForm.complaintType}
                    onChange={(e) => setLogComplaintForm({ ...logComplaintForm, complaintType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold"
                  >
                    <option value="Workplace Issue">Workplace Issue</option>
                    <option value="Policy Issue">Policy Issue</option>
                    <option value="Manager/Team Concern">Manager/Team Concern</option>
                    <option value="Facilities Issue">Facilities Issue</option>
                    <option value="Employee Service Issue">Employee Service Issue</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Priority *</label>
                  <select
                    value={logComplaintForm.priority}
                    onChange={(e) => setLogComplaintForm({ ...logComplaintForm, priority: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Confidential Statement *</label>
                <textarea
                  value={logComplaintForm.description}
                  onChange={(e) => setLogComplaintForm({ ...logComplaintForm, description: e.target.value })}
                  placeholder="Provide objective facts, dates, and names..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold h-24"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setLogComplaintModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-sm"
                >
                  File Confidentially
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. UNIVERSAL ACTION MODAL (RESOLVE / ESCALATE) */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans text-xs">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-md space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase">
              Action: {actionModal.type.toUpperCase()} #{actionModal.item?.id}
            </h3>

            <form onSubmit={handleExecuteAction} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Resolution / Action Note *</label>
                <textarea
                  value={actionModal.noteText}
                  onChange={(e) => setActionModal({ ...actionModal, noteText: e.target.value })}
                  placeholder="Provide resolution details or escalation rationale..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold h-24"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setActionModal({ isOpen: false, item: null, type: "", newStatus: "", noteText: "" })}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-xl font-bold shadow-sm ${
                    actionModal.type === "escalate" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  Confirm Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpdeskDashboard;
