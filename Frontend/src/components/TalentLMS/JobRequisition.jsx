import React, { useState } from "react";
import { PlusIcon, TrashIcon, PencilIcon, PaperAirplaneIcon, CheckIcon, XMarkIcon, ShareIcon } from "@heroicons/react/24/outline";
import { apiFetch } from "../../services/hrApi";
import { useAuth } from "../../auth/AuthProvider";

const JobRequisition = ({ records = [], onRefreshData }) => {
  const { user } = useAuth();
  const userRole = String(typeof user?.role === "object" ? user?.role?.name : user?.role || "").toLowerCase().trim();
  const isHR = userRole === "hr" || userRole === "admin" || userRole === "superadmin" || user?.email === "superadmin@nib.com";
  
  const [filterStatus, setFilterStatus] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    reqId: "",
    jobTitle: "",
    department: "IT",
    designation: "",
    vacancies: 1,
    employmentType: "Permanent",
    experienceRequired: "",
    location: "",
    budgetSalary: "",
    skillsRequired: "",
    jobDescription: "",
    responsibilities: "",
    qualifications: "",
    hiringManager: "",
    hiringReason: "",
    priority: "Medium",
    joiningDate: "",
    status: "Draft"
  });

  const handleOpenCreate = () => {
    const nextId = "REQ-" + Math.floor(1000 + Math.random() * 9000);
    setEditingRecord(null);
    setFormData({
      reqId: nextId,
      jobTitle: "",
      department: "IT",
      designation: "",
      vacancies: 1,
      employmentType: "Permanent",
      experienceRequired: "",
      location: "",
      budgetSalary: "",
      skillsRequired: "",
      jobDescription: "",
      responsibilities: "",
      qualifications: "",
      hiringManager: "",
      hiringReason: "",
      priority: "Medium",
      joiningDate: "",
      status: "Draft"
    });
    setShowModal(true);
  };

  const handleOpenEdit = (reqRecord) => {
    setEditingRecord(reqRecord);
    setFormData({
      ...reqRecord,
      vacancies: parseInt(reqRecord.vacancies || reqRecord.numberOfPositions || 1, 10),
      budgetSalary: reqRecord.budgetSalary || reqRecord.salaryRange || ""
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingRecord) {
        // Edit existing Requisition
        await apiFetch(`/api/table/job_requisition/${editingRecord.id}`, {
          method: "PUT",
          body: JSON.stringify({
            ...editingRecord,
            ...formData
          })
        });
      } else {
        // Create new Requisition
        const uuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
        await apiFetch("/api/table/job_requisition", {
          method: "POST",
          body: JSON.stringify({
            id: uuid,
            ...formData,
            status: "Draft",
            createdBy: user?.username || user?.email || "HR Manager",
            createdDate: new Date().toISOString().split("T")[0]
          })
        });
      }
      setShowModal(false);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to save job requisition: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this requisition?")) return;
    try {
      await apiFetch(`/api/table/job_requisition/${id}`, {
        method: "DELETE"
      });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to delete requisition.");
    }
  };

  const handleStatusChange = async (reqRecord, nextStatus) => {
    try {
      await apiFetch(`/api/table/job_requisition/${reqRecord.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...reqRecord,
          status: nextStatus
        })
      });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to transition requisition: " + err.message);
    }
  };

  const handleConvertToJobPosting = async (reqRecord) => {
    try {
      const postingUuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      const postingId = "POST-" + Math.floor(1000 + Math.random() * 9000);
      
      // 1. Create job posting record
      await apiFetch("/api/table/job_postings", {
        method: "POST",
        body: JSON.stringify({
          id: postingUuid,
          jobPostingId: postingId,
          requisitionId: reqRecord.reqId || reqRecord.id,
          title: reqRecord.jobTitle || reqRecord.job_title,
          department: reqRecord.department,
          location: reqRecord.location || "Remote",
          type: reqRecord.employmentType || "Full-Time",
          experience: reqRecord.experienceRequired || "Not Specified",
          salary: reqRecord.budgetSalary || "Competitive",
          skills: reqRecord.skillsRequired || "",
          description: reqRecord.jobDescription || "",
          requirements: reqRecord.responsibilities || "",
          status: "Draft"
        })
      });

      // 2. Update Requisition status to Closed (or mark completed)
      await apiFetch(`/api/table/job_requisition/${reqRecord.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...reqRecord,
          status: "Closed"
        })
      });

      alert("Requisition successfully converted to Job Posting (Draft)!");
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to convert to posting: " + err.message);
    }
  };

  const filteredRecords = records.filter(r => 
    filterStatus === "All" || r.status === filterStatus
  );

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-800">Job Requisitions</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">Draft, submit, and approve hiring headcount requests</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/10 transition cursor-pointer"
        >
          <PlusIcon className="w-4 h-4" />
          <span>New Requisition</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {["All", "Draft", "Submitted", "Approved", "Rejected", "Closed"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition cursor-pointer ${
              filterStatus === status 
                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm" 
                : "bg-white border-slate-150 text-slate-500 hover:bg-slate-50"
            }`}
          >
            {status} ({status === "All" ? records.length : records.filter(r => r.status === status).length})
          </button>
        ))}
      </div>

      {/* Requisitions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredRecords.map((req) => (
          <div key={req.id} className="bg-white border border-slate-150 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              {/* Card Title & Status Badge */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-extrabold text-slate-400 font-mono tracking-wider">{req.reqId}</span>
                  <h4 className="text-sm font-black text-slate-800 mt-0.5">{req.jobTitle}</h4>
                  <p className="text-[10px] font-bold text-slate-400">{req.department} • {req.designation}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wide border ${
                  req.status === "Approved" ? "bg-green-50 text-green-700 border-green-200" :
                  req.status === "Submitted" ? "bg-blue-50 text-blue-700 border-blue-200" :
                  req.status === "Rejected" ? "bg-red-50 text-red-700 border-red-200" :
                  req.status === "Closed" ? "bg-slate-50 text-slate-500 border-slate-200" :
                  "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {req.status || "Draft"}
                </span>
              </div>

              {/* Specs & Highlights */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-50/50">
                <div>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Vacancies</span>
                  <p className="font-extrabold text-slate-700">{req.vacancies} Positions</p>
                </div>
                <div>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Type</span>
                  <p className="font-extrabold text-slate-700">{req.employmentType}</p>
                </div>
                <div>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Hiring Manager</span>
                  <p className="font-extrabold text-slate-700">{req.hiringManager || "Not Specified"}</p>
                </div>
                <div>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Target Joining</span>
                  <p className="font-extrabold text-slate-700">{req.joiningDate || "TBD"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Required Skills</span>
                  <p className="font-bold text-slate-655 truncate">{req.skillsRequired || "--"}</p>
                </div>
              </div>
            </div>

            {/* Requisition Action Panel */}
            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
              {/* Left Transitions */}
              <div className="inline-flex gap-2">
                {req.status === "Draft" && (
                  <button
                    onClick={() => handleStatusChange(req, "Submitted")}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[9px] font-black transition cursor-pointer"
                  >
                    <PaperAirplaneIcon className="w-3 h-3" />
                    <span>Submit</span>
                  </button>
                )}

                {req.status === "Submitted" && isHR && (
                  <>
                    <button
                      onClick={() => handleStatusChange(req, "Approved")}
                      className="inline-flex items-center gap-0.5 px-2.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl text-[9px] font-black transition cursor-pointer"
                    >
                      <CheckIcon className="w-3 h-3" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange(req, "Rejected")}
                      className="inline-flex items-center gap-0.5 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[9px] font-black transition cursor-pointer"
                    >
                      <XMarkIcon className="w-3 h-3" />
                      <span>Reject</span>
                    </button>
                  </>
                )}

                {req.status === "Approved" && (
                  <button
                    onClick={() => handleConvertToJobPosting(req)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl text-[9px] font-black transition cursor-pointer"
                  >
                    <ShareIcon className="w-3 h-3" />
                    <span>Convert to Posting</span>
                  </button>
                )}
              </div>

              {/* Right Edit/Delete */}
              <div className="inline-flex gap-1.5">
                {(req.status === "Draft" || req.status === "Submitted" || isHR) && (
                  <button
                    onClick={() => handleOpenEdit(req)}
                    className="p-1.5 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                    title="Edit Requisition"
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(req.id)}
                  className="p-1.5 rounded-lg border border-slate-100 hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer"
                  title="Delete Requisition"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredRecords.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white border border-dashed rounded-2xl space-y-3">
            <span className="text-4xl block">📋</span>
            <h4 className="font-extrabold text-sm text-slate-600">No Requisitions Found</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">Create a requisition to start hiring headcount requests.</p>
          </div>
        )}
      </div>

      {/* Requisition Create/Edit Drawer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800">
                  {editingRecord ? "Edit Requisition" : "Create Hiring Requisition"}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">Please provide headcount position details</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition text-lg"
              >
                &times;
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Requisition ID</label>
                  <input
                    type="text"
                    required
                    readOnly
                    value={formData.reqId}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-100 font-bold focus:outline-none cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Job Title</label>
                  <input
                    type="text"
                    required
                    value={formData.jobTitle}
                    onChange={e => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. Node.js Developer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Department</label>
                  <select
                    value={formData.department}
                    onChange={e => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="IT">IT & Software Engineering</option>
                    <option value="HR">Human Resources</option>
                    <option value="Sales">Sales & Marketing</option>
                    <option value="Finance">Finance & Accounts</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Designation</label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={e => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. Senior Software Architect"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Vacancies</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.vacancies}
                    onChange={e => setFormData(prev => ({ ...prev, vacancies: parseInt(e.target.value, 10) }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Employment Type</label>
                  <select
                    value={formData.employmentType}
                    onChange={e => setFormData(prev => ({ ...prev, employmentType: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Permanent">Permanent (Full-Time)</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern">Internship</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Experience Required</label>
                  <input
                    type="text"
                    value={formData.experienceRequired}
                    onChange={e => setFormData(prev => ({ ...prev, experienceRequired: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. 3-5 Years"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. Indore, MP"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Budget Salary Range</label>
                  <input
                    type="text"
                    value={formData.budgetSalary}
                    onChange={e => setFormData(prev => ({ ...prev, budgetSalary: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. 8 - 12 LPA"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Expected Joining Date</label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={e => setFormData(prev => ({ ...prev, joiningDate: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Hiring Manager</label>
                  <input
                    type="text"
                    value={formData.hiringManager}
                    onChange={e => setFormData(prev => ({ ...prev, hiringManager: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="Hiring Manager Name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Required Skills</label>
                  <input
                    type="text"
                    value={formData.skillsRequired}
                    onChange={e => setFormData(prev => ({ ...prev, skillsRequired: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. React, Node.js, SQL"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Hiring Reason</label>
                <input
                  type="text"
                  value={formData.hiringReason}
                  onChange={e => setFormData(prev => ({ ...prev, hiringReason: e.target.value }))}
                  className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. Team Expansion / Project Headcount Release"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Job Description</label>
                <textarea
                  value={formData.jobDescription}
                  onChange={e => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
                  rows="3"
                  className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none resize-none"
                  placeholder="Hiring scope of responsibilities..."
                />
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-2 -mx-6 -mb-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 bg-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Saving..." : "Save Requisition"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobRequisition;
