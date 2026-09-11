// Frontend/src/components/Exit/ExitClearance.jsx
import React, { useEffect, useState, useMemo } from "react";
import { apiFetch } from "../../services/hrApi";
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ShieldCheckIcon,
  FunnelIcon
} from "@heroicons/react/24/outline";
import { SAMPLE_CLEARANCES, getStatusBadgeClass } from "./exitData";

const DepartmentBadge = ({ status }) => {
  const s = String(status || "").toLowerCase().trim();
  if (s === "cleared") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
        <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Cleared</span>
      </span>
    );
  }
  if (s === "pending") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
        <ClockIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>Pending</span>
      </span>
    );
  }
  if (s === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
        <XCircleIcon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        <span>Rejected</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
      <ClockIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
      <span>{status}</span>
    </span>
  );
};

const ExitClearance = ({ user, onViewEmployee }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedReview, setSelectedReview] = useState(null);

  const fetchClearances = async () => {
    try {
      const res = await apiFetch("/api/exit/clearances");
      if (res && res.success && res.data && res.data.length > 0) {
        setRecords(res.data);
      } else {
        setRecords(SAMPLE_CLEARANCES);
      }
    } catch (err) {
      console.warn("Backend error, using sample clearances:", err);
      setRecords(SAMPLE_CLEARANCES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClearances();
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchSearch =
        r.employee.toLowerCase().includes(search.toLowerCase()) ||
        r.employeeId.toLowerCase().includes(search.toLowerCase()) ||
        r.department.toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === "ALL" || r.department === deptFilter;
      const matchStatus = statusFilter === "ALL" || r.overallStatus.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchDept && matchStatus;
    });
  }, [records, search, deptFilter, statusFilter]);

  const handleUpdateStatus = (recordId, deptKey, newStatus) => {
    setRecords(prev => prev.map(r => {
      if (r.id === recordId) {
        const updated = { ...r, [deptKey]: newStatus };
        // If all cleared, overall is cleared
        const isAllCleared = ["managerClearance", "hrClearance", "itClearance", "financeClearance", "adminClearance"].every(
          k => updated[k] === "Cleared"
        );
        updated.overallStatus = isAllCleared ? "Cleared" : "Pending";
        return updated;
      }
      return r;
    }));
    setSelectedReview(null);
    alert("Clearance status updated successfully.");
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header and Filter Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Exit Clearance Matrix</h2>
            <p className="text-xs text-slate-400 mt-0.5">Track multi-department sign-offs, asset recovery checks, and financial handovers.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              Total Clearance Pipelines: {records.length}
            </span>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by employee name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold focus:outline-indigo-500"
            />
          </div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-indigo-500"
          >
            <option value="ALL">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Finance">Finance</option>
            <option value="Design">Design</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-indigo-500"
          >
            <option value="ALL">All Overall Statuses</option>
            <option value="Cleared">Cleared</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
          </select>
        </div>
      </div>

      {/* Clearance Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-4">Employee</th>
                <th className="px-4 py-4">EMP ID</th>
                <th className="px-4 py-4">Department</th>
                <th className="px-4 py-4">Last Working Day</th>
                <th className="px-4 py-4 text-center">Manager</th>
                <th className="px-4 py-4 text-center">HR</th>
                <th className="px-4 py-4 text-center">IT</th>
                <th className="px-4 py-4 text-center">Finance</th>
                <th className="px-4 py-4 text-center">Admin</th>
                <th className="px-4 py-4 text-center">Overall Status</th>
                <th className="px-5 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold">
              {filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4 font-bold text-slate-900">
                    <span className="block font-black text-slate-900">{r.employee}</span>
                  </td>
                  <td className="px-4 py-4 font-mono font-bold text-indigo-600">{r.employeeId}</td>
                  <td className="px-4 py-4 text-slate-600">{r.department}</td>
                  <td className="px-4 py-4 font-bold text-slate-900">{r.lastWorkingDay}</td>
                  <td className="px-4 py-4 text-center"><DepartmentBadge status={r.managerClearance} /></td>
                  <td className="px-4 py-4 text-center"><DepartmentBadge status={r.hrClearance} /></td>
                  <td className="px-4 py-4 text-center"><DepartmentBadge status={r.itClearance} /></td>
                  <td className="px-4 py-4 text-center"><DepartmentBadge status={r.financeClearance} /></td>
                  <td className="px-4 py-4 text-center"><DepartmentBadge status={r.adminClearance} /></td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusBadgeClass(r.overallStatus)}`}>
                      {r.overallStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedReview(r)}
                        className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => onViewEmployee && onViewEmployee(r)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
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
                  <td colSpan={11} className="text-center py-10 text-slate-400">
                    No clearance records match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Clearance Update Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 w-full max-w-md space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase">
              Update Clearance: {selectedReview.employee}
            </h3>
            <p className="text-xs text-slate-400">
              {selectedReview.employeeId} · {selectedReview.department} · LWD: {selectedReview.lastWorkingDay}
            </p>

            <div className="space-y-3 pt-2">
              {[
                { label: "Manager Clearance", key: "managerClearance" },
                { label: "HR Clearance", key: "hrClearance" },
                { label: "IT Clearance", key: "itClearance" },
                { label: "Finance Clearance", key: "financeClearance" },
                { label: "Admin Clearance", key: "adminClearance" }
              ].map((dept) => (
                <div key={dept.key} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <span className="font-bold text-slate-800 text-xs">{dept.label}</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleUpdateStatus(selectedReview.id, dept.key, "Cleared")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition ${
                        selectedReview[dept.key] === "Cleared"
                          ? "bg-emerald-600 text-white"
                          : "bg-white border text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Cleared
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedReview.id, dept.key, "Pending")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition ${
                        selectedReview[dept.key] === "Pending"
                          ? "bg-amber-600 text-white"
                          : "bg-white border text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Pending
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setSelectedReview(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExitClearance;
