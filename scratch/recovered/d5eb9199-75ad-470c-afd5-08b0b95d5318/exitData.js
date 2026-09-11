// Frontend/src/components/Exit/exitData.js

export const PIPELINE_STAGES = [
  { id: "resignation", label: "Resignation", step: 1 },
  { id: "approval", label: "Approval", step: 2 },
  { id: "notice", label: "Notice Period", step: 3 },
  { id: "clearance", label: "Clearance", step: 4 },
  { id: "assets", label: "Asset Return", step: 5 },
  { id: "nodues", label: "No Dues", step: 6 },
  { id: "interview", label: "Exit Interview", step: 7 },
  { id: "fnf", label: "F&F Settlement", step: 8 },
  { id: "letters", label: "Exit Documents", step: 9 },
  { id: "completed", label: "Exit Completed", step: 10 }
];

export const getStatusBadgeClass = (status) => {
  const s = String(status || "").toLowerCase().trim();
  if (s === "approved" || s === "completed" || s === "cleared" || s === "paid" || s === "returned" || s === "issued") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (s === "in progress" || s === "processing" || s === "notice period" || s === "scheduled") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }
  if (s === "pending" || s === "under review" || s === "submitted" || s === "partial dues") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  if (s === "rejected" || s === "damaged" || s === "lost") {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  if (s === "on hold" || s === "waived") {
    return "bg-orange-50 text-orange-700 border-orange-200";
  }
  return "bg-slate-50 text-slate-700 border-slate-200";
};

export const SAMPLE_RESIGNATIONS = [
  {
    id: 1,
    employee: "Rahul Sharma",
    employeeId: "EMP1024",
    department: "Engineering",
    designation: "Senior Software Engineer",
    resignationDate: "20 Aug 2026",
    lastWorkingDay: "20 Sep 2026",
    exitType: "Voluntary",
    reason: "Better Opportunity",
    noticePeriod: "30 Days",
    status: "Approved",
    avatar: "RS",
    email: "rahul.sharma@nibhr.com",
    manager: "Rajesh Kumar",
    remarks: "Seeking higher tech stack exposure.",
    currentStage: "Asset Return",
    stageIndex: 5
  },
  {
    id: 2,
    employee: "Priya Patel",
    employeeId: "EMP1087",
    department: "Human Resources",
    designation: "HR Executive",
    resignationDate: "25 Aug 2026",
    lastWorkingDay: "24 Sep 2026",
    exitType: "Voluntary",
    reason: "Relocation",
    noticePeriod: "30 Days",
    status: "Pending",
    avatar: "PP",
    email: "priya.patel@nibhr.com",
    manager: "Anjali Mehta",
    remarks: "Relocating to Bengaluru due to family commitments.",
    currentStage: "Approval",
    stageIndex: 2
  },
  {
    id: 3,
    employee: "Amit Verma",
    employeeId: "EMP1132",
    department: "Finance",
    designation: "Finance Executive",
    resignationDate: "18 Aug 2026",
    lastWorkingDay: "17 Sep 2026",
    exitType: "Voluntary",
    reason: "Higher Studies",
    noticePeriod: "30 Days",
    status: "Notice Period",
    avatar: "AV",
    email: "amit.verma@nibhr.com",
    manager: "Suresh Pillai",
    remarks: "Admitted to full-time MBA program.",
    currentStage: "Notice Period",
    stageIndex: 3
  },
  {
    id: 4,
    employee: "Neha Gupta",
    employeeId: "EMP1055",
    department: "Design",
    designation: "Product Designer",
    resignationDate: "05 Aug 2026",
    lastWorkingDay: "04 Sep 2026",
    exitType: "Voluntary",
    reason: "Better Opportunity",
    noticePeriod: "30 Days",
    status: "Completed",
    avatar: "NG",
    email: "neha.gupta@nibhr.com",
    manager: "Kabir Roy",
    remarks: "Joined design agency leadership.",
    currentStage: "Exit Completed",
    stageIndex: 10
  },
  {
    id: 5,
    employee: "Vikram Singh",
    employeeId: "EMP1190",
    department: "Engineering",
    designation: "DevOps Engineer",
    resignationDate: "28 Aug 2026",
    lastWorkingDay: "27 Sep 2026",
    exitType: "Voluntary",
    reason: "Personal",
    noticePeriod: "30 Days",
    status: "In Progress",
    avatar: "VS",
    email: "vikram.singh@nibhr.com",
    manager: "Rajesh Kumar",
    remarks: "Starting own tech consultancy.",
    currentStage: "Exit Clearance",
    stageIndex: 4
  },
  {
    id: 6,
    employee: "Sneha Kulkarni",
    employeeId: "EMP1211",
    department: "Marketing",
    designation: "Marketing Lead",
    resignationDate: "10 Aug 2026",
    lastWorkingDay: "09 Sep 2026",
    exitType: "Voluntary",
    reason: "Health",
    noticePeriod: "30 Days",
    status: "Approved",
    avatar: "SK",
    email: "sneha.kulkarni@nibhr.com",
    manager: "Deepak Chawla",
    remarks: "Medical sabbatical.",
    currentStage: "F&F Settlement",
    stageIndex: 8
  }
];

