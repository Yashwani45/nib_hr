import React, { useState, useEffect } from "react";
import { apiFetch } from "../../services/hrApi";

const PayrollProcess = ({ onRefreshData }) => {
  const [runs, setRuns] = useState([]);
  const [activeRun, setActiveRun] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Form to create new run
  const [month, setMonth] = useState("January");
  const [year, setYear] = useState("2026");

  const loadRuns = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/finance/runs");
      if (res && res.data) {
        setRuns(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const handleCreateRun = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/finance/runs", {
        method: "POST",
        body: JSON.stringify({ month, year })
      });
      alert("Payroll run initialized as Draft!");
      loadRuns();
      if (res?.data) {
        handleViewDetails(res.data.id);
      }
    } catch (err) {
      alert(err.message || "Failed to initialize run.");
    }
  };

  const handleViewDetails = async (id) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/finance/runs/${id}`);
      if (res && res.data) {
        setActiveRun(res.data);
      }
    } catch (err) {
      alert(err.message || "Failed to load run details.");
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async (id) => {
    setCalculating(true);
    try {
      const res = await apiFetch(`/api/finance/runs/${id}/calculate`, { method: "POST" });
      alert("Calculations completed successfully for all active employees!");
      handleViewDetails(id);
      loadRuns();
    } catch (err) {
      alert(err.message || "Calculation failed. Transactions rolled back.");
    } finally {
      setCalculating(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Are you sure you want to approve this payroll run? This will submit it for processing.")) return;
    try {
      await apiFetch(`/api/finance/runs/${id}/approve`, { method: "POST" });
      alert("Payroll run approved!");
      handleViewDetails(id);
      loadRuns();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleProcess = async (id) => {
    if (!window.confirm("Proceed to PROCESS payroll? This will finalize net salary payouts, generate immutable employee payslips, log loan repayments, and update statutory contributions.")) return;
    setCalculating(true);
    try {
      await apiFetch(`/api/finance/runs/${id}/process`, { method: "POST" });
      alert("Payroll processed successfully! Payslips generated and loans updated.");
      handleViewDetails(id);
      loadRuns();
    } catch (err) {
      alert(err.message);
    } finally {
      setCalculating(false);
    }
  };

  const handleLock = async (id) => {
    if (!window.confirm("Lock this payroll run? This prevents any future calculations or status modifications.")) return;
    try {
      await apiFetch(`/api/finance/runs/${id}/lock`, { method: "POST" });
      alert("Payroll run locked!");
      handleViewDetails(id);
      loadRuns();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this payroll run?")) return;
    try {
      await apiFetch(`/api/finance/runs/${id}/cancel`, { method: "POST" });
      alert("Payroll run cancelled.");
      handleViewDetails(id);
      loadRuns();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Monthly Payroll Processing</h2>
          <p className="text-xs text-slate-500">Initialize monthly payroll runs, fetch attendance outputs, perform statutory calculations, and lock finalized payments.</p>
        </div>
        
        {/* Create Run Form */}
        <form onSubmit={handleCreateRun} className="flex gap-2 bg-slate-50 border p-2 rounded-xl">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="text-xs border rounded-lg p-1.5 bg-white font-bold"
          >
            {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="text-xs border rounded-lg p-1.5 bg-white font-bold"
          >
            {["2025", "2026", "2027"].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            type="submit"
            className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg shadow-2xs"
          >
            + Create Run
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Runs List */}
        <div className="space-y-4 lg:col-span-1 border-r pr-0 lg:pr-6">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Payroll Run History</h3>
          {loading && <div className="text-xs text-slate-400">Loading history...</div>}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {runs.map(run => (
              <div
                key={run.id}
                onClick={() => handleViewDetails(run.id)}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  activeRun?.id === run.id ? "bg-indigo-50/50 border-indigo-200" : "bg-white border-slate-100 hover:border-slate-200"
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{run.month} {run.year}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">ID: {run.id.slice(0, 8)}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] border uppercase ${
                  run.status === "Locked" ? "bg-gray-100 text-gray-700 border-gray-200" :
                  run.status === "Processed" ? "bg-green-50 text-green-700 border-green-200" :
                  run.status === "Approved" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                  run.status === "Pending_Approval" ? "bg-amber-50 text-amber-700 border-amber-200" :
                  "bg-slate-50 text-slate-600 border-slate-200"
                }`}>
                  {run.status}
                </span>
              </div>
            ))}
            {runs.length === 0 && <div className="text-xs text-slate-400 py-6">No payroll runs created yet.</div>}
          </div>
        </div>

        {/* Right: Active Run Calculator details */}
        <div className="lg:col-span-2 space-y-6">
          {activeRun ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 gap-4">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">{activeRun.month} {activeRun.year} Details</h3>
                  <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Run Status: {activeRun.status.toUpperCase()}</span>
                </div>
                
                {/* Control Panel Actions */}
                <div className="flex gap-2 flex-wrap">
                  {activeRun.status === "Draft" && (
                    <>
                      <button
                        onClick={() => handleCalculate(activeRun.id)}
                        disabled={calculating}
                        className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                      >
                        {calculating ? "Calculating..." : "Compute / Recalculate"}
                      </button>
                      <button
                        onClick={() => handleApprove(activeRun.id)}
                        className="px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                      >
                        Submit / Approve
                      </button>
                    </>
                  )}

                  {activeRun.status === "Approved" && (
                    <button
                      onClick={() => handleProcess(activeRun.id)}
                      disabled={calculating}
                      className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {calculating ? "Processing..." : "Process Payroll"}
                    </button>
                  )}

                  {activeRun.status === "Processed" && (
                    <button
                      onClick={() => handleLock(activeRun.id)}
                      className="px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
                    >
                      Lock Payroll
                    </button>
                  )}

                  {activeRun.status !== "Locked" && activeRun.status !== "Cancelled" && (
                    <button
                      onClick={() => handleCancel(activeRun.id)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                    >
                      Cancel Run
                    </button>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-600">Employee Deductions & Payouts Breakdown</h4>
                
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="min-w-full divide-y divide-slate-100 text-left text-xs bg-white">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-slate-500 font-bold uppercase tracking-wider">Employee</th>
                        <th className="px-3 py-2 text-slate-500 font-bold uppercase tracking-wider text-center">Working/LOP Days</th>
                        <th className="px-3 py-2 text-slate-500 font-bold uppercase tracking-wider text-right">Gross Salary</th>
                        <th className="px-3 py-2 text-slate-500 font-bold uppercase tracking-wider text-right">Deductions</th>
                        <th className="px-3 py-2 text-slate-500 font-bold uppercase tracking-wider text-right">Net Salary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {activeRun.items?.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2">
                            <span className="font-bold text-slate-800 block">{item.employee?.employeeName || 'Unknown'}</span>
                            <span className="text-[10px] text-slate-400 font-bold block">{item.employee?.employeeCode || item.employee?.emp_code || 'No Code'}</span>
                          </td>
                          <td className="px-3 py-2 text-center text-slate-600 font-semibold">
                            {item.workingDays}d / <span className="text-red-500">{item.lopDays}d LOP</span>
                          </td>
                          <td className="px-3 py-2 text-right text-slate-700 font-semibold">
                            ₹{Number(item.grossSalary).toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-2 text-right text-red-500 font-semibold">
                            -₹{Number(item.totalDeductions).toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-2 text-right text-indigo-700 font-black">
                            ₹{Number(item.netSalary).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                      {!activeRun.items || activeRun.items.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-6 text-slate-400">
                            No computations generated. Click "Compute / Recalculate" to start!
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-xs text-slate-400 py-16 border border-dashed rounded-2xl bg-slate-50/50">
              Select a payroll run from the history panel on the left to inspect, calculate, and approve payouts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayrollProcess;
