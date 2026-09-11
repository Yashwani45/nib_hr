// Frontend/src/components/Engagement/engagementData.js

export const SAMPLE_ANNOUNCEMENTS = [
  {
    id: 1,
    title: "Annual Town Hall 2026 & Executive Keynote",
    category: "Corporate Broadcast",
    priority: "High",
    publishDate: "02 Sep 2026",
    effectiveDate: "10 Sep 2026",
    author: "CEO Office",
    authorRole: "Executive Leadership",
    targetAudience: "All Departments",
    summary: "Join us for our Q3 corporate town hall reviewing company-wide expansion, tech modernization milestones, and strategic hiring forecasts.",
    content: "The leadership team invites all employees to our Q3 Town Hall on 10 September 2026 from 3:00 PM to 5:00 PM IST. We will present our operational achievements, new insurance policy brokerage lines, and celebrate star performers.",
    readCount: 342,
    attachment: "TownHall_Q3_Agenda.pdf"
  },
  {
    id: 2,
    title: "Updated Employee Healthcare & Parental Leave Policy",
    category: "HR Policy",
    priority: "Urgent",
    publishDate: "28 Aug 2026",
    effectiveDate: "01 Sep 2026",
    author: "Deepika Sen",
    authorRole: "Head of People & Culture",
    targetAudience: "All Employees",
    summary: "Enhanced medical insurance coverage limit increased to ₹10,00,000 with OPD reimbursement benefits and extended paternity leave.",
    content: "We are excited to roll out comprehensive wellness updates under NIB Care 2.0. Inpatient hospitalization sum insured is raised to 10 Lakhs with cashless network across 4,500+ hospitals.",
    readCount: 512,
    attachment: "NIB_Health_Policy_2026.pdf"
  },
  {
    id: 3,
    title: "Office Closed for Ganesh Chaturthi & Onam Celebrations",
    category: "Holiday Circular",
    priority: "Normal",
    publishDate: "25 Aug 2026",
    effectiveDate: "07 Sep 2026",
    author: "Admin Team",
    authorRole: "Facilities & HR Admin",
    targetAudience: "All Locations",
    summary: "Corporate holiday declared for upcoming festive dates. Emergency client support rotations will operate as per roster.",
    content: "Our offices will remain closed on 07 Sep 2026 and 14 Sep 2026 on account of festival celebrations. Please coordinate project handovers with your reporting managers.",
    readCount: 420,
    attachment: null
  }
];

export const SAMPLE_NEWS = [
  {
    id: 1,
    title: "NIB Insurance Broker Crosses ₹500 Cr Gross Written Premium Milestone",
    category: "Company Milestone",
    date: "01 Sep 2026",
    readTime: "4 min read",
    author: "Corporate Communications",
    imageTag: "Milestone Achievement",
    snippet: "Record Q2 performance driven by our enterprise group health and motor insurance brokerage portfolios.",
    fullContent: "Thanks to the relentless dedication of our 650+ team members, NIB Broker has officially crossed ₹500 Crores in GWP for the fiscal cycle. This reflects a 42% YoY growth compared to last year's performance."
  },
  {
    id: 2,
    title: "NIB Tech Labs Launches AI Automated Claim Reconciliation Engine",
    category: "Product Innovation",
    date: "27 Aug 2026",
    readTime: "3 min read",
    author: "Engineering & Innovation",
    imageTag: "Technology",
    snippet: "Our homegrown AI engine reduces cashless claims processing turnaround time from 4 hours to just 18 minutes.",
    fullContent: "Led by Rahul Sharma and the core backend engineering squad, our new optical character recognition (OCR) and policy matching engine has officially cleared ISO-27001 audit and is now serving enterprise clients."
  },
  {
    id: 3,
    title: "NIB Wins 'Best Workplace for Diversity & Women Leaders 2026'",
    category: "Award & Recognition",
    date: "20 Aug 2026",
    readTime: "2 min read",
    author: "HR Culture Team",
    imageTag: "Industry Award",
    snippet: "Recognized by National HRD Network for best-in-class maternity benefits, mentorship programs, and pay parity.",
    fullContent: "NIB has been conferred the prestigious Golden Peacock Diversity Award in Mumbai. Our executive gender diversity now stands proudly at 44% across managerial roles."
  }
];