export const SAMPLE_CLEARANCES = [
  {
    id: 1,
    employee: "Rahul Sharma",
    employeeId: "EMP1024",
    department: "Engineering",
    lastWorkingDay: "20 Sep 2026",
    managerClearance: "Cleared",
    hrClearance: "Cleared",
    itClearance: "Pending",
    financeClearance: "Cleared",
    adminClearance: "Cleared",
    overallStatus: "Pending",
    remarks: "IT equipment return inspection scheduled."
  },
  {
    id: 2,
    employee: "Priya Patel",
    employeeId: "EMP1087",
    department: "Human Resources",
    lastWorkingDay: "24 Sep 2026",
    managerClearance: "Cleared",
    hrClearance: "Cleared",
    itClearance: "Cleared",
    financeClearance: "Pending",
    adminClearance: "Cleared",
    overallStatus: "Pending",
    remarks: "Travel reimbursement pending audit."
  },
  {
    id: 3,
    employee: "Amit Verma",
    employeeId: "EMP1132",
    department: "Finance",
    lastWorkingDay: "17 Sep 2026",
    managerClearance: "Cleared",
    hrClearance: "Pending",
    itClearance: "Cleared",
    financeClearance: "Cleared",
    adminClearance: "Cleared",
    overallStatus: "In Progress",
    remarks: "HR knowledge transfer in progress."
  },
  {
    id: 4,
    employee: "Neha Gupta",
    employeeId: "EMP1055",
    department: "Design",
    lastWorkingDay: "04 Sep 2026",
    managerClearance: "Cleared",
    hrClearance: "Cleared",
    itClearance: "Cleared",
    financeClearance: "Cleared",
    adminClearance: "Cleared",
    overallStatus: "Cleared",
    remarks: "All departments cleared."
  },
  {
    id: 5,
    employee: "Vikram Singh",
    employeeId: "EMP1190",
    department: "Engineering",
    lastWorkingDay: "27 Sep 2026",
    managerClearance: "In Progress",
    hrClearance: "Pending",
    itClearance: "Pending",
    financeClearance: "Pending",
    adminClearance: "Pending",
    overallStatus: "Pending",
    remarks: "Handover document drafting."
  }
];

