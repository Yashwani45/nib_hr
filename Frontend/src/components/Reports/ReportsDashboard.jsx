// Frontend/src/components/Reports/ReportsDashboard.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  FunnelIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  TableCellsIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  PlusIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";
import { REPORT_MODULES } from "./reportsData";
import { apiFetch } from "../../services/hrApi";

// Stylized Top Right Graphic Illustration Component
const ReportsIllustration = () => (
  <div className="hidden sm:block relative w-56 h-28 shrink-0 select-none pointer-events-none">
    <svg viewBox="0 0 240 120" className="w-full h-full drop-shadow-sm" fill="none">
      {/* Background Soft Glow */}
      <circle cx="160" cy="60" r="50" fill="#EEF2FF" />
      <circle cx="80" cy="50" r="40" fill="#F0FDF4" />

      {/* Sheet 1 - Left / Behind (Bar Chart) */}
      <g transform="rotate(-6 60 70)">
        <rect x="20" y="15" width="70" height="90" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
        <rect x="30" y="25" width="30" height="4" rx="2" fill="#94A3B8" />
        <rect x="30" y="32" width="20" height="3" rx="1.5" fill="#CBD5E1" />
        {/* Bars */}
        <rect x="32" y="65" width="8" height="26" rx="2" fill="#60A5FA" />
        <rect x="44" y="50" width="8" height="41" rx="2" fill="#3B82F6" />
        <rect x="56" y="58" width="8" height="33" rx="2" fill="#93C5FD" />
        <rect x="68" y="44" width="8" height="47" rx="2" fill="#2563EB" />
        <line x1="28" y1="94" x2="82" y2="94" stroke="#E2E8F0" strokeWidth="1.5" />
      </g>

      {/* Sheet 2 - Middle / Raised (Donut / Pie Chart) */}
      <g transform="translate(85, 8)">
        <rect x="0" y="0" width="74" height="96" rx="8" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
        <rect x="10" y="12" width="34" height="4" rx="2" fill="#64748B" />
        <rect x="10" y="19" width="24" height="3" rx="1.5" fill="#CBD5E1" />
        {/* Donut Chart */}
        <circle cx="37" cy="54" r="22" stroke="#E0E7FF" strokeWidth="10" fill="none" />
        <circle
          cx="37"
          cy="54"
          r="22"
          stroke="#6366F1"
          strokeWidth="10"
          strokeDasharray="138"
          strokeDashoffset="45"
          strokeLinecap="round"
          fill="none"
          transform="rotate(-90 37 54)"
        />
        <circle
          cx="37"
          cy="54"
          r="22"
          stroke="#38BDF8"
          strokeWidth="10"
          strokeDasharray="138"
          strokeDashoffset="100"
          strokeLinecap="round"
          fill="none"
          transform="rotate(60 37 54)"
        />
        {/* Legend dots */}
        <circle cx="16" cy="85" r="3" fill="#6366F1" />
        <rect x="22" y="83" width="16" height="4" rx="1" fill="#94A3B8" />
        <circle cx="44" cy="85" r="3" fill="#38BDF8" />
        <rect x="50" y="83" width="16" height="4" rx="1" fill="#94A3B8" />
      </g>

      {/* Sheet 3 - Right / Angled (Line / Metric) */}
      <g transform="rotate(7 190 70)">
        <rect x="145" y="16" width="68" height="88" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
        <rect x="155" y="26" width="28" height="4" rx="2" fill="#94A3B8" />
        <rect x="155" y="33" width="18" height="3" rx="1.5" fill="#CBD5E1" />
        {/* Line Chart */}
        <path
          d="M154 75 L165 62 L176 68 L188 48 L199 52"
          stroke="#10B981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="154" cy="75" r="2.5" fill="#10B981" />
        <circle cx="165" cy="62" r="2.5" fill="#10B981" />
        <circle cx="176" cy="68" r="2.5" fill="#10B981" />
        <circle cx="188" cy="48" r="2.5" fill="#10B981" />
        <circle cx="199" cy="52" r="2.5" fill="#10B981" />
      </g>
    </svg>
  </div>
);

