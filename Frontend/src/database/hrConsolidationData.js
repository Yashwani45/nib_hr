// Frontend/src/database/hrConsolidationData.js

export const hrSchemas = {
  "1. Organization Setup": {
    "Company": [
      { name: "companyCode", label: "Company Code", type: "text", required: true },
      { name: "companyName", label: "Company Name", type: "text", required: true },
      { name: "shortName", label: "Short Name", type: "text" },
      { name: "type", label: "Company Type", type: "select", options: ["Pvt Ltd", "LLP", "Public", "Proprietorship"] },
      { name: "regNumber", label: "Registration No", type: "text" },
      { name: "cinNumber", label: "CIN Number", type: "text" },
      { name: "panNumber", label: "PAN Number", type: "text" },
      { name: "tanNumber", label: "TAN Number", type: "text" },
      { name: "gstNumber", label: "GST Number", type: "text" },
      { name: "pfNumber", label: "PF Number", type: "text" },
      { name: "esiNumber", label: "ESI Number", type: "text" },
      { name: "email", label: "Email Address", type: "email", required: true },
      { name: "phone", label: "Contact Number", type: "text" },
      { name: "website", label: "Website", type: "text" },
      { name: "address1", label: "Address Line 1", type: "text" },
      { name: "address2", label: "Address Line 2", type: "text" },
      { name: "country", label: "Country", type: "text" },
      { name: "state", label: "State", type: "text" },
      { name: "city", label: "City", type: "text" },
      { name: "district", label: "District", type: "text" },
      { name: "pincode", label: "Pincode", type: "text" },
      { name: "timezone", label: "Time Zone", type: "text" },
      { name: "currency", label: "Currency", type: "text" },
      { name: "financialYear", label: "Financial Year", type: "text" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] }
    ],
    "Branch": [
      { name: "branchCode", label: "Branch Code", type: "text", required: true },
      { name: "branchName", label: "Branch Name", type: "text", required: true },
      { name: "company", label: "Company", type: "text" },
      { name: "branchType", label: "Branch Type", type: "select", options: ["HQ", "Regional", "Sales Office", "R&D"] },
      { name: "address", label: "Address", type: "text" },
      { name: "country", label: "Country", type: "text" },
      { name: "state", label: "State", type: "text" },
      { name: "city", label: "City", type: "text" },
      { name: "district", label: "District", type: "text" },
      { name: "pincode", label: "Pincode", type: "text" },
      { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "Phone Number", type: "text" },
      { name: "manager", label: "Branch Manager", type: "text" },
      { name: "timezone", label: "Time Zone", type: "text" },
      { name: "workingDays", label: "Working Days", type: "text" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] }
    ],
    "Department": [
      { name: "deptCode", label: "Department Code", type: "text", required: true },
      { name: "deptName", label: "Department Name", type: "text", required: true },
      { name: "head", label: "Department Head", type: "text" },
      { name: "parentDept", label: "Parent Department", type: "text" },
      { name: "company", label: "Company", type: "text" },
      { name: "branch", label: "Branch", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] }
    ],
    "Designation": [
      { name: "desigCode", label: "Designation Code", type: "text", required: true },
      { name: "desigName", label: "Designation Name", type: "text", required: true },
      { name: "department", label: "Department", type: "text" },
      { name: "jobLevel", label: "Job Level", type: "text" },
      { name: "grade", label: "Grade", type: "text" },
      { name: "description", label: "Job Description", type: "textarea" },
      { name: "reportingDesig", label: "Reporting Designation", type: "text" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] }
    ],
    "Business Unit": [
      { name: "buCode", label: "BU Code", type: "text", required: true },
      { name: "buName", label: "BU Name", type: "text", required: true },
      { name: "company", label: "Company", type: "text" },
      { name: "branch", label: "Branch", type: "text" },
      { name: "head", label: "Business Head", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] }
    ],
    "Cost Center": [
      { name: "ccCode", label: "Cost Center Code", type: "text", required: true },
      { name: "ccName", label: "Cost Center Name", type: "text", required: true },
      { name: "company", label: "Company", type: "text" },
      { name: "branch", label: "Branch", type: "text" },
      { name: "department", label: "Department", type: "text" },
      { name: "budget", label: "Budget Amount", type: "number" },
      { name: "effectiveDate", label: "Effective Date", type: "date" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] }
    ],
    "Reporting Hierarchy": [
      { name: "employee", label: "Employee Name", type: "text", required: true },
      { name: "empId", label: "Employee ID", type: "text", required: true },
      { name: "manager", label: "Manager Name", type: "text" },
      { name: "managerId", label: "Manager ID", type: "text" },
      { name: "department", label: "Department", type: "text" },
      { name: "designation", label: "Designation", type: "text" },
      { name: "reportingType", label: "Reporting Type", type: "select", options: ["Direct", "Functional", "Project"] },
      { name: "effectiveFrom", label: "Effective From", type: "date" },
      { name: "effectiveTo", label: "Effective To", type: "date" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] }
    ]
  },
  "2. Employee Management": {
    "Employee Profile": [
      { name: "empCode", label: "Employee Code", type: "text", required: true },
      { name: "firstName", label: "First Name", type: "text", required: true },
      { name: "lastName", label: "Last Name", type: "text", required: true },
      { name: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"] },
      { name: "dob", label: "Date of Birth", type: "date" },
      { name: "maritalStatus", label: "Marital Status", type: "select", options: ["Single", "Married", "Divorced", "Widowed"] },
      { name: "nationality", label: "Nationality", type: "text" },
      { name: "employmentStatus", label: "Employment Status", type: "select", options: ["Active", "Inactive"] },
      { name: "employmentType", label: "Employment Type", type: "select", options: ["Permanent", "Contract", "Intern"] },
      { name: "joiningDate", label: "Joining Date", type: "date" },
      { name: "department", label: "Department", type: "text" },
      { name: "designation", label: "Designation", type: "text" },
      { name: "manager", label: "Reporting Manager", type: "text" },
      { name: "branch", label: "Branch/Office Location", type: "text" },
      { name: "shift", label: "Work Shift", type: "text" },
      { name: "companyEmail", label: "Company Email", type: "email" },
      { name: "personalEmail", label: "Personal Email", type: "email" },
      { name: "phone", label: "Mobile Number", type: "text" },
      { name: "bankName", label: "Bank Name", type: "text" },
      { name: "accountNo", label: "Account Number", type: "text" },
      { name: "ifscCode", label: "IFSC Code", type: "text" },
      { name: "pan", label: "PAN Number", type: "text" },
      { name: "aadhaar", label: "Aadhaar Number", type: "text" },
      { name: "pfNum", label: "PF Number", type: "text" },
      { name: "esicNum", label: "ESIC Number", type: "text" },
      { name: "username", label: "Username", type: "text" },
      { name: "role", label: "Role", type: "select", options: ["Employee", "Manager", "HR Admin", "System Admin"] }
    ]
  },
  "3. Recruitment & Onboarding": {
    "Job Requisition": [
      { name: "reqId", label: "Requisition ID", type: "text", required: true },
      { name: "jobTitle", label: "Job Title", type: "text", required: true },
      { name: "department", label: "Department", type: "text" },
      { name: "vacancies", label: "Number of Vacancies", type: "number" },
      { name: "employmentType", label: "Employment Type", type: "select", options: ["Permanent", "Contract", "Intern"] },
      { name: "experienceRequired", label: "Experience Required", type: "text" },
      { name: "skills", label: "Skills Required", type: "text" },
      { name: "budgetSalary", label: "Budgeted Salary", type: "text" },
      { name: "joiningDate", label: "Expected Joining Date", type: "date" },
      { name: "approvalStatus", label: "Approval Status", type: "select", options: ["Pending", "Approved", "Rejected"] },
      { name: "status", label: "Requisition Status", type: "select", options: ["Open", "Closed", "Hold"] }
    ],
    "Candidate Database": [
      { name: "candidateId", label: "Candidate ID", type: "text", required: true },
      { name: "firstName", label: "First Name", type: "text", required: true },
      { name: "lastName", label: "Last Name", type: "text" },
      { name: "email", label: "Email Address", type: "email", required: true },
      { name: "phone", label: "Mobile Number", type: "text" },
      { name: "qualification", label: "Highest Qualification", type: "text" },
      { name: "experience", label: "Total Experience (Years)", type: "number" },
      { name: "currentCompany", label: "Current Company", type: "text" },
      { name: "expectedSalary", label: "Expected Salary", type: "text" },
      { name: "skills", label: "Skills", type: "text" },
      { name: "status", label: "Candidate Status", type: "select", options: ["Applied", "Screened", "Interviewing", "Selected", "Offered", "Rejected"] }
    ],
    "ATS (Applicant Tracking)": [
      { name: "appId", label: "Application ID", type: "text", required: true },
      { name: "candidate", label: "Candidate Name", type: "text", required: true },
      { name: "jobPosting", label: "Job Posting", type: "text" },
      { name: "appliedDate", label: "Applied Date", type: "date" },
      { name: "stage", label: "Current Stage", type: "select", options: ["Screening", "Interview", "Selection", "Offered", "Hired"] },
      { name: "recruiter", label: "Recruiter", type: "text" },
      { name: "rating", label: "Candidate Rating (1-5)", type: "number" },
      { name: "status", label: "Hiring Status", type: "select", options: ["Active", "Offered", "Rejected", "Archived"] }
    ],
    "Asset Allocation": [
      { name: "allocationId", label: "Allocation ID", type: "text", required: true },
      { name: "employee", label: "Employee Name", type: "text", required: true },
      { name: "empId", label: "Employee ID", type: "text" },
      { name: "assetCategory", label: "Asset Category", type: "select", options: ["Laptop", "Mobile", "SIM Card", "Access Card", "Software License"] },
      { name: "assetName", label: "Asset Name", type: "text" },
      { name: "assetCode", label: "Asset Code", type: "text" },
      { name: "serialNumber", label: "Serial Number", type: "text" },
      { name: "issueDate", label: "Issue Date", type: "date" },
      { name: "status", label: "Allocation Status", type: "select", options: ["Assigned", "Returned", "Scrap"] }
    ]
  },
  "4. Attendance & Shift": {
    "Daily Attendance": [
      { name: "empId", label: "Employee ID", type: "text", required: true },
      { name: "name", label: "Employee Name", type: "text", required: true },
      { name: "date", label: "Date", type: "date", required: true },
      { name: "checkIn", label: "Check-In Time", type: "text" },
      { name: "checkOut", label: "Check-Out Time", type: "text" },
      { name: "workingHours", label: "Working Hours", type: "number" },
      { name: "status", label: "Attendance Status", type: "select", options: ["Present", "Absent", "Half Day", "Leave", "Holiday"] },
      { name: "lateComing", label: "Late Coming (Min)", type: "number" },
      { name: "earlyLeaving", label: "Early Leaving (Min)", type: "number" },
      { name: "overtime", label: "Overtime (Hrs)", type: "number" }
    ],
    "Shift Master": [
      { name: "shiftCode", label: "Shift Code", type: "text", required: true },
      { name: "shiftName", label: "Shift Name", type: "text", required: true },
      { name: "startTime", label: "Start Time", type: "text" },
      { name: "endTime", label: "End Time", type: "text" },
      { name: "graceTime", label: "Grace Time (Min)", type: "number" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] }
    ]
  },
  "5. Leave Management": {
    "Leave Types": [
      { name: "leaveCode", label: "Leave Code", type: "text", required: true },
      { name: "leaveName", label: "Leave Name", type: "text", required: true },
      { name: "category", label: "Category", type: "select", options: ["Paid", "Unpaid", "Special"] },
      { name: "maxDays", label: "Max Days/Year", type: "number" },
      { name: "carryForward", label: "Carry Forward", type: "select", options: ["Yes", "No"] },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] }
    ],
    "Leave Requests": [
      { name: "reqId", label: "Request ID", type: "text", required: true },
      { name: "empName", label: "Employee Name", type: "text", required: true },
      { name: "leaveType", label: "Leave Type", type: "text" },
      { name: "fromDate", label: "From Date", type: "date" },
      { name: "toDate", label: "To Date", type: "date" },
      { name: "totalDays", label: "Total Days", type: "number" },
      { name: "reason", label: "Reason", type: "textarea" },
      { name: "status", label: "Request Status", type: "select", options: ["Pending", "Approved", "Rejected"] }
    ]
  },
  "6. Payroll & Compensation": {
    "Salary Structure": [
      { name: "empName", label: "Employee Name", type: "text", required: true },
      { name: "basic", label: "Basic Salary", type: "number", required: true },
      { name: "hra", label: "HRA", type: "number" },
      { name: "da", label: "Dearness Allowance", type: "number" },
      { name: "special", label: "Special Allowance", type: "number" },
      { name: "conveyance", label: "Conveyance Allowance", type: "number" },
      { name: "gross", label: "Gross Salary", type: "number" },
      { name: "pfDeduction", label: "PF Deduction (12%)", type: "number" },
      { name: "esiDeduction", label: "ESI Deduction (0.75%)", type: "number" },
      { name: "pt", label: "Professional Tax", type: "number" },
      { name: "tds", label: "TDS", type: "number" },
      { name: "netSalary", label: "Net Pay", type: "number" }
    ],
    "Incentives & Claims": [
      { name: "claimId", label: "Claim ID", type: "text", required: true },
      { name: "empName", label: "Employee Name", type: "text", required: true },
      { name: "type", label: "Type", type: "select", options: ["Performance Bonus", "Sales Commission", "Medical Claim", "Travel Reimbursement"] },
      { name: "amount", label: "Amount", type: "number" },
      { name: "claimDate", label: "Date", type: "date" },
      { name: "status", label: "Status", type: "select", options: ["Pending", "Approved", "Paid", "Rejected"] }
    ]
  },
  "7. Statutory & Tax": {
    "PF Registry": [
      { name: "empId", label: "Employee ID", type: "text", required: true },
      { name: "empName", label: "Employee Name", type: "text", required: true },
      { name: "uan", label: "UAN Number", type: "text" },
      { name: "pfNo", label: "PF Number", type: "text" },
      { name: "basicSalary", label: "PF Wages", type: "number" },
      { name: "employeeContribution", label: "Employee Contrib (12%)", type: "number" },
      { name: "employerContribution", label: "Employer Contrib (3.67%)", type: "number" },
      { name: "epsContribution", label: "EPS Contrib (8.33%)", type: "number" }
    ],
    "Tax Declarations": [
      { name: "empName", label: "Employee Name", type: "text", required: true },
      { name: "regime", label: "Tax Regime", type: "select", options: ["New", "Old"] },
      { name: "hraDecl", label: "HRA Declaration", type: "number" },
      { name: "sec80C", label: "Section 80C", type: "number" },
      { name: "sec80D", label: "Section 80D", type: "number" },
      { name: "homeLoan", label: "Home Loan Interest", type: "number" },
      { name: "status", label: "Verification Status", type: "select", options: ["Pending", "Approved", "Rejected"] }
    ]
  },
  "8. Performance Management": {
    "KPI & OKR": [
      { name: "goalId", label: "Goal ID", type: "text", required: true },
      { name: "empName", label: "Employee Name", type: "text", required: true },
      { name: "kpiName", label: "KPI Metric / Goal", type: "text", required: true },
      { name: "target", label: "Target Value", type: "text" },
      { name: "current", label: "Current Progress", type: "number" },
      { name: "weightage", label: "Weightage (%)", type: "number" },
      { name: "status", label: "Completion Status", type: "select", options: ["Not Started", "In Progress", "Achieved", "Missed"] }
    ],
    "Performance Reviews": [
      { name: "empName", label: "Employee Name", type: "text", required: true },
      { name: "reviewer", label: "Manager / Reviewer", type: "text" },
      { name: "selfRating", label: "Self Rating (1-5)", type: "number" },
      { name: "managerRating", label: "Manager Rating (1-5)", type: "number" },
      { name: "overallRating", label: "Overall Score", type: "number" },
      { name: "comments", label: "Review Feedback", type: "textarea" },
      { name: "status", label: "Review Status", type: "select", options: ["Draft", "Submitted", "Completed"] }
    ]
  },
  "9. Learning & Development": {
    "Courses": [
      { name: "courseCode", label: "Course Code", type: "text", required: true },
      { name: "courseName", label: "Course Name", type: "text", required: true },
      { name: "category", label: "Category", type: "select", options: ["Technical", "Soft Skills", "Compliance", "Leadership"] },
      { name: "duration", label: "Duration (Hrs)", type: "number" },
      { name: "instructor", label: "Instructor", type: "text" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Archived"] }
    ],
    "LMS Progress": [
      { name: "empName", label: "Employee Name", type: "text", required: true },
      { name: "courseName", label: "Course Name", type: "text" },
      { name: "enrollDate", label: "Enrollment Date", type: "date" },
      { name: "progress", label: "Progress (%)", type: "number" },
      { name: "quizScore", label: "Quiz Score (%)", type: "number" },
      { name: "status", label: "Completion Status", type: "select", options: ["Enrolled", "In Progress", "Completed"] }
    ]
  },
  "11. Asset Management": {
    "Inventory": [
      { name: "assetCode", label: "Asset Code", type: "text", required: true },
      { name: "category", label: "Asset Category", type: "select", options: ["Laptop", "Mobile", "SIM Card", "Access Card", "Software License"] },
      { name: "brand", label: "Brand", type: "text" },
      { name: "model", label: "Model", type: "text" },
      { name: "serialNo", label: "Serial Number", type: "text" },
      { name: "status", label: "Current Status", type: "select", options: ["Available", "Assigned", "Under Repair", "Scrapped"] }
    ]
  },
  "12. Travel & Expense": {
    "Expense Claims": [
      { name: "claimId", label: "Claim ID", type: "text", required: true },
      { name: "empName", label: "Employee Name", type: "text", required: true },
      { name: "category", label: "Category", type: "select", options: ["Travel & Lodging", "Meals & Entertainment", "Office Supplies", "Internet & Mobile"] },
      { name: "amount", label: "Claimed Amount", type: "number", required: true },
      { name: "description", label: "Description", type: "text" },
      { name: "status", label: "Claim Status", type: "select", options: ["Pending", "Approved", "Reimbursed", "Rejected"] }
    ]
  },
  "13. Document Management": {
    "Document Log": [
      { name: "docId", label: "Document ID", type: "text", required: true },
      { name: "empName", label: "Employee Name", type: "text" },
      { name: "docType", label: "Document Type", type: "select", options: ["Offer Letter", "Appointment Letter", "Promotion Letter", "Increment Letter", "Warning Letter", "Contract", "Policy"] },
      { name: "fileName", label: "File Name", type: "text" },
      { name: "issueDate", label: "Issued Date", type: "date" },
      { name: "status", label: "Verification Status", type: "select", options: ["Draft", "Sent", "Signed", "Expired"] }
    ]
  },
  "14. Exit Management": {
    "Exit Logs": [
      { name: "empName", label: "Employee Name", type: "text", required: true },
      { name: "resignationDate", label: "Resignation Date", type: "date" },
      { name: "lastWorkingDate", label: "Last Working Date", type: "date" },
      { name: "reason", label: "Reason for Leaving", type: "textarea" },
      { name: "noDuesStatus", label: "No Dues Clearance", type: "select", options: ["Pending", "In Progress", "Completed"] },
      { name: "fnfStatus", label: "Full & Final Settlement", type: "select", options: ["Pending", "Settled", "Hold"] }
    ]
  },
  "15. Workflow & Approval": {
    "Approvals Pending": [
      { name: "workflowId", label: "Workflow ID", type: "text", required: true },
      { name: "empName", label: "Requestor", type: "text", required: true },
      { name: "category", label: "Workflow Category", type: "select", options: ["Leave Request", "Expense Claim", "Recruitment Approval", "Promotion Request", "Exit Clearance"] },
      { name: "amountOrDays", label: "Details (Amt/Days)", type: "text" },
      { name: "approver", label: "Pending With", type: "text" },
      { name: "level", label: "Approval Level", type: "number" },
      { name: "status", label: "Status", type: "select", options: ["Pending", "Approved", "Rejected"] }
    ]
  },
  "16. Employee Engagement": {
    "Announcements & Surveys": [
      { name: "postId", label: "Post ID", type: "text", required: true },
      { name: "title", label: "Title / Topic", type: "text", required: true },
      { name: "type", label: "Type", type: "select", options: ["Announcement", "News & Event", "Recognition Award", "Survey", "Poll"] },
      { name: "publishDate", label: "Publish Date", type: "date" },
      { name: "content", label: "Content Details", type: "textarea" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Scheduled", "Closed"] }
    ]
  },
  "17. Helpdesk & HR Ticketing": {
    "HR Tickets": [
      { name: "ticketNo", label: "Ticket Number", type: "text", required: true },
      { name: "empName", label: "Requestor Name", type: "text", required: true },
      { name: "category", label: "Ticket Category", type: "select", options: ["Payroll & Salary", "Leave & Attendance", "IT Support", "Admin & Office", "Complaint"] },
      { name: "subject", label: "Subject", type: "text", required: true },
      { name: "priority", label: "Priority", type: "select", options: ["Low", "Medium", "High", "Critical"] },
      { name: "assignedTo", label: "Assigned To", type: "text" },
      { name: "status", label: "Ticket Status", type: "select", options: ["Open", "In Progress", "Resolved", "Closed"] }
    ],
    "Complaint Management": [
      { name: "complaintNo", label: "Complaint Number", type: "text", required: true },
      { name: "empName", label: "Requestor Name", type: "text", required: true },
      { name: "category", label: "Category", type: "text" },
      { name: "subject", label: "Subject", type: "text" },
      { name: "complaintAgainst", label: "Against", type: "text" },
      { name: "assignedTo", label: "Assigned To", type: "text" },
      { name: "status", label: "Status", type: "select", options: ["Open", "In Progress", "Resolved", "Closed"] }
    ],
    "Query Resolution": [
      { name: "queryId", label: "Query ID", type: "text", required: true },
      { name: "empName", label: "Employee Name", type: "text", required: true },
      { name: "category", label: "Category", type: "text" },
      { name: "subject", label: "Subject", type: "text" },
      { name: "response", label: "Response", type: "textarea" },
      { name: "status", label: "Status", type: "select", options: ["Pending", "Resolved"] }
    ],
    "Service Requests": [
      { name: "reqId", label: "Request ID", type: "text", required: true },
      { name: "empName", label: "Employee Name", type: "text", required: true },
      { name: "category", label: "Category", type: "text" },
      { name: "subject", label: "Subject", type: "text" },
      { name: "approvedBy", label: "Approved By", type: "text" },
      { name: "status", label: "Status", type: "select", options: ["Pending", "Approved", "Rejected"] }
    ],
    "Ticket Tracking": [
      { name: "trackId", label: "Tracking ID", type: "text", required: true },
      { name: "ticketNo", label: "Ticket Number", type: "text", required: true },
      { name: "currentStatus", label: "Current Status", type: "text" },
      { name: "previousStatus", label: "Previous Status", type: "text" },
      { name: "updateTime", label: "Update Time", type: "text" }
    ]
  },
  "19. Notifications": {
    "Logs": [
      { name: "notifId", label: "Notification ID", type: "text", required: true },
      { name: "recipient", label: "Recipient", type: "text" },
      { name: "channel", label: "Channel", type: "select", options: ["Email", "SMS", "Push", "In-App"] },
      { name: "subject", label: "Subject / Title", type: "text" },
      { name: "event", label: "Trigger Event", type: "text" },
      { name: "sentTime", label: "Sent Time", type: "text" },
      { name: "status", label: "Delivery Status", type: "select", options: ["Sent", "Delivered", "Failed", "Pending"] }
    ],
    "Email Notifications": [
      { name: "code", label: "Template Code", type: "text", required: true },
      { name: "name", label: "Template Name", type: "text", required: true },
      { name: "channel", label: "Channel", type: "text" },
      { name: "triggerEvent", label: "Trigger Event", type: "text" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] }
    ],
    "SMS Notifications": [
      { name: "code", label: "Template Code", type: "text", required: true },
      { name: "name", label: "Template Name", type: "text", required: true },
      { name: "channel", label: "Channel", type: "text" },
      { name: "triggerEvent", label: "Trigger Event", type: "text" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] }
    ],
    "Push Notifications": [
      { name: "code", label: "Template Code", type: "text", required: true },
      { name: "name", label: "Template Name", type: "text", required: true },
      { name: "channel", label: "Channel", type: "text" },
      { name: "triggerEvent", label: "Trigger Event", type: "text" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] }
    ],
    "Approval Alerts": [
      { name: "code", label: "Template Code", type: "text", required: true },
      { name: "name", label: "Template Name", type: "text", required: true },
      { name: "channel", label: "Channel", type: "text" },
      { name: "triggerEvent", label: "Trigger Event", type: "text" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] }
    ]
  },
  "20. Security & Admin": {
    "RBAC Roles": [
      { name: "roleName", label: "Role Name", type: "text", required: true },
      { name: "description", label: "Description", type: "text" },
      { name: "permissions", label: "Permissions Count", type: "number" },
      { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] }
    ],
    "Audit Logs": [
      { name: "actor", label: "Actor", type: "text", required: true },
      { name: "action", label: "Action Logged", type: "text", required: true },
      { name: "timestamp", label: "Timestamp", type: "text" },
      { name: "ip", label: "IP Address", type: "text" }
    ],
    "Login History": [
      { name: "username", label: "Username", type: "text", required: true },
      { name: "time", label: "Login Time", type: "text" },
      { name: "status", label: "Status", type: "text" },
      { name: "ip", label: "IP Address", type: "text" }
    ]
  }
};