export const SAMPLE_ASSETS = [
  {
    id: 1,
    employee: "Rahul Sharma",
    employeeId: "EMP1024",
    assetId: "AST-1023",
    assetName: "Dell Latitude 5440",
    assetCategory: "Laptop",
    serialNumber: "DL45892",
    issueDate: "10 Jan 2025",
    expectedReturnDate: "20 Sep 2026",
    returnDate: "—",
    condition: "Good",
    status: "Pending",
    accessories: ["Charger", "Laptop Bag", "Wireless Mouse"]
  },
  {
    id: 2,
    employee: "Rahul Sharma",
    employeeId: "EMP1024",
    assetId: "AST-1045",
    assetName: "Employee ID Card",
    assetCategory: "ID Card",
    serialNumber: "ID7842",
    issueDate: "10 Jan 2025",
    expectedReturnDate: "20 Sep 2026",
    returnDate: "18 Sep 2026",
    condition: "Good",
    status: "Returned",
    accessories: ["Lanyard"]
  },
  {
    id: 3,
    employee: "Priya Patel",
    employeeId: "EMP1087",
    assetId: "AST-1098",
    assetName: "HP ProBook 440 G9",
    assetCategory: "Laptop",
    serialNumber: "HP78452",
    issueDate: "15 Mar 2025",
    expectedReturnDate: "24 Sep 2026",
    returnDate: "—",
    condition: "Good",
    status: "Pending",
    accessories: ["Power Adapter", "Case"]
  },
  {
    id: 4,
    employee: "Amit Verma",
    employeeId: "EMP1132",
    assetId: "AST-1140",
    assetName: "Lenovo ThinkPad E14",
    assetCategory: "Laptop",
    serialNumber: "LN90123",
    issueDate: "02 Feb 2025",
    expectedReturnDate: "17 Sep 2026",
    returnDate: "15 Sep 2026",
    condition: "Good",
    status: "Returned",
    accessories: ["65W USB-C Charger", "HDMI Cable"]
  },
  {
    id: 5,
    employee: "Vikram Singh",
    employeeId: "EMP1190",
    assetId: "AST-1205",
    assetName: "Dell UltraSharp 27 Monitor",
    assetCategory: "Peripheral",
    serialNumber: "MN55231",
    issueDate: "20 Apr 2025",
    expectedReturnDate: "27 Sep 2026",
    returnDate: "—",
    condition: "Good",
    status: "Pending",
    accessories: ["Stand", "DP Cable", "Power Cord"]
  },
  {
    id: 6,
    employee: "Sneha Kulkarni",
    employeeId: "EMP1211",
    assetId: "AST-1088",
    assetName: "Apple MacBook Air M2",
    assetCategory: "Laptop",
    serialNumber: "C02XYZ1234",
    issueDate: "11 May 2025",
    expectedReturnDate: "09 Sep 2026",
    returnDate: "08 Sep 2026",
    condition: "Good",
    status: "Returned",
    accessories: ["MagSafe Charger", "Sleeve"]
  }
];

export const SAMPLE_NO_DUES = [
  {
    id: 1,
    employee: "Rahul Sharma",
    employeeId: "EMP1024",
    department: "Engineering",
    finance: "Cleared",
    it: "Cleared",
    admin: "Cleared",
    hr: "Cleared",
    totalDues: 0,
    recoveryAmount: 0,
    remainingAmount: 0,
    status: "Cleared",
    remarks: "Zero balance outstanding.",
    details: {
      salaryAdvance: 0,
      travelClaims: 0,
      itDamage: 0,
      noticeShortfall: 0
    }
  },
  {
    id: 2,
    employee: "Priya Patel",
    employeeId: "EMP1087",
    department: "Human Resources",
    finance: "Pending",
    it: "Cleared",
    admin: "Cleared",
    hr: "Cleared",
    totalDues: 5000,
    recoveryAmount: 2000,
    remainingAmount: 3000,
    status: "Partial Dues",
    remarks: "Pending travel advance settlement.",
    details: {
      salaryAdvance: 3000,
      travelClaims: 0,
      itDamage: 0,
      noticeShortfall: 0
    }
  },
  {
    id: 3,
    employee: "Amit Verma",
    employeeId: "EMP1132",
    department: "Finance",
    finance: "Cleared",
    it: "Cleared",
    admin: "Pending",
    hr: "Cleared",
    totalDues: 0,
    recoveryAmount: 0,
    remainingAmount: 0,
    status: "Pending",
    remarks: "Admin ID card deposit refund check.",
    details: {
      salaryAdvance: 0,
      travelClaims: 0,
      itDamage: 0,
      noticeShortfall: 0
    }
  },
  {
    id: 4,
    employee: "Neha Gupta",
    employeeId: "EMP1055",
    department: "Design",
    finance: "Cleared",
    it: "Cleared",
    admin: "Cleared",
    hr: "Cleared",
    totalDues: 0,
    recoveryAmount: 0,
    remainingAmount: 0,
    status: "Cleared",
    remarks: "Certified clean no-dues report.",
    details: {
      salaryAdvance: 0,
      travelClaims: 0,
      itDamage: 0,
      noticeShortfall: 0
    }
  }
];

