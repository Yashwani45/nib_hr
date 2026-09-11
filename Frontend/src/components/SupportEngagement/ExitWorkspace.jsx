import React, { useState, useEffect, useMemo } from "react";
import { 
  EyeIcon, 
  ArrowDownTrayIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowUpIcon,
  TrashIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  BookmarkSquareIcon,
  FolderArrowDownIcon,
  UserGroupIcon,
  PlusIcon
} from "@heroicons/react/24/outline";
import { apiFetch } from "../../services/hrApi";

const ExitWorkspace = ({ activeTab, user }) => {
  const [loading, setLoading] = useState(false);
  const userRole = String(user?.role?.roleName || user?.role?.name || user?.role || "").toLowerCase();
  
  // Dashboard states
  const [stats, setStats] = useState({
    totalActive: 0, pendingResignations: 0, noticePeriodCount: 0,
    pendingClearance: 0, pendingAssetReturns: 0, pendingNoDues: 0,
    pendingFnf: 0, pendingInterviews: 0, exitsThisMonth: 0,
    reasons: [], attritionTrend: [], departmentExits: []
  });

  // Data states
  const [resignations, setResignations] = useState([]);
  const [noticePeriods, setNoticePeriods] = useState([]);
  const [clearances, setClearances] = useState([]);
  const [assets, setAssets] = useState([]);
  const [noDuesList, setNoDuesList] = useState([]);
  const [fnfList, setFnfList] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [letters, setLetters] = useState([]);
  const [history, setHistory] = useState([]);
  
  // Lookups
  const [employees, setEmployees] = useState([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Form states
  const [showResModal, setShowResModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showNpModal, setShowNpModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showFnfModal, setShowFnfModal] = useState(false);
  const [showNoDuesModal, setShowNoDuesModal] = useState(false);
  
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [actionComments, setActionComments] = useState("");
  
  // Submission Forms
  const [resForm, setResForm] = useState({
    resignation_date: new Date().toISOString().split("T")[0],
    proposed_lwd: "", reason: "Career Growth", remarks: ""
  });

  const [npForm, setNpForm] = useState({
    revised_lwd: "", early_release: false, notice_buyout: false, buyout_amount: 0, extension_days: 0
  });

  const [clearForm, setClearForm] = useState({ status: "Cleared", remarks: "", rejection_reason: "" });
  const [assetForm, setAssetForm] = useState({ status: "Returned", remarks: "", condition_after: "Good" });
  const [noDuesForm, setNoDuesForm] = useState({ remarks: "" });
  
  const [fnfForm, setFnfForm] = useState({
    settlement_date: new Date().toISOString().split("T")[0],
    salary_due: 0, leave_encashment: 0, bonus: 0, incentives: 0, reimbursements: 0,
    notice_recovery: 0, loan_recovery: 0, asset_recovery: 0, other_deductions: 0, remarks: ""
  });

  const [interviewForm, setInterviewForm] = useState({
    reason_for_leaving: "Compensation", job_satisfaction: 3, manager_feedback: "",
    team_experience: "", work_environment: "", compensation_feedback: "",
    career_growth: "", learning_opportunities: "", work_life_balance: "",
    improvement_suggestions: "", recommend_company: "Yes", rejoin_company: "Yes", additional_comments: ""
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // Load standard employees lookup
      const empRes = await apiFetch("/api/table/employees").catch(() => ({ data: [] }));
      setEmployees(empRes.data || []);

      if (activeTab === "Exit Dashboard") {
        const res = await apiFetch("/api/exit/dashboard");
        setStats(res.data || {});
      } else if (activeTab === "Resignation") {
        const res = await apiFetch("/api/exit/resignations");
        setResignations(res.data || []);
      } else if (activeTab === "Notice Period") {
        const res = await apiFetch("/api/exit/notice-periods");
        setNoticePeriods(res.data || []);
      } else if (activeTab === "Exit Clearance") {
        const res = await apiFetch("/api/exit/clearances");
        setClearances(res.data || []);
      } else if (activeTab === "Asset Return") {
        const res = await apiFetch("/api/exit/assets");
        setAssets(res.data || []);
      } else if (activeTab === "No Dues") {
        const res = await apiFetch("/api/exit/no-dues");
        setNoDuesList(res.data || []);
      } else if (activeTab === "F&F Settlement") {
        const res = await apiFetch("/api/exit/fnf");
        setFnfList(res.data || []);
      } else if (activeTab === "Exit Interview") {
        if (userRole !== "employee") {
          const res = await apiFetch("/api/exit/interviews");
          setInterviews(res.data || []);
        }
      } else if (activeTab === "Experience Letter") {
        const res = await apiFetch("/api/exit/experience-letters");
        setLetters(res.data || []);
      } else if (activeTab === "Exit History") {
        const res = await apiFetch("/api/exit/history");
        setHistory(res.data || []);
      }
    } catch (err) {
      console.error("Exit module load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const empNameMap = useMemo(() => {
    const map = {};
    employees.forEach(e => {
      map[e.employeeCode || e.id] = `${e.firstName || e.employeeName || ""} ${e.lastName || ""}`.trim();
    });
    return map;
  }, [employees]);

  // Submit Resignation
  const handleSubmitResignation = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/api/exit/resignations", {
        method: "POST",
        body: JSON.stringify(resForm)
      });
      setShowResModal(false);
      loadData();
      alert("Resignation submitted successfully!");
    } catch (err) {
      alert("Submission failed: " + err.message);
    }
  };

  // Approve / Reject Resignation
  const handleReviewAction = async (approved) => {
    try {
      const url = `/api/exit/resignations/${selectedRecord.id}/${approved ? 'approve' : 'reject'}`;
      await apiFetch(url, {
        method: "POST",
        body: JSON.stringify({ approved_lwd: resForm.proposed_lwd, remarks: actionComments })
      });
      setShowActionModal(false);
      setActionComments("");
      loadData();
      alert(`Resignation ${approved ? 'approved' : 'rejected'} successfully.`);
    } catch (err) {
      alert("Action failed: " + err.message);
    }
  };

  // Update Notice Period
  const handleUpdateNotice = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/exit/notice-periods/${selectedRecord.id}`, {
        method: "PUT",
        body: JSON.stringify(npForm)
      });
      setShowNpModal(false);
      loadData();
      alert("Notice period revised successfully!");
    } catch (err) {
      alert("Notice update failed: " + err.message);
    }
  };

  // Update Clearance
  const handleUpdateClearance = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/exit/clearances/${selectedRecord.id}`, {
        method: "PUT",
        body: JSON.stringify(clearForm)
      });
      setShowClearModal(false);
      loadData();
      alert("Clearance successfully logged.");
    } catch (err) {
      alert("Clearance failed: " + err.message);
    }
  };

  // Update Asset Return
  const handleUpdateAsset = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/exit/assets/${selectedRecord.id}/return`, {
        method: "PUT",
        body: JSON.stringify(assetForm)
      });
      setShowAssetModal(false);
      loadData();
      alert("Asset return logged successfully.");
    } catch (err) {
      alert("Asset action failed: " + err.message);
    }
  };

  // Approve No Dues
  const handleApproveNoDues = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/exit/no-dues/${selectedRecord.id}/approve`, {
        method: "POST",
        body: JSON.stringify(noDuesForm)
      });
      setShowNoDuesModal(false);
      loadData();
      alert("No Dues completed successfully.");
    } catch (err) {
      alert("No dues action failed: " + err.message);
    }
  };

  // Calculate & Save FNF
  const handleSaveFnf = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/exit/fnf/${selectedRecord.id}`, {
        method: "PUT",
        body: JSON.stringify(fnfForm)
      });
      setShowFnfModal(false);
      loadData();
      alert("Full & Final Settlement details calculated.");
    } catch (err) {
      alert("FNF save failed: " + err.message);
    }
  };

  const handleApproveFnf = async (id) => {
    if (!window.confirm("Approve this F&F settlement?")) return;
    try {
      await apiFetch(`/api/exit/fnf/${id}/approve`, { method: "POST" });
      loadData();
      alert("FNF settlement approved.");
    } catch (err) {
      alert("Approval failed: " + err.message);
    }
  };

  const handlePayFnf = async (id) => {
    if (!window.confirm("Mark this settlement as paid?")) return;
    try {
      await apiFetch(`/api/exit/fnf/${id}/pay`, { method: "POST" });
      loadData();
      alert("FNF settlement marked as Paid.");
    } catch (err) {
      alert("Payment log failed: " + err.message);
    }
  };

  // Submit Exit Interview
  const handleSubmitInterview = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/api/exit/interviews", {
        method: "POST",
        body: JSON.stringify(interviewForm)
      });
      loadData();
      alert("Thank you! Exit interview feedback saved successfully.");
    } catch (err) {
      alert("Submission failed: " + err.message);
    }
  };

  // Generate Relieving experience letter
  const handleGenerateLetter = async (id) => {
    if (!window.confirm("Generate relieving & experience letter?")) return;
    try {
      await apiFetch(`/api/exit/experience-letters/${id}/generate`, { method: "POST" });
      loadData();
      alert("Experience letter generated!");
    } catch (err) {
      alert("Generation failed: " + err.message);
    }
  };

  return (
    <div className="space-y-6 font-sans mt-4">
      {loading && (
        <div className="flex justify-center items-center py-12 text-slate-400">
          <ArrowPathIcon className="w-6 h-6 animate-spin mr-2" />
          Loading Exit Workspace...
        </div>
      )}

      {!loading && (
        <>
          {/* 1. DASHBOARD TAB */}
          {activeTab === "Exit Dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Active Exits</span>
                  <p className="text-xl font-black text-rose-700 mt-1">{stats.totalActive || 0}</p>
                </div>
                <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Submitted Requests</span>
                  <p className="text-xl font-black text-slate-700 mt-1">{stats.pendingResignations || 0}</p>
                </div>
                <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Notice Period</span>
                  <p className="text-xl font-black text-amber-600 mt-1">{stats.noticePeriodCount || 0}</p>
                </div>
                <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Clearances</span>
                  <p className="text-xl font-black text-indigo-600 mt-1">{stats.pendingClearance || 0}</p>
                </div>
                <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Exits This Month</span>
                  <p className="text-xl font-black text-emerald-600 mt-1">{stats.exitsThisMonth || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="text-xs font-black text-slate-900 uppercase">Exit Reasons Analysis</h3>
                  </div>
                  {stats.reasons?.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No reasons logs recorded.</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.reasons?.map((r, i) => (
                        <div key={i} className="text-xs flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                          <span className="font-bold text-slate-700">{r.reason}</span>
                          <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-black">{r.count} exits</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="text-xs font-black text-slate-900 uppercase">Department Exit Metrics</h3>
                  </div>
                  {stats.departmentExits?.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No department metrics.</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.departmentExits?.map((d, i) => (
                        <div key={i} className="text-xs flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                          <span className="font-bold text-slate-700">{d.department || "General"}</span>
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-black">{d.count} exits</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. RESIGNATION TAB */}
          {activeTab === "Resignation" && (
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-5 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase">Resignation Requests</h3>
                {userRole === "employee" && (
                  <button
                    onClick={() => {
                      setResForm({
                        resignation_date: new Date().toISOString().split("T")[0],
                        proposed_lwd: "", reason: "Career Growth", remarks: ""
                      });
                      setShowResModal(true);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                  >
                    Submit Resignation
                  </button>
                )}
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-4">Employee</th>
                      <th className="p-4">Resignation Date</th>
                      <th className="p-4">Proposed LWD</th>
                      <th className="p-4">Reason</th>
                      <th className="p-4">Status</th>
                      {userRole !== "employee" && <th className="p-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {resignations.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-bold text-slate-900">{empNameMap[r.employee_id] || r.employee_id}</td>
                        <td className="p-4">{r.resignation_date}</td>
                        <td className="p-4 font-bold">{r.approved_lwd || r.proposed_lwd}</td>
                        <td className="p-4 text-rose-700 font-semibold">{r.reason}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                            r.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                            r.status === 'Submitted' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        {userRole !== "employee" && (
                          <td className="p-4 text-right">
                            {r.status === "Submitted" && (
                              <button
                                onClick={() => {
                                  setSelectedRecord(r);
                                  setResForm({ ...r });
                                  setShowActionModal(true);
                                }}
                                className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-[10px]"
                              >
                                Review/Action
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. NOTICE PERIOD TAB */}
          {activeTab === "Notice Period" && (
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-5 space-y-4">
              <div className="border-b pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase">Notice Period Status tracker</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {noticePeriods.map(n => {
                  const completed = n.completed_days || 0;
                  const total = n.notice_days || 1;
                  const pct = Math.min(100, Math.floor((completed / total) * 100));
                  return (
                    <div key={n.id} className="border border-slate-100 p-5 rounded-3xl bg-slate-50/50 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs">{empNameMap[n.employee_id] || n.employee_id}</h4>
                          <span className="text-[10px] text-slate-400">Notice Start: {n.notice_start_date} • LWD: {n.revised_lwd}</span>
                        </div>
                        {userRole !== "employee" && (
                          <button
                            onClick={() => {
                              setSelectedRecord(n);
                              setNpForm({
                                revised_lwd: n.revised_lwd,
                                early_release: n.early_release === 1,
                                notice_buyout: n.notice_buyout === 1,
                                buyout_amount: n.buyout_amount,
                                extension_days: n.extension_days
                              });
                              setShowNpModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>Progress: {n.completed_days} / {n.notice_days} Days Completed</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-rose-600 h-full transition-all" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {n.early_release === 1 && <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[9px] font-bold border border-emerald-200">Early Release</span>}
                        {n.notice_buyout === 1 && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[9px] font-bold border border-blue-200">Notice Buyout (${n.buyout_amount})</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. EXIT CLEARANCE TAB */}
          {activeTab === "Exit Clearance" && (
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-5 space-y-4">
              <div className="border-b pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase">Departmental Clearances</h3>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-4">Employee</th>
                      <th className="p-4">Clearance Dept</th>
                      <th className="p-4">Due Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Remarks</th>
                      {userRole !== "employee" && <th className="p-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {clearances.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-bold text-slate-900">{empNameMap[c.employee_id] || c.employee_id}</td>
                        <td className="p-4 font-bold text-rose-700">{c.department}</td>
                        <td className="p-4">{c.due_date}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                            c.status === 'Cleared' ? 'bg-green-50 text-green-700 border-green-200' :
                            c.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">{c.remarks || c.rejection_reason || "-"}</td>
                        {userRole !== "employee" && (
                          <td className="p-4 text-right">
                            {c.status !== "Cleared" && (
                              <button
                                onClick={() => {
                                  setSelectedRecord(c);
                                  setClearForm({ status: "Cleared", remarks: "", rejection_reason: "" });
                                  setShowClearModal(true);
                                }}
                                className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-[10px]"
                              >
                                Clear/Decline
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. ASSET RETURN TAB */}
          {activeTab === "Asset Return" && (
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-5 space-y-4">
              <div className="border-b pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase">Assigned Asset recovery</h3>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-4">Employee</th>
                      <th className="p-4">Asset ID</th>
                      <th className="p-4">Asset Name</th>
                      <th className="p-4">Serial Number</th>
                      <th className="p-4">Return Status</th>
                      {userRole !== "employee" && <th className="p-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {assets.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-bold text-slate-900">{empNameMap[a.employee_id] || a.employee_id}</td>
                        <td className="p-4 font-mono font-bold text-slate-500">{a.asset_id}</td>
                        <td className="p-4 font-bold">{a.asset_name}</td>
                        <td className="p-4 font-mono">{a.serial_number || "N/A"}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                            a.status === 'Returned' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {a.status}
                          </span>
                        </td>
                        {userRole !== "employee" && (
                          <td className="p-4 text-right">
                            {a.status === "Return Pending" && (
                              <button
                                onClick={() => {
                                  setSelectedRecord(a);
                                  setAssetForm({ status: "Returned", remarks: "", condition_after: "Good" });
                                  setShowAssetModal(true);
                                }}
                                className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-[10px]"
                              >
                                Log Return
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. NO DUES TAB */}
          {activeTab === "No Dues" && (
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-5 space-y-4">
              <div className="border-b pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase">Master No Dues Sign-Off</h3>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-4">Employee ID</th>
                      <th className="p-4">Employee Name</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Approved By</th>
                      <th className="p-4">Cleared Date</th>
                      {userRole !== "employee" && <th className="p-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {noDuesList.map(n => (
                      <tr key={n.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-mono font-bold text-slate-500">{n.employee_id}</td>
                        <td className="p-4 font-bold text-slate-900">{empNameMap[n.employee_id] || n.employee_id}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                            n.status === 'Cleared' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {n.status}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-slate-500">{n.approved_by || "-"}</td>
                        <td className="p-4 font-mono">{n.cleared_date ? new Date(n.cleared_date).toLocaleDateString() : "-"}</td>
                        {userRole !== "employee" && (
                          <td className="p-4 text-right">
                            {n.status !== "Cleared" && (
                              <button
                                onClick={() => {
                                  setSelectedRecord(n);
                                  setNoDuesForm({ remarks: "" });
                                  setShowNoDuesModal(true);
                                }}
                                className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-[10px]"
                              >
                                Approve No Dues
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. F&F SETTLEMENT TAB */}
          {activeTab === "F&F Settlement" && (
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-5 space-y-4">
              <div className="border-b pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase">Full & Final Settlements</h3>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-4">Employee</th>
                      <th className="p-4">Gross Payable</th>
                      <th className="p-4">Deductions</th>
                      <th className="p-4">Net Amount</th>
                      <th className="p-4">Payment Status</th>
                      {userRole !== "employee" && <th className="p-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {fnfList.map(f => (
                      <tr key={f.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-bold text-slate-900">{empNameMap[f.employee_id] || f.employee_id}</td>
                        <td className="p-4 font-mono font-bold text-slate-800">${Number(f.gross_amount).toFixed(2)}</td>
                        <td className="p-4 font-mono text-red-600 font-bold">${Number(f.total_deductions).toFixed(2)}</td>
                        <td className="p-4 font-mono text-emerald-600 font-black">${Number(f.net_payable).toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                            f.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' :
                            f.status === 'Approved' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {f.status}
                          </span>
                        </td>
                        {userRole !== "employee" && (
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              {f.status === "Pending" && (
                                <button
                                  onClick={() => {
                                    setSelectedRecord(f);
                                    setFnfForm({ ...f });
                                    setShowFnfModal(true);
                                  }}
                                  className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-[10px]"
                                >
                                  Calculate
                                </button>
                              )}
                              {f.status === "Under Review" && (
                                <button
                                  onClick={() => handleApproveFnf(f.id)}
                                  className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg font-bold text-[10px]"
                                >
                                  Approve
                                </button>
                              )}
                              {f.status === "Approved" && (
                                <button
                                  onClick={() => handlePayFnf(f.id)}
                                  className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[10px]"
                                >
                                  Disburse Payment
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 8. EXIT INTERVIEW TAB */}
          {activeTab === "Exit Interview" && (
            <div className="space-y-6">
              {userRole === "employee" ? (
                <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-6 space-y-4 max-w-2xl mx-auto">
                  <div className="border-b pb-2">
                    <h3 className="text-xs font-black text-slate-800 uppercase">Submit Exit Interview Feedback</h3>
                  </div>
                  <form onSubmit={handleSubmitInterview} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Reason for Leaving</label>
                      <select value={interviewForm.reason_for_leaving} onChange={e => setInterviewForm({ ...interviewForm, reason_for_leaving: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700">
                        <option value="Compensation">Better Compensation</option>
                        <option value="Career Growth">Career Progression</option>
                        <option value="Work Environment">Workplace Culture</option>
                        <option value="Personal Reasons">Personal/Family</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Job Satisfaction (1-5)</label>
                        <input type="number" min="1" max="5" value={interviewForm.job_satisfaction} onChange={e => setInterviewForm({ ...interviewForm, job_satisfaction: Number(e.target.value) })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Recommend Company?</label>
                        <select value={interviewForm.recommend_company} onChange={e => setInterviewForm({ ...interviewForm, recommend_company: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                          <option value="Maybe">Maybe</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Manager/Leadership Feedback</label>
                      <textarea value={interviewForm.manager_feedback} onChange={e => setInterviewForm({ ...interviewForm, manager_feedback: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" rows="2" placeholder="Tell us about your management team..." />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Suggestions for Improvement</label>
                      <textarea value={interviewForm.improvement_suggestions} onChange={e => setInterviewForm({ ...interviewForm, improvement_suggestions: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" rows="2" placeholder="Any culture/operations suggestions..." />
                    </div>

                    <button type="submit" className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition shadow-md">Submit Feedback</button>
                  </form>
                </div>
              ) : (
                <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-5 space-y-4">
                  <div className="border-b pb-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase">Exit Survey Logs</h3>
                  </div>
                  <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                        <tr>
                          <th className="p-4">Employee</th>
                          <th className="p-4">Reason</th>
                          <th className="p-4">Satisfaction</th>
                          <th className="p-4">Rehire Eligibility</th>
                          <th className="p-4">Submitted Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {interviews.map(i => (
                          <tr key={i.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-4 font-bold text-slate-900">{empNameMap[i.employee_id] || i.employee_id}</td>
                            <td className="p-4 font-semibold text-rose-700">{i.reason_for_leaving}</td>
                            <td className="p-4 font-mono font-bold text-slate-600">{i.job_satisfaction} / 5</td>
                            <td className="p-4 font-bold text-slate-600">{i.rejoin_company}</td>
                            <td className="p-4 font-mono">{new Date(i.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 9. EXPERIENCE LETTER TAB */}
          {activeTab === "Experience Letter" && (
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-5 space-y-4">
              <div className="border-b pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase">Employment Relieving Certificates</h3>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-4">Employee</th>
                      <th className="p-4">Designation</th>
                      <th className="p-4">Duration</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {letters.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-bold text-slate-900">{empNameMap[l.employee_id] || l.employee_id}</td>
                        <td className="p-4 font-bold text-slate-500">{l.designation || "-"}</td>
                        <td className="p-4 text-slate-500 font-semibold">{l.duration || "-"}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                            l.status === 'Generated' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            {userRole !== "employee" && l.status === "Draft" && (
                              <button
                                onClick={() => handleGenerateLetter(l.id)}
                                className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-[10px]"
                              >
                                Generate
                              </button>
                            )}

                            {l.status === "Generated" && (
                              <a
                                href={`/api/exit/experience-letters/${l.id}/download`}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                                title="Download Letter"
                              >
                                <ArrowDownTrayIcon className="w-4.5 h-4.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 10. EXIT HISTORY TAB */}
          {activeTab === "Exit History" && (
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-5 space-y-4">
              <div className="border-b pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase">Archived Exited Records</h3>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-4">Employee</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Resignation Date</th>
                      <th className="p-4">Last Working Date</th>
                      <th className="p-4">Reason</th>
                      <th className="p-4">Final Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {history.map(h => (
                      <tr key={h.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-bold text-slate-900">{empNameMap[h.employee_id] || h.employee_id}</td>
                        <td className="p-4 font-bold text-slate-500">{h.department || "-"}</td>
                        <td className="p-4 font-mono">{h.resignation_date}</td>
                        <td className="p-4 font-mono font-bold">{h.approved_lwd || h.proposed_lwd}</td>
                        <td className="p-4 text-rose-700 font-semibold">{h.reason}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-700 border border-green-200">
                            {h.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* CREATE RESIGNATION MODAL */}
      {showResModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Submit Resignation</h3>
              <button onClick={() => setShowResModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmitResignation} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Proposed Last Working Date</label>
                <input type="date" required value={resForm.proposed_lwd} onChange={e => setResForm({ ...resForm, proposed_lwd: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Reason for Leaving</label>
                <select value={resForm.reason} onChange={e => setResForm({ ...resForm, reason: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                  <option value="Career Growth">Career growth</option>
                  <option value="Personal Reasons">Personal reasons</option>
                  <option value="Compensation">Compensation package</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Detailed Remarks</label>
                <textarea required value={resForm.remarks} onChange={e => setResForm({ ...resForm, remarks: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" rows="3" placeholder="Provide additional details..." />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <button type="button" onClick={() => setShowResModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW RESIGNATION MODAL */}
      {showActionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Review Resignation Request</h3>
              <button onClick={() => setShowActionModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <p className="font-bold">Employee: <span className="text-rose-600">{empNameMap[selectedRecord?.employee_id] || selectedRecord?.employee_id}</span></p>
              <p>Proposed LWD: <span className="font-mono font-bold">{selectedRecord?.proposed_lwd}</span></p>
              
              <div>
                <label className="block font-bold text-slate-600 mb-1">Approve LWD Exception (Optional)</label>
                <input type="date" value={resForm.proposed_lwd} onChange={e => setResForm({ ...resForm, proposed_lwd: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">HR/Manager Remarks</label>
                <textarea value={actionComments} onChange={e => setActionComments(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" rows="2" placeholder="Approve or Rejection comments..." />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <button onClick={() => handleReviewAction(false)} className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl font-bold">Reject</button>
                <button onClick={() => handleReviewAction(true)} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md">Approve</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE NOTICE PERIOD MODAL */}
      {showNpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Manage Notice Period</h3>
              <button onClick={() => setShowNpModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUpdateNotice} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Revised Last Working Date (LWD)</label>
                <input type="date" required value={npForm.revised_lwd} onChange={e => setNpForm({ ...npForm, revised_lwd: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={npForm.early_release} onChange={e => setNpForm({ ...npForm, early_release: e.target.checked })} id="np_early" />
                  <label htmlFor="np_early" className="font-bold text-slate-600">Early Release</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={npForm.notice_buyout} onChange={e => setNpForm({ ...npForm, notice_buyout: e.target.checked })} id="np_buyout" />
                  <label htmlFor="np_buyout" className="font-bold text-slate-600">Notice Buyout</label>
                </div>
              </div>

              {npForm.notice_buyout && (
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Notice Buyout Amount ($)</label>
                  <input type="number" value={npForm.buyout_amount} onChange={e => setNpForm({ ...npForm, buyout_amount: Number(e.target.value) })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <button type="button" onClick={() => setShowNpModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md">Apply Revision</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE CLEARANCE MODAL */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Sign Off Clearance</h3>
              <button onClick={() => setShowClearModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUpdateClearance} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Clearance Action</label>
                <select value={clearForm.status} onChange={e => setClearForm({ ...clearForm, status: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                  <option value="Cleared">Cleared (Approve)</option>
                  <option value="Rejected">Rejected (Hold/Decline)</option>
                  <option value="In Progress">In Progress</option>
                </select>
              </div>

              {clearForm.status === "Rejected" ? (
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Rejection/Hold Reason</label>
                  <textarea required value={clearForm.rejection_reason} onChange={e => setClearForm({ ...clearForm, rejection_reason: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" rows="3" placeholder="Provide outstanding dues description..." />
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Remarks</label>
                  <textarea value={clearForm.remarks} onChange={e => setClearForm({ ...clearForm, remarks: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" rows="3" />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <button type="button" onClick={() => setShowClearModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md">Apply Sign-off</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSET RETURN MODAL */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Verify Asset Return</h3>
              <button onClick={() => setShowAssetModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUpdateAsset} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Return Status</label>
                <select value={assetForm.status} onChange={e => setAssetForm({ ...assetForm, status: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                  <option value="Returned">Returned</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Lost">Lost</option>
                  <option value="Waived">Waived</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Condition Verified</label>
                <input type="text" value={assetForm.condition_after} onChange={e => setAssetForm({ ...assetForm, condition_after: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" placeholder="e.g. Good, Scratched, Damaged keys" />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Remarks</label>
                <textarea value={assetForm.remarks} onChange={e => setAssetForm({ ...assetForm, remarks: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" rows="2" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <button type="button" onClick={() => setShowAssetModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md">Save Verification</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NO DUES MODAL */}
      {showNoDuesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Approve Master No Dues</h3>
              <button onClick={() => setShowNoDuesModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleApproveNoDues} className="space-y-3 text-xs">
              <p className="text-slate-500 font-medium">Verify that all IT, Finance, Admin, and manager clearances are marked as Cleared before submitting final sign-off.</p>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Approver Remarks</label>
                <textarea value={noDuesForm.remarks} onChange={e => setNoDuesForm({ ...noDuesForm, remarks: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" rows="3" placeholder="Verify final release..." />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <button type="button" onClick={() => setShowNoDuesModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md">Complete Clearance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FNF CALCULATOR MODAL */}
      {showFnfModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">FNF Settlement Accountant Ledger</h3>
              <button onClick={() => setShowFnfModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveFnf} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 border p-3 rounded-2xl bg-emerald-50/10">
                  <h4 className="font-black text-emerald-800 text-[10px] uppercase border-b pb-1 border-emerald-100">Gross Earnings (+)</h4>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Unpaid Salary Due</label>
                    <input type="number" value={fnfForm.salary_due} onChange={e => setFnfForm({ ...fnfForm, salary_due: Number(e.target.value) })} className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Leave Encashment</label>
                    <input type="number" value={fnfForm.leave_encashment} onChange={e => setFnfForm({ ...fnfForm, leave_encashment: Number(e.target.value) })} className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Bonus / Incentives</label>
                    <input type="number" value={fnfForm.bonus} onChange={e => setFnfForm({ ...fnfForm, bonus: Number(e.target.value) })} className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg" />
                  </div>
                </div>

                <div className="space-y-2 border p-3 rounded-2xl bg-rose-50/10">
                  <h4 className="font-black text-rose-800 text-[10px] uppercase border-b pb-1 border-rose-100">Deductions & Recoveries (-)</h4>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Notice Buyout Recovery</label>
                    <input type="number" value={fnfForm.notice_recovery} onChange={e => setFnfForm({ ...fnfForm, notice_recovery: Number(e.target.value) })} className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Loan Outstanding</label>
                    <input type="number" value={fnfForm.loan_recovery} onChange={e => setFnfForm({ ...fnfForm, loan_recovery: Number(e.target.value) })} className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Asset Damage Recovery</label>
                    <input type="number" value={fnfForm.asset_recovery} onChange={e => setFnfForm({ ...fnfForm, asset_recovery: Number(e.target.value) })} className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Ledger Remarks</label>
                <textarea value={fnfForm.remarks} onChange={e => setFnfForm({ ...fnfForm, remarks: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" rows="2" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <button type="button" onClick={() => setShowFnfModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md">Complete FNF Calculations</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExitWorkspace;
