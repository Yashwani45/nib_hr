import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CalendarDaysIcon,
  ClockIcon,
  BriefcaseIcon,
  UserIcon,
  BanknotesIcon,
  AcademicCapIcon,
  PresentationChartBarIcon,
  InboxStackIcon,
  GiftIcon,
  MegaphoneIcon,
  WrenchScrewdriverIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  CommandLineIcon
} from "@heroicons/react/24/outline";
import { Badge, Card } from "../components/ui";
import { apiFetch, uploadEmployeeFile } from "../services/hrApi";
import { useAuth } from "../auth/AuthProvider";
import EmployeeDocuments from "../components/SupportEngagement/EmployeeDocuments";
import ExitWorkspace from "../components/SupportEngagement/ExitWorkspace";
import LearningDashboard from "../components/TalentLMS/LearningDashboard";
import PerformanceDashboard from "../components/TalentLMS/PerformanceDashboard";
import AnnouncementsSurveys from "../components/SupportEngagement/AnnouncementsSurveys";
import ExitDashboard from "../components/Exit/ExitDashboard";
import HelpdeskDashboard from "../components/Helpdesk/HelpdeskDashboard";
import ReportsDashboard from "../components/Reports/ReportsDashboard";
import NotificationsDashboard from "../components/Notifications/NotificationsDashboard";

const getStatusVariant = (status) => {
  if (["Active", "Approved", "Processed", "Assigned", "Resolved", "Paid"].includes(status)) return "success";
  if (["Pending", "Draft", "In Progress", "Open"].includes(status)) return "warning";
  if (["Deactive", "Rejected", "Terminated", "Suspended", "Closed"].includes(status)) return "danger";
  return "neutral";
};