export const SAMPLE_FNF = [
  {
    id: 1,
    employee: "Rahul Sharma",
    employeeId: "EMP1024",
    lastWorkingDay: "20 Sep 2026",
    grossEarnings: 72500,
    deductions: 8500,
    leaveEncashment: 12000,
    netPayable: 76000,
    settlementDate: "25 Sep 2026",
    status: "Approved",
    earnings: {
      basic: 35000,
      hra: 15000,
      conveyance: 2500,
      specialAllowance: 15000,
      bonus: 5000,
      incentives: 0,
      overtime: 0,
      arrears: 0,
      leaveEncashment: 12000,
      reimbursements: 0
    },
    deductionsDetail: {
      noticeRecovery: 0,
      loanRecovery: 0,
      salaryAdvance: 0,
      assetRecovery: 0,
      tax: 4500,
      pf: 3000,
      esi: 1000,
      otherDeductions: 0
    },
    payment: {
      mode: "NEFT / Direct Bank Transfer",
      bankAccount: "HDFC Bank ••••••4521",
      transactionRef: "NIBPAY20260925789",
      paymentDate: "25 Sep 2026",
      status: "Approved",
      processedBy: "Suresh Pillai (Finance Head)",
      approvedBy: "Anjali Mehta (HR Director)"
    }
  },
  {
    id: 2,
    employee: "Priya Patel",
    employeeId: "EMP1087",
    lastWorkingDay: "24 Sep 2026",
    grossEarnings: 58000,
    deductions: 3500,
    leaveEncashment: 8000,
    netPayable: 62500,
    settlementDate: "—",
    status: "Pending",
    earnings: {
      basic: 28000,
      hra: 12000,
      conveyance: 2000,
      specialAllowance: 16000,
      bonus: 0,
      incentives: 0,
      overtime: 0,
      arrears: 0,
      leaveEncashment: 8000,
      reimbursements: 0
    },
    deductionsDetail: {
      noticeRecovery: 0,
      loanRecovery: 0,
      salaryAdvance: 1500,
      assetRecovery: 0,
      tax: 1200,
      pf: 800,
      esi: 0,
      otherDeductions: 0
    },
    payment: {
      mode: "Bank Transfer",
      bankAccount: "ICICI Bank ••••••9014",
      transactionRef: "Pending",
      paymentDate: "Scheduled 28 Sep 2026",
      status: "Pending",
      processedBy: "Pending",
      approvedBy: "Pending"
    }
  },
  {
    id: 3,
    employee: "Amit Verma",
    employeeId: "EMP1132",
    lastWorkingDay: "17 Sep 2026",
    grossEarnings: 64000,
    deductions: 10000,
    leaveEncashment: 6500,
    netPayable: 60500,
    settlementDate: "22 Sep 2026",
    status: "Paid",
    earnings: {
      basic: 30000,
      hra: 14000,
      conveyance: 2000,
      specialAllowance: 18000,
      bonus: 0,
      incentives: 0,
      overtime: 0,
      arrears: 0,
      leaveEncashment: 6500,
      reimbursements: 0
    },
    deductionsDetail: {
      noticeRecovery: 0,
      loanRecovery: 5000,
      salaryAdvance: 0,
      assetRecovery: 0,
      tax: 3000,
      pf: 2000,
      esi: 0,
      otherDeductions: 0
    },
    payment: {
      mode: "RTGS",
      bankAccount: "SBI ••••••7732",
      transactionRef: "TXN8892147321",
      paymentDate: "22 Sep 2026",
      status: "Paid",
      processedBy: "Suresh Pillai",
      approvedBy: "Executive Director"
    }
  },
  {
    id: 4,
    employee: "Neha Gupta",
    employeeId: "EMP1055",
    lastWorkingDay: "04 Sep 2026",
    grossEarnings: 85000,
    deductions: 9000,
    leaveEncashment: 14000,
    netPayable: 90000,
    settlementDate: "09 Sep 2026",
    status: "Paid",
    earnings: {
      basic: 40000,
      hra: 18000,
      conveyance: 3000,
      specialAllowance: 24000,
      bonus: 0,
      incentives: 0,
      overtime: 0,
      arrears: 0,
      leaveEncashment: 14000,
      reimbursements: 0
    },
    deductionsDetail: {
      noticeRecovery: 0,
      loanRecovery: 0,
      salaryAdvance: 0,
      assetRecovery: 0,
      tax: 5000,
      pf: 3000,
      esi: 1000,
      otherDeductions: 0
    },
    payment: {
      mode: "Bank Transfer",
      bankAccount: "Axis Bank ••••••1198",
      transactionRef: "AXIS20260909001",
      paymentDate: "09 Sep 2026",
      status: "Paid",
      processedBy: "Finance Team",
      approvedBy: "HR Head"
    }
  }
];

