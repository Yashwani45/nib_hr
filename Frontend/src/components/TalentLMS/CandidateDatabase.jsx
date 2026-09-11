import React, { useState } from "react";
import { PlusIcon, TrashIcon, PencilIcon, EyeIcon, ArrowRightIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { apiFetch } from "../../services/hrApi";
import { useAuth } from "../../auth/AuthProvider";

const CandidateDatabase = ({ records = [], onRefreshData }) => {
  const { user } = useAuth();
  const userRole = String(typeof user?.role === "object" ? user?.role?.name : user?.role || "").toLowerCase().trim();
  const isHR = userRole === "hr" || userRole === "admin" || userRole === "superadmin" || user?.email === "superadmin@nib.com";

  const [searchTerm, setSearchTerm] = useState("");
  const [filterSource, setFilterSource] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    candidateId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    alternatePhone: "",
    dateOfBirth: "",
    gender: "Male",
    currentLocation: "",
    address: "",
    qualification: "",
    skills: "",
    experience: 0,
    currentCompany: "",
    currentDesignation: "",
    expectedSalary: "",
    noticePeriod: "",
    resume: "",
    source: "LinkedIn",
    status: "Applied"
  });

  const handleOpenCreate = () => {
    const nextId = "CAND-" + Math.floor(1000 + Math.random() * 9000);
    setEditingRecord(null);
    setFormData({
      candidateId: nextId,
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      alternatePhone: "",
      dateOfBirth: "",
      gender: "Male",
      currentLocation: "",
      address: "",
      qualification: "",
      skills: "",
      experience: 0,
      currentCompany: "",
      currentDesignation: "",
      expectedSalary: "",
      noticePeriod: "",
      resume: "",
      source: "LinkedIn",
      status: "Applied"
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (cand) => {
    setEditingRecord(cand);
    setFormData({
      ...cand,
      experience: parseFloat(cand.experience || 0),
      alternatePhone: cand.alternatePhone || "",
      address: cand.address || "",
      currentDesignation: cand.currentDesignation || "",
      noticePeriod: cand.noticePeriod || "",
      resume: cand.resume || "",
      dateOfBirth: cand.dateOfBirth || cand.dob || ""
    });
    setShowAddModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const candidateName = `${formData.firstName} ${formData.lastName}`.trim();
      const payload = {
        ...formData,
        candidateName
      };

      if (editingRecord) {
        // Edit record
        await apiFetch(`/api/table/candidate_database/${editingRecord.id}`, {
          method: "PUT",
          body: JSON.stringify({ ...editingRecord, ...payload })
        });
      } else {
        // Create record
        const uuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
        await apiFetch("/api/table/candidate_database", {
          method: "POST",
          body: JSON.stringify({
            id: uuid,
            ...payload,
            applicationDate: new Date().toISOString().split("T")[0]
          })
        });
      }
      setShowAddModal(false);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to save candidate: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this candidate?")) return;
    try {
      await apiFetch(`/api/table/candidate_database/${id}`, {
        method: "DELETE"
      });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to delete candidate.");
    }
  };

  const handleStatusChange = async (cand, nextStatus) => {
    try {
      const candidateName = cand.candidateName || `${cand.firstName} ${cand.lastName}`.trim();
      await apiFetch(`/api/table/candidate_database/${cand.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...cand, candidateName, status: nextStatus })
      });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to update candidate status: " + err.message);
    }
  };

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, resume: file.name }));
    }
  };

  // Filter logic
  const filteredCandidates = records.filter(cand => {
    const name = cand.candidateName || `${cand.firstName || ""} ${cand.lastName || ""}`.trim() || "";
    const matchesSearch = 
      name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (cand.skills || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = filterSource === "All" || cand.source === filterSource;
    const matchesStatus = filterStatus === "All" || cand.status === filterStatus;
    return matchesSearch && matchesSource && matchesStatus;
  });

  const sourcesList = ["LinkedIn", "Naukri", "Referral", "Company Website", "Campus", "Walk-in", "Other"];
  const statusesList = ["Applied", "Screened", "Interviewing", "Selected", "Offered", "Rejected"];

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-800">Candidate Profiles Database</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">Manage and track candidate profiles and resumes</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/10 transition cursor-pointer"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add Candidate</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs">
        <div>
          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Search Profile</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs border rounded-xl p-2 bg-slate-50 font-bold focus:bg-white focus:outline-none"
            placeholder="Search by name or skills..."
          />
        </div>
        <div>
          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Source Filter</label>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="w-full text-xs border rounded-xl p-2 bg-slate-50 font-bold focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="All">All Sources</option>
            {sourcesList.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Recruitment Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full text-xs border rounded-xl p-2 bg-slate-50 font-bold focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            {statusesList.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Candidates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCandidates.map((cand) => {
          const name = cand.candidateName || `${cand.firstName || ""} ${cand.lastName || ""}`.trim() || "Candidate";
          return (
            <div key={cand.id} className="border border-slate-150 rounded-2xl p-5 bg-white shadow-2xs hover:shadow-xs transition flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 tracking-wider font-mono">{cand.candidateId}</span>
                    <h4 className="text-sm font-black text-slate-800 mt-0.5">{name}</h4>
                    <p className="text-[10px] font-bold text-slate-400">{cand.currentDesignation || "Job Seeker"} • {cand.currentCompany || "N/A"}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                    cand.status === "Selected" || cand.status === "Hired" ? "bg-green-50 text-green-700 border-green-200" :
                    cand.status === "Rejected" ? "bg-red-50 text-red-700 border-red-200" :
                    "bg-indigo-50 text-indigo-700 border-indigo-100"
                  }`}>
                    {cand.status || "Applied"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-50/50">
                  <div>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Email</span>
                    <p className="font-extrabold text-slate-700 truncate">{cand.email}</p>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Phone</span>
                    <p className="font-extrabold text-slate-700">{cand.phone}</p>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Experience</span>
                    <p className="font-extrabold text-slate-700">{cand.experience || 0} Years</p>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Source</span>
                    <p className="font-extrabold text-slate-700">{cand.source || "LinkedIn"}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Skills</span>
                    <p className="font-bold text-slate-655 truncate">{cand.skills || "Not Specified"}</p>
                  </div>
                </div>
              </div>

              {/* Action Toggles */}
              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="inline-flex gap-2">
                  <button
                    onClick={() => setViewingProfile(cand)}
                    className="inline-flex items-center gap-0.5 text-[9px] font-black text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                  >
                    <EyeIcon className="w-3.5 h-3.5" />
                    <span>View Profile</span>
                  </button>
                  {cand.status !== "Selected" && cand.status !== "Rejected" && (
                    <>
                      <button
                        onClick={() => handleStatusChange(cand, "Selected")}
                        className="text-[9px] font-black text-green-600 hover:underline cursor-pointer"
                      >
                        Shortlist
                      </button>
                      <button
                        onClick={() => handleStatusChange(cand, "Rejected")}
                        className="text-[9px] font-black text-red-500 hover:underline cursor-pointer"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>

                <div className="inline-flex gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(cand)}
                    className="p-1.5 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cand.id)}
                    className="p-1.5 rounded-lg border border-slate-100 hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredCandidates.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white border border-dashed rounded-2xl space-y-3">
            <span className="text-4xl block">👤</span>
            <h4 className="font-extrabold text-sm text-slate-600">No Candidates Found</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">Add a candidate profile or import via Resume Parser.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Candidate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-50 border-b flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800">
                  {editingRecord ? "Edit Candidate Profile" : "Add New Candidate"}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">Please fill in candidate directory fields</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. Aditya"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. Rao"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="name@email.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="+91..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Alternate Phone</label>
                  <input
                    type="text"
                    value={formData.alternatePhone}
                    onChange={e => setFormData(prev => ({ ...prev, alternatePhone: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={e => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Candidate Source</label>
                  <select
                    value={formData.source}
                    onChange={e => setFormData(prev => ({ ...prev, source: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    {sourcesList.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Education / Qualification</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={e => setFormData(prev => ({ ...prev, qualification: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. B.Tech / MBA"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Current Location</label>
                  <input
                    type="text"
                    value={formData.currentLocation}
                    onChange={e => setFormData(prev => ({ ...prev, currentLocation: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="Current City"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Total Experience (Years)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.experience}
                    onChange={e => setFormData(prev => ({ ...prev, experience: parseFloat(e.target.value) }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Expected Salary</label>
                  <input
                    type="text"
                    value={formData.expectedSalary}
                    onChange={e => setFormData(prev => ({ ...prev, expectedSalary: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. 12 LPA"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Notice Period</label>
                  <input
                    type="text"
                    value={formData.noticePeriod}
                    onChange={e => setFormData(prev => ({ ...prev, noticePeriod: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. 30 Days"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Current Company</label>
                  <input
                    type="text"
                    value={formData.currentCompany}
                    onChange={e => setFormData(prev => ({ ...prev, currentCompany: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="Current Employer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Current Designation</label>
                  <input
                    type="text"
                    value={formData.currentDesignation}
                    onChange={e => setFormData(prev => ({ ...prev, currentDesignation: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="Job Title"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Skills</label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={e => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                  className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  placeholder="Comma separated skills..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Residential Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="City, State"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Upload Resume (Simulated)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={formData.resume || "No file uploaded"}
                      className="flex-1 text-xs border rounded-xl p-2.5 bg-slate-100 font-bold focus:outline-none"
                    />
                    <label className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[10px] font-black flex items-center justify-center cursor-pointer transition shrink-0">
                      Browse
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
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
                  {loading ? "Saving..." : "Save Candidate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Candidate View Profile Drawer Modal */}
      {viewingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 bg-slate-800 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded font-mono">
                  {viewingProfile.candidateId}
                </span>
                <h3 className="text-base font-black mt-1.5">{viewingProfile.candidateName || `${viewingProfile.firstName} ${viewingProfile.lastName}`}</h3>
                <p className="text-[11px] font-semibold text-slate-300 mt-0.5">Sourced via {viewingProfile.source || "LinkedIn"}</p>
              </div>
              <button
                onClick={() => setViewingProfile(null)}
                className="text-white hover:text-slate-350 text-2xl font-bold bg-white/10 hover:bg-white/20 h-8 w-8 rounded-full flex items-center justify-center transition"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700 font-sans leading-relaxed">
              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Email Address</span>
                  <span className="font-extrabold text-slate-800">{viewingProfile.email}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Phone Number</span>
                  <span className="font-extrabold text-slate-800">{viewingProfile.phone}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Experience</span>
                  <span className="font-extrabold text-slate-800">{viewingProfile.experience} Years</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Education</span>
                  <span className="font-extrabold text-slate-800">{viewingProfile.qualification}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Current Company</span>
                  <span className="font-extrabold text-slate-800">{viewingProfile.currentCompany || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Designation</span>
                  <span className="font-extrabold text-slate-800">{viewingProfile.currentDesignation || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Expected Salary</span>
                  <span className="font-extrabold text-slate-800">{viewingProfile.expectedSalary || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Notice Period</span>
                  <span className="font-extrabold text-slate-800">{viewingProfile.noticePeriod || "Immediate"}</span>
                </div>
              </div>

              {viewingProfile.skills && (
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Skills & Core Expertise</span>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingProfile.skills.split(",").map(s => (
                      <span key={s} className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-650">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {viewingProfile.resume && (
                <div className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Attached Resume</span>
                    <span className="font-extrabold text-slate-700">{viewingProfile.resume}</span>
                  </div>
                  <a
                    href={`#/resume/${viewingProfile.id}`}
                    onClick={(e) => { e.preventDefault(); alert("Simulating resume file preview..."); }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-black text-[10px]"
                  >
                    View File
                  </a>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t flex justify-end">
              <button
                onClick={() => setViewingProfile(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateDatabase;
