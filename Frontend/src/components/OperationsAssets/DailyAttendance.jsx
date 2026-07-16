import React from "react";

const DailyAttendance = ({ records = [], checkedIn, punchTime, handlePunchClick, hideList }) => {
  return (
    <div className="space-y-6">
      {/* Attendance Punch Console */}
      <div className="p-5 border border-emerald-100 bg-emerald-50/20 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${checkedIn ? "bg-emerald-500 animate-ping" : "bg-red-400"}`}></span>
            Daily Check-In & Punch Console
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Check-in starts your shift. Check-out marks working hours.
          </p>
          {checkedIn && (
            <div className="mt-2 text-xs text-emerald-800 font-medium">
              Checked in at: <span className="font-bold">{punchTime}</span>
            </div>
          )}
        </div>
        <button
          onClick={handlePunchClick}
          className={`px-5 py-3 rounded-lg text-xs font-bold text-white shadow transition-all shrink-0 ${
            checkedIn
              ? "bg-red-500 hover:bg-red-600 hover:shadow-red-200"
              : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-200"
          }`}
        >
          {checkedIn ? "Punch Check-Out" : "Punch Web Check-In"}
        </button>
      </div>

      {/* Main Grid View */}
      {!hideList && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {records.map((item) => (
            <div key={item.id} className="border border-gray-200/80 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-bold text-xs text-gray-800">Date: {item.date || "--"}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${item.status === "Present" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"} border`}>
                  {item.status || "Present"}
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

export default DailyAttendance;
