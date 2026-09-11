import React, { useState } from "react";
import { PlusIcon, TrashIcon, UserPlusIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { apiFetch } from "../../services/hrApi";
import { useAuth } from "../../auth/AuthProvider";

const Joining = ({ records = [], onRefreshData }) => {
  const { user } = useAuth();
  const userRole = String(typeof user?.role === "object" ? user?.role?.name : user?.role || "").toLowerCase().trim();
  const isEmployee = userRole === "employee";
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncedId, setSyncedId] = useState(null);
  const [formData, setFormData] = useState({
    candidate_name: "",
    candidate_email: "",
    job_title: "",
    joining_date: "",
    status: "Verified",
    employee_code: ""
  });
  const [loading, setLoading] = useState(false);

  if (isEmployee) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs">
          <h3 className="text-sm font-black text-slate-800">My Joining Portal</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">View your position, joining details, and onboarding verification status</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {records.map((rec) => (
            <div key={rec.id} className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider font-mono">
                    Employee Code: {rec.employee_code || "Pending Assignment"}
                  </span>
                </div>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase border ${
                  rec.status === "Synced" || rec.status === "Verified" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {rec.status || "Verified"}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 font-bold block">Candidate Name</span>
                    <span className="font-extrabold text-slate-800">{rec.candidate_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Registered Email</span>
                    <span className="font-extrabold text-slate-800 truncate block">{rec.candidate_email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Job Position</span>
                    <span className="font-extrabold text-slate-850">{rec.job_title}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Joining Date</span>
                    <span className="font-extrabold text-slate-800">{rec.joining_date || "To be communicated"}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 font-semibold leading-relaxed">
                  <p>🚀 <strong>Next Step:</strong> Once HR verifies your documents, they will synchronize your profile to the corporate directory. You will then receive login credentials to access the full Employee Dashboard.</p>
                </div>
              </div>
            </div>
          ))}

          {records.length === 0 && (
            <div className="py-16 text-center bg-white border border-dashed rounded-2xl space-y-3 col-span-full">
              <span className="text-4xl block">🚀</span>
              <h4 className="font-extrabold text-sm text-slate-650">Joining Details Pending</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">Your verified joining details have not been published by HR. Please complete your onboarding checklist first.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const handleCreateJoining = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const uuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      const code = formData.employee_code || "EMP-" + Math.floor(100000 + Math.random() * 900000);
      
      await apiFetch("/api/table/joining_records", {
        method: "POST",
        body: JSON.stringify({ 
          id: uuid, 
          candidate_name: formData.candidate_name,
          candidate_email: formData.candidate_email,
          job_title: formData.job_title,
          joining_date: formData.joining_date,
          status: formData.status,
          employee_code: code
        })
      });
      setShowAddModal(false);
      setFormData({
        candidate_name: "",
        candidate_email: "",
        job_title: "",
        joining_date: "",
        status: "Verified",
        employee_code: ""
      });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to create joining record: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToEmployee = async (record) => {
    setLoading(true);
    try {
      const empUuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      const parts = record.candidate_name.split(" ");
      const firstName = parts[0] || "Candidate";
      const lastName = parts.slice(1).join(" ") || "Joiner";
      const code = record.employee_code || "EMP-" + Math.floor(100000 + Math.random() * 900000);

      // Register new employee in the core employees table
      await apiFetch("/api/table/employees", {
        method: "POST",
        body: JSON.stringify({
          id: empUuid,
          employee_name: record.candidate_name,
          firstName,
          lastName,
          email: record.candidate_email,
          officialEmail: record.candidate_email,
          employeeCode: code,
          employeeId: code,
          department: record.job_title.includes("HR") ? "Human Resources" : "Information Technology",
          dateOfJoining: record.joining_date,
          profileStatus: "Active",
          employeeStatus: "Active",
          role: "Employee",
          profileCompletion: 10
        })
      });

      // Update joining record status to synced
      await apiFetch(`/api/table/joining_records/${record.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...record,
          status: "Synced"
        })
      });

      setSyncedId(record.id);
      setTimeout(() => setSyncedId(null), 4000);
      
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to sync candidate to employee directory: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJoining = async (id) => {
    if (!window.confirm("Are you sure you want to delete this joining record?")) return;
    try {
      await apiFetch(`/api/table/joining_records/${id}`, {
        method: "DELETE"
      });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to delete record.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs">
        <div>
          <h3 className="text-sm font-black text-slate-800">Final Joiner Directory</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">Finalize employee inductions and assign active directory accounts</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/10 hover:shadow-lg transition cursor-pointer"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add Joiner</span>
        </button>
      </div>

      {/* Grid Ledger */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {records.map((rec) => (
          <div key={rec.id} className="bg-white border border-slate-150 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="bg-slate-100 text-slate-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider font-mono">
                  {rec.employee_code || "Code Pending"}
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                  rec.status === "Synced" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"
                } border`}>
                  {rec.status || "Verified"}
                </span>
              </div>

              <h4 className="text-sm font-black text-slate-800 line-clamp-1">{rec.candidate_name}</h4>
              <p className="text-[10px] font-bold text-slate-400">{rec.job_title}</p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-50 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Joining Date:</span>
                <span className="font-semibold text-slate-700">{rec.joining_date || "--"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Email:</span>
                <span className="font-semibold text-slate-700 truncate max-w-[150px]">{rec.candidate_email}</span>
              </div>
            </div>

            {syncedId === rec.id && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-lg text-center flex items-center justify-center gap-1">
                <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                <span>Synced to Directory!</span>
              </div>
            )}

            <div className="pt-4 flex items-center justify-between border-t border-slate-50">
              {rec.status !== "Synced" ? (
                <button
                  type="button"
                  onClick={() => handleSyncToEmployee(rec)}
                  disabled={loading}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black transition flex items-center gap-1 disabled:opacity-50"
                >
                  <UserPlusIcon className="w-3.5 h-3.5" />
                  <span>Sync to Directory</span>
                </button>
              ) : (
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                  ✓ Active Directory Account
                </span>
              )}

              <button
                type="button"
                onClick={() => handleDeleteJoining(rec.id)}
                className="p-1.5 rounded-lg border border-slate-100 hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {records.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white border border-dashed rounded-2xl space-y-3">
            <span className="text-4xl block">🤝</span>
            <h4 className="font-extrabold text-sm text-slate-600">No Final Joiners Listed</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">Create joining records to sync candidates to core employee profiles.</p>
          </div>
        )}
      </div>

      {/* Add Joiner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-50 border-b flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800">Add Pre-Joining Record</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">Pre-populate details prior to final directory sync</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateJoining} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Candidate Name</label>
                  <input
                    type="text"
                    required
                    value={formData.candidate_name}
                    onChange={e => setFormData(prev => ({ ...prev, candidate_name: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. Aditya Rao"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Candidate Email</label>
                  <input
                    type="email"
                    required
                    value={formData.candidate_email}
                    onChange={e => setFormData(prev => ({ ...prev, candidate_email: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. aditya@gmail.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Job Position</label>
                  <input
                    type="text"
                    required
                    value={formData.job_title}
                    onChange={e => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. Senior Frontend Engineer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Employee Code (Optional)</label>
                  <input
                    type="text"
                    value={formData.employee_code}
                    onChange={e => setFormData(prev => ({ ...prev, employee_code: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. EMP-128930"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Joining Date</label>
                  <input
                    type="date"
                    required
                    value={formData.joining_date}
                    onChange={e => setFormData(prev => ({ ...prev, joining_date: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Verification Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Verified">Verified</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-2 -mx-6 -mb-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 bg-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {loading ? "Adding..." : "Add Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Joining;
