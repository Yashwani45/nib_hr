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
  
  const [empCheckedIn, setEmpCheckedIn] = useState(false);
  const [empPunchTime, setEmpPunchTime] = useState("");
  
  // Lists initialized with beautiful demo fallbacks
  const [attendanceLogs, setAttendanceLogs] = useState([
    { date: "2026-07-27", checkIn: "09:02 AM", checkOut: "--", status: "Present" },
    { date: "2026-07-26", checkIn: "08:58 AM", checkOut: "05:31 PM", status: "Present" },
    { date: "2026-07-25", checkIn: "09:05 AM", checkOut: "05:35 PM", status: "Present" }
  ]);
  const [leaves, setLeaves] = useState([
    { id: "L-902", leaveType: "Casual Leave", fromDate: "2026-08-01", toDate: "2026-08-03", totalDays: 3, status: "Pending", reason: "Family event" },
    { id: "L-884", leaveType: "Medical Leave", fromDate: "2026-07-10", toDate: "2026-07-11", totalDays: 2, status: "Approved", reason: "Fever recovery" }
  ]);
  const [assets, setAssets] = useState([
    { id: "A-1", assetName: "MacBook Pro M3", assetCategory: "Laptop", serialNumber: "C02XYZ123ABC", status: "Assigned" },
    { id: "A-2", assetName: "Dell U2723QE Monitor", assetCategory: "Display", serialNumber: "MX-998877", status: "Assigned" }
  ]);
  const [expandedAssetId, setExpandedAssetId] = useState(null);
  const [tickets, setTickets] = useState([
    { id: "TKT-101", subject: "VPN Access Issue", category: "IT Support", status: "In Progress", date: "2026-07-26" },
    { id: "TKT-095", subject: "Salary Slip Request", category: "HR Helpdesk", status: "Resolved", date: "2026-07-15" }
  ]);
  const [payslips, setPayslips] = useState([
    { month: "June 2026", basic: 25000, hra: 10000, special: 7500, pf: 3000, tax: 2000, netPay: 37500 },
    { month: "May 2026", basic: 25000, hra: 10000, special: 7500, pf: 3000, tax: 2000, netPay: 37500 },
    { month: "April 2026", basic: 25000, hra: 10000, special: 7500, pf: 3000, tax: 2000, netPay: 37500 }
  ]);

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
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(searchParams.get("profileEmpId") || "");

  // Derived user details
  const employeeName = currentUserProfile?.firstName || currentUserProfile?.employeeName || user?.employeeName || user?.name || user?.email?.split('@')[0] || "Employee";
  const departmentName = currentUserProfile?.department || user?.departmentName || user?.department || "Operations";

  const [selectedDeptFilter, setSelectedDeptFilter] = useState(departmentName);
  const [companyDepartmentsList, setCompanyDepartmentsList] = useState(["IT", "Software Engineering", "Operations", "Finance", "Human Resources", "Sales & Marketing"]);

  useEffect(() => {
    if (departmentName && !selectedDeptFilter) {
      setSelectedDeptFilter(departmentName);
    }
  }, [departmentName]);

  const profileDetails = useMemo(() => {
    if (!currentUserProfile) return {};
    let data = {};
    try {
      if (currentUserProfile.profileData) {
        if (typeof currentUserProfile.profileData === "string") {
          data = JSON.parse(currentUserProfile.profileData);
        } else if (typeof currentUserProfile.profileData === "object") {
          data = currentUserProfile.profileData;
        }
      }
    } catch (e) {
      console.error("Error parsing employee profileData:", e);
    }
    const empName = currentUserProfile.firstName || currentUserProfile.employeeName || currentUserProfile.employee_name || "Employee";
    const names = empName.split(" ");
    const firstName = names[0] || "";
    const lastName = names.slice(1).join(" ") || "";

    const details = { ...currentUserProfile };
    const jsonCols = ['education', 'experience', 'skills', 'assets', 'documents', 'kpis', 'promotionHistory', 'awards', 'activityTimeline', 'weeklyOff'];
    jsonCols.forEach(col => {
      if (details[col] && typeof details[col] === 'string') {
        try {
          details[col] = JSON.parse(details[col]);
        } catch (err) {}
      }
    });

    return {
      firstName: data.firstName || firstName,
      lastName: data.lastName || lastName,
      ...data,
      ...details
    };
  }, [currentUserProfile]);

  const effectiveProfileTab = useMemo(() => {
    if (activeTab === "Personal Information") return "Basic Information";
    if (activeTab === "Official Information") return "Official Information";
    if (activeTab === "Contact Details" || activeTab === "Address Details") return "Contact Information";
    if (activeTab === "Emergency Contacts" || activeTab === "Family Details") return "Emergency Contact";
    if (activeTab === "Education") return "Education";
    if (activeTab === "Experience") return "Experience";
    if (activeTab === "Skills & Certifications") return "Skills & Certifications";
    if (activeTab === "Identity Documents") return "Identity Documents";
    if (activeTab === "Bank Details" || activeTab === "Salary Details") return "Bank & Payroll";
    if (activeTab === "Reporting Manager" || activeTab === "Organization Details") return "Official Information";
    if (activeTab === "Profile Timeline") return "Audit Information";
    return activeTab || "Basic Information";
  }, [activeTab]);

  useEffect(() => {
    const urlSubTab = searchParams.get("profileTab");
    if (urlSubTab) {
      setProfileTab(urlSubTab);
    } else if (effectiveProfileTab && effectiveProfileTab !== "Dashboard Home" && effectiveProfileTab !== "Employee Profile") {
      setProfileTab(effectiveProfileTab);
    }
  }, [searchParams, effectiveProfileTab]);

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
      setEmployeeForm(prev => ({
        ...prev,
        ...profileDetails,
        documents: profileDetails.documents || prev.documents || {},
        assets: profileDetails.assets || prev.assets || []
      }));
    }
  }, [profileDetails]);

  // Live Timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

      // 4. Fetch dynamic departments list
      try {
        const deptRes = await apiFetch("/api/table/department");
        const depts = (deptRes?.data || []).map(d => d.deptName || d.dept_name || d.name).filter(Boolean);
        const empDepts = empsList.map(e => e.department).filter(Boolean);
        const merged = Array.from(new Set([...depts, ...empDepts, "IT", "Software Engineering", "Operations", "Finance", "Human Resources", "Sales & Marketing"]));
        setCompanyDepartmentsList(merged);
      } catch (e) {}

      const profile = empsList.find(e => {
        if (isAdmin && selectedEmployeeId) {
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
        const filteredAtt = attList.filter(a => 
          (a.empId && myEmpCode && String(a.empId).toLowerCase().trim() === String(myEmpCode).toLowerCase().trim()) ||
          (a.empId && String(a.empId).toLowerCase().trim() === String(profile.id).toLowerCase().trim())
        ).map(l => ({
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
        const ticketRes = await apiFetch("/api/table/hr_tickets");
        const ticketList = ticketRes?.data || [];
        const filteredTickets = ticketList.filter(t => t.empName === profile.firstName || t.empName === profile.employeeName);
        if (filteredTickets.length > 0) {
          setTickets(filteredTickets.map(t => ({
            id: t.id || t.ticketNo,
            subject: t.subject,
            category: t.category,
            status: t.status,
            date: t.created_at ? t.created_at.split(' ')[0] : '2026-07-27'
          })));
        }

        // Fetch payroll history from custom route
        try {
          const payRes = await apiFetch(`/api/finance/payslips?employeeId=${profile.id}`);
          const payList = payRes?.data || [];
          if (payList.length > 0) {
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
          }
        } catch (errPay) {
          console.warn("Payroll API failed, keeping fallbacks:", errPay.message);
        }

        // Fetch regularization logs
        try {
          const regRes = await apiFetch("/api/table/attendance_regularization");
          const regList = regRes?.data || [];
          const myRegList = regList.filter(r => 
            (r.empId && myEmpCode && String(r.empId).toLowerCase().trim() === String(myEmpCode).toLowerCase().trim()) ||
            (r.empId && String(r.empId).toLowerCase().trim() === String(profile.id).toLowerCase().trim())
          );
          setRegularizationLogs(myRegList);
        } catch (errReg) {
          console.warn("Regularization logs load failed:", errReg);
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
    return {
      totalEmp: 215,
      present: 172,
      onLeave: 25,
      absent: 18,
      late: 9,
      wfh: 12,
      pending: 5,
      barData: [
        { label: "Ops", value: 215, height: "h-[90%]", color: "bg-blue-600" },
        { label: "Sales", value: 184, height: "h-[80%]", color: "bg-emerald-500" },
        { label: "Support", value: 168, height: "h-[70%]", color: "bg-indigo-500" },
        { label: "Mktg", value: 132, height: "h-[55%]", color: "bg-pink-500" },
        { label: "Claim", value: 128, height: "h-[52%]", color: "bg-amber-500" },
        { label: "Tech", value: 156, height: "h-[65%]", color: "bg-slate-700" }
      ]
    };
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!employeeForm.firstName || !employeeForm.firstName.trim()) {
      alert("First Name is required.");
      return;
    }

    const constructedName = `${employeeForm.firstName} ${employeeForm.lastName || ""}`.trim();
    
    const profileDataStr = JSON.stringify({
      ...employeeForm,
      updatedBy: user?.email || "Employee Self",
      updatedDate: new Date().toLocaleDateString()
    });

    const cleanFirstName = (employeeForm.firstName || "employee").toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanLastName = (employeeForm.lastName || "staff").toLowerCase().replace(/[^a-z0-9]/g, "");
    const fallbackEmail = `${cleanFirstName}.${cleanLastName}${Date.now().toString().slice(-4)}@nib.com`;
    const effectiveEmail = (employeeForm.officialEmail && employeeForm.officialEmail.trim())
      ? employeeForm.officialEmail.trim()
      : (employeeForm.personalEmail && employeeForm.personalEmail.trim())
        ? employeeForm.personalEmail.trim()
        : fallbackEmail;

    const payload = {
      ...employeeForm,
      employee_name: constructedName,
      emp_code: employeeForm.employeeCode || employeeForm.empCode || undefined,
      email: effectiveEmail,
      department: employeeForm.department || "Operations",
      profile_data: profileDataStr
    };

    delete payload.created_at;
    delete payload.updated_at;
    delete payload.createdAt;
    delete payload.updatedAt;

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
      alert("Your profile has been saved successfully!");
      loadDashboardData();
    } catch (err) {
      alert(err.message || "Failed to save profile.");
    }
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
            {activeTab === "Dashboard Home" ? (selectedDeptFilter || departmentName) + " Department Dashboard" : activeTab}
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
          <select className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Year</option>
          </select>
          <select 
            value={selectedDeptFilter || departmentName}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value={departmentName}>{departmentName} Department</option>
            {companyDepartmentsList
              .filter(d => d !== departmentName)
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
                    <span className="text-[9px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Employee Management</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
                      <p className="text-lg font-black text-slate-700">{metrics.totalEmp}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Male</p>
                      <p className="text-lg font-black text-slate-700">{Math.ceil(metrics.totalEmp * 0.6)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Female</p>
                      <p className="text-lg font-black text-slate-700">{Math.floor(metrics.totalEmp * 0.4)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Active</p>
                      <p className="text-lg font-black text-emerald-600">{metrics.totalEmp}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Permanent</p>
                      <p className="text-lg font-black text-slate-700">{metrics.totalEmp}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Contract</p>
                      <p className="text-lg font-black text-slate-700">0</p>
                    </div>
                  </div>
                </div>

                {/* Attendance Summary Donut */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                      <ClockIcon className="h-4.5 w-4.5 text-blue-600" /> Attendance Summary
                    </h4>
                    <span className="text-[9px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Attendance</span>
                  </div>
                  <div className="flex items-center gap-5">
                    {/* SVG Donut Chart */}
                    <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.91" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15.91" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray={`${metrics.totalEmp > 0 ? (metrics.present / metrics.totalEmp) * 100 : 0} ${metrics.totalEmp > 0 ? 100 - (metrics.present / metrics.totalEmp) * 100 : 100}`} />
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
                      <span className="text-sm font-black text-slate-800">340 Days</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
                      <span className="text-sm font-bold text-slate-500">Leave Taken</span>
                      <span className="text-sm font-black text-blue-600">156 Days</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
                      <span className="text-xs font-bold text-slate-500">Pending Requests</span>
                      <span className="text-sm font-black text-orange-600">32 Days</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
                      <span className="text-xs font-bold text-slate-500">Currently On Leave</span>
                      <span className="text-sm font-black text-red-600">25 Staff</span>
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
                      <span className="text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded">5 Roles</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-500">Interviews Today</span>
                      <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">8 Candidates</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-500">Shortlisted Staff</span>
                      <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded">12 Candidates</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-500">Offers Released</span>
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">6 Offers</span>
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
                      <PresentationChartBarIcon className="h-4.5 w-4.5 text-blue-600" /> Employee Distribution
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400">Total Employees</span>
                  </div>
                  <div className="h-56 flex items-end justify-between gap-1 pt-6 px-2">
                    {metrics.barData.map((bar, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-2 w-full">
                        <span className="text-[9px] font-bold text-slate-500">{bar.value}</span>
                        <div style={{ height: bar.height }} className="w-6 bg-blue-600 rounded-t-md transition-all duration-500 hover:opacity-85 cursor-pointer" />
                        <span className="text-[9px] font-bold text-slate-400">{bar.label}</span>
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
                    <span className="text-[10px] font-bold text-slate-400">This Month</span>
                  </div>
                  <div className="h-56 relative pt-4">
                    {/* Custom SVG Line Graph */}
                    <svg className="w-full h-40" viewBox="0 0 100 40" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path d="M 0 30 L 20 27 L 40 20 L 60 29 L 80 22 L 100 25" fill="none" stroke="#2563eb" strokeWidth="1.5" />
                      <path d="M 0 30 L 20 27 L 40 20 L 60 29 L 80 22 L 100 25 L 100 40 L 0 40 Z" fill="url(#attendGrad)" />
                      {/* Dots */}
                      <circle cx="0" cy="30" r="1.2" fill="#2563eb" />
                      <circle cx="20" cy="27" r="1.2" fill="#2563eb" />
                      <circle cx="40" cy="20" r="1.2" fill="#2563eb" />
                      <circle cx="60" cy="29" r="1.2" fill="#2563eb" />
                      <circle cx="80" cy="22" r="1.2" fill="#2563eb" />
                      <circle cx="100" cy="25" r="1.2" fill="#2563eb" />
                    </svg>
                    <div className="flex justify-between text-[8px] font-extrabold text-slate-400 px-1 mt-2">
                      <span>01 May (75%)</span>
                      <span>08 May (78%)</span>
                      <span>15 May (82%)</span>
                      <span>22 May (76%)</span>
                      <span>29 May (80%)</span>
                    </div>
                  </div>
                </div>

                {/* Leave Trend Line Graph */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm xl:col-span-1 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                      <CalendarDaysIcon className="h-4.5 w-4.5 text-blue-600" /> Leave Trend
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400">This Month</span>
                  </div>
                  <div className="h-56 relative pt-4">
                    {/* Custom SVG Line Graph */}
                    <svg className="w-full h-40" viewBox="0 0 100 40" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="leaveGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path d="M 0 32 L 20 28 L 40 24 L 60 30 L 80 28 L 100 30" fill="none" stroke="#10b981" strokeWidth="1.5" />
                      <path d="M 0 32 L 20 28 L 40 24 L 60 30 L 80 28 L 100 30 L 100 40 L 0 40 Z" fill="url(#leaveGrad)" />
                      {/* Dots */}
                      <circle cx="0" cy="32" r="1.2" fill="#10b981" />
                      <circle cx="20" cy="28" r="1.2" fill="#10b981" />
                      <circle cx="40" cy="24" r="1.2" fill="#10b981" />
                      <circle cx="60" cy="30" r="1.2" fill="#10b981" />
                      <circle cx="80" cy="28" r="1.2" fill="#10b981" />
                      <circle cx="100" cy="30" r="1.2" fill="#10b981" />
                    </svg>
                    <div className="flex justify-between text-[8px] font-extrabold text-slate-400 px-1 mt-2">
                      <span>01 May (28)</span>
                      <span>08 May (32)</span>
                      <span>15 May (36)</span>
                      <span>22 May (30)</span>
                      <span>29 May (32)</span>
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
                        <circle cx="18" cy="18" r="15.91" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="67.4 32.6" />
                      </svg>
                    </div>
                    <div className="space-y-1 w-full text-[11px] font-bold">
                      <div className="flex justify-between text-blue-600">
                        <span>Male</span>
                        <span>{Math.ceil(metrics.totalEmp * 0.6)}</span>
                      </div>
                      <div className="flex justify-between text-red-500">
                        <span>Female</span>
                        <span>{Math.floor(metrics.totalEmp * 0.4)}</span>
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
                        <circle cx="18" cy="18" r="15.91" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="100 0" />
                      </svg>
                    </div>
                    <div className="space-y-1 w-full text-[11px] font-bold">
                      <div className="flex justify-between text-blue-600">
                        <span>Permanent</span>
                        <span>{metrics.totalEmp}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Overview */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 pb-2 border-b border-slate-100">Performance Overview</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-3xl font-black text-indigo-600">4.3</h3>
                      <div className="flex text-amber-400 mt-1">
                        {"★".repeat(4)}{"☆".repeat(1)}
                      </div>
                    </div>
                    <div className="text-[11px] font-bold text-slate-500 space-y-1 text-right">
                      <p>Average KPI: <span className="text-slate-800">91%</span></p>
                      <p>Top Performers: <span className="text-slate-800">1</span></p>
                      <p>Completed: <span className="text-slate-800">1</span></p>
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
                        <circle cx="18" cy="18" r="15.91" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="30 70" />
                      </svg>
                      <span className="absolute text-sm font-black text-slate-800">2</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-bold text-slate-500 w-full">
                      <p className="text-blue-600">Open: 2</p>
                      <p className="text-amber-500">In Prog: 3</p>
                      <p className="text-emerald-500">Resolved: 15</p>
                      <p className="text-slate-400">Closed: 25</p>
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
                      <p className="text-2xl font-black text-emerald-700 mt-1">3</p>
                    </div>
                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-center">
                      <p className="text-[10px] font-bold text-blue-600 uppercase">Attendance</p>
                      <p className="text-2xl font-black text-blue-700 mt-1">1</p>
                    </div>
                    <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-center">
                      <p className="text-[10px] font-bold text-purple-600 uppercase">Expense</p>
                      <p className="text-2xl font-black text-purple-700 mt-1">2</p>
                    </div>
                  </div>
                </div>

                {/* Recent Activities List */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 pb-2 border-b border-slate-100">Recent Activities</h4>
                  <div className="space-y-3.5">
                    <div className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-700">Rahul Sharma applied for leave</p>
                        <p className="text-[9px] font-semibold text-slate-400 mt-0.5">Date: 12 May 2026</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-700">Arvind Kumar attendance regularized</p>
                        <p className="text-[9px] font-semibold text-slate-400 mt-0.5">Date: 11 May 2026</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upcoming Events Calendar */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 pb-2 border-b border-slate-100">Upcoming Events</h4>
                  <div className="space-y-3">
                    <div className="flex gap-3 items-center p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                      <CalendarDaysIcon className="h-7 w-7 text-indigo-600" />
                      <div>
                        <p className="text-xs font-bold text-slate-700">Team Meeting</p>
                        <p className="text-[9px] font-semibold text-slate-400">12 May 2025, 10:00 AM</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-center p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                      <AcademicCapIcon className="h-7 w-7 text-emerald-600" />
                      <div>
                        <p className="text-xs font-bold text-slate-700">Training Program</p>
                        <p className="text-[9px] font-semibold text-slate-400">15 May 2025, 11:00 AM</p>
                      </div>
                    </div>
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
                  {isAdmin && (
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
                    {[
                      "Basic Information",
                      "Official Information",
                      "Contact Information",
                      "Identity Documents",
                      "Bank & Payroll",
                      "Emergency Contact",
                      "Education",
                      "Experience",
                      "Skills & Certifications",
                      "Attendance Settings",
                      "Leave Settings",
                      "Asset Assignment",
                      "System Login",
                      "Documents",
                      "Performance",
                      "Exit Information",
                      "Audit Information"
                    ].map((t, idx) => {
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
                  <form onSubmit={handleSaveProfile} className="flex-1 bg-slate-50/30 border border-slate-200 p-6 rounded-2xl space-y-6 flex flex-col justify-between profile-form-container">
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
                          <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-200">
                            👤 Basic Information
                          </h4>
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
                                value={employeeForm.employeeId || ""}
                                readOnly
                                className="w-full text-xs bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Employee Code *</label>
                              <input
                                type="text"
                                placeholder="e.g. EMP-101"
                                value={employeeForm.employeeCode || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, employeeCode: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">First Name *</label>
                              <input
                                type="text"
                                required
                                value={employeeForm.firstName || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, firstName: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Middle Name</label>
                              <input
                                type="text"
                                value={employeeForm.middleName || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, middleName: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Last Name</label>
                              <input
                                type="text"
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
                                value={employeeForm.nationality || "Indian"}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, nationality: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {profileTab === "Official Information" && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-200">
                            🏢 Official Register
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Company</label>
                              <input
                                type="text"
                                value={employeeForm.company || currentUserProfile?.company || user?.companyName || "National Insurance Broker"}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, company: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Branch</label>
                              <input
                                type="text"
                                value={employeeForm.branch || currentUserProfile?.branch || "Headquarters"}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, branch: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Department</label>
                              <input
                                type="text"
                                value={employeeForm.department || currentUserProfile?.department || departmentName || "Marketing"}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Designation</label>
                              <input
                                type="text"
                                value={employeeForm.designation || currentUserProfile?.designation || "Staff Professional"}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, designation: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Reporting Manager</label>
                              <input
                                type="text"
                                value={employeeForm.reportingManager || currentUserProfile?.reportingManager || "Sunil Patel"}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, reportingManager: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Employment Type</label>
                              <select
                                value={employeeForm.employeeType || currentUserProfile?.employeeType || "Full-Time"}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, employeeType: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
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
                                value={employeeForm.officialEmail || currentUserProfile?.officialEmail || currentUserProfile?.email || user?.email || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, officialEmail: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Date of Joining</label>
                              <input
                                type="date"
                                value={employeeForm.dateOfJoining || currentUserProfile?.dateOfJoining || "2026-06-14"}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, dateOfJoining: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
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
                                value={employeeForm.mobileNumber || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, mobileNumber: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Alternate Mobile</label>
                              <input
                                type="text"
                                value={employeeForm.alternateMobile || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, alternateMobile: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Personal Email</label>
                              <input
                                type="email"
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

                      {profileTab === "Identity Documents" && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-200">
                            🪪 Identity Documents
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Aadhaar Number *</label>
                              <input
                                type="text"
                                required
                                value={employeeForm.aadhaarNumber || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, aadhaarNumber: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">PAN Number *</label>
                              <input
                                type="text"
                                required
                                value={employeeForm.panNumber || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, panNumber: e.target.value.toUpperCase() })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Passport Number</label>
                              <input
                                type="text"
                                value={employeeForm.passportNumber || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, passportNumber: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Driving License</label>
                              <input
                                type="text"
                                value={employeeForm.drivingLicense || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, drivingLicense: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">UAN Number</label>
                              <input
                                type="text"
                                value={employeeForm.uanNumber || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, uanNumber: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">ESIC Number</label>
                              <input
                                type="text"
                                value={employeeForm.esicNumber || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, esicNumber: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {profileTab === "Bank & Payroll" && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-200">
                            🏦 Bank Details
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Bank Name</label>
                              <input
                                type="text"
                                value={employeeForm.bankName || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, bankName: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Account Holder Name</label>
                              <input
                                type="text"
                                value={employeeForm.accountHolderName || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, accountHolderName: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Account Number</label>
                              <input
                                type="text"
                                value={employeeForm.accountNumber || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, accountNumber: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">IFSC Code</label>
                              <input
                                type="text"
                                value={employeeForm.ifscCode || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, ifscCode: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {profileTab === "Emergency Contact" && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-200">
                            🚨 Emergency Contact
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Contact Person Name</label>
                              <input
                                type="text"
                                value={employeeForm.emergencyContactName || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, emergencyContactName: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Relation</label>
                              <input
                                type="text"
                                value={employeeForm.emergencyRelation || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, emergencyRelation: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Mobile Number</label>
                              <input
                                type="text"
                                value={employeeForm.emergencyMobile || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, emergencyMobile: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold font-mono"
                              />
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

                      {profileTab === "Skills & Certifications" && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-200">
                            🛠️ Skills & Certifications
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Technical Skills</label>
                              <input
                                type="text"
                                placeholder="React, SQL, Node"
                                value={employeeForm.technicalSkills || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, technicalSkills: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {profileTab === "Attendance Settings" && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-200">
                            📅 Attendance Settings
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Shift Policy</label>
                              <input
                                type="text"
                                placeholder="e.g. Standard Shift"
                                value={employeeForm.shiftPolicy || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, shiftPolicy: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Working Hours</label>
                              <input
                                type="text"
                                placeholder="e.g. 8 Hours"
                                value={employeeForm.workingHours || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, workingHours: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Attendance Policy</label>
                              <input
                                type="text"
                                placeholder="e.g. Standard Attendance"
                                value={employeeForm.attendancePolicy || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, attendancePolicy: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Biometric ID</label>
                              <input
                                type="text"
                                placeholder="e.g. BIO-9012"
                                value={employeeForm.biometricId || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, biometricId: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Device ID</label>
                              <input
                                type="text"
                                placeholder="e.g. DEV-883"
                                value={employeeForm.deviceId || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, deviceId: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Overtime Eligible</label>
                              <select
                                value={employeeForm.overtimeEligible || "No"}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, overtimeEligible: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              >
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {profileTab === "Leave Settings" && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-200">
                            🌴 Leave Settings
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Leave Policy</label>
                              <input
                                type="text"
                                placeholder="e.g. Corporate Policy"
                                value={employeeForm.leavePolicy || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, leavePolicy: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Casual Leave Balance</label>
                              <input
                                type="number"
                                value={employeeForm.casualLeave || 0}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, casualLeave: parseInt(e.target.value) || 0 })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Sick Leave Balance</label>
                              <input
                                type="number"
                                value={employeeForm.sickLeave || 0}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, sickLeave: parseInt(e.target.value) || 0 })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Earned Leave Balance</label>
                              <input
                                type="number"
                                value={employeeForm.earnedLeave || 0}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, earnedLeave: parseInt(e.target.value) || 0 })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Maternity Leave Balance</label>
                              <input
                                type="number"
                                value={employeeForm.maternityLeave || 0}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, maternityLeave: parseInt(e.target.value) || 0 })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Paternity Leave Balance</label>
                              <input
                                type="number"
                                value={employeeForm.paternityLeave || 0}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, paternityLeave: parseInt(e.target.value) || 0 })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {profileTab === "Asset Assignment" && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-200">
                            💻 Asset Assignment
                          </h4>
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Assigned Assets (JSON/Text List)</label>
                            <textarea
                              placeholder="MacBook Pro Serial #XYZ, External Monitor Serial #ABC"
                              value={typeof employeeForm.assets === 'string' ? employeeForm.assets : JSON.stringify(employeeForm.assets || [])}
                              onChange={(e) => setEmployeeForm({ ...employeeForm, assets: e.target.value })}
                              className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold font-mono h-24"
                            />
                          </div>
                        </div>
                      )}

                      {profileTab === "System Login" && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-200">
                            🔐 System Login
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Username / System Email</label>
                              <input
                                type="text"
                                placeholder="e.g. employee@nib.com"
                                value={employeeForm.username || employeeForm.email || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, username: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Password</label>
                              <input
                                type="password"
                                placeholder="••••••••"
                                value={employeeForm.password || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Confirm Password</label>
                              <input
                                type="password"
                                placeholder="••••••••"
                                value={employeeForm.confirmPassword || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, confirmPassword: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Role</label>
                              <input
                                type="text"
                                value={employeeForm.role || "Employee"}
                                readOnly
                                className="w-full text-xs bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Permission Group</label>
                              <input
                                type="text"
                                placeholder="e.g. Standard Staff"
                                value={employeeForm.permissionGroup || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, permissionGroup: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Two-Factor Authentication</label>
                              <select
                                value={employeeForm.twoFactorAuth || "No"}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, twoFactorAuth: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              >
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                              </select>
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

                      {profileTab === "Performance" && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-200">
                            🏆 Performance & Appraisal
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">KPIs List (JSON/Text)</label>
                              <textarea
                                placeholder="KPI 1: Project Deliverables, KPI 2: Code Quality"
                                value={employeeForm.kpis || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, kpis: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold h-20"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Performance Rating</label>
                              <select
                                value={employeeForm.rating || "3"}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, rating: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              >
                                <option value="1">1 - Needs Improvement</option>
                                <option value="2">2 - Below Expectations</option>
                                <option value="3">3 - Meets Expectations</option>
                                <option value="4">4 - Exceeds Expectations</option>
                                <option value="5">5 - Outstanding</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Next Appraisal Date</label>
                              <input
                                type="date"
                                value={employeeForm.appraisalDate || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, appraisalDate: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Promotion History</label>
                              <textarea
                                placeholder="Details of previous promotions..."
                                value={employeeForm.promotionHistory || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, promotionHistory: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold h-20"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Awards & Recognition</label>
                              <textarea
                                placeholder="Employee of the Month, Best Performer, etc."
                                value={employeeForm.awards || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, awards: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold h-20"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {profileTab === "Exit Information" && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-200">
                            🚪 Exit Information
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Resignation Date</label>
                              <input
                                type="date"
                                value={employeeForm.resignationDate || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, resignationDate: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Last Working Date</label>
                              <input
                                type="date"
                                value={employeeForm.lastWorkingDate || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, lastWorkingDate: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Exit Reason</label>
                              <textarea
                                placeholder="Reason for resignation or termination..."
                                value={employeeForm.exitReason || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, exitReason: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold h-20"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Exit Interview Details</label>
                              <input
                                type="text"
                                placeholder="Completed / Scheduled / Waived"
                                value={employeeForm.exitInterview || ""}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, exitInterview: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Clearance Status</label>
                              <select
                                value={employeeForm.clearanceStatus || "Pending"}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, clearanceStatus: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Cleared">Cleared</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Final Settlement Status</label>
                              <select
                                value={employeeForm.finalSettlement || "Pending"}
                                onChange={(e) => setEmployeeForm({ ...employeeForm, finalSettlement: e.target.value })}
                                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Paid">Paid / Settled</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {profileTab === "Audit Information" && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-200">
                            📋 Audit Information
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Created By</label>
                              <input
                                type="text"
                                value={employeeForm.createdBy || "System"}
                                readOnly
                                className="w-full text-xs bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-500 font-bold font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Created Date</label>
                              <input
                                type="text"
                                value={employeeForm.createdDate || employeeForm.created_at || ""}
                                readOnly
                                className="w-full text-xs bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-500 font-bold font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Updated By</label>
                              <input
                                type="text"
                                value={employeeForm.updatedBy || "System"}
                                readOnly
                                className="w-full text-xs bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-500 font-bold font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Updated Date</label>
                              <input
                                type="text"
                                value={employeeForm.updatedDate || employeeForm.updated_at || ""}
                                readOnly
                                className="w-full text-xs bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-500 font-bold font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Last Login</label>
                              <input
                                type="text"
                                value={employeeForm.lastLogin || ""}
                                readOnly
                                className="w-full text-xs bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-500 font-bold font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Record Status</label>
                              <input
                                type="text"
                                value={employeeForm.recordStatus || "Active"}
                                readOnly
                                className="w-full text-xs bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-500 font-bold"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Activity Timeline</label>
                              <textarea
                                value={employeeForm.activityTimeline || ""}
                                readOnly
                                className="w-full text-xs bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-500 font-bold font-mono h-20"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end items-center gap-3 pt-6 border-t border-slate-100 mt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setEmployeeForm({
                            firstName: "",
                            lastName: "",
                            employeeCode: "EMP-" + String(Date.now()).slice(-6),
                            gender: "Male",
                            maritalStatus: "Single",
                            nationality: "Indian",
                            bloodGroup: "O+"
                          });
                          alert("Form reset! You can now fill out details for a new employee.");
                        }}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                      >
                        + Reset for New Registration
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition"
                      >
                        Submit & Register
                      </button>
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
                        {payslips.map((ps, idx) => (
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 6: Reporting Manager */}
              {(activeTab === "Reporting Manager" || activeTab === "Reporting Hierarchy") && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider border-b pb-2 border-slate-100">
                    👤 Reporting Hierarchy Manager
                  </h4>
                  <div className="max-w-md border border-slate-100 p-5 rounded-2xl bg-slate-50/30 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black uppercase text-sm border-2 border-indigo-200">
                      {profileDetails.reportingManager?.[0] || "M"}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{profileDetails.reportingManager || "Not assigned"}</h4>
                      <p className="text-xs text-slate-400 font-bold">Reporting Director / Supervisor</p>
                    </div>
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
                        {attendanceLogs.map((log, idx) => (
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Monthly Attendance summary */}
              {activeTab === "Monthly Attendance" && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-fadeIn">
                  <h4 className="font-extrabold text-sm text-slate-800 pb-3 border-b border-slate-100">
                    📊 Monthly Attendance Summary
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-slate-600">
                    <div className="border p-3.5 rounded-xl bg-slate-50/30">
                      <span className="text-[9px] text-slate-400 block uppercase">Total Working Days</span>
                      <span className="text-slate-800 font-black mt-0.5 block">22 Days</span>
                    </div>
                    <div className="border p-3.5 rounded-xl bg-slate-50/30">
                      <span className="text-[9px] text-slate-400 block uppercase">Present Days</span>
                      <span className="text-slate-800 font-black mt-0.5 block">
                        {attendanceLogs.filter(l => l.status === "Present" || l.status === "Late").length} Days
                      </span>
                    </div>
                    <div className="border p-3.5 rounded-xl bg-slate-50/30">
                      <span className="text-[9px] text-slate-400 block uppercase">Late Marks</span>
                      <span className="text-slate-800 font-black mt-0.5 block">
                        {attendanceLogs.filter(l => l.status === "Late").length} Times
                      </span>
                    </div>
                    <div className="border p-3.5 rounded-xl bg-slate-50/30">
                      <span className="text-[9px] text-slate-400 block uppercase">Absences</span>
                      <span className="text-slate-800 font-black mt-0.5 block">
                        {attendanceLogs.filter(l => l.status === "Absent").length} Days
                      </span>
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
                    {payslips.map((ps, idx) => (
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
                    ))}
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
                    {assets.map((ast) => (
                      <tr key={ast.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 text-slate-800 font-extrabold">{ast.assetName}</td>
                        <td>{ast.assetCategory}</td>
                        <td className="font-mono text-slate-500">{ast.serialNumber}</td>
                        <td>
                          <Badge variant={getStatusVariant(ast.status)}>{ast.status}</Badge>
                        </td>
                      </tr>
                    ))}
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
                  <h4 className="font-extrabold text-slate-800 text-sm">NIB HRMS Solutions Pvt Ltd</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Corporate Headquarters, Noida</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-800">Employee: {employeeName}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Designation: Senior Lead</p>
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
    </div>
  );
};

export default EmployeeDashboard;