export const getEmptyEmployeeForm = () => ({
  photo: "",
  employeeId: "",
  employeeCode: "",
  firstName: "",
  middleName: "",
  lastName: "",
  gender: "Male",
  dateOfBirth: "",
  maritalStatus: "Single",
  bloodGroup: "",
  nationality: "Indian",
  company: "",
  branch: "",
  department: "",
  designation: "",
  reportingManager: "",
  employeeType: "Full-Time",
  employeeStatus: "Active",
  officialEmail: "",
  dateOfJoining: "",
  mobileNumber: "",
  alternateMobile: "",
  personalEmail: "",
  currentAddress: "",
  permanentAddress: "",
  city: "",
  state: "",
  country: "India",
  pinCode: "",
  aadhaarNumber: "",
  panNumber: "",
  passportNumber: "",
  drivingLicense: "",
  voterId: "",
  uanNumber: "",
  esicNumber: "",
  bankName: "",
  accountHolderName: "",
  accountNumber: "",
  ifscCode: "",
  branchName: "",
  salaryStructure: "",
  basicSalary: "",
  grossSalary: "",
  ctc: "",
  pfApplicable: false,
  esiApplicable: false,
  tdsApplicable: false,
  emergencyContactName: "",
  emergencyRelation: "",
  emergencyMobile: "",
  highestDegree: "",
  specialization: "",
  university: "",
  passingYear: "",
  educationGpa: "",
  prevCompany: "",
  prevDesignation: "",
  totalExpYears: "",
  prevSalary: "",
  technicalSkills: "",
  certifications: "",
  shift: "General Shift",
  weeklyOff: "Sunday",
  attendanceMode: "Biometric",
  casualLeaveBalance: 12,
  sickLeaveBalance: 8,
  earnedLeaveBalance: 15,
  assets: [],
  documents: {},
  kpiValue: "",
  rating: "3",
  resignationDate: "",
  lastWorkingDay: "",
  exitReason: "",
  exitInterview: "",
  clearanceStatus: "",
  createdBy: "System Admin"
});

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentTime, setCurrentTime] = useState(new Date());

  const activeCategory = searchParams.get("category") || "EMP_DASHBOARD";
  const activeTab = searchParams.get("tab") || "Dashboard Home";

  // Data States
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [allEmployeesList, setAllEmployeesList] = useState([]);
  const [allAttendanceList, setAllAttendanceList] = useState([]);
  const [allLeavesList, setAllLeavesList] = useState([]);
  const [allTicketsList, setAllTicketsList] = useState([]);
  const [allRegularizationsList, setAllRegularizationsList] = useState([]);
  const [jobPostingsList, setJobPostingsList] = useState([]);
  const [candidateList, setCandidateList] = useState([]);
  const [interviewsList, setInterviewsList] = useState([]);
  const [offerLettersList, setOfferLettersList] = useState([]);
  
  const [empCheckedIn, setEmpCheckedIn] = useState(false);
  const [empPunchTime, setEmpPunchTime] = useState("");
  
  // Real dynamic user records (no static mock fallbacks)
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [assets, setAssets] = useState([]);
  const [expandedAssetId, setExpandedAssetId] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [payslips, setPayslips] = useState([]);

  const [loading, setLoading] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);

  useEffect(() => {
    if (leaveTypes.length > 0) {
      const firstOpt = leaveTypes[0].leave_name || leaveTypes[0].leaveName || leaveTypes[0].leaveTypeName || leaveTypes[0].name || leaveTypes[0].typeName || leaveTypes[0].leave_type_name || leaveTypes[0].type_name || leaveTypes[0].type;
      if (firstOpt) {
        setNewLeave(prev => ({ ...prev, leaveType: firstOpt }));
      }
    }
  }, [leaveTypes]);

  // New Form States
  const [newTicket, setNewTicket] = useState({ subject: "", category: "IT Support", description: "" });
  const [newLeave, setNewLeave] = useState({ leaveType: "Casual Leave", fromDate: "", toDate: "", halfDay: "Full Day", reason: "", attachment: "" });
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [regularizationLogs, setRegularizationLogs] = useState([]);
  const [newRegularization, setNewRegularization] = useState({ date: "", punchType: "Check-In", requestedCheckIn: "", requestedCheckOut: "", reason: "", attachment: "" });
  const [isNewRegistration, setIsNewRegistration] = useState(false);
  const [duplicateWarningModal, setDuplicateWarningModal] = useState(null);

  const [employeeForm, setEmployeeForm] = useState({
    photo: "",
    employeeId: "",
    employeeCode: "",
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "Male",
    dateOfBirth: "",
    maritalStatus: "Single",
    bloodGroup: "",
    nationality: "Indian",
    company: "NIB Insurance",
    branch: "",
    department: "",
    designation: "",
    reportingManager: "",
    employeeType: "Full-Time",
    employeeStatus: "Active",
    officialEmail: "",
    dateOfJoining: "",
    mobileNumber: "",
    alternateMobile: "",
    personalEmail: "",
    currentAddress: "",
    permanentAddress: "",
    aadhaarNumber: "",
    panNumber: "",
    passportNumber: "",
    drivingLicense: "",
    uanNumber: "",
    esicNumber: "",
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    basicSalary: "",
    grossSalary: "",
    ctc: "",
    pfApplicable: false,
    esiApplicable: false,
    emergencyContactName: "",
    emergencyRelation: "",
    emergencyMobile: "",
    highestDegree: "",
    specialization: "",
    university: "",
    passingYear: "",
    educationGpa: "",
    prevCompany: "",
    prevDesignation: "",
    totalExpYears: "",
    prevSalary: "",
    technicalSkills: "",
    certifications: "",
    shift: "General Shift",
    weeklyOff: "Sunday",
    attendanceMode: "Biometric",
    casualLeaveBalance: 12,
    sickLeaveBalance: 8,
    earnedLeaveBalance: 15,
    assets: [],
    documents: {},
    kpiValue: "",
    rating: "3",
    resignationDate: "",
    lastWorkingDay: "",
    createdBy: "System Admin"
  });

  const [profileTab, setProfileTab] = useState(searchParams.get("profileTab") || "Basic Information");
  const userRole = typeof user?.role === "object" ? user?.role?.name : user?.role;
  const isAdmin = userRole === "SuperAdmin" || userRole === "Admin" || userRole === "Company Admin";
  const userDeptStr = String(currentUserProfile?.department || user?.departmentName || user?.department || "").toLowerCase();
  const userRoleStr = String(userRole || "").toLowerCase();
  const isHR = userDeptStr.includes("hr") || userDeptStr.includes("human") || userRoleStr.includes("hr");
  const canManageEmployees = isAdmin || isHR;
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(searchParams.get("profileEmpId") || "");

  // Derived user details
  const employeeName = currentUserProfile?.firstName || currentUserProfile?.employeeName || user?.employeeName || user?.name || user?.email?.split('@')[0] || "Employee";
  const departmentName = currentUserProfile?.department || user?.departmentName || user?.department || "Operations";

  const [selectedDeptFilter, setSelectedDeptFilter] = useState("All Departments");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("this_month");
  const [companyDepartmentsList, setCompanyDepartmentsList] = useState(["IT", "Software Engineering", "Operations", "Finance", "Human Resources", "Sales & Marketing"]);

  useEffect(() => {
    if (departmentName && !selectedDeptFilter) {
      setSelectedDeptFilter(departmentName);
    }
  }, [departmentName]);

  const profileSectionsList = [
    "Basic Information",
    "Official Information",
    "Contact Information",
    "Education",
    "Experience",
    "Documents"
  ];

  const currentSectionIdx = profileSectionsList.indexOf(profileTab);
  const hasPrev = currentSectionIdx > 0;
  const hasNext = currentSectionIdx >= 0 && currentSectionIdx < profileSectionsList.length - 1;

  const profileDetails = useMemo(() => {
    if (!currentUserProfile && !user) return {};
    const rawProfile = currentUserProfile || {};
    let data = {};
    try {
      const rawJson = rawProfile.profile_data || rawProfile.profileData;
      if (rawJson) {
        if (typeof rawJson === "string") {
          data = JSON.parse(rawJson);
        } else if (typeof rawJson === "object") {
          data = rawJson;
        }
      }
    } catch (e) {
      console.error("Error parsing employee profileData:", e);
    }

    const empName = rawProfile.employee_name || rawProfile.employeeName || (rawProfile.firstName ? `${rawProfile.firstName} ${rawProfile.lastName || ''}`.trim() : "") || data.employee_name || data.employeeName || (data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : "") || user?.employeeName || user?.name || user?.email?.split('@')[0] || "Employee";
    const names = empName.split(" ");
    const firstName = names[0] || "Employee";
    const middleName = names.length > 2 ? names.slice(1, -1).join(" ") : "";
    const lastName = names.length > 1 ? names[names.length - 1] : "";

    const details = { ...rawProfile };
    const jsonCols = ['education', 'experience', 'skills', 'assets', 'documents', 'kpis', 'promotionHistory', 'awards', 'activityTimeline', 'weeklyOff'];
    jsonCols.forEach(col => {
      if (details[col] && typeof details[col] === 'string') {
        try {
          details[col] = JSON.parse(details[col]);
        } catch (err) {}
      }
    });

    const resolvedFirstName = data.firstName || details.firstName || details.first_name || firstName;
    const resolvedMiddleName = data.middleName || details.middleName || details.middle_name || middleName;
    const resolvedLastName = data.lastName || details.lastName || details.last_name || lastName;

    const resolvedEmpCode = details.employeeCode || details.emp_code || details.employee_code || data.employeeCode || data.emp_code || user?.employeeCode || (details.id ? `EMP-${String(details.id).padStart(4, '0')}` : "");
    const resolvedEmpId = details.employeeId || details.emp_id || details.employee_id || data.employeeId || data.emp_id || (details.id ? String(details.id) : "");
    const resolvedOfficialEmail = details.officialEmail || details.official_email || details.email || data.officialEmail || data.official_email || user?.email || "";
    const resolvedDept = details.department || details.department_name || details.deptName || details.dept_name || data.department || user?.departmentName || user?.department || "";
    const resolvedDesignation = details.designation || details.designation_name || details.designationName || data.designation || user?.designation || "";
    const resolvedBranch = details.branch || details.branch_name || data.branch || "Headquarters";
    const resolvedCompany = details.company || details.company_name || data.company || "NIB Insurance";
    const resolvedJoiningDate = details.dateOfJoining || details.joining_date || details.joiningDate || data.dateOfJoining || data.joining_date || "2026-01-15";

    return {
      ...details,
      ...data,
      firstName: resolvedFirstName,
      middleName: resolvedMiddleName,
      lastName: resolvedLastName,
      employeeCode: resolvedEmpCode,
      employeeId: resolvedEmpId,
      officialEmail: resolvedOfficialEmail,
      department: resolvedDept,
      designation: resolvedDesignation,
      branch: resolvedBranch,
      company: resolvedCompany,
      dateOfJoining: resolvedJoiningDate,
      gender: data.gender || details.gender || "Male",
      maritalStatus: data.maritalStatus || details.maritalStatus || "Single",
      bloodGroup: data.bloodGroup || details.bloodGroup || "O+",
      nationality: data.nationality || details.nationality || "Indian",
      dateOfBirth: data.dateOfBirth || details.dateOfBirth || details.dob || "1995-05-15",
      mobileNumber: data.mobileNumber || details.mobileNumber || details.phone || details.mobile || "9876543210",
      personalEmail: data.personalEmail || details.personalEmail || details.personal_email || (user?.email || ""),
      currentAddress: data.currentAddress || details.currentAddress || details.address || "123, Tech City, Main Road",
      city: data.city || details.city || "Indore",
      state: data.state || details.state || "Madhya Pradesh",
      country: data.country || details.country || "India",
      pinCode: data.pinCode || details.pinCode || "452001",
      highestDegree: data.highestDegree || details.highestDegree || "Bachelor of Technology",
      specialization: data.specialization || details.specialization || "Computer Science",
      university: data.university || details.university || "RGPV University",
      passingYear: data.passingYear || details.passingYear || "2018",
      educationGpa: data.educationGpa || details.educationGpa || "8.5 CGPA",
      prevCompany: data.prevCompany || details.prevCompany || "Apex Solutions Ltd",
      prevDesignation: data.prevDesignation || details.prevDesignation || "Software Engineer",
      totalExpYears: data.totalExpYears || details.totalExpYears || "3.5 Years",
      prevSalary: data.prevSalary || details.prevSalary || "6,50,000",
      documents: {
        ...(details.documents || {}),
        ...(data.documents || {})
      }
    };
  }, [currentUserProfile, user]);

  const effectiveProfileTab = useMemo(() => {
    if (activeTab === "Personal Information" || activeTab === "Basic Information") return "Basic Information";
    if (activeTab === "Official Information" || activeTab === "Organization Details") return "Official Information";
    if (activeTab === "Contact Details" || activeTab === "Address Details" || activeTab === "Contact Information") return "Contact Information";
    if (activeTab === "Education") return "Education";
    if (activeTab === "Experience") return "Experience";
    if (activeTab === "Documents" || activeTab === "My Documents") return "Documents";
    return "Basic Information";
  }, [activeTab]);

  useEffect(() => {
    const urlSubTab = searchParams.get("profileTab");
    if (urlSubTab && profileSectionsList.includes(urlSubTab)) {
      setProfileTab(urlSubTab);
    } else if (effectiveProfileTab && profileSectionsList.includes(effectiveProfileTab) && effectiveProfileTab !== "Dashboard Home" && effectiveProfileTab !== "Employee Profile") {
      setProfileTab(effectiveProfileTab);
    } else if (!profileSectionsList.includes(profileTab)) {
      setProfileTab("Basic Information");
    }
  }, [searchParams, effectiveProfileTab, profileSectionsList, profileTab]);

  const handleTabClick = (tabName) => {
    setProfileTab(tabName);
    setSearchParams({
      category: activeCategory,
      tab: activeTab,
      profileTab: tabName
    });
  };

  useEffect(() => {
    if (profileDetails && Object.keys(profileDetails).length > 0) {
      if (userRole === "Employee" || !isNewRegistration) {
        setEmployeeForm(prev => ({
          ...getEmptyEmployeeForm(),
          ...prev,
          ...profileDetails,
          documents: profileDetails.documents || prev.documents || {},
          assets: profileDetails.assets || prev.assets || []
        }));
      }
    }
  }, [profileDetails, isNewRegistration, userRole]);

  // Live Timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Redirect employee away from removed modules and default Attendance to Monthly Attendance
  useEffect(() => {
    const userRole = typeof user?.role === "object" ? user?.role?.name : user?.role;
    if (userRole === "Employee") {
      if (["EXIT_MGMT", "EMP_LEAVE", "EMP_HELPDESK"].includes(activeCategory)) {
        setSearchParams({ category: "EMP_DASHBOARD", tab: "Dashboard Home" });
      } else if (activeCategory === "EMP_ATTENDANCE" && (!activeTab || activeTab !== "Monthly Attendance")) {
        setSearchParams({ category: "EMP_ATTENDANCE", tab: "Monthly Attendance" });
      } else if (activeCategory === "EMPLOYEE_MGMT" && (activeTab === "Reporting Manager" || activeTab === "Reporting Hierarchy")) {
        setSearchParams({ category: "EMPLOYEE_MGMT", tab: "Employee Profile" });
      }
    }
  }, [activeCategory, activeTab, user?.role, setSearchParams]);

  // Fetch dynamic telemetry data from DB whitelisted tables
  const loadDashboardData = async () => {
    if (!user || !user.email) return;
    try {
      setLoading(true);
      // 1. Fetch all employees to find current logged-in employee profile
      const empsRes = await apiFetch("/api/table/employees");
      const empsList = empsRes?.data || [];
      setAllEmployeesList(empsList);

      // 2. Fetch daily attendance logs
      const attRes = await apiFetch("/api/table/daily_attendance");
      const attList = attRes?.data || [];
      setAllAttendanceList(attList);

      // 3. Fetch leaves requests
      const leaveRes = await apiFetch("/api/table/leave_requests");
      const leaveList = leaveRes?.data || [];
      setAllLeavesList(leaveList);

      // Fetch holidays
      let holidaysList = [];
      try {
        const holRes = await apiFetch("/api/table/holidays");
        holidaysList = holRes?.data || [];
        setHolidays(holidaysList);
      } catch (e) {
        console.warn("Failed to fetch holidays:", e);
      }

      // Fetch leave types
      try {
        const typesRes = await apiFetch("/api/table/leave_type_masters");
        const list = typesRes?.data || [];
        setLeaveTypes(list);
      } catch (e) {
        console.warn("Failed to fetch leave types:", e);
      }

      // Auxiliary recruitment & organization telemetry
      try {
        const [jobRes, candRes, intRes, offRes, tickRes, regRes] = await Promise.all([
          apiFetch("/api/table/job_postings").catch(() => ({ data: [] })),
          apiFetch("/api/table/candidate_database").catch(() => ({ data: [] })),
          apiFetch("/api/table/interviews").catch(() => ({ data: [] })),
          apiFetch("/api/table/offer_letters").catch(() => ({ data: [] })),
          apiFetch("/api/table/hr_tickets").catch(() => ({ data: [] })),
          apiFetch("/api/table/attendance_regularization").catch(() => ({ data: [] }))
        ]);
        if (jobRes?.data) setJobPostingsList(jobRes.data);
        if (candRes?.data) setCandidateList(candRes.data);
        if (intRes?.data) setInterviewsList(intRes.data);
        if (offRes?.data) setOfferLettersList(offRes.data);
        if (tickRes?.data) setAllTicketsList(tickRes.data);
        if (regRes?.data) setAllRegularizationsList(regRes.data);
      } catch (eAux) {
        console.warn("Auxiliary telemetry load error:", eAux);
      }

      // 4. Fetch dynamic departments list
      try {
        const deptRes = await apiFetch("/api/table/department");
        const depts = (deptRes?.data || []).map(d => d.deptName || d.dept_name || d.name).filter(Boolean);
        const empDepts = empsList.map(e => e.department).filter(Boolean);
        const merged = Array.from(new Set([...depts, ...empDepts, "IT", "Software Engineering", "Operations", "Finance", "Human Resources", "Sales & Marketing"]));
        setCompanyDepartmentsList(merged);
      } catch (e) {}

      const profile = empsList.find(e => {
        if (canManageEmployees && selectedEmployeeId) {
          return e.id === selectedEmployeeId;
        }
        const dbEmail = String(e.email || "").toLowerCase().trim();
        const loginEmail = String(user?.email || "").toLowerCase().trim();
        const dbUsername = dbEmail.split('@')[0];
        const loginUsername = loginEmail.split('@')[0];
        return dbEmail === loginEmail || 
               (dbUsername && loginUsername && dbUsername === loginUsername) ||
               (e.companyEmail && String(e.companyEmail).toLowerCase().trim() === loginEmail) ||
               (e.employeeCode && user?.username && String(e.employeeCode).toLowerCase().trim() === String(user.username).toLowerCase().trim());
      });
      
      if (profile) {
        setCurrentUserProfile(profile);
        
        // Filter attendance logs for current user
        const myEmpCode = profile.employeeCode || profile.emp_code || profile.employee_code || "";
        const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim().toLowerCase();
        const filteredAtt = attList.filter(a => {
          const empIdMatch = a.empId && myEmpCode && String(a.empId).toLowerCase().trim() === String(myEmpCode).toLowerCase().trim();
          const empIdMatchProfile = a.empId && String(a.empId).toLowerCase().trim() === String(profile.id).toLowerCase().trim();
          const employeeIdMatch = (a.employeeId || a.emp_id) && myEmpCode && String(a.employeeId || a.emp_id).toLowerCase().trim() === String(myEmpCode).toLowerCase().trim();
          const employeeIdMatchProfile = (a.employeeId || a.emp_id) && String(a.employeeId || a.emp_id).toLowerCase().trim() === String(profile.id).toLowerCase().trim();
          const nameMatch = fullName && a.name && String(a.name).trim().toLowerCase() === fullName;
          return empIdMatch || empIdMatchProfile || employeeIdMatch || employeeIdMatchProfile || nameMatch;
        }).map(l => ({
          id: l.id,
          date: l.date,
          checkIn: l.checkIn,
          checkOut: l.checkOut,
          status: l.status,
          workingHours: l.workingHours || l.working_hours || 0,
          lateComing: l.lateComing || l.late_coming || 0,
          earlyLeaving: l.earlyLeaving || l.early_leaving || 0,
          overtime: l.overtime || 0,
          company: l.company,
          branch: l.branch,
          department: l.department,
          shift: l.shift,
          ipAddress: l.ipAddress || l.ip_address || "--",
          deviceInfo: l.deviceInfo || l.device_info || "--",
          gpsLocation: l.gpsLocation || l.gps_location || "--",
          selfieUrl: l.selfieUrl || l.selfie_url || null,
          breakHours: l.breakHours || l.break_hours || 0,
          remarks: l.remarks
        }));

        if (filteredAtt.length > 0) {
          setAttendanceLogs(filteredAtt);
          const todayStr = new Date().toISOString().split('T')[0];
          const todayAtt = filteredAtt.find(a => a.date === todayStr);
          if (todayAtt && todayAtt.checkIn && (!todayAtt.checkOut || todayAtt.checkOut === "--")) {
            setEmpCheckedIn(true);
            setEmpPunchTime(todayAtt.checkIn);
          } else {
            setEmpCheckedIn(false);
            setEmpPunchTime("");
          }
        } else {
          setAttendanceLogs([]);
          setEmpCheckedIn(false);
          setEmpPunchTime("");
        }
        
        // Filter leaves for current user
        const myEmpCodeForLeaves = profile.employeeCode || profile.emp_code || profile.employee_code || "";
        const filteredLeaves = leaveList.filter(l => 
          (l.employeeId && myEmpCodeForLeaves && String(l.employeeId).toLowerCase().trim() === String(myEmpCodeForLeaves).toLowerCase().trim()) ||
          (l.employee_id && myEmpCodeForLeaves && String(l.employee_id).toLowerCase().trim() === String(myEmpCodeForLeaves).toLowerCase().trim()) ||
          (l.employeeId && String(l.employeeId).toLowerCase().trim() === String(profile.id).toLowerCase().trim()) ||
          (l.employee_id && String(l.employee_id).toLowerCase().trim() === String(profile.id).toLowerCase().trim()) ||
          (l.empName === profile.firstName || l.empName === profile.employeeName)
        );
        setLeaves(filteredLeaves.map(l => ({
          id: l.id || l.reqId,
          leaveType: l.leaveType,
          fromDate: l.fromDate,
          toDate: l.toDate,
          totalDays: Number(l.totalDays) || 1,
          halfDay: l.halfDay || "Full Day",
          attachment: l.attachment || "",
          rejectionReason: l.rejectionReason || "",
          status: l.status,
          reason: l.reason
        })));
        
        // Fetch asset allocations from both tables
        const [assetRes, invRes] = await Promise.all([
          apiFetch("/api/table/asset_allocation").catch(() => null),
          apiFetch("/api/table/inventory").catch(() => null)
        ]);

        const assetList = assetRes?.data || [];
        const invList = invRes?.data || [];

        const empCode = profile.emp_code || profile.empCode || profile.employeeCode || profile.employee_code || profile.employeeId || "";
        const firstName = profile.first_name || profile.firstName || "";
        const lastName = profile.last_name || profile.lastName || "";
        const empName = `${firstName} ${lastName}`.trim() || profile.employee_name || profile.employeeName || "";

        const matchEmployee = (item) => {
          if (!item) return false;
          const itemEmpId = item.empId || item.employeeId || "";
          const itemEmployee = item.employee || item.employeeName || item.employee_name || "";
          return (
            (itemEmpId && empCode && String(itemEmpId).toLowerCase().trim() === String(empCode).toLowerCase().trim()) ||
            (itemEmployee && empName && String(itemEmployee).toLowerCase().trim() === String(empName).toLowerCase().trim()) ||
            (itemEmpId && String(itemEmpId).toLowerCase().trim() === String(profile.id).toLowerCase().trim())
          );
        };

        const filteredAllocations = assetList.filter(matchEmployee).map(a => ({
          id: a.id || a.allocationId || Math.random().toString(),
          assetCode: a.assetCode || "N/A",
          assetName: a.assetName 
            ? `${a.assetName}${a.model ? ' (' + a.model + ')' : ''}`
            : (a.model || "Allocated Asset"),
          assetCategory: a.assetCategory || "General",
          serialNumber: a.serialNumber || a.serialNo || "N/A",
          assignedDate: a.issueDate || "N/A",
          status: a.status || "Assigned",
          processor: a.processor || null,
          operatingSystem: a.operatingSystem || a.operating_system || null,
          graphicsCard: a.graphicsCard || a.graphics_card || null,
          memory: a.memory || null,
          storage: a.storage || null,
          display: a.display || null,
          color: a.color || null
        }));

        const filteredInventory = invList.filter(matchEmployee).map(i => ({
          id: i.id || i.assetCode || Math.random().toString(),
          assetCode: i.assetCode || "N/A",
          assetName: i.assetName || (`${i.brand || ''} ${i.model || ''}`.trim()) || "Inventory Item",
          assetCategory: i.category || i.assetCategory || "General",
          serialNumber: i.serialNo || i.serialNumber || "N/A",
          assignedDate: i.issueDate || i.created_at?.split('T')[0] || "N/A",
          status: i.status || "Assigned",
          processor: i.processor || null,
          operatingSystem: i.operatingSystem || i.operating_system || null,
          graphicsCard: i.graphicsCard || i.graphics_card || null,
          memory: i.memory || null,
          storage: i.storage || null,
          display: i.display || null,
          color: i.color || null
        }));

        const combinedAssets = [...filteredAllocations, ...filteredInventory];
        setAssets(combinedAssets);
        
        // Fetch support tickets
        try {
          const ticketRes = await apiFetch("/api/table/hr_tickets");
          const ticketList = ticketRes?.data || [];
          setAllTicketsList(ticketList);
          const filteredTickets = ticketList.filter(t => t.empName === profile.firstName || t.empName === profile.employeeName);
          setTickets(filteredTickets.map(t => ({
            id: t.id || t.ticketNo,
            subject: t.subject,
            category: t.category,
            status: t.status,
            date: t.created_at ? t.created_at.split(' ')[0] : '2026-07-27'
          })));
        } catch (eTick) {
          setTickets([]);
        }

        // Fetch payroll history from custom route
        try {
          const payRes = await apiFetch(`/api/finance/payslips?employeeId=${profile.id}`);
          const payList = payRes?.data || [];
          const mappedPayroll = payList.map(p => ({
            id: p.id,
            month: `${p.month} ${p.year}`,
            basic: Number(p.basic) || 0,
            hra: Number(p.hra) || 0,
            special: Number(p.special) || 0,
            pf: Number(p.pf) || 0,
            tax: Number(p.pt) + Number(p.tds) || 0,
            netPay: Number(p.netSalary) || 0
          }));
          setPayslips(mappedPayroll);
        } catch (errPay) {
          setPayslips([]);
        }

        // Fetch regularization logs
        try {
          const regRes = await apiFetch("/api/table/attendance_regularization");
          const regList = regRes?.data || [];
          setAllRegularizationsList(regList);
          const myRegList = regList.filter(r => 
            (r.empId && myEmpCode && String(r.empId).toLowerCase().trim() === String(myEmpCode).toLowerCase().trim()) ||
            (r.empId && String(r.empId).toLowerCase().trim() === String(profile.id).toLowerCase().trim())
          );
          setRegularizationLogs(myRegList);
        } catch (errReg) {
          setRegularizationLogs([]);
        }
      }
    } catch (err) {
      console.error("Error loading dynamic dashboard telemetry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      loadDashboardData();
    }
  }, [user?.email, selectedEmployeeId]);

  useEffect(() => {
    const urlEmpId = searchParams.get("profileEmpId");
    if (urlEmpId && urlEmpId !== selectedEmployeeId) {
      setSelectedEmployeeId(urlEmpId);
    }
  }, [searchParams]);

  // Telemetry Metrics calculations based on real DB values
  const metrics = useMemo(() => {
    // 1. Target employees based on selected department filter
    let targetEmps = allEmployeesList || [];
    if (selectedDeptFilter && selectedDeptFilter !== "All" && selectedDeptFilter !== "All Departments") {
      targetEmps = targetEmps.filter(e => {
        const d = (e.department || "").trim().toLowerCase();
        const f = selectedDeptFilter.trim().toLowerCase();
        return d === f || d.includes(f) || f.includes(d);
      });
    }

    const totalEmp = targetEmps.length;

    // Helper identifiers set
    const empIds = new Set();
    const empCodes = new Set();
    const empNames = new Set();
    targetEmps.forEach(e => {
      if (e.id) empIds.add(String(e.id).toLowerCase().trim());
      if (e.employeeId) empIds.add(String(e.employeeId).toLowerCase().trim());
      if (e.employeeCode) empCodes.add(String(e.employeeCode).toLowerCase().trim());
      if (e.emp_code) empCodes.add(String(e.emp_code).toLowerCase().trim());
      if (e.employee_code) empCodes.add(String(e.employee_code).toLowerCase().trim());
      const nm = `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.employeeName || e.employee_name || '';
      if (nm) empNames.add(nm.toLowerCase().trim());
      if (e.firstName) empNames.add(String(e.firstName).toLowerCase().trim());
    });

    const matchesTarget = (rec) => {
      if (!rec) return false;
      const recId = String(rec.empId || rec.employeeId || rec.employee_id || rec.emp_id || rec.id || '').toLowerCase().trim();
      if (recId && (empIds.has(recId) || empCodes.has(recId))) return true;
      const recName = String(rec.empName || rec.employeeName || rec.employee_name || rec.name || '').toLowerCase().trim();
      if (recName && empNames.has(recName)) return true;
      return false;
    };

    // Date
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Attendance
    const todayAtt = (allAttendanceList || []).filter(a => {
      const aDate = String(a.date || '').split('T')[0].split(' ')[0];
      return aDate === todayStr && (selectedDeptFilter === "All Departments" || matchesTarget(a));
    });

    const present = todayAtt.filter(a => {
      const st = (a.status || '').toLowerCase();
      return st === 'present' || (a.checkIn && a.checkIn !== '--');
    }).length;

    const late = todayAtt.filter(a => {
      const st = (a.status || '').toLowerCase();
      return st === 'late' || Number(a.lateComing || a.late_coming) > 0;
    }).length;

    const wfh = todayAtt.filter(a => {
      const st = (a.status || '').toLowerCase();
      return st === 'wfh' || st === 'work from home';
    }).length;

    // Leaves
    const deptLeaves = (allLeavesList || []).filter(l => selectedDeptFilter === "All Departments" || matchesTarget(l));
    const onLeave = deptLeaves.filter(l => {
      const st = (l.status || '').toLowerCase();
      if (st !== 'approved') return false;
      const from = String(l.fromDate || l.from_date || '').split('T')[0];
      const to = String(l.toDate || l.to_date || '').split('T')[0] || from;
      return todayStr >= from && todayStr <= to;
    }).length;

    const absent = Math.max(0, totalEmp - present - onLeave);

    // Approvals
    const pendingLeaves = deptLeaves.filter(l => (l.status || '').toLowerCase() === 'pending');
    const pendingRegs = (allRegularizationsList || []).filter(r => (selectedDeptFilter === "All Departments" || matchesTarget(r)) && (r.status || '').toLowerCase() === 'pending');
    const pending = pendingLeaves.length + pendingRegs.length;

    // Employee Summary
    const maleCount = targetEmps.filter(e => (e.gender || '').toLowerCase() === 'male').length;
    const femaleCount = targetEmps.filter(e => (e.gender || '').toLowerCase() === 'female').length;
    const activeCount = targetEmps.filter(e => (e.employeeStatus || 'active').toLowerCase() !== 'inactive' && (e.employeeStatus || '').toLowerCase() !== 'resigned').length;
    const permanentCount = targetEmps.filter(e => {
      const t = (e.employeeType || 'full-time').toLowerCase();
      return t.includes('full') || t.includes('perm');
    }).length;
    const contractCount = targetEmps.filter(e => {
      const t = (e.employeeType || '').toLowerCase();
      return t.includes('contract') || t.includes('temp');
    }).length;

    // Leave Summary
    const totalLeaveBalance = targetEmps.reduce((sum, e) => {
      const cl = e.casualLeaveBalance !== undefined && e.casualLeaveBalance !== null ? Number(e.casualLeaveBalance) : 12;
      const sl = e.sickLeaveBalance !== undefined && e.sickLeaveBalance !== null ? Number(e.sickLeaveBalance) : 8;
      const el = e.earnedLeaveBalance !== undefined && e.earnedLeaveBalance !== null ? Number(e.earnedLeaveBalance) : 15;
      return sum + cl + sl + el;
    }, 0);

    const leaveTaken = deptLeaves
      .filter(l => (l.status || '').toLowerCase() === 'approved')
      .reduce((sum, l) => sum + (Number(l.totalDays || l.total_days) || 1), 0);

    const pendingLeaveDays = pendingLeaves
      .reduce((sum, l) => sum + (Number(l.totalDays || l.total_days) || 1), 0);

    // Recruitment Summary
    const openVacancies = (jobPostingsList || []).filter(j => (j.status || 'Active').toLowerCase() === 'active' || (j.status || '').toLowerCase() === 'open').length;
    const interviewsToday = (interviewsList || []).filter(i => {
      const d = String(i.interviewDate || i.date || '').split('T')[0];
      return d === todayStr;
    }).length;
    const shortlistedStaff = (candidateList || []).filter(c => (c.status || '').toLowerCase() === 'shortlisted').length;
    const offersReleased = (offerLettersList || []).filter(o => {
      const st = (o.status || '').toLowerCase();
      return st === 'sent' || st === 'released' || st === 'approved' || st === 'accepted';
    }).length;

    // Department Distribution Bar Chart
    const deptMap = {};
    (allEmployeesList || []).forEach(e => {
      const d = (e.department || "General").trim();
      deptMap[d] = (deptMap[d] || 0) + 1;
    });
    const maxVal = Math.max(...Object.values(deptMap), 1);
    const palette = ["bg-blue-600", "bg-emerald-500", "bg-indigo-500", "bg-pink-500", "bg-amber-500", "bg-purple-600", "bg-sky-500"];
    const barData = Object.keys(deptMap).length > 0 
      ? Object.entries(deptMap).map(([label, count], idx) => ({
          label: label.length > 8 ? label.slice(0, 7) + ".." : label,
          fullLabel: label,
          value: count,
          height: `${Math.max(15, Math.round((count / maxVal) * 90))}%`,
          color: palette[idx % palette.length]
        }))
      : [
          { label: "General", fullLabel: "General", value: totalEmp, height: "80%", color: "bg-blue-600" }
        ];

    // Dynamic 5-day Trend (Attendance & Leaves)
    const trendDays = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayLabel = d.toLocaleDateString("en-US", { day: "2-digit", month: "short" });

      const dayAtt = (allAttendanceList || []).filter(a => {
        const ad = String(a.date || '').split('T')[0].split(' ')[0];
        return ad === iso && (selectedDeptFilter === "All Departments" || matchesTarget(a));
      });
      const attCount = dayAtt.filter(a => (a.status || '').toLowerCase() === 'present' || a.checkIn).length;
      const attRate = totalEmp > 0 ? Math.round((attCount / totalEmp) * 100) : 0;

      const dayLeaves = deptLeaves.filter(l => {
        const st = (l.status || '').toLowerCase();
        if (st !== 'approved') return false;
        const from = String(l.fromDate || l.from_date || '').split('T')[0];
        const to = String(l.toDate || l.to_date || '').split('T')[0] || from;
        return iso >= from && iso <= to;
      }).length;

      trendDays.push({ iso, dayLabel, attRate, attCount, dayLeaves });
    }

    // Helpdesk Summary
    const deptTickets = (allTicketsList || []).filter(t => selectedDeptFilter === "All Departments" || matchesTarget(t));
    const openTickets = deptTickets.filter(t => (t.status || 'open').toLowerCase() === 'open').length;
    const inProgTickets = deptTickets.filter(t => {
      const st = (t.status || '').toLowerCase();
      return st === 'in progress' || st === 'in_progress' || st === 'in review';
    }).length;
    const resolvedTickets = deptTickets.filter(t => (t.status || '').toLowerCase() === 'resolved').length;
    const closedTickets = deptTickets.filter(t => (t.status || '').toLowerCase() === 'closed').length;

    // Performance
    const ratedEmps = targetEmps.filter(e => e.rating && !isNaN(Number(e.rating)));
    const avgRating = ratedEmps.length > 0 
      ? (ratedEmps.reduce((acc, e) => acc + Number(e.rating), 0) / ratedEmps.length).toFixed(1)
      : (totalEmp > 0 ? "4.5" : "0.0");
    const avgKpiList = targetEmps.filter(e => e.kpiValue && !isNaN(Number(e.kpiValue)));
    const avgKpi = avgKpiList.length > 0 
      ? `${Math.round(avgKpiList.reduce((acc, e) => acc + Number(e.kpiValue), 0) / avgKpiList.length)}%`
      : (totalEmp > 0 ? "95%" : "0%");
    const topPerformers = targetEmps.filter(e => Number(e.rating || 0) >= 4).length;

    // Recent activities
    const recentActivities = [];
    deptLeaves.slice(0, 2).forEach(l => {
      recentActivities.push({
        text: `${l.empName || 'Employee'} requested ${l.leaveType} (${l.totalDays}d)`,
        date: l.fromDate || 'Recently',
        color: 'bg-blue-600'
      });
    });
    todayAtt.slice(0, 2).forEach(a => {
      recentActivities.push({
        text: `${a.employee || 'Staff'} punched in at ${a.checkIn || '09:00 AM'}`,
        date: a.date || 'Today',
        color: 'bg-emerald-500'
      });
    });
    if (recentActivities.length === 0) {
      targetEmps.slice(-2).reverse().forEach(e => {
        const nm = `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.employeeName || 'New Employee';
        recentActivities.push({
          text: `${nm} profile active in ${e.department || 'Workspace'}`,
          date: e.dateOfJoining || 'Recently',
          color: 'bg-indigo-600'
        });
      });
    }

    // Upcoming events from holidays
    const upcomingEvents = (holidays || [])
      .filter(h => {
        const hDate = String(h.holidayDate || h.holiday_date || '').split('T')[0];
        return hDate >= todayStr;
      })
      .slice(0, 3)
      .map(h => ({
        title: h.holidayName || h.holiday_name || "Holiday",
        date: h.holidayDate || h.holiday_date,
        type: h.holidayType || "Public Holiday"
      }));

    return {
      totalEmp,
      present,
      onLeave,
      absent,
      late,
      wfh,
      pending,
      pendingLeavesCount: pendingLeaves.length,
      pendingRegCount: pendingRegs.length,
      maleCount,
      femaleCount,
      activeCount,
      permanentCount,
      contractCount,
      totalLeaveBalance,
      leaveTaken,
      pendingLeaveDays,
      openVacancies,
      interviewsToday,
      shortlistedStaff,
      offersReleased,
      barData,
      trendDays,
      openTickets,
      inProgTickets,
      resolvedTickets,
      closedTickets,
      totalTickets: deptTickets.length,
      avgRating,
      stars: Math.round(Number(avgRating)),
      avgKpi,
      topPerformers,
      recentActivities,
      upcomingEvents
    };
  }, [allEmployeesList, allAttendanceList, allLeavesList, allTicketsList, allRegularizationsList, jobPostingsList, candidateList, interviewsList, offerLettersList, holidays, selectedDeptFilter]);

  // Human-readable info and working days calculation for selected month filter
  const selectedMonthInfo = useMemo(() => {
    const now = new Date();
    let targetYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let label = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    let year = now.getFullYear();
    let monthIndex = now.getMonth();

    if (selectedMonthFilter === "last_month") {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      targetYearMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
      label = prev.toLocaleString('default', { month: 'long', year: 'numeric' });
      year = prev.getFullYear();
      monthIndex = prev.getMonth();
    } else if (selectedMonthFilter === "this_month") {
      // current month defaults
    } else if (selectedMonthFilter === "all") {
      return {
        targetYearMonth: "all",
        label: "All Records",
        workingDays: 22,
        isAll: true
      };
    } else if (selectedMonthFilter && selectedMonthFilter.includes("-")) {
      const parts = selectedMonthFilter.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, 1);
      targetYearMonth = selectedMonthFilter;
      label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      year = parts[0];
      monthIndex = parts[1] - 1;
    }

    // Dynamic weekdays calculation for target month minus holidays
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    let workingDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const curDate = new Date(year, monthIndex, day);
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const iso = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isHoliday = (holidays || []).some(h => String(h.holidayDate || h.date || '').startsWith(iso));
        if (!isHoliday) {
          workingDays++;
        }
      }
    }

    return {
      targetYearMonth,
      label,
      workingDays: workingDays || 22,
      isAll: false
    };
  }, [selectedMonthFilter, holidays]);

  // Filtered attendance logs for the selected month, sorted descending by date
  const monthlyAttendanceLogs = useMemo(() => {
    if (!attendanceLogs || attendanceLogs.length === 0) return [];
    if (selectedMonthInfo.isAll) {
      return [...attendanceLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    const filtered = attendanceLogs.filter(log => {
      if (!log || !log.date) return false;
      const logDate = String(log.date).split('T')[0];
      return logDate.startsWith(selectedMonthInfo.targetYearMonth);
    });
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [attendanceLogs, selectedMonthInfo]);

  // Attendance metrics for selected month
  const monthlyAttendanceKPIs = useMemo(() => {
    const presentCount = monthlyAttendanceLogs.filter(l => 
      (l.status || '').toLowerCase() === "present" || 
      (l.status || '').toLowerCase() === "late" ||
      (l.status || '').toLowerCase() === "half day"
    ).length;

    const lateCount = monthlyAttendanceLogs.filter(l => 
      (l.status || '').toLowerCase() === "late" || Number(l.lateComing || 0) > 0
    ).length;

    const absentCount = monthlyAttendanceLogs.filter(l => 
      (l.status || '').toLowerCase() === "absent" || (l.status || '').toLowerCase() === "leave"
    ).length;

    return {
      workingDays: selectedMonthInfo.workingDays,
      presentDays: presentCount,
      lateMarks: lateCount,
      absences: absentCount
    };
  }, [monthlyAttendanceLogs, selectedMonthInfo]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    let effectiveFirstName = (employeeForm.firstName || "").trim();
    let effectiveLastName = (employeeForm.lastName || "").trim();

    // If firstName is empty, try falling back to all available sources
    if (!effectiveFirstName) {
      if (employeeForm.employee_name || employeeForm.employeeName) {
        const full = (employeeForm.employee_name || employeeForm.employeeName).trim();
        effectiveFirstName = full.split(' ')[0] || "";
        if (!effectiveLastName) effectiveLastName = full.split(' ').slice(1).join(' ') || "";
      } else if (profileDetails.firstName || profileDetails.first_name) {
        effectiveFirstName = (profileDetails.firstName || profileDetails.first_name).trim();
        if (!effectiveLastName) effectiveLastName = (profileDetails.lastName || profileDetails.last_name || "").trim();
      } else if (profileDetails.employee_name || profileDetails.employeeName) {
        const full = (profileDetails.employee_name || profileDetails.employeeName).trim();
        effectiveFirstName = full.split(' ')[0] || "";
        if (!effectiveLastName) effectiveLastName = full.split(' ').slice(1).join(' ') || "";
      } else if (currentUserProfile?.firstName || currentUserProfile?.employee_name) {
        effectiveFirstName = currentUserProfile.firstName || (currentUserProfile.employee_name || "").split(' ')[0];
        if (!effectiveLastName) effectiveLastName = currentUserProfile.lastName || (currentUserProfile.employee_name || "").split(' ').slice(1).join(' ');
      } else if (employeeForm.officialEmail) {
        const emailPrefix = employeeForm.officialEmail.split('@')[0].replace(/[._-]/g, ' ').trim();
        const parts = emailPrefix.split(' ').filter(Boolean);
        if (parts.length > 0) {
          effectiveFirstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
          if (!effectiveLastName && parts.length > 1) {
            effectiveLastName = parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
          }
        }
      } else if (employeeForm.personalEmail) {
        const emailPrefix = employeeForm.personalEmail.split('@')[0].replace(/[._-]/g, ' ').trim();
        const parts = emailPrefix.split(' ').filter(Boolean);
        if (parts.length > 0) {
          effectiveFirstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
          if (!effectiveLastName && parts.length > 1) {
            effectiveLastName = parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
          }
        }
      } else if (user?.employeeName || user?.name) {
        const full = (user.employeeName || user.name).trim();
        effectiveFirstName = full.split(' ')[0] || "";
        if (!effectiveLastName) effectiveLastName = full.split(' ').slice(1).join(' ') || "";
      } else {
        effectiveFirstName = "Employee";
      }
    }

    const constructedName = `${effectiveFirstName} ${effectiveLastName}`.trim();
    
    const profileDataStr = JSON.stringify({
      ...employeeForm,
      firstName: effectiveFirstName,
      lastName: effectiveLastName,
      updatedBy: user?.email || "Employee Self",
      updatedDate: new Date().toLocaleDateString()
    });

    const cleanFirstName = (effectiveFirstName || "employee").toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanLastName = (effectiveLastName || "staff").toLowerCase().replace(/[^a-z0-9]/g, "");
    const fallbackEmail = `${cleanFirstName}.${cleanLastName}${Date.now().toString().slice(-4)}@nib.com`;
    const effectiveEmail = (employeeForm.officialEmail && employeeForm.officialEmail.trim())
      ? employeeForm.officialEmail.trim()
      : (employeeForm.personalEmail && employeeForm.personalEmail.trim())
        ? employeeForm.personalEmail.trim()
        : fallbackEmail;

    const payload = {
      ...employeeForm,
      firstName: effectiveFirstName,
      lastName: effectiveLastName,
      employee_name: constructedName,
      employeeName: constructedName,
      emp_code: employeeForm.employeeCode || employeeForm.empCode || undefined,
      employeeCode: employeeForm.employeeCode || employeeForm.empCode || undefined,
      email: effectiveEmail,
      officialEmail: employeeForm.officialEmail || effectiveEmail,
      companyEmail: employeeForm.officialEmail || effectiveEmail,
      department: employeeForm.department || "Operations",
      profile_data: profileDataStr
    };

    delete payload.created_at;
    delete payload.updated_at;
    delete payload.createdAt;
    delete payload.updatedAt;

    // 1. Client-side duplicate check against allEmployeesList
    const targetEmail = (employeeForm.officialEmail || employeeForm.personalEmail || employeeForm.email || effectiveEmail || "").toLowerCase().trim();
    const targetCode = (employeeForm.employeeCode || employeeForm.emp_code || employeeForm.employee_code || "").toLowerCase().trim();
    const targetMobile = (employeeForm.mobileNumber || "").replace(/\D/g, "");
    const currentEditId = employeeForm.id || null;

    const duplicateEmployee = allEmployeesList.find(emp => {
      if (currentEditId && emp.id === currentEditId) return false;
      const empEmail = (emp.officialEmail || emp.email || emp.companyEmail || emp.personalEmail || "").toLowerCase().trim();
      const empCode = (emp.employeeCode || emp.emp_code || emp.employee_code || "").toLowerCase().trim();
      const empMobile = String(emp.mobileNumber || emp.mobile || "").replace(/\D/g, "");
      
      const emailMatches = Boolean(targetEmail && empEmail && targetEmail === empEmail);
      const codeMatches = Boolean(targetCode && empCode && targetCode === empCode);
      const mobileMatches = Boolean(targetMobile && empMobile && targetMobile.length >= 7 && targetMobile === empMobile);

      return emailMatches || codeMatches || mobileMatches;
    });

    if (duplicateEmployee) {
      const dupName = duplicateEmployee.employee_name || duplicateEmployee.employeeName || `${duplicateEmployee.firstName || ''} ${duplicateEmployee.lastName || ''}`.trim() || "Existing Employee";
      const dupCode = duplicateEmployee.employeeCode || duplicateEmployee.emp_code || duplicateEmployee.employee_code || "--";
      const dupEmail = duplicateEmployee.officialEmail || duplicateEmployee.email || "--";
      const matchedField = (targetEmail && (duplicateEmployee.officialEmail || duplicateEmployee.email) && targetEmail === (duplicateEmployee.officialEmail || duplicateEmployee.email).toLowerCase().trim())
        ? "Email Address"
        : (targetCode && (duplicateEmployee.employeeCode || duplicateEmployee.emp_code) && targetCode === (duplicateEmployee.employeeCode || duplicateEmployee.emp_code).toLowerCase().trim())
          ? "Employee Code"
          : "Mobile Number";

      setDuplicateWarningModal({
        isOpen: true,
        title: "Already Data Uploaded!",
        name: dupName,
        code: dupCode,
        email: dupEmail,
        id: duplicateEmployee.id,
        matchedField,
        customMessage: `⚠️ Already Data Uploaded! Database me is ${matchedField} ke saath employee data pehle se upload ho chuka hai. Same data dobara insert nahi ho sakta.`,
        existingData: duplicateEmployee
      });
      return;
    }

    try {
      if (employeeForm.id) {
        await apiFetch(`/api/table/employees/${employeeForm.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      } else {
        const newId = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : "emp-" + Math.random().toString(36).substring(2, 15);
        await apiFetch("/api/table/employees", {
          method: "POST",
          body: JSON.stringify({
            ...payload,
            id: newId
          })
        });
      }
      
      if (userRole === "Employee") {
        await loadDashboardData();
        alert("✅ Profile details updated and saved to database successfully!");
      } else {
        // Reset form for admin registering a new employee
        setIsNewRegistration(true);
        setEmployeeForm(getEmptyEmployeeForm());
        setSelectedEmployeeId("");
        await loadDashboardData();
        alert("✅ Data uploaded and saved to database successfully!");
      }
    } catch (err) {
      const msg = err.message || "Failed to save profile.";
      if (msg.toLowerCase().includes("already exists") || msg.toLowerCase().includes("duplicate")) {
        setDuplicateWarningModal({
          isOpen: true,
          title: "Already Data Uploaded!",
          name: "Existing Employee in Database",
          code: employeeForm.employeeCode || "--",
          email: effectiveEmail || "--",
          id: "",
          matchedField: "Email or Employee Code",
          customMessage: `⚠️ Already Data Uploaded! ${msg}`,
          existingData: null
        });
      } else {
        alert(msg);
      }
    }
  };

  const handleLoadDuplicateEmployee = (existingEmp) => {
    if (!existingEmp) {
      setDuplicateWarningModal(null);
      return;
    }
    setIsNewRegistration(false);
    let parsedProfile = {};
    if (existingEmp.profile_data) {
      try {
        parsedProfile = typeof existingEmp.profile_data === 'string' ? JSON.parse(existingEmp.profile_data) : existingEmp.profile_data;
      } catch (e) {}
    }
    setEmployeeForm({
      ...getEmptyEmployeeForm(),
      ...existingEmp,
      ...parsedProfile,
      documents: existingEmp.documents || parsedProfile.documents || {},
      assets: existingEmp.assets || parsedProfile.assets || []
    });
    setDuplicateWarningModal(null);
    alert(`Loaded profile for ${existingEmp.employee_name || existingEmp.employeeName || existingEmp.firstName || 'Employee'}. You can now update this record.`);
  };

  // Punch Action database integration
  const handleEmpPunch = async (gpsMock = null, selfieMock = null) => {
    if (!currentUserProfile) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const dateStr = now.toISOString().split('T')[0];

    // Gather browser/device info
    const userAgent = navigator.userAgent;
    const ipAddress = "127.0.0.1";
    const browserName = userAgent.includes("Chrome") ? "Chrome" : userAgent.includes("Firefox") ? "Firefox" : "Safari";
    const deviceName = userAgent.includes("Mobi") ? "Mobile Device" : "Desktop PC";

    try {
      if (!empCheckedIn) {
        // Prevent duplicate check-in
        const alreadyPunched = attendanceLogs.some(log => log.date === dateStr);
        if (alreadyPunched) {
          alert("You have already completed attendance for today!");
          return;
        }

        // Validate shift details - Default Shift starts at 09:00:00
        const shiftStart = "09:00:00";
        const graceMinutes = 15;
        const [sh, sm] = shiftStart.split(':').map(Number);
        
        const checkInTime = now;
        const shiftLimit = new Date();
        shiftLimit.setHours(sh, sm + graceMinutes, 0, 0);
        
        let status = "Present";
        let lateComing = 0;
        
        if (checkInTime > shiftLimit) {
          status = "Late";
          const diffMs = checkInTime - shiftLimit;
          lateComing = Math.floor(diffMs / 60000); // Minutes late
        }

        const newRecord = {
          empId: currentUserProfile.employeeCode || currentUserProfile.emp_code || currentUserProfile.id,
          employeeId: null,
          name: `${currentUserProfile.firstName || ''} ${currentUserProfile.lastName || ''}`.trim() || currentUserProfile.employeeName || "Employee",
          date: dateStr,
          checkIn: timeStr,
          checkOut: "--",
          workingHours: 0,
          status: status,
          lateComing: lateComing,
          earlyLeaving: 0,
          overtime: 0,
          company: currentUserProfile.company || "NIB Technologies Pvt Ltd",
          branch: currentUserProfile.branch || "Headquarters",
          department: currentUserProfile.department || "Operations",
          shift: "General Shift",
          ip_address: ipAddress,
          device_info: `${deviceName} (${browserName})`,
          gps_location: gpsMock || "19.0760, 72.8777",
          selfie_url: selfieMock || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
          break_hours: 1.0,
          remarks: status === "Late" ? `Late arrival by ${lateComing} minutes` : "On time Check-In"
        };

        const saved = await apiFetch("/api/table/daily_attendance", {
          method: "POST",
          body: JSON.stringify(newRecord)
        });

        // Write to audit log
        await apiFetch("/api/table/audit_logs", {
          method: "POST",
          body: JSON.stringify({
            userId: currentUserProfile.id,
            username: currentUserProfile.email,
            roleName: "Employee",
            actionType: "Punch In",
            moduleName: "Attendance",
            recordId: saved?.data?.id || Math.random().toString(),
            previousValues: "None",
            newValues: JSON.stringify(newRecord),
            httpMethod: "POST",
            apiEndpoint: "/api/table/daily_attendance",
            requestBody: JSON.stringify(newRecord),
            ipAddress: ipAddress,
            userAgent: userAgent,
            browser: browserName,
            device: deviceName,
            os: "Windows",
            status: "Success",
            timestamp: now.toISOString()
          })
        });

        setEmpCheckedIn(true);
        setEmpPunchTime(timeStr);
        alert("Punched In successfully!");
      } else {
        // Find today's check-in
        const todayAtt = attendanceLogs.find(a => a.date === dateStr);
        if (todayAtt && todayAtt.id) {
          // Calculate hours
          const [cinH, cinM] = todayAtt.checkIn.split(':').map(Number);
          const cinDate = new Date();
          cinDate.setHours(cinH, cinM, 0, 0);

          const diffMs = now - cinDate;
          let diffHrs = diffMs / 3600000;
          
          const breakHours = 1.0;
          let workingHours = Math.max(0, diffHrs - breakHours);
          
          let status = todayAtt.status;
          let overtime = 0;
          let earlyLeaving = 0;
          
          // General Shift ends at 18:00:00
          const shiftEnd = "18:00:00";
          const [seh, sem] = shiftEnd.split(':').map(Number);
          const shiftEndDate = new Date();
          shiftEndDate.setHours(seh, sem, 0, 0);

          if (now < shiftEndDate) {
            status = "Early Exit";
            earlyLeaving = Math.floor((shiftEndDate - now) / 60000);
          }

          if (workingHours < 4) {
            status = "Absent";
          } else if (workingHours < 8) {
            status = "Half Day";
          } else if (workingHours > 8.5) {
            status = "Overtime";
            overtime = Number((workingHours - 8.5).toFixed(2));
          }

          const updatePayload = {
            checkOut: timeStr,
            workingHours: Number(workingHours.toFixed(2)),
            status: status,
            earlyLeaving: earlyLeaving,
            overtime: overtime,
            remarks: `Checked out at ${timeStr}. Working hours: ${workingHours.toFixed(2)}`
          };

          await apiFetch(`/api/table/daily_attendance/${todayAtt.id}`, {
            method: "PUT",
            body: JSON.stringify(updatePayload)
          });

          // Write to audit log
          await apiFetch("/api/table/audit_logs", {
            method: "POST",
            body: JSON.stringify({
              userId: currentUserProfile.id,
              username: currentUserProfile.email,
              roleName: "Employee",
              actionType: "Punch Out",
              moduleName: "Attendance",
              recordId: todayAtt.id,
              previousValues: JSON.stringify(todayAtt),
              newValues: JSON.stringify(updatePayload),
              httpMethod: "PUT",
              apiEndpoint: `/api/table/daily_attendance/${todayAtt.id}`,
              requestBody: JSON.stringify(updatePayload),
              ipAddress: ipAddress,
              userAgent: userAgent,
              browser: browserName,
              device: deviceName,
              os: "Windows",
              status: "Success",
              timestamp: now.toISOString()
            })
          });

          setEmpCheckedIn(false);
          setEmpPunchTime("");
          alert("Punched Out successfully! Session locked for today.");
        }
      }
      loadDashboardData();
    } catch (err) {
      console.error("Failed to post attendance event:", err);
      alert("Error posting attendance event to database.");
    }
  };

  // Submit Leave Action database integration
  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!newLeave.fromDate || !newLeave.toDate || !newLeave.reason || !currentUserProfile) {
      alert("Please fill all fields!");
      return;
    }

    // Calculate days excluding weekends and holidays
    let calculatedDays = 0;
    const start = new Date(newLeave.fromDate);
    const end = new Date(newLeave.toDate);
    if (end < start) {
      alert("Invalid date range!");
      return;
    }

    // Parse weekly offs
    let weeklyOffs = ["Sunday"];
    const rawWeeklyOff = currentUserProfile.weeklyOff || currentUserProfile.weekly_off || "";
    if (rawWeeklyOff) {
      try {
        const parsed = JSON.parse(rawWeeklyOff);
        if (Array.isArray(parsed)) weeklyOffs = parsed;
        else if (typeof parsed === 'string') weeklyOffs = [parsed];
      } catch (e) {
        if (typeof rawWeeklyOff === 'string') {
          weeklyOffs = rawWeeklyOff.split(",").map(s => s.trim());
        }
      }
    }

    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayName = daysOfWeek[d.getDay()];
      if (weeklyOffs.some(wo => dayName.toLowerCase().includes(wo.toLowerCase()))) {
        continue; // Skip weekend / weekly off
      }

      const dateStr = d.toISOString().split('T')[0];
      const isHoliday = holidays.some(h => {
        const hDate = h.holidayDate || h.holiday_date;
        if (hDate !== dateStr || h.is_working_day) return false;

        const empBranch = String(currentUserProfile?.branch || "").toLowerCase().trim();
        const empLocation = String(currentUserProfile?.location || currentUserProfile?.city || "").toLowerCase().trim();
        const empCompany = String(currentUserProfile?.company || "").toLowerCase().trim();

        const hBranch = String(h.branch || "").toLowerCase().trim();
        const hLocation = String(h.location || "").toLowerCase().trim();
        const hCompany = String(h.company || "").toLowerCase().trim();

        const isMainHQMatch = (hBranch === "main" || hBranch === "headquarters" || hBranch === "main branch") && (empBranch === "main" || empBranch === "headquarters" || empBranch === "main branch");
        const matchBranch = !h.branch || hBranch === "all branches" || hBranch === "" || isMainHQMatch || (empBranch && hBranch.includes(empBranch)) || (empBranch && empBranch.includes(hBranch));
        const matchLocation = !h.location || hLocation === "all locations" || hLocation === "" || (empLocation && hLocation.includes(empLocation)) || (empLocation && empLocation.includes(hLocation));
        const matchCompany = !h.company || hCompany === "all companies" || hCompany === "" || (empCompany && hCompany.includes(empCompany)) || (empCompany && empCompany.includes(hCompany));

        return matchBranch && matchLocation && matchCompany;
      });
      if (isHoliday) {
        continue; // Skip holiday
      }

      calculatedDays += (newLeave.halfDay === "Half Day" ? 0.5 : 1.0);
    }

    if (calculatedDays <= 0) {
      alert("Selected date range consists only of holidays and weekly offs. No leave days will be counted.");
      return;
    }

    try {
      await apiFetch("/api/table/leave_requests", {
        method: "POST",
        body: JSON.stringify({
          reqId: `LRQ-${Math.floor(100000 + Math.random() * 900000)}`,
          empName: `${currentUserProfile.firstName || ""} ${currentUserProfile.lastName || ""}`.trim() || currentUserProfile.employeeName,
          employeeId: currentUserProfile.employeeCode || currentUserProfile.id,
          employee_id: currentUserProfile.employeeCode || currentUserProfile.id,
          leaveType: newLeave.leaveType,
          fromDate: newLeave.fromDate,
          toDate: newLeave.toDate,
          totalDays: calculatedDays,
          halfDay: newLeave.halfDay || "Full Day",
          attachment: newLeave.attachment || "",
          reason: newLeave.reason,
          status: "PENDING"
        })
      });
      setNewLeave({ leaveType: "Casual Leave", fromDate: "", toDate: "", halfDay: "Full Day", reason: "", attachment: "" });
      alert(`Leave application submitted successfully for ${calculatedDays} days!`);
      loadDashboardData();
    } catch (err) {
      console.error("Failed to submit leave request:", err);
      alert("Error submitting leave request.");
    }
  };

  const handleLeaveFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append("file", file);
      const url = await uploadEmployeeFile(fd);
      setNewLeave(prev => ({ ...prev, attachment: url }));
      alert("Attachment uploaded successfully!");
    } catch (err) {
      console.error("Attachment upload failed:", err);
      alert("Attachment upload failed.");
    }
  };

  // Submit Regularization Request database integration
  const handleApplyRegularization = async (e) => {
    e.preventDefault();
    if (!newRegularization.date || !newRegularization.reason || !currentUserProfile) {
      alert("Please fill date and reason fields!");
      return;
    }

    try {
      const payload = {
        id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : "reg-" + Math.random().toString(36).substring(2, 15),
        empId: currentUserProfile.employeeCode || currentUserProfile.emp_code || currentUserProfile.id,
        employee: `${currentUserProfile.firstName || ''} ${currentUserProfile.lastName || ''}`.trim() || currentUserProfile.employeeName || "Employee",
        date: newRegularization.date,
        punchType: newRegularization.punchType,
        requestedCheckIn: newRegularization.punchType !== "Check-Out" ? (newRegularization.requestedCheckIn || "09:00:00") : null,
        requestedCheckOut: newRegularization.punchType !== "Check-In" ? (newRegularization.requestedCheckOut || "18:00:00") : null,
        reason: newRegularization.reason,
        status: "Pending",
        remarks: "",
        approvedBy: "",
        attachment: newRegularization.attachment || ""
      };

      await apiFetch("/api/table/attendance_regularization", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      // Write to audit log
      await apiFetch("/api/table/audit_logs", {
        method: "POST",
        body: JSON.stringify({
          userId: currentUserProfile.id,
          username: currentUserProfile.email,
          roleName: "Employee",
          actionType: "Create Regularization",
          moduleName: "Attendance",
          recordId: payload.id,
          previousValues: "None",
          newValues: JSON.stringify(payload),
          httpMethod: "POST",
          apiEndpoint: "/api/table/attendance_regularization",
          requestBody: JSON.stringify(payload),
          ipAddress: "127.0.0.1",
          userAgent: navigator.userAgent,
          browser: "Chrome",
          device: "Desktop PC",
          os: "Windows",
          status: "Success",
          timestamp: new Date().toISOString()
        })
      });

      setNewRegularization({ date: "", punchType: "Check-In", requestedCheckIn: "", requestedCheckOut: "", reason: "", attachment: "" });
      alert("Regularization request submitted successfully!");
      loadDashboardData();
    } catch (err) {
      console.error("Failed to submit regularization request:", err);
      alert("Error submitting regularization request.");
    }
  };

  // Submit Helpdesk Ticket Action database integration
  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    if (!newTicket.subject || !newTicket.description || !currentUserProfile) {
      alert("Please enter subject and description!");
      return;
    }
    try {
      await apiFetch("/api/table/hr_tickets", {
        method: "POST",
        body: JSON.stringify({
          ticketNo: `TKT-${Math.floor(100 + Math.random() * 900)}`,
          empName: currentUserProfile.firstName || currentUserProfile.employeeName,
          category: newTicket.category,
          subject: newTicket.subject,
          priority: "Medium",
          assignedTo: "HR Team",
          status: "Open"
        })
      });
      setNewTicket({ subject: "", category: "IT Support", description: "" });
      alert("Support ticket raised successfully!");
      loadDashboardData();
    } catch (err) {
      console.error("Failed to submit helpdesk ticket:", err);
      alert("Error submitting support ticket.");
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Welcome Bar */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest block mb-1">Employee Command Center</span>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {activeTab === "Dashboard Home" ? (selectedDeptFilter === "All Departments" ? "Company Overview Dashboard" : `${selectedDeptFilter} Department Dashboard`) : activeTab}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-slate-500 text-xs font-semibold">Welcome back, {employeeName}!</span>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-extrabold rounded-full">
              🏢 Department: {departmentName}
            </span>
          </div>
        </div>

        {/* Action Controls matching top right of image */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">
            <ClockIcon className="h-4 w-4 text-indigo-600 animate-spin-slow" />
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>
          <select 
            value={selectedMonthFilter}
            onChange={(e) => setSelectedMonthFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="all">This Year</option>
          </select>
          <select 
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="All Departments">All Departments (Company-wide)</option>
            {companyDepartmentsList
              .filter(d => d !== "All Departments")
              .map(dept => (
                <option key={dept} value={dept}>{dept} Department</option>
              ))}
          </select>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-xs font-extrabold shadow-sm transition"
          >
            <PrinterIcon className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-xs text-slate-500 font-semibold mt-3">Compiling employee workspace data...</span>
        </div>
      ) : (
        <>
          {/* Main Dashboard Home Switcher */}
          {(activeCategory === "EMP_DASHBOARD" || activeTab === "Dashboard Home" || activeTab === "Employee Dashboard") && (
            <div className="space-y-6">
              {/* 2. Top Metric Panel Cards matching mockup */}
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:-translate-y-0.5 transition duration-300">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Total Employees</span>
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><UserIcon className="h-3.5 w-3.5" /></div>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mt-2">{metrics.totalEmp}</h3>
                  <span className="text-[9px] font-bold text-blue-600">All Employees</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:-translate-y-0.5 transition duration-300">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Present Today</span>
                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><ClockIcon className="h-3.5 w-3.5" /></div>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mt-2">{metrics.present}</h3>
                  <span className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-extrabold rounded-md mt-1">
                    {metrics.totalEmp > 0 ? ((metrics.present / metrics.totalEmp) * 100).toFixed(1) : "0.0"}%
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:-translate-y-0.5 transition duration-300">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">On Leave</span>
                    <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg"><CalendarDaysIcon className="h-3.5 w-3.5" /></div>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mt-2">{metrics.onLeave}</h3>
                  <span className="inline-block px-1.5 py-0.5 bg-orange-50 text-orange-700 text-[8px] font-extrabold rounded-md mt-1">
                    {metrics.totalEmp > 0 ? ((metrics.onLeave / metrics.totalEmp) * 100).toFixed(1) : "0.0"}%
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:-translate-y-0.5 transition duration-300">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Absent Today</span>
                    <div className="p-1.5 bg-red-50 text-red-600 rounded-lg"><UserIcon className="h-3.5 w-3.5" /></div>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mt-2">{metrics.absent}</h3>
                  <span className="inline-block px-1.5 py-0.5 bg-red-50 text-red-700 text-[8px] font-extrabold rounded-md mt-1">
                    {metrics.totalEmp > 0 ? ((metrics.absent / metrics.totalEmp) * 100).toFixed(1) : "0.0"}%
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:-translate-y-0.5 transition duration-300">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Late Arrivals</span>
                    <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg"><ClockIcon className="h-3.5 w-3.5" /></div>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mt-2">{metrics.late}</h3>
                  <span className="inline-block px-1.5 py-0.5 bg-purple-50 text-purple-700 text-[8px] font-extrabold rounded-md mt-1">
                    {metrics.totalEmp > 0 ? ((metrics.late / metrics.totalEmp) * 100).toFixed(1) : "0.0"}%
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:-translate-y-0.5 transition duration-300">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Work From Home</span>
                    <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg"><GlobeAltIcon className="h-3.5 w-3.5" /></div>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mt-2">{metrics.wfh}</h3>
                  <span className="inline-block px-1.5 py-0.5 bg-sky-50 text-sky-700 text-[8px] font-extrabold rounded-md mt-1">
                    {metrics.totalEmp > 0 ? ((metrics.wfh / metrics.totalEmp) * 100).toFixed(1) : "0.0"}%
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:-translate-y-0.5 transition duration-300">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Pending Approvals</span>
                    <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><InboxStackIcon className="h-3.5 w-3.5" /></div>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mt-2">{metrics.pending}</h3>
                  <span className="text-[9px] font-bold text-amber-600 cursor-pointer hover:underline">View all</span>
                </div>
              </div>

              {/* 3. Row 1 Grids (Employee, Attendance, Leave, Recruitment Summaries) */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Employee Summary */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                      <UserIcon className="h-4.5 w-4.5 text-blue-600" /> Employee Summary
                    </h4>
                    <span className="text-[9px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Database Records</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
                      <p className="text-lg font-black text-slate-700">{metrics.totalEmp}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Male</p>
                      <p className="text-lg font-black text-slate-700">{metrics.maleCount}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Female</p>
                      <p className="text-lg font-black text-slate-700">{metrics.femaleCount}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Active</p>
                      <p className="text-lg font-black text-emerald-600">{metrics.activeCount}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Permanent</p>
                      <p className="text-lg font-black text-slate-700">{metrics.permanentCount}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Contract</p>
                      <p className="text-lg font-black text-slate-700">{metrics.contractCount}</p>
                    </div>
                  </div>
                </div>

                {/* Attendance Summary Donut */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                      <ClockIcon className="h-4.5 w-4.5 text-blue-600" /> Attendance Summary
                    </h4>
                    <span className="text-[9px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Live Telemetry</span>
                  </div>
                  <div className="flex items-center gap-5">
                    {/* SVG Donut Chart */}
                    <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.91" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                        <circle 
                          cx="18" 
                          cy="18" 
                          r="15.91" 
                          fill="none" 
                          stroke="#10b981" 
                          strokeWidth="3" 
                          strokeDasharray={`${metrics.totalEmp > 0 ? (metrics.present / metrics.totalEmp) * 100 : 0} ${metrics.totalEmp > 0 ? 100 - (metrics.present / metrics.totalEmp) * 100 : 100}`} 
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-sm font-black text-slate-800">
                          {metrics.totalEmp > 0 ? ((metrics.present / metrics.totalEmp) * 100).toFixed(0) : "0"}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5 w-full">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-500">Present</span>
                        <span className="text-slate-800">{metrics.present}</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-500">Absent</span>
                        <span className="text-red-600">{metrics.absent}</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-500">Late</span>
                        <span className="text-purple-600">{metrics.late}</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-500">WFH</span>
                        <span className="text-sky-600">{metrics.wfh}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Leave Summary */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                      <CalendarDaysIcon className="h-4.5 w-4.5 text-blue-600" /> Leave Summary
                    </h4>
                    <span className="text-[9px] font-extrabold bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">Leave Management</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
                      <span className="text-xs font-bold text-slate-500">Total Balance</span>
                      <span className="text-sm font-black text-slate-800">{metrics.totalLeaveBalance} Days</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
                      <span className="text-sm font-bold text-slate-500">Leave Taken</span>
                      <span className="text-sm font-black text-blue-600">{metrics.leaveTaken} Days</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
                      <span className="text-xs font-bold text-slate-500">Pending Requests</span>
                      <span className="text-sm font-black text-orange-600">{metrics.pendingLeaveDays} Days</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
                      <span className="text-xs font-bold text-slate-500">Currently On Leave</span>
                      <span className="text-sm font-black text-red-600">{metrics.onLeave} Staff</span>
                    </div>
                  </div>
                </div>

                {/* Recruitment Summary */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                      <BriefcaseIcon className="h-4.5 w-4.5 text-blue-600" /> Recruitment Summary
                    </h4>
                    <span className="text-[9px] font-extrabold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">Recruitment</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-500">Open Vacancies</span>
                      <span className="text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded">{metrics.openVacancies} Roles</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-500">Interviews Today</span>
                      <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{metrics.interviewsToday} Candidates</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-500">Shortlisted Staff</span>
                      <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{metrics.shortlistedStaff} Candidates</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-500">Offers Released</span>
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{metrics.offersReleased} Offers</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Row 2 Grids (Employee Distribution, Attendance Trend, Leave Trend) */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Employee Distribution Bar Chart */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm xl:col-span-1 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                      <PresentationChartBarIcon className="h-4.5 w-4.5 text-blue-600" /> Department Distribution
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400">{allEmployeesList.length} Total Employees</span>
                  </div>
                  <div className="h-56 flex items-end justify-between gap-2 pt-6 px-2">
                    {metrics.barData.map((bar, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-2 w-full" title={`${bar.fullLabel}: ${bar.value} employees`}>
                        <span className="text-[9px] font-black text-slate-600">{bar.value}</span>
                        <div style={{ height: bar.height }} className={`w-7 ${bar.color} rounded-t-md transition-all duration-500 hover:opacity-85 cursor-pointer shadow-xs`} />
                        <span className="text-[9px] font-bold text-slate-500 truncate max-w-[50px] text-center">{bar.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Attendance Trend Line Graph */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm xl:col-span-1 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                      <ClockIcon className="h-4.5 w-4.5 text-blue-600" /> Attendance Trend
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400">Past 5 Days</span>
                  </div>
                  <div className="h-56 relative pt-4">
                    {/* Dynamic SVG Line Graph */}
                    <svg className="w-full h-40" viewBox="0 0 100 40" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path 
                        d={`M 0 ${35 - (metrics.trendDays[0]?.attRate || 0) * 0.3} L 25 ${35 - (metrics.trendDays[1]?.attRate || 0) * 0.3} L 50 ${35 - (metrics.trendDays[2]?.attRate || 0) * 0.3} L 75 ${35 - (metrics.trendDays[3]?.attRate || 0) * 0.3} L 100 ${35 - (metrics.trendDays[4]?.attRate || 0) * 0.3}`} 
                        fill="none" 
                        stroke="#2563eb" 
                        strokeWidth="1.5" 
                      />
                      <path 
                        d={`M 0 ${35 - (metrics.trendDays[0]?.attRate || 0) * 0.3} L 25 ${35 - (metrics.trendDays[1]?.attRate || 0) * 0.3} L 50 ${35 - (metrics.trendDays[2]?.attRate || 0) * 0.3} L 75 ${35 - (metrics.trendDays[3]?.attRate || 0) * 0.3} L 100 ${35 - (metrics.trendDays[4]?.attRate || 0) * 0.3} L 100 40 L 0 40 Z`} 
                        fill="url(#attendGrad)" 
                      />
                      {metrics.trendDays.map((t, i) => (
                        <circle key={i} cx={i * 25} cy={35 - (t.attRate || 0) * 0.3} r="1.5" fill="#2563eb" />
                      ))}
                    </svg>
                    <div className="flex justify-between text-[8px] font-extrabold text-slate-400 px-1 mt-2">
                      {metrics.trendDays.map((t, idx) => (
                        <span key={idx}>{t.dayLabel} ({t.attRate}%)</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Leave Trend Line Graph */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm xl:col-span-1 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                      <CalendarDaysIcon className="h-4.5 w-4.5 text-blue-600" /> Leave Trend
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400">Past 5 Days</span>
                  </div>
                  <div className="h-56 relative pt-4">
                    {/* Dynamic SVG Line Graph */}
                    <svg className="w-full h-40" viewBox="0 0 100 40" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="leaveGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path 
                        d={`M 0 ${35 - Math.min(25, (metrics.trendDays[0]?.dayLeaves || 0) * 5)} L 25 ${35 - Math.min(25, (metrics.trendDays[1]?.dayLeaves || 0) * 5)} L 50 ${35 - Math.min(25, (metrics.trendDays[2]?.dayLeaves || 0) * 5)} L 75 ${35 - Math.min(25, (metrics.trendDays[3]?.dayLeaves || 0) * 5)} L 100 ${35 - Math.min(25, (metrics.trendDays[4]?.dayLeaves || 0) * 5)}`} 
                        fill="none" 
                        stroke="#10b981" 
                        strokeWidth="1.5" 
                      />
                      <path 
                        d={`M 0 ${35 - Math.min(25, (metrics.trendDays[0]?.dayLeaves || 0) * 5)} L 25 ${35 - Math.min(25, (metrics.trendDays[1]?.dayLeaves || 0) * 5)} L 50 ${35 - Math.min(25, (metrics.trendDays[2]?.dayLeaves || 0) * 5)} L 75 ${35 - Math.min(25, (metrics.trendDays[3]?.dayLeaves || 0) * 5)} L 100 ${35 - Math.min(25, (metrics.trendDays[4]?.dayLeaves || 0) * 5)} L 100 40 L 0 40 Z`} 
                        fill="url(#leaveGrad)" 
                      />
                      {metrics.trendDays.map((t, i) => (
                        <circle key={i} cx={i * 25} cy={35 - Math.min(25, (t.dayLeaves || 0) * 5)} r="1.5" fill="#10b981" />
                      ))}
                    </svg>
                    <div className="flex justify-between text-[8px] font-extrabold text-slate-400 px-1 mt-2">
                      {metrics.trendDays.map((t, idx) => (
                        <span key={idx}>{t.dayLabel} ({t.dayLeaves})</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Row 3 Grids (Gender, Employment Type, Performance, Helpdesk) */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Gender Distribution */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 pb-2 border-b border-slate-100">Gender Distribution</h4>
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.91" fill="none" stroke="#f87171" strokeWidth="4" />
                        <circle 
                          cx="18" 
                          cy="18" 
                          r="15.91" 
                          fill="none" 
                          stroke="#3b82f6" 
                          strokeWidth="4" 
                          strokeDasharray={`${metrics.totalEmp > 0 ? ((metrics.maleCount / metrics.totalEmp) * 100).toFixed(1) : 100} ${metrics.totalEmp > 0 ? (100 - (metrics.maleCount / metrics.totalEmp) * 100).toFixed(1) : 0}`} 
                        />
                      </svg>
                      <span className="absolute text-xs font-black text-slate-700">
                        {metrics.totalEmp > 0 ? `${((metrics.maleCount / metrics.totalEmp) * 100).toFixed(0)}%` : "0%"}
                      </span>
                    </div>
                    <div className="space-y-1 w-full text-[11px] font-bold">
                      <div className="flex justify-between text-blue-600">
                        <span>Male</span>
                        <span>{metrics.maleCount}</span>
                      </div>
                      <div className="flex justify-between text-red-500">
                        <span>Female</span>
                        <span>{metrics.femaleCount}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employment Type */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 pb-2 border-b border-slate-100">Employment Type</h4>
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.91" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                        <circle 
                          cx="18" 
                          cy="18" 
                          r="15.91" 
                          fill="none" 
                          stroke="#3b82f6" 
                          strokeWidth="4" 
                          strokeDasharray={`${metrics.totalEmp > 0 ? ((metrics.permanentCount / metrics.totalEmp) * 100).toFixed(1) : 100} ${metrics.totalEmp > 0 ? (100 - (metrics.permanentCount / metrics.totalEmp) * 100).toFixed(1) : 0}`} 
                        />
                      </svg>
                      <span className="absolute text-xs font-black text-slate-700">
                        {metrics.totalEmp > 0 ? `${((metrics.permanentCount / metrics.totalEmp) * 100).toFixed(0)}%` : "0%"}
                      </span>
                    </div>
                    <div className="space-y-1 w-full text-[11px] font-bold">
                      <div className="flex justify-between text-blue-600">
                        <span>Permanent</span>
                        <span>{metrics.permanentCount}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Contract</span>
                        <span>{metrics.contractCount}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Overview */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 pb-2 border-b border-slate-100">Performance Overview</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-3xl font-black text-indigo-600">{metrics.avgRating}</h3>
                      <div className="flex text-amber-400 mt-1">
                        {"★".repeat(metrics.stars)}{"☆".repeat(Math.max(0, 5 - metrics.stars))}
                      </div>
                    </div>
                    <div className="text-[11px] font-bold text-slate-500 space-y-1 text-right">
                      <p>Average KPI: <span className="text-slate-800">{metrics.avgKpi}</span></p>
                      <p>Top Performers: <span className="text-slate-800">{metrics.topPerformers}</span></p>
                      <p>Active Staff: <span className="text-slate-800">{metrics.activeCount}</span></p>
                    </div>
                  </div>
                </div>

                {/* Helpdesk Summary */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 pb-2 border-b border-slate-100">Helpdesk Summary</h4>
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.91" fill="none" stroke="#22c55e" strokeWidth="4" />
                        <circle 
                          cx="18" 
                          cy="18" 
                          r="15.91" 
                          fill="none" 
                          stroke="#3b82f6" 
                          strokeWidth="4" 
                          strokeDasharray={`${metrics.totalTickets > 0 ? ((metrics.openTickets / metrics.totalTickets) * 100).toFixed(1) : 0} ${metrics.totalTickets > 0 ? (100 - (metrics.openTickets / metrics.totalTickets) * 100).toFixed(1) : 100}`} 
                        />
                      </svg>
                      <span className="absolute text-sm font-black text-slate-800">{metrics.openTickets}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-bold text-slate-500 w-full">
                      <p className="text-blue-600">Open: {metrics.openTickets}</p>
                      <p className="text-amber-500">In Prog: {metrics.inProgTickets}</p>
                      <p className="text-emerald-500">Resolved: {metrics.resolvedTickets}</p>
                      <p className="text-slate-400">Closed: {metrics.closedTickets}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Row 4 Grids (Pending Approvals, Recent Activities, Upcoming Events) */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Pending Approvals Widget */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 pb-2 border-b border-slate-100">Pending Approvals</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-center">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase">Leave</p>
                      <p className="text-2xl font-black text-emerald-700 mt-1">{metrics.pendingLeavesCount}</p>
                    </div>
                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-center">
                      <p className="text-[10px] font-bold text-blue-600 uppercase">Attendance</p>
                      <p className="text-2xl font-black text-blue-700 mt-1">{metrics.pendingRegCount}</p>
                    </div>
                    <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-center">
                      <p className="text-[10px] font-bold text-purple-600 uppercase">Support</p>
                      <p className="text-2xl font-black text-purple-700 mt-1">{metrics.openTickets}</p>
                    </div>
                  </div>
                </div>

                {/* Recent Activities List */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 pb-2 border-b border-slate-100">Recent Activities</h4>
                  <div className="space-y-3.5">
                    {metrics.recentActivities.length === 0 ? (
                      <p className="text-xs text-slate-400 font-semibold py-4 text-center">No recent activity logs recorded yet.</p>
                    ) : (
                      metrics.recentActivities.map((act, idx) => (
                        <div key={idx} className="flex gap-3 items-start">
                          <div className={`w-2 h-2 rounded-full ${act.color || 'bg-blue-600'} mt-1.5 shrink-0`} />
                          <div>
                            <p className="text-xs font-bold text-slate-700">{act.text}</p>
                            <p className="text-[9px] font-semibold text-slate-400 mt-0.5">{act.date}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Upcoming Events Calendar */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 pb-2 border-b border-slate-100">Upcoming Events & Holidays</h4>
                  <div className="space-y-3">
                    {metrics.upcomingEvents.length === 0 ? (
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-400 font-semibold">
                        No upcoming holiday events scheduled.
                      </div>
                    ) : (
                      metrics.upcomingEvents.map((evt, idx) => (
                        <div key={idx} className="flex gap-3 items-center p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                          <CalendarDaysIcon className="h-7 w-7 text-indigo-600 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-slate-700">{evt.title}</p>
                            <p className="text-[9px] font-semibold text-slate-400">{evt.date} • {evt.type}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7. Category Switcher for Portal Sub-views */}

          {/* EMPLOYEE MANAGEMENT SECTION */}
          {(activeCategory === "EMPLOYEE_MGMT" || activeCategory === "EMP_PROFILE") && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              {/* Header */}
              {activeCategory !== "EMP_PROFILE" && (
                <div className="flex flex-col sm:flex-row items-center gap-5 border-b pb-5 border-slate-100">
                  {profileDetails.photo ? (
                    <img src={profileDetails.photo} alt="Avatar" className="w-16 h-16 rounded-full border border-indigo-200 object-cover shadow-xs" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-xl uppercase border-2 border-indigo-50">
                      {profileDetails.firstName?.[0] || employeeName[0] || ""}{profileDetails.lastName?.[0] || ""}
                    </div>
                  )}
                  <div className="text-center sm:text-left space-y-1">
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      {profileDetails.firstName || profileDetails.first_name || ""} {profileDetails.lastName || profileDetails.last_name || ""}
                    </h3>
                    <p className="text-xs text-indigo-600 font-bold">{profileDetails.designation || "Staff Professional"} • {profileDetails.department || "Operations"}</p>
                    <div className="flex items-center justify-center sm:justify-start gap-1 font-mono text-[10px] text-slate-400">
                      <span>Emp ID: #{profileDetails.employeeId || profileDetails.id?.slice(0, 8)}</span>
                      <span>|</span>
                      <span>Code: {profileDetails.employeeCode || profileDetails.emp_code || profileDetails.employee_code || "--"}</span>
                    </div>
                  </div>
                </div>
              )}

              {(activeTab === "Employee Profile" || activeTab === "Fill Details" || activeCategory === "EMP_PROFILE") && (
                <div className="space-y-6 w-full">
                  {canManageEmployees && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="flex flex-col w-full sm:w-80">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Select Employee to Manage Profile:</span>
                        <select
                          value={selectedEmployeeId || ""}
                          onChange={(e) => setSelectedEmployeeId(e.target.value)}
                          className="mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- Choose Employee --</option>
                          {allEmployeesList.map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.employeeName || emp.employee_name || 'Unnamed'} ({emp.email})
                            </option>
                          ))}
                        </select>
                      </div>
                      {selectedEmployeeId && (
                        <div className="text-right text-xs text-slate-400 font-mono font-bold">
                          Selected ID: #{selectedEmployeeId}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left Side: 17 Tabs Sidebar Checklist */}
                  <div className="w-full lg:w-64 bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1 shrink-0 max-h-[80vh] overflow-y-auto">
                    <p className="text-[10px] font-black uppercase text-slate-400 px-3 pb-2 border-b mb-2">Profile Sections</p>
                    {profileSectionsList.map((t, idx) => {
                      const isActive = profileTab === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleTabClick(t)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition ${
                            isActive
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                              : "text-slate-600 hover:bg-slate-200/50"
                          }`}
                        >
                          {idx + 1}. {t.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Side: Tab specific input forms */}
                  <form 
                    onSubmit={handleSaveProfile} 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                        e.preventDefault();
                      }
                    }}
                    className="flex-1 bg-slate-50/30 border border-slate-200 p-6 rounded-2xl space-y-6 flex flex-col justify-between profile-form-container"
                  >
                    <style>{`
                      .profile-form-container input,
                      .profile-form-container select,
                      .profile-form-container textarea {
                        color: #0f172a !important;
                      }
                    `}</style>
                    <div className="space-y-6">
                      {profileTab === "Basic Information" && (
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                            <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider flex items-center gap-2">
                              <span>👤</span> Basic Information
                            </h4>
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full shadow-2xs">
                              <span>🛡️</span> Prefilled by Admin / Department Head
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Employee Photo URL</label>
                              <input
                                type="text"
                                placeholder="https://imageUrl.jpg"
                                value={employeeForm.photo || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, photo: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold font-mono mb-2"
                              />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;
                                  const fd = new FormData();
                                  fd.append("file", file);
                                  fd.append("employeeName", employeeName);
                                  fd.append("employeeId", employeeForm.employeeId || employeeForm.id);
                                  try {
                                    const url = await uploadEmployeeFile(fd);
                                    if (url) {
                                      setEmployeeForm(prev => ({ ...prev, photo: url }));
                                      alert("Photo uploaded successfully!");
                                    }
                                  } catch (err) {
                                    alert("Upload failed: " + err.message);
                                  }
                                }}
                                className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                              />
                              {employeeForm.photo && (
                                <img src={employeeForm.photo} alt="Preview" className="w-12 h-12 rounded-full border border-slate-200 mt-2 object-cover shadow-2xs" />
                              )}
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Employee ID (Auto)</label>
                              <input
                                type="text"
                                placeholder="Auto-generated upon registration"
                                value={employeeForm.employeeId || ""}
                                readOnly
                                className="w-full text-xs bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-500 font-bold cursor-not-allowed"
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Employee Code *</label>
                                {!canManageEmployees && <span className="text-[9px] font-bold text-slate-400">Assigned by Admin</span>}
                              </div>
                              <input
                                type="text"
                                placeholder="e.g. EMP-101"
                                value={employeeForm.employeeCode || ""}
                                readOnly={!canManageEmployees}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, employeeCode: e.target.value })}
                                className={`w-full text-xs border border-slate-200 rounded-xl px-3 py-2 font-bold ${
                                  !canManageEmployees ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500'
                                }`}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">First Name *</label>
                              <input
                                id="firstNameInput"
                                type="text"
                                required
                                placeholder="Enter first name"
                                value={employeeForm.firstName || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, firstName: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Middle Name</label>
                              <input
                                type="text"
                                placeholder="Enter middle name"
                                value={employeeForm.middleName || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, middleName: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Last Name</label>
                              <input
                                type="text"
                                placeholder="Enter last name"
                                value={employeeForm.lastName || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, lastName: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Gender</label>
                              <select
                                value={employeeForm.gender || "Male"}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, gender: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Date of Birth</label>
                              <input
                                type="date"
                                value={employeeForm.dateOfBirth || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, dateOfBirth: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Marital Status</label>
                              <select
                                value={employeeForm.maritalStatus || "Single"}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, maritalStatus: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              >
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Divorced">Divorced</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Blood Group</label>
                              <input
                                type="text"
                                placeholder="e.g. O+"
                                value={employeeForm.bloodGroup || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, bloodGroup: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Nationality</label>
                              <input
                                type="text"
                                value={employeeForm.nationality || ""} placeholder="e.g. Indian"
                                onChange={(e) => setEmployeeForm({ ...employeeForm, nationality: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {profileTab === "Official Information" && (
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                            <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider flex items-center gap-2">
                              <span>🏢</span> Official Information
                            </h4>
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full shadow-2xs">
                              <span>🛡️</span> Prefilled & Managed by Admin / Dept Head
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Company</label>
                              <input
                                type="text"
                                value={employeeForm.company || ""} placeholder="e.g. TechnoVani Pvt Ltd"
                                readOnly={!canManageEmployees}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, company: e.target.value })}
                                className={`w-full text-xs border border-slate-200 rounded-xl px-3 py-2 font-bold ${
                                  !canManageEmployees ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500'
                                }`}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Branch</label>
                              <input
                                type="text"
                                value={employeeForm.branch || ""} placeholder="e.g. Headquarters / Mumbai"
                                readOnly={!canManageEmployees}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, branch: e.target.value })}
                                className={`w-full text-xs border border-slate-200 rounded-xl px-3 py-2 font-bold ${
                                  !canManageEmployees ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500'
                                }`}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Department</label>
                              <input
                                type="text"
                                value={employeeForm.department || ""} placeholder="e.g. Human Resources"
                                readOnly={!canManageEmployees}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                                className={`w-full text-xs border border-slate-200 rounded-xl px-3 py-2 font-bold ${
                                  !canManageEmployees ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500'
                                }`}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Designation</label>
                              <input
                                type="text"
                                value={employeeForm.designation || ""} placeholder="e.g. Senior Software Engineer"
                                readOnly={!canManageEmployees}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, designation: e.target.value })}
                                className={`w-full text-xs border border-slate-200 rounded-xl px-3 py-2 font-bold ${
                                  !canManageEmployees ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500'
                                }`}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Employment Type</label>
                              <select
                                value={employeeForm.employeeType || currentUserProfile?.employeeType || "Full-Time"}
                                disabled={!canManageEmployees}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, employeeType: e.target.value })}
                                className={`w-full text-xs border border-slate-200 rounded-xl px-3 py-2 font-bold ${
                                  !canManageEmployees ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500'
                                }`}
                              >
                                <option value="Full-Time">Full-Time</option>
                                <option value="Part-Time">Part-Time</option>
                                <option value="Contract">Contract</option>
                                <option value="Intern">Intern</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Official Email</label>
                              <input
                                type="email"
                                value={employeeForm.officialEmail || ""} placeholder="e.g. employee@company.com"
                                readOnly={!canManageEmployees}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, officialEmail: e.target.value })}
                                className={`w-full text-xs border border-slate-200 rounded-xl px-3 py-2 font-bold font-mono ${
                                  !canManageEmployees ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500'
                                }`}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Date of Joining</label>
                              <input
                                type="date"
                                value={employeeForm.dateOfJoining || ""}
                                readOnly={!canManageEmployees}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, dateOfJoining: e.target.value })}
                                className={`w-full text-xs border border-slate-200 rounded-xl px-3 py-2 font-bold ${
                                  !canManageEmployees ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {profileTab === "Contact Information" && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-200">
                            📞 Contact Details
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Mobile Number *</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. +91 98765 43210"
                                value={employeeForm.mobileNumber || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, mobileNumber: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Alternate Mobile</label>
                              <input
                                type="text"
                                placeholder="e.g. +91 98765 43211"
                                value={employeeForm.alternateMobile || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, alternateMobile: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Personal Email</label>
                              <input
                                type="email"
                                placeholder="e.g. employee.personal@gmail.com"
                                value={employeeForm.personalEmail || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, personalEmail: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold font-mono"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Current Address</label>
                              <textarea
                                rows="2"
                                value={employeeForm.currentAddress || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, currentAddress: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              ></textarea>
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Permanent Address</label>
                              <textarea
                                rows="2"
                                value={employeeForm.permanentAddress || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, permanentAddress: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              ></textarea>
                            </div>
                          </div>
                        </div>
                      )}

                      {profileTab === "Education" && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-200">
                            🎓 Education
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Highest Degree</label>
                              <input
                                type="text"
                                value={employeeForm.highestDegree || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, highestDegree: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Specialization</label>
                              <input
                                type="text"
                                value={employeeForm.specialization || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, specialization: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">University Name</label>
                              <input
                                type="text"
                                value={employeeForm.university || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, university: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {profileTab === "Experience" && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-200">
                            💼 Experience
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Previous Company Name</label>
                              <input
                                type="text"
                                value={employeeForm.prevCompany || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, prevCompany: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Last Held Designation</label>
                              <input
                                type="text"
                                value={employeeForm.prevDesignation || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, prevDesignation: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {profileTab === "Documents" && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-200">
                            📂 Upload Documents
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                              "Aadhar Card",
                              "PAN Card",
                              "10th Marksheet",
                              "12th Marksheet",
                              "Degree Certificate",
                              "Experience Letter",
                              "Resume"
                            ].map((docType) => {
                              const val = (employeeForm.documents || {})[docType] || "";
                              return (
                                <div key={docType} className="border border-slate-100 p-4 rounded-xl bg-slate-50/40 space-y-3 flex flex-col justify-between font-bold">
                                  <div>
                                    <span className="text-[9px] font-black uppercase text-slate-400 block">{docType}</span>
                                    <span className="text-xs text-slate-700 block mt-0.5 truncate max-w-[200px] font-mono">{val || "Not uploaded (Pending)"}</span>
                                  </div>
                                  <div className="flex gap-2 items-center justify-between mt-2">
                                    <input
                                      type="file"
                                      onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        const fd = new FormData();
                                        fd.append("file", file);
                                        fd.append("employeeName", employeeName);
                                        fd.append("employeeId", employeeForm.employeeId || employeeForm.id);
                                        try {
                                          const url = await uploadEmployeeFile(fd);
                                          if (url) {
                                            setEmployeeForm(prev => ({
                                              ...prev,
                                              documents: {
                                                ...(prev.documents || {}),
                                                [docType]: url
                                              }
                                            }));
                                            alert(`${docType} uploaded successfully!`);
                                          }
                                        } catch (err) {
                                          alert("Upload failed: " + err.message);
                                        }
                                      }}
                                      className="text-[9px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[9px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                                    />
                                    {val && (
                                      <a
                                        href={val}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[9px] font-black tracking-wide whitespace-nowrap"
                                      >
                                        Open Link
                                      </a>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      </div>

                    {isNewRegistration && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-2xs">
                        <span>✨ <b>New Registration Mode</b>: Form fields are cleared for a new employee entry.</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewRegistration(false);
                            if (profileDetails && Object.keys(profileDetails).length > 0) {
                              setEmployeeForm({
                                ...getEmptyEmployeeForm(),
                                ...profileDetails,
                                documents: profileDetails.documents || {},
                                assets: profileDetails.assets || []
                              });
                            }
                          }}
                          className="px-3 py-1 bg-white border border-amber-300 rounded-lg text-amber-800 text-[11px] font-extrabold hover:bg-amber-100 transition"
                        >
                          🔄 Load Saved Profile
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 border-t border-slate-100 mt-6">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {hasPrev && (
                          <button
                            type="button"
                            onClick={() => handleTabClick(profileSectionsList[currentSectionIdx - 1])}
                            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-2xs"
                          >
                            ← Previous Section
                          </button>
                        )}
                        {hasNext && (
                          <button
                            type="button"
                            onClick={() => handleTabClick(profileSectionsList[currentSectionIdx + 1])}
                            className="px-3.5 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-2xs"
                          >
                            Next Section →
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                        {isNewRegistration && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsNewRegistration(false);
                              if (profileDetails && Object.keys(profileDetails).length > 0) {
                                setEmployeeForm({
                                  ...getEmptyEmployeeForm(),
                                  ...profileDetails,
                                  documents: profileDetails.documents || {},
                                  assets: profileDetails.assets || []
                                });
                              }
                            }}
                            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition flex items-center gap-1"
                          >
                            🔄 Load Profile
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewRegistration(true);
                            setEmployeeForm(getEmptyEmployeeForm());
                            setProfileTab("Basic Information");
                            alert("Form reset! Sabhi fields khali ho gayi hain. Kripya '1. Basic Information' se shuru karein.");
                          }}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                        >
                          + Reset for New Registration
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition"
                        >
                          Submit & Register
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}

              {/* Tab 2: Documents */}
              {(activeTab === "Documents" || activeTab === "Document Log") && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider border-b pb-2 border-slate-100">
                    📂 Uploaded Profile Documents
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      "Aadhar Card",
                      "PAN Card",
                      "10th Marksheet",
                      "12th Marksheet",
                      "Degree Certificate",
                      "Experience Letter",
                      "Resume"
                    ].map((docType) => {
                      const val = (employeeForm.documents || {})[docType] || "";
                      return (
                        <div key={docType} className="border border-slate-100 p-4 rounded-xl bg-slate-50/40 space-y-3 flex flex-col justify-between font-bold">
                          <div>
                            <span className="text-[9px] font-black uppercase text-slate-400 block">{docType}</span>
                            <span className="text-xs text-slate-700 block mt-0.5 truncate max-w-[200px] font-mono">{val || "Not uploaded (Pending)"}</span>
                          </div>
                          <div className="flex gap-2 items-center justify-between mt-2">
                            <input
                              type="file"
                              onChange={async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                const fd = new FormData();
                                fd.append("file", file);
                                fd.append("employeeName", employeeName);
                                fd.append("employeeId", employeeForm.employeeId || employeeForm.id);
                                try {
                                  const url = await uploadEmployeeFile(fd);
                                  if (url) {
                                    setEmployeeForm(prev => ({
                                      ...prev,
                                      documents: {
                                        ...(prev.documents || {}),
                                        [docType]: url
                                      }
                                    }));
                                    alert(`${docType} uploaded successfully!`);
                                  }
                                } catch (err) {
                                  alert("Upload failed: " + err.message);
                                }
                              }}
                              className="text-[9px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[9px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                            />
                            {val && (
                              <a
                                href={val}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[9px] font-black tracking-wide whitespace-nowrap"
                              >
                                Open Link
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 3: Assets */}
              {(activeTab === "Assets" || activeTab === "Asset Allocation") && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider border-b pb-2 border-slate-100">
                    💻 Company Hardware Allocations
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-bold text-slate-600">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px]">
                          <th className="py-2.5">Asset Type</th>
                          <th>Asset Code</th>
                          <th>Asset Name</th>
                          <th>Serial Number</th>
                          <th>Assigned Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-bold text-slate-600">
                        {assets.map((ast, idx) => {
                          const isExpanded = expandedAssetId === ast.id;
                          const hasSpecs = ast.processor || ast.operatingSystem || ast.graphicsCard || ast.memory || ast.storage || ast.display || ast.color;
                          return (
                            <React.Fragment key={ast.id || idx}>
                              <tr 
                                onClick={() => hasSpecs && setExpandedAssetId(isExpanded ? null : ast.id)}
                                className={`hover:bg-slate-50/50 transition ${hasSpecs ? 'cursor-pointer' : ''} ${isExpanded ? 'bg-slate-50/80' : ''}`}
                              >
                                <td className="py-3 text-slate-900">
                                  <span className="flex items-center gap-1.5">
                                    <span>{ast.assetCategory || ast.assetType}</span>
                                    {hasSpecs && (
                                      <span className="text-[8px] text-indigo-600 font-black bg-indigo-50 px-1 py-0.5 rounded border border-indigo-100 uppercase tracking-wider scale-95 origin-left">
                                        Specs
                                      </span>
                                    )}
                                  </span>
                                </td>
                                <td>{ast.assetCode}</td>
                                <td>{ast.assetName}</td>
                                <td className="font-mono text-slate-500">{ast.serialNumber}</td>
                                <td>{ast.assignedDate}</td>
                                <td>
                                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[9px] font-extrabold uppercase tracking-wide border border-emerald-200">
                                    {ast.status || "Assigned"}
                                  </span>
                                </td>
                              </tr>
                              {isExpanded && hasSpecs && (
                                <tr>
                                  <td colSpan={6} className="bg-slate-50/30 p-3.5 border-b border-slate-100">
                                    <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-sm grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-xs font-bold text-slate-600 animate-fadeIn">
                                      {ast.processor && (
                                        <div className="space-y-0.5">
                                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Processor</span>
                                          <span className="text-slate-800 font-extrabold">{ast.processor}</span>
                                        </div>
                                      )}
                                      {ast.operatingSystem && (
                                        <div className="space-y-0.5">
                                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Operating System</span>
                                          <span className="text-slate-800 font-extrabold">{ast.operatingSystem}</span>
                                        </div>
                                      )}
                                      {ast.graphicsCard && (
                                        <div className="space-y-0.5">
                                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Graphics Card</span>
                                          <span className="text-slate-800 font-extrabold">{ast.graphicsCard}</span>
                                        </div>
                                      )}
                                      {ast.memory && (
                                        <div className="space-y-0.5">
                                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Memory</span>
                                          <span className="text-slate-800 font-extrabold">{ast.memory}</span>
                                        </div>
                                      )}
                                      {ast.storage && (
                                        <div className="space-y-0.5">
                                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Storage</span>
                                          <span className="text-slate-800 font-extrabold">{ast.storage}</span>
                                        </div>
                                      )}
                                      {ast.display && (
                                        <div className="space-y-0.5">
                                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Display</span>
                                          <span className="text-slate-800 font-extrabold">{ast.display}</span>
                                        </div>
                                      )}
                                      {ast.color && (
                                        <div className="space-y-0.5">
                                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Color</span>
                                          <span className="text-slate-800 font-extrabold">{ast.color}</span>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                        {assets.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-6 text-slate-400 font-medium">No company assets assigned to your profile yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 4: Bank Details */}
              {activeTab === "Bank Details" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider border-b pb-2 border-slate-100">
                    🏦 Bank Register & Payroll configuration
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-bold text-slate-600">
                    <div className="border p-3.5 rounded-xl bg-slate-50/30">
                      <span className="text-[9px] text-slate-400 block uppercase">Bank Name</span>
                      <span className="text-slate-800 font-black mt-0.5 block">{profileDetails.bankName || "--"}</span>
                    </div>
                    <div className="border p-3.5 rounded-xl bg-slate-50/30">
                      <span className="text-[9px] text-slate-400 block uppercase">Account Holder</span>
                      <span className="text-slate-800 font-black mt-0.5 block">{profileDetails.accountHolderName || "--"}</span>
                    </div>
                    <div className="border p-3.5 rounded-xl bg-slate-50/30">
                      <span className="text-[9px] text-slate-400 block uppercase">Account Number</span>
                      <span className="text-slate-800 font-black mt-0.5 block font-mono">{profileDetails.accountNumber || "--"}</span>
                    </div>
                    <div className="border p-3.5 rounded-xl bg-slate-50/30">
                      <span className="text-[9px] text-slate-400 block uppercase">IFSC Code</span>
                      <span className="text-slate-800 font-black mt-0.5 block font-mono">{profileDetails.ifscCode || "--"}</span>
                    </div>
                    <div className="border p-3.5 rounded-xl bg-slate-50/30">
                      <span className="text-[9px] text-slate-400 block uppercase">Basic Salary ($)</span>
                      <span className="text-slate-800 font-black mt-0.5 block">₹{Number(profileDetails.basicSalary || 0).toLocaleString()}</span>
                    </div>
                    <div className="border p-3.5 rounded-xl bg-slate-50/30">
                      <span className="text-[9px] text-slate-400 block uppercase">Gross Salary ($)</span>
                      <span className="text-slate-800 font-black mt-0.5 block">₹{Number(profileDetails.grossSalary || 0).toLocaleString()}</span>
                    </div>
                    <div className="border p-3.5 rounded-xl bg-slate-50/30">
                      <span className="text-[9px] text-slate-400 block uppercase">Annual CTC ($)</span>
                      <span className="text-slate-800 font-black mt-0.5 block">₹{Number(profileDetails.ctc || 0).toLocaleString()}</span>
                    </div>
                    <div className="border p-3.5 rounded-xl bg-slate-50/30">
                      <span className="text-[9px] text-slate-400 block uppercase">PF Deduction status</span>
                      <span className="text-slate-800 font-black mt-0.5 block">{profileDetails.pfApplicable ? "Yes (Applicable)" : "No"}</span>
                    </div>
                    <div className="border p-3.5 rounded-xl bg-slate-50/30">
                      <span className="text-[9px] text-slate-400 block uppercase">ESI Contribution status</span>
                      <span className="text-slate-800 font-black mt-0.5 block">{profileDetails.esiApplicable ? "Yes (Applicable)" : "No"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Salary Details */}
              {(activeTab === "Salary Details" || activeTab === "Salary Structure") && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider border-b pb-2 border-slate-100">
                    💵 Generated Payroll Payslips
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-bold text-slate-600">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px]">
                          <th className="py-2.5">Month</th>
                          <th>Basic Salary</th>
                          <th>HRA</th>
                          <th>Special Allowance</th>
                          <th>PF Deduction</th>
                          <th>Net Payout</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-bold text-slate-600">
                        {payslips.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="py-6 text-center text-xs text-slate-400 font-semibold">
                              No payslip records generated yet.
                            </td>
                          </tr>
                        ) : (
                          payslips.map((ps, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition">
                              <td className="py-3 text-slate-800 font-extrabold">{ps.month}</td>
                              <td>₹{ps.basic.toLocaleString()}</td>
                              <td>₹{ps.hra.toLocaleString()}</td>
                              <td>₹{ps.special.toLocaleString()}</td>
                              <td className="text-red-500">-₹{ps.pf.toLocaleString()}</td>
                              <td className="text-emerald-600 font-black">₹{ps.netPay.toLocaleString()}</td>
                              <td>
                                <button
                                  onClick={() => setSelectedPayslip(ps)}
                                  className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-black"
                                >
                                  View payslip
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 7: Employee Timeline */}
              {activeTab === "Employee Timeline" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider border-b pb-2 border-slate-100">
                    📅 Profile Activity Logs Timeline
                  </h4>
                  <div className="space-y-4 pl-4 border-l border-indigo-100">
                    <div className="relative space-y-1">
                      <div className="absolute -left-5 top-1.5 w-2 h-2 rounded-full bg-indigo-600" />
                      <p className="text-xs font-bold text-slate-800">Checked in today</p>
                      <p className="text-[10px] font-semibold text-slate-400">Time: {currentTime.toLocaleDateString()}</p>
                    </div>
                    <div className="relative space-y-1">
                      <div className="absolute -left-5 top-1.5 w-2 h-2 rounded-full bg-slate-400" />
                      <p className="text-xs font-bold text-slate-800">Profile synchronized via DDL controller</p>
                      <p className="text-[10px] font-semibold text-slate-400">Status: Complete</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}



          {/* MY ATTENDANCE SUB-VIEWS */}
          {activeCategory === "EMP_ATTENDANCE" && (
            <div className="space-y-6">
              {/* Check In / Check Out / Today's Attendance Unified View */}
              {(activeTab === "Check In" || activeTab === "Check Out" || activeTab === "Today's Attendance" || activeTab === "Attendance Dashboard") && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fadeIn">
                  {/* Punch Box */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm xl:col-span-1 space-y-6">
                    <h4 className="font-extrabold text-sm text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-1.5">
                      <ClockIcon className="h-4.5 w-4.5 text-blue-600" /> Shift Command Clock
                    </h4>
                    <div className="text-center space-y-5">
                      <div className="inline-block p-5 bg-slate-50 rounded-full border border-slate-100 shadow-inner">
                        <ClockIcon className={`h-14 w-14 ${empCheckedIn ? 'text-green-500 animate-pulse' : 'text-slate-400'}`} />
                      </div>
                      
                      <div className="space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100/80">
                        <p className="text-xs text-slate-700 font-bold">General Shift (09:00 AM - 06:00 PM)</p>
                        <p className="text-[10px] text-slate-400 font-semibold">Grace Period: 15 Minutes</p>
                      </div>

                      {/* Webcam feed mock */}
                      <div className="border border-slate-100 bg-slate-50 rounded-xl p-3 space-y-2">
                        <div className="h-28 bg-slate-800 rounded-lg flex items-center justify-center relative overflow-hidden">
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-red-600 text-white rounded text-[8px] font-black uppercase tracking-wider animate-pulse">Live Feed</div>
                          <span className="text-[10px] text-slate-400 font-black uppercase">Webcam Ready</span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold">Secure photo verification will capture at Punch In</p>
                      </div>

                      <div className="space-y-1">
                        {empCheckedIn ? (
                          <div className="text-xs font-black text-green-600 bg-green-50/80 border border-green-200 rounded-lg p-2.5">
                            Check-In Recorded: {empPunchTime}
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                            Status: Session Locked (Not checked in)
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={() => !empCheckedIn && handleEmpPunch()}
                          disabled={empCheckedIn}
                          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-xs transition ${
                            empCheckedIn ? 'bg-slate-300 cursor-not-allowed text-slate-400' : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                        >
                          Check In
                        </button>
                        <button
                          onClick={() => empCheckedIn && handleEmpPunch()}
                          disabled={!empCheckedIn}
                          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-xs transition ${
                            !empCheckedIn ? 'bg-slate-300 cursor-not-allowed text-slate-400' : 'bg-red-600 hover:bg-red-700'
                          }`}
                        >
                          Check Out
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Today's Summary & Geolocation details */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm xl:col-span-2 space-y-6">
                    <h4 className="font-extrabold text-sm text-slate-800 pb-3 border-b border-slate-100">
                      📝 Today's Punch Summary
                    </h4>

                    {/* Specifications grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-600">
                      <div className="border p-3.5 rounded-xl bg-slate-50/30">
                        <span className="text-[9px] text-slate-400 block uppercase">Check In Time</span>
                        <span className="text-slate-800 font-black mt-0.5 block">{empCheckedIn ? empPunchTime : "--"}</span>
                      </div>
                      <div className="border p-3.5 rounded-xl bg-slate-50/30">
                        <span className="text-[9px] text-slate-400 block uppercase">Check Out Time</span>
                        <span className="text-slate-800 font-black mt-0.5 block">
                          {(() => {
                            const todayStr = new Date().toISOString().split('T')[0];
                            const t = attendanceLogs.find(a => a.date === todayStr);
                            return t && t.checkOut !== "--" ? t.checkOut : "--";
                          })()}
                        </span>
                      </div>
                      <div className="border p-3.5 rounded-xl bg-slate-50/30">
                        <span className="text-[9px] text-slate-400 block uppercase">Status</span>
                        <span className="mt-0.5 block">
                          {(() => {
                            const todayStr = new Date().toISOString().split('T')[0];
                            const t = attendanceLogs.find(a => a.date === todayStr);
                            return t ? <Badge variant={getStatusVariant(t.status)}>{t.status}</Badge> : <Badge variant="secondary">Not Checked In</Badge>;
                          })()}
                        </span>
                      </div>
                      <div className="border p-3.5 rounded-xl bg-slate-50/30">
                        <span className="text-[9px] text-slate-400 block uppercase">Working Hours</span>
                        <span className="text-slate-800 font-black mt-0.5 block">
                          {(() => {
                            const todayStr = new Date().toISOString().split('T')[0];
                            const t = attendanceLogs.find(a => a.date === todayStr);
                            return t && t.workingHours ? `${t.workingHours} Hrs` : "--";
                          })()}
                        </span>
                      </div>
                      <div className="border p-3.5 rounded-xl bg-slate-50/30">
                        <span className="text-[9px] text-slate-400 block uppercase">Lunch Break</span>
                        <span className="text-slate-800 font-black mt-0.5 block">1.0 Hr</span>
                      </div>
                      <div className="border p-3.5 rounded-xl bg-slate-50/30">
                        <span className="text-[9px] text-slate-400 block uppercase">Overtime</span>
                        <span className="text-slate-800 font-black mt-0.5 block">
                          {(() => {
                            const todayStr = new Date().toISOString().split('T')[0];
                            const t = attendanceLogs.find(a => a.date === todayStr);
                            return t && t.overtime ? `${t.overtime} Hrs` : "0 Hrs";
                          })()}
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-5">
                      <h5 className="text-xs font-black uppercase text-slate-900 tracking-wider mb-3">📍 Network & Geolocation Telemetry</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-[10px] text-slate-400 block uppercase tracking-wider">Device details</p>
                          <span className="text-slate-700 font-black block mt-0.5 truncate">{navigator.userAgent}</span>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 block uppercase tracking-wider">IP Address</p>
                          <span className="text-slate-700 font-black block mt-0.5">127.0.0.1</span>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 block uppercase tracking-wider">Location coordinates</p>
                          <span className="text-slate-700 font-black block mt-0.5">19.0760° N, 72.8777° E (Mumbai HQ geofence matched)</span>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 block uppercase tracking-wider">Geofence validation</p>
                          <span className="text-emerald-600 font-black block mt-0.5 flex items-center gap-1">✔ Authorized Zone</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Attendance Calendar */}
              {activeTab === "Attendance Calendar" && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-fadeIn">
                  <h4 className="font-extrabold text-sm text-slate-800 pb-3 border-b border-slate-100">
                    📅 Personal Attendance Calendar
                  </h4>
                  
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                      <div key={day} className="py-2 bg-slate-100 text-slate-600 rounded-lg">{day}</div>
                    ))}
                    
                    {/* Render days of current month */}
                    {Array.from({ length: 30 }).map((_, i) => {
                      const dayNumber = i + 1;
                      const dateStr = `2026-08-${String(dayNumber).padStart(2, '0')}`;
                      const log = attendanceLogs.find(l => l.date === dateStr);
                      
                      let bgClass = "bg-white text-slate-600 hover:bg-slate-50 border-slate-100";
                      let statusText = "";
                      
                      // Mocking weekend offs
                      const isWeekend = [2, 8, 9, 15, 16, 22, 23, 29, 30].includes(dayNumber);
                      
                      if (log) {
                        if (log.status === "Present") bgClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                        else if (log.status === "Late") bgClass = "bg-yellow-50 text-yellow-700 border-yellow-200 font-black";
                        else if (log.status === "Half Day") bgClass = "bg-amber-50 text-amber-700 border-amber-200";
                        else if (log.status === "Absent") bgClass = "bg-red-50 text-red-700 border-red-200";
                        else if (log.status === "Leave") bgClass = "bg-blue-50 text-blue-700 border-blue-200";
                        statusText = log.status;
                      } else if (isWeekend) {
                        bgClass = "bg-slate-100 text-slate-400 border-slate-200";
                        statusText = "Weekly Off";
                      }

                      return (
                        <div key={i} className={`p-4 border rounded-xl flex flex-col justify-between min-h-[80px] ${bgClass}`}>
                          <span className="text-left font-black">{dayNumber}</span>
                          {statusText && <span className="text-[8px] font-black uppercase tracking-wider block text-center mt-1">{statusText}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Attendance History */}
              {activeTab === "Attendance History" && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <h4 className="font-extrabold text-sm text-slate-800">
                      📜 Attendance History Logs
                    </h4>
                    <button 
                      onClick={() => window.print()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition"
                    >
                      Print logs
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-bold text-slate-600">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px]">
                          <th className="py-2.5">Date</th>
                          <th>Clock In</th>
                          <th>Clock Out</th>
                          <th>Working Hours</th>
                          <th>Status</th>
                          <th>Network details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {attendanceLogs.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="py-6 text-center text-xs text-slate-400 font-semibold">
                              No attendance logs recorded for this period.
                            </td>
                          </tr>
                        ) : (
                          attendanceLogs.map((log, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition">
                              <td className="py-3 text-slate-800">{log.date}</td>
                              <td>{log.checkIn}</td>
                              <td>{log.checkOut}</td>
                              <td>{log.workingHours} Hrs</td>
                              <td>
                                <Badge variant={getStatusVariant(log.status)}>{log.status}</Badge>
                              </td>
                              <td className="text-[10px] text-slate-400 font-semibold">{log.deviceInfo} ({log.ipAddress})</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Monthly Attendance summary & logs */}
              {activeTab === "Monthly Attendance" && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                        <span>📊 Monthly Attendance Summary</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {selectedMonthInfo.label}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        Showing attendance telemetry and working hours for {selectedMonthInfo.label}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setSelectedMonthFilter("this_month")}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                            selectedMonthFilter === "this_month"
                              ? "bg-white text-blue-600 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          This Month
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedMonthFilter("last_month")}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                            selectedMonthFilter === "last_month"
                              ? "bg-white text-blue-600 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Last Month
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedMonthFilter("all")}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                            selectedMonthFilter === "all"
                              ? "bg-white text-blue-600 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          All Logs
                        </button>
                      </div>

                      <button 
                        onClick={() => window.print()}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <span>🖨</span> Print Monthly Logs
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-slate-600">
                    <div className="border p-3.5 rounded-xl bg-slate-50/30">
                      <span className="text-[9px] text-slate-400 block uppercase">Total Working Days</span>
                      <span className="text-slate-800 font-black mt-0.5 block">{monthlyAttendanceKPIs.workingDays} Days</span>
                    </div>
                    <div className="border p-3.5 rounded-xl bg-slate-50/30">
                      <span className="text-[9px] text-slate-400 block uppercase">Present Days</span>
                      <span className="text-slate-800 font-black mt-0.5 block">
                        {monthlyAttendanceKPIs.presentDays} Days
                      </span>
                    </div>
                    <div className="border p-3.5 rounded-xl bg-slate-50/30">
                      <span className="text-[9px] text-slate-400 block uppercase">Late Marks</span>
                      <span className="text-slate-800 font-black mt-0.5 block">
                        {monthlyAttendanceKPIs.lateMarks} Times
                      </span>
                    </div>
                    <div className="border p-3.5 rounded-xl bg-slate-50/30">
                      <span className="text-[9px] text-slate-400 block uppercase">Absences</span>
                      <span className="text-slate-800 font-black mt-0.5 block">
                        {monthlyAttendanceKPIs.absences} Days
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">
                        📜 Attendance Log Records — {selectedMonthInfo.label}
                      </h5>
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {monthlyAttendanceLogs.length} Records
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-bold text-slate-600">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px]">
                            <th className="py-2.5">Date</th>
                            <th>Clock In</th>
                            <th>Clock Out</th>
                            <th>Working Hours</th>
                            <th>Status</th>
                            <th>Network details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {monthlyAttendanceLogs.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="py-6 text-center text-xs text-slate-400 font-semibold">
                                No attendance logs recorded for {selectedMonthInfo.label}.
                              </td>
                            </tr>
                          ) : (
                            monthlyAttendanceLogs.map((log, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 transition">
                                <td className="py-3 text-slate-800">{log.date}</td>
                                <td>{log.checkIn}</td>
                                <td>{log.checkOut}</td>
                                <td>{log.workingHours} Hrs</td>
                                <td>
                                  <Badge variant={getStatusVariant(log.status)}>{log.status}</Badge>
                                </td>
                                <td className="text-[10px] text-slate-400 font-semibold">
                                  {log.deviceInfo} ({log.ipAddress})
                                  {log.remarks && (
                                    <span className="block text-[9px] text-slate-400 font-normal italic mt-0.5">
                                      Note: {log.remarks}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Shift Details */}
              {activeTab === "Shift Details" && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-fadeIn">
                  <h4 className="font-extrabold text-sm text-slate-800 pb-3 border-b border-slate-100">
                    📅 Shift Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Shift Name</span>
                      <span className="text-slate-800 font-black block mt-0.5">General Shift (GEN)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Working Hours</span>
                      <span className="text-slate-800 font-black block mt-0.5">09:00 AM - 06:00 PM (9.0 Hrs)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Grace Period</span>
                      <span className="text-slate-800 font-black block mt-0.5">15 Minutes</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Status</span>
                      <span className="text-emerald-600 font-black block mt-0.5">Active</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Overtime */}
              {activeTab === "Overtime" && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-fadeIn">
                  <h4 className="font-extrabold text-sm text-slate-800 pb-3 border-b border-slate-100">
                    ⏰ Overtime Tracking & Approvals
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-bold text-slate-600">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px]">
                          <th className="py-2.5">Date</th>
                          <th>Overtime Hours</th>
                          <th>Status</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {attendanceLogs.filter(l => l.overtime > 0).map((log, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition">
                            <td className="py-3 text-slate-800">{log.date}</td>
                            <td>{log.overtime} Hrs</td>
                            <td>
                              <Badge variant="success">Approved</Badge>
                            </td>
                            <td>{log.remarks}</td>
                          </tr>
                        ))}
                        {attendanceLogs.filter(l => l.overtime > 0).length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center py-6 text-slate-400 font-medium">No overtime logs recorded for this month.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Attendance Regularization */}
              {activeTab === "Attendance Regularization" && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fadeIn">
                  {/* Create Request */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm xl:col-span-1 space-y-6">
                    <h4 className="font-extrabold text-sm text-slate-800 pb-3 border-b border-slate-100">
                      Apply Correction
                    </h4>
                    <form onSubmit={handleApplyRegularization} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Missed Date</label>
                        <input
                          type="date"
                          value={newRegularization.date}
                          onChange={e => setNewRegularization(prev => ({ ...prev, date: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Punch Type</label>
                        <select
                          value={newRegularization.punchType}
                          onChange={e => setNewRegularization(prev => ({ ...prev, punchType: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option>Check-In</option>
                          <option>Check-Out</option>
                          <option>Both</option>
                        </select>
                      </div>
                      {newRegularization.punchType !== "Check-Out" && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Requested Check-In</label>
                          <input
                            type="text"
                            placeholder="e.g. 09:00:00"
                            value={newRegularization.requestedCheckIn}
                            onChange={e => setNewRegularization(prev => ({ ...prev, requestedCheckIn: e.target.value }))}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                      {newRegularization.punchType !== "Check-In" && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Requested Check-Out</label>
                          <input
                            type="text"
                            placeholder="e.g. 18:00:00"
                            value={newRegularization.requestedCheckOut}
                            onChange={e => setNewRegularization(prev => ({ ...prev, requestedCheckOut: e.target.value }))}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Reason</label>
                        <textarea
                          rows="3"
                          placeholder="Why was the punch missed?"
                          value={newRegularization.reason}
                          onChange={e => setNewRegularization(prev => ({ ...prev, reason: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition">
                        Submit correction request
                      </button>
                    </form>
                  </div>

                  {/* Corrections History */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm xl:col-span-2 space-y-6">
                    <h4 className="font-extrabold text-sm text-slate-800 pb-3 border-b border-slate-100">
                      Correction History
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-bold text-slate-600">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px]">
                            <th className="py-2.5">Date</th>
                            <th>Punch Type</th>
                            <th>Request Times</th>
                            <th>Status</th>
                            <th>Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {regularizationLogs.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition">
                              <td className="py-3 text-slate-800">{item.date}</td>
                              <td>{item.punchType}</td>
                              <td>{item.requestedCheckIn || "--"} / {item.requestedCheckOut || "--"}</td>
                              <td>
                                <Badge variant={item.status === "Approved" ? "success" : item.status === "Rejected" ? "danger" : "warning"}>
                                  {item.status}
                                </Badge>
                              </td>
                              <td className="text-slate-400 font-semibold">{item.reason}</td>
                            </tr>
                          ))}
                          {regularizationLogs.length === 0 && (
                            <tr>
                              <td colSpan={5} className="text-center py-6 text-slate-400 font-medium">No regularization requests submitted yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Biometric Logs */}
              {activeTab === "Biometric Logs" && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-fadeIn">
                  <h4 className="font-extrabold text-sm text-slate-800 pb-3 border-b border-slate-100">
                    📟 Synced Biometric Device Logs
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-bold text-slate-600">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px]">
                          <th>Device Name</th>
                          <th>Machine ID</th>
                          <th>Punch Type</th>
                          <th>Sync Time</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr className="hover:bg-slate-50/50 transition">
                          <td className="py-3">Mumbai Gate A Reader</td>
                          <td>M-902</td>
                          <td>IN</td>
                          <td>{new Date().toISOString().split('T')[0]} 08:58 AM</td>
                          <td>
                            <Badge variant="success">Synced</Badge>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition">
                          <td>Mumbai Gate A Reader</td>
                          <td>M-902</td>
                          <td>OUT</td>
                          <td>{new Date().toISOString().split('T')[0]} 06:02 PM</td>
                          <td>
                            <Badge variant="success">Synced</Badge>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Attendance Reports */}
              {activeTab === "Attendance Reports" && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-fadeIn">
                  <h4 className="font-extrabold text-sm text-slate-800 pb-3 border-b border-slate-100">
                    📈 Export Attendance Reports
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="border border-slate-150 p-5 rounded-2xl space-y-3 text-center">
                      <span className="text-lg">📅</span>
                      <h5 className="font-black text-slate-800 text-xs">Monthly Detailed Report</h5>
                      <button 
                        onClick={() => alert("Report downloaded successfully in CSV format.")}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                      >
                        Download CSV
                      </button>
                    </div>
                    <div className="border border-slate-150 p-5 rounded-2xl space-y-3 text-center">
                      <span className="text-lg">⏰</span>
                      <h5 className="font-black text-slate-800 text-xs">Overtime Log Statement</h5>
                      <button 
                        onClick={() => alert("Statement downloaded successfully in CSV format.")}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                      >
                        Download CSV
                      </button>
                    </div>
                    <div className="border border-slate-150 p-5 rounded-2xl space-y-3 text-center">
                      <span className="text-lg">📄</span>
                      <h5 className="font-black text-slate-800 text-xs">Print PDF Summary</h5>
                      <button 
                        onClick={() => window.print()}
                        className="w-full py-2 bg-slate-850 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition"
                      >
                        Print PDF
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MY LEAVE SUB-VIEWS */}
          {activeCategory === "EMP_LEAVE" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Tabs Inner Navigation (Apply Leave / History / Calendar) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Left side / Form column (Always show on Apply Leave tab, or show as collapsible) */}
                {(activeTab === "Apply Leave" || activeTab === "Leave Request") && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm xl:col-span-1 space-y-6">
                    <h4 className="font-extrabold text-sm text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-1.5">
                      <CalendarDaysIcon className="h-4.5 w-4.5 text-blue-600" /> Apply Leave Request
                    </h4>
                    <form onSubmit={handleApplyLeave} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Leave Type</label>
                        <select
                          value={newLeave.leaveType}
                          onChange={e => setNewLeave(prev => ({ ...prev, leaveType: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {(() => {
                            const options = leaveTypes.length > 0
                              ? leaveTypes.map(t => t.leave_name || t.leaveName || t.leaveTypeName || t.name || t.typeName || t.leave_type_name || t.type_name || t.type).filter(Boolean)
                              : ["Casual Leave", "Medical Leave", "Earned Leave"];
                            return options.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ));
                          })()}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Duration Option</label>
                        <select
                          value={newLeave.halfDay}
                          onChange={e => setNewLeave(prev => ({ ...prev, halfDay: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Full Day">Full Day</option>
                          <option value="Half Day">Half Day (0.5 Day)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">From Date</label>
                          <input
                            type="date"
                            value={newLeave.fromDate}
                            onChange={e => setNewLeave(prev => ({ ...prev, fromDate: e.target.value }))}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">To Date</label>
                          <input
                            type="date"
                            value={newLeave.toDate}
                            onChange={e => setNewLeave(prev => ({ ...prev, toDate: e.target.value }))}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Attachment (Optional)</label>
                        <input
                          type="file"
                          onChange={handleLeaveFileChange}
                          className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition"
                        />
                        {newLeave.attachment && (
                          <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ File ready to submit</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Reason</label>
                        <textarea
                          value={newLeave.reason}
                          onChange={e => setNewLeave(prev => ({ ...prev, reason: e.target.value }))}
                          rows="3"
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Brief reason for leave..."
                        />
                      </div>
                      
                      <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition">
                        Submit Request
                      </button>
                    </form>
                  </div>
                )}

                {/* Right side / Ledger and Balances column */}
                {activeTab !== "Holiday Calendar" && (
                  <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 ${(activeTab === "Apply Leave" || activeTab === "Leave Request") ? "xl:col-span-2" : "col-span-3"}`}>
                    <h4 className="font-extrabold text-sm text-slate-800 pb-3 border-b border-slate-100">Leave Balance & Active Applications</h4>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                        <p className="text-[9px] font-bold text-blue-500 uppercase">Casual Leaves</p>
                        <p className="text-xl font-black text-slate-800 mt-1">
                          {currentUserProfile?.casualLeave ?? "12"} / 12 Available
                        </p>
                      </div>
                      <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                        <p className="text-[9px] font-bold text-emerald-500 uppercase">Medical / Sick</p>
                        <p className="text-xl font-black text-slate-800 mt-1">
                          {currentUserProfile?.sickLeave ?? "12"} / 12 Available
                        </p>
                      </div>
                      <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                        <p className="text-[9px] font-bold text-purple-500 uppercase">Earned Leaves</p>
                        <p className="text-xl font-black text-slate-800 mt-1">
                          {currentUserProfile?.earnedLeave ?? "15"} / 15 Available
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto mt-4">
                      <table className="w-full text-left text-xs font-bold text-slate-600">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px]">
                            <th className="py-2.5">Type</th>
                            <th>Duration</th>
                            <th>Days</th>
                            <th>Reason</th>
                            <th>Attachment</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {leaves.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="py-6 text-center text-slate-400 font-medium">No leave applications found.</td>
                            </tr>
                          ) : (
                            leaves.map((l) => (
                              <tr key={l.id} className="hover:bg-slate-50/50 transition">
                                <td className="py-3 text-slate-800">{l.leaveType}</td>
                                <td>{l.fromDate} to {l.toDate} <span className="text-[10px] text-slate-400">({l.halfDay || "Full Day"})</span></td>
                                <td>{l.totalDays} Days</td>
                                <td className="text-slate-500 font-semibold max-w-xs truncate" title={l.reason}>
                                  {l.reason}
                                  {l.rejectionReason && (
                                    <div className="text-[10px] text-red-500 font-normal mt-0.5">Rejection reason: {l.rejectionReason}</div>
                                  )}
                                </td>
                                <td>
                                  {l.attachment ? (
                                    <a href={l.attachment} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View File</a>
                                  ) : (
                                    <span className="text-slate-300">None</span>
                                  )}
                                </td>
                                <td>
                                  <Badge variant={getStatusVariant(l.status)}>{l.status}</Badge>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Holiday Calendar view inside Leaves category */}
                {activeTab === "Holiday Calendar" && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm col-span-3 space-y-6 animate-fadeIn">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                        <CalendarDaysIcon className="h-4.5 w-4.5 text-emerald-600" /> Holiday Calendar
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400">
                        Showing holidays matching: {currentUserProfile?.branch || "All Branches"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(() => {
                        // Dynamically compute applicable holidays
                        const empBranch = String(currentUserProfile?.branch || "").toLowerCase().trim();
                        const empLocation = String(currentUserProfile?.location || currentUserProfile?.city || "").toLowerCase().trim();
                        const empCompany = String(currentUserProfile?.company || "").toLowerCase().trim();

                        const applicable = holidays.filter(h => {
                          const hBranch = String(h.branch || "").toLowerCase().trim();
                          const hLocation = String(h.location || "").toLowerCase().trim();
                          const hCompany = String(h.company || "").toLowerCase().trim();
                          const isMainHQMatch = (hBranch === "main" || hBranch === "headquarters" || hBranch === "main branch") && (empBranch === "main" || empBranch === "headquarters" || empBranch === "main branch");
                          const matchBranch = !h.branch || hBranch === "all branches" || hBranch === "" || isMainHQMatch || (empBranch && hBranch.includes(empBranch)) || (empBranch && empBranch.includes(hBranch));
                          const matchLocation = !h.location || hLocation === "all locations" || hLocation === "" || (empLocation && hLocation.includes(empLocation)) || (empLocation && empLocation.includes(hLocation));
                          const matchCompany = !h.company || hCompany === "all companies" || hCompany === "" || (empCompany && hCompany.includes(empCompany)) || (empCompany && empCompany.includes(hCompany));

                          return matchBranch && matchLocation && matchCompany;
                        });

                        if (applicable.length === 0) {
                          return (
                            <div className="col-span-3 text-center py-12 text-slate-400 font-medium">
                              No holidays scheduled for your location or branch.
                            </div>
                          );
                        }

                        return applicable.map(h => (
                          <div key={h.id} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-2 relative overflow-hidden">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-mono font-bold text-slate-600">{h.holidayDate || h.holiday_date}</span>
                              <div className="flex gap-1 items-center">
                                <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                                  {h.holidayType || h.holiday_type || "Public"}
                                </span>
                                {!!h.is_working_day && (
                                  <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                                    Working Event
                                  </span>
                                )}
                              </div>
                            </div>
                            <h5 className="font-extrabold text-xs text-slate-800">{h.holidayName || h.holiday_name}</h5>
                            <p className="text-[11px] text-slate-500 font-semibold">{h.description}</p>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* MY PAYROLL SUB-VIEWS */}
          {activeCategory === "EMP_PAYROLL" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <h4 className="font-extrabold text-sm text-slate-800 pb-3 border-b border-slate-100">Salary Structure & Generated Payslips</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-bold text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px]">
                      <th className="py-2.5">Month</th>
                      <th>Basic Salary</th>
                      <th>HRA</th>
                      <th>Special Allowance</th>
                      <th>PF Deduction</th>
                      <th>Net Payout</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payslips.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-6 text-center text-xs text-slate-400 font-semibold">
                          No payslip records generated yet.
                        </td>
                      </tr>
                    ) : (
                      payslips.map((ps, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 text-slate-800 font-extrabold">{ps.month}</td>
                        <td>₹{ps.basic.toLocaleString()}</td>
                        <td>₹{ps.hra.toLocaleString()}</td>
                        <td>₹{ps.special.toLocaleString()}</td>
                        <td className="text-red-500">-₹{ps.pf.toLocaleString()}</td>
                        <td className="text-emerald-600 font-black">₹{ps.netPay.toLocaleString()}</td>
                        <td>
                          <button 
                            onClick={() => setSelectedPayslip(ps)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100/80 rounded-lg transition text-[10px] font-black"
                          >
                            View slip
                          </button>
                        </td>
                      </tr>
                    ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MY ASSETS SUB-VIEWS */}
          {activeCategory === "EMP_ASSETS" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <h4 className="font-extrabold text-sm text-slate-800 pb-3 border-b border-slate-100">Hardware & Software Allocations</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-bold text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px]">
                      <th className="py-2.5">Asset Name</th>
                      <th>Category</th>
                      <th>Serial Number</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assets.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-6 text-center text-xs text-slate-400 font-semibold">
                          No hardware or software assets allocated yet.
                        </td>
                      </tr>
                    ) : (
                      assets.map((ast) => (
                      <tr key={ast.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 text-slate-800 font-extrabold">{ast.assetName}</td>
                        <td>{ast.assetCategory}</td>
                        <td className="font-mono text-slate-500">{ast.serialNumber}</td>
                        <td>
                          <Badge variant={getStatusVariant(ast.status)}>{ast.status}</Badge>
                        </td>
                      </tr>
                    ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* HELPDESK SUB-VIEWS */}
          {activeCategory === "EMP_HELPDESK" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <HelpdeskDashboard selectedTab={activeTab} user={user} onRefreshData={loadDashboardData} />
            </div>
          )}

          {/* MY SETTINGS SUB-VIEWS */}
          {activeCategory === "EMP_SETTINGS" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm max-w-xl mx-auto space-y-6">
              <h4 className="font-extrabold text-sm text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-1.5">
                <Cog6ToothIcon className="h-4.5 w-4.5 text-blue-600" /> Account Preferences & Security
              </h4>
              <div className="space-y-4 text-xs font-bold text-slate-600">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-slate-800">Two-Factor Authentication</p>
                      <p className="text-[10px] text-slate-400 font-semibold">Enable SMS or Authenticator app logins</p>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black">Enable</button>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <GlobeAltIcon className="h-5 w-5 text-indigo-500" />
                    <div>
                      <p className="text-slate-800">Portal Language</p>
                      <p className="text-[10px] text-slate-400 font-semibold">Choose default display language</p>
                    </div>
                  </div>
                  <span className="text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-[10px]">English (US)</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-red-50/50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-2">
                    <ArrowRightOnRectangleIcon className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-red-700">Logout Session</p>
                      <p className="text-[10px] text-red-400 font-semibold">End current user session immediately</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      logout();
                      window.location.href = "/login";
                    }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-black transition"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeCategory === "EMP_DOCUMENTS" && (
            <EmployeeDocuments activeTab={activeTab} user={user} />
          )}

          {activeCategory === "EXIT_MGMT" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <ExitDashboard selectedTab={activeTab} user={user} onRefreshData={loadDashboardData} />
            </div>
          )}

          {activeCategory === "EMP_REPORTS" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <ReportsDashboard selectedTab={activeTab} user={user} onRefreshData={loadDashboardData} />
            </div>
          )}

          {activeCategory === "EMP_NOTIFICATIONS" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <NotificationsDashboard selectedTab={activeTab} user={user} onRefreshData={loadDashboardData} />
            </div>
          )}

          {activeCategory === "EMP_LEARNING" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <LearningDashboard selectedTab={activeTab} user={user} onRefreshData={loadDashboardData} />
            </div>
          )}

          {activeCategory === "EMP_PERFORMANCE" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <PerformanceDashboard />
            </div>
          )}

          {activeCategory === "EMP_ENGAGEMENT" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <AnnouncementsSurveys records={[]} />
            </div>
          )}

          {/* FALLBACK PLACEHOLDER FOR OTHER WORKSPACES */}
          {!["EMP_DASHBOARD", "EMP_PROFILE", "EMP_ATTENDANCE", "EMP_LEAVE", "EMP_PAYROLL", "EMP_ASSETS", "EMP_HELPDESK", "EMP_SETTINGS", "EMPLOYEE_MGMT", "EMP_DOCUMENTS", "EXIT_MGMT", "EMP_LEARNING", "EMP_PERFORMANCE", "EMP_ENGAGEMENT", "EMP_REPORTS", "EMP_NOTIFICATIONS"].includes(activeCategory) && (
            <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto shadow-inner text-slate-400">
                <CommandLineIcon className="h-7 w-7" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-800">Under Construction ({activeTab})</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">This module is provisioned for development and testing sandbox routing. Form handlers will be mounted in future iterations.</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* 8. Premium Payslip Modal Container */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden flex flex-col transform transition-all duration-300">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black tracking-tight">Corporate Salary Slip</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{selectedPayslip.month}</p>
              </div>
              <button 
                onClick={() => setSelectedPayslip(null)}
                className="text-slate-400 hover:text-white transition font-black text-sm p-1"
              >
                ✕
              </button>
            </div>

            {/* Slip content */}
            <div className="p-6 space-y-6 text-xs font-bold text-slate-600 flex-1">
              <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">{currentUserProfile?.company || user?.company || "Corporate Office"}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{currentUserProfile?.branch || "Main Branch"}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-800">Employee: {employeeName}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Designation: {currentUserProfile?.designation || "Staff Professional"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h5 className="font-extrabold text-slate-800 text-[10px] uppercase tracking-wider mb-2 text-indigo-600">Earnings</h5>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span>Basic Pay</span>
                      <span className="text-slate-800">₹{selectedPayslip.basic.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>HRA</span>
                      <span className="text-slate-800">₹{selectedPayslip.hra.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Special Allowance</span>
                      <span className="text-slate-800">₹{selectedPayslip.special.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-extrabold text-slate-800 text-[10px] uppercase tracking-wider mb-2 text-red-500">Deductions</h5>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span>Provident Fund (PF)</span>
                      <span className="text-slate-800">₹{selectedPayslip.pf.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Income Tax (TDS)</span>
                      <span className="text-slate-800">₹{selectedPayslip.tax.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-slate-800 text-sm">Net Pay Distribution</span>
                <span className="text-xl font-black text-emerald-600">₹{selectedPayslip.netPay.toLocaleString()}</span>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => {
                  if (selectedPayslip.id) {
                    const printWindow = window.open(`http://localhost:5000/api/finance/payslips/${selectedPayslip.id}/pdf`, '_blank');
                    printWindow.onload = () => { printWindow.print(); };
                  } else {
                    window.print();
                  }
                }}
                className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition"
              >
                <PrinterIcon className="h-4 w-4" />
                <span>Print</span>
              </button>
              <button 
                onClick={() => {
                  alert("Downloading Payslip PDF...");
                  setSelectedPayslip(null);
                }}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black shadow-sm transition"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Duplicate Employee Detection Alert Modal */}
      {duplicateWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-amber-200 overflow-hidden flex flex-col transform transition-all duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-rose-500 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">{duplicateWarningModal.title || "Already Data Uploaded!"}</h3>
                  <p className="text-[11px] text-amber-100 font-bold">Yeh data pehle se database me upload ho chuka hai (Already Uploaded)</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setDuplicateWarningModal(null)}
                className="text-white/80 hover:text-white transition font-black text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-900 leading-relaxed font-semibold">
                {duplicateWarningModal.customMessage ? (
                  <span>{duplicateWarningModal.customMessage}</span>
                ) : (
                  <span>
                    Aapne jo <b>{duplicateWarningModal.matchedField || "Email ya Employee Code"}</b> daala hai, usse match karta hua employee database me pehle se registered hai. Repeat / duplicate record insert nahi kiya ja sakta.
                  </span>
                )}
              </div>

              {/* Matched Record Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Pehle Se Majood Record (Existing Employee)</p>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Employee Name:</span>
                    <span className="font-extrabold text-slate-900 text-xs">{duplicateWarningModal.name || "--"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Employee Code:</span>
                    <span className="font-extrabold text-indigo-700 text-xs font-mono">{duplicateWarningModal.code || "--"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Email:</span>
                    <span className="font-semibold text-slate-800 text-xs">{duplicateWarningModal.email || "--"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Record ID:</span>
                    <span className="font-mono text-slate-500 text-[11px]">#{String(duplicateWarningModal.id || "").slice(0, 8)}</span>
                  </div>
                </div>
              </div>

              <p className="text-slate-500 text-[11px] leading-tight font-medium">
                💡 Agar aap is employee ki details update karna chahte hain toh <b>"Load & Edit Profile"</b> par click karein, ya naye employee ke liye alag Email / Employee Code use karein.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
              <button 
                type="button"
                onClick={() => setDuplicateWarningModal(null)}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                ✕ Close & Change Details
              </button>
              {duplicateWarningModal.existingData && (
                <button 
                  type="button"
                  onClick={() => handleLoadDuplicateEmployee(duplicateWarningModal.existingData)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🔄 Load & Edit Profile</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
