// Frontend/src/components/Exit/AssetReturn.jsx
import React, { useEffect, useState, useMemo } from "react";
import { apiFetch } from "../../services/hrApi";
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  ComputerDesktopIcon,
  WrenchScrewdriverIcon,
  PaperClipIcon
} from "@heroicons/react/24/outline";
import { SAMPLE_ASSETS, getStatusBadgeClass } from "./exitData";

const STATUS_OPTIONS = ["All", "Pending", "Returned", "Damaged", "Lost", "Waived"];

const AssetReturn = ({ user, onViewEmployee }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("All");

  // Asset Return Inspection Modal State
  const [returnModal, setReturnModal] = useState({
    isOpen: false,
    asset: null,
    returnDate: new Date().toISOString().split("T")[0],
    physicalCondition: "Good",
    accessoriesReturned: ["Charger", "Bag", "Mouse"],
    damageDescription: "",
    recoveryAmount: 0,
    receivedBy: user?.name || "IT Admin",
    verificationStatus: "Verified",
    remarks: ""
  });

  const fetchAssets = async () => {
    try {
      const res = await apiFetch("/api/exit/assets");
      if (res && res.success && res.data && res.data.length > 0) {
        setRecords(res.data);
      } else {
        setRecords(SAMPLE_ASSETS);
      }
    } catch (err) {
      console.warn("Using sample assets:", err);
      setRecords(SAMPLE_ASSETS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchStatus = statusTab === "All" || r.status.toLowerCase() === statusTab.toLowerCase();
      const matchSearch =
        r.employee.toLowerCase().includes(search.toLowerCase()) ||
        r.employeeId.toLowerCase().includes(search.toLowerCase()) ||
        r.assetName.toLowerCase().includes(search.toLowerCase()) ||
        r.assetId.toLowerCase().includes(search.toLowerCase()) ||
        r.serialNumber.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [records, statusTab, search]);

  const handleReturnSubmit = (e) => {
    e.preventDefault();
    if (!returnModal.asset) return;

    setRecords(prev => prev.map(a => {
      if (a.id === returnModal.asset.id) {
        return {
          ...a,
          status: returnModal.physicalCondition === "Damaged" ? "Damaged" : "Returned",
          returnDate: returnModal.returnDate,
          condition: returnModal.physicalCondition
        };
      }
      return a;
    }));

    alert(`Asset return recorded for ${returnModal.asset.assetName}.`);
    setReturnModal({ ...returnModal, isOpen: false, asset: null });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Filter Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Asset Return Tracking</h2>
            <p className="text-xs text-slate-400 mt-0.5">Inspect physical condition, recover corporate hardware, and issue return waivers.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              Total Hardware Records: {records.length}
            </span>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {STATUS_OPTIONS.map((st) => (
            <button
              key={st}
              onClick={() => setStatusTab(st)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                statusTab === st
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative pt-1">
          <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by asset name, asset ID, serial number, or employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold focus:outline-indigo-500"
          />
        </div>
      </div>

      {/* Asset Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-4">Employee</th>
                <th className="px-4 py-4">EMP ID</th>
                <th className="px-4 py-4">Asset ID</th>
                <th className="px-4 py-4">Asset Name</th>
                <th className="px-4 py-4">Category</th>
                <th className="px-4 py-4">Serial Number</th>
                <th className="px-4 py-4">Issue Date</th>
                <th className="px-4 py-4">Expected Return</th>
                <th className="px-4 py-4">Return Date</th>
                <th className="px-4 py-4">Condition</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold">
              {filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4 font-bold text-slate-900">{r.employee}</td>
                  <td className="px-4 py-4 font-mono font-bold text-indigo-600">{r.employeeId}</td>
                  <td className="px-4 py-4 font-mono font-bold text-slate-700">{r.assetId}</td>
                  <td className="px-4 py-4 font-bold text-slate-900">{r.assetName}</td>
                  <td className="px-4 py-4 text-slate-500">{r.assetCategory}</td>
                  <td className="px-4 py-4 font-mono text-slate-600">{r.serialNumber}</td>
                  <td className="px-4 py-4 text-slate-500">{r.issueDate}</td>
                  <td className="px-4 py-4 font-bold text-slate-700">{r.expectedReturnDate}</td>
                  <td className="px-4 py-4 text-slate-800 font-bold">{r.returnDate}</td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {r.condition || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusBadgeClass(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {r.status === "Pending" ? (
                        <button
                          onClick={() => setReturnModal({
                            ...returnModal,
                            isOpen: true,
                            asset: r,
                            returnDate: new Date().toISOString().split("T")[0]
                          })}
                          className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
                        >
                          Receive
                        </button>
                      ) : (
                        <button
                          onClick={() => setReturnModal({
                            ...returnModal,
                            isOpen: true,
                            asset: r,
                            physicalCondition: r.condition || "Good"
                          })}
                          className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition"
                        >
                          Inspect
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={12} className="text-center py-10 text-slate-400">
                    No hardware assets found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Return Inspection Modal */}
      {returnModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-lg space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase">
              Asset Return Inspection: {returnModal.asset?.assetName}
            </h3>
            <div className="p-3 bg-slate-50 border rounded-xl grid grid-cols-3 gap-2 text-[11px]">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Asset ID</span>
                <span className="font-mono font-bold text-slate-800">{returnModal.asset?.assetId}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Employee</span>
                <span className="font-bold text-slate-800">{returnModal.asset?.employee}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Serial No</span>
                <span className="font-mono text-slate-600">{returnModal.asset?.serialNumber}</span>
              </div>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Return Date *</label>
                  <input
                    type="date"
                    value={returnModal.returnDate}
                    onChange={(e) => setReturnModal({ ...returnModal, returnDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Physical Condition *</label>
                  <select
                    value={returnModal.physicalCondition}
                    onChange={(e) => setReturnModal({ ...returnModal, physicalCondition: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-indigo-500"
                  >
                    <option value="Good">Good (No Damage)</option>
                    <option value="Fair">Fair (Minor Wear)</option>
                    <option value="Damaged">Damaged (Requires Repair)</option>
                    <option value="Lost">Lost / Not Returned</option>
                    <option value="Scrap">Scrap / Depreciated</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Accessories Checklist</label>
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border text-[11px]">
                  {["Charger / Adapter", "Laptop Bag", "Mouse", "HDMI Cable", "Power Cord"].map((acc) => (
                    <label key={acc} className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                      <input type="checkbox" defaultChecked className="rounded text-indigo-600" />
                      <span>{acc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {returnModal.physicalCondition === "Damaged" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-rose-500 block mb-1">Damage Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Cracked screen / keyboard damage"
                      value={returnModal.damageDescription}
                      onChange={(e) => setReturnModal({ ...returnModal, damageDescription: e.target.value })}
                      className="w-full bg-rose-50 border border-rose-200 rounded-xl p-2 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-rose-500 block mb-1">Recovery Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="₹ Amount to deduct"
                      value={returnModal.recoveryAmount}
                      onChange={(e) => setReturnModal({ ...returnModal, recoveryAmount: Number(e.target.value) })}
                      className="w-full bg-rose-50 border border-rose-200 rounded-xl p-2 text-xs font-semibold"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Received By</label>
                  <input
                    type="text"
                    value={returnModal.receivedBy}
                    onChange={(e) => setReturnModal({ ...returnModal, receivedBy: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Verification Status</label>
                  <select
                    value={returnModal.verificationStatus}
                    onChange={(e) => setReturnModal({ ...returnModal, verificationStatus: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold"
                  >
                    <option value="Verified">Verified & Cleared</option>
                    <option value="Under Inspection">Under Inspection</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Remarks</label>
                <textarea
                  value={returnModal.remarks}
                  onChange={(e) => setReturnModal({ ...returnModal, remarks: e.target.value })}
                  placeholder="Additional inspection remarks or diagnostic serial numbers..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold h-16"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setReturnModal({ ...returnModal, isOpen: false, asset: null })}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm"
                >
                  Submit Inspection Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetReturn;
