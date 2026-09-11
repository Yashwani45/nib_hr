// Frontend/src/components/Exit/EmployeeExitDetailDrawer.jsx
import React, { useState } from "react";
import {
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  ShieldCheckIcon,
  ComputerDesktopIcon,
  BanknotesIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  CalendarIcon,
  BriefcaseIcon,
  BuildingOffice2Icon
} from "@heroicons/react/24/outline";
import { getStatusBadgeClass, PIPELINE_STAGES } from "./exitData";

const DRAWER_TABS = [
  "Overview",
  "Resignation",
  "Clearance",
  "Assets",
  "No Dues",
  "F&F",
  "Exit Interview",
  "Documents",
  "History"
];

const EmployeeExitDetailDrawer = ({ isOpen, onClose, employee, onAction }) => {
  const [activeTab, setActiveTab] = useState("Overview");

  if (!isOpen || !employee) return null;

  const stageOrder = [
    { name: "Resignation", completed: true },
    { name: "Approval", completed: employee.stageIndex >= 2 },
    { name: "Notice", completed: employee.stageIndex >= 3 },
    { name: "Clearance", completed: employee.stageIndex >= 4 },
    { name: "Assets", completed: employee.stageIndex >= 5 },
    { name: "No Dues", completed: employee.stageIndex >= 6 },
    { name: "Interview", completed: employee.stageIndex >= 7 },
    { name: "F&F", completed: employee.stageIndex >= 8 },
    { name: "Documents", completed: employee.stageIndex >= 9 },
    { name: "Completed", completed: employee.stageIndex >= 10 }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-4xl bg-white shadow-2xl border-l border-slate-200 flex flex-col font-sans">
          
          {/* Header Profile Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 text-white shrink-0 relative">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg bg-white/10 hover:bg-white/20 transition"
              title="Close Drawer"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 border-2 border-white/20 flex items-center justify-center font-black text-2xl text-white shadow-md">
                {employee.avatar || employee.employee?.slice(0, 2).toUpperCase() || "EM"}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-black tracking-tight">{employee.employee}</h2>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-200 border border-white/10">
                    {employee.employeeId}
                  </span>
                  <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(employee.status)}`}>
                    {employee.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 flex items-center gap-2">
                  <span>{employee.designation}</span>
                  <span>•</span>
                  <span>{employee.department}</span>
                  <span>•</span>
                  <span className="text-slate-400">{employee.email || `${employee.employeeId?.toLowerCase()}@company.com`}</span>
                </p>
              </div>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Resignation Date</span>
                <span className="font-bold text-white mt-0.5 block">{employee.resignationDate || "20 Aug 2026"}</span>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Last Working Day</span>
                <span className="font-bold text-amber-300 mt-0.5 block">{employee.lastWorkingDay || "20 Sep 2026"}</span>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Notice Period</span>
                <span className="font-bold text-white mt-0.5 block">{employee.noticePeriod || "30 Days"}</span>
              </div>
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Exit Type</span>
                <span className="font-bold text-indigo-300 mt-0.5 block">{employee.exitType || "Voluntary"}</span>
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="border-b border-slate-200 px-6 bg-slate-50/75 shrink-0">
            <div className="flex gap-2 overflow-x-auto py-2 scrollbar-none">
              {DRAWER_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
                    activeTab === tab
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Drawer Body Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* 1. OVERVIEW TAB */}
            {activeTab === "Overview" && (
              <div className="space-y-6">
                {/* Visual Exit Progress Tracker */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                      Exit Lifecycle Progress Tracker
                    </h3>
                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                      Current Stage: {employee.currentStage || "Notice Period"}
                    </span>
                  </div>

                  {/* Horizontal Visual Pipeline Stepper */}
                  <div className="overflow-x-auto pb-2">
                    <div className="flex items-center min-w-[700px] pt-2">
                      {stageOrder.map((st, i) => (
                        <React.Fragment key={st.name}>
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                              st.completed
                                ? "bg-emerald-600 text-white"
                                : i === (employee.stageIndex || 2)
                                ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                                : "bg-white border-2 border-slate-300 text-slate-400"
                            }`}>
                              {st.completed ? "✓" : i === (employee.stageIndex || 2) ? "⏳" : i + 1}
                            </div>
                            <span className={`text-[10px] mt-1.5 font-bold whitespace-nowrap ${
                              st.completed ? "text-emerald-700" : "text-slate-500"
                            }`}>
                              {st.name}
                            </span>
                          </div>
                          {i < stageOrder.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-1 transition-all ${
                              st.completed ? "bg-emerald-500" : "bg-slate-200"
                            }`} />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Reason For Leaving</span>
                    <p className="text-sm font-black text-slate-800">{employee.reason || "Better Opportunity"}</p>
                    <p className="text-xs text-slate-500">{employee.remarks || "Personal career growth."}</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Reporting Manager</span>
                    <p className="text-sm font-black text-slate-800">{employee.manager || "Rajesh Kumar"}</p>
                    <p className="text-xs text-emerald-600 font-bold">Approved on 21 Aug 2026</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Net F&F Payable</span>
                    <p className="text-sm font-black text-emerald-600">₹76,000</p>
                    <p className="text-xs text-slate-500">Processed via Direct NEFT</p>
                  </div>
                </div>

                {/* Status Checklists Overview */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    Department Exit Approvals Checklist
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-bold text-slate-700">Manager Sign-off</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Cleared</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-bold text-slate-700">HR Clearance</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Cleared</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-bold text-slate-700">IT Hardware & Access Return</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Pending Return</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-bold text-slate-700">Finance & Accounts Clearance</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Cleared (₹0 Dues)</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-bold text-slate-700">Admin ID & Access Card</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Cleared</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-bold text-slate-700">Exit Interview Feedback</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Completed (4.2/5)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. RESIGNATION TAB */}
            {activeTab === "Resignation" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-xs">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Resignation Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Submission Date</span>
                    <span className="font-semibold text-slate-800">{employee.resignationDate || "20 Aug 2026"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Proposed Last Working Day</span>
                    <span className="font-semibold text-slate-800">{employee.lastWorkingDay || "20 Sep 2026"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Exit Type</span>
                    <span className="font-semibold text-slate-800">{employee.exitType || "Voluntary Resignation"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Notice Period Required</span>
                    <span className="font-semibold text-slate-800">{employee.noticePeriod || "30 Days"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Primary Reason</span>
                    <p className="font-semibold text-slate-800 mt-1">{employee.reason || "Career Growth Opportunity"}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Employee Remarks & Resignation Note</span>
                    <p className="mt-1 p-3 bg-slate-50 rounded-xl border text-slate-600 leading-relaxed">
                      "I am writing to formally submit my resignation from my position as {employee.designation || "Senior Software Engineer"} at NIB HR. My proposed last working day will be {employee.lastWorkingDay || "20 Sep 2026"}. I have thoroughly enjoyed working with the engineering team and am committed to ensuring a seamless handover."
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. CLEARANCE TAB */}
            {activeTab === "Clearance" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Exit Clearance Tracker</h3>
                <div className="space-y-3">
                  {[
                    { dept: "Manager Clearance", status: "Cleared", approver: "Rajesh Kumar", date: "21 Aug 2026", note: "Knowledge transfer completed." },
                    { dept: "HR Clearance", status: "Cleared", approver: "Anjali Mehta", date: "22 Aug 2026", note: "Exit formalities verified." },
                    { dept: "IT Clearance", status: "Pending", approver: "Rohan Varma", date: "Scheduled 19 Sep 2026", note: "Laptop diagnostic pending." },
                    { dept: "Finance Clearance", status: "Cleared", approver: "Suresh Pillai", date: "24 Aug 2026", note: "No unpaid advances." },
                    { dept: "Admin Clearance", status: "Cleared", approver: "Vikas Joshi", date: "18 Sep 2026", note: "ID and access card surrendered." }
                  ].map((c) => (
                    <div key={c.dept} className="flex flex-col sm:flex-row justify-between sm:items-center p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 gap-2 text-xs">
                      <div>
                        <h4 className="font-extrabold text-slate-800">{c.dept}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{c.note} • Verified by {c.approver} ({c.date})</p>
                      </div>
                      <span className={`self-start sm:self-center text-[10px] font-black px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(c.status)}`}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. ASSETS TAB */}
            {activeTab === "Assets" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Assigned Company Assets</h3>
                <div className="space-y-3">
                  {[
                    { id: "AST-1023", name: "Dell Latitude 5440", cat: "Laptop", sn: "DL45892", status: "Pending", cond: "Good" },
                    { id: "AST-1045", name: "Employee ID Card", cat: "ID Card", sn: "ID7842", status: "Returned", cond: "Good" }
                  ].map((a) => (
                    <div key={a.id} className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900">{a.name}</span>
                          <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border text-slate-600">{a.id}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{a.cat} • S/N: {a.sn} • Condition: {a.cond}</p>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(a.status)}`}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. NO DUES TAB */}
            {activeTab === "No Dues" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-xs">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">No Dues Certificate Status</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 border rounded-xl p-3 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Dues</span>
                    <p className="text-base font-black text-slate-800 mt-1">₹0</p>
                  </div>
                  <div className="bg-slate-50 border rounded-xl p-3 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Recovered</span>
                    <p className="text-base font-black text-emerald-600 mt-1">₹0</p>
                  </div>
                  <div className="bg-slate-50 border rounded-xl p-3 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Remaining</span>
                    <p className="text-base font-black text-indigo-600 mt-1">₹0</p>
                  </div>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>All departmental obligations have been cleared. No recovery required from F&F settlement.</span>
                </div>
              </div>
            )}

            {/* 6. F&F TAB */}
            {activeTab === "F&F" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 text-xs">
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase">Full & Final Computation Sheet</h3>
                    <span className="text-[11px] text-slate-400">Calculated for LWD: {employee.lastWorkingDay || "20 Sep 2026"}</span>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-black rounded-full text-xs">
                    Approved (₹76,000)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Earnings */}
                  <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="font-black text-slate-800 uppercase text-[11px] text-emerald-700">Gross Earnings (+)</h4>
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between"><span>Basic Salary</span><span className="font-bold">₹35,000</span></div>
                      <div className="flex justify-between"><span>HRA</span><span className="font-bold">₹15,000</span></div>
                      <div className="flex justify-between"><span>Special Allowance</span><span className="font-bold">₹15,000</span></div>
                      <div className="flex justify-between"><span>Leave Encashment (12 Days)</span><span className="font-bold text-emerald-600">₹12,000</span></div>
                      <div className="flex justify-between"><span>Bonus / Ex-gratia</span><span className="font-bold">₹5,000</span></div>
                      <div className="border-t pt-1.5 flex justify-between font-extrabold text-slate-900">
                        <span>Total Earnings:</span>
                        <span>₹82,000</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="font-black text-slate-800 uppercase text-[11px] text-rose-700">Deductions & Recoveries (-)</h4>
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between"><span>Income Tax (TDS)</span><span className="font-bold">₹4,500</span></div>
                      <div className="flex justify-between"><span>Provident Fund (PF)</span><span className="font-bold">₹3,000</span></div>
                      <div className="flex justify-between"><span>ESI</span><span className="font-bold">₹1,000</span></div>
                      <div className="flex justify-between"><span>Notice Recovery</span><span className="font-bold text-slate-400">₹0</span></div>
                      <div className="flex justify-between"><span>Loan / Advance Recovery</span><span className="font-bold text-slate-400">₹0</span></div>
                      <div className="border-t pt-1.5 flex justify-between font-extrabold text-slate-900">
                        <span>Total Deductions:</span>
                        <span className="text-rose-600">₹8,500</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex justify-between items-center text-indigo-950 font-black">
                  <span className="text-sm">Net Payable Amount (Settlement):</span>
                  <span className="text-xl text-indigo-700">₹76,000</span>
                </div>
              </div>
            )}

            {/* 7. EXIT INTERVIEW TAB */}
            {activeTab === "Exit Interview" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-xs">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="text-sm font-black text-slate-800 uppercase">Exit Interview Feedback Report</h3>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-full">
                    Rating: 4.2 / 5.0
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 bg-slate-50 border rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Satisfaction</span>
                    <span className="font-black text-slate-800 text-sm">4 / 5</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Manager Support</span>
                    <span className="font-black text-slate-800 text-sm">5 / 5</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Culture</span>
                    <span className="font-black text-slate-800 text-sm">5 / 5</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Rehire Eligible</span>
                    <span className="font-black text-emerald-600 text-sm">Yes</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="p-3 bg-slate-50 rounded-xl border">
                    <span className="font-bold text-slate-700 block">Why are you leaving the organization?</span>
                    <p className="text-slate-600 mt-1">"Accepted a staff architect role at a global technology firm."</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border">
                    <span className="font-bold text-slate-700 block">What did you like most about working here?</span>
                    <p className="text-slate-600 mt-1">"Open culture, collaborative team, high autonomy on engineering decisions."</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border">
                    <span className="font-bold text-slate-700 block">What could the company improve?</span>
                    <p className="text-slate-600 mt-1">"Streamline cross-departmental clearance workflows."</p>
                  </div>
                </div>
              </div>
            )}

            {/* 8. DOCUMENTS TAB */}
            {activeTab === "Documents" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Relieving & Service Certificates</h3>
                <div className="space-y-3">
                  {[
                    { title: "Experience Certificate", type: "Experience Letter", ref: "NIB/EXP/2026/1024", date: "25 Sep 2026", status: "Issued" },
                    { title: "Relieving Letter", type: "Relieving Letter", ref: "NIB/REL/2026/1024", date: "25 Sep 2026", status: "Issued" }
                  ].map((doc) => (
                    <div key={doc.type} className="flex justify-between items-center p-4 bg-slate-50 border rounded-xl text-xs">
                      <div>
                        <h4 className="font-black text-slate-900">{doc.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Ref: {doc.ref} • Issued on {doc.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {doc.status}
                        </span>
                        <button
                          onClick={() => alert(`Downloading ${doc.title}...`)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
                          title="Download Document"
                        >
                          <DocumentArrowDownIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 9. HISTORY TAB */}
            {activeTab === "History" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Separation Activity Timeline</h3>
                <div className="relative pl-6 border-l-2 border-indigo-200 space-y-6">
                  {[
                    { title: "Resignation Submitted", date: "20 Aug 2026, 10:32 AM", user: "Rahul Sharma", desc: "Submitted online separation form." },
                    { title: "Manager Approved", date: "21 Aug 2026, 02:15 PM", user: "Rajesh Kumar", desc: "Approved with standard 30 days notice." },
                    { title: "HR Notice Set", date: "22 Aug 2026, 11:20 AM", user: "HR Admin", desc: "LWD locked as 20 Sep 2026." },
                    { title: "Asset Returned", date: "18 Sep 2026, 04:30 PM", user: "IT Admin", desc: "Laptop received in good condition." },
                    { title: "Exit Interview Recorded", date: "19 Sep 2026, 05:10 PM", user: "HR Manager", desc: "Feedback submitted and evaluated." },
                    { title: "F&F Settled", date: "25 Sep 2026, 03:00 PM", user: "Finance Admin", desc: "₹76,000 paid via NEFT to HDFC Bank." }
                  ].map((act, i) => (
                    <div key={i} className="relative group">
                      <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />
                      <div>
                        <span className="text-[10px] font-bold text-indigo-600 block">{act.date}</span>
                        <h4 className="text-xs font-black text-slate-900 mt-0.5">{act.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{act.desc} • By <span className="font-semibold text-slate-700">{act.user}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-200 p-4 bg-slate-50 flex justify-between items-center shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 bg-white rounded-xl text-xs font-bold hover:bg-slate-100 transition"
            >
              Close Profile
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  alert(`Downloading complete exit docket for ${employee.employee}...`);
                }}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition flex items-center gap-1.5"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                <span>Export Exit Docket</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EmployeeExitDetailDrawer;
