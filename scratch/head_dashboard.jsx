import { useEffect, useMemo, useState } from "react";
import {
  BanknotesIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  ClockIcon,
  IdentificationIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Badge, Card, DynamicTable } from "../components/ui";
import { apiFetch, mapEmployee, mapLeave, mapPass } from "../services/hrApi";

const getStatusVariant = (status) => {
  if (["Active", "Approved", "Processed"].includes(status)) {
    return "success";
  }

  if (["Pending", "Reactive"].includes(status)) {
    return "warning";
  }

  return "danger";
};

const MobileRecordList = ({ columns, data, emptyMessage, titleKey }) => {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((row, index) => {
        const titleColumn =
          columns.find((column) => column.key === titleKey) || columns[0];
        const title = row[titleColumn.key];
        const detailColumns = columns.filter(
          (column) => column.key !== titleColumn.key
        );

        return (
          <div
            key={row.id || `${title}-${index}`}
            className="rounded-lg border border-gray-200 bg-gray-50 p-4"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <p className="min-w-0 flex-1 truncate font-semibold text-gray-900">
                {title}
              </p>
              {row.status && <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge>}
              {row.salaryStatus && (
                <Badge variant={getStatusVariant(row.salaryStatus)}>
                  {row.salaryStatus}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              {detailColumns
                .filter(
                  (column) =>
                    column.key !== "status" && column.key !== "salaryStatus"
                )
                .map((column) => (
                  <div
                    key={column.key}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <span className="text-gray-500">{column.label}</span>
                    <span className="min-w-0 truncate text-right font-medium text-gray-800">
                      {row[column.key]}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [employees, setEmployees] = useState([]);
  const [discontinuedEmployees, setDiscontinuedEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [passes, setPasses] = useState([]);
  const [leaveRules, setLeaveRules] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

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
        if (empRes.success && empRes.data) {
          const mapped = empRes.data.map(mapEmployee);
          setEmployees(mapped);
        }
        if (leaveRes.success && leaveRes.data) {
          setLeaves(leaveRes.data.map(mapLeave));
        }
        if (attendanceRes.success && attendanceRes.data) {
          setPasses(attendanceRes.data.map(mapPass));
        }
        if (shiftRes.success && shiftRes.data) {
          setLeaveRules(shiftRes.data);
        }
      } catch (err) {
        console.error("Dashboard database load error, using local fallback state:", err);
      }
    };

    loadDashboardData();
  }, []);

  const dashboardCards = useMemo(
    () => [
      {
        title: "Total Employees",
        value: employees.length,
        helper: `${discontinuedEmployees.length} discontinued`,
        icon: UserGroupIcon,
        color: "text-blue-600",
      },
      {
        title: "Leave Requests",
        value: leaves.length,
        helper: `${leaves.filter((item) => item.status === "Pending").length} pending`,
        icon: CalendarDaysIcon,
        color: "text-yellow-600",
      },
      {
        title: "Pass Reports",
        value: passes.length,
        helper: `${passes.filter((item) => item.status === "Active").length} active`,
        icon: IdentificationIcon,
        color: "text-green-600",
      },
      {
        title: "Leave Rules",
        value: leaveRules.length,
        helper: "CL, ML, EL configured",
        icon: BriefcaseIcon,
        color: "text-purple-600",
      },
    ],
    [discontinuedEmployees.length, employees.length, leaveRules.length, leaves, passes]
  );

  const recentLeaveColumns = [
    { key: "employeeName", label: "Employee", sortable: true },
    { key: "leaveType", label: "Leave Type", sortable: true },
    { key: "fromDate", label: "From", sortable: true },
    { key: "toDate", label: "To", sortable: true },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value) => <Badge variant={getStatusVariant(value)}>{value}</Badge>,
    },
  ];

  const accountColumns = [
    { key: "employeeName", label: "Employee", sortable: true },
    { key: "bankName", label: "Bank", sortable: true },
    {
      key: "salaryStatus",
      label: "Salary Status",
      sortable: true,
      render: (value) => <Badge variant={getStatusVariant(value)}>{value}</Badge>,
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Live overview from employee, leave, pass, and job management data.
          </p>
        </div>

        <div className="flex w-full items-center gap-3 rounded-lg bg-white px-4 py-3 shadow sm:w-auto">
          <ClockIcon className="h-5 w-5 flex-shrink-0 text-blue-600" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase text-gray-500">
              Live Updated
            </p>
            <p className="truncate font-semibold text-gray-800">
              {currentTime.toLocaleTimeString()}
            </p>
          </div>
          <Badge variant="success">Live</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
        {dashboardCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.title} variant="elevated" padding="large">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-500">
                    {card.title}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                    {card.value}
                  </h2>
                  <p className="mt-1 truncate text-sm text-gray-500">
                    {card.helper}
                  </p>
                </div>
                <Icon className={`h-10 w-10 flex-shrink-0 sm:h-12 sm:w-12 ${card.color}`} />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:gap-6 xl:grid-cols-3">
        <Card
          title="Today Summary"
          subtitle="Current demo data status"
          variant="elevated"
          padding="large"
          className="xl:col-span-1"
        >
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-3 border-b pb-3">
              <span className="text-gray-600">Approved accounts</span>
              <Badge variant="success">
                {
                  employees.filter(
                    (item) => item.salaryStatus === "Processed"
                  ).length
                }
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-3 border-b pb-3">
              <span className="text-gray-600">Pending leaves</span>
              <Badge variant="warning">
                {leaves.filter((item) => item.status === "Pending").length}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-3 border-b pb-3">
              <span className="text-gray-600">Deactive passes</span>
              <Badge variant="danger">
                {passes.filter((item) => item.status === "Deactive").length}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-600">Active leave rules</span>
              <Badge variant="primary">
                {leaveRules.filter((item) => item.status === "Active").length}
              </Badge>
            </div>
          </div>
        </Card>

        <Card
          title="Recent Leave Requests"
          subtitle="Latest leave request data"
          icon={<CalendarDaysIcon className="h-6 w-6 text-blue-600" />}
          variant="elevated"
          padding="large"
          className="xl:col-span-2"
        >
          <div className="hidden md:block">
            <DynamicTable
              columns={recentLeaveColumns}
              data={leaves.slice(0, 4)}
              pagination={false}
              emptyMessage="No leave request data found"
            />
          </div>
          <div className="md:hidden">
            <MobileRecordList
              columns={recentLeaveColumns}
              data={leaves.slice(0, 4)}
              emptyMessage="No leave request data found"
              titleKey="employeeName"
            />
          </div>
        </Card>
      </div>

      <Card
        title="Account Processing"
        subtitle="Salary/account status from employee account details"
        icon={<BanknotesIcon className="h-6 w-6 text-blue-600" />}
        variant="elevated"
        padding="large"
      >
        <div className="hidden md:block">
          <DynamicTable
            columns={accountColumns}
            data={employees}
            pagination={false}
            emptyMessage="No account data found"
          />
        </div>
        <div className="md:hidden">
          <MobileRecordList
            columns={accountColumns}
            data={employees}
            emptyMessage="No account data found"
            titleKey="employeeName"
          />
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
