import React, { useState, useEffect, useMemo } from "react";
import { 
  EyeIcon, 
  XMarkIcon, 
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  SparklesIcon,
  CalendarIcon,
  FolderOpenIcon,
  UserIcon,
  ChevronDoubleRightIcon,
  ClockIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  DocumentArrowUpIcon,
  BriefcaseIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
import { apiFetch } from "../../services/hrApi";

// Recruitment & Onboarding Components
import RecruitmentDashboard from "../TalentLMS/RecruitmentDashboard";
import JobRequisition from "../TalentLMS/JobRequisition";
import JobPosting from "../TalentLMS/JobPosting";
import CandidateDatabase from "../TalentLMS/CandidateDatabase";
import ResumeParsing from "../TalentLMS/ResumeParsing";
import ATSApplicantTracking from "../TalentLMS/ATSApplicantTracking";
import Interview from "../TalentLMS/Interview";
import OfferLetter from "../TalentLMS/OfferLetter";
import Onboarding from "../TalentLMS/Onboarding";
import Joining from "../TalentLMS/Joining";

const DocumentLog = ({ 
  dbData = {}, 
  records = [], 
  user, 
  openCreateTrigger, 
  onOpenEdit, 
  onDelete, 
  onRefreshData, 
  handleAtsMove 
}) => {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [recruitmentSubTab, setRecruitmentSubTab] = useState("Dashboard");
  const [loading, setLoading] = useState(false);

  // Core Data States
  const [stats, setStats] = useState({
    total: 0, draft: 0, pendingApproval: 0, approved: 0, issued: 0,
    expired: 0, archived: 0, pendingEmployeeAction: 0, acknowledged: 0, rejected: 0, expiringSoon: 0
  });
  const [documents, setDocuments] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [candidates, setCandidates] = useState([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Modals Visibility
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  // Edit/Select states
  const [editingItem, setEditingItem] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [generatedPreview, setGeneratedPreview] = useState("");

  // Forms
  const [typeForm, setTypeForm] = useState({
    code: "", name: "", description: "", category: "Other",
    requires_approval: 0, requires_acknowledgement: 0, requires_acceptance: 0,
    requires_signature: 0, has_expiry: 0, default_expiry_days: 0,
    allow_download: 1, allow_employee_reject: 0, template_required: 0, status: "Active"
  });

  const [templateForm, setTemplateForm] = useState({
    template_code: "", template_name: "", document_type_id: "",
    company_id: "All", template_content: "", version: "1.0", status: "Active"
  });

  const [docForm, setDocForm] = useState({
    document_type_id: "", template_id: "", company_id: "", branch_id: "", department_id: "",
    employee_id: "", candidate_id: "", title: "", description: "",
    issue_date: "", effective_date: "", expiry_date: "", remarks: "", creation_method: "template"
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [approvalComments, setApprovalComments] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [convertForm, setConvertForm] = useState({
    employeeName: "", email: "", employeeCode: "", companyId: "", branchId: "", departmentId: "", designationId: ""
  });

  // Fetch initial data
  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [statsRes, docsRes, typesRes, tempsRes, empsRes, candsRes] = await Promise.all([
        apiFetch("/api/documents/stats").catch(() => ({ data: {} })),
        apiFetch("/api/table/documents").catch(() => ({ data: [] })),
        apiFetch("/api/documents/types").catch(() => ({ data: [] })),
        apiFetch("/api/documents/templates").catch(() => ({ data: [] })),
        apiFetch("/api/table/employees").catch(() => ({ data: [] })),
        apiFetch("/api/table/candidate_database").catch(() => ({ data: [] }))
      ]);

      const docsList = Array.isArray(docsRes.data) ? docsRes.data : [];
      const totalDocs = docsList.length;
      const pendingCount = docsList.filter(d => {
        const s = (d.status || '').toLowerCase().trim();
        return s === 'pending approval' || s === 'pending';
      }).length;
      const approvedCount = docsList.filter(d => (d.status || '').toLowerCase().trim() === 'approved').length;
      const draftCount = docsList.filter(d => (d.status || '').toLowerCase().trim() === 'draft').length;
      const issuedCount = docsList.filter(d => (d.status || '').toLowerCase().trim() === 'issued').length;
      const expiringSoonCount = docsList.filter(d => d.expiry_date && new Date(d.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length;

      const backendStats = statsRes.data || {};
      setStats({
        total: Math.max(backendStats.total || 0, totalDocs),
        draft: Math.max(backendStats.draft || 0, draftCount),
        pendingApproval: Math.max(backendStats.pendingApproval || 0, pendingCount),
        approved: Math.max(backendStats.approved || 0, approvedCount),
        issued: Math.max(backendStats.issued || 0, issuedCount),
        expiringSoon: Math.max(backendStats.expiringSoon || 0, expiringSoonCount),
        ...backendStats,
        ...(totalDocs > (backendStats.total || 0) ? {
          total: totalDocs,
          pendingApproval: pendingCount,
          approved: approvedCount,
          draft: draftCount,
          issued: issuedCount
        } : {})
      });

      setDocuments(docsList);
      setDocumentTypes(typesRes.data || []);
      setTemplates(tempsRes.data || []);
      setEmployees(empsRes.data || []);
      setCandidates(candsRes.data || []);
    } catch (err) {
      console.error("Failed to load document manager data:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(true);
    }, 15000);
    const handleFocus = () => loadData(true);
    window.addEventListener("focus", handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [activeTab]);

  // Lookup maps
  const typeMap = useMemo(() => {
    const map = {};
    documentTypes.forEach(t => { map[t.id] = t.name; });
    return map;
  }, [documentTypes]);

  const empMap = useMemo(() => {
    const map = {};
    employees.forEach(e => {
      const name = `${e.firstName || e.employeeName || e.employee_name || ""} ${e.lastName || ""}`.trim() || e.name || "Employee";
      if (e.id) map[e.id] = name;
      if (e.employeeCode) map[e.employeeCode] = name;
      if (e.emp_code) map[e.emp_code] = name;
      if (e.employeeId) map[e.employeeId] = name;
      if (e.email) map[e.email] = name;
    });
    return map;
  }, [employees]);

  const candMap = useMemo(() => {
    const map = {};
    candidates.forEach(c => { map[c.candidateId || c.id] = `${c.firstName || ""} ${c.lastName || ""}`.trim(); });
    return map;
  }, [candidates]);

  // Document Type Action
  const handleSaveType = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await apiFetch(`/api/documents/types/${editingItem.id}`, { method: "PUT", body: JSON.stringify(typeForm) });
      } else {
        await apiFetch("/api/documents/types", { method: "POST", body: JSON.stringify(typeForm) });
      }
      setShowTypeModal(false);
      setEditingItem(null);
      loadData();
    } catch (err) {
      alert("Failed to save Document Type: " + err.message);
    }
  };

  // Template Action
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await apiFetch(`/api/documents/templates/${editingItem.id}`, { method: "PUT", body: JSON.stringify(templateForm) });
      } else {
        await apiFetch("/api/documents/templates", { method: "POST", body: JSON.stringify(templateForm) });
      }
      setShowTemplateModal(false);
      setEditingItem(null);
      loadData();
    } catch (err) {
      alert("Failed to save Template: " + err.message);
    }
  };

  // Generate / Upload Document Action
  const handleSaveDoc = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(docForm).forEach(key => {
        formData.append(key, docForm[key]);
      });
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const data = await apiFetch("/api/documents", {
        method: "POST",
        body: formData
      });

      setShowDocModal(false);
      setSelectedFile(null);
      loadData();
    } catch (err) {
      alert("Failed to save Document: " + err.message);
    }
  };

  // Handle preview generation
  const handlePreviewDoc = async (templateId, empId, candId) => {
    try {
      const res = await apiFetch(`/api/documents/preview-generated?templateId=${templateId}&employeeId=${empId}&candidateId=${candId}`);
      setGeneratedPreview(res.data?.content || "No content generated.");
      setShowPreviewModal(true);
    } catch (err) {
      alert("Preview generation failed: " + err.message);
    }
  };

  const handleCreateDefaultTemplate = async (docTypeId) => {
    try {
      const type = documentTypes.find(t => t.id === docTypeId);
      if (!type) return;

      const payload = {
        template_code: `${type.code || 'DOC'}_DEFAULT_${Date.now().toString().slice(-4)}`,
        template_name: `Default ${type.name} Template`,
        document_type_id: docTypeId,
        company_id: "All",
        template_content: `Dear {{employee_name}},\n\nWe are pleased to issue this document to you.\n\nBest Regards,\nHR Team`,
        version: "1.0",
        status: "Active"
      };

      await apiFetch("/api/documents/templates", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      await loadData();
      alert("Default template created successfully!");
    } catch (err) {
      alert("Failed to create default template: " + err.message);
    }
  };

  // Document workflow actions
  const handleSubmitApproval = async (id) => {
    if (!window.confirm("Submit this document for internal approval?")) return;
    try {
      await apiFetch(`/api/documents/${id}/submit`, { method: "POST" });
      loadData();
    } catch (err) {
      alert("Failed to submit approval: " + err.message);
    }
  };

  const handleApprove = async () => {
    try {
      await apiFetch(`/api/documents/${selectedDoc.id}/approve`, { method: "POST", body: JSON.stringify({ comments: approvalComments }) });
      setShowApprovalModal(false);
      setApprovalComments("");
      loadData();
    } catch (err) {
      alert("Approve failed: " + err.message);
    }
  };

  const handleReject = async () => {
    if (!rejectReason) return alert("Please specify rejection reason.");
    try {
      await apiFetch(`/api/documents/${selectedDoc.id}/reject`, { method: "POST", body: JSON.stringify({ reason: rejectReason }) });
      setShowApprovalModal(false);
      setRejectReason("");
      loadData();
    } catch (err) {
      alert("Reject failed: " + err.message);
    }
  };

  const handleIssue = async (id) => {
    if (!window.confirm("Issue this document? This makes it immediately visible to employee/candidate.")) return;
    try {
      await apiFetch(`/api/documents/${id}/issue`, { method: "POST" });
      loadData();
    } catch (err) {
      alert("Failed to issue document: " + err.message);
    }
  };

  const handleDeleteDoc = async (id) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      await apiFetch(`/api/table/documents/${id}`, { method: "DELETE" });
      loadData();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleConvertCandidate = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/documents/candidates/${selectedDoc.candidate_id}/convert`, {
        method: "POST",
        body: JSON.stringify(convertForm)
      });
      setShowConvertModal(false);
      loadData();
      alert("Candidate successfully converted to Employee and document linked.");
    } catch (err) {
      alert("Conversion failed: " + err.message);
    }
  };

  // Filtered Documents
  const filteredDocs = useMemo(() => {
    return documents.filter(d => {
      const matchSearch = searchQuery === "" || d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.document_number.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "ALL" || d.status === statusFilter;
      const matchType = typeFilter === "ALL" || d.document_type_id === typeFilter;
      return matchSearch && matchStatus && matchType && !d.deleted_at;
    });
  }, [documents, searchQuery, statusFilter, typeFilter]);

  return (
    <div className="space-y-6 font-sans mt-4">
      {/* Tab Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex flex-wrap gap-1">
          {["Dashboard", "Central Documents", "Document Types", "Document Templates", "Recruitment & Onboarding"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition duration-150 flex items-center gap-1.5 ${
                activeTab === tab 
                  ? tab === "Recruitment & Onboarding"
                    ? "bg-indigo-600 text-white shadow-sm border border-indigo-600"
                    : "bg-rose-50 text-rose-700 border border-rose-200" 
                  : tab === "Recruitment & Onboarding"
                    ? "bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent"
              }`}
            >
              {tab === "Recruitment & Onboarding" && <BriefcaseIcon className="w-4 h-4" />}
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(false)}
            disabled={loading}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
            title="Refresh documents and stats"
          >
            <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin text-rose-600" : "text-slate-500"}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12 text-slate-400">
          <ArrowPathIcon className="w-6 h-6 animate-spin mr-2" />
          Loading central document repository...
        </div>
      )}

      {!loading && (
        <>
          {/* DASHBOARD TAB */}
          {activeTab === "Dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Documents</span>
                  <p className="text-xl font-black text-rose-700 mt-1">{stats.total || 0}</p>
                </div>
                <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Draft Status</span>
                  <p className="text-xl font-black text-slate-600 mt-1">{stats.draft || 0}</p>
                </div>
                <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Approval</span>
                  <p className="text-xl font-black text-amber-600 mt-1">{stats.pendingApproval || 0}</p>
                </div>
                <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Approved Docs</span>
                  <p className="text-xl font-black text-emerald-600 mt-1">{stats.approved || 0}</p>
                </div>
                <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Issued & Active</span>
                  <p className="text-xl font-black text-indigo-600 mt-1">{stats.issued || 0}</p>
                </div>
                <div className="bg-white border border-slate-200/85 rounded-2xl p-4 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Expiring 30 Days</span>
                  <p className="text-xl font-black text-red-600 mt-1">{stats.expiringSoon || 0}</p>
                </div>
              </div>

              {/* Quick Launch Banner for Recruitment & Onboarding */}
              <div className="bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-slate-50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                    <BriefcaseIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Recruitment & Onboarding Workspace</h4>
                    <p className="text-xs text-slate-500 font-medium">Access requisitions, job postings, candidate database, ATS pipeline, interviews, offers, and onboarding</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("Recruitment & Onboarding")}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <BriefcaseIcon className="w-4 h-4" />
                  <span>Open Recruitment & Onboarding</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expiring Tracking */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="text-xs font-black text-slate-900 uppercase">Expiring & Renewals Panel</h3>
                    <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-bold">Action Needed</span>
                  </div>
                  {documents.filter(d => d.expiry_date && new Date(d.expiry_date) < new Date(Date.now() + 30*24*60*60*1000)).length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No documents expiring within 30 days.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {documents.filter(d => d.expiry_date).map(d => (
                        <div key={d.id} className="py-3 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-slate-800">{d.title}</p>
                            <span className="text-[10px] text-slate-400">{empMap[d.employee_id] || "Candidate Link"} • Expiry: {d.expiry_date}</span>
                          </div>
                          <button onClick={() => {
                            setDocForm({ ...d, id: null, title: `${d.title} (Renewed)` });
                            setShowDocModal(true);
                          }} className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-[10px]">Renew</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Employee Uploads Panel */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4 font-sans">
                  <div className="flex justify-between items-center border-b pb-2">
                    <div>
                      <h3 className="text-xs font-black text-slate-900 uppercase">Recent Employee Uploads</h3>
                      <span className="text-[10px] text-slate-400">Documents submitted for HR / Department verification</span>
                    </div>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full font-bold">
                      {documents.length} Total
                    </span>
                  </div>
                  {documents.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      <FolderOpenIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold">No employee uploads yet.</p>
                      <p className="text-[10px]">When employees upload Aadhar, PAN, or Resume, they will appear here instantly.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                      {documents.slice(0, 6).map(d => (
                        <div key={d.id} className="py-2.5 flex justify-between items-center text-xs">
                          <div className="space-y-0.5 truncate max-w-[240px]">
                            <p className="font-bold text-slate-800 truncate">{d.title}</p>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {d.employee_name || empMap[d.employee_id] || d.employee_id || "Employee"} • {d.department || "General"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              d.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              d.status === 'Pending Approval' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                              'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                              {d.status}
                            </span>
                            <a
                              href={d.file_url || `/api/documents/employee/documents/${d.id}/preview`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-bold transition"
                            >
                              View
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CENTRAL DOCUMENTS TAB */}
          {activeTab === "Central Documents" && (
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm p-5 space-y-4 font-sans">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase">Document Repository</h3>
                  <p className="text-[11px] text-slate-400 font-medium">All employee submitted and centrally generated documents</p>
                </div>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setDocForm({
                      document_type_id: documentTypes[0]?.id || "", template_id: "", company_id: "All", branch_id: "", department_id: "",
                      employee_id: "", candidate_id: "", title: "", description: "",
                      issue_date: "", effective_date: "", expiry_date: "", remarks: "", creation_method: "template"
                    });
                    setShowDocModal(true);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  + Add Document
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by title, number, employee..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs w-full"
                  />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold">
                  <option value="ALL">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Approved">Approved</option>
                  <option value="Issued">Issued</option>
                  <option value="Revision Required">Revision Required</option>
                </select>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold">
                  <option value="ALL">All Types</option>
                  {documentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-4">Doc Number</th>
                      <th className="p-4">Title</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Assignee</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {filteredDocs.map(d => (
                      <tr key={d.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-bold text-slate-900 font-mono text-[11px]">{d.document_number}</td>
                        <td className="p-4 font-bold">{d.title}</td>
                        <td className="p-4 text-rose-700 font-semibold">{typeMap[d.document_type_id] || d.document_type || d.title?.split(' - ')[0] || "General"}</td>
                        <td className="p-4 font-semibold text-slate-700">{d.department || "General"}</td>
                        <td className="p-4">
                          <span className="font-bold text-slate-800 block">
                            {d.employee_name || empMap[d.employee_id] || d.employee_id || (d.candidate_id ? `${candMap[d.candidate_id]} (Candidate)` : "Unassigned")}
                          </span>
                          {d.employee_id && <span className="text-[10px] text-slate-400 font-mono block">{d.employee_id}</span>}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                            d.status === 'Issued' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            d.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            d.status === 'Pending Approval' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                            d.status === 'Revision Required' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={d.file_url || `/api/documents/employee/documents/${d.id}/preview`}
                              target="_blank"
                              rel="noreferrer"
                              title="Preview Document"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
                            >
                              <EyeIcon className="w-4.5 h-4.5" />
                            </a>

                            <a
                              href={d.file_url || `/api/documents/employee/documents/${d.id}/download`}
                              download
                              target="_blank"
                              rel="noreferrer"
                              title="Download Document"
                              className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition"
                            >
                              <ArrowDownTrayIcon className="w-4.5 h-4.5" />
                            </a>

                            {d.status === "Draft" && (
                              <button
                                onClick={() => handleSubmitApproval(d.id)}
                                className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded font-bold text-[9px]"
                              >
                                Submit Approval
                              </button>
                            )}
                            {d.status === "Pending Approval" && (
                              <button
                                onClick={() => {
                                  setSelectedDoc(d);
                                  setShowApprovalModal(true);
                                }}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold text-[10px] transition"
                              >
                                Review / Action
                              </button>
                            )}
                            {d.status === "Approved" && (
                              <button
                                onClick={() => handleIssue(d.id)}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-[10px] transition"
                              >
                                Issue Document
                              </button>
                            )}

                            {d.candidate_id && d.status === "Issued" && (
                              <button
                                onClick={() => {
                                  setSelectedDoc(d);
                                  setConvertForm({
                                    employeeName: candMap[d.candidate_id] || "",
                                    email: "",
                                    employeeCode: "",
                                    companyId: d.company_id || "",
                                    branch_id: "",
                                    department_id: d.department_id || ""
                                  });
                                  setShowConvertModal(true);
                                }}
                                className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded font-bold text-[9px]"
                              >
                                Onboard Candidate
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteDoc(d.id)}
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

          {/* DOCUMENT TYPES TAB */}
          {activeTab === "Document Types" && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase">Document Types Configurations</h3>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setTypeForm({
                      code: "", name: "", description: "", category: "Other",
                      requires_approval: 0, requires_acknowledgement: 0, requires_acceptance: 0,
                      requires_signature: 0, has_expiry: 0, default_expiry_days: 0,
                      allow_download: 1, allow_employee_reject: 0, template_required: 0, status: "Active"
                    });
                    setShowTypeModal(true);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  + Add Type
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-4">Code</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Requires Approval</th>
                      <th className="p-4">Requires Signature</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {documentTypes.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-bold text-slate-900">{t.code}</td>
                        <td className="p-4 font-bold">{t.name}</td>
                        <td className="p-4 text-rose-700 font-semibold">{t.category}</td>
                        <td className="p-4">{t.requires_approval ? "Yes" : "No"}</td>
                        <td className="p-4">{t.requires_signature ? "Yes" : "No"}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              setEditingItem(t);
                              setTypeForm({ ...t });
                              setShowTypeModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50"
                          >
                            <PencilSquareIcon className="w-4.5 h-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DOCUMENT TEMPLATES TAB */}
          {activeTab === "Document Templates" && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase">Central Reusable Document Templates</h3>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setTemplateForm({
                      template_code: "", template_name: "", document_type_id: documentTypes[0]?.id || "",
                      company_id: "All", template_content: "", version: "1.0", status: "Active"
                    });
                    setShowTemplateModal(true);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  + Add Template
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-4">Code</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Doc Type</th>
                      <th className="p-4">Version</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {templates.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-bold text-slate-900">{t.template_code}</td>
                        <td className="p-4 font-bold">{t.template_name}</td>
                        <td className="p-4 text-rose-700">{typeMap[t.document_type_id]}</td>
                        <td className="p-4 font-mono">{t.version}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                            t.status === "Active" ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                  setEditingItem(t);
                                  setTemplateForm({ ...t });
                                  setShowTemplateModal(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50"
                            >
                              <PencilSquareIcon className="w-4.5 h-4.5" />
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm("Delete this template?")) {
                                  await apiFetch(`/api/documents/templates/${t.id}`, { method: "DELETE" });
                                  loadData();
                                }
                              }}
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

          {/* RECRUITMENT & ONBOARDING TAB */}
          {activeTab === "Recruitment & Onboarding" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Recruitment Sub-Tabs Header */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <BriefcaseIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Recruitment & Onboarding Workspace</h3>
                    <p className="text-[11px] text-slate-400 font-medium">Manage talent acquisition, requisitions, ATS pipelines, and employee onboarding</p>
                  </div>
                </div>

                {/* Sub-tab pills */}
                <div className="flex flex-wrap gap-1 bg-slate-50/80 p-1 rounded-xl border border-slate-200/60 max-w-full overflow-x-auto">
                  {[
                    { id: "Dashboard", label: "Dashboard", icon: "📊" },
                    { id: "Job Requisition", label: "Job Requisition", icon: "📝" },
                    { id: "Job Posting", label: "Job Posting", icon: "📢" },
                    { id: "Candidate Database", label: "Candidates", icon: "👥" },
                    { id: "Resume Parsing", label: "Resume Parsing", icon: "📄" },
                    { id: "ATS", label: "ATS Tracking", icon: "🎯" },
                    { id: "Interview", label: "Interviews", icon: "💼" },
                    { id: "Offer Letter", label: "Offer Letters", icon: "✉️" },
                    { id: "Onboarding", label: "Onboarding", icon: "🚀" },
                    { id: "Joining", label: "Joining", icon: "🤝" }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setRecruitmentSubTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                        recruitmentSubTab === tab.id
                          ? "bg-white text-indigo-600 shadow-xs border border-indigo-100"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Render Selected Component */}
              <div className="mt-4">
                {recruitmentSubTab === "Dashboard" && (
                  <RecruitmentDashboard
                    dbData={dbData}
                    openCreateTrigger={openCreateTrigger}
                    onRefreshData={onRefreshData}
                  />
                )}
                {recruitmentSubTab === "Job Requisition" && (
                  <JobRequisition
                    records={dbData["Job Requisition"] || dbData["job_requisition"] || []}
                    onRefreshData={onRefreshData}
                  />
                )}
                {recruitmentSubTab === "Job Posting" && (
                  <JobPosting
                    records={dbData["Job Posting"] || dbData["job_postings"] || dbData["job_posting"] || []}
                    onRefreshData={onRefreshData}
                  />
                )}
                {recruitmentSubTab === "Candidate Database" && (
                  <CandidateDatabase
                    records={dbData["Candidate Database"] || dbData["candidate_database"] || dbData["Candidates"] || candidates || []}
                    onRefreshData={onRefreshData}
                  />
                )}
                {recruitmentSubTab === "Resume Parsing" && (
                  <ResumeParsing
                    onRefreshData={onRefreshData}
                  />
                )}
                {recruitmentSubTab === "ATS" && (
                  <ATSApplicantTracking
                    records={dbData["ATS (Applicant Tracking)"] || dbData["ats_applicant_tracking"] || []}
                    handleAtsMove={handleAtsMove}
                    hideList={true}
                  />
                )}
                {recruitmentSubTab === "Interview" && (
                  <Interview
                    records={dbData["Interview"] || dbData["interviews"] || dbData["interview"] || dbData["Interviews"] || []}
                    onRefreshData={onRefreshData}
                  />
                )}
                {recruitmentSubTab === "Offer Letter" && (
                  <OfferLetter
                    records={dbData["Offer Letter"] || dbData["offer_letters"] || dbData["offer_letter"] || []}
                    onRefreshData={onRefreshData}
                  />
                )}
                {recruitmentSubTab === "Onboarding" && (
                  <Onboarding
                    records={dbData["Onboarding"] || dbData["onboarding_tasks"] || dbData["onboarding"] || []}
                    onRefreshData={onRefreshData}
                  />
                )}
                {recruitmentSubTab === "Joining" && (
                  <Joining
                    records={dbData["Joining"] || dbData["joining_records"] || dbData["joining"] || []}
                    onRefreshData={onRefreshData}
                  />
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* DOCUMENT TYPE MODAL */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">{editingItem ? "Edit Document Type" : "Create Document Type"}</h3>
              <button onClick={() => setShowTypeModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveType} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Code</label>
                  <input type="text" required value={typeForm.code} onChange={e => setTypeForm({ ...typeForm, code: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Name</label>
                  <input type="text" required value={typeForm.name} onChange={e => setTypeForm({ ...typeForm, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Category</label>
                  <select value={typeForm.category} onChange={e => setTypeForm({ ...typeForm, category: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                    <option value="Offer Letter">Offer Letter</option>
                    <option value="Appointment Letter">Appointment Letter</option>
                    <option value="Contract">Contract</option>
                    <option value="Policy">Policy</option>
                    <option value="Salary Slip">Salary Slip</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Status</label>
                  <select value={typeForm.status} onChange={e => setTypeForm({ ...typeForm, status: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={typeForm.requires_approval === 1} onChange={e => setTypeForm({ ...typeForm, requires_approval: e.target.checked ? 1 : 0 })} id="req_app" />
                  <label htmlFor="req_app" className="font-bold text-slate-600">Requires Approval</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={typeForm.requires_signature === 1} onChange={e => setTypeForm({ ...typeForm, requires_signature: e.target.checked ? 1 : 0 })} id="req_sig" />
                  <label htmlFor="req_sig" className="font-bold text-slate-600">Requires E-Signature</label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <button type="button" onClick={() => setShowTypeModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md">Save Configuration</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT TEMPLATE MODAL */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">{editingItem ? "Edit Document Template" : "Create Document Template"}</h3>
              <button onClick={() => setShowTemplateModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveTemplate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Template Code</label>
                  <input type="text" required value={templateForm.template_code} onChange={e => setTemplateForm({ ...templateForm, template_code: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Template Name</label>
                  <input type="text" required value={templateForm.template_name} onChange={e => setTemplateForm({ ...templateForm, template_name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Document Type</label>
                  <select required value={templateForm.document_type_id} onChange={e => setTemplateForm({ ...templateForm, document_type_id: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                    {documentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Status</label>
                  <select value={templateForm.status} onChange={e => setTemplateForm({ ...templateForm, status: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Template HTML / Content</label>
                <textarea required value={templateForm.template_content} onChange={e => setTemplateForm({ ...templateForm, template_content: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono" rows="8" placeholder="Use tags like {{employee_name}}, {{designation}} etc." />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <button type="button" onClick={() => setShowTemplateModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md">Save Template</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE DOCUMENT MODAL */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Issue / Generate Document</h3>
              <button onClick={() => setShowDocModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveDoc} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Document Type</label>
                  <select required value={docForm.document_type_id} onChange={e => setDocForm({ ...docForm, document_type_id: e.target.value, template_id: "" })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="">Select type...</option>
                    {documentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Title</label>
                  <input type="text" required value={docForm.title} onChange={e => setDocForm({ ...docForm, title: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Select Employee (If Employee)</label>
                  <select value={docForm.employee_id} onChange={e => setDocForm({ ...docForm, employee_id: e.target.value, candidate_id: "" })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="">Choose Employee...</option>
                    {employees.map(e => <option key={e.id} value={e.employeeCode || e.id}>{e.firstName} {e.lastName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Select Candidate (If Offer/Onboarding)</label>
                  <select value={docForm.candidate_id} onChange={e => setDocForm({ ...docForm, candidate_id: e.target.value, employee_id: "" })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="">Choose Candidate...</option>
                    {candidates.map(c => <option key={c.id} value={c.candidateId || c.id}>{c.firstName} {c.lastName}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Creation Method</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5"><input type="radio" checked={docForm.creation_method === "template"} onChange={() => setDocForm({ ...docForm, creation_method: "template" })} /> Template-Based</label>
                  <label className="flex items-center gap-1.5"><input type="radio" checked={docForm.creation_method === "upload"} onChange={() => setDocForm({ ...docForm, creation_method: "upload" })} /> Manual Upload</label>
                </div>
              </div>

              {docForm.creation_method === "template" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block font-bold text-slate-600 mb-1">Choose Template</label>
                    {templates.filter(t => t.document_type_id === docForm.document_type_id).length === 0 ? (
                      <div className="space-y-2">
                        <select disabled className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed">
                          <option value="">No templates available for this type</option>
                        </select>
                        <p className="text-[10px] font-semibold text-rose-600 flex items-center justify-between">
                          <span>⚠️ No templates configured for this Document Type. Please add one under the "Document Templates" tab first, or select "Manual Upload".</span>
                          <button
                            type="button"
                            onClick={() => handleCreateDefaultTemplate(docForm.document_type_id)}
                            className="ml-2 px-2.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[9px] font-black border border-rose-200 transition whitespace-nowrap"
                          >
                            + Quick Add Default Template
                          </button>
                        </p>
                      </div>
                    ) : (
                      <select required={docForm.creation_method === "template"} value={docForm.template_id} onChange={e => setDocForm({ ...docForm, template_id: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                        <option value="">Choose Template...</option>
                        {templates.filter(t => t.document_type_id === docForm.document_type_id).map(t => (
                          <option key={t.id} value={t.id}>{t.template_name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  {docForm.template_id && (
                    <button
                      type="button"
                      onClick={() => handlePreviewDoc(docForm.template_id, docForm.employee_id, docForm.candidate_id)}
                      className="col-span-2 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold"
                    >
                      Preview Generated Placeholders
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Upload File (PDF/Word)</label>
                  <input type="file" required={docForm.creation_method === "upload"} onChange={e => setSelectedFile(e.target.files[0])} className="w-full" />
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Issue Date</label>
                  <input type="date" value={docForm.issue_date} onChange={e => setDocForm({ ...docForm, issue_date: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Effective Date</label>
                  <input type="date" value={docForm.effective_date} onChange={e => setDocForm({ ...docForm, effective_date: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Expiry Date</label>
                  <input type="date" value={docForm.expiry_date} onChange={e => setDocForm({ ...docForm, expiry_date: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <button type="button" onClick={() => setShowDocModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700">Cancel</button>
                <button 
                  type="submit" 
                  disabled={docForm.creation_method === "template" && templates.filter(t => t.document_type_id === docForm.document_type_id).length === 0}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-md transition"
                >
                  Generate Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPROVAL / ACTION MODAL */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Review Document Approval</h3>
              <button onClick={() => setShowApprovalModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="text-xs space-y-3">
              <p className="font-bold">Reviewing document: <span className="text-rose-600">{selectedDoc?.title}</span></p>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Approver Comments</label>
                <textarea value={approvalComments} onChange={e => setApprovalComments(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" rows="2" />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Or Rejection Reason (If Rejecting)</label>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" rows="2" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <button onClick={handleReject} className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl font-bold">Reject</button>
                <button onClick={handleApprove} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md">Approve</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONVERT CANDIDATE MODAL */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Convert Hired Candidate to Employee</h3>
              <button onClick={() => setShowConvertModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleConvertCandidate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Employee Name</label>
                  <input type="text" required value={convertForm.employeeName} onChange={e => setConvertForm({ ...convertForm, employeeName: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Official Email</label>
                  <input type="email" required value={convertForm.email} onChange={e => setConvertForm({ ...convertForm, email: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Employee Code</label>
                  <input type="text" required value={convertForm.employeeCode} onChange={e => setConvertForm({ ...convertForm, employeeCode: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Department</label>
                  <select required value={convertForm.departmentId} onChange={e => setConvertForm({ ...convertForm, departmentId: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="">Select Department...</option>
                    {Object.keys(dbData["departments"] || {}).map(id => <option key={id} value={id}>{dbData["departments"][id]?.deptName || dbData["departments"][id]?.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <button type="button" onClick={() => setShowConvertModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md">Complete Onboarding</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERATED PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Generated Template Preview</h3>
              <button onClick={() => setShowPreviewModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-4 bg-slate-50 border rounded-2xl overflow-y-auto max-h-[50vh] text-xs font-mono whitespace-pre-wrap">
              {generatedPreview}
            </div>
            <div className="flex justify-end pt-2 border-t">
              <button onClick={() => setShowPreviewModal(false)} className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold">Close Preview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentLog;