export const SAMPLE_EVENTS = [
  {
    id: 1,
    title: "Annual Tech Hackathon: InsurTech 2026",
    type: "Hackathon",
    date: "18 Sep 2026",
    time: "09:00 AM - 06:00 PM IST",
    venue: "Main Innovation Lab / Hybrid Virtual",
    organizer: "Engineering & Tech Club",
    rsvps: 78,
    status: "Upcoming",
    description: "48-hour prototype challenge on generative claim settlement assistants and automated underwriting algorithms.",
    isGoing: true
  },
  {
    id: 2,
    title: "Mental Health & Corporate Ergonomics Workshop",
    type: "Wellness",
    date: "22 Sep 2026",
    time: "04:00 PM - 05:30 PM IST",
    venue: "Town Hall Auditorium & Zoom Stream",
    organizer: "People & Wellness Committee",
    rsvps: 142,
    status: "Upcoming",
    description: "Expert session by certified clinical psychologists on stress resilience, desktop posture, and work-life balance.",
    isGoing: false
  },
  {
    id: 3,
    title: "NIB Premier Cricket League - Tournament Kickoff",
    type: "Sports & Recreation",
    date: "26 Sep 2026",
    time: "07:30 AM - 02:00 PM IST",
    venue: "Decathlon Sports Arena, Bangalore",
    organizer: "NIB Sports Council",
    rsvps: 96,
    status: "Upcoming",
    description: "Inter-departmental cricket tournament featuring 8 teams from Engineering, Sales, Underwriting, and Operations.",
    isGoing: true
  }
];

export const SAMPLE_BIRTHDAYS = [
  {
    id: 1,
    employee: "Ananya Iyer",
    employeeId: "EMP1092",
    department: "Engineering",
    designation: "Frontend Engineer",
    date: "Today, 03 Sep",
    isToday: true,
    avatar: "AI",
    wishesCount: 34,
    email: "ananya.iyer@nibhr.com"
  },
  {
    id: 2,
    employee: "Kunal Mehra",
    employeeId: "EMP1104",
    department: "Sales & Brokerage",
    designation: "Relationship Manager",
    date: "05 Sep 2026",
    isToday: false,
    avatar: "KM",
    wishesCount: 12,
    email: "kunal.mehra@nibhr.com"
  },
  {
    id: 3,
    employee: "Sneha Nair",
    employeeId: "EMP1148",
    department: "Finance",
    designation: "Accounts Specialist",
    date: "08 Sep 2026",
    isToday: false,
    avatar: "SN",
    wishesCount: 8,
    email: "sneha.nair@nibhr.com"
  },
  {
    id: 4,
    employee: "Rohan Mukherjee",
    employeeId: "EMP1033",
    department: "Human Resources",
    designation: "Talent Acquisition Lead",
    date: "12 Sep 2026",
    isToday: false,
    avatar: "RM",
    wishesCount: 19,
    email: "rohan.mukherjee@nibhr.com"
  }
];

export const SAMPLE_ANNIVERSARIES = [
  {
    id: 1,
    employee: "Vikram Singhania",
    employeeId: "EMP1005",
    department: "Underwriting",
    designation: "AVP - Underwriting",
    yearsCompleted: "5 Years",
    anniversaryDate: "Today, 03 Sep",
    isToday: true,
    avatar: "VS",
    kudosCount: 48,
    badge: "5 Year Diamond Pillar"
  },
  {
    id: 2,
    employee: "Pooja Hegde",
    employeeId: "EMP1066",
    department: "Operations",
    designation: "Senior Operations Specialist",
    yearsCompleted: "3 Years",
    anniversaryDate: "06 Sep 2026",
    isToday: false,
    avatar: "PH",
    kudosCount: 22,
    badge: "3 Year Gold Champion"
  },
  {
    id: 3,
    employee: "Abhishek Joshi",
    employeeId: "EMP1120",
    department: "Engineering",
    designation: "DevOps Specialist",
    yearsCompleted: "1 Year",
    anniversaryDate: "10 Sep 2026",
    isToday: false,
    avatar: "AJ",
    kudosCount: 15,
    badge: "1 Year Bronze Rising Star"
  }
];

