// Frontend/src/components/Exit/ExitDashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { apiFetch } from "../../services/hrApi";
import {
  InboxStackIcon,
  ArrowRightOnRectangleIcon,
  ClockIcon,
  CheckCircleIcon,
  ComputerDesktopIcon,
  DocumentTextIcon,
  BanknotesIcon,
  FaceFrownIcon,
  ChatBubbleLeftRightIcon,
  DocumentCheckIcon,
  AcademicCapIcon,
  ArchiveBoxIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  CheckBadgeIcon
} from "@heroicons/react/24/outline";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

import { PIPELINE_STAGES, getStatusBadgeClass, SAMPLE_RESIGNATIONS } from "./exitData";
import Resignation from "./Resignation";
import NoticePeriod from "./NoticePeriod";
import ExitClearance from "./ExitClearance";
import AssetReturn from "./AssetReturn";
import NoDues from "./NoDues";
import FnfSettlement from "./FnfSettlement";
import ExitInterview from "./ExitInterview";
import ExperienceLetter from "./ExperienceLetter";
import ExitHistory from "./ExitHistory";
import EmployeeExitDetailDrawer from "./EmployeeExitDetailDrawer";
import InitiateExitModal from "./InitiateExitModal";

const COLORS = ["#6366F1", "#EC4899", "#14B8A6", "#F59E0B", "#EF4444", "#3B82F6"];

const MODULE_TABS = [
  { id: "Overview", label: "Overview", icon: ArrowRightOnRectangleIcon },
  { id: "Resignations", label: "Resignations", icon: InboxStackIcon },
  { id: "Notice Period", label: "Notice Period", icon: ClockIcon },
  { id: "Exit Clearance", label: "Exit Clearance", icon: CheckCircleIcon },
  { id: "Asset Return", label: "Asset Return", icon: ComputerDesktopIcon },
  { id: "No Dues", label: "No Dues", icon: DocumentCheckIcon },
  { id: "F&F Settlement", label: "F&F Settlement", icon: BanknotesIcon },
  { id: "Exit Interview", label: "Exit Interview", icon: ChatBubbleLeftRightIcon },
  { id: "Exit Documents", label: "Exit Documents", icon: AcademicCapIcon },
  { id: "Exit History", label: "Exit History", icon: ArchiveBoxIcon }
];

