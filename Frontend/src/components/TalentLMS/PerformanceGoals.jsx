import React, { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../../services/hrApi";

const PerformanceGoals = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [goals, setGoals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form: Create Goal/OKR
  const [title, setTitle] = useState("");
  const [goalType, setGoalType] = useState("Standard"); // Standard / OKR
  const [objective, setObjective] = useState("");
  const [keyResult, setKeyResult] = useState("");
  const [category, setCategory] = useState("Technical");
  const [priority, setPriority] = useState("Medium");
  const [weightage, setWeightage] = useState("");
  const [target, setTarget] = useState("");
  const [startDate, setStartDate] = useState("2026-04-01");
  const [endDate, setEndDate] = useState("2027-03-31");
  const [selectedEmp, setSelectedEmp] = useState("");
  const [selectedManager, setSelectedManager] = useState("");
  const [selectedCycle, setSelectedCycle] = useState("");
  const [remarks, setRemarks] = useState("");

  // Form: Log progress
  const [progress, setProgress] = useState("");
  const [comments, setComments] = useState("");
  const [supportingDocument, setSupportingDocument] = useState("");
  const [showProgressModal, setShowProgressModal] = useState(null);

  // Form: Review
  const [showReviewModal, setShowReviewModal] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("Approved");
  const [reviewComments, setReviewComments] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/performance/goals");
      if (res && res.data) setGoals(res.data);

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

  const filteredGoals = useMemo(() => {
    if (activeTab === "okrs") {
      return goals.filter(g => g.description && g.description.includes("[OKR]"));
    }
    // Simplification for other tabs in this view (standard demo layout filtering)
    return goals;
  }, [goals, activeTab]);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    const descText = goalType === "OKR" ? `[OKR] Obj: ${objective} | KR: ${keyResult}` : remarks;
    try {
      await apiFetch("/api/performance/goals", {
        method: "POST",
        body: JSON.stringify({
          title,
          description: descText,
          target,
          priority,
          weightage: parseInt(weightage),
          employeeId: selectedEmp,
          performanceMasterId: selectedCycle,
          startDate,
          endDate
        })
      });
      alert("Goal / OKR created successfully!");
      setShowAddModal(false);
      setTitle("");
      setObjective("");
      setKeyResult("");
      setRemarks("");
      setTarget("");
      setWeightage("");
      loadData();
    } catch (err) {
      alert(err.message || "Failed to create Goal.");
    }
  };

  const handleUpdateProgress = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/performance/goals/${showProgressModal.id}/progress`, {
        method: "PATCH",
        body: JSON.stringify({
          progress: parseFloat(progress),
          comments,
          supportingDocument
        })
      });
      alert("Goal progress logged successfully!");
      setShowProgressModal(null);
      setProgress("");
      setComments("");
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/performance/goals/${showReviewModal.id}/approve`, {
        method: "POST",
        body: JSON.stringify({
          status: reviewStatus,
          comments: reviewComments
        })
      });
      alert("Goal review saved!");
      setShowReviewModal(null);
      setReviewComments("");
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Goals & OKRs</h2>
          <p className="text-xs text-slate-500">Track company objectives, key results (OKRs), and individual team goal sheets.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow-2xs"
        >
          + Create Goal / OKR
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-bold gap-4 overflow-x-auto pb-1.5">
        {[
          { key: "all", label: "All Goals" },
          { key: "my", label: "My Goals" },
          { key: "team", label: "Team Goals" },
          { key: "okrs", label: "Objectives & Key Results (OKRs)" }
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

      {loading && <div className="text-center text-xs text-slate-400 py-8">Loading goals...</div>}

      {!loading && (
        <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-xs">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs bg-white">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase">Goal / OKR Title</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase">Employee</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase">Cycle / Due Date</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase text-right">Target</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase text-right">Weightage</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase text-center">Progress</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase">Priority</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase">Status</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
              {filteredGoals.map(goal => (
                <tr key={goal.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-800 block">{goal.title}</span>
                    <span className="text-[10px] text-slate-400 block max-w-xs truncate">{goal.description}</span>
                  </td>
                  <td className="px-4 py-3">{goal.employee?.employeeName}</td>
                  <td className="px-4 py-3">
                    <span className="block text-slate-700">{goal.reviewCycle?.cycleName || '--'}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">Due: {goal.endDate}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">{goal.target || "100% completion"}</td>
                  <td className="px-4 py-3 text-right font-mono">{goal.weightage}%</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-center justify-center gap-1 w-20 mx-auto">
                      <span className="font-mono text-indigo-600 font-bold">{goal.progress}%</span>
                      <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                        <div className="bg-indigo-600 h-1" style={{ width: `${goal.progress}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                      goal.priority === 'High' ? 'bg-red-50 text-red-700 border-red-200' :
                      goal.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {goal.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded font-bold text-[9px] border uppercase ${
                      goal.status === 'Approved' || goal.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' :
                      goal.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {goal.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap space-x-2 font-bold text-indigo-600">
                    <button onClick={() => { setShowProgressModal(goal); setProgress(goal.progress); }} className="hover:text-indigo-800">Update</button>
                    {goal.status !== 'Approved' && (
                      <button onClick={() => setShowReviewModal(goal)} className="text-emerald-600 hover:text-emerald-800">Review</button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredGoals.length === 0 && (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-slate-400 font-semibold">No objectives found under this view.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleCreateGoal} className="bg-white rounded-2xl border max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-sm text-slate-900 border-b pb-2">Create Performance Goal / OKR</h3>
            
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Goal Type</label>
                  <select value={goalType} onChange={(e) => setGoalType(e.target.value)} className="w-full border rounded-lg p-2 bg-white font-semibold">
                    <option value="Standard">Standard Goal</option>
                    <option value="OKR">OKR (Objective & Key Result)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Goal Title</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Expand API Throughput" className="w-full border rounded-lg p-2 bg-slate-50" required />
                </div>
              </div>

              {goalType === "OKR" ? (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Core Objective</label>
                    <input type="text" value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Objective statement..." className="w-full border rounded-lg p-2 bg-slate-50" required />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Key Result Metric</label>
                    <input type="text" value={keyResult} onChange={(e) => setKeyResult(e.target.value)} placeholder="Measurable key result..." className="w-full border rounded-lg p-2 bg-slate-50" required />
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Goal Remarks / Description</label>
                  <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Specify parameters..." className="w-full border rounded-lg p-2 bg-slate-50 h-14" />
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border rounded-lg p-2 bg-white font-semibold">
                    <option value="Technical">Technical</option>
                    <option value="Sales">Sales</option>
                    <option value="Leadership">Leadership</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full border rounded-lg p-2 bg-white font-semibold">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Weight %</label>
                  <input type="number" value={weightage} onChange={(e) => setWeightage(e.target.value)} placeholder="20" className="w-full border rounded-lg p-2 bg-slate-50 font-bold" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border rounded-lg p-2 bg-slate-50" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Due Date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border rounded-lg p-2 bg-slate-50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Target Value</label>
                  <input type="text" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. 100% uptime" className="w-full border rounded-lg p-2 bg-slate-50" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Select Employee</label>
                  <select value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)} className="w-full border rounded-lg p-2 bg-white font-semibold" required>
                    <option value="">-- Choose Employee --</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.employeeName}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Assigned Manager</label>
                  <select value={selectedManager} onChange={(e) => setSelectedManager(e.target.value)} className="w-full border rounded-lg p-2 bg-white font-semibold">
                    <option value="">-- Choose Manager --</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.employeeName}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Review Cycle</label>
                  <select value={selectedCycle} onChange={(e) => setSelectedCycle(e.target.value)} className="w-full border rounded-lg p-2 bg-white font-semibold" required>
                    <option value="">-- Choose Cycle --</option>
                    {cycles.map(c => <option key={c.id} value={c.id}>{c.cycleName}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700">Save Objective</button>
            </div>
          </form>
        </div>
      )}

      {/* Progress update Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleUpdateProgress} className="bg-white rounded-2xl border max-w-sm w-full p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 border-b pb-2">Log Goal Progress</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Progress Percentage (%)</label>
                <input type="number" value={progress} onChange={(e) => setProgress(e.target.value)} className="w-full border rounded-lg p-2.5 font-bold" required />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Comments</label>
                <textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Type comments..." className="w-full border rounded-lg p-2.5 h-16" />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Supporting Document URL</label>
                <input type="text" value={supportingDocument} onChange={(e) => setSupportingDocument(e.target.value)} className="w-full border rounded-lg p-2.5" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-3">
              <button type="button" onClick={() => setShowProgressModal(null)} className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700">Save Progress</button>
            </div>
          </form>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleReview} className="bg-white rounded-2xl border max-w-sm w-full p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 border-b pb-2">Review Goal / OKR</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Status Action</label>
                <select value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)} className="w-full border rounded-lg p-2.5 bg-white font-semibold">
                  <option value="Approved">Approve Completion</option>
                  <option value="Rejected">Reject</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Review Feedback</label>
                <textarea value={reviewComments} onChange={(e) => setReviewComments(e.target.value)} placeholder="Type feedback comments..." className="w-full border rounded-lg p-2.5 h-20" required />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-3">
              <button type="button" onClick={() => setShowReviewModal(null)} className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700">Save Review</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PerformanceGoals;