export const SAMPLE_REWARDS = [
  {
    id: 1,
    recipient: "Rahul Sharma",
    recipientId: "EMP1024",
    department: "Engineering",
    awardName: "Star Performer of the Month",
    category: "Technical Excellence",
    awardedBy: "Rajesh Kumar (VP Tech)",
    date: "28 Aug 2026",
    points: 2500,
    citation: "Exemplary leadership in architectural revamp of our claims processing microservices."
  },
  {
    id: 2,
    recipient: "Priya Patel",
    recipientId: "EMP1087",
    department: "Human Resources",
    awardName: "Customer Delight Champion",
    category: "People First",
    awardedBy: "Deepika Sen (Head HR)",
    date: "25 Aug 2026",
    points: 1500,
    citation: "Flawless coordination and onboarding experience delivered for 45 campus hires."
  },
  {
    id: 3,
    recipient: "Neha Singh",
    recipientId: "EMP1156",
    department: "Marketing",
    awardName: "Innovation Hero Award",
    category: "Brand Growth",
    awardedBy: "Deepak Chawla (CMO)",
    date: "20 Aug 2026",
    points: 2000,
    citation: "Spearheading our digital broker portal launch campaign resulting in 12,000 inbound leads."
  }
];

export const SAMPLE_SURVEYS = [
  {
    id: 1,
    title: "Q3 Employee Net Promoter Score (eNPS) & Culture Survey",
    category: "Quarterly Pulse",
    status: "Active",
    deadline: "15 Sep 2026",
    responsesReceived: 284,
    totalTarget: 350,
    participationRate: "81%",
    anonymous: true,
    estimatedMinutes: "5 min"
  },
  {
    id: 2,
    title: "Hybrid Work & Remote Infrastructure Feedback",
    category: "Workplace Experience",
    status: "Active",
    deadline: "20 Sep 2026",
    responsesReceived: 198,
    totalTarget: 350,
    participationRate: "56%",
    anonymous: true,
    estimatedMinutes: "3 min"
  },
  {
    id: 3,
    title: "Cafeteria & Catering Satisfaction Assessment",
    category: "Facilities",
    status: "Closed",
    deadline: "15 Aug 2026",
    responsesReceived: 312,
    totalTarget: 350,
    participationRate: "89%",
    anonymous: true,
    estimatedMinutes: "2 min"
  }
];

export const SAMPLE_FEEDBACK = [
  {
    id: 1,
    subject: "Request for Ergonomic Monitor Arms in Bay 3",
    category: "Infrastructure",
    submittedBy: "Anonymous",
    date: "29 Aug 2026",
    status: "In Progress",
    adminRemarks: "IT Facilities team has procured 35 dual-arm monitor mounts; installation scheduled for this weekend.",
    upvotes: 42
  },
  {
    id: 2,
    subject: "Extended Shuttle Services to Outer Ring Road Metro",
    category: "Transport",
    submittedBy: "Rohan Joshi",
    date: "24 Aug 2026",
    status: "Under Review",
    adminRemarks: "Transport committee evaluating route viability with vendors.",
    upvotes: 68
  },
  {
    id: 3,
    subject: "Annual Learning & Certification Reimbursement Window",
    category: "HR Policy",
    submittedBy: "Anonymous",
    date: "18 Aug 2026",
    status: "Implemented",
    adminRemarks: "Policy revised: Certification allowance is now claimable quarterly instead of annually.",
    upvotes: 89
  }
];

export const getPriorityClass = (priority) => {
  switch (priority?.toLowerCase()) {
    case "urgent":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "high":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
};