export const initialHrData = {
  "Company": [
    { id: 1, companyCode: "NIB01", companyName: "NIB Technologies Pvt Ltd", shortName: "NIB", type: "Pvt Ltd", regNumber: "U72200DL2021PTC384591", cinNumber: "L72200DL2021PTC384591", panNumber: "AAACN4321A", tanNumber: "DELN09876F", gstNumber: "07AAACN4321A1Z9", pfNumber: "DLCPM0012345000", esiNumber: "31000123450010101", email: "contact@nibtech.com", phone: "+91-11-45678901", website: "https://www.nibtech.com", address1: "B-45, Phase III", address2: "Okhla Industrial Area", country: "India", state: "Delhi", city: "New Delhi", district: "South Delhi", pincode: "110020", timezone: "IST (GMT+5:30)", currency: "INR (₹)", financialYear: "2026-2027", status: "Active" }
  ],
  "Branch": [
    { id: 1, branchCode: "NIB-HQ", branchName: "New Delhi HQ", company: "NIB Technologies Pvt Ltd", branchType: "HQ", address: "Okhla Phase III, New Delhi", country: "India", state: "Delhi", city: "New Delhi", district: "South Delhi", pincode: "110020", email: "hq@nibtech.com", phone: "+91-11-45678901", manager: "Rahul Sharma", timezone: "IST (GMT+5:30)", workingDays: "Mon-Fri", status: "Active" },
    { id: 2, branchCode: "NIB-BLR", branchName: "Bengaluru Regional Office", company: "NIB Technologies Pvt Ltd", branchType: "Regional", address: "Whitefield, Bengaluru", country: "India", state: "Karnataka", city: "Bengaluru", district: "Bengaluru Urban", pincode: "560066", email: "blr@nibtech.com", phone: "+91-80-65432109", manager: "Amit Verma", timezone: "IST (GMT+5:30)", workingDays: "Mon-Fri", status: "Active" }
  ],
  "Department": [
    { id: 1, deptCode: "DEPT-HR", deptName: "Human Resource", head: "Rahul Sharma", parentDept: "None", company: "NIB Technologies", branch: "New Delhi HQ", description: "Handles recruitment, benefits, employee relations, and training.", status: "Active" },
    { id: 2, deptCode: "DEPT-IT", deptName: "IT Support & Security", head: "Amit Verma", parentDept: "None", company: "NIB Technologies", branch: "Bengaluru Regional Office", description: "Maintains hardware, software licenses, network setup, and IT tickets.", status: "Active" }
  ],
  "Designation": [
    { id: 1, desigCode: "DESG-HR-MGR", desigName: "HR Manager", department: "Human Resource", jobLevel: "L3", grade: "Grade B", description: "Heads the HR operations, compliance, and onboarding.", reportingDesig: "Chief Operations Officer", status: "Active" },
    { id: 2, desigCode: "DESG-SW-ENG", desigName: "Software Engineer", department: "IT Support & Security", jobLevel: "L1", grade: "Grade D", description: "Performs full stack development and maintains core tools.", reportingDesig: "Engineering Director", status: "Active" }
  ],
  "Business Unit": [
    { id: 1, buCode: "BU-ENG", buName: "Core Engineering", company: "NIB Technologies", branch: "Bengaluru Regional Office", head: "Vikram Seth", description: "Responsible for building core product features.", status: "Active" }
  ],
  "Cost Center": [
    { id: 1, ccCode: "CC-IT-OPS", ccName: "IT Operations Budget", company: "NIB Technologies", branch: "New Delhi HQ", department: "IT Support & Security", budget: 1500000, effectiveDate: "2026-04-01", status: "Active" }
  ],
  "Reporting Hierarchy": [
    { id: 1, employee: "Amit Verma", empId: "EMP002", manager: "Rahul Sharma", managerId: "EMP001", department: "IT Support & Security", designation: "Software Engineer", reportingType: "Direct", effectiveFrom: "2022-08-22", effectiveTo: "2028-12-31", status: "Active" }
  ],
  "Employee Profile": [
    { id: 1, empCode: "EMP001", firstName: "Rahul", lastName: "Sharma", gender: "Male", dob: "1988-05-14", maritalStatus: "Married", nationality: "Indian", employmentStatus: "Active", employmentType: "Permanent", joiningDate: "2021-04-12", department: "Human Resource", designation: "HR Manager", manager: "Vikram Seth (COO)", branch: "New Delhi HQ", shift: "General Shift", companyEmail: "rahul.sharma@nibhr.com", personalEmail: "rahul.sharma88@gmail.com", phone: "9876543210", bankName: "HDFC Bank", accountNo: "50100234567891", ifscCode: "HDFC0001234", pan: "ABCDE1234F", aadhaar: "1234-5678-9012", pfNum: "DLCPM0012345000/0001", esicNum: "310001234500101", username: "rsharma", role: "HR Admin" },
    { id: 2, empCode: "EMP002", firstName: "Amit", lastName: "Verma", gender: "Male", dob: "1994-11-22", maritalStatus: "Single", nationality: "Indian", employmentStatus: "Active", employmentType: "Permanent", joiningDate: "2022-08-22", department: "IT Support & Security", designation: "Software Engineer", manager: "Rahul Sharma", branch: "Bengaluru Regional Office", shift: "Flexible Shift", companyEmail: "amit.verma@nibhr.com", personalEmail: "amit.verma94@gmail.com", phone: "9123456780", bankName: "ICICI Bank", accountNo: "009905678912", ifscCode: "ICIC0000099", pan: "PQRSX5678K", aadhaar: "4567-8901-2345", pfNum: "DLCPM0012345000/0002", esicNum: "310001234500102", username: "averma", role: "Employee" }
  ],
  "Job Requisition": [
    { id: 1, reqId: "REQ-2026-001", jobTitle: "Senior React Developer", department: "IT Support & Security", vacancies: 2, employmentType: "Permanent", experienceRequired: "5-7 Years", skills: "React, Redux, Node.js, Tailwind CSS", budgetSalary: "1,200,000 - 1,800,000 INR", joiningDate: "2026-09-01", approvalStatus: "Approved", status: "Open" }
  ],
  "Candidate Database": [
    { id: 1, candidateId: "CAND-001", firstName: "Suresh", lastName: "Prasad", email: "suresh.prasad@gmail.com", phone: "9812345678", qualification: "B.Tech CSE", experience: 6, currentCompany: "TechSolutions Corp", expectedSalary: "1,500,000 INR", skills: "React, TypeScript, Jest, Tailwind", status: "Selected" }
  ],
  "ATS (Applicant Tracking)": [
    { id: 1, appId: "APP-001", candidate: "Suresh Prasad", jobPosting: "Senior React Developer", appliedDate: "2026-07-01", stage: "Selection", recruiter: "Rahul Sharma", rating: 5, status: "Active" },
    { id: 2, appId: "APP-002", candidate: "Aditi Rao", jobPosting: "HR Executive", appliedDate: "2026-07-03", stage: "Offered", recruiter: "Rahul Sharma", rating: 4, status: "Active" }
  ],
  "Asset Allocation": [
    { id: 1, allocationId: "AST-ALLOC-001", employee: "Amit Verma", empId: "EMP002", assetCategory: "Laptop", assetName: "Dell Latitude 5420", assetCode: "LPT-DELL-5420", serialNumber: "CN-08XX88-12345", issueDate: "2022-08-22", status: "Assigned" }
  ],
  "Daily Attendance": [
    { id: 1, empId: "EMP001", name: "Rahul Sharma", date: "2026-07-14", checkIn: "09:15 AM", checkOut: "06:10 PM", workingHours: 8.9, status: "Present", lateComing: 15, earlyLeaving: 0, overtime: 0 },
    { id: 2, empId: "EMP002", name: "Amit Verma", date: "2026-07-14", checkIn: "08:55 AM", checkOut: "07:30 PM", workingHours: 10.5, status: "Present", lateComing: 0, earlyLeaving: 0, overtime: 1.5 }
  ],
  "Shift Master": [
    { id: 1, shiftCode: "SHFT-GEN", shiftName: "General Shift", startTime: "09:00 AM", endTime: "06:00 PM", graceTime: 15, status: "Active" }
  ],
  "Leave Types": [
    { id: 1, leaveCode: "LV-CL", leaveName: "Casual Leave", category: "Paid", maxDays: 12, carryForward: "No", status: "Active" }
  ],
  "Leave Requests": [
    { id: 1, reqId: "LV-REQ-001", empName: "Amit Verma", leaveType: "Casual Leave", fromDate: "2026-07-20", toDate: "2026-07-22", totalDays: 3, reason: "Attending family function.", status: "Pending" }
  ],
  "Salary Structure": [
    { id: 1, empName: "Rahul Sharma", basic: 50000, hra: 25000, da: 10000, special: 15000, conveyance: 2000, gross: 102000, pfDeduction: 6000, esiDeduction: 0, pt: 200, tds: 8000, netSalary: 87800 },
    { id: 2, empName: "Amit Verma", basic: 35000, hra: 17500, da: 7000, special: 10000, conveyance: 2000, gross: 71500, pfDeduction: 4200, esiDeduction: 536, pt: 200, tds: 4000, netSalary: 62564 }
  ],
  "Incentives & Claims": [
    { id: 1, claimId: "CLM-001", empName: "Amit Verma", type: "Performance Bonus", amount: 15000, claimDate: "2026-06-30", status: "Approved" }
  ],
  "PF Registry": [
    { id: 1, empId: "EMP001", empName: "Rahul Sharma", uan: "100987654321", pfNo: "DLCPM0012345000/0001", basicSalary: 50000, employeeContribution: 6000, employerContribution: 1835, epsContribution: 4165 }
  ],
  "Tax Declarations": [
    { id: 1, empName: "Rahul Sharma", regime: "Old", hraDecl: 240000, sec80C: 150000, sec80D: 2500, homeLoan: 120000, status: "Approved" }
  ],
  "KPI & OKR": [
    { id: 1, goalId: "GOAL-001", empName: "Amit Verma", kpiName: "Complete frontend consolidation project UI", target: "100% completion", current: 85, weightage: 40, status: "In Progress" }
  ],
  "Performance Reviews": [
    { id: 1, empName: "Amit Verma", reviewer: "Rahul Sharma", selfRating: 4, managerRating: 4.5, overallRating: 4.3, comments: "Amit has shown exceptional speed in integrating UI templates.", status: "Completed" }
  ],
  "Courses": [
    { id: 1, courseCode: "CRS-REACT", courseName: "Advanced React & State Management", category: "Technical", duration: 16, instructor: "Coursera Expert", status: "Active" }
  ],
  "LMS Progress": [
    { id: 1, empName: "Amit Verma", courseName: "Advanced React & State Management", enrollDate: "2026-06-15", progress: 75, quizScore: 85, status: "In Progress" }
  ],
  "Inventory": [
    { id: 1, assetCode: "LPT-DELL-5420", category: "Laptop", brand: "Dell", model: "Latitude 5420", serialNo: "CN-08XX88-12345", status: "Assigned" }
  ],
  "Expense Claims": [
    { id: 1, claimId: "EXP-2026-001", empName: "Rahul Sharma", category: "Travel & Lodging", amount: 4500, description: "Travel to regional office for audit.", status: "Approved" }
  ],
  "Document Log": [
    { id: 1, docId: "DOC-2026-101", empName: "Amit Verma", docType: "Offer Letter", fileName: "Offer_Letter_Amit_Verma.pdf", issueDate: "2022-07-15", status: "Signed" }
  ],
  "Exit Logs": [
    { id: 1, empName: "Priya Jain", resignationDate: "2024-11-01", lastWorkingDate: "2024-12-31", reason: "Better Career Opportunities", noDuesStatus: "Completed", fnfStatus: "Settled" }
  ],
  "Approvals Pending": [
    { id: 1, workflowId: "WF-2026-901", empName: "Amit Verma", category: "Leave Request", amountOrDays: "3 Days", approver: "Rahul Sharma", level: 1, status: "Pending" }
  ],
  "Announcements & Surveys": [
    { id: 1, postId: "ENG-001", title: "Annual Foundation Day Celebration", type: "Announcement", publishDate: "2026-07-10", content: "All office branches will hold foundation day celebrations on July 25th.", status: "Active" }
  ],
  "HR Tickets": [
    { id: 1, ticketNo: "TKT-2026-003", empName: "Amit Verma", category: "Payroll & Salary", subject: "Incentive amount missing in June payslip.", priority: "High", assignedTo: "Rahul Sharma", status: "In Progress" }
  ],
  "Complaint Management": [
    { id: 1, complaintNo: "CMP-001", empName: "Amit Verma", category: "Admin & Office", subject: "Air conditioning not working in BLR Wing B.", complaintAgainst: "Admin Team", assignedTo: "Facility Mgr", status: "In Progress" }
  ],
  "Query Resolution": [
    { id: 1, queryId: "QRY-001", empName: "Rahul Sharma", category: "HR Policies", subject: "Policy on work from home reimbursement.", response: "Pending feedback from CFO.", status: "Pending" }
  ],
  "Service Requests": [
    { id: 1, reqId: "SR-001", empName: "Amit Verma", category: "Access Card", subject: "Requesting access to server room 2.", approvedBy: "Rahul Sharma", status: "Approved" }
  ],
  "Ticket Tracking": [
    { id: 1, trackId: "TRK-001", ticketNo: "TKT-2026-003", currentStatus: "In Progress", previousStatus: "Open", updateTime: "2026-07-14 02:00 PM" }
  ],
  "Logs": [
    { id: 1, notifId: "NTF-2026-888", recipient: "amit.verma@nibhr.com", channel: "Email", subject: "Welcome to NIB Technologies!", event: "Onboarding System Access", sentTime: "2022-08-22 09:30 AM", status: "Sent" }
  ],
  "Email Notifications": [
    { id: 1, code: "EML-WELCOME", name: "Welcome Email Template", channel: "Email", triggerEvent: "Employee Onboarding", status: "Active" }
  ],
  "SMS Notifications": [
    { id: 1, code: "SMS-OTP", name: "2FA Verification OTP", channel: "SMS", triggerEvent: "Login Verification", status: "Active" }
  ],
  "Push Notifications": [
    { id: 1, code: "PSH-LEAVE", name: "Leave Approved Push", channel: "Push", triggerEvent: "Manager Action", status: "Active" }
  ],
  "Approval Alerts": [
    { id: 1, code: "ALT-APPROVE", name: "Pending Approver Notification", channel: "Email/Push", triggerEvent: "Workflow Submission", status: "Active" }
  ],
  "RBAC Roles": [
    { id: 1, roleName: "HR Admin", description: "Full access to employee, payroll, recruitment, settings, compliance", permissions: 45, status: "Active" },
    { id: 2, roleName: "Manager", description: "Access to MSS team view, leave approval, performance ratings", permissions: 20, status: "Active" },
    { id: 3, roleName: "Employee", description: "Access to ESS employee self profile, leave request, payslips", permissions: 8, status: "Active" }
  ],
  "Audit Logs": [
    { id: 1, actor: "Rahul Sharma", action: "Updated Salary Structure for Amit Verma", timestamp: "2026-07-14 02:45 PM", ip: "192.168.1.45" }
  ],
  "Login History": [
    { id: 1, username: "rsharma", time: "2026-07-14 09:02 AM", status: "Success (2FA Verified)", ip: "192.168.1.45" }
  ]
};
