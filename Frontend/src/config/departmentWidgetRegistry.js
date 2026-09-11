// Frontend/src/config/departmentWidgetRegistry.js

/**
 * Predefined Widget Registry mapping enterprise HRMS modules to their respective
 * KPI cards, analytics charts, data tables, quick actions, and activity indicators.
 */
export const MODULE_WIDGET_REGISTRY = {
  "Employee Management": {
    category: "HR",
    kpis: [
      { id: "emp_count", label: "Total Employees", value: "148", change: "+6% this mo", trend: "up", color: "from-blue-600 to-indigo-600", icon: "UserGroupIcon" },
      { id: "active_staff", label: "Active Staff", value: "142", change: "96% Active", trend: "up", color: "from-emerald-600 to-teal-600", icon: "CheckCircleIcon" },
      { id: "new_hires", label: "New Onboarded", value: "12", change: "+4 this week", trend: "up", color: "from-purple-600 to-pink-600", icon: "UserPlusIcon" }
    ],
    quickActions: [
      { id: "add_emp", label: "Add Employee", icon: "UserPlusIcon", color: "bg-blue-600 hover:bg-blue-700 text-white" },
      { id: "emp_dir", label: "View Directory", icon: "FolderIcon", color: "bg-slate-800 hover:bg-slate-900 text-white" }
    ],
    chart: {
      type: "bar",
      title: "Employee Growth & Department Allocation",
      labels: ["Engineering", "Sales", "Operations", "Support", "Marketing"],
      data: [45, 38, 28, 22, 15]
    },
    table: {
      title: "Recent Employee Onboardings",
      columns: ["Employee", "Designation", "Join Date", "Status"],
      rows: [
        { c1: "Alex Morgan", c2: "Senior Software Engineer", c3: "2026-07-01", c4: "Active", badge: "emerald" },
        { c1: "Sophia Lin", c2: "Product Designer", c3: "2026-07-05", c4: "Active", badge: "emerald" },
        { c1: "Marcus Vance", c2: "DevOps Engineer", c3: "2026-07-12", c4: "Onboarding", badge: "amber" }
      ]
    }
  },

  "Attendance": {
    category: "HR",
    kpis: [
      { id: "att_rate", label: "Today's Attendance", value: "94.2%", change: "+1.8% vs avg", trend: "up", color: "from-emerald-600 to-teal-700", icon: "ClockIcon" },
      { id: "present_count", label: "Present Today", value: "139", change: "139 / 148", trend: "neutral", color: "from-blue-600 to-cyan-600", icon: "CheckBadgeIcon" },
      { id: "late_checkin", label: "Late Check-ins", value: "4", change: "-2 from yesterday", trend: "down", color: "from-amber-500 to-orange-600", icon: "ExclamationCircleIcon" }
    ],
    quickActions: [
      { id: "mark_att", label: "Record Punch", icon: "ClockIcon", color: "bg-emerald-600 hover:bg-emerald-700 text-white" },
      { id: "att_report", label: "Attendance Report", icon: "DocumentChartBarIcon", color: "bg-indigo-600 hover:bg-indigo-700 text-white" }
    ],
    chart: {
      type: "line",
      title: "Weekly Attendance Trend (%)",
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      data: [92, 96, 95, 94, 91]
    },
    table: {
      title: "Today's Attendance Logs",
      columns: ["Employee", "Check In", "Check Out", "Status"],
      rows: [
        { c1: "David Miller", c2: "08:58 AM", c3: "05:30 PM", c4: "On Time", badge: "emerald" },
        { c1: "Sarah Jenkins", c2: "09:22 AM", c3: "Pending", c4: "Late Check-in", badge: "amber" },
        { c1: "Robert Fox", c2: "08:45 AM", c3: "05:15 PM", c4: "On Time", badge: "emerald" }
      ]
    }
  },

  "Leave Management": {
    category: "HR",
    kpis: [
      { id: "pending_leaves", label: "Pending Leave Approvals", value: "8", change: "3 urgent", trend: "neutral", color: "from-amber-600 to-orange-700", icon: "CalendarIcon" },
      { id: "on_leave_today", label: "On Leave Today", value: "5", change: "3.3% of staff", trend: "neutral", color: "from-rose-600 to-red-700", icon: "UserMinusIcon" }
    ],
    quickActions: [
      { id: "app_leave", label: "Approve Leaves", icon: "CheckIcon", color: "bg-emerald-600 hover:bg-emerald-700 text-white" },
      { id: "req_leave", label: "Submit Request", icon: "PaperAirplaneIcon", color: "bg-blue-600 hover:bg-blue-700 text-white" }
    ],
    chart: {
      type: "pie",
      title: "Leave Type Distribution",
      labels: ["Casual Leave", "Sick Leave", "Paid Leave", "Unpaid"],
      data: [40, 25, 25, 10]
    },
    table: {
      title: "Pending Leave Requests",
      columns: ["Employee", "Leave Type", "Duration", "Action Status"],
      rows: [
        { c1: "Jessica Alba", c2: "Casual Leave", c3: "2 Days (Jul 22-23)", c4: "Pending Review", badge: "amber" },
        { c1: "Michael Scott", c2: "Sick Leave", c3: "1 Day (Jul 21)", c4: "Pending Review", badge: "amber" }
      ]
    }
  },

  "Payroll": {
    category: "Finance",
    kpis: [
      { id: "monthly_payroll", label: "Monthly Payroll", value: "$184,500", change: "July Cycle", trend: "neutral", color: "from-violet-600 to-purple-800", icon: "CurrencyDollarIcon" },
      { id: "payout_status", label: "Disbursement Status", value: "100%", change: "Completed", trend: "up", color: "from-emerald-600 to-green-700", icon: "CreditCardIcon" }
    ],
    quickActions: [
      { id: "proc_pay", label: "Process Payroll", icon: "BanknotesIcon", color: "bg-violet-600 hover:bg-violet-700 text-white" },
      { id: "dl_slips", label: "Download Slips", icon: "DocumentArrowDownIcon", color: "bg-slate-800 hover:bg-slate-900 text-white" }
    ],
    chart: {
      type: "bar",
      title: "Monthly Payroll Expense ($k)",
      labels: ["Feb", "Mar", "Apr", "May", "Jun", "Jul"],
      data: [175, 178, 180, 182, 183, 184]
    },
    table: {
      title: "Recent Payroll Disbursals",
      columns: ["Department", "Employees", "Gross Total", "Disbursal Status"],
      rows: [
        { c1: "Engineering", c2: "45", c3: "$72,000", c4: "Processed", badge: "emerald" },
        { c1: "Sales", c2: "38", c3: "$54,000", c4: "Processed", badge: "emerald" },
        { c1: "Operations", c2: "28", c3: "$32,500", c4: "Processed", badge: "emerald" }
      ]
    }
  },

  "Overtime": {
    category: "Operations",
    kpis: [
      { id: "ot_approved_hrs", label: "Approved OT Hours", value: "128 hrs", change: "1.5x / 2.0x Rate", trend: "up", color: "from-amber-600 to-yellow-600", icon: "ClockIcon" },
      { id: "ot_payout_est", label: "Est. OT Payout", value: "$3,840", change: "+12% vs last mo", trend: "neutral", color: "from-emerald-600 to-teal-700", icon: "CurrencyDollarIcon" }
    ],
    quickActions: [
      { id: "app_ot", label: "Approve OT Claims", icon: "CheckIcon", color: "bg-amber-600 hover:bg-amber-700 text-white" },
      { id: "ot_config", label: "OT Multipliers", icon: "ClockIcon", color: "bg-slate-800 hover:bg-slate-900 text-white" }
    ],
    chart: {
      type: "bar",
      title: "Weekly Department Overtime (Hours)",
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      data: [18, 24, 30, 22, 28, 15]
    },
    table: {
      title: "Recent Overtime Submissions",
      columns: ["Employee", "Hours", "Multiplier", "Status"],
      rows: [
        { c1: "Alex Morgan", c2: "4.5 Hrs", c3: "1.5x Rate", c4: "Approved", badge: "emerald" },
        { c1: "Marcus Vance", c2: "3.0 Hrs", c3: "2.0x Holiday Rate", c4: "Pending Review", badge: "amber" }
      ]
    }
  },

  "Holiday": {
    category: "Operations",
    kpis: [
      { id: "upcoming_holidays", label: "Holidays This Quarter", value: "6 Days", change: "Next: Independence Day", trend: "neutral", color: "from-blue-600 to-indigo-700", icon: "CalendarIcon" },
      { id: "mandatory_count", label: "Company Mandatory", value: "4 Days", change: "100% Paid", trend: "up", color: "from-purple-600 to-indigo-800", icon: "CheckCircleIcon" }
    ],
    quickActions: [
      { id: "add_holiday", label: "Add Holiday", icon: "PlusIcon", color: "bg-blue-600 hover:bg-blue-700 text-white" },
      { id: "cal_view", label: "Annual Calendar", icon: "CalendarIcon", color: "bg-slate-800 hover:bg-slate-900 text-white" }
    ],
    chart: {
      type: "pie",
      title: "Holiday Classification Breakdown",
      labels: ["National", "Public", "Restricted", "Company Mandatory"],
      data: [40, 30, 20, 10]
    },
    table: {
      title: "Upcoming Holiday Schedule",
      columns: ["Holiday Name", "Date", "Day", "Category"],
      rows: [
        { c1: "Independence Day", c2: "2026-08-15", c3: "Saturday", c4: "National", badge: "purple" },
        { c1: "Labor Day / Regional", c2: "2026-09-07", c3: "Monday", c4: "Public", badge: "blue" }
      ]
    }
  },

  "Bonus": {
    category: "Finance",
    kpis: [
      { id: "bonus_schemes", label: "Active Bonus Plans", value: "5 Schemes", change: "Diwali & Performance", trend: "up", color: "from-emerald-600 to-teal-700", icon: "CurrencyDollarIcon" },
      { id: "est_disbursal", label: "Est. Bonus Payout", value: "$45,000", change: "Q3 Allocation", trend: "up", color: "from-violet-600 to-purple-800", icon: "BanknotesIcon" }
    ],
    quickActions: [
      { id: "create_bonus", label: "Configure Scheme", icon: "PlusIcon", color: "bg-emerald-600 hover:bg-emerald-700 text-white" },
      { id: "calc_bonus", label: "Run Payout Est", icon: "CurrencyDollarIcon", color: "bg-slate-800 hover:bg-slate-900 text-white" }
    ],
    chart: {
      type: "bar",
      title: "Bonus Distribution by Type ($k)",
      labels: ["Performance", "Festive", "Statutory", "Milestone"],
      data: [20, 15, 7, 3]
    },
    table: {
      title: "Department Bonus Plans",
      columns: ["Bonus Plan", "Type", "Calculation Mode", "Target Dept"],
      rows: [
        { c1: "Q3 Performance Award", c2: "Performance", c3: "10% of Basic", c4: "Engineering", badge: "emerald" },
        { c1: "Annual Festival Allowance", c2: "Festive/Diwali", c3: "Fixed $500", c4: "All Departments", badge: "blue" }
      ]
    }
  },

  "TDS": {
    category: "Finance",
    kpis: [
      { id: "tds_verified", label: "Declarations Verified", value: "92%", change: "136 / 148", trend: "up", color: "from-cyan-600 to-blue-700", icon: "DocumentCheckIcon" },
      { id: "std_deduction", label: "Standard Deduction", value: "$75,000", change: "Sec 115BAC", trend: "neutral", color: "from-indigo-600 to-purple-700", icon: "ChartBarIcon" }
    ],
    quickActions: [
      { id: "verify_tds", label: "Verify Tax Proofs", icon: "DocumentCheckIcon", color: "bg-cyan-600 hover:bg-cyan-700 text-white" },
      { id: "tds_slabs", label: "Tax Regime Config", icon: "ChartBarIcon", color: "bg-slate-800 hover:bg-slate-900 text-white" }
    ],
    chart: {
      type: "pie",
      title: "Tax Regime Selection Breakdown",
      labels: ["New Tax Regime (Sec 115BAC)", "Old Tax Regime"],
      data: [78, 22]
    },
    table: {
      title: "Recent TDS Verification Submissions",
      columns: ["Employee", "Regime", "80C Claim", "Status"],
      rows: [
        { c1: "Alex Morgan", c2: "New Tax Regime", c3: "N/A (Standard)", c4: "Verified", badge: "emerald" },
        { c1: "Sophia Lin", c2: "Old Tax Regime", c3: "$1,500 Claim", c4: "Pending Proof", badge: "amber" }
      ]
    }
  },

  "Performance": {
    category: "Talent",
    kpis: [
      { id: "avg_perf", label: "Avg Performance Score", value: "4.6 / 5.0", change: "+0.3 vs last Q", trend: "up", color: "from-amber-500 to-orange-600", icon: "StarIcon" },
      { id: "reviews_done", label: "Q3 Reviews Completed", value: "88%", change: "130 / 148", trend: "up", color: "from-emerald-600 to-teal-600", icon: "DocumentCheckIcon" }
    ],
    quickActions: [
      { id: "start_review", label: "Start Review", icon: "DocumentPlusIcon", color: "bg-amber-600 hover:bg-amber-700 text-white" }
    ],
    chart: {
      type: "bar",
      title: "Department Performance Ratings Breakdown",
      labels: ["Exceeds", "Meets Expectations", "Needs Improvement"],
      data: [35, 55, 10]
    },
    table: {
      title: "Top Performing Staff This Month",
      columns: ["Employee", "Department", "Rating", "Key Goal Accomplished"],
      rows: [
        { c1: "Alex Morgan", c2: "Engineering", c3: "4.9 / 5.0", c4: "Delivered Microservices Migration", badge: "emerald" },
        { c1: "Sophia Lin", c2: "Design", c3: "4.8 / 5.0", c4: "Redesigned Design System 2.0", badge: "emerald" }
      ]
    }
  },

  "Asset Management": {
    category: "IT",
    kpis: [
      { id: "total_assets", label: "Total IT Assets", value: "320", change: "+14 new laptops", trend: "up", color: "from-cyan-600 to-blue-700", icon: "ComputerDesktopIcon" },
      { id: "assigned_assets", label: "Allocated Devices", value: "285", change: "89% utilized", trend: "up", color: "from-indigo-600 to-blue-800", icon: "DeviceTabletIcon" },
      { id: "maintenance_assets", label: "In Maintenance", value: "12", change: "3 in repair", trend: "down", color: "from-amber-600 to-yellow-600", icon: "WrenchIcon" }
    ],
    quickActions: [
      { id: "alloc_asset", label: "Allocate Device", icon: "PlusIcon", color: "bg-cyan-600 hover:bg-cyan-700 text-white" },
      { id: "asset_audit", label: "Asset Audit Log", icon: "ClipboardDocumentCheckIcon", color: "bg-slate-800 hover:bg-slate-900 text-white" }
    ],
    chart: {
      type: "pie",
      title: "Asset Breakdown by Category",
      labels: ["Laptops", "Desktops", "Monitors", "Mobiles", "Servers"],
      data: [45, 20, 20, 10, 5]
    },
    table: {
      title: "Recent Asset Allocations",
      columns: ["Asset Tag", "Device Type", "Assigned Employee", "Condition"],
      rows: [
        { c1: "AST-MBP-089", c2: "MacBook Pro M3", c3: "Alex Morgan", c4: "Excellent", badge: "emerald" },
        { c1: "AST-DELL-142", c2: "Dell XPS 15", c3: "Sophia Lin", c4: "Good", badge: "emerald" },
        { c1: "AST-MON-204", c2: "LG 27 4K Monitor", c3: "Marcus Vance", c4: "Fair", badge: "blue" }
      ]
    }
  },

  "Helpdesk": {
    category: "IT",
    kpis: [
      { id: "open_tickets", label: "Open IT Tickets", value: "8", change: "-4 resolved today", trend: "up", color: "from-rose-600 to-red-700", icon: "TicketIcon" },
      { id: "avg_resolution", label: "Avg Resolution Time", value: "2.4 hrs", change: "-30m faster", trend: "up", color: "from-emerald-600 to-teal-700", icon: "ClockIcon" },
      { id: "system_health", label: "System Health", value: "99.8%", change: "All Systems Operational", trend: "up", color: "from-blue-600 to-indigo-700", icon: "CpuChipIcon" }
    ],
    quickActions: [
      { id: "create_ticket", label: "Log IT Ticket", icon: "PlusIcon", color: "bg-rose-600 hover:bg-rose-700 text-white" },
      { id: "ticket_board", label: "Helpdesk Board", icon: "QueueListIcon", color: "bg-indigo-600 hover:bg-indigo-700 text-white" }
    ],
    chart: {
      type: "line",
      title: "Weekly Ticket Resolution Rate",
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      data: [18, 24, 20, 28, 22]
    },
    table: {
      title: "High Priority Support Tickets",
      columns: ["Ticket ID", "Subject", "Requester", "Priority", "Status"],
      rows: [
        { c1: "#TK-4089", c2: "VPN Access Refused", c3: "David Miller", c4: "High", c5: "In Progress", badge: "amber" },
        { c1: "#TK-4091", c2: "Monitor Flicker Issue", c3: "Sarah Jenkins", c4: "Medium", c5: "Assigned", badge: "blue" }
      ]
    }
  },

  "Recruitment & Onboarding": {
    category: "Talent",
    kpis: [
      { id: "open_jobs", label: "Active Job Openings", value: "14", change: "5 roles priority", trend: "up", color: "from-purple-600 to-indigo-700", icon: "BriefcaseIcon" },
      { id: "candidates", label: "Total Candidates", value: "342", change: "+28 this week", trend: "up", color: "from-blue-600 to-cyan-700", icon: "UserGroupIcon" }
    ],
    quickActions: [
      { id: "post_job", label: "Post New Job", icon: "PlusIcon", color: "bg-purple-600 hover:bg-purple-700 text-white" },
      { id: "pipeline", label: "Talent Pipeline", icon: "FunnelIcon", color: "bg-slate-800 hover:bg-slate-900 text-white" }
    ],
    chart: {
      type: "bar",
      title: "Candidate Recruitment Funnel",
      labels: ["Applied", "Screened", "Interviewed", "Offered", "Hired"],
      data: [342, 180, 45, 12, 8]
    },
    table: {
      title: "Upcoming Candidate Interviews",
      columns: ["Candidate", "Position", "Date & Time", "Stage"],
      rows: [
        { c1: "Elena Rostova", c2: "Senior Frontend Lead", c3: "Today 03:00 PM", c4: "Final Technical", badge: "purple" },
        { c1: "Carlos Mendez", c2: "DevOps Engineer", c3: "Tomorrow 11:30 AM", c4: "HR Culture Fit", badge: "blue" }
      ]
    }
  },

  "Reports": {
    category: "Analytics",
    kpis: [
      { id: "gen_reports", label: "Monthly Reports Generated", value: "42", change: "100% compliant", trend: "up", color: "from-indigo-600 to-violet-800", icon: "ChartBarIcon" }
    ],
    quickActions: [
      { id: "gen_pdf", label: "Export Full Report", icon: "ArrowDownTrayIcon", color: "bg-indigo-600 hover:bg-indigo-700 text-white" }
    ],
    chart: {
      type: "line",
      title: "Monthly HRMS Analytics Audit Log Trend",
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      data: [120, 140, 180, 210, 250, 310]
    },
    table: {
      title: "Available Executive Data Reports",
      columns: ["Report Title", "Category", "Last Generated", "Format"],
      rows: [
        { c1: "Annual Headcount & Turnover Summary", c2: "Workforce", c3: "2026-07-15", c4: "PDF / Excel", badge: "blue" },
        { c1: "Quarterly Compensation & Payroll Audit", c2: "Finance", c3: "2026-07-01", c4: "CSV", badge: "indigo" }
      ]
    }
  },

  "Organization Setup": {
    category: "Core",
    kpis: [
      { id: "active_branches", label: "Active Offices & Branches", value: "8", change: "HQ & Regionals", trend: "up", color: "from-blue-600 to-indigo-700", icon: "BuildingOffice2Icon" },
      { id: "cost_centers", label: "Cost Centers", value: "14", change: "100% Allocated", trend: "neutral", color: "from-emerald-600 to-teal-700", icon: "BriefcaseIcon" }
    ],
    quickActions: [
      { id: "add_branch", label: "Add Branch", icon: "PlusIcon", color: "bg-blue-600 hover:bg-blue-700 text-white" },
      { id: "org_chart", label: "View Org Chart", icon: "FolderIcon", color: "bg-slate-800 hover:bg-slate-900 text-white" }
    ],
    chart: {
      type: "bar",
      title: "Branch Headcount Distribution",
      labels: ["Delhi HQ", "Mumbai Regional", "Bengaluru Tech", "Hyderabad R&D", "Pune Office"],
      data: [65, 30, 28, 15, 10]
    },
    table: {
      title: "Registered Organization Branches",
      columns: ["Branch Code", "Branch Name", "City / Location", "Status"],
      rows: [
        { c1: "NIB-HO", c2: "NIB Head Office", c3: "New Delhi", c4: "Active", badge: "emerald" },
        { c1: "NIB-BLR", c2: "Bengaluru Tech Hub", c3: "Bengaluru", c4: "Active", badge: "emerald" }
      ]
    }
  },

  "Learning": {
    category: "Talent",
    kpis: [
      { id: "active_courses", label: "Enrolled Training Courses", value: "18", change: "+4 new modules", trend: "up", color: "from-purple-600 to-pink-700", icon: "AcademicCapIcon" },
      { id: "lms_completion", label: "Avg Course Completion", value: "84%", change: "+5% vs Q2", trend: "up", color: "from-emerald-600 to-teal-600", icon: "CheckCircleIcon" }
    ],
    quickActions: [
      { id: "enroll_staff", label: "Enroll Employee", icon: "PlusIcon", color: "bg-purple-600 hover:bg-purple-700 text-white" },
      { id: "lms_catalog", label: "Course Catalog", icon: "FolderIcon", color: "bg-slate-800 hover:bg-slate-900 text-white" }
    ],
    chart: {
      type: "line",
      title: "Monthly LMS Course Completion Count",
      labels: ["Feb", "Mar", "Apr", "May", "Jun", "Jul"],
      data: [35, 42, 58, 65, 78, 92]
    },
    table: {
      title: "Active Learning & Development Programs",
      columns: ["Course Name", "Category", "Enrolled Staff", "Completion Rate"],
      rows: [
        { c1: "Enterprise Security & Compliance 2026", c2: "Compliance", c3: "148 Staff", c4: "95%", badge: "emerald" },
        { c1: "React & TypeScript Masterclass", c2: "Technical", c3: "42 Staff", c4: "72%", badge: "blue" }
      ]
    }
  },

  "Document Management": {
    category: "Support",
    kpis: [
      { id: "verified_docs", label: "Verified Documents", value: "482", change: "98% verified", trend: "up", color: "from-cyan-600 to-blue-700", icon: "DocumentCheckIcon" },
      { id: "expiring_contracts", label: "Expiring Contracts", value: "3", change: "Action required", trend: "down", color: "from-amber-600 to-orange-700", icon: "ExclamationCircleIcon" }
    ],
    quickActions: [
      { id: "upload_doc", label: "Upload Document", icon: "PlusIcon", color: "bg-cyan-600 hover:bg-cyan-700 text-white" }
    ],
    chart: {
      type: "pie",
      title: "Document Classification Breakdown",
      labels: ["Offer Letters", "Contracts", "KYC & IDs", "Certificates", "Policies"],
      data: [30, 25, 20, 15, 10]
    },
    table: {
      title: "Recent Document Logs & Verification",
      columns: ["Document Title", "Type", "Employee / Subject", "Verification"],
      rows: [
        { c1: "Employment Contract 2026", c2: "Contract", c3: "Alex Morgan", c4: "Signed", badge: "emerald" },
        { c1: "Nondisclosure Agreement (NDA)", c2: "Policy", c3: "Sophia Lin", c4: "Signed", badge: "emerald" }
      ]
    }
  },

  "Workflow & Approval": {
    category: "Operations",
    kpis: [
      { id: "pending_wf", label: "Pending Workflow Tasks", value: "11", change: "4 high priority", trend: "neutral", color: "from-rose-600 to-red-700", icon: "QueueListIcon" },
      { id: "avg_sla", label: "Avg Approval SLA", value: "1.8 hrs", change: "-40m faster", trend: "up", color: "from-emerald-600 to-teal-700", icon: "ClockIcon" }
    ],
    quickActions: [
      { id: "approve_all", label: "Review Approvals", icon: "CheckIcon", color: "bg-emerald-600 hover:bg-emerald-700 text-white" }
    ],
    chart: {
      type: "bar",
      title: "Approval Requests Volume by Category",
      labels: ["Leave Request", "Expense Claim", "Job Opening", "Exit Clearance"],
      data: [45, 28, 14, 6]
    },
    table: {
      title: "Pending Multi-level Workflow Queue",
      columns: ["Request ID", "Requestor", "Workflow Category", "Status"],
      rows: [
        { c1: "#WF-9042", c2: "Jessica Alba", c3: "Leave Request", c4: "Level 1 Pending", badge: "amber" },
        { c1: "#WF-9045", c2: "David Miller", c3: "Travel Claim ($420)", c4: "Level 2 Pending", badge: "amber" }
      ]
    }
  }
};

