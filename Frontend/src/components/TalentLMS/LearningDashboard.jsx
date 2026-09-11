import React, { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../../services/hrApi";
import {
  AcademicCapIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  SparklesIcon,
  XMarkIcon,
  StarIcon,
  UserIcon,
  BookOpenIcon,
  UserGroupIcon,
  CheckBadgeIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentArrowUpIcon,
  ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline";

const LearningDashboard = ({ selectedTab, user, onRefreshData }) => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [dashboards, setDashboards] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lmsProgress, setLmsProgress] = useState([]);
  const [skills, setSkills] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

  // Active sub-tab state inside the dashboard (initialized to selectedTab mapped to local views)
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [selectedReportType, setSelectedReportType] = useState("Training Report");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals visibility
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showLmsModal, setShowLmsModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Edit references
  const [editingItem, setEditingItem] = useState(null);

  // Form States
  const [dashboardForm, setDashboardForm] = useState({
    dashboardName: "",
    description: "",
    status: "Active"
  });

  const [trainingForm, setTrainingForm] = useState({
    trainingCode: "",
    trainingName: "",
    trainingCategory: "Technical",
    trainingType: "Online",
    company: "",
    branch: "",
    department: "",
    trainer: "",
    trainingVenue: "",
    startDate: "",
    endDate: "",
    duration: "",
    trainingCost: "",
    maxParticipants: "",
    trainingObjectives: "",
    status: "Planned",
    remarks: ""
  });

  const [courseForm, setCourseForm] = useState({
    courseId: "",
    courseCode: "",
    courseName: "",
    courseCategory: "Technical",
    courseDescription: "",
    skillLevel: "Beginner",
    courseDuration: "",
    language: "English",
    instructor: "",
    deliveryMode: "Self-Paced",
    courseMaterial: "",
    passingMarks: "60",
    validityPeriod: "",
    certificateAvailable: "Yes",
    courseStatus: "Active",
    remarks: ""
  });

  const [lmsForm, setLmsForm] = useState({
    lmsId: "",
    courseId: "",
    courseName: "",
    employeeId: "",
    employeeName: "",
    company: "",
    department: "",
    learningPath: "",
    enrollmentDate: "",
    courseProgress: "0",
    startDate: "",
    completionDate: "",
    timeSpent: "",
    quizScore: "",
    assignmentScore: "",
    finalScore: "",
    completionStatus: "Enrolled",
    certificateGenerated: "No",
    remarks: ""
  });

  const [certForm, setCertForm] = useState({
    certificationId: "",
    employeeId: "",
    employeeName: "",
    certificationName: "",
    certificationType: "",
    certificationProvider: "",
    certificateNumber: "",
    courseName: "",
    issueDate: "",
    expiryDate: "",
    renewalRequired: "No",
    renewalDate: "",
    certificateFile: "",
    verificationStatus: "Pending",
    verifiedBy: "",
    verifiedDate: "",
    status: "Active",
    remarks: ""
  });

  const [feedbackForm, setFeedbackForm] = useState({
    feedbackId: "",
    trainingId: "",
    courseName: "",
    employeeId: "",
    employeeName: "",
    trainer: "",
    trainingDate: "",
    contentRating: "5",
    trainerRating: "5",
    materialRating: "5",
    overallRating: "5",
    suggestions: "",
    feedbackDate: "",
    feedbackStatus: "Submitted",
    remarks: ""
  });

  // Map selectedTab prop to local active tab state
  useEffect(() => {
    if (selectedTab === "Learning Dashboard") setActiveTab("Dashboard");
    else if (selectedTab === "Training") setActiveTab("Training");
    else if (selectedTab === "LMS Progress") setActiveTab("LMS");
    else if (selectedTab === "Courses") setActiveTab("Courses");
    else if (selectedTab === "Certification") setActiveTab("Certification");
    else if (selectedTab === "Reports" || selectedTab === "Learning Reports") setActiveTab("Reports");
  }, [selectedTab]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [empRes, dbRes, trRes, coRes, lmsRes, skRes, ceRes, fbRes] = await Promise.all([
        apiFetch("/api/table/employees").catch(() => ({ data: [] })),
        apiFetch("/api/table/learning_dashboards").catch(() => ({ data: [] })),
        apiFetch("/api/table/training_records").catch(() => ({ data: [] })),
        apiFetch("/api/table/courses").catch(() => ({ data: [] })),
        apiFetch("/api/table/lms_progress").catch(() => ({ data: [] })),
        apiFetch("/api/table/skill_development").catch(() => ({ data: [] })),
        apiFetch("/api/table/certification_tracking").catch(() => ({ data: [] })),
        apiFetch("/api/table/training_feedback").catch(() => ({ data: [] }))
      ]);

      const lmsData = lmsRes?.data || [];
      const dbTrainings = trRes?.data || [];
      const dbCourses = coRes?.data || [];
      const dbCertifications = ceRes?.data || [];

      // Combine and filter records retrieved from lms_progress
      const combinedTrainings = [
        ...dbTrainings,
        ...lmsData.filter(x => x.trainingCode && x.trainingCode.trim() !== "" && !dbTrainings.some(t => t.id === x.id))
      ];

      const combinedCourses = [
        ...dbCourses,
        ...lmsData.filter(x => x.courseId && (!x.lmsId || x.lmsId.trim() === "") && !dbCourses.some(c => c.id === x.id))
      ];

      const combinedLms = [
        ...lmsData.filter(x => x.lmsId && x.lmsId.trim() !== "")
      ];

      const combinedCerts = [
        ...dbCertifications,
        ...lmsData.filter(x => x.certificationId && x.certificationId.trim() !== "" && !dbCertifications.some(c => c.id === x.id))
      ];

      setEmployees(empRes?.data || []);
      setDashboards(dbRes?.data || []);
      setTrainings(combinedTrainings);
      setCourses(combinedCourses);
      setLmsProgress(combinedLms);
      setSkills(skRes?.data || []);
      setCertifications(combinedCerts);
      setFeedbacks(fbRes?.data || []);
    } catch (e) {
      console.error("Failed to load Learning data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (selectedTab) {
      if (selectedTab === "Learning Dashboard") {
        setActiveTab("Dashboard");
      } else if (selectedTab === "LMS Progress") {
        setActiveTab("LMS");
      } else if (selectedTab === "Learning Reports") {
        setActiveTab("Reports");
      } else if (["Training", "Courses", "Certification"].includes(selectedTab)) {
        setActiveTab(selectedTab);
      }
    }
  }, [selectedTab]);

  // Sync auto-fill fields like Employee Name when employeeId is selected
  useEffect(() => {
    if (lmsForm.employeeId) {
      const emp = employees.find(e => String(e.id) === String(lmsForm.employeeId) || String(e.employeeCode) === String(lmsForm.employeeId));
      if (emp) {
        setLmsForm(prev => ({
          ...prev,
          employeeName: emp.name || `${emp.firstName || ""} ${emp.lastName || ""}`.trim(),
          company: emp.company || "",
          department: emp.department || ""
        }));
      }
    }
  }, [lmsForm.employeeId, employees]);

  useEffect(() => {
    if (certForm.employeeId) {
      const emp = employees.find(e => String(e.id) === String(certForm.employeeId) || String(e.employeeCode) === String(certForm.employeeId));
      if (emp) {
        setCertForm(prev => ({
          ...prev,
          employeeName: emp.name || `${emp.firstName || ""} ${emp.lastName || ""}`.trim()
        }));
      }
    }
  }, [certForm.employeeId, employees]);

  useEffect(() => {
    if (feedbackForm.employeeId) {
      const emp = employees.find(e => String(e.id) === String(feedbackForm.employeeId) || String(e.employeeCode) === String(feedbackForm.employeeId));
      if (emp) {
        setFeedbackForm(prev => ({
          ...prev,
          employeeName: emp.name || `${emp.firstName || ""} ${emp.lastName || ""}`.trim()
        }));
      }
    }
  }, [feedbackForm.employeeId, employees]);

  const handleSubmit = async (tableName, formState, setModalState, formReset) => {
    try {
      setLoading(true);
      const isEdit = !!editingItem;
      const endpoint = isEdit ? `/api/table/${tableName}/${editingItem.id}` : `/api/table/${tableName}`;
      const method = isEdit ? "PUT" : "POST";

      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(formState)
      });

      if (res?.success) {
        setModalState(false);
        setEditingItem(null);
        if (formReset) formReset();
        loadAllData();
        if (onRefreshData) onRefreshData();
      } else {
        alert(res?.error || "An error occurred while saving the record.");
      }
    } catch (e) {
      console.error("Save error:", e);
      alert(e.message || "Failed to save record: Connection refused or server error.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tableName, id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      setLoading(true);
      const res = await apiFetch(`/api/table/${tableName}/${id}`, {
        method: "DELETE"
      });
      if (res?.success) {
        if (tableName === "lms_progress") {
          await Promise.all([
            apiFetch(`/api/table/training_records/${id}`, { method: "DELETE" }).catch(() => {}),
            apiFetch(`/api/table/courses/${id}`, { method: "DELETE" }).catch(() => {}),
            apiFetch(`/api/table/certification_tracking/${id}`, { method: "DELETE" }).catch(() => {})
          ]);
        }
        loadAllData();
        if (onRefreshData) onRefreshData();
      } else {
        alert(res?.error || "Failed to delete record.");
      }
    } catch (e) {
      console.error(e);
      alert("Connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (item, tabType) => {
    setEditingItem(item);
    if (tabType === "Dashboard") {
      setDashboardForm({
        dashboardName: item.dashboardName || "",
        description: item.description || "",
        totalCourses: item.totalCourses || "",
        totalLearners: item.totalLearners || "",
        avgCompletionRate: item.avgCompletionRate || "",
        status: item.status || "Active"
      });
      setShowDashboardModal(true);
    } else if (tabType === "Training") {
      setTrainingForm({
        trainingCode: item.trainingCode || "",
        trainingName: item.trainingName || "",
        trainingCategory: item.trainingCategory || "Technical",
        trainingType: item.trainingType || "Online",
        company: item.company || "",
        branch: item.branch || "",
        department: item.department || "",
        trainer: item.trainer || "",
        trainingVenue: item.trainingVenue || "",
        startDate: item.startDate || "",
        endDate: item.endDate || "",
        duration: item.duration || "",
        trainingCost: item.trainingCost || "",
        maxParticipants: item.maxParticipants || "",
        trainingObjectives: item.trainingObjectives || "",
        status: item.status || "Planned",
        remarks: item.remarks || ""
      });
      setShowTrainingModal(true);
    } else if (tabType === "Courses") {
      setCourseForm({
        courseId: item.courseId || "",
        courseCode: item.courseCode || "",
        courseName: item.courseName || "",
        courseCategory: item.courseCategory || "Technical",
        courseDescription: item.courseDescription || "",
        skillLevel: item.skillLevel || "Beginner",
        courseDuration: item.courseDuration || "",
        language: item.language || "English",
        instructor: item.instructor || "",
        deliveryMode: item.deliveryMode || "Self-Paced",
        courseMaterial: item.courseMaterial || "",
        passingMarks: item.passingMarks || "60",
        validityPeriod: item.validityPeriod || "",
        certificateAvailable: item.certificateAvailable || "Yes",
        courseStatus: item.courseStatus || "Active",
        remarks: item.remarks || ""
      });
      setShowCourseModal(true);
    } else if (tabType === "LMS") {
      setLmsForm({
        lmsId: item.lmsId || "",
        courseId: item.courseId || "",
        courseName: item.courseName || "",
        employeeId: item.employeeId || "",
        employeeName: item.employeeName || "",
        company: item.company || "",
        department: item.department || "",
        learningPath: item.learningPath || "",
        enrollmentDate: item.enrollmentDate || "",
        courseProgress: item.courseProgress || "0",
        startDate: item.startDate || "",
        completionDate: item.completionDate || "",
        timeSpent: item.timeSpent || "",
        quizScore: item.quizScore || "",
        assignmentScore: item.assignmentScore || "",
        finalScore: item.finalScore || "",
        completionStatus: item.completionStatus || "Enrolled",
        certificateGenerated: item.certificateGenerated || "No",
        remarks: item.remarks || ""
      });
      setShowLmsModal(true);
    } else if (tabType === "Certification") {
      setCertForm({
        certificationId: item.certificationId || "",
        employeeId: item.employeeId || "",
        employeeName: item.employeeName || "",
        certificationName: item.certificationName || "",
        certificationType: item.certificationType || "",
        certificationProvider: item.certificationProvider || "",
        certificateNumber: item.certificateNumber || "",
        courseName: item.courseName || "",
        issueDate: item.issueDate || "",
        expiryDate: item.expiryDate || "",
        renewalRequired: item.renewalRequired || "No",
        renewalDate: item.renewalDate || "",
        certificateFile: item.certificateFile || "",
        verificationStatus: item.verificationStatus || "Pending",
        verifiedBy: item.verifiedBy || "",
        verifiedDate: item.verifiedDate || "",
        status: item.status || "Active",
        remarks: item.remarks || ""
      });
      setShowCertModal(true);
    } else if (tabType === "Feedback") {
      setFeedbackForm({
        feedbackId: item.feedbackId || "",
        trainingId: item.trainingId || "",
        courseName: item.courseName || "",
        employeeId: item.employeeId || "",
        employeeName: item.employeeName || "",
        trainer: item.trainer || "",
        trainingDate: item.trainingDate || "",
        contentRating: item.contentRating || "5",
        trainerRating: item.trainerRating || "5",
        materialRating: item.materialRating || "5",
        overallRating: item.overallRating || "5",
        suggestions: item.suggestions || "",
        feedbackDate: item.feedbackDate || "",
        feedbackStatus: item.feedbackStatus || "Submitted",
        remarks: item.remarks || ""
      });
      setShowFeedbackModal(true);
    }
  };

  const handleExport = (tableName, dataList) => {
    if (dataList.length === 0) return alert("No data available to export.");
    const headers = Object.keys(dataList[0]).join(",");
    const rows = dataList.map(row => 
      Object.values(row)
        .map(val => `"${String(val || "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${tableName}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Memoized lists filtered by query
  const filteredTrainings = useMemo(() => {
    return trainings.filter(t => 
      (t.trainingName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.trainingCode || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.trainer || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [trainings, searchQuery]);

  const filteredCourses = useMemo(() => {
    return courses.filter(c => 
      (c.courseName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.courseCode || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.instructor || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [courses, searchQuery]);

  const filteredLms = useMemo(() => {
    return lmsProgress.filter(l => 
      (l.courseName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.employeeName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.completionStatus || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [lmsProgress, searchQuery]);

  const filteredCerts = useMemo(() => {
    return certifications.filter(c => 
      (c.certificationName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.employeeName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.certificateNumber || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [certifications, searchQuery]);

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(f => 
      (f.courseName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.employeeName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.trainer || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [feedbacks, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Horizontal Nav Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {["Dashboard", "Training", "LMS", "Courses", "Certification", "Reports"].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSearchQuery("");
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${
              activeTab === tab
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center items-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-xs text-gray-500 font-medium">Processing databases...</span>
        </div>
      )}

      {/* DASHBOARD VIEW */}
      {activeTab === "Dashboard" && (
        <div className="space-y-6">
          {/* Key Metric Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <AcademicCapIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Trainings</p>
                <h3 className="text-xl font-bold text-gray-800">{trainings.length}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <BookOpenIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active Courses</p>
                <h3 className="text-xl font-bold text-gray-800">{courses.length}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <UserGroupIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Enrolled Learners</p>
                <h3 className="text-xl font-bold text-gray-800">{lmsProgress.length}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <CheckBadgeIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Certifications Verified</p>
                <h3 className="text-xl font-bold text-gray-800">
                  {certifications.filter(c => c.verificationStatus === "Verified").length}
                </h3>
              </div>
            </div>
          </div>

          {/* Quick List / Detail overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <h4 className="text-sm font-bold text-gray-800 flex items-center">
                  <SparklesIcon className="h-4 w-4 mr-1 text-blue-600" />
                  Upcoming Training Sessions
                </h4>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setTrainingForm({
                      trainingCode: `TRN-${Math.floor(1000 + Math.random() * 9000)}`,
                      trainingName: "",
                      trainingCategory: "Technical",
                      trainingType: "Online",
                      company: "",
                      branch: "",
                      department: "",
                      trainer: "",
                      trainingVenue: "",
                      startDate: "",
                      endDate: "",
                      duration: "",
                      trainingCost: "0",
                      maxParticipants: "20",
                      trainingObjectives: "",
                      status: "Planned",
                      remarks: ""
                    });
                    setShowTrainingModal(true);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center"
                >
                  <PlusIcon className="h-3 w-3 mr-0.5" /> Plan Training
                </button>
              </div>
              {trainings.slice(0, 3).length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No training sessions scheduled.</p>
              ) : (
                <div className="space-y-3">
                  {trainings.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <h5 className="text-xs font-bold text-gray-800">{item.trainingName}</h5>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Trainer: {item.trainer} | {item.startDate || item.endDate ? `${item.startDate || ""} to ${item.endDate || ""}` : "Not Scheduled"}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                        item.status === "Planned" ? "bg-blue-50 text-blue-600 border border-blue-200" : "bg-green-50 text-green-600 border border-green-200"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <h4 className="text-sm font-bold text-gray-800 flex items-center">
                  <StarIcon className="h-4 w-4 mr-1 text-amber-500" />
                  Recent Course Enrollments (LMS)
                </h4>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setLmsForm({
                      lmsId: `LMS-${Math.floor(1000 + Math.random() * 9000)}`,
                      courseId: "",
                      courseName: "",
                      employeeId: "",
                      employeeName: "",
                      company: "",
                      department: "",
                      learningPath: "",
                      enrollmentDate: new Date().toISOString().split("T")[0],
                      courseProgress: "0",
                      startDate: "",
                      completionDate: "",
                      timeSpent: "",
                      quizScore: "0",
                      assignmentScore: "0",
                      finalScore: "0",
                      completionStatus: "Enrolled",
                      certificateGenerated: "No",
                      remarks: ""
                    });
                    setShowLmsModal(true);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center"
                >
                  <PlusIcon className="h-3 w-3 mr-0.5" /> Enroll Learner
                </button>
              </div>
              {lmsProgress.slice(0, 3).length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No learners currently enrolled.</p>
              ) : (
                <div className="space-y-3">
                  {lmsProgress.slice(0, 3).map((item) => (
                    <div key={item.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <h5 className="text-xs font-bold text-gray-800">{item.employeeName}</h5>
                          <p className="text-[10px] text-gray-400">Course: {item.courseName}</p>
                        </div>
                        <span className="text-[10px] font-bold text-blue-600">{item.courseProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${item.courseProgress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Learning Dashboard Records */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <h4 className="text-sm font-bold text-gray-800 flex items-center">
                <AcademicCapIcon className="h-4 w-4 mr-1 text-blue-600" />
                Learning Dashboard Configurations
              </h4>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setDashboardForm({
                    dashboardName: "",
                    description: "",
                    totalCourses: "0",
                    totalLearners: "0",
                    avgCompletionRate: "0.0",
                    status: "Active"
                  });
                  setShowDashboardModal(true);
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center"
              >
                <PlusIcon className="h-3 w-3 mr-0.5" /> Create Dashboard Record
              </button>
            </div>
            {dashboards.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No learning dashboard records defined.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-4">Dashboard Name</th>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4 text-center">Total Courses</th>
                      <th className="py-2.5 px-4 text-center">Total Learners</th>
                      <th className="py-2.5 px-4 text-center">Avg Progress</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dashboards.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-bold text-gray-800">{item.dashboardName}</td>
                        <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{item.description || "--"}</td>
                        <td className="py-3 px-4 text-center font-semibold text-gray-700">{item.totalCourses || 0}</td>
                        <td className="py-3 px-4 text-center font-semibold text-gray-700">{item.totalLearners || 0}</td>
                        <td className="py-3 px-4 text-center font-semibold text-blue-600">{item.avgCompletionRate || 0}%</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                            item.status === "Active" ? "bg-green-50 text-green-600 border border-green-200" : "bg-gray-50 text-gray-600 border border-gray-200"
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleEditClick(item, "Dashboard")}
                            className="text-gray-400 hover:text-blue-600 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete("learning_dashboards", item.id)}
                            className="text-gray-400 hover:text-red-600 transition font-semibold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TRAINING VIEW */}
      {activeTab === "Training" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-72">
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search training name, code, trainer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-xs border rounded-xl outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                onClick={() => handleExport("training_records", trainings)}
                className="p-2 border rounded-xl bg-white hover:bg-gray-50 text-gray-600 transition"
                title="Export CSV"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setTrainingForm({
                    trainingCode: `TRN-${Math.floor(1000 + Math.random() * 9000)}`,
                    trainingName: "",
                    trainingCategory: "Technical",
                    trainingType: "Online",
                    company: "",
                    branch: "",
                    department: "",
                    trainer: "",
                    trainingVenue: "",
                    startDate: "",
                    endDate: "",
                    duration: "",
                    trainingCost: "0",
                    maxParticipants: "20",
                    trainingObjectives: "",
                    status: "Planned",
                    remarks: ""
                  });
                  setShowTrainingModal(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center shadow-sm w-full sm:w-auto justify-center"
              >
                <PlusIcon className="h-4 w-4 mr-1" /> Add Training Record
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTrainings.map((item) => (
              <div key={item.id} className="border border-gray-200/80 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <div>
                    <span className="font-bold text-xs text-gray-800">{item.trainingName}</span>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">Code: {item.trainingCode}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    item.status === "Completed" ? "bg-green-50 text-green-700 border-green-200 border" : "bg-amber-50 text-amber-700 border-amber-200 border"
                  }`}>
                    {item.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[11px] pt-1">
                  <div>
                    <span className="text-gray-400 font-semibold text-[8px] uppercase tracking-wider">Category</span>
                    <p className="font-bold text-gray-800 mt-0.5">{item.trainingCategory}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold text-[8px] uppercase tracking-wider">Type</span>
                    <p className="font-bold text-gray-800 mt-0.5">{item.trainingType}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold text-[8px] uppercase tracking-wider">Trainer</span>
                    <p className="font-bold text-gray-800 mt-0.5">{item.trainer || "--"}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold text-[8px] uppercase tracking-wider">Duration</span>
                    <p className="font-bold text-gray-800 mt-0.5">{item.duration || "--"}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold text-[8px] uppercase tracking-wider">Cost</span>
                    <p className="font-bold text-gray-800 mt-0.5">${item.trainingCost || "0.00"}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold text-[8px] uppercase tracking-wider">Schedule</span>
                    <p className="font-semibold text-gray-600 mt-0.5">
                      {item.startDate || item.endDate ? `${item.startDate || ""} to ${item.endDate || ""}` : "Not Scheduled"}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2 border-t">
                  <button
                    onClick={() => handleEditClick(item, "Training")}
                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Record"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete("lms_progress", item.id)}
                    className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete Record"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {filteredTrainings.length === 0 && (
              <p className="text-xs text-gray-400 col-span-2 text-center py-12">No training records found matching search query.</p>
            )}
          </div>
        </div>
      )}

      {/* LMS PROGRESS VIEW */}
      {activeTab === "LMS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-72">
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search student progress, path, status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-xs border rounded-xl outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                onClick={() => handleExport("lms_progress", lmsProgress)}
                className="p-2 border rounded-xl bg-white hover:bg-gray-50 text-gray-600 transition"
                title="Export CSV"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setLmsForm({
                    lmsId: `LMS-${Math.floor(1000 + Math.random() * 9000)}`,
                    courseId: "",
                    courseName: "",
                    employeeId: "",
                    employeeName: "",
                    company: "",
                    department: "",
                    learningPath: "",
                    enrollmentDate: new Date().toISOString().split("T")[0],
                    courseProgress: "0",
                    startDate: "",
                    completionDate: "",
                    timeSpent: "",
                    quizScore: "0",
                    assignmentScore: "0",
                    finalScore: "0",
                    completionStatus: "Enrolled",
                    certificateGenerated: "No",
                    remarks: ""
                  });
                  setShowLmsModal(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center shadow-sm w-full sm:w-auto justify-center"
              >
                <PlusIcon className="h-4 w-4 mr-1" /> Enroll Learner
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLms.map((item) => (
              <div key={item.id} className="border border-gray-200/80 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <div>
                    <span className="font-bold text-xs text-gray-800">{item.employeeName}</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">Course: {item.courseName || "--"}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    item.completionStatus === "Completed" ? "bg-green-50 text-green-700 border-green-200 border" : "bg-blue-50 text-blue-700 border-blue-200 border"
                  }`}>
                    {item.completionStatus}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-gray-500">
                    <span>Progress</span>
                    <span>{item.courseProgress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-150 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.courseProgress || 0}%` }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[11px] pt-1">
                  <div>
                    <span className="text-gray-400 font-semibold text-[8px] uppercase tracking-wider">Quiz Score</span>
                    <p className="font-bold text-gray-800 mt-0.5">{item.quizScore || "0"}%</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold text-[8px] uppercase tracking-wider">Final Score</span>
                    <p className="font-bold text-gray-800 mt-0.5">{item.finalScore || "0"}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold text-[8px] uppercase tracking-wider">Enrollment Date</span>
                    <p className="font-semibold text-gray-600 mt-0.5">{item.enrollmentDate || "--"}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold text-[8px] uppercase tracking-wider">Cert Issued</span>
                    <p className="font-bold text-gray-800 mt-0.5">{item.certificateGenerated}</p>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2 border-t">
                  <button
                    onClick={() => handleEditClick(item, "LMS")}
                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Progress"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete("lms_progress", item.id)}
                    className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete Progress"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {filteredLms.length === 0 && (
              <p className="text-xs text-gray-400 col-span-2 text-center py-12">No enrolled learners found matching search query.</p>
            )}
          </div>
        </div>
      )}

      {/* COURSES VIEW */}
      {activeTab === "Courses" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-72">
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses, instructors, codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-xs border rounded-xl outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                onClick={() => handleExport("courses", courses)}
                className="p-2 border rounded-xl bg-white hover:bg-gray-50 text-gray-600 transition"
                title="Export CSV"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setCourseForm({
                    courseId: `CRS-${Math.floor(100 + Math.random() * 900)}`,
                    courseCode: "",
                    courseName: "",
                    courseCategory: "Technical",
                    courseDescription: "",
                    skillLevel: "Beginner",
                    courseDuration: "",
                    language: "English",
                    instructor: "",
                    deliveryMode: "Self-Paced",
                    courseMaterial: "",
                    passingMarks: "60",
                    validityPeriod: "",
                    certificateAvailable: "Yes",
                    courseStatus: "Active",
                    remarks: ""
                  });
                  setShowCourseModal(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center shadow-sm w-full sm:w-auto justify-center"
              >
                <PlusIcon className="h-4 w-4 mr-1" /> Add Course Record
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCourses.map((item) => (
              <div key={item.id} className="border border-gray-200/80 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <div>
                    <span className="font-bold text-xs text-gray-800">{item.courseName}</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">Code: {item.courseCode} | Level: {item.skillLevel}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    item.courseStatus === "Active" ? "bg-green-50 text-green-700 border-green-200 border" : "bg-gray-50 text-gray-600 border-gray-200 border"
                  }`}>
                    {item.courseStatus}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 line-clamp-2 italic">{item.courseDescription || "No course description provided."}</p>
                <div className="grid grid-cols-2 gap-3 text-[11px] pt-1">
                  <div>
                    <span className="text-gray-400 font-semibold text-[8px] uppercase tracking-wider">Instructor</span>
                    <p className="font-bold text-gray-800 mt-0.5">{item.instructor || "--"}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold text-[8px] uppercase tracking-wider">Duration</span>
                    <p className="font-bold text-gray-800 mt-0.5">{item.courseDuration || "--"}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold text-[8px] uppercase tracking-wider">Delivery Mode</span>
                    <p className="font-semibold text-gray-600 mt-0.5">{item.deliveryMode}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold text-[8px] uppercase tracking-wider">Cert Available</span>
                    <p className="font-bold text-gray-800 mt-0.5">{item.certificateAvailable}</p>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2 border-t">
                  <button
                    onClick={() => handleEditClick(item, "Courses")}
                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Course"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete("lms_progress", item.id)}
                    className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete Course"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {filteredCourses.length === 0 && (
              <p className="text-xs text-gray-400 col-span-2 text-center py-12">No courses found matching search query.</p>
            )}
          </div>
        </div>
      )}

      {/* CERTIFICATION VIEW */}
      {activeTab === "Certification" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-72">
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search certification title, employee, number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-xs border rounded-xl outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                onClick={() => handleExport("certification_tracking", certifications)}
                className="p-2 border rounded-xl bg-white hover:bg-gray-50 text-gray-600 transition"
                title="Export CSV"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setCertForm({
                    certificationId: `CERT-${Math.floor(1000 + Math.random() * 9000)}`,
                    employeeId: "",
                    employeeName: "",
                    certificationName: "",
                    certificationProvider: "",
                    certificateNumber: "",
                    courseName: "",
                    issueDate: "",
                    expiryDate: "",
                    renewalRequired: "No",
                    renewalDate: "",
                    certificateFile: "",
                    verificationStatus: "Pending",
                    status: "Active",
                    remarks: ""
                  });
                  setShowCertModal(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center shadow-sm w-full sm:w-auto justify-center"
              >
                <PlusIcon className="h-4 w-4 mr-1" /> Add Certification Record
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCerts.map((item) => (
              <div key={item.id} className="border border-gray-200/80 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <div>
                    <span className="font-bold text-xs text-gray-800">{item.certificationName}</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">Learner: {item.employeeName}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    item.verificationStatus === "Verified" ? "bg-green-50 text-green-700 border-green-200 border" : "bg-amber-50 text-amber-700 border-amber-200 border"
                  }`}>
                    {item.verificationStatus}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[11px] pt-1">
                  <div>
                    <span className="text-gray-400 font-semibold text-[8px] uppercase tracking-wider">Provider</span>
                    <p className="font-bold text-gray-800 mt-0.5">{item.certificationProvider || "--"}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold text-[8px] uppercase tracking-wider">Cert Number</span>
                    <p className="font-bold text-gray-800 mt-0.5">{item.certificateNumber || "--"}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold text-[8px] uppercase tracking-wider">Issue / Expiry</span>
                    <p className="font-semibold text-gray-600 mt-0.5">{item.issueDate} to {item.expiryDate || "Lifetime"}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold text-[8px] uppercase tracking-wider">Renewal Required</span>
                    <p className="font-bold text-gray-800 mt-0.5">{item.renewalRequired}</p>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2 border-t">
                  <button
                    onClick={() => handleEditClick(item, "Certification")}
                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Cert"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete("lms_progress", item.id)}
                    className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete Cert"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {filteredCerts.length === 0 && (
              <p className="text-xs text-gray-400 col-span-2 text-center py-12">No certifications found matching search query.</p>
            )}
          </div>
        </div>
      )}

      {/* REPORTS / FEEDBACK VIEW */}
      {activeTab === "Reports" && (() => {
        // Dynamic aggregations
        const employeeLearningData = (() => {
          const map = {};
          lmsProgress.forEach(row => {
            const name = row.employeeName || "Unknown Employee";
            if (!map[name]) {
              map[name] = { name, active: 0, completed: 0, sumProgress: 0, countProgress: 0 };
            }
            if (row.completionStatus === "Completed") map[name].completed++;
            else map[name].active++;
            map[name].sumProgress += parseFloat(row.courseProgress || 0);
            map[name].countProgress++;
          });
          return Object.values(map).map(e => ({
            employeeName: e.name,
            activeCourses: e.active,
            completedCourses: e.completed,
            avgProgress: e.countProgress > 0 ? (e.sumProgress / e.countProgress).toFixed(1) : "0.0"
          }));
        })();

        const expiryData = certifications.map(c => {
          const today = new Date();
          const expDate = c.expiryDate ? new Date(c.expiryDate) : null;
          let status = "Lifetime";
          let badgeClass = "bg-green-50 text-green-700 border-green-200 border";
          if (expDate) {
            if (expDate < today) {
              status = "Expired";
              badgeClass = "bg-red-50 text-red-700 border-red-200 border";
            } else {
              const diffTime = Math.abs(expDate - today);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays <= 30) {
                status = `Expiring in ${diffDays}d`;
                badgeClass = "bg-amber-50 text-amber-700 border-amber-200 border";
              } else {
                status = "Active";
              }
            }
          }
          return {
            employeeName: c.employeeName,
            certificationName: c.certificationName,
            expiryDate: c.expiryDate || "Lifetime",
            status,
            badgeClass
          };
        });

        const handleExportReport = () => {
          let reportData = [];
          let headers = "";
          
          if (selectedReportType === "Training Report") {
            reportData = trainings;
            headers = "Training Code,Training Name,Category,Type,Trainer,Start Date,End Date,Duration,Cost,Max Participants,Status";
          } else if (selectedReportType === "LMS Progress Report") {
            reportData = lmsProgress;
            headers = "LMS ID,Employee Name,Course Name,Progress %,Quiz Score,Assignment Score,Final Score,Status,Certificate Issued";
          } else if (selectedReportType === "Course Completion Report") {
            reportData = lmsProgress.filter(l => l.completionStatus === "Completed");
            headers = "Employee Name,Course Name,Completion Date,Final Score,Certificate Issued";
          } else if (selectedReportType === "Certification Report") {
            reportData = certifications;
            headers = "Cert ID,Employee Name,Certification Name,Provider,Certificate Number,Issue Date,Expiry Date,Verification Status";
          } else if (selectedReportType === "Employee Learning Report") {
            reportData = employeeLearningData;
            headers = "Employee Name,Active Courses,Completed Courses,Avg Progress %";
          } else if (selectedReportType === "Expiry Report") {
            reportData = expiryData;
            headers = "Employee Name,Certification Name,Expiry Date,Status";
          } else if (selectedReportType === "Training Cost Report") {
            reportData = trainings;
            headers = "Training Name,Category,Trainer,Duration,Cost,Status";
          } else if (selectedReportType === "Training Feedback") {
            reportData = feedbacks;
            headers = "Employee Name,Course Name,Trainer,Trainer Rating,Content Rating,Overall Rating,Suggestions";
          }

          if (reportData.length === 0) return alert("No report data available to export.");

          const rows = reportData.map(row => {
            if (selectedReportType === "Training Report") {
              return `"${row.trainingCode}","${row.trainingName}","${row.trainingCategory}","${row.trainingType}","${row.trainer}","${row.startDate}","${row.endDate}","${row.duration}","${row.trainingCost}","${row.maxParticipants}","${row.status}"`;
            } else if (selectedReportType === "LMS Progress Report") {
              return `"${row.lmsId}","${row.employeeName}","${row.courseName}","${row.courseProgress}%","${row.quizScore}","${row.assignmentScore}","${row.finalScore}","${row.completionStatus}","${row.certificateGenerated}"`;
            } else if (selectedReportType === "Course Completion Report") {
              return `"${row.employeeName}","${row.courseName}","${row.completionDate}","${row.finalScore}","${row.certificateGenerated}"`;
            } else if (selectedReportType === "Certification Report") {
              return `"${row.id}","${row.employeeName}","${row.certificationName}","${row.certificationProvider}","${row.certificateNumber}","${row.issueDate}","${row.expiryDate}","${row.verificationStatus}"`;
            } else if (selectedReportType === "Employee Learning Report") {
              return `"${row.employeeName}","${row.activeCourses}","${row.completedCourses}","${row.avgProgress}%"`;
            } else if (selectedReportType === "Expiry Report") {
              return `"${row.employeeName}","${row.certificationName}","${row.expiryDate}","${row.status}"`;
            } else if (selectedReportType === "Training Cost Report") {
              return `"${row.trainingName}","${row.trainingCategory}","${row.trainer}","${row.duration}","${row.trainingCost}","${row.status}"`;
            } else if (selectedReportType === "Training Feedback") {
              return `"${row.employeeName}","${row.courseName}","${row.trainer}","${row.trainerRating}","${row.contentRating}","${row.overallRating}","${row.suggestions}"`;
            }
            return "";
          });

          const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
          const encodedUri = encodeURI(csvContent);
          const link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", `${selectedReportType.toLowerCase().replace(/ /g, "_")}_export.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        const totalCost = trainings.reduce((acc, row) => acc + parseFloat(row.trainingCost || 0), 0);

        return (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            {/* Top Selector Grid */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center border-b pb-4 gap-4">
              <div>
                <h4 className="text-sm font-bold text-gray-800">Learning & Development Reports Hub</h4>
                <p className="text-xs text-gray-400 mt-1">Generate, audit, and export structured report sheets.</p>
              </div>
              <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                <button
                  onClick={handleExportReport}
                  className="px-4 py-2 border rounded-xl hover:bg-gray-50 text-xs font-semibold text-gray-600 flex items-center transition"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" /> Export Active Report
                </button>
              </div>
            </div>

            {/* Reports Tab List */}
            <div className="flex flex-wrap gap-1.5 bg-gray-50 p-1.5 rounded-xl border border-gray-200/60">
              {[
                "Training Report",
                "LMS Progress Report",
                "Course Completion Report",
                "Certification Report",
                "Employee Learning Report",
                "Expiry Report",
                "Training Cost Report",
                "Training Feedback"
              ].map(report => (
                <button
                  key={report}
                  onClick={() => setSelectedReportType(report)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    selectedReportType === report
                      ? "bg-white text-blue-600 shadow-sm border border-gray-200/80"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {report}
                </button>
              ))}
            </div>

            {/* Report Content Table */}
            <div className="overflow-x-auto">
              {selectedReportType === "Training Report" && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-4">Code</th>
                      <th className="py-2.5 px-4">Training Name</th>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4">Trainer</th>
                      <th className="py-2.5 px-4">Duration</th>
                      <th className="py-2.5 px-4">Dates</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {trainings.map(row => (
                      <tr key={row.id} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-4 font-mono font-bold text-gray-700">{row.trainingCode}</td>
                        <td className="py-2.5 px-4 font-bold text-gray-800">{row.trainingName}</td>
                        <td className="py-2.5 px-4 text-gray-600 font-semibold">{row.trainingCategory}</td>
                        <td className="py-2.5 px-4 font-semibold text-gray-600">{row.trainingType}</td>
                        <td className="py-2.5 px-4 text-gray-500">{row.trainer || "--"}</td>
                        <td className="py-2.5 px-4 text-gray-500">{row.duration || "--"}</td>
                        <td className="py-2.5 px-4 text-gray-500">{row.startDate} to {row.endDate}</td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-600 border border-blue-100`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {trainings.length === 0 && (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-gray-400 italic">No training reports found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {selectedReportType === "LMS Progress Report" && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-4">LMS ID</th>
                      <th className="py-2.5 px-4">Learner</th>
                      <th className="py-2.5 px-4">Course Name</th>
                      <th className="py-2.5 px-4 text-center">Progress</th>
                      <th className="py-2.5 px-4 text-center">Quiz</th>
                      <th className="py-2.5 px-4 text-center">Assignment</th>
                      <th className="py-2.5 px-4 text-center">Final</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lmsProgress.map(row => (
                      <tr key={row.id} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-4 font-mono font-bold text-gray-700">{row.lmsId}</td>
                        <td className="py-2.5 px-4 font-bold text-gray-800">{row.employeeName}</td>
                        <td className="py-2.5 px-4 text-gray-600 font-semibold">{row.courseName}</td>
                        <td className="py-2.5 px-4 text-center font-bold text-blue-600">{row.courseProgress}%</td>
                        <td className="py-2.5 px-4 text-center text-gray-500">{row.quizScore}%</td>
                        <td className="py-2.5 px-4 text-center text-gray-500">{row.assignmentScore || 0}%</td>
                        <td className="py-2.5 px-4 text-center text-gray-500 font-semibold">{row.finalScore || 0}</td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                            row.completionStatus === "Completed" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"
                          }`}>
                            {row.completionStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {lmsProgress.length === 0 && (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-gray-400 italic">No LMS progress records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {selectedReportType === "Course Completion Report" && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-4">Learner</th>
                      <th className="py-2.5 px-4">Course Name</th>
                      <th className="py-2.5 px-4">Enrollment Date</th>
                      <th className="py-2.5 px-4">Completion Date</th>
                      <th className="py-2.5 px-4 text-center">Final Score</th>
                      <th className="py-2.5 px-4">Cert Issued</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lmsProgress.filter(l => l.completionStatus === "Completed").map(row => (
                      <tr key={row.id} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-4 font-bold text-gray-800">{row.employeeName}</td>
                        <td className="py-2.5 px-4 text-gray-600 font-semibold">{row.courseName}</td>
                        <td className="py-2.5 px-4 text-gray-500">{row.enrollmentDate}</td>
                        <td className="py-2.5 px-4 font-semibold text-green-600">{row.completionDate || "--"}</td>
                        <td className="py-2.5 px-4 text-center font-bold text-gray-700">{row.finalScore}%</td>
                        <td className="py-2.5 px-4 font-semibold text-gray-500">{row.certificateGenerated}</td>
                      </tr>
                    ))}
                    {lmsProgress.filter(l => l.completionStatus === "Completed").length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-gray-400 italic">No completed course records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {selectedReportType === "Certification Report" && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-4">Learner</th>
                      <th className="py-2.5 px-4">Certification Name</th>
                      <th className="py-2.5 px-4">Provider</th>
                      <th className="py-2.5 px-4">Certificate Number</th>
                      <th className="py-2.5 px-4">Issue Date</th>
                      <th className="py-2.5 px-4">Expiry Date</th>
                      <th className="py-2.5 px-4">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {certifications.map(row => (
                      <tr key={row.id} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-4 font-bold text-gray-800">{row.employeeName}</td>
                        <td className="py-2.5 px-4 text-gray-700 font-semibold">{row.certificationName}</td>
                        <td className="py-2.5 px-4 text-gray-600">{row.certificationProvider}</td>
                        <td className="py-2.5 px-4 font-mono text-gray-500">{row.certificateNumber || "--"}</td>
                        <td className="py-2.5 px-4 text-gray-500">{row.issueDate}</td>
                        <td className="py-2.5 px-4 text-gray-500">{row.expiryDate || "Lifetime"}</td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                            row.verificationStatus === "Verified" ? "bg-green-50 text-green-700 border-green-200 border" : "bg-amber-50 text-amber-700 border-amber-200 border"
                          }`}>
                            {row.verificationStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {certifications.length === 0 && (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-gray-400 italic">No certification logs found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {selectedReportType === "Employee Learning Report" && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-4">Learner Name</th>
                      <th className="py-2.5 px-4 text-center">Active Courses</th>
                      <th className="py-2.5 px-4 text-center">Completed Courses</th>
                      <th className="py-2.5 px-4 text-center">Avg Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {employeeLearningData.map(row => (
                      <tr key={row.employeeName} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-4 font-bold text-gray-800">{row.employeeName}</td>
                        <td className="py-2.5 px-4 text-center text-gray-600 font-semibold">{row.activeCourses}</td>
                        <td className="py-2.5 px-4 text-center text-green-600 font-bold">{row.completedCourses}</td>
                        <td className="py-2.5 px-4 text-center font-bold text-blue-600">{row.avgProgress}%</td>
                      </tr>
                    ))}
                    {employeeLearningData.length === 0 && (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-gray-400 italic">No employee workspace records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {selectedReportType === "Expiry Report" && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-4">Learner Name</th>
                      <th className="py-2.5 px-4">Certification</th>
                      <th className="py-2.5 px-4">Expiry Date</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {expiryData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-4 font-bold text-gray-800">{row.employeeName}</td>
                        <td className="py-2.5 px-4 text-gray-700 font-semibold">{row.certificationName}</td>
                        <td className="py-2.5 px-4 text-gray-500 font-semibold">{row.expiryDate}</td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${row.badgeClass}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {expiryData.length === 0 && (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-gray-400 italic">No expiration logs found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {selectedReportType === "Training Cost Report" && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-4">Training Name</th>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4">Trainer</th>
                      <th className="py-2.5 px-4">Duration</th>
                      <th className="py-2.5 px-4 text-right">Cost</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {trainings.map(row => (
                      <tr key={row.id} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-4 font-bold text-gray-800">{row.trainingName}</td>
                        <td className="py-2.5 px-4 text-gray-600 font-semibold">{row.trainingCategory}</td>
                        <td className="py-2.5 px-4 text-gray-500">{row.trainer || "--"}</td>
                        <td className="py-2.5 px-4 text-gray-500">{row.duration || "--"}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-gray-800">${row.trainingCost || "0.00"}</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-600">
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold border-t border-b text-gray-800">
                      <td colSpan="4" className="py-3 px-4">Total Expenditure</td>
                      <td className="py-3 px-4 text-right text-blue-600 text-sm font-extrabold">${totalCost.toFixed(2)}</td>
                      <td></td>
                    </tr>
                    {trainings.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-gray-400 italic">No budget costs logged.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {selectedReportType === "Training Feedback" && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Learner</th>
                      <th className="py-3 px-4">Course / Training ID</th>
                      <th className="py-3 px-4">Trainer</th>
                      <th className="py-3 px-4 text-center">Trainer Rating</th>
                      <th className="py-3 px-4 text-center">Content Rating</th>
                      <th className="py-3 px-4 text-center">Overall Rating</th>
                      <th className="py-3 px-4">Suggestions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {feedbacks.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-bold text-gray-800">{item.employeeName}</td>
                        <td className="py-3 px-4 text-gray-600 font-semibold">{item.courseName || item.trainingId}</td>
                        <td className="py-3 px-4 font-semibold text-gray-600">{item.trainer}</td>
                        <td className="py-3 px-4 text-center font-bold text-gray-800">{item.trainerRating || 0}/5</td>
                        <td className="py-3 px-4 text-center font-bold text-gray-800">{item.contentRating || 0}/5</td>
                        <td className="py-3 px-4 text-center font-bold text-gray-800 text-blue-600">{item.overallRating || 0}/5</td>
                        <td className="py-3 px-4 text-gray-500 max-w-xs truncate italic">"{item.suggestions || "None"}"</td>
                      </tr>
                    ))}
                    {feedbacks.length === 0 && (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-gray-400 italic">No training feedback reports found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );
      })()}

      {/* TRAINING MODAL */}
      {showTrainingModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-gray-800">
                {editingItem ? "Edit Training Record" : "Create New Training Record"}
              </h3>
              <button onClick={() => setShowTrainingModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Training Code *</label>
                <input
                  type="text"
                  value={trainingForm.trainingCode}
                  onChange={(e) => setTrainingForm(prev => ({ ...prev, trainingCode: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Training Name *</label>
                <input
                  type="text"
                  value={trainingForm.trainingName}
                  onChange={(e) => setTrainingForm(prev => ({ ...prev, trainingName: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Category</label>
                <select
                  value={trainingForm.trainingCategory}
                  onChange={(e) => setTrainingForm(prev => ({ ...prev, trainingCategory: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                >
                  <option value="Technical">Technical</option>
                  <option value="Soft Skills">Soft Skills</option>
                  <option value="Compliance">Compliance</option>
                  <option value="Leadership">Leadership</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Type</label>
                <select
                  value={trainingForm.trainingType}
                  onChange={(e) => setTrainingForm(prev => ({ ...prev, trainingType: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                >
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Trainer</label>
                <input
                  type="text"
                  value={trainingForm.trainer}
                  onChange={(e) => setTrainingForm(prev => ({ ...prev, trainer: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Training Venue</label>
                <input
                  type="text"
                  value={trainingForm.trainingVenue}
                  onChange={(e) => setTrainingForm(prev => ({ ...prev, trainingVenue: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Start Date</label>
                <input
                  type="date"
                  value={trainingForm.startDate}
                  onChange={(e) => setTrainingForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">End Date</label>
                <input
                  type="date"
                  value={trainingForm.endDate}
                  onChange={(e) => setTrainingForm(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Duration</label>
                <input
                  type="text"
                  placeholder="e.g. 5 days, 15 hours"
                  value={trainingForm.duration}
                  onChange={(e) => setTrainingForm(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Training Cost</label>
                <input
                  type="number"
                  value={trainingForm.trainingCost}
                  onChange={(e) => setTrainingForm(prev => ({ ...prev, trainingCost: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Max Participants</label>
                <input
                  type="number"
                  value={trainingForm.maxParticipants}
                  onChange={(e) => setTrainingForm(prev => ({ ...prev, maxParticipants: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Status</label>
                <select
                  value={trainingForm.status}
                  onChange={(e) => setTrainingForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                >
                  <option value="Planned">Planned</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Training Objectives</label>
                <textarea
                  value={trainingForm.trainingObjectives}
                  onChange={(e) => setTrainingForm(prev => ({ ...prev, trainingObjectives: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                  rows="2"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Company</label>
                <input
                  type="text"
                  value={trainingForm.company}
                  onChange={(e) => setTrainingForm(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Branch</label>
                <input
                  type="text"
                  value={trainingForm.branch}
                  onChange={(e) => setTrainingForm(prev => ({ ...prev, branch: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Department</label>
                <input
                  type="text"
                  value={trainingForm.department}
                  onChange={(e) => setTrainingForm(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Remarks</label>
                <textarea
                  value={trainingForm.remarks}
                  onChange={(e) => setTrainingForm(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                  rows="2"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                onClick={() => setShowTrainingModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmit("lms_progress", trainingForm, setShowTrainingModal, () => {
                  setTrainingForm({
                    trainingCode: "",
                    trainingName: "",
                    trainingCategory: "Technical",
                    trainingType: "Online",
                    company: "",
                    branch: "",
                    department: "",
                    trainer: "",
                    trainingVenue: "",
                    startDate: "",
                    endDate: "",
                    duration: "",
                    trainingCost: "",
                    maxParticipants: "",
                    trainingObjectives: "",
                    status: "Planned",
                    remarks: ""
                  });
                })}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                Save Training
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LMS PROGRESS MODAL */}
      {showLmsModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-gray-800">
                {editingItem ? "Edit Learner Enrollment" : "Enroll New Learner"}
              </h3>
              <button onClick={() => setShowLmsModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">LMS Enrollment ID *</label>
                <input
                  type="text"
                  value={lmsForm.lmsId}
                  onChange={(e) => setLmsForm(prev => ({ ...prev, lmsId: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Select Employee *</label>
                <select
                  value={lmsForm.employeeId}
                  onChange={(e) => setLmsForm(prev => ({ ...prev, employeeId: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                  required
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id || emp.employeeCode}>
                      {emp.name || `${emp.firstName || ""} ${emp.lastName || ""}`.trim()} ({emp.employeeCode || emp.id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Employee Name</label>
                <input
                  type="text"
                  value={lmsForm.employeeName}
                  readOnly
                  className="w-full p-2.5 border rounded-xl bg-gray-50 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Course Name</label>
                <input
                  type="text"
                  value={lmsForm.courseName}
                  onChange={(e) => setLmsForm(prev => ({ ...prev, courseName: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Enrollment Date</label>
                <input
                  type="date"
                  value={lmsForm.enrollmentDate}
                  onChange={(e) => setLmsForm(prev => ({ ...prev, enrollmentDate: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Course Progress (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={lmsForm.courseProgress}
                  onChange={(e) => setLmsForm(prev => ({ ...prev, courseProgress: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Quiz Score (%)</label>
                <input
                  type="number"
                  value={lmsForm.quizScore}
                  onChange={(e) => setLmsForm(prev => ({ ...prev, quizScore: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Completion Status</label>
                <select
                  value={lmsForm.completionStatus}
                  onChange={(e) => setLmsForm(prev => ({ ...prev, completionStatus: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                >
                  <option value="Enrolled">Enrolled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Course ID</label>
                <input
                  type="text"
                  value={lmsForm.courseId}
                  onChange={(e) => setLmsForm(prev => ({ ...prev, courseId: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Learning Path</label>
                <input
                  type="text"
                  value={lmsForm.learningPath}
                  onChange={(e) => setLmsForm(prev => ({ ...prev, learningPath: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Start Date</label>
                <input
                  type="date"
                  value={lmsForm.startDate}
                  onChange={(e) => setLmsForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Completion Date</label>
                <input
                  type="date"
                  value={lmsForm.completionDate}
                  onChange={(e) => setLmsForm(prev => ({ ...prev, completionDate: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Time Spent</label>
                <input
                  type="text"
                  placeholder="e.g. 10 hours"
                  value={lmsForm.timeSpent}
                  onChange={(e) => setLmsForm(prev => ({ ...prev, timeSpent: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Assignment Score (%)</label>
                <input
                  type="number"
                  value={lmsForm.assignmentScore}
                  onChange={(e) => setLmsForm(prev => ({ ...prev, assignmentScore: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Final Score (%)</label>
                <input
                  type="number"
                  value={lmsForm.finalScore}
                  onChange={(e) => setLmsForm(prev => ({ ...prev, finalScore: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Certificate Generated</label>
                <select
                  value={lmsForm.certificateGenerated}
                  onChange={(e) => setLmsForm(prev => ({ ...prev, certificateGenerated: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Remarks</label>
                <textarea
                  value={lmsForm.remarks}
                  onChange={(e) => setLmsForm(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                  rows="2"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                onClick={() => setShowLmsModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmit("lms_progress", lmsForm, setShowLmsModal, () => {
                  setLmsForm({
                    lmsId: "",
                    courseId: "",
                    courseName: "",
                    employeeId: "",
                    employeeName: "",
                    company: "",
                    department: "",
                    learningPath: "",
                    enrollmentDate: "",
                    courseProgress: "",
                    startDate: "",
                    completionDate: "",
                    timeSpent: "",
                    quizScore: "",
                    assignmentScore: "",
                    finalScore: "",
                    completionStatus: "Enrolled",
                    certificateGenerated: "No",
                    remarks: ""
                  });
                })}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                Save Progress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COURSE MODAL */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-gray-800">
                {editingItem ? "Edit Course Information" : "Create New Course Record"}
              </h3>
              <button onClick={() => setShowCourseModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Course ID *</label>
                <input
                  type="text"
                  value={courseForm.courseId}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, courseId: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Course Code *</label>
                <input
                  type="text"
                  value={courseForm.courseCode}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, courseCode: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Course Name *</label>
                <input
                  type="text"
                  value={courseForm.courseName}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, courseName: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Category</label>
                <select
                  value={courseForm.courseCategory}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, courseCategory: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                >
                  <option value="Technical">Technical</option>
                  <option value="Soft Skills">Soft Skills</option>
                  <option value="Compliance">Compliance</option>
                  <option value="Leadership">Leadership</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Skill Level</label>
                <select
                  value={courseForm.skillLevel}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, skillLevel: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Instructor</label>
                <input
                  type="text"
                  value={courseForm.instructor}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, instructor: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Duration</label>
                <input
                  type="text"
                  placeholder="e.g. 10 hours"
                  value={courseForm.courseDuration}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, courseDuration: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Delivery Mode</label>
                <select
                  value={courseForm.deliveryMode}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, deliveryMode: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                >
                  <option value="Self-Paced">Self-Paced</option>
                  <option value="Instructor-Led">Instructor-Led</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Status</label>
                <select
                  value={courseForm.courseStatus}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, courseStatus: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Course Description</label>
                <textarea
                  value={courseForm.courseDescription}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, courseDescription: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                  rows="2"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Language</label>
                <input
                  type="text"
                  value={courseForm.language}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Course Material</label>
                <input
                  type="text"
                  value={courseForm.courseMaterial}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, courseMaterial: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Passing Marks (%)</label>
                <input
                  type="number"
                  value={courseForm.passingMarks}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, passingMarks: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Validity Period</label>
                <input
                  type="text"
                  placeholder="e.g. 1 year"
                  value={courseForm.validityPeriod}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, validityPeriod: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Certificate Available</label>
                <select
                  value={courseForm.certificateAvailable}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, certificateAvailable: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Remarks</label>
                <textarea
                  value={courseForm.remarks}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                  rows="2"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                onClick={() => setShowCourseModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmit("lms_progress", courseForm, setShowCourseModal, () => {
                  setCourseForm({
                    courseId: "",
                    courseCode: "",
                    courseName: "",
                    courseCategory: "Technical",
                    courseDescription: "",
                    skillLevel: "Beginner",
                    courseDuration: "",
                    language: "English",
                    instructor: "",
                    deliveryMode: "Self-Paced",
                    courseMaterial: "",
                    passingMarks: "60",
                    validityPeriod: "",
                    certificateAvailable: "Yes",
                    courseStatus: "Active",
                    remarks: ""
                  });
                })}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                Save Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CERTIFICATION MODAL */}
      {showCertModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-gray-800">
                {editingItem ? "Edit Certification Track" : "Add Certification Record"}
              </h3>
              <button onClick={() => setShowCertModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Certification ID *</label>
                <input
                  type="text"
                  value={certForm.certificationId}
                  onChange={(e) => setCertForm(prev => ({ ...prev, certificationId: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Employee *</label>
                <select
                  value={certForm.employeeId}
                  onChange={(e) => setCertForm(prev => ({ ...prev, employeeId: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                  required
                >
                  <option value="">-- Select Learner --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name || `${emp.firstName || ""} ${emp.lastName || ""}`.trim()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Certification Name *</label>
                <input
                  type="text"
                  value={certForm.certificationName}
                  onChange={(e) => setCertForm(prev => ({ ...prev, certificationName: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Provider</label>
                <input
                  type="text"
                  value={certForm.certificationProvider}
                  onChange={(e) => setCertForm(prev => ({ ...prev, certificationProvider: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Certificate Number</label>
                <input
                  type="text"
                  value={certForm.certificateNumber}
                  onChange={(e) => setCertForm(prev => ({ ...prev, certificateNumber: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Issue Date</label>
                <input
                  type="date"
                  value={certForm.issueDate}
                  onChange={(e) => setCertForm(prev => ({ ...prev, issueDate: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={certForm.expiryDate}
                  onChange={(e) => setCertForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Verification Status</label>
                <select
                  value={certForm.verificationStatus}
                  onChange={(e) => setCertForm(prev => ({ ...prev, verificationStatus: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Verified">Verified</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Certification Type</label>
                <input
                  type="text"
                  value={certForm.certificationType}
                  onChange={(e) => setCertForm(prev => ({ ...prev, certificationType: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Course Name</label>
                <input
                  type="text"
                  value={certForm.courseName}
                  onChange={(e) => setCertForm(prev => ({ ...prev, courseName: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Renewal Required</label>
                <select
                  value={certForm.renewalRequired}
                  onChange={(e) => setCertForm(prev => ({ ...prev, renewalRequired: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Renewal Date</label>
                <input
                  type="date"
                  value={certForm.renewalDate}
                  onChange={(e) => setCertForm(prev => ({ ...prev, renewalDate: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Certificate File Path / URL</label>
                <input
                  type="text"
                  value={certForm.certificateFile}
                  onChange={(e) => setCertForm(prev => ({ ...prev, certificateFile: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Verified By</label>
                <input
                  type="text"
                  value={certForm.verifiedBy}
                  onChange={(e) => setCertForm(prev => ({ ...prev, verifiedBy: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Verified Date</label>
                <input
                  type="date"
                  value={certForm.verifiedDate}
                  onChange={(e) => setCertForm(prev => ({ ...prev, verifiedDate: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Status</label>
                <select
                  value={certForm.status}
                  onChange={(e) => setCertForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Remarks</label>
                <textarea
                  value={certForm.remarks}
                  onChange={(e) => setCertForm(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                  rows="2"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                onClick={() => setShowCertModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmit("lms_progress", certForm, setShowCertModal, () => {
                  setCertForm({
                    certificationId: "",
                    employeeId: "",
                    employeeName: "",
                    certificationName: "",
                    certificationProvider: "",
                    certificateNumber: "",
                    courseName: "",
                    issueDate: "",
                    expiryDate: "",
                    renewalRequired: "No",
                    renewalDate: "",
                    certificateFile: "",
                    verificationStatus: "Pending",
                    status: "Active",
                    remarks: ""
                  });
                })}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK MODAL */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-gray-800">
                {editingItem ? "Edit Feedback Record" : "Submit Training Feedback"}
              </h3>
              <button onClick={() => setShowFeedbackModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Feedback ID *</label>
                <input
                  type="text"
                  value={feedbackForm.feedbackId}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, feedbackId: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Learner / Employee *</label>
                <select
                  value={feedbackForm.employeeId}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, employeeId: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                  required
                >
                  <option value="">-- Select Learner --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name || `${emp.firstName || ""} ${emp.lastName || ""}`.trim()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Course / Training *</label>
                <input
                  type="text"
                  placeholder="e.g. Node.js Advanced Course"
                  value={feedbackForm.courseName}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, courseName: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Trainer Name</label>
                <input
                  type="text"
                  value={feedbackForm.trainer}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, trainer: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Trainer Rating (1-5)</label>
                <select
                  value={feedbackForm.trainerRating}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, trainerRating: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                >
                  {["1", "2", "3", "4", "5"].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Overall Rating (1-5)</label>
                <select
                  value={feedbackForm.overallRating}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, overallRating: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                >
                  {["1", "2", "3", "4", "5"].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Suggestions & Comments</label>
                <textarea
                  value={feedbackForm.suggestions}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, suggestions: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                  rows="2"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmit("training_feedback", feedbackForm, setShowFeedbackModal, () => {
                  setFeedbackForm({
                    feedbackId: "",
                    trainingId: "",
                    courseName: "",
                    employeeId: "",
                    employeeName: "",
                    trainer: "",
                    trainingDate: "",
                    contentRating: "5",
                    trainerRating: "5",
                    materialRating: "5",
                    overallRating: "5",
                    suggestions: "",
                    feedbackDate: "",
                    feedbackStatus: "Submitted",
                    remarks: ""
                  });
                })}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                Save Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD MODAL */}
      {showDashboardModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-gray-800">
                {editingItem ? "Edit Learning Dashboard Record" : "Create New Learning Dashboard Record"}
              </h3>
              <button onClick={() => setShowDashboardModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Dashboard Name *</label>
                <input
                  type="text"
                  value={dashboardForm.dashboardName}
                  onChange={(e) => setDashboardForm(prev => ({ ...prev, dashboardName: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Description</label>
                <textarea
                  value={dashboardForm.description}
                  onChange={(e) => setDashboardForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                  rows="3"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Total Courses</label>
                  <input
                    type="number"
                    value={dashboardForm.totalCourses}
                    onChange={(e) => setDashboardForm(prev => ({ ...prev, totalCourses: e.target.value }))}
                    className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Total Learners</label>
                  <input
                    type="number"
                    value={dashboardForm.totalLearners}
                    onChange={(e) => setDashboardForm(prev => ({ ...prev, totalLearners: e.target.value }))}
                    className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Avg Progress (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dashboardForm.avgCompletionRate}
                    onChange={(e) => setDashboardForm(prev => ({ ...prev, avgCompletionRate: e.target.value }))}
                    className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Status</label>
                <select
                  value={dashboardForm.status}
                  onChange={(e) => setDashboardForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-2.5 border rounded-xl outline-none focus:border-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                onClick={() => setShowDashboardModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmit("learning_dashboards", dashboardForm, setShowDashboardModal, () => {
                  setDashboardForm({
                    dashboardName: "",
                    description: "",
                    totalCourses: "0",
                    totalLearners: "0",
                    avgCompletionRate: "0",
                    status: "Active"
                  });
                })}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningDashboard;
