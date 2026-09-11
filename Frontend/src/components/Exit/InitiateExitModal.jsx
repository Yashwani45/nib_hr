// Frontend/src/components/Exit/InitiateExitModal.jsx
import React, { useState } from "react";
import { XMarkIcon, UserPlusIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { apiFetch } from "../../services/hrApi";

const EMP_PRESETS = [
  { name: "Rahul Sharma", id: "EMP1024", dept: "Engineering", desig: "Senior Software Engineer" },
  { name: "Priya Patel", id: "EMP1087", dept: "Human Resources", desig: "HR Executive" },
  { name: "Amit Verma", id: "EMP1132", dept: "Finance", desig: "Finance Executive" },
  { name: "Neha Gupta", id: "EMP1055", dept: "Design", desig: "Product Designer" },
  { name: "Vikram Singh", id: "EMP1190", dept: "Engineering", desig: "DevOps Engineer" },
  { name: "Sneha Kulkarni", id: "EMP1211", dept: "Marketing", desig: "Marketing Lead" }
];

const InitiateExitModal = ({ isOpen, onClose, onCreated }) => {
  const [selectedEmp, setSelectedEmp] = useState(EMP_PRESETS[0]);
  const [formData, setFormData] = useState({
    resignationDate: new Date().toISOString().split("T")[0],
    proposedLastWorkingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    exitType: "Voluntary",
    reason: "Better Opportunity",
    noticePeriod: 30,
    remarks: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleEmpChange = (e) => {
    const found = EMP_PRESETS.find(emp => emp.name === e.target.value);
    if (found) setSelectedEmp(found);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        employee: selectedEmp.name,
        employeeId: selectedEmp.id,
        department: selectedEmp.dept,
        designation: selectedEmp.desig,
        ...formData
      };

      // Try API if available, else locally emit
      await apiFetch("/api/exit/resignations", {
        method: "POST",
        body: JSON.stringify(payload)
      }).catch(() => null);

      if (onCreated) onCreated(payload);
      onClose();
      alert(`Exit initiated successfully for ${selectedEmp.name} (${selectedEmp.id})`);
    } catch (err) {
      setError(err.message || "Failed to initiate exit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white">
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">Initiate Employee Exit</h3>
              <p className="text-[11px] text-slate-400">Launch separation lifecycle and provision clearance checklist</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-bold">
              {error}
            </div>
          )}

          {/* Select Employee */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Select Employee *</label>
            <select
              value={selectedEmp.name}
              onChange={handleEmpChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-indigo-500"
            >
              {EMP_PRESETS.map((emp) => (
                <option key={emp.id} value={emp.name}>
                  {emp.name} ({emp.id}) — {emp.dept}
                </option>
              ))}
            </select>
          </div>

          {/* Auto-populated details preview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
              <span className="font-extrabold text-slate-800">{selectedEmp.dept}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Designation</span>
              <span className="font-extrabold text-slate-800">{selectedEmp.desig}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Resignation Date *</label>
              <input
                type="date"
                value={formData.resignationDate}
                onChange={(e) => setFormData({ ...formData, resignationDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-indigo-500"
                required
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Proposed Last Working Day *</label>
              <input
                type="date"
                value={formData.proposedLastWorkingDate}
                onChange={(e) => setFormData({ ...formData, proposedLastWorkingDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-indigo-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Exit Type *</label>
              <select
                value={formData.exitType}
                onChange={(e) => setFormData({ ...formData, exitType: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-indigo-500"
              >
                <option value="Voluntary">Voluntary</option>
                <option value="Involuntary">Involuntary</option>
                <option value="Retirement">Retirement</option>
                <option value="Contract End">Contract End</option>
                <option value="Mutual Separation">Mutual Separation</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Notice Period (Days) *</label>
              <input
                type="number"
                value={formData.noticePeriod}
                onChange={(e) => setFormData({ ...formData, noticePeriod: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-indigo-500"
                min="0"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Primary Exit Reason *</label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-indigo-500"
            >
              <option value="Better Opportunity">Better Opportunity</option>
              <option value="Higher Studies">Higher Studies</option>
              <option value="Relocation">Relocation</option>
              <option value="Personal / Family Reasons">Personal / Family Reasons</option>
              <option value="Health / Medical">Health / Medical</option>
              <option value="Compensation">Compensation</option>
              <option value="Career Transition">Career Transition</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">HR Remarks & Handover Notes</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Provide context, notice buyout requests, or transition handover instructions..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-indigo-500 h-20"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              {submitting ? "Initiating..." : "+ Initiate Exit Process"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default InitiateExitModal;
