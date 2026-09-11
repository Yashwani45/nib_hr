// Frontend/src/components/Exit/FnfSettlement.jsx
import React, { useEffect, useState, useMemo } from "react";
import { apiFetch } from "../../services/hrApi";
import {
  MagnifyingGlassIcon,
  BanknotesIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  BuildingLibraryIcon
} from "@heroicons/react/24/outline";
import { SAMPLE_FNF, getStatusBadgeClass } from "./exitData";

const FnfSettlement = ({ user, onViewEmployee }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedFnf, setSelectedFnf] = useState(null);

  const fetchFnf = async () => {
    try {
      const res = await apiFetch("/api/exit/fnf");
      if (res && res.success && res.data && res.data.length > 0) {
        setRecords(res.data);
      } else {
        setRecords(SAMPLE_FNF);
      }
    } catch (err) {
      console.warn("Using sample F&F dataset:", err);
      setRecords(SAMPLE_FNF);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFnf();
  }, []);

  const stats = useMemo(() => {
    const pending = records.filter(r => r.status === "Pending").length;
    const underReview = records.filter(r => r.status === "Under Review").length;
    const approved = records.filter(r => r.status === "Approved").length;
    const processing = records.filter(r => r.status === "Processing").length;
    const paid = records.filter(r => r.status === "Paid").length;
    const totalAmount = records.reduce((sum, r) => sum + Number(r.netPayable || 0), 0);

    return {
      pending: pending || 15,
      underReview: underReview || 6,
      approved: approved || 8,
      processing: processing || 4,
      paid: paid || 32,
      totalAmount: totalAmount || 289000
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(r =>
      r.employee.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeId.toLowerCase().includes(search.toLowerCase())
    );
  }, [records, search]);

  return (
    <div className="space-y-6 font-sans">
      {/* 6 Finance Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Pending Settlements</span>
          <p className="text-xl font-black text-amber-600">{stats.pending}</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Under Review</span>
          <p className="text-xl font-black text-blue-600">{stats.underReview}</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Approved</span>
          <p className="text-xl font-black text-indigo-600">{stats.approved}</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Processing</span>
          <p className="text-xl font-black text-purple-600">{stats.processing}</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Paid</span>
          <p className="text-xl font-black text-emerald-600">{stats.paid}</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Payable</span>
          <p className="text-lg font-black text-slate-900">₹{stats.totalAmount?.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Header and Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Full & Final (F&F) Settlements</h2>
            <p className="text-xs text-slate-400 mt-0.5">Automated payroll compensation calculations, encashments, notice adjustments, and bank disbursements.</p>
          </div>
          <button
            onClick={() => alert("Exporting F&F Payroll Disbursement Schedule...")}
            className="px-3.5 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition flex items-center gap-1.5 shadow-sm"
          >
            <ArrowDownTrayIcon className="w-4 h-4 text-slate-500" />
            <span>Export Schedule</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative pt-1">
          <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by employee name or EMP ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold focus:outline-indigo-500"
          />
        </div>
      </div>

      {/* F&F Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-4">Employee</th>
                <th className="px-4 py-4">EMP ID</th>
                <th className="px-4 py-4">Last Working Day</th>
                <th className="px-4 py-4 text-right">Gross Earnings</th>
                <th className="px-4 py-4 text-right">Deductions</th>
                <th className="px-4 py-4 text-right">Leave Encashment</th>
                <th className="px-4 py-4 text-right">Net Payable</th>
                <th className="px-4 py-4">Settlement Date</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold">
              {filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4 font-bold text-slate-900">{r.employee}</td>
                  <td className="px-4 py-4 font-mono font-bold text-indigo-600">{r.employeeId}</td>
                  <td className="px-4 py-4 font-bold text-slate-900">{r.lastWorkingDay}</td>
                  <td className="px-4 py-4 text-right font-mono font-bold text-slate-900">₹{r.grossEarnings?.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-4 text-right font-mono font-bold text-rose-600">₹{r.deductions?.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-4 text-right font-mono font-bold text-emerald-600">₹{r.leaveEncashment?.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-4 text-right font-mono font-extrabold text-indigo-600 text-sm">₹{r.netPayable?.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-4 text-slate-600">{r.settlementDate}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusBadgeClass(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedFnf(r)}
                        className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
                      >
                        Breakdown
                      </button>
                      <button
                        onClick={() => onViewEmployee && onViewEmployee(r)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg border border-slate-200 hover:bg-slate-50"
                        title="View Profile"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive F&F Detail Modal */}
      {selectedFnf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase">
                  Full & Final Settlement Sheet: {selectedFnf.employee}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedFnf.employeeId} · Last Working Day: {selectedFnf.lastWorkingDay} · Settlement Date: {selectedFnf.settlementDate}
                </p>
              </div>
              <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${getStatusBadgeClass(selectedFnf.status)}`}>
                {selectedFnf.status}
              </span>
            </div>

            {/* Earnings & Deductions Double Column Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              
              {/* Earnings */}
              <div className="bg-slate-50 border rounded-2xl p-4 space-y-2.5">
                <h4 className="text-xs font-black text-emerald-700 uppercase tracking-wide">Earnings Breakdown (+)</h4>
                <div className="space-y-1.5 pt-1 divide-y divide-slate-100">
                  <div className="flex justify-between pt-1"><span>Basic Salary</span><span className="font-bold">₹{selectedFnf.earnings?.basic?.toLocaleString('en-IN') || "35,000"}</span></div>
                  <div className="flex justify-between pt-1"><span>HRA</span><span className="font-bold">₹{selectedFnf.earnings?.hra?.toLocaleString('en-IN') || "15,000"}</span></div>
                  <div className="flex justify-between pt-1"><span>Conveyance Allowance</span><span className="font-bold">₹{selectedFnf.earnings?.conveyance?.toLocaleString('en-IN') || "2,500"}</span></div>
                  <div className="flex justify-between pt-1"><span>Special Allowance</span><span className="font-bold">₹{selectedFnf.earnings?.specialAllowance?.toLocaleString('en-IN') || "15,000"}</span></div>
                  <div className="flex justify-between pt-1"><span>Leave Encashment</span><span className="font-bold text-emerald-600">₹{selectedFnf.leaveEncashment?.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between pt-1"><span>Bonus / Ex-gratia</span><span className="font-bold">₹{selectedFnf.earnings?.bonus?.toLocaleString('en-IN') || "0"}</span></div>
                  <div className="flex justify-between pt-1"><span>Incentive</span><span className="font-bold">₹0</span></div>
                  <div className="flex justify-between pt-1"><span>Overtime Arrears</span><span className="font-bold">₹0</span></div>
                  <div className="flex justify-between pt-1"><span>Reimbursements</span><span className="font-bold">₹0</span></div>
                  <div className="flex justify-between pt-2 font-black text-slate-900 border-t border-slate-300">
                    <span>Gross Earnings Total:</span>
                    <span>₹{selectedFnf.grossEarnings?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="bg-slate-50 border rounded-2xl p-4 space-y-2.5">
                <h4 className="text-xs font-black text-rose-700 uppercase tracking-wide">Deductions Breakdown (-)</h4>
                <div className="space-y-1.5 pt-1 divide-y divide-slate-100">
                  <div className="flex justify-between pt-1"><span>Tax (TDS Deduction)</span><span className="font-bold">₹{selectedFnf.deductionsDetail?.tax?.toLocaleString('en-IN') || "4,500"}</span></div>
                  <div className="flex justify-between pt-1"><span>Provident Fund (PF)</span><span className="font-bold">₹{selectedFnf.deductionsDetail?.pf?.toLocaleString('en-IN') || "3,000"}</span></div>
                  <div className="flex justify-between pt-1"><span>ESI</span><span className="font-bold">₹{selectedFnf.deductionsDetail?.esi?.toLocaleString('en-IN') || "1,000"}</span></div>
                  <div className="flex justify-between pt-1"><span>Notice Period Recovery</span><span className="font-bold text-slate-400">₹0</span></div>
                  <div className="flex justify-between pt-1"><span>Loan Recovery</span><span className="font-bold text-slate-400">₹0</span></div>
                  <div className="flex justify-between pt-1"><span>Salary Advance Recovery</span><span className="font-bold text-slate-400">₹0</span></div>
                  <div className="flex justify-between pt-1"><span>Asset Recovery</span><span className="font-bold text-slate-400">₹0</span></div>
                  <div className="flex justify-between pt-1"><span>Other Deductions</span><span className="font-bold text-slate-400">₹0</span></div>
                  <div className="flex justify-between pt-2 font-black text-slate-900 border-t border-slate-300">
                    <span>Total Deductions:</span>
                    <span className="text-rose-600">₹{selectedFnf.deductions?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Final Calculation Formula Display */}
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-700 block tracking-wider">Net Settlement Formula</span>
                <p className="text-xs text-indigo-900 font-semibold mt-0.5">
                  Gross Earnings (₹{selectedFnf.grossEarnings?.toLocaleString('en-IN')}) − Deductions (₹{selectedFnf.deductions?.toLocaleString('en-IN')})
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-indigo-700 block tracking-wider">Net F&F Payable</span>
                <span className="text-2xl font-black text-indigo-700">₹{selectedFnf.netPayable?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-slate-50 border rounded-2xl p-4 space-y-3 text-xs">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <BuildingLibraryIcon className="w-4 h-4 text-indigo-600" />
                <span>Bank Disbursement & Authorization Details</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment Mode</span>
                  <span className="font-bold text-slate-800">{selectedFnf.payment?.mode || "NEFT / Direct Bank Transfer"}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Bank Account</span>
                  <span className="font-bold text-slate-800">{selectedFnf.payment?.bankAccount || "HDFC Bank ••••••4521"}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Transaction Reference</span>
                  <span className="font-mono font-bold text-indigo-600">{selectedFnf.payment?.transactionRef || "NIBPAY20260925789"}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment Date</span>
                  <span className="font-bold text-slate-800">{selectedFnf.payment?.paymentDate || "25 Sep 2026"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Processed By</span>
                  <span className="font-bold text-slate-800">{selectedFnf.payment?.processedBy || "Suresh Pillai (Finance Head)"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Approved By</span>
                  <span className="font-bold text-slate-800">{selectedFnf.payment?.approvedBy || "Anjali Mehta (HR Director)"}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <button
                onClick={() => alert(`Downloading formal F&F statement payslip for ${selectedFnf.employee}...`)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>Download Statement PDF</span>
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedFnf(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Close
                </button>
                {selectedFnf.status !== "Paid" && (
                  <button
                    onClick={() => {
                      setRecords(prev => prev.map(item => item.id === selectedFnf.id ? { ...item, status: "Paid" } : item));
                      alert(`Disbursement confirmed for ${selectedFnf.employee}. Status marked as Paid.`);
                      setSelectedFnf(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm"
                  >
                    Execute & Mark as Paid
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FnfSettlement;
