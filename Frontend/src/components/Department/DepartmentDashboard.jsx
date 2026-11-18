import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch, getTableData } from "../../services/hrApi";
import { useAuth } from "../../auth/AuthProvider";
import { 
  UserGroupIcon,
  UserPlusIcon,
  ClockIcon,
  CalendarIcon,
  DocumentCheckIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  TicketIcon,
  ReceiptPercentIcon,
  ArrowTopRightOnSquareIcon,
  PlusIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  FunnelIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  EyeIcon,
  IdentificationIcon,
  BriefcaseIcon,
  CheckBadgeIcon
} from "@heroicons/react/24/outline";

import EmployeeDocumentsMasterView from "../SupportEngagement/EmployeeDocumentsMasterView";

// Safe CSV Export Utility
const exportToCsv = (filename, rows, headers) => {
  if (!rows || !rows.length) {
    alert("No records available to export for this report.");
    return;
  }
  const separator = ",";
  const keys = Object.keys(headers);
  const csvContent =
    keys.map(k => `"${headers[k]}"`).join(separator) +
    "\n" +
    rows.map(row => {
      return keys.map(k => {
        let cell = row[k] === null || row[k] === undefined ? "" : String(row[k]);
        cell = cell.replace(/"/g, '""');
        return `"${cell}"`;
      }).join(separator);
    }).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const DepartmentDashboard = ({ deptDetail = {}, dbData = {} }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const deptName = deptDetail.deptName || deptDetail.dept_name || deptDetail.name || user?.departmentName || "Department Operations";
  const deptCode = deptDetail.deptCode || deptDetail.dept_code || deptDetail.code || user?.departmentCode || "DEPT";
  const headName = deptDetail.head || (deptDetail.headEmployeeDetails?.firstName ? `${deptDetail.headEmployeeDetails?.firstName} ${deptDetail.headEmployeeDetails?.lastName || ""}` : "Unassigned");
  const branchName = deptDetail.branch ? `(${deptDetail.branch})` : "";
  const isAll = String(deptName || "").toLowerCase().trim() === "all employees" || String(deptName || "").toLowerCase().trim() === "all departments";

  // Active View Tabs:
  // "overview" | "employees" | "attendance" | "leaves" | "punches" | "documents" | "new_joiners" | "reports" | "tasks" | "expenses"
  const urlTab = searchParams.get("tab");
  const initialTab = urlTab || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Live Database States
  const [liveEmployees, setLiveEmployees] = useState(dbData?.["Employee Profile"] || dbData?.["employees"] || []);
  const [liveAttendance, setLiveAttendance] = useState(dbData?.["Daily Attendance"] || dbData?.["daily_attendance"] || []);
  const [liveLeaves, setLiveLeaves] = useState(dbData?.["Leave Requests"] || dbData?.["leave_requests"] || []);
  const [liveRegularizations, setLiveRegularizations] = useState(dbData?.["attendance_regularization"] || []);
  const [liveDocuments, setLiveDocuments] = useState(dbData?.["documents"] || []);
  const [liveTickets, setLiveTickets] = useState(dbData?.["hr_tickets"] || []);
  const [liveExpenses, setLiveExpenses] = useState([]);
  const [loadingLive, setLoadingLive] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Search & Filtering States
  const [empSearchText, setEmpSearchText] = useState("");
  const [empStatusFilter, setEmpStatusFilter] = useState("ALL");
  const [leaveFilter, setLeaveFilter] = useState("ALL"); // ALL, Pending, Approved, Rejected
  const [punchFilter, setPunchFilter] = useState("ALL"); // ALL, Pending, Approved, Rejected
  const [docFilter, setDocFilter] = useState("ALL");     // ALL, Pending, Approved, Rejected
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);

  // Modal Dialogs
  const [showPunchModal, setShowPunchModal] = useState(false);
  const [newPunchData, setNewPunchData] = useState({
    empId: "",
    employee: "",
    date: new Date().toISOString().split("T")[0],
    punchType: "Missed Both Check-In and Check-Out",
    requestedCheckIn: "09:30:00",
    requestedCheckOut: "18:30:00",
    reason: ""
  });

  const [rejectDialog, setRejectDialog] = useState({
    isOpen: false,
    type: "", // "leave" | "punch" | "doc"
    id: null,
    targetItem: null,
    reason: ""
  });

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const isFetchingRef = useRef(false);

  // Fetch Live Tenant Data from Database with concurrency guard
  const fetchLiveDeptData = useCallback(async (isSilent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      if (!isSilent) setLoadingLive(true);
      const [empData, attData, leaveData, regData, docData, ticketData, expRes] = await Promise.all([
        getTableData("employee_profile").catch(() => []),
        getTableData("daily_attendance").catch(() => []),
        getTableData("leave_requests").catch(() => []),
        getTableData("attendance_regularization").catch(() => []),
        getTableData("documents").catch(() => []),
        getTableData("hr_tickets").catch(() => []),
        apiFetch("/api/table/expense_claims?scope=overall").catch(() => ({ success: false }))
      ]);

      if (Array.isArray(empData) && empData.length > 0) setLiveEmployees(empData);
      if (Array.isArray(attData) && attData.length > 0) setLiveAttendance(attData);
      if (Array.isArray(leaveData) && leaveData.length > 0) setLiveLeaves(leaveData);
      if (Array.isArray(regData)) setLiveRegularizations(regData);
      if (Array.isArray(docData) && docData.length > 0) setLiveDocuments(docData);
      if (Array.isArray(ticketData) && ticketData.length > 0) setLiveTickets(ticketData);

      if (expRes?.success && Array.isArray(expRes.data)) {
        setLiveExpenses(expRes.data);
      } else if (Array.isArray(expRes)) {
        setLiveExpenses(expRes);
      }
    } catch (e) {
      console.error("Error loading department live metrics:", e);
    } finally {
      isFetchingRef.current = false;
      setLoadingLive(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveDeptData(true);
  }, [fetchLiveDeptData, deptName]);

  // Sync tab from URL query param
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // 1. Resolve Employees within assigned departments
  const deptEmployees = useMemo(() => {
    if (isAll) return liveEmployees;
    const targetName = String(deptName || "").toLowerCase().trim();
    const targetCode = String(deptCode || "").toLowerCase().trim();
    const targetId = String(deptDetail.id || user?.departmentId || "").toLowerCase().trim();

    return liveEmployees.filter(emp => {
      const empDept = String(emp.department || emp.department_name || emp.departmentName || "").toLowerCase().trim();
      const empDeptId = String(emp.department_id || emp.departmentId || "").toLowerCase().trim();
      const empDeptCode = String(emp.dept_code || emp.departmentCode || "").toLowerCase().trim();

      return (
        (targetName && (empDept === targetName || empDept.includes(targetName) || targetName.includes(empDept))) ||
        (targetId && empDeptId === targetId) ||
        (targetCode && empDeptCode === targetCode)
      );
    });
  }, [liveEmployees, isAll, deptName, deptCode, deptDetail.id, user?.departmentId]);

  // Helper set of employee IDs / Codes in this department for fast lookup
  const deptEmpCodes = useMemo(() => {
    const set = new Set();
    deptEmployees.forEach(e => {
      if (e.id) set.add(String(e.id).toLowerCase());
      if (e.empCode) set.add(String(e.empCode).toLowerCase());
      if (e.emp_code) set.add(String(e.emp_code).toLowerCase());
      if (e.employeeCode) set.add(String(e.employeeCode).toLowerCase());
      if (e.employeeId) set.add(String(e.employeeId).toLowerCase());
    });
    return set;
  }, [deptEmployees]);

  // Filtered employees for directory view
  const filteredEmployees = useMemo(() => {
    return deptEmployees.filter(emp => {
      const q = empSearchText.toLowerCase().trim();
      const name = (emp.employee_name || emp.employeeName || `${emp.firstName || ""} ${emp.lastName || ""}`).toLowerCase();
      const code = String(emp.empCode || emp.emp_code || emp.employeeCode || "").toLowerCase();
      const desig = String(emp.designation || emp.designation_name || emp.designationName || "").toLowerCase();
      const email = String(emp.email || emp.officialEmail || emp.company_email || "").toLowerCase();
      const branch = String(emp.branchName || emp.branch || "").toLowerCase();

      const matchesQuery = !q || name.includes(q) || code.includes(q) || desig.includes(q) || email.includes(q) || branch.includes(q);
      const status = String(emp.status || emp.employeeStatus || "Active").toLowerCase();
      const matchesStatus = empStatusFilter === "ALL" || status === empStatusFilter.toLowerCase();

      return matchesQuery && matchesStatus;
    });
  }, [deptEmployees, empSearchText, empStatusFilter]);

  // 2. Department Attendance Summary & Roster
  const deptAttendanceList = useMemo(() => {
    return liveAttendance.filter(a => {
      const code = String(a.empId || a.emp_id || a.employeeCode || a.employeeId || "").toLowerCase().trim();
      const attDept = String(a.department || "").toLowerCase().trim();
      const matchesDeptName = isAll || (attDept && attDept.includes(String(deptName).toLowerCase().trim()));
      return deptEmpCodes.has(code) || matchesDeptName;
    });
  }, [liveAttendance, deptEmpCodes, isAll, deptName]);

  const todayAttendance = useMemo(() => {
    return deptAttendanceList.filter(a => a.date === attendanceDate);
  }, [deptAttendanceList, attendanceDate]);

  const attendanceMetrics = useMemo(() => {
    const total = deptEmployees.length;
    const present = todayAttendance.filter(a => String(a.status || "").toLowerCase() === "present").length;
    const wfh = todayAttendance.filter(a => String(a.status || "").toLowerCase() === "wfh" || String(a.status || "").toLowerCase() === "remote").length;
    const late = todayAttendance.filter(a => Number(a.lateComing || a.late_coming || 0) > 0 || String(a.punctuality || "").toLowerCase() === "late").length;
    const early = todayAttendance.filter(a => Number(a.earlyLeaving || a.early_leaving || 0) > 0).length;
    const absent = Math.max(0, total - present - wfh);
    const complianceRate = total > 0 ? (((present + wfh) / total) * 100).toFixed(1) : "0.0";

    return { total, present, wfh, late, early, absent, complianceRate };
  }, [deptEmployees.length, todayAttendance]);

  // 3. Department Leave Requests Pending with HR
  const deptLeaves = useMemo(() => {
    return liveLeaves.filter(l => {
      const code = String(l.employee_id || l.employeeId || l.empId || l.employeeCode || "").toLowerCase().trim();
      const leaveDept = String(l.department || "").toLowerCase().trim();
      const matchesDept = isAll || (leaveDept && leaveDept.includes(String(deptName).toLowerCase().trim()));
      return deptEmpCodes.has(code) || matchesDept;
    });
  }, [liveLeaves, deptEmpCodes, isAll, deptName]);

  const pendingLeaves = useMemo(() => {
    return deptLeaves.filter(l => String(l.status || "").toLowerCase() === "pending");
  }, [deptLeaves]);

  const filteredLeaves = useMemo(() => {
    if (leaveFilter === "ALL") return deptLeaves;
    return deptLeaves.filter(l => String(l.status || "").toLowerCase() === leaveFilter.toLowerCase());
  }, [deptLeaves, leaveFilter]);

  // 4. Missing Punch Requests (Attendance Regularization)
  const deptPunches = useMemo(() => {
    return liveRegularizations.filter(r => {
      const code = String(r.empId || r.emp_id || r.employee_id || "").toLowerCase().trim();
      const rDept = String(r.department || "").toLowerCase().trim();
      const matchesDept = isAll || (rDept && rDept.includes(String(deptName).toLowerCase().trim()));
      return deptEmpCodes.has(code) || matchesDept;
    });
  }, [liveRegularizations, deptEmpCodes, isAll, deptName]);

  const pendingPunches = useMemo(() => {
    return deptPunches.filter(r => String(r.status || "").toLowerCase() === "pending");
  }, [deptPunches]);

  const filteredPunches = useMemo(() => {
    if (punchFilter === "ALL") return deptPunches;
    return deptPunches.filter(r => String(r.status || "").toLowerCase() === punchFilter.toLowerCase());
  }, [deptPunches, punchFilter]);

  // 5. Employee Documents Pending Verification
  const deptDocuments = useMemo(() => {
    return liveDocuments.filter(doc => {
      const docDept = String(doc.department || doc.department_name || "").toLowerCase().trim();
      const targetDept = String(deptName || "").toLowerCase().trim();
      const matchesDept = isAll || (targetDept && (docDept === targetDept || docDept.includes(targetDept) || targetDept.includes(docDept)));
      const code = String(doc.employee_id || doc.employeeId || "").toLowerCase().trim();
      return matchesDept || deptEmpCodes.has(code);
    });
  }, [liveDocuments, deptName, isAll, deptEmpCodes]);

  const pendingDocuments = useMemo(() => {
    return deptDocuments.filter(d => {
      const s = String(d.status || "").toLowerCase();
      return s === "pending approval" || s === "pending" || s === "submitted";
    });
  }, [deptDocuments]);

  const filteredDocuments = useMemo(() => {
    if (docFilter === "ALL") return deptDocuments;
    if (docFilter === "Pending") return pendingDocuments;
    return deptDocuments.filter(d => String(d.status || "").toLowerCase() === docFilter.toLowerCase());
  }, [deptDocuments, pendingDocuments, docFilter]);

  // 6. New Joiners and Employee Records (Last 90 Days)
  const newJoiners = useMemo(() => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    return [...deptEmployees].filter(emp => {
      const rawDate = emp.dateOfJoining || emp.joining_date || emp.created_at;
      if (!rawDate) return false;
      const jDate = new Date(rawDate);
      return !isNaN(jDate.getTime()) && jDate >= ninetyDaysAgo;
    }).sort((a, b) => {
      const da = new Date(a.dateOfJoining || a.joining_date || a.created_at || 0);
      const db = new Date(b.dateOfJoining || b.joining_date || b.created_at || 0);
      return db - da;
    });
  }, [deptEmployees]);

  // 7. Department HR Tasks and Notifications
  const deptTickets = useMemo(() => {
    return liveTickets.filter(t => {
      const code = String(t.employeeId || t.employee_id || "").toLowerCase().trim();
      const tDept = String(t.department || "").toLowerCase().trim();
      const matchesDept = isAll || (tDept && tDept.includes(String(deptName).toLowerCase().trim()));
      return deptEmpCodes.has(code) || matchesDept;
    });
  }, [liveTickets, deptEmpCodes, isAll, deptName]);

  const openTicketsCount = useMemo(() => {
    return deptTickets.filter(t => {
      const s = String(t.status || "").toLowerCase();
      return s === "open" || s === "pending" || s.includes("prog");
    }).length;
  }, [deptTickets]);

  // Dynamic HR Tasks Checklist
  const hrTasks = useMemo(() => {
    return [
      {
        id: "task-leaves",
        title: "Review Pending Leave Applications",
        count: pendingLeaves.length,
        status: pendingLeaves.length === 0 ? "Completed" : "Action Required",
        priority: pendingLeaves.length > 0 ? "High" : "Normal",
        actionTab: "leaves",
        desc: `${pendingLeaves.length} leave application(s) awaiting managerial review.`
      },
      {
        id: "task-punches",
        title: "Audit Missing Punch Regularizations",
        count: pendingPunches.length,
        status: pendingPunches.length === 0 ? "Completed" : "Action Required",
        priority: pendingPunches.length > 0 ? "Urgent" : "Normal",
        actionTab: "punches",
        desc: `${pendingPunches.length} punch regularization(s) submitted for approval.`
      },
      {
        id: "task-docs",
        title: "Verify Employee Identity & Statutory Documents",
        count: pendingDocuments.length,
        status: pendingDocuments.length === 0 ? "Completed" : "Action Required",
        priority: pendingDocuments.length > 0 ? "High" : "Normal",
        actionTab: "documents",
        desc: `${pendingDocuments.length} document(s) pending compliance verification.`
      },
      {
        id: "task-new-hires",
        title: "Complete Onboarding for New Joiners",
        count: newJoiners.length,
        status: newJoiners.length > 0 ? "In Progress" : "Up to Date",
        priority: "Normal",
        actionTab: "new_joiners",
        desc: `${newJoiners.length} staff member(s) joined within the last 90 days.`
      },
      {
        id: "task-attendance-audit",
        title: "Daily Attendance & Late Arrivals Review",
        count: attendanceMetrics.late,
        status: attendanceMetrics.late > 0 ? "Review Needed" : "Clean",
        priority: attendanceMetrics.late > 0 ? "Medium" : "Normal",
        actionTab: "attendance",
        desc: `${attendanceMetrics.late} late arrival(s) flagged for ${attendanceDate}.`
      }
    ];
  }, [pendingLeaves.length, pendingPunches.length, pendingDocuments.length, newJoiners.length, attendanceMetrics.late, attendanceDate]);

  // -------------------------------------------------------------
  // 1-Click Action Handlers (Approve / Reject)
  // -------------------------------------------------------------

  // Approve Leave Request
  const handleApproveLeave = async (leaveId) => {
    if (!window.confirm("Are you sure you want to approve this leave request?")) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/table/leave_requests/${leaveId}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "Approved",
          approved_by: user?.name || user?.employeeName || "Department HR",
          approval_date: new Date().toISOString().split("T")[0]
        })
      });
      // Optimistic update
      setLiveLeaves(prev => prev.map(l => l.id === leaveId ? { ...l, status: "Approved" } : l));
      alert("✅ Leave request approved successfully!");
    } catch (err) {
      alert("Leave approval failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Leave Request
  const handleRejectLeave = async (leaveId, reason) => {
    setActionLoading(true);
    try {
      await apiFetch(`/api/table/leave_requests/${leaveId}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "Rejected",
          rejectionReason: reason || "Rejected by Department HR",
          approved_by: user?.name || user?.employeeName || "Department HR"
        })
      });
      setLiveLeaves(prev => prev.map(l => l.id === leaveId ? { ...l, status: "Rejected", rejectionReason: reason } : l));
      alert("Leave request rejected.");
    } catch (err) {
      alert("Leave rejection failed: " + err.message);
    } finally {
      setActionLoading(false);
      setRejectDialog({ isOpen: false, type: "", id: null, targetItem: null, reason: "" });
    }
  };

  // Approve Missing Punch Request
  const handleApprovePunch = async (punch) => {
    if (!window.confirm(`Approve punch regularization for ${punch.employee || punch.empId} on ${punch.date}?`)) return;
    setActionLoading(true);
    try {
      // 1. Update regularization record
      await apiFetch(`/api/table/attendance_regularization/${punch.id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "Approved",
          approvedBy: user?.name || user?.employeeName || "Department HR",
          remarks: "Regularized by Department HR"
        })
      });

      // 2. Sync to daily_attendance
      const existingAtt = liveAttendance.find(a => 
        a.date === punch.date && 
        String(a.empId || a.emp_id || a.employeeCode || "").toLowerCase() === String(punch.empId || punch.emp_id).toLowerCase()
      );

      const checkInVal = punch.requestedCheckIn || punch.requested_check_in || "09:00:00";
      const checkOutVal = punch.requestedCheckOut || punch.requested_check_out || "18:00:00";

      const attPayload = {
        empId: punch.empId || punch.emp_id,
        name: punch.employee || "Employee",
        date: punch.date,
        checkIn: checkInVal,
        checkOut: checkOutVal,
        status: "Present",
        workingHours: 8.0,
        lateComing: 0,
        earlyLeaving: 0,
        remarks: `Regularized by HR (${user?.name || "HR"})`
      };

      if (existingAtt && existingAtt.id) {
        await apiFetch(`/api/table/daily_attendance/${existingAtt.id}`, {
          method: "PUT",
          body: JSON.stringify(attPayload)
        }).catch(() => {});
      } else {
        await apiFetch("/api/table/daily_attendance", {
          method: "POST",
          body: JSON.stringify({
            ...attPayload,
            id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : "att-" + Math.random().toString(36).substring(2, 9)
          })
        }).catch(() => {});
      }

      // Optimistic update
      setLiveRegularizations(prev => prev.map(r => r.id === punch.id ? { ...r, status: "Approved" } : r));
      alert("✅ Missing punch request approved and synced with daily attendance!");
      fetchLiveDeptData(true);
    } catch (err) {
      alert("Punch approval failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Missing Punch Request
  const handleRejectPunch = async (punchId, reason) => {
    setActionLoading(true);
    try {
      await apiFetch(`/api/table/attendance_regularization/${punchId}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "Rejected",
          remarks: reason || "Rejected by Department HR",
          approvedBy: user?.name || user?.employeeName || "Department HR"
        })
      });
      setLiveRegularizations(prev => prev.map(r => r.id === punchId ? { ...r, status: "Rejected", remarks: reason } : r));
      alert("Punch regularization rejected.");
    } catch (err) {
      alert("Punch rejection failed: " + err.message);
    } finally {
      setActionLoading(false);
      setRejectDialog({ isOpen: false, type: "", id: null, targetItem: null, reason: "" });
    }
  };

  // Create New Missing Punch Request (Modal Submit)
  const handleCreatePunchRequest = async (e) => {
    e.preventDefault();
    if (!newPunchData.empId || !newPunchData.date) {
      alert("Please select an employee and punch date.");
      return;
    }
    setActionLoading(true);
    try {
      const selectedEmp = deptEmployees.find(emp => 
        String(emp.empCode || emp.emp_code || emp.employeeCode || emp.id) === String(newPunchData.empId)
      );
      const empName = selectedEmp ? (selectedEmp.employee_name || selectedEmp.employeeName || `${selectedEmp.firstName || ""} ${selectedEmp.lastName || ""}`.trim()) : newPunchData.employee;

      const payload = {
        empId: newPunchData.empId,
        emp_id: newPunchData.empId,
        employee: empName,
        date: newPunchData.date,
        punchType: newPunchData.punchType,
        requestedCheckIn: newPunchData.requestedCheckIn,
        requestedCheckOut: newPunchData.requestedCheckOut,
        reason: newPunchData.reason || "Missing Punch Regularization Request",
        status: "Pending"
      };

      await apiFetch("/api/table/attendance_regularization", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      alert("✅ Missing punch regularization request submitted!");
      setShowPunchModal(false);
      setNewPunchData({
        empId: "",
        employee: "",
        date: new Date().toISOString().split("T")[0],
        punchType: "Missed Both Check-In and Check-Out",
        requestedCheckIn: "09:30:00",
        requestedCheckOut: "18:30:00",
        reason: ""
      });
      fetchLiveDeptData(true);
    } catch (err) {
      alert("Failed to submit request: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Approve / Verify Employee Document
  const handleApproveDoc = async (docId) => {
    if (!window.confirm("Mark this document as Verified and Approved?")) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/table/documents/${docId}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "Approved",
          approved_by: user?.name || user?.employeeName || "Department HR",
          remarks: "Verified and approved by Department HR"
        })
      });
      setLiveDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: "Approved" } : d));
      alert("✅ Document verified and approved!");
    } catch (err) {
      alert("Document approval failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Employee Document
  const handleRejectDoc = async (docId, reason) => {
    setActionLoading(true);
    try {
      await apiFetch(`/api/table/documents/${docId}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "Rejected",
          remarks: reason || "Rejected / Requires resubmission"
        })
      });
      setLiveDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: "Rejected", remarks: reason } : d));
      alert("Document marked for rejection/resubmission.");
    } catch (err) {
      alert("Document rejection failed: " + err.message);
    } finally {
      setActionLoading(false);
      setRejectDialog({ isOpen: false, type: "", id: null, targetItem: null, reason: "" });
    }
  };

  // -------------------------------------------------------------
  // Department-Specific Reports Generators (CSV Export)
  // -------------------------------------------------------------
  const handleExportReport = (reportType) => {
    const timestamp = new Date().toISOString().split("T")[0];
    const safeDept = deptName.replace(/[^a-zA-Z0-9]/g, "_");

    if (reportType === "headcount") {
      const rows = deptEmployees.map(emp => ({
        empCode: emp.empCode || emp.emp_code || emp.employeeCode || emp.id,
        name: emp.employee_name || emp.employeeName || `${emp.firstName || ""} ${emp.lastName || ""}`.trim(),
        designation: emp.designation || emp.designation_name || "Staff",
        department: emp.department || deptName,
        branch: emp.branchName || emp.branch || "Headquarters",
        email: emp.email || emp.officialEmail || "--",
        phone: emp.mobileNumber || emp.phone || "--",
        employmentType: emp.employmentType || emp.employment_type || "Permanent",
        dateOfJoining: emp.dateOfJoining || emp.joining_date || "--",
        status: emp.status || emp.employeeStatus || "Active"
      }));
      exportToCsv(`Staff_Roster_${safeDept}_${timestamp}`, rows, {
        empCode: "Employee Code",
        name: "Full Name",
        designation: "Designation",
        department: "Department",
        branch: "Branch",
        email: "Official Email",
        phone: "Mobile Phone",
        employmentType: "Employment Type",
        dateOfJoining: "Joining Date",
        status: "Status"
      });
    } else if (reportType === "attendance") {
      const rows = todayAttendance.map(att => ({
        date: att.date || todayStr,
        empId: att.empId || att.emp_id || att.employeeCode || "--",
        name: att.name || att.employee_name || "Employee",
        checkIn: att.checkIn || att.check_in || "--",
        checkOut: att.checkOut || att.check_out || "--",
        status: att.status || "Present",
        workingHours: att.workingHours || att.working_hours || 0,
        lateComing: att.lateComing || att.late_coming || 0,
        remarks: att.remarks || "--"
      }));
      exportToCsv(`Attendance_Summary_${safeDept}_${attendanceDate}`, rows, {
        date: "Date",
        empId: "Employee Code",
        name: "Employee Name",
        checkIn: "Check-In Time",
        checkOut: "Check-Out Time",
        status: "Status",
        workingHours: "Working Hours",
        lateComing: "Late (Mins)",
        remarks: "Remarks"
      });
    } else if (reportType === "leaves") {
      const rows = deptLeaves.map(l => ({
        reqId: l.reqId || l.id,
        empName: l.empName || l.employee_name || "Employee",
        employeeId: l.employee_id || l.employeeId || "--",
        leaveType: l.leaveType || l.leave_type || "General Leave",
        fromDate: l.fromDate || l.from_date || "--",
        toDate: l.toDate || l.to_date || "--",
        totalDays: l.totalDays || l.days || 1,
        halfDay: l.halfDay || "Full Day",
        status: l.status || "Pending",
        reason: l.reason || "--",
        approved_by: l.approved_by || "--"
      }));
      exportToCsv(`Leave_Utilization_${safeDept}_${timestamp}`, rows, {
        reqId: "Request ID",
        empName: "Employee Name",
        employeeId: "Employee Code",
        leaveType: "Leave Type",
        fromDate: "From Date",
        toDate: "To Date",
        totalDays: "Total Days",
        halfDay: "Day Half",
        status: "Status",
        reason: "Reason",
        approved_by: "Approved By"
      });
    } else if (reportType === "punches") {
      const rows = deptPunches.map(p => ({
        id: p.id,
        date: p.date,
        empId: p.empId || p.emp_id,
        employee: p.employee || "Employee",
        punchType: p.punchType || p.punch_type || "Missing Punch",
        requestedCheckIn: p.requestedCheckIn || p.requested_check_in || "--",
        requestedCheckOut: p.requestedCheckOut || p.requested_check_out || "--",
        status: p.status || "Pending",
        reason: p.reason || "--",
        approvedBy: p.approvedBy || p.approved_by || "--"
      }));
      exportToCsv(`Missing_Punch_Audit_${safeDept}_${timestamp}`, rows, {
        id: "ID",
        date: "Punch Date",
        empId: "Employee Code",
        employee: "Employee Name",
        punchType: "Punch Regularization Type",
        requestedCheckIn: "Requested Check-In",
        requestedCheckOut: "Requested Check-Out",
        status: "Status",
        reason: "Reason",
        approvedBy: "Approver"
      });
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* =========================================================================
          TOP COMMAND CENTER HEADER
      ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
              <span>Home</span>
              <span>›</span>
              <span className="text-slate-600">Department HR</span>
              <span>›</span>
              <span className="text-blue-600 font-extrabold">{deptName}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {deptName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                {deptCode}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Department
              </span>
              {branchName && (
                <span className="text-xs font-semibold text-slate-500">
                  {branchName}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Department Operations Command Center • Head: <strong className="text-slate-800">{headName}</strong> • {deptEmployees.length} Total Assigned Personnel
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fetchLiveDeptData()}
              disabled={loadingLive}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-3.5 h-3.5 text-blue-600 ${loadingLive ? "animate-spin" : ""}`} />
              <span>{loadingLive ? "Refreshing..." : "Refresh"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPunchModal(true)}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <ClockIcon className="w-3.5 h-3.5 text-amber-600" />
              <span>+ Regularize Punch</span>
            </button>

            <button
              type="button"
              onClick={() => navigate(`/hr-hub?category=EMPLOYEE_MGMT&tab=Add%20Employee&dept=${encodeURIComponent(deptName)}`)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>+ Add Employee</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          THE 8 CORE EXECUTIVE METRIC CARDS (Responsive 8-Grid)
      ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {/* 1. Assigned Employees */}
        <div 
          onClick={() => setActiveTab("employees")}
          className={`p-3 rounded-xl border transition cursor-pointer ${
            activeTab === "employees" ? "bg-blue-50 border-blue-400 ring-2 ring-blue-200" : "bg-white border-slate-200/80 hover:border-blue-300"
          }`}
        >
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[9px] font-black uppercase tracking-wider">Employees</span>
            <UserGroupIcon className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <span className="text-lg font-black text-slate-900 block mt-1">{deptEmployees.length}</span>
          <span className="text-[10px] font-bold text-blue-600">Assigned Staff</span>
        </div>

        {/* 2. Attendance Summary */}
        <div 
          onClick={() => setActiveTab("attendance")}
          className={`p-3 rounded-xl border transition cursor-pointer ${
            activeTab === "attendance" ? "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200" : "bg-white border-slate-200/80 hover:border-emerald-300"
          }`}
        >
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[9px] font-black uppercase tracking-wider">Attendance</span>
            <ClockIcon className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span className="text-lg font-black text-slate-900 block mt-1">{attendanceMetrics.present}</span>
          <span className="text-[10px] font-bold text-emerald-600">{attendanceMetrics.complianceRate}% Present</span>
        </div>

        {/* 3. Pending Leaves */}
        <div 
          onClick={() => setActiveTab("leaves")}
          className={`p-3 rounded-xl border transition cursor-pointer ${
            activeTab === "leaves" ? "bg-amber-50 border-amber-400 ring-2 ring-amber-200" : "bg-white border-slate-200/80 hover:border-amber-300"
          }`}
        >
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[9px] font-black uppercase tracking-wider">Pending Leaves</span>
            <CalendarIcon className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <span className="text-lg font-black text-slate-900 block mt-1">{pendingLeaves.length}</span>
          <span className={`text-[10px] font-bold ${pendingLeaves.length > 0 ? "text-amber-600 font-black animate-pulse" : "text-slate-400"}`}>
            {pendingLeaves.length > 0 ? `${pendingLeaves.length} Action Needed` : "All Clear"}
          </span>
        </div>

        {/* 4. Missing Punch Requests */}
        <div 
          onClick={() => setActiveTab("punches")}
          className={`p-3 rounded-xl border transition cursor-pointer ${
            activeTab === "punches" ? "bg-rose-50 border-rose-400 ring-2 ring-rose-200" : "bg-white border-slate-200/80 hover:border-rose-300"
          }`}
        >
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[9px] font-black uppercase tracking-wider">Missing Punches</span>
            <ExclamationTriangleIcon className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <span className="text-lg font-black text-slate-900 block mt-1">{pendingPunches.length}</span>
          <span className={`text-[10px] font-bold ${pendingPunches.length > 0 ? "text-rose-600 font-black" : "text-slate-400"}`}>
            {pendingPunches.length > 0 ? `${pendingPunches.length} Pending Audit` : "No Missed Punches"}
          </span>
        </div>

        {/* 5. Documents Pending Verification */}
        <div 
          onClick={() => setActiveTab("documents")}
          className={`p-3 rounded-xl border transition cursor-pointer ${
            activeTab === "documents" ? "bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200" : "bg-white border-slate-200/80 hover:border-indigo-300"
          }`}
        >
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[9px] font-black uppercase tracking-wider">Documents</span>
            <DocumentCheckIcon className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <span className="text-lg font-black text-slate-900 block mt-1">{pendingDocuments.length}</span>
          <span className={`text-[10px] font-bold ${pendingDocuments.length > 0 ? "text-indigo-600 font-black" : "text-slate-400"}`}>
            {pendingDocuments.length > 0 ? `${pendingDocuments.length} To Verify` : "All Verified"}
          </span>
        </div>

        {/* 6. New Joiners */}
        <div 
          onClick={() => setActiveTab("new_joiners")}
          className={`p-3 rounded-xl border transition cursor-pointer ${
            activeTab === "new_joiners" ? "bg-cyan-50 border-cyan-400 ring-2 ring-cyan-200" : "bg-white border-slate-200/80 hover:border-cyan-300"
          }`}
        >
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[9px] font-black uppercase tracking-wider">New Joiners</span>
            <UserPlusIcon className="w-3.5 h-3.5 text-cyan-600" />
          </div>
          <span className="text-lg font-black text-slate-900 block mt-1">{newJoiners.length}</span>
          <span className="text-[10px] font-bold text-cyan-600">Last 90 Days</span>
        </div>

        {/* 7. Department Reports */}
        <div 
          onClick={() => setActiveTab("reports")}
          className={`p-3 rounded-xl border transition cursor-pointer ${
            activeTab === "reports" ? "bg-purple-50 border-purple-400 ring-2 ring-purple-200" : "bg-white border-slate-200/80 hover:border-purple-300"
          }`}
        >
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[9px] font-black uppercase tracking-wider">Reports</span>
            <ArrowDownTrayIcon className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <span className="text-lg font-black text-slate-900 block mt-1">4</span>
          <span className="text-[10px] font-bold text-purple-600">CSV Exports Ready</span>
        </div>

        {/* 8. HR Tasks & Notifications */}
        <div 
          onClick={() => setActiveTab("tasks")}
          className={`p-3 rounded-xl border transition cursor-pointer ${
            activeTab === "tasks" ? "bg-fuchsia-50 border-fuchsia-400 ring-2 ring-fuchsia-200" : "bg-white border-slate-200/80 hover:border-fuchsia-300"
          }`}
        >
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[9px] font-black uppercase tracking-wider">HR Tasks</span>
            <ClipboardDocumentCheckIcon className="w-3.5 h-3.5 text-fuchsia-600" />
          </div>
          <span className="text-lg font-black text-slate-900 block mt-1">
            {pendingLeaves.length + pendingPunches.length + pendingDocuments.length}
          </span>
          <span className="text-[10px] font-bold text-fuchsia-600">
            {openTicketsCount > 0 ? `${openTicketsCount} Open Tickets` : "Action Queue"}
          </span>
        </div>
      </div>

      {/* =========================================================================
          FEATURE NAVIGATION TAB BAR (Responsive Pill Menu)
      ========================================================================= */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === "overview"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <SparklesIcon className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("employees")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === "employees"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <UserGroupIcon className="w-3.5 h-3.5" />
          <span>Employees ({deptEmployees.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("attendance")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === "attendance"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <ClockIcon className="w-3.5 h-3.5" />
          <span>Attendance ({attendanceMetrics.complianceRate}%)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("leaves")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === "leaves"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Pending Leaves</span>
          {pendingLeaves.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-900">
              {pendingLeaves.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("punches")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === "punches"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <ExclamationTriangleIcon className="w-3.5 h-3.5" />
          <span>Missing Punch</span>
          {pendingPunches.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-400 text-slate-900 animate-pulse">
              {pendingPunches.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("documents")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === "documents"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <DocumentCheckIcon className="w-3.5 h-3.5" />
          <span>Verification Queue</span>
          {pendingDocuments.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-indigo-200 text-indigo-900">
              {pendingDocuments.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("new_joiners")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === "new_joiners"
              ? "bg-cyan-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <UserPlusIcon className="w-3.5 h-3.5" />
          <span>New Joiners ({newJoiners.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === "reports"
              ? "bg-purple-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <ArrowDownTrayIcon className="w-3.5 h-3.5" />
          <span>Reports & CSV</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tasks")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === "tasks"
              ? "bg-fuchsia-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <ClipboardDocumentCheckIcon className="w-3.5 h-3.5" />
          <span>Tasks & Tickets</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 0: COMPLETE OVERVIEW HUB (Summary of all 8 areas)
      ========================================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left 2 Cols: Attendance & Approvals */}
            <div className="lg:col-span-2 space-y-4">
              {/* Today's Attendance Gauge & Snapshot */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex justify-between items-center border-b pb-2.5 border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-emerald-600" />
                    Today's Department Attendance Summary
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("attendance")}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    View Live Roster →
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-center">
                    <span className="text-[10px] font-black uppercase text-emerald-600 block">Present</span>
                    <span className="text-xl font-black text-emerald-950 mt-0.5 block">{attendanceMetrics.present}</span>
                    <span className="text-[10px] font-semibold text-emerald-700">{attendanceMetrics.complianceRate}% Rate</span>
                  </div>
                  <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl text-center">
                    <span className="text-[10px] font-black uppercase text-amber-600 block">Late (&gt;15m)</span>
                    <span className="text-xl font-black text-amber-950 mt-0.5 block">{attendanceMetrics.late}</span>
                    <span className="text-[10px] font-semibold text-amber-700">Flagged Arrivals</span>
                  </div>
                  <div className="p-3 bg-cyan-50/70 border border-cyan-100 rounded-xl text-center">
                    <span className="text-[10px] font-black uppercase text-cyan-600 block">WFH / On Duty</span>
                    <span className="text-xl font-black text-cyan-950 mt-0.5 block">{attendanceMetrics.wfh}</span>
                    <span className="text-[10px] font-semibold text-cyan-700">Approved Remote</span>
                  </div>
                  <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl text-center">
                    <span className="text-[10px] font-black uppercase text-rose-600 block">Absent</span>
                    <span className="text-xl font-black text-rose-950 mt-0.5 block">{attendanceMetrics.absent}</span>
                    <span className="text-[10px] font-semibold text-rose-700">Unpunched</span>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500">
                    <span>Department Attendance Coverage</span>
                    <span className="text-emerald-600">{attendanceMetrics.complianceRate}% Active</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                    <div style={{ width: `${Math.min(100, Number(attendanceMetrics.complianceRate))}%` }} className="bg-emerald-500 h-full"></div>
                    <div style={{ width: `${Math.min(100, deptEmployees.length > 0 ? (attendanceMetrics.wfh / deptEmployees.length) * 100 : 0)}%` }} className="bg-cyan-500 h-full"></div>
                  </div>
                </div>
              </div>

              {/* Combined Pending Approvals Box (Leaves & Missing Punches) */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex justify-between items-center border-b pb-2.5 border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-4 h-4 text-amber-600" />
                    Pending Approvals Requiring Department HR Action
                  </h3>
                  <span className="text-xs font-bold text-slate-400">
                    {pendingLeaves.length + pendingPunches.length} Pending
                  </span>
                </div>

                {pendingLeaves.length === 0 && pendingPunches.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">
                    <CheckCircleIcon className="w-8 h-8 mx-auto text-emerald-500 mb-1" />
                    <p className="text-xs font-bold text-slate-700">No pending approvals for this department!</p>
                    <p className="text-[11px] text-slate-400">All leave requests and missing punch regularizations have been audited.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Pending Leaves List */}
                    {pendingLeaves.slice(0, 3).map((leave) => (
                      <div key={leave.id} className="p-3 bg-amber-50/50 border border-amber-200/70 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800">
                              Leave: {leave.leaveType || leave.leave_type || "Casual Leave"}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {leave.empName || leave.employee_name || "Employee"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {leave.fromDate} to {leave.toDate} ({leave.totalDays || leave.days || 1} Days) • Reason: "{leave.reason || "Personal work"}"
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleApproveLeave(leave.id)}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-lg shadow-2xs transition cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectDialog({ isOpen: true, type: "leave", id: leave.id, targetItem: leave, reason: "" })}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black rounded-lg shadow-2xs transition cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Pending Punches List */}
                    {pendingPunches.slice(0, 3).map((punch) => (
                      <div key={punch.id} className="p-3 bg-rose-50/50 border border-rose-200/70 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800">
                              Missing Punch: {punch.punchType || punch.punch_type || "Missed In/Out"}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {punch.employee || punch.empId}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Date: {punch.date} • In: {punch.requestedCheckIn || "09:30"} | Out: {punch.requestedCheckOut || "18:30"} • "{punch.reason || "Forgot punch"}"
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleApprovePunch(punch)}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-lg shadow-2xs transition cursor-pointer"
                          >
                            Approve & Sync
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectDialog({ isOpen: true, type: "punch", id: punch.id, targetItem: punch, reason: "" })}
                            disabled={actionLoading}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black rounded-lg shadow-2xs transition cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Col: HR Action Checklist & Quick Reports */}
            <div className="space-y-4">
              {/* Actionable Department HR Tasks */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex justify-between items-center border-b pb-2.5 border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <ClipboardDocumentCheckIcon className="w-4 h-4 text-fuchsia-600" />
                    Department HR Checklist
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("tasks")}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    All Tasks →
                  </button>
                </div>

                <div className="space-y-2">
                  {hrTasks.map((t) => (
                    <div 
                      key={t.id}
                      onClick={() => setActiveTab(t.actionTab)}
                      className="p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 bg-slate-50/70 hover:bg-white transition cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-900">{t.title}</div>
                        <div className="text-[10px] text-slate-400">{t.desc}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                        t.count > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {t.count > 0 ? `${t.count} Due` : "✓ Done"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 1-Click Quick Reports Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex justify-between items-center border-b pb-2.5 border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <ArrowDownTrayIcon className="w-4 h-4 text-purple-600" />
                    Instant Department CSV Reports
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportReport("headcount")}
                    className="p-2.5 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 rounded-xl text-left transition cursor-pointer"
                  >
                    <span className="text-[10px] font-black text-blue-700 block">1. Staff Roster</span>
                    <span className="text-[9px] text-blue-600 block mt-0.5">All Active Profiles</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportReport("attendance")}
                    className="p-2.5 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl text-left transition cursor-pointer"
                  >
                    <span className="text-[10px] font-black text-emerald-700 block">2. Daily Attendance</span>
                    <span className="text-[9px] text-emerald-600 block mt-0.5">Punches & Compliance</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportReport("leaves")}
                    className="p-2.5 bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200 rounded-xl text-left transition cursor-pointer"
                  >
                    <span className="text-[10px] font-black text-amber-700 block">3. Leave Log</span>
                    <span className="text-[9px] text-amber-600 block mt-0.5">History & Balances</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportReport("punches")}
                    className="p-2.5 bg-rose-50/80 hover:bg-rose-100/80 border border-rose-200 rounded-xl text-left transition cursor-pointer"
                  >
                    <span className="text-[10px] font-black text-rose-700 block">4. Regularization</span>
                    <span className="text-[9px] text-rose-600 block mt-0.5">Punch Audit Trail</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 1: EMPLOYEES WITHIN ASSIGNED DEPARTMENTS
      ========================================================================= */}
      {activeTab === "employees" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <UserGroupIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 tracking-tight">
                  {deptName} Staff Directory
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Showing all active employees and staff members assigned to {deptName} ({deptEmployees.length} total)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, code, designation..."
                  value={empSearchText}
                  onChange={(e) => setEmpSearchText(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-blue-500 w-full sm:w-60"
                />
              </div>

              <select
                value={empStatusFilter}
                onChange={(e) => setEmpStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-blue-500 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Probation">Probation</option>
                <option value="Notice">Notice</option>
                <option value="Inactive">Inactive</option>
              </select>

              <button
                type="button"
                onClick={() => handleExportReport("headcount")}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1 cursor-pointer"
                title="Download Staff CSV"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Emp Code</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Joining Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp, idx) => {
                    const empName = emp.employee_name || emp.employeeName || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "Staff Member";
                    const empCode = emp.empCode || emp.emp_code || emp.employeeCode || `EMP-${String(idx + 1).padStart(3, "0")}`;
                    const desig = emp.designation || emp.designation_name || emp.designationName || "Employee";
                    const branch = emp.branchName || emp.branch || "Headquarters";
                    const email = emp.email || emp.officialEmail || emp.company_email || "--";
                    const phone = emp.mobileNumber || emp.phone || "--";
                    const joinDate = emp.dateOfJoining || emp.joining_date || emp.created_at ? new Date(emp.dateOfJoining || emp.joining_date || emp.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "--";
                    const status = emp.status || emp.employeeStatus || "Active";
                    const initials = empName.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "EM";

                    return (
                      <tr key={emp.id || idx} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{empName}</div>
                              <div className="text-[10px] text-slate-400">{emp.employmentType || "Permanent"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">
                          <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded text-[11px]">
                            {empCode}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{desig}</td>
                        <td className="py-3 px-4 text-slate-600">{branch}</td>
                        <td className="py-3 px-4 text-slate-500">
                          <div>{email}</div>
                          {phone !== "--" && <div className="text-[10px] text-slate-400">{phone}</div>}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{joinDate}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            status === "Active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      <UserGroupIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-slate-600 text-xs">
                        {empSearchText ? `No staff found matching "${empSearchText}"` : `No employees currently found in ${deptName}`}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: DEPARTMENT ATTENDANCE SUMMARY & LIVE ROSTER
      ========================================================================= */}
      {activeTab === "attendance" && (
        <div className="space-y-4">
          {/* Header Controls for Date */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-black text-slate-900">Department Attendance Console</h3>
                <p className="text-[11px] text-slate-500">Live roster and punch logs for {deptName} staff</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-emerald-500 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => handleExportReport("attendance")}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1 cursor-pointer"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Roster CSV</span>
              </button>
            </div>
          </div>

          {/* Roster Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Check-In</th>
                    <th className="py-3 px-4">Check-Out</th>
                    <th className="py-3 px-4">Working Hours</th>
                    <th className="py-3 px-4">Punctuality</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {todayAttendance.length > 0 ? (
                    todayAttendance.map((att, idx) => {
                      const empCode = att.empId || att.emp_id || att.employeeCode || "--";
                      const matchedEmp = deptEmployees.find(e => 
                        String(e.empCode || e.emp_code || e.employeeCode || e.id).toLowerCase() === String(empCode).toLowerCase()
                      );
                      const empName = att.name || (matchedEmp ? (matchedEmp.employee_name || `${matchedEmp.firstName || ""} ${matchedEmp.lastName || ""}`.trim()) : "Employee");
                      const inVal = att.checkIn || att.check_in || "--";
                      const outVal = att.checkOut || att.check_out || "--";
                      const hours = att.workingHours || att.working_hours || (inVal !== "--" && outVal !== "--" ? "8.0" : "0.0");
                      const isLate = Number(att.lateComing || att.late_coming || 0) > 0;
                      const status = att.status || (inVal !== "--" ? "Present" : "Absent");

                      return (
                        <tr key={att.id || idx} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{empName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{empCode}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-500">{att.date || attendanceDate}</td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-700">{inVal}</td>
                          <td className="py-3 px-4 font-mono font-bold text-blue-700">{outVal}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{hours} hrs</td>
                          <td className="py-3 px-4">
                            {isLate ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                                Late (+{att.lateComing || att.late_coming}m)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700">
                                On Time
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              status === "Present"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        <ClockIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-slate-600 text-xs">No punch logs recorded for {attendanceDate}</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          When employees check in via biometric, face, or QR scanner, their live punch status appears here.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: LEAVE REQUESTS PENDING WITH HR
      ========================================================================= */}
      {activeTab === "leaves" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 tracking-tight">
                  Leave Applications Inbox
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Review, approve, or reject employee leave requests for {deptName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={leaveFilter}
                onChange={(e) => setLeaveFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-amber-500 cursor-pointer"
              >
                <option value="ALL">All Requests ({deptLeaves.length})</option>
                <option value="Pending">Pending Approvals ({pendingLeaves.length})</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>

              <button
                type="button"
                onClick={() => handleExportReport("leaves")}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1 cursor-pointer"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5 text-amber-600" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Total Days</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredLeaves.length > 0 ? (
                  filteredLeaves.map((leave) => {
                    const isPending = String(leave.status || "").toLowerCase() === "pending";
                    const isApproved = String(leave.status || "").toLowerCase() === "approved";
                    const isRejected = String(leave.status || "").toLowerCase() === "rejected";

                    return (
                      <tr key={leave.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{leave.empName || leave.employee_name || "Employee"}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{leave.employee_id || leave.employeeId || ""}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {leave.leaveType || leave.leave_type || "General Leave"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {leave.fromDate} to {leave.toDate}
                        </td>
                        <td className="py-3 px-4 font-black text-slate-900">
                          {leave.totalDays || leave.days || 1} Days
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={leave.reason}>
                          {leave.reason || "--"}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            isApproved ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            isRejected ? "bg-rose-50 text-rose-700 border-rose-200" :
                            "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {leave.status || "Pending"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {isPending ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleApproveLeave(leave.id)}
                                disabled={actionLoading}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black shadow-2xs transition cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectDialog({ isOpen: true, type: "leave", id: leave.id, targetItem: leave, reason: "" })}
                                disabled={actionLoading}
                                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black shadow-2xs transition cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px] font-bold">
                              {isApproved ? "✓ Approved" : "✕ Rejected"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      <CalendarIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-slate-600 text-xs">No leave requests found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: MISSING PUNCH REQUESTS (ATTENDANCE REGULARIZATION)
      ========================================================================= */}
      {activeTab === "punches" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <ExclamationTriangleIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 tracking-tight">
                  Missing Punch & Regularization Console
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Review and regularize attendance punch discrepancies for {deptName} personnel
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={punchFilter}
                onChange={(e) => setPunchFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-rose-500 cursor-pointer"
              >
                <option value="ALL">All Requests ({deptPunches.length})</option>
                <option value="Pending">Pending Audit ({pendingPunches.length})</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>

              <button
                type="button"
                onClick={() => setShowPunchModal(true)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1 cursor-pointer"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>+ Request Regularization</span>
              </button>

              <button
                type="button"
                onClick={() => handleExportReport("punches")}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1 cursor-pointer"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5 text-rose-600" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Issue / Punch Type</th>
                  <th className="py-3 px-4">Requested Punch Times</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredPunches.length > 0 ? (
                  filteredPunches.map((punch) => {
                    const isPending = String(punch.status || "").toLowerCase() === "pending";
                    const isApproved = String(punch.status || "").toLowerCase() === "approved";
                    const isRejected = String(punch.status || "").toLowerCase() === "rejected";

                    return (
                      <tr key={punch.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{punch.employee || punch.empId}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{punch.empId || punch.emp_id}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                          {punch.date}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {punch.punchType || punch.punch_type || "Missed Punch"}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap">
                          <div>In: <strong className="text-emerald-700">{punch.requestedCheckIn || punch.requested_check_in || "--"}</strong></div>
                          <div>Out: <strong className="text-blue-700">{punch.requestedCheckOut || punch.requested_check_out || "--"}</strong></div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={punch.reason}>
                          {punch.reason || "--"}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            isApproved ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            isRejected ? "bg-rose-50 text-rose-700 border-rose-200" :
                            "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {punch.status || "Pending"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {isPending ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleApprovePunch(punch)}
                                disabled={actionLoading}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black shadow-2xs transition cursor-pointer"
                              >
                                Approve & Sync
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectDialog({ isOpen: true, type: "punch", id: punch.id, targetItem: punch, reason: "" })}
                                disabled={actionLoading}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black shadow-2xs transition cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px] font-bold">
                              {isApproved ? "✓ Regularized" : "✕ Rejected"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      <ExclamationTriangleIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-slate-600 text-xs">No missing punch requests found</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Employees who forgot to punch in or out can request regularization here.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: EMPLOYEE DOCUMENTS PENDING VERIFICATION
      ========================================================================= */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <DocumentCheckIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 tracking-tight">
                    Employee Document Verification Queue
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Verify statutory, identity, and academic documents uploaded by {deptName} team ({deptDocuments.length} total)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={docFilter}
                  onChange={(e) => setDocFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-indigo-500 cursor-pointer"
                >
                  <option value="ALL">All Documents ({deptDocuments.length})</option>
                  <option value="Pending">Pending Verification ({pendingDocuments.length})</option>
                  <option value="Approved">Verified & Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Document Title / Number</th>
                    <th className="py-3 px-4">Uploaded Date</th>
                    <th className="py-3 px-4">Preview</th>
                    <th className="py-3 px-4">Verification Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredDocuments.length > 0 ? (
                    filteredDocuments.map((doc) => {
                      const isPending = String(doc.status || "").toLowerCase().includes("pending") || String(doc.status || "").toLowerCase() === "submitted";
                      const isApproved = String(doc.status || "").toLowerCase() === "approved" || String(doc.status || "").toLowerCase() === "verified";
                      const isRejected = String(doc.status || "").toLowerCase() === "rejected";

                      return (
                        <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{doc.employee_name || "Employee"}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{doc.employee_id || ""}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{doc.title || doc.description || "Uploaded Document"}</div>
                            <div className="text-[10px] text-indigo-600 font-mono">{doc.document_number || ""}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {doc.created_at ? new Date(doc.created_at).toLocaleDateString("en-IN") : "--"}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {doc.file_url ? (
                              <a
                                href={doc.file_url.startsWith("http") ? doc.file_url : `http://localhost:5000/${doc.file_url.replace(/^\//, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline font-bold text-[11px] inline-flex items-center gap-1"
                              >
                                <EyeIcon className="w-3.5 h-3.5" />
                                <span>View File</span>
                              </a>
                            ) : (
                              <span className="text-slate-300 italic text-[10px]">No file attached</span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              isApproved ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              isRejected ? "bg-rose-50 text-rose-700 border-rose-200" :
                              "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                            }`}>
                              {doc.status || "Pending Approval"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {isPending ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleApproveDoc(doc.id)}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black shadow-2xs transition cursor-pointer"
                                >
                                  Verify & Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRejectDialog({ isOpen: true, type: "doc", id: doc.id, targetItem: doc, reason: "" })}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black shadow-2xs transition cursor-pointer"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px] font-bold">
                                {isApproved ? "✓ Verified" : "✕ Rejected"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        <DocumentCheckIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-slate-600 text-xs">No employee documents found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Full Interactive Document Master Browser */}
          <div className="pt-2">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Master Document Repository</h4>
            <EmployeeDocumentsMasterView
              deptFilter={isAll ? "ALL" : deptName}
              deptName={deptName}
              readOnlyDepartment={!isAll}
              user={user}
              onRefresh={fetchLiveDeptData}
            />
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: NEW JOINERS AND EMPLOYEE RECORDS
      ========================================================================= */}
      {activeTab === "new_joiners" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
                <UserPlusIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 tracking-tight">
                  New Joiners & Onboarding Roster
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Recent additions to {deptName} within the last 90 days ({newJoiners.length} staff)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/hr-hub?category=EMPLOYEE_MGMT&tab=Add%20Employee&dept=${encodeURIComponent(deptName)}`)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>+ Onboard New Hire</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {newJoiners.length > 0 ? (
              newJoiners.map((emp, idx) => {
                const empName = emp.employee_name || emp.employeeName || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "Staff Member";
                const empCode = emp.empCode || emp.emp_code || emp.employeeCode || `EMP-${idx + 1}`;
                const desig = emp.designation || emp.designation_name || "Employee";
                const branch = emp.branchName || emp.branch || "Headquarters";
                const joinDate = emp.dateOfJoining || emp.joining_date || emp.created_at;
                const dateDisplay = joinDate ? new Date(joinDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "--";
                const daysAgo = joinDate ? Math.floor((new Date() - new Date(joinDate)) / (1000 * 60 * 60 * 24)) : 0;
                const email = emp.email || emp.officialEmail || "--";
                const phone = emp.mobileNumber || emp.phone || "--";

                return (
                  <div key={emp.id || idx} className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-700 font-black text-sm flex items-center justify-center shrink-0">
                          {empName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{empName}</h4>
                          <span className="font-mono text-[10px] text-cyan-700 font-bold">{empCode}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-cyan-100 text-cyan-800">
                        {daysAgo >= 0 ? `${daysAgo}d ago` : "Upcoming"}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 border-t pt-2 border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Designation:</span>
                        <strong className="text-slate-800">{desig}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Branch:</span>
                        <strong className="text-slate-800">{branch}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Joined On:</span>
                        <strong className="text-slate-800">{dateDisplay}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Type:</span>
                        <strong className="text-emerald-700">{emp.employmentType || "Permanent"}</strong>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 border-t pt-2 border-slate-100">
                      <div>✉ {email}</div>
                      {phone !== "--" && <div>☎ {phone}</div>}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                <UserPlusIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-600 text-xs">No new joiners in the last 90 days</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Newly hired staff joining {deptName} will automatically be featured here with their onboarding status.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: DEPARTMENT-SPECIFIC REPORTS (CSV EXPORT HUB)
      ========================================================================= */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ArrowDownTrayIcon className="w-4 h-4 text-purple-600" />
              Department Reports & Export Center
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Generate and download live data extracts formatted for Excel, audits, and department review.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Report 1: Staff Roster */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                    HR Headcount
                  </span>
                  <span className="text-xs font-bold text-slate-400">{deptEmployees.length} Records</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">Department Staff & Headcount Roster</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Export complete list of all staff in {deptName} including Employee Code, Full Name, Designation, Branch, Status, Join Date, Email, Phone, and Employment Type.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExportReport("headcount")}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>Download Staff Roster (.CSV)</span>
              </button>
            </div>

            {/* Report 2: Attendance Summary */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Time & Attendance
                  </span>
                  <span className="text-xs font-bold text-slate-400">{todayAttendance.length} Today</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">Daily Attendance & Punch Log Report</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Export punch logs including check-in, check-out, working hours, late arrivals, and attendance status for {attendanceDate}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExportReport("attendance")}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>Download Attendance Report (.CSV)</span>
              </button>
            </div>

            {/* Report 3: Leave Utilization */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                    Leaves
                  </span>
                  <span className="text-xs font-bold text-slate-400">{deptLeaves.length} Total</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">Leave Utilization & Absence History</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Export leave requests, leave types (Casual, Sick, Paid), duration, approval history, and employee reasons for {deptName}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExportReport("leaves")}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>Download Leave Report (.CSV)</span>
              </button>
            </div>

            {/* Report 4: Missing Punch Audit */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                    Audit
                  </span>
                  <span className="text-xs font-bold text-slate-400">{deptPunches.length} Logs</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">Missing Punch Regularization Audit</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Export complete audit trail of missing punch applications, requested adjustments, justification remarks, and approval status.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleExportReport("punches")}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>Download Regularization Report (.CSV)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 8: DEPARTMENT HR TASKS AND NOTIFICATIONS
      ========================================================================= */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Department HR Tasks Checklist */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex justify-between items-center border-b pb-2.5 border-slate-100">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <ClipboardDocumentCheckIcon className="w-4 h-4 text-fuchsia-600" />
                  Department HR Action Items
                </h3>
                <span className="text-[10px] font-bold text-slate-400">Real-Time Checklist</span>
              </div>

              <div className="space-y-2.5">
                {hrTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${task.count > 0 ? "bg-amber-500" : "bg-emerald-500"}`}></span>
                        <h4 className="text-xs font-bold text-slate-900">{task.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500">{task.desc}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab(task.actionTab)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                        task.count > 0 
                          ? "bg-amber-600 hover:bg-amber-700 text-white shadow-2xs" 
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {task.count > 0 ? `Review (${task.count})` : "View"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Department Helpdesk & Notifications */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex justify-between items-center border-b pb-2.5 border-slate-100">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <TicketIcon className="w-4 h-4 text-blue-600" />
                  Department Tickets & Helpdesk Queries
                </h3>
                <span className="text-xs font-bold text-blue-600">{deptTickets.length} Total</span>
              </div>

              <div className="space-y-2">
                {deptTickets.length > 0 ? (
                  deptTickets.map((ticket, idx) => {
                    const isOpen = String(ticket.status || "").toLowerCase() === "open" || String(ticket.status || "").toLowerCase() === "pending";

                    return (
                      <div key={ticket.id || idx} className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-blue-600">
                            {ticket.ticketNo || ticket.ticket_no || `TCK-${ticket.id}`}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            isOpen ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            {ticket.status || "Open"}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{ticket.subject || ticket.category || "Employee Query"}</h4>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Raised by: <strong className="text-slate-600">{ticket.empName || ticket.emp_name || "Employee"}</strong></span>
                          <span>Priority: <strong className="text-rose-600">{ticket.priority || "Normal"}</strong></span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-slate-400">
                    <TicketIcon className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                    <p className="text-xs font-bold text-slate-600">No active helpdesk tickets</p>
                    <p className="text-[11px] text-slate-400">Department tickets submitted by staff will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CREATE MISSING PUNCH REQUEST
      ========================================================================= */}
      {showPunchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-sm text-slate-900">Request Missing Punch Regularization</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPunchModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePunchRequest} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Employee *</label>
                <select
                  required
                  value={newPunchData.empId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const emp = deptEmployees.find(em => String(em.empCode || em.emp_code || em.employeeCode || em.id) === selId);
                    setNewPunchData({
                      ...newPunchData,
                      empId: selId,
                      employee: emp ? (emp.employee_name || emp.employeeName || `${emp.firstName || ""} ${emp.lastName || ""}`.trim()) : ""
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-rose-500"
                >
                  <option value="">-- Choose Employee --</option>
                  {deptEmployees.map((emp, i) => {
                    const code = emp.empCode || emp.emp_code || emp.employeeCode || emp.id;
                    const name = emp.employee_name || emp.employeeName || `${emp.firstName || ""} ${emp.lastName || ""}`.trim();
                    return (
                      <option key={emp.id || i} value={code}>
                        {name} ({code})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Punch Date *</label>
                <input
                  type="date"
                  required
                  value={newPunchData.date}
                  onChange={(e) => setNewPunchData({ ...newPunchData, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Regularization Type *</label>
                <select
                  value={newPunchData.punchType}
                  onChange={(e) => setNewPunchData({ ...newPunchData, punchType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-rose-500"
                >
                  <option value="Missed Both Check-In and Check-Out">Missed Both Check-In & Check-Out</option>
                  <option value="Missed Check-In">Missed Check-In</option>
                  <option value="Missed Check-Out">Missed Check-Out</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Requested Check-In</label>
                  <input
                    type="time"
                    step="1"
                    value={newPunchData.requestedCheckIn}
                    onChange={(e) => setNewPunchData({ ...newPunchData, requestedCheckIn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Requested Check-Out</label>
                  <input
                    type="time"
                    step="1"
                    value={newPunchData.requestedCheckOut}
                    onChange={(e) => setNewPunchData({ ...newPunchData, requestedCheckOut: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Reason / Justification</label>
                <textarea
                  rows="2"
                  placeholder="e.g. On-site client visit, biometric machine was offline..."
                  value={newPunchData.reason}
                  onChange={(e) => setNewPunchData({ ...newPunchData, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-rose-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPunchModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "Submitting..." : "Submit Regularization"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: REJECTION REASON DIALOG
      ========================================================================= */}
      {rejectDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2 border-slate-100">
              <h3 className="font-black text-sm text-rose-700">Reject / Request Revision</h3>
              <button
                type="button"
                onClick={() => setRejectDialog({ isOpen: false, type: "", id: null, targetItem: null, reason: "" })}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Please enter the reason for rejecting this {rejectDialog.type}:
            </p>

            <textarea
              rows="3"
              required
              placeholder="Enter rejection reason or guidance for the employee..."
              value={rejectDialog.reason}
              onChange={(e) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-rose-500"
            ></textarea>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectDialog({ isOpen: false, type: "", id: null, targetItem: null, reason: "" })}
                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (rejectDialog.type === "leave") handleRejectLeave(rejectDialog.id, rejectDialog.reason);
                  else if (rejectDialog.type === "punch") handleRejectPunch(rejectDialog.id, rejectDialog.reason);
                  else if (rejectDialog.type === "doc") handleRejectDoc(rejectDialog.id, rejectDialog.reason);
                }}
                disabled={actionLoading}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentDashboard;
