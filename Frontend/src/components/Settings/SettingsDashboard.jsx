// Frontend/src/components/Settings/SettingsDashboard.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ChevronRightIcon,
  XMarkIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  BuildingOffice2Icon
} from "@heroicons/react/24/outline";
import { SETTINGS_MODULES, AUDIT_LOGS_METRICS } from "./settingsData";

// Graphic illustration for top right matching the reference screenshot
const SettingsIllustration = () => (
  <div className="hidden sm:block relative w-48 h-24 shrink-0 select-none pointer-events-none">
    <svg viewBox="0 0 200 100" className="w-full h-full drop-shadow-sm" fill="none">
      {/* Background Soft Glows */}
      <circle cx="150" cy="50" r="42" fill="#EEF2FF" />
      <circle cx="85" cy="45" r="35" fill="#F0F9FF" />

      {/* Sheet 1: Settings Checklist / Modal behind */}
      <g transform="translate(100, 10)">
        <rect x="0" y="0" width="70" height="78" rx="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
        {/* Header line */}
        <rect x="12" y="14" width="34" height="4" rx="2" fill="#93C5FD" />
        {/* Bullet rows */}
        <circle cx="15" cy="28" r="2.5" fill="#60A5FA" />
        <rect x="22" y="26" width="36" height="3.5" rx="1.75" fill="#CBD5E1" />
        <circle cx="15" cy="40" r="2.5" fill="#60A5FA" />
        <rect x="22" y="38" width="28" height="3.5" rx="1.75" fill="#CBD5E1" />
        <circle cx="15" cy="52" r="2.5" fill="#60A5FA" />
        <rect x="22" y="50" width="32" height="3.5" rx="1.75" fill="#CBD5E1" />
        <circle cx="15" cy="64" r="2.5" fill="#60A5FA" />
        <rect x="22" y="62" width="22" height="3.5" rx="1.75" fill="#CBD5E1" />
      </g>

      {/* Large Floating Gear Icon on Left */}
      <g transform="translate(35, 12)">
        {/* Outer Gear Ring */}
        <path
          d="M34 16.5 C34 14.5 35.5 13 37.5 13 L42.5 13 C44.5 13 46 14.5 46 16.5 L46.5 19 C48 19.8 49.5 20.8 50.8 22 L53.2 21 C55 20.2 57.2 21 58.2 22.8 L60.8 27.2 C61.8 29 61.2 31.2 59.5 32.2 L57.5 33.5 C57.8 35.2 57.8 36.8 57.5 38.5 L59.5 39.8 C61.2 40.8 61.8 43 60.8 44.8 L58.2 49.2 C57.2 51 55 51.8 53.2 51 L50.8 50 C49.5 51.2 48 52.2 46.5 53 L46 55.5 C46 57.5 44.5 59 42.5 59 L37.5 59 C35.5 59 34 57.5 34 55.5 L33.5 53 C32 52.2 30.5 51.2 29.2 50 L26.8 51 C25 51.8 22.8 51 21.8 49.2 L19.2 44.8 C18.2 43 18.8 40.8 20.5 39.8 L22.5 38.5 C22.2 36.8 22.2 35.2 22.5 33.5 L20.5 32.2 C18.8 31.2 18.2 29 19.2 27.2 L21.8 22.8 C22.8 21 25 20.2 26.8 21 L29.2 22 C30.5 20.8 32 19.8 33.5 19 L34 16.5 Z"
          fill="#3B82F6"
          opacity="0.85"
        />
        {/* Inner Hub */}
        <circle cx="40" cy="36" r="11" fill="#FFFFFF" />
        <circle cx="40" cy="36" r="7" fill="#60A5FA" />
      </g>

      {/* Floating Security Shield Badge on Right */}
      <g transform="translate(155, 38)">
        <path
          d="M16 2 L30 7 C30 19 23 27 16 30 C9 27 2 19 2 7 L16 2 Z"
          fill="#60A5FA"
          opacity="0.95"
        />
        <path
          d="M16 5 L27 9 C27 18 21 24 16 27 C11 24 5 18 5 9 L16 5 Z"
          fill="#FFFFFF"
        />
        {/* Mini Lock in Shield */}
        <rect x="12" y="14" width="8" height="7" rx="1.5" fill="#2563EB" />
        <path d="M14 14 V11.5 C14 10.4 14.9 9.5 16 9.5 C17.1 9.5 18 10.4 18 11.5 V14" stroke="#2563EB" strokeWidth="1.5" fill="none" />
      </g>
    </svg>
  </div>
);

