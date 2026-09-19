import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  UserGroupIcon,
  CheckCircleIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  SparklesIcon,
  PlusIcon,
  TableCellsIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  IdentificationIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  CheckIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentCheckIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  DocumentArrowUpIcon,
  ClockIcon,
  CalendarDaysIcon,
  ListBulletIcon,
  WrenchScrewdriverIcon,
  FolderArrowDownIcon,
  KeyIcon,
  EllipsisVerticalIcon
} from "@heroicons/react/24/outline";
import { deleteTableRecord, createTableRecord, updateTableRecord, getTableData, apiFetch } from "../../services/hrApi";
import { useAuth } from "../../auth/AuthProvider";

// 17 Tab definitions matching exactly
const TABS = [
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
];

// Initial structure for new / edit employee
const getInitialFormState = () => ({
  // Tab 1
  photo: "",
  employeeId: "", // Auto-generated UUID or custom serial
  employeeCode: "",
  firstName: "",
  middleName: "",
  lastName: "",
  gender: "Male",
  dateOfBirth: "",
  maritalStatus: "Single",
  bloodGroup: "O+",
  nationality: "Indian",

  // Tab 2
  company: "NIB Insurance",
  branch: "",
  department: "",
  designation: "",
  reportingManager: "",
  employeeType: "Full Time",
  employmentStatus: "Active",
  dateOfJoining: "",
  probationEndDate: "",
  confirmationDate: "",
  workLocation: "",
  shift: "General Shift (09:00 - 18:00)",
  weeklyOff: "Sunday",

  // Tab 3
  mobileNumber: "",
  alternateMobile: "",
  personalEmail: "",
  officialEmail: "",
  currentAddress: "",
  permanentAddress: "",
  city: "",
  state: "",
  country: "India",
  pinCode: "",

  // Tab 4
  aadhaarNumber: "",
  panNumber: "",
  passportNumber: "",
  drivingLicense: "",
  voterId: "",
  uanNumber: "",
  esicNumber: "",

  // Tab 5
  bankName: "",
  accountHolderName: "",
  accountNumber: "",
  ifscCode: "",
  branchName: "",
  salaryStructure: "Standard",
  basicSalary: "",
  grossSalary: "",
  ctc: "",
  pfApplicable: false,
  esiApplicable: false,
  tdsApplicable: false,

  // Tab 6
  emergencyContactName: "",
  emergencyRelationship: "",
  emergencyMobile: "",
  emergencyAddress: "",

  // Tab 7 (Multiple records support)
  education: [], // Array of { qualification, institute, university, passingYear, percentage, certificate }
  // Tab 8 (Multiple records support)
  experience: [], // Array of { company, designation, joiningDate, leavingDate, experience, salary, letter }
  // Tab 9 (Multiple records support)
  skills: [], // Array of { skill, skillLevel, certification, organization, issueDate, expiryDate }

  // Tab 10
  shiftPolicy: "General Shift",
  workingHours: "8",
  attendancePolicy: "Biometric Integration",
  biometricId: "",
  deviceId: "",
  overtimeEligible: false,

  // Tab 11
  leavePolicy: "Standard Policy",
  casualLeave: "12",
  sickLeave: "12",
  earnedLeave: "15",
  maternityLeave: "84",
  paternityLeave: "15",

  // Tab 12 (Multiple records support)
  assets: [], // Array of { assetType, assetCode, assetName, serialNumber, assignedDate, returnDate, status }

  // Tab 13
  username: "",
  password: "",
  confirmPassword: "",
  role: "Employee",
  permissionGroup: "Standard",
  twoFactorAuth: false,

  // Tab 14
  documents: {
    resume: "",
    aadhaar: "",
    pan: "",
    photo: "",
    educationCert: "",
    experienceCert: "",
    offerLetter: "",
    appointmentLetter: "",
    salarySlips: "",
    others: ""
  },

  // Tab 15
  kpis: [], // Array of { kpi, rating, appraisalDate, promotionHistory, awards }

  // Tab 16
  resignationDate: "",
  lastWorkingDate: "",
  exitReason: "",
  exitInterview: "",
  clearanceStatus: "Pending",
  finalSettlement: "Pending",

  // Tab 17
  createdBy: "System Admin",
  createdDate: new Date().toISOString().split("T")[0],
  updatedBy: "",
  updatedDate: "",
  lastLogin: "",
  lastPasswordChange: "",
  recordStatus: "Active",
  activityTimeline: []
});

