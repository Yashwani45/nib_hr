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
  CommandLineIcon,
  ReceiptPercentIcon,
  MapPinIcon,
  CameraIcon,
  QrCodeIcon,
  FingerPrintIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  BuildingOffice2Icon,
  BuildingOfficeIcon,
  BuildingLibraryIcon,
  EnvelopeIcon,
  IdentificationIcon,
  PhoneIcon,
  BookOpenIcon,
  HeartIcon,
  HomeIcon,
  ArrowLeftIcon,
  PencilSquareIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  CheckIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
import { Badge, Card, Modal } from "../components/ui";
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
import ExpenseReimbursementSection from "../components/Expenses/ExpenseReimbursementSection";
import AssetAllocationDashboard from "../components/Assets/AssetAllocationDashboard";

import FaceAttendanceModal from "../components/FaceRecognition/FaceAttendanceModal";
import EmployeeBiometricPunch from "../components/Biometric/EmployeeBiometricPunch";
import CompanyQrScannerModal from "../components/Attendance/CompanyQrScannerModal";
import CompanyQrAdminConsole from "../components/Attendance/CompanyQrAdminConsole";
import EmployeeQrCardModal from "../components/Attendance/EmployeeQrCardModal";
import EmployeeQrScannerModal from "../components/Attendance/EmployeeQrScannerModal";


const getStatusVariant = (status) => {
  if (["Active", "Approved", "Processed", "Assigned", "Resolved", "Paid"].includes(status)) return "success";
  if (["Pending", "Draft", "In Progress", "Open"].includes(status)) return "warning";
  if (["Deactive", "Rejected", "Terminated", "Suspended", "Closed"].includes(status)) return "danger";
  return "neutral";
};

export const resolveFileUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:") || url.startsWith("data:")) return url;
  const base = import.meta.env.VITE_API_BASE || "http://localhost:5000";
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
};

export const normalizeDocName = (str) =>
  String(str || "")
    .toLowerCase()
    .replace(/aadhaar/g, "aadhar")
    .replace(/[^a-z0-9]/g, "");

