import React, { useState, useEffect } from "react";
import { apiFetch } from "../../services/hrApi";

const PerformancePromotions = () => {
  const [activeTab, setActiveTab] = useState("requests");
  const [promotions, setPromotions] = useState([]);
  const [pips, setPips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showPipModal, setShowPipModal] = useState(false);

  // Promo Recommend Form
  const [selectedEmp, setSelectedEmp] = useState("");
  const [proposedDesig, setProposedDesig] = useState("");
  const [currentGrade, setCurrentGrade] = useState("Grade B");
  const [proposedGrade, setProposedGrade] = useState("Grade A");
  const [perfRating, setPerfRating] = useState("4.20");
  const [reason, setReason] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");

  // PIP Form
  const [pipEmp, setPipEmp] = useState("");
  const [issues, setIssues] = useState("");
  const [objectives, setObjectives] = useState("");
  const [actionItems, setActionItems] = useState("");
  const [pipStart, setPipStart] = useState("");
  const [pipEnd, setPipEnd] = useState("");
  const [frequency, setFrequency] = useState("Weekly");
  const [pipManager, setPipManager] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/performance/reports?type=promotions");
      if (res && res.data) setPromotions(res.data);

      const pipRes = await apiFetch("/api/table/performance_improvement_plans");
      if (pipRes && pipRes.data) setPips(pipRes.data);

      const empRes = await apiFetch("/api/table/employees");
      if (empRes?.data) setEmployees(empRes.data);

      const desigRes = await apiFetch("/api/table/designations");
      if (desigRes?.data) setDesignations(desigRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleRecommendPromo = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/api/performance/promotions", {
        method: "POST",
        body: JSON.stringify({
          employeeId: selectedEmp,
          proposedDesignationId: proposedDesig,
          reason: `[Rating: ${perfRating}] [Grade: ${currentGrade} -> ${proposedGrade}] ` + reason,
          effectiveDate
        })
      });
      alert("Promotion recommended successfully!");
      setShowPromoModal(false);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to recommend promotion.");
    }
  };

  const handleApprovePromo = async (id) => {
    if (!window.confirm("Approve this promotion? This will update the employee's designation when effective.")) return;
    try {
      await apiFetch(`/api/performance/promotions/${id}/approve`, { method: "POST" });
      alert("Promotion approved successfully!");
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreatePip = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/api/table/performance_improvement_plans", {
        method: "POST",
        body: JSON.stringify({
          employeeId: pipEmp,
          performanceIssues: issues,
          improvementObjectives: objectives,
          actionItems,
          startDate: pipStart,
          endDate: pipEnd,
          reviewFrequency: frequency,
          assignedManagerId: pipManager || null,
          progress: 0.00,
          status: "Active"
        })
      });
      alert("Performance Improvement Plan (PIP) active!");
      setShowPipModal(false);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to initiate PIP.");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Promotions & PIP Management</h2>
          <p className="text-xs text-slate-500">Log designation recommendations, review approval pipelines, and manage performance improvement plans.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPromoModal(true)}
            className="px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow-2xs"
          >
            + Recommend Promotion
          </button>
          <button
            onClick={() => setShowPipModal(true)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-xl hover:bg-slate-900 shadow-2xs"
          >
            + Initiate PIP
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-bold gap-4 overflow-x-auto pb-1.5">
        {[
          { key: "requests", label: "Promotion Requests" },
          { key: "pip", label: "Performance Improvement Plans (PIP)" },
          { key: "history", label: "Promotion History" }
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

      {loading && <div className="text-center text-xs text-slate-400 py-8">Loading...</div>}

      {!loading && activeTab !== "pip" && (
        <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-xs">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs bg-white">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase">Employee</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase">Proposed Designation</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase">Remarks / Details</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase">Effective Date</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase">Status</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
              {promotions.filter(p => activeTab === "history" ? p.status === "Implemented" : p.status !== "Implemented").map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-800 block">{p.employee?.employeeName}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">Code: {p.employee?.employeeCode || 'N/A'}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-rose-700">{p.proposedDesignation?.desigName || 'Designation'}</td>
                  <td className="px-4 py-3 text-slate-500">{p.reason || '--'}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{p.effectiveDate}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[9px] uppercase">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {p.status === "Pending" && (
                      <button
                        onClick={() => handleApprovePromo(p.id)}
                        className="text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1 rounded"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {promotions.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400 font-semibold">No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* PIP View */}
      {!loading && activeTab === "pip" && (
        <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-xs">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs bg-white">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase">Employee</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase">Issues Identified</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase">Improvement Objectives</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase">Timeline</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase text-center">Progress</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
              {pips.map(pip => {
                const empObj = employees.find(e => e.id === pip.employeeId) || {};
                return (
                  <tr key={pip.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-bold text-slate-800">{empObj.employeeName || 'Employee'}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{pip.performanceIssues}</td>
                    <td className="px-4 py-3 text-indigo-700 max-w-xs truncate">{pip.improvementObjectives}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{pip.startDate} to {pip.endDate}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-center justify-center gap-1 w-20 mx-auto">
                        <span className="font-mono text-indigo-600 font-bold">{pip.progress}%</span>
                        <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                          <div className="bg-indigo-600 h-1" style={{ width: `${pip.progress}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-bold text-[9px] uppercase">
                        {pip.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {pips.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400 font-semibold">No active Performance Improvement Plans (PIP).</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Promotion Recommendation Modal */}
      {showPromoModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleRecommendPromo} className="bg-white rounded-2xl border max-w-sm w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-sm text-slate-900 border-b pb-2">Recommend Designation Promotion</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select Employee</label>
                <select value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)} className="w-full border rounded-lg p-2.5 bg-white font-semibold" required>
                  <option value="">-- Choose Employee --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.employeeName}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Proposed Designation</label>
                <select value={proposedDesig} onChange={(e) => setProposedDesig(e.target.value)} className="w-full border rounded-lg p-2.5 bg-white font-semibold" required>
                  <option value="">-- Choose Designation --</option>
                  {designations.map(d => <option key={d.id} value={d.id}>{d.desigName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Current Grade</label>
                  <input type="text" value={currentGrade} onChange={(e) => setCurrentGrade(e.target.value)} className="w-full border rounded-lg p-2 bg-slate-50" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Proposed Grade</label>
                  <input type="text" value={proposedGrade} onChange={(e) => setProposedGrade(e.target.value)} className="w-full border rounded-lg p-2 bg-slate-50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Performance Score</label>
                  <input type="text" value={perfRating} onChange={(e) => setPerfRating(e.target.value)} className="w-full border rounded-lg p-2 bg-slate-50 font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Effective Date</label>
                  <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className="w-full border rounded-lg p-2.5 bg-slate-50" required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Reason / Details</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Type criteria comments..." className="w-full border rounded-lg p-2.5 h-16" required />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-3">
              <button type="button" onClick={() => setShowPromoModal(false)} className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700">Submit recommendation</button>
            </div>
          </form>
        </div>
      )}

      {/* PIP Initiation Modal */}
      {showPipModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleCreatePip} className="bg-white rounded-2xl border max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-sm text-slate-900 border-b pb-2">Initiate Performance Improvement Plan (PIP)</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select Employee</label>
                <select value={pipEmp} onChange={(e) => setPipEmp(e.target.value)} className="w-full border rounded-lg p-2.5 bg-white font-semibold" required>
                  <option value="">-- Choose Employee --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.employeeName}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Performance Issues</label>
                <textarea value={issues} onChange={(e) => setIssues(e.target.value)} placeholder="Describe observed issues..." className="w-full border rounded-lg p-2.5 h-16" required />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Improvement Objectives</label>
                <textarea value={objectives} onChange={(e) => setObjectives(e.target.value)} placeholder="State target behaviors..." className="w-full border rounded-lg p-2.5 h-14" required />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Action Items</label>
                <textarea value={actionItems} onChange={(e) => setActionItems(e.target.value)} placeholder="Action items list..." className="w-full border rounded-lg p-2.5 h-14" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Start Date</label>
                  <input type="date" value={pipStart} onChange={(e) => setPipStart(e.target.value)} className="w-full border rounded-lg p-2.5 bg-slate-50" required />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">End Date</label>
                  <input type="date" value={pipEnd} onChange={(e) => setPipEnd(e.target.value)} className="w-full border rounded-lg p-2.5 bg-slate-50" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Review Frequency</label>
                  <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full border rounded-lg p-2.5 bg-white font-semibold">
                    <option value="Weekly">Weekly Check-in</option>
                    <option value="Bi-weekly">Bi-weekly Check-in</option>
                    <option value="Monthly">Monthly Check-in</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Assigned Manager Coordinator</label>
                  <select value={pipManager} onChange={(e) => setPipManager(e.target.value)} className="w-full border rounded-lg p-2.5 bg-white font-semibold">
                    <option value="">-- Choose Manager --</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.employeeName}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-3">
              <button type="button" onClick={() => setShowPipModal(false)} className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900">Initiate PIP</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PerformancePromotions;
