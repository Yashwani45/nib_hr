import React, { useState } from "react";
import { PlusIcon, TrashIcon, BriefcaseIcon, MapPinIcon, PencilIcon, EyeIcon } from "@heroicons/react/24/outline";
import { apiFetch } from "../../services/hrApi";
import { useAuth } from "../../auth/AuthProvider";

const JobPosting = ({ records = [], onRefreshData }) => {
  const { user } = useAuth();
  const userRole = String(typeof user?.role === "object" ? user?.role?.name : user?.role || "").toLowerCase().trim();
  const isManager = userRole === "manager";
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [previewJob, setPreviewJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const [formData, setFormData] = useState({
    jobPostingId: "",
    requisitionId: "",
    title: "",
    department: "",
    location: "",
    type: "Full-Time",
    experience: "",
    salary: "",
    skills: "",
    description: "",
    requirements: "",
    deadline: "",
    status: "Draft"
  });
  const [loading, setLoading] = useState(false);

  const handleOpenCreate = () => {
    const nextId = "POST-" + Math.floor(1000 + Math.random() * 9000);
    setEditingRecord(null);
    setFormData({
      jobPostingId: nextId,
      requisitionId: "",
      title: "",
      department: "",
      location: "",
      type: "Full-Time",
      experience: "",
      salary: "",
      skills: "",
      description: "",
      requirements: "",
      deadline: "",
      status: "Draft"
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (job) => {
    setEditingRecord(job);
    setFormData({
      ...job,
      salary: job.salary || "",
      skills: job.skills || "",
      requirements: job.requirements || "",
      deadline: job.deadline || ""
    });
    setShowAddModal(true);
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingRecord) {
        // Edit existing posting
        await apiFetch(`/api/table/job_postings/${editingRecord.id}`, {
          method: "PUT",
          body: JSON.stringify({ ...editingRecord, ...formData })
        });
      } else {
        // Create new posting
        const uuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
        await apiFetch("/api/table/job_postings", {
          method: "POST",
          body: JSON.stringify({ id: uuid, ...formData })
        });
      }
      setShowAddModal(false);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to save job posting: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job posting?")) return;
    try {
      await apiFetch(`/api/table/job_postings/${id}`, {
        method: "DELETE"
      });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to delete job posting.");
    }
  };

  const handleToggleStatus = async (job, targetStatus) => {
    try {
      await apiFetch(`/api/table/job_postings/${job.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...job, status: targetStatus })
      });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to update job status.");
    }
  };

  // Filter listings
  const filteredRecords = records.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (job.skills || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === "All" || job.department === filterDept;
    const matchesStatus = filterStatus === "All" || job.status === filterStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const uniqueDepts = ["All", ...new Set(records.map(r => r.department).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-800">Job Postings Directory</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">Manage public and internal job openings</p>
        </div>
        {!isManager && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/10 hover:shadow-lg transition cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Post a Job</span>
          </button>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs">
        <div>
          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Search Opening</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs border rounded-xl p-2 bg-slate-50 font-bold focus:bg-white focus:outline-none"
            placeholder="Search by title or skills..."
          />
        </div>
        <div>
          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Department</label>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="w-full text-xs border rounded-xl p-2 bg-slate-50 font-bold focus:bg-white focus:outline-none cursor-pointer"
          >
            {uniqueDepts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full text-xs border rounded-xl p-2 bg-slate-50 font-bold focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="Closed">Closed</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Job Postings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRecords.map((job) => (
          <div key={job.id} className="bg-white border border-slate-150 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="bg-indigo-50 text-indigo-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                  {job.type || "Full-Time"}
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                  job.status === "Published" ? "bg-green-50 text-green-700 border-green-200" : 
                  job.status === "Draft" ? "bg-amber-50 text-amber-700 border-amber-200" :
                  "bg-red-50 text-red-700 border-red-250"
                } border`}>
                  {job.status || "Draft"}
                </span>
              </div>
              
              <div>
                <span className="text-[9px] font-bold text-slate-450 tracking-wider font-mono">{job.jobPostingId || "POST-TBD"}</span>
                <h4 className="text-sm font-black text-slate-800 line-clamp-1">{job.title}</h4>
                <p className="text-[10px] font-bold text-slate-400">{job.department}</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-50 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <MapPinIcon className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold">{job.location || "Remote"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <BriefcaseIcon className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold">{job.experience || "Not Specified"} exp</span>
              </div>
              {job.skills && (
                <p className="text-[9px] font-black text-indigo-600 tracking-wide truncate">
                  🚀 Skills: {job.skills}
                </p>
              )}
              <p className="text-[11px] text-slate-500 font-medium line-clamp-3 mt-1.5 pt-1.5 border-t border-slate-50/50">
                {job.description || "No job description provided."}
              </p>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-50">
              <div className="inline-flex gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewJob(job)}
                  className="inline-flex items-center gap-0.5 text-[9px] font-black text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                >
                  <EyeIcon className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                {!isManager && (
                  <>
                    {job.status === "Draft" && (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(job, "Published")}
                        className="text-[9px] font-black text-emerald-600 hover:underline cursor-pointer"
                      >
                        Publish
                      </button>
                    )}
                    {job.status === "Published" && (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(job, "Closed")}
                        className="text-[9px] font-black text-red-500 hover:underline cursor-pointer"
                      >
                        Close
                      </button>
                    )}
                  </>
                )}
              </div>

              {!isManager ? (
                <div className="inline-flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(job)}
                    className="p-1.5 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteJob(job.id)}
                    className="p-1.5 rounded-lg border border-slate-100 hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span className="text-[10px] font-black text-slate-400">
                  {job.status || "Active"}
                </span>
              )}
            </div>
          </div>
        ))}

        {filteredRecords.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white border border-dashed rounded-2xl space-y-3">
            <span className="text-4xl block">💼</span>
            <h4 className="font-extrabold text-sm text-slate-600">No Job Openings Found</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">Modify your filters or post a new job.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Job Posting Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-50 border-b flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800">
                  {editingRecord ? "Edit Job Opening" : "Post New Job Opening"}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">Define recruitment listing details</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Job Posting ID</label>
                  <input
                    type="text"
                    required
                    readOnly
                    value={formData.jobPostingId}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-100 font-bold focus:outline-none cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Job Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. Senior Frontend Engineer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Department</label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={e => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. IT Engineering"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Location</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. Noida, India"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Job Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Remote">Remote</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Experience</label>
                  <input
                    type="text"
                    required
                    value={formData.experience}
                    onChange={e => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. 3-5 Years"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Salary Range</label>
                  <input
                    type="text"
                    value={formData.salary}
                    onChange={e => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. 10 - 15 LPA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Skills Required</label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={e => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. React, Node.js"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Application Deadline</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={e => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Job Description</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none resize-none"
                  placeholder="Key responsibilities..."
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Listing Requirements</label>
                <textarea
                  rows={2}
                  value={formData.requirements}
                  onChange={e => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                  className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none resize-none"
                  placeholder="Qualifications / Certifications required..."
                />
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-2 -mx-6 -mb-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 bg-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Saving..." : "Save Posting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Job Modal */}
      {previewJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                  {previewJob.type}
                </span>
                <h3 className="text-base font-black mt-1.5">{previewJob.title}</h3>
                <p className="text-[11px] font-semibold text-indigo-100 mt-0.5">{previewJob.department} • {previewJob.location}</p>
              </div>
              <button
                onClick={() => setPreviewJob(null)}
                className="text-white hover:text-indigo-150 text-2xl font-bold bg-white/10 hover:bg-white/20 h-8 w-8 rounded-full flex items-center justify-center transition"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700 font-sans leading-relaxed">
              <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Experience Needed</span>
                  <span className="font-extrabold text-slate-800">{previewJob.experience}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Compensation</span>
                  <span className="font-extrabold text-slate-800">{previewJob.salary || "Competitive"}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Deadline</span>
                  <span className="font-extrabold text-slate-800">{previewJob.deadline || "TBD"}</span>
                </div>
              </div>

              {previewJob.skills && (
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Mandatory Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {previewJob.skills.split(",").map(s => (
                      <span key={s} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-semibold text-slate-650">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Job Description</span>
                <p className="whitespace-pre-line text-slate-600 font-medium">{previewJob.description}</p>
              </div>

              {previewJob.requirements && (
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Requirements & Qualifications</span>
                  <p className="whitespace-pre-line text-slate-600 font-medium">{previewJob.requirements}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t flex justify-end">
              <button
                onClick={() => setPreviewJob(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPosting;
