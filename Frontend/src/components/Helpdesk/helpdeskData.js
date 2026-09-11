// Frontend/src/components/Helpdesk/helpdeskData.js

export const HELPDESK_METRICS = {
  totalTickets: 142,
  openTickets: 18,
  inProgress: 24,
  resolvedTickets: 86,
  pendingTickets: 9,
  escalatedTickets: 5,
  complaints: 14,
  serviceRequests: 38,
  queries: 42,
  performance: {
    avgResolutionTime: "4.2 Hours",
    slaCompliance: "96.4%",
    firstResponseTime: "14 Mins",
    csatScore: "4.8 / 5.0"
  }
};

export const CHART_DATA = {
  statusDistribution: [
    { label: "Resolved", count: 86, color: "#10B981" },
    { label: "In Progress", count: 24, color: "#3B82F6" },
    { label: "Open", count: 18, color: "#F59E0B" },
    { label: "Pending", count: 9, color: "#8B5CF6" },
    { label: "Escalated", count: 5, color: "#EF4444" }
  ],
  priorityBreakdown: [
    { label: "Critical", count: 12, color: "#EF4444", pct: "8%" },
    { label: "High", count: 34, color: "#F97316", pct: "24%" },
    { label: "Medium", count: 68, color: "#3B82F6", pct: "48%" },
    { label: "Low", count: 28, color: "#10B981", pct: "20%" }
  ],
  categoryBreakdown: [
    { label: "Payroll & Compensation", count: 48, pct: "34%" },
    { label: "IT Hardware & Access", count: 36, pct: "25%" },
    { label: "Leave & Attendance", count: 26, pct: "18%" },
    { label: "Benefits & Medical", count: 18, pct: "13%" },
    { label: "Workplace & Admin", count: 14, pct: "10%" }
  ],
  typeBreakdown: [
    { label: "Tickets", count: 48, pct: "34%", color: "#6366F1" },
    { label: "Service Requests", count: 38, pct: "27%", color: "#06B6D4" },
    { label: "Queries", count: 42, pct: "29%", color: "#F59E0B" },
    { label: "Complaints", count: 14, pct: "10%", color: "#EC4899" }
  ],
  weeklyVolume: [
    { day: "Mon", count: 28 },
    { day: "Tue", count: 34 },
    { day: "Wed", count: 31 },
    { day: "Thu", count: 25 },
    { day: "Fri", count: 18 },
    { day: "Sat", count: 6 }
  ]
};

