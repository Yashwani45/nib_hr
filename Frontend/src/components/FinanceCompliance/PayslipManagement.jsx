import React, { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../../services/hrApi";
import { useAuth } from "../../auth/AuthProvider";
import {
  PrinterIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  DocumentCheckIcon,
  ClockIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const PayslipManagement = () => {
  const { user } = useAuth();
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
  const [searchQuery, setSearchQuery] = useState("");

  const roleName = String(user?.role?.roleName || user?.role?.name || user?.role || "Employee").trim();
  const isEmployeeOnly = roleName === "Employee";

  const loadData = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        month: filterMonth,
        year: filterYear,
        employeeId: filterEmp,
        department: filterDept,
        status: filterStatus
      }).toString();

      const res = await apiFetch(`/api/finance/payslips?${q}`);
      if (res && res.data) {
        setPayslips(res.data);
      }

      if (!isEmployeeOnly) {
        const empRes = await apiFetch("/api/table/employees");
        if (empRes?.data) setEmployees(empRes.data);

        const deptRes = await apiFetch("/api/table/departments");
        if (deptRes?.data) setDepartments(deptRes.data);
      }
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
  const stats = useMemo(() => {
    const total = payslips.length;
    const paid = payslips.filter(p => p.paymentStatus === "Paid").length;
    const pending = total - paid;
    const amount = payslips.reduce((sum, p) => sum + (parseFloat(p.netSalary) || 0), 0);
    return { total, paid, pending, amount };
  }, [payslips]);

  const filteredPayslips = useMemo(() => {
    if (!searchQuery) return payslips;
    return payslips.filter(p => {
      const emp = p.employee || {};
      const name = (emp.employeeName || `${emp.firstName || ''} ${emp.lastName || ''}`).toLowerCase();
      const code = (emp.employeeCode || emp.employeeId || '').toLowerCase();
      const num = (p.payslipNumber || '').toLowerCase();
      return name.includes(searchQuery.toLowerCase()) || code.includes(searchQuery.toLowerCase()) || num.includes(searchQuery.toLowerCase());
    });
  }, [payslips, searchQuery]);

  const handlePrint = (payslipId) => {
    const printWindow = window.open(`http://localhost:5000/api/finance/payslips/${payslipId}/pdf`, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Payslip Records & Documents</h2>
          <p className="text-xs text-slate-500">
            {isEmployeeOnly
              ? "Inspect and download your monthly salary slips, earnings breakdowns, and payment statements."
              : "Access historical employee payslip snapshots, verify payment references, print compliant salary documents, and track disbursements."}
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 self-start"
        >
          <ArrowPathIcon className="w-3.5 h-3.5" /> Refresh Slips
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Payslips Generated", val: stats.total, color: "bg-indigo-50 border-indigo-100 text-indigo-700" },
          { label: "Disbursed / Paid Slips", val: stats.paid, color: "bg-emerald-50 border-emerald-100 text-emerald-700" },
          { label: "Pending Payouts", val: stats.pending, color: "bg-amber-50 border-amber-100 text-amber-700" },
          { label: "Total Disbursed Volume", val: `₹${stats.amount.toLocaleString("en-IN")}`, color: "bg-sky-50 border-sky-100 text-sky-700" }
        ].map((c, i) => (
          <div key={i} className={`p-4 border rounded-2xl flex flex-col justify-between ${c.color} shadow-2xs`}>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">{c.label}</span>
            <span className="text-xl font-extrabold mt-2 block">{c.val}</span>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 border rounded-2xl">
        <div className="flex flex-wrap items-center gap-2">
          {!isEmployeeOnly && (
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search employee or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs border rounded-xl bg-white focus:outline-indigo-500 w-44 md:w-56"
              />
            </div>
          )}

          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="text-xs border rounded-xl p-1.5 bg-white text-slate-700 font-bold"
          >
            <option value="">All Months</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="text-xs border rounded-xl p-1.5 bg-white text-slate-700 font-bold"
          >
            <option value="">All Years</option>
            {["2024", "2025", "2026", "2027"].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {!isEmployeeOnly && (
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="text-xs border rounded-xl p-1.5 bg-white text-slate-700"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.dept_name || d.name}>{d.dept_name || d.name}</option>
              ))}
            </select>
          )}

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs border rounded-xl p-1.5 bg-white text-slate-700 font-semibold"
          >
            <option value="">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-semibold">
          {filteredPayslips.length} Records Found
        </span>
      </div>

      {/* Table of Payslips */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading payslips...</div>
      ) : filteredPayslips.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-2xl p-8 space-y-3">
          <DocumentCheckIcon className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No Payslips Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Payslips are generated automatically once a payroll run is processed.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                <tr>
                  <th className="px-4 py-3">Payslip No / Employee</th>
                  <th className="px-3 py-3">Period</th>
                  <th className="px-3 py-3 text-right">Gross Salary</th>
                  <th className="px-3 py-3 text-right">Deductions</th>
                  <th className="px-4 py-3 text-right">Net Take-Home</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3">Disbursement</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPayslips.map((slip) => {
                  const emp = slip.employee || {};
                  const name = emp.employeeName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
                  const code = emp.employeeCode || emp.employeeId || '--';

                  return (
                    <tr key={slip.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-extrabold text-slate-800">{name}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{code}</span>
                          <span>•</span>
                          <span className="font-mono text-indigo-600">{slip.payslipNumber || `PS-${slip.month.slice(0, 3)}-${slip.year}`}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-700">
                        {slip.month} {slip.year}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-slate-700">
                        ₹{Number(slip.grossSalary).toLocaleString("en-IN")}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-red-600">
                        -₹{Number(slip.totalDeductions).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-emerald-700 text-sm">
                        ₹{Number(slip.netSalary).toLocaleString("en-IN")}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          slip.paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                        }`}>
                          {slip.paymentStatus}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-500 text-[11px]">
                        <div>{slip.paymentMode || "Bank Transfer"}</div>
                        <div className="text-[10px] text-slate-400">{slip.paymentDate || "Pending"}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedPayslip(slip)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            title="Preview Payslip"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePrint(slip.id)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
                            title="Print / Save PDF"
                          >
                            <PrinterIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILED PAYSLIP PREVIEW MODAL */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Payslip #{selectedPayslip.payslipNumber || selectedPayslip.id.slice(0, 8)}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  {selectedPayslip.employee?.employeeName || 'Employee'}
                </h3>
                <p className="text-slate-400 text-[11px]">
                  {selectedPayslip.month} {selectedPayslip.year} • {selectedPayslip.employee?.department || 'Department'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrint(selectedPayslip.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700"
                >
                  <PrinterIcon className="w-3.5 h-3.5" /> Print / PDF
                </button>
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Attendance & Metadata Strip */}
            <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl text-center">
              <div><span className="text-[10px] text-slate-400 font-bold block">Calendar Days</span><strong>{selectedPayslip.workingDays || 30}</strong></div>
              <div><span className="text-[10px] text-slate-400 font-bold block">Paid Days</span><strong className="text-emerald-700">{selectedPayslip.paidDays || 30}</strong></div>
              <div><span className="text-[10px] text-slate-400 font-bold block">LOP Days</span><strong className="text-red-600">{selectedPayslip.lopDays || 0}</strong></div>
              <div><span className="text-[10px] text-slate-400 font-bold block">Payment Mode</span><strong>{selectedPayslip.paymentMode || 'NEFT'}</strong></div>
            </div>

            {/* Earnings vs Deductions Breakdown Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Earnings */}
              <div className="border rounded-xl p-3 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b pb-1">Earnings</span>
                <div className="space-y-1.5 text-slate-600">
                  <div className="flex justify-between"><span>Basic Salary</span><strong className="text-slate-800">₹{Number(selectedPayslip.basic).toLocaleString("en-IN")}</strong></div>
                  <div className="flex justify-between"><span>HRA</span><strong className="text-slate-800">₹{Number(selectedPayslip.hra).toLocaleString("en-IN")}</strong></div>
                  <div className="flex justify-between"><span>Conveyance</span><strong className="text-slate-800">₹{Number(selectedPayslip.conveyance).toLocaleString("en-IN")}</strong></div>
                  <div className="flex justify-between"><span>Special Allowance</span><strong className="text-slate-800">₹{Number(selectedPayslip.special).toLocaleString("en-IN")}</strong></div>
                  {parseFloat(selectedPayslip.otherAllowances) > 0 && (
                    <div className="flex justify-between"><span>Other Allowances</span><strong className="text-slate-800">₹{Number(selectedPayslip.otherAllowances).toLocaleString("en-IN")}</strong></div>
                  )}
                  {parseFloat(selectedPayslip.bonus) > 0 && (
                    <div className="flex justify-between"><span>Bonus</span><strong className="text-slate-800">₹{Number(selectedPayslip.bonus).toLocaleString("en-IN")}</strong></div>
                  )}
                  <div className="border-t pt-1.5 flex justify-between font-extrabold text-indigo-700">
                    <span>Total Gross</span>
                    <span>₹{Number(selectedPayslip.grossSalary).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="border rounded-xl p-3 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b pb-1">Deductions</span>
                <div className="space-y-1.5 text-slate-600">
                  <div className="flex justify-between"><span>Provident Fund (PF)</span><strong className="text-red-600">-₹{Number(selectedPayslip.pf).toLocaleString("en-IN")}</strong></div>
                  <div className="flex justify-between"><span>State Insurance (ESI)</span><strong className="text-red-600">-₹{Number(selectedPayslip.esi).toLocaleString("en-IN")}</strong></div>
                  <div className="flex justify-between"><span>Professional Tax (PT)</span><strong className="text-red-600">-₹{Number(selectedPayslip.pt).toLocaleString("en-IN")}</strong></div>
                  <div className="flex justify-between"><span>Income Tax (TDS)</span><strong className="text-red-600">-₹{Number(selectedPayslip.tds).toLocaleString("en-IN")}</strong></div>
                  {parseFloat(selectedPayslip.loanDeduction) > 0 && (
                    <div className="flex justify-between"><span>Loan Recovery</span><strong className="text-red-600">-₹{Number(selectedPayslip.loanDeduction).toLocaleString("en-IN")}</strong></div>
                  )}
                  <div className="border-t pt-1.5 flex justify-between font-extrabold text-red-700">
                    <span>Total Deductions</span>
                    <span>-₹{Number(selectedPayslip.totalDeductions).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary Highlight */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-90 block">Net Take-Home Pay</span>
                <span className="text-xl font-extrabold">₹{Number(selectedPayslip.netSalary).toLocaleString("en-IN")}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-90 block">Payment Status</span>
                <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-white/20">{selectedPayslip.paymentStatus}</span>
              </div>
            </div>

            {/* Close */}
            <div className="border-t pt-3 flex justify-end">
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-4 py-2 font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayslipManagement;
