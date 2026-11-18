// Frontend/src/components/FinanceCompliance/PayrollDashboard.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BanknotesIcon,
  CalculatorIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  BuildingOffice2Icon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
  ReceiptPercentIcon
} from "@heroicons/react/24/outline";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { apiFetch } from "../../services/hrApi";

const PIE_COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const PayrollDashboard = ({ onRefreshData }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState([]);
  const [structuresCount, setStructuresCount] = useState(0);
  const [loans, setLoans] = useState([]);
  const [employeesCount, setEmployeesCount] = useState(0);
  const [esiSummary, setEsiSummary] = useState(null);
  const [ptSummary, setPtSummary] = useState(null);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [runsRes, structRes, loansRes, empRes, esiRes, ptRes] = await Promise.allSettled([
        apiFetch("/api/finance/runs"),
        apiFetch("/api/finance/salary-structures"),
        apiFetch("/api/finance/loans"),
        apiFetch("/api/table/employees"),
        apiFetch(`/api/finance/esi/report?month=${new Date().toLocaleString("en-US", { month: "long" })}&year=${new Date().getFullYear()}`),
        apiFetch(`/api/finance/professional-tax/report?month=${new Date().toLocaleString("en-US", { month: "long" })}&year=${new Date().getFullYear()}`)
      ]);

      if (runsRes.status === "fulfilled" && runsRes.value?.data) {
        setRuns(Array.isArray(runsRes.value.data) ? runsRes.value.data : []);
      }
      if (structRes.status === "fulfilled" && structRes.value?.data) {
        const total = structRes.value.data.total || (Array.isArray(structRes.value.data.records) ? structRes.value.data.records.length : (Array.isArray(structRes.value.data) ? structRes.value.data.length : 0));
        setStructuresCount(total);
      }
      if (loansRes.status === "fulfilled" && loansRes.value?.data) {
        setLoans(Array.isArray(loansRes.value.data) ? loansRes.value.data : []);
      }
      if (empRes.status === "fulfilled" && empRes.value?.data) {
        setEmployeesCount(Array.isArray(empRes.value.data) ? empRes.value.data.length : 0);
      }
      if (esiRes.status === "fulfilled" && esiRes.value?.data?.summary) {
        setEsiSummary(esiRes.value.data.summary);
      }
      if (ptRes.status === "fulfilled" && ptRes.value?.data?.summary) {
        setPtSummary(ptRes.value.data.summary);
      }
    } catch (e) {
      console.error("Payroll dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Latest active / recent run
  const latestRun = useMemo(() => {
    if (!runs || runs.length === 0) return null;
    return runs[0];
  }, [runs]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    let totalGross = 0;
    let totalNet = 0;
    let totalDeductions = 0;
    let totalEmployerCost = 0;
    let activeHeadcount = employeesCount || 0;

    if (latestRun) {
      totalGross = parseFloat(latestRun.totalGross || latestRun.grossSalary || 0);
      totalNet = parseFloat(latestRun.totalNet || latestRun.netSalary || 0);
      totalDeductions = parseFloat(latestRun.totalDeductions || 0);
      totalEmployerCost = parseFloat(latestRun.totalEmployerCost || latestRun.employerCost || (totalGross * 1.08));
      if (latestRun.headcount) activeHeadcount = latestRun.headcount;
    }

    // Active loans calculation
    let activeLoanCount = 0;
    let totalLoanOutstanding = 0;
    loans.forEach(loan => {
      const status = String(loan.status || "").toLowerCase();
      if (status === "active" || status === "approved" || status === "partially repaid") {
        activeLoanCount++;
        totalLoanOutstanding += parseFloat(loan.remainingAmount || loan.outstandingPrincipal || loan.approvedAmount || 0);
      }
    });

    return {
      totalGross,
      totalNet,
      totalDeductions,
      totalEmployerCost,
      activeHeadcount,
      activeLoanCount,
      totalLoanOutstanding
    };
  }, [latestRun, employeesCount, loans]);

  // Chart data: Monthly runs trend
  const trendData = useMemo(() => {
    if (!runs || runs.length === 0) {
      // Mock seasonal baseline for empty state
      return [
        { month: "May", gross: 580000, net: 490000, deductions: 90000 },
        { month: "Jun", gross: 610000, net: 515000, deductions: 95000 },
        { month: "Jul", gross: 630000, net: 532000, deductions: 98000 },
        { month: "Aug", gross: 650000, net: 549000, deductions: 101000 },
        { month: "Sep", gross: 680000, net: 574000, deductions: 106000 },
        { month: "Oct", gross: 710000, net: 599000, deductions: 111000 }
      ];
    }

    return runs.slice(0, 6).reverse().map(r => ({
      month: `${r.month?.slice(0, 3)} '${String(r.year || 26).slice(-2)}`,
      gross: Math.round(parseFloat(r.totalGross || 0)),
      net: Math.round(parseFloat(r.totalNet || 0)),
      deductions: Math.round(parseFloat(r.totalDeductions || 0))
    }));
  }, [runs]);

  // Breakdown donut chart data
  const breakdownData = useMemo(() => {
    const gross = metrics.totalGross || 600000;
    const basic = Math.round(gross * 0.5);
    const hra = Math.round(gross * 0.2);
    const allowances = Math.round(gross * 0.3);
    const pf = Math.round(basic * 0.12);
    const esi = Math.round(gross * 0.0075);
    const pt = 200 * (metrics.activeHeadcount || 10);

    return [
      { name: "Basic Salary", value: basic },
      { name: "HRA", value: hra },
      { name: "Allowances", value: allowances },
      { name: "Provident Fund (PF)", value: pf },
      { name: "ESI Contribution", value: esi },
      { name: "Professional Tax", value: pt }
    ];
  }, [metrics]);

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header Banner Strip */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="space-y-2 max-w-2xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-wide">
            <SparklesIcon className="w-4 h-4 text-cyan-400" />
            <span>Technovani Enterprise Payroll & Compliance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <span>Payroll Overview & Control Console</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
            Centralized hub for end-to-end salary processing, structured compensation formulas, statutory ESI & PT tracking, employee loans, and regulatory audit registers.
          </p>
        </div>

        {/* Quick Command Actions */}
        <div className="flex flex-wrap items-center gap-3 z-10">
          <button
            onClick={() => navigate("/payroll/process")}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-600/30 transition cursor-pointer active:scale-95"
          >
            <BanknotesIcon className="w-4 h-4" />
            <span>Process Payroll</span>
          </button>

          <button
            onClick={() => navigate("/payroll/salary-structure")}
            className="flex items-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider rounded-2xl border border-slate-700 transition cursor-pointer"
          >
            <CalculatorIcon className="w-4 h-4 text-indigo-400" />
            <span>Salary Structures</span>
          </button>

          <button
            onClick={loadDashboardData}
            className="p-3 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl border border-slate-700 transition cursor-pointer"
            title="Refresh Data"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Top KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Gross */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Gross Salary</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <BanknotesIcon className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900">
              ₹{metrics.totalGross > 0 ? metrics.totalGross.toLocaleString("en-IN") : "0"}
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
              Across {metrics.activeHeadcount} active personnel
            </p>
          </div>
        </div>

        {/* Metric 2: Net Payout */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">Net Take-Home Payout</span>
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <CreditCardIcon className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-700">
              ₹{metrics.totalNet > 0 ? metrics.totalNet.toLocaleString("en-IN") : "0"}
            </h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              Net disbursement liability
            </p>
          </div>
        </div>

        {/* Metric 3: Total Deductions */}
        <div className="bg-white p-5 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-xs flex flex-col justify-between hover:border-amber-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-600">Statutory & Other Deductions</span>
            <span className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <ShieldCheckIcon className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-amber-700">
              ₹{metrics.totalDeductions > 0 ? metrics.totalDeductions.toLocaleString("en-IN") : "0"}
            </h3>
            <p className="text-[11px] text-amber-600 font-semibold mt-0.5">
              PF, ESI, PT, TDS & Loans
            </p>
          </div>
        </div>

        {/* Metric 4: Total Employer Cost / CTC */}
        <div className="bg-white p-5 rounded-2xl border border-blue-100 bg-blue-50/20 shadow-xs flex flex-col justify-between hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-600">Employer CTC Burden</span>
            <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <BuildingOffice2Icon className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-blue-800">
              ₹{metrics.totalEmployerCost > 0 ? metrics.totalEmployerCost.toLocaleString("en-IN") : "0"}
            </h3>
            <p className="text-[11px] text-blue-600 font-semibold mt-0.5">
              Includes employer PF & ESI contributions
            </p>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Current Run Status + Active Loans Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card A: Current / Latest Payroll Run Status */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                <ClockIcon className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Current Payroll Cycle: {latestRun ? `${latestRun.month} ${latestRun.year}` : `${new Date().toLocaleString("en-US", { month: "long" })} ${new Date().getFullYear()}`}
                </h3>
                <p className="text-xs text-slate-400 font-medium">Lifecycle state and workflow approvals</p>
              </div>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
              latestRun?.status === "Paid"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : latestRun?.status === "Locked"
                ? "bg-purple-50 text-purple-700 border-purple-200"
                : latestRun?.status === "Approved"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              {latestRun?.status || "Draft"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[10px] font-black uppercase text-slate-400">Payroll Cycle</span>
              <p className="font-black text-slate-800 text-sm mt-0.5">{latestRun ? `${latestRun.month} ${latestRun.year}` : "Current"}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[10px] font-black uppercase text-slate-400">Headcount</span>
              <p className="font-black text-slate-800 text-sm mt-0.5">{latestRun?.headcount || employeesCount || 0}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[10px] font-black uppercase text-slate-400">Payment Status</span>
              <p className="font-black text-slate-800 text-sm mt-0.5">{latestRun?.paymentStatus || "Pending"}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[10px] font-black uppercase text-slate-400">Structures Configured</span>
              <p className="font-black text-indigo-600 text-sm mt-0.5">{structuresCount}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-500 font-medium">
              💡 Need to calculate attendance & deductions? Launch the controlled monthly calculation engine.
            </div>
            <Link
              to="/payroll/process"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
            >
              <span>Go to Payroll Process</span>
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Card B: Loans & Advances Quick Snapshot */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <CreditCardIcon className="w-5 h-5" />
              </span>
              <div>
                <h4 className="font-black text-slate-900 text-sm">Loans & Advances</h4>
                <p className="text-[10px] text-slate-400 font-medium">Payroll deduction integration</p>
              </div>
            </div>
            <Link
              to="/payroll/loan-advance"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              Manage &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Active Loans / Advances</span>
              <span className="font-black text-slate-800">{metrics.activeLoanCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Total Outstanding Principal</span>
              <span className="font-black text-rose-600">
                ₹{metrics.totalLoanOutstanding > 0 ? metrics.totalLoanOutstanding.toLocaleString("en-IN") : "0"}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full"
                style={{ width: `${Math.min(100, Math.max(15, (metrics.activeLoanCount * 18)))}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Approved loan EMIs are automatically included in eligible monthly payroll deductions.
            </p>
          </div>

          <Link
            to="/payroll/loan-advance"
            className="w-full py-2.5 text-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition block"
          >
            Review Loan Ledger
          </Link>
        </div>
      </div>

      {/* 4. Visual Analytics: Trend AreaChart + Breakdown Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <ArrowTrendingUpIcon className="w-4 h-4 text-indigo-600" />
                <span>Monthly Payroll Expense Trends</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">Gross vs Net take-home trajectory</p>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              Past 6 Cycles
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="grossGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="netGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value, name) => [`₹${Number(value).toLocaleString("en-IN")}`, name === "gross" ? "Gross" : name === "net" ? "Net" : "Deductions"]}
                  contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="gross" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#grossGrad)" name="Gross" />
                <Area type="monotone" dataKey="net" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#netGrad)" name="Net" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Donut Chart */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <ReceiptPercentIcon className="w-4 h-4 text-emerald-600" />
              <span>Components Distribution</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium">Earnings vs statutory deductions</p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {breakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`₹${Number(value).toLocaleString("en-IN")}`, name]}
                  contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "12px", color: "#fff", fontSize: "11px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600">
            {breakdownData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                <span className="truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>


    </div>
  );
};

export default PayrollDashboard;