export const SAMPLE_TICKETS = [
  {
    id: "TKT-1048",
    employee: "Rahul Sharma",
    employeeId: "EMP1024",
    email: "rahul.sharma@nibhr.com",
    department: "Engineering",
    designation: "Senior Software Engineer",
    type: "Ticket",
    category: "Payroll & Compensation",
    subject: "Tax Deduction Discrepancy in August Payslip (Section 80C)",
    priority: "High",
    status: "In Progress",
    assignedTo: "Kavita Reddy",
    assignedRole: "Payroll Specialist",
    createdDate: "01 Sep 2026, 09:30 AM",
    slaDue: "02 Sep 2026, 06:00 PM",
    slaStatus: "On Track",
    lastUpdated: "02 Sep 2026, 11:15 AM",
    description: "August payslip shows TDS deduction of ₹18,400 without accounting for my submitted LIC premium receipts (₹75,000 under 80C). Please review and rectify in upcoming cycle.",
    attachments: ["LIC_Receipt_2026.pdf", "Aug_Payslip_TKT.pdf"],
    comments: [
      { author: "Kavita Reddy", role: "Payroll Specialist", time: "01 Sep, 02:00 PM", text: "Verified investment portal proof submission. Adjustment credit scheduled in September pay run." },
      { author: "Rahul Sharma", role: "Employee", time: "01 Sep, 04:30 PM", text: "Thank you Kavita, confirmed." }
    ],
    internalNotes: "Verified IT declaration portal timestamp: 24 July. Discrepancy occurred due to batch synch delay with finance ERP.",
    resolution: "Approved ₹4,200 TDS offset adjustment in September cycle.",
    statusHistory: [
      { status: "Open", time: "01 Sep, 09:30 AM", actor: "Rahul Sharma" },
      { status: "Assigned", time: "01 Sep, 10:00 AM", actor: "Auto-Assignment Engine" },
      { status: "In Progress", time: "01 Sep, 01:45 PM", actor: "Kavita Reddy" }
    ]
  },
  {
    id: "TKT-1047",
    employee: "Priya Patel",
    employeeId: "EMP1087",
    email: "priya.patel@nibhr.com",
    department: "Human Resources",
    designation: "HR Executive",
    type: "Ticket",
    category: "IT Hardware & Access",
    subject: "VPN Gateway Authentication Failure for Remote Cloud Environment",
    priority: "Critical",
    status: "Open",
    assignedTo: "Sameer Varma",
    assignedRole: "IT Systems Admin",
    createdDate: "02 Sep 2026, 08:15 AM",
    slaDue: "02 Sep 2026, 12:15 PM",
    slaStatus: "Due Soon",
    lastUpdated: "02 Sep 2026, 08:30 AM",
    description: "Unable to connect to production VPN server (IPSEC tunnel timeout error 403). Multi-factor authentication token failing to generate push notification.",
    attachments: ["VPN_Error_Log.png"],
    comments: [
      { author: "Sameer Varma", role: "IT Systems Admin", time: "02 Sep, 08:30 AM", text: "Resetting MFA certificate in active directory. Stand by for re-enrollment prompt." }
    ],
    internalNotes: "User's Okta certificate expired after mandatory 90-day cycle.",
    resolution: "",
    statusHistory: [
      { status: "Open", time: "02 Sep, 08:15 AM", actor: "Priya Patel" }
    ]
  },
  {
    id: "TKT-1046",
    employee: "Amit Verma",
    employeeId: "EMP1132",
    email: "amit.verma@nibhr.com",
    department: "Finance",
    designation: "Finance Executive",
    type: "Ticket",
    category: "Leave & Attendance",
    subject: "Attendance Regularization for Client Audit On-Site Duty",
    priority: "Medium",
    status: "Resolved",
    assignedTo: "Sneha Nair",
    assignedRole: "HR Operations Lead",
    createdDate: "28 Aug 2026, 10:00 AM",
    slaDue: "29 Aug 2026, 06:00 PM",
    slaStatus: "Resolved",
    lastUpdated: "29 Aug 2026, 03:30 PM",
    description: "On client audit duty at Nariman Point office from 25 to 27 Aug. Biometric logs show absent. Regularization request submitted with manager approval.",
    attachments: ["Client_GatePass_Audit.pdf"],
    comments: [
      { author: "Sneha Nair", role: "HR Operations", time: "29 Aug, 03:20 PM", text: "Attendance regularized as On-Duty (OD) for all 3 days. Leaves credited back." }
    ],
    internalNotes: "Cross-checked with Suresh Pillai (Manager). Approved.",
    resolution: "3 days marked OD. Attendance percentage updated to 100%.",
    statusHistory: [
      { status: "Open", time: "28 Aug, 10:00 AM", actor: "Amit Verma" },
      { status: "In Progress", time: "28 Aug, 02:00 PM", actor: "Sneha Nair" },
      { status: "Resolved", time: "29 Aug, 03:30 PM", actor: "Sneha Nair" }
    ]
  },
  {
    id: "TKT-1045",
    employee: "Neha Singh",
    employeeId: "EMP1156",
    email: "neha.singh@nibhr.com",
    department: "Marketing",
    designation: "Marketing Executive",
    type: "Ticket",
    category: "Benefits & Medical",
    subject: "Addition of Dependent Mother to Corporate Medical Insurance Card",
    priority: "Low",
    status: "Pending",
    assignedTo: "Deepika Sen",
    assignedRole: "Benefits Admin",
    createdDate: "29 Aug 2026, 11:30 AM",
    slaDue: "04 Sep 2026, 06:00 PM",
    slaStatus: "On Track",
    lastUpdated: "31 Aug 2026, 02:00 PM",
    description: "Requesting endorsement to add mother under corporate floater policy. Aadhar card and birth certificate uploaded.",
    attachments: ["Mother_Aadhaar_Card.pdf"],
    comments: [
      { author: "Deepika Sen", role: "Benefits Admin", time: "31 Aug, 02:00 PM", text: "Endorsement submitted to TPA portal (MediAssist). Awaiting e-card issuance from insurer." }
    ],
    internalNotes: "Pending TPA batch upload on 03 September.",
    resolution: "",
    statusHistory: [
      { status: "Open", time: "29 Aug, 11:30 AM", actor: "Neha Singh" },
      { status: "Pending", time: "31 Aug, 02:00 PM", actor: "Deepika Sen" }
    ]
  },
  {
    id: "TKT-1044",
    employee: "Vikram Singhania",
    employeeId: "EMP1005",
    email: "vikram.s@nibhr.com",
    department: "Underwriting",
    designation: "AVP - Underwriting",
    type: "Ticket",
    category: "IT Hardware & Access",
    subject: "Escalation: Bloomberg Terminal Data Feed Latency",
    priority: "Critical",
    status: "Escalated",
    assignedTo: "Rohan Mukherjee",
    assignedRole: "Head IT Infrastructure",
    createdDate: "30 Aug 2026, 03:00 PM",
    slaDue: "30 Aug 2026, 07:00 PM",
    slaStatus: "SLA Breached",
    lastUpdated: "01 Sep 2026, 10:00 AM",
    description: "Dedicated leased line feed dropping packets during market opening hours. Impacting enterprise high-value quotes.",
    attachments: ["Latency_Packet_Loss.txt"],
    comments: [
      { author: "Rohan Mukherjee", role: "IT Head", time: "01 Sep, 10:00 AM", text: "Escalated to ISP Tata Tele enterprise team. Fiber cable splicing scheduled." }
    ],
    internalNotes: "SLA breached by 18 hours due to telecom vendor delay.",
    resolution: "",
    statusHistory: [
      { status: "Open", time: "30 Aug, 03:00 PM", actor: "Vikram Singhania" },
      { status: "In Progress", time: "30 Aug, 04:00 PM", actor: "Network Team" },
      { status: "Escalated", time: "31 Aug, 09:00 AM", actor: "System Engine" }
    ]
  }
];

