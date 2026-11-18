// Frontend/src/components/FinanceCompliance/ProfessionalTax.jsx
import React, { useState, useEffect, useMemo } from "react";
import { apiFetch, downloadFile } from "../../services/hrApi";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const COMMON_STATES = [
  "Madhya Pradesh", "Maharashtra", "Karnataka", "West Bengal",
  "Gujarat", "Tamil Nadu", "Telangana", "Andhra Pradesh", "Delhi"
];

const ProfessionalTax = () => {
  const [activeTab, setActiveTab] = useState("register"); // 'register' | 'rules'
  const [reportData, setReportData] = useState(null);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [month, setMonth] = useState("January");
  const [year, setYear] = useState("2026");
  const [selectedState, setSelectedState] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Challan Modal
  const [showChallanModal, setShowChallanModal] = useState(false);
  const [challanState, setChallanState] = useState("");
  const [challanNumber, setChallanNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [challanStatus, setChallanStatus] = useState("Filed");
  const [savingChallan, setSavingChallan] = useState(false);

  // Rule Form Modal (Create / Edit)
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [ruleState, setRuleState] = useState("Madhya Pradesh");
  const [ruleMinSalary, setRuleMinSalary] = useState("");
  const [ruleMaxSalary, setRuleMaxSalary] = useState("");
  const [ruleTaxAmount, setRuleTaxAmount] = useState("");
  const [ruleEffectiveFrom, setRuleEffectiveFrom] = useState("2025-01-01");
  const [savingRule, setSavingRule] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "register") {
        const q = new URLSearchParams({ month, year });
        if (selectedState) q.append("state", selectedState);
        if (statusFilter) q.append("status", statusFilter);
        if (search.trim()) q.append("search", search.trim());
        const res = await apiFetch(`/api/finance/professional-tax/report?${q.toString()}`);
        if (res && res.data) {
          setReportData(res.data);
        }
      } else if (activeTab === "rules") {
        const q = selectedState ? `?state=${encodeURIComponent(selectedState)}` : "";
        const res = await apiFetch(`/api/finance/professional-tax/rules${q}`);
        if (res && res.data) {
          setRules(res.data);
        }
      }
    } catch (e) {
      console.error("Failed to load PT data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, month, year, selectedState, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const q = new URLSearchParams({ month, year });
      if (selectedState) q.append("state", selectedState);
      if (statusFilter) q.append("status", statusFilter);
      if (search.trim()) q.append("search", search.trim());
      await downloadFile(`/api/finance/professional-tax/export?${q.toString()}`, `PT_Register_${month}_${year}.csv`);
    } catch (err) {
      alert("Export failed: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleSaveChallan = async (e) => {
    e.preventDefault();
    if (!challanNumber.trim()) {
      alert("Please enter a valid Challan / Treasury reference number.");
      return;
    }
    setSavingChallan(true);
    try {
      await apiFetch("/api/finance/professional-tax/challan", {
        method: "POST",
        body: JSON.stringify({
          month,
          year: parseInt(year),
          state: challanState || undefined,
          challanNumber: challanNumber.trim(),
          paymentDate,
          status: challanStatus
        })
      });
      alert("Professional Tax Challan updated successfully!");
      setShowChallanModal(false);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to update PT challan.");
    } finally {
      setSavingChallan(false);
    }
  };

  const handleOpenCreateRule = () => {
    setEditingRuleId(null);
    setRuleState(selectedState || "Madhya Pradesh");
    setRuleMinSalary("");
    setRuleMaxSalary("");
    setRuleTaxAmount("");
    setRuleEffectiveFrom("2025-01-01");
    setShowRuleModal(true);
  };

  const handleOpenEditRule = (rule) => {
    setEditingRuleId(rule.id);
    setRuleState(rule.state);
    setRuleMinSalary(rule.minSalary);
    setRuleMaxSalary(rule.maxSalary);
    setRuleTaxAmount(rule.taxAmount);
    setRuleEffectiveFrom(rule.effectiveFrom || "2025-01-01");
    setShowRuleModal(true);
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    setSavingRule(true);
    try {
      const payload = {
        state: ruleState.trim(),
        minSalary: parseFloat(ruleMinSalary),
        maxSalary: parseFloat(ruleMaxSalary),
        taxAmount: parseFloat(ruleTaxAmount),
        effectiveFrom: ruleEffectiveFrom
      };

      if (editingRuleId) {
        await apiFetch(`/api/finance/professional-tax/rules/${editingRuleId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        alert("State PT slab updated successfully!");
      } else {
        await apiFetch("/api/finance/professional-tax/rules", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        alert("New State PT slab configured successfully!");
      }
      setShowRuleModal(false);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to save PT rule.");
    } finally {
      setSavingRule(false);
    }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm("Are you sure you want to delete this PT slab? Historical payroll calculations will remain preserved.")) return;
    try {
      await apiFetch(`/api/finance/professional-tax/rules/${id}`, { method: "DELETE" });
      alert("PT slab deleted.");
      loadData();
    } catch (err) {
      alert(err.message || "Failed to delete PT rule.");
    }
  };

  const filteredRecords = useMemo(() => {
    if (!reportData || !reportData.records) return [];
    if (!search.trim()) return reportData.records;
    const term = search.toLowerCase();
    return reportData.records.filter(r =>
      (r.employeeName && r.employeeName.toLowerCase().includes(term)) ||
      (r.employeeCode && r.employeeCode.toLowerCase().includes(term)) ||
      (r.state && r.state.toLowerCase().includes(term))
    );
  }, [reportData, search]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Professional Tax (PT) Management</h2>
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              State-Specific Statutory Slabs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure state wage brackets (Madhya Pradesh, Maharashtra, Karnataka, etc.), calculate monthly PT deductions, and track treasury challans.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "register" ? (
            <>
              <button
                onClick={() => setShowChallanModal(true)}
                className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition shadow-sm flex items-center gap-1.5"
              >
                <span>🏛️</span> Record PT Challan
              </button>
              <button
                onClick={handleExport}
                disabled={exporting || loading}
                className="px-3.5 py-2 text-xs font-bold bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition shadow-2xs flex items-center gap-1.5"
              >
                <span>⬇️</span> {exporting ? "Exporting..." : "Export Register (CSV)"}
              </button>
            </>
          ) : (
            <button
              onClick={handleOpenCreateRule}
              className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition shadow-sm flex items-center gap-1.5"
            >
              <span>➕</span> Add State Slab
            </button>
          )}

          <div className="flex border rounded-xl overflow-hidden shadow-2xs bg-slate-100 p-0.5 ml-2">
            <button
              onClick={() => setActiveTab("register")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === "register" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Monthly Register
            </button>
            <button
              onClick={() => setActiveTab("rules")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === "rules" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              State Slabs & Rates
            </button>
          </div>
        </div>
      </div>

      {/* Official Slabs Guidance Banner */}
      <div className="p-4 bg-gradient-to-r from-emerald-50/60 via-slate-50 to-indigo-50 border border-emerald-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📋</span>
          <div>
            <span className="font-extrabold text-slate-800 block text-xs">Official Statutory Slabs Configured</span>
            <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
              <strong>Madhya Pradesh (Official Schedule):</strong> Up to ₹18,750: Nil | ₹18,751 - ₹25,000: ₹125/mo | ₹25,001 - ₹33,333: ₹166.67/mo | &gt; ₹33,333: ₹208.33/mo (Annual ceiling ₹2,500).
              <br />
              <strong>Karnataka:</strong> Up to ₹24,999: Nil | ₹25,000 &amp; above: ₹200/mo. | <strong>Delhi:</strong> Nil.
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 border rounded-2xl">
        <div className="flex flex-wrap items-center gap-2.5">
          {activeTab === "register" && (
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
          )}

          <div className="flex items-center gap-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-500">State Jurisdiction:</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="text-xs border rounded-lg px-2.5 py-1.5 bg-white font-semibold text-slate-700 shadow-2xs"
            >
              <option value="">All States</option>
              {COMMON_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {activeTab === "register" && (
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
          )}
        </div>

        {activeTab === "register" && (
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search employee, code, state..."
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
        )}
      </div>

      {/* Tab 1: Monthly Register */}
      {activeTab === "register" && (
        <>
          {/* KPI Summary */}
          {reportData && reportData.summary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 border rounded-2xl bg-white shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Covered Employees</span>
                <span className="text-2xl font-black text-slate-800 mt-1 block">{reportData.summary.totalEmployees || 0}</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Subject to PT deductions</span>
              </div>

              <div className="p-4 border rounded-2xl bg-indigo-50/70 border-indigo-100 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">Total PT Deducted</span>
                <span className="text-2xl font-black text-indigo-900 mt-1 block">
                  ₹{(reportData.summary.totalPtAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-indigo-600 mt-1 block">Total Statutory Liability</span>
              </div>

              <div className="p-4 border rounded-2xl bg-white shadow-2xs col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">State-Wise PT Breakdown</span>
                <div className="flex flex-wrap gap-2">
                  {reportData.summary.stateBreakdown?.map((sb, idx) => (
                    <div key={idx} className="px-3 py-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2">
                      <span className="font-bold text-slate-900">{sb.state}:</span>
                      <span className="text-indigo-700 font-bold">₹{sb.totalAmount.toLocaleString("en-IN")}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({sb.count} emps)</span>
                    </div>
                  ))}
                  {(!reportData.summary.stateBreakdown || reportData.summary.stateBreakdown.length === 0) && (
                    <span className="text-xs text-slate-400">No state breakdown available.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 border rounded-2xl bg-white">
              Fetching Professional Tax register...
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs bg-white">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider">Employee</th>
                    <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider">Department</th>
                    <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider">State Jurisdiction</th>
                    <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-right">PT Amount Deducted</th>
                    <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider">Filing Status & Challan</th>
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
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        <span className="px-2 py-0.5 bg-slate-100 border rounded text-[11px]">
                          {rec.state || "Madhya Pradesh"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-900 text-sm">
                        ₹{Number(rec.ptAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
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
                            Challan: {rec.challanNumber}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-slate-400">
                        No Professional Tax deduction records found for {month} {year}.
                        <p className="text-[11px] text-slate-400 mt-1">
                          Ensure monthly payroll has been calculated with PT enabled.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Tab 2: State Slabs & Rules */}
      {activeTab === "rules" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800">Active State Slabs Configuration</h3>
            <span className="text-xs text-slate-400">{rules.length} rule(s) configured</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs bg-white">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider">State / Jurisdiction</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-right">Min Monthly Salary</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-right">Max Monthly Salary</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-right">PT Deduction Amount</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider">Effective From</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-bold text-slate-900">{rule.state}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">
                      ₹{Number(rule.minSalary).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">
                      {Number(rule.maxSalary) >= 9999999 ? "Above / No Limit" : `₹${Number(rule.maxSalary).toLocaleString("en-IN")}`}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-indigo-700 text-sm">
                      ₹{Number(rule.taxAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}/mo
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">
                      {rule.effectiveFrom ? new Date(rule.effectiveFrom).toLocaleDateString() : "--"}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditRule(rule)}
                        className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {rules.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-400">
                      No statutory PT slabs found for this filter. Click "+ Add State Slab" to configure.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Challan Modal */}
      {showChallanModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-slate-800">Record Professional Tax Challan</h3>
              <button
                onClick={() => setShowChallanModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveChallan} className="space-y-3.5 text-xs">
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
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">State Jurisdiction</label>
                <select
                  value={challanState}
                  onChange={(e) => setChallanState(e.target.value)}
                  className="w-full border rounded-xl p-2.5 text-xs font-semibold"
                >
                  <option value="">All States in Period</option>
                  {COMMON_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Challan / Treasury Reference <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. MP-PT-2026-CH-99218"
                  value={challanNumber}
                  onChange={(e) => setChallanNumber(e.target.value)}
                  required
                  className="w-full border rounded-xl p-2.5 font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Payment Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="w-full border rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Filing Status</label>
                <select
                  value={challanStatus}
                  onChange={(e) => setChallanStatus(e.target.value)}
                  className="w-full border rounded-xl p-2.5 text-xs font-bold"
                >
                  <option value="Filed">Filed (Returns Submitted)</option>
                  <option value="Paid">Paid (Treasury Receipt Confirmed)</option>
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
                  disabled={savingChallan}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-sm disabled:opacity-50"
                >
                  {savingChallan ? "Updating..." : "Save Challan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rule Create / Edit Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-slate-800">
                {editingRuleId ? "Edit State PT Slab" : "Create State PT Slab"}
              </h3>
              <button
                onClick={() => setShowRuleModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">State / Jurisdiction</label>
                <input
                  type="text"
                  value={ruleState}
                  onChange={(e) => setRuleState(e.target.value)}
                  placeholder="e.g. Madhya Pradesh"
                  required
                  className="w-full border rounded-xl p-2.5 text-xs font-bold focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Min Salary (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={ruleMinSalary}
                    onChange={(e) => setRuleMinSalary(e.target.value)}
                    required
                    className="w-full border rounded-xl p-2.5 text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Max Salary (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="9999999"
                    value={ruleMaxSalary}
                    onChange={(e) => setRuleMaxSalary(e.target.value)}
                    required
                    className="w-full border rounded-xl p-2.5 text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Monthly PT Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 208.33"
                  value={ruleTaxAmount}
                  onChange={(e) => setRuleTaxAmount(e.target.value)}
                  required
                  className="w-full border rounded-xl p-2.5 text-xs font-bold text-indigo-700 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Effective From</label>
                <input
                  type="date"
                  value={ruleEffectiveFrom}
                  onChange={(e) => setRuleEffectiveFrom(e.target.value)}
                  required
                  className="w-full border rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRule}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-sm disabled:opacity-50"
                >
                  {savingRule ? "Saving..." : (editingRuleId ? "Update Slab" : "Create Slab")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalTax;