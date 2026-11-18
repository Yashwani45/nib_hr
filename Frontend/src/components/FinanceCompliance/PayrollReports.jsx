// Frontend/src/components/FinanceCompliance/PayrollReports.jsx
import React, { useState, useEffect, useMemo } from "react";
import { apiFetch, downloadFile } from "../../services/hrApi";

const REPORT_CATEGORIES = [
  {
    group: "Core Payroll Registers",
    reports: [
      { id: "monthly_summary", label: "1. Monthly Payroll Summary", desc: "High-level summary of headcount, gross, deductions, employer cost, and CTC." },
      { id: "salary_register", label: "2. Employee Salary Register", desc: "Line-by-line breakdown of every employee's salary and deductions." },
      { id: "department_cost", label: "3. Department-wise Payroll Cost", desc: "Departmental headcount and employer budget distribution." },
      { id: "earnings_deductions", label: "4. Earnings & Deductions Register", desc: "Granular components analysis across all active personnel." },
      { id: "attendance_lop", label: "5. Attendance & LOP Report", desc: "Payable days, unpaid leave, and Loss of Pay adjustments." },
      { id: "payslip_status", label: "6. Payslip Generation & Delivery", desc: "Audit snapshot of generated payslips and dispatch status." }
    ]
  },
  {
    group: "Statutory & Tax Compliance",
    reports: [
      { id: "esi_report", label: "7. ESI Statutory Register", desc: "Employee (0.75%) & employer (3.25%) ESIC wage contributions." },
      { id: "pt_report", label: "8. Professional Tax (PT) Report", desc: "State-specific PT deductions (MP, MH, KA, etc.) and challans." },
      { id: "pf_report", label: "9. PF Contribution Statement", desc: "Employee and employer Provident Fund contributions." },
      { id: "tds_report", label: "10. TDS Withholding Report", desc: "Income tax deductions at source under Section 192." },
      { id: "employer_ctc", label: "11. Employer Contribution & CTC", desc: "Full employer burden analysis, monthly & annual CTC." }
    ]
  },
  {
    group: "Banking & Disbursements",
    reports: [
      { id: "bank_payment_report", label: "12. Bank Payment & Payout Report", desc: "Account numbers, IFSC codes, transaction references, and statuses." }
    ]
  },
  {
    group: "Loans & Advances",
    reports: [
      { id: "loan_disbursement_repayment", label: "13. Loan Repayment Ledger", desc: "Installments deducted through payroll and direct payments." },
      { id: "outstanding_loans", label: "14. Outstanding Loan Balances", desc: "Active employee loans, balances due, and repayment tenures." }
    ]
  },
  {
    group: "Governance & Exceptions",
    reports: [
      { id: "exceptions_report", label: "15. Exceptions & Data Warnings", desc: "Missing salary structures, unassigned bank details, or invalid PAN." },
      { id: "audit_report", label: "16. Approval & Audit Trail", desc: "Traceability log of finance actions, recalculations, and approvals." }
    ]
  }
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const PayrollReports = () => {
  const [selectedReportId, setSelectedReportId] = useState("monthly_summary");
  const [reportResult, setReportResult] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [month, setMonth] = useState("January");
  const [year, setYear] = useState("2026");
  const [selectedEmp, setSelectedEmp] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const loadFilterData = async () => {
    try {
      const [empRes, deptRes] = await Promise.all([
        apiFetch("/api/table/employees").catch(() => null),
        apiFetch("/api/table/departments").catch(() => null)
      ]);
      if (empRes?.data) setEmployees(empRes.data);
      if (deptRes?.data) setDepartments(deptRes.data);
    } catch (e) {}
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        type: selectedReportId,
        month,
        year,
        employeeId: selectedEmp,
        department: selectedDept,
        startDate,
        endDate,
        status: statusFilter,
        search: search.trim()
      });

      const res = await apiFetch(`/api/finance/reports?${q.toString()}`);
      if (res && res.data) {
        setReportResult(res.data);
      }
    } catch (err) {
      console.error("Report fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilterData();
  }, []);

  useEffect(() => {
    loadReport();
  }, [selectedReportId, month, year, selectedEmp, selectedDept, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadReport();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const q = new URLSearchParams({
        type: selectedReportId,
        month,
        year,
        employeeId: selectedEmp,
        department: selectedDept,
        startDate,
        endDate,
        status: statusFilter,
        search: search.trim()
      });
      await downloadFile(`/api/finance/reports/export?${q.toString()}`, `${selectedReportId}_${month}_${year}.csv`);
    } catch (err) {
      alert("Export failed: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const activeReportMeta = useMemo(() => {
    for (const cat of REPORT_CATEGORIES) {
      const found = cat.reports.find(r => r.id === selectedReportId);
      if (found) return found;
    }
    return { id: selectedReportId, label: selectedReportId, desc: "" };
  }, [selectedReportId]);

  const records = useMemo(() => {
    if (!reportResult) return [];
    if (Array.isArray(reportResult.records)) return reportResult.records;
    if (Array.isArray(reportResult)) return reportResult;
    return [];
  }, [reportResult]);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Finance & Payroll Reports Engine</h2>
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              16 Comprehensive Reports
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time database-driven reporting covering monthly payroll registers, statutory ESIC, PT, PF, TDS, loans, bank instructions, and compliance audits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting || loading}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>⬇️</span> {exporting ? "Generating CSV..." : "Export Report (CSV)"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Side: Report Selector by Category */}
        <div className="lg:col-span-1 space-y-4 border rounded-2xl p-3 bg-slate-50/80 shadow-2xs">
          <div className="px-2 pt-1 pb-2 border-b">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">Select Report</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Choose from 16 verified reporting categories</span>
          </div>

          <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
            {REPORT_CATEGORIES.map((cat, catIdx) => (
              <div key={catIdx} className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 block">
                  {cat.group}
                </span>
                <div className="space-y-0.5">
                  {cat.reports.map(rep => (
                    <button
                      key={rep.id}
                      onClick={() => setSelectedReportId(rep.id)}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                        selectedReportId === rep.id
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-700 hover:bg-white hover:text-indigo-600"
                      }`}
                    >
                      <span className="truncate">{rep.label}</span>
                      {selectedReportId === rep.id && <span className="text-xs">›</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Filters & Output Table */}
        <div className="lg:col-span-3 space-y-4">
          {/* Active Report Header Card */}
          <div className="p-4 bg-white border rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900">{activeReportMeta.label}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{activeReportMeta.desc}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg">
                Period: {month} {year}
              </span>
              <span className="px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-lg">
                {records.length} record(s)
              </span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-3.5 bg-slate-50 border rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full border rounded-lg px-2.5 py-1.5 bg-white font-bold text-slate-700 shadow-2xs"
              >
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full border rounded-lg px-2.5 py-1.5 bg-white font-bold text-slate-700 shadow-2xs"
              >
                {["2024", "2025", "2026", "2027"].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Department</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full border rounded-lg px-2.5 py-1.5 bg-white font-semibold text-slate-700 shadow-2xs"
              >
                <option value="">All Departments</option>
                {departments.map(d => (
                  <option key={d.id || d.departmentName} value={d.departmentName || d.name}>
                    {d.departmentName || d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Employee</label>
              <select
                value={selectedEmp}
                onChange={(e) => setSelectedEmp(e.target.value)}
                className="w-full border rounded-lg px-2.5 py-1.5 bg-white font-semibold text-slate-700 shadow-2xs"
              >
                <option value="">All Employees</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.employeeName || `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.employeeCode}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional KPI Summary if provided by report */}
          {reportResult?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(reportResult.summary).map(([key, val]) => (
                <div key={key} className="p-3 border rounded-xl bg-white shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block truncate">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <span className="text-lg font-black text-slate-900 mt-1 block">
                    {typeof val === "number" && !key.toLowerCase().includes("count")
                      ? `₹${val.toLocaleString("en-IN")}`
                      : val}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Table Container */}
          {loading ? (
            <div className="p-16 text-center text-xs text-slate-400 border rounded-2xl bg-white">
              Loading report dataset from database...
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs bg-white">
              {/* Dynamic Table Renderer based on selectedReportId */}
              {renderReportTable(selectedReportId, records)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper renderer for each of the 16 report types
function renderReportTable(type, records) {
  if (!records || records.length === 0) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        No records found matching current criteria. Try adjusting the period or filters.
      </div>
    );
  }

  switch (type) {
    case "monthly_summary":
    case "payroll":
      return (
        <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Employee</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Department</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Paid / LOP</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Gross Salary</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Total Deductions</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Net Salary</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Employer PF/ESI</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Total CTC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((r, i) => (
              <tr key={r.id || i} className="hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <span className="font-bold text-slate-900 block">{r.employee?.employeeName || "Employee"}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{r.employee?.employeeCode}</span>
                </td>
                <td className="px-4 py-3 text-slate-600">{r.employee?.department || "--"}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-700">{r.paidDays || 30} / {r.lopDays || 0}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">₹{Number(r.grossSalary || 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-right font-semibold text-red-600">₹{Number(r.totalDeductions || 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-right font-black text-indigo-700">₹{Number(r.netSalary || 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-700">₹{(Number(r.employerPf || 0) + Number(r.employerEsi || 0)).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-right font-bold text-emerald-700">₹{Number(r.totalCtc || 0).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    case "salary_register":
    case "earnings_deductions":
      return (
        <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-3 font-bold text-slate-500 uppercase">Employee</th>
              <th className="px-3 py-3 font-bold text-slate-500 uppercase text-right">Basic</th>
              <th className="px-3 py-3 font-bold text-slate-500 uppercase text-right">HRA</th>
              <th className="px-3 py-3 font-bold text-slate-500 uppercase text-right">Gross</th>
              <th className="px-3 py-3 font-bold text-slate-500 uppercase text-right">PF (12%)</th>
              <th className="px-3 py-3 font-bold text-slate-500 uppercase text-right">ESI (0.75%)</th>
              <th className="px-3 py-3 font-bold text-slate-500 uppercase text-right">PT</th>
              <th className="px-3 py-3 font-bold text-slate-500 uppercase text-right">TDS</th>
              <th className="px-3 py-3 font-bold text-slate-500 uppercase text-right">Loan EMI</th>
              <th className="px-3 py-3 font-bold text-slate-500 uppercase text-right">Total Ded.</th>
              <th className="px-3 py-3 font-bold text-slate-500 uppercase text-right">Net Pay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
            {records.map((r, i) => (
              <tr key={r.id || i} className="hover:bg-slate-50/60 font-sans">
                <td className="px-3 py-2.5 font-bold text-slate-900 font-sans">
                  {r.employee?.employeeName || "Employee"}
                  <span className="block text-[10px] text-slate-400 font-mono">{r.employee?.employeeCode}</span>
                </td>
                <td className="px-3 py-2.5 text-right font-mono">₹{Number(r.basicSalary || 0).toLocaleString("en-IN")}</td>
                <td className="px-3 py-2.5 text-right font-mono">₹{Number(r.hra || 0).toLocaleString("en-IN")}</td>
                <td className="px-3 py-2.5 text-right font-bold text-slate-900 font-mono">₹{Number(r.grossSalary || 0).toLocaleString("en-IN")}</td>
                <td className="px-3 py-2.5 text-right text-red-600 font-mono">₹{Number(r.pf || 0).toLocaleString("en-IN")}</td>
                <td className="px-3 py-2.5 text-right text-red-600 font-mono">₹{Number(r.esi || 0).toLocaleString("en-IN")}</td>
                <td className="px-3 py-2.5 text-right text-red-600 font-mono">₹{Number(r.professionalTax || 0).toLocaleString("en-IN")}</td>
                <td className="px-3 py-2.5 text-right text-red-600 font-mono">₹{Number(r.tds || 0).toLocaleString("en-IN")}</td>
                <td className="px-3 py-2.5 text-right text-amber-600 font-mono">₹{Number(r.loanDeduction || 0).toLocaleString("en-IN")}</td>
                <td className="px-3 py-2.5 text-right font-bold text-red-700 font-mono">₹{Number(r.totalDeductions || 0).toLocaleString("en-IN")}</td>
                <td className="px-3 py-2.5 text-right font-black text-indigo-700 font-mono">₹{Number(r.netSalary || 0).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    case "department_cost":
      return (
        <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Department</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase text-center">Headcount</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Gross Cost</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Total Deductions</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Net Payout</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Employer Burden</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Total Department CTC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 font-bold text-slate-900">{r.department}</td>
                <td className="px-4 py-3 text-center font-bold text-slate-700">{r.headcount}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">₹{Number(r.grossCost || 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-right font-semibold text-red-600">₹{Number(r.totalDeductions || 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-right font-black text-indigo-700">₹{Number(r.netPayout || 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-right font-semibold text-amber-700">₹{Number(r.employerCost || 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-right font-black text-emerald-700">₹{Number(r.totalCtc || 0).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    case "attendance_lop":
      return (
        <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Employee</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Department</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Total Days in Month</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Loss of Pay (LOP)</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Paid Days</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Proration Ratio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((r, i) => {
              const total = r.workingDays || 30;
              const lop = r.lopDays || 0;
              const paid = r.paidDays || 30;
              const ratio = total > 0 ? ((paid / total) * 100).toFixed(1) : "100.0";
              return (
                <tr key={r.id || i} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-900 block">{r.employee?.employeeName || "Employee"}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{r.employee?.employeeCode}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.employee?.department || "--"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-700">{total}</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">{lop}</td>
                  <td className="px-4 py-3 text-right font-black text-emerald-700">{paid}</td>
                  <td className="px-4 py-3 text-right font-mono text-indigo-700 font-bold">{ratio}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );

    case "payslip_status":
    case "payslip":
      return (
        <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Employee</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Payslip Number</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Net Salary</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Generated On</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Payment Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((s, i) => (
              <tr key={s.id || i} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 font-bold text-slate-900">
                  {s.employee?.employeeName || "Employee"}
                  <span className="block text-[10px] text-slate-400 font-mono">{s.employee?.employeeCode}</span>
                </td>
                <td className="px-4 py-3 font-mono font-semibold text-indigo-700">{s.payslipNumber || `PS-${s.id}`}</td>
                <td className="px-4 py-3 text-right font-black text-slate-900">₹{Number(s.netSalary || 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-slate-600">{s.created_at ? new Date(s.created_at).toLocaleDateString() : "--"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    s.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {s.paymentStatus || "Processed"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    case "bank_payment_report":
      return (
        <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Employee</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase font-mono">Bank Account No</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase font-mono">IFSC Code</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Net Payout</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Payment Mode</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((b, i) => (
              <tr key={b.id || i} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 font-bold text-slate-900">
                  {b.employeeName}
                  <span className="block text-[10px] text-slate-400 font-mono">{b.employeeCode}</span>
                </td>
                <td className="px-4 py-3 font-mono text-slate-800 font-semibold">{b.bankAccount || "--"}</td>
                <td className="px-4 py-3 font-mono text-slate-800 font-semibold">{b.ifscCode || "--"}</td>
                <td className="px-4 py-3 text-right font-black text-indigo-700">₹{Number(b.netSalary || 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-slate-600">{b.paymentMode || "NEFT / RTGS"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    b.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                  }`}>
                    {b.paymentStatus || "Pending"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    case "outstanding_loans":
      return (
        <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Employee</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Loan Type</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Approved Principal</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Repaid So Far</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Outstanding Balance</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Monthly EMI</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((l, i) => (
              <tr key={l.id || i} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 font-bold text-slate-900">
                  {l.employee?.employeeName || "Employee"}
                  <span className="block text-[10px] text-slate-400 font-mono">{l.employee?.employeeCode}</span>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-700">{l.loanType}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">₹{Number(l.approvedAmount || 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-right font-semibold text-emerald-600">₹{Number(l.totalRepaid || 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-right font-black text-amber-700">₹{Number(l.outstandingBalance || 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-right font-bold text-slate-900">₹{Number(l.monthlyEmi || 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">{l.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    case "exceptions_report":
      return (
        <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Employee</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Department</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Issue Type</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Severity</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Compliance Recommendation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((ex, i) => (
              <tr key={i} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 font-bold text-slate-900">
                  {ex.employeeName}
                  <span className="block text-[10px] text-slate-400 font-mono">{ex.employeeCode}</span>
                </td>
                <td className="px-4 py-3 text-slate-600">{ex.department || "--"}</td>
                <td className="px-4 py-3 font-bold text-slate-800">{ex.issueType}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    ex.severity === "High" ? "bg-red-100 text-red-800" :
                    ex.severity === "Medium" ? "bg-amber-100 text-amber-800" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {ex.severity}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{ex.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    case "audit_report":
      return (
        <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Timestamp</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">User / Actor</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Role</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Module</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Action</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Record Ref</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((log, i) => (
              <tr key={log.id || i} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                  {log.created_at ? new Date(log.created_at).toLocaleString() : "--"}
                </td>
                <td className="px-4 py-3 font-bold text-slate-900">{log.username || "System"}</td>
                <td className="px-4 py-3 text-slate-600 font-semibold">{log.roleName || "--"}</td>
                <td className="px-4 py-3 font-bold text-indigo-700">{log.moduleName}</td>
                <td className="px-4 py-3 font-semibold text-slate-800">{log.actionType}</td>
                <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">{log.recordId || "--"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    case "employer_ctc":
      return (
        <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Employee</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Department</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Monthly Gross</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Employer PF</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Employer ESI</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Monthly CTC</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase text-right">Projected Annual CTC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((c, i) => (
              <tr key={c.id || i} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 font-bold text-slate-900">
                  {c.employeeName}
                  <span className="block text-[10px] text-slate-400 font-mono">{c.employeeCode}</span>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.department || "--"}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">₹{Number(c.grossSalary || 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-right font-semibold text-amber-700">₹{Number(c.employerPf || 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-right font-semibold text-amber-700">₹{Number(c.employerEsi || 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-right font-black text-indigo-700">₹{Number(c.monthlyCtc || 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-right font-black text-emerald-700">₹{Number(c.annualCtc || 0).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    default:
      // Generic Fallback Table for remaining reports (e.g. pf_report, tds_report, etc.)
      const first = records[0] || {};
      const keys = Object.keys(first).filter(k => k !== "toJSON" && typeof first[k] !== "object");
      return (
        <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
          <thead className="bg-slate-50">
            <tr>
              {keys.map(k => (
                <th key={k} className="px-4 py-3 font-bold text-slate-500 uppercase">
                  {k.replace(/([A-Z])/g, " $1").trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/60">
                {keys.map(k => (
                  <td key={k} className="px-4 py-3 text-slate-700">
                    {typeof row[k] === "number" ? `₹${row[k].toLocaleString("en-IN")}` : String(row[k] ?? "--")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
  }
}

export default PayrollReports;