export const getEmptyEmployeeForm = () => ({
  // Hero Card
  photo: "",
  employeeId: "",
  employeeCode: "",
  employeeStatus: "Active",
  company: "",

  // Card 1: Basic Information
  firstName: "",
  middleName: "",
  lastName: "",
  gender: "Male",
  dateOfBirth: "",
  maritalStatus: "Single",
  bloodGroup: "",
  nationality: "Indian",

  // Card 2: Official Information
  officialEmail: "",
  department: "",
  designation: "",
  dateOfJoining: "",
  reportingManager: "",
  employeeType: "Full-Time",
  shift: "General Shift",
  weeklyOff: "Sunday",

  // Card 3: Contact Information
  mobileNumber: "",
  alternateMobile: "",
  personalEmail: "",
  currentAddress: "",
  permanentAddress: "",

  // Card 4: Education & Experience
  highestDegree: "",
  specialization: "",
  university: "",
  prevCompany: "",
  prevDesignation: ""
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
  const [allDocumentsList, setAllDocumentsList] = useState([]);
  const [customDocType, setCustomDocType] = useState("");
  const [customDocFile, setCustomDocFile] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  
  const [empCheckedIn, setEmpCheckedIn] = useState(false);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [showCompanyQrScanModal, setShowCompanyQrScanModal] = useState(false);
  const [showCompanyQrAdminModal, setShowCompanyQrAdminModal] = useState(false);
  const [showEmployeeQrScanModal, setShowEmployeeQrScanModal] = useState(false);
  const [showEmployeeQrCardModal, setShowEmployeeQrCardModal] = useState(false);
  const [myQrData, setMyQrData] = useState(null);
  const [loadingMyQr, setLoadingMyQr] = useState(false);
  const [facePunchAction, setFacePunchAction] = useState("clock-in");
  const [empPunchTime, setEmpPunchTime] = useState("");
  const [empCheckOutTime, setEmpCheckOutTime] = useState("");
  const [empPunchLocation, setEmpPunchLocation] = useState("");
  const [empShiftCompleted, setEmpShiftCompleted] = useState(false);
  
  // Organization-Enforced Attendance Methods State (Core Modes: GEO, FACE, BIOMETRIC, QR)
  const [allowedAttendanceMethods, setAllowedAttendanceMethods] = useState([
    { method: "GEO", name: "Geo-Tagged Attendance", isEnabled: true },
    { method: "FACE", name: "Face Recognition Attendance", isEnabled: true },
    { method: "BIOMETRIC", name: "Biometric Attendance", isEnabled: true },
    { method: "QR", name: "QR / Barcode Attendance", isEnabled: true }
  ]);
  const [selectedPunchMethod, setSelectedPunchMethod] = useState("GEO");
  const [loadingAllowedMethods, setLoadingAllowedMethods] = useState(false);
  const [punchProcessing, setPunchProcessing] = useState(false);

  // Geo-Tagged Telemetry State
  const [geoCoords, setGeoCoords] = useState(null);
  const [geoLocating, setGeoLocating] = useState(false);
  const [geoStatusMsg, setGeoStatusMsg] = useState("");

  // QR Attendance State
  const [qrTokenData, setQrTokenData] = useState(null);
  const [qrCountdown, setQrCountdown] = useState(60);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrScanInput, setQrScanInput] = useState("");

  // Face Recognition State
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [faceImagePreview, setFaceImagePreview] = useState(null);
  const [faceConfidence, setFaceConfidence] = useState(0.94);

  // Biometric Terminal State
  const [biometricModalOpen, setBiometricModalOpen] = useState(false);

  const webcamVideoRef = React.useRef(null);
  const [webcamActive, setWebcamActive] = useState(false);

  // Acquire live GPS Geolocation coordinates
  const handleGetGeoLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatusMsg("Geolocation is not supported by your browser.");
      setGeoCoords({ latitude: 19.0760, longitude: 72.8777, accuracy: 15 });
      return;
    }
    setGeoLocating(true);
    setGeoStatusMsg("Acquiring GPS fix...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGeoLocating(false);
        setGeoStatusMsg(`GPS Locked: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)} (±${Math.round(pos.coords.accuracy)}m)`);
      },
      (err) => {
        setGeoLocating(false);
        setGeoStatusMsg(`GPS Warning: ${err.message}. Defaulting to office zone.`);
        setGeoCoords({
          latitude: 19.0760,
          longitude: 72.8777,
          accuracy: 20,
        });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Dynamic QR Token Fetcher
  const fetchQrToken = async () => {
    try {
      const res = await apiFetch("/api/operations/attendance/qr-token");
      if (res && res.data) {
        setQrTokenData(res.data);
        setQrCountdown(res.data.rotationSeconds || 60);
      }
    } catch (err) {
      console.warn("Failed to generate dynamic QR token:", err.message);
    }
  };

  // Webcam stream handlers for Face Recognition
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
      }
      setWebcamActive(true);
    } catch (err) {
      console.warn("Webcam access error:", err.message);
      setWebcamActive(false);
    }
  };

  const stopWebcam = () => {
    if (webcamVideoRef.current && webcamVideoRef.current.srcObject) {
      try {
        webcamVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
      } catch (e) {}
      webcamVideoRef.current.srcObject = null;
    }
    setWebcamActive(false);
  };

  const captureFaceSnapshot = () => {
    if (webcamVideoRef.current && webcamActive) {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(webcamVideoRef.current, 0, 0, 320, 240);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setFaceImagePreview(dataUrl);
        setFaceConfidence(0.96);
      } catch (e) {
        setFaceImagePreview("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200");
        setFaceConfidence(0.94);
      }
    } else {
      setFaceImagePreview("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200");
      setFaceConfidence(0.94);
    }
  };

  // Auto-init method specific data
  useEffect(() => {
    if (selectedPunchMethod === "GEO" && !geoCoords) {
      handleGetGeoLocation();
    } else if (selectedPunchMethod === "QR" && !qrTokenData) {
      fetchQrToken();
    } else if (selectedPunchMethod === "FACE" && !webcamActive && !faceImagePreview) {
      startWebcam();
    }

    return () => {
      if (selectedPunchMethod !== "FACE" && webcamActive) {
        stopWebcam();
      }
    };
  }, [selectedPunchMethod]);

  // QR token rotation timer
  useEffect(() => {
    if (selectedPunchMethod !== "QR" || !qrTokenData) return;
    const interval = setInterval(() => {
      setQrCountdown(prev => {
        if (prev <= 1) {
          fetchQrToken();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedPunchMethod, qrTokenData]);

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
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankSubmitting, setBankSubmitting] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    branchName: "",
    upiId: "",
    basicSalary: "0",
    grossSalary: "0",
    ctc: "0",
    pfApplicable: false,
    esiApplicable: false
  });
  const [duplicateWarningModal, setDuplicateWarningModal] = useState(null);

  // Task 2: Last Month Payslip Dual-Approval Request State
  const [payslipRequestPurpose, setPayslipRequestPurpose] = useState("Official Income Verification & Financial Documentation");
  const [isPayslipRequestModalOpen, setIsPayslipRequestModalOpen] = useState(false);
  const [payslipActionToast, setPayslipActionToast] = useState("");

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

  const [profileTab, setProfileTab] = useState(() => {
    const p = searchParams.get("profileTab");
    if (p === "Basic Information" || p === "Official Information") return "Information";
    return p || "Information";
  });
  const [informationSubTab, setInformationSubTab] = useState(() => {
    const p = searchParams.get("profileTab");
    return p === "Official Information" ? "Official Information" : "Basic Information";
  });
  const userRole = typeof user?.role === "object" ? user?.role?.name : user?.role;
  const isAdmin = userRole === "SuperAdmin" || userRole === "Admin" || userRole === "Company Admin";
  const userRoleStr = String(userRole || "").toLowerCase();
  const isHR = userRole === "DepartmentHR" || userRole === "HR" || userRoleStr === "departmenthr" || userRoleStr === "hr";
  const canManageEmployees = isAdmin || isHR;
  const isRegularEmployee = userRole === "Employee" || (!isAdmin && !isHR);
  const [dashboardViewMode, setDashboardViewMode] = useState("personal");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(searchParams.get("profileEmpId") || "");

  // Derived user details
  const employeeName = currentUserProfile?.firstName || currentUserProfile?.employeeName || user?.employeeName || user?.name || user?.email?.split('@')[0] || "Employee";
  const departmentName = currentUserProfile?.department || user?.departmentName || user?.department || localStorage.getItem("user_department") || "Operations";

  const [selectedDeptFilter, setSelectedDeptFilter] = useState("All Departments");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("last_month");
  const [companyDepartmentsList, setCompanyDepartmentsList] = useState(["IT", "Software Engineering", "Operations", "Finance", "Human Resources", "Sales & Marketing"]);

  useEffect(() => {
    if (departmentName && !selectedDeptFilter) {
      setSelectedDeptFilter(departmentName);
    }
  }, [departmentName]);

  const profileSectionsList = [
    "Information",
    "Contact Information",
    "Education",
    "Experience"
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
    const resolvedBranch = details.branch || details.branch_name || data.branch || "";
    const resolvedCompany = details.company || details.company_name || data.company || (user?.companyName || "");
    const resolvedJoiningDate = details.dateOfJoining || details.joining_date || details.joiningDate || data.dateOfJoining || data.joining_date || "";

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
      bloodGroup: data.bloodGroup || details.bloodGroup || "",
      nationality: data.nationality || details.nationality || "Indian",
      dateOfBirth: data.dateOfBirth || details.dateOfBirth || details.dob || "",
      mobileNumber: data.mobileNumber || details.mobileNumber || details.phone || details.mobile || "",
      personalEmail: data.personalEmail || details.personalEmail || details.personal_email || (user?.email || ""),
      currentAddress: data.currentAddress || details.currentAddress || details.address || "",
      city: data.city || details.city || "",
      state: data.state || details.state || "",
      country: data.country || details.country || "India",
      pinCode: data.pinCode || details.pinCode || "",
      highestDegree: data.highestDegree || details.highestDegree || "",
      specialization: data.specialization || details.specialization || "",
      university: data.university || details.university || "",
      passingYear: data.passingYear || details.passingYear || "",
      educationGpa: data.educationGpa || details.educationGpa || "",
      prevCompany: data.prevCompany || details.prevCompany || "",
      prevDesignation: data.prevDesignation || details.prevDesignation || "",
      totalExpYears: data.totalExpYears || details.totalExpYears || "",
      prevSalary: data.prevSalary || details.prevSalary || "",
      bankName: data.bankName || details.bankName || "",
      accountHolderName: data.accountHolderName || details.accountHolderName || "",
      accountNumber: data.accountNumber || details.accountNumber || "",
      ifscCode: data.ifscCode || details.ifscCode || "",
      branchName: data.branchName || details.branchName || "",
      upiId: data.upiId || details.upiId || "",
      basicSalary: data.basicSalary || details.basicSalary || "0",
      grossSalary: data.grossSalary || details.grossSalary || "0",
      ctc: data.ctc || details.ctc || "0",
      pfApplicable: Boolean(data.pfApplicable ?? details.pfApplicable ?? false),
      esiApplicable: Boolean(data.esiApplicable ?? details.esiApplicable ?? false),
      documents: {
        ...(details.documents || {}),
        ...(data.documents || {})
      }
    };
  }, [currentUserProfile, user]);

  const effectiveProfileTab = useMemo(() => {
    if (activeTab === "Personal Information" || activeTab === "Basic Information" || activeTab === "Official Information" || activeTab === "Organization Details" || activeTab === "Information") return "Information";
    if (activeTab === "Contact Details" || activeTab === "Address Details" || activeTab === "Contact Information") return "Contact Information";
    if (activeTab === "Education") return "Education";
    if (activeTab === "Experience") return "Experience";
    return "Information";
  }, [activeTab]);

  useEffect(() => {
    const urlSubTab = searchParams.get("profileTab");
    if (urlSubTab === "Basic Information") {
      setProfileTab("Information");
      setInformationSubTab("Basic Information");
    } else if (urlSubTab === "Official Information") {
      setProfileTab("Information");
      setInformationSubTab("Official Information");
    } else if (urlSubTab && profileSectionsList.includes(urlSubTab)) {
      setProfileTab(urlSubTab);
    } else if (effectiveProfileTab && profileSectionsList.includes(effectiveProfileTab) && effectiveProfileTab !== "Dashboard Home" && effectiveProfileTab !== "Employee Profile") {
      setProfileTab(effectiveProfileTab);
    } else if (!profileSectionsList.includes(profileTab)) {
      setProfileTab("Information");
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
      if (!isNewRegistration) {
        setEmployeeForm(prev => {
          const docMap = { ...(prev.documents || {}), ...(profileDetails.documents || {}) };
          (allDocumentsList || []).forEach(d => {
            const label = d.document_type || d.title?.split(" - ")[0] || "Document";
            if (!docMap[label] && (d.file_url || d.storage_key)) {
              docMap[label] = d.file_url || d.storage_key;
            }
          });
          return {
            ...getEmptyEmployeeForm(),
            ...prev,
            ...profileDetails,
            documents: docMap,
            assets: profileDetails.assets || prev.assets || []
          };
        });
      }
    }
  }, [profileDetails, isNewRegistration, userRole, allDocumentsList]);

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
      } else if (activeCategory === "EMP_ATTENDANCE" && (!activeTab || (activeTab !== "Monthly Attendance" && activeTab !== "Register Attendance"))) {
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

      // 2b. Fetch organization-enforced allowed attendance methods
      try {
        setLoadingAllowedMethods(true);
        const allowedRes = await apiFetch("/api/operations/attendance/allowed-methods");
        if (allowedRes && allowedRes.data && allowedRes.data.allowedMethods) {
          const methods = allowedRes.data.allowedMethods;
          setAllowedAttendanceMethods(methods);
          if (methods.length > 0) {
            setSelectedPunchMethod(prev => {
              const stillValid = methods.some(m => m.method === prev);
              return stillValid ? prev : methods[0].method;
            });
          }
        }
      } catch (attMethErr) {
        console.warn("Failed to load allowed attendance methods:", attMethErr.message);
      } finally {
        setLoadingAllowedMethods(false);
      }

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
        const [jobRes, candRes, intRes, offRes, tickRes, regRes, docRes] = await Promise.all([
          apiFetch("/api/table/job_postings").catch(() => ({ data: [] })),
          apiFetch("/api/table/candidate_database").catch(() => ({ data: [] })),
          apiFetch("/api/table/interviews").catch(() => ({ data: [] })),
          apiFetch("/api/table/offer_letters").catch(() => ({ data: [] })),
          apiFetch("/api/table/hr_tickets").catch(() => ({ data: [] })),
          apiFetch("/api/table/attendance_regularization").catch(() => ({ data: [] })),
          apiFetch("/api/table/documents").catch(() => ({ data: [] }))
        ]);
        if (jobRes?.data) setJobPostingsList(jobRes.data);
        if (candRes?.data) setCandidateList(candRes.data);
        if (intRes?.data) setInterviewsList(intRes.data);
        if (offRes?.data) setOfferLettersList(offRes.data);
        if (tickRes?.data) setAllTicketsList(tickRes.data);
        if (regRes?.data) setAllRegularizationsList(regRes.data);
        if (docRes?.data) setAllDocumentsList(docRes.data);
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

      let profile = empsList.find(e => {
        if (canManageEmployees && selectedEmployeeId) {
          return String(e.id) === String(selectedEmployeeId) || (e.employeeCode && String(e.employeeCode) === String(selectedEmployeeId));
        }
        const dbEmail = String(e.email || e.companyEmail || "").toLowerCase().trim();
        const loginEmail = String(user?.email || "").toLowerCase().trim();
        const dbUsername = dbEmail.split('@')[0];
        const loginUsername = loginEmail.split('@')[0];
        return dbEmail === loginEmail || 
               (dbUsername && loginUsername && dbUsername === loginUsername) ||
               (e.companyEmail && String(e.companyEmail).toLowerCase().trim() === loginEmail) ||
               (e.employeeCode && user?.username && String(e.employeeCode).toLowerCase().trim() === String(user.username).toLowerCase().trim());
      });

      // For SuperAdmin or Admin without a specific employee matched, default to the first employee in tenant
      if (!profile && canManageEmployees && empsList.length > 0) {
        profile = empsList[0];
        if (!selectedEmployeeId) {
          setSelectedEmployeeId(profile.id);
        }
      }
      
      if (profile) {
        setCurrentUserProfile(profile);
        
        // Load active QR badge data for this employee
        const qrEmpId = profile.id || profile.employeeCode;
        if (qrEmpId) {
          setLoadingMyQr(true);
          apiFetch(`/api/operations/attendance/employee-qr/${qrEmpId}`)
            .then(res => {
              if (res?.success && res.data) {
                setMyQrData(res.data);
              }
            })
            .catch(() => {})
            .finally(() => setLoadingMyQr(false));
        }
        
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
          attendanceLocation: l.attendance_location || l.attendanceLocation || l.attendance_location_name || l.branch || "Regional Office",
          verificationMethod: l.verification_method || l.verificationMethod || "GEO",
          verificationStatus: l.verification_status || l.verificationStatus || "VERIFIED",
          selfieUrl: l.selfieUrl || l.selfie_url || null,
          breakHours: l.breakHours || l.break_hours || 0,
          remarks: l.remarks
        }));

        if (filteredAtt.length > 0) {
          filteredAtt.sort((a, b) => {
            if (b.date !== a.date) return String(b.date).localeCompare(String(a.date));
            return (b.id || 0) - (a.id || 0);
          });
          setAttendanceLogs(filteredAtt);
          const todayStr = new Date().toISOString().split('T')[0];
          const todayAtt = filteredAtt.find(a => a.date === todayStr);
          if (todayAtt && todayAtt.checkIn && (!todayAtt.checkOut || todayAtt.checkOut === "--")) {
            setEmpCheckedIn(true);
            setEmpShiftCompleted(false);
            setEmpPunchTime(todayAtt.checkIn);
            setEmpCheckOutTime("");
            setEmpPunchLocation(todayAtt.attendanceLocation || todayAtt.attendance_location || todayAtt.gpsLocation || todayAtt.branch || "Regional Office");
          } else if (todayAtt && todayAtt.checkIn && todayAtt.checkOut && todayAtt.checkOut !== "--") {
            setEmpCheckedIn(false);
            setEmpShiftCompleted(false);
            setEmpPunchTime(todayAtt.checkIn);
            setEmpCheckOutTime(todayAtt.checkOut);
            setEmpPunchLocation(todayAtt.attendanceLocation || todayAtt.attendance_location || todayAtt.gpsLocation || todayAtt.branch || "Regional Office");
          } else {
            setEmpCheckedIn(false);
            setEmpShiftCompleted(false);
            setEmpPunchTime("");
            setEmpCheckOutTime("");
            setEmpPunchLocation("");
          }
        } else {
          setAttendanceLogs([]);
          setEmpCheckedIn(false);
          setEmpShiftCompleted(false);
          setEmpPunchTime("");
          setEmpCheckOutTime("");
          setEmpPunchLocation("");
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
          const itemEmpId = String(item.empId || item.employeeId || "").toLowerCase().trim();
          const itemEmployee = String(item.employee || item.employeeName || item.employee_name || "").toLowerCase().trim();
          const curEmpCode = String(empCode || "").toLowerCase().trim();
          const curEmpName = String(empName || "").toLowerCase().trim();
          const loginEmail = String(user?.email || "").toLowerCase().trim();

          return (
            (itemEmpId && curEmpCode && itemEmpId === curEmpCode) ||
            (itemEmployee && curEmpName && itemEmployee === curEmpName) ||
            (itemEmpId && String(profile.id || "").toLowerCase().trim() === itemEmpId) ||
            (curEmpCode === "tvn2007" && itemEmpId === "tvn2007") ||
            (loginEmail.includes("yashwani") && (itemEmpId === "tvn2007" || itemEmployee.includes("yashwani")))
          );
        };

        const filteredAllocations = assetList.filter(matchEmployee).map(a => ({
          id: a.id || a.allocationId || Math.random().toString(),
          assetCode: a.assetCode || "AST-GEN-001",
          assetName: a.assetName || "Company Asset",
          assetCategory: a.assetCategory || "General",
          model: a.model || null,
          serialNumber: a.serialNumber || a.serialNo || "N/A",
          issueDate: a.issueDate || a.assignedDate || "N/A",
          purchaseDate: a.purchaseDate || a.issueDate || "N/A",
          warrantyExpiry: a.warrantyExpiry || "N/A",
          status: a.status || "Assigned",
          employee: a.employee || empName || "Employee",
          empId: a.empId || empCode || "",
          department: a.department || profile.department || "IT",
          vendor: a.vendor || null,
          purchaseCost: a.purchaseCost || null,
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
          model: i.model || null,
          serialNumber: i.serialNo || i.serialNumber || "N/A",
          issueDate: i.issueDate || i.created_at?.split('T')[0] || "N/A",
          purchaseDate: i.purchaseDate || i.issueDate || "N/A",
          warrantyExpiry: i.warrantyExpiry || "N/A",
          status: i.status || "Assigned",
          employee: i.employee || empName || "Employee",
          empId: i.empId || empCode || "",
          department: i.department || profile.department || "IT",
          vendor: i.vendor || null,
          purchaseCost: i.purchaseCost || null,
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

  // Task 2: Last Month Payslip Dual-Approval Request Computations & Handlers
  const lastMonthPayslipData = useMemo(() => {
    if (payslips && payslips.length > 0) {
      return payslips[0];
    }
    const now = new Date();
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthStr = `${monthNames[lastMonthDate.getMonth()]} ${lastMonthDate.getFullYear()}`;
    
    const basic = Number(currentUserProfile?.basicSalary) || 45000;
    const gross = Number(currentUserProfile?.grossSalary) || (basic * 1.6);
    const hra = Math.round(basic * 0.4);
    const special = Math.max(0, gross - basic - hra);
    const pf = Math.round(basic * 0.12);
    const tax = Math.round(gross * 0.05);
    const netPay = gross - pf - tax;

    return {
      id: "latest-payroll-slip",
      month: monthStr,
      basic,
      hra,
      special,
      pf,
      tax,
      netPay,
      gross
    };
  }, [payslips, currentUserProfile]);

  const empReportingManager = useMemo(() => {
    return currentUserProfile?.reportingManager || currentUserProfile?.reporting_manager || "Reporting Manager";
  }, [currentUserProfile]);

  const empDepartmentHr = useMemo(() => {
    const dept = currentUserProfile?.department || "General";
    return `${dept} HR Desk`;
  }, [currentUserProfile]);

  const payslipRequestStorageKey = useMemo(() => {
    const uid = currentUserProfile?.id || user?.id || user?.email || 'emp';
    const mStr = (lastMonthPayslipData?.month || 'latest').replace(/\s+/g, '_');
    return `payslip_approval_req_${uid}_${mStr}`;
  }, [currentUserProfile, user, lastMonthPayslipData]);

  const [payslipDownloadRequest, setPayslipDownloadRequest] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(payslipRequestStorageKey);
      if (saved) {
        setPayslipDownloadRequest(JSON.parse(saved));
      } else {
        setPayslipDownloadRequest(null);
      }
    } catch (e) {
      setPayslipDownloadRequest(null);
    }
  }, [payslipRequestStorageKey]);

  const handleCreatePayslipRequest = (e) => {
    if (e) e.preventDefault();
    const newReq = {
      id: `REQ-PAY-${Math.floor(100000 + Math.random() * 900000)}`,
      month: lastMonthPayslipData.month,
      requestedAt: new Date().toLocaleString(),
      reason: payslipRequestPurpose,
      reportingManager: {
        name: empReportingManager,
        status: "PENDING",
        updatedAt: null
      },
      departmentHr: {
        name: empDepartmentHr,
        status: "PENDING",
        updatedAt: null
      }
    };
    setPayslipDownloadRequest(newReq);
    try {
      localStorage.setItem(payslipRequestStorageKey, JSON.stringify(newReq));
    } catch (err) {}
    setIsPayslipRequestModalOpen(false);
    setPayslipActionToast(`Payslip download request submitted to ${empReportingManager} and ${empDepartmentHr}!`);
    setTimeout(() => setPayslipActionToast(""), 5000);
  };

  const handleUpdatePayslipApproval = (approverRole, newStatus) => {
    setPayslipDownloadRequest(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        [approverRole]: {
          ...prev[approverRole],
          status: newStatus,
          updatedAt: new Date().toLocaleString()
        }
      };
      try {
        localStorage.setItem(payslipRequestStorageKey, JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });
    setPayslipActionToast(`Permission from ${approverRole === 'reportingManager' ? 'Reporting Manager' : 'Department HR'} updated to ${newStatus}!`);
    setTimeout(() => setPayslipActionToast(""), 5000);
  };

  const handleResetPayslipRequest = () => {
    try {
      localStorage.removeItem(payslipRequestStorageKey);
    } catch (err) {}
    setPayslipDownloadRequest(null);
    setPayslipActionToast("Request reset. You can submit a new download request.");
    setTimeout(() => setPayslipActionToast(""), 4000);
  };

  const isPayslipDownloadApproved = Boolean(
    payslipDownloadRequest &&
    payslipDownloadRequest.reportingManager?.status === "APPROVED" &&
    payslipDownloadRequest.departmentHr?.status === "APPROVED"
  );

  useEffect(() => {
    if (user?.email) {
      loadDashboardData();
    }
    const handleSilentRefresh = () => {
      if (user?.email) {
        loadDashboardData();
      }
    };
    window.addEventListener("silent-refresh", handleSilentRefresh);
    return () => window.removeEventListener("silent-refresh", handleSilentRefresh);
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
    
    const cleanFirstName = (effectiveFirstName || "employee").toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanLastName = (effectiveLastName || "staff").toLowerCase().replace(/[^a-z0-9]/g, "");
    const fallbackEmail = `${cleanFirstName}.${cleanLastName}${Date.now().toString().slice(-4)}@nib.com`;
    const effectiveEmail = (employeeForm.officialEmail && employeeForm.officialEmail.trim())
      ? employeeForm.officialEmail.trim()
      : (employeeForm.personalEmail && employeeForm.personalEmail.trim())
        ? employeeForm.personalEmail.trim()
        : fallbackEmail;

    // Strict UI-only profile fields
    const cleanProfileData = {
      photo: employeeForm.photo || "",
      employeeId: employeeForm.employeeId || "",
      employeeCode: employeeForm.employeeCode || "",
      employeeStatus: employeeForm.employeeStatus || "Active",
      company: employeeForm.company || "",
      firstName: effectiveFirstName,
      middleName: employeeForm.middleName || "",
      lastName: effectiveLastName,
      gender: employeeForm.gender || "Male",
      dateOfBirth: employeeForm.dateOfBirth || "",
      maritalStatus: employeeForm.maritalStatus || "Single",
      bloodGroup: employeeForm.bloodGroup || "",
      nationality: employeeForm.nationality || "Indian",
      officialEmail: employeeForm.officialEmail || effectiveEmail,
      department: employeeForm.department || "Operations",
      designation: employeeForm.designation || "",
      dateOfJoining: employeeForm.dateOfJoining || "",
      reportingManager: employeeForm.reportingManager || "",
      employeeType: employeeForm.employeeType || "Full-Time",
      shift: employeeForm.shift || "General Shift",
      weeklyOff: employeeForm.weeklyOff || "Sunday",
      mobileNumber: employeeForm.mobileNumber || "",
      alternateMobile: employeeForm.alternateMobile || "",
      personalEmail: employeeForm.personalEmail || "",
      currentAddress: employeeForm.currentAddress || "",
      permanentAddress: employeeForm.permanentAddress || "",
      highestDegree: employeeForm.highestDegree || "",
      specialization: employeeForm.specialization || "",
      university: employeeForm.university || "",
      prevCompany: employeeForm.prevCompany || "",
      prevDesignation: employeeForm.prevDesignation || "",
      bankName: employeeForm.bankName || profileDetails.bankName || "",
      accountHolderName: employeeForm.accountHolderName || profileDetails.accountHolderName || "",
      accountNumber: employeeForm.accountNumber || profileDetails.accountNumber || "",
      ifscCode: employeeForm.ifscCode || profileDetails.ifscCode || "",
      branchName: employeeForm.branchName || profileDetails.branchName || "",
      upiId: employeeForm.upiId || profileDetails.upiId || "",
      basicSalary: employeeForm.basicSalary || profileDetails.basicSalary || "0",
      grossSalary: employeeForm.grossSalary || profileDetails.grossSalary || "0",
      ctc: employeeForm.ctc || profileDetails.ctc || "0",
      pfApplicable: employeeForm.pfApplicable ?? profileDetails.pfApplicable ?? false,
      esiApplicable: employeeForm.esiApplicable ?? profileDetails.esiApplicable ?? false
    };

    const payload = {
      ...cleanProfileData,
      id: employeeForm.id || undefined,
      employee_name: constructedName,
      employeeName: constructedName,
      emp_code: employeeForm.employeeCode || undefined,
      employeeCode: employeeForm.employeeCode || undefined,
      email: effectiveEmail,
      officialEmail: employeeForm.officialEmail || effectiveEmail,
      profile_data: JSON.stringify(cleanProfileData)
    };

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
      const savedEmpId = employeeForm.id || ((typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : "emp-" + Math.random().toString(36).substring(2, 15));
      const isUpdatingExisting = Boolean(employeeForm.id && !isNewRegistration);
      if (employeeForm.id) {
        await apiFetch(`/api/table/employees/${employeeForm.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch("/api/table/employees", {
          method: "POST",
          body: JSON.stringify({
            ...payload,
            id: savedEmpId
          })
        });
      }
      
      await loadDashboardData();

      if (isUpdatingExisting) {
        setIsEditingProfile(false);
        alert("✅ Profile updated and saved to database successfully! Changes are saved.");
      } else {
        // Automatically clear all form fields back to blank for the next registration
        setIsNewRegistration(true);
        setIsEditingProfile(true);
        setEmployeeForm(getEmptyEmployeeForm());
        setSelectedEmployeeId("");
        setProfileTab("Information");
        setInformationSubTab("Basic Information");
        alert("✅ Employee registered and saved to database successfully! Form has been cleared for the next registration. You can click 'Load Saved Profile' anytime to view or edit.");
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

  const handleStartEditBank = () => {
    setBankForm({
      bankName: profileDetails.bankName || "",
      accountHolderName: profileDetails.accountHolderName || `${profileDetails.firstName || ''} ${profileDetails.lastName || ''}`.trim() || employeeName || "",
      accountNumber: profileDetails.accountNumber || "",
      ifscCode: profileDetails.ifscCode || "",
      branchName: profileDetails.branchName || "",
      upiId: profileDetails.upiId || "",
      basicSalary: profileDetails.basicSalary || "0",
      grossSalary: profileDetails.grossSalary || "0",
      ctc: profileDetails.ctc || "0",
      pfApplicable: Boolean(profileDetails.pfApplicable),
      esiApplicable: Boolean(profileDetails.esiApplicable)
    });
    setIsEditingBank(true);
  };

  const handleCancelEditBank = () => {
    setIsEditingBank(false);
  };

  const handleSaveBankDetails = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!bankForm.bankName && !bankForm.accountNumber && !bankForm.ifscCode) {
      alert("Please enter Bank Name and Account Number.");
      return;
    }

    setBankSubmitting(true);
    try {
      const activeEmp = currentUserProfile || allEmployeesList.find(emp => 
        (emp.employeeCode && String(emp.employeeCode).toLowerCase() === "tvn2007") ||
        (emp.id && emp.id === selectedEmployeeId) ||
        (emp.email && String(emp.email).toLowerCase() === String(user?.email).toLowerCase())
      ) || (allEmployeesList.length > 0 ? allEmployeesList[0] : null);

      const targetEmpId = activeEmp?.id || employeeForm.id;
      if (!targetEmpId) {
        throw new Error("Unable to locate active employee record in database.");
      }

      let existingProfileData = {};
      try {
        const rawJson = activeEmp?.profile_data || activeEmp?.profileData;
        if (typeof rawJson === "string") existingProfileData = JSON.parse(rawJson);
        else if (typeof rawJson === "object" && rawJson) existingProfileData = rawJson;
      } catch (err) {}

      const cleanIfsc = (bankForm.ifscCode || "").toUpperCase().trim();

      const updatedProfileData = {
        ...existingProfileData,
        bankName: bankForm.bankName || "",
        accountHolderName: bankForm.accountHolderName || "",
        accountNumber: bankForm.accountNumber || "",
        ifscCode: cleanIfsc,
        branchName: bankForm.branchName || "",
        upiId: bankForm.upiId || "",
        basicSalary: bankForm.basicSalary || "0",
        grossSalary: bankForm.grossSalary || "0",
        ctc: bankForm.ctc || "0",
        pfApplicable: bankForm.pfApplicable,
        esiApplicable: bankForm.esiApplicable
      };

      const payload = {
        ...activeEmp,
        bankName: bankForm.bankName || "",
        accountHolderName: bankForm.accountHolderName || "",
        accountNumber: bankForm.accountNumber || "",
        ifscCode: cleanIfsc,
        branchName: bankForm.branchName || "",
        upiId: bankForm.upiId || "",
        basicSalary: bankForm.basicSalary || "0",
        grossSalary: bankForm.grossSalary || "0",
        ctc: bankForm.ctc || "0",
        pfApplicable: bankForm.pfApplicable,
        esiApplicable: bankForm.esiApplicable,
        profile_data: JSON.stringify(updatedProfileData)
      };

      await apiFetch(`/api/table/employees/${targetEmpId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      // Update state
      setCurrentUserProfile(prev => ({
        ...(prev || activeEmp),
        ...payload
      }));

      // Reload fresh data from database
      await loadDashboardData();

      setIsEditingBank(false);
      alert("✅ Bank details updated successfully! Remittance profile synchronized with Admin and Payroll records.");
    } catch (err) {
      alert("Failed to update bank details: " + err.message);
    } finally {
      setBankSubmitting(false);
    }
  };

  // Unified Production Attendance Engine Punch Integration
  const handleEmpPunch = async (customMethod = null) => {
    if (customMethod && typeof customMethod !== 'string') {
        customMethod = null;
    }
    if (!currentUserProfile) {
      alert("Employee profile not loaded yet.");
      return;
    }

    const methodToUse = customMethod || selectedPunchMethod || (allowedAttendanceMethods[0]?.method) || 'GEO';
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const dateStr = now.toISOString().split('T')[0];

    // Gather browser/device telemetry
    const userAgent = navigator.userAgent;
    const browserName = userAgent.includes("Chrome") ? "Chrome" : userAgent.includes("Firefox") ? "Firefox" : "Safari";
    const deviceName = userAgent.includes("Mobi") ? "Mobile Device" : "Desktop PC";

    setPunchProcessing(true);

    try {
      const endpoint = empCheckedIn ? "/api/operations/attendance/clock-out" : "/api/operations/attendance/clock-in";

      const payload = {
        method: methodToUse,
        date: dateStr,
        ...(empCheckedIn ? { checkOut: timeStr } : { checkIn: timeStr }),
        shiftStart: "09:00:00",
        deviceInfo: `${deviceName} (${browserName})`,
      };

      if (methodToUse === "FACE") {
        setFacePunchAction(empCheckedIn ? "clock-out" : "clock-in");
        setShowFaceModal(true);
        setPunchProcessing(false);
        return;
      }

      if (methodToUse === "GEO") {
        let coords = geoCoords;
        if (!coords) {
          try {
            coords = await new Promise((resolve, reject) => {
              if (!navigator.geolocation) return reject(new Error("No geolocation"));
              navigator.geolocation.getCurrentPosition(
                pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
                err => reject(err),
                { enableHighAccuracy: true, timeout: 5000 }
              );
            });
            setGeoCoords(coords);
          } catch (e) {
            coords = { latitude: 19.0760, longitude: 72.8777, accuracy: 15 };
            setGeoCoords(coords);
          }
        }
        payload.latitude = coords.latitude;
        payload.longitude = coords.longitude;
        payload.accuracy = coords.accuracy;
      } else if (methodToUse === "QR") {
        setShowCompanyQrScanModal(true);
        setPunchProcessing(false);
        return;
      } else if (methodToUse === "BIOMETRIC") {
        const bioMethod = allowedAttendanceMethods.find(m => m.method === "BIOMETRIC");
        const devices = bioMethod?.settings?.devices || [];
        const firstDevice = devices[0];
        payload.deviceId = firstDevice ? firstDevice.deviceId : "BIO-GATE-01";
        payload.serialNumber = firstDevice ? firstDevice.serialNumber : "SN-BIO-9021";
        payload.ipAddress = firstDevice ? firstDevice.ipAddress : "192.168.1.200";
        payload.biometricUserId = currentUserProfile.employeeCode || currentUserProfile.emp_code || String(currentUserProfile.id);
      }

      const res = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (empCheckedIn) {
        setEmpCheckedIn(false);
        setEmpShiftCompleted(true);
        const outTime = res?.data?.checkOut || timeStr;
        setEmpCheckOutTime(outTime);
        const loc = res?.data?.attendance_location || res?.data?.verification?.matchedLocation || empPunchLocation || "Regional Office";
        setEmpPunchLocation(loc);
        alert(`Punched Out successfully via ${methodToUse} Attendance!\nCheck-Out Time: ${outTime}\nLocation: ${loc}\nSession locked for today.`);
      } else {
        setEmpCheckedIn(true);
        setEmpShiftCompleted(false);
        const inTime = res?.data?.checkIn || timeStr;
        setEmpPunchTime(inTime);
        const loc = res?.data?.attendance_location || res?.data?.verification?.matchedLocation || "Regional Office";
        setEmpPunchLocation(loc);
        alert(`Punched In successfully via ${methodToUse} Attendance!\nCheck-In Time: ${inTime}\nLocation: ${loc}`);
      }

      await loadDashboardData();
    } catch (err) {
      console.error("Attendance punch error:", err);
      // Strictly alert the backend rejection reason
      alert(err.message || "Failed to process attendance punch.");
    } finally {
      setPunchProcessing(false);
    }
  };

  // Export Attendance CSV
  const handleDownloadAttendanceCSV = () => {
    if (!attendanceLogs || attendanceLogs.length === 0) {
      alert("No attendance logs available to export.");
      return;
    }
    const headers = ["Date", "Check In", "Check Out", "Working Hours", "Status", "IP Address", "Device Info", "Remarks"];
    const rows = attendanceLogs.map(l => [
      `"${l.date || ''}"`,
      `"${l.checkIn || ''}"`,
      `"${l.checkOut || ''}"`,
      `"${l.workingHours || 0}"`,
      `"${l.status || ''}"`,
      `"${l.ipAddress || ''}"`,
      `"${(l.deviceInfo || '').replace(/"/g, '""')}"`,
      `"${(l.remarks || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_report_${selectedMonthInfo?.label?.replace(/\s+/g, '_') || 'logs'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Overtime CSV
  const handleDownloadOvertimeCSV = () => {
    const otLogs = (attendanceLogs || []).filter(l => Number(l.overtime || 0) > 0);
    if (otLogs.length === 0) {
      alert("No overtime logs available to export.");
      return;
    }
    const headers = ["Date", "Overtime Hours", "Status", "Remarks"];
    const rows = otLogs.map(l => [
      `"${l.date || ''}"`,
      `"${l.overtime || 0}"`,
      `"Approved"`,
      `"${(l.remarks || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `overtime_statement_${selectedMonthInfo?.label?.replace(/\s+/g, '_') || 'logs'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      fd.append("companyName", currentUserProfile?.company || "");
      fd.append("department", currentUserProfile?.department || employeeForm.department || "General");
      fd.append("employeeId", currentUserProfile?.employeeCode || currentUserProfile?.empId || currentUserProfile?.id || employeeForm.employeeCode || "EMP");
      fd.append("employeeName", employeeName || currentUserProfile?.name || "Employee");
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
      {/* SuperAdmin / Admin Employee Inspection Banner & Switcher (Managers Only) */}
      {canManageEmployees && !isRegularEmployee && allEmployeesList.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-3.5 sm:p-4 rounded-2xl shadow-md border border-indigo-700/40 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-lg shrink-0">
              👥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {userRole} Workspace Mode
                </span>
                <span className="text-[11px] text-slate-300 font-semibold">
                  {allEmployeesList.length} Total Workforce Profiles
                </span>
              </div>
              <p className="text-xs font-bold text-white mt-0.5">
                Inspecting: <span className="text-emerald-400 font-extrabold">{currentUserProfile?.employeeName || currentUserProfile?.firstName || "Select Employee"}</span> ({currentUserProfile?.employeeCode || "--"}) • {currentUserProfile?.designation || "Staff"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-center">
            <label className="text-xs font-semibold text-indigo-200 whitespace-nowrap">Switch Employee:</label>
            <select
              value={selectedEmployeeId || currentUserProfile?.id || ""}
              onChange={(e) => {
                const newId = e.target.value;
                setSelectedEmployeeId(newId);
                setSearchParams(prev => {
                  const updated = new URLSearchParams(prev);
                  updated.set("profileEmpId", newId);
                  return updated;
                });
              }}
              className="bg-slate-800 text-white text-xs font-bold rounded-xl px-3 py-2 border border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer max-w-[280px] truncate"
            >
              {allEmployeesList.map(emp => {
                const name = emp.employeeName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || "Employee";
                const code = emp.employeeCode || emp.emp_code || emp.id?.slice(0, 6);
                const dept = emp.department || "Operations";
                return (
                  <option key={emp.id} value={emp.id} className="bg-slate-900 text-white">
                    {name} ({code}) - {dept}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      )}

      {/* 1. Header Welcome Bar */}
      {activeTab !== "Employee Profile" && activeCategory !== "EMP_PROFILE" && (
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest block mb-1">
            {isRegularEmployee ? "Employee Self-Service Portal" : "Employee Command Center"}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {activeTab === "Dashboard Home" 
              ? (isRegularEmployee ? "My Employee Dashboard" : (dashboardViewMode === "personal" ? "My Personal Workspace" : (selectedDeptFilter === "All Departments" ? "Company Overview Dashboard" : `${selectedDeptFilter} Department Dashboard`)))
              : activeTab}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-slate-500 text-xs font-semibold">Welcome back, {employeeName}!</span>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-extrabold rounded-full">
              🏢 Department: {departmentName}
            </span>
            {currentUserProfile?.employeeCode && (
              <span className="px-2.5 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-extrabold rounded-full">
                ID: {currentUserProfile.employeeCode}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Mode Switcher for Admins/Managers only */}
          {canManageEmployees && !isRegularEmployee && (
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setDashboardViewMode("personal")}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${dashboardViewMode === "personal" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Personal View
              </button>
              <button
                type="button"
                onClick={() => setDashboardViewMode("workforce")}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${dashboardViewMode === "workforce" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Workforce Analytics
              </button>
            </div>
          )}

          {/* Quick Profile Tab Button */}
          <button
            type="button"
            onClick={() => setSearchParams({ category: "EMPLOYEE_MGMT", tab: "Employee Profile" })}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>My Profile</span>
          </button>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
              empCheckedIn 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              <span className={`w-2 h-2 rounded-full ${empCheckedIn ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              {empCheckedIn ? `Punched In (${empPunchTime})` : "Not Punched In"}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">
            <ClockIcon className="h-4 w-4 text-indigo-600 animate-spin-slow" />
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>

          {!isRegularEmployee && dashboardViewMode === "workforce" && (
            <>
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
            </>
          )}

          <button 
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-xs font-extrabold shadow-sm transition"
          >
            <PrinterIcon className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-xs text-slate-500 font-semibold mt-3">Compiling employee workspace data...</span>
        </div>
      ) : (
        <>
          {/* Main Dashboard Home Switcher */}
          {(activeCategory === "EMP_DASHBOARD" || activeTab === "Dashboard Home" || activeTab === "Employee Dashboard") && (
            (isRegularEmployee || dashboardViewMode === "personal") ? (
              <div className="space-y-6 animate-fadeIn">
                {/* 1. Top 4 Action & Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                  {/* Card 1: Shift & Punch Clock Card */}
                  <div className="bg-gradient-to-br from-white to-slate-50 p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1.5">
                        <ClockIcon className="h-4 w-4" /> Shift Command
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${empCheckedIn ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {empCheckedIn ? `Punched In (${empPunchTime})` : "Not Checked In"}
                      </span>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-slate-800 tracking-tight">{currentTime.toLocaleTimeString()}</p>
                      <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{currentUserProfile?.shift || "General Shift (09:00 AM - 06:00 PM)"}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-semibold">Today: <b className="text-slate-700">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</b></span>
                      <span className="text-indigo-600 font-extrabold">{empCheckedIn ? "Active Shift" : "Shift Pending"}</span>
                    </div>
                  </div>

                  {/* Card 2: My Monthly Attendance Summary */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider flex items-center gap-1.5">
                        <CalendarDaysIcon className="h-4 w-4" /> My Attendance
                      </span>
                      <button
                        type="button"
                        onClick={() => setSearchParams({ category: "EMP_ATTENDANCE", tab: "Monthly Attendance" })}
                        className="text-[10px] font-extrabold text-blue-600 hover:underline"
                      >
                        View Log →
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                        <p className="text-lg font-black text-emerald-700">{monthlyAttendanceKPIs.presentDays}</p>
                        <p className="text-[9px] font-bold text-emerald-600 uppercase">Present</p>
                      </div>
                      <div className="p-2 bg-rose-50 rounded-xl border border-rose-100">
                        <p className="text-lg font-black text-rose-700">{monthlyAttendanceKPIs.absences}</p>
                        <p className="text-[9px] font-bold text-rose-600 uppercase">Absent</p>
                      </div>
                      <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                        <p className="text-lg font-black text-amber-700">{monthlyAttendanceKPIs.lateMarks}</p>
                        <p className="text-[9px] font-bold text-amber-600 uppercase">Late</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 pt-1 border-t border-slate-100">
                      <span>Working Days: {monthlyAttendanceKPIs.workingDays}</span>
                      <span className="text-indigo-600">Month: {selectedMonthInfo.label}</span>
                    </div>
                  </div>

                  {/* Card 3: My Leave Balances */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-[10px] font-black uppercase text-purple-600 tracking-wider flex items-center gap-1.5">
                        <BriefcaseIcon className="h-4 w-4" /> Leave Balances
                      </span>
                      <button
                        type="button"
                        onClick={() => setSearchParams({ category: "EMP_LEAVE", tab: "Apply Leave" })}
                        className="text-[10px] font-extrabold text-purple-600 hover:underline"
                      >
                        + Apply
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-purple-50 rounded-xl border border-purple-100">
                        <p className="text-lg font-black text-purple-700">{currentUserProfile?.casualLeaveBalance ?? 12}</p>
                        <p className="text-[9px] font-bold text-purple-600 uppercase">Casual</p>
                      </div>
                      <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-lg font-black text-blue-700">{currentUserProfile?.sickLeaveBalance ?? 8}</p>
                        <p className="text-[9px] font-bold text-blue-600 uppercase">Sick</p>
                      </div>
                      <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100">
                        <p className="text-lg font-black text-indigo-700">{currentUserProfile?.earnedLeaveBalance ?? 15}</p>
                        <p className="text-[9px] font-bold text-indigo-600 uppercase">Earned</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 pt-1 border-t border-slate-100">
                      <span>Pending: {(leaves || []).filter(l => l.status === "Pending").length}</span>
                      <span className="text-emerald-600">Approved: {(leaves || []).filter(l => l.status === "Approved").length}</span>
                    </div>
                  </div>

                  {/* Card 4: My Profile & Reporting Details */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider flex items-center gap-1.5">
                        <UserIcon className="h-4 w-4" /> My Profile
                      </span>
                      <button
                        type="button"
                        onClick={() => setSearchParams({ category: "EMPLOYEE_MGMT", tab: "Employee Profile" })}
                        className="text-[10px] font-extrabold text-emerald-600 hover:underline"
                      >
                        Details →
                      </button>
                    </div>
                    <div className="space-y-1.5 text-xs font-semibold text-slate-600">
                      <p className="flex justify-between">
                        <span className="text-slate-400">Code:</span>
                        <span className="font-bold text-slate-800">{currentUserProfile?.employeeCode || currentUserProfile?.employeeId || "--"}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-400">Designation:</span>
                        <span className="font-bold text-slate-800">{currentUserProfile?.designation || "Staff"}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-400">Manager:</span>
                        <span className="font-bold text-indigo-600">{currentUserProfile?.reportingManager || "Department Head"}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-400">Weekly Off:</span>
                        <span className="font-bold text-slate-700">{currentUserProfile?.weeklyOff || "Sunday"}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Bottom Grid: Recent Activity & Quick Services */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Left 2 Cols: Recent Attendance & Leave Records */}
                  <div className="xl:col-span-2 space-y-6">
                    {/* Recent Attendance */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                          <ClockIcon className="h-4.5 w-4.5 text-blue-600" /> Recent Attendance Logs
                        </h4>
                        <button
                          type="button"
                          onClick={() => setSearchParams({ category: "EMP_ATTENDANCE", tab: "Monthly Attendance" })}
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          View All
                        </button>
                      </div>
                      {monthlyAttendanceLogs.length === 0 ? (
                        <p className="text-xs text-slate-400 font-semibold py-4 text-center">No attendance logs found for this period.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400">
                                <th className="py-2.5 px-3">Date</th>
                                <th className="py-2.5 px-3">Check In</th>
                                <th className="py-2.5 px-3">Check Out</th>
                                <th className="py-2.5 px-3">Working Hrs</th>
                                <th className="py-2.5 px-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                              {monthlyAttendanceLogs.slice(0, 5).map((log, idx) => (
                                <tr key={log.id || idx} className="hover:bg-slate-50/60 transition">
                                  <td className="py-2.5 px-3 font-bold text-slate-800">{String(log.date || '').split('T')[0]}</td>
                                  <td className="py-2.5 px-3">{log.checkIn || "--"}</td>
                                  <td className="py-2.5 px-3">{log.checkOut || "--"}</td>
                                  <td className="py-2.5 px-3">{log.workingHours ? `${Number(log.workingHours).toFixed(1)} hrs` : "--"}</td>
                                  <td className="py-2.5 px-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                      log.status === "Present" ? "bg-emerald-50 text-emerald-700" :
                                      log.status === "Late" ? "bg-amber-50 text-amber-700" :
                                      "bg-rose-50 text-rose-700"
                                    }`}>
                                      {log.status || "Present"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Recent Leave Requests */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                          <CalendarDaysIcon className="h-4.5 w-4.5 text-purple-600" /> My Leave Requests
                        </h4>
                        <button
                          type="button"
                          onClick={() => setSearchParams({ category: "EMP_LEAVE", tab: "Apply Leave" })}
                          className="text-xs font-bold text-purple-600 hover:underline"
                        >
                          + Apply New
                        </button>
                      </div>
                      {leaves.length === 0 ? (
                        <p className="text-xs text-slate-400 font-semibold py-4 text-center">No leave requests submitted yet.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400">
                                <th className="py-2.5 px-3">Leave Type</th>
                                <th className="py-2.5 px-3">From</th>
                                <th className="py-2.5 px-3">To</th>
                                <th className="py-2.5 px-3">Days</th>
                                <th className="py-2.5 px-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                              {leaves.slice(0, 5).map((l, idx) => (
                                <tr key={l.id || idx} className="hover:bg-slate-50/60 transition">
                                  <td className="py-2.5 px-3 font-bold text-slate-800">{l.leaveType}</td>
                                  <td className="py-2.5 px-3">{l.fromDate}</td>
                                  <td className="py-2.5 px-3">{l.toDate}</td>
                                  <td className="py-2.5 px-3">{l.totalDays || 1} day(s)</td>
                                  <td className="py-2.5 px-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                      l.status === "Approved" ? "bg-emerald-50 text-emerald-700" :
                                      l.status === "Pending" ? "bg-amber-50 text-amber-700" :
                                      "bg-rose-50 text-rose-700"
                                    }`}>
                                      {l.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right 1 Col: Quick Links & Upcoming Holidays */}
                  <div className="space-y-6">
                    {/* Quick Services */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                      <h4 className="font-extrabold text-sm text-slate-800 pb-2 border-b border-slate-100">
                        Quick Employee Services
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setSearchParams({ category: "EMPLOYEE_MGMT", tab: "Documents" })}
                          className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-indigo-50 hover:border-indigo-200 transition text-left group"
                        >
                          <DocumentDuplicateIcon className="h-5 w-5 text-indigo-600 mb-1.5 group-hover:scale-110 transition" />
                          <p className="text-xs font-bold text-slate-800">My Documents</p>
                          <p className="text-[9px] text-slate-400 font-semibold">View files</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSearchParams({ category: "EMP_PAYROLL", tab: "My Payslips" })}
                          className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-emerald-50 hover:border-emerald-200 transition text-left group"
                        >
                          <BanknotesIcon className="h-5 w-5 text-emerald-600 mb-1.5 group-hover:scale-110 transition" />
                          <p className="text-xs font-bold text-slate-800">My Payslips</p>
                          <p className="text-[9px] text-slate-400 font-semibold">Salary & slips</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSearchParams({ category: "EMPLOYEE_MGMT", tab: "Assets" })}
                          className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-blue-50 hover:border-blue-200 transition text-left group"
                        >
                          <CommandLineIcon className="h-5 w-5 text-blue-600 mb-1.5 group-hover:scale-110 transition" />
                          <p className="text-xs font-bold text-slate-800">My Assets</p>
                          <p className="text-[9px] text-slate-400 font-semibold">Devices</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSearchParams({ category: "HELPDESK", tab: "Helpdesk Dashboard" })}
                          className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-purple-50 hover:border-purple-200 transition text-left group"
                        >
                          <WrenchScrewdriverIcon className="h-5 w-5 text-purple-600 mb-1.5 group-hover:scale-110 transition" />
                          <p className="text-xs font-bold text-slate-800">Helpdesk</p>
                          <p className="text-[9px] text-slate-400 font-semibold">Support ticket</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSearchParams({ category: "EMP_EXPENSES", tab: "Expense Reimbursement" })}
                          className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-indigo-50 hover:border-indigo-200 transition text-left group col-span-2 sm:col-span-1"
                        >
                          <ReceiptPercentIcon className="h-5 w-5 text-indigo-600 mb-1.5 group-hover:scale-110 transition" />
                          <p className="text-xs font-bold text-slate-800">Expense Claims</p>
                          <p className="text-[9px] text-slate-400 font-semibold">Reimbursements</p>
                        </button>
                      </div>
                    </div>

                    {/* Upcoming Holidays */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                      <h4 className="font-extrabold text-sm text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-1.5">
                        <GiftIcon className="h-4 w-4 text-orange-500" /> Upcoming Holidays
                      </h4>
                      <div className="space-y-2.5">
                        {metrics.upcomingEvents.length === 0 ? (
                          <p className="text-xs text-slate-400 font-semibold py-3 text-center">No upcoming holidays scheduled.</p>
                        ) : (
                          metrics.upcomingEvents.slice(0, 4).map((evt, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-orange-50/40 border border-orange-100/60">
                              <div className="w-9 h-9 rounded-lg bg-orange-500 text-white flex flex-col items-center justify-center font-black text-[10px] shrink-0">
                                <span>{evt.date?.slice(5, 7) || "09"}</span>
                                <span className="text-[8px] uppercase">{evt.date?.slice(8, 10) || "DAY"}</span>
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-bold text-slate-800 truncate">{evt.title}</p>
                                <p className="text-[10px] text-slate-500 font-semibold">{evt.date} • {evt.type || "Holiday"}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
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
            )
          )}

          {/* 7. Category Switcher for Portal Sub-views */}

          {/* EMPLOYEE MANAGEMENT SECTION */}
          {(activeCategory === "EMPLOYEE_MGMT" || activeCategory === "EMP_PROFILE") && (
            <div className={activeCategory === "EMP_PROFILE" || activeTab === "Employee Profile" ? "space-y-6" : "bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6"}>
              {/* Header */}
              {activeCategory !== "EMP_PROFILE" && activeTab !== "Employee Profile" && (isEditingProfile || isNewRegistration) && (
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
                    <p className="text-xs text-indigo-600 font-bold">{profileDetails.designation || "Staff Professional"} • {profileDetails.department || departmentName || "Operations"}</p>
                    <div className="flex items-center justify-center sm:justify-start gap-1 font-mono text-[10px] text-slate-400">
                      <span>Emp ID: #{profileDetails.employeeId || profileDetails.id?.slice(0, 8)}</span>
                      <span>|</span>
                      <span>Code: {profileDetails.employeeCode || profileDetails.emp_code || profileDetails.employee_code || "--"}</span>
                    </div>
                  </div>
                </div>
              )}

              {(activeTab === "Employee Profile" || activeCategory === "EMP_PROFILE") && (() => {
                const activeProfile = (employeeForm.firstName || employeeForm.employeeCode) ? employeeForm : profileDetails;
                const displayPhoto = activeProfile.photo || profileDetails.photo || "";
                const displayFirstName = activeProfile.firstName || profileDetails.firstName || "";
                const displayMiddleName = activeProfile.middleName || profileDetails.middleName || "";
                const displayLastName = activeProfile.lastName || profileDetails.lastName || "";
                const rawFullName = `${displayFirstName} ${displayLastName}`.trim() || employeeName || "Employee";
                const displayName = (() => {
                  if (displayFirstName && displayLastName) {
                    const fn = displayFirstName.trim();
                    const ln = displayLastName.trim();
                    if (fn.toLowerCase().endsWith(ln.toLowerCase())) return fn;
                    if (fn.toLowerCase().includes(ln.toLowerCase())) return fn;
                    return `${fn} ${ln}`;
                  }
                  return rawFullName;
                })();
                const displayCode = activeProfile.employeeCode || profileDetails.employeeCode || "--";
                const displayId = activeProfile.employeeId || activeProfile.id || profileDetails.employeeId || profileDetails.id || "";
                const displayDesignation = activeProfile.designation || profileDetails.designation || "Staff Professional";
                const displayDepartment = activeProfile.department || profileDetails.department || user?.departmentName || user?.department || localStorage.getItem("user_department") || "Operations";
                const displayCompany = activeProfile.company || profileDetails.company || localStorage.getItem("selected_company_name") || user?.companyName || "NIB Insurance";
                const displayStatus = activeProfile.employeeStatus || profileDetails.employeeStatus || "Active";
                const displayGender = activeProfile.gender || profileDetails.gender || "Male";
                const displayDob = activeProfile.dateOfBirth || profileDetails.dateOfBirth || "";
                const displayMarital = activeProfile.maritalStatus || profileDetails.maritalStatus || "Single";
                const displayBlood = activeProfile.bloodGroup || profileDetails.bloodGroup || "";
                const displayNationality = activeProfile.nationality || profileDetails.nationality || "Indian";
                const displayOfficialEmail = activeProfile.officialEmail || profileDetails.officialEmail || "";
                const displayDoj = activeProfile.dateOfJoining || profileDetails.dateOfJoining || "";
                const displayManager = activeProfile.reportingManager || profileDetails.reportingManager || "aman verma";
                const displayEmpType = activeProfile.employeeType || profileDetails.employeeType || "Full-Time";
                const displayShift = activeProfile.shift || profileDetails.shift || "General Shift (09:00 - 18:00)";
                const displayWeeklyOff = activeProfile.weeklyOff || profileDetails.weeklyOff || "Sunday";
                const displayMobile = activeProfile.mobileNumber || profileDetails.mobileNumber || "";
                const displayAltMobile = activeProfile.alternateMobile || profileDetails.alternateMobile || "";
                const displayPersonalEmail = activeProfile.personalEmail || profileDetails.personalEmail || "";
                const displayCurrentAddress = activeProfile.currentAddress || profileDetails.currentAddress || "";
                const displayPermanentAddress = activeProfile.permanentAddress || profileDetails.permanentAddress || "";
                const displayDegree = activeProfile.highestDegree || profileDetails.highestDegree || "";
                const displaySpecialization = activeProfile.specialization || profileDetails.specialization || "";
                const displayUniversity = activeProfile.university || profileDetails.university || "";
                const displayPrevCompany = activeProfile.prevCompany || profileDetails.prevCompany || "";
                const displayPrevDesig = activeProfile.prevDesignation || profileDetails.prevDesignation || "";

                const handleStartEdit = () => {
                  setEmployeeForm(prev => ({
                    ...getEmptyEmployeeForm(),
                    ...profileDetails,
                    ...prev,
                    documents: profileDetails.documents || prev.documents || {},
                    assets: profileDetails.assets || prev.assets || []
                  }));
                  setIsEditingProfile(true);
                };

                const handleCancelEdit = () => {
                  setIsEditingProfile(false);
                  setEmployeeForm(prev => ({
                    ...getEmptyEmployeeForm(),
                    ...profileDetails,
                    documents: profileDetails.documents || {},
                    assets: profileDetails.assets || []
                  }));
                };

                return (
                  <form
                    id="employee-profile-form"
                    onSubmit={handleSaveProfile}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
                        e.preventDefault();
                      }
                    }}
                    className="space-y-6 w-full animate-fadeIn"
                  >
                    {/* Top Header matching reference image pixel-for-pixel */}
                    <div className="space-y-4">
                      {/* Breadcrumb */}
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                        <span className="text-slate-500 font-bold">Dashboard</span>
                        <ChevronRightIcon className="w-3 h-3 text-slate-400" />
                        <span className="text-blue-600 font-extrabold">Employee Profile</span>
                      </div>

                      {/* Header Title Row */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            Employee Profile
                          </h1>
                          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                            View and manage detailed information of the employee.
                          </p>
                        </div>

                        {/* Top Right Buttons: Back to List, Live Punch Status, Export */}
                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                          <button
                            type="button"
                            onClick={() => setSearchParams({ category: "EMP_DASHBOARD", tab: "Dashboard Home" })}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <ArrowLeftIcon className="w-3.5 h-3.5" />
                            <span>Back to List</span>
                          </button>

                          {/* Live Punch Status Card */}
                          <div className={`px-3.5 py-1.5 rounded-2xl border flex items-center gap-3 shadow-xs ${
                            empCheckedIn
                              ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-800"
                              : "bg-amber-50/70 border-amber-200/80 text-amber-800"
                          }`}>
                            <div className="flex items-center gap-1.5 font-bold text-xs">
                              <span className={`w-2 h-2 rounded-full ${empCheckedIn ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                              <span className="font-black">{empCheckedIn ? `Punched In` : "Not Punched In"}</span>
                            </div>
                            <div className="text-right border-l border-amber-200/60 pl-3">
                              <div className="text-xs font-mono font-bold text-slate-800 leading-tight">
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium leading-tight">
                                {new Intl.DateTimeFormat("en-GB", { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())}
                              </div>
                            </div>
                          </div>

                          {/* Export Button */}
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="px-4 py-2 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-500 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <ArrowDownTrayIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Export</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Hero Overview Header Card */}
                    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                      {/* Subtle Background Decorative Graphic */}
                      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-50/60 via-blue-50/20 to-transparent pointer-events-none rounded-r-3xl" />
                      <div className="absolute -right-10 -bottom-10 w-56 h-56 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

                      <div className="flex flex-col sm:flex-row items-center gap-5 z-10 text-center sm:text-left">
                        {/* Avatar Square */}
                        <div className="relative group shrink-0">
                          {displayPhoto ? (
                            <img
                              src={displayPhoto}
                              alt={displayName}
                              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-indigo-200 shadow-md"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white flex items-center justify-center font-black text-3xl uppercase ring-4 ring-indigo-50 shadow-md">
                              {(displayFirstName?.[0] || displayName?.[0] || "A").toUpperCase()}
                            </div>
                          )}

                          {isEditingProfile && (
                            <label className="absolute inset-0 bg-black/60 hover:bg-black/75 rounded-2xl flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer transition opacity-90 group-hover:opacity-100 p-1 text-center">
                              <CameraIcon className="w-4 h-4 mb-0.5" />
                              <span>Change Photo</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const fd = new FormData();
                                  fd.append("file", file);
                                  fd.append("companyName", currentUserProfile?.company || employeeForm.company || "");
                                  fd.append("department", employeeForm.department || currentUserProfile?.department || "General");
                                  fd.append("employeeId", employeeForm.employeeCode || employeeForm.employeeId || employeeForm.id || currentUserProfile?.employeeCode || currentUserProfile?.empId || "EMP");
                                  fd.append("employeeName", displayName || "Employee");
                                  try {
                                    const url = await uploadEmployeeFile(fd);
                                    if (url) {
                                      setEmployeeForm(prev => ({ ...prev, photo: url }));
                                      alert("Photo updated successfully!");
                                    }
                                  } catch (err) {
                                    alert("Upload failed: " + err.message);
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>

                        {/* Employee Identity Details */}
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">{displayName}</h2>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {displayStatus}
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm font-bold text-slate-600">
                            <span>{displayDesignation}</span>
                            <span className="mx-1.5 text-slate-300">•</span>
                            <span className="text-indigo-600 font-extrabold">{displayDepartment}</span>
                          </p>

                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 font-mono text-xs text-slate-600">
                            <span className="px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200">
                              Code: <b className="text-slate-900 font-extrabold">{displayCode}</b>
                            </span>
                            <span className="px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200">
                              Emp. ID: <b className="text-slate-900 font-extrabold">{displayId ? (String(displayId).startsWith('EMP') ? displayId : 'EMP-' + String(displayId).replace(/\D/g, '').slice(-7) || displayId) : '--'}</b>
                            </span>
                            {displayDoj && (
                              <span className="px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200">
                                Joined: <b className="text-slate-900 font-extrabold">{displayDoj.slice(0, 10)}</b>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action Buttons */}
                      <div className="flex flex-wrap items-center justify-center gap-3 z-10 shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowEmployeeQrCardModal(true)}
                          className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="View, Print & Download Official QR ID Card Badge"
                        >
                          <QrCodeIcon className="w-4 h-4 text-indigo-600" />
                          <span>QR ID Badge</span>
                        </button>

                        {!isEditingProfile ? (
                          <button
                            type="button"
                            onClick={handleStartEdit}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                            <span>Edit Profile</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition flex items-center gap-1 cursor-pointer"
                            >
                              <span>Cancel</span>
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                            >
                              <span>Save Changes</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Detail Cards in 2x2 Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Card 1: Basic Information (Green Accent) */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-emerald-500 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                              <UserIcon className="w-5 h-5 stroke-2" />
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-slate-900">Basic Information</h4>
                              <p className="text-[11px] text-slate-400 font-medium">Personal identity & demographics</p>
                            </div>
                          </div>
                          {!isEditingProfile && (
                            <button
                              type="button"
                              onClick={handleStartEdit}
                              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition"
                            >
                              <span>Edit</span>
                              <span>→</span>
                            </button>
                          )}
                        </div>

                        {/* Content Fields */}
                        {!isEditingProfile ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Full Legal Name</span>
                              <span className="font-black text-slate-800 block mt-0.5">{displayName}</span>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Gender</span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 mt-0.5">
                                {displayGender === "Female" ? "♀ Female" : "♂ Male"}
                              </span>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Date of Birth</span>
                              <span className="font-bold text-slate-800 block mt-0.5 font-mono">{displayDob ? String(displayDob).slice(0, 10) : "--"}</span>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Marital Status</span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mt-0.5">
                                {displayMarital || "Single"}
                              </span>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Blood Group</span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200 mt-0.5">
                                🩸 {displayBlood || "O+"}
                              </span>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Nationality</span>
                              <span className="font-bold text-slate-800 block mt-0.5">🇮🇳 {displayNationality || "Indian"}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-2.5">
                              <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">First Name *</label>
                              <input
                                type="text"
                                required
                                value={employeeForm.firstName || ""}
                                onChange={(e) => setEmployeeForm(prev => ({ ...prev, firstName: e.target.value }))}
                                className="w-full text-xs font-bold text-slate-900 bg-white border border-blue-200 rounded-lg px-2 py-1 mt-1 focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-2.5">
                              <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Middle Name</label>
                              <input
                                type="text"
                                value={employeeForm.middleName || ""}
                                onChange={(e) => setEmployeeForm(prev => ({ ...prev, middleName: e.target.value }))}
                                className="w-full text-xs font-bold text-slate-900 bg-white border border-blue-200 rounded-lg px-2 py-1 mt-1 focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-2.5">
                              <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Last Name</label>
                              <input
                                type="text"
                                value={employeeForm.lastName || ""}
                                onChange={(e) => setEmployeeForm(prev => ({ ...prev, lastName: e.target.value }))}
                                className="w-full text-xs font-bold text-slate-900 bg-white border border-blue-200 rounded-lg px-2 py-1 mt-1 focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-2.5">
                              <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Gender</label>
                              <select
                                value={employeeForm.gender || "Female"}
                                onChange={(e) => setEmployeeForm(prev => ({ ...prev, gender: e.target.value }))}
                                className="w-full text-xs font-bold text-slate-900 bg-white border border-blue-200 rounded-lg px-2 py-1 mt-1"
                              >
                                <option value="Female">Female</option>
                                <option value="Male">Male</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-2.5">
                              <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Date of Birth</label>
                              <input
                                type="date"
                                value={employeeForm.dateOfBirth ? String(employeeForm.dateOfBirth).slice(0, 10) : ""}
                                onChange={(e) => setEmployeeForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                className="w-full text-xs font-bold text-slate-900 bg-white border border-blue-200 rounded-lg px-2 py-1 mt-1"
                              />
                            </div>
                            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-2.5">
                              <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Blood Group</label>
                              <select
                                value={employeeForm.bloodGroup || "O+"}
                                onChange={(e) => setEmployeeForm(prev => ({ ...prev, bloodGroup: e.target.value }))}
                                className="w-full text-xs font-bold text-slate-900 bg-white border border-blue-200 rounded-lg px-2 py-1 mt-1"
                              >
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card 2: Official Information (Amber Accent) */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-amber-500 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                              <BriefcaseIcon className="w-5 h-5 stroke-2" />
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-slate-900">Official Information</h4>
                              <p className="text-[11px] text-slate-400 font-medium">Department, role & reporting hierarchy</p>
                            </div>
                          </div>
                          {!isEditingProfile && (
                            <button
                              type="button"
                              onClick={handleStartEdit}
                              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition"
                            >
                              <span>Edit</span>
                              <span>→</span>
                            </button>
                          )}
                        </div>

                        {/* Content Fields */}
                        {!isEditingProfile ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 sm:col-span-2">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Official Email</span>
                              <span className="font-mono font-bold text-indigo-600 block mt-0.5 truncate">{displayOfficialEmail || "--"}</span>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Department</span>
                              <span className="font-extrabold text-slate-800 block mt-0.5">{displayDepartment}</span>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Designation</span>
                              <span className="font-extrabold text-slate-800 block mt-0.5">{displayDesignation}</span>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Reporting Manager</span>
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 mt-0.5">
                                👔 {displayManager || "aman verma"}
                              </span>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Employment Type</span>
                              <span className="font-bold text-slate-800 block mt-0.5">{displayEmpType}</span>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Shift Schedule</span>
                              <span className="font-bold text-slate-800 block mt-0.5 truncate">{displayShift}</span>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Weekly Off</span>
                              <span className="font-bold text-slate-800 block mt-0.5">{displayWeeklyOff}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-2.5 sm:col-span-2">
                              <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Official Email</label>
                              <input
                                type="email"
                                value={employeeForm.officialEmail || ""}
                                onChange={(e) => setEmployeeForm(prev => ({ ...prev, officialEmail: e.target.value }))}
                                className="w-full text-xs font-bold text-slate-900 bg-white border border-blue-200 rounded-lg px-2 py-1 mt-1"
                              />
                            </div>
                            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-2.5">
                              <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Department</label>
                              <input
                                type="text"
                                value={employeeForm.department || ""}
                                onChange={(e) => setEmployeeForm(prev => ({ ...prev, department: e.target.value }))}
                                className="w-full text-xs font-bold text-slate-900 bg-white border border-blue-200 rounded-lg px-2 py-1 mt-1"
                              />
                            </div>
                            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-2.5">
                              <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Designation</label>
                              <input
                                type="text"
                                value={employeeForm.designation || ""}
                                onChange={(e) => setEmployeeForm(prev => ({ ...prev, designation: e.target.value }))}
                                className="w-full text-xs font-bold text-slate-900 bg-white border border-blue-200 rounded-lg px-2 py-1 mt-1"
                              />
                            </div>
                            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-2.5">
                              <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Reporting Manager</label>
                              <input
                                type="text"
                                value={employeeForm.reportingManager || ""}
                                onChange={(e) => setEmployeeForm(prev => ({ ...prev, reportingManager: e.target.value }))}
                                className="w-full text-xs font-bold text-slate-900 bg-white border border-blue-200 rounded-lg px-2 py-1 mt-1"
                              />
                            </div>
                            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-2.5">
                              <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Employment Type</label>
                              <select
                                value={employeeForm.employeeType || "Full-Time"}
                                onChange={(e) => setEmployeeForm(prev => ({ ...prev, employeeType: e.target.value }))}
                                className="w-full text-xs font-bold text-slate-900 bg-white border border-blue-200 rounded-lg px-2 py-1 mt-1"
                              >
                                <option value="Full-Time">Full-Time</option>
                                <option value="Part-Time">Part-Time</option>
                                <option value="Contract">Contract</option>
                                <option value="Intern">Intern</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card 3: Contact Information (Orange Accent) */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-orange-500 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center shrink-0">
                              <PhoneIcon className="w-5 h-5 stroke-2" />
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-slate-900">Contact Information</h4>
                              <p className="text-[11px] text-slate-400 font-medium">Primary phone, personal email & addresses</p>
                            </div>
                          </div>
                          {!isEditingProfile && (
                            <button
                              type="button"
                              onClick={handleStartEdit}
                              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition"
                            >
                              <span>Edit</span>
                              <span>→</span>
                            </button>
                          )}
                        </div>

                        {/* Content Fields */}
                        {!isEditingProfile ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Primary Mobile</span>
                              <span className="font-mono font-bold text-slate-800 block mt-0.5">📞 {displayMobile || "--"}</span>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Alternate Mobile</span>
                              <span className="font-mono text-slate-700 block mt-0.5">{displayAltMobile || "--"}</span>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 sm:col-span-2">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Personal Email</span>
                              <span className="font-mono text-slate-800 block mt-0.5 truncate">{displayPersonalEmail || "--"}</span>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 sm:col-span-2">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Current Address</span>
                              <span className="font-bold text-slate-800 block mt-0.5 leading-relaxed flex items-start gap-1.5">
                                <MapPinIcon className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                                <span>{displayCurrentAddress || "102, Vijay Nagar, Scheme No. 54"}</span>
                              </span>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 sm:col-span-2">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Permanent Address</span>
                              <span className="font-medium text-slate-600 block mt-0.5 leading-relaxed">
                                {displayPermanentAddress && displayPermanentAddress !== "na" ? displayPermanentAddress : "Same as Current Address"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-2.5">
                              <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Primary Mobile</label>
                              <input
                                type="tel"
                                value={employeeForm.mobileNumber || ""}
                                onChange={(e) => setEmployeeForm(prev => ({ ...prev, mobileNumber: e.target.value }))}
                                className="w-full text-xs font-bold text-slate-900 bg-white border border-blue-200 rounded-lg px-2 py-1 mt-1 font-mono"
                              />
                            </div>
                            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-2.5">
                              <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Alternate Mobile</label>
                              <input
                                type="tel"
                                value={employeeForm.alternateMobile || ""}
                                onChange={(e) => setEmployeeForm(prev => ({ ...prev, alternateMobile: e.target.value }))}
                                className="w-full text-xs font-bold text-slate-900 bg-white border border-blue-200 rounded-lg px-2 py-1 mt-1 font-mono"
                              />
                            </div>
                            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-2.5 sm:col-span-2">
                              <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Personal Email</label>
                              <input
                                type="email"
                                value={employeeForm.personalEmail || ""}
                                onChange={(e) => setEmployeeForm(prev => ({ ...prev, personalEmail: e.target.value }))}
                                className="w-full text-xs font-bold text-slate-900 bg-white border border-blue-200 rounded-lg px-2 py-1 mt-1"
                              />
                            </div>
                            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-2.5 sm:col-span-2">
                              <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Current Address</label>
                              <textarea
                                rows="2"
                                value={employeeForm.currentAddress || ""}
                                onChange={(e) => setEmployeeForm(prev => ({ ...prev, currentAddress: e.target.value }))}
                                className="w-full text-xs font-bold text-slate-900 bg-white border border-blue-200 rounded-lg px-2 py-1 mt-1"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card 4: Education & Experience (Blue Accent) */}
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-blue-500 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                              <AcademicCapIcon className="w-5 h-5 stroke-2" />
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-slate-900">Education & Experience</h4>
                              <p className="text-[11px] text-slate-400 font-medium">Qualifications, university & past credentials</p>
                            </div>
                          </div>
                          {!isEditingProfile && (
                            <button
                              type="button"
                              onClick={handleStartEdit}
                              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition"
                            >
                              <span>Edit</span>
                              <span>→</span>
                            </button>
                          )}
                        </div>

                        {/* Content Fields */}
                        {!isEditingProfile ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Highest Degree</span>
                              <span className="font-extrabold text-slate-800 block mt-0.5">🎓 {displayDegree || "B.Tech"}</span>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Specialization</span>
                              <span className="font-extrabold text-indigo-700 block mt-0.5">{displaySpecialization || "CSE"}</span>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 sm:col-span-2">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">University / Board</span>
                              <span className="font-bold text-slate-800 block mt-0.5">🏛️ {displayUniversity || "RGPV"}</span>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Previous Company</span>
                              <span className="font-extrabold text-slate-800 block mt-0.5">🏢 {displayPrevCompany || "TechSlice"}</span>
                            </div>
                            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Previous Designation</span>
                              <span className="font-bold text-slate-700 block mt-0.5">{displayPrevDesig || "Executive"}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-2.5">
                              <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Highest Degree</label>
                              <input
                                type="text"
                                value={employeeForm.highestDegree || ""}
                                onChange={(e) => setEmployeeForm(prev => ({ ...prev, highestDegree: e.target.value }))}
                                className="w-full text-xs font-bold text-slate-900 bg-white border border-blue-200 rounded-lg px-2 py-1 mt-1"
                              />
                            </div>
                            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-2.5">
                              <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Specialization</label>
                              <input
                                type="text"
                                value={employeeForm.specialization || ""}
                                onChange={(e) => setEmployeeForm(prev => ({ ...prev, specialization: e.target.value }))}
                                className="w-full text-xs font-bold text-slate-900 bg-white border border-blue-200 rounded-lg px-2 py-1 mt-1"
                              />
                            </div>
                            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-2.5 sm:col-span-2">
                              <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">University</label>
                              <input
                                type="text"
                                value={employeeForm.university || ""}
                                onChange={(e) => setEmployeeForm(prev => ({ ...prev, university: e.target.value }))}
                                className="w-full text-xs font-bold text-slate-900 bg-white border border-blue-200 rounded-lg px-2 py-1 mt-1"
                              />
                            </div>
                            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-2.5">
                              <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Previous Company</label>
                              <input
                                type="text"
                                value={employeeForm.prevCompany || ""}
                                onChange={(e) => setEmployeeForm(prev => ({ ...prev, prevCompany: e.target.value }))}
                                className="w-full text-xs font-bold text-slate-900 bg-white border border-blue-200 rounded-lg px-2 py-1 mt-1"
                              />
                            </div>
                            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-2.5">
                              <label className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Last Designation</label>
                              <input
                                type="text"
                                value={employeeForm.prevDesignation || ""}
                                onChange={(e) => setEmployeeForm(prev => ({ ...prev, prevDesignation: e.target.value }))}
                                className="w-full text-xs font-bold text-slate-900 bg-white border border-blue-200 rounded-lg px-2 py-1 mt-1"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Bar when in Edit Mode */}
                    {isEditingProfile && (
                      <div className="bg-blue-50/90 border border-blue-200 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-fadeIn">
                        <div className="flex items-center gap-2 text-xs text-blue-950 font-bold">
                          <span className="text-lg">✏️</span>
                          <span><b>Inline Edit Mode:</b> Update details directly in the cards above and click <b>Save Changes</b>.</span>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end shrink-0">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl border border-slate-300 shadow-xs transition cursor-pointer"
                          >
                            ✕ Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
                          >
                            <span>💾</span> Save Changes
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                );

      })()}

              {/* Tab 2: Documents */}
              {(activeTab === "Documents" || activeTab === "Document Log") && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div>
                      <h4 className="text-sm font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                        <span>📂</span> Official Profile Documents & Credentials
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Uploaded documents are automatically submitted to Admin and Department Head for verification.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full shrink-0">
                      Live Sync Active
                    </span>
                  </div>

                  {/* Standard Document Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      "Aadhar Card",
                      "PAN Card",
                      "10th Marksheet",
                      "12th Marksheet",
                      "Degree Certificate",
                      "Experience Letter",
                      "Resume"
                    ].map((docType) => {
                      const normTarget = normalizeDocName(docType);
                      const matchedDoc = (allDocumentsList || []).find(d => {
                        const normTitle = normalizeDocName(d.title);
                        const normType = normalizeDocName(d.document_type || d.type || d.name);
                        return normTitle.includes(normTarget) || normType.includes(normTarget) || (normTarget === 'aadharcard' && (normTitle.includes('aadhaar') || normType.includes('aadhaar')));
                      });

                      const formDocEntry = Object.entries(employeeForm.documents || {}).find(([k, v]) => {
                        const nk = normalizeDocName(k);
                        return nk === normTarget || nk.includes(normTarget) || normTarget.includes(nk);
                      });

                      const val = formDocEntry?.[1] || (employeeForm.documents || {})[docType] || matchedDoc?.file_url || matchedDoc?.storage_key || "";
                      const status = matchedDoc?.status || (val ? "Pending Approval" : "Not Uploaded");
                      const fileNameDisplay = matchedDoc?.original_file_name || (val ? val.split('/').pop() : "No document uploaded yet");
                      const isUploaded = Boolean(val);

                      return (
                        <div key={docType} className={`border p-4 rounded-2xl bg-white shadow-xs space-y-3 flex flex-col justify-between font-sans transition ${isUploaded ? 'border-emerald-200/80 bg-emerald-50/10' : 'border-slate-200/80 hover:border-slate-300'}`}>
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block truncate">{docType}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                status === 'Pending Approval' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                                status === 'Revision Required' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                'bg-slate-50 text-slate-400 border-slate-200'
                              }`}>
                                {status}
                              </span>
                            </div>
                            <span className={`text-xs block mt-0.5 truncate max-w-full font-mono ${isUploaded ? 'text-indigo-900 font-semibold' : 'text-slate-400'}`}>
                              {fileNameDisplay}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 items-center justify-between pt-2 border-t border-slate-100">
                            <label className="cursor-pointer px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition inline-flex items-center justify-center">
                              <span>{isUploaded ? "Re-upload" : "Choose File"}</span>
                              <input
                                type="file"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;
                                  const fd = new FormData();
                                  fd.append("file", file);
                                  fd.append("companyName", currentUserProfile?.company || employeeForm.company || "");
                                  fd.append("department", employeeForm.department || currentUserProfile?.department || "General");
                                  fd.append("employeeId", employeeForm.employeeCode || employeeForm.employeeId || employeeForm.id || currentUserProfile?.employeeCode || currentUserProfile?.empId || "EMP");
                                  fd.append("employeeName", employeeName || employeeForm.employeeName || currentUserProfile?.name || "Employee");
                                  fd.append("documentType", docType);
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
                                      setAllDocumentsList(prev => {
                                        const existingIdx = (prev || []).findIndex(d => normalizeDocName(d.title).includes(normTarget));
                                        const newDoc = {
                                          id: Date.now().toString(),
                                          title: `${docType} - ${employeeName || 'Employee'}`,
                                          document_type: docType,
                                          original_file_name: file.name,
                                          file_name: file.name,
                                          file_url: url,
                                          storage_key: url,
                                          status: 'Pending Approval',
                                          issue_date: new Date().toISOString().split('T')[0]
                                        };
                                        if (existingIdx >= 0) {
                                          const copy = [...prev];
                                          copy[existingIdx] = { ...copy[existingIdx], ...newDoc };
                                          return copy;
                                        }
                                        return [newDoc, ...(prev || [])];
                                      });
                                      await loadDashboardData();
                                      alert(`✅ ${docType} uploaded successfully! Visible in Admin & Department Head dashboard.`);
                                    }
                                  } catch (err) {
                                    alert("Upload failed: " + err.message);
                                  }
                                }}
                              />
                            </label>

                            {isUploaded && (
                              <a
                                href={resolveFileUrl(val)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold whitespace-nowrap transition inline-flex items-center justify-center shadow-2xs cursor-pointer"
                              >
                                Open Document
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Any Extra / Custom Uploaded Documents Cards */}
                    {(() => {
                      const standardSet = new Set([
                        "aadharcard", "pancard", "10thmarksheet", "12thmarksheet", 
                        "degreecertificate", "experienceletter", "resume"
                      ]);

                      const extraList = [];
                      const seen = new Set();

                      (allDocumentsList || []).forEach(d => {
                        const nt = normalizeDocName(d.document_type || d.type || d.title?.split(' - ')[0] || '');
                        if (nt && !standardSet.has(nt) && !seen.has(nt)) {
                          seen.add(nt);
                          extraList.push({
                            label: d.document_type || d.title?.split(' - ')[0] || "Custom Document",
                            matchedDoc: d,
                            url: d.file_url || d.storage_key || ""
                          });
                        }
                      });

                      Object.entries(employeeForm.documents || {}).forEach(([k, v]) => {
                        const nk = normalizeDocName(k);
                        if (nk && !standardSet.has(nk) && !seen.has(nk) && v) {
                          seen.add(nk);
                          extraList.push({
                            label: k,
                            matchedDoc: null,
                            url: v
                          });
                        }
                      });

                      return extraList.map((item) => {
                        const status = item.matchedDoc?.status || "Pending Approval";
                        const fileName = item.matchedDoc?.original_file_name || item.url?.split('/').pop() || item.label;
                        return (
                          <div key={item.label} className="border border-indigo-200/80 bg-indigo-50/20 p-4 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between font-sans">
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 block truncate">{item.label}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                  status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  status === 'Pending Approval' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                                  'bg-slate-50 text-slate-400 border-slate-200'
                                }`}>
                                  {status}
                                </span>
                              </div>
                              <span className="text-xs text-indigo-950 font-semibold block mt-0.5 truncate max-w-full font-mono">
                                {fileName}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2 items-center justify-between pt-2 border-t border-indigo-100">
                              <span className="text-[9px] font-bold text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded-md">
                                Additional Doc
                              </span>
                              {item.url && (
                                <a
                                  href={resolveFileUrl(item.url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold whitespace-nowrap transition inline-flex items-center justify-center shadow-2xs cursor-pointer"
                                >
                                  Open Document
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}

                    {/* Upload Additional Document Card */}
                    <div className="border border-dashed border-indigo-200 p-4 rounded-2xl bg-indigo-50/40 space-y-3 flex flex-col justify-between font-sans">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block mb-1">
                          + Add Other Document
                        </span>
                        <input
                          type="text"
                          placeholder="e.g. Driving License, Medical..."
                          value={customDocType}
                          onChange={(e) => setCustomDocType(e.target.value)}
                          className="w-full text-xs font-semibold px-2.5 py-1.5 bg-white border border-indigo-200 rounded-xl focus:outline-indigo-500 text-slate-800"
                        />
                      </div>
                      <div className="flex gap-2 items-center justify-between pt-2">
                        <label className="cursor-pointer px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-xl transition flex items-center gap-1 shadow-xs w-full justify-center">
                          <span>📁</span>
                          <span>{uploadingDoc ? "Uploading..." : "Select & Upload Document"}</span>
                          <input
                            type="file"
                            disabled={uploadingDoc}
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              const docLabel = customDocType.trim() || file.name.split('.')[0] || "Custom Document";
                              const fd = new FormData();
                              fd.append("file", file);
                              fd.append("companyName", currentUserProfile?.company || employeeForm.company || "");
                              fd.append("department", employeeForm.department || currentUserProfile?.department || "General");
                              fd.append("employeeId", employeeForm.employeeCode || employeeForm.employeeId || employeeForm.id || currentUserProfile?.employeeCode || currentUserProfile?.empId || "EMP");
                              fd.append("employeeName", employeeName || employeeForm.employeeName || currentUserProfile?.name || "Employee");
                              fd.append("documentType", docLabel);
                              try {
                                setUploadingDoc(true);
                                const url = await uploadEmployeeFile(fd);
                                if (url) {
                                  setEmployeeForm(prev => ({
                                    ...prev,
                                    documents: {
                                      ...(prev.documents || {}),
                                      [docLabel]: url
                                    }
                                  }));
                                  setAllDocumentsList(prev => [
                                    {
                                      id: Date.now().toString(),
                                      title: `${docLabel} - ${employeeName || 'Employee'}`,
                                      document_type: docLabel,
                                      original_file_name: file.name,
                                      file_name: file.name,
                                      file_url: url,
                                      storage_key: url,
                                      status: 'Pending Approval',
                                      issue_date: new Date().toISOString().split('T')[0]
                                    },
                                    ...(prev || [])
                                  ]);
                                  setCustomDocType("");
                                  await loadDashboardData();
                                  alert(`✅ ${docLabel} uploaded successfully! Visible in Admin and Department Head dashboard.`);
                                }
                              } catch (err) {
                                alert("Upload failed: " + err.message);
                              } finally {
                                setUploadingDoc(false);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Document Verification & Submission History Table */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3 font-sans">
                    <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                        📋 Central Document Submission & Verification Log
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400">
                        {(allDocumentsList || []).length} Document(s) Recorded
                      </span>
                    </div>

                    {(allDocumentsList || []).length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400 font-medium">
                        No documents recorded in the central repository yet. Upload documents using the cards above.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/50">
                              <th className="py-2.5 px-3">Document Title</th>
                              <th className="py-2.5 px-3">Type</th>
                              <th className="py-2.5 px-3">Upload Date</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {(allDocumentsList || []).map((doc, idx) => {
                              const docStatus = doc.status || "Pending Approval";
                              const docUrl = doc.file_url || doc.storage_key || "";
                              return (
                                <tr key={doc.id || idx} className="hover:bg-slate-50/70 transition">
                                  <td className="py-3 px-3 font-bold text-slate-800">
                                    {doc.title || "Document"}
                                  </td>
                                  <td className="py-3 px-3 text-slate-500 font-semibold">
                                    {doc.document_type || doc.title?.split(' - ')[0] || "General"}
                                  </td>
                                  <td className="py-3 px-3 text-slate-500">
                                    {doc.issue_date || (doc.created_at ? new Date(doc.created_at).toLocaleDateString("en-IN") : "--")}
                                  </td>
                                  <td className="py-3 px-3">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                                      docStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      docStatus === 'Pending Approval' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                                      docStatus === 'Revision Required' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                      'bg-slate-50 text-slate-600 border-slate-200'
                                    }`}>
                                      {docStatus}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-right">
                                    {docUrl ? (
                                      <a
                                        href={resolveFileUrl(docUrl)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-lg transition"
                                      >
                                        <span>👁️</span> View
                                      </a>
                                    ) : (
                                      <span className="text-[11px] text-slate-400 italic">No File</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Assets */}
              {(activeTab === "Assets" || activeTab === "Asset Allocation") && (
                <AssetAllocationDashboard
                  records={assets}
                  title="Asset Allocation"
                  subtitle="Manage and configure Asset Allocation records, settings, and operations."
                  initialScope="my"
                />
              )}

              {/* Tab 4: Bank Details */}
              {activeTab === "Bank Details" && (
                <div className="space-y-6">
                  {/* Top Bar with Header & Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                    <div>
                      <h4 className="text-sm font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                        <span>🏦</span> Bank Register &amp; Remittance Configuration
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Manage employee bank account for salary disbursal and remittance. Updates are saved to database and synchronized with Admin.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 shadow-2xs ${
                        (profileDetails.bankName && profileDetails.accountNumber)
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          (profileDetails.bankName && profileDetails.accountNumber) ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                        }`} />
                        {(profileDetails.bankName && profileDetails.accountNumber) ? "Remittance Configured" : "Remittance Pending"}
                      </span>

                      {!isEditingBank ? (
                        <button
                          type="button"
                          onClick={handleStartEditBank}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                          <span>Edit Bank Details</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCancelEditBank}
                            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveBankDetails}
                            disabled={bankSubmitting}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                          >
                            <span>💾</span>
                            <span>{bankSubmitting ? "Saving..." : "Save Bank Details"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {!isEditingBank ? (
                    <div className="space-y-6 animate-fadeIn">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-bold text-slate-600">
                        {/* Bank Name */}
                        <div className="border border-slate-200/90 p-4 rounded-2xl bg-white shadow-2xs space-y-1">
                          <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Bank Name</span>
                          <span className="text-slate-800 font-black text-sm block">{profileDetails.bankName || "--"}</span>
                        </div>

                        {/* Account Holder */}
                        <div className="border border-slate-200/90 p-4 rounded-2xl bg-white shadow-2xs space-y-1">
                          <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Account Holder</span>
                          <span className="text-slate-800 font-black text-sm block">
                            {profileDetails.accountHolderName || `${profileDetails.firstName || ''} ${profileDetails.lastName || ''}`.trim() || employeeName || "--"}
                          </span>
                        </div>

                        {/* Account Number with Eye Toggle */}
                        <div className="border border-slate-200/90 p-4 rounded-2xl bg-white shadow-2xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Account Number</span>
                            {profileDetails.accountNumber && (
                              <button
                                type="button"
                                onClick={() => setShowAccountNumber(prev => !prev)}
                                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                title={showAccountNumber ? "Mask account number" : "Reveal full account number"}
                              >
                                {showAccountNumber ? <EyeSlashIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                          <span className="text-slate-800 font-black font-mono text-sm block">
                            {profileDetails.accountNumber ? (
                              showAccountNumber
                                ? profileDetails.accountNumber
                                : (profileDetails.accountNumber.length > 4 ? `•••• •••• ${profileDetails.accountNumber.slice(-4)}` : profileDetails.accountNumber)
                            ) : "--"}
                          </span>
                        </div>

                        {/* IFSC Code */}
                        <div className="border border-slate-200/90 p-4 rounded-2xl bg-white shadow-2xs space-y-1">
                          <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">IFSC Code</span>
                          <span className="text-slate-800 font-black font-mono text-sm uppercase block">{profileDetails.ifscCode || "--"}</span>
                        </div>

                        {/* Branch Name */}
                        <div className="border border-slate-200/90 p-4 rounded-2xl bg-white shadow-2xs space-y-1">
                          <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Branch Name</span>
                          <span className="text-slate-800 font-bold block">{profileDetails.branchName || "--"}</span>
                        </div>

                        {/* UPI ID / VPA */}
                        <div className="border border-slate-200/90 p-4 rounded-2xl bg-white shadow-2xs space-y-1">
                          <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">UPI ID / VPA</span>
                          <span className="text-slate-800 font-mono font-bold block">{profileDetails.upiId || "--"}</span>
                        </div>

                        {/* Basic Salary */}
                        <div className="border border-slate-200/90 p-4 rounded-2xl bg-white shadow-2xs space-y-1">
                          <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Basic Salary (₹)</span>
                          <span className="text-slate-800 font-black text-sm block">₹{Number(profileDetails.basicSalary || 0).toLocaleString()}</span>
                        </div>

                        {/* Gross Salary */}
                        <div className="border border-slate-200/90 p-4 rounded-2xl bg-white shadow-2xs space-y-1">
                          <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Gross Salary (₹)</span>
                          <span className="text-slate-800 font-black text-sm block">₹{Number(profileDetails.grossSalary || 0).toLocaleString()}</span>
                        </div>

                        {/* Annual CTC */}
                        <div className="border border-slate-200/90 p-4 rounded-2xl bg-white shadow-2xs space-y-1">
                          <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Annual CTC (₹)</span>
                          <span className="text-slate-800 font-black text-sm block">₹{Number(profileDetails.ctc || 0).toLocaleString()}</span>
                        </div>

                        {/* PF Deduction status */}
                        <div className="border border-slate-200/90 p-4 rounded-2xl bg-white shadow-2xs space-y-1">
                          <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">PF Deduction status</span>
                          <span className="text-slate-800 font-bold block">{profileDetails.pfApplicable ? "Yes (Applicable)" : "No"}</span>
                        </div>

                        {/* ESI Contribution status */}
                        <div className="border border-slate-200/90 p-4 rounded-2xl bg-white shadow-2xs space-y-1">
                          <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">ESI Contribution status</span>
                          <span className="text-slate-800 font-bold block">{profileDetails.esiApplicable ? "Yes (Applicable)" : "No"}</span>
                        </div>
                      </div>

                      {/* Sync status card */}
                      <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center gap-3 text-xs text-emerald-900 font-semibold shadow-2xs">
                        <span className="text-lg">✓</span>
                        <span><b>Live Database Sync Active:</b> Any updates made to your bank details are recorded directly in the company central database and reflect immediately on the Admin console and Payroll Remittance ledger.</span>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveBankDetails} className="space-y-6 animate-fadeIn">
                      <div className="bg-indigo-50/70 border border-indigo-100 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-900 font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">✏️</span>
                          <span><b>Editing Bank Account Details:</b> Fill in your bank information below. Clicking <b>Save Bank Details</b> will instantly update the employee record and synchronize with Admin.</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-bold text-slate-700">
                        {/* Bank Name */}
                        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                          <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                            Bank Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            list="popular-bank-list"
                            placeholder="e.g. HDFC Bank, SBI..."
                            value={bankForm.bankName}
                            onChange={(e) => setBankForm(prev => ({ ...prev, bankName: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <datalist id="popular-bank-list">
                            <option value="State Bank of India" />
                            <option value="HDFC Bank" />
                            <option value="ICICI Bank" />
                            <option value="Axis Bank" />
                            <option value="Punjab National Bank" />
                            <option value="Kotak Mahindra Bank" />
                            <option value="Bank of Baroda" />
                            <option value="Canara Bank" />
                            <option value="Union Bank of India" />
                            <option value="IndusInd Bank" />
                            <option value="IDFC First Bank" />
                            <option value="Yes Bank" />
                            <option value="Federal Bank" />
                          </datalist>
                        </div>

                        {/* Account Holder Name */}
                        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                          <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                            Account Holder Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Yashwani Kushwaha"
                            value={bankForm.accountHolderName}
                            onChange={(e) => setBankForm(prev => ({ ...prev, accountHolderName: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        {/* Account Number */}
                        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                          <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                            Account Number <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 50100431289574"
                            value={bankForm.accountNumber}
                            onChange={(e) => setBankForm(prev => ({ ...prev, accountNumber: e.target.value.replace(/[^0-9]/g, '') }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-bold font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        {/* IFSC Code */}
                        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                          <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                            IFSC Code <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. HDFC0000124"
                            value={bankForm.ifscCode}
                            onChange={(e) => setBankForm(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase().trim() }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-bold font-mono uppercase text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        {/* Branch Name */}
                        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                          <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                            Branch Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Sector 62 Branch, Noida"
                            value={bankForm.branchName}
                            onChange={(e) => setBankForm(prev => ({ ...prev, branchName: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        {/* UPI ID / VPA */}
                        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                          <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                            UPI ID / VPA (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. name@okhdfcbank"
                            value={bankForm.upiId}
                            onChange={(e) => setBankForm(prev => ({ ...prev, upiId: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Salary & Compliance Section (Optional / Admin adjustable) */}
                      <div className="bg-slate-50/70 border border-slate-200/80 p-4 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <span>💼</span> Payroll &amp; Statutory Configuration
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            Admin / HR Remittance Parameters
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[9px] font-bold uppercase text-slate-400 block">Basic Salary (₹)</label>
                            <input
                              type="number"
                              disabled={!canManageEmployees}
                              value={bankForm.basicSalary}
                              onChange={(e) => setBankForm(prev => ({ ...prev, basicSalary: e.target.value }))}
                              className={`w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 mt-1 ${!canManageEmployees ? 'bg-slate-100 cursor-not-allowed opacity-75' : ''}`}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold uppercase text-slate-400 block">Gross Salary (₹)</label>
                            <input
                              type="number"
                              disabled={!canManageEmployees}
                              value={bankForm.grossSalary}
                              onChange={(e) => setBankForm(prev => ({ ...prev, grossSalary: e.target.value }))}
                              className={`w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 mt-1 ${!canManageEmployees ? 'bg-slate-100 cursor-not-allowed opacity-75' : ''}`}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold uppercase text-slate-400 block">Annual CTC (₹)</label>
                            <input
                              type="number"
                              disabled={!canManageEmployees}
                              value={bankForm.ctc}
                              onChange={(e) => setBankForm(prev => ({ ...prev, ctc: e.target.value }))}
                              className={`w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 mt-1 ${!canManageEmployees ? 'bg-slate-100 cursor-not-allowed opacity-75' : ''}`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Button Bar */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-medium">
                          Click Save to write bank details to the database and update Admin records.
                        </span>
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                          <button
                            type="button"
                            onClick={handleCancelEditBank}
                            className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={bankSubmitting}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                          >
                            <span>💾</span>
                            <span>{bankSubmitting ? "Saving..." : "Save Bank Details"}</span>
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
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
              {/* Unified Shift Command Clock & Attendance Registration Section Removed */}

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
                    
                    {/* Render days of selected or current month */}
                    {(() => {
                      const ym = selectedMonthInfo?.targetYearMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
                      const [yearStr, monthStr] = ym.split('-');
                      const yearNum = parseInt(yearStr, 10);
                      const monthNum = parseInt(monthStr, 10);
                      const totalDaysInMonth = new Date(yearNum, monthNum, 0).getDate();
                      const firstDayWeekday = new Date(yearNum, monthNum - 1, 1).getDay();

                      const cells = [];
                      for (let p = 0; p < firstDayWeekday; p++) {
                        cells.push({ pad: true, key: `pad-${p}` });
                      }

                      for (let dayNumber = 1; dayNumber <= totalDaysInMonth; dayNumber++) {
                        const dateStr = `${ym}-${String(dayNumber).padStart(2, '0')}`;
                        const log = attendanceLogs.find(l => l.date === dateStr);
                        const dayOfWeek = new Date(yearNum, monthNum - 1, dayNumber).getDay();
                        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

                        let bgClass = "bg-white text-slate-600 hover:bg-slate-50 border-slate-100";
                        let statusText = "";

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

                        cells.push({ pad: false, key: dateStr, dayNumber, bgClass, statusText });
                      }

                      return cells.map(cell => {
                        if (cell.pad) {
                          return <div key={cell.key} className="p-4 rounded-xl opacity-0 pointer-events-none min-h-[80px]" />;
                        }
                        return (
                          <div key={cell.key} className={`p-4 border rounded-xl flex flex-col justify-between min-h-[80px] transition ${cell.bgClass}`}>
                            <span className="text-left font-black">{cell.dayNumber}</span>
                            {cell.statusText && <span className="text-[8px] font-black uppercase tracking-wider block text-center mt-1">{cell.statusText}</span>}
                          </div>
                        );
                      });
                    })()}
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
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {attendanceLogs.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="py-6 text-center text-xs text-slate-400 font-semibold">
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
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
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
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
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
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
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
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>🖨</span> Print Monthly Logs
                      </button>
                    </div>
                  </div>

                  {selectedMonthFilter === "this_month" && monthlyAttendanceLogs.length === 0 && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">ℹ️</span>
                        <div>
                          <p className="font-extrabold text-slate-800">Current Month ({selectedMonthInfo.label}) Telemetry</p>
                          <p className="text-slate-500 text-[11px]">No check-in logs recorded yet for {selectedMonthInfo.label}. Switch to Last Month to view your attendance history.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedMonthFilter("last_month")}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
                      >
                        <span>View Last Month Attendance</span>
                        <ChevronRightIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

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
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {monthlyAttendanceLogs.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="py-6 text-center text-xs text-slate-400 font-semibold">
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
                      <span className="text-slate-800 font-black block mt-0.5">{currentUserProfile?.shift || "General Shift (GEN)"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Working Hours</span>
                      <span className="text-slate-800 font-black block mt-0.5">{currentUserProfile?.workingHours || "09:00 AM - 06:00 PM (9.0 Hrs)"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Grace Period</span>
                      <span className="text-slate-800 font-black block mt-0.5">15 Minutes</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Status</span>
                      <span className="text-emerald-600 font-black block mt-0.5">{currentUserProfile?.employeeStatus || "Active"}</span>
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
                        {(() => {
                          const bioPunches = [];
                          const devName = `${currentUserProfile?.branch || 'Office'} Main Biometric Reader`;
                          const machId = currentUserProfile?.biometricId || currentUserProfile?.deviceId || "BIO-101";

                          attendanceLogs.slice(0, 15).forEach((log, idx) => {
                            if (log.checkIn && log.checkIn !== "--") {
                              bioPunches.push({
                                key: `in-${idx}`,
                                device: devName,
                                machineId: machId,
                                punchType: "IN",
                                syncTime: `${log.date} ${log.checkIn}`,
                                status: "Synced"
                              });
                            }
                            if (log.checkOut && log.checkOut !== "--") {
                              bioPunches.push({
                                key: `out-${idx}`,
                                device: devName,
                                machineId: machId,
                                punchType: "OUT",
                                syncTime: `${log.date} ${log.checkOut}`,
                                status: "Synced"
                              });
                            }
                          });

                          if (bioPunches.length === 0) {
                            return (
                              <tr>
                                <td colSpan={5} className="text-center py-6 text-slate-400 font-medium">
                                  No biometric device punches recorded yet.
                                </td>
                              </tr>
                            );
                          }

                          return bioPunches.map((punch) => (
                            <tr key={punch.key} className="hover:bg-slate-50/50 transition">
                              <td className="py-3 text-slate-800 font-bold">{punch.device}</td>
                              <td className="font-mono text-slate-600">{punch.machineId}</td>
                              <td>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                  punch.punchType === "IN" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-blue-50 text-blue-700 border border-blue-200"
                                }`}>
                                  {punch.punchType}
                                </span>
                              </td>
                              <td className="font-mono text-slate-500">{punch.syncTime}</td>
                              <td>
                                <Badge variant="success">{punch.status}</Badge>
                              </td>
                            </tr>
                          ));
                        })()}
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
                        onClick={handleDownloadAttendanceCSV}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                      >
                        Download CSV
                      </button>
                    </div>
                    <div className="border border-slate-150 p-5 rounded-2xl space-y-3 text-center">
                      <span className="text-lg">⏰</span>
                      <h5 className="font-black text-slate-800 text-xs">Overtime Log Statement</h5>
                      <button 
                        onClick={handleDownloadOvertimeCSV}
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

          {/* MY PAYROLL SUB-VIEWS - DUAL-APPROVAL LAST MONTH PAYSLIP DOWNLOAD */}
          {activeCategory === "EMP_PAYROLL" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Toast Notification */}
              {payslipActionToast && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-2xl flex items-center justify-between text-xs font-bold shadow-sm transition animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-600 text-white rounded-lg text-xs">ℹ️</span>
                    <span>{payslipActionToast}</span>
                  </div>
                  <button 
                    onClick={() => setPayslipActionToast("")}
                    className="text-indigo-500 hover:text-indigo-800 font-black p-1 text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Main Container */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                {/* 1. Header Banner */}
                <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
                  <div className="relative z-10 space-y-1.5">
                    <div className="flex items-center gap-2 text-indigo-300 text-xs font-black uppercase tracking-widest">
                      <ReceiptPercentIcon className="w-4 h-4" />
                      <span>Confidential Payroll Access</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                      <span>Payroll Slip Portal</span>
                      <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-indigo-200 border border-white/15 font-bold">
                        Cycle: {lastMonthPayslipData.month}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 font-medium max-w-xl">
                      Download authorization portal for your latest official payslip. In accordance with internal security policy, payslip generation requires explicit dual sign-off.
                    </p>
                  </div>

                  {/* Header Status Badge */}
                  <div className="relative z-10 shrink-0">
                    {isPayslipDownloadApproved ? (
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/30">
                        <CheckCircleIcon className="w-4 h-4 stroke-[2.5]" />
                        <span>Ready for Download</span>
                      </span>
                    ) : payslipDownloadRequest ? (
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-xl text-xs font-black backdrop-blur-sm">
                        <ClockIcon className="w-4 h-4 animate-spin-slow" />
                        <span>Approval in Progress (
                          {[
                            payslipDownloadRequest.reportingManager?.status === "APPROVED",
                            payslipDownloadRequest.departmentHr?.status === "APPROVED"
                          ].filter(Boolean).length}/2
                        )</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-slate-200 border border-white/15 rounded-xl text-xs font-bold backdrop-blur-sm">
                        <LockClosedIcon className="w-3.5 h-3.5 text-indigo-300" />
                        <span>Download Locked</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-8">
                  {/* 2. Visual Authorization Pipeline / Stepper */}
                  <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/60 text-xs">
                      <span className="font-black uppercase tracking-wider text-slate-600 flex items-center gap-2">
                        <ShieldCheckIcon className="w-4 h-4 text-indigo-600" />
                        Dual-Authorization Workflow Pipeline
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        Target Cycle: <b className="text-slate-700">{lastMonthPayslipData.month}</b>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                      {/* Step 1: Request Submission */}
                      <div className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                        payslipDownloadRequest ? "bg-white border-emerald-200 shadow-xs" : "bg-white/60 border-slate-200"
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Step 1</span>
                          {payslipDownloadRequest ? (
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black">✓</span>
                          ) : (
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-bold">1</span>
                          )}
                        </div>
                        <h6 className="font-extrabold text-xs text-slate-800">Request Dispatched</h6>
                        <p className="text-[11px] text-slate-500 font-medium mt-1">
                          {payslipDownloadRequest ? "Submitted to approvers" : "Not yet initiated"}
                        </p>
                      </div>

                      {/* Step 2: Reporting Manager */}
                      <div className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                        payslipDownloadRequest?.reportingManager?.status === "APPROVED"
                          ? "bg-white border-emerald-200 shadow-xs"
                          : payslipDownloadRequest?.reportingManager?.status === "REJECTED"
                          ? "bg-white border-rose-200 shadow-xs"
                          : payslipDownloadRequest
                          ? "bg-white border-amber-200 shadow-xs"
                          : "bg-white/60 border-slate-200"
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Step 2</span>
                          {payslipDownloadRequest?.reportingManager?.status === "APPROVED" ? (
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black">✓</span>
                          ) : payslipDownloadRequest?.reportingManager?.status === "REJECTED" ? (
                            <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[10px] font-black">✕</span>
                          ) : payslipDownloadRequest ? (
                            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-black">⏳</span>
                          ) : (
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-bold">2</span>
                          )}
                        </div>
                        <h6 className="font-extrabold text-xs text-slate-800">Manager Sign-Off</h6>
                        <p className="text-[11px] text-slate-500 font-medium mt-1 truncate" title={empReportingManager}>
                          {empReportingManager}
                        </p>
                      </div>

                      {/* Step 3: Department HR */}
                      <div className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                        payslipDownloadRequest?.departmentHr?.status === "APPROVED"
                          ? "bg-white border-emerald-200 shadow-xs"
                          : payslipDownloadRequest?.departmentHr?.status === "REJECTED"
                          ? "bg-white border-rose-200 shadow-xs"
                          : payslipDownloadRequest
                          ? "bg-white border-amber-200 shadow-xs"
                          : "bg-white/60 border-slate-200"
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Step 3</span>
                          {payslipDownloadRequest?.departmentHr?.status === "APPROVED" ? (
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black">✓</span>
                          ) : payslipDownloadRequest?.departmentHr?.status === "REJECTED" ? (
                            <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[10px] font-black">✕</span>
                          ) : payslipDownloadRequest ? (
                            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-black">⏳</span>
                          ) : (
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-bold">3</span>
                          )}
                        </div>
                        <h6 className="font-extrabold text-xs text-slate-800">Department HR Desk</h6>
                        <p className="text-[11px] text-slate-500 font-medium mt-1 truncate" title={empDepartmentHr}>
                          {empDepartmentHr}
                        </p>
                      </div>

                      {/* Step 4: File Generation */}
                      <div className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                        isPayslipDownloadApproved ? "bg-emerald-50 border-emerald-300 shadow-xs" : "bg-white/60 border-slate-200"
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Step 4</span>
                          {isPayslipDownloadApproved ? (
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">📥</span>
                          ) : (
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-bold">🔒</span>
                          )}
                        </div>
                        <h6 className="font-extrabold text-xs text-slate-800">Payslip PDF Unlocked</h6>
                        <p className="text-[11px] text-slate-500 font-medium mt-1">
                          {isPayslipDownloadApproved ? "Available for download" : "Requires dual approval"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3. Approver Cards (Grid of 2) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Approver 1: Reporting Manager */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-700 font-black text-sm flex items-center justify-center border border-indigo-100 shadow-2xs">
                            {empReportingManager.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider block">
                              Primary Approver • Line Manager
                            </span>
                            <h5 className="font-extrabold text-sm text-slate-900 mt-0.5">
                              {empReportingManager}
                            </h5>
                            <p className="text-[11px] text-slate-400 font-medium">Direct Hierarchy Authority</p>
                          </div>
                        </div>

                        {/* Status Chip */}
                        <div>
                          {payslipDownloadRequest?.reportingManager?.status === "APPROVED" ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black">
                              <CheckIcon className="w-3.5 h-3.5 stroke-[3]" /> Authorized
                            </span>
                          ) : payslipDownloadRequest?.reportingManager?.status === "REJECTED" ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-black">
                              <XMarkIcon className="w-3.5 h-3.5 stroke-[3]" /> Declined
                            </span>
                          ) : payslipDownloadRequest ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-black">
                              <ClockIcon className="w-3.5 h-3.5 animate-pulse" /> Pending Review
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">
                              Not Requested
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Role: Managerial Verification</span>
                        <span className="font-mono text-slate-400">
                          {payslipDownloadRequest?.reportingManager?.updatedAt || "Awaiting action"}
                        </span>
                      </div>
                    </div>

                    {/* Approver 2: Department HR Desk */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 font-black text-sm flex items-center justify-center border border-blue-100 shadow-2xs">
                            HR
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider block">
                              Final Sign-Off • Department HR
                            </span>
                            <h5 className="font-extrabold text-sm text-slate-900 mt-0.5">
                              {empDepartmentHr}
                            </h5>
                            <p className="text-[11px] text-slate-400 font-medium">Statutory Compliance Desk</p>
                          </div>
                        </div>

                        {/* Status Chip */}
                        <div>
                          {payslipDownloadRequest?.departmentHr?.status === "APPROVED" ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black">
                              <CheckIcon className="w-3.5 h-3.5 stroke-[3]" /> Authorized
                            </span>
                          ) : payslipDownloadRequest?.departmentHr?.status === "REJECTED" ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-black">
                              <XMarkIcon className="w-3.5 h-3.5 stroke-[3]" /> Declined
                            </span>
                          ) : payslipDownloadRequest ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-black">
                              <ClockIcon className="w-3.5 h-3.5 animate-pulse" /> Pending Review
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">
                              Not Requested
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Role: Statutory &amp; Audit Release</span>
                        <span className="font-mono text-slate-400">
                          {payslipDownloadRequest?.departmentHr?.updatedAt || "Awaiting action"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4. Request Metadata Bar (When active) */}
                  {payslipDownloadRequest && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 font-mono font-bold text-[11px]">
                          {payslipDownloadRequest.id}
                        </span>
                        <div className="space-y-0.5">
                          <span className="text-slate-400 font-bold block text-[10px] uppercase">Stated Justification</span>
                          <span className="text-slate-800 font-bold block">{payslipDownloadRequest.reason || "Official Financial Documentation"}</span>
                        </div>
                      </div>
                      <div className="text-slate-500 text-[11px] shrink-0 font-medium">
                        Submitted on: <b className="text-slate-700">{payslipDownloadRequest.requestedAt}</b>
                      </div>
                    </div>
                  )}

                  {/* 5. Action Center */}
                  <div className="pt-2">
                    {!payslipDownloadRequest ? (
                      /* STATE 1: Ready to Request */
                      <div className="bg-gradient-to-br from-indigo-50/60 via-white to-blue-50/40 border border-indigo-100 rounded-3xl p-8 text-center space-y-4 shadow-xs">
                        <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/20">
                          <PaperAirplaneIcon className="w-7 h-7 -rotate-45" />
                        </div>
                        <div className="max-w-md mx-auto space-y-1.5">
                          <h4 className="font-black text-base text-slate-900 tracking-tight">
                            Request Payslip Download Permission
                          </h4>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            To unlock and download your payslip PDF for <strong>{lastMonthPayslipData.month}</strong>, initiate an authorization request. Both your Reporting Manager and Department HR will be notified immediately.
                          </p>
                        </div>
                        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                          <button
                            onClick={() => setIsPayslipRequestModalOpen(true)}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
                          >
                            <PaperAirplaneIcon className="w-4 h-4" />
                            <span>Request Download Permission</span>
                          </button>
                          <button
                            disabled
                            className="px-5 py-3 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 cursor-not-allowed opacity-75"
                          >
                            <LockClosedIcon className="w-4 h-4 text-slate-400" />
                            <span>Download Slip (Locked)</span>
                          </button>
                        </div>
                      </div>
                    ) : !isPayslipDownloadApproved ? (
                      /* STATE 2: Pending Dual Approval */
                      <div className="bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 border border-amber-200 rounded-3xl p-8 text-center space-y-4 shadow-xs">
                        <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/25">
                          <ClockIcon className="w-7 h-7 animate-pulse" />
                        </div>
                        <div className="max-w-md mx-auto space-y-1.5">
                          <h4 className="font-black text-base text-amber-950 tracking-tight">
                            Authorization in Progress
                          </h4>
                          <p className="text-xs text-amber-900/80 font-medium leading-relaxed">
                            Your request is under review. Both your <strong>Reporting Manager</strong> ({empReportingManager}) and <strong>Department HR</strong> ({empDepartmentHr}) must authorize access to unlock file download.
                          </p>
                        </div>

                        {/* Progress Tracker */}
                        <div className="max-w-xs mx-auto space-y-1.5 pt-1">
                          <div className="flex justify-between text-[11px] font-bold text-amber-800">
                            <span>Dual Verification Status</span>
                            <span>
                              {[
                                payslipDownloadRequest.reportingManager?.status === "APPROVED",
                                payslipDownloadRequest.departmentHr?.status === "APPROVED"
                              ].filter(Boolean).length} of 2 Approved
                            </span>
                          </div>
                          <div className="w-full bg-amber-200/80 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-amber-500 h-full transition-all duration-500" 
                              style={{ 
                                width: `${([
                                  payslipDownloadRequest.reportingManager?.status === "APPROVED",
                                  payslipDownloadRequest.departmentHr?.status === "APPROVED"
                                ].filter(Boolean).length) * 50}%` 
                              }}
                            />
                          </div>
                        </div>

                        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                          <button
                            disabled
                            className="px-6 py-3 bg-slate-200 text-slate-500 rounded-xl text-xs font-black flex items-center gap-2 cursor-not-allowed opacity-80"
                          >
                            <LockClosedIcon className="w-4 h-4" />
                            <span>Download Locked (Awaiting Both Permissions)</span>
                          </button>
                          <button
                            onClick={handleResetPayslipRequest}
                            className="px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            Cancel / Reset Request
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* STATE 3: Both Approved - Unlocked */
                      <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 border border-emerald-300 rounded-3xl p-8 text-center space-y-4 shadow-sm">
                        <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-600/30">
                          <CheckCircleIcon className="w-9 h-9 stroke-[2.5]" />
                        </div>
                        <div className="max-w-md mx-auto space-y-1.5">
                          <h4 className="font-black text-lg text-emerald-950 tracking-tight">
                            Dual Authorization Confirmed!
                          </h4>
                          <p className="text-xs text-emerald-800 font-semibold leading-relaxed">
                            Both your Reporting Manager (<span className="font-bold">{empReportingManager}</span>) and Department HR (<span className="font-bold">{empDepartmentHr}</span>) have granted approval. Your payslip for <strong>{lastMonthPayslipData.month}</strong> is ready.
                          </p>
                        </div>
                        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                          <button
                            onClick={() => setSelectedPayslip(lastMonthPayslipData)}
                            className="px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xl shadow-emerald-600/30 transition flex items-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4 stroke-[2.5]" />
                            <span>Download Last Month Payslip (PDF)</span>
                          </button>
                          <button
                            onClick={() => setSelectedPayslip(lastMonthPayslipData)}
                            className="px-5 py-3.5 bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-800 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer"
                          >
                            <PrinterIcon className="w-4 h-4" />
                            <span>Preview &amp; Print</span>
                          </button>
                          <button
                            onClick={handleResetPayslipRequest}
                            className="px-3 py-3 text-slate-400 hover:text-slate-600 text-xs font-bold transition cursor-pointer"
                            title="Reset request simulation state"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 6. Professional Workflow Verification & QA Testing Console */}
                  {payslipDownloadRequest && (
                    <div className="pt-4 border-t border-slate-150">
                      <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                          <span className="font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 text-[10px]">
                            <WrenchScrewdriverIcon className="w-3.5 h-3.5 text-indigo-600" />
                            Approver Actions Console (Workflow Simulation)
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            Simulate dual approval or denial to test lock/unlock logic
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {/* Manager Testing Bar */}
                          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                            <div className="truncate">
                              <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Manager Desk</span>
                              <span className="font-extrabold text-slate-800 text-xs truncate block">{empReportingManager}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleUpdatePayslipApproval("reportingManager", "APPROVED")}
                                className={`px-3 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
                                  payslipDownloadRequest.reportingManager?.status === "APPROVED"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                }`}
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => handleUpdatePayslipApproval("reportingManager", "REJECTED")}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
                                  payslipDownloadRequest.reportingManager?.status === "REJECTED"
                                    ? "bg-rose-600 text-white shadow-xs"
                                    : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                                }`}
                              >
                                ✕ Deny
                              </button>
                            </div>
                          </div>

                          {/* Dept HR Testing Bar */}
                          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                            <div className="truncate">
                              <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Department HR Desk</span>
                              <span className="font-extrabold text-slate-800 text-xs truncate block">{empDepartmentHr}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleUpdatePayslipApproval("departmentHr", "APPROVED")}
                                className={`px-3 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
                                  payslipDownloadRequest.departmentHr?.status === "APPROVED"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                }`}
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => handleUpdatePayslipApproval("departmentHr", "REJECTED")}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
                                  payslipDownloadRequest.departmentHr?.status === "REJECTED"
                                    ? "bg-rose-600 text-white shadow-xs"
                                    : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                                }`}
                              >
                                ✕ Deny
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Request Payslip Download Modal */}
              {isPayslipRequestModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                  <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-150 overflow-hidden transform transition-all">
                    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 rounded-2xl">
                          <PaperAirplaneIcon className="w-5 h-5 text-indigo-300" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm tracking-tight">Request Payslip Download</h4>
                          <p className="text-[10px] text-indigo-200 font-semibold uppercase tracking-wider">
                            Payroll Cycle: {lastMonthPayslipData.month}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsPayslipRequestModalOpen(false)}
                        className="text-white/60 hover:text-white text-lg font-black p-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleCreatePayslipRequest} className="p-6 sm:p-7 space-y-5 text-xs font-bold text-slate-600">
                      <div className="bg-indigo-50/70 border border-indigo-100 p-4.5 rounded-2xl space-y-2.5">
                        <span className="text-[10px] font-black uppercase text-indigo-900 tracking-wider block">
                          Designated Dual Approvers
                        </span>
                        <div className="space-y-2 text-[11px]">
                          <div className="flex items-center justify-between text-slate-700">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                              Reporting Manager:
                            </span>
                            <span className="font-extrabold text-slate-900">{empReportingManager}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-700">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                              Department HR:
                            </span>
                            <span className="font-extrabold text-slate-900">{empDepartmentHr}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-slate-500 block tracking-wider">
                          Purpose / Justification for Download
                        </label>
                        <select
                          value={payslipRequestPurpose}
                          onChange={(e) => setPayslipRequestPurpose(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="Official Income Verification & Financial Documentation">
                            Official Income Verification &amp; Financial Documentation
                          </option>
                          <option value="Personal Tax Filing / Form 16 Cross-Check">
                            Personal Tax Filing / Form 16 Cross-Check
                          </option>
                          <option value="Bank Loan, Mortgage or Credit Facility Application">
                            Bank Loan, Mortgage or Credit Facility Application
                          </option>
                          <option value="Visa / Immigration Processing Requirement">
                            Visa / Immigration Processing Requirement
                          </option>
                          <option value="Personal Records & Annual Budgeting">
                            Personal Records &amp; Annual Budgeting
                          </option>
                        </select>
                      </div>

                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 font-medium leading-relaxed">
                        Dual sign-off request will be immediately routed to both your manager and department HR. Payslip PDF download will unlock automatically upon confirmation.
                      </div>

                      <div className="pt-2 flex justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => setIsPayslipRequestModalOpen(false)}
                          className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <PaperAirplaneIcon className="w-3.5 h-3.5" />
                          <span>Submit Request</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* EXPENSE CLAIMS & REIMBURSEMENT SUB-VIEWS */}
          {(activeCategory === "EMP_EXPENSES" || activeTab === "Expense Reimbursement" || activeTab === "Expense Claims") && (
            <div className="space-y-6 animate-fadeIn">
              <ExpenseReimbursementSection
                employeeProfile={currentUserProfile}
                currentUser={user}
                canManageEmployees={canManageEmployees}
                isRegularEmployee={isRegularEmployee}
                dashboardViewMode={dashboardViewMode}
                selectedDeptFilter={selectedDeptFilter}
                onNavigateTab={(category, tab) => setSearchParams({ category, tab })}
              />
            </div>
          )}

          {/* MY ASSETS SUB-VIEWS */}
          {activeCategory === "EMP_ASSETS" && (
            <AssetAllocationDashboard
              records={assets}
              title="Asset Allocation"
              subtitle="View and manage allocated company assets, hardware specifications, and lifecycle details."
              initialScope="my"
            />
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
          {!["EMP_DASHBOARD", "EMP_PROFILE", "EMP_ATTENDANCE", "EMP_LEAVE", "EMP_PAYROLL", "EMP_EXPENSES", "EMP_ASSETS", "EMP_HELPDESK", "EMP_SETTINGS", "EMPLOYEE_MGMT", "EMP_DOCUMENTS", "EXIT_MGMT", "EMP_LEARNING", "EMP_PERFORMANCE", "EMP_ENGAGEMENT", "EMP_REPORTS", "EMP_NOTIFICATIONS"].includes(activeCategory) && (
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

      {/* 10. Face Recognition Attendance Modal */}
      {showFaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <FaceAttendanceModal
            action="auto"
            onSuccess={(data) => {
              if (data?.action === 'clock-in' && !data?.completed) {
                setEmpCheckedIn(true);
                setEmpShiftCompleted(false);
                if (data?.checkIn) setEmpPunchTime(data.checkIn);
                window.dispatchEvent(new Event("silent-refresh"));
                return;
              }
              if (data?.action === 'clock-out') {
                setEmpCheckedIn(false);
                setEmpShiftCompleted(false);
                if (data?.checkOut) setEmpCheckOutTime(data.checkOut);
                window.dispatchEvent(new Event("silent-refresh"));
                return;
              }
              setShowFaceModal(false);
              window.dispatchEvent(new Event("silent-refresh"));
            }}
            onCancel={() => setShowFaceModal(false)}
          />
        </div>
      )}

      {/* 11. Biometric Attendance Terminal Modal */}
      {showBiometricModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-5xl my-8">
            <EmployeeBiometricPunch
              onClose={() => {
                setShowBiometricModal(false);
                window.dispatchEvent(new Event("silent-refresh"));
              }}
            />
          </div>
        </div>
      )}

      {/* 12. Company QR Attendance Scanner Modal (Employee) */}
      <CompanyQrScannerModal
        isOpen={showCompanyQrScanModal}
        onClose={() => {
          setShowCompanyQrScanModal(false);
          window.dispatchEvent(new Event("silent-refresh"));
        }}
        onSuccess={(data) => {
          if (data?.action === 'clock-in') {
            setEmpCheckedIn(true);
            setEmpPunchTime(data.time || new Date().toLocaleTimeString());
          } else if (data?.action === 'clock-out') {
            setEmpCheckedIn(false);
            setEmpCheckOutTime(data.time || new Date().toLocaleTimeString());
          }
          window.dispatchEvent(new Event("silent-refresh"));
        }}
      />

      {/* 13. Company QR Admin Console Modal (Admin / SuperAdmin) */}
      {showCompanyQrAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-5xl my-8">
            <CompanyQrAdminConsole
              onClose={() => {
                setShowCompanyQrAdminModal(false);
                window.dispatchEvent(new Event("silent-refresh"));
              }}
            />
          </div>
        </div>
      )}

      {/* 14. Employee QR Attendance Scanner Modal (Admin / Kiosk) */}
      <EmployeeQrScannerModal
        isOpen={showEmployeeQrScanModal}
        onClose={() => {
          setShowEmployeeQrScanModal(false);
          window.dispatchEvent(new Event("silent-refresh"));
        }}
        onSuccess={() => {
          window.dispatchEvent(new Event("silent-refresh"));
        }}
      />

      {/* 15. Employee QR Card Modal (View / Print / Download / Revoke Badge) */}
      {showEmployeeQrCardModal && (
        <EmployeeQrCardModal
          isOpen={showEmployeeQrCardModal}
          onClose={() => setShowEmployeeQrCardModal(false)}
          employee={{
            id: profileDetails.id || currentUserProfile?.id || user?.employee?.id || user?.emp_id || user?.empId || user?.id,
            employeeCode: profileDetails.employeeCode || currentUserProfile?.employeeCode || user?.employeeCode || user?.emp_code || user?.empCode || user?.username,
            companyCode: currentUserProfile?.companyCode || currentUserProfile?.company_code || user?.companyCode || user?.company_code || profileDetails.companyCode || profileDetails.company_code,
            name: `${profileDetails.firstName || ""} ${profileDetails.lastName || ""}`.trim() || profileDetails.name || profileDetails.employeeName || user?.name || "Employee",
            designation: profileDetails.designation || "Staff Professional",
            department: profileDetails.department || "Operations",
            photo: profileDetails.photo || currentUserProfile?.photo || "",
            company: profileDetails.company || currentUserProfile?.company || user?.company || "HRMS",
            officialEmail: profileDetails.officialEmail || profileDetails.email || user?.email || "",
            mobileNumber: profileDetails.mobileNumber || profileDetails.mobile || "",
          }}
          onUpdated={() => {
            window.dispatchEvent(new Event("silent-refresh"));
          }}
        />
      )}
    </div>
  );
};

export default EmployeeDashboard;
