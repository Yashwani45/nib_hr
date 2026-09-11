import React, { useEffect, useState } from "react";
import { apiFetch } from "../../services/hrApi";

const NoticePeriod = ({ user }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    revisedLwd: "",
    earlyRelease: false,
    noticeBuyout: false,
    noticeBuyoutAmount: 0,
    extensionDays: 0,
    status: "Active"
  });

  const userRole = String(user?.role?.name || user?.role || "").toLowerCase().trim();
  const isHR = ["admin", "superadmin", "hr"].includes(userRole);

  const fetchNoticePeriods = async () => {
    try {
      const response = await apiFetch("/api/exit/notice-periods");
      if (response && response.success) {
        setRecords(response.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNoticePeriods();
  }, []);

  const handleEdit = (r) => {
    setEditingId(r.id);
    setFormData({
      revisedLwd: r.revisedLwd || "",
      earlyRelease: r.earlyRelease || false,
      noticeBuyout: r.noticeBuyout || false,
      noticeBuyoutAmount: r.noticeBuyoutAmount || 0,
      extensionDays: r.extensionDays || 0,
      status: r.status || "Active"
    });
  };

  const handleSave = async (id) => {
    try {
      const response = await apiFetch(`/api/exit/notice-periods/${id}`, {
        method: "PUT",
        body: JSON.stringify(formData)
      });
      if (response && response.success) {
        setEditingId(null);
        fetchNoticePeriods();
      }
    } catch (err) {
      alert(err.message || "Failed to update notice period.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-slate-900">Notice Period Tracker</h2>
        <p className="text-xs text-slate-400">Track and manage employee notice execution parameters.</p>
      </div>

      <div className="space-y-4">
        {records.map((r) => {
          // Calculations
          const start = new Date(r.startDate);
          const end = new Date(r.revisedLwd || r.originalLwd);
          const today = new Date();

          const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
          const completedDays = Math.max(0, Math.min(totalDays, Math.round((today - start) / (1000 * 60 * 60 * 24))));
          const remainingDays = Math.max(0, totalDays - completedDays);
          const pct = Math.round((completedDays / totalDays) * 100);

          const isEditing = editingId === r.id;

          return (
            <div key={r.id} className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b pb-4">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    {r.employee?.employeeName || "Standard Employee"}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                    {r.employee?.department || "General"} • {r.employee?.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                    r.status === "Completed" ? "bg-green-50 text-green-700 border-green-200" :
                    r.status === "Waived" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    Notice Status: {r.status}
                  </span>
                  {isHR && !isEditing && (
                    <button
                      onClick={() => handleEdit(r)}
                      className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-[10px] rounded-lg hover:bg-indigo-100 transition"
                    >
                      Manage
                    </button>
                  )}
                </div>
              </div>

              {/* Progress and Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Visual Progress Bar */}
                <div className="md:col-span-2 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>Notice Progress</span>
                    <span>{pct}% ({completedDays} / {totalDays} Days)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 border overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                    <span>Start: {r.startDate}</span>
                    <span>Remaining: {remainingDays} Days</span>
                    <span>LWD: {r.revisedLwd || r.originalLwd}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="bg-slate-50 border border-slate-200/40 rounded-2xl p-4 grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <div>
                    <span>Notice Duration:</span>
                    <p className="text-slate-800 text-xs font-extrabold mt-0.5">{r.noticePeriodDays} Days</p>
                  </div>
                  <div>
                    <span>Buyout Option:</span>
                    <p className="text-slate-800 text-xs font-extrabold mt-0.5">
                      {r.noticeBuyout ? `Buyout (₹${r.noticeBuyoutAmount})` : "No Buyout"}
                    </p>
                  </div>
                  <div>
                    <span>Early Release:</span>
                    <p className="text-slate-800 text-xs font-extrabold mt-0.5">
                      {r.earlyRelease ? "Approved" : "Standard notice"}
                    </p>
                  </div>
                  <div>
                    <span>Extension:</span>
                    <p className="text-slate-800 text-xs font-extrabold mt-0.5">
                      {r.extensionDays > 0 ? `${r.extensionDays} Days` : "No Extension"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Edit Mode Panel */}
              {isEditing && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                  <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Manage Parameters</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Revised LWD</label>
                      <input
                        type="date"
                        value={formData.revisedLwd}
                        onChange={(e) => setFormData({ ...formData, revisedLwd: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Notice Buyout Amount</label>
                      <input
                        type="number"
                        value={formData.noticeBuyoutAmount}
                        onChange={(e) => setFormData({ ...formData, noticeBuyoutAmount: Number(e.target.value), noticeBuyout: Number(e.target.value) > 0 })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Extension Days</label>
                      <input
                        type="number"
                        value={formData.extensionDays}
                        onChange={(e) => setFormData({ ...formData, extensionDays: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.earlyRelease}
                        onChange={(e) => setFormData({ ...formData, earlyRelease: e.target.checked })}
                        className="rounded text-indigo-600"
                      />
                      Approve Early Release
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.noticeBuyout}
                        onChange={(e) => setFormData({ ...formData, noticeBuyout: e.target.checked })}
                        className="rounded text-indigo-600"
                      />
                      Enable Buyout
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSave(r.id)}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
                    >
                      Save Parameters
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {records.length === 0 && (
          <div className="text-center py-12 border border-dashed rounded-3xl bg-gray-50/50 p-6 text-slate-400">
            No active notice trackers found.
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticePeriod;