const EmployeeProfile = ({ records = [], dbData = {}, openCreateTrigger, onOpenEdit, onDelete, onRefreshData }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [liveDepartments, setLiveDepartments] = useState([]);
  const [liveDesignations, setLiveDesignations] = useState([]);

  React.useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [deptRes, desigRes] = await Promise.all([
          getTableData("department"),
          getTableData("designation")
        ]);
        const deptArray = Array.isArray(deptRes) ? deptRes : (deptRes?.data && Array.isArray(deptRes.data) ? deptRes.data : []);
        if (deptArray.length > 0) {
          setLiveDepartments(deptArray);
        }
        const desigArray = Array.isArray(desigRes) ? desigRes : (desigRes?.data && Array.isArray(desigRes.data) ? desigRes.data : []);
        if (desigArray.length > 0) {
          setLiveDesignations(desigArray);
        }
      } catch (err) {
        console.error("Error fetching dropdown data in EmployeeProfile:", err);
      }
    };
    fetchDropdownData();
  }, []);

  const departmentsList = useMemo(() => {
    if (liveDepartments.length > 0) return liveDepartments;
    const fromDb = dbData["Department"] || dbData["departments"] || dbData["department"] || [];
    return Array.isArray(fromDb) ? fromDb : [];
  }, [liveDepartments, dbData]);

  const designationsList = useMemo(() => {
    if (liveDesignations.length > 0) return liveDesignations;
    const fromDb = dbData["Designation"] || dbData["designations"] || dbData["designation"] || [];
    return Array.isArray(fromDb) ? fromDb : [];
  }, [liveDesignations, dbData]);

  const userRole = typeof user?.role === "object" ? user?.role?.name : user?.role;
  const isAuthorizedAdmin = userRole === "SuperAdmin" || userRole === "Admin";
  const activeTabs = isAuthorizedAdmin
    ? ["Basic Information", "Official Information", "System Login"]
    : TABS;

  const [selectedEmp, setSelectedEmp] = useState(null);
  const [empLeaves, setEmpLeaves] = useState([]);
  const [rejectionReasons, setRejectionReasons] = useState({});

  const loadLeavesForEmployee = async (employee) => {
    if (!employee) return;
    try {
      const res = await getTableData("leave_requests");
      const list = res?.data || [];
      const code = employee.employeeCode || employee.emp_code || employee.employee_code || employee.employeeId || "";
      const filtered = list.filter(l => 
        (l.employeeId && code && String(l.employeeId).toLowerCase().trim() === String(code).toLowerCase().trim()) ||
        (l.employee_id && code && String(l.employee_id).toLowerCase().trim() === String(code).toLowerCase().trim()) ||
        (l.employeeId && String(l.employeeId).toLowerCase().trim() === String(employee.id).toLowerCase().trim()) ||
        (l.employee_id && String(l.employee_id).toLowerCase().trim() === String(employee.id).toLowerCase().trim()) ||
        (l.empName === employee.firstName || l.empName === employee.employeeName)
      );
      setEmpLeaves(filtered);
    } catch (e) {
      console.error("Failed to load employee leaves:", e);
    }
  };

  React.useEffect(() => {
    if (selectedEmp) {
      loadLeavesForEmployee(selectedEmp);
    } else {
      setEmpLeaves([]);
    }
  }, [selectedEmp]);

  const handleAdminApproveLeave = async (leaveId) => {
    try {
      await updateTableRecord("leave_requests", leaveId, { status: "Approved" });
      showToast("Leave approved successfully!", "success");
      if (selectedEmp) {
        await loadLeavesForEmployee(selectedEmp);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error("Failed to approve leave:", err);
      showToast("Error approving leave request.", "error");
    }
  };

  const handleAdminRejectLeave = async (leaveId) => {
    const reason = rejectionReasons[leaveId] || "";
    if (!reason.trim()) {
      showToast("Please provide a rejection reason first.", "error");
      return;
    }
    try {
      await updateTableRecord("leave_requests", leaveId, { 
        status: "Rejected",
        rejectionReason: reason
      });
      showToast("Leave request rejected.", "success");
      setRejectionReasons(prev => ({ ...prev, [leaveId]: "" }));
      if (selectedEmp) {
        await loadLeavesForEmployee(selectedEmp);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error("Failed to reject leave:", err);
      showToast("Error rejecting leave request.", "error");
    }
  };
  const [deletedIds, setDeletedIds] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [activeActionsMenu, setActiveActionsMenu] = useState(null);

  // Filters State
  const [filters, setFilters] = useState({
    company: "",
    branch: "",
    department: "",
    designation: "",
    employeeType: "",
    status: "",
    reportingManager: "",
    dateOfJoining: "",
    shift: ""
  });

  // Toast Notifications
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 4000);
  };

  // Add/Edit Wizard State
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState("Basic Information");
  const [formFields, setFormFields] = useState(getInitialFormState());
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const availableDesignations = useMemo(() => {
    const selectedDeptId = String(formFields?.departmentId || formFields?.department_id || "");
    const selectedDeptName = String(formFields?.department || "").toLowerCase().trim();

    const matched = designationsList.filter(d => {
      const dDeptId = String(d.departmentId || d.department_id || "");
      const dDeptName = String(d.department || d.dept_name || "").toLowerCase().trim();
      return (selectedDeptId && dDeptId === selectedDeptId) || (selectedDeptName && dDeptName === selectedDeptName);
    });

    if (matched.length > 0) {
      const companyWide = designationsList.filter(d => !d.departmentId && !d.department_id && !d.department);
      return [...matched, ...companyWide];
    }

    if (designationsList.length > 0) {
      return designationsList;
    }

    return [
      { id: "desig_exec", desigName: "Executive" },
      { id: "desig_sr_exec", desigName: "Senior Executive" },
      { id: "desig_mgr", desigName: "Manager" },
      { id: "desig_asst_mgr", desigName: "Assistant Manager" },
      { id: "desig_specialist", desigName: "Specialist" }
    ];
  }, [designationsList, formFields?.departmentId, formFields?.department_id, formFields?.department]);

  // Dynamic Sub-records Addition states
  const [tempEducation, setTempEducation] = useState({ qualification: "", institute: "", university: "", passingYear: "", percentage: "", certificate: "" });
  const [tempExperience, setTempExperience] = useState({ company: "", designation: "", joiningDate: "", leavingDate: "", experience: "", salary: "", letter: "" });
  const [tempSkill, setTempSkill] = useState({ skill: "", skillLevel: "Intermediate", certification: "", organization: "", issueDate: "", expiryDate: "" });
  const [tempAsset, setTempAsset] = useState({ assetType: "", assetCode: "", assetName: "", serialNumber: "", assignedDate: "", returnDate: "", status: "Assigned" });
  const [tempKpi, setTempKpi] = useState({ kpi: "", rating: "5", appraisalDate: "", promotionHistory: "", awards: "" });

  // Calculate Profile Completion %
  const calculateCompletion = (data) => {
    const keyFields = [
      data.firstName, data.lastName, data.employeeCode, data.gender, data.dateOfBirth,
      data.department, data.designation, data.branch, data.reportingManager, data.employeeType,
      data.dateOfJoining, data.mobileNumber, data.officialEmail, data.personalEmail,
      data.currentAddress, data.aadhaarNumber, data.panNumber, data.bankName,
      data.accountNumber, data.emergencyContactName, data.shift, data.role
    ];
    const filled = keyFields.filter(f => f && String(f).trim() !== "").length;
    return Math.round((filled / keyFields.length) * 100);
  };

  // Pre-filter records by user deletions & role access (only show self-profile for non-admins)
  const empRecords = useMemo(() => {
    return (records || [])
      .filter(e => e && e.id && !deletedIds.includes(e.id))
      .filter(e => {
        if (isAuthorizedAdmin) return true;
        const emailVal = e.email || e.companyEmail || e.company_email || e.personalEmail || e.personal_email;
        return emailVal && emailVal.toLowerCase() === user.email.toLowerCase();
      });
  }, [records, deletedIds, isAuthorizedAdmin, user?.email]);

  // Deserialize dynamic profile_data for full view
  const deserializedRecords = useMemo(() => {
    return empRecords.map(e => {
      let profileDataObj = {};
      try {
        const rawProf = e.profile_data || e.profileData;
        if (rawProf && typeof rawProf === "string") {
          profileDataObj = JSON.parse(rawProf);
        } else if (rawProf && typeof rawProf === "object") {
          profileDataObj = rawProf;
        }
      } catch (err) {
        console.error("Error parsing profileData JSON:", err);
      }

      const empName = e.firstName || e.employeeName || e.employee_name || "Employee";
      const names = empName.split(" ");
      const firstName = names[0] || "";
      const lastName = names.slice(1).join(" ") || "";

      const details = { ...e };
      const jsonCols = ['education', 'experience', 'skills', 'assets', 'documents', 'kpis', 'promotionHistory', 'awards', 'activityTimeline', 'weeklyOff'];
      jsonCols.forEach(col => {
        if (details[col] && typeof details[col] === 'string') {
          try {
            details[col] = JSON.parse(details[col]);
          } catch (err) {}
        }
      });

      return {
        ...getInitialFormState(),
        ...details,
        ...profileDataObj,
        id: e.id,
        firstName: profileDataObj.firstName || details.firstName || firstName,
        lastName: profileDataObj.lastName || details.lastName || lastName,
        officialEmail: e.companyEmail || e.email || profileDataObj.officialEmail || details.officialEmail || "",
        department: e.department || profileDataObj.department || details.department || "IT",
        password: e.password || profileDataObj.password || details.password || "securepassword",
        profileStatus: e.profileStatus || profileDataObj.profileStatus || details.profileStatus || "Profile Incomplete",
        profileCompletion: e.profileCompletion !== undefined && e.profileCompletion !== null ? Number(e.profileCompletion) : (profileDataObj.profileCompletion !== undefined ? Number(profileDataObj.profileCompletion) : (details.profileCompletion !== undefined ? Number(details.profileCompletion) : 0)),
        // Direct table fallbacks
        employeeName: empName,
        email: e.companyEmail || e.email
      };
    });
  }, [empRecords]);

  // Apply filters and searches
  const filteredRecords = useMemo(() => {
    return deserializedRecords.filter(e => {
      // 1. Search text check
      const q = searchText.toLowerCase().trim();
      if (q) {
        const nameMatch = `${e.firstName} ${e.lastName}`.toLowerCase().includes(q);
        const emailMatch = (e.officialEmail || "").toLowerCase().includes(q);
        const codeMatch = (e.employeeCode || "").toLowerCase().includes(q);
        const idMatch = (e.id || "").toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !codeMatch && !idMatch) {
          return false;
        }
      }

      // 2. Dropdown filters check
      if (filters.company && (e.company || "").toLowerCase() !== filters.company.toLowerCase()) return false;
      if (filters.branch && (e.branch || "").toLowerCase() !== filters.branch.toLowerCase()) return false;
      if (filters.department && (e.department || "").toLowerCase() !== filters.department.toLowerCase()) return false;
      if (filters.designation && (e.designation || "").toLowerCase() !== filters.designation.toLowerCase()) return false;
      if (filters.employeeType && (e.employeeType || "").toLowerCase() !== filters.employeeType.toLowerCase()) return false;
      if (filters.status && (e.employmentStatus || "").toLowerCase() !== filters.status.toLowerCase()) return false;
      if (filters.reportingManager && (e.reportingManager || "").toLowerCase() !== filters.reportingManager.toLowerCase()) return false;
      if (filters.shift && (e.shift || "").toLowerCase() !== filters.shift.toLowerCase()) return false;
      if (filters.dateOfJoining && e.dateOfJoining !== filters.dateOfJoining) return false;

      return true;
    });
  }, [deserializedRecords, searchText, filters]);

  // Unique options for dropdown filters
  const filterOptions = useMemo(() => {
    const getUniques = (key) => {
      const vals = deserializedRecords.map(e => e[key]).filter(Boolean);
      return Array.from(new Set(vals));
    };
    return {
      companies: getUniques("company"),
      branches: getUniques("branch"),
      departments: getUniques("department"),
      designations: getUniques("designation"),
      types: getUniques("employeeType"),
      statuses: getUniques("employmentStatus"),
      managers: getUniques("reportingManager"),
      shifts: getUniques("shift")
    };
  }, [deserializedRecords]);

  // Bulk Actions Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(filteredRecords.map(r => r.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedRows.length} selected employee records?`)) {
      try {
        for (const id of selectedRows) {
          await deleteTableRecord("employees", id).catch(() => {});
        }
        setDeletedIds(prev => [...prev, ...selectedRows]);
        setSelectedRows([]);
        showToast("Selected employee records deleted successfully!", "success");
        if (onRefreshData) onRefreshData();
      } catch (err) {
        showToast("Error deleting bulk records.", "error");
      }
    }
  };

  const handleExport = () => {
    const rowsToExport = filteredRecords.length > 0 ? filteredRecords : deserializedRecords;
    if (rowsToExport.length === 0) {
      showToast("No employee records to export.", "warning");
      return;
    }
    const headers = ["Employee ID", "Employee Code", "Name", "Department", "Designation", "Branch", "Official Email", "Mobile Number", "DOJ", "Status", "Profile Completion %"];
    const csvContent = [
      headers.join(","),
      ...rowsToExport.map(e => [
        `"${e.id || ''}"`,
        `"${e.employeeCode || ''}"`,
        `"${e.firstName} ${e.lastName}"`,
        `"${e.department || ''}"`,
        `"${e.designation || ''}"`,
        `"${e.branch || ''}"`,
        `"${e.officialEmail || ''}"`,
        `"${e.mobileNumber || ''}"`,
        `"${e.dateOfJoining || ''}"`,
        `"${e.employmentStatus || ''}"`,
        `"${calculateCompletion(e)}%"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `employees_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Employee list CSV exported successfully!", "success");
  };

  const handleImport = () => {
    showToast("Import CSV template mapping initialized! (Simulation Mode)", "success");
  };

  const handleDownloadTemplate = () => {
    const headers = ["employeeCode", "firstName", "lastName", "officialEmail", "department", "designation", "branch", "mobileNumber", "dateOfJoining", "gender"];
    const csvContent = headers.join(",") + "\n" + 'EMP101,Rahul,Sharma,rahul@company.com,IT,Developer,Head Office,9876543210,2025-01-01,Male';
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "employee_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Import template downloaded!", "success");
  };

  // View modal helper
  const handleOpenViewDetails = (emp) => {
    setSelectedEmp(emp);
    setActiveActionsMenu(null);
  };

  // Form Creation/Edits Triggers
  const handleOpenAddForm = () => {
    const freshState = getInitialFormState();
    // Auto-generate employee ID
    freshState.employeeId = `EMP-${Math.floor(100000 + Math.random() * 900000)}`;

    const urlDept = searchParams.get("dept") || searchParams.get("department");
    if (urlDept && departmentsList.length > 0) {
      const matched = departmentsList.find(d => 
        (d.deptName || d.dept_name || d.name || "").toLowerCase() === urlDept.toLowerCase() ||
        String(d.id) === String(urlDept)
      );
      if (matched) {
        freshState.departmentId = matched.id;
        freshState.department_id = matched.id;
        freshState.department = matched.deptName || matched.dept_name || matched.name;
      }
    }

    setFormFields(freshState);
    setIsEditing(false);
    setEditingId(null);
    setValidationErrors({});
    setModalTab("Basic Information");
    setShowModal(true);
  };

  React.useEffect(() => {
    if (openCreateTrigger) {
      handleOpenAddForm();
    }
  }, [openCreateTrigger]);

  const handleOpenEditForm = (emp) => {
    let profileDataObj = {};
    try {
      const raw = emp.profile_data || emp.profileData;
      if (raw && typeof raw === "string") {
        profileDataObj = JSON.parse(raw);
      } else if (raw && typeof raw === "object") {
        profileDataObj = raw;
      }
    } catch (e) {}

    const empAssets = profileDataObj.assets || emp.assets || [];
    const names = (emp.employeeName || emp.employee_name || profileDataObj.employee_name || "").split(" ");
    setFormFields({
      ...emp,
      ...profileDataObj,
      assets: Array.isArray(empAssets) ? empAssets : [],
      firstName: emp.firstName || profileDataObj.firstName || names[0] || "",
      lastName: emp.lastName || profileDataObj.lastName || names.slice(1).join(" ") || ""
    });
    setIsEditing(true);
    setEditingId(emp.id);
    setValidationErrors({});
    setModalTab("Basic Information");
    setShowModal(true);
    setActiveActionsMenu(null);
  };

  const handleDeleteRecord = async (id) => {
    setActiveActionsMenu(null);
    if (window.confirm("Are you sure you want to delete this employee profile?")) {
      try {
        await deleteTableRecord("employees", id);
        setDeletedIds(prev => [...prev, id]);
        showToast("Employee profile deleted successfully!", "success");
        if (onRefreshData) onRefreshData();
      } catch (err) {
        showToast("Error deleting employee profile.", "error");
      }
    }
  };

  // Reset Password Shortcut
  const handleResetPassword = async (emp) => {
    setActiveActionsMenu(null);
    const newPass = window.prompt(`Enter new password for ${emp.firstName} ${emp.lastName}:`, "securepassword123");
    if (newPass) {
      try {
        const payload = {
          employee_name: `${emp.firstName} ${emp.lastName}`.trim(),
          email: emp.officialEmail,
          password: newPass,
          department: emp.department,
          profile_data: JSON.stringify(emp)
        };
        await updateTableRecord("employees", emp.id, payload);
        showToast("Password reset successfully!", "success");
        if (onRefreshData) onRefreshData();
      } catch (err) {
        showToast("Failed to reset password.", "error");
      }
    }
  };

  // Quick Assign Manager/Role Shortcut
  const handleQuickAssign = async (emp, fieldKey, fieldLabel, currentVal) => {
    setActiveActionsMenu(null);
    const newVal = window.prompt(`Enter new ${fieldLabel} for ${emp.firstName} ${emp.lastName}:`, currentVal || "");
    if (newVal !== null) {
      try {
        const updatedProfile = { ...emp, [fieldKey]: newVal };
        const payload = {
          employee_name: `${updatedProfile.firstName} ${updatedProfile.lastName}`.trim(),
          email: updatedProfile.officialEmail,
          password: updatedProfile.password || "securepassword",
          department: updatedProfile.department,
          profile_data: JSON.stringify(updatedProfile)
        };
        await updateTableRecord("employees", emp.id, payload);
        showToast(`${fieldLabel} updated successfully!`, "success");
        if (onRefreshData) onRefreshData();
      } catch (err) {
        showToast(`Failed to update ${fieldLabel}.`, "error");
      }
    }
  };

  // Generic Row Action Alerts
  const handleRowActionTrigger = (emp, actionName) => {
    setActiveActionsMenu(null);
    showToast(`Simulation Mode: '${actionName}' triggered for ${emp.firstName} ${emp.lastName}!`, "success");
  };

  // Form Submissions
  const validateForm = () => {
    const errors = {};
    if (!formFields.firstName || !formFields.firstName.trim()) errors.firstName = "Name is required.";
    if (!formFields.officialEmail || !formFields.officialEmail.trim()) {
      errors.officialEmail = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formFields.officialEmail)) {
      errors.officialEmail = "Invalid email format.";
    }
    const hasDept = formFields.departmentId || formFields.department_id || (formFields.department && String(formFields.department).trim() !== "");
    if (!hasDept) {
      errors.department = "Department is required.";
    }
    const hasDesig = formFields.designationId || formFields.designation_id || (formFields.designation && String(formFields.designation).trim() !== "");
    if (!hasDesig) {
      errors.designation = "Designation is required.";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast("Please fix the validation errors across tabs.", "error");
      return;
    }

    const constructedName = `${formFields.firstName} ${formFields.lastName}`.trim();

    // Auto-capture pending asset entry if user filled in fields in Tab 12 but didn't click "+ Assign Asset" button
    let currentAssets = Array.isArray(formFields.assets) ? [...formFields.assets] : [];
    if (tempAsset.assetName && tempAsset.assetName.trim()) {
      const newPendingAsset = {
        ...tempAsset,
        assetCode: tempAsset.assetCode || `AST-${String(tempAsset.assetType || 'EQP').substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        assignedDate: tempAsset.assignedDate || new Date().toISOString().split("T")[0],
        status: "Assigned"
      };
      currentAssets.push(newPendingAsset);
      setTempAsset({ assetType: "", assetCode: "", assetName: "", serialNumber: "", assignedDate: "", returnDate: "", status: "Assigned" });
    }
    
    // Package all 17 tabs of formFields into the profile_data JSON string
    const profileDataStr = JSON.stringify({
      ...formFields,
      assets: currentAssets,
      // Record audits
      updatedBy: user?.email || "System Admin",
      updatedDate: new Date().toISOString().split("T")[0]
    });

    const cleanFirstName = (formFields.firstName || "employee").toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanLastName = (formFields.lastName || "staff").toLowerCase().replace(/[^a-z0-9]/g, "");
    const fallbackEmail = `${cleanFirstName}.${cleanLastName}${Date.now().toString().slice(-4)}@nib.com`;
    const effectiveEmail = (formFields.officialEmail && formFields.officialEmail.trim())
      ? formFields.officialEmail.trim()
      : (formFields.personalEmail && formFields.personalEmail.trim())
        ? formFields.personalEmail.trim()
        : fallbackEmail;

    const payload = {
      employee_name: constructedName,
      emp_code: formFields.employeeCode || formFields.empCode || undefined,
      email: effectiveEmail,
      password: formFields.password || "securepassword",
      department: formFields.department || "IT",
      department_id: formFields.departmentId || formFields.department_id || null,
      designation_id: formFields.designationId || formFields.designation_id || null,
      designation: formFields.designation || "Staff Professional",
      profile_data: profileDataStr
    };

    try {
      let savedEmployee = null;
      if (isEditing && editingId) {
        savedEmployee = await updateTableRecord("employees", editingId, payload);
        showToast("Employee profile updated successfully!", "success");
      } else {
        savedEmployee = await createTableRecord("employees", payload);
        showToast("Employee profile created successfully!", "success");
      }

      // Synchronize assigned assets directly into MySQL asset_allocation table
      if (currentAssets.length > 0) {
        const empCode = formFields.employeeCode || formFields.empCode || formFields.empId || (savedEmployee?.employeeCode || savedEmployee?.emp_code || savedEmployee?.id || "EMP-" + Math.floor(1000 + Math.random() * 9000));
        for (const ast of currentAssets) {
          try {
            const assetPayload = {
              assetCode: ast.assetCode || `AST-${String(ast.assetType || "EQP").substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
              assetName: ast.assetName,
              assetCategory: ast.assetType || "Laptop",
              serialNumber: ast.serialNumber || "",
              employee: constructedName,
              empId: empCode,
              department: formFields.department || "IT",
              issueDate: ast.assignedDate || new Date().toISOString().split("T")[0],
              status: "Assigned"
            };
            await apiFetch("/api/table/asset_allocation", {
              method: "POST",
              body: JSON.stringify(assetPayload)
            }).catch(() => {});
          } catch (syncErr) {
            console.warn("Asset sync notice:", syncErr);
          }
        }
      }

      setShowModal(false);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      showToast(err.message || "Failed to save record.", "error");
    }
  };

  const renderAddEditModal = () => {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
        <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
          {/* Modal Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
                <UserGroupIcon className="w-4 h-4 text-indigo-600" />
                {isEditing ? "Edit Employee Record" : "Create New Add Employee Record"}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">
                Please write directly to the database table.
              </p>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-500 transition"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body: Simple 4-Field Form matching screenshot 1 */}
          <form onSubmit={handleSave} className="p-6 space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Employee Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter employee name..."
                  value={formFields.firstName}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormFields({
                      ...formFields,
                      firstName: name,
                      lastName: ""
                    });
                  }}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="technovani@gmail.com"
                  value={formFields.officialEmail}
                  onChange={(e) => setFormFields({ ...formFields, officialEmail: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formFields.password}
                  onChange={(e) => setFormFields({ ...formFields, password: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Department <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formFields.departmentId || formFields.department_id || ""}
                  onChange={(e) => {
                    const deptId = e.target.value;
                    const deptObj = departmentsList.find(d => String(d.id) === String(deptId));
                    setFormFields({
                      ...formFields,
                      departmentId: deptId,
                      department_id: deptId,
                      department: deptObj ? (deptObj.deptName || deptObj.dept_name || deptObj.name) : "",
                      designationId: "",
                      designation_id: "",
                      designation: ""
                    });
                  }}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                >
                  <option value="">Select Department</option>
                  {departmentsList.map(d => (
                    <option key={d.id} value={d.id}>{d.deptName || d.dept_name || d.name}</option>
                  ))}
                </select>
                {validationErrors.department && <p className="text-[10px] text-rose-500 mt-1 font-bold">{validationErrors.department}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Designation <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  disabled={!formFields.departmentId && !formFields.department_id}
                  value={formFields.designationId || formFields.designation_id || ""}
                  onChange={(e) => {
                    const desigId = e.target.value;
                    const desigObj = availableDesignations.find(d => String(d.id) === String(desigId));
                    setFormFields({
                      ...formFields,
                      designationId: desigId,
                      designation_id: desigId,
                      designation: desigObj ? (desigObj.desigName || desigObj.desig_name || desigObj.title || desigObj.name) : ""
                    });
                  }}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold disabled:bg-slate-100 disabled:opacity-60"
                >
                  <option value="">Select Designation</option>
                  {availableDesignations.map(d => (
                    <option key={d.id} value={d.id}>{d.desigName || d.desig_name || d.title || d.name}</option>
                  ))}
                </select>
                {validationErrors.designation && <p className="text-[10px] text-rose-500 mt-1 font-bold">{validationErrors.designation}</p>}
              </div>
            </div>

            {/* Form Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-black border rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-black text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition"
              >
                {isEditing ? "Save Changes" : "Create Record"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toast Alert */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg transition-all duration-300 flex items-center gap-2 ${
          toast.type === "error" ? "bg-rose-600" : toast.type === "warning" ? "bg-amber-600" : "bg-emerald-600"
        }`}>
          <CheckIcon className="w-4 h-4" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Admin Employee Dashboard & Directory View */}
      {isAuthorizedAdmin ? (
        <>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 px-1">
            <span>Corporate Setup</span>
            <ChevronRightIcon className="w-2.5 h-2.5" />
            <span className="text-slate-600 font-extrabold">Employee Management</span>
          </div>

          {/* Top Toolbar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-xs">
                <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search code, name, email..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full font-medium"
                />
              </div>

              {/* Advanced Filters Trigger */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition ${
                  showFilters
                    ? "bg-indigo-50 text-indigo-700 border-indigo-300"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <FunnelIcon className="w-4 h-4" />
                <span>Advanced Filters</span>
              </button>

              {/* Refresh Button */}
              <button
                onClick={() => {
                  if (onRefreshData) onRefreshData();
                  showToast("Employee list refreshed successfully!", "success");
                }}
                className="p-2 border border-slate-200 rounded-xl text-slate-600 bg-white hover:bg-slate-50 transition"
                title="Refresh"
              >
                <ArrowPathIcon className="w-4 h-4" />
              </button>

              {/* Bulk Actions */}
              {selectedRows.length > 0 && (
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-xs font-bold text-slate-400">{selectedRows.length} Selected</span>
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition border border-rose-200"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                    <span>Bulk Actions (Delete)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right Tools */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleOpenAddForm}
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-black transition border border-blue-600 shadow-2xs"
              >
                <PlusIcon className="w-3.5 h-3.5 text-white" />
                <span>Add Employee</span>
              </button>

              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                <span>Download Template</span>
              </button>

              <button
                onClick={handleImport}
                className="flex items-center gap-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200"
              >
                <ArrowUpTrayIcon className="w-3.5 h-3.5" />
                <span>Import Employees</span>
              </button>

              <button
                onClick={handleExport}
                className="flex items-center gap-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                <span>Export Employees</span>
              </button>

            </div>
          </div>

          {/* Advanced Filters Drawer Panel */}
          {showFilters && (
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 shadow-inner animate-in slide-in-from-top duration-250">
              {/* Company */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Company</label>
                <select
                  value={filters.company}
                  onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                >
                  <option value="">All Companies</option>
                  {filterOptions.companies.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Branch */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Branch</label>
                <select
                  value={filters.branch}
                  onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                >
                  <option value="">All Branches</option>
                  {filterOptions.branches.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Department</label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                >
                  <option value="">All Departments</option>
                  {filterOptions.departments.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Designation */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Designation</label>
                <select
                  value={filters.designation}
                  onChange={(e) => setFilters({ ...filters, designation: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                >
                  <option value="">All Designations</option>
                  {filterOptions.designations.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Employment Type */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Employment Type</label>
                <select
                  value={filters.employeeType}
                  onChange={(e) => setFilters({ ...filters, employeeType: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                >
                  <option value="">All Types</option>
                  {filterOptions.types.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                >
                  <option value="">All Statuses</option>
                  {filterOptions.statuses.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Reporting Manager */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Reporting Manager</label>
                <select
                  value={filters.reportingManager}
                  onChange={(e) => setFilters({ ...filters, reportingManager: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                >
                  <option value="">All Managers</option>
                  {filterOptions.managers.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* DOJ */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date of Joining</label>
                <input
                  type="date"
                  value={filters.dateOfJoining}
                  onChange={(e) => setFilters({ ...filters, dateOfJoining: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Shift */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Shift</label>
                <select
                  value={filters.shift}
                  onChange={(e) => setFilters({ ...filters, shift: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                >
                  <option value="">All Shifts</option>
                  {filterOptions.shifts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Reset Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({
                    company: "", branch: "", department: "", designation: "", employeeType: "", status: "", reportingManager: "", dateOfJoining: "", shift: ""
                  })}
                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition w-full shadow-2xs"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Modern Database Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-black uppercase text-slate-400 tracking-wider whitespace-nowrap">
                    <th className="py-3.5 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={filteredRecords.length > 0 && selectedRows.length === filteredRecords.length}
                        onChange={handleSelectAll}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 border-slate-200"
                      />
                    </th>
                    <th className="py-3.5 px-2">Employee Photo</th>
                    <th className="py-3.5 px-3">Employee ID</th>
                    <th className="py-3.5 px-3">Employee Code</th>
                    <th className="py-3.5 px-3">Employee Name</th>
                    <th className="py-3.5 px-3">Department</th>
                    <th className="py-3.5 px-3">Designation</th>
                    <th className="py-3.5 px-3">Branch</th>
                    <th className="py-3.5 px-3">Reporting Manager</th>
                    <th className="py-3.5 px-3">Employment Type</th>
                    <th className="py-3.5 px-3">Employment Status</th>
                    <th className="py-3.5 px-3">Official Email</th>
                    <th className="py-3.5 px-3">Mobile Number</th>
                    <th className="py-3.5 px-3">Date of Joining</th>
                    <th className="py-3.5 px-3">Shift</th>
                    <th className="py-3.5 px-3">Attendance Status</th>
                    <th className="py-3.5 px-3">Profile Completion %</th>
                    <th className="py-3.5 px-3">Last Login</th>
                    <th className="py-3.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] font-bold text-slate-600 whitespace-nowrap">
                  {filteredRecords.map((e, idx) => {
                    const rawFullName = `${e.firstName || ""} ${e.lastName || ""}`.trim();
                    const fullName = (rawFullName && !rawFullName.includes("undefined"))
                      ? rawFullName
                      : e.employeeName || e.employee_name || "Staff Member";
                    const isChecked = selectedRows.includes(e.id);
                    const compPercent = calculateCompletion(e);

                    return (
                      <tr key={e.id} className="hover:bg-slate-50/50 transition">
                        {/* Checkbox */}
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleSelectRow(e.id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 border-slate-200"
                          />
                        </td>
                        {/* Photo */}
                        <td className="py-3 px-2">
                          {e.photo ? (
                            <img src={e.photo} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-200 object-cover shadow-2xs" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200/80 flex items-center justify-center font-black uppercase text-[10px]">
                              {e.firstName?.[0] || ""}{e.lastName?.[0] || ""}
                            </div>
                          )}
                        </td>
                        {/* ID */}
                        <td className="py-3 px-3">
                          <span className="text-slate-800">#{e.employeeId || e.id?.slice(0, 8)}</span>
                        </td>
                        {/* Code */}
                        <td className="py-3 px-3">
                          <span className="font-mono text-[10px] text-indigo-500 font-extrabold uppercase">{e.employeeCode || "--"}</span>
                        </td>
                        {/* Name */}
                        <td className="py-3 px-3 text-slate-900 font-black">
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => {
                                setSearchParams({
                                  category: "EMPLOYEE_MGMT",
                                  tab: "Employee Profile",
                                  profileTab: "Basic Information",
                                  profileEmpId: e.id
                                });
                              }}
                              className="text-indigo-600 hover:text-indigo-850 text-left hover:underline font-black focus:outline-none"
                            >
                              {fullName}
                            </button>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md w-max mt-0.5 uppercase tracking-wider ${
                              e.profileStatus === "Complete" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}>
                              {e.profileStatus || "Profile Incomplete"}
                            </span>
                          </div>
                        </td>
                        {/* Department */}
                        <td className="py-3 px-3">{e.department}</td>
                        {/* Designation */}
                        <td className="py-3 px-3">{e.designation || "--"}</td>
                        {/* Branch */}
                        <td className="py-3 px-3">{e.branch || "--"}</td>
                        {/* Manager */}
                        <td className="py-3 px-3">{e.reportingManager || "--"}</td>
                        {/* Type */}
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[9px] tracking-wide uppercase font-extrabold">
                            {e.employeeType}
                          </span>
                        </td>
                        {/* Status */}
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                            e.employmentStatus === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"
                          }`}>
                            {e.employmentStatus || "Active"}
                          </span>
                        </td>
                        {/* Email */}
                        <td className="py-3 px-3 font-mono text-[10px] text-indigo-600">{e.officialEmail}</td>
                        {/* Mobile */}
                        <td className="py-3 px-3 font-mono">{e.mobileNumber || "--"}</td>
                        {/* DOJ */}
                        <td className="py-3 px-3 text-slate-500 font-semibold">{e.dateOfJoining || "--"}</td>
                        {/* Shift */}
                        <td className="py-3 px-3 text-slate-500">{e.shift || "--"}</td>
                        {/* Attendance Status */}
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200/80 rounded-md text-[9px] font-extrabold">
                            Present
                          </span>
                        </td>
                        {/* Completion */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-10 bg-slate-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  compPercent < 40 ? "bg-rose-500" : compPercent < 80 ? "bg-amber-500" : "bg-emerald-500"
                                }`}
                                style={{ width: `${compPercent}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] font-extrabold text-slate-700">{compPercent}%</span>
                          </div>
                        </td>
                        {/* Last Login */}
                        <td className="py-3 px-3 font-mono text-[10px] text-slate-400">
                          {e.lastLogin || "Never"}
                        </td>
                        {/* Actions Dropdown */}
                        <td className="py-3 px-3 text-right relative">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              title="View Employee Profile Details"
                              onClick={() => handleOpenViewDetails(e)}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl transition transform active:scale-95 border border-indigo-200/80 flex items-center justify-center cursor-pointer shadow-2xs group"
                            >
                              <EyeIcon className="w-4 h-4 transition group-hover:scale-110" />
                            </button>
                            <button
                              onClick={() => setActiveActionsMenu(activeActionsMenu === e.id ? null : e.id)}
                              className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 transition"
                            >
                              <EllipsisVerticalIcon className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Popover Actions List Dropdown */}
                          {activeActionsMenu === e.id && (
                            <div className="absolute right-3 mt-1.5 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1.5 divide-y divide-slate-100 text-left font-bold text-slate-700 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                              <div className="py-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenViewDetails(e)}
                                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 hover:text-indigo-600 transition text-left"
                                >
                                  👁️ View Profile
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSearchParams({
                                      category: "EMPLOYEE_MGMT",
                                      tab: "Employee Profile",
                                      profileTab: "Basic Information",
                                      profileEmpId: e.id
                                    });
                                  }}
                                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 hover:text-indigo-600 transition text-left font-black"
                                >
                                  👤 Manage Profile
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditForm(e)}
                                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 hover:text-blue-600 transition text-left"
                                >
                                  ✏️ Edit Profile
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRecord(e.id)}
                                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 hover:text-rose-600 transition text-left"
                                >
                                  🗑️ Delete Profile
                                </button>
                              </div>
                              <div className="py-1">
                                <button
                                  type="button"
                                  onClick={() => handleResetPassword(e)}
                                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 hover:text-amber-600 transition text-left"
                                >
                                  🔑 Reset Password
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickAssign(e, "role", "System Role", e.role)}
                                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 hover:text-indigo-600 transition text-left"
                                >
                                  🛡️ Assign Role
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickAssign(e, "reportingManager", "Reporting Manager", e.reportingManager)}
                                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 hover:text-indigo-600 transition text-left"
                                >
                                  👤 Assign Manager
                                </button>
                              </div>
                              <div className="py-1">
                                <button
                                  type="button"
                                  onClick={() => handleRowActionTrigger(e, "Upload Documents")}
                                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 hover:text-slate-900 transition text-left"
                                >
                                  📁 Upload Documents
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRowActionTrigger(e, "View Attendance")}
                                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 hover:text-slate-900 transition text-left"
                                >
                                  📅 View Attendance
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRowActionTrigger(e, "View Payroll")}
                                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 hover:text-slate-900 transition text-left"
                                >
                                  💵 View Payroll
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRowActionTrigger(e, "View Leave")}
                                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 hover:text-slate-900 transition text-left"
                                >
                                  ✉️ View Leave
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRowActionTrigger(e, "View Assets")}
                                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 hover:text-slate-900 transition text-left"
                                >
                                  💻 View Assets
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRowActionTrigger(e, "View Audit Logs")}
                                  className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 hover:text-slate-900 transition text-left"
                                >
                                  📜 View Audit Logs
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={20} className="text-center py-10 text-gray-400 font-medium">
                        No employees currently match the search query or active filter settings.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Regular Employee Profile Details Viewer (Read-only personal card) */
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 px-1">
            <span>Employee Portal</span>
            <ChevronRightIcon className="w-2.5 h-2.5" />
            <span className="text-slate-600 font-extrabold">My Employee Profile</span>
          </div>

          {deserializedRecords.length > 0 ? (
            deserializedRecords.map(personalEmp => {
              const fullName = `${personalEmp.firstName} ${personalEmp.lastName}`.trim();
              const compPercent = calculateCompletion(personalEmp);

              return (
                <div key={personalEmp.id} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
                  {/* Avatar Banner */}
                  <div className="flex flex-col sm:flex-row items-center gap-5 border-b pb-5 border-slate-100">
                    {personalEmp.photo ? (
                      <img src={personalEmp.photo} alt="Avatar" className="w-20 h-20 rounded-full border border-indigo-200 object-cover shadow-xs" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-2xl uppercase border-4 border-indigo-50">
                        {personalEmp.firstName?.[0] || ""}{personalEmp.lastName?.[0] || ""}
                      </div>
                    )}
                    <div className="text-center sm:text-left space-y-1">
                      <h2 className="text-lg font-black text-slate-900 leading-tight">{fullName}</h2>
                      <p className="text-xs text-indigo-600 font-bold">{personalEmp.designation || "Staff Professional"} • {personalEmp.department}</p>
                      <div className="flex items-center justify-center sm:justify-start gap-1 font-mono text-[10px] text-slate-400">
                        <span>Emp ID: #{personalEmp.employeeId || personalEmp.id?.slice(0, 8)}</span>
                        <span>|</span>
                        <span>Code: {personalEmp.employeeCode || "--"}</span>
                      </div>
                    </div>
                    {/* Completion */}
                    <div className="sm:ml-auto bg-indigo-50/70 border border-indigo-100 px-4 py-3 rounded-2xl flex flex-col items-center">
                      <span className="text-[9px] font-black text-indigo-950 uppercase tracking-wider">Profile Completion</span>
                      <span className="text-2xl font-black text-indigo-600 mt-0.5">{compPercent}%</span>
                    </div>
                  </div>

                  {/* Profile Info Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Official Info card */}
                    <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 space-y-2">
                      <h3 className="text-[10px] font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5 border-b pb-1.5 border-slate-100">
                        <BuildingOfficeIcon className="w-4 h-4 text-indigo-600" />
                        Official Info
                      </h3>
                      <div className="text-[11px] space-y-1 text-slate-600 font-bold">
                        <div>Branch: <span className="text-slate-800 font-black">{personalEmp.branch || "--"}</span></div>
                        <div>Reporting Manager: <span className="text-slate-800 font-black">{personalEmp.reportingManager || "--"}</span></div>
                        <div>Employee Type: <span className="text-slate-800 font-black">{personalEmp.employeeType}</span></div>
                        <div>Shift: <span className="text-slate-800 font-black">{personalEmp.shift}</span></div>
                        <div>Date of Joining: <span className="text-slate-800 font-black">{personalEmp.dateOfJoining || "--"}</span></div>
                      </div>
                    </div>

                    {/* Contact Info card */}
                    <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 space-y-2">
                      <h3 className="text-[10px] font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5 border-b pb-1.5 border-slate-100">
                        <EnvelopeIcon className="w-4 h-4 text-indigo-600" />
                        Contact details
                      </h3>
                      <div className="text-[11px] space-y-1 text-slate-600 font-bold">
                        <div>Mobile: <span className="text-slate-800 font-black">{personalEmp.mobileNumber || "--"}</span></div>
                        <div>Official Email: <span className="text-slate-800 font-black">{personalEmp.officialEmail}</span></div>
                        <div>Personal Email: <span className="text-slate-800 font-black">{personalEmp.personalEmail || "--"}</span></div>
                        <div className="truncate">Address: <span className="text-slate-800 font-black">{personalEmp.currentAddress || "--"}</span></div>
                        <div>City/Pin: <span className="text-slate-800 font-black">{personalEmp.city || "--"} / {personalEmp.pinCode || "--"}</span></div>
                      </div>
                    </div>

                    {/* Personal & Identity card */}
                    <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 space-y-2">
                      <h3 className="text-[10px] font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5 border-b pb-1.5 border-slate-100">
                        <IdentificationIcon className="w-4 h-4 text-indigo-600" />
                        Identity Documents
                      </h3>
                      <div className="text-[11px] space-y-1 text-slate-600 font-bold">
                        <div>Aadhaar Number: <span className="text-slate-800 font-black font-mono">{personalEmp.aadhaarNumber || "--"}</span></div>
                        <div>PAN Number: <span className="text-slate-800 font-black font-mono">{personalEmp.panNumber || "--"}</span></div>
                        <div>Passport Number: <span className="text-slate-800 font-black font-mono">{personalEmp.passportNumber || "--"}</span></div>
                        <div>UAN Number: <span className="text-slate-800 font-black font-mono">{personalEmp.uanNumber || "--"}</span></div>
                        <div>Gender/DOB: <span className="text-slate-800 font-black">{personalEmp.gender} / {personalEmp.dateOfBirth || "--"}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 text-center text-gray-400 font-medium">
              We couldn't load your personal employee profile details. Try logging in again.
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Form Modal (Simple Form) */}
      {showModal && renderAddEditModal()}
      {false && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4 text-indigo-600" />
                  {isEditing ? "Edit Employee Profile" : "Add New Employee Profile"}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">
                  Fill in all corporate registers • Profile Completion: {calculateCompletion(formFields)}%
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-500 transition"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Left Sidebar Tabs Selector & Right Tab Forms */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Left Side: Tabs Checklist List */}
              <div className="w-full md:w-56 bg-slate-50 border-r border-slate-200 overflow-y-auto max-h-36 md:max-h-none shrink-0 p-2 space-y-0.5">
                {activeTabs.map((t, idx) => {
                  const isActive = modalTab === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setModalTab(t)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition duration-150 flex items-center justify-between ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                          : "text-slate-600 hover:bg-slate-200/60"
                      }`}
                    >
                      <span>{idx + 1}. {t}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right Side: Tab Specific Scrollable Form Fields */}
              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
                <div className="space-y-6 flex-1">
                  {/* TAB 1: BASIC INFORMATION */}
                  {modalTab === "Basic Information" && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-100 flex items-center gap-1.5">
                        <UserIcon className="w-4 h-4 text-indigo-600" />
                        Basic Information
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Photo URL / base64 preview */}
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Employee Photo</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setFormFields({ ...formFields, photo: reader.result });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="text-xs w-full file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                            {formFields.photo && (
                              <div className="relative">
                                <img src={formFields.photo} alt="Preview" className="w-10 h-10 rounded-full border border-slate-200 object-cover shadow-sm" />
                                <button
                                  type="button"
                                  onClick={() => setFormFields({ ...formFields, photo: "" })}
                                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center font-bold shadow-sm"
                                >
                                  ×
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ID */}
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Employee ID (Auto Generated)</label>
                          <input
                            type="text"
                            value={formFields.employeeId}
                            readOnly
                            className="w-full text-xs bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-500 focus:outline-none font-bold"
                          />
                        </div>

                        {/* Code */}
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Employee Code *</label>
                          <input
                            type="text"
                            placeholder="e.g. EMP-101"
                            value={formFields.employeeCode}
                            onChange={(e) => setFormFields({ ...formFields, employeeCode: e.target.value })}
                            className={`w-full text-xs bg-slate-50 border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold ${
                              validationErrors.employeeCode ? "border-rose-500 focus:ring-rose-500" : "border-slate-200"
                            }`}
                          />
                          {validationErrors.employeeCode && (
                            <span className="text-[9px] font-extrabold text-rose-500 mt-1 block">{validationErrors.employeeCode}</span>
                          )}
                        </div>

                        {/* First Name */}
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">First Name *</label>
                          <input
                            type="text"
                            value={formFields.firstName}
                            onChange={(e) => setFormFields({ ...formFields, firstName: e.target.value })}
                            className={`w-full text-xs bg-slate-50 border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold ${
                              validationErrors.firstName ? "border-rose-500 focus:ring-rose-500" : "border-slate-200"
                            }`}
                          />
                          {validationErrors.firstName && (
                            <span className="text-[9px] font-extrabold text-rose-500 mt-1 block">{validationErrors.firstName}</span>
                          )}
                        </div>

                        {/* Middle Name */}
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Middle Name</label>
                          <input
                            type="text"
                            value={formFields.middleName}
                            onChange={(e) => setFormFields({ ...formFields, middleName: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        {/* Last Name */}
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Last Name *</label>
                          <input
                            type="text"
                            value={formFields.lastName}
                            onChange={(e) => setFormFields({ ...formFields, lastName: e.target.value })}
                            className={`w-full text-xs bg-slate-50 border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold ${
                              validationErrors.lastName ? "border-rose-500 focus:ring-rose-500" : "border-slate-200"
                            }`}
                          />
                          {validationErrors.lastName && (
                            <span className="text-[9px] font-extrabold text-rose-500 mt-1 block">{validationErrors.lastName}</span>
                          )}
                        </div>

                        {/* Gender */}
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Gender</label>
                          <select
                            value={formFields.gender}
                            onChange={(e) => setFormFields({ ...formFields, gender: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        {/* DOB */}
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Date of Birth</label>
                          <input
                            type="date"
                            value={formFields.dateOfBirth}
                            onChange={(e) => setFormFields({ ...formFields, dateOfBirth: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        {/* Marital Status */}
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Marital Status</label>
                          <select
                            value={formFields.maritalStatus}
                            onChange={(e) => setFormFields({ ...formFields, maritalStatus: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          >
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Divorced">Divorced</option>
                          </select>
                        </div>

                        {/* Blood Group */}
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Blood Group</label>
                          <input
                            type="text"
                            placeholder="e.g. O+"
                            value={formFields.bloodGroup}
                            onChange={(e) => setFormFields({ ...formFields, bloodGroup: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        {/* Nationality */}
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Nationality</label>
                          <input
                            type="text"
                            value={formFields.nationality}
                            onChange={(e) => setFormFields({ ...formFields, nationality: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: OFFICIAL INFORMATION */}
                  {modalTab === "Official Information" && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-100 flex items-center gap-1.5">
                        <BuildingOfficeIcon className="w-4 h-4 text-indigo-600" />
                        Official Information
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Company</label>
                          <input
                            type="text"
                            value={formFields.company}
                            onChange={(e) => setFormFields({ ...formFields, company: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Branch</label>
                          <input
                            type="text"
                            value={formFields.branch}
                            onChange={(e) => setFormFields({ ...formFields, branch: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Department</label>
                          <select
                            value={formFields.departmentId || formFields.department_id || ""}
                            onChange={(e) => {
                              const deptId = e.target.value;
                              const deptObj = departmentsList.find(d => String(d.id) === String(deptId));
                              setFormFields({
                                ...formFields,
                                departmentId: deptId,
                                department_id: deptId,
                                department: deptObj ? (deptObj.deptName || deptObj.dept_name || deptObj.name) : "",
                                designationId: "",
                                designation_id: "",
                                designation: ""
                              });
                            }}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          >
                            <option value="">Select Department</option>
                            {departmentsList.map(d => (
                              <option key={d.id} value={d.id}>{d.deptName || d.dept_name || d.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Designation</label>
                          <select
                            disabled={!formFields.departmentId && !formFields.department_id}
                            value={formFields.designationId || formFields.designation_id || ""}
                            onChange={(e) => {
                              const desigId = e.target.value;
                              const desigObj = designationsList.find(d => String(d.id) === String(desigId));
                              setFormFields({
                                ...formFields,
                                designationId: desigId,
                                designation_id: desigId,
                                designation: desigObj ? (desigObj.desigName || desigObj.desig_name || desigObj.title) : ""
                              });
                            }}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold disabled:bg-slate-100 disabled:opacity-60"
                          >
                            <option value="">Select Designation</option>
                            {designationsList
                              .filter(d => 
                                String(d.departmentId || d.department_id) === String(formFields.departmentId || formFields.department_id) &&
                                (d.status === "Active" || String(d.id) === String(formFields.designationId || formFields.designation_id))
                              )
                              .map(d => (
                                <option key={d.id} value={d.id}>{d.desigName || d.desig_name || d.title}</option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Reporting Manager</label>
                          <input
                            type="text"
                            value={formFields.reportingManager}
                            onChange={(e) => setFormFields({ ...formFields, reportingManager: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Employee Type</label>
                          <select
                            value={formFields.employeeType}
                            onChange={(e) => setFormFields({ ...formFields, employeeType: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          >
                            <option value="Full Time">Full Time</option>
                            <option value="Part Time">Part Time</option>
                            <option value="Contractor">Contractor</option>
                            <option value="Intern">Intern</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Employment Status</label>
                          <select
                            value={formFields.employmentStatus}
                            onChange={(e) => setFormFields({ ...formFields, employmentStatus: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          >
                            <option value="Active">Active</option>
                            <option value="On Leave">On Leave</option>
                            <option value="Suspended">Suspended</option>
                            <option value="Exited">Exited</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Date of Joining</label>
                          <input
                            type="date"
                            value={formFields.dateOfJoining}
                            onChange={(e) => setFormFields({ ...formFields, dateOfJoining: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Probation End Date</label>
                          <input
                            type="date"
                            value={formFields.probationEndDate}
                            onChange={(e) => setFormFields({ ...formFields, probationEndDate: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Confirmation Date</label>
                          <input
                            type="date"
                            value={formFields.confirmationDate}
                            onChange={(e) => setFormFields({ ...formFields, confirmationDate: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Work Location</label>
                          <input
                            type="text"
                            value={formFields.workLocation}
                            onChange={(e) => setFormFields({ ...formFields, workLocation: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Shift</label>
                          <input
                            type="text"
                            value={formFields.shift}
                            onChange={(e) => setFormFields({ ...formFields, shift: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Weekly Off</label>
                          <input
                            type="text"
                            value={formFields.weeklyOff}
                            onChange={(e) => setFormFields({ ...formFields, weeklyOff: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: CONTACT INFORMATION */}
                  {modalTab === "Contact Information" && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-100 flex items-center gap-1.5">
                        <EnvelopeIcon className="w-4 h-4 text-indigo-600" />
                        Contact Information
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Mobile Number</label>
                          <input
                            type="text"
                            placeholder="+919876543210"
                            value={formFields.mobileNumber}
                            onChange={(e) => setFormFields({ ...formFields, mobileNumber: e.target.value })}
                            className={`w-full text-xs bg-slate-50 border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold ${
                              validationErrors.mobileNumber ? "border-rose-500 focus:ring-rose-500" : "border-slate-200"
                            }`}
                          />
                          {validationErrors.mobileNumber && (
                            <span className="text-[9px] font-extrabold text-rose-500 mt-1 block">{validationErrors.mobileNumber}</span>
                          )}
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Alternate Mobile</label>
                          <input
                            type="text"
                            value={formFields.alternateMobile}
                            onChange={(e) => setFormFields({ ...formFields, alternateMobile: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Personal Email</label>
                          <input
                            type="text"
                            value={formFields.personalEmail}
                            onChange={(e) => setFormFields({ ...formFields, personalEmail: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Official Email *</label>
                          <input
                            type="text"
                            value={formFields.officialEmail}
                            onChange={(e) => setFormFields({ ...formFields, officialEmail: e.target.value })}
                            className={`w-full text-xs bg-slate-50 border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold ${
                              validationErrors.officialEmail ? "border-rose-500 focus:ring-rose-500" : "border-slate-200"
                            }`}
                          />
                          {validationErrors.officialEmail && (
                            <span className="text-[9px] font-extrabold text-rose-500 mt-1 block">{validationErrors.officialEmail}</span>
                          )}
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Current Address</label>
                          <input
                            type="text"
                            value={formFields.currentAddress}
                            onChange={(e) => setFormFields({ ...formFields, currentAddress: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Permanent Address</label>
                          <input
                            type="text"
                            value={formFields.permanentAddress}
                            onChange={(e) => setFormFields({ ...formFields, permanentAddress: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">City</label>
                          <input
                            type="text"
                            value={formFields.city}
                            onChange={(e) => setFormFields({ ...formFields, city: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">State</label>
                          <input
                            type="text"
                            value={formFields.state}
                            onChange={(e) => setFormFields({ ...formFields, state: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Country</label>
                          <input
                            type="text"
                            value={formFields.country}
                            onChange={(e) => setFormFields({ ...formFields, country: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">PIN Code</label>
                          <input
                            type="text"
                            value={formFields.pinCode}
                            onChange={(e) => setFormFields({ ...formFields, pinCode: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: IDENTITY DOCUMENTS */}
                  {modalTab === "Identity Documents" && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-100 flex items-center gap-1.5">
                        <IdentificationIcon className="w-4 h-4 text-indigo-600" />
                        Identity Documents
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Aadhaar Number</label>
                          <input
                            type="text"
                            placeholder="12-digit number"
                            value={formFields.aadhaarNumber}
                            onChange={(e) => setFormFields({ ...formFields, aadhaarNumber: e.target.value })}
                            className={`w-full text-xs bg-slate-50 border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold ${
                              validationErrors.aadhaarNumber ? "border-rose-500 focus:ring-rose-500" : "border-slate-200"
                            }`}
                          />
                          {validationErrors.aadhaarNumber && (
                            <span className="text-[9px] font-extrabold text-rose-500 mt-1 block">{validationErrors.aadhaarNumber}</span>
                          )}
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">PAN Number</label>
                          <input
                            type="text"
                            placeholder="10-character code"
                            value={formFields.panNumber}
                            onChange={(e) => setFormFields({ ...formFields, panNumber: e.target.value.toUpperCase() })}
                            className={`w-full text-xs bg-slate-50 border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold ${
                              validationErrors.panNumber ? "border-rose-500 focus:ring-rose-500" : "border-slate-200"
                            }`}
                          />
                          {validationErrors.panNumber && (
                            <span className="text-[9px] font-extrabold text-rose-500 mt-1 block">{validationErrors.panNumber}</span>
                          )}
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Passport Number</label>
                          <input
                            type="text"
                            value={formFields.passportNumber}
                            onChange={(e) => setFormFields({ ...formFields, passportNumber: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Driving License</label>
                          <input
                            type="text"
                            autoComplete="new-password"
                            value={formFields.drivingLicense}
                            onChange={(e) => setFormFields({ ...formFields, drivingLicense: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Voter ID</label>
                          <input
                            type="text"
                            value={formFields.voterId}
                            onChange={(e) => setFormFields({ ...formFields, voterId: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">UAN Number</label>
                          <input
                            type="text"
                            value={formFields.uanNumber}
                            onChange={(e) => setFormFields({ ...formFields, uanNumber: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">ESIC Number</label>
                          <input
                            type="text"
                            value={formFields.esicNumber}
                            onChange={(e) => setFormFields({ ...formFields, esicNumber: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: BANK & PAYROLL */}
                  {modalTab === "Bank & Payroll" && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-100 flex items-center gap-1.5">
                        <BanknotesIcon className="w-4 h-4 text-indigo-600" />
                        Bank & Payroll Setup
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Bank Name</label>
                          <input
                            type="text"
                            value={formFields.bankName}
                            onChange={(e) => setFormFields({ ...formFields, bankName: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Account Holder Name</label>
                          <input
                            type="text"
                            value={formFields.accountHolderName}
                            onChange={(e) => setFormFields({ ...formFields, accountHolderName: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Account Number</label>
                          <input
                            type="text"
                            value={formFields.accountNumber}
                            onChange={(e) => setFormFields({ ...formFields, accountNumber: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">IFSC Code</label>
                          <input
                            type="text"
                            value={formFields.ifscCode}
                            onChange={(e) => setFormFields({ ...formFields, ifscCode: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Branch Name</label>
                          <input
                            type="text"
                            value={formFields.branchName}
                            onChange={(e) => setFormFields({ ...formFields, branchName: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Salary Structure</label>
                          <select
                            value={formFields.salaryStructure}
                            onChange={(e) => setFormFields({ ...formFields, salaryStructure: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          >
                            <option value="Standard">Standard Structure</option>
                            <option value="Contract Basis">Contract Basis</option>
                            <option value="Commission">Commission</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Basic Salary ($)</label>
                          <input
                            type="number"
                            value={formFields.basicSalary}
                            onChange={(e) => setFormFields({ ...formFields, basicSalary: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Gross Salary ($)</label>
                          <input
                            type="number"
                            value={formFields.grossSalary}
                            onChange={(e) => setFormFields({ ...formFields, grossSalary: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">CTC Annual ($)</label>
                          <input
                            type="number"
                            value={formFields.ctc}
                            onChange={(e) => setFormFields({ ...formFields, ctc: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div className="flex items-center space-x-6 pt-5 col-span-3">
                          <label className="flex items-center text-xs font-bold text-slate-600 gap-1.5 select-none cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formFields.pfApplicable}
                              onChange={(e) => setFormFields({ ...formFields, pfApplicable: e.target.checked })}
                              className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-200"
                            />
                            <span>PF Applicable</span>
                          </label>

                          <label className="flex items-center text-xs font-bold text-slate-600 gap-1.5 select-none cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formFields.esiApplicable}
                              onChange={(e) => setFormFields({ ...formFields, esiApplicable: e.target.checked })}
                              className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-200"
                            />
                            <span>ESI Applicable</span>
                          </label>

                          <label className="flex items-center text-xs font-bold text-slate-600 gap-1.5 select-none cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formFields.tdsApplicable}
                              onChange={(e) => setFormFields({ ...formFields, tdsApplicable: e.target.checked })}
                              className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-200"
                            />
                            <span>TDS Deductible</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 6: EMERGENCY CONTACT */}
                  {modalTab === "Emergency Contact" && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-100 flex items-center gap-1.5">
                        <PhoneIcon className="w-4 h-4 text-indigo-600" />
                        Emergency Contact Details
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Contact Name</label>
                          <input
                            type="text"
                            value={formFields.emergencyContactName}
                            onChange={(e) => setFormFields({ ...formFields, emergencyContactName: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Relationship</label>
                          <input
                            type="text"
                            placeholder="e.g. Spouse, Father"
                            value={formFields.emergencyRelationship}
                            onChange={(e) => setFormFields({ ...formFields, emergencyRelationship: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Mobile Number</label>
                          <input
                            type="text"
                            value={formFields.emergencyMobile}
                            onChange={(e) => setFormFields({ ...formFields, emergencyMobile: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Address</label>
                          <input
                            type="text"
                            value={formFields.emergencyAddress}
                            onChange={(e) => setFormFields({ ...formFields, emergencyAddress: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 7: EDUCATION */}
                  {modalTab === "Education" && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-100 flex items-center gap-1.5">
                        <ClipboardDocumentCheckIcon className="w-4 h-4 text-indigo-600" />
                        Education Records (Allows Multiple)
                      </h4>

                      {/* Display existing */}
                      {formFields.education && formFields.education.length > 0 && (
                        <div className="border border-slate-100 rounded-xl overflow-hidden divide-y text-xs font-bold text-slate-700 bg-slate-50/30">
                          {formFields.education.map((edu, index) => (
                            <div key={index} className="flex justify-between items-center p-3">
                              <div>
                                <span className="text-indigo-600 font-black">{edu.qualification}</span> from <span className="text-slate-900">{edu.institute}</span> ({edu.university}) - {edu.passingYear} ({edu.percentage}%)
                                {edu.certificate && <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">Attachment: {edu.certificate}</span>}
                              </div>
                              <button
                                type="button"
                                onClick={() => setFormFields({
                                  ...formFields,
                                  education: formFields.education.filter((_, i) => i !== index)
                                })}
                                className="text-rose-500 hover:text-rose-700 transition"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add new sub-record form fields */}
                      <div className="bg-slate-50/50 p-4 border rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Qualification</label>
                          <input
                            type="text"
                            placeholder="e.g. MBA, B.Tech"
                            value={tempEducation.qualification}
                            onChange={(e) => setTempEducation({ ...tempEducation, qualification: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Institute Name</label>
                          <input
                            type="text"
                            value={tempEducation.institute}
                            onChange={(e) => setTempEducation({ ...tempEducation, institute: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">University / Board</label>
                          <input
                            type="text"
                            value={tempEducation.university}
                            onChange={(e) => setTempEducation({ ...tempEducation, university: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Passing Year</label>
                          <input
                            type="number"
                            value={tempEducation.passingYear}
                            onChange={(e) => setTempEducation({ ...tempEducation, passingYear: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Percentage / CGPA</label>
                          <input
                            type="text"
                            value={tempEducation.percentage}
                            onChange={(e) => setTempEducation({ ...tempEducation, percentage: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Certificate Upload Link</label>
                          <input
                            type="text"
                            placeholder="Link to file"
                            value={tempEducation.certificate}
                            onChange={(e) => setTempEducation({ ...tempEducation, certificate: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none font-mono"
                          />
                        </div>
                        <div className="flex items-end sm:col-span-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (!tempEducation.qualification || !tempEducation.institute) {
                                showToast("Qualification and Institute are required to add.", "error");
                                return;
                              }
                              setFormFields({
                                ...formFields,
                                education: [...(formFields.education || []), tempEducation]
                              });
                              setTempEducation({ qualification: "", institute: "", university: "", passingYear: "", percentage: "", certificate: "" });
                              showToast("Education record added locally!", "success");
                            }}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition w-full shadow-md"
                          >
                            + Add Education Record
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 8: EXPERIENCE */}
                  {modalTab === "Experience" && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-100 flex items-center gap-1.5">
                        <SparklesIcon className="w-4 h-4 text-indigo-600" />
                        Experience History (Allows Multiple)
                      </h4>

                      {formFields.experience && formFields.experience.length > 0 && (
                        <div className="border border-slate-100 rounded-xl overflow-hidden divide-y text-xs font-bold text-slate-700 bg-slate-50/30">
                          {formFields.experience.map((exp, index) => (
                            <div key={index} className="flex justify-between items-center p-3">
                              <div>
                                <span className="text-indigo-600 font-black">{exp.designation}</span> at <span className="text-slate-900">{exp.company}</span> ({exp.joiningDate} to {exp.leavingDate || "Present"}) - {exp.experience} years
                                {exp.letter && <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">Attachment: {exp.letter}</span>}
                              </div>
                              <button
                                type="button"
                                onClick={() => setFormFields({
                                  ...formFields,
                                  experience: formFields.experience.filter((_, i) => i !== index)
                                })}
                                className="text-rose-500 hover:text-rose-700 transition"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="bg-slate-50/50 p-4 border rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Company Name</label>
                          <input
                            type="text"
                            value={tempExperience.company}
                            onChange={(e) => setTempExperience({ ...tempExperience, company: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Designation</label>
                          <input
                            type="text"
                            value={tempExperience.designation}
                            onChange={(e) => setTempExperience({ ...tempExperience, designation: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Joining Date</label>
                          <input
                            type="date"
                            value={tempExperience.joiningDate}
                            onChange={(e) => setTempExperience({ ...tempExperience, joiningDate: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Leaving Date</label>
                          <input
                            type="date"
                            value={tempExperience.leavingDate}
                            onChange={(e) => setTempExperience({ ...tempExperience, leavingDate: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Total Experience (Years)</label>
                          <input
                            type="number"
                            value={tempExperience.experience}
                            onChange={(e) => setTempExperience({ ...tempExperience, experience: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Last Drawn Salary</label>
                          <input
                            type="number"
                            value={tempExperience.salary}
                            onChange={(e) => setTempExperience({ ...tempExperience, salary: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2 font-mono">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Experience Letter Link</label>
                          <input
                            type="text"
                            placeholder="Link to file"
                            value={tempExperience.letter}
                            onChange={(e) => setTempExperience({ ...tempExperience, letter: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (!tempExperience.company || !tempExperience.designation) {
                                showToast("Company and Designation are required.", "error");
                                return;
                              }
                              setFormFields({
                                ...formFields,
                                experience: [...(formFields.experience || []), tempExperience]
                              });
                              setTempExperience({ company: "", designation: "", joiningDate: "", leavingDate: "", experience: "", salary: "", letter: "" });
                              showToast("Experience record added locally!", "success");
                            }}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition w-full shadow-md"
                          >
                            + Add Experience Record
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 9: SKILLS & CERTIFICATIONS */}
                  {modalTab === "Skills & Certifications" && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-100 flex items-center gap-1.5">
                        <ListBulletIcon className="w-4 h-4 text-indigo-600" />
                        Skills & Certifications
                      </h4>

                      {formFields.skills && formFields.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formFields.skills.map((s, index) => (
                            <span key={index} className="px-2.5 py-1 bg-indigo-50 border border-indigo-200/60 rounded-lg text-xs font-bold text-indigo-950 flex items-center gap-2">
                              <span>{s.skill} ({s.skillLevel})</span>
                              {s.certification && <span className="text-[10px] text-purple-600 font-extrabold">🏆 {s.certification}</span>}
                              <button
                                type="button"
                                onClick={() => setFormFields({
                                  ...formFields,
                                  skills: formFields.skills.filter((_, i) => i !== index)
                                })}
                                className="text-rose-500 font-black cursor-pointer"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="bg-slate-50/50 p-4 border rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Skill</label>
                          <input
                            type="text"
                            placeholder="e.g. JavaScript, Negotiation"
                            value={tempSkill.skill}
                            onChange={(e) => setTempSkill({ ...tempSkill, skill: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Skill Level</label>
                          <select
                            value={tempSkill.skillLevel}
                            onChange={(e) => setTempSkill({ ...tempSkill, skillLevel: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none font-bold"
                          >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                            <option value="Expert">Expert</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Certification Name</label>
                          <input
                            type="text"
                            value={tempSkill.certification}
                            onChange={(e) => setTempSkill({ ...tempSkill, certification: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Issuing Organization</label>
                          <input
                            type="text"
                            value={tempSkill.organization}
                            onChange={(e) => setTempSkill({ ...tempSkill, organization: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Issue Date</label>
                          <input
                            type="date"
                            value={tempSkill.issueDate}
                            onChange={(e) => setTempSkill({ ...tempSkill, issueDate: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Expiry Date</label>
                          <input
                            type="date"
                            value={tempSkill.expiryDate}
                            onChange={(e) => setTempSkill({ ...tempSkill, expiryDate: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none font-mono"
                          />
                        </div>
                        <div className="flex items-end sm:col-span-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (!tempSkill.skill) {
                                showToast("Skill name is required.", "error");
                                return;
                              }
                              setFormFields({
                                ...formFields,
                                skills: [...(formFields.skills || []), tempSkill]
                              });
                              setTempSkill({ skill: "", skillLevel: "Intermediate", certification: "", organization: "", issueDate: "", expiryDate: "" });
                              showToast("Skill added locally!", "success");
                            }}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition w-full shadow-md"
                          >
                            + Add Skill / Certification
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 10: ATTENDANCE SETTINGS */}
                  {modalTab === "Attendance Settings" && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-100 flex items-center gap-1.5">
                        <ClockIcon className="w-4 h-4 text-indigo-600" />
                        Attendance Settings
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Shift</label>
                          <input
                            type="text"
                            value={formFields.shift}
                            onChange={(e) => setFormFields({ ...formFields, shift: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Working Hours</label>
                          <input
                            type="number"
                            value={formFields.workingHours}
                            onChange={(e) => setFormFields({ ...formFields, workingHours: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Attendance Policy</label>
                          <input
                            type="text"
                            value={formFields.attendancePolicy}
                            onChange={(e) => setFormFields({ ...formFields, attendancePolicy: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Biometric ID</label>
                          <input
                            type="text"
                            value={formFields.biometricId}
                            onChange={(e) => setFormFields({ ...formFields, biometricId: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Device ID</label>
                          <input
                            type="text"
                            value={formFields.deviceId}
                            onChange={(e) => setFormFields({ ...formFields, deviceId: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none font-bold"
                          />
                        </div>

                        <div className="flex items-center pt-5">
                          <label className="flex items-center text-xs font-bold text-slate-600 gap-1.5 select-none cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formFields.overtimeEligible}
                              onChange={(e) => setFormFields({ ...formFields, overtimeEligible: e.target.checked })}
                              className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-200"
                            />
                            <span>Overtime Eligible</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 11: LEAVE SETTINGS */}
                  {modalTab === "Leave Settings" && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-100 flex items-center gap-1.5">
                        <CalendarDaysIcon className="w-4 h-4 text-indigo-600" />
                        Leave Configuration
                      </h4>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Leave Policy</label>
                          <input
                            type="text"
                            value={formFields.leavePolicy}
                            onChange={(e) => setFormFields({ ...formFields, leavePolicy: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Casual Leave Balance</label>
                          <input
                            type="number"
                            value={formFields.casualLeave}
                            onChange={(e) => setFormFields({ ...formFields, casualLeave: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Sick Leave Balance</label>
                          <input
                            type="number"
                            value={formFields.sickLeave}
                            onChange={(e) => setFormFields({ ...formFields, sickLeave: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Earned Leave Balance</label>
                          <input
                            type="number"
                            value={formFields.earnedLeave}
                            onChange={(e) => setFormFields({ ...formFields, earnedLeave: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Maternity Leave</label>
                          <input
                            type="number"
                            value={formFields.maternityLeave}
                            onChange={(e) => setFormFields({ ...formFields, maternityLeave: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Paternity Leave</label>
                          <input
                            type="number"
                            value={formFields.paternityLeave}
                            onChange={(e) => setFormFields({ ...formFields, paternityLeave: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 12: ASSET ASSIGNMENT */}
                  {modalTab === "Asset Assignment" && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-100 flex items-center gap-1.5">
                        <WrenchScrewdriverIcon className="w-4 h-4 text-indigo-600" />
                        Assigned Hardware & Assets
                      </h4>

                      {formFields.assets && formFields.assets.length > 0 && (
                        <div className="border border-slate-100 rounded-xl overflow-hidden divide-y text-xs font-bold text-slate-700 bg-slate-50/30">
                          {formFields.assets.map((asset, index) => (
                            <div key={index} className="flex justify-between items-center p-3">
                              <div>
                                <span className="text-indigo-600 font-black">{asset.assetName}</span> ({asset.assetType} - {asset.serialNumber}) Assigned on <span className="text-slate-900">{asset.assignedDate}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setFormFields({
                                  ...formFields,
                                  assets: formFields.assets.filter((_, i) => i !== index)
                                })}
                                className="text-rose-500 hover:text-rose-700 transition"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="bg-slate-50/50 p-4 border rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Asset Type</label>
                          <input
                            type="text"
                            placeholder="e.g. Laptop, Phone"
                            value={tempAsset.assetType}
                            onChange={(e) => setTempAsset({ ...tempAsset, assetType: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Asset Code</label>
                          <input
                            type="text"
                            placeholder="e.g. AST-101"
                            value={tempAsset.assetCode}
                            onChange={(e) => setTempAsset({ ...tempAsset, assetCode: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Asset Name</label>
                          <input
                            type="text"
                            value={tempAsset.assetName}
                            onChange={(e) => setTempAsset({ ...tempAsset, assetName: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Serial Number</label>
                          <input
                            type="text"
                            value={tempAsset.serialNumber}
                            onChange={(e) => setTempAsset({ ...tempAsset, serialNumber: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Assigned Date</label>
                          <input
                            type="date"
                            value={tempAsset.assignedDate}
                            onChange={(e) => setTempAsset({ ...tempAsset, assignedDate: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Return Date</label>
                          <input
                            type="date"
                            value={tempAsset.returnDate}
                            onChange={(e) => setTempAsset({ ...tempAsset, returnDate: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                          />
                        </div>
                        <div className="flex items-end sm:col-span-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (!tempAsset.assetName || !tempAsset.serialNumber) {
                                showToast("Asset Name and Serial are required.", "error");
                                return;
                              }
                              const newAssetItem = {
                                ...tempAsset,
                                assetCode: tempAsset.assetCode || `AST-${String(tempAsset.assetType || "EQP").substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
                                assignedDate: tempAsset.assignedDate || new Date().toISOString().split("T")[0],
                                status: "Assigned"
                              };
                              setFormFields({
                                ...formFields,
                                assets: [...(formFields.assets || []), newAssetItem]
                              });
                              // Immediately sync to asset_allocation table in MySQL
                              const empName = `${formFields.firstName || ""} ${formFields.lastName || ""}`.trim() || formFields.employeeName || "Employee";
                              const empCode = formFields.employeeCode || formFields.empCode || formFields.empId || "EMP-" + Math.floor(1000 + Math.random() * 9000);
                              apiFetch("/api/table/asset_allocation", {
                                method: "POST",
                                body: JSON.stringify({
                                  assetCode: newAssetItem.assetCode,
                                  assetName: newAssetItem.assetName,
                                  assetCategory: newAssetItem.assetType || "Laptop",
                                  serialNumber: newAssetItem.serialNumber,
                                  employee: empName,
                                  empId: empCode,
                                  department: formFields.department || "IT",
                                  issueDate: newAssetItem.assignedDate,
                                  status: "Assigned"
                                })
                              }).then(() => {
                                showToast("Asset successfully assigned & saved to database!", "success");
                              }).catch(() => {
                                showToast("Asset assignment added! (Will finalize on profile save)", "info");
                              });
                              setTempAsset({ assetType: "", assetCode: "", assetName: "", serialNumber: "", assignedDate: "", returnDate: "", status: "Assigned" });
                            }}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition w-full shadow-md shadow-indigo-600/10 cursor-pointer"
                          >
                            + Assign Asset
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 13: SYSTEM LOGIN */}
                  {modalTab === "System Login" && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-100 flex items-center gap-1.5">
                        <ShieldCheckIcon className="w-4 h-4 text-indigo-600" />
                        System Credentials Setup
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Username</label>
                          <input
                            type="text"
                            value={formFields.username}
                            onChange={(e) => setFormFields({ ...formFields, username: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Official Email</label>
                          <input
                            type="text"
                            value={formFields.officialEmail}
                            readOnly
                            className="w-full text-xs bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none text-slate-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Password</label>
                          <input
                            type="password"
                            value={formFields.password}
                            onChange={(e) => setFormFields({ ...formFields, password: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Confirm Password</label>
                          <input
                            type="password"
                            value={formFields.confirmPassword}
                            onChange={(e) => setFormFields({ ...formFields, confirmPassword: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Role Type</label>
                          <select
                            value={formFields.role}
                            onChange={(e) => setFormFields({ ...formFields, role: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none font-bold"
                          >
                            <option value="Employee">Employee</option>
                            <option value="Manager">Manager</option>
                            <option value="Admin">Admin</option>
                            <option value="DepartmentHR">Department HR</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Permission Group</label>
                          <input
                            type="text"
                            value={formFields.permissionGroup}
                            onChange={(e) => setFormFields({ ...formFields, permissionGroup: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none font-bold"
                          />
                        </div>

                        <div className="flex items-center pt-5">
                          <label className="flex items-center text-xs font-bold text-slate-600 gap-1.5 select-none cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formFields.twoFactorAuth}
                              onChange={(e) => setFormFields({ ...formFields, twoFactorAuth: e.target.checked })}
                              className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-200"
                            />
                            <span>Two Factor Authentication</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 14: DOCUMENTS */}
                  {modalTab === "Documents" && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-100 flex items-center gap-1.5">
                        <DocumentArrowUpIcon className="w-4 h-4 text-indigo-600" />
                        Required Document Uploads
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.keys(formFields.documents || {}).map((docKey) => (
                          <div key={docKey} className="border border-slate-100 p-3.5 rounded-xl bg-slate-50/50 flex items-center justify-between gap-3 font-bold">
                            <div className="truncate">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block leading-none">{docKey} Document</span>
                              <span className="font-extrabold text-[11px] text-slate-700 truncate block mt-1 font-mono">
                                {formFields.documents[docKey] || "No file uploaded (Pending)"}
                              </span>
                            </div>
                            <input
                              type="text"
                              placeholder="Set file path/link"
                              value={formFields.documents[docKey]}
                              onChange={(e) => {
                                const currentDocs = { ...formFields.documents, [docKey]: e.target.value };
                                setFormFields({ ...formFields, documents: currentDocs });
                              }}
                              className="text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1 focus:outline-none w-44 font-mono font-bold"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 15: PERFORMANCE */}
                  {modalTab === "Performance" && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-100 flex items-center gap-1.5">
                        <DocumentArrowUpIcon className="w-4 h-4 text-indigo-600" />
                        KPIs & Appraisals
                      </h4>

                      {formFields.kpis && formFields.kpis.length > 0 && (
                        <div className="border border-slate-100 rounded-xl overflow-hidden divide-y text-xs font-bold text-slate-700 bg-slate-50/30">
                          {formFields.kpis.map((k, index) => (
                            <div key={index} className="flex justify-between items-center p-3">
                              <div>
                                <span className="text-indigo-600 font-black">KPI: {k.kpi}</span> (Rating: <span className="text-amber-600">{k.rating}/5</span>) Appraisal on {k.appraisalDate}
                              </div>
                              <button
                                type="button"
                                onClick={() => setFormFields({
                                  ...formFields,
                                  kpis: formFields.kpis.filter((_, i) => i !== index)
                                })}
                                className="text-rose-500 hover:text-rose-700 transition"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="bg-slate-50/50 p-4 border rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">KPI</label>
                          <input
                            type="text"
                            placeholder="e.g. Sales targets, QA coding"
                            value={tempKpi.kpi}
                            onChange={(e) => setTempKpi({ ...tempKpi, kpi: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Rating</label>
                          <select
                            value={tempKpi.rating}
                            onChange={(e) => setTempKpi({ ...tempKpi, rating: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none font-bold"
                          >
                            <option value="5">5 - Outstanding</option>
                            <option value="4">4 - Exceeds Expectations</option>
                            <option value="3">3 - Meets Expectations</option>
                            <option value="2">2 - Needs Improvement</option>
                            <option value="1">1 - Unsatisfactory</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Appraisal Date</label>
                          <input
                            type="date"
                            value={tempKpi.appraisalDate}
                            onChange={(e) => setTempKpi({ ...tempKpi, appraisalDate: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Promotion History Notes</label>
                          <input
                            type="text"
                            value={tempKpi.promotionHistory}
                            onChange={(e) => setTempKpi({ ...tempKpi, promotionHistory: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Awards</label>
                          <input
                            type="text"
                            value={tempKpi.awards}
                            onChange={(e) => setTempKpi({ ...tempKpi, awards: e.target.value })}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (!tempKpi.kpi) {
                                showToast("KPI name is required.", "error");
                                return;
                              }
                              setFormFields({
                                ...formFields,
                                kpis: [...(formFields.kpis || []), tempKpi]
                              });
                              setTempKpi({ kpi: "", rating: "5", appraisalDate: "", promotionHistory: "", awards: "" });
                              showToast("KPI entry added locally!", "success");
                            }}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition w-full shadow-md shadow-indigo-600/10"
                          >
                            + Add KPI
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 16: EXIT INFORMATION */}
                  {modalTab === "Exit Information" && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-100 flex items-center gap-1.5">
                        <FolderArrowDownIcon className="w-4 h-4 text-indigo-600" />
                        Exit & Offboarding details
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-bold text-slate-700">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Resignation Date</label>
                          <input
                            type="date"
                            value={formFields.resignationDate}
                            onChange={(e) => setFormFields({ ...formFields, resignationDate: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Last Working Date</label>
                          <input
                            type="date"
                            value={formFields.lastWorkingDate}
                            onChange={(e) => setFormFields({ ...formFields, lastWorkingDate: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Exit Interview</label>
                          <input
                            type="text"
                            value={formFields.exitInterview}
                            onChange={(e) => setFormFields({ ...formFields, exitInterview: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Clearance Status</label>
                          <select
                            value={formFields.clearanceStatus}
                            onChange={(e) => setFormFields({ ...formFields, clearanceStatus: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Cleared">Cleared</option>
                            <option value="Hold">Hold</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Final Settlement</label>
                          <select
                            value={formFields.finalSettlement}
                            onChange={(e) => setFormFields({ ...formFields, finalSettlement: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Disbursed">Disbursed</option>
                            <option value="Hold">Hold</option>
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Exit Reason</label>
                          <textarea
                            rows="2"
                            value={formFields.exitReason}
                            onChange={(e) => setFormFields({ ...formFields, exitReason: e.target.value })}
                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 17: AUDIT INFORMATION */}
                  {modalTab === "Audit Information" && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider border-b pb-2 border-slate-100 flex items-center gap-1.5">
                        <FolderArrowDownIcon className="w-4 h-4 text-indigo-600" />
                        Audit Information (Read-Only)
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Created By</span>
                          <span className="text-[11px] font-black text-slate-800 block mt-1">{formFields.createdBy}</span>
                        </div>
                        <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Created Date</span>
                          <span className="text-[11px] font-black text-slate-800 block mt-1">{formFields.createdDate}</span>
                        </div>
                        <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Updated By</span>
                          <span className="text-[11px] font-black text-slate-800 block mt-1">{formFields.updatedBy || "--"}</span>
                        </div>
                        <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Updated Date</span>
                          <span className="text-[11px] font-black text-slate-800 block mt-1">{formFields.updatedDate || "--"}</span>
                        </div>
                        <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Last Login</span>
                          <span className="text-[11px] font-black text-slate-800 block mt-1">{formFields.lastLogin || "Never"}</span>
                        </div>
                        <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Last Password Change</span>
                          <span className="text-[11px] font-black text-slate-800 block mt-1">{formFields.lastPasswordChange || "--"}</span>
                        </div>
                        <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Record Status</span>
                          <span className="text-[11px] font-black text-emerald-600 block mt-1">{formFields.recordStatus}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Wizard Controls */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/10 transition transform active:scale-95"
                  >
                    {isEditing ? "Save Profile Changes" : "Submit & Register"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Read-Only View Details Modal */}
      {selectedEmp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col justify-between">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3.5 border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
                    Employee Complete Profile Overview
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500">Persisted HRMS record details and statutory configuration</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmp(null)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              {/* Header Hero Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 border border-slate-200/80 p-4 rounded-2xl">
                <div className="flex items-center gap-4">
                  {selectedEmp.photo ? (
                    <img src={selectedEmp.photo} alt="Avatar" className="w-16 h-16 rounded-full border-2 border-indigo-500/30 object-cover shadow-sm" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-2 border-indigo-200 flex items-center justify-center font-black text-xl uppercase shadow-sm">
                      {(selectedEmp.firstName || selectedEmp.employeeName)?.[0] || ""}{(selectedEmp.lastName || "")?.[0] || ""}
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-slate-950">
                        {selectedEmp.firstName || selectedEmp.employeeName || "Standard Employee"} {selectedEmp.lastName || ""}
                      </h4>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        selectedEmp.profile_completed || selectedEmp.profileStatus === "Complete"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}>
                        {selectedEmp.profile_completed || selectedEmp.profileStatus === "Complete" ? "✓ Profile Complete" : "⏳ Profile Pending"}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-600 font-bold">
                      {selectedEmp.designation || "Staff Member"} • {selectedEmp.department || "Operations"}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                      <span>ID: <strong className="text-slate-800">#{selectedEmp.employeeId || selectedEmp.id?.slice(0, 8)}</strong></span>
                      <span>•</span>
                      <span>Code: <strong className="text-indigo-600 font-bold">{selectedEmp.employeeCode || selectedEmp.emp_code || "--"}</strong></span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap sm:flex-col gap-1.5 items-start sm:items-end">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border ${
                    selectedEmp.employmentStatus === "Active" || selectedEmp.status === "Active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}>
                    Status: {selectedEmp.employmentStatus || selectedEmp.status || "Active"}
                  </span>
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-extrabold uppercase">
                    Type: {selectedEmp.employeeType || "Full-Time"}
                  </span>
                </div>
              </div>

              {/* Data Cards Grid for All 17 Filled Employee Dashboard Sections */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Basic Details Card */}
                <div className="border border-slate-200 p-4 rounded-2xl space-y-2.5 bg-white shadow-2xs">
                  <h5 className="text-[10px] font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5 border-b pb-1.5 border-slate-100">
                    <span>👤</span> 1. Basic Details
                  </h5>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div><span className="text-slate-400 block font-semibold">First Name</span> <span className="font-bold text-slate-800">{selectedEmp.firstName || (selectedEmp.employeeName || "").split(" ")[0] || "--"}</span></div>
                    <div><span className="text-slate-400 block font-semibold">Last Name</span> <span className="font-bold text-slate-800">{selectedEmp.lastName || (selectedEmp.employeeName || "").split(" ").slice(1).join(" ") || "--"}</span></div>
                    <div><span className="text-slate-400 block font-semibold">Gender</span> <span className="font-bold text-slate-800">{selectedEmp.gender || "Male"}</span></div>
                    <div><span className="text-slate-400 block font-semibold">Date of Birth</span> <span className="font-bold text-slate-800">{selectedEmp.dateOfBirth || selectedEmp.date_of_birth || "--"}</span></div>
                    <div><span className="text-slate-400 block font-semibold">Marital Status</span> <span className="font-bold text-slate-800">{selectedEmp.maritalStatus || selectedEmp.marital_status || "Single"}</span></div>
                    <div><span className="text-slate-400 block font-semibold">Blood Group</span> <span className="font-bold text-slate-800">{selectedEmp.bloodGroup || selectedEmp.blood_group || "--"}</span></div>
                    <div><span className="text-slate-400 block font-semibold">Nationality</span> <span className="font-bold text-slate-800">{selectedEmp.nationality || "Indian"}</span></div>
                  </div>
                </div>

                {/* 2. Official & Employment Card */}
                <div className="border border-slate-200 p-4 rounded-2xl space-y-2.5 bg-white shadow-2xs">
                  <h5 className="text-[10px] font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5 border-b pb-1.5 border-slate-100">
                    <span>🏢</span> 2. Official Information
                  </h5>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div><span className="text-slate-400 block font-semibold">Branch</span> <span className="font-bold text-slate-800">{selectedEmp.branch || "--"}</span></div>
                    <div><span className="text-slate-400 block font-semibold">Department</span> <span className="font-bold text-indigo-600">{selectedEmp.department || "Operations"}</span></div>
                    <div><span className="text-slate-400 block font-semibold">Designation</span> <span className="font-bold text-slate-800">{selectedEmp.designation || "--"}</span></div>
                    <div><span className="text-slate-400 block font-semibold">Reporting Manager</span> <span className="font-bold text-slate-800">{selectedEmp.reportingManager || "--"}</span></div>
                    <div><span className="text-slate-400 block font-semibold">Date of Joining</span> <span className="font-bold text-slate-800">{selectedEmp.dateOfJoining || "--"}</span></div>
                    <div><span className="text-slate-400 block font-semibold">Shift</span> <span className="font-bold text-slate-800">{selectedEmp.shift || "General Shift"}</span></div>
                  </div>
                </div>

                {/* 3. Contact Details Card */}
                <div className="border border-slate-200 p-4 rounded-2xl space-y-2.5 bg-white shadow-2xs">
                  <h5 className="text-[10px] font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5 border-b pb-1.5 border-slate-100">
                    <span>📞</span> 3. Contact Information
                  </h5>
                  <div className="space-y-1.5 text-[11px]">
                    <div><span className="text-slate-400 font-semibold">Official Email:</span> <span className="font-mono font-bold text-indigo-600 ml-1">{selectedEmp.officialEmail || selectedEmp.email || "--"}</span></div>
                    <div><span className="text-slate-400 font-semibold">Personal Email:</span> <span className="font-mono text-slate-800 ml-1">{selectedEmp.personalEmail || "--"}</span></div>
                    <div><span className="text-slate-400 font-semibold">Mobile Number:</span> <span className="font-mono text-slate-800 ml-1">{selectedEmp.mobileNumber || "--"}</span></div>
                    <div><span className="text-slate-400 font-semibold">Current Address:</span> <span className="text-slate-800 ml-1">{selectedEmp.currentAddress || selectedEmp.address || "--"}</span></div>
                    <div><span className="text-slate-400 font-semibold">Permanent Address:</span> <span className="text-slate-800 ml-1">{selectedEmp.permanentAddress || "--"}</span></div>
                  </div>
                </div>

                {/* 4. Identity Documents Card */}
                <div className="border border-slate-200 p-4 rounded-2xl space-y-2.5 bg-white shadow-2xs">
                  <h5 className="text-[10px] font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5 border-b pb-1.5 border-slate-100">
                    <span>🆔</span> 4. Identity Documents
                  </h5>
                  <div className="space-y-1.5 text-[11px]">
                    <div><span className="text-slate-400 font-semibold">Aadhaar Number:</span> <span className="font-mono text-slate-800 ml-1">{selectedEmp.aadhaarNumber || "--"}</span></div>
                    <div><span className="text-slate-400 font-semibold">PAN Number:</span> <span className="font-mono text-slate-800 ml-1">{selectedEmp.panNumber || "--"}</span></div>
                    <div><span className="text-slate-400 font-semibold">Passport Number:</span> <span className="font-mono text-slate-800 ml-1">{selectedEmp.passportNumber || "--"}</span></div>
                    <div><span className="text-slate-400 font-semibold">Voter ID:</span> <span className="font-mono text-slate-800 ml-1">{selectedEmp.voterId || "--"}</span></div>
                  </div>
                </div>

                {/* 5. Bank & Payroll Card */}
                <div className="border border-slate-200 p-4 rounded-2xl space-y-2.5 bg-white shadow-2xs">
                  <h5 className="text-[10px] font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5 border-b pb-1.5 border-slate-100">
                    <span>🏦</span> 5. Bank & Payroll Details
                  </h5>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div><span className="text-slate-400 block font-semibold">Bank Name</span> <span className="font-bold text-slate-800">{selectedEmp.bankName || "--"}</span></div>
                    <div><span className="text-slate-400 block font-semibold">Account Number</span> <span className="font-mono font-bold text-slate-800">{selectedEmp.accountNumber || "--"}</span></div>
                    <div><span className="text-slate-400 block font-semibold">IFSC Code</span> <span className="font-mono font-bold text-slate-800">{selectedEmp.ifscCode || "--"}</span></div>
                    <div><span className="text-slate-400 block font-semibold">PF Number</span> <span className="font-mono font-bold text-slate-800">{selectedEmp.pfNumber || "--"}</span></div>
                    <div><span className="text-slate-400 block font-semibold">UAN Number</span> <span className="font-mono font-bold text-slate-800">{selectedEmp.uanNumber || "--"}</span></div>
                    <div><span className="text-slate-400 block font-semibold">ESI Number</span> <span className="font-mono font-bold text-slate-800">{selectedEmp.esiNumber || "--"}</span></div>
                  </div>
                </div>

                {/* 6. Emergency Contact Card */}
                <div className="border border-slate-200 p-4 rounded-2xl space-y-2.5 bg-white shadow-2xs">
                  <h5 className="text-[10px] font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5 border-b pb-1.5 border-slate-100">
                    <span>🚨</span> 6. Emergency Contact
                  </h5>
                  <div className="space-y-1.5 text-[11px]">
                    <div><span className="text-slate-400 font-semibold">Contact Person:</span> <span className="font-bold text-slate-800 ml-1">{selectedEmp.emergencyContactName || "--"}</span></div>
                    <div><span className="text-slate-400 font-semibold">Relationship:</span> <span className="font-bold text-slate-800 ml-1">{selectedEmp.emergencyRelationship || "--"}</span></div>
                    <div><span className="text-slate-400 font-semibold">Primary Phone:</span> <span className="font-mono font-bold text-slate-800 ml-1">{selectedEmp.emergencyPhone || "--"}</span></div>
                  </div>
                </div>

                {/* 7. Education & Qualifications */}
                <div className="border border-slate-200 p-4 rounded-2xl space-y-2.5 bg-white shadow-2xs">
                  <h5 className="text-[10px] font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5 border-b pb-1.5 border-slate-100">
                    <span>🎓</span> 7. Education
                  </h5>
                  <div className="space-y-1.5 text-[11px]">
                    <div><span className="text-slate-400 font-semibold">Qualification:</span> <span className="font-bold text-slate-800 ml-1">{selectedEmp.highestDegree || selectedEmp.qualification || "--"}</span></div>
                    <div><span className="text-slate-400 font-semibold">Institution:</span> <span className="text-slate-800 ml-1">{selectedEmp.university || selectedEmp.institution || "--"}</span></div>
                    <div><span className="text-slate-400 font-semibold">Passing Year:</span> <span className="font-bold text-slate-800 ml-1">{selectedEmp.passingYear || "--"}</span></div>
                  </div>
                </div>

                {/* 8. Work Experience */}
                <div className="border border-slate-200 p-4 rounded-2xl space-y-2.5 bg-white shadow-2xs">
                  <h5 className="text-[10px] font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5 border-b pb-1.5 border-slate-100">
                    <span>💼</span> 8. Experience
                  </h5>
                  <div className="space-y-1.5 text-[11px]">
                    <div><span className="text-slate-400 font-semibold">Total Experience:</span> <span className="font-bold text-slate-800 ml-1">{selectedEmp.totalExperience || "--"}</span></div>
                    <div><span className="text-slate-400 font-semibold">Previous Company:</span> <span className="text-slate-800 ml-1">{selectedEmp.previousCompany || "--"}</span></div>
                    <div><span className="text-slate-400 font-semibold">Previous Role:</span> <span className="text-slate-800 ml-1">{selectedEmp.previousRole || "--"}</span></div>
                  </div>
                </div>

                {/* 9. Skills & Certifications */}
                <div className="border border-slate-200 p-4 rounded-2xl space-y-2.5 bg-white shadow-2xs">
                  <h5 className="text-[10px] font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5 border-b pb-1.5 border-slate-100">
                    <span>🛠️</span> 9. Skills & Certifications
                  </h5>
                  <div className="space-y-1.5 text-[11px]">
                    <div><span className="text-slate-400 font-semibold">Primary Skills:</span> <span className="font-bold text-indigo-600 ml-1">{selectedEmp.primarySkills || selectedEmp.skills || "--"}</span></div>
                    <div><span className="text-slate-400 font-semibold">Certifications:</span> <span className="text-slate-800 ml-1">{selectedEmp.certifications || "--"}</span></div>
                  </div>
                </div>

                {/* 10. Attendance Settings */}
                <div className="border border-slate-200 p-4 rounded-2xl space-y-2.5 bg-white shadow-2xs">
                  <h5 className="text-[10px] font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5 border-b pb-1.5 border-slate-100">
                    <span>⏱️</span> 10. Attendance Settings
                  </h5>
                  <div className="space-y-1.5 text-[11px]">
                    <div><span className="text-slate-400 font-semibold">Shift Timing:</span> <span className="font-bold text-slate-800 ml-1">{selectedEmp.shift || "09:00 AM - 06:00 PM"}</span></div>
                    <div><span className="text-slate-400 font-semibold">Weekly Off:</span> <span className="font-bold text-slate-800 ml-1">{selectedEmp.weeklyOff || "Saturday, Sunday"}</span></div>
                    <div><span className="text-slate-400 font-semibold">Overtime Pay:</span> <span className="font-bold text-emerald-600 ml-1">{selectedEmp.overtimeEligible ? "Eligible" : "Ineligible"}</span></div>
                  </div>
                </div>

                {/* 11. Leave Settings & Leave Management */}
                <div className="border border-slate-200 p-4 rounded-2xl space-y-4 bg-white shadow-2xs sm:col-span-2">
                  <h5 className="text-[10px] font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5 border-b pb-1.5 border-slate-100">
                    <span>🏖️</span> 11. Leave Settings & Leave Management
                  </h5>
                  
                  {/* Quotas grid */}
                  <div className="grid grid-cols-3 gap-3 text-center text-[11px]">
                    <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                      <span className="text-[9px] text-slate-400 block font-bold">Casual Leave Balance</span>
                      <span className="font-black text-blue-650 text-sm">{selectedEmp.casualLeave !== undefined ? selectedEmp.casualLeave : "12"} Days</span>
                    </div>
                    <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                      <span className="text-[9px] text-slate-400 block font-bold">Sick Leave Balance</span>
                      <span className="font-black text-emerald-650 text-sm">{selectedEmp.sickLeave !== undefined ? selectedEmp.sickLeave : "12"} Days</span>
                    </div>
                    <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl">
                      <span className="text-[9px] text-slate-400 block font-bold">Earned Leave Balance</span>
                      <span className="font-black text-purple-650 text-sm">{selectedEmp.earnedLeave !== undefined ? selectedEmp.earnedLeave : "15"} Days</span>
                    </div>
                  </div>

                  {/* Leave history & approval dashboard */}
                  <div className="space-y-2">
                    <h6 className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Leave Applications & History</h6>
                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                      <table className="w-full text-left text-xs font-bold text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-100 text-[9px] text-slate-400 uppercase">
                          <tr>
                            <th className="p-2.5">Leave Type</th>
                            <th className="p-2.5">Date Range</th>
                            <th className="p-2.5">Days</th>
                            <th className="p-2.5">Reason</th>
                            <th className="p-2.5">Attachment</th>
                            <th className="p-2.5">Status</th>
                            <th className="p-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {empLeaves.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="p-6 text-center text-slate-400 font-medium">No leave applications registered.</td>
                            </tr>
                          ) : (
                            empLeaves.map((l) => {
                              const isPending = String(l.status || "").toUpperCase() === "PENDING";
                              const showRejectionInput = rejectionReasons[l.id] !== undefined;

                              return (
                                <tr key={l.id} className="hover:bg-slate-50/50 transition">
                                  <td className="p-2.5 text-slate-800 font-bold">{l.leaveType}</td>
                                  <td className="p-2.5 whitespace-nowrap">{l.fromDate} to {l.toDate} <span className="text-[10px] text-slate-400">({l.halfDay || "Full Day"})</span></td>
                                  <td className="p-2.5">{l.totalDays} Days</td>
                                  <td className="p-2.5 text-slate-550 max-w-xs truncate" title={l.reason}>
                                    {l.reason}
                                    {l.rejectionReason && (
                                      <div className="text-[9px] text-red-500 font-normal mt-0.5">Rejected: {l.rejectionReason}</div>
                                    )}
                                  </td>
                                  <td className="p-2.5">
                                    {l.attachment ? (
                                      <a href={l.attachment} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">View File</a>
                                    ) : (
                                      <span className="text-slate-300">None</span>
                                    )}
                                  </td>
                                  <td className="p-2.5">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                      String(l.status || "").toUpperCase() === "APPROVED"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : String(l.status || "").toUpperCase() === "REJECTED"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-amber-100 text-amber-800"
                                    }`}>
                                      {l.status}
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-right">
                                    {isPending ? (
                                      <div className="space-y-1.5">
                                        <div className="flex gap-1 justify-end">
                                          <button
                                            onClick={() => handleAdminApproveLeave(l.id)}
                                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition shadow-xs"
                                          >
                                            Approve
                                          </button>
                                          <button
                                            onClick={() => {
                                              if (showRejectionInput) {
                                                handleAdminRejectLeave(l.id);
                                              } else {
                                                setRejectionReasons(prev => ({ ...prev, [l.id]: "" }));
                                              }
                                            }}
                                            className="px-2 py-1 bg-red-650 hover:bg-red-700 text-white rounded text-[10px] font-bold transition shadow-xs"
                                          >
                                            Reject
                                          </button>
                                        </div>
                                        {showRejectionInput && (
                                          <div className="mt-1 text-left">
                                            <input
                                              type="text"
                                              placeholder="Provide rejection reason..."
                                              value={rejectionReasons[l.id]}
                                              onChange={(e) => setRejectionReasons(prev => ({ ...prev, [l.id]: e.target.value }))}
                                              className="w-full px-2 py-1 border rounded text-[10px] text-slate-700 focus:ring-1 focus:ring-red-500 focus:outline-none"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-slate-350 text-[10px]">Settled</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* 12. Asset Assignment */}
                <div className="border border-slate-200 p-4 rounded-2xl space-y-2.5 bg-white shadow-2xs">
                  <h5 className="text-[10px] font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5 border-b pb-1.5 border-slate-100">
                    <span>💻</span> 12. Asset Allocation
                  </h5>
                  <div className="space-y-1.5 text-[11px]">
                    <div><span className="text-slate-400 font-semibold">Assigned Equipment:</span> <span className="font-bold text-slate-800 ml-1">{selectedEmp.assignedAsset || selectedEmp.laptopModel || "--"}</span></div>
                    <div><span className="text-slate-400 font-semibold">Asset Tag / Serial:</span> <span className="font-mono text-slate-800 ml-1">{selectedEmp.assetSerial || "--"}</span></div>
                  </div>
                </div>

                {/* 13. System Login & Security */}
                <div className="border border-slate-200 p-4 rounded-2xl space-y-2.5 bg-white shadow-2xs">
                  <h5 className="text-[10px] font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5 border-b pb-1.5 border-slate-100">
                    <span>🔐</span> 13. System Login & Security
                  </h5>
                  <div className="space-y-1.5 text-[11px]">
                    <div><span className="text-slate-400 font-semibold">Login ID:</span> <span className="font-mono font-bold text-indigo-600 ml-1">{selectedEmp.officialEmail || selectedEmp.email}</span></div>
                    <div><span className="text-slate-400 font-semibold">2FA Security:</span> <span className="font-bold text-slate-800 ml-1">{selectedEmp.twoFactorAuth ? "Enabled" : "Disabled"}</span></div>
                    <div><span className="text-slate-400 font-semibold">Self-Service Access:</span> <span className="font-bold text-emerald-600 ml-1">Active</span></div>
                  </div>
                </div>

                {/* 14. Documents Status */}
                <div className="border border-slate-200 p-4 rounded-2xl space-y-2.5 bg-white shadow-2xs">
                  <h5 className="text-[10px] font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5 border-b pb-1.5 border-slate-100">
                    <span>📄</span> 14. Documents Status
                  </h5>
                  <div className="space-y-1.5 text-[11px]">
                    <div><span className="text-slate-400 font-semibold">Resume / CV:</span> <span className="font-bold text-emerald-600 ml-1">{selectedEmp.resumeDoc ? "Uploaded ✓" : "Pending"}</span></div>
                    <div><span className="text-slate-400 font-semibold">ID Proofs:</span> <span className="font-bold text-emerald-600 ml-1">{selectedEmp.idProofDoc ? "Uploaded ✓" : "Verified ✓"}</span></div>
                  </div>
                </div>

                {/* 15. Performance */}
                <div className="border border-slate-200 p-4 rounded-2xl space-y-2.5 bg-white shadow-2xs">
                  <h5 className="text-[10px] font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5 border-b pb-1.5 border-slate-100">
                    <span>📈</span> 15. Performance
                  </h5>
                  <div className="space-y-1.5 text-[11px]">
                    <div><span className="text-slate-400 font-semibold">Latest Rating:</span> <span className="font-bold text-indigo-600 ml-1">{selectedEmp.performanceRating || "4.5 / 5.0 (Exceeds Expectations)"}</span></div>
                    <div><span className="text-slate-400 font-semibold">Appraisal Status:</span> <span className="font-bold text-emerald-600 ml-1">{selectedEmp.appraisalStatus || "Up to Date"}</span></div>
                  </div>
                </div>

                {/* 16. Exit Information */}
                <div className="border border-slate-200 p-4 rounded-2xl space-y-2.5 bg-white shadow-2xs">
                  <h5 className="text-[10px] font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5 border-b pb-1.5 border-slate-100">
                    <span>🚪</span> 16. Exit Information
                  </h5>
                  <div className="space-y-1.5 text-[11px]">
                    <div><span className="text-slate-400 font-semibold">Separation Status:</span> <span className="font-bold text-slate-800 ml-1">{selectedEmp.exitStatus || "Active Employee (N/A)"}</span></div>
                    <div><span className="text-slate-400 font-semibold">Notice Period:</span> <span className="font-bold text-slate-800 ml-1">{selectedEmp.noticePeriod || "30 Days Standard"}</span></div>
                  </div>
                </div>

                {/* 17. Audit Information */}
                <div className="sm:col-span-2 border border-slate-200 p-4 rounded-2xl space-y-2.5 bg-slate-50/70 shadow-2xs">
                  <h5 className="text-[10px] font-black uppercase text-indigo-950 tracking-wider flex items-center gap-1.5 border-b pb-1.5 border-slate-200">
                    <span>📜</span> 17. Audit & System Information
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                    <div><span className="text-slate-400 block font-semibold">Record Status</span> <span className="font-bold text-emerald-600">{selectedEmp.recordStatus || "ACTIVE"}</span></div>
                    <div><span className="text-slate-400 block font-semibold">Created At</span> <span className="font-mono text-slate-700">{selectedEmp.created_at || selectedEmp.createdAt || new Date().toISOString().split("T")[0]}</span></div>
                    <div><span className="text-slate-400 block font-semibold">Last Login</span> <span className="font-mono text-slate-700">{selectedEmp.lastLogin || "Active Session"}</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const emp = selectedEmp;
                    setSelectedEmp(null);
                    setSearchParams({
                      category: "EMPLOYEE_MGMT",
                      tab: "Employee Profile",
                      profileTab: "Basic Information",
                      profileEmpId: emp.id
                    });
                  }}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition flex items-center gap-1.5"
                >
                  <span>👤 Manage Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const emp = selectedEmp;
                    setSelectedEmp(null);
                    handleOpenEditForm(emp);
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <span>✏️ Edit Record</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEmp(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/10 transition"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeProfile;
