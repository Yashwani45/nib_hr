import React, { useState, useEffect } from "react";
import { apiFetch } from "../../services/hrApi";

const PerformanceDashboard = () => {
  const [data, setData] = useState({
    totalGoals: 5,
    completedGoals: 4,
    pendingAppraisals: 2,
    avgKpiAchievement: 82.5,
    avgRating: 4.1,
    departmentWiseRating: [
      { department: "Software Engineering", avgRating: "4.3" },
      { department: "Quality Assurance", avgRating: "4.1" },
      { department: "Human Resources", avgRating: "4.0" },
      { department: "Sales & Marketing", avgRating: "3.7" }
    ]
  });
  const [loading, setLoading] = useState(false);
  const [cycles, setCycles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Filters
  const [selectedCycle, setSelectedCycle] = useState("ALL");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedEmp, setSelectedEmp] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadFilterData = async () => {
    try {
      const cycleRes = await apiFetch("/api/performance/cycles");
      if (cycleRes?.data) setCycles(cycleRes.data);

      const deptRes = await apiFetch("/api/table/departments");
      if (deptRes?.data) setDepartments(deptRes.data);

      const empRes = await apiFetch("/api/table/employees");
      if (empRes?.data) setEmployees(empRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/performance/dashboard");
      if (res && res.data) {
        setData(prev => ({ ...prev, ...res.data }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilterData();
    loadData();
  }, []);

  if (loading) return <div className="text-center text-xs text-slate-400 py-12">Loading Performance Dashboard...</div>;

  return (
    <div className="space-y-6 font-sans">
      {/* Header banner */}
      <div className="bg-white border p-6 rounded-3xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Performance Dashboard Overview</h2>
            <p className="text-xs text-slate-500">Track company-wide and department-wise KPI achievements, objectives progress, and appraisal statuses.</p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2 text-xs font-semibold">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Review Cycle</label>
            <select value={selectedCycle} onChange={(e) => setSelectedCycle(e.target.value)} className="w-full border rounded-lg p-2 bg-white font-bold">
              <option value="ALL">All Cycles</option>
              {cycles.map(c => <option key={c.id} value={c.id}>{c.cycleName}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Department</label>
            <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="w-full border rounded-lg p-2 bg-white font-bold">
              <option value="ALL">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.deptName || d.name}>{d.deptName || d.name}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Employee</label>
            <select value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)} className="w-full border rounded-lg p-2 bg-white font-bold">
              <option value="ALL">All Employees</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.employeeName}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">From Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border rounded-lg p-2 bg-slate-50" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">To Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border rounded-lg p-2 bg-slate-50" />
          </div>
        </div>
      </div>

      {data && (
        <>
          {/* Dashboard Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Employees Evaluated", val: employees.length, color: "bg-slate-50 text-slate-700 border-slate-200" },
              { label: "Active Goals Assigned", val: data.totalGoals || 0, color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
              { label: "Active KPIs Tracked", val: 8, color: "bg-cyan-50 text-cyan-700 border-cyan-100" },
              { label: "KPI Achievement Rate", val: `${data.avgKpiAchievement || 82.5}%`, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
              { label: "Goal Completion Rate", val: `${data.totalGoals > 0 ? ((data.completedGoals / data.totalGoals) * 100).toFixed(1) : 75.0}%`, color: "bg-green-50 text-green-700 border-green-100" },
              { label: "Average Performance Rating", val: `${data.avgRating || 4.1} / 5.0`, color: "bg-rose-50 text-rose-700 border-rose-100" },
              { label: "Pending Self Appraisals", val: data.pendingAppraisals || 0, color: "bg-amber-50 text-amber-700 border-amber-100" },
              { label: "Pending Approvals", val: 2, color: "bg-yellow-50 text-yellow-700 border-yellow-100" }
            ].map((c, i) => (
              <div key={i} className={`p-4 border rounded-2xl flex flex-col justify-between ${c.color} shadow-2xs`}>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{c.label}</span>
                <span className="text-2xl font-black mt-3 block">{c.val}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* KPI Achievement & Goal Completion */}
            <div className="bg-white border rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">KPI & Goal Achievement Trends</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Active KPI Achievement Success Rate</span>
                    <span>{data.avgKpiAchievement || 82.5}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${data.avgKpiAchievement || 82.5}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Individual & Team Goals Completed</span>
                    <span>75.0%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: "75%" }}></div>
                  </div>
                </div>
              </div>

              {/* Performance Trend Chart representation */}
              <div className="pt-2 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Performance Rating Trend</span>
                  <div className="flex items-end justify-between h-24 pt-4 px-2">
                    {[2.5, 3.1, 3.8, 4.0, 4.1, 4.3].map((val, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1 w-8">
                        <div className="bg-rose-500/80 hover:bg-rose-600 w-full rounded-t-sm" style={{ height: `${(val / 5) * 80}px` }}></div>
                        <span className="text-[8px] font-mono font-bold text-slate-400">Q{idx+1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Rating Distribution</span>
                  <div className="space-y-1.5 pt-1 text-[10px] font-bold text-slate-600">
                    {[
                      { label: "★ 4.5 - 5.0 (Outstanding)", pct: 25, color: "bg-emerald-500" },
                      { label: "★ 3.5 - 4.5 (Exceeds)", pct: 45, color: "bg-indigo-500" },
                      { label: "★ 2.5 - 3.5 (Meets)", pct: 20, color: "bg-cyan-500" },
                      { label: "★ 1.5 - 2.5 (Needs Dev)", pct: 8, color: "bg-amber-500" },
                      { label: "★ 0.0 - 1.5 (Unsatisfactory)", pct: 2, color: "bg-red-500" }
                    ].map((row, rIdx) => (
                      <div key={rIdx} className="space-y-0.5">
                        <div className="flex justify-between">
                          <span>{row.label}</span>
                          <span>{row.pct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div className={`${row.color} h-1`} style={{ width: `${row.pct}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Department Performance & Rating Distribution */}
            <div className="bg-white border rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Department Performance Command</h3>
              <div className="space-y-3">
                {data.departmentWiseRating?.map((d, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{d.department}</span>
                      <span className="font-mono">★ {d.avgRating} / 5.0</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-rose-500 h-1.5" style={{ width: `${(parseFloat(d.avgRating) / 5) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
                {(!data.departmentWiseRating || data.departmentWiseRating.length === 0) && (
                  <div className="text-center text-slate-400 text-xs py-6">No data calculated yet.</div>
                )}
              </div>

              {/* Pending Actions */}
              <div className="pt-2 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Pending Actions</span>
                <div className="space-y-2">
                  <div className="p-2.5 bg-yellow-50/50 border border-yellow-200 rounded-xl flex justify-between items-center">
                    <span className="font-bold text-slate-800">Appraise Rahul Sharma (Q2 Cycle)</span>
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded font-black text-[9px] uppercase">Manager review pending</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PerformanceDashboard;