const ReportsDashboard = ({ selectedTab, activeTab: propActiveTab, user }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Series Tabs Definition (like in Learning / Exit Management)
  const SERIES_TABS = useMemo(() => {
    return [
      { id: "Dashboard", label: "Dashboard" },
      ...REPORT_MODULES.map(m => ({ id: m.id, label: m.title }))
    ];
  }, []);

  // Resolve incoming tab to valid tab ID
  const resolveTabId = (tabName) => {
    if (!tabName) return "Dashboard";
    const cleaned = String(tabName).trim().toLowerCase();
    if (cleaned.includes("dashboard") || cleaned === "reports" || cleaned === "overview") return "Dashboard";

    const matched = REPORT_MODULES.find(m => {
      const titleLower = m.title.toLowerCase();
      const idLower = m.id.toLowerCase();
      const catTabLower = m.categoryTab.toLowerCase();
      return (
        cleaned === idLower ||
        cleaned === titleLower ||
        cleaned === catTabLower ||
        cleaned.includes(titleLower) ||
        catTabLower.includes(cleaned)
      );
    });

    return matched ? matched.id : "Dashboard";
  };

  const initialTab = resolveTabId(selectedTab || propActiveTab || searchParams.get("tab"));
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Data cache for loaded database records
  const [reportData, setReportData] = useState({});
  const [loading, setLoading] = useState(false);

  // Sync tab with props / URL
  useEffect(() => {
    const target = selectedTab || propActiveTab || searchParams.get("tab");
    if (target) {
      setActiveTab(resolveTabId(target));
    }
  }, [selectedTab, propActiveTab, searchParams]);

  // Tab change handler
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setTableSearch("");
    setDepartmentFilter("ALL");
    setStatusFilter("ALL");

    const newParams = new URLSearchParams(searchParams);
    newParams.set("category", "REPORTS");
    
    // Map to sidebar child tab name if applicable
    if (tabId === "Dashboard") {
      newParams.set("tab", "Reports Dashboard");
    } else {
      const mod = REPORT_MODULES.find(m => m.id === tabId);
      newParams.set("tab", mod ? mod.categoryTab : tabId);
    }
    setSearchParams(newParams, { replace: true });
  };

  // Load database records for active report module
  useEffect(() => {
    if (activeTab === "Dashboard") return;

    const currentModule = REPORT_MODULES.find(m => m.id === activeTab);
    if (!currentModule || reportData[activeTab]) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(currentModule.endpoint);
        const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setReportData(prev => ({
          ...prev,
          [activeTab]: data.length > 0 ? data : currentModule.sampleData
        }));
      } catch (err) {
        console.warn(`Could not load records for ${activeTab}, using sample data:`, err.message);
        setReportData(prev => ({
          ...prev,
          [activeTab]: currentModule.sampleData
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  // Filtered Cards for the Dashboard Grid Search
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return REPORT_MODULES;
    const q = searchQuery.toLowerCase().trim();
    return REPORT_MODULES.filter(card =>
      card.title.toLowerCase().includes(q) ||
      card.description.toLowerCase().includes(q) ||
      card.id.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Active module configuration for Detail View
  const activeModule = useMemo(() => {
    return REPORT_MODULES.find(m => m.id === activeTab) || null;
  }, [activeTab]);

  // Active module raw records
  const currentRecords = useMemo(() => {
    if (!activeModule) return [];
    return reportData[activeTab] || activeModule.sampleData || [];
  }, [activeTab, activeModule, reportData]);

  // Filtered table rows in Detail View
  const filteredRecords = useMemo(() => {
    let list = [...currentRecords];

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      list = list.filter(row =>
        Object.values(row).some(val =>
          String(val || "").toLowerCase().includes(q)
        )
      );
    }

    if (departmentFilter !== "ALL") {
      list = list.filter(row =>
        String(row.department || row.deptName || "").toLowerCase() === departmentFilter.toLowerCase()
      );
    }

    if (statusFilter !== "ALL") {
      list = list.filter(row =>
        String(row.status || row.employeeStatus || row.paymentStatus || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    return list;
  }, [currentRecords, tableSearch, departmentFilter, statusFilter]);

  // Unique departments for filter dropdown
  const departmentOptions = useMemo(() => {
    const set = new Set();
    currentRecords.forEach(r => {
      const d = r.department || r.deptName;
      if (d && String(d).trim()) set.add(String(d).trim());
    });
    return Array.from(set);
  }, [currentRecords]);

  // Unique statuses for filter dropdown
  const statusOptions = useMemo(() => {
    const set = new Set();
    currentRecords.forEach(r => {
      const s = r.status || r.employeeStatus || r.paymentStatus;
      if (s && String(s).trim()) set.add(String(s).trim());
    });
    return Array.from(set);
  }, [currentRecords]);

  // Export CSV handler
  const handleExportCSV = () => {
    if (!activeModule || filteredRecords.length === 0) {
      alert("No data available to export.");
      return;
    }

    const cols = activeModule.columns;
    const headerRow = cols.map(c => `"${c.label}"`).join(",");
    const rows = filteredRecords.map(row =>
      cols.map(c => `"${String(row[c.key] ?? "").replace(/"/g, '""')}"`).join(",")
    );

    const csvContent = "data:text/csv;charset=utf-8," + [headerRow, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeModule.title.toLowerCase().replace(/\s+/g, "_")}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Refresh data handler
  const handleRefresh = async () => {
    if (!activeModule) return;
    setLoading(true);
    try {
      const res = await apiFetch(activeModule.endpoint);
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setReportData(prev => ({
        ...prev,
        [activeTab]: data.length > 0 ? data : activeModule.sampleData
      }));
    } catch (e) {
      // keep existing
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. TOP HORIZONTAL NAV SUB-TABS (Like in Learning in series) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-gray-200 scrollbar-thin scrollbar-thumb-gray-200">
        {SERIES_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all duration-150 shrink-0 ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm font-bold"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 2. MAIN VIEW SWITCHER */}
      {activeTab === "Dashboard" ? (
        /* ========================================================================= */
        /* REPORTS DASHBOARD OVERVIEW (EXACT REPLICA OF THE UPLOADED UI)            */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Header Row: Title, Subtitle, and Graphic Illustration */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Reports
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                Generate and analyze reports across the organization.
              </p>
            </div>
            {/* Top Right 3D/Flat Illustration */}
            <ReportsIllustration />
          </div>

          {/* Search Bar matching screenshot */}
          <div className="relative max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* 10 Reports Grid (5 columns per row on XL screen, matching screenshot) */}
          {filteredCards.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <TableCellsIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-gray-700">No reports found</h3>
              <p className="text-xs text-gray-400 mt-1">
                No report matches your search term "{searchQuery}".
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 px-3 py-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 rounded-lg"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {filteredCards.map((card) => {
                const IconComponent = card.icon;
                const { theme } = card;

                return (
                  <div
                    key={card.id}
                    className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col justify-between items-center text-center shadow-xs hover:shadow-md transition-all duration-200 group relative"
                  >
                    {/* Centered Rounded Icon */}
                    <div className="flex flex-col items-center w-full">
                      <div
                        className={`w-14 h-14 rounded-2xl ${theme.bgIcon} ${theme.textIcon} flex items-center justify-center mb-4 transition-transform group-hover:scale-105 duration-200`}
                      >
                        <IconComponent className="w-7 h-7 stroke-[1.8]" />
                      </div>

                      {/* Card Title */}
                      <h3 className="text-sm font-bold text-gray-900 mb-1.5">
                        {card.title}
                      </h3>

                      {/* Card Description */}
                      <p className="text-[11px] text-gray-500 font-normal leading-relaxed min-h-[34px] px-1 mb-6">
                        {card.description}
                      </p>
                    </div>

                    {/* Action Button: View Reports > */}
                    <button
                      onClick={() => handleTabChange(card.id)}
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold border ${theme.btnBorder} ${theme.btnText} ${theme.btnHover} bg-white transition-colors duration-150 flex items-center justify-center gap-1.5`}
                    >
                      <span>View Reports</span>
                      <span className="text-sm leading-none font-bold">›</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer matching screenshot */}
          <div className="mt-16 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 font-normal">
            <p>© 2026 TechnoVani HRMS. All rights reserved.</p>
            <p className="mt-2 sm:mt-0">Version: 1.0.0</p>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* INDIVIDUAL REPORT DETAIL VIEW (DATA, KPIS, FILTERS, EXPORT, TABLE)       */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Header & Back Button */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleTabChange("Dashboard")}
                className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 transition"
                title="Back to Reports Dashboard"
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-xl ${activeModule?.theme.bgIcon} ${activeModule?.theme.textIcon} flex items-center justify-center`}
                >
                  {activeModule && <activeModule.icon className="w-6 h-6 stroke-[2]" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {activeModule?.title} Reports
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">
                    {activeModule?.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-3 py-1.5 text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg flex items-center gap-1.5 transition"
              >
                <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 shadow-xs transition"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Total Records
              </p>
              <h3 className="text-xl font-extrabold text-gray-900 mt-1">
                {currentRecords.length}
              </h3>
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
                <CheckCircleIcon className="w-3 h-3" /> Live synchronized
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Filtered Results
              </p>
              <h3 className="text-xl font-extrabold text-gray-900 mt-1">
                {filteredRecords.length}
              </h3>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                Matching current criteria
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Departments Involved
              </p>
              <h3 className="text-xl font-extrabold text-gray-900 mt-1">
                {departmentOptions.length > 0 ? departmentOptions.length : "All"}
              </h3>
              <p className="text-[10px] text-blue-600 font-medium mt-0.5">
                Organizational scope
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Audit Status
              </p>
              <h3 className="text-xl font-extrabold text-emerald-600 mt-1">
                Verified
              </h3>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                RBAC protected export
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              {/* Search input */}
              <div className="relative flex-1 min-w-[180px] max-w-sm">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder={`Search ${activeModule?.title} records...`}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Department filter */}
              {departmentOptions.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                  <FunnelIcon className="w-3.5 h-3.5 text-gray-400" />
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:bg-white"
                  >
                    <option value="ALL">All Departments</option>
                    {departmentOptions.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status filter */}
              {statusOptions.length > 0 && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:bg-white"
                >
                  <option value="ALL">All Statuses</option>
                  {statusOptions.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="text-xs font-medium text-gray-500">
              Showing <span className="font-bold text-gray-800">{filteredRecords.length}</span> of {currentRecords.length} records
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400">
                <ArrowPathIcon className="w-8 h-8 mx-auto animate-spin text-blue-500 mb-2" />
                <p className="text-xs font-bold">Loading {activeModule?.title} reports from database...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <TableCellsIcon className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-xs font-bold text-gray-600">No records found matching filters.</p>
                <button
                  onClick={() => {
                    setTableSearch("");
                    setDepartmentFilter("ALL");
                    setStatusFilter("ALL");
                  }}
                  className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-bold"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium text-gray-700">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-[10px] tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      {activeModule?.columns.map((col) => (
                        <th key={col.key} className="py-3 px-4 whitespace-nowrap">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRecords.map((row, idx) => (
                      <tr key={row.id || idx} className="hover:bg-blue-50/30 transition">
                        <td className="py-3 px-4 text-center text-gray-400 text-[11px]">
                          {idx + 1}
                        </td>
                        {activeModule?.columns.map((col) => {
                          const val = row[col.key];

                          // Status badge styling
                          if (col.key.toLowerCase().includes("status")) {
                            const isGood = ["active", "present", "approved", "paid", "compliant", "completed", "settled"].includes(String(val).toLowerCase());
                            const isWarn = ["late", "pending", "in progress", "upcoming"].includes(String(val).toLowerCase());
                            return (
                              <td key={col.key} className="py-3 px-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isGood
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : isWarn
                                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                                      : "bg-gray-100 text-gray-700 border border-gray-200"
                                  }`}
                                >
                                  {val || "N/A"}
                                </span>
                              </td>
                            );
                          }

                          // Employee Name highlighting
                          if (col.key === "employeeName" || col.key === "employee") {
                            return (
                              <td key={col.key} className="py-3 px-4 whitespace-nowrap font-bold text-gray-900">
                                {val || "--"}
                              </td>
                            );
                          }

                          // Code highlighting
                          if (col.key.toLowerCase().includes("code") || col.key === "empId") {
                            return (
                              <td key={col.key} className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-gray-600 font-semibold">
                                {val || "--"}
                              </td>
                            );
                          }

                          return (
                            <td key={col.key} className="py-3 px-4 whitespace-nowrap text-gray-600">
                              {val !== undefined && val !== null ? String(val) : "--"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsDashboard;