/**
 * Helper method to extract dynamic widgets based on assigned module array
 */
export const getDynamicWidgetsForModules = (assignedModules = null) => {
  const selectedKeys = Array.isArray(assignedModules)
    ? assignedModules
    : Object.keys(MODULE_WIDGET_REGISTRY);

  const matchedKpis = [];
  const matchedQuickActions = [];
  const matchedCharts = [];
  const matchedTables = [];

  selectedKeys.forEach(modName => {
    // Fuzzy match or exact match
    const foundKey = Object.keys(MODULE_WIDGET_REGISTRY).find(
      key => key.toLowerCase().includes(modName.toLowerCase()) || modName.toLowerCase().includes(key.toLowerCase())
    );

    if (foundKey && MODULE_WIDGET_REGISTRY[foundKey]) {
      const widgetDef = MODULE_WIDGET_REGISTRY[foundKey];
      if (widgetDef.kpis) {
        const taggedKpis = widgetDef.kpis.map(k => ({ ...k, moduleName: foundKey }));
        matchedKpis.push(...taggedKpis);
      }
      if (widgetDef.quickActions) {
        const taggedActions = widgetDef.quickActions.map(a => ({ ...a, moduleName: foundKey }));
        matchedQuickActions.push(...taggedActions);
      }
      if (widgetDef.chart) matchedCharts.push({ ...widgetDef.chart, moduleName: foundKey });
      if (widgetDef.table) matchedTables.push({ ...widgetDef.table, moduleName: foundKey });
    }
  });

  // Fallback defaults if no modules are matched
  if (matchedKpis.length === 0) {
    matchedKpis.push(
      { id: "dept_members", label: "Active Department Members", value: "24", change: "Active", trend: "up", color: "from-blue-600 to-indigo-600", icon: "UserGroupIcon" },
      { id: "dept_tasks", label: "Tasks In Progress", value: "14", change: "+3 today", trend: "up", color: "from-emerald-600 to-teal-600", icon: "CheckCircleIcon" },
      { id: "dept_eff", label: "Department Efficiency", value: "98.4%", change: "Optimal", trend: "up", color: "from-purple-600 to-pink-600", icon: "ChartBarIcon" }
    );
  }

  return {
    kpis: matchedKpis,
    quickActions: matchedQuickActions,
    charts: matchedCharts,
    tables: matchedTables
  };
};

