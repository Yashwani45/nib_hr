import React, { useState, useMemo } from "react";
import {
  ReceiptPercentIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  SparklesIcon,
  XMarkIcon,
  DocumentChartBarIcon,
  BuildingLibraryIcon
} from "@heroicons/react/24/outline";

const TdsMaster = ({ records = [], onAdd, onUpdate, onDelete, onExport }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [regimeFilter, setRegimeFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const initialForm = {
    financialYear: "2025-2026",
    taxRegime: "New Tax Regime (Sec 115BAC)",
    standardDeduction: 75000,
    cessPercentage: 4.0,
    status: "Active"
  };
  const [formData, setFormData] = useState(initialForm);

  const defaultTdsRecords = useMemo(() => {
    if (Array.isArray(records) && records.length > 0) return records;
    return [
      { id: "1", financialYear: "FY 2025-2026", taxRegime: "New Tax Regime (Sec 115BAC)", standardDeduction: 75000, cessPercentage: 4.0, taxSlabsCount: 6, status: "Active" },
      { id: "2", financialYear: "FY 2025-2026", taxRegime: "Old Tax Regime", standardDeduction: 50000, cessPercentage: 4.0, taxSlabsCount: 4, status: "Active" },
      { id: "3", financialYear: "FY 2024-2025", taxRegime: "New Tax Regime (Sec 115BAC)", standardDeduction: 75000, cessPercentage: 4.0, taxSlabsCount: 6, status: "Inactive" },
    ];
  }, [records]);

  const filteredRecords = useMemo(() => {
    return defaultTdsRecords.filter(item => {
      const matchSearch =
        (item.financialYear || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.taxRegime || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchRegime = regimeFilter === "ALL" || item.taxRegime.includes(regimeFilter);
      return matchSearch && matchRegime;
    });
  }, [defaultTdsRecords, searchTerm, regimeFilter]);

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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-700 via-blue-800 to-slate-900 text-white p-6 sm:p-8 shadow-2xl border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
              <ReceiptPercentIcon className="h-10 w-10 text-cyan-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-cyan-400/20 text-cyan-200 border border-cyan-400/30 rounded-full text-[10px] font-mono font-bold uppercase">
                  Tax Compliance
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 rounded-full text-[10px] font-bold">
                  ● TDS Master
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">TDS Master & Tax Slabs</h2>
              <p className="text-xs sm:text-sm text-cyan-100/80 font-medium max-w-xl mt-1">
                Manage income tax slabs for New & Old Tax Regimes, standard deductions, Form-16 rules, and monthly TDS computations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-2xl text-xs font-bold shadow-lg transition transform active:scale-95 cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" /> Add Tax Slabs
            </button>
          </div>
        </div>
      </div>

      {/* Tax Slabs Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* New Tax Regime Box */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-cyan-600" /> New Tax Regime (Sec 115BAC)
              </h3>
              <span className="text-[11px] text-slate-500">FY 2025-2026 | Standard Deduction: ₹75,000</span>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-full text-[10px]">
              Default Choice
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl font-medium">
              <span>₹0 - ₹4,000,000</span>
              <span className="font-bold text-slate-900">NIL (0%)</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl font-medium">
              <span>₹4,00,001 - ₹8,00,000</span>
              <span className="font-bold text-slate-900">5%</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl font-medium">
              <span>₹8,00,001 - ₹12,00,000</span>
              <span className="font-bold text-slate-900">10%</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl font-medium">
              <span>₹12,00,001 - ₹16,00,000</span>
              <span className="font-bold text-slate-900">15%</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl font-medium">
              <span>₹16,00,001 - ₹20,00,000</span>
              <span className="font-bold text-slate-900">20%</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl font-medium">
              <span>Above ₹24,00,000</span>
              <span className="font-bold text-slate-900">30%</span>
            </div>
          </div>
        </div>

        {/* Old Tax Regime Box */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <BuildingLibraryIcon className="w-4 h-4 text-blue-600" /> Old Tax Regime (With Deductions)
              </h3>
              <span className="text-[11px] text-slate-500">FY 2025-2026 | Standard Deduction: ₹50,000 + 80C/80D</span>
            </div>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 font-bold rounded-full text-[10px]">
              Optional
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl font-medium">
              <span>Up to ₹2,50,000</span>
              <span className="font-bold text-slate-900">NIL (0%)</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl font-medium">
              <span>₹2,50,001 - ₹5,00,000</span>
              <span className="font-bold text-slate-900">5%</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl font-medium">
              <span>₹5,00,001 - ₹10,00,000</span>
              <span className="font-bold text-slate-900">20%</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl font-medium">
              <span>Above ₹10,00,000</span>
              <span className="font-bold text-slate-900">30%</span>
            </div>
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
              placeholder="Search financial year or regime..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-cyan-500 focus:bg-white transition"
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
                <th className="p-4">Financial Year</th>
                <th className="p-4">Tax Regime</th>
                <th className="p-4">Standard Deduction</th>
                <th className="p-4">Health & Edu Cess</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredRecords.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 font-bold text-slate-900">{item.financialYear}</td>
                  <td className="p-4 font-semibold text-cyan-700">{item.taxRegime}</td>
                  <td className="p-4 font-black text-slate-900">₹{item.standardDeduction.toLocaleString()}</td>
                  <td className="p-4 font-mono">{item.cessPercentage}%</td>
                  <td className="p-4 font-bold text-emerald-600">{item.status}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-cyan-600 rounded-lg hover:bg-cyan-50 transition"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
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
                {editingRecord ? "Edit Tax Regime Config" : "Add Tax Regime Config"}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Financial Year</label>
                <input
                  type="text"
                  required
                  value={formData.financialYear}
                  onChange={(e) => setFormData({ ...formData, financialYear: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tax Regime</label>
                <select
                  value={formData.taxRegime}
                  onChange={(e) => setFormData({ ...formData, taxRegime: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="New Tax Regime (Sec 115BAC)">New Tax Regime (Sec 115BAC)</option>
                  <option value="Old Tax Regime">Old Tax Regime</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Standard Deduction (₹)</label>
                <input
                  type="number"
                  value={formData.standardDeduction}
                  onChange={(e) => setFormData({ ...formData, standardDeduction: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
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
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Save Tax Config
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TdsMaster;
