import React, { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../../services/hrApi";
import {
  BanknotesIcon,
  PlayIcon,
  CheckCircleIcon,
  LockClosedIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  EyeIcon,
  CreditCardIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon
} from "@heroicons/react/24/outline";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const PayrollProcess = ({ onRefreshData }) => {
  const [runs, setRuns] = useState([]);
  const [activeRun, setActiveRun] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [exceptions, setExceptions] = useState([]);

  // Create Run Form
  const [month, setMonth] = useState("January");
  const [year, setYear] = useState("2026");

  // Filter inside active run items
  const [itemSearch, setItemSearch] = useState("");
  const [itemDept, setItemDept] = useState("");
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);

  // Record Payment Modal
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer (NEFT/RTGS)");
  const [paymentReference, setPaymentReference] = useState("");
  const [payoutStatus, setPayoutStatus] = useState("Paid");

  const loadRuns = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/finance/runs");
      if (res && res.data) {
        setRuns(res.data);
        if (!activeRun && res.data.length > 0) {
          handleViewDetails(res.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const handleCreateRun = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/finance/runs", {
        method: "POST",
        body: JSON.stringify({ month, year })
      });
      alert(`Payroll run for ${month} ${year} created as Draft!`);
      loadRuns();
      if (res?.data?.id) {
        handleViewDetails(res.data.id);
      }
    } catch (err) {
      alert(err.message || "Failed to initialize run.");
    }
  };

  const handleViewDetails = async (id) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/finance/runs/${id}`);
      if (res && res.data) {
        setActiveRun(res.data);
      }
    } catch (err) {
      alert(err.message || "Failed to load run details.");
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async (id) => {
    setCalculating(true);
    try {
      const res = await apiFetch(`/api/finance/runs/${id}/calculate`, { method: "POST" });
      alert("Calculations completed successfully using employee attendance, LOP, and salary bands!");
      if (res?.data) {
        setActiveRun(res.data);
        setExceptions(res.data.exceptions || []);
      }
      loadRuns();
    } catch (err) {
      alert(err.message || "Calculation failed.");
    } finally {
      setCalculating(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this payroll run? This verifies calculations and submits for payout processing.")) return;
    try {
      await apiFetch(`/api/finance/runs/${id}/approve`, { method: "POST" });
      alert("Payroll run approved!");
      handleViewDetails(id);
      loadRuns();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleProcess = async (id) => {
    if (!window.confirm("Execute PROCESS payroll? This will finalize net payouts, generate immutable employee payslips, log loan repayments, and record statutory filings.")) return;
    setCalculating(true);
    try {
      await apiFetch(`/api/finance/runs/${id}/process`, { method: "POST" });
      alert("Payroll processed successfully! Payslips generated and loan schedules updated.");
      handleViewDetails(id);
      loadRuns();
    } catch (err) {
      alert(err.message);
    } finally {
      setCalculating(false);
    }
  };

  const handleLock = async (id) => {
    if (!window.confirm("Lock this payroll run? This will permanently freeze records against recalculations or tampering.")) return;
    try {
      await apiFetch(`/api/finance/runs/${id}/lock`, { method: "POST" });
      alert("Payroll run locked!");
      handleViewDetails(id);
      loadRuns();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this payroll run?")) return;
    try {
      await apiFetch(`/api/finance/runs/${id}/cancel`, { method: "POST" });
      alert("Payroll run cancelled.");
      handleViewDetails(id);
      loadRuns();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRecordPayout = async (e) => {
    e.preventDefault();
    if (!activeRun) return;
    try {
      await apiFetch(`/api/finance/runs/${activeRun.id}/payout`, {
        method: "POST",
        body: JSON.stringify({
          paymentDate,
          paymentMethod,
          paymentReference,
          paymentStatus: payoutStatus
        })
      });
      alert("Payment transaction reference recorded successfully!");
      setShowPayoutModal(false);
      handleViewDetails(activeRun.id);
      loadRuns();
    } catch (err) {
      alert(err.message || "Failed to record payment.");
    }
  };

  const handleExportBankInstructions = () => {
    if (!activeRun) return;
    window.open(`http://localhost:5000/api/finance/runs/${activeRun.id}/export-bank`, "_blank");
  };

  // Filter items in active run
  const filteredItems = useMemo(() => {
    if (!activeRun || !activeRun.items) return [];
    return activeRun.items.filter((item) => {
      const emp = item.employee || {};
      const name = (emp.employeeName || `${emp.firstName || ''} ${emp.lastName || ''}`).toLowerCase();
      const code = (emp.employeeCode || emp.employeeId || '').toLowerCase();
      const matchSearch = !itemSearch || name.includes(itemSearch.toLowerCase()) || code.includes(itemSearch.toLowerCase());
      const matchDept = !itemDept || emp.department === itemDept;
      return matchSearch && matchDept;
    });
  }, [activeRun, itemSearch, itemDept]);

  const uniqueDepartments = useMemo(() => {
    if (!activeRun || !activeRun.items) return [];
    const depts = new Set(activeRun.items.map(i => i.employee?.department).filter(Boolean));
    return Array.from(depts);
  }, [activeRun]);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Monthly Payroll Lifecycle</h2>
          <p className="text-xs text-slate-500">Calculate payable days, attendance-based LOP, eligible allowances, statutory deductions, loan recoveries, and disburse payslips.</p>
        </div>

        {/* Create Payroll Run Form inline */}
        <form onSubmit={handleCreateRun} className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 border rounded-2xl">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="text-xs font-bold text-slate-700 border rounded-xl p-1.5 bg-white"
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="text-xs font-bold text-slate-700 border rounded-xl p-1.5 bg-white"
          >
            {["2024", "2025", "2026", "2027"].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-2xs"
          >
            + New Run
          </button>
        </form>
      </div>

      {/* Runs Navigator Pill List */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0">Runs:</span>
        {runs.map((r) => (
          <button
            key={r.id}
            onClick={() => handleViewDetails(r.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all ${
              activeRun?.id === r.id
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white border text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span>{r.month} {r.year}</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[9px] uppercase ${
              r.status === "Locked" ? "bg-purple-100 text-purple-700" :
              r.status === "Processed" ? "bg-emerald-100 text-emerald-700" :
              r.status === "Approved" ? "bg-blue-100 text-blue-700" :
              r.status === "Cancelled" ? "bg-red-100 text-red-700" :
              "bg-amber-100 text-amber-700"
            }`}>
              {r.status}
            </span>
          </button>
        ))}
      </div>

      {/* ACTIVE RUN DETAILS WORKBENCH */}
      {activeRun ? (
        <div className="space-y-6">
          {/* Status & Lifecycle Controls Bar */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">
                  {activeRun.month} {activeRun.year} Payroll Run
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold tracking-wide uppercase ${
                  activeRun.status === "Locked" ? "bg-purple-50 text-purple-700 border border-purple-200" :
                  activeRun.status === "Processed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                  activeRun.status === "Approved" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                  activeRun.status === "Cancelled" ? "bg-red-50 text-red-700 border border-red-200" :
                  "bg-amber-50 text-amber-700 border border-amber-200"
                }`}>
                  Status: {activeRun.status}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeRun.paymentStatus === "Paid" ? "bg-green-50 text-green-700 border border-green-200" : "bg-slate-100 text-slate-600"
                }`}>
                  Payment: {activeRun.paymentStatus || "Unpaid"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Created on {new Date(activeRun.created_at).toLocaleDateString()} • {activeRun.paymentMethod || "Bank Transfer"}
                {activeRun.paymentReference && ` • Ref: ${activeRun.paymentReference}`}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Calculate / Recalculate */}
              {!["Processed", "Locked", "Cancelled"].includes(activeRun.status) && (
                <button
                  disabled={calculating}
                  onClick={() => handleCalculate(activeRun.id)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-2xs disabled:opacity-50"
                >
                  <PlayIcon className="w-4 h-4" />
                  {calculating ? "Calculating..." : activeRun.items?.length > 0 ? "Recalculate Run" : "Calculate Run"}
                </button>
              )}

              {/* Approve */}
              {activeRun.status === "Draft" && activeRun.items?.length > 0 && (
                <button
                  onClick={() => handleApprove(activeRun.id)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-2xs"
                >
                  <CheckCircleIcon className="w-4 h-4" /> Approve Run
                </button>
              )}

              {/* Process */}
              {activeRun.status === "Approved" && (
                <button
                  disabled={calculating}
                  onClick={() => handleProcess(activeRun.id)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-2xs"
                >
                  <BanknotesIcon className="w-4 h-4" /> Process & Finalize
                </button>
              )}

              {/* Record Payout */}
              {["Processed", "Locked"].includes(activeRun.status) && (
                <button
                  onClick={() => setShowPayoutModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 rounded-xl hover:bg-sky-100"
                >
                  <CreditCardIcon className="w-4 h-4" /> Record Payment
                </button>
              )}

              {/* Export Bank Instructions */}
              {activeRun.items?.length > 0 && (
                <button
                  onClick={handleExportBankInstructions}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50"
                  title="Export NEFT / Bank instruction statement"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" /> Bank Export (CSV)
                </button>
              )}

              {/* Lock */}
              {activeRun.status === "Processed" && (
                <button
                  onClick={() => handleLock(activeRun.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 rounded-xl hover:bg-purple-100"
                >
                  <LockClosedIcon className="w-4 h-4" /> Lock Run
                </button>
              )}

              {/* Cancel */}
              {!["Locked", "Cancelled"].includes(activeRun.status) && (
                <button
                  onClick={() => handleCancel(activeRun.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                  title="Cancel Run"
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Exceptions Warning Banner */}
          {exceptions.length > 0 && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Calculation Warnings ({exceptions.length} Employees require review):</span>
              </div>
              <div className="max-h-28 overflow-y-auto space-y-1 pl-7 text-[11px] text-amber-700">
                {exceptions.map((exc, idx) => (
                  <div key={idx} className="flex justify-between border-b border-amber-200/50 pb-0.5">
                    <span><strong>{exc.employeeName}</strong> ({exc.employeeCode || 'N/A'})</span>
                    <span className="font-semibold text-amber-900">{exc.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KPI Summary Cards */}
          {activeRun.summary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 border rounded-2xl bg-indigo-50 border-indigo-100 text-indigo-900">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block">Headcount</span>
                <span className="text-xl font-extrabold mt-1 block">{activeRun.summary.employeeCount} Employees</span>
              </div>
              <div className="p-4 border rounded-2xl bg-slate-50 border-slate-200 text-slate-900">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block">Total Gross Salary</span>
                <span className="text-xl font-extrabold mt-1 block">₹{activeRun.summary.totalGross.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-4 border rounded-2xl bg-red-50 border-red-100 text-red-900">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block">Total Deductions</span>
                <span className="text-xl font-extrabold mt-1 block">-₹{activeRun.summary.totalDeductions.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-4 border rounded-2xl bg-emerald-50 border-emerald-100 text-emerald-900">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block">Net Payout Volume</span>
                <span className="text-xl font-extrabold mt-1 block">₹{activeRun.summary.totalNet.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-4 border rounded-2xl bg-purple-50 border-purple-100 text-purple-900">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block">Employer Cost (CTC)</span>
                <span className="text-xl font-extrabold mt-1 block">₹{activeRun.summary.totalCtc.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          {/* Employee Register Table with Filters */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search employee or code..."
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs border rounded-xl bg-slate-50 focus:bg-white focus:outline-indigo-500 w-48 md:w-64"
                  />
                </div>

                <select
                  value={itemDept}
                  onChange={(e) => setItemDept(e.target.value)}
                  className="text-xs border rounded-xl p-1.5 bg-slate-50 text-slate-700"
                >
                  <option value="">All Departments</option>
                  {uniqueDepartments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <span className="text-xs text-slate-400 font-semibold">
                Showing {filteredItems.length} of {activeRun.items?.length || 0} employees
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-3 py-3">Dept</th>
                    <th className="px-3 py-3 text-center">Calendar Days</th>
                    <th className="px-3 py-3 text-center">Paid / LOP</th>
                    <th className="px-4 py-3 text-right">Gross Salary</th>
                    <th className="px-4 py-3 text-right">Deductions</th>
                    <th className="px-4 py-3 text-right">Net Payout</th>
                    <th className="px-3 py-3 text-center">Status</th>
                    <th className="px-3 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredItems.map((item) => {
                    const emp = item.employee || {};
                    const name = emp.employeeName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
                    const code = emp.employeeCode || emp.employeeId || '--';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-800">{name}</div>
                          <div className="text-[10px] text-slate-400">{code}</div>
                        </td>
                        <td className="px-3 py-3 text-slate-600">{emp.department || '--'}</td>
                        <td className="px-3 py-3 text-center font-bold text-slate-700">{item.workingDays}</td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-bold text-emerald-700">{item.presentDays + item.leaveDays}</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="font-bold text-red-600">{item.lopDays}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800">
                          ₹{Number(item.grossSalary).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-red-600">
                          -₹{Number(item.totalDeductions).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold text-emerald-700">
                          ₹{Number(item.netSalary).toLocaleString('en-IN')}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {item.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            onClick={() => setSelectedItemDetail(item)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg inline-flex items-center gap-1 font-bold text-[11px]"
                          >
                            <EyeIcon className="w-3.5 h-3.5" /> Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white border rounded-2xl text-slate-400 text-xs">
          Select or initialize a monthly payroll run above to inspect records.
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleRecordPayout} className="bg-white border rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 text-xs">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">Record Payout Transaction</h3>
                <p className="text-[11px] text-slate-400">{activeRun?.month} {activeRun?.year} Payroll</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPayoutModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Disbursement Date *</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full border rounded-xl p-2 bg-slate-50 focus:bg-white focus:outline-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border rounded-xl p-2 bg-slate-50 focus:bg-white focus:outline-indigo-500 font-semibold"
                >
                  <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer (NEFT/RTGS)</option>
                  <option value="IMPS Instant Transfer">IMPS Instant Transfer</option>
                  <option value="Corporate Direct Debit">Corporate Direct Debit</option>
                  <option value="Cheque / Draft">Cheque / Draft</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bank UTR / Transaction Reference *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UTR-HDFC902148201"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full border rounded-xl p-2 bg-slate-50 focus:bg-white focus:outline-indigo-500 font-bold text-indigo-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Status</label>
                <select
                  value={payoutStatus}
                  onChange={(e) => setPayoutStatus(e.target.value)}
                  className="w-full border rounded-xl p-2 bg-slate-50 focus:bg-white focus:outline-indigo-500 font-bold text-emerald-700"
                >
                  <option value="Paid">Paid (Full Disbursement)</option>
                  <option value="Partially_Paid">Partially Paid</option>
                  <option value="Pending">Pending Confirmation</option>
                </select>
              </div>
            </div>

            <div className="border-t pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPayoutModal(false)}
                className="px-3.5 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs"
              >
                Record Payout Reference
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ITEM DETAIL MODAL */}
      {selectedItemDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 text-xs">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">
                  {selectedItemDetail.employee?.employeeName || 'Employee'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {selectedItemDetail.employee?.employeeCode || 'No Code'} • {selectedItemDetail.employee?.department || 'Department'}
                </p>
              </div>
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-center">
              <div><span className="text-[10px] font-bold text-slate-400 block">Working Days</span><strong>{selectedItemDetail.workingDays}</strong></div>
              <div><span className="text-[10px] font-bold text-slate-400 block">Paid Days</span><strong className="text-emerald-700">{selectedItemDetail.presentDays + selectedItemDetail.leaveDays}</strong></div>
              <div><span className="text-[10px] font-bold text-slate-400 block">LOP Days</span><strong className="text-red-600">{selectedItemDetail.lopDays}</strong></div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Earnings</span>
              <div className="border rounded-xl divide-y">
                {selectedItemDetail.earnings?.map((e, idx) => (
                  <div key={idx} className="p-2 flex justify-between">
                    <span className="text-slate-600">{e.name}</span>
                    <span className="font-bold text-slate-800">₹{Number(e.amount).toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="p-2 flex justify-between font-extrabold bg-slate-50 text-indigo-700">
                  <span>Gross Salary</span>
                  <span>₹{Number(selectedItemDetail.grossSalary).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Deductions</span>
              <div className="border rounded-xl divide-y">
                {selectedItemDetail.deductions?.map((d, idx) => (
                  <div key={idx} className="p-2 flex justify-between">
                    <span className="text-slate-600">{d.name}</span>
                    <span className="font-bold text-red-600">-₹{Number(d.amount).toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="p-2 flex justify-between font-extrabold bg-red-50 text-red-700">
                  <span>Total Deductions</span>
                  <span>-₹{Number(selectedItemDetail.totalDeductions).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex justify-between items-center text-emerald-800">
              <span className="font-bold">Net Take-Home Salary</span>
              <span className="text-base font-black">₹{Number(selectedItemDetail.netSalary).toLocaleString('en-IN')}</span>
            </div>

            <div className="border-t pt-3 flex justify-end">
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="px-4 py-2 font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
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

export default PayrollProcess;
