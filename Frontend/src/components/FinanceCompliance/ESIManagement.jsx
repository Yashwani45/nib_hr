import React, { useState, useEffect } from "react";
import { apiFetch } from "../../services/hrApi";

const ESIManagement = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [month, setMonth] = useState("January");
  const [year, setYear] = useState("2026");

  const loadReport = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ type: 'esi', month, year }).toString();
      const res = await apiFetch(`/api/finance/esi/report?${q}`);
      if (res && res.data) {
        setReportData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [month, year]);

  const handleExport = () => {
    window.open(`http://localhost:5000/api/finance/reports/export?type=esi&month=${month}&year=${year}`, "_blank");
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">ESI Statutory Contributions</h2>
          <p className="text-xs text-slate-500">Track employee ESI applicability (wages &lt;= 21,000), employee (0.75%) and employer (3.25%) contributions details.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50"
          >
            Export Report (CSV)
          </button>
        </div>
      </div>

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Eligible Employees Covered", val: reportData.summary?.totalEmployees || 0, color: "bg-indigo-50 border-indigo-100 text-indigo-700" },
            { label: "Total Employee Contribution (0.75%)", val: `₹${(reportData.summary?.totalEmployeeContribution || 0).toLocaleString('en-IN')}`, color: "bg-amber-50 border-amber-100 text-amber-700" },
            { label: "Total Employer Contribution (3.25%)", val: `₹${(reportData.summary?.totalEmployerContribution || 0).toLocaleString('en-IN')}`, color: "bg-emerald-50 border-emerald-100 text-emerald-700" },
            { label: "Total ESI Challan Value", val: `₹${(reportData.summary?.totalContribution || 0).toLocaleString('en-IN')}`, color: "bg-sky-50 border-sky-100 text-sky-700" }
          ].map((c, i) => (
            <div key={i} className={`p-4 border rounded-2xl flex flex-col justify-between ${c.color} shadow-2xs`}>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">{c.label}</span>
              <span className="text-xl font-extrabold mt-2 block">{c.val}</span>
            </div>
          ))}
        </div>
      )}

      {loading && <div className="text-center text-xs text-slate-400 py-8">Compiling ESI report...</div>}

      {!loading && reportData && (
        <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-xs">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs bg-white">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider">Employee Name</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider">ESIC Number</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-right">Gross Wages</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-right">Employee Contrib (0.75%)</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-right">Employer Contrib (3.25%)</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-right">Total Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reportData.records?.map((rec, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-bold text-slate-800">{rec.employeeName}</td>
                  <td className="px-4 py-3 text-slate-600 font-semibold">{rec.esiNumber || '--'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-700">₹{Number(rec.grossWages).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right font-semibold text-red-500">₹{Number(rec.employeeContribution).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right font-semibold text-red-500">₹{Number(rec.employerContribution).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right font-black text-indigo-700">₹{Number(rec.employeeContribution + rec.employerContribution).toLocaleString('en-IN')}</td>
                </tr>
              ))}
              {(!reportData.records || reportData.records.length === 0) && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400">
                    No ESI records found for this period. Ensure payroll has been processed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ESIManagement;
