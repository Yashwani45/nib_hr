// Frontend/src/components/FinanceCompliance/ESIManagement.jsx
import React, { useState, useEffect, useMemo } from "react";
import { apiFetch, downloadFile } from "../../services/hrApi";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const ESIManagement = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [month, setMonth] = useState("January");
  const [year, setYear] = useState("2026");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showMissingModal, setShowMissingModal] = useState(false);

  // Challan Modal State
  const [showChallanModal, setShowChallanModal] = useState(false);
  const [challanNumber, setChallanNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [challanStatus, setChallanStatus] = useState("Filed");
  const [updatingChallan, setUpdatingChallan] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ month, year });
      if (statusFilter) q.append("status", statusFilter);
      if (search.trim()) q.append("search", search.trim());
      
      const res = await apiFetch(`/api/finance/esi/report?${q.toString()}`);
      if (res && res.data) {
        setReportData(res.data);
      }
    } catch (e) {
      console.error("Failed to load ESI report:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [month, year, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadReport();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const q = new URLSearchParams({ month, year });
      if (statusFilter) q.append("status", statusFilter);
      if (search.trim()) q.append("search", search.trim());
      await downloadFile(`/api/finance/esi/export?${q.toString()}`, `ESI_Register_${month}_${year}.csv`);
    } catch (err) {
      alert("Export failed: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleUpdateChallan = async (e) => {
    e.preventDefault();
    if (!challanNumber.trim()) {
      alert("Please enter a valid Challan / TRRN reference number.");
      return;
    }
    setUpdatingChallan(true);
    try {
      await apiFetch("/api/finance/esi/challan", {
        method: "POST",
        body: JSON.stringify({
          month,
          year: parseInt(year),
          challanNumber: challanNumber.trim(),
          paymentDate,
          status: challanStatus
        })
      });
      alert(`ESI Challan updated successfully for ${month} ${year}!`);
      setShowChallanModal(false);
      loadReport();
    } catch (err) {
      alert(err.message || "Failed to update ESI challan.");
    } finally {
      setUpdatingChallan(false);
    }
  };

  const filteredRecords = useMemo(() => {
    if (!reportData || !reportData.records) return [];
    if (!search.trim()) return reportData.records;
    const term = search.toLowerCase();
    return reportData.records.filter(r => 
      (r.employeeName && r.employeeName.toLowerCase().includes(term)) ||
      (r.employeeCode && r.employeeCode.toLowerCase().includes(term)) ||
      (r.esiNumber && r.esiNumber.toLowerCase().includes(term))
    );
  }, [reportData, search]);

  const missingList = reportData?.missingIdentifiers || [];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">ESI Statutory Management</h2>
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              ESIC Act 1948 Compliant
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Track employee applicability (Wage Ceiling ≤ ₹21,000/mo), employee deduction (0.75%), employer contribution (3.25%), and challan filings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowChallanModal(true)}
            className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition shadow-sm flex items-center gap-1.5"
          >
            <span>📄</span> Update Challan & Filing
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || loading}
            className="px-3.5 py-2 text-xs font-bold bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition shadow-2xs flex items-center gap-1.5"
          >
            <span>⬇️</span> {exporting ? "Exporting..." : "Export Register (CSV)"}
          </button>
        </div>
      </div>

      {/* Statutory Rules Compliance Info Banner */}
      <div className="p-4 bg-gradient-to-r from-indigo-50/70 via-slate-50 to-sky-50 border border-indigo-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🏛️</span>
          <div>
            <span className="font-extrabold text-slate-800 block text-xs">Statutory Contribution Norms (Government of India)</span>
            <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
              <strong>Gross Wage Ceiling:</strong> ₹21,000 per month (₹25,000 for Persons with Disabilities). Employees earning above this threshold are exempt.
              <br />
              <strong>Rates:</strong> Employee: <strong>0.75%</strong> of gross wages | Employer: <strong>3.25%</strong> of gross wages.
              <span className="text-indigo-700 font-semibold ml-1">Employer contribution is a direct company cost and never deducted from employee net pay.</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 shrink-0">
          <span className="px-2 py-1 bg-white border rounded-lg shadow-2xs">Employee: 0.75%</span>
          <span className="px-2 py-1 bg-white border rounded-lg shadow-2xs">Employer: 3.25%</span>
          <span className="px-2 py-1 bg-white border rounded-lg shadow-2xs">Ceiling: ₹21,000</span>
        </div>
      </div>

      {/* Missing Identifiers Alert Banner */}
      {missingList.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-xs font-black text-amber-900">
                Action Required: {missingList.length} Covered Employee(s) Missing ESI / IP Number
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                These employees meet statutory wage eligibility (≤ ₹21,000) and have ESI deducted, but do not have an Insurance Number in their profile.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowMissingModal(true)}
            className="px-3 py-1.5 text-xs font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition shrink-0"
          >
            Review Missing ({missingList.length})
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 border rounded-2xl">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-500">Period:</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="text-xs border rounded-lg px-2.5 py-1.5 bg-white font-bold text-slate-700 shadow-2xs"
            >
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="text-xs border rounded-lg px-2.5 py-1.5 bg-white font-bold text-slate-700 shadow-2xs"
            >
              {["2024", "2025", "2026", "2027"].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-500">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border rounded-lg px-2.5 py-1.5 bg-white font-semibold text-slate-700 shadow-2xs"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Filed">Filed</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search employee, code, IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs border rounded-lg px-3 py-1.5 bg-white text-slate-800 placeholder-slate-400 w-48 sm:w-64 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-bold bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* KPI Cards */}
      {reportData && reportData.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="p-4 border rounded-2xl bg-white shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Covered Employees</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">{reportData.summary.totalEmployees || 0}</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Wage ≤ ₹21,000</span>
          </div>

          <div className="p-4 border rounded-2xl bg-white shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Gross Wages</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">
              ₹{(reportData.summary.totalGrossWages || 0).toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Eligible earnings basis</span>
          </div>

          <div className="p-4 border rounded-2xl bg-amber-50/60 border-amber-100 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Employee Share (0.75%)</span>
            <span className="text-2xl font-black text-amber-900 mt-1 block">
              ₹{(reportData.summary.totalEmployeeContribution || 0).toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-amber-600 mt-1 block">Deducted from salary</span>
          </div>

          <div className="p-4 border rounded-2xl bg-emerald-50/60 border-emerald-100 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Employer Share (3.25%)</span>
            <span className="text-2xl font-black text-emerald-900 mt-1 block">
              ₹{(reportData.summary.totalEmployerContribution || 0).toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-emerald-600 mt-1 block">Company statutory expense</span>
          </div>

          <div className="p-4 border rounded-2xl bg-indigo-50/80 border-indigo-200 shadow-2xs col-span-2 lg:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">Total Challan Amount</span>
            <span className="text-2xl font-black text-indigo-900 mt-1 block">
              ₹{(reportData.summary.totalContribution || 0).toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-indigo-600 mt-1 block">Total Payable to ESIC</span>
          </div>
        </div>
      )}

      {/* Main Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 border rounded-2xl bg-white">
          Fetching statutory ESI register...
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs bg-white">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider">Employee</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider">Department</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider">ESI / IP Number</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-right">Gross Wages</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-right">Employee (0.75%)</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-right">Employer (3.25%)</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-right">Total Payable</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider">Status & Challan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-900 block">{rec.employeeName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{rec.employeeCode}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{rec.department || "--"}</td>
                  <td className="px-4 py-3 font-mono">
                    {rec.esiNumber && rec.esiNumber !== "Missing IP Number" ? (
                      <span className="text-slate-800 font-bold">{rec.esiNumber}</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        Missing IP No.
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-700">
                    ₹{Number(rec.grossWages || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-amber-700">
                    ₹{Number(rec.employeeContribution || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                    ₹{Number(rec.employerContribution || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-black text-indigo-700">
                    ₹{Number(rec.totalContribution || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rec.status === "Paid" ? "bg-emerald-100 text-emerald-800" :
                        rec.status === "Filed" ? "bg-indigo-100 text-indigo-800" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {rec.status}
                      </span>
                    </div>
                    {rec.challanNumber && rec.challanNumber !== "--" && (
                      <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                        Ref: {rec.challanNumber}
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400">
                    No ESI contribution records found for {month} {year}.
                    <p className="text-[11px] text-slate-400 mt-1">
                      Ensure monthly payroll has been generated for eligible employees earning ≤ ₹21,000.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Challan / Filing Modal */}
      {showChallanModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-slate-800">Record ESI Challan & Filing</h3>
              <button
                onClick={() => setShowChallanModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateChallan} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Period</label>
                <input
                  type="text"
                  value={`${month} ${year}`}
                  disabled
                  className="w-full border rounded-xl p-2.5 bg-slate-100 font-bold text-slate-700"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Challan / TRRN Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 05221000000000 / TRRN 1234567"
                  value={challanNumber}
                  onChange={(e) => setChallanNumber(e.target.value)}
                  required
                  className="w-full border rounded-xl p-2.5 font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Payment / Filing Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="w-full border rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Status</label>
                <select
                  value={challanStatus}
                  onChange={(e) => setChallanStatus(e.target.value)}
                  className="w-full border rounded-xl p-2.5 text-xs font-bold"
                >
                  <option value="Filed">Filed (ECR Uploaded)</option>
                  <option value="Paid">Paid (Bank Receipt Confirmed)</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowChallanModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingChallan}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-sm disabled:opacity-50"
                >
                  {updatingChallan ? "Updating..." : "Save Challan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Missing Identifiers Modal */}
      {showMissingModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-amber-900 flex items-center gap-2">
                <span>⚠️</span> Employees Missing ESI / IP Number
              </h3>
              <button
                onClick={() => setShowMissingModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              These {missingList.length} employees had ESI calculated because their monthly gross wage is ≤ ₹21,000, but their Insurance Number is missing:
            </p>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border rounded-xl">
              {missingList.map((m, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">{m.employeeName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Code: {m.employeeCode}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-700 block">₹{m.grossWages.toLocaleString("en-IN")}</span>
                    <span className="text-[10px] text-amber-700 font-semibold">Eligible for ESI</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowMissingModal(false)}
                className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl text-xs hover:bg-slate-900"
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

export default ESIManagement;