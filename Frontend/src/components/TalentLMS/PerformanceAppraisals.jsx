import React, { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../../services/hrApi";

const PerformanceAppraisals = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [appraisals, setAppraisals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [selectedAppraisal, setSelectedAppraisal] = useState(null);

  // Forms
  const [selectedEmp, setSelectedEmp] = useState("");
  const [selectedCycle, setSelectedCycle] = useState("");
  const [reviewType, setReviewType] = useState("Annual");

  const [selfRating, setSelfRating] = useState("");
  const [selfComment, setSelfComment] = useState("");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [achievements, setAchievements] = useState("");
  const [showSelfModal, setShowSelfModal] = useState(null);

  const [managerRating, setManagerRating] = useState("");
  const [managerComment, setManagerComment] = useState("");
  const [strengthsMgr, setStrengthsMgr] = useState("");
  const [improvementMgr, setImprovementMgr] = useState("");
  const [recommendationMgr, setRecommendationMgr] = useState("Retain");
  const [showManagerModal, setShowManagerModal] = useState(null);

  const [hrRating, setHrRating] = useState("");
  const [hrComment, setHrComment] = useState("");
  const [showHrModal, setShowHrModal] = useState(null);

  // 360 Feedback
  const [peerRating, setPeerRating] = useState("");
  const [peerComment, setPeerComment] = useState("");
  const [show360Modal, setShow360Modal] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/performance/appraisals");
      if (res && res.data) setAppraisals(res.data);

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
  }, []);

  const filteredAppraisals = useMemo(() => {
    if (activeTab === "self") return appraisals.filter(a => a.status === "Draft" || a.status === "Self Review Pending");
    if (activeTab === "manager") return appraisals.filter(a => a.status === "Submitted" || a.status === "Manager Review Pending");
    if (activeTab === "360") return appraisals.filter(a => a.status === "360 Pending");
    if (activeTab === "completed") return appraisals.filter(a => a.status === "Completed" || a.status === "Acknowledged");
    return appraisals;
  }, [appraisals, activeTab]);

  const handleInitiate = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/api/performance/appraisals", {
        method: "POST",
        body: JSON.stringify({
          employeeId: selectedEmp,
          performanceMasterId: selectedCycle,
          reviewType
        })
      });
      alert("Appraisal workflow initiated successfully!");
      setShowInitiateModal(false);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to initiate appraisal.");
    }
  };

  const handleSelfSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/performance/appraisals/${showSelfModal.id}/self-assessment`, {
        method: "POST",
        body: JSON.stringify({
          selfRating: parseFloat(selfRating),
          selfComment,
          strengths,
          weaknesses,
          achievements
        })
      });
      alert("Self assessment submitted!");
      setShowSelfModal(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleManagerSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/performance/appraisals/${showManagerModal.id}/manager-review`, {
        method: "POST",
        body: JSON.stringify({
          managerRating: parseFloat(managerRating),
          managerComment,
          strengths: strengthsMgr,
          weaknesses: improvementMgr,
          achievements: recommendationMgr
        })
      });
      alert("Manager review submitted successfully!");
      setShowManagerModal(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handle360Submit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/table/performance_appraisals/${show360Modal.id}`, {
        method: "PUT",
        body: JSON.stringify({
          strengths: `[360 Feedback Rating: ${peerRating}] ` + peerComment,
          status: "Manager Review Pending"
        })
      });
      alert("360 Feedback registered successfully!");
      setShow360Modal(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleHrSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/performance/appraisals/${showHrModal.id}/hr-review`, {
        method: "POST",
        body: JSON.stringify({
          hrRating: parseFloat(hrRating),
          hrComment
        })
      });
      alert("HR review finalized and overall rating locked!");
      setShowHrModal(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReopen = async (id) => {
    if (!window.confirm("Are you sure you want to reopen this appraisal review?")) return;
    try {
      await apiFetch(`/api/table/performance_appraisals/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "Draft" })
      });
      alert("Appraisal review cycle reopened.");
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Appraisal Evaluations Workspace</h2>
          <p className="text-xs text-slate-500">Initiate evaluations, collect peer feedback, run manager checks, and validate ratings.</p>
        </div>
        <button
          onClick={() => setShowInitiateModal(true)}
          className="px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow-2xs"
        >
          + Initiate Appraisal
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-bold gap-4 overflow-x-auto pb-1.5">
        {[
          { key: "all", label: "All Reviews" },
          { key: "self", label: "Self Appraisal Pending" },
          { key: "manager", label: "Manager Review Pending" },
          { key: "360", label: "360 Feedback" },
          { key: "completed", label: "Completed Reviews" }
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

      {loading && <div className="text-center text-xs text-slate-400 py-8">Loading evaluations...</div>}

      {!loading && (
        <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-xs">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs bg-white">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase">Employee</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase">Cycle / Period</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase">Review Type</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase text-center">Self Score</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase text-center">Manager Score</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase text-right">Overall Score</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase font-mono">Status</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
              {filteredAppraisals.map(appr => (
                <tr key={appr.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-800 block">{appr.employee?.employeeName}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">{appr.employee?.employeeCode || appr.employee?.emp_code || 'No Code'}</span>
                  </td>
                  <td className="px-4 py-3">{appr.reviewCycle?.cycleName || '--'}</td>
                  <td className="px-4 py-3 text-slate-600 font-semibold">{appr.reviewType || 'Annual'}</td>
                  <td className="px-4 py-3 text-center font-bold text-indigo-600">{appr.selfRating > 0 ? appr.selfRating : '--'}</td>
                  <td className="px-4 py-3 text-center font-bold text-emerald-600">{appr.managerRating > 0 ? appr.managerRating : '--'}</td>
                  <td className="px-4 py-3 text-right font-black text-rose-700">{appr.finalRating > 0 ? `★ ${appr.finalRating}` : '--'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded font-bold text-[9px] border uppercase">
                      {appr.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap space-x-2 font-bold text-indigo-600">
                    {appr.status === 'Draft' && (
                      <button onClick={() => { setShowSelfModal(appr); setSelfRating(appr.selfRating); }} className="hover:text-indigo-800">Self Eval</button>
                    )}
                    {appr.status === 'Submitted' && (
                      <>
                        <button onClick={() => { setShowManagerModal(appr); setManagerRating(appr.managerRating); }} className="text-emerald-600 hover:text-emerald-800">Manager Rev</button>
                        <button onClick={() => setShow360Modal(appr)} className="text-cyan-600 hover:text-cyan-800">360° Feedback</button>
                      </>
                    )}
                    {appr.status === 'Manager_Reviewed' && (
                      <button onClick={() => { setShowHrModal(appr); setHrRating(appr.hrRating); }} className="text-rose-600 hover:text-rose-800">HR Audit</button>
                    )}
                    {(appr.status === 'Completed' || appr.status === 'Acknowledged') && (
                      <button onClick={() => handleReopen(appr.id)} className="text-red-500 hover:text-red-700">Reopen</button>
                    )}
                    <button onClick={() => setSelectedAppraisal(appr)} className="text-slate-400 hover:text-slate-600">Details</button>
                  </td>
                </tr>
              ))}
              {filteredAppraisals.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-slate-400 font-semibold">No appraisals found in this list category.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Initiate Appraisal Modal */}
      {showInitiateModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleInitiate} className="bg-white rounded-2xl border max-w-sm w-full p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 border-b pb-2">Initiate Appraisal</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select Employee</label>
                <select value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)} className="w-full border rounded-lg p-2.5 bg-white font-semibold" required>
                  <option value="">-- Choose Employee --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.employeeName}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select Cycle</label>
                <select value={selectedCycle} onChange={(e) => setSelectedCycle(e.target.value)} className="w-full border rounded-lg p-2.5 bg-white font-semibold" required>
                  <option value="">-- Choose Cycle --</option>
                  {cycles.map(c => <option key={c.id} value={c.id}>{c.cycleName}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Review Type</label>
                <select value={reviewType} onChange={(e) => setReviewType(e.target.value)} className="w-full border rounded-lg p-2.5 bg-white font-semibold">
                  <option value="Annual">Annual</option>
                  <option value="Half-Yearly">Half-Yearly</option>
                  <option value="Quarterly">Quarterly</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-3">
              <button type="button" onClick={() => setShowInitiateModal(false)} className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700">Initiate Workflow</button>
            </div>
          </form>
        </div>
      )}

      {/* Self Assessment Form */}
      {showSelfModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleSelfSubmit} className="bg-white rounded-2xl border max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-sm text-slate-900 border-b pb-2">Self Appraisal Review Form</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Self Rating (1.00 - 5.00)</label>
                <input type="number" step="0.01" value={selfRating} onChange={(e) => setSelfRating(e.target.value)} className="w-full border rounded-lg p-2 bg-slate-50 font-bold" required />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Evaluation Comments</label>
                <textarea value={selfComment} onChange={(e) => setSelfComment(e.target.value)} placeholder="Type feedback comments..." className="w-full border rounded-lg p-2 bg-slate-50 h-16" required />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Strengths</label>
                <textarea value={strengths} onChange={(e) => setStrengths(e.target.value)} placeholder="Log core competencies..." className="w-full border rounded-lg p-2 bg-slate-50 h-12" />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Development Areas</label>
                <textarea value={weaknesses} onChange={(e) => setWeaknesses(e.target.value)} placeholder="Weaknesses/improvement notes..." className="w-full border rounded-lg p-2 bg-slate-50 h-12" />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Achievements</label>
                <textarea value={achievements} onChange={(e) => setAchievements(e.target.value)} placeholder="Log achievements during cycle..." className="w-full border rounded-lg p-2 bg-slate-50 h-12" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-3">
              <button type="button" onClick={() => setShowSelfModal(null)} className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700">Submit Self appraisal</button>
            </div>
          </form>
        </div>
      )}

      {/* Manager Evaluation Form */}
      {showManagerModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleManagerSubmit} className="bg-white rounded-2xl border max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-sm text-slate-900 border-b pb-2">Manager Performance Assessment</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Manager Rating (1.00 - 5.00)</label>
                <input type="number" step="0.01" value={managerRating} onChange={(e) => setManagerRating(e.target.value)} className="w-full border rounded-lg p-2 bg-slate-50 font-bold" required />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Manager Remarks / Feedback</label>
                <textarea value={managerComment} onChange={(e) => setManagerComment(e.target.value)} placeholder="Type review comments..." className="w-full border rounded-lg p-2 bg-slate-50 h-16" required />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Strengths Identified</label>
                <textarea value={strengthsMgr} onChange={(e) => setStrengthsMgr(e.target.value)} placeholder="Observed core strengths..." className="w-full border rounded-lg p-2 bg-slate-50 h-12" />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Improvement Objectives</label>
                <textarea value={improvementMgr} onChange={(e) => setImprovementMgr(e.target.value)} placeholder="Development milestones..." className="w-full border rounded-lg p-2 bg-slate-50 h-12" />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Final Recommendation</label>
                <select value={recommendationMgr} onChange={(e) => setRecommendationMgr(e.target.value)} className="w-full border rounded-lg p-2.5 bg-white font-semibold">
                  <option value="Retain">Retain / Standard Cycle</option>
                  <option value="Promote">Promote / Recommend Increment</option>
                  <option value="PIP">Put on PIP</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-3">
              <button type="button" onClick={() => setShowManagerModal(null)} className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700">Submit Review</button>
            </div>
          </form>
        </div>
      )}

      {/* 360 Feedback Modal */}
      {show360Modal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handle360Submit} className="bg-white rounded-2xl border max-w-sm w-full p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 border-b pb-2">360° Peer Feedback Form</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Peer rating score (1.00 - 5.00)</label>
                <input type="number" step="0.01" value={peerRating} onChange={(e) => setPeerRating(e.target.value)} className="w-full border rounded-lg p-2 bg-slate-50 font-bold" required />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Peer evaluation comments</label>
                <textarea value={peerComment} onChange={(e) => setPeerComment(e.target.value)} placeholder="Observations on peer collaboration..." className="w-full border rounded-lg p-2 bg-slate-50 h-20" required />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-3">
              <button type="button" onClick={() => setShow360Modal(null)} className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700">Confirm Feedback</button>
            </div>
          </form>
        </div>
      )}

      {/* HR Review Modal */}
      {showHrModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleHrSubmit} className="bg-white rounded-2xl border max-w-sm w-full p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 border-b pb-2">HR Rating Finalization</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">HR Auditor rating score (1-5)</label>
                <input type="number" step="0.01" value={hrRating} onChange={(e) => setHrRating(e.target.value)} className="w-full border rounded-lg p-2 bg-slate-50 font-bold" required />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">HR Audit notes</label>
                <textarea value={hrComment} onChange={(e) => setHrComment(e.target.value)} placeholder="Specify parameters..." className="w-full border rounded-lg p-2 bg-slate-50 h-20" required />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-3">
              <button type="button" onClick={() => setShowHrModal(null)} className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700">Confirm Final Rating</button>
            </div>
          </form>
        </div>
      )}

      {/* Appraisal Details Modal */}
      {selectedAppraisal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Appraisal Review Detail Sheet</h3>
                <p className="text-[10px] text-slate-400 font-bold">Status: {selectedAppraisal.status} | Final Score: ★ {selectedAppraisal.finalRating || '--'}</p>
              </div>
              <button onClick={() => setSelectedAppraisal(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕ Close</button>
            </div>

            <div className="grid grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Employee</span>
                <span className="font-bold text-slate-800">{selectedAppraisal.employee?.employeeName}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Cycle</span>
                <span className="font-bold text-slate-800">{selectedAppraisal.reviewCycle?.cycleName}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Review Type</span>
                <span className="font-bold text-slate-800">{selectedAppraisal.reviewType || 'Annual'}</span>
              </div>
            </div>

            {/* Core Evaluations Panels */}
            <div className="space-y-4 text-xs">
              <div className="border-b pb-2">
                <span className="font-bold text-slate-800 block mb-1">Key Evaluation Parameters</span>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-bold text-slate-400 block">Goal Achievement Rating</span>
                    <p className="font-bold text-indigo-700">75% Completion Rate</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 block">KPI Achievement Rating</span>
                    <p className="font-bold text-cyan-700">82.5% On Track</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-b pb-2">
                <div>
                  <span className="font-bold text-slate-500 block">Self Rating / Comments:</span>
                  <p className="font-bold text-slate-800">★ {selectedAppraisal.selfRating || '0.00'}</p>
                  <p className="text-slate-600 italic">"{selectedAppraisal.selfComment || 'No comments'}"</p>
                </div>
                <div>
                  <span className="font-bold text-slate-500 block">Manager Rating / Comments:</span>
                  <p className="font-bold text-slate-800">★ {selectedAppraisal.managerRating || '0.00'}</p>
                  <p className="text-slate-600 italic">"{selectedAppraisal.managerComment || 'No comments'}"</p>
                </div>
                <div>
                  <span className="font-bold text-slate-500 block">HR Rating / Comments:</span>
                  <p className="font-bold text-slate-800">★ {selectedAppraisal.hrRating || '0.00'}</p>
                  <p className="text-slate-600 italic">"{selectedAppraisal.hrComment || 'No comments'}"</p>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1">Observation Metrics</span>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border text-slate-600">
                  <div>
                    <span className="font-bold text-slate-500 block">Strengths</span>
                    <p>{selectedAppraisal.strengths || "Collaborative, technically proficient"}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block">Areas of Development</span>
                    <p>{selectedAppraisal.weaknesses || "Technical leadership, time management"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceAppraisals;
