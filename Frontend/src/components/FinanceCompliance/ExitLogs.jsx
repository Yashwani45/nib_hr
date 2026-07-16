import React from "react";

const ExitLogs = ({ records }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {records.map((item) => (
        <div key={item.id} className="border border-gray-200/80 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center border-b pb-2">
            <span className="font-bold text-xs text-gray-800">Exit Record: #{item.id}</span>
            {item.status && (
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${item.status === "Approved" || item.status === "Completed" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"} border`}>
                {item.status}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            {Object.entries(item)
              .filter(([key]) => key !== "id" && key !== "status" && key !== "created_at" && key !== "updated_at")
              .slice(0, 8)
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
  );
};

export default ExitLogs;
