import React, { useState, useMemo } from "react";

const AttendanceReportsAdmin = ({ dbData = [] }) => {
  const attendanceLogs = dbData["Daily Attendance"] || dbData["daily_attendance"] || [];
  const employees = dbData["employees"] || dbData["employee_profile"] || [];

  const [reportType, setReportType] = useState("Daily Roster");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDept, setSelectedDept] = useState("");

  const deptsList = useMemo(() => {
    return [...new Set(employees.map(e => e.department).filter(Boolean))];
  }, [employees]);

  // Compute records matching report filters
  const reportRecords = useMemo(() => {
    let list = [];
    if (reportType === "Daily Roster") {
      employees.forEach(emp => {
        const empCode = emp.employeeCode || emp.emp_code || emp.id;
        const punch = attendanceLogs.find(a => a.date === reportDate && String(a.empId).toLowerCase() === String(empCode).toLowerCase());
        
        if (selectedDept && emp.department !== selectedDept) return;

        list.push({
          empId: empCode,
          name: `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.employeeName || "Employee",
          department: emp.department || "Operations",
          checkIn: punch ? punch.checkIn : "--",
          checkOut: punch ? punch.checkOut : "--",
          workingHours: punch ? `${punch.workingHours} Hrs` : "0 Hrs",
          status: punch ? punch.status : "Absent",
          remarks: punch ? punch.remarks : "No punch recorded"
        });
      });
    } else if (reportType === "Late Arrivals") {
      attendanceLogs.forEach(punch => {
        if (punch.status !== "Late") return;
        if (punch.date !== reportDate) return;
        
        const emp = employees.find(e => String(e.employeeCode || e.emp_code || e.id).toLowerCase() === String(punch.empId).toLowerCase());
        if (selectedDept && emp && emp.department !== selectedDept) return;

        list.push({
          empId: punch.empId,
          name: punch.name || (emp ? `${emp.firstName || ""} ${emp.lastName || ""}`.trim() : "Employee"),
          department: emp ? emp.department : "Operations",
          checkIn: punch.checkIn,
          checkOut: punch.checkOut,
          workingHours: `${punch.workingHours || 0} Hrs`,
          status: "Late Arrival",
          remarks: `Late by ${punch.lateComing || 0} minutes`
        });
      });
    } else if (reportType === "Overtime Audit") {
      attendanceLogs.forEach(punch => {
        if (Number(punch.overtime || 0) <= 0) return;
        
        const emp = employees.find(e => String(e.employeeCode || e.emp_code || e.id).toLowerCase() === String(punch.empId).toLowerCase());
        if (selectedDept && emp && emp.department !== selectedDept) return;

        list.push({
          empId: punch.empId,
          name: punch.name || (emp ? `${emp.firstName || ""} ${emp.lastName || ""}`.trim() : "Employee"),
          department: emp ? emp.department : "Operations",
          checkIn: punch.checkIn,
          checkOut: punch.checkOut,
          workingHours: `${punch.workingHours || 0} Hrs`,
          status: "Overtime",
          remarks: `${punch.overtime} Hours Overtime recorded`
        });
      });
    }
    return list;
  }, [reportType, reportDate, selectedDept, employees, attendanceLogs]);

  const handleExportCSV = () => {
    if (reportRecords.length === 0) {
      alert("No data available to export.");
      return;
    }
    const headers = ["Employee ID", "Employee Name", "Department", "Check In", "Check Out", "Working Hours", "Status", "Remarks"];
    const rows = reportRecords.map(r => [r.empId, r.name, r.department, r.checkIn, r.checkOut, r.workingHours, r.status, r.remarks]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_${reportType.replace(/ /g, '_')}_${reportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h4 className="font-extrabold text-sm text-slate-800">
          📈 Attendance Report Generator
        </h4>
        <div className="flex gap-2">
          <button 
            onClick={() => window.print()}
            className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            Print PDF
          </button>
          <button 
            onClick={handleExportCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100/60">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Report Category</label>
          <select 
            value={reportType}
            onChange={e => setReportType(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option>Daily Roster</option>
            <option>Late Arrivals</option>
            <option>Overtime Audit</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Target Date</label>
          <input 
            type="date"
            value={reportDate}
            onChange={e => setReportDate(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Department</label>
          <select 
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="">All Departments</option>
            {deptsList.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Preview Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-bold text-slate-600">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px]">
              <th className="py-2.5">Employee ID</th>
              <th>Employee Name</th>
              <th>Department</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Working Hours</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reportRecords.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition">
                <td className="py-3 text-slate-800 font-mono">{item.empId}</td>
                <td>{item.name}</td>
                <td>{item.department}</td>
                <td>{item.checkIn}</td>
                <td>{item.checkOut}</td>
                <td>{item.workingHours}</td>
                <td>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                    item.status === "Present" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                    item.status === "Late Arrival" || item.status === "Late" ? "bg-yellow-50 text-yellow-700 border border-yellow-100 font-black" :
                    item.status === "Overtime" ? "bg-purple-50 text-purple-700 border border-purple-100" :
                    "bg-red-50 text-red-700 border border-red-100"
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="text-slate-400 font-semibold">{item.remarks}</td>
              </tr>
            ))}
            {reportRecords.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-6 text-slate-400 font-bold">No records matched the reporting filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceReportsAdmin;
