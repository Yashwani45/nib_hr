// Frontend/src/components/Reports/reportsData.js
import {
  UsersIcon,
  CalendarDaysIcon,
  PaperAirplaneIcon,
  BanknotesIcon,
  UserPlusIcon,
  ArrowTrendingUpIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  UserMinusIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";

export const REPORT_MODULES = [
  {
    id: "Employee",
    title: "Employee",
    categoryTab: "Employee Report",
    description: "View and analyze employee information and statistics.",
    icon: UsersIcon,
    theme: {
      bgIcon: "bg-blue-50",
      textIcon: "text-blue-600",
      btnBorder: "border-blue-500",
      btnText: "text-blue-600",
      btnHover: "hover:bg-blue-50",
      tagBg: "bg-blue-100 text-blue-800"
    },
    endpoint: "/api/table/employees",
    metrics: [
      { label: "Total Headcount", key: "total", format: "number" },
      { label: "Active Employees", key: "active", format: "number" },
      { label: "Departments", key: "departments", format: "number" },
      { label: "Full-Time Ratio", key: "fullTimeRatio", format: "percent" }
    ],
    columns: [
      { key: "employeeCode", label: "EMP Code" },
      { key: "employeeName", label: "Employee Name" },
      { key: "department", label: "Department" },
      { key: "designation", label: "Designation" },
      { key: "employeeType", label: "Employment Type" },
      { key: "dateOfJoining", label: "Date of Joining" },
      { key: "employeeStatus", label: "Status" }
    ],
    sampleData: [
      { id: "1", employeeCode: "EMP001", employeeName: "Super Admin", department: "Administration", designation: "Platform Owner", employeeType: "Full-Time", dateOfJoining: "2024-01-15", employeeStatus: "Active" },
      { id: "2", employeeCode: "EMP002", employeeName: "HR Manager", department: "Human Resources", designation: "HR Lead", employeeType: "Full-Time", dateOfJoining: "2024-03-01", employeeStatus: "Active" },
      { id: "3", employeeCode: "EMP003", employeeName: "John Doe", department: "Engineering", designation: "Senior Software Engineer", employeeType: "Full-Time", dateOfJoining: "2024-05-10", employeeStatus: "Active" },
      { id: "4", employeeCode: "EMP004", employeeName: "Aman Verma", department: "Marketing", designation: "Digital Marketing Specialist", employeeType: "Full-Time", dateOfJoining: "2024-07-20", employeeStatus: "Active" },
      { id: "5", employeeCode: "EMP005", employeeName: "Priya Sharma", department: "Finance", designation: "Financial Analyst", employeeType: "Full-Time", dateOfJoining: "2024-09-12", employeeStatus: "Active" }
    ]
  },
  {
    id: "Attendance",
    title: "Attendance",
    categoryTab: "Attendance Report",
    description: "Track attendance patterns and employee punctuality.",
    icon: CalendarDaysIcon,
    theme: {
      bgIcon: "bg-emerald-50",
      textIcon: "text-emerald-600",
      btnBorder: "border-emerald-500",
      btnText: "text-emerald-600",
      btnHover: "hover:bg-emerald-50",
      tagBg: "bg-emerald-100 text-emerald-800"
    },
    endpoint: "/api/table/daily_attendance",
    metrics: [
      { label: "Avg Attendance", key: "avgAttendance", format: "percent" },
      { label: "On-Time Rate", key: "onTimeRate", format: "percent" },
      { label: "Late Arrivals", key: "lateCount", format: "number" },
      { label: "Overtime Hours", key: "totalOvertime", format: "hours" }
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "empId", label: "EMP Code" },
      { key: "employee", label: "Employee" },
      { key: "shift", label: "Shift" },
      { key: "checkIn", label: "Check In" },
      { key: "checkOut", label: "Check Out" },
      { key: "workingHours", label: "Hours Worked" },
      { key: "status", label: "Status" }
    ],
    sampleData: [
      { id: "1", date: "2025-09-01", empId: "EMP001", employee: "Super Admin", shift: "General (9-6)", checkIn: "09:02 AM", checkOut: "06:05 PM", workingHours: "9.0 hrs", status: "Present" },
      { id: "2", date: "2025-09-01", empId: "EMP002", employee: "HR Manager", shift: "General (9-6)", checkIn: "08:55 AM", checkOut: "06:12 PM", workingHours: "9.2 hrs", status: "Present" },
      { id: "3", date: "2025-09-01", empId: "EMP003", employee: "John Doe", shift: "Morning (8-5)", checkIn: "09:15 AM", checkOut: "05:00 PM", workingHours: "7.75 hrs", status: "Late" },
      { id: "4", date: "2025-09-01", empId: "EMP004", employee: "Aman Verma", shift: "General (9-6)", checkIn: "09:00 AM", checkOut: "06:00 PM", workingHours: "9.0 hrs", status: "Present" },
      { id: "5", date: "2025-09-01", empId: "EMP005", employee: "Priya Sharma", shift: "General (9-6)", checkIn: "--", checkOut: "--", workingHours: "0 hrs", status: "On Leave" }
    ]
  },
  {
    id: "Leave",
    title: "Leave",
    categoryTab: "Leave Report",
    description: "Analyze leave trends and leave management reports.",
    icon: PaperAirplaneIcon,
    theme: {
      bgIcon: "bg-amber-50",
      textIcon: "text-amber-500",
      btnBorder: "border-amber-500",
      btnText: "text-amber-600",
      btnHover: "hover:bg-amber-50",
      tagBg: "bg-amber-100 text-amber-800"
    },
    endpoint: "/api/table/leave_requests",
    metrics: [
      { label: "Total Applications", key: "totalApplied", format: "number" },
      { label: "Approved Leaves", key: "approvedCount", format: "number" },
      { label: "Pending Approvals", key: "pendingCount", format: "number" },
      { label: "Avg Leave Utilization", key: "utilization", format: "percent" }
    ],
    columns: [
      { key: "empId", label: "EMP Code" },
      { key: "employee", label: "Employee Name" },
      { key: "leaveType", label: "Leave Type" },
      { key: "fromDate", label: "From Date" },
      { key: "toDate", label: "To Date" },
      { key: "days", label: "Days" },
      { key: "reason", label: "Reason" },
      { key: "status", label: "Status" }
    ],
    sampleData: [
      { id: "1", empId: "EMP003", employee: "John Doe", leaveType: "Casual Leave", fromDate: "2025-09-10", toDate: "2025-09-11", days: 2, reason: "Family event", status: "Approved" },
      { id: "2", empId: "EMP004", employee: "Aman Verma", leaveType: "Sick Leave", fromDate: "2025-09-04", toDate: "2025-09-05", days: 2, reason: "Viral fever", status: "Approved" },
      { id: "3", empId: "EMP005", employee: "Priya Sharma", leaveType: "Earned Leave", fromDate: "2025-09-15", toDate: "2025-09-19", days: 5, reason: "Vacation", status: "Pending" },
      { id: "4", empId: "EMP002", employee: "HR Manager", leaveType: "Casual Leave", fromDate: "2025-08-20", toDate: "2025-08-20", days: 1, reason: "Personal errand", status: "Approved" }
    ]
  },
  {
    id: "Payroll",
    title: "Payroll",
    categoryTab: "Payroll Report",
    description: "Generate payroll summaries and salary reports.",
    icon: BanknotesIcon,
    theme: {
      bgIcon: "bg-purple-50",
      textIcon: "text-purple-600",
      btnBorder: "border-purple-500",
      btnText: "text-purple-600",
      btnHover: "hover:bg-purple-50",
      tagBg: "bg-purple-100 text-purple-800"
    },
    endpoint: "/api/table/payroll_process",
    metrics: [
      { label: "Total Gross Payout", key: "totalGross", format: "currency" },
      { label: "Total Net Salary", key: "totalNet", format: "currency" },
      { label: "Total Deductions", key: "totalDeductions", format: "currency" },
      { label: "Disbursal Rate", key: "disbursalRate", format: "percent" }
    ],
    columns: [
      { key: "monthYear", label: "Payroll Cycle" },
      { key: "empId", label: "EMP Code" },
      { key: "employee", label: "Employee" },
      { key: "department", label: "Department" },
      { key: "basicSalary", label: "Basic Pay" },
      { key: "grossSalary", label: "Gross Salary" },
      { key: "totalDeduction", label: "Deductions" },
      { key: "netSalary", label: "Net Payable" },
      { key: "paymentStatus", label: "Payment Status" }
    ],
    sampleData: [
      { id: "1", monthYear: "August 2025", empId: "EMP001", employee: "Super Admin", department: "Administration", basicSalary: "₹65,000", grossSalary: "₹1,20,000", totalDeduction: "₹12,500", netSalary: "₹1,07,500", paymentStatus: "Paid" },
      { id: "2", monthYear: "August 2025", empId: "EMP002", employee: "HR Manager", department: "Human Resources", basicSalary: "₹50,000", grossSalary: "₹95,000", totalDeduction: "₹9,800", netSalary: "₹85,200", paymentStatus: "Paid" },
      { id: "3", monthYear: "August 2025", empId: "EMP003", employee: "John Doe", department: "Engineering", basicSalary: "₹55,000", grossSalary: "₹1,05,000", totalDeduction: "₹11,200", netSalary: "₹93,800", paymentStatus: "Paid" },
      { id: "4", monthYear: "August 2025", empId: "EMP004", employee: "Aman Verma", department: "Marketing", basicSalary: "₹38,000", grossSalary: "₹72,000", totalDeduction: "₹6,800", netSalary: "₹65,200", paymentStatus: "Paid" }
    ]
  },
  {
    id: "Recruitment",
    title: "Recruitment",
    categoryTab: "Recruitment Report",
    description: "Track recruitment activities and hiring performance.",
    icon: UserPlusIcon,
    theme: {
      bgIcon: "bg-teal-50",
      textIcon: "text-teal-600",
      btnBorder: "border-teal-500",
      btnText: "text-teal-600",
      btnHover: "hover:bg-teal-50",
      tagBg: "bg-teal-100 text-teal-800"
    },
    endpoint: "/api/table/job_postings",
    metrics: [
      { label: "Active Openings", key: "openings", format: "number" },
      { label: "Total Candidates", key: "candidates", format: "number" },
      { label: "Avg Time-to-Hire", key: "timeToHire", format: "days" },
      { label: "Offer Acceptance", key: "acceptanceRate", format: "percent" }
    ],
    columns: [
      { key: "jobCode", label: "Job Code" },
      { key: "title", label: "Position Title" },
      { key: "department", label: "Department" },
      { key: "openings", label: "Openings" },
      { key: "applicationsCount", label: "Applicants" },
      { key: "experienceRequired", label: "Experience" },
      { key: "postedDate", label: "Posted On" },
      { key: "status", label: "Status" }
    ],
    sampleData: [
      { id: "1", jobCode: "JOB-101", title: "Senior React Developer", department: "Engineering", openings: "3", applicationsCount: "42", experienceRequired: "4-6 yrs", postedDate: "2025-08-10", status: "Active" },
      { id: "2", jobCode: "JOB-102", title: "HR Generalist", department: "Human Resources", openings: "1", applicationsCount: "19", experienceRequired: "2-4 yrs", postedDate: "2025-08-15", status: "Active" },
      { id: "3", jobCode: "JOB-103", title: "Product Marketing Manager", department: "Marketing", openings: "2", applicationsCount: "28", experienceRequired: "3-5 yrs", postedDate: "2025-08-22", status: "Active" },
      { id: "4", jobCode: "JOB-104", title: "Financial Analyst", department: "Finance", openings: "1", applicationsCount: "15", experienceRequired: "2-3 yrs", postedDate: "2025-07-25", status: "Closed" }
    ]
  },
  {
    id: "Performance",
    title: "Performance",
    categoryTab: "Performance Report",
    description: "Analyze performance reviews and employee ratings.",
    icon: ArrowTrendingUpIcon,
    theme: {
      bgIcon: "bg-rose-50",
      textIcon: "text-rose-500",
      btnBorder: "border-rose-500",
      btnText: "text-rose-600",
      btnHover: "hover:bg-rose-50",
      tagBg: "bg-rose-100 text-rose-800"
    },
    endpoint: "/api/table/performance_reviews",
    metrics: [
      { label: "Reviews Completed", key: "completedReviews", format: "number" },
      { label: "Avg Org Rating", key: "avgRating", format: "rating" },
      { label: "Top Performers", key: "topPerformers", format: "number" },
      { label: "Promotion Pipeline", key: "promotions", format: "number" }
    ],
    columns: [
      { key: "reviewCycle", label: "Cycle" },
      { key: "empId", label: "EMP Code" },
      { key: "employee", label: "Employee" },
      { key: "department", label: "Department" },
      { key: "manager", label: "Reviewer" },
      { key: "selfScore", label: "Self Rating" },
      { key: "managerScore", label: "Manager Rating" },
      { key: "finalRating", label: "Final Grade" },
      { key: "status", label: "Review Status" }
    ],
    sampleData: [
      { id: "1", reviewCycle: "Q2 2025", empId: "EMP003", employee: "John Doe", department: "Engineering", manager: "Super Admin", selfScore: "4.5", managerScore: "4.8", finalRating: "Exceeds Expectations", status: "Completed" },
      { id: "2", reviewCycle: "Q2 2025", empId: "EMP004", employee: "Aman Verma", department: "Marketing", manager: "HR Manager", selfScore: "4.2", managerScore: "4.3", finalRating: "Meets Expectations", status: "Completed" },
      { id: "3", reviewCycle: "Q2 2025", empId: "EMP005", employee: "Priya Sharma", department: "Finance", manager: "Super Admin", selfScore: "4.6", managerScore: "4.7", finalRating: "Exceeds Expectations", status: "Completed" }
    ]
  },
  {
    id: "Training",
    title: "Training",
    categoryTab: "Training Report",
    description: "View training progress and certification reports.",
    icon: AcademicCapIcon,
    theme: {
      bgIcon: "bg-sky-50",
      textIcon: "text-sky-600",
      btnBorder: "border-sky-500",
      btnText: "text-sky-600",
      btnHover: "hover:bg-sky-50",
      tagBg: "bg-sky-100 text-sky-800"
    },
    endpoint: "/api/table/training_records",
    metrics: [
      { label: "Total Sessions", key: "totalSessions", format: "number" },
      { label: "Enrolled Learners", key: "enrolledLearners", format: "number" },
      { label: "Completion Rate", key: "completionRate", format: "percent" },
      { label: "Avg Feedback Score", key: "avgFeedback", format: "rating" }
    ],
    columns: [
      { key: "trainingCode", label: "Training Code" },
      { key: "trainingName", label: "Session Topic" },
      { key: "trainingCategory", label: "Category" },
      { key: "trainer", label: "Instructor" },
      { key: "startDate", label: "Start Date" },
      { key: "duration", label: "Duration" },
      { key: "maxParticipants", label: "Capacity" },
      { key: "status", label: "Status" }
    ],
    sampleData: [
      { id: "1", trainingCode: "TRN-501", trainingName: "Cloud Infrastructure & Docker", trainingCategory: "Technical", trainer: "Alex Rivera", startDate: "2025-09-12", duration: "16 hours", maxParticipants: "25", status: "Planned" },
      { id: "2", trainingCode: "TRN-502", trainingName: "Advanced HR Analytics", trainingCategory: "Domain", trainer: "Dr. Evelyn Reed", startDate: "2025-08-18", duration: "8 hours", maxParticipants: "15", status: "Completed" },
      { id: "3", trainingCode: "TRN-503", trainingName: "Leadership & Team Communication", trainingCategory: "Soft Skills", trainer: "Michael Chang", startDate: "2025-08-05", duration: "12 hours", maxParticipants: "30", status: "Completed" }
    ]
  },
  {
    id: "Compliance",
    title: "Compliance",
    categoryTab: "Compliance Report",
    description: "Monitor compliance status and regulatory reports.",
    icon: ShieldCheckIcon,
    theme: {
      bgIcon: "bg-emerald-50",
      textIcon: "text-emerald-600",
      btnBorder: "border-emerald-500",
      btnText: "text-emerald-600",
      btnHover: "hover:bg-emerald-50",
      tagBg: "bg-emerald-100 text-emerald-800"
    },
    endpoint: "/api/table/statutory_compliance",
    metrics: [
      { label: "Compliance Score", key: "score", format: "percent" },
      { label: "Filings Done", key: "filingsDone", format: "number" },
      { label: "Audits Cleared", key: "auditsCleared", format: "number" },
      { label: "Pending Regulatory", key: "pendingFilings", format: "number" }
    ],
    columns: [
      { key: "complianceItem", label: "Statutory Law / Standard" },
      { key: "regulator", label: "Governing Authority" },
      { key: "dueDate", label: "Due Date" },
      { key: "filingDate", label: "Filing Date" },
      { key: "challanNo", label: "Challan / Ref No." },
      { key: "penalties", label: "Penalty Amount" },
      { key: "status", label: "Compliance Status" }
    ],
    sampleData: [
      { id: "1", complianceItem: "Provident Fund (PF) ECR Filing", regulator: "EPFO India", dueDate: "2025-09-15", filingDate: "2025-09-10", challanNo: "PF-202509-883", penalties: "₹0", status: "Compliant" },
      { id: "2", complianceItem: "ESIC Monthly Contribution", regulator: "ESIC Corp", dueDate: "2025-09-15", filingDate: "2025-09-11", challanNo: "ESI-77312-90", penalties: "₹0", status: "Compliant" },
      { id: "3", complianceItem: "Professional Tax (PT) Monthly Return", regulator: "State Revenue Dept", dueDate: "2025-09-20", filingDate: "--", challanNo: "--", penalties: "₹0", status: "In Progress" },
      { id: "4", complianceItem: "TDS Quarterly Statement (24Q)", regulator: "Income Tax Dept", dueDate: "2025-10-31", filingDate: "--", challanNo: "--", penalties: "₹0", status: "Upcoming" }
    ]
  },
  {
    id: "Attrition",
    title: "Attrition",
    categoryTab: "Attrition Report",
    description: "Analyze attrition trends and turnover statistics.",
    icon: UserMinusIcon,
    theme: {
      bgIcon: "bg-orange-50",
      textIcon: "text-orange-500",
      btnBorder: "border-orange-500",
      btnText: "text-orange-600",
      btnHover: "hover:bg-orange-50",
      tagBg: "bg-orange-100 text-orange-800"
    },
    endpoint: "/api/table/exit_requests",
    metrics: [
      { label: "Annual Attrition Rate", key: "rate", format: "percent" },
      { label: "Total Exits (YTD)", key: "totalExits", format: "number" },
      { label: "Voluntary Resignations", key: "voluntary", format: "number" },
      { label: "Avg Tenure at Exit", key: "avgTenure", format: "years" }
    ],
    columns: [
      { key: "empId", label: "EMP Code" },
      { key: "employee", label: "Employee" },
      { key: "department", label: "Department" },
      { key: "resignationDate", label: "Resignation Date" },
      { key: "lastWorkingDay", label: "LWD" },
      { key: "reason", label: "Primary Reason" },
      { key: "clearanceStatus", label: "Clearance" },
      { key: "fnfStatus", label: "F&F Status" }
    ],
    sampleData: [
      { id: "1", empId: "EMP089", employee: "Rohan Kapoor", department: "Engineering", resignationDate: "2025-07-15", lastWorkingDay: "2025-08-15", reason: "Higher Education", clearanceStatus: "Completed", fnfStatus: "Settled" },
      { id: "2", empId: "EMP104", employee: "Sneha Patel", department: "Marketing", resignationDate: "2025-08-01", lastWorkingDay: "2025-08-31", reason: "Better Career Opportunity", clearanceStatus: "Completed", fnfStatus: "Settled" },
      { id: "3", empId: "EMP112", employee: "Vikram Malhotra", department: "Operations", resignationDate: "2025-08-20", lastWorkingDay: "2025-09-20", reason: "Relocation", clearanceStatus: "In Progress", fnfStatus: "Pending" }
    ]
  },
  {
    id: "Custom Reports",
    title: "Custom Reports",
    categoryTab: "Custom Reports",
    description: "Create and manage custom reports as per requirements.",
    icon: DocumentTextIcon,
    theme: {
      bgIcon: "bg-indigo-50",
      textIcon: "text-indigo-600",
      btnBorder: "border-indigo-500",
      btnText: "text-indigo-600",
      btnHover: "hover:bg-indigo-50",
      tagBg: "bg-indigo-100 text-indigo-800"
    },
    endpoint: "/api/table/custom_reports",
    metrics: [
      { label: "Saved Reports", key: "savedReports", format: "number" },
      { label: "Scheduled Runs", key: "scheduled", format: "number" },
      { label: "Generated Today", key: "generatedToday", format: "number" },
      { label: "Custom Datasets", key: "datasets", format: "number" }
    ],
    columns: [
      { key: "reportName", label: "Report Name" },
      { key: "moduleSource", label: "Module Source" },
      { key: "filterCriteria", label: "Selected Columns" },
      { key: "frequency", label: "Frequency" },
      { key: "lastRun", label: "Last Generated" },
      { key: "createdBy", label: "Created By" },
      { key: "status", label: "Status" }
    ],
    sampleData: [
      { id: "1", reportName: "Monthly Overtime vs Payout", moduleSource: "Attendance & Payroll", filterCriteria: "EMP, Hours, OT Pay, Dept", frequency: "Monthly", lastRun: "2025-09-01", createdBy: "HR Manager", status: "Active" },
      { id: "2", reportName: "Probation Confirmation Pipeline", moduleSource: "Employees", filterCriteria: "EMP, JoinDate, ReviewDate", frequency: "Weekly", lastRun: "2025-09-03", createdBy: "HR Manager", status: "Active" },
      { id: "3", reportName: "Department Budget & Headcount", moduleSource: "Org & Finance", filterCriteria: "Dept, Headcount, Cost, Budget", frequency: "Quarterly", lastRun: "2025-07-01", createdBy: "Super Admin", status: "Active" }
    ]
  }
];