export const SAMPLE_INTERVIEWS = [
  {
    id: 1,
    employee: "Rahul Sharma",
    employeeId: "EMP1024",
    department: "Engineering",
    interviewDate: "19 Sep 2026",
    interviewer: "HR Manager (Pooja Rao)",
    exitReason: "Better Opportunity",
    overallRating: "4.2/5",
    rehireEligible: "Yes",
    status: "Completed",
    ratings: {
      jobSatisfaction: 4,
      management: 4,
      managerSupport: 5,
      compensation: 3,
      benefits: 4,
      workEnvironment: 5,
      careerGrowth: 4,
      learningOpportunities: 5,
      workLifeBalance: 4,
      teamCollaboration: 5,
      companyCulture: 5,
      recognition: 4
    },
    answers: {
      whyLeaving: "Accepted a staff architect role at a global technology firm.",
      likedMost: "Open culture, collaborative team, high autonomy on engineering decisions.",
      disliked: "Occasional delays in hardware procurement approvals.",
      improve: "Streamline cross-departmental clearance workflows.",
      relationshipManager: "Excellent. My engineering manager provided continuous mentorship.",
      goalsSupported: "Yes, attended two cloud conferences funded by the company.",
      recommend: "Yes, definitely recommend to peers.",
      rejoin: "Yes, would gladly consider in the future.",
      retentionChanges: "More frequent mid-year compensation recalibrations.",
      additional: "Thank you for the memorable 3 years!"
    }
  },
  {
    id: 2,
    employee: "Priya Patel",
    employeeId: "EMP1087",
    department: "Human Resources",
    interviewDate: "23 Sep 2026",
    interviewer: "HR Executive",
    exitReason: "Relocation",
    overallRating: "3.8/5",
    rehireEligible: "Yes",
    status: "Scheduled",
    ratings: {
      jobSatisfaction: 4,
      management: 4,
      managerSupport: 4,
      compensation: 3,
      benefits: 3,
      workEnvironment: 4,
      careerGrowth: 4,
      learningOpportunities: 4,
      workLifeBalance: 4,
      teamCollaboration: 4,
      companyCulture: 4,
      recognition: 4
    },
    answers: {
      whyLeaving: "Relocating out of state.",
      likedMost: "Warm and supportive HR team.",
      disliked: "High peak workload during appraisal quarters.",
      improve: "Better automation in onboarding doc verification.",
      relationshipManager: "Good and supportive.",
      goalsSupported: "Yes.",
      recommend: "Yes.",
      rejoin: "Yes if remote positions are available.",
      retentionChanges: "Flexible remote work policies.",
      additional: "Grateful for the leadership support."
    }
  },
  {
    id: 3,
    employee: "Amit Verma",
    employeeId: "EMP1132",
    department: "Finance",
    interviewDate: "—",
    interviewer: "HR Manager",
    exitReason: "Higher Studies",
    overallRating: "—",
    rehireEligible: "—",
    status: "Pending",
    ratings: {},
    answers: {}
  }
];

