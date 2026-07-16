import React from "react";

const ReportingHierarchy = ({ records }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {records.map(rep => (
        <div key={rep.id} className="border border-gray-200/80 rounded-2xl p-5 bg-white shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b pb-2">
            <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-bold">
              {rep.reportingType || "Direct"}
            </span>
            <span className="text-[9px] text-gray-400 font-mono">ID: {rep.empId}</span>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs">
              <span className="text-gray-400 block">Employee:</span>
              <span className="font-bold text-gray-900 text-sm">{rep.employee}</span>
              <span className="text-[10px] text-gray-500 block">{rep.designation} ({rep.department})</span>
            </div>

            <div className="h-4 border-l-2 border-dashed border-gray-300 ml-3"></div>

            <div className="text-xs">
              <span className="text-gray-400 block">Manager:</span>
              <span className="font-bold text-gray-800">{rep.manager}</span>
              <span className="text-[10px] text-gray-500 block">ID: {rep.managerId}</span>
            </div>
          </div>

          <div className="border-t pt-2.5 mt-2.5 text-[9px] text-gray-400 flex justify-between">
            <span>From: {rep.effectiveFrom || "--"}</span>
            <span>To: {rep.effectiveTo || "--"}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReportingHierarchy;