const ExitDashboard = ({ selectedTab, activeTab: propActiveTab, user, onRefreshData }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const userRole = String(user?.role?.name || user?.role?.roleName || user?.role || "").toLowerCase().trim();

  // Resolve incoming tab to valid tab id
  const resolveTab = (target) => {
    if (!target) return "Overview";
    const cleaned = target.trim().toLowerCase();
    if (cleaned === "exit dashboard" || cleaned === "dashboard" || cleaned === "overview") return "Overview";
    if (cleaned === "resignation" || cleaned === "resignations") return "Resignations";
    if (cleaned === "experience letter" || cleaned === "exit documents" || cleaned === "documents") return "Exit Documents";
    if (cleaned === "exit interview" || cleaned === "exit interviews") return "Exit Interview";
    const found = MODULE_TABS.find(t => t.id.toLowerCase() === cleaned || t.label.toLowerCase() === cleaned);
    if (found) return found.id;
    return "Overview";
  };

  const initialTab = resolveTab(selectedTab || propActiveTab || searchParams.get("tab"));
  const [activeTab, setActiveTab] = useState(initialTab);

  // Search & Global Filter State
  const [globalSearch, setGlobalSearch] = useState("");
  const [showFilterBar, setShowFilterBar] = useState(false);

  // Modals state
  const [isInitiateModalOpen, setIsInitiateModalOpen] = useState(false);
  const [detailDrawerEmployee, setDetailDrawerEmployee] = useState(null);

  // Sync state if selectedTab or URL param changes
  useEffect(() => {
    const target = selectedTab || propActiveTab || searchParams.get("tab");
    if (target) {
      setActiveTab(resolveTab(target));
    }
  }, [selectedTab, propActiveTab, searchParams]);

  // Handle Tab Navigation
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("category", "EXIT_MGMT");
    newParams.set("tab", tabId);
    setSearchParams(newParams, { replace: true });
  };

  // Summary Metrics Cards (128 Total Exits, 12 Pending Approval, 24 Notice Period, 18 Clearance Pending, 15 F&F Pending, 59 Completed)
  const summaryCards = [
    { label: "Total Exits", value: 128, color: "text-slate-900 bg-slate-100 border-slate-200" },
    { label: "Pending Approval", value: 12, color: "text-amber-700 bg-amber-50 border-amber-200" },
    { label: "Notice Period", value: 24, color: "text-blue-700 bg-blue-50 border-blue-200" },
    { label: "Clearance Pending", value: 18, color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
    { label: "F&F Pending", value: 15, color: "text-purple-700 bg-purple-50 border-purple-200" },
    { label: "Completed", value: 59, color: "text-emerald-700 bg-emerald-50 border-emerald-200" }
  ];

  // Analytics Chart Data
  const reasonChartData = [
    { name: "Better Opportunity", value: 48 },
    { name: "Higher Studies", value: 24 },
    { name: "Relocation", value: 20 },
    { name: "Personal", value: 16 },
    { name: "Compensation", value: 12 },
    { name: "Health", value: 8 }
  ];

  const deptChartData = [
    { department: "Engineering", count: 42 },
    { department: "HR", count: 18 },
    { department: "Finance", count: 15 },
    { department: "Marketing", count: 14 },
    { department: "Design", count: 12 },
    { department: "Operations", count: 27 }
  ];

  const exportOverviewCSV = () => {
    const headers = ["Employee", "EMP ID", "Department", "Designation", "Resignation Date", "Last Working Day", "Exit Type", "Current Stage", "Status"];
    const rows = SAMPLE_RESIGNATIONS.map(r => [
      r.employee, r.employeeId, r.department, r.designation, r.resignationDate, r.lastWorkingDay, r.exitType, r.currentStage, r.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Exit_Management_Overview.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header & Global Actions */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                TechnoVani HRMS
              </span>
              <span className="text-[10px] font-bold text-slate-400">• Complete Separation Lifecycle</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Exit Management</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Orchestrate employee resignations, multi-department clearances, asset handovers, F&F payroll calculations, and service documentation.
            </p>
          </div>

          {/* Top-right actions: + Initiate Exit, Export, Filter, Search Employee */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Employee input */}
            <div className="relative w-48 sm:w-60">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search employee..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold focus:outline-indigo-500"
              />
            </div>

            {/* Filter button */}
            <button
              onClick={() => setShowFilterBar(!showFilterBar)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                showFilterBar ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <FunnelIcon className="w-4 h-4" />
              <span>Filter</span>
            </button>

            {/* Export button */}
            <button
              onClick={exportOverviewCSV}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition flex items-center gap-1.5 shadow-sm"
            >
              <ArrowDownTrayIcon className="w-4 h-4 text-slate-500" />
              <span>Export</span>
            </button>

            {/* + Initiate Exit */}
            <button
              onClick={() => setIsInitiateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <PlusIcon className="w-4 h-4 stroke-[2.5]" />
              <span>Initiate Exit</span>
            </button>
          </div>
        </div>

        {/* Collapsible Filter Bar */}
        {showFilterBar && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs animate-fade-in">
            <select className="bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold">
              <option>All Departments</option>
              <option>Engineering</option>
              <option>Human Resources</option>
              <option>Finance</option>
              <option>Marketing</option>
            </select>
            <select className="bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold">
              <option>All Exit Types</option>
              <option>Voluntary</option>
              <option>Involuntary</option>
              <option>Retirement</option>
              <option>Contract End</option>
            </select>
            <select className="bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold">
              <option>All Clearance Statuses</option>
              <option>Cleared</option>
              <option>Pending</option>
              <option>In Progress</option>
            </select>
            <select className="bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold">
              <option>Last 30 Days</option>
              <option>This Quarter</option>
              <option>Current Year</option>
            </select>
          </div>
        )}
      </div>

      {/* Horizontal Nav Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {MODULE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all duration-150 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. EXIT MANAGEMENT OVERVIEW PAGE */}
      {/* ========================================================================= */}
      {activeTab === "Overview" && (
        <div className="space-y-6">
          {/* Summary Cards: 128 Total, 12 Pending, 24 Notice, 18 Clearance, 15 F&F, 59 Completed */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {summaryCards.map((c) => (
              <div key={c.label} className={`rounded-2xl p-4 border shadow-sm transition hover:shadow-md ${c.color}`}>
                <span className="text-[10px] font-black uppercase tracking-wider block opacity-70">
                  {c.label}
                </span>
                <p className="text-2xl font-black mt-1 tracking-tight">{c.value}</p>
              </div>
            ))}
          </div>

          {/* Visual Exit Pipeline */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  Complete Employee Exit Lifecycle Pipeline
                </h3>
                <p className="text-[11px] text-slate-400">Step-by-step progress flow through clearance, handover, financial settlement, and certificate issuance.</p>
              </div>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                10 Automated Stages
              </span>
            </div>

            {/* Stepper Steps */}
            <div className="overflow-x-auto pt-2 pb-2">
              <div className="flex items-center min-w-[900px] justify-between">
                {PIPELINE_STAGES.map((st, i) => (
                  <React.Fragment key={st.id}>
                    <div className="flex flex-col items-center group cursor-pointer" onClick={() => {
                      if (st.id === "resignation") handleTabChange("Resignations");
                      else if (st.id === "clearance") handleTabChange("Exit Clearance");
                      else if (st.id === "assets") handleTabChange("Asset Return");
                      else if (st.id === "nodues") handleTabChange("No Dues");
                      else if (st.id === "interview") handleTabChange("Exit Interview");
                      else if (st.id === "fnf") handleTabChange("F&F Settlement");
                      else if (st.id === "letters") handleTabChange("Exit Documents");
                    }}>
                      <div className="w-9 h-9 rounded-2xl bg-indigo-50 border-2 border-indigo-200 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center font-black text-xs transition shadow-sm">
                        {st.step}
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 mt-2 text-center group-hover:text-indigo-600 whitespace-nowrap">
                        {st.label}
                      </span>
                    </div>
                    {i < PIPELINE_STAGES.length - 1 && (
                      <div className="flex-1 h-0.5 mx-2 bg-slate-200" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Analytics Charts (Attrition Reasons & Department Exits) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reasons Chart */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  Exit Reasons Distribution
                </h3>
                <span className="text-[10px] text-slate-400 font-bold">128 Total Logged</span>
              </div>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reasonChartData}
                      cx="50%"
                      cy="50%"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {reasonChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Department Exits Chart */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  Department-wise Exit Volume
                </h3>
                <span className="text-[10px] text-slate-400 font-bold">Current Fiscal Year</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="department" tick={{ fontSize: 10, fontWeight: "bold" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Active Separation Pipeline Table */}
          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Active Employee Separation Pipelines
                </h3>
                <p className="text-[11px] text-slate-400">Live separation records progressing through lifecycle stages.</p>
              </div>
              <button
                onClick={() => handleTabChange("Resignations")}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                View All Resignations →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-4">Employee</th>
                    <th className="px-4 py-4">EMP ID</th>
                    <th className="px-4 py-4">Department</th>
                    <th className="px-4 py-4">Designation</th>
                    <th className="px-4 py-4">Resignation Date</th>
                    <th className="px-4 py-4">Last Working Day</th>
                    <th className="px-4 py-4">Current Stage</th>
                    <th className="px-4 py-4 text-center">Status</th>
                    <th className="px-5 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {SAMPLE_RESIGNATIONS.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs shrink-0">
                            {r.avatar}
                          </div>
                          <div>
                            <span className="block font-black text-slate-900">{r.employee}</span>
                            <span className="text-[10px] text-slate-400">{r.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono font-bold text-indigo-600">{r.employeeId}</td>
                      <td className="px-4 py-4 text-slate-600">{r.department}</td>
                      <td className="px-4 py-4 text-slate-600">{r.designation}</td>
                      <td className="px-4 py-4 text-slate-500">{r.resignationDate}</td>
                      <td className="px-4 py-4 font-bold text-slate-900">{r.lastWorkingDay}</td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold">
                          {r.currentStage}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusBadgeClass(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => setDetailDrawerEmployee(r)}
                          className="px-2.5 py-1 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-slate-200 mx-auto"
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                          <span>View</span>
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
      {/* 2. RESIGNATIONS PAGE */}
      {/* ========================================================================= */}
      {activeTab === "Resignations" && (
        <Resignation user={user} onViewEmployee={(emp) => setDetailDrawerEmployee(emp)} />
      )}

      {/* ========================================================================= */}
      {/* NOTICE PERIOD TRACKER */}
      {/* ========================================================================= */}
      {activeTab === "Notice Period" && (
        <NoticePeriod user={user} />
      )}

      {/* ========================================================================= */}
      {/* 3. EXIT CLEARANCE PAGE */}
      {/* ========================================================================= */}
      {activeTab === "Exit Clearance" && (
        <ExitClearance user={user} onViewEmployee={(emp) => setDetailDrawerEmployee(emp)} />
      )}

      {/* ========================================================================= */}
      {/* 4. ASSET RETURN PAGE */}
      {/* ========================================================================= */}
      {activeTab === "Asset Return" && (
        <AssetReturn user={user} onViewEmployee={(emp) => setDetailDrawerEmployee(emp)} />
      )}

      {/* ========================================================================= */}
      {/* 5. NO DUES PAGE */}
      {/* ========================================================================= */}
      {activeTab === "No Dues" && (
        <NoDues user={user} onViewEmployee={(emp) => setDetailDrawerEmployee(emp)} />
      )}

      {/* ========================================================================= */}
      {/* 6. FULL & FINAL SETTLEMENT PAGE */}
      {/* ========================================================================= */}
      {activeTab === "F&F Settlement" && (
        <FnfSettlement user={user} onViewEmployee={(emp) => setDetailDrawerEmployee(emp)} />
      )}

      {/* ========================================================================= */}
      {/* 7. EXIT INTERVIEW PAGE */}
      {/* ========================================================================= */}
      {activeTab === "Exit Interview" && (
        <ExitInterview user={user} onViewEmployee={(emp) => setDetailDrawerEmployee(emp)} />
      )}

      {/* ========================================================================= */}
      {/* 8. EXIT DOCUMENTS (EXPERIENCE & RELIEVING LETTERS) */}
      {/* ========================================================================= */}
      {activeTab === "Exit Documents" && (
        <ExperienceLetter user={user} onViewEmployee={(emp) => setDetailDrawerEmployee(emp)} />
      )}

      {/* ========================================================================= */}
      {/* 9. EXIT HISTORY / AUDIT TIMELINE */}
      {/* ========================================================================= */}
      {activeTab === "Exit History" && (
        <ExitHistory user={user} onViewEmployee={(emp) => setDetailDrawerEmployee(emp)} />
      )}

      {/* ========================================================================= */}
      {/* 10. EMPLOYEE EXIT DETAIL DRAWER (SECTION 10) */}
      {/* ========================================================================= */}
      <EmployeeExitDetailDrawer
        isOpen={!!detailDrawerEmployee}
        employee={detailDrawerEmployee}
        onClose={() => setDetailDrawerEmployee(null)}
      />

      {/* INITIATE EXIT MODAL */}
      <InitiateExitModal
        isOpen={isInitiateModalOpen}
        onClose={() => setIsInitiateModalOpen(false)}
        onCreated={(newExit) => {
          handleTabChange("Resignations");
        }}
      />
    </div>
  );
};

export default ExitDashboard;