export const SAMPLE_COMPLAINTS = [
  {
    id: "CMP-201",
    employee: "Ananya Iyer",
    employeeId: "EMP1092",
    email: "ananya.iyer@nibhr.com",
    department: "Engineering",
    complaintType: "Workplace Issue",
    subject: "Excessive Air Conditioning Temperature in Wing B Causing Discomfort",
    priority: "Medium",
    assignedTo: "Facilities Lead",
    submittedDate: "27 Aug 2026",
    slaDueDate: "30 Aug 2026",
    status: "Resolution Proposed",
    description: "Temperature in Wing B workstations consistently below 18°C. Multiple team members experiencing health issues.",
    investigationNotes: "Facilities inspected BMS thermostats. Damper in zone 4 was stuck open at 100% chilled air.",
    resolution: "BMS sensor recalibrated and set to corporate standard 23°C. Workstation airflow diverters installed.",
    resolutionDate: "30 Aug 2026",
    timeline: [
      { step: "Submitted", time: "27 Aug 2026", actor: "Ananya Iyer" },
      { step: "Under Review", time: "28 Aug 2026", actor: "Facilities Lead" },
      { step: "Investigation", time: "29 Aug 2026", actor: "HVAC Engineering Team" },
      { step: "Resolution Proposed", time: "30 Aug 2026", actor: "Facilities Lead" }
    ]
  },
  {
    id: "CMP-202",
    employee: "Kunal Mehra",
    employeeId: "EMP1104",
    email: "kunal.mehra@nibhr.com",
    department: "Sales & Brokerage",
    complaintType: "Manager/Team Concern",
    subject: "Unfair Commission Target Adjustment Without Prior Quarterly Intimation",
    priority: "High",
    assignedTo: "Deepika Sen",
    submittedDate: "24 Aug 2026",
    slaDueDate: "31 Aug 2026",
    status: "Investigation",
    description: "Q2 corporate health brokerage sales incentive quota was revised upward mid-quarter after deals were locked in.",
    investigationNotes: "Reviewing sales policy manual section 4.2 with VP Commercials. Audit in progress.",
    resolution: "",
    resolutionDate: "",
    timeline: [
      { step: "Submitted", time: "24 Aug 2026", actor: "Kunal Mehra" },
      { step: "Under Review", time: "25 Aug 2026", actor: "Deepika Sen" },
      { step: "Investigation", time: "27 Aug 2026", actor: "Grievance Committee" }
    ]
  },
  {
    id: "CMP-203",
    employee: "Sneha Nair",
    employeeId: "EMP1148",
    email: "sneha.nair@nibhr.com",
    department: "Finance",
    complaintType: "Facilities Issue",
    subject: "Basement Parking Space Allocation Blockage by External Delivery Vans",
    priority: "Low",
    assignedTo: "Security Incharge",
    submittedDate: "19 Aug 2026",
    slaDueDate: "22 Aug 2026",
    status: "Closed",
    description: "Employee designated parking spots in Basement 2 are persistently obstructed by loading trucks.",
    investigationNotes: "Security footage verified commercial delivery vendors parking outside designated freight zones.",
    resolution: "New bollards installed. Vendors penalized and strictly restricted to service dock 1.",
    resolutionDate: "22 Aug 2026",
    timeline: [
      { step: "Submitted", time: "19 Aug 2026", actor: "Sneha Nair" },
      { step: "Under Review", time: "20 Aug 2026", actor: "Security Admin" },
      { step: "Investigation", time: "21 Aug 2026", actor: "Facilities Head" },
      { step: "Resolution Proposed", time: "22 Aug 2026", actor: "Facilities Head" },
      { step: "Resolved", time: "22 Aug 2026", actor: "Sneha Nair" },
      { step: "Closed", time: "23 Aug 2026", actor: "System" }
    ]
  }
];

