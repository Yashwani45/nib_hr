import React, { useState, useMemo } from "react";

const AttendanceDashboard = ({ dbData = [] }) => {
  const attendanceLogs = dbData["Daily Attendance"] || dbData["daily_attendance"] || [];
  const employees = dbData["employees"] || dbData["employee_profile"] || [];

  // Filter States
  const [filterCompany, setFilterCompany] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return employees.map(emp => {
      const empCode = emp.employeeCode || emp.emp_code || emp.id;
      const punch = attendanceLogs.find(a => a.date === todayStr && String(a.empId).toLowerCase() === String(empCode).toLowerCase());
      return {
        id: emp.id,
        code: empCode,
        name: `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.employeeName || "Employee",
        company: emp.company || "NIB Technologies Pvt Ltd",
        branch: emp.branch || "Headquarters",
        department: emp.department || "Operations",
        shift: emp.shift || "General Shift",
        punch: punch || null
      };
    }).filter(item => {
      if (filterCompany && item.company !== filterCompany) return false;
      if (filterBranch && item.branch !== filterBranch) return false;
      if (filterDept && item.department !== filterDept) return false;
      
      const punchStatus = item.punch ? item.punch.status : "Absent";
      if (filterStatus && punchStatus !== filterStatus) return false;

      if (filterSearch) {
        const query = filterSearch.toLowerCase();
        return item.name.toLowerCase().includes(query) || item.code.toLowerCase().includes(query);
      }
      return true;
    });
  }, [employees, attendanceLogs, todayStr, filterCompany, filterBranch, filterDept, filterStatus, filterSearch]);

  // Statistics
  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let checkedIn = 0;
    let notCheckedOut = 0;
    let overtime = 0;

    filteredRoster.forEach(emp => {
      if (emp.punch) {
        present++;
        if (emp.punch.status === "Late") late++;
        if (emp.punch.checkIn && emp.punch.checkIn !== "--") {
          if (!emp.punch.checkOut || emp.punch.checkOut === "--") {
            checkedIn++;
            notCheckedOut++;
          }
        }
        if (Number(emp.punch.overtime) > 0) overtime++;
      } else {
        absent++;
      }
    });

    return { present, absent, late, checkedIn, notCheckedOut, overtime, total: filteredRoster.length };
  }, [filteredRoster]);

  // Unique Lists for Filters
  const uniqueCompanies = useMemo(() => [...new Set(employees.map(e => e.company).filter(Boolean))], [employees]);
  const uniqueBranches = useMemo(() => [...new Set(employees.map(e => e.branch).filter(Boolean))], [employees]);
  const uniqueDepts = useMemo(() => [...new Set(employees.map(e => e.department).filter(Boolean))], [employees]);

  return (
    <div className="space-y-6">
      {/* Metrics Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-extrabold">Total headcount</span>
          <span className="text-2xl text-slate-800 font-black mt-2">{stats.total}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-extrabold">Present today</span>
          <span className="text-2xl text-emerald-600 font-black mt-2">{stats.present}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-extrabold">Absent today</span>
          <span className="text-2xl text-red-500 font-black mt-2">{stats.absent}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-extrabold">Currently Active</span>
          <span className="text-2xl text-blue-500 font-black mt-2">{stats.checkedIn}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-extrabold">Late Arrivals</span>
          <span className="text-2xl text-amber-500 font-black mt-2">{stats.late}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-extrabold">Overtime Emps</span>
          <span className="text-2xl text-purple-600 font-black mt-2">{stats.overtime}</span>
        </div>
      </div>

      {/* Roster & Filtering Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <h4 className="font-extrabold text-sm text-slate-800">
            👥 Real-Time Today's Attendance Roster
          </h4>
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Search employee..." 
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <select 
            value={filterCompany} 
            onChange={e => setFilterCompany(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All Companies</option>
            {uniqueCompanies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select 
            value={filterBranch} 
            onChange={e => setFilterBranch(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All Branches</option>
            {uniqueBranches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          <select 
            value={filterDept} 
            onChange={e => setFilterDept(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All Departments</option>
            {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late Arrival</option>
            <option value="Early Exit">Early Exit</option>
            <option value="Overtime">Overtime</option>
            <option value="Absent">Absent</option>
          </select>
        </div>

        {/* Roster Listing */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bold text-slate-600">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px]">
                <th className="py-3">Emp Code</th>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Working Hours</th>
                <th>Status</th>
                <th>Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRoster.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-3 text-slate-800 font-mono">{item.code}</td>
                  <td>{item.name}</td>
                  <td>{item.department}</td>
                  <td>{item.punch ? item.punch.checkIn : "--"}</td>
                  <td>{item.punch ? item.punch.checkOut : "--"}</td>
                  <td>{item.punch && item.punch.workingHours ? `${item.punch.workingHours} Hrs` : "--"}</td>
                  <td>
                    {item.punch ? (
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        item.punch.status === "Present" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                        item.punch.status === "Late" ? "bg-yellow-50 text-yellow-700 border border-yellow-100" :
                        item.punch.status === "Early Exit" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                        item.punch.status === "Overtime" ? "bg-purple-50 text-purple-700 border border-purple-100" :
                        "bg-red-50 text-red-700 border border-red-100"
                      }`}>
                        {item.punch.status}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-red-50 text-red-700 border border-red-100">
                        Absent
                      </span>
                    )}
                  </td>
                  <td className="text-[10px] text-slate-400 font-semibold">
                    {item.punch ? `${item.punch.device_info || "--"} (${item.punch.ip_address || "Local"})` : "--"}
                  </td>
                </tr>
              ))}
              {filteredRoster.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-slate-400 font-bold">No records found matching filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Chart Trends using Flexbox */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <h4 className="font-extrabold text-sm text-slate-800">
          📈 Attendance Trend & Statistics (Past 7 Days)
        </h4>
        <div className="h-48 flex items-end justify-between gap-6 px-10 border-b pb-2 border-slate-200">
          {[
            { day: "Mon", percent: 94 },
            { day: "Tue", percent: 88 },
            { day: "Wed", percent: 92 },
            { day: "Thu", percent: 96 },
            { day: "Fri", percent: 91 },
            { day: "Sat", percent: 45 },
            { day: "Sun", percent: 12 }
          ].map(bar => (
            <div key={bar.day} className="flex-1 flex flex-col items-center gap-2">
              <div 
                style={{ height: `${bar.percent * 1.5}px` }} 
                className="w-full bg-blue-600 hover:bg-blue-700 rounded-t-lg transition-all relative group flex items-end justify-center"
              >
                <div className="absolute -top-8 px-2 py-0.5 bg-slate-800 text-white rounded text-[8px] opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                  {bar.percent}%
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-black uppercase">{bar.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AttendanceDashboard;
