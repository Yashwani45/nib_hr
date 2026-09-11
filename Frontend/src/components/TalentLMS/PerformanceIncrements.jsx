import React, { useState, useEffect } from "react";
import { apiFetch } from "../../services/hrApi";

const PerformanceIncrements = () => {
  const [activeTab, setActiveTab] = useState("requests");
  const [increments, setIncrements] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form States
  const [selectedEmp, setSelectedEmp] = useState("");
  const [currentSalary, setCurrentSalary] = useState(0);
  const [selectedCycle, setSelectedCycle] = useState("");
  const [performanceScore, setPerformanceScore] = useState("4.00");
  const [incrementPercentage, setIncrementPercentage] = useState("");
  const [incrementAmount, setIncrementAmount] = useState("");
  const [revisedSalary, setRevisedSalary] = useState(0);
  const [effectiveDate, setEffectiveDate] = useState("");
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/performance/reports?type=increments");
      if (res && res.data) setIncrements(res.data);

      const empRes = await apiFetch("/api/table/employees");
      if (empRes?.data) setEmployees(empRes.data);

      const cycleRes = await apiFetch("/api/performance/cycles");
      if (cycleRes?.data) setCycles(cycleRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Handle employee salary lookup
  const handleEmployeeChange = async (empId) => {
    setSelectedEmp(empId);
    if (!empId) {
      setCurrentSalary(0);
      setRevisedSalary(0);
      return;
    }
    try {
      const res = await apiFetch(`/api/table/employee_salary_assignments`);
      if (res && res.data) {
        const active = res.data.find(a => a.employeeId === empId && a.isActive);
        const sal = active ? parseFloat(active.baseGross) : 45000; // fallback default
        setCurrentSalary(sal);
        recalcSalary(sal, incrementPercentage, incrementAmount);
      }
    } catch (e) {
      setCurrentSalary(45000);
      recalcSalary(45000, incrementPercentage, incrementAmount);
    }
  };

  const recalcSalary = (base, pct, amt) => {
    const baseNum = parseFloat(base) || 0;
    const pctNum = parseFloat(pct) || 0;
    const amtNum = parseFloat(amt) || 0;

    let finalAmt = amtNum;
    if (pctNum > 0) {
      finalAmt = (baseNum * pctNum) / 100;
    }
    setRevisedSalary(baseNum + finalAmt);
  };

  const handlePctChange = (val) => {
    setIncrementPercentage(val);
    setIncrementAmount(""); // clear fixed amount to keep them mutually exclusive
    recalcSalary(currentSalary, val, 0);
  };

  const handleAmtChange = (val) => {
    setIncrementAmount(val);
    setIncrementPercentage(""); // clear pct
    recalcSalary(currentSalary, 0, val);
  };

  const handleRecommend = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/api/performance/increments", {
        method: "POST",
        body: JSON.stringify({
          employeeId: selectedEmp,
          incrementPercentage: parseFloat(incrementPercentage || 0),
          incrementAmount: parseFloat(incrementAmount || 0),
          reason: `[Cycle: ${selectedCycle}] [Rating: ${performanceScore}] ` + reason + " | Note: " + remarks,
          effectiveDate,
          performanceScore: parseFloat(performanceScore)
        })
      });
      alert("Increment recommended successfully!");
      setShowAddModal(false);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to recommend increment.");
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this salary increment? This deactivates the current salary assignment and spins up a new version.")) return;
    try {
      await apiFetch(`/api/performance/increments/${id}/approve`, { method: "POST" });
      alert("Increment approved and salary revision activated!");
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Increment Management</h2>
          <p className="text-xs text-slate-500">Configure salary increases based on performance rating evaluations and audit active revisions.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow-2xs"
        >
          + Recommend Increment
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-bold gap-4 overflow-x-auto pb-1.5">
        {[
          { key: "requests", label: "Increment Requests" },
          { key: "history", label: "Increment History" }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`pb-2 border-b-2 px-1 whitespace-nowrap ${
              activeTab === t.key ? "border-rose-600 text-rose-600 font-extrabold" : "border-transparent text-slate-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-center text-xs text-slate-400 py-8">Loading salary revisions...</div>}

      {!loading && (
        <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-xs">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs bg-white">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase">Employee</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase text-right">Current Salary</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase text-center">Score</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase text-right">Increment Details</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase text-right">Revised Salary</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase">Effective Date</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase">Status</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
              {increments.filter(inc => activeTab === "history" ? inc.status === "Implemented" : inc.status !== "Implemented").map(inc => (
                <tr key={inc.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-bold text-slate-800">
                    <span>{inc.employee?.employeeName}</span>
                    <span className="text-[10px] text-slate-400 block max-w-xs truncate">{inc.reason}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">₹{Number(inc.currentSalary).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-center font-bold text-rose-700">★ {inc.performanceScore}</td>
                  <td className="px-4 py-3 text-right">
                    {inc.incrementPercentage > 0 ? (
                      <span className="font-bold text-indigo-600">{inc.incrementPercentage}% Increase</span>
                    ) : (
                      <span className="font-bold text-emerald-600">+₹{Number(inc.incrementAmount).toLocaleString('en-IN')}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-black text-rose-700">₹{Number(inc.newSalary).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{inc.effectiveDate}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[9px] uppercase">
                      {inc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {inc.status === "Pending" && (
                      <button
                        onClick={() => handleApprove(inc.id)}
                        className="text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1 rounded"
                      >
                        Approve / revision
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {increments.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-slate-400 font-semibold">No salary increment items.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleRecommend} className="bg-white rounded-2xl border max-w-sm w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-sm text-slate-900 border-b pb-2">Recommend Increment</h3>
            
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select Employee</label>
                <select value={selectedEmp} onChange={(e) => handleEmployeeChange(e.target.value)} className="w-full border rounded-lg p-2.5 bg-white font-semibold" required>
                  <option value="">-- Choose Employee --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.employeeName}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Current Salary (Base Gross)</label>
                  <input type="text" value={`₹ ${Number(currentSalary).toLocaleString('en-IN')}`} className="w-full border rounded-lg p-2 bg-slate-100 font-bold" readOnly />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Performance Score</label>
                  <input type="number" step="0.01" value={performanceScore} onChange={(e) => setPerformanceScore(e.target.value)} className="w-full border rounded-lg p-2 bg-slate-50 font-bold" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Increment %</label>
                  <input type="number" step="0.01" value={incrementPercentage} onChange={(e) => handlePctChange(e.target.value)} placeholder="10%" className="w-full border rounded-lg p-2 bg-slate-50 font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Fixed Increment Amt (₹)</label>
                  <input type="number" step="0.01" value={incrementAmount} onChange={(e) => handleAmtChange(e.target.value)} placeholder="e.g. 5000" className="w-full border rounded-lg p-2 bg-slate-50 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Revised Salary (Base Gross)</label>
                  <input type="text" value={`₹ ${Number(revisedSalary).toLocaleString('en-IN')}`} className="w-full border rounded-lg p-2 bg-slate-100 font-bold text-rose-600" readOnly />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Effective Date</label>
                  <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className="w-full border rounded-lg p-2.5 bg-slate-50" required />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Review Cycle</label>
                <select value={selectedCycle} onChange={(e) => setSelectedCycle(e.target.value)} className="w-full border rounded-lg p-2.5 bg-white font-semibold" required>
                  <option value="">-- Choose Cycle --</option>
                  {cycles.map(c => <option key={c.id} value={c.id}>{c.cycleName}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Reason / Details</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe details..." className="w-full border rounded-lg p-2.5 h-14" required />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Internal Audit Remarks</label>
                <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Audit remarks..." className="w-full border rounded-lg p-2.5 h-14" />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700">Submit Recommendation</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PerformanceIncrements;
