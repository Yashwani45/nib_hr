import React, { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../../services/hrApi";
import { useAuth } from "../../auth/AuthProvider";
import {
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanknotesIcon,
  EyeIcon,
  CreditCardIcon,
  ArrowPathIcon,
  CalculatorIcon,
  ClockIcon
} from "@heroicons/react/24/outline";

const LoanManagement = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("loans"); // 'loans' | 'request'

  // Selected Loan for View Details / Ledger Modal
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loanDetailsLoading, setLoanDetailsLoading] = useState(false);

  // Form: Request Loan
  const [loanType, setLoanType] = useState("Personal");
  const [requestedAmount, setRequestedAmount] = useState("");
  const [tenureMonths, setTenureMonths] = useState("12");
  const [reason, setReason] = useState("");
  const [supportingDocument, setSupportingDocument] = useState("");
  const [targetEmployeeId, setTargetEmployeeId] = useState("");

  // Modal: Approve Loan with EMI Calculator
  const [approveModalLoan, setApproveModalLoan] = useState(null);
  const [approvedAmount, setApprovedAmount] = useState("");
  const [interestRate, setInterestRate] = useState("0");
  const [approveTenure, setApproveTenure] = useState("12");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  // Modal: Record Repayment
  const [repaymentModalLoan, setRepaymentModalLoan] = useState(null);
  const [repaymentAmount, setRepaymentAmount] = useState("");
  const [repaymentDate, setRepaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [repaymentMode, setRepaymentMode] = useState("Bank Transfer");
  const [repaymentRemarks, setRepaymentRemarks] = useState("");

  const roleName = String(user?.role?.roleName || user?.role?.name || user?.role || "Employee").trim();
  const isEmployeeOnly = roleName === "Employee";

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/finance/loans");
      if (res && res.data) {
        setLoans(res.data);
      }
      if (!isEmployeeOnly) {
        const empRes = await apiFetch("/api/table/employees");
        if (empRes?.data) setEmployees(empRes.data);
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

  const stats = useMemo(() => {
    const total = loans.length;
    const pending = loans.filter(l => l.status === "Pending").length;
    const active = loans.filter(l => l.status === "Approved" && parseFloat(l.outstandingBalance) > 0).length;
    const outstanding = loans.reduce((sum, l) => sum + (parseFloat(l.outstandingBalance) || 0), 0);
    return { total, pending, active, outstanding };
  }, [loans]);

  // Computed EMI in Approval Modal
  const calculatedEmi = useMemo(() => {
    const p = parseFloat(approvedAmount) || 0;
    const n = parseInt(approveTenure) || 1;
    const rate = parseFloat(interestRate) || 0;
    if (p <= 0 || n <= 0) return 0;
    if (rate <= 0) return Math.round((p / n) * 100) / 100;
    const r = rate / 12 / 100;
    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi * 100) / 100;
  }, [approvedAmount, approveTenure, interestRate]);

  const handleRequestLoan = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/api/finance/loans", {
        method: "POST",
        body: JSON.stringify({
          loanType,
          requestedAmount: parseFloat(requestedAmount),
          tenureMonths: parseInt(tenureMonths),
          reason,
          supportingDocument,
          employeeId: targetEmployeeId || undefined
        })
      });
      alert("Loan request submitted successfully!");
      setRequestedAmount("");
      setReason("");
      setSupportingDocument("");
      setActiveTab("loans");
      loadData();
    } catch (err) {
      alert(err.message || "Failed to submit loan request.");
    }
  };

  const handleOpenApproveModal = (loan) => {
    setApproveModalLoan(loan);
    setApprovedAmount(loan.requestedAmount);
    setApproveTenure(String(loan.tenureMonths || 12));
    setInterestRate("0");
    setStartDate(new Date().toISOString().split("T")[0]);
  };

  const handleConfirmApprove = async (e) => {
    e.preventDefault();
    if (!approveModalLoan) return;
    try {
      await apiFetch(`/api/finance/loans/${approveModalLoan.id}/approve`, {
        method: "POST",
        body: JSON.stringify({
          approvedAmount: parseFloat(approvedAmount),
          interestRate: parseFloat(interestRate),
          tenureMonths: parseInt(approveTenure),
          startDate
        })
      });
      alert("Loan approved and EMI amortization schedule generated!");
      setApproveModalLoan(null);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to approve loan.");
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Are you sure you want to reject this loan application?")) return;
    try {
      await apiFetch(`/api/finance/loans/${id}/reject`, { method: "POST" });
      alert("Loan application rejected.");
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenRepaymentModal = (loan) => {
    setRepaymentModalLoan(loan);
    setRepaymentAmount("");
    setRepaymentDate(new Date().toISOString().split("T")[0]);
    setRepaymentMode("Bank Transfer");
    setRepaymentRemarks("");
  };

  const handleConfirmRepayment = async (e) => {
    e.preventDefault();
    if (!repaymentModalLoan) return;
    try {
      await apiFetch(`/api/finance/loans/${repaymentModalLoan.id}/repayment`, {
        method: "POST",
        body: JSON.stringify({
          amount: parseFloat(repaymentAmount),
          paymentDate: repaymentDate,
          paymentMode: repaymentMode,
          remarks: repaymentRemarks
        })
      });
      alert("Repayment recorded successfully and balance updated!");
      setRepaymentModalLoan(null);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to record repayment.");
    }
  };

  const handleViewLoanDetails = async (id) => {
    setLoanDetailsLoading(true);
    try {
      const res = await apiFetch(`/api/finance/loans/${id}`);
      if (res?.data) {
        setSelectedLoan(res.data);
      }
    } catch (err) {
      alert(err.message || "Failed to load loan details.");
    } finally {
      setLoanDetailsLoading(false);
    }
  };

  const handleCloseLoan = async (id) => {
    if (!window.confirm("Manually close this loan? Outstanding balance will be marked zero and pending schedules skipped.")) return;
    try {
      await apiFetch(`/api/finance/loans/${id}/close`, { method: "POST" });
      alert("Loan closed successfully!");
      if (selectedLoan?.id === id) setSelectedLoan(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Employee Loans & Advances</h2>
          <p className="text-xs text-slate-500">
            {isEmployeeOnly
              ? "Apply for personal loans or salary advances, track outstanding balances, and view repayment schedules."
              : "Review loan applications, approve EMI amortization schedules, track payroll deductions, and record manual repayments."}
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab !== "loans" ? (
            <button
              onClick={() => setActiveTab("loans")}
              className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50"
            >
              Back to Loans List
            </button>
          ) : (
            <button
              onClick={() => setActiveTab("request")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-2xs"
            >
              <PlusIcon className="w-4 h-4" /> Request Loan / Advance
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Applications", val: stats.total, color: "bg-indigo-50 border-indigo-100 text-indigo-700" },
          { label: "Pending HR Approval", val: stats.pending, color: "bg-amber-50 border-amber-100 text-amber-700" },
          { label: "Active Amortizing Loans", val: stats.active, color: "bg-emerald-50 border-emerald-100 text-emerald-700" },
          { label: "Total Outstanding Balance", val: `₹${stats.outstanding.toLocaleString("en-IN")}`, color: "bg-purple-50 border-purple-100 text-purple-700" }
        ].map((c, i) => (
          <div key={i} className={`p-4 border rounded-2xl flex flex-col justify-between ${c.color} shadow-2xs`}>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">{c.label}</span>
            <span className="text-xl font-extrabold mt-2 block">{c.val}</span>
          </div>
        ))}
      </div>

      {/* TAB: LOANS LIST */}
      {activeTab === "loans" && (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Loan Portfolio & Ledgers</h3>
            <button
              onClick={loadData}
              className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-xs text-slate-400">Loading loan records...</div>
          ) : loans.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 space-y-2">
              <BanknotesIcon className="w-10 h-10 mx-auto text-slate-300" />
              <p>No employee loans or advances found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-3 py-3">Loan Type</th>
                    <th className="px-3 py-3 text-right">Requested</th>
                    <th className="px-3 py-3 text-right">Approved</th>
                    <th className="px-3 py-3 text-center">Tenure</th>
                    <th className="px-3 py-3 text-right">Repaid</th>
                    <th className="px-4 py-3 text-right">Outstanding</th>
                    <th className="px-3 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loans.map((loan) => {
                    const emp = loan.employee || {};
                    const name = emp.employeeName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
                    const code = emp.employeeCode || emp.employeeId || '--';

                    return (
                      <tr key={loan.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-extrabold text-slate-800">{name}</div>
                          <div className="text-[10px] text-slate-400">{code}</div>
                        </td>
                        <td className="px-3 py-3 font-semibold text-slate-700">{loan.loanType}</td>
                        <td className="px-3 py-3 text-right font-medium text-slate-600">
                          ₹{Number(loan.requestedAmount).toLocaleString("en-IN")}
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-slate-800">
                          {loan.approvedAmount ? `₹${Number(loan.approvedAmount).toLocaleString("en-IN")}` : '--'}
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-slate-700">
                          {loan.tenureMonths} Mo
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-emerald-700">
                          ₹{Number(loan.totalPaid || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold text-purple-700 text-sm">
                          ₹{Number(loan.outstandingBalance || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            loan.status === "Approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                            loan.status === "Closed" ? "bg-slate-100 text-slate-600" :
                            loan.status === "Rejected" ? "bg-red-50 text-red-700" :
                            "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}>
                            {loan.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleViewLoanDetails(loan.id)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg font-bold"
                              title="View Ledger & Schedule"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>

                            {!isEmployeeOnly && loan.status === "Pending" && (
                              <>
                                <button
                                  onClick={() => handleOpenApproveModal(loan)}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                  title="Approve Loan"
                                >
                                  <CheckCircleIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleReject(loan.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Reject Loan"
                                >
                                  <XCircleIcon className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {!isEmployeeOnly && loan.status === "Approved" && parseFloat(loan.outstandingBalance) > 0 && (
                              <button
                                onClick={() => handleOpenRepaymentModal(loan)}
                                className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg"
                                title="Record Manual Repayment"
                              >
                                <CreditCardIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: REQUEST LOAN FORM */}
      {activeTab === "request" && (
        <form onSubmit={handleRequestLoan} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs max-w-xl mx-auto space-y-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Submit Loan / Salary Advance Request</h3>
            <p className="text-slate-400">Apply for company financial support subject to HR approval and payroll EMI recovery.</p>
          </div>

          {!isEmployeeOnly && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Employee (Optional - Admin on behalf)</label>
              <select
                value={targetEmployeeId}
                onChange={(e) => setTargetEmployeeId(e.target.value)}
                className="w-full border rounded-xl p-2 bg-slate-50 focus:bg-white focus:outline-indigo-500 font-semibold"
              >
                <option value="">-- Apply for myself --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email} ({emp.employeeCode || emp.employeeId || 'Active'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Loan Category *</label>
            <select
              value={loanType}
              onChange={(e) => setLoanType(e.target.value)}
              className="w-full border rounded-xl p-2 bg-slate-50 focus:bg-white focus:outline-indigo-500 font-semibold"
            >
              <option value="Personal">Personal Loan</option>
              <option value="Salary Advance">Salary Advance (Short Term)</option>
              <option value="Emergency Medical">Emergency Medical Loan</option>
              <option value="Education Support">Higher Education / Skill Loan</option>
              <option value="Home / Relocation">Home / Relocation Advance</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Requested Amount (₹) *</label>
              <input
                type="number"
                required
                min="1000"
                placeholder="e.g. 50000"
                value={requestedAmount}
                onChange={(e) => setRequestedAmount(e.target.value)}
                className="w-full border rounded-xl p-2 bg-slate-50 focus:bg-white focus:outline-indigo-500 font-bold text-indigo-700 text-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tenure (Months) *</label>
              <select
                value={tenureMonths}
                onChange={(e) => setTenureMonths(e.target.value)}
                className="w-full border rounded-xl p-2 bg-slate-50 focus:bg-white focus:outline-indigo-500 font-semibold text-sm"
              >
                {[3, 6, 9, 12, 18, 24, 36, 48].map(m => (
                  <option key={m} value={m}>{m} Months</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Reason / Purpose of Request *</label>
            <textarea
              required
              rows="3"
              placeholder="Explain the reason for financial assistance..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border rounded-xl p-2 bg-slate-50 focus:bg-white focus:outline-indigo-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Supporting Document URL / Reference</label>
            <input
              type="text"
              placeholder="e.g. Medical bill / invoice link or reference"
              value={supportingDocument}
              onChange={(e) => setSupportingDocument(e.target.value)}
              className="w-full border rounded-xl p-2 bg-slate-50 focus:bg-white focus:outline-indigo-500"
            />
          </div>

          <div className="border-t pt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("loans")}
              className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs"
            >
              Submit Loan Request
            </button>
          </div>
        </form>
      )}

      {/* APPROVAL MODAL WITH REAL-TIME EMI CALCULATOR */}
      {approveModalLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleConfirmApprove} className="bg-white border rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 text-xs">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">Approve Loan & Configure EMI</h3>
                <p className="text-[11px] text-slate-400">Applicant: {approveModalLoan.employee?.employeeName || 'Employee'}</p>
              </div>
              <button
                type="button"
                onClick={() => setApproveModalLoan(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sanctioned Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                  className="w-full border rounded-xl p-2 bg-slate-50 focus:bg-white focus:outline-indigo-500 font-extrabold text-indigo-700 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Annual Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full border rounded-xl p-2 bg-slate-50 focus:bg-white focus:outline-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tenure (Months) *</label>
                  <select
                    value={approveTenure}
                    onChange={(e) => setApproveTenure(e.target.value)}
                    className="w-full border rounded-xl p-2 bg-slate-50 focus:bg-white focus:outline-indigo-500 font-semibold"
                  >
                    {[1, 2, 3, 6, 9, 12, 18, 24, 36, 48].map(m => (
                      <option key={m} value={m}>{m} Months</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">First Installment Start Date *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border rounded-xl p-2 bg-slate-50 focus:bg-white focus:outline-indigo-500"
                />
              </div>

              {/* Real-time calculated EMI pill */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-3.5 rounded-xl flex justify-between items-center text-indigo-900">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider block text-indigo-600">Monthly EMI Deduction</span>
                  <span className="text-lg font-black">₹{calculatedEmi.toLocaleString("en-IN")}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider block text-indigo-600">Total Payable</span>
                  <span className="text-xs font-extrabold">₹{(calculatedEmi * parseInt(approveTenure || 1)).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setApproveModalLoan(null)}
                className="px-3.5 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-2xs"
              >
                Approve & Generate Schedule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RECORD MANUAL REPAYMENT MODAL */}
      {repaymentModalLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleConfirmRepayment} className="bg-white border rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 text-xs">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">Record Manual / Early Repayment</h3>
                <p className="text-[11px] text-slate-400">Current Outstanding: ₹{Number(repaymentModalLoan.outstandingBalance).toLocaleString("en-IN")}</p>
              </div>
              <button
                type="button"
                onClick={() => setRepaymentModalLoan(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Repayment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={repaymentModalLoan.outstandingBalance}
                  placeholder={`Max ₹${repaymentModalLoan.outstandingBalance}`}
                  value={repaymentAmount}
                  onChange={(e) => setRepaymentAmount(e.target.value)}
                  className="w-full border rounded-xl p-2 bg-slate-50 focus:bg-white focus:outline-indigo-500 font-extrabold text-indigo-700 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Date *</label>
                <input
                  type="date"
                  required
                  value={repaymentDate}
                  onChange={(e) => setRepaymentDate(e.target.value)}
                  className="w-full border rounded-xl p-2 bg-slate-50 focus:bg-white focus:outline-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Mode *</label>
                <select
                  value={repaymentMode}
                  onChange={(e) => setRepaymentMode(e.target.value)}
                  className="w-full border rounded-xl p-2 bg-slate-50 focus:bg-white focus:outline-indigo-500 font-semibold"
                >
                  <option value="Bank Transfer">Bank Transfer / NEFT / IMPS</option>
                  <option value="Cheque">Cheque Deposit</option>
                  <option value="Cash Deposit">Cash Deposit</option>
                  <option value="Salary Advance Adjustment">Salary Advance Adjustment</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Remarks / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Pre-closure partial payment"
                  value={repaymentRemarks}
                  onChange={(e) => setRepaymentRemarks(e.target.value)}
                  className="w-full border rounded-xl p-2 bg-slate-50 focus:bg-white focus:outline-indigo-500"
                />
              </div>
            </div>

            <div className="border-t pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRepaymentModalLoan(null)}
                className="px-3.5 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs"
              >
                Record Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DETAILED LOAN LEDGER & AMORTIZATION MODAL */}
      {selectedLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                  {selectedLoan.loanType}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  {selectedLoan.employee?.employeeName || 'Employee'}
                </h3>
                <p className="text-slate-400 text-[11px]">
                  Sanctioned: ₹{Number(selectedLoan.approvedAmount || selectedLoan.requestedAmount).toLocaleString('en-IN')} • Outstanding: ₹{Number(selectedLoan.outstandingBalance).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => setSelectedLoan(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Quick Actions for HR */}
            {!isEmployeeOnly && selectedLoan.status === "Approved" && (
              <div className="flex justify-end gap-2 border-b pb-2">
                <button
                  onClick={() => handleCloseLoan(selectedLoan.id)}
                  className="px-3 py-1 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 font-bold rounded-lg text-[11px]"
                >
                  Manually Close Loan
                </button>
              </div>
            )}

            {/* Installment Amortization Schedules */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Installment Schedule ({selectedLoan.emiSchedules?.length || 0} Installments)
              </span>
              <div className="border rounded-xl max-h-48 overflow-y-auto divide-y">
                {selectedLoan.emiSchedules?.map((sched) => (
                  <div key={sched.id} className="p-2.5 flex justify-between items-center text-[11px]">
                    <div>
                      <span className="font-bold text-slate-700">Installment #{sched.installmentNumber}</span>
                      <span className="text-slate-400 ml-2">Due: {sched.dueDate}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-slate-800">₹{Number(sched.emiAmount).toLocaleString('en-IN')}</span>
                      <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${
                        sched.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                        sched.status === 'Skipped' ? 'bg-slate-100 text-slate-500' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {sched.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Repayment Transactions Ledger */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Repayment Ledger ({selectedLoan.repayments?.length || 0} Transactions)
              </span>
              <div className="border rounded-xl max-h-40 overflow-y-auto divide-y">
                {(!selectedLoan.repayments || selectedLoan.repayments.length === 0) ? (
                  <div className="p-4 text-center text-slate-400 text-[11px]">No repayments recorded yet.</div>
                ) : (
                  selectedLoan.repayments.map((rep) => (
                    <div key={rep.id} className="p-2.5 flex justify-between items-center text-[11px]">
                      <div>
                        <div className="font-bold text-emerald-700">+ ₹{Number(rep.amount).toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-slate-400">{rep.paymentMode} • {rep.paymentDate}</div>
                      </div>
                      <span className="text-[10px] text-slate-500 max-w-xs truncate">{rep.remarks || '--'}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t pt-3 flex justify-end">
              <button
                onClick={() => setSelectedLoan(null)}
                className="px-4 py-2 font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanManagement;
