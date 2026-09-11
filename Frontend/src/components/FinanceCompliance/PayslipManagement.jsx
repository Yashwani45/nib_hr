import React, { useState, useEffect } from "react";
import { apiFetch } from "../../services/hrApi";

const PayslipManagement = () => {
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  // Filters
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterEmp, setFilterEmp] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        month: filterMonth,
        year: filterYear,
        employeeId: filterEmp,
        departmentId: filterDept,
        status: filterStatus
      }).toString();
      
      const res = await apiFetch(`/api/finance/payslips?${q}`);
      if (res && res.data) {
        setPayslips(res.data);
      }

      const empRes = await apiFetch("/api/table/employees");
      if (empRes?.data) setEmployees(empRes.data);

      const deptRes = await apiFetch("/api/table/departments");
      if (deptRes?.data) setDepartments(deptRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterMonth, filterYear, filterEmp, filterDept, filterStatus]);

  // Statistics
  const stats = React.useMemo(() => {
    const total = payslips.length;
    const paid = payslips.filter(p => p.paymentStatus === 'Paid').length;
    const pending = total - paid;
    const amount = payslips.reduce((sum, p) => sum + parseFloat(p.netSalary), 0);
    return { total, paid, pending, amount };
  }, [payslips]);

  const handlePrint = (payslipId) => {
    const printWindow = window.open(`http://localhost:5000/api/finance/payslips/${payslipId}/pdf`, '_blank');
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Payslip Dashboard</h2>
        <p className="text-xs text-slate-500">Inspect historical salary slips, verify payment details, print layouts, and download PDFs.</p>
      </div>

      {/* Cards Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Payslips", val: stats.total, color: "bg-indigo-50 border-indigo-100 text-indigo-700" },
          { label: "Paid Slips", val: stats.paid, color: "bg-green-50 border-green-100 text-green-700" },
          { label: "Pending Payouts", val: stats.pending, color: "bg-amber-50 border-amber-100 text-amber-700" },
          { label: "Total Payout Volume", val: `₹${stats.amount.toLocaleString('en-IN')}`, color: "bg-sky-50 border-sky-100 text-sky-700" }
        ].map((c, i) => (
          <div key={i} className={`p-4 border rounded-2xl flex flex-col justify-between ${c.color} shadow-2xs`}>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">{c.label}</span>
            <span className="text-xl font-extrabold mt-2 block">{c.val}</span>
          </div>
        ))}
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap gap-3 bg-slate-50 p-4 border rounded-2xl">
        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="text-xs border rounded-lg p-2 bg-white font-bold text-slate-700">
          <option value="">-- All Months --</option>
          {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="text-xs border rounded-lg p-2 bg-white font-bold text-slate-700">
          <option value="">-- All Years --</option>
          {["2025", "2026", "2027"].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select value={filterEmp} onChange={(e) => setFilterEmp(e.target.value)} className="text-xs border rounded-lg p-2 bg-white font-bold text-slate-700 max-w-[150px]">
          <option value="">-- All Employees --</option>
          {employees.map(e => (
            <option key={e.id} value={e.id}>{e.employeeName || `${e.firstName} ${e.lastName}`}</option>
          ))}
        </select>
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="text-xs border rounded-lg p-2 bg-white font-bold text-slate-700 max-w-[150px]">
          <option value="">-- All Departments --</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.dept_name || d.deptCode}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-xs border rounded-lg p-2 bg-white font-bold text-slate-700">
          <option value="">-- All Statuses --</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {loading && <div className="text-center text-xs text-slate-400 py-8">Loading payslips...</div>}

      {!loading && (
        <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-xs">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs bg-white">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider">Employee</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider">Salary Month</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-right">Gross Salary</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-right">Total Deductions</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-right">Net Take Home</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider">Payment</th>
                <th className="px-4 py-3 text-slate-500 font-bold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payslips.map(ps => (
                <tr key={ps.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-800 block">{ps.employee?.employeeName || 'Unknown'}</span>
                    <span className="text-[10px] text-slate-400 font-bold block">{ps.employee?.employeeCode || ps.employee?.emp_code || 'No Code'}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-600">{ps.month} {ps.year}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-700">₹{Number(ps.grossSalary).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right font-semibold text-red-500">-₹{Number(ps.totalDeductions).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right font-black text-indigo-700">₹{Number(ps.netSalary).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] border uppercase ${
                      ps.paymentStatus === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {ps.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedPayslip(ps)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handlePrint(ps.id)}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-800"
                    >
                      Print / PDF
                    </button>
                  </td>
                </tr>
              ))}
              {payslips.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-400">
                    No payslips found. Try adjusting your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">NIB Technologies Pvt Ltd</h3>
                <p className="text-[10px] text-slate-400">Okhla Phase III, New Delhi</p>
              </div>
              <button onClick={() => setSelectedPayslip(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕ Close</button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[9px] block">Employee Name</span>
                <span className="font-bold text-slate-800">{selectedPayslip.employee?.employeeName || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[9px] block">Salary Period</span>
                <span className="font-bold text-slate-800">{selectedPayslip.month} {selectedPayslip.year}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-3">
              <div className="space-y-1.5">
                <h5 className="font-bold text-xs text-slate-700 pb-1 border-b">Earnings</h5>
                <div className="flex justify-between text-xs"><span>Basic Salary</span><span className="font-semibold">₹{selectedPayslip.basic}</span></div>
                <div className="flex justify-between text-xs"><span>HRA</span><span className="font-semibold">₹{selectedPayslip.hra}</span></div>
                <div className="flex justify-between text-xs"><span>Conveyance Allowance</span><span className="font-semibold">₹{selectedPayslip.conveyance}</span></div>
                <div className="flex justify-between text-xs"><span>Medical Allowance</span><span className="font-semibold">₹{selectedPayslip.medical}</span></div>
                <div className="flex justify-between text-xs"><span>Special Allowance</span><span className="font-semibold">₹{selectedPayslip.special}</span></div>
                {selectedPayslip.otherAllowances > 0 && <div className="flex justify-between text-xs"><span>Other Allowances</span><span className="font-semibold">₹{selectedPayslip.otherAllowances}</span></div>}
                <div className="flex justify-between text-xs font-bold text-slate-900 border-t pt-1">
                  <span>Gross Salary</span><span>₹{selectedPayslip.grossSalary}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h5 className="font-bold text-xs text-slate-700 pb-1 border-b">Deductions</h5>
                <div className="flex justify-between text-xs"><span>PF Contribution</span><span className="font-semibold text-red-600">₹{selectedPayslip.pf}</span></div>
                <div className="flex justify-between text-xs"><span>ESI Contribution</span><span className="font-semibold text-red-600">₹{selectedPayslip.esi}</span></div>
                <div className="flex justify-between text-xs"><span>Professional Tax (PT)</span><span className="font-semibold text-red-600">₹{selectedPayslip.pt}</span></div>
                {selectedPayslip.tds > 0 && <div className="flex justify-between text-xs"><span>TDS</span><span className="font-semibold text-red-600">₹{selectedPayslip.tds}</span></div>}
                {selectedPayslip.loanDeduction > 0 && <div className="flex justify-between text-xs"><span>Loan EMI Deduction</span><span className="font-semibold text-red-600">₹{selectedPayslip.loanDeduction}</span></div>}
                <div className="flex justify-between text-xs font-bold text-slate-900 border-t pt-1">
                  <span>Total Deductions</span><span>₹{selectedPayslip.totalDeductions}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-dashed pt-4">
              <span className="text-sm font-extrabold text-slate-800">Net Take Home Pay:</span>
              <span className="text-lg font-black text-indigo-700">₹{Number(selectedPayslip.netSalary).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayslipManagement;
