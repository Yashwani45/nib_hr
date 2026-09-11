import React, { useState, useEffect } from "react";
import { apiFetch } from "../../services/hrApi";

const PayrollReports = () => {
  const [reportType, setReportType] = useState("payroll");
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [month, setMonth] = useState("January");
  const [year, setYear] = useState("2026");
  const [selectedEmp, setSelectedEmp] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("");

  const loadFilterData = async () => {
    try {
      const empRes = await apiFetch("/api/table/employees");
      if (empRes?.data) setEmployees(empRes.data);

      const deptRes = await apiFetch("/api/table/departments");
      if (deptRes?.data) setDepartments(deptRes.data);
    } catch (e) {}
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        type: reportType,
        month,
        year,
        employeeId: selectedEmp,
        departmentId: selectedDept,
        startDate,
        endDate,
        status
      }).toString();

      const res = await apiFetch(`/api/finance/reports?${q}`);
      if (res && res.data) {
        setRecords(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilterData();
  }, []);

  useEffect(() => {
    loadReport();
  }, [reportType, month, year, selectedEmp, selectedDept, startDate, endDate, status]);

  const handleExport = (format) => {
    const q = new URLSearchParams({
      type: reportType,
      month,
      year,
      employeeId: selectedEmp,
      departmentId: selectedDept,
      startDate,
      endDate,
      status,
      format
    }).toString();
    window.open(`http://localhost:5000/api/finance/reports/export?${q}`, "_blank");
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Payroll Reports Engine</h2>
          <p className="text-xs text-slate-500">Filter, analyze, and export statutory register sheets, loan balances, ESI calculations, and salary payouts.</p>
        </div>
        <div className="flex gap-2">
          {["csv", "excel"].map(fmt => (
            <button
              key={fmt}
              onClick={() => handleExport(fmt)}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 uppercase"
            >
              Export {fmt}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Side: Report Category Selection */}
        <div className="md:col-span-1 space-y-2 border-r pr-0 md:pr-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">Report Category</h3>
          {[
            { id: "payroll", label: "Monthly Payroll Register" },
            { id: "payslip", label: "Payslip Register Report" },
            { id: "loan", label: "Loan Disbursements Ledger" },
            { id: "loan_emi", label: "Loan EMI Deductions" },
            { id: "esi", label: "Statutory ESI Contributions" },
            { id: "pt", label: "Professional Tax (PT) Report" }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setReportType(opt.id)}
              className={`w-full text-left px-3 py-2 text-xs rounded-xl font-bold transition ${
                reportType === opt.id ? "bg-indigo-600 text-white" : "bg-white border text-slate-700 hover:bg-slate-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Right Side: Filters and Data Preview */}
        <div className="md:col-span-3 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 border rounded-2xl">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Month</label>
              <select value={month} onChange={(e) => setMonth(e.target.value)} className="w-full text-xs border rounded-lg p-2 bg-white font-bold text-slate-700">
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Year</label>
              <select value={year} onChange={(e) => setYear(e.target.value)} className="w-full text-xs border rounded-lg p-2 bg-white font-bold text-slate-700">
                {["2025", "2026", "2027"].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Employee</label>
              <select value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)} className="w-full text-xs border rounded-lg p-2 bg-white font-bold text-slate-700">
                <option value="">-- All Employees --</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.employeeName || `${e.firstName} ${e.lastName}`}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Department</label>
              <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="w-full text-xs border rounded-lg p-2 bg-white font-bold text-slate-700">
                <option value="">-- All Departments --</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.dept_name || d.deptCode}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full text-xs border rounded-lg p-2 bg-white font-bold text-slate-700" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full text-xs border rounded-lg p-2 bg-white font-bold text-slate-700" />
            </div>
          </div>

          {loading && <div className="text-center text-xs text-slate-400 py-8">Fetching report records...</div>}

          {!loading && (
            <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-xs">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs bg-white">
                <thead className="bg-slate-50">
                  {reportType === "payroll" ? (
                    <tr>
                      <th className="px-3 py-2 text-slate-500 font-bold">Employee</th>
                      <th className="px-3 py-2 text-slate-500 font-bold text-center">LOP Days</th>
                      <th className="px-3 py-2 text-slate-500 font-bold text-right">Gross Pay</th>
                      <th className="px-3 py-2 text-slate-500 font-bold text-right">Deductions</th>
                      <th className="px-3 py-2 text-slate-500 font-bold text-right">Net Salary</th>
                      <th className="px-3 py-2 text-slate-500 font-bold">Status</th>
                    </tr>
                  ) : reportType === "payslip" ? (
                    <tr>
                      <th className="px-3 py-2 text-slate-500 font-bold">Employee</th>
                      <th className="px-3 py-2 text-slate-500 font-bold">Salary Period</th>
                      <th className="px-3 py-2 text-slate-500 font-bold text-right">Gross Salary</th>
                      <th className="px-3 py-2 text-slate-500 font-bold text-right">Net Take Home</th>
                      <th className="px-3 py-2 text-slate-500 font-bold">Status</th>
                    </tr>
                  ) : reportType === "loan" ? (
                    <tr>
                      <th className="px-3 py-2 text-slate-500 font-bold">Employee</th>
                      <th className="px-3 py-2 text-slate-500 font-bold">Loan Type</th>
                      <th className="px-3 py-2 text-slate-500 font-bold text-right">Approved Amt</th>
                      <th className="px-3 py-2 text-slate-500 font-bold text-right">Outstanding</th>
                      <th className="px-3 py-2 text-slate-500 font-bold">Status</th>
                    </tr>
                  ) : reportType === "loan_emi" ? (
                    <tr>
                      <th className="px-3 py-2 text-slate-500 font-bold">Employee</th>
                      <th className="px-3 py-2 text-slate-500 font-bold">Loan Type</th>
                      <th className="px-3 py-2 text-slate-500 font-bold text-right">Repaid EMI</th>
                      <th className="px-3 py-2 text-slate-500 font-bold">Payment Date</th>
                      <th className="px-3 py-2 text-slate-500 font-bold">Mode</th>
                    </tr>
                  ) : reportType === "esi" ? (
                    <tr>
                      <th className="px-3 py-2 text-slate-500 font-bold">Employee</th>
                      <th className="px-3 py-2 text-slate-500 font-bold">ESIC Number</th>
                      <th className="px-3 py-2 text-slate-500 font-bold text-right">Gross Wages</th>
                      <th className="px-3 py-2 text-slate-500 font-bold text-right">Employee (0.75%)</th>
                      <th className="px-3 py-2 text-slate-500 font-bold text-right">Employer (3.25%)</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-3 py-2 text-slate-500 font-bold">Employee</th>
                      <th className="px-3 py-2 text-slate-500 font-bold">State</th>
                      <th className="px-3 py-2 text-slate-500 font-bold text-right">PT Deducted</th>
                      <th className="px-3 py-2 text-slate-500 font-bold">Deduction Month</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reportType === "payroll" && records.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 font-bold text-slate-800">{item.employee?.employeeName}</td>
                      <td className="px-3 py-2 text-center text-slate-600 font-semibold">{item.lopDays}d LOP</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-700">₹{item.grossSalary}</td>
                      <td className="px-3 py-2 text-right text-red-500 font-semibold">-₹{item.totalDeductions}</td>
                      <td className="px-3 py-2 text-right text-indigo-700 font-extrabold">₹{item.netSalary}</td>
                      <td className="px-3 py-2"><span className="px-1.5 py-0.5 border text-[9px] rounded font-bold uppercase">{item.status}</span></td>
                    </tr>
                  ))}

                  {reportType === "payslip" && records.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 font-bold text-slate-800">{item.employee?.employeeName}</td>
                      <td className="px-3 py-2 text-slate-600 font-semibold">{item.month} {item.year}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-700">₹{item.grossSalary}</td>
                      <td className="px-3 py-2 text-right text-indigo-700 font-extrabold">₹{item.netSalary}</td>
                      <td className="px-3 py-2"><span className="px-1.5 py-0.5 border text-[9px] rounded font-bold uppercase bg-green-50 text-green-700">{item.paymentStatus}</span></td>
                    </tr>
                  ))}

                  {reportType === "loan" && records.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 font-bold text-slate-800">{item.employee?.employeeName}</td>
                      <td className="px-3 py-2 text-slate-600 font-semibold">{item.loanType}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-700">₹{item.approvedAmount}</td>
                      <td className="px-3 py-2 text-right text-red-500 font-semibold">₹{item.outstandingBalance}</td>
                      <td className="px-3 py-2"><span className="px-1.5 py-0.5 border text-[9px] rounded font-bold uppercase">{item.status}</span></td>
                    </tr>
                  ))}

                  {reportType === "loan_emi" && records.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 font-bold text-slate-800">{item.loan?.employee?.employeeName}</td>
                      <td className="px-3 py-2 text-slate-600 font-semibold">{item.loan?.loanType}</td>
                      <td className="px-3 py-2 text-right text-indigo-700 font-extrabold">₹{item.amount}</td>
                      <td className="px-3 py-2 text-slate-600 font-semibold">{item.paymentDate}</td>
                      <td className="px-3 py-2 text-slate-500 font-semibold">{item.paymentMode}</td>
                    </tr>
                  ))}

                  {reportType === "esi" && records.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 font-bold text-slate-800">{item.employee?.employeeName}</td>
                      <td className="px-3 py-2 text-slate-600 font-semibold">{item.esiNumber || '--'}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-700">₹{item.grossWages}</td>
                      <td className="px-3 py-2 text-right text-red-500 font-semibold">₹{item.employeeContribution}</td>
                      <td className="px-3 py-2 text-right text-red-500 font-semibold">₹{item.employerContribution}</td>
                    </tr>
                  ))}

                  {reportType === "pt" && records.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 font-bold text-slate-800">{item.employee?.employeeName}</td>
                      <td className="px-3 py-2 text-slate-600 font-semibold">{item.state}</td>
                      <td className="px-3 py-2 text-right text-indigo-700 font-extrabold">₹{item.ptAmount}</td>
                      <td className="px-3 py-2 text-slate-600 font-semibold">{item.month} {item.year}</td>
                    </tr>
                  ))}

                  {records.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-slate-400 font-semibold">
                        No report records compiled. Try adjusting your parameters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayrollReports;
