import React, { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../../services/hrApi";
import {
  PresentationChartBarIcon,
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
  AcademicCapIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  ShieldCheckIcon,
  PlusCircleIcon,
  FolderIcon
} from "@heroicons/react/24/outline";

const PerformanceReviews = ({ selectedTab, user, onRefreshData }) => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [goals, setGoals] = useState([]);
  const [appraisals, setAppraisals] = useState([]);
  const [feedback360, setFeedback360] = useState([]);
  const [competencies, setCompetencies] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [developmentPlans, setDevelopmentPlans] = useState([]);
  const [pips, setPips] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [courses, setCourses] = useState([]);

  // Active Tab State inside Dashboard
  const [activeTab, setActiveTab] = useState("Dashboard");

  // Filter States
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [desigFilter, setDesigFilter] = useState("ALL");
  const [managerFilter, setManagerFilter] = useState("ALL");
  const [empFilter, setEmpFilter] = useState("ALL");
  const [cycleFilter, setCycleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Forms Visibility
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showAppraisalModal, setShowAppraisalModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showCompetencyModal, setShowCompetencyModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showDevPlanModal, setShowDevPlanModal] = useState(false);
  const [showPipModal, setShowPipModal] = useState(false);
  const [showRecModal, setShowRecModal] = useState(false);

  // Edit references
  const [editingItem, setEditingItem] = useState(null);

  // Form States
  const [cycleForm, setCycleForm] = useState({
    cycle_code: "",
    cycleName: "",
    performance_type: "Annual",
    company: "All",
    branch: "All",
    department: "All Departments",
    applicable_designations: "All",
    applicable_employees: "All",
    startDate: "",
    endDate: "",
    self_appraisal_start_date: "",
    manager_review_start_date: "",
    ratingScale: "5-Point Scale",
    status: "Draft",
    description: "",
    instructions: "",
    remarks: ""
  });

  const [goalForm, setGoalForm] = useState({
    goal_code: "",
    cycle_id: "",
    employee_id: "",
    goal_category: "SMART",
    goal_name: "",
    description: "",
    target_value: "100",
    current_value: "0",
    weightage: 20,
    due_date: "",
    status: "Draft",
    remarks: ""
  });

  const [appraisalForm, setAppraisalForm] = useState({
    cycle_id: "",
    employee_id: "",
    self_rating: 3.0,
    self_comments: "",
    manager_rating: 3.0,
    manager_comments: "",
    hr_rating: 3.0,
    hr_comments: "",
    final_rating: "Meets Expectations",
    final_score: 3.0,
    strengths: "",
    weaknesses: "",
    improvement_areas: "",
    recommended_training: "",
    employee_signature: "",
    status: "Draft"
  });

  const [competencyForm, setCompetencyForm] = useState({
    cycle_id: "",
    employee_id: "",
    competency_category: "Technical",
    competency_name: "",
    competency_description: "",
    required_level: "Intermediate",
    current_level: "Intermediate",
    target_level: "Advanced",
    rating: 3.0,
    weightage: 10,
    evidence: "",
    development_required: "No",
    training_recommended: "",
    status: "Active",
    remarks: ""
  });

  const [ratingConfigForm, setRatingConfigForm] = useState({
    rating_code: "",
    rating_name: "",
    numeric_score: 3.0,
    min_score: 2.5,
    max_score: 3.5,
    description: "",
    applicable_company: "All",
    status: "Active",
    remarks: ""
  });

  const [devPlanForm, setDevPlanForm] = useState({
    employee_id: "",
    cycle_id: "",
    skill_gap: "",
    current_skill_level: "Beginner",
    required_skill_level: "Intermediate",
    development_objective: "",
    development_action: "",
    recommended_course: "",
    mentor_coach: "",
    start_date: "",
    target_completion_date: "",
    priority: "Medium",
    progress: 0,
    status: "Planned",
    remarks: ""
  });

  const [recForm, setRecForm] = useState({
    employee_id: "",
    cycle_id: "",
    recommendation_type: "Promotion",
    proposed_designation: "",
    proposed_salary: 0,
    details: "",
    status: "Pending",
    remarks: ""
  });

  // Logged In User Lookup
  const loggedInEmp = useMemo(() => {
    if (!employees.length || !user) return null;
    const userEmail = String(user.email || user.username || "").toLowerCase().trim();
    return employees.find(e => 
      (e.email && String(e.email).toLowerCase().trim() === userEmail) ||
      (e.officialEmail && String(e.officialEmail).toLowerCase().trim() === userEmail) ||
      String(e.employeeCode).toLowerCase() === String(user.username).toLowerCase() ||
      String(e.id) === String(user.id)
    );
  }, [employees, user]);

  const empCode = loggedInEmp?.employeeCode || loggedInEmp?.emp_code || loggedInEmp?.id || "";
  const userRole = String(user?.role?.name || user?.role || "").toLowerCase().trim();
  const isAdmin = userRole.includes("admin") || userRole.includes("hr");
  const isManager = userRole.includes("manager") || loggedInEmp?.designation?.toLowerCase().includes("manager");
  const isEmployee = !isAdmin && !isManager;

  // Sync prop changes to active tab
  useEffect(() => {
    if (selectedTab === "Performance Dashboard") setActiveTab("Dashboard");
    else if (selectedTab === "Performance Reviews" || selectedTab === "Appraisals") setActiveTab("Appraisal");
    else if (selectedTab === "KPI & OKR" || selectedTab === "KPI" || selectedTab === "Competency Evaluation") setActiveTab("KPI");
    else if (selectedTab === "Goals") setActiveTab("Goals");
    else if (selectedTab === "Performance Master" || selectedTab === "Performance Cycles") setActiveTab("Performance Master");
    else if (selectedTab === "Promotion") setActiveTab("Promotion");
    else if (selectedTab === "Increment") setActiveTab("Increment");
    else if (selectedTab === "Reports") setActiveTab("Reports");
  }, [selectedTab]);

  // Unified data fetch from performance_appraisals table
  const fetchData = async () => {
    setLoading(true);
    try {
      const [empsRes, dbApprRes, coursesRes] = await Promise.all([
        apiFetch("/api/table/employees").catch(() => ({ data: [] })),
        apiFetch("/api/table/performance_appraisals").catch(() => ({ data: [] })),
        apiFetch("/api/table/courses").catch(() => ({ data: [] }))
      ]);

      const dbEmployees = empsRes?.data || [];
      const dbCourses = coursesRes?.data || [];
      const appraisalsData = dbApprRes?.data || [];

      // Extract and separate from consolidated performance_appraisals table
      const parsedCycles = appraisalsData.filter(x => x.cycle_code && x.cycle_code.trim() !== "");
      const parsedGoals = appraisalsData.filter(x => x.goal_code && x.goal_code.trim() !== "");
      const parsedCompetencies = appraisalsData.filter(x => x.competency_name && x.competency_name.trim() !== "");
      const parsedRatings = appraisalsData.filter(x => x.rating_code && x.rating_code.trim() !== "");
      const parsedDevPlans = appraisalsData.filter(x => x.skill_gap && x.skill_gap.trim() !== "");
      const parsedRecs = appraisalsData.filter(x => x.recommendation_type && x.recommendation_type.trim() !== "");
      
      const parsedAppraisals = appraisalsData.filter(x => 
        !x.cycle_code && 
        !x.goal_code && 
        !x.competency_name && 
        !x.rating_code && 
        !x.skill_gap && 
        !x.recommendation_type
      );

      setEmployees(dbEmployees);
      setCycles(parsedCycles);
      setGoals(parsedGoals);
      setCompetencies(parsedCompetencies);
      setRatings(parsedRatings);
      setDevelopmentPlans(parsedDevPlans);
      setRecommendations(parsedRecs);
      setAppraisals(parsedAppraisals);
      setCourses(dbCourses);

    } catch (err) {
      console.error("Failed to load performance database tables:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Generic Save to performance_appraisals table
  const handleSaveItem = async (tableName, payload, setModalVisible) => {
    try {
      if (!payload.id) {
        payload.id = crypto.randomUUID();
        await apiFetch(`/api/table/performance_appraisals`, {
          method: "POST",
          body: JSON.stringify({ ...payload, created_by: empCode })
        });
      } else {
        await apiFetch(`/api/table/performance_appraisals/${payload.id}`, {
          method: "PUT",
          body: JSON.stringify({ ...payload, updated_by: empCode })
        });
      }
      setModalVisible(false);
      setEditingItem(null);
      fetchData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert(`Failed to save record inside performance_appraisals: ` + err.message);
    }
  };

  // Generic Delete with clean-up of legacy tables
  const handleDeleteItem = async (tableName, id) => {
    if (!window.confirm("Are you sure you want to delete this record? This action will write to audit log.")) return;
    try {
      await apiFetch(`/api/table/performance_appraisals/${id}`, { method: "DELETE" });
      // Legacy clean-up
      await Promise.all([
        apiFetch(`/api/table/performance_masters/${id}`, { method: "DELETE" }).catch(() => {}),
        apiFetch(`/api/table/performance_goals/${id}`, { method: "DELETE" }).catch(() => {}),
        apiFetch(`/api/table/performance_competencies/${id}`, { method: "DELETE" }).catch(() => {}),
        apiFetch(`/api/table/performance_ratings/${id}`, { method: "DELETE" }).catch(() => {}),
        apiFetch(`/api/table/performance_development_plans/${id}`, { method: "DELETE" }).catch(() => {}),
        apiFetch(`/api/table/performance_recommendations/${id}`, { method: "DELETE" }).catch(() => {})
      ]);
      fetchData();
    } catch (err) {
      alert("Failed to delete record: " + err.message);
    }
  };

  // Helper Maps
  const cycleMap = useMemo(() => {
    const map = {};
    cycles.forEach(c => { map[c.id] = c.cycleName; });
    return map;
  }, [cycles]);

  const empMap = useMemo(() => {
    const map = {};
    employees.forEach(e => {
      map[e.employeeCode || e.id] = `${e.firstName || ""} ${e.lastName || ""}`.trim();
    });
    return map;
  }, [employees]);

  // Filtered lists
  const filteredGoals = useMemo(() => {
    return goals.filter(g => {
      const matchSearch = searchQuery === "" || g.goal_name.toLowerCase().includes(searchQuery.toLowerCase());
      if (isEmployee) return g.employee_id === empCode && matchSearch;
      return matchSearch;
    });
  }, [goals, searchQuery, isEmployee, empCode]);

  const filteredAppraisals = useMemo(() => {
    return appraisals.filter(a => {
      if (isEmployee) return a.employee_id === empCode;
      return true;
    });
  }, [appraisals, isEmployee, empCode]);

  const filteredPromotions = useMemo(() => {
    return recommendations.filter(r => r.recommendation_type === "Promotion");
  }, [recommendations]);

  const filteredIncrements = useMemo(() => {
    return recommendations.filter(r => r.recommendation_type === "Increment");
  }, [recommendations]);

  return (
    <div className="space-y-6">
      {/* Dynamic Tab Navigation Bar */}
      <div className="flex flex-wrap gap-1 border-b border-slate-100 pb-2">
        {["Dashboard", "Performance Master", "KPI", "Goals", "Appraisal", "Promotion", "Increment", "Reports"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition duration-150 ${
              activeTab === tab 
                ? "bg-rose-50 text-rose-700 border border-rose-200" 
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12 text-slate-400">
          <ArrowPathIcon className="w-6 h-6 animate-spin mr-2" />
          Loading Performance Data...
        </div>
      )}

      {!loading && (
        <>
          {/* 1. DASHBOARD VIEW */}
          {activeTab === "Dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Cycles</span>
                    <p className="text-2xl font-black text-rose-700 mt-1">{cycles.filter(c => c.status === "Active").length}</p>
                  </div>
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><CalendarIcon className="w-6 h-6" /></div>
                </div>
                <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Reviews</span>
                    <p className="text-2xl font-black text-amber-600 mt-1">{appraisals.filter(a => a.status === "Draft").length}</p>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><ClipboardDocumentCheckIcon className="w-6 h-6" /></div>
                </div>
                <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Completed Appraisals</span>
                    <p className="text-2xl font-black text-emerald-600 mt-1">{appraisals.filter(a => a.status === "Completed").length}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckBadgeIcon className="w-6 h-6" /></div>
                </div>
                <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recommendations</span>
                    <p className="text-2xl font-black text-indigo-600 mt-1">{recommendations.length}</p>
                  </div>
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><ArrowTrendingUpIcon className="w-6 h-6" /></div>
                </div>
              </div>

              {/* Appraisal Cycle Filters */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-900 border-b pb-2">Appraisal Filters</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Company</label>
                    <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
                      <option value="ALL">All Companies</option>
                      <option value="NIB Insurance">NIB Insurance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Department</label>
                    <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
                      <option value="ALL">All Departments</option>
                      <option value="IT">IT</option>
                      <option value="Software Engineering">Software Engineering</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Cycle</label>
                    <select value={cycleFilter} onChange={e => setCycleFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
                      <option value="ALL">All Cycles</option>
                      {cycles.map(c => <option key={c.id} value={c.id}>{c.cycleName}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-900 border-b pb-2">L&D Course Recommendations Link</h3>
                  {developmentPlans.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No skill gaps linked to LMS courses.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {developmentPlans.slice(0, 5).map(d => (
                        <div key={d.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900">{empMap[d.employee_id]}</span>
                            <p className="text-[11px] text-rose-500">Skill Gap: {d.skill_gap}</p>
                          </div>
                          <span className="px-2 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 font-bold text-[10px]">
                            Course: {d.recommended_course || "Corporate Training Course"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-900 border-b pb-2">Pending Self Appraisals</h3>
                  {appraisals.filter(a => a.status === "Draft").length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No pending self-appraisals.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {appraisals.filter(a => a.status === "Draft").slice(0, 5).map(a => (
                        <div key={a.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900">{empMap[a.employee_id]}</span>
                            <p className="text-[10px] text-slate-500">Cycle: {cycleMap[a.cycle_id]}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[9px] font-bold">
                            Self Appraisal Pending
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. PERFORMANCE MASTER VIEW */}
          {activeTab === "Performance Master" && (
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-5 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-xs font-bold text-slate-900 font-black">Appraisal Performance Cycles</h3>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setCycleForm({
                        cycle_code: `CYC-${Math.floor(1000 + Math.random() * 9000)}`,
                        cycleName: "",
                        performance_type: "Annual",
                        company: "All",
                        branch: "All",
                        department: "All Departments",
                        applicable_designations: "All",
                        applicable_employees: "All",
                        startDate: "",
                        endDate: "",
                        self_appraisal_start_date: "",
                        manager_review_start_date: "",
                        ratingScale: "5-Point Scale",
                        status: "Draft",
                        description: "",
                        instructions: "",
                        remarks: ""
                      });
                      setShowCycleModal(true);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                  >
                    + Create Cycle
                  </button>
                )}
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-4">Code</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Duration</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {cycles.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-bold text-slate-900">{c.cycle_code}</td>
                        <td className="p-4 font-bold">{c.cycleName}</td>
                        <td className="p-4 text-rose-700">{c.performance_type}</td>
                        <td className="p-4 font-mono text-slate-500">{c.startDate} to {c.endDate}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                            c.status === "Active" ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingItem(c);
                                setCycleForm({ ...c });
                                setShowCycleModal(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50"
                            >
                              <PencilSquareIcon className="w-4.5 h-4.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem("performance_masters", c.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            >
                              <TrashIcon className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. KPI VIEW */}
          {activeTab === "KPI" && (
            <div className="space-y-6">
              {/* Competency matrix */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="text-xs font-bold text-slate-900 font-black">Competencies Matrix Evaluations</h3>
                  {!isEmployee && (
                    <button
                      onClick={() => {
                        setEditingItem(null);
                        setCompetencyForm({
                          cycle_id: cycles[0]?.id || "",
                          employee_id: "",
                          competency_category: "Technical",
                          competency_name: "",
                          competency_description: "",
                          required_level: "Intermediate",
                          current_level: "Intermediate",
                          target_level: "Advanced",
                          rating: 3.0,
                          weightage: 10,
                          evidence: "",
                          development_required: "No",
                          training_recommended: "",
                          status: "Active",
                          remarks: ""
                        });
                        setShowCompetencyModal(true);
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                    >
                      + Assess Competency
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="p-4">Employee</th>
                        <th className="p-4">Competency Name</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Current / Target</th>
                        <th className="p-4">Assessed Rating</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {competencies.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-4 font-bold text-slate-900">{empMap[c.employee_id]}</td>
                          <td className="p-4 font-bold text-slate-800">{c.competency_name}</td>
                          <td className="p-4 font-semibold text-rose-700">{c.competency_category}</td>
                          <td className="p-4 text-slate-600">{c.current_level} to {c.target_level}</td>
                          <td className="p-4 font-mono font-bold text-indigo-700">{c.rating} / 5.0</td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingItem(c);
                                  setCompetencyForm({ ...c });
                                  setShowCompetencyModal(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50"
                              >
                                <PencilSquareIcon className="w-4.5 h-4.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem("performance_competencies", c.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                              >
                                <TrashIcon className="w-4.5 h-4.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Development Action Plans */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="text-xs font-bold text-slate-900 font-black">Competency Development Action Plans</h3>
                  {!isEmployee && (
                    <button
                      onClick={() => {
                        setEditingItem(null);
                        setDevPlanForm({
                          employee_id: "",
                          cycle_id: cycles[0]?.id || "",
                          skill_gap: "",
                          current_skill_level: "Beginner",
                          required_skill_level: "Intermediate",
                          development_objective: "",
                          development_action: "",
                          recommended_course: courses[0]?.courseName || courses[0]?.title || "",
                          mentor_coach: "",
                          start_date: "",
                          target_completion_date: "",
                          priority: "Medium",
                          progress: 0,
                          status: "Planned",
                          remarks: ""
                        });
                        setShowDevPlanModal(true);
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                    >
                      + Create Development Plan
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="p-4">Employee</th>
                        <th className="p-4">Skill Gap</th>
                        <th className="p-4">Recommended Course</th>
                        <th className="p-4">Mentor</th>
                        <th className="p-4">Progress</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {developmentPlans.map(d => (
                        <tr key={d.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-4 font-bold text-slate-900">{empMap[d.employee_id]}</td>
                          <td className="p-4 text-rose-700 font-bold">{d.skill_gap}</td>
                          <td className="p-4 text-indigo-700 font-medium">{d.recommended_course}</td>
                          <td className="p-4">{d.mentor_coach || "--"}</td>
                          <td className="p-4">
                            <span className="font-bold text-slate-600">{d.progress}%</span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingItem(d);
                                  setDevPlanForm({ ...d });
                                  setShowDevPlanModal(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50"
                              >
                                <PencilSquareIcon className="w-4.5 h-4.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem("performance_development_plans", d.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                              >
                                <TrashIcon className="w-4.5 h-4.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. GOALS VIEW */}
          {activeTab === "Goals" && (
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-5 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-xs font-bold text-slate-900">SMART Goals, KRAs & KPIs Tracker</h3>
                {!isEmployee && (
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setGoalForm({
                        goal_code: `GOL-${Math.floor(1000 + Math.random() * 9000)}`,
                        cycle_id: cycles[0]?.id || "",
                        employee_id: "",
                        goal_category: "SMART",
                        goal_name: "",
                        description: "",
                        target_value: "100",
                        current_value: "0",
                        weightage: 20,
                        due_date: "",
                        status: "Draft",
                        remarks: ""
                      });
                      setShowGoalModal(true);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                  >
                    + Add Goal Target
                  </button>
                )}
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-4">Employee</th>
                      <th className="p-4">Goal Title</th>
                      <th className="p-4">Target / Progress</th>
                      <th className="p-4">Due Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {filteredGoals.map(g => (
                      <tr key={g.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-bold text-slate-900">{empMap[g.employee_id]}</td>
                        <td className="p-4 font-bold text-slate-800">{g.goal_name}</td>
                        <td className="p-4 font-mono font-bold text-emerald-600">{g.current_value}% / {g.target_value}</td>
                        <td className="p-4 font-mono text-slate-500">{g.due_date}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                            g.status === "Completed" ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}>
                            {g.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingItem(g);
                                setGoalForm({ ...g });
                                setShowGoalModal(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50"
                            >
                              <PencilSquareIcon className="w-4.5 h-4.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem("performance_goals", g.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            >
                              <TrashIcon className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. APPRAISAL REVIEW VIEW */}
          {activeTab === "Appraisal" && (
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-5 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-xs font-bold text-slate-900 font-black">Performance Appraisals & Evaluations</h3>
                {!isEmployee && (
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setAppraisalForm({
                        cycle_id: cycles[0]?.id || "",
                        employee_id: "",
                        self_rating: 3.0,
                        self_comments: "",
                        manager_rating: 3.0,
                        manager_comments: "",
                        hr_rating: 3.0,
                        hr_comments: "",
                        final_rating: "Meets Expectations",
                        final_score: 3.0,
                        strengths: "",
                        weaknesses: "",
                        improvement_areas: "",
                        recommended_training: "",
                        employee_signature: "",
                        status: "Draft"
                      });
                      setShowAppraisalModal(true);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                  >
                    + Assign Appraisal Review
                  </button>
                )}
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-4">Employee</th>
                      <th className="p-4">Cycle</th>
                      <th className="p-4">Self Rating</th>
                      <th className="p-4">Manager Rating</th>
                      <th className="p-4">Final Rating</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {filteredAppraisals.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-bold text-slate-900">{empMap[a.employee_id]}</td>
                        <td className="p-4">{cycleMap[a.cycle_id] || "Appraisal Cycle"}</td>
                        <td className="p-4 font-mono font-bold text-slate-600">{a.self_rating || "0"} / 5.0</td>
                        <td className="p-4 font-mono font-bold text-indigo-600">{a.manager_rating || "0"} / 5.0</td>
                        <td className="p-4 font-bold text-rose-700">{a.final_rating || "Meets Expectations"}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                            a.status === "Completed" ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingItem(a);
                                setAppraisalForm({ ...a });
                                setShowAppraisalModal(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50"
                            >
                              <PencilSquareIcon className="w-4.5 h-4.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem("performance_appraisals", a.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            >
                              <TrashIcon className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. PROMOTION VIEW */}
          {activeTab === "Promotion" && (
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-5 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-xs font-bold text-slate-900 font-black">Promotion Recommendations</h3>
                {!isEmployee && (
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setRecForm({
                        employee_id: "",
                        cycle_id: cycles[0]?.id || "",
                        recommendation_type: "Promotion",
                        proposed_designation: "",
                        proposed_salary: 0,
                        details: "",
                        status: "Pending",
                        remarks: ""
                      });
                      setShowRecModal(true);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                  >
                    + Recommend Promotion
                  </button>
                )}
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-4">Employee</th>
                      <th className="p-4">Cycle</th>
                      <th className="p-4">Proposed Designation</th>
                      <th className="p-4">Details / Reason</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {filteredPromotions.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-bold text-slate-900">{empMap[r.employee_id]}</td>
                        <td className="p-4">{cycleMap[r.cycle_id]}</td>
                        <td className="p-4 font-bold text-rose-700">{r.proposed_designation}</td>
                        <td className="p-4 text-slate-500">{r.details || "N/A"}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                            r.status === "Approved" ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingItem(r);
                                setRecForm({ ...r });
                                setShowRecModal(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50"
                            >
                              <PencilSquareIcon className="w-4.5 h-4.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem("performance_recommendations", r.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            >
                              <TrashIcon className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. INCREMENT VIEW */}
          {activeTab === "Increment" && (
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-5 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-xs font-bold text-slate-900 font-black">Salary Increment Recommendations</h3>
                {!isEmployee && (
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setRecForm({
                        employee_id: "",
                        cycle_id: cycles[0]?.id || "",
                        recommendation_type: "Increment",
                        proposed_designation: "",
                        proposed_salary: 0,
                        details: "",
                        status: "Pending",
                        remarks: ""
                      });
                      setShowRecModal(true);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                  >
                    + Recommend Increment
                  </button>
                )}
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-4">Employee</th>
                      <th className="p-4">Cycle</th>
                      <th className="p-4">Proposed Salary</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {filteredIncrements.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-bold text-slate-900">{empMap[r.employee_id]}</td>
                        <td className="p-4">{cycleMap[r.cycle_id]}</td>
                        <td className="p-4 font-mono font-bold text-emerald-600">${Number(r.proposed_salary).toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                            r.status === "Approved" ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingItem(r);
                                setRecForm({ ...r });
                                setShowRecModal(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50"
                            >
                              <PencilSquareIcon className="w-4.5 h-4.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem("performance_recommendations", r.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            >
                              <TrashIcon className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 8. REPORTS VIEW */}
          {activeTab === "Reports" && (
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-5 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-xs font-bold text-slate-900 font-black">Performance Reports & Analytics</h3>
              </div>
              <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                <PresentationChartBarIcon className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="font-bold">Performance Analytics are ready.</p>
                <p className="text-[10px] text-slate-400">Filter datasets and generate export files for appraisals and increments.</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* PERFORMANCE CYCLE MODAL */}
      {showCycleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">{editingItem ? "Edit Review Cycle" : "Create Review Cycle"}</h3>
              <button onClick={() => setShowCycleModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSaveItem("performance_masters", cycleForm, setShowCycleModal); }} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Cycle Code</label>
                  <input type="text" required value={cycleForm.cycle_code} onChange={e => setCycleForm({ ...cycleForm, cycle_code: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Cycle Name</label>
                  <input type="text" required value={cycleForm.cycleName} onChange={e => setCycleForm({ ...cycleForm, cycleName: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Performance Type</label>
                  <select value={cycleForm.performance_type} onChange={e => setCycleForm({ ...cycleForm, performance_type: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half-Yearly">Half-Yearly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Status</label>
                  <select value={cycleForm.status} onChange={e => setCycleForm({ ...cycleForm, status: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Start Date</label>
                  <input type="date" required value={cycleForm.startDate} onChange={e => setCycleForm({ ...cycleForm, startDate: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">End Date</label>
                  <input type="date" required value={cycleForm.endDate} onChange={e => setCycleForm({ ...cycleForm, endDate: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <button type="button" onClick={() => setShowCycleModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md">Save Cycle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GOAL TARGET MODAL */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">{editingItem ? "Edit Goal / KPI Target" : "Add Goal / KPI Target"}</h3>
              <button onClick={() => setShowGoalModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSaveItem("performance_goals", goalForm, setShowGoalModal); }} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Goal Code</label>
                  <input type="text" required value={goalForm.goal_code} onChange={e => setGoalForm({ ...goalForm, goal_code: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Target Employee</label>
                  <select required value={goalForm.employee_id} onChange={e => setGoalForm({ ...goalForm, employee_id: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="">Select Employee...</option>
                    {employees.map(e => <option key={e.id} value={e.employeeCode || e.id}>{e.firstName} {e.lastName}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Performance Cycle</label>
                  <select required value={goalForm.cycle_id} onChange={e => setGoalForm({ ...goalForm, cycle_id: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="">Select Cycle...</option>
                    {cycles.map(c => <option key={c.id} value={c.id}>{c.cycleName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Goal Title</label>
                  <input type="text" required value={goalForm.goal_name} onChange={e => setGoalForm({ ...goalForm, goal_name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Target Value</label>
                  <input type="text" required value={goalForm.target_value} onChange={e => setGoalForm({ ...goalForm, target_value: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Weightage (%)</label>
                  <input type="number" required value={goalForm.weightage} onChange={e => setGoalForm({ ...goalForm, weightage: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Due Date</label>
                  <input type="date" required value={goalForm.due_date} onChange={e => setGoalForm({ ...goalForm, due_date: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <button type="button" onClick={() => setShowGoalModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md">Save Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPETENCY MATRIX MODAL */}
      {showCompetencyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-black">Competency Matrix Assessment</h3>
              <button onClick={() => setShowCompetencyModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSaveItem("performance_competencies", competencyForm, setShowCompetencyModal); }} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Target Employee</label>
                  <select required value={competencyForm.employee_id} onChange={e => setCompetencyForm({ ...competencyForm, employee_id: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="">Select Employee...</option>
                    {employees.map(e => <option key={e.id} value={e.employeeCode || e.id}>{e.firstName} {e.lastName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Performance Cycle</label>
                  <select required value={competencyForm.cycle_id} onChange={e => setCompetencyForm({ ...competencyForm, cycle_id: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="">Select Cycle...</option>
                    {cycles.map(c => <option key={c.id} value={c.id}>{c.cycleName}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Competency Name</label>
                  <input type="text" required value={competencyForm.competency_name} onChange={e => setCompetencyForm({ ...competencyForm, competency_name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Category</label>
                  <select value={competencyForm.competency_category} onChange={e => setCompetencyForm({ ...competencyForm, competency_category: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="Technical">Technical Competency</option>
                    <option value="Behavioural">Behavioural Competency</option>
                    <option value="Core">Core values</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Required Level</label>
                  <input type="text" value={competencyForm.required_level} onChange={e => setCompetencyForm({ ...competencyForm, required_level: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Current Level</label>
                  <input type="text" value={competencyForm.current_level} onChange={e => setCompetencyForm({ ...competencyForm, current_level: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Assessed Rating</label>
                  <input type="number" min="1" max="5" required value={competencyForm.rating} onChange={e => setCompetencyForm({ ...competencyForm, rating: parseFloat(e.target.value) || 3.0 })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <button type="button" onClick={() => setShowCompetencyModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md">Save Competency</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEV PLAN MODAL */}
      {showDevPlanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">LMS Development Action Plan</h3>
              <button onClick={() => setShowDevPlanModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSaveItem("performance_development_plans", devPlanForm, setShowDevPlanModal); }} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Select Employee</label>
                  <select required value={devPlanForm.employee_id} onChange={e => setDevPlanForm({ ...devPlanForm, employee_id: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="">Choose Employee...</option>
                    {employees.map(e => <option key={e.id} value={e.employeeCode || e.id}>{e.firstName} {e.lastName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Performance Cycle</label>
                  <select required value={devPlanForm.cycle_id} onChange={e => setDevPlanForm({ ...devPlanForm, cycle_id: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="">Choose Cycle...</option>
                    {cycles.map(c => <option key={c.id} value={c.id}>{c.cycleName}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Skill Gap Identified</label>
                  <input type="text" required value={devPlanForm.skill_gap} onChange={e => setDevPlanForm({ ...devPlanForm, skill_gap: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Recommended LMS Course</label>
                  <select value={devPlanForm.recommended_course} onChange={e => setDevPlanForm({ ...devPlanForm, recommended_course: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                    <option value="">-- Select Course --</option>
                    {courses.map(c => <option key={c.id} value={c.courseName || c.title}>{c.courseName || c.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <button type="button" onClick={() => setShowDevPlanModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md">Create Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPRAISAL MODAL */}
      {showAppraisalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">{editingItem ? "Perform Appraisal Review" : "Assign Appraisal Review"}</h3>
              <button onClick={() => setShowAppraisalModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSaveItem("performance_appraisals", appraisalForm, setShowAppraisalModal); }} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Target Employee</label>
                  <select required value={appraisalForm.employee_id} onChange={e => setAppraisalForm({ ...appraisalForm, employee_id: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="">Select Employee...</option>
                    {employees.map(e => <option key={e.id} value={e.employeeCode || e.id}>{e.firstName} {e.lastName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Performance Cycle</label>
                  <select required value={appraisalForm.cycle_id} onChange={e => setAppraisalForm({ ...appraisalForm, cycle_id: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="">Select Cycle...</option>
                    {cycles.map(c => <option key={c.id} value={c.id}>{c.cycleName}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Self Rating (1-5)</label>
                  <input type="number" step="0.1" min="1" max="5" value={appraisalForm.self_rating} onChange={e => setAppraisalForm({ ...appraisalForm, self_rating: parseFloat(e.target.value) || 3.0 })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Manager Rating (1-5)</label>
                  <input type="number" step="0.1" min="1" max="5" value={appraisalForm.manager_rating} onChange={e => setAppraisalForm({ ...appraisalForm, manager_rating: parseFloat(e.target.value) || 3.0 })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Self Comments</label>
                <textarea value={appraisalForm.self_comments} onChange={e => setAppraisalForm({ ...appraisalForm, self_comments: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" rows="2" />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Manager Comments</label>
                <textarea value={appraisalForm.manager_comments} onChange={e => setAppraisalForm({ ...appraisalForm, manager_comments: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" rows="2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Final Rating Option</label>
                  <select value={appraisalForm.final_rating} onChange={e => setAppraisalForm({ ...appraisalForm, final_rating: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                    <option value="Meets Expectations">Meets Expectations</option>
                    <option value="Exceeds Expectations">Exceeds Expectations</option>
                    <option value="Outstanding">Outstanding</option>
                    <option value="Needs Improvement">Needs Improvement</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Appraisal Status</label>
                  <select value={appraisalForm.status} onChange={e => setAppraisalForm({ ...appraisalForm, status: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                    <option value="Draft">Draft</option>
                    <option value="Self-Appraisal Completed">Self-Appraisal Completed</option>
                    <option value="Manager Review Completed">Manager Review Completed</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <button type="button" onClick={() => setShowAppraisalModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md">Save Appraisal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECOMMENDATION (PROMOTION/INCREMENT) MODAL */}
      {showRecModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-black">Recommend {recForm.recommendation_type}</h3>
              <button onClick={() => setShowRecModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSaveItem("performance_recommendations", recForm, setShowRecModal); }} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Target Employee</label>
                  <select required value={recForm.employee_id} onChange={e => setRecForm({ ...recForm, employee_id: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="">Select Employee...</option>
                    {employees.map(e => <option key={e.id} value={e.employeeCode || e.id}>{e.firstName} {e.lastName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Performance Cycle</label>
                  <select required value={recForm.cycle_id} onChange={e => setRecForm({ ...recForm, cycle_id: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="">Select Cycle...</option>
                    {cycles.map(c => <option key={c.id} value={c.id}>{c.cycleName}</option>)}
                  </select>
                </div>
              </div>
              {recForm.recommendation_type === "Promotion" ? (
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Proposed Designation</label>
                  <input type="text" required value={recForm.proposed_designation} onChange={e => setRecForm({ ...recForm, proposed_designation: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Proposed Salary</label>
                  <input type="number" required value={recForm.proposed_salary} onChange={e => setRecForm({ ...recForm, proposed_salary: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              )}
              <div>
                <label className="block font-bold text-slate-600 mb-1">Recommendation Details / Reason</label>
                <textarea required value={recForm.details} onChange={e => setRecForm({ ...recForm, details: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" rows="3" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <button type="button" onClick={() => setShowRecModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md">Submit Recommendation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceReviews;