const SettingsDashboard = ({ selectedTab }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedModuleModal, setSelectedModuleModal] = useState(null);
  const [showAuditLogsModal, setShowAuditLogsModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Sync incoming tab from URL or parent prop
  useEffect(() => {
    const tab = selectedTab || searchParams.get("tab");
    if (tab) {
      if (tab === "Audit Logs") {
        setShowAuditLogsModal(true);
      } else {
        const found = SETTINGS_MODULES.find(
          (m) => m.key.toLowerCase() === tab.toLowerCase() || m.title.toLowerCase() === tab.toLowerCase()
        );
        if (found) {
          // Open detail modal if navigated via direct URL or sidebar child
          setSelectedModuleModal(found);
        }
      }
    }
  }, [selectedTab, searchParams]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  };

  // Filter modules based on search input
  const filteredModules = SETTINGS_MODULES.filter((mod) => {
    if (!searchFilter.trim()) return true;
    const query = searchFilter.toLowerCase();
    const matchesTitle = mod.title.toLowerCase().includes(query);
    const matchesDesc = mod.description.toLowerCase().includes(query);
    const matchesItems = mod.items.some((item) => item.name.toLowerCase().includes(query));
    return matchesTitle || matchesDesc || matchesItems;
  });

  const handleCardClick = (moduleObj) => {
    setSelectedModuleModal(moduleObj);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("category", "SETTINGS");
    newParams.set("tab", moduleObj.key);
    setSearchParams(newParams, { replace: true });
  };

  const handleAuditLogsClick = () => {
    setShowAuditLogsModal(true);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("category", "SETTINGS");
    newParams.set("tab", "Audit Logs");
    setSearchParams(newParams, { replace: true });
  };

  const handleCloseModal = () => {
    setSelectedModuleModal(null);
    setShowAuditLogsModal(false);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("category", "SETTINGS");
    newParams.set("tab", "Company Settings");
    setSearchParams(newParams, { replace: true });
  };

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-24 right-8 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-slideDown text-xs font-semibold">
          <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage("")}
            className="text-slate-400 hover:text-white ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Header Section with Title, Subtitle, and Graphic Illustration */}
      <div className="flex items-start justify-between border-b border-gray-100 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium max-w-2xl">
            Configure and manage system settings to fit your organization's policies and workflows.
          </p>
        </div>

        {/* Decorative Top Right Illustration */}
        <SettingsIllustration />
      </div>

      {/* 2. 9 Configuration Cards (3-Column Desktop, 2-Column Tablet, 1-Column Mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((mod) => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.id}
              onClick={() => handleCardClick(mod)}
              className="group bg-white rounded-2xl border border-gray-200/80 p-6 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-blue-200/90 transition-all duration-200 cursor-pointer relative"
            >
              <div className="space-y-4">
                {/* Header: Large Pastel Icon, Title, and Chevron Arrow */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl ${mod.theme.bgIcon} ${mod.theme.textIcon} border ${mod.theme.borderIcon} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200`}
                    >
                      <Icon className="w-6 h-6 stroke-[1.8]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {mod.title}
                      </h3>
                    </div>
                  </div>

                  <span className="p-1 rounded-lg text-gray-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all">
                    <ChevronRightIcon className="w-4 h-4 stroke-[2.2]" />
                  </span>
                </div>

                {/* Short Description */}
                <p className="text-xs text-gray-500 leading-relaxed font-normal">
                  {mod.description}
                </p>

                {/* 5 Configuration Items with Pastel Icon Bullets */}
                <div className="space-y-1.5 pt-2 border-t border-gray-100/80">
                  {mod.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${mod.theme.itemBgHover}`}
                      >
                        <div className="flex items-center gap-2.5 text-gray-700 font-medium">
                          <ItemIcon className={`w-4 h-4 ${mod.theme.itemIconColor} shrink-0`} />
                          <span>{item.name}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-semibold">
                          {item.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Full-Width Audit Logs Card at Bottom */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Side: Icon, Title & Description */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
            <DocumentTextIcon className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Audit Logs</h3>
            <p className="text-xs text-gray-500 mt-0.5 max-w-xl">
              View system activity logs, user actions and configuration changes for security and compliance.
            </p>
          </div>
        </div>

        {/* Center: 4 Metrics Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 lg:py-0 border-y lg:border-y-0 lg:border-x border-gray-100 lg:px-6">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Total Logs
            </span>
            <span className="text-sm font-extrabold text-gray-900 font-mono">
              {AUDIT_LOGS_METRICS.totalLogs}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Today's Logs
            </span>
            <span className="text-sm font-extrabold text-blue-600 font-mono">
              {AUDIT_LOGS_METRICS.todaysLogs}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Critical Activities
            </span>
            <span className="text-sm font-extrabold text-amber-600 font-mono">
              {AUDIT_LOGS_METRICS.criticalActivities}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Last Updated
            </span>
            <span className="text-xs font-bold text-gray-600">
              {AUDIT_LOGS_METRICS.lastUpdated}
            </span>
          </div>
        </div>

        {/* Right Side: View Audit Logs Button */}
        <button
          onClick={handleAuditLogsClick}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 transition shadow-2xs flex items-center justify-center gap-1.5 shrink-0"
        >
          <span>View Audit Logs</span>
          <ChevronRightIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4. Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-100">
        <span>© 2026 TechnoVani HRMS. All rights reserved.</span>
        <span className="font-mono mt-1 sm:mt-0">Version 1.0.0</span>
      </div>

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE CONFIGURATION DRAWER / MODAL FOR SELECTED CARD              */}
      {/* ========================================================================= */}
      {selectedModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-100 overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl ${selectedModuleModal.theme.bgIcon} ${selectedModuleModal.theme.textIcon} flex items-center justify-center`}
                >
                  <selectedModuleModal.icon className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {selectedModuleModal.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Live parameters and configuration policies
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Details and Items */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-xs space-y-1">
                <span className="font-bold text-blue-900 block">Description:</span>
                <p className="text-blue-800/80 leading-relaxed">
                  {selectedModuleModal.description}
                </p>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Configuration Sections
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedModuleModal.items.map((it) => {
                    const ItIcon = it.icon;
                    return (
                      <div
                        key={it.id}
                        className="p-3 bg-gray-50 hover:bg-gray-100/80 rounded-xl border border-gray-200/70 space-y-1 transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ItIcon className={`w-4 h-4 ${selectedModuleModal.theme.itemIconColor}`} />
                            <span className="text-xs font-bold text-gray-800">{it.name}</span>
                          </div>
                          <span className="text-[10px] font-bold text-blue-600 bg-white px-2 py-0.5 rounded border border-blue-100">
                            {it.count}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-snug">
                          {it.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Parameters Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Current Policy Parameters
                </h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2 text-xs">
                  {Object.entries(selectedModuleModal.details).map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center py-1 border-b border-slate-200/40 last:border-0">
                      <span className="text-slate-600 font-medium capitalize">
                        {k.replace(/([A-Z])/g, " $1")}
                      </span>
                      <span className="font-extrabold text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                        {typeof v === "boolean" ? (v ? "Enabled" : "Disabled") : String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">
                Last updated by HR Admin 2 days ago
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    triggerToast(`Changes saved successfully for ${selectedModuleModal.title}.`);
                    handleCloseModal();
                  }}
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. AUDIT LOGS MODAL                                                        */}
      {/* ========================================================================= */}
      {showAuditLogsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-100 overflow-hidden animate-scaleUp">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <DocumentTextIcon className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    System Audit & Compliance Logs
                  </h3>
                  <p className="text-xs text-gray-500">
                    Showing {AUDIT_LOGS_METRICS.recentLogs.length} most recent security & configuration events
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Table */}
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-gray-700">Total System Logs:</span>
                  <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {AUDIT_LOGS_METRICS.totalLogs}
                  </span>
                </div>
                <button
                  onClick={() => triggerToast("Audit logs exported to audit_trail_2026.csv successfully.")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition"
                >
                  <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Action Event</th>
                      <th className="p-3">Target / Entity</th>
                      <th className="p-3">Change Summary</th>
                      <th className="p-3">Modified By</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {AUDIT_LOGS_METRICS.recentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-3 font-bold text-gray-900 flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              log.severity === "critical"
                                ? "bg-rose-500"
                                : log.severity === "warning"
                                ? "bg-amber-500"
                                : "bg-blue-500"
                            }`}
                          ></span>
                          <span>{log.action}</span>
                        </td>
                        <td className="p-3 text-gray-700 font-medium">{log.target}</td>
                        <td className="p-3 text-gray-500">{log.role}</td>
                        <td className="p-3 text-gray-800 font-semibold">{log.user}</td>
                        <td className="p-3 text-gray-400 font-mono text-[11px]">{log.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsDashboard;