export const SAMPLE_SERVICE_REQUESTS = [
  {
    id: "SRQ-501",
    employee: "Rahul Sharma",
    employeeId: "EMP1024",
    email: "rahul.sharma@nibhr.com",
    department: "Engineering",
    requestType: "Employment Certificate",
    subject: "Official Employment & Salary Certificate for Mortgage Loan Verification",
    priority: "High",
    assignedTo: "Deepika Sen",
    requestedDate: "30 Aug 2026",
    expectedCompletion: "03 Sep 2026",
    status: "Completed",
    description: "Bank requires signed and stamped employment verification certificate detailing designation, DOJ, and annual CTC for housing loan.",
    resolution: "Digital certificate generated, verified, signed by HR Director, and dispatched to employee email.",
    statusHistory: [
      { status: "New", time: "30 Aug, 10:00 AM" },
      { status: "Assigned", time: "30 Aug, 11:30 AM" },
      { status: "In Progress", time: "31 Aug, 02:00 PM" },
      { status: "Completed", time: "01 Sep, 04:30 PM" }
    ]
  },
  {
    id: "SRQ-502",
    employee: "Priya Patel",
    employeeId: "EMP1087",
    email: "priya.patel@nibhr.com",
    department: "Human Resources",
    requestType: "ID Card Request",
    subject: "Replacement NFC Smart Access ID Badge (Lost Original)",
    priority: "Medium",
    assignedTo: "Admin Helpdesk",
    requestedDate: "01 Sep 2026",
    expectedCompletion: "04 Sep 2026",
    status: "In Progress",
    description: "RFID smart access badge lost during office commute. Temporary pass issued. Replacement card printing required.",
    resolution: "Smart card encoded with employee biometrics. Ready for collection at Reception Desk.",
    statusHistory: [
      { status: "New", time: "01 Sep, 09:00 AM" },
      { status: "Assigned", time: "01 Sep, 10:15 AM" },
      { status: "In Progress", time: "02 Sep, 11:00 AM" }
    ]
  },
  {
    id: "SRQ-503",
    employee: "Amit Verma",
    employeeId: "EMP1132",
    email: "amit.verma@nibhr.com",
    department: "Finance",
    requestType: "HR Document Request",
    subject: "Attested Form 16 Part A & Part B for Previous 2 Financial Years",
    priority: "Low",
    assignedTo: "Kavita Reddy",
    requestedDate: "28 Aug 2026",
    expectedCompletion: "02 Sep 2026",
    status: "Pending",
    description: "Need digitally signed Form 16 documents for visa filing requirements.",
    resolution: "",
    statusHistory: [
      { status: "New", time: "28 Aug, 11:00 AM" },
      { status: "Assigned", time: "28 Aug, 01:00 PM" },
      { status: "Pending", time: "30 Aug, 04:00 PM" }
    ]
  }
];

