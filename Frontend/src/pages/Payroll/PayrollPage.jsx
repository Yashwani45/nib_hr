// Frontend/src/pages/Payroll/PayrollPage.jsx
import React, { useMemo } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  BanknotesIcon,
  CalculatorIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  ClockIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";

// Finance & Compliance Components
import PayrollDashboard from "../../components/FinanceCompliance/PayrollDashboard";
import SalaryStructure from "../../components/FinanceCompliance/SalaryStructure";
import PayrollProcess from "../../components/FinanceCompliance/PayrollProcess";
import PayslipManagement from "../../components/FinanceCompliance/PayslipManagement";
import LoanManagement from "../../components/FinanceCompliance/LoanManagement";
import ESIManagement from "../../components/FinanceCompliance/ESIManagement";
import ProfessionalTax from "../../components/FinanceCompliance/ProfessionalTax";
import PayrollReports from "../../components/FinanceCompliance/PayrollReports";

export const PAYROLL_SUBSECTIONS = [
  { id: "dashboard", name: "Payroll Dashboard", path: "/payroll/dashboard", icon: ClockIcon, short: "Dashboard" },
  { id: "salary-structure", name: "Salary Structure", path: "/payroll/salary-structure", icon: CalculatorIcon, short: "Structure" },
  { id: "process", name: "Payroll Process", path: "/payroll/process", icon: BanknotesIcon, short: "Process" },
  { id: "payslips", name: "Payslips", path: "/payroll/payslips", icon: DocumentTextIcon, short: "Payslips" },
  { id: "loan-advance", name: "Loan & Advance", path: "/payroll/loan-advance", icon: CreditCardIcon, short: "Loans" },
  { id: "esi", name: "ESI Management", path: "/payroll/esi", icon: ShieldCheckIcon, short: "ESI" },
  { id: "pt", name: "Professional Tax (PT)", path: "/payroll/pt", icon: BuildingOffice2Icon, short: "PT" },
  { id: "reports", name: "Payroll Reports", path: "/payroll/reports", icon: ChartBarIcon, short: "Reports" }
];

export default function PayrollPage({ subpage }) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  // Resolve current active subsection ID
  const activeSubpageId = useMemo(() => {
    if (subpage) return subpage;
    if (params.subpage) return params.subpage;
    const path = location.pathname.toLowerCase();
    if (path.includes("salary-structure")) return "salary-structure";
    if (path.includes("process")) return "process";
    if (path.includes("payslip")) return "payslips";
    if (path.includes("loan")) return "loan-advance";
    if (path.includes("esi")) return "esi";
    if (path.includes("pt") || path.includes("professional-tax")) return "pt";
    if (path.includes("report")) return "reports";
    return "dashboard";
  }, [subpage, params.subpage, location.pathname]);

  const activeSubsection = useMemo(() => {
    return PAYROLL_SUBSECTIONS.find(s => s.id === activeSubpageId) || PAYROLL_SUBSECTIONS[0];
  }, [activeSubpageId]);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Breadcrumb & Title Bar */}
      <div className="bg-white border-b border-slate-200/90 shadow-2xs sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
              <Link to="/" className="hover:text-indigo-600 transition">TechnoVani HRMS</Link>
              <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
              <Link to="/payroll/dashboard" className="text-slate-700 hover:text-indigo-600 transition">Payroll</Link>
              <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-indigo-600 font-bold">{activeSubsection.name}</span>
            </div>

            {/* Status Pill */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                Official Finance & Compliance Suite
              </span>
            </div>
          </div>

          {/* Secondary Sub-navigation Tab Pills Bar */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-none">
            {PAYROLL_SUBSECTIONS.map((sub, index) => {
              const Icon = sub.icon;
              const isActive = sub.id === activeSubpageId;
              return (
                <button
                  key={sub.id}
                  onClick={() => navigate(sub.path)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                  <span>{index + 1}. {sub.short}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeSubpageId === "dashboard" && <PayrollDashboard />}
        {activeSubpageId === "salary-structure" && <SalaryStructure />}
        {activeSubpageId === "process" && <PayrollProcess />}
        {activeSubpageId === "payslips" && <PayslipManagement />}
        {activeSubpageId === "loan-advance" && <LoanManagement />}
        {activeSubpageId === "esi" && <ESIManagement />}
        {activeSubpageId === "pt" && <ProfessionalTax />}
        {activeSubpageId === "reports" && <PayrollReports />}
      </div>
    </div>
  );
}
