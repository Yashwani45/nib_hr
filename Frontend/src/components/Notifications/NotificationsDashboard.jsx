// Frontend/src/components/Notifications/NotificationsDashboard.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BellIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  BellAlertIcon,
  CheckBadgeIcon,
  CakeIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  EyeIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  SparklesIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";
import { NOTIFICATION_CARDS } from "./notificationsData";

const NOTIFICATION_TABS = [
  { id: "Dashboard", label: "Dashboard", icon: BellIcon },
  { id: "Email", label: "Email", icon: EnvelopeIcon },
  { id: "SMS", label: "SMS", icon: DevicePhoneMobileIcon },
  { id: "Push", label: "Push", icon: BellAlertIcon },
  { id: "Approval Alerts", label: "Approval Alerts", icon: CheckBadgeIcon },
  { id: "Birthday Alerts", label: "Birthday Alerts", icon: CakeIcon },
  { id: "Policy Updates", label: "Policy Updates", icon: DocumentTextIcon }
];

const NotificationsDashboard = ({ selectedTab, activeTab: propActiveTab }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Resolve incoming tab prop or URL search param
  const resolveTabId = (tabName) => {
    if (!tabName) return "Dashboard";
    const cleaned = String(tabName).trim().toLowerCase();
    if (cleaned.includes("dashboard") || cleaned === "notifications" || cleaned === "overview") return "Dashboard";
    if (cleaned.includes("email")) return "Email";
    if (cleaned.includes("sms")) return "SMS";
    if (cleaned.includes("push")) return "Push";
    if (cleaned.includes("approval")) return "Approval Alerts";
    if (cleaned.includes("birthday")) return "Birthday Alerts";
    if (cleaned.includes("policy")) return "Policy Updates";
    return "Dashboard";
  };

  const initialTab = resolveTabId(selectedTab || propActiveTab || searchParams.get("tab"));
  const [activeTab, setActiveTab] = useState(initialTab);

  // Card statuses state (Enabled/Disabled toggle)
  const [channelStatus, setChannelStatus] = useState({
    Email: true,
    SMS: true,
    Push: true,
    "Approval Alerts": true,
    "Birthday Alerts": true,
    "Policy Updates": true
  });

  // Modal / Drawer States
  const [activeModal, setActiveModal] = useState(null); // { type: 'configure'|'manage'|'viewPolicy'|'sendReminder', card: obj }
  const [toastMessage, setToastMessage] = useState("");
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  // Sync tab with URL / prop changes
  useEffect(() => {
    const target = selectedTab || propActiveTab || searchParams.get("tab");
    if (target) {
      setActiveTab(resolveTabId(target));
    }
  }, [selectedTab, propActiveTab, searchParams]);

  // Handle Tab Switch in Series
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("category", "NOTIFICATIONS");

    if (tabId === "Dashboard") {
      newParams.set("tab", "Notifications Dashboard");
    } else if (tabId === "Email") {
      newParams.set("tab", "Email Notifications");
    } else if (tabId === "SMS") {
      newParams.set("tab", "SMS Notifications");
    } else if (tabId === "Push") {
      newParams.set("tab", "Push Notifications");
    } else {
      newParams.set("tab", tabId);
    }
    setSearchParams(newParams, { replace: true });
  };

  // Trigger brief floating toast feedback
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  };

  // Toggle status for a channel
  const toggleChannel = (channelId) => {
    setChannelStatus((prev) => {
      const nextVal = !prev[channelId];
      triggerToast(`${channelId} notifications ${nextVal ? "enabled" : "disabled"} successfully.`);
      return { ...prev, [channelId]: nextVal };
    });
  };

  // Find active card for sub-tab views
  const currentCard = useMemo(() => {
    if (activeTab === "Dashboard") return null;
    return NOTIFICATION_CARDS.find((c) => c.id === activeTab) || null;
  }, [activeTab]);

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

      {/* 1. TOP HORIZONTAL NAV SUB-TABS (IN SERIES LIKE REPORTS) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200 scrollbar-thin scrollbar-thumb-gray-200">
        {NOTIFICATION_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all duration-150 flex items-center gap-2 shrink-0 ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm font-bold"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:text-gray-900"
              }`}
            >
              <TabIcon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. MAIN VIEW SWITCHER */}
      {activeTab === "Dashboard" ? (
        /* ========================================================================= */
        /* NOTIFICATIONS DASHBOARD OVERVIEW (3-COLUMN CARDS GRID)                    */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Header Section */}
          <div className="pt-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Notifications
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              Manage system notifications, employee alerts, approvals, and organizational updates.
            </p>
          </div>

          {/* 6 Notification Cards in 3-Column Layout on Desktop, 2 on Tablet, 1 on Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* ------------------------------------------------------------- */}
            {/* CARD 1: EMAIL                                                 */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-200 space-y-4">
              <div className="space-y-4">
                {/* Header: Icon, Title & Status Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <EnvelopeIcon className="w-6 h-6 stroke-[1.8]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Email</h3>
                      <p className="text-[11px] text-gray-400 font-medium">Channel: SMTP / API</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {channelStatus.Email ? "Enabled" : "Disabled"}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-500 leading-relaxed font-normal">
                  Manage email notifications for HR processes and employee communication.
                </p>

                {/* Metric / Counter Pill */}
                <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                  <span className="text-xs font-semibold text-gray-700">Active Templates</span>
                  <span className="text-sm font-extrabold text-blue-600 bg-white px-2.5 py-0.5 rounded-lg border border-blue-200">
                    12
                  </span>
                </div>

                {/* Examples */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Examples
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Leave Approval",
                      "Payroll Processed",
                      "Interview Scheduled",
                      "Performance Reminder"
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 text-xs text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100 font-medium"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleTabChange("Email")}
                className="w-full py-2 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs flex items-center justify-center gap-2 mt-4"
              >
                <Cog6ToothIcon className="w-4 h-4" />
                <span>Configure</span>
              </button>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* CARD 2: SMS                                                   */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-200 space-y-4">
              <div className="space-y-4">
                {/* Header: Icon, Title & Status Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <DevicePhoneMobileIcon className="w-6 h-6 stroke-[1.8]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">SMS</h3>
                      <p className="text-[11px] text-gray-400 font-medium">Gateway: SMS Service</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {channelStatus.SMS ? "Enabled" : "Disabled"}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-500 leading-relaxed font-normal">
                  Send important HR and employee alerts through SMS.
                </p>

                {/* Metric / Counter Pill */}
                <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <span className="text-xs font-semibold text-gray-700">Active Templates</span>
                  <span className="text-sm font-extrabold text-emerald-600 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200">
                    7
                  </span>
                </div>

                {/* Examples */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Examples
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "OTP Verification",
                      "Leave Approval",
                      "Attendance Alert",
                      "Payroll Alert"
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 text-xs text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100 font-medium"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleTabChange("SMS")}
                className="w-full py-2 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs flex items-center justify-center gap-2 mt-4"
              >
                <Cog6ToothIcon className="w-4 h-4" />
                <span>Configure</span>
              </button>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* CARD 3: PUSH                                                  */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-200 space-y-4">
              <div className="space-y-4">
                {/* Header: Icon, Title & Status Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <BellAlertIcon className="w-6 h-6 stroke-[1.8]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Push</h3>
                      <p className="text-[11px] text-gray-400 font-medium">Device: Web & Mobile App</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {channelStatus.Push ? "Enabled" : "Disabled"}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-500 leading-relaxed font-normal">
                  Deliver real-time notifications to HR, managers, and employees.
                </p>

                {/* Metric / Counter Pill */}
                <div className="flex items-center justify-between p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                  <span className="text-xs font-semibold text-gray-700">Supported Devices</span>
                  <span className="text-xs font-extrabold text-purple-600 bg-white px-2.5 py-1 rounded-lg border border-purple-200">
                    Mobile & Web Push
                  </span>
                </div>

                {/* Examples */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Examples
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Attendance Reminder",
                      "Approval Request",
                      "Performance Review",
                      "Training Reminder"
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 text-xs text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100 font-medium"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></span>
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleTabChange("Push")}
                className="w-full py-2 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs flex items-center justify-center gap-2 mt-4"
              >
                <Cog6ToothIcon className="w-4 h-4" />
                <span>Configure</span>
              </button>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* CARD 4: APPROVAL ALERTS                                       */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-200 space-y-4">
              <div className="space-y-4">
                {/* Header: Icon, Title & Status Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <CheckBadgeIcon className="w-6 h-6 stroke-[1.8]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Approval Alerts</h3>
                      <p className="text-[11px] text-gray-400 font-medium">Automated Workflow</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {channelStatus["Approval Alerts"] ? "Enabled" : "Disabled"}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-500 leading-relaxed font-normal">
                  Notify managers and HR users about pending and completed approvals.
                </p>

                {/* Breakdown List */}
                <div className="space-y-2 bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-xs">
                  <div className="flex justify-between items-center py-0.5 border-b border-gray-200/60 pb-1">
                    <span className="text-gray-600 font-medium">Leave Requests</span>
                    <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      12
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-gray-200/60 pb-1">
                    <span className="text-gray-600 font-medium">Expense Claims</span>
                    <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      8
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-gray-200/60 pb-1">
                    <span className="text-gray-600 font-medium">Travel Requests</span>
                    <span className="font-extrabold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                      4
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-gray-200/60 pb-1">
                    <span className="text-gray-600 font-medium">Attendance Regularization</span>
                    <span className="font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                      6
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-gray-600 font-medium">Payroll Approvals</span>
                    <span className="font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                      2
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleTabChange("Approval Alerts")}
                className="w-full py-2 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs flex items-center justify-center gap-2 mt-4"
              >
                <CheckBadgeIcon className="w-4 h-4" />
                <span>Manage Alerts</span>
              </button>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* CARD 5: BIRTHDAY ALERTS                                       */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-200 space-y-4">
              <div className="space-y-4">
                {/* Header: Icon, Title & Status Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <CakeIcon className="w-6 h-6 stroke-[1.8]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Birthday Alerts</h3>
                      <p className="text-[11px] text-gray-400 font-medium">Employee Engagement</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {channelStatus["Birthday Alerts"] ? "Enabled" : "Disabled"}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-500 leading-relaxed font-normal">
                  Manage employee birthday reminders and greeting notifications.
                </p>

                {/* Today's Birthdays */}
                <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                      <SparklesIcon className="w-3.5 h-3.5 text-rose-500" />
                      Today's Birthdays
                    </span>
                    <span className="text-[10px] font-extrabold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                      2 Employees
                    </span>
                  </div>
                  <div className="space-y-1.5 pt-0.5 text-xs">
                    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-rose-100/60 shadow-2xs">
                      <span className="font-bold text-gray-800">Sarah Williams</span>
                      <span className="text-[10px] text-gray-500">HR Executive</span>
                    </div>
                    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-rose-100/60 shadow-2xs">
                      <span className="font-bold text-gray-800">Rahul Sharma</span>
                      <span className="text-[10px] text-gray-500">Software Engineer</span>
                    </div>
                  </div>
                </div>

                {/* Upcoming Birthdays */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Upcoming
                  </span>
                  <div className="space-y-1 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center py-0.5">
                      <span className="font-medium text-gray-800">Anita Patel</span>
                      <span className="text-[10px] font-bold text-rose-600">08 Sep</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="font-medium text-gray-800">Vikram Singh</span>
                      <span className="text-[10px] font-bold text-rose-600">10 Sep</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="font-medium text-gray-800">Neha Gupta</span>
                      <span className="text-[10px] font-bold text-rose-600">12 Sep</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleTabChange("Birthday Alerts")}
                className="w-full py-2 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs flex items-center justify-center gap-2 mt-4"
              >
                <Cog6ToothIcon className="w-4 h-4" />
                <span>Configure</span>
              </button>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* CARD 6: POLICY UPDATES                                        */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-200 space-y-4">
              <div className="space-y-4">
                {/* Header: Icon, Title & Status Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                      <DocumentTextIcon className="w-6 h-6 stroke-[1.8]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Policy Updates</h3>
                      <p className="text-[11px] text-gray-400 font-medium">Compliance & Org Rules</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {channelStatus["Policy Updates"] ? "Enabled" : "Disabled"}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-500 leading-relaxed font-normal">
                  Notify employees about HR policy and compliance updates.
                </p>

                {/* Policies List */}
                <div className="space-y-3">
                  {/* Leave Policy */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-gray-900">Leave Policy</h4>
                      <span className="text-[10px] text-gray-400 font-medium">
                        Updated: 02 Sep 2026
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-gray-600">
                        <span>Acknowledged</span>
                        <span className="font-bold text-gray-800">87 / 120 employees</span>
                      </div>
                      {/* Visual progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${(87 / 120) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Remote Work Policy */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-gray-900">Remote Work Policy</h4>
                      <span className="text-[10px] text-gray-400 font-medium">
                        Updated: 28 Aug 2026
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-gray-600">
                        <span>Acknowledged</span>
                        <span className="font-bold text-gray-800">112 / 120 employees</span>
                      </div>
                      {/* Visual progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${(112 / 120) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons: View Policy & Send Reminder */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    setSelectedPolicy({
                      title: "Leave Policy",
                      version: "v3.2",
                      updated: "02 Sep 2026",
                      acknowledged: "87 / 120 employees"
                    });
                    setActiveModal("viewPolicy");
                  }}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition shadow-2xs flex items-center justify-center gap-1.5"
                >
                  <EyeIcon className="w-3.5 h-3.5 text-gray-500" />
                  <span>View Policy</span>
                </button>

                <button
                  onClick={() => {
                    triggerToast("Reminder notifications dispatched to 33 pending employees.");
                  }}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs flex items-center justify-center gap-1.5"
                >
                  <PaperAirplaneIcon className="w-3.5 h-3.5" />
                  <span>Send Reminder</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* SUB-TAB DETAILED VIEW (EMAIL, SMS, PUSH, APPROVAL, BIRTHDAY, POLICY)      */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleTabChange("Dashboard")}
                className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 transition"
                title="Back to Notifications Dashboard"
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-xl ${currentCard?.theme.bgIcon || "bg-blue-50"} ${currentCard?.theme.textIcon || "text-blue-600"} flex items-center justify-center`}
                >
                  {currentCard && <currentCard.icon className="w-6 h-6 stroke-[1.8]" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">
                      {activeTab} Management
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {channelStatus[activeTab] !== false ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">
                    {currentCard?.description || "Configure notifications and alert distribution rules."}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                onClick={() => toggleChannel(activeTab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                  channelStatus[activeTab] !== false
                    ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                    : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                {channelStatus[activeTab] !== false ? "Disable Channel" : "Enable Channel"}
              </button>

              <button
                onClick={() => triggerToast(`Test ${activeTab} notification dispatched successfully.`)}
                className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 shadow-xs transition"
              >
                <PaperAirplaneIcon className="w-3.5 h-3.5" />
                <span>Send Test Alert</span>
              </button>
            </div>
          </div>

          {/* Tab Specific Content */}
          {activeTab === "Email" && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-xs">
              <div className="flex justify-between items-center border-b pb-3 border-gray-100">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Active Email Notification Templates</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Automated emails triggered on HRMS transactional events</p>
                </div>
                <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                  12 Templates
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentCard?.templates?.map((tpl) => (
                  <div key={tpl.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200/70 space-y-2 hover:border-blue-200 transition">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-xs text-gray-800">{tpl.name}</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {tpl.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 space-y-0.5">
                      <p><span className="font-semibold text-gray-700">Trigger:</span> {tpl.trigger}</p>
                      <p><span className="font-semibold text-gray-700">Recipient:</span> {tpl.recipient}</p>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => triggerToast(`Opened template editor for "${tpl.name}".`)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
                      >
                        Edit Template →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "SMS" && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-xs">
              <div className="flex justify-between items-center border-b pb-3 border-gray-100">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">SMS Gateway Alert Rules</h3>
                  <p className="text-xs text-gray-400 mt-0.5">High-priority transactional SMS alerts sent directly to employee phones</p>
                </div>
                <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                  7 Active Templates
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentCard?.templates?.map((tpl) => (
                  <div key={tpl.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200/70 space-y-2 hover:border-emerald-200 transition">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-xs text-gray-800">{tpl.name}</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {tpl.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 space-y-0.5">
                      <p><span className="font-semibold text-gray-700">Trigger Event:</span> {tpl.trigger}</p>
                      <p><span className="font-semibold text-gray-700">Target Phone:</span> {tpl.recipient}</p>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => triggerToast(`Previewed SMS template for "${tpl.name}".`)}
                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800"
                      >
                        Configure SMS Text →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Push" && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-xs">
              <div className="flex justify-between items-center border-b pb-3 border-gray-100">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Web & Mobile Push Subscriptions</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Instant push notification triggers delivered across browser tabs and iOS/Android app</p>
                </div>
                <span className="text-xs font-extrabold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                  Multi-Channel
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentCard?.templates?.map((tpl) => (
                  <div key={tpl.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200/70 space-y-2 hover:border-purple-200 transition">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-xs text-gray-800">{tpl.name}</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {tpl.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 space-y-0.5">
                      <p><span className="font-semibold text-gray-700">Trigger:</span> {tpl.trigger}</p>
                      <p><span className="font-semibold text-gray-700">Platform:</span> {tpl.recipient}</p>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => triggerToast(`Triggered test push notification for "${tpl.name}".`)}
                        className="text-[11px] font-bold text-purple-600 hover:text-purple-800"
                      >
                        Test Push Payload →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Approval Alerts" && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-xs">
              <div className="flex justify-between items-center border-b pb-3 border-gray-100">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Pending Workflow Approval Queue</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Automated manager alerts and escalation timers</p>
                </div>
                <button
                  onClick={() => triggerToast("All manager reminder nudges dispatched.")}
                  className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition"
                >
                  Send Bulk Reminders
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: "Leave Requests", count: 12, desc: "Pending manager sign-off", color: "border-blue-200 text-blue-600" },
                  { label: "Expense Claims", count: 8, desc: "Awaiting accounts validation", color: "border-emerald-200 text-emerald-600" },
                  { label: "Travel Requests", count: 4, desc: "Bookings pending approval", color: "border-purple-200 text-purple-600" },
                  { label: "Attendance Regularization", count: 6, desc: "Missed punches awaiting verification", color: "border-amber-200 text-amber-600" },
                  { label: "Payroll Approvals", count: 2, desc: "Final HR sign-off needed", color: "border-rose-200 text-rose-600" }
                ].map((item, idx) => (
                  <div key={idx} className={`p-4 bg-gray-50 rounded-xl border ${item.color} space-y-2`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-gray-800">{item.label}</span>
                      <span className="text-lg font-extrabold">{item.count}</span>
                    </div>
                    <p className="text-[11px] text-gray-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Birthday Alerts" && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-xs">
              <div className="flex justify-between items-center border-b pb-3 border-gray-100">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Birthday Notification Calendar</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Automated greeting emails and Slack/Teams announcements</p>
                </div>
                <button
                  onClick={() => triggerToast("Broadcasted today's birthday wishes to the organization.")}
                  className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition"
                >
                  Send Birthday Wishes
                </button>
              </div>

              {/* Today's Birthdays List */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                  <SparklesIcon className="w-4 h-4 text-rose-500" />
                  Today's Celebrations (2 Employees)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-900">Sarah Williams</h4>
                      <p className="text-xs text-gray-500">HR Executive • Human Resources</p>
                    </div>
                    <span className="text-2xl">🎂</span>
                  </div>
                  <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-900">Rahul Sharma</h4>
                      <p className="text-xs text-gray-500">Software Engineer • Engineering</p>
                    </div>
                    <span className="text-2xl">🎉</span>
                  </div>
                </div>
              </div>

              {/* Upcoming Birthdays */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Upcoming Birthdays This Month
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-xs text-gray-800">Anita Patel</p>
                      <p className="text-[10px] text-gray-400">Marketing</p>
                    </div>
                    <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">08 Sep</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-xs text-gray-800">Vikram Singh</p>
                      <p className="text-[10px] text-gray-400">Operations</p>
                    </div>
                    <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">10 Sep</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-xs text-gray-800">Neha Gupta</p>
                      <p className="text-[10px] text-gray-400">Finance</p>
                    </div>
                    <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">12 Sep</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Policy Updates" && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-xs">
              <div className="flex justify-between items-center border-b pb-3 border-gray-100">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">HR Compliance & Policy Acknowledgements</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Track employee acknowledgement and compliance notifications</p>
                </div>
                <button
                  onClick={() => triggerToast("Broadcasted policy update notification to all 120 employees.")}
                  className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Publish New Policy
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Leave Policy Card */}
                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Leave Policy (v3.2)</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">Updated: 02 Sep 2026</p>
                    </div>
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                      Active
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Acknowledgement Progress</span>
                      <span className="font-extrabold text-gray-900">87 / 120 employees (72%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: "72.5%" }}></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => {
                        setSelectedPolicy({
                          title: "Leave Policy",
                          version: "v3.2",
                          updated: "02 Sep 2026",
                          acknowledged: "87 / 120 employees"
                        });
                        setActiveModal("viewPolicy");
                      }}
                      className="flex-1 py-1.5 px-3 text-xs font-bold bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      View Policy
                    </button>
                    <button
                      onClick={() => triggerToast("Reminder sent to 33 pending employees for Leave Policy.")}
                      className="flex-1 py-1.5 px-3 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Send Reminder
                    </button>
                  </div>
                </div>

                {/* Remote Work Policy Card */}
                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Remote Work Policy (v2.0)</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">Updated: 28 Aug 2026</p>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                      Active
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Acknowledgement Progress</span>
                      <span className="font-extrabold text-gray-900">112 / 120 employees (93%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-600 h-2 rounded-full" style={{ width: "93.3%" }}></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => {
                        setSelectedPolicy({
                          title: "Remote Work Policy",
                          version: "v2.0",
                          updated: "28 Aug 2026",
                          acknowledged: "112 / 120 employees"
                        });
                        setActiveModal("viewPolicy");
                      }}
                      className="flex-1 py-1.5 px-3 text-xs font-bold bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      View Policy
                    </button>
                    <button
                      onClick={() => triggerToast("Reminder sent to 8 pending employees for Remote Work Policy.")}
                      className="flex-1 py-1.5 px-3 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Send Reminder
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Policy Modal */}
      {activeModal === "viewPolicy" && selectedPolicy && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-gray-200 animate-scaleUp">
            <div className="flex justify-between items-start border-b pb-3 border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">{selectedPolicy.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Version: {selectedPolicy.version} • Updated: {selectedPolicy.updated}</p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600 leading-relaxed max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin">
              <p className="font-bold text-gray-800">1. Purpose & Scope</p>
              <p>This organizational policy sets standard operating guidelines across all operating units and branches of Enterprise HRMS.</p>

              <p className="font-bold text-gray-800 pt-2">2. Compliance & Acknowledgement</p>
              <p>All active employees are required to review the policy details and record their digital acknowledgment via their employee self-service dashboard.</p>

              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex justify-between items-center font-semibold text-blue-900">
                <span>Current Status:</span>
                <span className="font-extrabold">{selectedPolicy.acknowledged}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setActiveModal(null);
                  triggerToast(`Compliance report for ${selectedPolicy.title} downloaded.`);
                }}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDashboard;
