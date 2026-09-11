import React, { useState, useMemo } from "react";
import { 
  UserIcon, 
  BriefcaseIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XMarkIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  EyeIcon
} from "@heroicons/react/24/outline";

const LeaveBalanceReports = ({ dbData = {} }) => {
  // Extract records from database
  const employees = useMemo(() => dbData["employees"] || dbData["employee_profile"] || [], [dbData]);
  const leaveRequests = useMemo(() => dbData["leave_requests"] || dbData["Leave Requests"] || [], [dbData]);

  // Filters State
  const [selectedEmp, setSelectedEmp] = useState("All");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedLeaveType, setSelectedLeaveType] = useState("All");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDetailRow, setSelectedDetailRow] = useState(null); // Modal state

  // Apply filters state on click
  const [activeFilters, setActiveFilters] = useState({
    emp: "All",
    dept: "All",
    leaveType: "All",
    year: "2026",
  });

  const handleApplyFilter = () => {
    setActiveFilters({
      emp: selectedEmp,
      dept: selectedDept,
      leaveType: selectedLeaveType,
      year: selectedYear,
    });
    setCurrentPage(1);
  };

  // Helper date formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  // Default allocations for leave types
  const LEAVE_ALLOCATIONS = {
    "Casual Leave": 12,
    "Sick Leave": 10,
    "Earned Leave": 18,
    "Maternity Leave": 180,
    "Paternity Leave": 15
  };

  // Unique lists for filter dropdowns
  const uniqueDepartments = useMemo(() => {
    const depts = employees.map(e => e.department).filter(Boolean);
    return Array.from(new Set(depts));
  }, [employees]);

  const uniqueLeaveTypes = Object.keys(LEAVE_ALLOCATIONS);

  // 1. Process and compute leave balances for each employee and leave type
  const balanceRows = useMemo(() => {
    const rows = [];

    // If employees is empty, generate some mock data matching the user example
    if (employees.length === 0) {
      const mockEmployees = [
        { id: 1, firstName: "Yashwani", lastName: "Kushwaha", employeeCode: "EMP001", department: "IT", status: "Active", email: "yashwani@company.com" },
        { id: 2, firstName: "Rahul", lastName: "Sharma", employeeCode: "EMP012", department: "Finance", status: "Active", email: "rahul@company.com" },
        { id: 3, firstName: "Priya", lastName: "Verma", employeeCode: "EMP015", department: "HR", status: "Active", email: "priya@company.com" },
        { id: 4, firstName: "Amit", lastName: "Patel", employeeCode: "EMP008", department: "Marketing", status: "Active", email: "amit@company.com" }
      ];

      mockEmployees.forEach(emp => {
        uniqueLeaveTypes.forEach(type => {
          // Add default balances
          let allocated = LEAVE_ALLOCATIONS[type];
          let used = 0;
          let pending = 0;

          if (emp.firstName === "Yashwani" && type === "Casual Leave") {
            used = 4;
            pending = 1;
          } else if (emp.firstName === "Rahul" && type === "Sick Leave") {
            used = 6;
            pending = 0;
          } else if (emp.firstName === "Priya" && type === "Earned Leave") {
            used = 5;
            pending = 0;
          }

          const remaining = allocated - used;
          const utilization = Math.round((used / allocated) * 100);

          rows.push({
            id: `${emp.employeeCode}-${type}`,
            empName: `${emp.firstName} ${emp.lastName}`,
            employeeId: emp.employeeCode,
            department: emp.department,
            leaveType: type,
            allocated,
            used,
            pending,
            remaining,
            utilization,
            status: emp.status || "Active",
            email: emp.email
          });
        });
      });
      return rows;
    }

    // Process from real database
    employees.forEach(emp => {
      const empName = `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "Employee";
      const empCode = emp.employeeCode || `EMP${String(emp.id).padStart(3, "0")}`;
      const department = emp.department || "Operations";
      const status = emp.employeeStatus || emp.status || "Active";

      uniqueLeaveTypes.forEach(type => {
        // Filter requests for this specific employee and leave type
        const empRequests = leaveRequests.filter(r => 
          (String(r.employeeId).toLowerCase() === String(empCode).toLowerCase() || 
           String(r.empName).toLowerCase() === String(empName).toLowerCase() ||
           String(r.employee_id).toLowerCase() === String(emp.id).toLowerCase()) &&
          String(r.leaveType).toLowerCase().includes(type.split(" ")[0].toLowerCase())
        );

        const approvedDays = empRequests
          .filter(r => String(r.status).toLowerCase() === "approved")
          .reduce((sum, r) => sum + Number(r.totalDays || r.total_days || 0), 0);

        const pendingDays = empRequests
          .filter(r => String(r.status).toLowerCase() === "pending")
          .reduce((sum, r) => sum + Number(r.totalDays || r.total_days || 0), 0);

        // Fetch allocated from profile column if exists (to map backend updates dynamically)
        let remaining = LEAVE_ALLOCATIONS[type];
        if (type === "Casual Leave" && emp.casualLeave !== undefined) {
          remaining = Number(emp.casualLeave);
        } else if (type === "Sick Leave" && emp.sickLeave !== undefined) {
          remaining = Number(emp.sickLeave);
        } else if (type === "Earned Leave" && emp.earnedLeave !== undefined) {
          remaining = Number(emp.earnedLeave);
        }

        const allocated = LEAVE_ALLOCATIONS[type];
        // Calculate Used Days based on database approved entries, or fallback to difference if column updated
        const used = Math.max(0, Math.min(allocated, approvedDays || (allocated - remaining)));
        const finalRemaining = Math.max(0, allocated - used);
        const utilization = allocated > 0 ? Math.round((used / allocated) * 100) : 0;

        rows.push({
          id: `${empCode}-${type}`,
          empName,
          employeeId: empCode,
          department,
          leaveType: type,
          allocated,
          used,
          pending: pendingDays,
          remaining: finalRemaining,
          utilization,
          status,
          email: emp.email || emp.companyEmail || ""
        });
      });
    });

    return rows;
  }, [employees, leaveRequests, uniqueLeaveTypes]);

  // 2. Filtered balance rows based on filter state
  const filteredRows = useMemo(() => {
    return balanceRows.filter(row => {
      // Text Search
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesName = String(row.empName).toLowerCase().includes(query);
        const matchesId = String(row.employeeId).toLowerCase().includes(query);
        if (!matchesName && !matchesId) return false;
      }

      // Dropdown Employee Filter
      if (activeFilters.emp !== "All" && row.employeeId !== activeFilters.emp) {
        return false;
      }

      // Dropdown Department Filter
      if (activeFilters.dept !== "All" && row.department !== activeFilters.dept) {
        return false;
      }

      // Dropdown Leave Type Filter
      if (activeFilters.leaveType !== "All" && row.leaveType !== activeFilters.leaveType) {
        return false;
      }

      return true;
    });
  }, [balanceRows, searchQuery, activeFilters]);

  // Pagination Logic
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(start, start + itemsPerPage);
  }, [filteredRows, currentPage]);

  // Get status color indicator
  const getBalanceBadge = (remaining, allocated) => {
    if (remaining === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping"></span>
          🔴 No Balance
        </span>
      );
    } else if (remaining <= 3 || (remaining / allocated) <= 0.3) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
          🟡 Low Balance
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-green-50 text-green-700 border border-green-200">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
          🟢 Healthy Balance
        </span>
      );
    }
  };

  // Get utilization styling
  const getUtilizationStyle = (utilVal) => {
    if (utilVal >= 80) return "text-rose-600 bg-rose-50";
    if (utilVal >= 50) return "text-amber-600 bg-amber-50";
    return "text-indigo-650 bg-indigo-50/50";
  };

  // Leave history for details modal
  const selectedEmpHistory = useMemo(() => {
    if (!selectedDetailRow) return [];
    
    return leaveRequests.filter(r => 
      String(r.employeeId).toLowerCase() === String(selectedDetailRow.employeeId).toLowerCase() ||
      String(r.empName).toLowerCase() === String(selectedDetailRow.empName).toLowerCase()
    ).sort((a, b) => b.id - a.id);
  }, [selectedDetailRow, leaveRequests]);

  return (
    <div className="space-y-6">
      
      {/* Overview Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Leave Management / Leave Balance</span>
          <h2 className="text-sm font-black text-slate-900 mt-0.5">Employee Leave Balance Workspace</h2>
          <p className="text-xs text-slate-400 font-medium">Real-time leave allocations, usage ledger, and availability metrics</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3.5 py-2 bg-indigo-50 border border-indigo-150 rounded-xl text-xs font-bold text-indigo-700 flex items-center gap-1.5">
            <CheckCircleIcon className="h-4 w-4 text-indigo-500" />
            Report Mode: Read-Only
          </span>
        </div>
      </div>

      {/* Filter Bar Console */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <FunnelIcon className="h-4 w-4 text-slate-400" />
          Filter Configuration
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
          {/* Employee Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Employee</label>
            <select
              value={selectedEmp}
              onChange={(e) => setSelectedEmp(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="All">All Employees</option>
              {employees.map(e => (
                <option key={e.id} value={e.employeeCode || e.id}>{e.firstName} {e.lastName || ""} ({e.employeeCode || `EMP${e.id}`})</option>
              ))}
            </select>
          </div>

          {/* Department Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="All">All Departments</option>
              {uniqueDepartments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Leave Type Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Leave Type</label>
            <select
              value={selectedLeaveType}
              onChange={(e) => setSelectedLeaveType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="All">All Leave Types</option>
              {uniqueLeaveTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Leave Year Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Leave Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="2026">2026 (Current)</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2027">2027</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleApplyFilter}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-black shadow-md transition"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Leave Balance Table Board */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        
        {/* Table Title and Text Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <span>📊</span> Leave Balance Summary
          </h3>
          <div className="relative w-full sm:w-72">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
            </span>
            <input 
              type="text"
              placeholder="Search by Employee / ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto rounded-2xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-150 text-left">
            <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4">Employee Name</th>
                <th scope="col" className="px-6 py-4">Employee ID</th>
                <th scope="col" className="px-6 py-4">Department</th>
                <th scope="col" className="px-6 py-4">Leave Type</th>
                <th scope="col" className="px-6 py-4 text-center">Allocated Days</th>
                <th scope="col" className="px-6 py-4 text-center">Used Days</th>
                <th scope="col" className="px-6 py-4 text-center">Pending Days</th>
                <th scope="col" className="px-6 py-4 text-center">Remaining Days</th>
                <th scope="col" className="px-6 py-4 text-center">Utilization</th>
                <th scope="col" className="px-6 py-4 text-center">Balance Status</th>
                <th scope="col" className="px-6 py-4 text-center">Employee Status</th>
                <th scope="col" className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700 bg-white">
              {paginatedRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/40 transition">
                  <td className="px-6 py-4 font-bold text-slate-900">{row.empName}</td>
                  <td className="px-6 py-4 text-slate-500 font-mono font-bold">{row.employeeId}</td>
                  <td className="px-6 py-4 font-medium">{row.department}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] border border-slate-200">
                      {row.leaveType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-extrabold text-slate-800">{row.allocated}</td>
                  <td className="px-6 py-4 text-center font-extrabold text-slate-700">{row.used}</td>
                  <td className="px-6 py-4 text-center font-extrabold text-amber-600">
                    {row.pending > 0 ? `+${row.pending}` : "0"}
                  </td>
                  <td className="px-6 py-4 text-center font-black text-slate-900">{row.remaining}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded font-black text-[10px] ${getUtilizationStyle(row.utilization)}`}>
                      {row.utilization}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getBalanceBadge(row.remaining, row.allocated)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider ${
                      row.status.toUpperCase() === "ACTIVE" 
                        ? "bg-green-50 text-green-700 border-green-200" 
                        : "bg-slate-50 text-slate-550 border-slate-200"
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedDetailRow(row)}
                      className="px-3 py-1.5 border border-indigo-200 hover:bg-indigo-50 text-indigo-650 rounded-lg text-[10px] font-bold shadow-xs transition flex items-center gap-1 ml-auto"
                    >
                      <EyeIcon className="h-3.5 w-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-slate-450 font-medium">
                    No employee leave balances matched the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Grid Layout for Small Screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
          {paginatedRows.map((row) => (
            <div key={row.id} className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-extrabold text-slate-900 text-xs">{row.empName}</span>
                <span className="text-[10px] font-mono font-bold text-slate-400">#{row.employeeId}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-800">
                <div className="space-y-0.5">
                  <span className="text-slate-450 uppercase text-[9px] font-bold tracking-wider">Leave Type</span>
                  <p className="font-extrabold text-slate-900">{row.leaveType}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-450 uppercase text-[9px] font-bold tracking-wider">Department</span>
                  <p className="text-slate-700 font-bold">{row.department}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-450 uppercase text-[9px] font-bold tracking-wider">Allocated / Used</span>
                  <p className="font-bold text-slate-800">{row.allocated} / {row.used}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-450 uppercase text-[9px] font-bold tracking-wider">Pending Requests</span>
                  <p className="font-bold text-amber-600">{row.pending} Days</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-450 uppercase text-[9px] font-bold tracking-wider">Remaining Balance</span>
                  <p className="font-black text-slate-950 text-sm">{row.remaining} Days</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-450 uppercase text-[9px] font-bold tracking-wider">Utilization</span>
                  <p className="font-bold text-slate-800">{row.utilization}%</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-450 uppercase text-[9px] font-bold tracking-wider">Balance Status</span>
                  <div>{getBalanceBadge(row.remaining, row.allocated)}</div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-450 uppercase text-[9px] font-bold tracking-wider">Employee Status</span>
                  <div>
                    <span className="px-2 py-0.5 rounded text-[8px] font-black border uppercase tracking-wider bg-green-50 text-green-700 border-green-200">
                      {row.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedDetailRow(row)}
                  className="px-3.5 py-1.5 border border-indigo-200 hover:bg-indigo-50 text-indigo-650 rounded-xl text-[10px] font-bold shadow-xs transition flex items-center gap-1"
                >
                  <EyeIcon className="h-3.5 w-3.5" />
                  View History Ledger
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {filteredRows.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white py-3 gap-4 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-semibold">
              Showing <strong className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</strong> to{" "}
              <strong className="text-slate-800">
                {Math.min(currentPage * itemsPerPage, filteredRows.length)}
              </strong>{" "}
              of <strong className="text-slate-800">{filteredRows.length}</strong> entries
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-650 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black border transition ${
                    currentPage === idx + 1
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "border-slate-200 text-slate-650 hover:bg-slate-50"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-650 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Modal Side Panel */}
      {selectedDetailRow && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-3xl border border-slate-150 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col transform transition-all scale-100 animate-in fade-in zoom-in-95 duration-250">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] font-black text-slate-400 uppercase tracking-wider">Leave Balance details</span>
                <h4 className="text-sm font-black text-slate-900 mt-0.5">{selectedDetailRow.empName} ({selectedDetailRow.employeeId})</h4>
              </div>
              <button 
                onClick={() => setSelectedDetailRow(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              {/* Employee Basic Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Employee Name</span>
                  <p className="font-extrabold text-slate-900">{selectedDetailRow.empName}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Employee ID</span>
                  <p className="font-extrabold text-slate-900">{selectedDetailRow.employeeId}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Department</span>
                  <p className="font-bold text-slate-750">{selectedDetailRow.department}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Email Address</span>
                  <p className="font-bold text-slate-750">{selectedDetailRow.email || "N/A"}</p>
                </div>
              </div>

              {/* Allocation Ledger Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                {/* Allocated */}
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-3">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase block tracking-wider">Allocated</span>
                  <p className="text-lg font-black text-slate-800 mt-1">{selectedDetailRow.allocated}</p>
                </div>
                {/* Used */}
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-3">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase block tracking-wider">Used</span>
                  <p className="text-lg font-black text-slate-800 mt-1 text-slate-650">{selectedDetailRow.used}</p>
                </div>
                {/* Pending */}
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-3">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase block tracking-wider">Pending</span>
                  <p className="text-lg font-black text-amber-600 mt-1">{selectedDetailRow.pending}</p>
                </div>
                {/* Remaining */}
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-3">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase block tracking-wider">Remaining</span>
                  <p className="text-lg font-black text-emerald-600 mt-1">{selectedDetailRow.remaining}</p>
                </div>
                {/* Utilization */}
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3">
                  <span className="text-[9px] font-extrabold text-indigo-400 uppercase block tracking-wider">Utilization</span>
                  <p className="text-lg font-black text-indigo-700 mt-1">{selectedDetailRow.utilization}%</p>
                </div>
              </div>

              {/* Leave Request Transaction History */}
              <div className="space-y-3">
                <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-600">Leave request Ledger</h5>
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="min-w-full divide-y divide-slate-150 text-left">
                    <thead className="bg-slate-50 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th scope="col" className="px-4 py-2.5">Req ID</th>
                        <th scope="col" className="px-4 py-2.5">Leave Type</th>
                        <th scope="col" className="px-4 py-2.5">Period</th>
                        <th scope="col" className="px-4 py-2.5 text-center">Days</th>
                        <th scope="col" className="px-4 py-2.5">Reason</th>
                        <th scope="col" className="px-4 py-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px] font-semibold text-slate-700 bg-white">
                      {selectedEmpHistory.map((h) => (
                        <tr key={h.id} className="hover:bg-slate-50/40 transition">
                          <td className="px-4 py-2.5 font-mono text-slate-500 font-bold">#{h.reqId || h.id}</td>
                          <td className="px-4 py-2.5 text-slate-600">{h.leaveType || h.leave_type}</td>
                          <td className="px-4 py-2.5 text-[10px] text-slate-500 font-medium">
                            {formatDate(h.fromDate || h.start_date)} - {formatDate(h.toDate || h.end_date)}
                          </td>
                          <td className="px-4 py-2.5 text-center font-bold text-slate-800">{h.totalDays || h.total_days || 1}</td>
                          <td className="px-4 py-2.5 text-slate-500 font-medium max-w-[120px] truncate" title={h.reason}>{h.reason || "--"}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black border uppercase tracking-wider ${
                              String(h.status).toUpperCase() === "APPROVED"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : String(h.status).toUpperCase() === "PENDING"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }`}>
                              {h.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {selectedEmpHistory.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-slate-400 font-medium">
                            No leave transactions recorded for this employee.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex justify-end">
              <button
                onClick={() => setSelectedDetailRow(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-black transition"
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

export default LeaveBalanceReports;
