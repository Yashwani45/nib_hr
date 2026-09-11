import React, { useState, useEffect } from "react";
import { apiFetch } from "../../services/hrApi";

const PerformanceKpi = () => {
  const [kpis, setKpis] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form: Create KPI
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Operations");
  const [measurementType, setMeasurementType] = useState("Percentage");
  const [unit, setUnit] = useState("%");
  const [target, setTarget] = useState("");
  const [weight, setWeight] = useState("");
  const [frequency, setFrequency] = useState("Quarterly");
  const [startDate, setStartDate] = useState("2026-04-01");
  const [endDate, setEndDate] = useState("2027-03-31");
  const [selectedEmp, setSelectedEmp] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedCycle, setSelectedCycle] = useState("");

  // Form: Update Progress
  const [actualAchievement, setActualAchievement] = useState("");
  const [remarks, setRemarks] = useState("");
  const [showProgressModal, setShowProgressModal] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/performance/kpis");
      if (res && res.data) setKpis(res.data);

      const empRes = await apiFetch("/api/table/employees");
      if (empRes?.data) setEmployees(empRes.data);

      const deptRes = await apiFetch("/api/table/departments");
      if (deptRes?.data) setDepartments(deptRes.data);

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

  const handleCreateKpi = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/api/performance/kpis", {
        method: "POST",
        body: JSON.stringify({
          name,
          description,
          category,
          measurementType,
          unit,
          target,
          weight: parseInt(weight),
          frequency,
          startDate,
          endDate,
          employeeId: selectedEmp || null,
          departmentId: selectedDept || null,
          performanceMasterId: selectedCycle || null
        })
      });
      alert("KPI created and assigned successfully!");
      setShowAddModal(false);
      setName("");
      setDescription("");
      setTarget("");
      setWeight("");
      loadData();
    } catch (err) {
      alert(err.message || "Failed to create KPI.");
    }
  };

  const handleUpdateProgress = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/performance/kpis/${showProgressModal.id}/progress`, {
        method: "PATCH",
        body: JSON.stringify({
          actualAchievement: parseFloat(actualAchievement),
          remarks
        })
      });
      alert("KPI progress and status updated!");
      setShowProgressModal(null);
      setActualAchievement("");
      setRemarks("");
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">KPI Management</h2>
          <p className="text-xs text-slate-500">Formulate and track Key Performance Indicators (KPIs) against organizational objectives.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow-2xs"
        >
          + Create KPI
        </button>
      </div>

      {loading && <div className="text-center text-xs text-slate-400 py-8">Loading KPIs...</div>}

      {!loading && (
        <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-xs">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs bg-white">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase">KPI Name</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase">Employee / Department</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase">Category</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase text-right">Target</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase text-right">Achievement</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase text-right">Weightage</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase">Frequency</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase">Due Date</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase">Status</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
              {kpis.map(kpi => {
                const targetNum = parseFloat(kpi.target) || 100;
                const achievementPercent = Math.min(100, Math.max(0, (parseFloat(kpi.actualAchievement) / targetNum) * 100));
                
                // Status badge logic
                let badgeStyle = "bg-slate-100 text-slate-600 border-slate-200";
                if (kpi.status === "Achieved") badgeStyle = "bg-green-50 text-green-700 border-green-200";
                else if (kpi.status === "In Progress" && achievementPercent >= 75) badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
                else if (kpi.status === "In Progress") badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
                else if (kpi.status === "Missed") badgeStyle = "bg-red-50 text-red-700 border-red-200";

                return (
                  <tr key={kpi.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-800 block">{kpi.name}</span>
                      <span className="text-[10px] text-slate-400 block">{kpi.description || "No description"}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-800">
                      {kpi.employee?.employeeName || kpi.departmentDetails?.deptName || "Global / Departmental"}
                    </td>
                    <td className="px-4 py-3 text-indigo-700">{kpi.category || "General"}</td>
                    <td className="px-4 py-3 text-right font-mono">{kpi.target}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-900">{kpi.actualAchievement}</td>
                    <td className="px-4 py-3 text-right font-mono">{kpi.weight}%</td>
                    <td className="px-4 py-3">{kpi.frequency}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{kpi.endDate || "2027-03-31"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col gap-1 w-20">
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] border uppercase text-center ${badgeStyle}`}>
                          {kpi.status}
                        </span>
                        <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                          <div className="bg-indigo-600 h-1" style={{ width: `${achievementPercent}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setShowProgressModal(kpi);
                          setActualAchievement(kpi.actualAchievement);
                        }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        Log Update
                      </button>
                    </td>
                  </tr>
                );
              })}
              {kpis.length === 0 && (
                <tr>
                  <td colSpan="10" className="text-center py-10 text-slate-400 font-semibold">No KPIs configured.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add KPI Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleCreateKpi} className="bg-white rounded-2xl border max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-sm text-slate-900 border-b pb-2">Create & Assign KPI</h3>
            
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">KPI Metric Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Code Review Completion Rate" className="w-full border rounded-lg p-2 bg-slate-50" required />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="KPI evaluation details..." className="w-full border rounded-lg p-2 bg-slate-50 h-14" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border rounded-lg p-2 bg-white font-semibold">
                    <option value="Operations">Operations</option>
                    <option value="Sales">Sales</option>
                    <option value="Quality">Quality</option>
                    <option value="Technical">Technical</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Measurement Type</label>
                  <select value={measurementType} onChange={(e) => setMeasurementType(e.target.value)} className="w-full border rounded-lg p-2 bg-white font-semibold">
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Numeric">Numeric</option>
                    <option value="Currency">Currency</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Unit</label>
                  <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="%" className="w-full border rounded-lg p-2 bg-slate-50 font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Target Value</label>
                  <input type="text" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="95" className="w-full border rounded-lg p-2 bg-slate-50 font-bold" required />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Weightage %</label>
                  <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="20" className="w-full border rounded-lg p-2 bg-slate-50 font-bold" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border rounded-lg p-2 bg-slate-50" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">End Date (Due)</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border rounded-lg p-2 bg-slate-50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Assign to Employee</label>
                  <select value={selectedEmp} onChange={(e) => { setSelectedEmp(e.target.value); setSelectedDept(""); }} className="w-full border rounded-lg p-2 bg-white font-semibold">
                    <option value="">-- Choose Employee --</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.employeeName}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Assign to Dept</label>
                  <select value={selectedDept} onChange={(e) => { setSelectedDept(e.target.value); setSelectedEmp(""); }} className="w-full border rounded-lg p-2 bg-white font-semibold">
                    <option value="">-- Choose Dept --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.deptName || d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select Review Cycle</label>
                <select value={selectedCycle} onChange={(e) => setSelectedCycle(e.target.value)} className="w-full border rounded-lg p-2 bg-white font-semibold" required>
                  <option value="">-- Choose Cycle --</option>
                  {cycles.map(c => <option key={c.id} value={c.id}>{c.cycleName}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700">Save KPI</button>
            </div>
          </form>
        </div>
      )}

      {/* Progress update Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleUpdateProgress} className="bg-white rounded-2xl border max-w-sm w-full p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 border-b pb-2">Log KPI Achievement</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Actual Achievement Value</label>
                <input type="number" step="0.01" value={actualAchievement} onChange={(e) => setActualAchievement(e.target.value)} className="w-full border rounded-lg p-2.5 font-bold" required />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Remarks / Log Note</label>
                <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Type log details..." className="w-full border rounded-lg p-2.5 h-20" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-3">
              <button type="button" onClick={() => setShowProgressModal(null)} className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700">Submit Update</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PerformanceKpi;
