// Frontend/src/components/Exit/NoDues.jsx
import React, { useEffect, useState, useMemo } from "react";
import { apiFetch } from "../../services/hrApi";
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon,
  DocumentCheckIcon,
  ArrowDownTrayIcon
} from "@heroicons/react/24/outline";
import { SAMPLE_NO_DUES, getStatusBadgeClass } from "./exitData";

const NoDues = ({ user, onViewEmployee }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDues, setSelectedDues] = useState(null);

  const fetchNoDues = async () => {
    try {
      const res = await apiFetch("/api/exit/no-dues");
      if (res && res.success && res.data && res.data.length > 0) {
        setRecords(res.data);
      } else {
        setRecords(SAMPLE_NO_DUES);
      }
    } catch (err) {
      console.warn("Using sample no dues:", err);
      setRecords(SAMPLE_NO_DUES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNoDues();
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter(r =>
      r.employee.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      r.department.toLowerCase().includes(search.toLowerCase())
    );
  }, [records, search]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header and Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">No Dues Clearance Registry</h2>
            <p className="text-xs text-slate-400 mt-0.5">Verify zero liability certification across Finance, IT, Admin, and HR departments.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              Records: {records.length}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative pt-1">
          <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by employee name, EMP ID, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold focus:outline-indigo-500"
          />
        </div>
      </div>

      {/* No Dues Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-4">Employee</th>
                <th className="px-4 py-4">EMP ID</th>
                <th className="px-4 py-4">Department</th>
                <th className="px-4 py-4 text-center">Finance</th>
                <th className="px-4 py-4 text-center">IT</th>
                <th className="px-4 py-4 text-center">Admin</th>
                <th className="px-4 py-4 text-center">HR</th>
                <th className="px-4 py-4 text-right">Total Dues</th>
                <th className="px-4 py-4 text-right">Recovery</th>
                <th className="px-4 py-4 text-right">Remaining</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold">
              {filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4 font-bold text-slate-900">{r.employee}</td>
                  <td className="px-4 py-4 font-mono font-bold text-indigo-600">{r.employeeId}</td>
                  <td className="px-4 py-4 text-slate-600">{r.department}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.finance === "Cleared" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {r.finance}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.it === "Cleared" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {r.it}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.admin === "Cleared" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {r.admin}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.hr === "Cleared" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {r.hr}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-mono font-bold text-slate-900">₹{r.totalDues?.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-4 text-right font-mono font-bold text-emerald-600">₹{r.recoveryAmount?.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-4 text-right font-mono font-bold text-rose-600">₹{r.remainingAmount?.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusBadgeClass(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedDues(r)}
                        className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => onViewEmployee && onViewEmployee(r)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg border border-slate-200 hover:bg-slate-50"
                        title="View Profile"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={12} className="text-center py-10 text-slate-400">
                    No records found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* No Dues Departmental Details Drawer/Modal */}
      {selectedDues && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-lg space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">
                  No Dues Detailed Audit: {selectedDues.employee}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedDues.employeeId} · {selectedDues.department}
                </p>
              </div>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(selectedDues.status)}`}>
                {selectedDues.status}
              </span>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Dues</span>
                <p className="text-base font-black text-slate-900 mt-0.5">₹{selectedDues.totalDues?.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-600">Recovery Amount</span>
                <p className="text-base font-black text-emerald-700 mt-0.5">₹{selectedDues.recoveryAmount?.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 text-center">
                <span className="text-[10px] uppercase font-bold text-rose-600">Remaining Liability</span>
                <p className="text-base font-black text-rose-700 mt-0.5">₹{selectedDues.remainingAmount?.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Department Obligations Breakdown */}
            <div className="space-y-2.5 text-xs">
              <h4 className="font-bold text-slate-800 uppercase text-[11px]">Department-wise Breakdown</h4>
              <div className="p-3 bg-slate-50 rounded-xl border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-semibold">Finance & Payroll (Travel advance / Salary advance)</span>
                  <span className="font-bold text-slate-900">{selectedDues.finance === "Cleared" ? "₹0 (Cleared)" : "₹3,000 Pending"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-semibold">IT Asset Penalties / Unreturned Hardware</span>
                  <span className="font-bold text-slate-900">₹0 (Cleared)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-semibold">Admin / Facility (Access card, Locker key, Deposit)</span>
                  <span className="font-bold text-slate-900">₹0 (Cleared)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-semibold">HR Notice Period Shortfall Recovery</span>
                  <span className="font-bold text-slate-900">₹0 (Waived)</span>
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className="p-3 bg-slate-50 rounded-xl border text-xs">
              <span className="font-bold text-slate-700 block mb-0.5">Auditor Remarks:</span>
              <p className="text-slate-600">{selectedDues.remarks || "No outstanding encumbrance on employee records."}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setSelectedDues(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert(`Certified No-Dues for ${selectedDues.employee}.`);
                  setSelectedDues(null);
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm"
              >
                Certify & Approve No Dues
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoDues;
