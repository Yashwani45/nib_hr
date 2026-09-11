import React, { useState } from "react";
import { ClockIcon, UserIcon, BriefcaseIcon, CalendarIcon } from "@heroicons/react/24/outline";

const ATSApplicantTracking = ({ records = [], handleAtsMove, hideList }) => {
  const stages = [
    "Applied",
    "Screening",
    "Shortlisted",
    "Interview",
    "Selected",
    "Offer",
    "Offer Accepted",
    "Onboarding",
    "Joined"
  ];

  const [draggedCard, setDraggedCard] = useState(null);
  const [historyLog, setHistoryLog] = useState({}); // Stores dummy/real history of stage movements

  const handleDragStart = (e, app) => {
    setDraggedCard(app);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    if (!draggedCard) return;
    
    const sourceStage = draggedCard.stage || "Applied";
    if (sourceStage === targetStage) return;

    // Call the parent update callback
    if (handleAtsMove) {
      await handleAtsMove(draggedCard.appId, draggedCard.id, targetStage);
    }

    // Log to history locally
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const logEntry = `Moved from ${sourceStage} to ${targetStage} at ${timestamp}`;
    
    setHistoryLog(prev => ({
      ...prev,
      [draggedCard.id]: [...(prev[draggedCard.id] || []), logEntry]
    }));

    setDraggedCard(null);
  };

  return (
    <div className="space-y-6">
      {/* Kanban Pipeline Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs">
        <h3 className="text-sm font-black text-slate-800">ATS Kanban Pipeline</h3>
        <p className="text-[10px] font-bold text-slate-400 mt-0.5">
          Drag and drop candidates across stages to update recruitment status and log movement history
        </p>
      </div>

      {/* Kanban Board Container */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-thin select-none">
        {stages.map((stage) => {
          // Filter records by stage name case-insensitively or exactly
          const stageCandidates = records.filter(
            (app) => String(app.stage || "Applied").toLowerCase().trim() === stage.toLowerCase().trim()
          );

          return (
            <div
              key={stage}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
              className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4 w-[280px] shrink-0 min-h-[500px] flex flex-col justify-between"
            >
              {/* Column Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 tracking-wide">{stage}</span>
                  <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-black">
                    {stageCandidates.length}
                  </span>
                </div>
                <div className="h-1 bg-indigo-500 rounded-full mt-2 w-full"></div>
              </div>

              {/* Cards Container */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {stageCandidates.map((c) => {
                  const id = c.id;
                  const candidateName = c.candidate || c.candidateName || `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Candidate";
                  const jobTitle = c.jobPosting || c.jobTitle || "Web Developer";
                  const experience = c.experience || "2 Years";
                  const skills = c.skills || "React, JavaScript";
                  const appliedDate = c.appliedDate || c.applicationDate || "10/08/2026";
                  const rating = c.rating || 4;
                  const history = historyLog[id] || [];

                  return (
                    <div
                      key={id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, c)}
                      className="bg-white border border-slate-150 rounded-xl p-3.5 shadow-3xs hover:shadow-2xs transition duration-200 cursor-grab active:cursor-grabbing space-y-3 hover:border-indigo-400"
                    >
                      {/* Name & Rating */}
                      <div className="flex justify-between items-start">
                        <div className="font-extrabold text-slate-800 text-xs truncate max-w-[140px]">
                          {candidateName}
                        </div>
                        <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[9px] px-1.5 py-0.5 rounded-md font-black">
                          ⭐ {rating}/5
                        </span>
                      </div>

                      {/* Details list */}
                      <div className="space-y-1.5 text-[10px] text-slate-500 font-semibold">
                        <div className="flex items-center gap-1">
                          <BriefcaseIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{jobTitle} • {experience} exp</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Applied on {appliedDate}</span>
                        </div>
                      </div>

                      {/* Skills tags */}
                      <div className="flex flex-wrap gap-1">
                        {skills.split(",").slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="bg-slate-50 border border-slate-200 text-slate-500 text-[9px] px-1.5 py-0.5 rounded font-bold"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>

                      {/* Stage History logs */}
                      {history.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 space-y-1 text-[8px] font-bold text-slate-400">
                          <span className="uppercase tracking-wider flex items-center gap-0.5 text-indigo-500">
                            <ClockIcon className="w-2.5 h-2.5" /> Stage History:
                          </span>
                          {history.map((log, idx) => (
                            <p key={idx} className="truncate">{log}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {stageCandidates.length === 0 && (
                  <div className="text-[10px] text-slate-400 text-center py-10 border-2 border-dashed border-slate-150 rounded-xl bg-slate-50/20">
                    Drag candidates here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ATSApplicantTracking;
