import React from "react";

const Designation = ({ records }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {records.map(desg => (
        <div key={desg.id} className="border border-gray-200/80 rounded-2xl p-5 bg-white shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-sm text-gray-900">{desg.desigName}</h4>
              <span className="text-[10px] text-gray-400 font-mono">Code: {desg.desigCode} | Level: {desg.jobLevel || "--"}</span>
            </div>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[9px] font-bold">
              Grade: {desg.grade || "--"}
            </span>
          </div>

          <p className="text-xs text-gray-600 line-clamp-3 bg-slate-50 p-2 rounded">
            {desg.description || "No job responsibilities defined."}
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div>
              <span className="text-gray-400">Department</span>
              <p className="font-semibold text-gray-800">{desg.department || "--"}</p>
            </div>
            <div>
              <span className="text-gray-400">Reports To</span>
              <p className="font-semibold text-gray-800">{desg.reportingDesig || "--"}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Designation;
