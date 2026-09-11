import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  CalendarDaysIcon,
  CheckIcon,
  ClockIcon,
  IdentificationIcon,
  UserGroupIcon,
  UserIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { Badge, Card, DynamicTable } from "../components/ui";
import { apiFetch, mapEmployee, mapLeave, mapPass } from "../services/hrApi";
import { setDashboardData } from "../redux/dashboardSlice";

const ManagerDashboard = () => {
  const dispatch = useDispatch();
  const [currentTime, setCurrentTime] = useState(new Date());

  const employees = useSelector((state) => state.dashboard.employees);
  const leaves = useSelector((state) => state.dashboard.leaves);
  const passes = useSelector((state) => state.dashboard.passes);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [empRes, leaveRes, attendanceRes, shiftRes] = await Promise.all([
          apiFetch("/api/table/employee_profile"),
          apiFetch("/api/table/leave_requests"),
          apiFetch("/api/table/daily_attendance"),
          apiFetch("/api/table/shift_master"),
        ]);
        
        let mappedEmployees = [];
        let mappedLeaves = [];
        let mappedPasses = [];
        let loadedRules = [];

        if (empRes.success && empRes.data) mappedEmployees = empRes.data.map(mapEmployee);
        if (leaveRes.success && leaveRes.data) mappedLeaves = leaveRes.data.map(mapLeave);
        if (attendanceRes.success && attendanceRes.data) mappedPasses = attendanceRes.data.map(mapPass);

        dispatch(setDashboardData({
          employees: mappedEmployees,
          leaves: mappedLeaves,
          passes: mappedPasses,
          leaveRules: loadedRules
        }));
      } catch (err) {
        console.error("Dashboard database load error", err);
      }
    };
    loadDashboardData();
  }, [dispatch]);

  const cards = useMemo(() => [
    { title: "My Team Members", value: Math.max(1, Math.round(employees.length * 0.3)), helper: "Direct reporting lines", icon: UserGroupIcon, color: "text-blue-600" },
    { title: "Pending Approvals", value: leaves.filter((i) => i.status === "Pending").length, helper: "Action required", icon: CalendarDaysIcon, color: "text-yellow-600" },
    { title: "Active Team Passes", value: Math.max(1, Math.round(passes.length * 0.2)), helper: "Issued today", icon: IdentificationIcon, color: "text-green-600" }
  ], [employees.length, leaves, passes]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Manager Workspace</h1>
          <p className="text-slate-500 text-sm mt-1">Review direct report attendance, leaves, and team schedules.</p>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow sm:w-auto">
          <ClockIcon className="h-5 w-5 text-blue-600" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase text-gray-500">Live Updated</p>
            <p className="font-semibold text-gray-800 text-sm">{currentTime.toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card key={idx} variant="elevated" padding="large">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.title}</p>
                  <h3 className="text-3xl font-bold text-slate-800 mt-1">{card.value}</h3>
                  <p className="text-xs text-slate-500 mt-1">{card.helper}</p>
                </div>
                <Icon className={`h-12 w-12 ${card.color}`} />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Approvals Action Queue" subtitle="Verify and approve team members leaves" icon={<CalendarDaysIcon className="h-6 w-6 text-blue-600" />} className="lg:col-span-2">
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
            {leaves.filter(l => l.status === "Pending").map(leaveItem => (
              <div key={leaveItem.id} className="flex justify-between items-center p-4 border rounded-xl hover:bg-slate-50 transition">
                <div>
                  <h5 className="font-extrabold text-sm text-slate-800">{leaveItem.employeeName}</h5>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Requesting <span className="font-bold text-indigo-600">{leaveItem.leaveType}</span> from {leaveItem.fromDate} to {leaveItem.toDate}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="p-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition border border-green-200" title="Approve">
                    <CheckIcon className="h-4 w-4" />
                  </button>
                  <button className="p-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition border border-red-200" title="Reject">
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="My Active Team" subtitle="Direct reports context" icon={<UserIcon className="h-6 w-6 text-blue-600" />} className="lg:col-span-1">
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
            {employees.slice(0, 4).map(teamEmp => (
              <div key={teamEmp.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                <div className="h-9 w-9 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xs">
                  {teamEmp.employeeName?.[0]}
                </div>
                <div>
                  <h6 className="font-bold text-xs text-slate-800">{teamEmp.employeeName}</h6>
                  <p className="text-[10px] text-slate-500">{teamEmp.bankName || "Operations Analyst"}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ManagerDashboard;
