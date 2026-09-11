import React, { useState } from "react";
import { PlusIcon, TrashIcon, CalendarIcon, UserIcon, PencilIcon, DocumentTextIcon, ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";
import { apiFetch } from "../../services/hrApi";

const Interview = ({ records = [], onRefreshData }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [feedbackRecord, setFeedbackRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    interviewId: "",
    candidate_name: "",
    candidate_email: "",
    job_title: "",
    interview_round: "Technical Round",
    date_time: "",
    interviewer: "",
    mode: "Online",
    meeting_link: "",
    location: "",
    notes: "",
    status: "Scheduled"
  });

  const [feedbackData, setFeedbackData] = useState({
    technical_skills: 3,
    communication: 3,
    problem_solving: 3,
    overall_rating: 3,
    strengths: "",
    weaknesses: "",
    comments: "",
    recommendation: "Next Round"
  });

  const handleOpenCreate = () => {
    const nextId = "INTV-" + Math.floor(1000 + Math.random() * 9000);
    setEditingRecord(null);
    setFormData({
      interviewId: nextId,
      candidate_name: "",
      candidate_email: "",
      job_title: "",
      interview_round: "Technical Round",
      date_time: "",
      interviewer: "",
      mode: "Online",
      meeting_link: "",
      location: "",
      notes: "",
      status: "Scheduled"
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (intv) => {
    setEditingRecord(intv);
    setFormData({
      ...intv,
      interviewId: intv.interviewId || "INTV-" + Math.floor(1000 + Math.random() * 9000),
      meeting_link: intv.meeting_link || intv.meetingLink || "",
      notes: intv.notes || "",
      location: intv.location || ""
    });
    setShowAddModal(true);
  };

  const handleOpenFeedback = (intv) => {
    setFeedbackRecord(intv);
    // Pre-populate with previous feedback if exists
    let existingFeedback = {
      technical_skills: 3,
      communication: 3,
      problem_solving: 3,
      overall_rating: 3,
      strengths: "",
      weaknesses: "",
      comments: "",
      recommendation: "Next Round"
    };

    if (intv.feedback_scorecard) {
      try {
        existingFeedback = typeof intv.feedback_scorecard === "string" 
          ? JSON.parse(intv.feedback_scorecard) 
          : intv.feedback_scorecard;
      } catch (e) {}
    }

    setFeedbackData(existingFeedback);
  };

  const handleCreateInterview = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingRecord) {
        await apiFetch(`/api/table/interviews/${editingRecord.id}`, {
          method: "PUT",
          body: JSON.stringify({ ...editingRecord, ...formData })
        });
      } else {
        const uuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
        await apiFetch("/api/table/interviews", {
          method: "POST",
          body: JSON.stringify({ id: uuid, ...formData })
        });
      }
      setShowAddModal(false);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to save interview schedule: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Calculate overall rating from ratings
      const computedScore = Math.round((feedbackData.technical_skills + feedbackData.communication + feedbackData.problem_solving + feedbackData.overall_rating) / 4 * 2);
      
      const updatedRecord = {
        ...feedbackRecord,
        status: "Completed",
        score: computedScore, // Out of 10
        feedback: feedbackData.comments,
        feedback_scorecard: JSON.stringify(feedbackData)
      };

      await apiFetch(`/api/table/interviews/${feedbackRecord.id}`, {
        method: "PUT",
        body: JSON.stringify(updatedRecord)
      });

      // Update candidate database status based on recommendation
      if (feedbackData.recommendation === "Selected") {
        // Find candidate in database and update
        const candResponse = await apiFetch("/api/table/candidate_database");
        const candidates = candResponse.data || [];
        const matchingCand = candidates.find(c => c.email === feedbackRecord.candidate_email);
        if (matchingCand) {
          await apiFetch(`/api/table/candidate_database/${matchingCand.id}`, {
            method: "PUT",
            body: JSON.stringify({ ...matchingCand, status: "Selected" })
          });
        }
      }

      setFeedbackRecord(null);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to submit feedback: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInterview = async (id) => {
    if (!window.confirm("Are you sure you want to delete this interview schedule?")) return;
    try {
      await apiFetch(`/api/table/interviews/${id}`, {
        method: "DELETE"
      });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to delete interview schedule.");
    }
  };

  const handleStatusChange = async (intv, nextStatus) => {
    try {
      await apiFetch(`/api/table/interviews/${intv.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...intv, status: nextStatus })
      });
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs">
        <div>
          <h3 className="text-sm font-black text-slate-800">Interview Schedules</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">Track rounds, feedback, and scorecard reviews</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/10 hover:shadow-lg transition cursor-pointer"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Schedule Interview</span>
        </button>
      </div>

      {/* Grid view of schedules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {records.map((intv) => {
          let scoreCard = null;
          if (intv.feedback_scorecard) {
            try {
              scoreCard = typeof intv.feedback_scorecard === "string" 
                ? JSON.parse(intv.feedback_scorecard) 
                : intv.feedback_scorecard;
            } catch (e) {}
          }

          return (
            <div key={intv.id} className="bg-white border border-slate-150 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="bg-purple-50 text-purple-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {intv.interview_round || "Technical Round"}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                    intv.status === "Completed" ? "bg-green-50 text-green-700 border-green-200" :
                    intv.status === "Scheduled" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    intv.status === "Rescheduled" ? "bg-indigo-50 text-indigo-750 border-indigo-200" :
                    "bg-red-50 text-red-700 border-red-200"
                  } border`}>
                    {intv.status || "Scheduled"}
                  </span>
                </div>
                
                <div>
                  <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider">{intv.interviewId}</span>
                  <h4 className="text-sm font-black text-slate-800 mt-0.5">{intv.candidate_name}</h4>
                  <p className="text-[10px] font-bold text-slate-400">{intv.job_title} • {intv.candidate_email}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-50 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold">{intv.date_time ? new Date(intv.date_time).toLocaleString() : "--"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold">Interviewer: {intv.interviewer}</span>
                </div>
                {intv.mode && (
                  <div className="text-[10px] font-bold text-indigo-650">
                    💻 {intv.mode} {intv.meeting_link && <a href={intv.meeting_link} target="_blank" rel="noreferrer" className="underline font-black text-indigo-500 ml-1">Join Link</a>}
                  </div>
                )}
                
                {/* Scorecard detail */}
                {scoreCard && (
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-[10px]">
                    <div className="flex justify-between items-center font-black">
                      <span className="text-indigo-600 uppercase tracking-wider text-[8px]">Interviewer Scorecard</span>
                      <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">⭐ {intv.score}/10</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[9px] text-slate-500 font-bold border-y py-1.5">
                      <div>Tech: {scoreCard.technical_skills}/5</div>
                      <div>Comm: {scoreCard.communication}/5</div>
                      <div>Problem: {scoreCard.problem_solving}/5</div>
                    </div>
                    {scoreCard.strengths && <p className="font-semibold">💪 <span className="font-bold text-slate-700">Strengths:</span> {scoreCard.strengths}</p>}
                    {scoreCard.recommendation && (
                      <p className="font-semibold">
                        🏁 <span className="font-bold text-slate-700">Rec:</span>{" "}
                        <span className={scoreCard.recommendation === "Selected" ? "text-green-600 font-black" : "text-red-500 font-black"}>{scoreCard.recommendation}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                <div className="inline-flex gap-2">
                  <button
                    onClick={() => handleOpenFeedback(intv)}
                    className="inline-flex items-center gap-0.5 text-[9px] font-black text-indigo-600 hover:underline cursor-pointer"
                  >
                    <ClipboardDocumentCheckIcon className="w-3.5 h-3.5" />
                    <span>Submit Scorecard</span>
                  </button>
                  {intv.status !== "Completed" && (
                    <button
                      onClick={() => handleStatusChange(intv, "Cancelled")}
                      className="text-[9px] font-black text-slate-500 hover:text-red-600 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <div className="inline-flex gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(intv)}
                    className="p-1.5 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteInterview(intv.id)}
                    className="p-1.5 rounded-lg border border-slate-100 hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {records.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white border border-dashed rounded-2xl space-y-3">
            <span className="text-4xl block">🗓️</span>
            <h4 className="font-extrabold text-sm text-slate-600">No Interviews Scheduled</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">Schedule an interview to review candidate fits.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Interview Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-50 border-b flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800">
                  {editingRecord ? "Edit Interview Schedule" : "Schedule Interview Round"}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">Define interview meeting coordinates</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateInterview} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Interview ID</label>
                  <input
                    type="text"
                    required
                    readOnly
                    value={formData.interviewId}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-100 font-bold focus:outline-none cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Candidate Name</label>
                  <input
                    type="text"
                    required
                    value={formData.candidate_name}
                    onChange={e => setFormData(prev => ({ ...prev, candidate_name: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. Yash Soni"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Candidate Email</label>
                  <input
                    type="email"
                    required
                    value={formData.candidate_email}
                    onChange={e => setFormData(prev => ({ ...prev, candidate_email: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="yash@gmail.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Job Position</label>
                  <input
                    type="text"
                    required
                    value={formData.job_title}
                    onChange={e => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. Web Developer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Interview Round</label>
                  <select
                    value={formData.interview_round}
                    onChange={e => setFormData(prev => ({ ...prev, interview_round: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="HR Round">HR Round</option>
                    <option value="Technical Round">Technical Round</option>
                    <option value="Managerial Round">Managerial Round</option>
                    <option value="Final Round">Final Round</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Interviewer Name</label>
                  <input
                    type="text"
                    required
                    value={formData.interviewer}
                    onChange={e => setFormData(prev => ({ ...prev, interviewer: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. Rohan Gupta"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Schedule Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.date_time}
                    onChange={e => setFormData(prev => ({ ...prev, date_time: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Interview Mode</label>
                  <select
                    value={formData.mode}
                    onChange={e => setFormData(prev => ({ ...prev, mode: e.target.value }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Online">Online</option>
                    <option value="F2F (In-Office)">F2F (In-Office)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Meeting Link / Office Cabin location</label>
                <input
                  type="text"
                  value={formData.meeting_link}
                  onChange={e => setFormData(prev => ({ ...prev, meeting_link: e.target.value }))}
                  className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  placeholder="https://meet.google.com/... or Cabin 3"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none resize-none"
                  placeholder="Additional instructions..."
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
                  {loading ? "Scheduling..." : "Schedule Interview"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Feedback scorecard Modal */}
      {feedbackRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[95vh]">
            <div className="px-6 py-4 bg-slate-50 border-b flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800">Submit Interview Scorecard</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">For Candidate: {feedbackRecord.candidate_name}</p>
              </div>
              <button
                onClick={() => setFeedbackRecord(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Technical Skills (1-5)</label>
                  <select
                    value={feedbackData.technical_skills}
                    onChange={(e) => setFeedbackData(prev => ({ ...prev, technical_skills: parseInt(e.target.value, 10) }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v} Stars</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Communication (1-5)</label>
                  <select
                    value={feedbackData.communication}
                    onChange={(e) => setFeedbackData(prev => ({ ...prev, communication: parseInt(e.target.value, 10) }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v} Stars</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Problem Solving (1-5)</label>
                  <select
                    value={feedbackData.problem_solving}
                    onChange={(e) => setFeedbackData(prev => ({ ...prev, problem_solving: parseInt(e.target.value, 10) }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v} Stars</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Overall Rating (1-5)</label>
                  <select
                    value={feedbackData.overall_rating}
                    onChange={(e) => setFeedbackData(prev => ({ ...prev, overall_rating: parseInt(e.target.value, 10) }))}
                    className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v} Stars</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Key Strengths</label>
                <input
                  type="text"
                  required
                  value={feedbackData.strengths}
                  onChange={(e) => setFeedbackData(prev => ({ ...prev, strengths: e.target.value }))}
                  className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  placeholder="Core competencies..."
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Key Weaknesses</label>
                <input
                  type="text"
                  required
                  value={feedbackData.weaknesses}
                  onChange={(e) => setFeedbackData(prev => ({ ...prev, weaknesses: e.target.value }))}
                  className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  placeholder="Gaps / areas of improvement..."
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Comments / Notes</label>
                <textarea
                  rows={2}
                  required
                  value={feedbackData.comments}
                  onChange={(e) => setFeedbackData(prev => ({ ...prev, comments: e.target.value }))}
                  className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none resize-none"
                  placeholder="Submit overall interview notes..."
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Interviewer Recommendation</label>
                <select
                  value={feedbackData.recommendation}
                  onChange={(e) => setFeedbackData(prev => ({ ...prev, recommendation: e.target.value }))}
                  className="w-full text-xs border rounded-xl p-2.5 bg-slate-50 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="Next Round">Recommend Next Round</option>
                  <option value="Selected">Recommend Candidate Selection</option>
                  <option value="Rejected">Recommend Candidate Rejection</option>
                </select>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-2 -mx-6 -mb-6">
                <button
                  type="button"
                  onClick={() => setFeedbackRecord(null)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 bg-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Submitting..." : "Submit Scorecard"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Interview;