export const SAMPLE_QUERIES = [
  {
    id: "QRY-801",
    employee: "Neha Singh",
    employeeId: "EMP1156",
    department: "Marketing",
    queryCategory: "Benefits",
    question: "Are dental and vision screening checkups covered under the OPD wellness reimbursement cap?",
    assignedTo: "Deepika Sen",
    submittedDate: "28 Aug 2026",
    response: "Yes! Under NIB Care 2.0 policy, annual preventive dental cleanings and optometry eye checkups are eligible for claim up to ₹7,500 per family unit via MediAssist portal.",
    resolutionDate: "29 Aug 2026",
    status: "Resolved",
    rating: 5,
    timeline: [
      { step: "New", time: "28 Aug, 09:00 AM" },
      { step: "Assigned", time: "28 Aug, 10:30 AM" },
      { step: "Answered", time: "29 Aug, 01:00 PM" },
      { step: "Resolved", time: "29 Aug, 03:00 PM" }
    ]
  },
  {
    id: "QRY-802",
    employee: "Rahul Sharma",
    employeeId: "EMP1024",
    department: "Engineering",
    queryCategory: "HR Policy",
    question: "What is the maximum number of Earned Leaves that can be encashed versus carried forward to 2027?",
    assignedTo: "Sneha Nair",
    submittedDate: "31 Aug 2026",
    response: "Employees can carry forward a maximum of 30 Earned Leaves into 2027. Any balance beyond 30 leaves is automatically encashed at the December fiscal payroll run.",
    resolutionDate: "01 Sep 2026",
    status: "Answered",
    rating: 4,
    timeline: [
      { step: "New", time: "31 Aug, 02:00 PM" },
      { step: "Assigned", time: "31 Aug, 03:00 PM" },
      { step: "Answered", time: "01 Sep, 11:00 AM" }
    ]
  },
  {
    id: "QRY-803",
    employee: "Priya Patel",
    employeeId: "EMP1087",
    department: "Human Resources",
    queryCategory: "Company Process",
    question: "What is the formal protocol for sponsoring an employee for an external professional certification?",
    assignedTo: "Head of Learning",
    submittedDate: "02 Sep 2026",
    response: "Employees need manager approval via the LMS sponsorship portal followed by HR L&D budget verification. 100% exam fee reimbursement is granted upon passing.",
    resolutionDate: "",
    status: "In Progress",
    rating: null,
    timeline: [
      { step: "New", time: "02 Sep, 08:30 AM" },
      { step: "Assigned", time: "02 Sep, 09:15 AM" },
      { step: "In Progress", time: "02 Sep, 11:30 AM" }
    ]
  }
];

