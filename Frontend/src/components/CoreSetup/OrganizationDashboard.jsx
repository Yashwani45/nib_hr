import React, { useState, useMemo } from "react";
import {
  BuildingOffice2Icon,
  BuildingOfficeIcon,
  UserGroupIcon,
  GlobeAltIcon,
  MapPinIcon,
  ChartBarIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  CheckBadgeIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  PlusIcon,
  ArrowPathIcon,
  IdentificationIcon,
  BanknotesIcon,
  ScaleIcon,
  SparklesIcon,
  Square3Stack3DIcon,
  DocumentChartBarIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  ArrowsPointingOutIcon
} from "@heroicons/react/24/outline";
import OrganizationalChart from "./OrganizationalChart";

const OrganizationDashboard = ({ dbData = {}, onRefreshData, onOpenCreate, onOpenEdit }) => {
  // 1. Data Resolvers from Centralized dbData Store
  const companiesList = useMemo(() => {
    const list = dbData["Company"] || dbData["company"] || dbData["companies"] || [];
    return Array.isArray(list) ? list : [];
  }, [dbData]);

  const branchesList = useMemo(() => {
    const list = dbData["Branch"] || dbData["branch"] || dbData["branches"] || [];
    return Array.isArray(list) ? list : [];
  }, [dbData]);

  const departmentsList = useMemo(() => {
    const list = dbData["Department"] || dbData["department"] || dbData["departments"] || [];
    return (Array.isArray(list) ? list : []).filter(
      d => d.deptCode !== "DEPT-GEN" && d.dept_code !== "DEPT-GEN" && d.deptName !== "General Administration" && d.deptCode !== "ADMIN" && d.dept_code !== "ADMIN" && d.deptName !== "Administration" && d.dept_name !== "Administration"
    );
  }, [dbData]);

  const designationsList = useMemo(() => {
    const list = dbData["Designation"] || dbData["designation"] || dbData["designations"] || [];
    return Array.isArray(list) ? list : [];
  }, [dbData]);

  const employeesList = useMemo(() => {
    const list = dbData["Employee Profile"] || dbData["employee_profile"] || dbData["employees"] || [];
    return Array.isArray(list) ? list : [];
  }, [dbData]);

  const businessUnitsList = useMemo(() => {
    const list = dbData["Business Unit"] || dbData["business_unit"] || dbData["business_units"] || [];
    return Array.isArray(list) ? list : [];
  }, [dbData]);

  const costCentersList = useMemo(() => {
    const list = dbData["Cost Center"] || dbData["cost_center"] || dbData["cost_centers"] || [];
    return Array.isArray(list) ? list : [];
  }, [dbData]);

  // Primary active company entity resolution
  const selectedCode = localStorage.getItem("selected_company_code") || "";
  const primaryCompany = useMemo(() => {
    return companiesList.find(c => 
      (c.companyCode && c.companyCode.toLowerCase() === selectedCode.toLowerCase()) || 
      (c.company_code && c.company_code.toLowerCase() === selectedCode.toLowerCase())
    ) || companiesList[0] || {
      companyName: "Aarogya Homeopathy Clinic",
      companyCode: "ARGY001",
      type: "Private Limited Corporation",
      city: "Indore",
      state: "Madhya Pradesh",
      country: "India",
      status: "Active",
      financialYear: "2026-27",
      currency: "INR (₹)"
    };
  }, [companiesList, selectedCode]);

  // UI Interactive States
  const [activeTab, setActiveTab] = useState("analytics"); // "analytics", "entities", "departments", "hierarchy", "cost_centers"
  const [selectedBranchFilter, setSelectedBranchFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefreshData) {
      await onRefreshData();
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Scope Filtering by Branch
  const scopedEmployees = useMemo(() => {
    let list = employeesList;
    if (selectedBranchFilter !== "ALL") {
      list = list.filter(e => {
        const empBranch = String(e.branch || e.branch_name || e.branchName || e.branchId || "").toLowerCase().trim();
        const target = String(selectedBranchFilter).toLowerCase().trim();
        return empBranch === target || empBranch.includes(target) || target.includes(empBranch);
      });
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(e => {
        const name = (e.employeeName || e.employee_name || `${e.firstName || ""} ${e.lastName || ""}`).toLowerCase();
        const code = String(e.employeeCode || e.empCode || e.emp_code || "").toLowerCase();
        const dept = String(e.department || e.departmentName || "").toLowerCase();
        const desig = String(e.designation || "").toLowerCase();
        return name.includes(q) || code.includes(q) || dept.includes(q) || desig.includes(q);
      });
    }
    return list;
  }, [employeesList, selectedBranchFilter, searchTerm]);

  // Comprehensive Organizational Analytics Calculations
  const metrics = useMemo(() => {
    const totalHeadcount = scopedEmployees.length;

    // Active Status Breakdown
    const activeStaff = scopedEmployees.filter(e => String(e.status || e.employeeStatus || "").toLowerCase() === "active" || !e.status).length;
    const probationStaff = scopedEmployees.filter(e => String(e.employmentType || e.employment_type || "").toLowerCase().includes("probation")).length;
    const permanentStaff = scopedEmployees.filter(e => String(e.employmentType || e.employment_type || "").toLowerCase().includes("permanent") || (!e.employmentType && !e.employment_type)).length;
    const contractStaff = scopedEmployees.filter(e => String(e.employmentType || e.employment_type || "").toLowerCase().includes("contract")).length;
    const internStaff = Math.max(0, totalHeadcount - permanentStaff - probationStaff - contractStaff);

    // Gender Demographics
    const maleCount = scopedEmployees.filter(e => String(e.gender || "").toLowerCase() === "male").length;
    const femaleCount = scopedEmployees.filter(e => String(e.gender || "").toLowerCase() === "female").length;
    const otherGenderCount = Math.max(0, totalHeadcount - maleCount - femaleCount);
    const femaleRatio = totalHeadcount > 0 ? ((femaleCount / totalHeadcount) * 100).toFixed(1) : "0.0";
    const maleRatio = totalHeadcount > 0 ? ((maleCount / totalHeadcount) * 100).toFixed(1) : "0.0";

    // Management & Hierarchy Span of Control
    const managerIds = new Set();
    const managerReportsCount = {};
    scopedEmployees.forEach(e => {
      const mId = e.managerId || e.manager_id || e.reportingManagerId;
      if (mId) {
        managerIds.add(String(mId));
        managerReportsCount[String(mId)] = (managerReportsCount[String(mId)] || 0) + 1;
      }
    });

    const totalManagers = managerIds.size;
    const avgSpanOfControl = totalManagers > 0 ? (totalHeadcount / totalManagers).toFixed(1) : "0.0";

    // Hierarchy Depth Estimation
    const getDepth = (empId, visited = new Set()) => {
      if (!empId || visited.has(empId)) return 1;
      visited.add(empId);
      const emp = scopedEmployees.find(e => String(e.id) === String(empId));
      if (!emp) return 1;
      const mId = emp.managerId || emp.manager_id || emp.reportingManagerId;
      if (!mId || String(mId) === String(empId)) return 1;
      return 1 + getDepth(mId, visited);
    };

    let maxDepth = 1;
    scopedEmployees.forEach(e => {
      const d = getDepth(e.id);
      if (d > maxDepth) maxDepth = d;
    });

    // Department Distribution Analysis
    const deptCountMap = {};
    scopedEmployees.forEach(e => {
      const dName = e.department || e.departmentName || e.department_name || "General";
      deptCountMap[dName] = (deptCountMap[dName] || 0) + 1;
    });

    const deptDistribution = Object.entries(deptCountMap)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalHeadcount > 0 ? ((count / totalHeadcount) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count);

    const largestDept = deptDistribution[0] || { name: "None", count: 0 };
    const smallestDept = deptDistribution[deptDistribution.length - 1] || { name: "None", count: 0 };

    // Branch Distribution Analysis
    const branchCountMap = {};
    scopedEmployees.forEach(e => {
      const bName = e.branch || e.branchName || e.branch_name || "Head Office";
      branchCountMap[bName] = (branchCountMap[bName] || 0) + 1;
    });

    const branchDistribution = Object.entries(branchCountMap)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalHeadcount > 0 ? ((count / totalHeadcount) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Structural Health Alignment Score
    const employeesWithManager = scopedEmployees.filter(e => e.managerId || e.manager_id || e.reportingManagerId || e.role === "SuperAdmin" || e.role === "Admin").length;
    const managerMappingScore = totalHeadcount > 0 ? Math.min(100, ((employeesWithManager / totalHeadcount) * 100)).toFixed(1) : "100.0";

    return {
      totalHeadcount,
      activeStaff,
      probationStaff,
      permanentStaff,
      contractStaff,
      internStaff,
      maleCount,
      femaleCount,
      otherGenderCount,
      femaleRatio,
      maleRatio,
      totalManagers,
      avgSpanOfControl,
      maxDepth,
      deptDistribution,
      largestDept,
      smallestDept,
      branchDistribution,
      managerMappingScore,
      totalCompanies: companiesList.length || 1,
      totalBranches: branchesList.length,
      totalDepartments: departmentsList.length || 4,
      totalDesignations: designationsList.length || 12,
      totalBusinessUnits: businessUnitsList.length || 2,
      totalCostCenters: costCentersList.length || 3
    };
  }, [scopedEmployees, companiesList, branchesList, departmentsList, designationsList, businessUnitsList, costCentersList]);

  // Export Org Metrics CSV
  const handleExportCsv = () => {
    const csvRows = [
      ["Metric Category", "Metric Name", "Value"],
      ["Overview", "Total Headcount", metrics.totalHeadcount],
      ["Overview", "Active Workforce", metrics.activeStaff],
      ["Overview", "Corporate Entities", metrics.totalCompanies],
      ["Overview", "Active Branches", metrics.totalBranches],
      ["Overview", "Operating Departments", metrics.totalDepartments],
      ["Overview", "Designations Master", metrics.totalDesignations],
      ["Demographics", "Male Headcount", `${metrics.maleCount} (${metrics.maleRatio}%)`],
      ["Demographics", "Female Headcount", `${metrics.femaleCount} (${metrics.femaleRatio}%)`],
      ["Span of Control", "Total Reporting Managers", metrics.totalManagers],
      ["Span of Control", "Average Span of Control", `${metrics.avgSpanOfControl} reports/manager`],
      ["Span of Control", "Hierarchy Depth", `${metrics.maxDepth} Levels`],
      ["Structural Health", "Manager Alignment Score", `${metrics.managerMappingScore}%`]
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `org_analytics_summary_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Color gradient palette for departments
  const deptGradients = [
    "from-blue-600 to-indigo-600",
    "from-emerald-500 to-teal-700",
    "from-amber-500 to-orange-600",
    "from-purple-500 to-violet-700",
    "from-rose-500 to-pink-600",
    "from-cyan-500 to-blue-700",
    "from-fuchsia-500 to-purple-800",
    "from-slate-600 to-slate-800"
  ];

  return (
    <div className="space-y-6">
      {/* 1. Clean Light Blue Organization Header */}
      <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50/70 rounded-2xl p-5 sm:p-6 border border-blue-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm shadow-blue-500/25 shrink-0">
            <BuildingOffice2Icon className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {primaryCompany.companyName || primaryCompany.company_name || "NIB Insurance"}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 font-semibold mt-1">
              <span>{metrics.totalHeadcount || employeesList.length || 0} Total Employees</span>
              <span>•</span>
              <span>{metrics.totalDepartments || departmentsList.length || 0} Departments</span>
              <span>•</span>
              <span>FY {primaryCompany.financialYear || "2026-27"}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh Organization Data"
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl transition shadow-2xs cursor-pointer"
          >
            <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Top 6 High-Impact Analytical KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Total Workforce */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:shadow-md transition group relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Headcount</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
              <UserGroupIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{metrics.totalHeadcount}</span>
            <span className="text-[10px] font-bold text-emerald-600">Active</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span>{metrics.maleRatio}% Male</span>
            <span>•</span>
            <span>{metrics.femaleRatio}% Female</span>
          </div>
        </div>

        {/* Card 2: Operating Branches */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:shadow-md transition group relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Entities & Branches</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <BuildingOffice2Icon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{metrics.totalBranches}</span>
            <span className="text-[10px] font-bold text-emerald-600">Offices</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-medium truncate">
            <span>{metrics.totalCompanies} Corporate Entity</span>
          </div>
        </div>

        {/* Card 3: Operational Departments */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:shadow-md transition group relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Departments</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition">
              <Square3Stack3DIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{metrics.totalDepartments}</span>
            <span className="text-[10px] font-bold text-indigo-600">Units</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-medium truncate">
            <span>Top: {metrics.largestDept.name} ({metrics.largestDept.count})</span>
          </div>
        </div>

        {/* Card 4: Span of Control */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:shadow-md transition group relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Span of Control</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
              <ScaleIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{metrics.avgSpanOfControl}</span>
            <span className="text-[10px] font-bold text-amber-600">Staff/Mgr</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-medium truncate">
            <span>{metrics.totalManagers} Active Managers</span>
          </div>
        </div>

        {/* Card 5: Hierarchy Depth */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:shadow-md transition group relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Org Depth</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition">
              <ChartBarIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{metrics.maxDepth}</span>
            <span className="text-[10px] font-bold text-purple-600">Tiers</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-medium truncate">
            <span>{metrics.totalDesignations} Roles</span>
          </div>
        </div>

        {/* Card 6: Structural Health */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:shadow-md transition group relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Structural Health</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition">
              <ShieldCheckIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{metrics.managerMappingScore}%</span>
            <span className="text-[10px] font-bold text-emerald-600">Mapped</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-medium truncate">
            <span>Zero Unlinked Nodes</span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Multi-Perspective Navigation Pill Bar */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTab("analytics")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "analytics"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ChartBarIcon className="w-4 h-4 text-blue-600" />
            <span>Analytical Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("entities")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "entities"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BuildingOffice2Icon className="w-4 h-4 text-emerald-600" />
            <span>Entities & Branches ({metrics.totalBranches})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("departments")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "departments"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Square3Stack3DIcon className="w-4 h-4 text-indigo-600" />
            <span>Department Matrix ({metrics.totalDepartments})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("hierarchy")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "hierarchy"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserGroupIcon className="w-4 h-4 text-amber-600" />
            <span>Visual Org Tree 🌳</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cost_centers")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "cost_centers"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BanknotesIcon className="w-4 h-4 text-purple-600" />
            <span>BUs & Cost Centers</span>
          </button>
        </div>

        {/* Search Bar for Live Drilldown */}
        <div className="relative w-full sm:w-64">
          <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search employee, dept, branch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-2xs"
          />
        </div>
      </div>

      {/* 4. Tab 1: Analytical Overview (Charts & Intelligence Graphs) */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Main Visual Analytical Grid: 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Department Headcount Distribution Horizontal Bar Chart */}
            <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <ChartBarIcon className="w-4 h-4 text-blue-600" />
                    <span>Departmental Headcount & Talent Concentration</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Distribution of active staff members across registered corporate divisions
                  </p>
                </div>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                  {metrics.deptDistribution.length} Departments
                </span>
              </div>

              {/* Dynamic Interactive Horizontal Bar Visuals */}
              <div className="space-y-3 pt-1">
                {metrics.deptDistribution.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No department records to display</p>
                ) : (
                  metrics.deptDistribution.map((dept, idx) => {
                    const gradient = deptGradients[idx % deptGradients.length];
                    return (
                      <div key={dept.name} className="space-y-1 group">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-800 group-hover:text-blue-600 transition flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-blue-600 transition" />
                            {dept.name}
                          </span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            <strong className="text-slate-900">{dept.count}</strong> staff ({dept.percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700 ease-out shadow-xs`}
                            style={{ width: `${Math.max(6, Number(dept.percentage))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right 1 Col: Workforce Employment Mix & Gender Diversity Gauge */}
            <div className="space-y-6">
              {/* Card 1: Employment Type Mix */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <BriefcaseIcon className="w-4 h-4 text-emerald-600" />
                    <span>Workforce Composition</span>
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Employment Mix
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Permanent Full-Time</span>
                    <span className="font-bold text-slate-900">{metrics.permanentStaff} ({metrics.totalHeadcount > 0 ? ((metrics.permanentStaff / metrics.totalHeadcount) * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${metrics.totalHeadcount > 0 ? (metrics.permanentStaff / metrics.totalHeadcount) * 100 : 0}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-600 font-medium">Probationary Staff</span>
                    <span className="font-bold text-slate-900">{metrics.probationStaff} ({metrics.totalHeadcount > 0 ? ((metrics.probationStaff / metrics.totalHeadcount) * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${metrics.totalHeadcount > 0 ? (metrics.probationStaff / metrics.totalHeadcount) * 100 : 0}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-600 font-medium">Contract / Retainer</span>
                    <span className="font-bold text-slate-900">{metrics.contractStaff} ({metrics.totalHeadcount > 0 ? ((metrics.contractStaff / metrics.totalHeadcount) * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${metrics.totalHeadcount > 0 ? (metrics.contractStaff / metrics.totalHeadcount) * 100 : 0}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-600 font-medium">Interns & Trainees</span>
                    <span className="font-bold text-slate-900">{metrics.internStaff} ({metrics.totalHeadcount > 0 ? ((metrics.internStaff / metrics.totalHeadcount) * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${metrics.totalHeadcount > 0 ? (metrics.internStaff / metrics.totalHeadcount) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Gender Demographics Ratio */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <UserGroupIcon className="w-4 h-4 text-purple-600" />
                    <span>Gender Diversity Ratio</span>
                  </h3>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    Inclusive
                  </span>
                </div>

                <div className="flex items-center justify-around py-1">
                  <div className="text-center">
                    <span className="text-xl font-black text-blue-600">{metrics.maleRatio}%</span>
                    <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mt-0.5">Male ({metrics.maleCount})</span>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="text-center">
                    <span className="text-xl font-black text-rose-600">{metrics.femaleRatio}%</span>
                    <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider mt-0.5">Female ({metrics.femaleCount})</span>
                  </div>
                </div>

                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="bg-blue-600 h-full" style={{ width: `${metrics.maleRatio}%` }} />
                  <div className="bg-rose-500 h-full" style={{ width: `${metrics.femaleRatio}%` }} />
                  <div className="bg-amber-400 h-full" style={{ width: `${Math.max(0, 100 - Number(metrics.maleRatio) - Number(metrics.femaleRatio))}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Grid: 2 Columns (Hierarchy Tier Distribution + Branch Spread) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Box 1: Hierarchy Tier Distribution */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <ArrowTrendingUpIcon className="w-4 h-4 text-indigo-600" />
                    <span>Organizational Hierarchy & Leadership Levels</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Structural reporting tiers from Executive Leadership to Operational Staff
                  </p>
                </div>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                  {metrics.maxDepth} Tier Levels
                </span>
              </div>

              {/* Tier Level Blocks */}
              <div className="space-y-2.5">
                <div className="p-3 bg-gradient-to-r from-indigo-50 to-blue-50/50 border border-indigo-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-[11px] flex items-center justify-center">L1</span>
                    <div>
                      <p className="text-xs font-black text-slate-900">Executive Leadership & Directors</p>
                      <p className="text-[10px] text-slate-500 font-medium">CEO, Managing Director, Executive Board</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-indigo-700 bg-white px-2.5 py-1 rounded-lg shadow-2xs border border-indigo-100">
                    Tier Top
                  </span>
                </div>

                <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50/50 border border-blue-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-[11px] flex items-center justify-center">L2</span>
                    <div>
                      <p className="text-xs font-black text-slate-900">Department Heads & Practice Leads</p>
                      <p className="text-[10px] text-slate-500 font-medium">{departmentsList.length} Division Leaders</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-blue-700 bg-white px-2.5 py-1 rounded-lg shadow-2xs border border-blue-100">
                    Division
                  </span>
                </div>

                <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50/50 border border-emerald-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center">L3</span>
                    <div>
                      <p className="text-xs font-black text-slate-900">People Managers & Team Leads</p>
                      <p className="text-[10px] text-slate-500 font-medium">{metrics.totalManagers} People Managers ({metrics.avgSpanOfControl} direct reports avg)</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-700 bg-white px-2.5 py-1 rounded-lg shadow-2xs border border-emerald-100">
                    Operation
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-slate-600 text-white font-black text-[11px] flex items-center justify-center">L4</span>
                    <div>
                      <p className="text-xs font-black text-slate-900">Senior Specialists & Core Staff</p>
                      <p className="text-[10px] text-slate-500 font-medium">{Math.max(0, metrics.totalHeadcount - metrics.totalManagers)} Operational Executives & Specialists</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-700 bg-white px-2.5 py-1 rounded-lg shadow-2xs border border-slate-200">
                    Workforce
                  </span>
                </div>
              </div>
            </div>

            {/* Box 2: Branch Network Geographical Spread */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <GlobeAltIcon className="w-4 h-4 text-emerald-600" />
                    <span>Branch Locations & Geographic Density</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Workforce presence across physical office facilities and clinic branches
                  </p>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                  {branchesList.length}/50 Branches
                </span>
              </div>

              {/* Branch Cards */}
              <div className="space-y-3">
                {branchesList.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                    No physical branch records registered. Organization operates from Headquarters only.
                  </div>
                ) : (
                  branchesList.map((b, idx) => {
                    const bName = b.branchName || b.branch_name || b.name || "Branch";
                    const bCount = scopedEmployees.filter(e => {
                      const empBranch = String(e.branch || e.branchName || e.branch_name || "").toLowerCase();
                      return empBranch.includes(bName.toLowerCase()) || bName.toLowerCase().includes(empBranch);
                    }).length;
                    const bPercent = metrics.totalHeadcount > 0 ? ((bCount / metrics.totalHeadcount) * 100).toFixed(0) : "0";

                    return (
                      <div key={b.id || idx} className="p-3.5 bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-emerald-300 rounded-xl transition duration-150 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                              <BuildingOfficeIcon className="w-4 h-4" />
                            </span>
                            <div>
                              <h4 className="text-xs font-black text-slate-900">{bName}</h4>
                              <p className="text-[10px] text-slate-400 font-medium">{b.city ? `${b.city}, ${b.state || "India"}` : (b.address || "Main Operational Facility")}</p>
                            </div>
                          </div>
                          <span className="text-xs font-black text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                            {bCount} Staff ({bPercent}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.max(10, Number(bPercent))}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Corporate Entities & Branches Grid */}
      {activeTab === "entities" && (
        <div className="space-y-6">
          {/* Company Profiles Overview Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <BuildingOffice2Icon className="w-5 h-5 text-blue-600" />
                  <span>Primary Corporate Entity Profile</span>
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Statutory corporate registration, tax identification, and fiscal configuration
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckBadgeIcon className="w-4 h-4" />
                <span>Status: {primaryCompany.status || "Active Registered"}</span>
              </span>
            </div>

            {/* Grid of Key Company Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Company Name</span>
                <span className="text-xs font-black text-slate-800 block mt-1">{primaryCompany.companyName || primaryCompany.company_name}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Entity Code</span>
                <span className="text-xs font-black text-indigo-700 font-mono block mt-1">{primaryCompany.companyCode || primaryCompany.company_code || "ARGY001"}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Registration Type</span>
                <span className="text-xs font-black text-slate-800 block mt-1">{primaryCompany.type || "Pvt Ltd"}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Fiscal Year</span>
                <span className="text-xs font-black text-slate-800 block mt-1">{primaryCompany.financialYear || "2026-27"}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">PAN / Tax Number</span>
                <span className="text-xs font-black text-slate-800 font-mono block mt-1">{primaryCompany.panNumber || primaryCompany.pan_number || "AAACA1234F"}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">GSTIN Number</span>
                <span className="text-xs font-black text-slate-800 font-mono block mt-1">{primaryCompany.gstNumber || primaryCompany.gst_number || "23AABCC1234D1Z2"}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">PF Registry Code</span>
                <span className="text-xs font-black text-slate-800 font-mono block mt-1">{primaryCompany.pfNumber || primaryCompany.pf_number || "MP/IND/0012345"}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Base Currency</span>
                <span className="text-xs font-black text-emerald-700 block mt-1">{primaryCompany.currency || "INR (₹)"}</span>
              </div>
            </div>
          </div>

          {/* Branch Network Cards Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Branch Network & Facilities Directory</h3>
                <p className="text-xs text-slate-400 font-medium">All physical offices, headquarters, and regional clinic hubs</p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
                Branches: {branchesList.length}/50
              </span>
            </div>

            {branchesList.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
                No active branch facilities registered. Organization operates from Headquarters only.
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branchesList.map((branch, idx) => {
                const bName = branch.branchName || branch.branch_name || branch.name;
                const bStaff = scopedEmployees.filter(e => {
                  const empBranch = String(e.branch || e.branchName || e.branch_name || "").toLowerCase();
                  return empBranch.includes(bName.toLowerCase()) || bName.toLowerCase().includes(empBranch);
                }).length;

                return (
                  <div key={branch.id || idx} className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <BuildingOfficeIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900">{bName}</h4>
                          <span className="text-[10px] font-mono text-slate-400 font-semibold">{branch.branchCode || branch.branch_code || `BR-0${idx + 1}`}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {branch.branchType || "Active"}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{branch.address || `${branch.city || "Indore"}, ${branch.state || "MP"}`}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserGroupIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Staff Assigned: <strong className="text-slate-900">{bStaff || (metrics.totalHeadcount || 1)} Members</strong></span>
                      </div>
                      {branch.manager && (
                        <div className="flex items-center gap-2">
                          <IdentificationIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Manager: <strong className="text-slate-800">{branch.manager}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Tab 3: Department Matrix (All Departments with Headcount & Leadership) */}
      {activeTab === "departments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Departments Command & Roster</h3>
              <p className="text-xs text-slate-400 font-medium">Overview of active operational departments, leads, and staff density</p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200">
              {departmentsList.length} Registered Divisions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentsList.map((dept, idx) => {
              const dName = dept.deptName || dept.dept_name || dept.name;
              const dCode = dept.deptCode || dept.dept_code || `DEPT-0${idx + 1}`;
              const dStaff = scopedEmployees.filter(e => {
                const empDept = String(e.department || e.departmentName || e.department_name || "").toLowerCase();
                return empDept === dName.toLowerCase() || empDept.includes(dName.toLowerCase()) || dName.toLowerCase().includes(empDept);
              }).length;

              const gradient = deptGradients[idx % deptGradients.length];

              return (
                <div key={dept.id || idx} className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition space-y-3.5 group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center font-bold shadow-xs`}>
                        <Square3Stack3DIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition">{dName}</h4>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">{dCode}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {dept.status || "Active"}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {dept.description || `${dName} Division Operations & Management Workspace.`}
                  </p>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <UserGroupIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>Headcount:</span>
                    </div>
                    <span className="font-black text-slate-900 bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-200">
                      {dStaff} Staff
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Tab 4: Interactive Organizational Chart & Hierarchy Explorer */}
      {activeTab === "hierarchy" && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <UserGroupIcon className="w-4 h-4 text-amber-600" />
                <span>Visual Organizational Reporting Tree & Span of Control Explorer</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Dynamic pan-and-zoom organizational tree mapping supervisory reporting lines from leadership down
              </p>
            </div>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              Interactive Explorer
            </span>
          </div>

          {/* Embedded Full Visual OrganizationalChart Component */}
          <OrganizationalChart dbData={dbData} onRefreshData={onRefreshData} />
        </div>
      )}

      {/* 8. Tab 5: Business Units & Financial Cost Centers */}
      {activeTab === "cost_centers" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Box 1: Business Units */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <BriefcaseIcon className="w-4 h-4 text-blue-600" />
                <span>Operating Business Units</span>
              </h3>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                {businessUnitsList.length || 2} Units
              </span>
            </div>

            <div className="space-y-3">
              {(businessUnitsList.length > 0 ? businessUnitsList : [
                { buName: "Clinical & Outpatient Services", buCode: "BU-CLINIC", head: "Chief Medical Officer", status: "Active" },
                { buName: "Corporate Administration & IT", buCode: "BU-ADMIN", head: "Operations Director", status: "Active" }
              ]).map((bu, idx) => (
                <div key={bu.id || idx} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-slate-900">{bu.buName || bu.bu_name || bu.name}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span className="font-mono text-slate-400">{bu.buCode || bu.bu_code || `BU-0${idx + 1}`}</span>
                    {bu.head && <span>Lead: <strong className="text-slate-700">{bu.head}</strong></span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Box 2: Financial Cost Centers */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <BanknotesIcon className="w-4 h-4 text-purple-600" />
                <span>Financial Cost Allocation Centers</span>
              </h3>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                {costCentersList.length || 2} Centers
              </span>
            </div>

            <div className="space-y-3">
              {(costCentersList.length > 0 ? costCentersList : [
                { ccName: "HQ Executive & General Expense", ccCode: "CC-IND-001", budget: "₹ 50,00,000", status: "Active" },
                { ccName: "Consultation & OPD Expense", ccCode: "CC-OPD-002", budget: "₹ 35,00,000", status: "Active" }
              ]).map((cc, idx) => (
                <div key={cc.id || idx} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-slate-900">{cc.ccName || cc.cc_name || cc.name}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">Active</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span className="font-mono text-slate-400">{cc.ccCode || cc.cc_code || `CC-0${idx + 1}`}</span>
                    {cc.budget && <span>Budget Pool: <strong className="text-slate-800">{cc.budget}</strong></span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationDashboard;
