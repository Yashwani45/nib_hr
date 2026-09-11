import React, { useState, useMemo } from "react";
import {
  ClockIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  SparklesIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  UserIcon,
  CheckBadgeIcon
} from "@heroicons/react/24/outline";

const OvertimeMaster = ({ records = [], onAdd, onUpdate, onDelete, onExport }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(null);

  const initialForm = {
    overtimeName: "",
    rateMultiplier: 1.5,
    minHours: 1.0,
    maxHours: 4.0,
    applicableDept: "All Departments",
    requiresManagerApproval: true,
    requiresHrApproval: true,
    payrollIntegrated: true,
    status: "Active"
  };
  const [formData, setFormData] = useState(initialForm);

  const defaultOvertimes = useMemo(() => {
    if (Array.isArray(records) && records.length > 0) return records;
    return [
      { id: "1", overtimeName: "Standard Workday OT (1.5x)", rateMultiplier: 1.5, minHours: 1.0, maxHours: 4.0, applicableDept: "All Departments", requiresManagerApproval: true, requiresHrApproval: false, payrollIntegrated: true, status: "Active" },
      { id: "2", overtimeName: "Weekend / Sunday OT (2.0x)", rateMultiplier: 2.0, minHours: 2.0, maxHours: 8.0, applicableDept: "All Departments", requiresManagerApproval: true, requiresHrApproval: true, payrollIntegrated: true, status: "Active" },
      { id: "3", overtimeName: "Public Holiday Double Pay OT (2.5x)", rateMultiplier: 2.5, minHours: 2.0, maxHours: 8.0, applicableDept: "Operations & Support", requiresManagerApproval: true, requiresHrApproval: true, payrollIntegrated: true, status: "Active" },
      { id: "4", overtimeName: "Night Shift Extra OT", rateMultiplier: 1.75, minHours: 1.5, maxHours: 5.0, applicableDept: "IT & Infrastructure", requiresManagerApproval: true, requiresHrApproval: false, payrollIntegrated: true, status: "Active" },
    ];
  }, [records]);

  const filteredRecords = useMemo(() => {
    return defaultOvertimes.filter(item => {
      const matchSearch =
        (item.overtimeName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.applicableDept || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = deptFilter === "ALL" || item.applicableDept === deptFilter;
      return matchSearch && matchDept;
    });
  }, [defaultOvertimes, searchTerm, deptFilter]);

  const stats = useMemo(() => {
    const total = defaultOvertimes.length;
    const payrollSync = defaultOvertimes.filter(o => o.payrollIntegrated).length;
    const avgMultiplier = (defaultOvertimes.reduce((a, b) => a + (b.rateMultiplier || 1), 0) / (total || 1)).toFixed(2);
    return { total, payrollSync, avgMultiplier };
  }, [defaultOvertimes]);

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setFormData(initialForm);
    setShowAddModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingRecord(item);
    setFormData({ ...item });
    setShowAddModal(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (editingRecord) {
      if (onUpdate) onUpdate(editingRecord.id, formData);
    } else {
      if (onAdd) onAdd(formData);
    }
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-700 via-orange-800 to-slate-900 text-white p-6 sm:p-8 shadow-2xl border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
              <ClockIcon className="h-10 w-10 text-amber-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-amber-400/20 text-amber-200 border border-amber-400/30 rounded-full text-[10px] font-mono font-bold uppercase">
                  Attendance & Payroll
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 rounded-full text-[10px] font-bold">
                  ● Overtime Rules
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Overtime Master</h2>
              <p className="text-xs sm:text-sm text-amber-100/80 font-medium max-w-xl mt-1">
                Manage overtime pay multipliers, minimum/maximum hour limits, approval workflows, and payroll sync.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl text-xs font-bold shadow-lg transition transform active:scale-95 cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" /> Add Overtime Rule
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total OT Master Rules</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <ClockIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payroll Integrated</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats.payrollSync} Rules</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircleIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Rate Multiplier</span>
            <p className="text-2xl font-black text-indigo-600 mt-1">{stats.avgMultiplier}x</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <CurrencyDollarIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search overtime rule name or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
            />
          </div>

          <button
            onClick={() => onExport && onExport("excel")}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition"
          >
            <ArrowDownTrayIcon className="w-4 h-4" /> Export
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Overtime Rule Name</th>
                <th className="p-4">Rate Multiplier</th>
                <th className="p-4">Min / Max Hours</th>
                <th className="p-4">Applicable Dept</th>
                <th className="p-4">Approvals</th>
                <th className="p-4">Payroll Sync</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredRecords.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 font-bold text-slate-900">{item.overtimeName}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 font-black rounded-full text-xs">
                      {item.rateMultiplier}x
                    </span>
                  </td>
                  <td className="p-4 font-mono text-slate-700">{item.minHours} hrs - {item.maxHours} hrs</td>
                  <td className="p-4">{item.applicableDept}</td>
                  <td className="p-4 text-xs font-semibold text-slate-600">
                    {item.requiresManagerApproval && item.requiresHrApproval ? "Manager + HR" : item.requiresManagerApproval ? "Manager Only" : "Auto Approved"}
                  </td>
                  <td className="p-4 font-bold text-emerald-600">
                    {item.payrollIntegrated ? "Integrated" : "Manual"}
                  </td>
                  <td className="p-4 font-bold text-emerald-600">{item.status}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingRecord(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingRecord ? "Edit Overtime Rule" : "Add Overtime Rule"}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Overtime Rule Name</label>
                <input
                  type="text"
                  required
                  value={formData.overtimeName}
                  onChange={(e) => setFormData({ ...formData, overtimeName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Rate (e.g. 1.5)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={formData.rateMultiplier}
                    onChange={(e) => setFormData({ ...formData, rateMultiplier: parseFloat(e.target.value) || 1.0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Min Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.minHours}
                    onChange={(e) => setFormData({ ...formData, minHours: parseFloat(e.target.value) || 1.0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Max Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.maxHours}
                    onChange={(e) => setFormData({ ...formData, maxHours: parseFloat(e.target.value) || 4.0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Applicable Department</label>
                <input
                  type="text"
                  value={formData.applicableDept}
                  onChange={(e) => setFormData({ ...formData, applicableDept: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Save OT Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OvertimeMaster;
