// Frontend/src/components/Exit/ExitInterview.jsx
import React, { useEffect, useState, useMemo } from "react";
import { apiFetch } from "../../services/hrApi";
import {
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PencilSquareIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { SAMPLE_INTERVIEWS, getStatusBadgeClass } from "./exitData";

const RATING_METRICS = [
  { key: "jobSatisfaction", label: "Overall Job Satisfaction" },
  { key: "management", label: "Management Leadership" },
  { key: "managerSupport", label: "Manager Support & Guidance" },
  { key: "compensation", label: "Compensation & Pay Structure" },
  { key: "benefits", label: "Company Benefits & Perks" },
  { key: "workEnvironment", label: "Workplace Environment" },
  { key: "careerGrowth", label: "Career Growth & Progression" },
  { key: "learningOpportunities", label: "Learning & Development" },
  { key: "workLifeBalance", label: "Work-Life Balance" },
  { key: "teamCollaboration", label: "Team Collaboration" },
  { key: "companyCulture", label: "Company Culture & Values" },
  { key: "recognition", label: "Recognition & Rewards" }
];

const ExitInterview = ({ user, onViewEmployee }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedInterview, setSelectedInterview] = useState(null);

  const fetchInterviews = async () => {
    try {
      const res = await apiFetch("/api/exit/interviews");
      if (res && res.success && res.data && res.data.length > 0) {
        setRecords(res.data);
      } else {
        setRecords(SAMPLE_INTERVIEWS);
      }
    } catch (err) {
      console.warn("Using sample exit interviews:", err);
      setRecords(SAMPLE_INTERVIEWS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter(r =>
      r.employee.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      r.department.toLowerCase().includes(search.toLowerCase())
    );
  }, [records, search]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Exit Interviews & Employee Feedback</h2>
            <p className="text-xs text-slate-400 mt-0.5">Collect constructive feedback, measure organizational attrition factors, and assess rehire eligibility.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              Interviews Scheduled: {records.length}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative pt-1">
          <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by employee name, EMP ID, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold focus:outline-indigo-500"
          />
        </div>
      </div>

      {/* Interviews Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-4">Employee</th>
                <th className="px-4 py-4">EMP ID</th>
                <th className="px-4 py-4">Department</th>
                <th className="px-4 py-4">Interview Date</th>
                <th className="px-4 py-4">Interviewer</th>
                <th className="px-4 py-4">Exit Reason</th>
                <th className="px-4 py-4 text-center">Overall Rating</th>
                <th className="px-4 py-4 text-center">Rehire Eligible</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold">
              {filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4 font-bold text-slate-900">{r.employee}</td>
                  <td className="px-4 py-4 font-mono font-bold text-indigo-600">{r.employeeId}</td>
                  <td className="px-4 py-4 text-slate-600">{r.department}</td>
                  <td className="px-4 py-4 text-slate-800 font-bold">{r.interviewDate}</td>
                  <td className="px-4 py-4 text-slate-600">{r.interviewer}</td>
                  <td className="px-4 py-4 text-slate-600">{r.exitReason}</td>
                  <td className="px-4 py-4 text-center">
                    {r.overallRating !== "—" ? (
                      <span className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full text-[11px]">
                        <StarSolid className="w-3 h-3 text-amber-500" />
                        <span>{r.overallRating}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {r.rehireEligible === "Yes" ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">Yes</span>
                    ) : r.rehireEligible === "No" ? (
                      <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-full text-[10px]">No</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusBadgeClass(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedInterview(r)}
                        className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
                      >
                        {r.status === "Completed" ? "Report" : "Conduct"}
                      </button>
                      <button
                        onClick={() => onViewEmployee && onViewEmployee(r)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg border border-slate-200 hover:bg-slate-50"
                        title="View Profile"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Exit Interview Questionnaire Modal */}
      {selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase">
                  Exit Interview Evaluation: {selectedInterview.employee}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedInterview.employeeId} · {selectedInterview.department} · Conducted By: {selectedInterview.interviewer}
                </p>
              </div>
              <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${getStatusBadgeClass(selectedInterview.status)}`}>
                {selectedInterview.status}
              </span>
            </div>

            {/* 1-5 Star Ratings Metric Grid */}
            <div className="space-y-3">
              <h4 className="font-black text-slate-900 uppercase text-xs">
                Performance & Experience Ratings (Scale 1 to 5)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                {RATING_METRICS.map((m) => {
                  const score = selectedInterview.ratings?.[m.key] || 4;
                  return (
                    <div key={m.key} className="p-3 bg-slate-50 rounded-xl border flex justify-between items-center">
                      <span className="font-semibold text-slate-700 text-[11px]">{m.label}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarSolid
                            key={star}
                            className={`w-3.5 h-3.5 ${star <= score ? "text-amber-400" : "text-slate-200"}`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Structured Questions and Responses */}
            <div className="space-y-3 text-xs pt-2">
              <h4 className="font-black text-slate-900 uppercase text-xs">
                Detailed Employee Feedback Responses
              </h4>

              <div className="space-y-2.5">
                {[
                  { q: "Why are you leaving the organization?", a: selectedInterview.answers?.whyLeaving || "Career opportunity and professional growth." },
                  { q: "What did you like most about working here?", a: selectedInterview.answers?.likedMost || "Supportive team environment and rewarding engineering challenges." },
                  { q: "What did you dislike or find frustrating?", a: selectedInterview.answers?.disliked || "Periodic administrative overhead on cross-functional approvals." },
                  { q: "What could the company improve to enhance workplace culture?", a: selectedInterview.answers?.improve || "More continuous recognition and clearer promotion rubric benchmarks." },
                  { q: "How was your relationship with your manager?", a: selectedInterview.answers?.relationshipManager || "Positive, regular 1-on-1 coaching was maintained." },
                  { q: "Were your personal career goals supported?", a: selectedInterview.answers?.goalsSupported || "Yes, had access to technical certifications and workshops." },
                  { q: "Would you recommend this company to other professionals?", a: selectedInterview.answers?.recommend || "Yes, highly recommended." },
                  { q: "Would you consider rejoining the organization in the future?", a: selectedInterview.answers?.rejoin || "Yes, in a leadership capacity." },
                  { q: "What changes would improve overall employee retention?", a: selectedInterview.answers?.retentionChanges || "Competitive market recalibration of compensation and hybrid work flexibility." },
                  { q: "Additional Comments or Remarks:", a: selectedInterview.answers?.additional || "Grateful for the support and friendships formed over my tenure." }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="font-bold text-slate-800 block text-[11px]">{item.q}</span>
                    <p className="text-slate-600 mt-1 italic text-xs leading-relaxed">"{item.a}"</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t">
              <button
                onClick={() => alert(`Exporting Exit Interview Transcript for ${selectedInterview.employee}...`)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>Export Interview Transcript</span>
              </button>
              <button
                onClick={() => setSelectedInterview(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExitInterview;
