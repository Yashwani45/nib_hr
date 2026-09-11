// Frontend/src/components/Settings/settingsData.js
import {
  BuildingOffice2Icon,
  ClockIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  UserGroupIcon,
  BellIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  MapPinIcon,
  IdentificationIcon,
  SparklesIcon,
  DevicePhoneMobileIcon,
  KeyIcon,
  LockClosedIcon,
  ShieldExclamationIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

export const SETTINGS_MODULES = [
  {
    id: "company",
    key: "Company Settings",
    title: "Company Settings",
    description: "Manage organization profile, branches, departments, designations and company-wide configuration.",
    icon: BuildingOffice2Icon,
    theme: {
      bgIcon: "bg-blue-50",
      textIcon: "text-blue-600",
      borderIcon: "border-blue-100",
      hoverBorder: "hover:border-blue-300",
      itemIconColor: "text-blue-500",
      itemBgHover: "hover:bg-blue-50/50"
    },
    items: [
      { id: "org_profile", name: "Organization Profile", icon: IdentificationIcon, count: "1 Active", desc: "Corporate entity details, CIN, GSTIN, and tax IDs" },
      { id: "branches", name: "Branches", icon: MapPinIcon, count: "8 Locations", desc: "Regional offices, plants, and working sites" },
      { id: "departments", name: "Departments", icon: UserGroupIcon, count: "14 Depts", desc: "Operational divisions, cost centers, and teams" },
      { id: "designations", name: "Designations", icon: SparklesIcon, count: "42 Roles", desc: "Job titles, salary bands, and hierarchy levels" },
      { id: "holiday_calendar", name: "Holiday Calendar", icon: CalendarDaysIcon, count: "18 Holidays", desc: "Statutory holidays, optional leaves, and company offs" }
    ],
    details: {
      orgName: "Enterprise HRMS Technologies Pvt. Ltd.",
      cin: "U72200MH2020PTC345678",
      registeredAddress: "402-404, Tech Park Boulevard, Bandra Kurla Complex, Mumbai, MH 400051",
      primaryContact: "admin@enterprise-hrms.com",
      fiscalYearStart: "01 April"
    }
  },
  {
    id: "attendance",
    key: "Attendance Settings",
    title: "Attendance Settings",
    description: "Configure attendance rules, working hours, overtime and attendance policies.",
    icon: ClockIcon,
    theme: {
      bgIcon: "bg-emerald-50",
      textIcon: "text-emerald-600",
      borderIcon: "border-emerald-100",
      hoverBorder: "hover:border-emerald-300",
      itemIconColor: "text-emerald-500",
      itemBgHover: "hover:bg-emerald-50/50"
    },
    items: [
      { id: "working_hours", name: "Working Hours", icon: ClockIcon, count: "9h / Day", desc: "Standard shift timing and minimum half-day threshold" },
      { id: "attendance_rules", name: "Attendance Rules", icon: ClipboardDocumentListIcon, count: "Active", desc: "Grace period (15 mins), punch-in penalties, and auto-clockout" },
      { id: "overtime_settings", name: "Overtime Settings", icon: SparklesIcon, count: "1.5x Rate", desc: "Eligibility rules, maximum OT hours cap, and supervisor sign-off" },
      { id: "week_off_settings", name: "Week Off Settings", icon: CalendarDaysIcon, count: "5-Day Workweek", desc: "Saturday & Sunday default off, alternate Saturday policy" },
      { id: "biometric_settings", name: "Biometric Settings", icon: DevicePhoneMobileIcon, count: "12 Devices", desc: "Fingerprint, facial recognition devices, and IP restrictions" }
    ],
    details: {
      standardHoursPerDay: "8.5 Hours",
      graceMinutes: "15 Minutes",
      autoAbsentAfterLate: "3 Consecutive Late Days",
      geofencingEnabled: true,
      biometricSyncInterval: "Every 5 Minutes"
    }
  },
  {
    id: "leave",
    key: "Leave Settings",
    title: "Leave Settings",
    description: "Define leave types, eligibility, carry-forward rules and approval workflows.",
    icon: CalendarDaysIcon,
    theme: {
      bgIcon: "bg-amber-50",
      textIcon: "text-amber-600",
      borderIcon: "border-amber-100",
      hoverBorder: "hover:border-amber-300",
      itemIconColor: "text-amber-500",
      itemBgHover: "hover:bg-amber-50/50"
    },
    items: [
      { id: "leave_types", name: "Leave Types", icon: CalendarDaysIcon, count: "6 Types", desc: "Casual (CL), Sick (SL), Privilege (PL), Maternity & Paternity" },
      { id: "leave_policies", name: "Leave Policies", icon: ClipboardDocumentListIcon, count: "Annual Quota", desc: "Monthly accrual vs upfront credit rules per employee grade" },
      { id: "carry_forward", name: "Carry Forward Rules", icon: ArrowPathIcon, count: "Max 30 Days", desc: "Year-end encashment caps and lapse policies" },
      { id: "leave_approvals", name: "Leave Approvals", icon: ShieldCheckIcon, count: "2 Levels", desc: "Direct Manager -> Department Head escalation matrix" },
      { id: "holiday_list", name: "Holiday List", icon: CalendarDaysIcon, count: "2026 Ready", desc: "Regional optional lists and mandatory gazetted leaves" }
    ],
    details: {
      clQuota: "12 Days / Year",
      slQuota: "10 Days / Year",
      plQuota: "15 Days / Year",
      carryForwardLimit: "30 Days",
      probationEligibility: "After 3 Months Service"
    }
  },
  {
    id: "payroll",
    key: "Payroll Settings",
    title: "Payroll Settings",
    description: "Configure salary components, deductions, tax settings and payroll schedules.",
    icon: BanknotesIcon,
    theme: {
      bgIcon: "bg-purple-50",
      textIcon: "text-purple-600",
      borderIcon: "border-purple-100",
      hoverBorder: "hover:border-purple-300",
      itemIconColor: "text-purple-500",
      itemBgHover: "hover:bg-purple-50/50"
    },
    items: [
      { id: "salary_components", name: "Salary Components", icon: BanknotesIcon, count: "8 Active", desc: "Basic, HRA, Special Allowance, Conveyance, Medical" },
      { id: "earnings_deductions", name: "Earnings & Deductions", icon: ClipboardDocumentListIcon, count: "Configured", desc: "Standard deduction, Professional Tax (PT), and custom heads" },
      { id: "tax_settings", name: "Tax Settings", icon: SparklesIcon, count: "New vs Old Regime", desc: "FY 2026-27 tax slabs, rebate u/s 87A, surcharge tiers" },
      { id: "pf_esi", name: "PF / ESI Settings", icon: ShieldCheckIcon, count: "Statutory", desc: "EPF 12% employee/employer split, EPS, EDLI, ESI 0.75%/3.25%" },
      { id: "pay_schedule", name: "Pay Schedule", icon: CalendarDaysIcon, count: "Last Working Day", desc: "Attendance cutoff date (25th) and payout date (30th/31st)" }
    ],
    details: {
      epfWageLimit: "₹15,000 / Month",
      esiWageLimit: "₹21,000 / Month",
      payCycle: "Monthly (1st to end of month)",
      payrollCutoffDay: "25th of every month",
      salaryDisbursementDay: "1st of following month"
    }
  },
  {
    id: "shift",
    key: "Shift Settings",
    title: "Shift Settings",
    description: "Manage employee shifts, rotations, break rules and shift assignments.",
    icon: UserGroupIcon,
    theme: {
      bgIcon: "bg-sky-50",
      textIcon: "text-sky-600",
      borderIcon: "border-sky-100",
      hoverBorder: "hover:border-sky-300",
      itemIconColor: "text-sky-500",
      itemBgHover: "hover:bg-sky-50/50"
    },
    items: [
      { id: "shift_list", name: "Shift List", icon: ClockIcon, count: "4 Shifts", desc: "General (9-6), Morning (6-3), Evening (2-11), Night (10-7)" },
      { id: "shift_rotation", name: "Shift Rotation", icon: ArrowPathIcon, count: "Bi-Weekly", desc: "Automatic weekly/bi-weekly rotation roster schedules" },
      { id: "break_rules", name: "Break Rules", icon: ClockIcon, count: "60 mins Total", desc: "Lunch break (45m), tea breaks (2 x 15m), and punch tracking" },
      { id: "night_shift", name: "Night Shift Settings", icon: SparklesIcon, count: "Special Allowance", desc: "Night shift premium, cab safety provisions, and next-day off" },
      { id: "shift_assignments", name: "Shift Assignments", icon: UserGroupIcon, count: "120 Mapped", desc: "Department-wise and individual employee roster assignments" }
    ],
    details: {
      generalShiftTime: "09:30 AM — 06:30 PM",
      morningShiftTime: "06:00 AM — 03:00 PM",
      nightAllowancePerShift: "₹250 / Shift",
      minHoursBetweenShifts: "12 Hours Rest Required"
    }
  },
  {
    id: "notifications",
    key: "Notification Settings",
    title: "Notification Settings",
    description: "Configure system, email, SMS and push notification preferences.",
    icon: BellIcon,
    theme: {
      bgIcon: "bg-rose-50",
      textIcon: "text-rose-600",
      borderIcon: "border-rose-100",
      hoverBorder: "hover:border-rose-300",
      itemIconColor: "text-rose-500",
      itemBgHover: "hover:bg-rose-50/50"
    },
    items: [
      { id: "general_notifications", name: "General Notifications", icon: BellIcon, count: "Enabled", desc: "System alerts, announcements, policy updates, and broadcast news" },
      { id: "approval_alerts", name: "Approval Alerts", icon: ShieldCheckIcon, count: "Instant", desc: "Notify managers on pending leave, reimbursement, and travel claims" },
      { id: "reminder_settings", name: "Reminder Settings", icon: ClockIcon, count: "Daily 9 AM", desc: "Punch-in reminders, pending task alerts, and document expiry" },
      { id: "sms_settings", name: "SMS Settings", icon: DevicePhoneMobileIcon, count: "Active Gateway", desc: "Transactional SMS provider API (Twilio / SMS Gateway)" },
      { id: "push_settings", name: "Push Settings", icon: SparklesIcon, count: "FCM Connected", desc: "Web browser and mobile app push notifications" }
    ],
    details: {
      smsGatewayStatus: "Connected (99.8% Delivery)",
      fcmTokenStatus: "Active",
      emailDispatchThrottle: "Max 100/sec",
      quietHours: "10:00 PM — 07:00 AM"
    }
  },
  {
    id: "email_templates",
    key: "Email Templates",
    title: "Email Templates",
    description: "Create and manage email templates used for HR processes and employee communication.",
    icon: EnvelopeIcon,
    theme: {
      bgIcon: "bg-teal-50",
      textIcon: "text-teal-600",
      borderIcon: "border-teal-100",
      hoverBorder: "hover:border-teal-300",
      itemIconColor: "text-teal-500",
      itemBgHover: "hover:bg-teal-50/50"
    },
    items: [
      { id: "system_emails", name: "System Emails", icon: EnvelopeIcon, count: "4 Templates", desc: "Account activation, password reset, login OTP, and security alerts" },
      { id: "hr_communication", name: "HR Communication", icon: SparklesIcon, count: "6 Templates", desc: "Welcome email, anniversary wishes, birthday greetings, survey invites" },
      { id: "leave_attendance", name: "Leave & Attendance", icon: CalendarDaysIcon, count: "8 Templates", desc: "Leave application, approval confirmation, rejection, regularization" },
      { id: "payroll_finance", name: "Payroll & Finance", icon: BanknotesIcon, count: "5 Templates", desc: "Payslip release notification, Form 16 dispatch, loan approval" },
      { id: "recruitment_emails", name: "Recruitment Emails", icon: UserGroupIcon, count: "7 Templates", desc: "Interview invite, candidate shortlist, offer letter dispatch" }
    ],
    details: {
      smtpHost: "smtp.office365.com",
      smtpPort: 587,
      senderEmail: "hr-noreply@enterprise-hrms.com",
      brandHtmlHeader: "Enabled (Standard Enterprise Branding)"
    }
  },
  {
    id: "document_templates",
    key: "Document Templates",
    title: "Document Templates",
    description: "Create and manage templates for HR letters and employee documents.",
    icon: DocumentTextIcon,
    theme: {
      bgIcon: "bg-orange-50",
      textIcon: "text-orange-600",
      borderIcon: "border-orange-100",
      hoverBorder: "hover:border-orange-300",
      itemIconColor: "text-orange-500",
      itemBgHover: "hover:bg-orange-50/50"
    },
    items: [
      { id: "offer_letter", name: "Offer Letter", icon: DocumentTextIcon, count: "v3.2 Final", desc: "Standard candidate job offer agreement with CTC annexure" },
      { id: "experience_letter", name: "Experience Letter", icon: SparklesIcon, count: "v2.0 Active", desc: "Relieving and service completion certificate template" },
      { id: "relieving_letter", name: "Relieving Letter", icon: ClipboardDocumentListIcon, count: "v2.1 Active", desc: "Exit clearance, separation notice, and full-and-final letter" },
      { id: "confirmation_letter", name: "Confirmation Letter", icon: ShieldCheckIcon, count: "v1.4 Active", desc: "Probation completion and permanent employee confirmation" },
      { id: "other_documents", name: "Other Documents", icon: DocumentTextIcon, count: "12 Assets", desc: "Promotion letters, salary revision addendum, and NDAs" }
    ],
    details: {
      digitalSignatureEnabled: true,
      watermarkText: "ENTERPRISE HRMS CONFIDENTIAL",
      exportFormats: ["PDF", "DOCX"],
      cloudStorage: "Secure AWS S3 Bucket"
    }
  },
  {
    id: "security",
    key: "Security",
    title: "Security",
    description: "Manage authentication, access control, roles, permissions and security preferences.",
    icon: ShieldCheckIcon,
    theme: {
      bgIcon: "bg-indigo-50",
      textIcon: "text-indigo-600",
      borderIcon: "border-indigo-100",
      hoverBorder: "hover:border-indigo-300",
      itemIconColor: "text-indigo-500",
      itemBgHover: "hover:bg-indigo-50/50"
    },
    items: [
      { id: "roles_permissions", name: "Roles & Permissions", icon: ShieldCheckIcon, count: "5 Roles", desc: "Super Admin, Admin, HR Manager, Department Head, Employee" },
      { id: "user_management", name: "User Management", icon: UserGroupIcon, count: "128 Users", desc: "Active logins, user provisioning, account lockouts, and status" },
      { id: "password_policy", name: "Password Policy", icon: KeyIcon, count: "Strong", desc: "Min 10 characters, special symbol, 90-day password expiry" },
      { id: "two_factor_auth", name: "Two-Factor Authentication", icon: LockClosedIcon, count: "Enforced", desc: "Authenticator TOTP (Google/Microsoft Authenticator) & SMS OTP" },
      { id: "login_settings", name: "Login Settings", icon: ShieldExclamationIcon, count: "SSO + IP Restrict", desc: "SAML 2.0 / OAuth2 SSO, session timeout (30 mins), and IP whitelisting" }
    ],
    details: {
      mfaEnforcement: "Mandatory for Admin & HR roles",
      sessionTimeout: "30 Minutes Idle",
      maxFailedAttempts: 5,
      jwtExpiry: "24 Hours"
    }
  }
];

export const AUDIT_LOGS_METRICS = {
  totalLogs: "25,648",
  todaysLogs: "342",
  criticalActivities: "18",
  lastUpdated: "2 mins ago",
  recentLogs: [
    { id: 1, action: "User Role Updated", target: "rahul.sharma@nib.com", role: "Software Engineer -> Tech Lead", user: "John Doe (HR Manager)", time: "2 mins ago", severity: "info" },
    { id: 2, action: "Leave Policy Revised", target: "Privilege Leave (PL)", role: "Annual quota increased to 18", user: "John Doe (HR Manager)", time: "18 mins ago", severity: "warning" },
    { id: 3, action: "Security Password Policy Enforced", target: "Organization-wide", role: "MFA Enforced for all Admins", user: "Super Admin", time: "1 hour ago", severity: "critical" },
    { id: 4, action: "Payroll Salary Structure Configured", target: "Grade L3 Band", role: "Special Allowance Formula Updated", user: "Ananya Roy (Payroll Admin)", time: "3 hours ago", severity: "info" },
    { id: 5, action: "Attendance Overtime Rate Adjusted", target: "Production Plant Shift", role: "Overtime multiplier set to 1.5x", user: "John Doe (HR Manager)", time: "5 hours ago", severity: "info" }
  ]
};