export const SAMPLE_DOCUMENTS = [
  {
    id: 1,
    employee: "Rahul Sharma",
    employeeId: "EMP1024",
    department: "Engineering",
    designation: "Senior Software Engineer",
    letterType: "Experience Letter",
    issueDate: "25 Sep 2026",
    generatedBy: "HR Admin",
    approvedBy: "HR Head",
    status: "Issued",
    docNumber: "NIB/EXP/2026/1024",
    tenure: "15 Jan 2023 – 20 Sep 2026"
  },
  {
    id: 2,
    employee: "Rahul Sharma",
    employeeId: "EMP1024",
    department: "Engineering",
    designation: "Senior Software Engineer",
    letterType: "Relieving Letter",
    issueDate: "25 Sep 2026",
    generatedBy: "HR Admin",
    approvedBy: "HR Head",
    status: "Issued",
    docNumber: "NIB/REL/2026/1024",
    tenure: "15 Jan 2023 – 20 Sep 2026"
  },
  {
    id: 3,
    employee: "Priya Patel",
    employeeId: "EMP1087",
    department: "Human Resources",
    designation: "HR Executive",
    letterType: "Experience Letter",
    issueDate: "—",
    generatedBy: "HR Admin",
    approvedBy: "—",
    status: "Pending",
    docNumber: "NIB/EXP/2026/1087",
    tenure: "01 Jun 2024 – 24 Sep 2026"
  },
  {
    id: 4,
    employee: "Neha Gupta",
    employeeId: "EMP1055",
    department: "Design",
    designation: "Product Designer",
    letterType: "Service Certificate",
    issueDate: "05 Sep 2026",
    generatedBy: "HR Admin",
    approvedBy: "HR Head",
    status: "Issued",
    docNumber: "NIB/SRV/2026/1055",
    tenure: "10 Mar 2022 – 04 Sep 2026"
  },
  {
    id: 5,
    employee: "Amit Verma",
    employeeId: "EMP1132",
    department: "Finance",
    designation: "Finance Executive",
    letterType: "Employment Certificate",
    issueDate: "18 Sep 2026",
    generatedBy: "HR Admin",
    approvedBy: "HR Head",
    status: "Issued",
    docNumber: "NIB/EMP/2026/1132",
    tenure: "12 Aug 2023 – 17 Sep 2026"
  }
];

export const SAMPLE_HISTORY = [
  {
    id: 1,
    dateTime: "20 Aug 2026, 10:32 AM",
    employee: "Rahul Sharma",
    employeeId: "EMP1024",
    activity: "Resignation Submitted",
    previousStatus: "—",
    newStatus: "Submitted",
    performedBy: "Rahul Sharma",
    remarks: "Career opportunity",
    badge: "Submitted"
  },
  {
    id: 2,
    dateTime: "21 Aug 2026, 02:15 PM",
    employee: "Rahul Sharma",
    employeeId: "EMP1024",
    activity: "Manager Approved",
    previousStatus: "Submitted",
    newStatus: "Approved",
    performedBy: "Rajesh Kumar (Engineering Manager)",
    remarks: "Approved with standard 30 days notice",
    badge: "Approved"
  },
  {
    id: 3,
    dateTime: "22 Aug 2026, 11:20 AM",
    employee: "Rahul Sharma",
    employeeId: "EMP1024",
    activity: "HR Approved",
    previousStatus: "Approved",
    newStatus: "Notice Period",
    performedBy: "HR Admin",
    remarks: "Notice period started. Last working day set to 20 Sep 2026.",
    badge: "Notice Period"
  },
  {
    id: 4,
    dateTime: "18 Sep 2026, 04:30 PM",
    employee: "Rahul Sharma",
    employeeId: "EMP1024",
    activity: "Asset Returned",
    previousStatus: "Pending",
    newStatus: "Cleared",
    performedBy: "IT Admin",
    remarks: "Laptop received in good physical condition.",
    badge: "Cleared"
  },
  {
    id: 5,
    dateTime: "19 Sep 2026, 05:10 PM",
    employee: "Rahul Sharma",
    employeeId: "EMP1024",
    activity: "Exit Interview",
    previousStatus: "Pending",
    newStatus: "Completed",
    performedBy: "HR Manager",
    remarks: "Completed rating evaluation. Eligible for rehire.",
    badge: "Completed"
  },
  {
    id: 6,
    dateTime: "25 Sep 2026, 03:00 PM",
    employee: "Rahul Sharma",
    employeeId: "EMP1024",
    activity: "F&F Payment",
    previousStatus: "Processing",
    newStatus: "Paid",
    performedBy: "Finance Admin",
    remarks: "₹76,000 paid via NEFT to HDFC Bank.",
    badge: "Paid"
  },
  {
    id: 7,
    dateTime: "25 Sep 2026, 04:30 PM",
    employee: "Rahul Sharma",
    employeeId: "EMP1024",
    activity: "Experience & Relieving Letters Generated",
    previousStatus: "Pending",
    newStatus: "Issued",
    performedBy: "HR Head",
    remarks: "Digitally signed certificates sent via email.",
    badge: "Issued"
  }
];
