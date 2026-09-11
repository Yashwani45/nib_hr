import React, { useState, useEffect } from "react";
import { apiFetch } from "../../services/hrApi";

const PerformanceReports = () => {
  const [reportType, setReportType] = useState("employee"); // employee, kpi, okr, rating, promotion, increment
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedEmp, setSelectedEmp] = useState("");
  const [selectedCycle, setSelectedCycle] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedDesig, setSelectedDesig] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadFilterData = async () => {
    try {
      const empRes = await apiFetch("/api/table/employees");
      if (empRes?.data) setEmployees(empRes.data);

      const cycleRes = await apiFetch("/api/performance/cycles");
      if (cycleRes?.data) setCycles(cycleRes.data);

      const deptRes = await apiFetch("/api/table/departments");
      if (deptRes?.data) setDepartments(deptRes.data);

      const desigRes = await apiFetch("/api/table/designations");
      if (desigRes?.data) setDesignations(desigRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadReport = async () => {
    setLoading(true);
    let typeParam = "appraisal";
    if (reportType === "kpi") typeParam = "kpis";
    else if (reportType === "okr") typeParam = "goals";
    else if (reportType === "promotion") typeParam = "promotions";
    else if (reportType === "increment") typeParam = "increments";

    try {
      const params = new URLSearchParams({
        type: typeParam,
        employeeId: selectedEmp,
        performanceMasterId: selectedCycle,
        departmentId: selectedDept,
        status
      });
      const res = await apiFetch(`/api/performance/reports?${params.toString()}`);
      if (res && res.data) setRecords(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilterData();
  }, []);

  useEffect(() => {
    loadReport();
  }, [reportType, selectedEmp, selectedCycle, selectedDept, selectedDesig, status, startDate, endDate]);

  const handleExportCsv = () => {
    let typeParam = "appraisal";
    if (reportType === "kpi") typeParam = "kpis";
    else if (reportType === "okr") typeParam = "goals";
    else if (reportType === "promotion") typeParam = "promotions";
    else if (reportType === "increment") typeParam = "increments";

    const params = new URLSearchParams({
      type: typeParam,
      employeeId: selectedEmp,
      performanceMasterId: selectedCycle,
      departmentId: selectedDept,
      status
    });
    window.open(`/api/performance/reports/export?${params.toString()}`, "_blank");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Performance Analytics Reports</h2>
          <p className="text-xs text-slate-500">Filter, extract, and export custom reports across Goals, KPIs, appraisals, promotions, and increments.</p>
        </div>
        <div className="flex gap-2 text-xs font-bold">
          <button onClick={handlePrint} className="px-4 py-2 border rounded-xl hover:bg-slate-50 text-slate-700 bg-white">
            Print Report
          </button>
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-2xs"
          >
            Export to CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-bold gap-4 overflow-x-auto pb-1.5">
        {[
          { key: "employee", label: "Employee Performance" },
          { key: "kpi", label: "KPI Achievement" },
          { key: "okr", label: "OKR Progress" },
          { key: "rating", label: "Rating Report" },
          { key: "promotion", label: "Promotion Report" },
          { key: "increment", label: "Increment Report" }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setReportType(t.key); setRecords([]); }}
            className={`pb-2 border-b-2 px-1 whitespace-nowrap ${
              reportType === t.key ? "border-rose-600 text-rose-600 font-extrabold" : "border-transparent text-slate-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 border p-4 rounded-2xl">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Review Cycle / Date Range</label>
          <select value={selectedCycle} onChange={(e) => setSelectedCycle(e.target.value)} className="w-full border rounded-lg p-2 bg-white text-xs font-semibold">
            <option value="">-- All Cycles --</option>
            {cycles.map(c => <option key={c.id} value={c.id}>{c.cycleName}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Department</label>
          <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="w-full border rounded-lg p-2 bg-white text-xs font-semibold">
            <option value="">-- All Departments --</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.deptName || d.name}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Employee</label>
          <select value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)} className="w-full border rounded-lg p-2 bg-white text-xs font-semibold">
            <option value="">-- All Employees --</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.employeeName}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border rounded-lg p-2 bg-white text-xs font-semibold">
            <option value="">-- All Statuses --</option>
            <option value="Completed">Completed / Approved</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
          </select>
        </div>
      </div>

      {loading && <div className="text-center text-xs text-slate-400 py-8">Compiling report data...</div>}

      {!loading && (
        <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-xs">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs bg-white">
            <thead className="bg-slate-50">
              {(reportType === "employee" || reportType === "rating") && (
                <tr>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase">Employee</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase">Cycle</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase text-center">Self / Mgr / HR</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase text-right">Final Rating</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase">Status</th>
                </tr>
              )}
              {reportType === "kpi" && (
                <tr>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase">Employee</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase">Cycle</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase">Metric</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase text-right">Target</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase text-right">Actual</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase text-right">Weight</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase text-right">Calculated Score</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase">Status</th>
                </tr>
              )}
              {reportType === "okr" && (
                <tr>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase">Employee</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase">Cycle</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase">Goal Title</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase text-right">Weightage</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase text-center">Progress</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase">Status</th>
                </tr>
              )}
              {reportType === "promotion" && (
                <tr>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase">Employee</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase">Proposed Designation</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase">Remarks</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase">Effective Date</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase">Status</th>
                </tr>
              )}
              {reportType === "increment" && (
                <tr>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase">Employee</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase text-right">Current Salary</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase text-right">Increase Amt</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase text-right">New Salary</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase text-center">Score</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase">Effective Date</th>
                  <th className="px-4 py-3 text-slate-500 font-bold uppercase">Status</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
              {records.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-bold text-slate-800">{rec.employee?.employeeName}</td>

                  {(reportType === "employee" || reportType === "rating") && (
                    <>
                      <td className="px-4 py-3">{rec.reviewCycle?.cycleName || '--'}</td>
                      <td className="px-4 py-3 text-center">{rec.selfRating} / {rec.managerRating} / {rec.hrRating}</td>
                      <td className="px-4 py-3 text-right font-black text-rose-600">★ {rec.finalRating}</td>
                    </>
                  )}

                  {reportType === "kpi" && (
                    <>
                      <td className="px-4 py-3">{rec.reviewCycle?.cycleName || '--'}</td>
                      <td className="px-4 py-3 font-bold">{rec.name}</td>
                      <td className="px-4 py-3 text-right">{rec.target}</td>
                      <td className="px-4 py-3 text-right">{rec.actualAchievement}</td>
                      <td className="px-4 py-3 text-right">{rec.weight}%</td>
                      <td className="px-4 py-3 text-right font-black text-rose-600">{rec.calculatedScore}%</td>
                    </>
                  )}

                  {reportType === "okr" && (
                    <>
                      <td className="px-4 py-3">{rec.reviewCycle?.cycleName || '--'}</td>
                      <td className="px-4 py-3 font-bold">{rec.title}</td>
                      <td className="px-4 py-3 text-right">{rec.weightage}%</td>
                      <td className="px-4 py-3 text-center text-indigo-600 font-mono font-bold">{rec.progress}%</td>
                    </>
                  )}

                  {reportType === "promotion" && (
                    <>
                      <td className="px-4 py-3 font-bold text-rose-700">{rec.proposedDesignation?.desigName || 'Proposed Designation'}</td>
                      <td className="px-4 py-3 italic text-slate-500 font-semibold">"{rec.reason}"</td>
                      <td className="px-4 py-3 font-mono">{rec.effectiveDate}</td>
                    </>
                  )}

                  {reportType === "increment" && (
                    <>
                      <td className="px-4 py-3 text-right">₹{Number(rec.currentSalary).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right text-red-500 font-bold">+₹{Number(rec.incrementAmount).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right font-black text-indigo-700">₹{Number(rec.newSalary).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-center font-black">★ {rec.performanceScore}</td>
                      <td className="px-4 py-3 font-mono">{rec.effectiveDate}</td>
                    </>
                  )}

                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[9px] uppercase">
                      {rec.status}
                    </span>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-slate-400 font-semibold">No report logs available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PerformanceReports;
