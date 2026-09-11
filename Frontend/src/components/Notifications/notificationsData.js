// Frontend/src/components/Notifications/notificationsData.js
import {
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  BellAlertIcon,
  CheckBadgeIcon,
  CakeIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";

export const NOTIFICATION_CARDS = [
  {
    id: "Email",
    tabId: "Email Notifications",
    title: "Email",
    status: "Enabled",
    description: "Manage email notifications for HR processes and employee communication.",
    icon: EnvelopeIcon,
    theme: {
      bgIcon: "bg-blue-50",
      textIcon: "text-blue-600",
      badgeBorder: "border-blue-200",
      accent: "#2563EB"
    },
    metricLabel: "Active Templates",
    metricValue: "12",
    examples: [
      "Leave Approval",
      "Payroll Processed",
      "Interview Scheduled",
      "Performance Reminder"
    ],
    buttonText: "Configure",
    templates: [
      { id: "T1", name: "Leave Approval Notice", trigger: "On Leave Status Change", status: "Active", recipient: "Employee" },
      { id: "T2", name: "Monthly Payslip Disbursal", trigger: "Post Payroll Generation", status: "Active", recipient: "All Employees" },
      { id: "T3", name: "Candidate Interview Invite", trigger: "Interview Scheduled", status: "Active", recipient: "Applicant" },
      { id: "T4", name: "Quarterly Appraisal Kickoff", trigger: "Performance Cycle Start", status: "Active", recipient: "Managers & Leads" },
      { id: "T5", name: "New Hire Welcome Email", trigger: "Candidate Accepted Offer", status: "Active", recipient: "New Joinee" },
      { id: "T6", name: "Probation Confirmation Notice", trigger: "Confirmation Approved", status: "Active", recipient: "Employee & HR" }
    ]
  },
  {
    id: "SMS",
    tabId: "SMS Notifications",
    title: "SMS",
    status: "Enabled",
    description: "Send important HR and employee alerts through SMS.",
    icon: DevicePhoneMobileIcon,
    theme: {
      bgIcon: "bg-emerald-50",
      textIcon: "text-emerald-600",
      badgeBorder: "border-emerald-200",
      accent: "#059669"
    },
    metricLabel: "Active Templates",
    metricValue: "7",
    examples: [
      "OTP Verification",
      "Leave Approval",
      "Attendance Alert",
      "Payroll Alert"
    ],
    buttonText: "Configure",
    templates: [
      { id: "S1", name: "2FA Login OTP Code", trigger: "Login Verification Attempt", status: "Active", recipient: "User Phone" },
      { id: "S2", name: "Urgent Leave Approval Alert", trigger: "Manager Action Required", status: "Active", recipient: "Reporting Manager" },
      { id: "S3", name: "Biometric Missed Punch Alert", trigger: "Daily Check-in Grace Expired", status: "Active", recipient: "Employee Phone" },
      { id: "S4", name: "Salary Credited SMS Notification", trigger: "Bank Disbursement Confirm", status: "Active", recipient: "Employee Phone" }
    ]
  },
  {
    id: "Push",
    tabId: "Push Notifications",
    title: "Push",
    status: "Enabled",
    description: "Deliver real-time notifications to HR, managers, and employees.",
    icon: BellAlertIcon,
    theme: {
      bgIcon: "bg-purple-50",
      textIcon: "text-purple-600",
      badgeBorder: "border-purple-200",
      accent: "#9333EA"
    },
    metricLabel: "Delivery Channels",
    metricValue: "Mobile & Web",
    examples: [
      "Attendance Reminder",
      "Approval Request",
      "Performance Review",
      "Training Reminder"
    ],
    buttonText: "Configure",
    templates: [
      { id: "P1", name: "Daily Morning Punch-in Alert", trigger: "08:50 AM Weekdays", status: "Active", recipient: "Mobile App" },
      { id: "P2", name: "Manager Pending Approval Push", trigger: "Immediate on request submission", status: "Active", recipient: "Web Browser & App" },
      { id: "P3", name: "Self-Appraisal Due Reminder", trigger: "3 Days Before Review Close", status: "Active", recipient: "Employee Device" },
      { id: "P4", name: "Upcoming LMS Training Webinar", trigger: "15 Mins Before Session", status: "Active", recipient: "Registered Learners" }
    ]
  },
  {
    id: "Approval Alerts",
    tabId: "Approval Alerts",
    title: "Approval Alerts",
    status: "Enabled",
    description: "Notify managers and HR users about pending and completed approvals.",
    icon: CheckBadgeIcon,
    theme: {
      bgIcon: "bg-amber-50",
      textIcon: "text-amber-600",
      badgeBorder: "border-amber-200",
      accent: "#D97706"
    },
    buttonText: "Manage Alerts",
    approvalStats: [
      { label: "Leave Requests", count: 12, trend: "+3 new today", color: "text-blue-600" },
      { label: "Expense Claims", count: 8, trend: "₹42,500 pending", color: "text-emerald-600" },
      { label: "Travel Requests", count: 4, trend: "Client visits", color: "text-purple-600" },
      { label: "Attendance Regularization", count: 6, trend: "Pending review", color: "text-amber-600" },
      { label: "Payroll Approvals", count: 2, trend: "September cycle", color: "text-rose-600" }
    ]
  },
  {
    id: "Birthday Alerts",
    tabId: "Birthday Alerts",
    title: "Birthday Alerts",
    status: "Enabled",
    description: "Manage employee birthday reminders and greeting notifications.",
    icon: CakeIcon,
    theme: {
      bgIcon: "bg-rose-50",
      textIcon: "text-rose-600",
      badgeBorder: "border-rose-200",
      accent: "#E11D48"
    },
    buttonText: "Configure",
    todayCount: 2,
    todayBirthdays: [
      { name: "Sarah Williams", designation: "HR Executive", avatar: "SW", department: "Human Resources" },
      { name: "Rahul Sharma", designation: "Software Engineer", avatar: "RS", department: "Engineering" }
    ],
    upcomingBirthdays: [
      { name: "Anita Patel", date: "08 Sep", department: "Marketing" },
      { name: "Vikram Singh", date: "10 Sep", department: "Operations" },
      { name: "Neha Gupta", date: "12 Sep", department: "Finance" }
    ]
  },
  {
    id: "Policy Updates",
    tabId: "Policy Updates",
    title: "Policy Updates",
    status: "Enabled",
    description: "Notify employees about HR policy and compliance updates.",
    icon: DocumentTextIcon,
    theme: {
      bgIcon: "bg-sky-50",
      textIcon: "text-sky-600",
      badgeBorder: "border-sky-200",
      accent: "#0284C7"
    },
    buttons: [
      { text: "View Policy", action: "view" },
      { text: "Send Reminder", action: "remind" }
    ],
    policies: [
      {
        id: "POL-01",
        title: "Leave Policy",
        version: "v3.2",
        updated: "02 Sep 2026",
        acknowledgedCount: 87,
        totalCount: 120,
        summary: "Updated casual leave encashment terms and maternity extension guidelines."
      },
      {
        id: "POL-02",
        title: "Remote Work Policy",
        version: "v2.0",
        updated: "28 Aug 2026",
        acknowledgedCount: 112,
        totalCount: 120,
        summary: "Clarified core connectivity hours, cybersecurity requirements, and hybrid allowances."
      }
    ]
  }
];
