import React from "react";

const ATSApplicantTracking = ({ records = [], handleAtsMove, hideList }) => {
  const stages = ["Screening", "Interview", "Selection", "Offered", "Hired"];

  return (
    <div className="space-y-6">
      {/* Kanban Pipeline Section */}
      <div className="p-5 border border-amber-100 bg-amber-50/20 rounded-xl">
        <h3 className="text-sm font-bold text-amber-900 mb-3">Kanban Applicant Pipeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {stages.map(stage => {
            const stageCandidates = records.filter(app => app.stage === stage);
            return (
              <div key={stage} className="bg-gray-100/70 border rounded-lg p-3 min-h-[180px] flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-700">{stage}</span>
                  <span className="bg-gray-200 text-gray-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {stageCandidates.length}
                  </span>
                </div>
                <div className="space-y-2 flex-1">
                  {stageCandidates.map(c => (
                    <div key={c.id} className="bg-white border rounded p-2.5 shadow-sm text-xs space-y-2">
                      <div className="font-semibold text-gray-900">{c.candidate}</div>
                      <div className="text-[10px] text-gray-500">{c.jobPosting}</div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-blue-600 font-bold">⭐ {c.rating}/5</span>
                        <select
                          value={c.stage}
                          onChange={(e) => handleAtsMove(c.appId, c.id, e.target.value)}
                          className="text-[9px] border bg-gray-50 rounded px-1 py-0.5 focus:outline-none"
                        >
                          <option value="Screening">Move Screen</option>
                          <option value="Interview">Move Interview</option>
                          <option value="Selection">Move Select</option>
                          <option value="Offered">Move Offer</option>
                          <option value="Hired">Move Hire</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  {stageCandidates.length === 0 && (
                    <div className="text-[10px] text-gray-400 text-center py-6 border border-dashed rounded bg-white/40">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid View */}
      {!hideList && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {records.map((item) => (
            <div key={item.id} className="border border-gray-200/80 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-bold text-xs text-gray-800">Application ID: {item.appId || `#${item.id}`}</span>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[9px] font-bold">
                  {item.stage || "Screening"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                {Object.entries(item)
                  .filter(([key]) => key !== "id" && key !== "status" && key !== "created_at" && key !== "updated_at")
                  .map(([key, val]) => (
                    <div key={key} className="space-y-0.5 truncate">
                      <span className="text-gray-400 uppercase tracking-wider text-[8px] font-semibold">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <p className="font-bold text-gray-800 truncate">{String(val || "--")}</p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ATSApplicantTracking;
