import React, { useMemo } from "react";
import { 
  BriefcaseIcon, 
  UserGroupIcon, 
  ClipboardDocumentCheckIcon, 
  EnvelopeOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";

// Circular Progress component for Onboarding
const ProgressCircle = ({ percent }) => {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  
  let color = "stroke-orange-500";
  if (percent === 100) color = "stroke-green-500";
  else if (percent >= 60) color = "stroke-blue-500";

  return (
    <div className="relative h-9 w-9 flex items-center justify-center shrink-0">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="18"
          cy="18"
          r={radius}
          className="stroke-slate-100"
          strokeWidth="3"
          fill="transparent"
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          className={`${color} transition-all duration-300`}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <span className="absolute text-[8px] font-black text-slate-700 font-mono">{percent}%</span>
    </div>
  );
};

const RecruitmentDashboard = ({ dbData = {}, openCreateTrigger, onRefreshData }) => {
  const requisitions = dbData["Job Requisition"] || [];
  const candidates = dbData["Candidate Database"] || [];
  const postings = dbData["Job Posting"] || [];
  const interviews = dbData["Interview"] || [];
  const offers = dbData["Offer Letter"] || [];
  const onboardings = dbData["Onboarding"] || [];
  const joining = dbData["Joining"] || [];

  // Compute metrics dynamically from database
  const metrics = useMemo(() => {
    const totalReqs = requisitions.length;
    const openPos = requisitions.filter(r => r.status === "Approved" || r.status === "Open" || r.status === "Submitted").length;
    const totalCand = candidates.length;
    const shortlisted = candidates.filter(c => c.status === "Shortlisted" || c.status === "Selected").length;
    const activeIntvs = interviews.filter(i => i.status === "Scheduled" || i.status === "Rescheduled").length;
    const sentOffers = offers.filter(o => o.status === "Sent" || o.status === "Accepted").length;
    const acceptedOffers = offers.filter(o => o.status === "Accepted").length;
    const onboardingInProg = onboardings.filter(o => o.status === "In Progress" || o.status === "Pending").length;
    const onboardingDone = onboardings.filter(o => o.status === "Completed").length;
    const joined = joining.length;

    return {
      totalRequisitions: totalReqs,
      openPositions: openPos,
      totalCandidates: totalCand,
      shortlistedCandidates: shortlisted,
      interviewsScheduled: activeIntvs,
      offersSent: sentOffers,
      offersAccepted: acceptedOffers,
      candidatesOnboarding: onboardingInProg,
      onboardingCompleted: onboardingDone,
      joined
    };
  }, [requisitions, candidates, interviews, offers, onboardings, joining]);

  // Stage counts for pipeline
  const pipelineStages = [
    { label: "Applied", val: candidates.filter(c => c.status === "Applied" || !c.status).length, color: "bg-blue-500" },
    { label: "Screening", val: candidates.filter(c => c.status === "Screening" || c.status === "Screened").length, color: "bg-cyan-500" },
    { label: "Shortlisted", val: candidates.filter(c => c.status === "Shortlisted").length, color: "bg-emerald-500" },
    { label: "Interview", val: interviews.filter(i => i.status === "Scheduled" || i.status === "Rescheduled").length, color: "bg-indigo-500" },
    { label: "Selected", val: candidates.filter(c => c.status === "Selected").length, color: "bg-purple-500" },
    { label: "Offer Sent", val: offers.filter(o => o.status === "Sent").length, color: "bg-pink-500" },
    { label: "Offer Accepted", val: offers.filter(o => o.status === "Accepted").length, color: "bg-teal-500" },
    { label: "Onboarding", val: onboardings.filter(o => o.status === "In Progress" || o.status === "Pending").length, color: "bg-blue-600" },
    { label: "Joined", val: joining.length, color: "bg-green-500" }
  ];

  // Colors mapping helper for circles
  const circleColors = [
    "bg-blue-50 text-blue-700",
    "bg-purple-50 text-purple-700",
    "bg-teal-50 text-teal-700",
    "bg-orange-50 text-orange-700",
    "bg-green-50 text-green-700"
  ];

  return (
    <div className="space-y-6 font-sans antialiased text-slate-800">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs gap-3">
        <div>
          <h2 className="text-base font-black text-slate-800">Recruitment Dashboard</h2>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">Overview of recruitment & onboarding activities</p>
        </div>
        
        {/* Date Selector and Refresh Button */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2 text-[10px] font-black text-slate-600">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>01 Aug 2026 - 10 Aug 2026</span>
          </div>
          <button 
            onClick={() => onRefreshData && onRefreshData()}
            className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl transition cursor-pointer text-slate-650"
            title="Refresh Data"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 10 Metric Summary Cards (2 rows of 5 cards) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Requisitions", val: metrics.totalRequisitions, sub: " requisitions total", icon: DocumentTextIcon, color: "text-blue-600 bg-blue-50" },
          { label: "Open Positions", val: metrics.openPositions, sub: " active positions", icon: BriefcaseIcon, color: "text-green-600 bg-green-50" },
          { label: "Total Candidates", val: metrics.totalCandidates, sub: " candidates listed", icon: UserGroupIcon, color: "text-purple-600 bg-purple-50" },
          { label: "Shortlisted Candidates", val: metrics.shortlistedCandidates, sub: " candidates selected", icon: ArrowTrendingUpIcon, color: "text-orange-600 bg-orange-50" },
          { label: "Interviews Scheduled", val: metrics.interviewsScheduled, sub: " upcoming rounds", icon: ClipboardDocumentCheckIcon, color: "text-blue-600 bg-blue-50" },
          { label: "Offers Sent", val: metrics.offersSent, sub: " offer letters sent", icon: EnvelopeOpenIcon, color: "text-pink-600 bg-pink-50" },
          { label: "Offers Accepted", val: metrics.offersAccepted, sub: " offers accepted", icon: CheckCircleIcon, color: "text-teal-600 bg-teal-50" },
          { label: "In Onboarding", val: metrics.candidatesOnboarding, sub: " active integrations", icon: ClockIcon, color: "text-orange-600 bg-orange-50" },
          { label: "Onboarding Completed", val: metrics.onboardingCompleted, sub: " onboarding done", icon: CheckCircleIcon, color: "text-green-600 bg-green-50" },
          { label: "Joined", val: metrics.joined, sub: " joined directory", icon: UserGroupIcon, color: "text-purple-600 bg-purple-50" }
        ].map((m, idx) => (
          <div key={idx} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-3xs flex flex-col justify-between hover:shadow-2xs transition duration-300">
            <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                <span className="text-[9px] font-black uppercase text-slate-455 tracking-wider leading-none block">{m.label}</span>
                <span className="text-[18px] font-black text-slate-800 block mt-1.5">{m.val}</span>
              </div>
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${m.color} shrink-0`}>
                <m.icon className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-[8px] font-black text-slate-400 w-max bg-slate-50 border px-1.5 py-0.5 rounded">
              <span>{m.val}{m.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recruitment Pipeline Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wider">
          <span>Recruitment Pipeline</span>
          <span className="h-4 w-4 rounded-full border border-slate-300 flex items-center justify-center text-[9px] font-bold text-slate-400 select-none cursor-pointer">i</span>
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {pipelineStages.map((stage, idx) => (
            <React.Fragment key={stage.label}>
              <div className="flex-1 min-w-[110px] bg-white border border-slate-150 rounded-xl p-3 flex flex-col items-center justify-between relative shadow-4xs overflow-hidden">
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${stage.color}`}></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{stage.label}</span>
                <span className="text-sm font-black text-slate-800 mt-2">{stage.val}</span>
              </div>
              {idx < pipelineStages.length - 1 && (
                <span className="text-slate-350 font-mono text-xs select-none shrink-0 font-bold px-0.5 hidden md:inline">{">"}</span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Action Button aligned to right */}
        <div className="flex justify-end pt-1">
          <button
            onClick={() => openCreateTrigger && openCreateTrigger("Job Requisition")}
            className="px-4 py-2 bg-blue-650 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-600/10 hover:shadow-lg transition cursor-pointer"
          >
            + Add Job Requisition
          </button>
        </div>
      </div>

      {/* 5-Column Dashboard Lists Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        
        {/* Column 1: Recent Candidates */}
        <div className="bg-white p-4 border border-slate-150 rounded-2xl shadow-3xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3 w-full">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Recent Candidates</h4>
              <span className="text-[10px] font-black text-blue-600 hover:underline cursor-pointer">View All</span>
            </div>
            
            <div className="space-y-3">
              {candidates.slice(0, 5).map((c, i) => {
                const name = c.candidateName || `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Candidate";
                return (
                  <div key={c.id || i} className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`h-8 w-8 rounded-full ${circleColors[i % circleColors.length]} font-black text-[10px] flex items-center justify-center shrink-0`}>
                        {name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-800 text-[11px] truncate leading-tight">{name}</p>
                        <p className="text-[9px] text-slate-400 font-bold truncate leading-tight mt-0.5">{c.currentDesignation || "Applicant"}</p>
                        <p className="text-[8px] text-slate-400 font-bold mt-0.5">{c.applicationDate || "Just now"}</p>
                      </div>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black border uppercase shrink-0 bg-indigo-50 text-indigo-700 border-indigo-100`}>
                      {c.status || "Applied"}
                    </span>
                  </div>
                );
              })}
              {candidates.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-[10px] font-bold">No candidates found</div>
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Upcoming Interviews */}
        <div className="bg-white p-4 border border-slate-150 rounded-2xl shadow-3xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3 w-full">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Upcoming Interviews</h4>
              <span className="text-[10px] font-black text-blue-600 hover:underline cursor-pointer">View All</span>
            </div>
            
            <div className="space-y-3">
              {interviews
                .filter(itv => itv.status === "Scheduled" || itv.status === "Rescheduled")
                .slice(0, 5)
                .map((itv, i) => {
                  let dateNum = "TBD";
                  let dateMonth = "INTV";
                  if (itv.date_time) {
                    try {
                      const d = new Date(itv.date_time);
                      dateNum = String(d.getDate());
                      dateMonth = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
                    } catch (e) {}
                  }

                  return (
                    <div key={itv.id || i} className="flex gap-2 items-start justify-between">
                      <div className="flex gap-2 min-w-0">
                        <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center shrink-0 leading-none">
                          <span className="text-[11px] font-black text-blue-700">{dateNum}</span>
                          <span className="text-[7px] font-black text-blue-400 mt-0.5">{dateMonth}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-800 text-[11px] truncate leading-tight">{itv.candidate_name || itv.candidate}</p>
                          <p className="text-[9px] text-slate-400 font-bold truncate leading-tight mt-0.5">{itv.interview_round}</p>
                          <p className="text-[8px] text-blue-500 font-black mt-0.5 truncate">{itv.interviewer}</p>
                        </div>
                      </div>
                      <span className="text-[8px] font-mono font-black text-slate-400 shrink-0">
                        {itv.date_time ? new Date(itv.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Scheduled"}
                      </span>
                    </div>
                  );
                })}
              {interviews.filter(itv => itv.status === "Scheduled" || itv.status === "Rescheduled").length === 0 && (
                <div className="text-center py-8 text-slate-400 text-[10px] font-bold">No upcoming interviews</div>
              )}
            </div>
          </div>
        </div>

        {/* Column 3: Active Job Postings */}
        <div className="bg-white p-4 border border-slate-150 rounded-2xl shadow-3xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3 w-full">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Active Job Postings</h4>
              <span className="text-[10px] font-black text-blue-600 hover:underline cursor-pointer">View All</span>
            </div>
            
            <div className="space-y-3">
              {postings
                .filter(job => job.status === "Published" || job.status === "Active")
                .slice(0, 5)
                .map((job, i) => (
                  <div key={job.id || i} className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-850 text-[11px] truncate leading-tight">{job.title}</p>
                      <p className="text-[9px] text-slate-400 font-bold truncate leading-tight mt-0.5">{job.department} • {job.location || "Remote"}</p>
                      <p className="text-[8px] text-indigo-500 font-black mt-0.5">{job.experience || "Not Specified"} Exp</p>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-green-50 text-green-700 border border-green-200 uppercase shrink-0">
                      {job.status || "Active"}
                    </span>
                  </div>
                ))}
              {postings.filter(job => job.status === "Published" || job.status === "Active").length === 0 && (
                <div className="text-center py-8 text-slate-400 text-[10px] font-bold">No active postings</div>
              )}
            </div>
          </div>
        </div>

        {/* Column 4: Recent Offers */}
        <div className="bg-white p-4 border border-slate-150 rounded-2xl shadow-3xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3 w-full">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Recent Offers</h4>
              <span className="text-[10px] font-black text-blue-600 hover:underline cursor-pointer">View All</span>
            </div>
            
            <div className="space-y-3">
              {offers.slice(0, 5).map((o, i) => (
                <div key={o.id || i} className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`h-8 w-8 rounded-full ${circleColors[i % circleColors.length]} font-black text-[10px] flex items-center justify-center shrink-0`}>
                      {o.candidate_name ? o.candidate_name.split(" ").map(n => n[0]).join("") : "OC"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-800 text-[11px] truncate leading-tight">{o.candidate_name}</p>
                      <p className="text-[9px] text-slate-400 font-bold truncate leading-tight mt-0.5">{o.job_title}</p>
                      <p className="text-[8px] text-slate-400 font-bold mt-0.5">Sent: {o.offer_date || "Just now"}</p>
                    </div>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black border uppercase shrink-0 ${
                    o.status === "Accepted" ? "bg-green-50 text-green-700 border-green-200" :
                    o.status === "Sent" ? "bg-purple-50 text-purple-700 border-purple-100" :
                    "bg-red-50 text-red-700 border-red-100"
                  }`}>
                    {o.status || "Sent"}
                  </span>
                </div>
              ))}
              {offers.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-[10px] font-bold">No offers found</div>
              )}
            </div>
          </div>
        </div>

        {/* Column 5: Onboarding Progress */}
        <div className="bg-white p-4 border border-slate-150 rounded-2xl shadow-3xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3 w-full">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Onboarding Progress</h4>
              <span className="text-[10px] font-black text-blue-600 hover:underline cursor-pointer">View All</span>
            </div>
            
            <div className="space-y-3">
              {onboardings.slice(0, 5).map((o, i) => (
                <div key={o.id || i} className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <ProgressCircle percent={o.progress || 0} />
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-800 text-[11px] truncate leading-tight">{o.candidate_name}</p>
                      <p className="text-[9px] text-slate-400 font-bold truncate leading-tight mt-0.5">{o.job_title}</p>
                    </div>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase shrink-0 ${
                    o.status === "Completed" ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                  }`}>
                    {o.status || "In Progress"}
                  </span>
                </div>
              ))}
              {onboardings.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-[10px] font-bold">No onboardings in progress</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RecruitmentDashboard;
