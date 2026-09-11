// Frontend/src/components/Workflow/workflowData.js

export const WORKFLOW_STAGES = [
  { id: "overview", label: "Overview", step: 1 },
  { id: "leave", label: "Leave Approval", step: 2 },
  { id: "expense", label: "Expense Approval", step: 3 },
  { id: "recruitment", label: "Recruitment Approval", step: 4 },
  { id: "promotion", label: "Promotion Approval", step: 5 },
  { id: "transfer", label: "Transfer Approval", step: 6 },
  { id: "separation", label: "Separation Approval", step: 7 },
  { id: "history", label: "Approval History", step: 8 }
];

export const getApprovalBadgeClass = (status) => {
  const s = String(status || "").toLowerCase().trim();
  if (s === "approved" || s === "cleared" || s === "settled") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (s === "pending" || s === "under review" || s === "manager review") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  if (s === "in progress" || s === "processing") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }
  if (s === "rejected" || s === "declined") {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  if (s === "withdrawn" || s === "on hold") {
    return "bg-orange-50 text-orange-700 border-orange-200";
  }
  return "bg-slate-50 text-slate-700 border-slate-200";
};

export const SAMPLE_LEAVE_APPROVALS = [
  {
    id: 1,
    employee: "Rahul Sharma",
    employeeId: "EMP1024",
    department: "Engineering",
    leaveType: "Annual Leave",
    dates: "12 Oct 2026 – 14 Oct 2026",
    days: 3,
    appliedOn: "01 Oct 2026",
    reason: "Family festive trip to Jaipur.",
    approver: "Rajesh Kumar (Manager)",
    status: "Pending",
    leaveBalance: "14 Days Remaining"
  },
  {
    id: 2,
    employee: "Priya Patel",
    employeeId: "EMP1087",
    department: "Human Resources",
    leaveType: "Casual Leave",
    dates: "08 Oct 2026",
    days: 1,
    appliedOn: "02 Oct 2026",
    reason: "Personal banking appointments.",
    approver: "Anjali Mehta (HR Head)",
    status: "Approved",
    leaveBalance: "8 Days Remaining"
  },
  {
    id: 3,
    employee: "Amit Verma",
    employeeId: "EMP1132",
    department: "Finance",
    leaveType: "Sick Leave",
    dates: "05 Oct 2026 – 06 Oct 2026",
    days: 2,
    appliedOn: "04 Oct 2026",
    reason: "Severe viral fever with medical prescription attached.",
    approver: "Suresh Pillai (Finance Head)",
    status: "Approved",
    leaveBalance: "10 Days Remaining"
  },
  {
    id: 4,
    employee: "Neha Gupta",
    employeeId: "EMP1055",
    department: "Design",
    leaveType: "Comp Off",
    dates: "15 Oct 2026",
    days: 1,
    appliedOn: "03 Oct 2026",
    reason: "Weekend product release sprint support compensation.",
    approver: "Kabir Roy (Design Director)",
    status: "Pending",
    leaveBalance: "2 Days Remaining"
  }
];

