import React, { useState, useEffect } from "react";
import { apiFetch } from "../../services/hrApi";

const SalaryStructure = ({ onRefreshData }) => {
  const [structures, setStructures] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState("list"); // 'list' | 'create' | 'assign'

  // Forms
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [components, setComponents] = useState([
    { name: "Basic", type: "Earning", calculationType: "Percentage", value: "50", referenceComponent: "Gross" },
    { name: "HRA", type: "Earning", calculationType: "Percentage", value: "40", referenceComponent: "Basic" },
    { name: "Special Allowance", type: "Earning", calculationType: "Fixed", value: "0", referenceComponent: "" },
    { name: "PF (12% Basic)", type: "Deduction", calculationType: "Percentage", value: "12", referenceComponent: "Basic" },
    { name: "ESI (0.75% Gross)", type: "Deduction", calculationType: "Percentage", value: "0.75", referenceComponent: "Gross" }
  ]);

  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedStructure, setSelectedStructure] = useState("");
  const [baseGross, setBaseGross] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const structRes = await apiFetch("/api/finance/salary-structures");
      if (structRes?.data) {
        setStructures(structRes.data);
      }
      const empRes = await apiFetch("/api/table/employees");
      if (empRes?.data) {
        setEmployees(empRes.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddComponent = () => {
    setComponents([...components, { name: "", type: "Earning", calculationType: "Fixed", value: "0", referenceComponent: "" }]);
  };

  const handleRemoveComponent = (idx) => {
    setComponents(components.filter((_, i) => i !== idx));
  };

  const handleComponentChange = (idx, field, val) => {
    const updated = [...components];
    updated[idx][field] = val;
    setComponents(updated);
  };

  const handleCreateStructure = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/api/finance/salary-structures", {
        method: "POST",
        body: JSON.stringify({ name, description, components })
      });
      alert("Salary Structure created successfully!");
      setName("");
      setDescription("");
      setActiveView("list");
      loadData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert(err.message || "Failed to create structure.");
    }
  };

  const handleAssignStructure = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/api/finance/salary-structures/assign", {
        method: "POST",
        body: JSON.stringify({
          employeeId: selectedEmployee,
          salaryStructureId: selectedStructure,
          effectiveFrom,
          baseGross: parseFloat(baseGross)
        })
      });
      alert("Salary Structure assigned successfully!");
      setSelectedEmployee("");
      setSelectedStructure("");
      setBaseGross("");
      setEffectiveFrom("");
      setActiveView("list");
      loadData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert(err.message || "Failed to assign structure.");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Salary Structures</h2>
          <p className="text-xs text-slate-500">Configure salary bands, components, earnings, deductions, and assign them to employees.</p>
        </div>
        <div className="flex gap-2">
          {activeView !== "list" && (
            <button
              onClick={() => setActiveView("list")}
              className="px-3 py-1.5 text-xs font-semibold bg-white border rounded-xl text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          )}
          {activeView === "list" && (
            <>
              <button
                onClick={() => setActiveView("create")}
                className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-2xs"
              >
                + Define Structure
              </button>
              <button
                onClick={() => setActiveView("assign")}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-2xs"
              >
                Assign Structure
              </button>
            </>
          )}
        </div>
      </div>

      {loading && <div className="text-center text-xs text-slate-400 py-8">Loading Salary Structures data...</div>}

      {!loading && activeView === "list" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {structures.map((s) => (
            <div key={s.id} className="bg-white border rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-start border-b pb-2">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">{s.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{s.description || "No description"}</p>
                </div>
                <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[9px] font-bold uppercase">
                  Active
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-600">Earnings Components</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                  {s.components?.filter(c => c.type === "Earning").map((c, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-slate-600 font-semibold">{c.name}:</span>
                      <span className="font-bold text-slate-800">{c.value}{c.calculationType === "Percentage" ? `% of ${c.referenceComponent || "Gross"}` : " Fixed"}</span>
                    </div>
                  ))}
                </div>

                <h4 className="text-xs font-bold text-slate-600 mt-3">Deductions Components</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-red-50/30 p-2.5 rounded-lg border border-red-50/50">
                  {s.components?.filter(c => c.type === "Deduction").map((c, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-slate-600 font-semibold">{c.name}:</span>
                      <span className="font-bold text-red-600">{c.value}{c.calculationType === "Percentage" ? `% of ${c.referenceComponent || "Basic"}` : " Fixed"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {structures.length === 0 && (
            <div className="col-span-2 text-center text-xs text-slate-400 py-12">
              No salary structures defined. Get started by defining one!
            </div>
          )}
        </div>
      )}

      {activeView === "create" && (
        <form onSubmit={handleCreateStructure} className="bg-white border rounded-2xl p-6 space-y-6 max-w-2xl mx-auto shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 border-b pb-2">Define New Salary Structure</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700">Structure Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Standard Executive Band A"
                className="w-full text-xs border rounded-lg p-2.5 bg-slate-50 focus:bg-white"
                required
              />
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe who this structure is for..."
                className="w-full text-xs border rounded-lg p-2.5 bg-slate-50 focus:bg-white h-20"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="text-xs font-bold text-slate-700">Breakdown Components</h4>
              <button
                type="button"
                onClick={handleAddComponent}
                className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded"
              >
                + Add Row
              </button>
            </div>

            {components.map((c, i) => (
              <div key={i} className="flex gap-2 items-center bg-slate-50 p-3 rounded-lg border">
                <input
                  type="text"
                  value={c.name}
                  onChange={(e) => handleComponentChange(i, "name", e.target.value)}
                  placeholder="Component Name"
                  className="w-1/4 text-xs border rounded p-1.5 bg-white font-semibold"
                  required
                />
                
                <select
                  value={c.type}
                  onChange={(e) => handleComponentChange(i, "type", e.target.value)}
                  className="w-1/6 text-xs border rounded p-1.5 bg-white"
                >
                  <option value="Earning">Earning</option>
                  <option value="Deduction">Deduction</option>
                </select>

                <select
                  value={c.calculationType}
                  onChange={(e) => handleComponentChange(i, "calculationType", e.target.value)}
                  className="w-1/6 text-xs border rounded p-1.5 bg-white"
                >
                  <option value="Fixed">Fixed Amount</option>
                  <option value="Percentage">Percentage</option>
                </select>

                <input
                  type="number"
                  step="0.01"
                  value={c.value}
                  onChange={(e) => handleComponentChange(i, "value", e.target.value)}
                  placeholder="Value"
                  className="w-1/8 text-xs border rounded p-1.5 bg-white font-bold"
                  required
                />

                <input
                  type="text"
                  value={c.referenceComponent}
                  onChange={(e) => handleComponentChange(i, "referenceComponent", e.target.value)}
                  placeholder="Ref (e.g. Basic/Gross)"
                  className="w-1/6 text-xs border rounded p-1.5 bg-white"
                  disabled={c.calculationType !== "Percentage"}
                />

                <button
                  type="button"
                  onClick={() => handleRemoveComponent(i)}
                  className="text-red-500 hover:text-red-700 font-bold text-xs px-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="w-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 shadow-2xs"
          >
            Save Structure
          </button>
        </form>
      )}

      {activeView === "assign" && (
        <form onSubmit={handleAssignStructure} className="bg-white border rounded-2xl p-6 space-y-6 max-w-md mx-auto shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 border-b pb-2">Assign Salary Structure to Employee</h3>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Select Employee</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full text-xs border rounded-lg p-2.5 bg-white"
                required
              >
                <option value="">-- Choose Employee --</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.employeeName || `${e.firstName} ${e.lastName}`} ({e.employeeCode || e.emp_code || "No Code"})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Select Structure</label>
              <select
                value={selectedStructure}
                onChange={(e) => setSelectedStructure(e.target.value)}
                className="w-full text-xs border rounded-lg p-2.5 bg-white"
                required
              >
                <option value="">-- Choose Structure --</option>
                {structures.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Base Monthly Gross (₹)</label>
              <input
                type="number"
                value={baseGross}
                onChange={(e) => setBaseGross(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full text-xs border rounded-lg p-2.5 bg-slate-50 focus:bg-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Effective From Date</label>
              <input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="w-full text-xs border rounded-lg p-2.5 bg-slate-50 focus:bg-white"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 shadow-2xs"
          >
            Assign Structure
          </button>
        </form>
      )}
    </div>
  );
};

export default SalaryStructure;