export const SAMPLE_TRACKING = [
  {
    refId: "TKT-1048",
    type: "Ticket",
    employee: "Rahul Sharma",
    employeeId: "EMP1024",
    department: "Engineering",
    subject: "Tax Deduction Discrepancy in August Payslip",
    assignedTo: "Kavita Reddy",
    createdDate: "01 Sep 2026",
    currentStatus: "In Progress",
    slaDueDate: "02 Sep 2026",
    slaStatus: "On Track",
    lastUpdated: "02 Sep 2026",
    resolutionDate: "Pending",
    timelineStages: [
      { name: "Created", completed: true, time: "01 Sep, 09:30 AM", agent: "Rahul Sharma" },
      { name: "Assigned", completed: true, time: "01 Sep, 10:00 AM", agent: "System Rule Engine" },
      { name: "Acknowledged", completed: true, time: "01 Sep, 11:15 AM", agent: "Kavita Reddy" },
      { name: "In Progress", completed: true, time: "01 Sep, 01:45 PM", agent: "Kavita Reddy" },
      { name: "Pending / Escalated", completed: false, time: "—", agent: "—" },
      { name: "Resolution", completed: false, time: "—", agent: "—" },
      { name: "Resolved", completed: false, time: "—", agent: "—" },
      { name: "Closed", completed: false, time: "—", agent: "—" }
    ]
  },
  {
    refId: "TKT-1047",
    type: "Ticket",
    employee: "Priya Patel",
    employeeId: "EMP1087",
    department: "Human Resources",
    subject: "VPN Gateway Authentication Failure for Remote Cloud",
    assignedTo: "Sameer Varma",
    createdDate: "02 Sep 2026",
    currentStatus: "Open",
    slaDueDate: "02 Sep 2026",
    slaStatus: "Due Soon",
    lastUpdated: "02 Sep 2026",
    resolutionDate: "Pending",
    timelineStages: [
      { name: "Created", completed: true, time: "02 Sep, 08:15 AM", agent: "Priya Patel" },
      { name: "Assigned", completed: true, time: "02 Sep, 08:30 AM", agent: "Sameer Varma" },
      { name: "Acknowledged", completed: false, time: "—", agent: "—" },
      { name: "In Progress", completed: false, time: "—", agent: "—" },
      { name: "Pending / Escalated", completed: false, time: "—", agent: "—" },
      { name: "Resolution", completed: false, time: "—", agent: "—" },
      { name: "Resolved", completed: false, time: "—", agent: "—" },
      { name: "Closed", completed: false, time: "—", agent: "—" }
    ]
  },
  {
    refId: "CMP-201",
    type: "Complaint",
    employee: "Ananya Iyer",
    employeeId: "EMP1092",
    department: "Engineering",
    subject: "Excessive Air Conditioning Temperature in Wing B",
    assignedTo: "Facilities Lead",
    createdDate: "27 Aug 2026",
    currentStatus: "Resolution Proposed",
    slaDueDate: "30 Aug 2026",
    slaStatus: "Resolved",
    lastUpdated: "30 Aug 2026",
    resolutionDate: "30 Aug 2026",
    timelineStages: [
      { name: "Created", completed: true, time: "27 Aug, 10:00 AM", agent: "Ananya Iyer" },
      { name: "Assigned", completed: true, time: "27 Aug, 11:30 AM", agent: "Helpdesk Manager" },
      { name: "Acknowledged", completed: true, time: "28 Aug, 09:00 AM", agent: "Facilities Lead" },
      { name: "In Progress", completed: true, time: "28 Aug, 02:00 PM", agent: "HVAC Engineering" },
      { name: "Pending / Escalated", completed: false, time: "—", agent: "—" },
      { name: "Resolution", completed: true, time: "30 Aug, 11:00 AM", agent: "Facilities Lead" },
      { name: "Resolved", completed: true, time: "30 Aug, 04:00 PM", agent: "Facilities Lead" },
      { name: "Closed", completed: false, time: "Pending confirmation", agent: "Ananya Iyer" }
    ]
  },
  {
    refId: "SRQ-501",
    type: "Service Request",
    employee: "Rahul Sharma",
    employeeId: "EMP1024",
    department: "Engineering",
    subject: "Official Employment Certificate for Mortgage Loan",
    assignedTo: "Deepika Sen",
    createdDate: "30 Aug 2026",
    currentStatus: "Completed",
    slaDueDate: "03 Sep 2026",
    slaStatus: "Resolved",
    lastUpdated: "01 Sep 2026",
    resolutionDate: "01 Sep 2026",
    timelineStages: [
      { name: "Created", completed: true, time: "30 Aug, 10:00 AM", agent: "Rahul Sharma" },
      { name: "Assigned", completed: true, time: "30 Aug, 11:30 AM", agent: "Deepika Sen" },
      { name: "Acknowledged", completed: true, time: "31 Aug, 09:00 AM", agent: "Deepika Sen" },
      { name: "In Progress", completed: true, time: "31 Aug, 02:00 PM", agent: "HR Operations" },
      { name: "Pending / Escalated", completed: false, time: "—", agent: "—" },
      { name: "Resolution", completed: true, time: "01 Sep, 02:00 PM", agent: "Deepika Sen" },
      { name: "Resolved", completed: true, time: "01 Sep, 04:30 PM", agent: "Deepika Sen" },
      { name: "Closed", completed: true, time: "01 Sep, 05:00 PM", agent: "System" }
    ]
  },
  {
    refId: "TKT-1044",
    type: "Ticket",
    employee: "Vikram Singhania",
    employeeId: "EMP1005",
    department: "Underwriting",
    subject: "Bloomberg Terminal Data Feed Latency",
    assignedTo: "Rohan Mukherjee",
    createdDate: "30 Aug 2026",
    currentStatus: "Escalated",
    slaDueDate: "30 Aug 2026",
    slaStatus: "SLA Breached",
    lastUpdated: "01 Sep 2026",
    resolutionDate: "Pending",
    timelineStages: [
      { name: "Created", completed: true, time: "30 Aug, 03:00 PM", agent: "Vikram Singhania" },
      { name: "Assigned", completed: true, time: "30 Aug, 03:15 PM", agent: "Rohan Mukherjee" },
      { name: "Acknowledged", completed: true, time: "30 Aug, 03:30 PM", agent: "Rohan Mukherjee" },
      { name: "In Progress", completed: true, time: "30 Aug, 04:00 PM", agent: "Network Squad" },
      { name: "Pending / Escalated", completed: true, time: "31 Aug, 09:00 AM", agent: "Automated SLA Monitor" },
      { name: "Resolution", completed: false, time: "—", agent: "—" },
      { name: "Resolved", completed: false, time: "—", agent: "—" },
      { name: "Closed", completed: false, time: "—", agent: "—" }
    ]
  }
];

export const getPriorityBadgeClass = (priority) => {
  switch (priority?.toLowerCase()) {
    case "critical":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "high":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "medium":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "low":
    default:
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
};

export const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case "open":
    case "new":
    case "submitted":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "in progress":
    case "under review":
    case "investigation":
    case "assigned":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "resolved":
    case "resolution proposed":
    case "completed":
    case "answered":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "closed":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "pending":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "escalated":
      return "bg-rose-50 text-rose-700 border-rose-200 animate-pulse";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

export const getSlaStatusBadgeClass = (slaStatus) => {
  switch (slaStatus?.toLowerCase()) {
    case "on track":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "due soon":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "sla breached":
      return "bg-rose-50 text-rose-700 border-rose-200 font-black";
    case "resolved":
      return "bg-blue-50 text-blue-700 border-blue-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};
