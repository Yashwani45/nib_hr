// Frontend/src/components/Exit/ExitHistory.jsx
import React, { useEffect, useState, useMemo } from "react";
import { apiFetch } from "../../services/hrApi";
import {
  MagnifyingGlassIcon,
  ClockIcon,
  TableCellsIcon,
  ListBulletIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";
import { SAMPLE_HISTORY, getStatusBadgeClass } from "./exitData";

const ExitHistory = ({ user, onViewEmployee }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("table"); // "table" or "timeline"

  const fetchHistory = async () => {
    try {
      const res = await apiFetch(`/api/exit/history?search=${search}`);
      if (res && res.success && res.data && res.data.length > 0) {
        setRecords(res.data.rows || res.data);
      } else {
        setRecords(SAMPLE_HISTORY);
      }
    } catch (err) {
      console.warn("Using sample exit history:", err);
      setRecords(SAMPLE_HISTORY);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [search]);

  const filteredRecords = useMemo(() => {
    return records.filter(r =>
      r.employee.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      r.activity.toLowerCase().includes(search.toLowerCase()) ||
      r.performedBy.toLowerCase().includes(search.toLowerCase())
    );
  }, [records, search]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header and View Mode Switcher */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Exit History & Separation Audit Trail</h2>
            <p className="text-xs text-slate-400 mt-0.5">Comprehensive audit logs of all status transitions, approvals, and settlements.</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === "table" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <TableCellsIcon className="w-4 h-4" />
                <span>Table View</span>
              </button>
              <button
                onClick={() => setViewMode("timeline")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === "timeline" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ListBulletIcon className="w-4 h-4" />
                <span>Visual Timeline</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative pt-1">
          <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by activity, employee name, EMP ID, or actor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold focus:outline-indigo-500"
          />
        </div>
      </div>

      {/* 1. TABLE VIEW */}
      {viewMode === "table" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4">Date & Time</th>
                  <th className="px-4 py-4">Employee</th>
                  <th className="px-4 py-4">EMP ID</th>
                  <th className="px-4 py-4">Activity</th>
                  <th className="px-4 py-4">Previous Status</th>
                  <th className="px-4 py-4">New Status</th>
                  <th className="px-4 py-4">Performed By</th>
                  <th className="px-4 py-4">Remarks</th>
                  <th className="px-5 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4 font-mono text-slate-500">{r.dateTime}</td>
                    <td className="px-4 py-4 font-bold text-slate-900">{r.employee}</td>
                    <td className="px-4 py-4 font-mono font-bold text-indigo-600">{r.employeeId}</td>
                    <td className="px-4 py-4 font-extrabold text-slate-900">{r.activity}</td>
                    <td className="px-4 py-4 text-slate-400">{r.previousStatus}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusBadgeClass(r.newStatus)}`}>
                        {r.newStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{r.performedBy}</td>
                    <td className="px-4 py-4 text-slate-500">{r.remarks}</td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => onViewEmployee && onViewEmployee(r)}
                        className="px-2.5 py-1 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-slate-200 mx-auto"
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400">
                      No exit history logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. VISUAL VERTICAL TIMELINE VIEW */}
      {viewMode === "timeline" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-sm">
          <div className="relative pl-8 border-l-2 border-indigo-200 space-y-8 max-w-3xl mx-auto">
            {filteredRecords.map((r, i) => (
              <div key={r.id} className="relative group">
                <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-indigo-600 border-4 border-white shadow ring-4 ring-indigo-50" />
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2 hover:shadow-md transition">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900">{r.activity}</h4>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${getStatusBadgeClass(r.newStatus)}`}>
                        {r.newStatus}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-400">{r.dateTime}</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    <span className="font-bold text-slate-900">{r.employee}</span> ({r.employeeId}) • Transitioned from <span className="font-semibold text-slate-500">{r.previousStatus}</span> to <span className="font-semibold text-slate-800">{r.newStatus}</span>
                  </p>

                  <div className="pt-2 border-t border-slate-200 flex flex-wrap justify-between items-center text-[11px] text-slate-400">
                    <span>Performed By: <strong className="text-slate-700">{r.performedBy}</strong></span>
                    {r.remarks && <span className="italic text-slate-500">"{r.remarks}"</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExitHistory;