export const SAMPLE_EXPENSE_APPROVALS = [
  {
    id: 1,
    employee: "Rahul Sharma",
    employeeId: "EMP1024",
    department: "Engineering",
    claimId: "EXP-2026-441",
    category: "Client Meeting / Dining",
    amount: 4850,
    claimDate: "28 Sep 2026",
    receiptAttached: "Bill_HDFCBistro_4850.pdf",
    description: "Dinner meeting with FinTech integration partners.",
    approver: "Rajesh Kumar",
    status: "Pending"
  },
  {
    id: 2,
    employee: "Vikram Singh",
    employeeId: "EMP1190",
    department: "Engineering",
    claimId: "EXP-2026-442",
    category: "Professional Certification",
    amount: 14200,
    claimDate: "25 Sep 2026",
    receiptAttached: "AWS_Solutions_Architect_Receipt.pdf",
    description: "AWS Certified Solutions Architect examination fee.",
    approver: "CTO / Rajesh Kumar",
    status: "Approved"
  },
  {
    id: 3,
    employee: "Sneha Kulkarni",
    employeeId: "EMP1211",
    department: "Marketing",
    claimId: "EXP-2026-443",
    category: "Travel & Lodging",
    amount: 8600,
    claimDate: "22 Sep 2026",
    receiptAttached: "IndiGo_Air_MumbaiDel.pdf",
    description: "Flight fare for Mumbai National Insurance Expo.",
    approver: "Deepak Chawla",
    status: "Approved"
  },
  {
    id: 4,
    employee: "Amit Verma",
    employeeId: "EMP1132",
    department: "Finance",
    claimId: "EXP-2026-444",
    category: "Office Supplies / Hardware",
    amount: 2300,
    claimDate: "29 Sep 2026",
    receiptAttached: "Logitech_Wireless_Combo.pdf",
    description: "Ergonomic wireless keyboard for financial auditing.",
    approver: "Suresh Pillai",
    status: "Pending"
  }
];

export const SAMPLE_RECRUITMENT_APPROVALS = [
  {
    id: 1,
    roleTitle: "Senior Full Stack Engineer",
    department: "Engineering",
    requisitionId: "REQ-2026-081",
    openings: 2,
    targetCTC: "₹22 - 28 LPA",
    hiringManager: "Rajesh Kumar",
    experienceRequired: "5 - 8 Years",
    justification: "To build the new microservices architecture for broker policy issuance.",
    budgetStatus: "Within Budget",
    status: "Pending"
  },
  {
    id: 2,
    roleTitle: "HR Operations Lead",
    department: "Human Resources",
    requisitionId: "REQ-2026-082",
    openings: 1,
    targetCTC: "₹12 - 16 LPA",
    hiringManager: "Anjali Mehta",
    experienceRequired: "4 - 6 Years",
    justification: "Replacement for outgoing team member; handle corporate compliance.",
    budgetStatus: "Approved by CFO",
    status: "Approved"
  },
  {
    id: 3,
    roleTitle: "Lead UI/UX Designer",
    department: "Design",
    requisitionId: "REQ-2026-083",
    openings: 1,
    targetCTC: "₹18 - 24 LPA",
    hiringManager: "Kabir Roy",
    experienceRequired: "6+ Years",
    justification: "Enterprise HRMS design system revamp and mobile application.",
    budgetStatus: "Pending Audit",
    status: "Pending"
  }
];

export const SAMPLE_PROMOTION_APPROVALS = [
  {
    id: 1,
    employee: "Rahul Sharma",
    employeeId: "EMP1024",
    department: "Engineering",
    currentDesignation: "Senior Software Engineer",
    proposedDesignation: "Staff Software Engineer / Tech Lead",
    currentCTC: "₹24,00,000",
    proposedCTC: "₹28,50,000",
    hikePercent: "18.75%",
    appraisalRating: "4.8 / 5.0",
    recommendedBy: "Rajesh Kumar",
    effectiveDate: "01 Nov 2026",
    justification: "Consistently led core API architecture, zero production incidents.",
    status: "Pending"
  },
  {
    id: 2,
    employee: "Amit Verma",
    employeeId: "EMP1132",
    department: "Finance",
    currentDesignation: "Finance Executive",
    proposedDesignation: "Senior Finance Analyst",
    currentCTC: "₹8,50,000",
    proposedCTC: "₹10,20,000",
    hikePercent: "20.00%",
    appraisalRating: "4.5 / 5.0",
    recommendedBy: "Suresh Pillai",
    effectiveDate: "01 Oct 2026",
    justification: "Automated monthly payroll tax filing, reducing audit turnaround by 40%.",
    status: "Approved"
  }
];

