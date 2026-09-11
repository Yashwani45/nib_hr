import React, { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../../services/hrApi";

const PerformanceMaster = () => {
  const [activeTab, setActiveTab] = useState("cycles");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // Form States
  // 1. Cycles
  const [cycleName, setCycleName] = useState("");
  const [reviewPeriod, setReviewPeriod] = useState("Annual");
  const [startDate, setStartDate] = useState("2026-04-01");
  const [endDate, setEndDate] = useState("2027-03-31");
  const [selfReviewWeight, setSelfReviewWeight] = useState(20);
  const [managerReviewWeight, setManagerReviewWeight] = useState(80);

  // 2. Rating Scale
  const [scaleName, setScaleName] = useState("");
  const [minRating, setMinRating] = useState("1.00");
  const [maxRating, setMaxRating] = useState("5.00");

  // 3. Competencies
  const [compName, setCompName] = useState("");
  const [compCat, setCompCat] = useState("Leadership");
  const [compWeight, setCompWeight] = useState(10);

  // 4. Skills
  const [skillName, setSkillName] = useState("");
  const [skillCat, setSkillCat] = useState("Technical");

  // 5. Goal Category
  const [goalCatName, setGoalCatName] = useState("");
  const [goalCatDesc, setGoalCatDesc] = useState("");

  const getTableName = () => {
    switch (activeTab) {
      case "cycles": return "performance_masters";
      case "scales": return "rating_scales";
      case "competencies": return "competencies";
      case "skills": return "skills";
      case "categories": return "goal_categories";
      default: return "performance_masters";
    }
  };

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/table/${getTableName()}`);
      if (res && res.data) {
        setRecords(res.data);
      }
    } catch (e) {
      console.error(e);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [activeTab]);

  const handleOpenAdd = () => {
    setEditingRecord(null);
    // Reset all form inputs
    setCycleName("");
    setReviewPeriod("Annual");
    setStartDate("2026-04-01");
    setEndDate("2027-03-31");
    setSelfReviewWeight(20);
    setManagerReviewWeight(80);

    setScaleName("");
    setMinRating("1.00");
    setMaxRating("5.00");

    setCompName("");
    setCompCat("Leadership");
    setCompWeight(10);

    setSkillName("");
    setSkillCat("Technical");

    setGoalCatName("");
    setGoalCatDesc("");

    setShowAddModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingRecord(item);
    if (activeTab === "cycles") {
      setCycleName(item.cycleName || item.cycle_name || "");
      setReviewPeriod(item.reviewPeriod || item.review_period || "Annual");
      setStartDate(item.startDate || item.start_date || "");
      setEndDate(item.endDate || item.end_date || "");
      setSelfReviewWeight(item.selfReviewWeight || item.self_review_weight || 20);
      setManagerReviewWeight(item.managerReviewWeight || item.manager_review_weight || 80);
    } else if (activeTab === "scales") {
      setScaleName(item.scaleName || item.scale_name || "");
      setMinRating(item.minRating || item.min_rating || "1.00");
      setMaxRating(item.maxRating || item.max_rating || "5.00");
    } else if (activeTab === "competencies") {
      setCompName(item.name || "");
      setCompCat(item.category || "Leadership");
      setCompWeight(item.weight || 10);
    } else if (activeTab === "skills") {
      setSkillName(item.name || "");
      setSkillCat(item.category || "Technical");
    } else if (activeTab === "categories") {
      setGoalCatName(item.name || "");
      setGoalCatDesc(item.description || "");
    }
    setShowAddModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    let payload = {};
    if (activeTab === "cycles") {
      payload = { cycleName, reviewPeriod, startDate, endDate, selfReviewWeight, managerReviewWeight };
    } else if (activeTab === "scales") {
      payload = { scaleName, minRating: parseFloat(minRating), maxRating: parseFloat(maxRating) };
    } else if (activeTab === "competencies") {
      payload = { name: compName, category: compCat, weight: parseInt(compWeight) };
    } else if (activeTab === "skills") {
      payload = { name: skillName, category: skillCat };
    } else if (activeTab === "categories") {
      payload = { name: goalCatName, description: goalCatDesc };
    }

    try {
      if (editingRecord) {
        await apiFetch(`/api/table/${getTableName()}/${editingRecord.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch(`/api/table/${getTableName()}`, {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }
      alert("Configuration saved successfully!");
      setShowAddModal(false);
      loadRecords();
    } catch (err) {
      alert(err.message || "Save failed.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this configuration item?")) return;
    try {
      await apiFetch(`/api/table/${getTableName()}/${id}`, { method: "DELETE" });
      alert("Deleted.");
      loadRecords();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const txt = (r.cycleName || r.scaleName || r.name || "").toLowerCase();
      return txt.includes(searchTerm.toLowerCase());
    });
  }, [records, searchTerm]);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Performance Master Config</h2>
          <p className="text-xs text-slate-500">Manage scales, review competency models, assign technical skills, and schedule appraisals.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow-2xs"
        >
          + Add New Config
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-bold gap-4 overflow-x-auto pb-1.5">
        {[
          { key: "cycles", label: "Review Cycles" },
          { key: "scales", label: "Rating Scales" },
          { key: "competencies", label: "Competencies" },
          { key: "skills", label: "Skills Library" },
          { key: "categories", label: "Goal Categories" }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key); setSearchTerm(""); }}
            className={`pb-2 border-b-2 px-1 whitespace-nowrap ${
              activeTab === t.key ? "border-rose-600 text-rose-600 font-extrabold" : "border-transparent text-slate-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid Filters */}
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs w-full px-3 py-2 border rounded-xl bg-slate-50 text-xs"
        />
      </div>

      {loading ? (
        <div className="text-center text-xs text-slate-400 py-8">Loading master data...</div>
      ) : (
        <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-2xs">
          <table className="min-w-full divide-y divide-slate-100 text-xs text-left bg-white">
            <thead className="bg-slate-50 font-bold text-slate-500">
              {activeTab === "cycles" && (
                <tr>
                  <th className="px-4 py-3">Cycle Name</th>
                  <th className="px-4 py-3">Review Period</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Self / Mgr Weight</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              )}
              {activeTab === "scales" && (
                <tr>
                  <th className="px-4 py-3">Scale Name</th>
                  <th className="px-4 py-3">Min Score</th>
                  <th className="px-4 py-3">Max Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              )}
              {activeTab === "competencies" && (
                <tr>
                  <th className="px-4 py-3">Competency Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Weight</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              )}
              {activeTab === "skills" && (
                <tr>
                  <th className="px-4 py-3">Skill Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              )}
              {activeTab === "categories" && (
                <tr>
                  <th className="px-4 py-3">Category Name</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 font-mono">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
              {filteredRecords.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  {activeTab === "cycles" && (
                    <>
                      <td className="px-4 py-3 font-bold text-slate-900">{item.cycleName || item.cycle_name}</td>
                      <td className="px-4 py-3 text-rose-700">{item.reviewPeriod || item.review_period}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{item.startDate} to {item.endDate}</td>
                      <td className="px-4 py-3 font-mono">{item.selfReviewWeight || item.self_review_weight}% / {item.managerReviewWeight || item.manager_review_weight}%</td>
                    </>
                  )}
                  {activeTab === "scales" && (
                    <>
                      <td className="px-4 py-3 font-bold text-slate-900">{item.scaleName || item.scale_name}</td>
                      <td className="px-4 py-3 font-mono">{item.minRating || item.min_rating}</td>
                      <td className="px-4 py-3 font-mono">{item.maxRating || item.max_rating}</td>
                    </>
                  )}
                  {activeTab === "competencies" && (
                    <>
                      <td className="px-4 py-3 font-bold text-slate-900">{item.name}</td>
                      <td className="px-4 py-3 text-indigo-700">{item.category}</td>
                      <td className="px-4 py-3 text-right font-mono">{item.weight}%</td>
                    </>
                  )}
                  {activeTab === "skills" && (
                    <>
                      <td className="px-4 py-3 font-bold text-slate-900">{item.name}</td>
                      <td className="px-4 py-3 text-cyan-700">{item.category}</td>
                    </>
                  )}
                  {activeTab === "categories" && (
                    <>
                      <td className="px-4 py-3 font-bold text-slate-900">{item.name}</td>
                      <td className="px-4 py-3 text-slate-500">{item.description || '--'}</td>
                    </>
                  )}
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[9px] uppercase">
                      {item.status || "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap font-bold text-indigo-600 space-x-2">
                    <button onClick={() => handleOpenEdit(item)} className="hover:text-indigo-800">Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700">Delete</button>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400 font-semibold">No records defined.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleSave} className="bg-white rounded-2xl border max-w-sm w-full p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 border-b pb-2">
              {editingRecord ? "Edit Record" : "Add Configuration Item"}
            </h3>
            
            <div className="space-y-3 text-xs">
              {activeTab === "cycles" && (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Cycle Name</label>
                    <input type="text" value={cycleName} onChange={(e) => setCycleName(e.target.value)} className="w-full border rounded-lg p-2 bg-slate-50" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Review Period</label>
                      <select value={reviewPeriod} onChange={(e) => setReviewPeriod(e.target.value)} className="w-full border rounded-lg p-2 bg-white font-semibold">
                        <option value="Annual">Annual</option>
                        <option value="Half-Yearly">Half-Yearly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Monthly">Monthly</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Start Date</label>
                      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border rounded-lg p-2 bg-slate-50" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1 col-span-1">
                      <label className="font-bold text-slate-700">End Date</label>
                      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border rounded-lg p-2 bg-slate-50" />
                    </div>
                    <div className="space-y-1 col-span-1">
                      <label className="font-bold text-slate-700">Self Weight %</label>
                      <input type="number" value={selfReviewWeight} onChange={(e) => setSelfReviewWeight(parseInt(e.target.value))} className="w-full border rounded-lg p-2 bg-slate-50 font-bold" />
                    </div>
                    <div className="space-y-1 col-span-1">
                      <label className="font-bold text-slate-700">Manager Weight %</label>
                      <input type="number" value={managerReviewWeight} onChange={(e) => setManagerReviewWeight(parseInt(e.target.value))} className="w-full border rounded-lg p-2 bg-slate-50 font-bold" />
                    </div>
                  </div>
                </>
              )}

              {activeTab === "scales" && (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Scale Name</label>
                    <input type="text" value={scaleName} onChange={(e) => setScaleName(e.target.value)} placeholder="e.g. 5-Point Scale" className="w-full border rounded-lg p-2 bg-slate-50" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Min Rating Value</label>
                      <input type="number" step="0.01" value={minRating} onChange={(e) => setMinRating(e.target.value)} className="w-full border rounded-lg p-2 bg-slate-50 font-bold" required />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Max Rating Value</label>
                      <input type="number" step="0.01" value={maxRating} onChange={(e) => setMaxRating(e.target.value)} className="w-full border rounded-lg p-2 bg-slate-50 font-bold" required />
                    </div>
                  </div>
                </>
              )}

              {activeTab === "competencies" && (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Competency Name</label>
                    <input type="text" value={compName} onChange={(e) => setCompName(e.target.value)} placeholder="e.g. Strategic Thinking" className="w-full border rounded-lg p-2 bg-slate-50" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Category</label>
                      <select value={compCat} onChange={(e) => setCompCat(e.target.value)} className="w-full border rounded-lg p-2 bg-white font-semibold">
                        <option value="Leadership">Leadership</option>
                        <option value="Communication">Communication</option>
                        <option value="Customer Focus">Customer Focus</option>
                        <option value="Core Values">Core Values</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Evaluation Weight %</label>
                      <input type="number" value={compWeight} onChange={(e) => setCompWeight(e.target.value)} className="w-full border rounded-lg p-2 bg-slate-50 font-bold" required />
                    </div>
                  </div>
                </>
              )}

              {activeTab === "skills" && (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Skill Name</label>
                    <input type="text" value={skillName} onChange={(e) => setSkillName(e.target.value)} placeholder="e.g. React/Vite development" className="w-full border rounded-lg p-2 bg-slate-50" required />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Category</label>
                    <select value={skillCat} onChange={(e) => setSkillCat(e.target.value)} className="w-full border rounded-lg p-2.5 bg-white font-semibold">
                      <option value="Technical">Technical</option>
                      <option value="Soft Skills">Soft Skills</option>
                      <option value="Management">Management</option>
                    </select>
                  </div>
                </>
              )}

              {activeTab === "categories" && (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Category Name</label>
                    <input type="text" value={goalCatName} onChange={(e) => setGoalCatName(e.target.value)} placeholder="e.g. Sales Metrics" className="w-full border rounded-lg p-2 bg-slate-50" required />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Description</label>
                    <textarea value={goalCatDesc} onChange={(e) => setGoalCatDesc(e.target.value)} placeholder="Objective categories description..." className="w-full border rounded-lg p-2 bg-slate-50 h-20" />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-3">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700">Save Configuration</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PerformanceMaster;
