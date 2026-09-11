import React, { useState, useEffect } from "react";
import { apiFetch } from "../../services/hrApi";

const LoanManagement = () => {
  const [loans, setLoans] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("loans"); // 'loans' | 'request'
  const [selectedLoan, setSelectedLoan] = useState(null);

  // Form: Request Loan
  const [loanType, setLoanType] = useState("Personal");
  const [requestedAmount, setRequestedAmount] = useState("");
  const [tenureMonths, setTenureMonths] = useState("");
  const [reason, setReason] = useState("");
  const [supportingDocument, setSupportingDocument] = useState("");

  // Form: Approve Loan
  const [approvedAmount, setApprovedAmount] = useState("");
  const [interestRate, setInterestRate] = useState("0");
  const [approveTenure, setApproveTenure] = useState("");
  const [startDate, setStartDate] = useState("");
  const [showApproveModal, setShowApproveModal] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/finance/loans");
      if (res && res.data) {
        setLoans(res.data);
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

  const stats = React.useMemo(() => {
    const total = loans.length;
    const pending = loans.filter(l => l.status === "Pending").length;
    const active = loans.filter(l => l.status === "Approved" && parseFloat(l.outstandingBalance) > 0).length;
    const outstanding = loans.reduce((sum, l) => sum + parseFloat(l.outstandingBalance || 0), 0);
    return { total, pending, active, outstanding };
  }, [loans]);

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
          supportingDocument
        })
      });
      alert("Loan request submitted successfully!");
      setRequestedAmount("");
      setTenureMonths("");
      setReason("");
      setSupportingDocument("");
      setActiveTab("loans");
      loadData();
    } catch (err) {
      alert(err.message || "Failed to submit loan request.");
    }
  };

  const handleOpenApprove = (loan) => {
    setShowApproveModal(loan);
    setApprovedAmount(loan.requestedAmount);
    setApproveTenure(loan.tenureMonths);
    setStartDate(new Date().toISOString().split("T")[0]);
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/finance/loans/${showApproveModal.id}/approve`, {
        method: "POST",
        body: JSON.stringify({
          approvedAmount: parseFloat(approvedAmount),
          interestRate: parseFloat(interestRate),
          tenureMonths: parseInt(approveTenure),
          startDate
        })
      });
      alert("Loan request approved and EMI schedules initialized!");
      setShowApproveModal(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Are you sure you want to REJECT this loan request?")) return;
    try {
      await apiFetch(`/api/finance/loans/${id}/reject`, { method: "POST" });
      alert("Loan request rejected.");
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCloseLoan = async (id) => {
    if (!window.confirm("Close this loan manually? Outstanding balance will be set to 0.")) return;
    try {
      await apiFetch(`/api/finance/loans/${id}/close`, { method: "POST" });
      alert("Loan closed.");
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleViewDetails = async (loanId) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/finance/loans/${loanId}`);
      if (res?.data) {
        setSelectedLoan(res.data);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Employee Loan Management</h2>
          <p className="text-xs text-slate-500">Track loan requests, approve disbursements, generate amortization schedules, and check repayments history.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "loans" ? (
            <button
              onClick={() => setActiveTab("request")}
              className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-2xs"
            >
              + Request Loan
            </button>
          ) : (
            <button
              onClick={() => setActiveTab("loans")}
              className="px-3 py-1.5 text-xs font-semibold bg-white border rounded-xl text-slate-700 hover:bg-slate-50"
            >
              Back to List
            </button>
          )}
        </div>
      </div>

      {activeTab === "loans" && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Applications", val: stats.total, color: "bg-indigo-50 border-indigo-100 text-indigo-700" },
              { label: "Pending Requests", val: stats.pending, color: "bg-amber-50 border-amber-100 text-amber-700" },
              { label: "Active Loans", val: stats.active, color: "bg-green-50 border-green-100 text-green-700" },
              { label: "Outstanding Volume", val: `₹${stats.outstanding.toLocaleString('en-IN')}`, color: "bg-sky-50 border-sky-100 text-sky-700" }
            ].map((c, i) => (
              <div key={i} className={`p-4 border rounded-2xl flex flex-col justify-between ${c.color} shadow-2xs`}>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">{c.label}</span>
                <span className="text-xl font-extrabold mt-2 block">{c.val}</span>
              </div>
            ))}
          </div>

          {loading && <div className="text-center text-xs text-slate-400 py-8">Loading loans data...</div>}

          {!loading && (
            <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-xs">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs bg-white">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider">Employee</th>
                    <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider">Loan Type</th>
                    <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-right">Requested</th>
                    <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-right">Approved</th>
                    <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-right">Outstanding</th>
                    <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loans.map(loan => (
                    <tr key={loan.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-800 block">{loan.employee?.employeeName || 'Unknown'}</span>
                        <span className="text-[10px] text-slate-400 font-bold block">{loan.employee?.employeeCode || loan.employee?.emp_code || 'No Code'}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-600">{loan.loanType}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-700">₹{Number(loan.requestedAmount).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-700">₹{Number(loan.approvedAmount || 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right font-black text-indigo-700">₹{Number(loan.outstandingBalance || 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] border uppercase ${
                          loan.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                          loan.status === 'Closed' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                          loan.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleViewDetails(loan.id)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          View Schedule
                        </button>
                        {loan.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleOpenApprove(loan)}
                              className="text-xs font-bold text-emerald-600 hover:text-emerald-800"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(loan.id)}
                              className="text-xs font-bold text-red-500 hover:text-red-700"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {loan.status === 'Approved' && parseFloat(loan.outstandingBalance) > 0 && (
                          <button
                            onClick={() => handleCloseLoan(loan.id)}
                            className="text-xs font-bold text-slate-500 hover:text-slate-700"
                          >
                            Close Loan
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {loans.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-10 text-slate-400">
                        No loan records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === "request" && (
        <form onSubmit={handleRequestLoan} className="bg-white border rounded-2xl p-6 space-y-6 max-w-md mx-auto shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 border-b pb-2">Apply for Employee Loan</h3>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Loan Type</label>
              <select
                value={loanType}
                onChange={(e) => setLoanType(e.target.value)}
                className="w-full text-xs border rounded-lg p-2.5 bg-white font-bold"
                required
              >
                <option value="Personal">Personal Loan</option>
                <option value="Vehicle">Vehicle Loan</option>
                <option value="Home">Home Loan</option>
                <option value="Emergency">Emergency Advance</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Requested Amount (₹)</label>
              <input
                type="number"
                value={requestedAmount}
                onChange={(e) => setRequestedAmount(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full text-xs border rounded-lg p-2.5 bg-slate-50 focus:bg-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Tenure (Months)</label>
              <input
                type="number"
                value={tenureMonths}
                onChange={(e) => setTenureMonths(e.target.value)}
                placeholder="e.g. 12"
                className="w-full text-xs border rounded-lg p-2.5 bg-slate-50 focus:bg-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly state the reason for requesting loan..."
                className="w-full text-xs border rounded-lg p-2.5 bg-slate-50 focus:bg-white h-20"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Supporting Document URL</label>
              <input
                type="text"
                value={supportingDocument}
                onChange={(e) => setSupportingDocument(e.target.value)}
                placeholder="Paste attachment path if required..."
                className="w-full text-xs border rounded-lg p-2.5 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 shadow-2xs"
          >
            Submit Request
          </button>
        </form>
      )}

      {/* Amortization Schedule view details Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Amortization Schedule - Loan ID: {selectedLoan.id.slice(0, 8)}</h3>
                <p className="text-[10px] text-slate-400 font-bold">Outstanding: ₹{selectedLoan.outstandingBalance} | Paid: ₹{selectedLoan.totalPaid}</p>
              </div>
              <button onClick={() => setSelectedLoan(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕ Close</button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs border-b pb-4">
              <div><span className="text-slate-400 block font-bold">Approved Principal:</span><span className="font-bold text-slate-800">₹{selectedLoan.approvedAmount}</span></div>
              <div><span className="text-slate-400 block font-bold">Interest Rate:</span><span className="font-bold text-slate-800">{selectedLoan.interestRate}%</span></div>
              <div><span className="text-slate-400 block font-bold">Disbursement Date:</span><span className="font-bold text-slate-800">{selectedLoan.startDate || '--'}</span></div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-600">Installments Schedule</h4>
              <div className="overflow-y-auto max-h-[40vh] border border-slate-100 rounded-xl">
                <table className="min-w-full divide-y divide-slate-100 text-left text-xs bg-white">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-slate-500 font-bold">No</th>
                      <th className="px-3 py-2 text-slate-500 font-bold">Due Date</th>
                      <th className="px-3 py-2 text-slate-500 font-bold text-right">EMI Amount</th>
                      <th className="px-3 py-2 text-slate-500 font-bold text-right">Principal</th>
                      <th className="px-3 py-2 text-slate-500 font-bold text-right">Interest</th>
                      <th className="px-3 py-2 text-slate-500 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {selectedLoan.emiSchedules?.map(sched => (
                      <tr key={sched.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 text-slate-800 font-bold">{sched.installmentNumber}</td>
                        <td className="px-3 py-2 text-slate-600 font-semibold">{sched.dueDate}</td>
                        <td className="px-3 py-2 text-right font-bold text-slate-700">₹{sched.emiAmount}</td>
                        <td className="px-3 py-2 text-right text-slate-600 font-semibold">₹{sched.principalAmount}</td>
                        <td className="px-3 py-2 text-right text-slate-600 font-semibold">₹{sched.interestAmount}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] border uppercase ${
                            sched.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' :
                            sched.status === 'Skipped' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {sched.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Drawer Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={handleApprove} className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 border-b pb-2">Approve Loan Request</h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Approved Principal Amount (₹)</label>
                <input
                  type="number"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                  className="w-full text-xs border rounded-lg p-2.5"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Interest Rate (% Annual)</label>
                <input
                  type="number"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="w-full text-xs border rounded-lg p-2.5"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Approved Tenure (Months)</label>
                <input
                  type="number"
                  value={approveTenure}
                  onChange={(e) => setApproveTenure(e.target.value)}
                  className="w-full text-xs border rounded-lg p-2.5"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Disbursement / Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs border rounded-lg p-2.5"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3">
              <button type="button" onClick={() => setShowApproveModal(null)} className="px-3 py-1.5 border rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700">Confirm Approval</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default LoanManagement;
