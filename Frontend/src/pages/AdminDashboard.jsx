import React, { useEffect, useMemo, useState } from "react";
import {
  UserGroupIcon,
  BuildingOffice2Icon,
  BriefcaseIcon,
  ClockIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  PresentationChartBarIcon,
  RectangleStackIcon
} from "@heroicons/react/24/outline";
import { Badge, Card, DynamicTable } from "../components/ui";
import { apiFetch } from "../services/hrApi";











const getStatusVariant = (status) => {
  if (["Active", "Approved", "Processed", "Open", "Hired"].includes(status)) return "success";
  if (["Pending", "Trial", "Draft", "Screening", "Interviewing"].includes(status)) return "warning";
  if (["Deactive", "Rejected", "Terminated", "Suspended", "Closed"].includes(status)) return "danger";
  return "neutral";
};

const AdminDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Database Data States
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live Timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all dashboard stats dynamically
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [
          empRes, 
          leaveRes, 
          attendanceRes, 
          reqRes,
          deptRes,
          branchRes,
          salaryRes
        ] = await Promise.all([
          apiFetch("/api/table/employee_profile"),
          apiFetch("/api/table/leave_requests"),
          apiFetch("/api/table/daily_attendance"),
          apiFetch("/api/table/job_requisition"),
          apiFetch("/api/table/department"),
          apiFetch("/api/table/branch"),
          apiFetch("/api/table/salary_structure"),
        ]);

        if (empRes.success && empRes.data) setEmployees(empRes.data);
        if (leaveRes.success && leaveRes.data) setLeaves(leaveRes.data);
        if (attendanceRes.success && attendanceRes.data) setAttendance(attendanceRes.data);
        if (reqRes.success && reqRes.data) setRequisitions(reqRes.data);
        if (deptRes.success && deptRes.data) setDepartments(deptRes.data);
        if (branchRes.success && branchRes.data) setBranches(branchRes.data);
        if (salaryRes.success && salaryRes.data) setSalaries(salaryRes.data);
      } catch (err) {
        console.error("Dashboard database load error", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  // Calculation parameters
  const stats = useMemo(() => {
    const activeLeaves = leaves.filter(l => l.status === "Pending").length;
    const openReqs = requisitions.filter(r => r.status === "Open").length || requisitions.length;
    
    return [
      { title: "Workforce Size", value: employees.length, helper: "Total Active profiles", icon: UserGroupIcon, color: "text-blue-600 bg-blue-50 border border-blue-100" },
      { title: "Active Branches", value: branches.length, helper: "Regional workspaces", icon: BuildingOffice2Icon, color: "text-indigo-600 bg-indigo-50 border border-indigo-100" },
      { title: "Departments", value: departments.length, helper: "Operational groupings", icon: RectangleStackIcon, color: "text-slate-600 bg-slate-50 border border-slate-100" },
      { title: "Hiring Vacancies", value: openReqs, helper: "Open job requisitions", icon: BriefcaseIcon, color: "text-amber-600 bg-amber-50 border border-amber-100" },
      { title: "Leave Requests", value: leaves.length, helper: `${activeLeaves} pending review`, icon: CalendarDaysIcon, color: "text-red-600 bg-red-50 border border-red-100" },
      { title: "Payroll Configs", value: salaries.length, helper: "Active salary structures", icon: BanknotesIcon, color: "text-emerald-600 bg-emerald-50 border border-emerald-100" },
    ];
  }, [employees, leaves, requisitions, departments, branches, salaries]);

  // Tables Columns definitions
  const requisitionColumns = [
    { key: "jobTitle", label: "Job Position" },
    { key: "department", label: "Department" },
    { key: "vacancies", label: "Vacancies", render: (val) => <span className="font-bold">{val} seats</span> },
    { key: "status", label: "Status", render: (val) => <Badge variant={getStatusVariant(val)}>{val}</Badge> }
  ];

  const leaveColumns = [
    { key: "employeeName", label: "Employee Name", render: (val, row) => <span>{val || row.employee || "Anonymous"}</span> },
    { key: "leaveType", label: "Leave Type" },
    { key: "fromDate", label: "From Date" },
    { key: "status", label: "Status", render: (val) => <Badge variant={getStatusVariant(val)}>{val}</Badge> }
  ];

  const attendanceColumns = [
    { key: "name", label: "Employee" },
    { key: "date", label: "Date" },
    { key: "checkIn", label: "Check-In" },
    { key: "checkOut", label: "Check-Out" },
    { key: "status", label: "Status", render: (val) => <Badge variant={getStatusVariant(val)}>{val}</Badge> }
  ];

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">HR Command Center</h1>
          <p className="text-slate-500 text-sm mt-1">Live corporate statistics, employee allocations, and operational controls.</p>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-2.5 border border-slate-200/60 shadow-sm sm:w-auto">
          <ClockIcon className="h-5 w-5 text-blue-600 animate-pulse" />
          <div className="min-w-0">
            <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Live System Time</p>
            <p className="font-bold text-slate-700 text-xs">{currentTime.toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-xs text-slate-500 font-semibold mt-3">Compiling corporate dashboard metrics...</span>
        </div>
      ) : (
        <>
          {/* Key Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-5">
            {stats.map((card, idx) => {
              const Icon = card.icon;
              return (
                <Card key={idx} variant="elevated" padding="medium" className="hover:shadow-md transition">
                  <div className="flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{card.title}</p>
                      <div className={`p-1.5 rounded-lg ${card.color}`}>
                        <Icon className="h-5 w-5 shrink-0" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-black text-slate-800">{card.value}</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">{card.helper}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Central Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Recent Job Openings */}
            <Card title="Active Job Requisitions" subtitle="Hiring and applicant status overview" className="xl:col-span-2 shadow-sm">
              <DynamicTable 
                columns={requisitionColumns} 
                data={requisitions.slice(0, 4)} 
                pagination={false} 
                emptyMessage="No job requisitions are currently active in the database." 
              />
            </Card>

            {/* Quick Metrics checklist */}
            <Card title="Corporate Overview" subtitle="System records checklists" className="xl:col-span-1 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                  <span className="text-xs font-semibold text-slate-600">Active branches</span>
                  <Badge variant="success">{branches.length} Registered</Badge>
                </div>
                <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                  <span className="text-xs font-semibold text-slate-600">Configured departments</span>
                  <Badge variant="primary">{departments.length} Active</Badge>
                </div>
                <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                  <span className="text-xs font-semibold text-slate-600">Total staff employee profiles</span>
                  <Badge variant="neutral">{employees.length} Profiles</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Hiring vacancies active</span>
                  <Badge variant="warning">{requisitions.reduce((acc, curr) => acc + (Number(curr.vacancies) || 0), 0)} Open</Badge>
                </div>
              </div>
            </Card>
          </div>

          {/* Bottom Stream Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Live Attendance stream */}
            <Card title="Workforce Attendance Logs" subtitle="Daily clock-in logs and shifts" className="shadow-sm">
              <DynamicTable 
                columns={attendanceColumns} 
                data={attendance.slice(0, 4)} 
                pagination={false} 
                emptyMessage="No attendance records logged today." 
              />
            </Card>

            {/* Recent Leave Requests */}
            <Card title="Recent Leave Requests" subtitle="Leave tracker alerts" className="shadow-sm">
              <DynamicTable 
                columns={leaveColumns} 
                data={leaves.slice(0, 4)} 
                pagination={false} 
                emptyMessage="No leave requests are currently pending review." 
              />
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
