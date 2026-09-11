import React, { useState, useEffect } from "react";
import { apiFetch } from "../../services/hrApi";

const ProfessionalTax = () => {
  const [reportData, setReportData] = useState(null);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("report"); // 'report' | 'rules' | 'create_rule'

  // Filters
  const [month, setMonth] = useState("January");
  const [year, setYear] = useState("2026");

  // Rule Form
  const [state, setState] = useState("Maharashtra");
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "report") {
        const q = new URLSearchParams({ month, year }).toString();
        const res = await apiFetch(`/api/finance/professional-tax/report?${q}`);
        if (res && res.data) {
          setReportData(res.data);
        }
      } else if (activeTab === "rules") {
        const res = await apiFetch("/api/finance/professional-tax/rules");
        if (res && res.data) {
          setRules(res.data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, month, year]);

  const handleCreateRule = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/api/finance/professional-tax/rules", {
        method: "POST",
        body: JSON.stringify({
          state,
          minSalary: parseFloat(minSalary),
          maxSalary: parseFloat(maxSalary),
          taxAmount: parseFloat(taxAmount),
          effectiveFrom
        })
      });
      alert("Professional Tax rule created successfully!");
      setMinSalary("");
      setMaxSalary("");
      setTaxAmount("");
      setEffectiveFrom("");
      setActiveTab("rules");
    } catch (err) {
      alert(err.message || "Failed to create PT rule.");
    }
  };

  const handleExport = () => {
    window.open(`http://localhost:5000/api/finance/reports/export?type=pt&month=${month}&year=${year}`, "_blank");
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Professional Tax (PT)</h2>
          <p className="text-xs text-slate-500">Configure state-wise PT brackets and check monthly PT deductions details.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "report" && (
            <button
              onClick={handleExport}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50"
            >
              Export Report (CSV)
            </button>
          )}
          <div className="flex border rounded-xl overflow-hidden">
            {["report", "rules", "create_rule"].map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-3 py-1.5 text-xs font-bold ${
                  activeTab === t ? "bg-indigo-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {t === "report" ? "Monthly Report" : t === "rules" ? "State Rules" : "+ Add Rule"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === "report" && (
        <>
          {/* Filters bar */}
          <div className="flex gap-3 bg-slate-50 p-4 border rounded-2xl">
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="text-xs border rounded-lg p-2 bg-white font-bold text-slate-700">
              {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select value={year} onChange={(e) => setYear(e.target.value)} className="text-xs border rounded-lg p-2 bg-white font-bold text-slate-700">
              {["2025", "2026", "2027"].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Stats Cards */}
          {reportData && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Covered Employees count", val: reportData.summary?.totalEmployees || 0, color: "bg-indigo-50 border-indigo-100 text-indigo-700" },
                { label: "Total PT Deducted", val: `₹${(reportData.summary?.totalPtAmount || 0).toLocaleString('en-IN')}`, color: "bg-emerald-50 border-emerald-100 text-emerald-700" },
                { label: "Active States Configured", val: Object.keys(reportData.summary?.stateBreakdown || {}).length, color: "bg-sky-50 border-sky-100 text-sky-700" }
              ].map((c, i) => (
                <div key={i} className={`p-4 border rounded-2xl flex flex-col justify-between ${c.color} shadow-2xs`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">{c.label}</span>
                  <span className="text-xl font-extrabold mt-2 block">{c.val}</span>
                </div>
              ))}
            </div>
          )}

          {loading && <div className="text-center text-xs text-slate-400 py-8">Compiling report...</div>}

          {!loading && reportData && (
            <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-xs">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs bg-white">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider">Employee Name</th>
                    <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider">State Code</th>
                    <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-right">PT Amount Deducted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reportData.records?.map((rec, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-bold text-slate-800">{rec.employeeName}</td>
                      <td className="px-4 py-3 text-slate-600 font-semibold">{rec.state}</td>
                      <td className="px-4 py-3 text-right font-black text-indigo-700">₹{Number(rec.ptAmount).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  {(!reportData.records || reportData.records.length === 0) && (
                    <tr>
                      <td colSpan="3" className="text-center py-10 text-slate-400">
                        No PT deductions found for this period. Ensure payroll has been processed.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === "rules" && (
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Active State Slabs</h3>
          {loading && <div className="text-xs text-slate-400">Loading rules...</div>}
          
          <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-xs">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs bg-white">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider">State</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-right">Salary Band Start (Min)</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-right">Salary Band End (Max)</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-right">Deducted PT Amount</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider">Effective From</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rules.map((rule, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-bold text-slate-800">{rule.state}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-600">₹{Number(rule.minSalary).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-600">{parseFloat(rule.maxSalary) > 9000000 ? 'No Max Limit' : `₹${Number(rule.maxSalary).toLocaleString('en-IN')}`}</td>
                    <td className="px-4 py-3 text-right font-black text-indigo-700">₹{Number(rule.taxAmount).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-slate-600 font-semibold">{rule.effectiveFrom}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "create_rule" && (
        <form onSubmit={handleCreateRule} className="bg-white border rounded-2xl p-6 space-y-6 max-w-md mx-auto shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 border-b pb-2">Define Professional Tax State Bracket</h3>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full text-xs border rounded-lg p-2.5 bg-white font-bold"
                required
              >
                {["Maharashtra", "Karnataka", "Tamil Nadu", "West Bengal", "Gujarat", "Delhi NCR", "Telangana", "Kerala", "Madhya Pradesh"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Salary Band Min (₹)</label>
              <input
                type="number"
                value={minSalary}
                onChange={(e) => setMinSalary(e.target.value)}
                placeholder="e.g. 10001"
                className="w-full text-xs border rounded-lg p-2.5 bg-slate-50 focus:bg-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Salary Band Max (₹)</label>
              <input
                type="number"
                value={maxSalary}
                onChange={(e) => setMaxSalary(e.target.value)}
                placeholder="e.g. 9999999"
                className="w-full text-xs border rounded-lg p-2.5 bg-slate-50 focus:bg-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Deducted PT Amount (₹/Month)</label>
              <input
                type="number"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
                placeholder="e.g. 200"
                className="w-full text-xs border rounded-lg p-2.5 bg-slate-50 focus:bg-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Effective From Date</label>
              <input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="w-full text-xs border rounded-lg p-2.5 bg-slate-50 focus:bg-white"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 shadow-2xs"
          >
            Save PT Bracket
          </button>
        </form>
      )}
    </div>
  );
};

export default ProfessionalTax;
