import React, { useState, useMemo } from "react";
import {
  BanknotesIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  SparklesIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  GiftIcon
} from "@heroicons/react/24/outline";

const BonusMaster = ({ records = [], onAdd, onUpdate, onDelete, onExport }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(null);

  const initialForm = {
    bonusName: "",
    bonusType: "Performance",
    calculationType: "Fixed Amount",
    value: 5000,
    department: "All Departments",
    designation: "All Designations",
    payoutFrequency: "Annually",
    status: "Active"
  };
  const [formData, setFormData] = useState(initialForm);

  const defaultBonuses = useMemo(() => {
    if (Array.isArray(records) && records.length > 0) return records;
    return [
      { id: "1", bonusName: "Diwali Festive Bonus", bonusType: "Festival/Diwali", calculationType: "Fixed Amount", value: 10000, department: "All Departments", designation: "All Designations", payoutFrequency: "Annually", status: "Active" },
      { id: "2", bonusName: "Annual Statutory Bonus", bonusType: "Annual Statutory", calculationType: "Percentage of Basic", value: 8.33, department: "All Departments", designation: "Staff & Executives", payoutFrequency: "Annually", status: "Active" },
      { id: "3", bonusName: "Quarterly Performance Bonus", bonusType: "Performance", calculationType: "Fixed Amount", value: 25000, department: "Engineering & Sales", designation: "Senior Roles", payoutFrequency: "Quarterly", status: "Active" },
      { id: "4", bonusName: "Project Delivery Milestone", bonusType: "Project Milestone", calculationType: "Fixed Amount", value: 15000, department: "Software Development", designation: "Developers", payoutFrequency: "One-Time", status: "Active" },
    ];
  }, [records]);

  const filteredRecords = useMemo(() => {
    return defaultBonuses.filter(item => {
      const matchSearch =
        (item.bonusName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.department || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === "ALL" || item.bonusType === typeFilter;
      return matchSearch && matchType;
    });
  }, [defaultBonuses, searchTerm, typeFilter]);

  const stats = useMemo(() => {
    const total = defaultBonuses.length;
    const performance = defaultBonuses.filter(b => b.bonusType === "Performance").length;
    const festive = defaultBonuses.filter(b => b.bonusType.includes("Festival")).length;
    return { total, performance, festive };
  }, [defaultBonuses]);

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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-700 via-purple-800 to-slate-900 text-white p-6 sm:p-8 shadow-2xl border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
              <GiftIcon className="h-10 w-10 text-violet-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-violet-400/20 text-violet-200 border border-violet-400/30 rounded-full text-[10px] font-mono font-bold uppercase">
                  Finance & Payroll
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 rounded-full text-[10px] font-bold">
                  ● Incentive Structure
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Bonus Master</h2>
              <p className="text-xs sm:text-sm text-violet-100/80 font-medium max-w-xl mt-1">
                Configure annual performance bonuses, statutory bonus schemes, festival payouts, and department eligibility criteria.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-2xl text-xs font-bold shadow-lg transition transform active:scale-95 cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" /> Add Bonus Plan
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Bonus Plans</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
            <GiftIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Performance Plans</span>
            <p className="text-2xl font-black text-indigo-600 mt-1">{stats.performance}</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <SparklesIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Festive / Statutory</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats.festive}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircleIcon className="w-6 h-6" />
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
              placeholder="Search bonus name or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-violet-500 focus:bg-white transition"
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
                <th className="p-4">Bonus Plan Name</th>
                <th className="p-4">Bonus Type</th>
                <th className="p-4">Calculation Mode</th>
                <th className="p-4">Amount / %</th>
                <th className="p-4">Target Dept</th>
                <th className="p-4">Frequency</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredRecords.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 font-bold text-slate-900">{item.bonusName}</td>
                  <td className="p-4 font-semibold text-purple-700">{item.bonusType}</td>
                  <td className="p-4 text-slate-600">{item.calculationType}</td>
                  <td className="p-4 font-black text-emerald-600">
                    {item.calculationType === "Percentage of Basic" ? `${item.value}%` : `₹${item.value.toLocaleString()}`}
                  </td>
                  <td className="p-4">{item.department}</td>
                  <td className="p-4 text-slate-500 font-mono">{item.payoutFrequency}</td>
                  <td className="p-4 font-bold text-emerald-600">{item.status}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-violet-600 rounded-lg hover:bg-violet-50 transition"
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
                {editingRecord ? "Edit Bonus Plan" : "Add Bonus Plan"}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Bonus Plan Name</label>
                <input
                  type="text"
                  required
                  value={formData.bonusName}
                  onChange={(e) => setFormData({ ...formData, bonusName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Bonus Type</label>
                  <select
                    value={formData.bonusType}
                    onChange={(e) => setFormData({ ...formData, bonusType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="Performance">Performance</option>
                    <option value="Festival/Diwali">Festival/Diwali</option>
                    <option value="Annual Statutory">Annual Statutory</option>
                    <option value="Project Milestone">Project Milestone</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Calculation Type</label>
                  <select
                    value={formData.calculationType}
                    onChange={(e) => setFormData({ ...formData, calculationType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Fixed Amount">Fixed Amount</option>
                    <option value="Percentage of Basic">Percentage of Basic</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Value (Amount in ₹ or %)</label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Payout Frequency</label>
                  <input
                    type="text"
                    value={formData.payoutFrequency}
                    onChange={(e) => setFormData({ ...formData, payoutFrequency: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
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
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Save Bonus Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BonusMaster;