export const SAMPLE_TRANSFER_APPROVALS = [
  {
    id: 1,
    employee: "Priya Patel",
    employeeId: "EMP1087",
    currentBranch: "Mumbai Corporate HQ",
    proposedBranch: "Bengaluru Tech Hub",
    department: "Human Resources",
    transferType: "Location Relocation",
    effectiveDate: "15 Oct 2026",
    relocationAllowance: "₹50,000",
    requestedBy: "Employee Request (Family Relocation)",
    managerClearance: "Approved",
    hrHeadApproval: "Pending",
    status: "Pending"
  },
  {
    id: 2,
    employee: "Vikram Singh",
    employeeId: "EMP1190",
    currentBranch: "Pune Branch",
    proposedBranch: "Mumbai Corporate HQ",
    department: "Engineering (DevOps)",
    transferType: "Department Alignment",
    effectiveDate: "01 Oct 2026",
    relocationAllowance: "₹35,000",
    requestedBy: "Department Head (Rajesh Kumar)",
    managerClearance: "Approved",
    hrHeadApproval: "Approved",
    status: "Approved"
  }
];

export const SAMPLE_SEPARATION_APPROVALS = [
  {
    id: 1,
    employee: "Rahul Sharma",
    employeeId: "EMP1024",
    department: "Engineering",
    designation: "Senior Software Engineer",
    resignationDate: "20 Aug 2026",
    proposedLWD: "20 Sep 2026",
    noticePeriod: "30 Days",
    exitType: "Voluntary",
    reason: "Better Opportunity",
    managerStatus: "Approved",
    hrStatus: "Approved",
    status: "Approved"
  },
  {
    id: 2,
    employee: "Priya Patel",
    employeeId: "EMP1087",
    department: "Human Resources",
    designation: "HR Executive",
    resignationDate: "25 Aug 2026",
    proposedLWD: "24 Sep 2026",
    noticePeriod: "30 Days",
    exitType: "Voluntary",
    reason: "Relocation",
    managerStatus: "Approved",
    hrStatus: "Pending",
    status: "Pending"
  }
];

export const SAMPLE_APPROVAL_HISTORY = [
  {
    id: 1,
    dateTime: "02 Oct 2026, 11:30 AM",
    category: "Leave Approval",
    employee: "Priya Patel",
    employeeId: "EMP1087",
    details: "Casual Leave (1 Day - 08 Oct 2026)",
    decision: "Approved",
    approver: "Anjali Mehta (HR Head)",
    turnaround: "4 Hours",
    remarks: "Leave authorized."
  },
  {
    id: 2,
    dateTime: "01 Oct 2026, 04:15 PM",
    category: "Expense Claim",
    employee: "Vikram Singh",
    employeeId: "EMP1190",
    details: "AWS Exam Requisition (₹14,200)",
    decision: "Approved",
    approver: "CTO / Rajesh Kumar",
    turnaround: "1 Day",
    remarks: "Upskilling budget allocation approved."
  },
  {
    id: 3,
    dateTime: "29 Sep 2026, 02:20 PM",
    category: "Promotion Approval",
    employee: "Amit Verma",
    employeeId: "EMP1132",
    details: "Promotion to Senior Finance Analyst (+20%)",
    decision: "Approved",
    approver: "Executive Committee / CFO",
    turnaround: "2 Days",
    remarks: "Passed annual appraisal threshold with distinction."
  },
  {
    id: 4,
    dateTime: "26 Sep 2026, 05:00 PM",
    category: "Recruitment Requisition",
    employee: "HR Operations",
    employeeId: "REQ-2026-082",
    details: "HR Operations Lead (₹14 LPA Budget)",
    decision: "Approved",
    approver: "CFO & HR Director",
    turnaround: "2 Days",
    remarks: "Headcount sanctioned for Q3."
  },
  {
    id: 5,
    dateTime: "24 Sep 2026, 03:45 PM",
    category: "Expense Claim",
    employee: "Karan Kapoor",
    employeeId: "EMP1145",
    details: "Unbudgeted Client Entertainment (₹18,500)",
    decision: "Rejected",
    approver: "Finance Audit Committee",
    turnaround: "1 Day",
    remarks: "Prior written approval missing as per company expense policy."
  }
];
