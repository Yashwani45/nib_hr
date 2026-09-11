import React, { useState, useMemo } from "react";
import {
  CalendarDaysIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  XMarkIcon,
  CheckIcon,
  XCircleIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

const LeaveTypes = ({ records = [], onAdd, onUpdate, onDelete, onExport }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [paidFilter, setPaidFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [activeTab, setActiveTab] = useState("list"); // 'list' | 'rules'

  const initialForm = {
    leaveCode: "",
    leaveName: "",
    paidType: "Paid",
    maxDays: 12,
    carryForward: false,
    maxCarryForwardDays: 0,
    encashment: false,
    approvalWorkflow: "Manager -> HR",
    status: "Active"
  };
  const [formData, setFormData] = useState(initialForm);

  const defaultLeaveTypes = useMemo(() => {
    if (Array.isArray(records) && records.length > 0) return records;
    return [
      { id: "1", leaveCode: "CL", leaveName: "Casual Leave", paidType: "Paid", maxDays: 12, carryForward: false, maxCarryForwardDays: 0, encashment: false, approvalWorkflow: "Manager Approval", status: "Active" },
      { id: "2", leaveCode: "SL", leaveName: "Sick Leave", paidType: "Paid", maxDays: 10, carryForward: true, maxCarryForwardDays: 5, encashment: false, approvalWorkflow: "Manager Approval + Medical Certificate (>3 days)", status: "Active" },
      { id: "3", leaveCode: "EL", leaveName: "Earned / Privilege Leave", paidType: "Paid", maxDays: 18, carryForward: true, maxCarryForwardDays: 30, encashment: true, approvalWorkflow: "Manager -> HR Approval", status: "Active" },
      { id: "4", leaveCode: "ML", leaveName: "Maternity Leave", paidType: "Paid", maxDays: 180, carryForward: false, maxCarryForwardDays: 0, encashment: false, approvalWorkflow: "HR Approval", status: "Active" },
      { id: "5", leaveCode: "PL", leaveName: "Paternity Leave", paidType: "Paid", maxDays: 15, carryForward: false, maxCarryForwardDays: 0, encashment: false, approvalWorkflow: "Manager Approval", status: "Active" },
      { id: "6", leaveCode: "LWP", leaveName: "Leave Without Pay", paidType: "Unpaid", maxDays: 90, carryForward: false, maxCarryForwardDays: 0, encashment: false, approvalWorkflow: "Director / HR Head Approval", status: "Active" }
    ];
  }, [records]);

  const filteredRecords = useMemo(() => {
    return defaultLeaveTypes.filter(item => {
      const matchSearch =
        (item.leaveName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.leaveCode || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchPaid = paidFilter === "ALL" || item.paidType === paidFilter;
      return matchSearch && matchPaid;
    });
  }, [defaultLeaveTypes, searchTerm, paidFilter]);

  const stats = useMemo(() => {
    const total = defaultLeaveTypes.length;
    const paid = defaultLeaveTypes.filter(l => l.paidType === "Paid").length;
    const encashable = defaultLeaveTypes.filter(l => l.encashment).length;
    const carryForward = defaultLeaveTypes.filter(l => l.carryForward).length;
    return { total, paid, encashable, carryForward };
  }, [defaultLeaveTypes]);

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setFormData({
      ...initialForm,
      leaveCode: `LV-${Math.floor(10 + Math.random() * 90)}`
    });
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 via-emerald-800 to-slate-900 text-white p-6 sm:p-8 shadow-2xl border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
              <CalendarDaysIcon className="h-10 w-10 text-teal-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-teal-400/20 text-teal-200 border border-teal-400/30 rounded-full text-[10px] font-mono font-bold uppercase">
                  Leave Setup
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 rounded-full text-[10px] font-bold">
                  ● Master Configuration
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Leave Type Master</h2>
              <p className="text-xs sm:text-sm text-teal-100/80 font-medium max-w-xl mt-1">
                Define paid & unpaid leave quotas, carry forward limits, encashment policies, and approval chains.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl text-xs font-bold shadow-lg transition transform active:scale-95 cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" /> Add Leave Type
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Leave Categories</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <CalendarDaysIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paid Leaves</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats.paid}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircleIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Encashable Types</span>
            <p className="text-2xl font-black text-indigo-600 mt-1">{stats.encashable}</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <SparklesIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Carry Forwardable</span>
            <p className="text-2xl font-black text-purple-600 mt-1">{stats.carryForward}</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <ArrowPathIcon className="w-6 h-6" />
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
              placeholder="Search leave name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={paidFilter}
              onChange={(e) => setPaidFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
            >
              <option value="ALL">All Types</option>
              <option value="Paid">Paid Only</option>
              <option value="Unpaid">Unpaid Only</option>
            </select>

            <button
              onClick={() => onExport && onExport("excel")}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition"
            >
              <ArrowDownTrayIcon className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Code</th>
                <th className="p-4">Leave Name</th>
                <th className="p-4">Paid / Unpaid</th>
                <th className="p-4">Annual Quota</th>
                <th className="p-4">Carry Forward</th>
                <th className="p-4">Encashment</th>
                <th className="p-4">Approval Chain</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredRecords.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 font-mono font-bold text-slate-900">{item.leaveCode}</td>
                  <td className="p-4 font-bold text-slate-900">{item.leaveName}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      item.paidType === "Paid" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {item.paidType}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-indigo-600">{item.maxDays} Days</td>
                  <td className="p-4 font-semibold">
                    {item.carryForward ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckIcon className="w-4 h-4" /> Max {item.maxCarryForwardDays} Days
                      </span>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>
                  <td className="p-4 font-semibold">
                    {item.encashment ? (
                      <span className="text-indigo-600 font-bold">Yes</span>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-500">{item.approvalWorkflow}</td>
                  <td className="p-4 font-bold text-emerald-600">{item.status}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 transition"
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
                {editingRecord ? "Edit Leave Type" : "Add Leave Type"}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Leave Code</label>
                  <input
                    type="text"
                    required
                    value={formData.leaveCode}
                    onChange={(e) => setFormData({ ...formData, leaveCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Leave Name</label>
                  <input
                    type="text"
                    required
                    value={formData.leaveName}
                    onChange={(e) => setFormData({ ...formData, leaveName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Paid Type</label>
                  <select
                    value={formData.paidType}
                    onChange={(e) => setFormData({ ...formData, paidType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Max Days / Year</label>
                  <input
                    type="number"
                    value={formData.maxDays}
                    onChange={(e) => setFormData({ ...formData, maxDays: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.carryForward}
                    onChange={(e) => setFormData({ ...formData, carryForward: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  Carry Forward
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.encashment}
                    onChange={(e) => setFormData({ ...formData, encashment: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  Encashment Allowed
                </label>
              </div>

              {formData.carryForward && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Max Carry Forward Days</label>
                  <input
                    type="number"
                    value={formData.maxCarryForwardDays}
                    onChange={(e) => setFormData({ ...formData, maxCarryForwardDays: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Approval Workflow</label>
                <input
                  type="text"
                  value={formData.approvalWorkflow}
                  onChange={(e) => setFormData({ ...formData, approvalWorkflow: e.target.value })}
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
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Save Leave Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveTypes;
