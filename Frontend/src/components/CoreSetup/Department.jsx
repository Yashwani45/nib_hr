import React from "react";

const Department = ({ records }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {records.map(dept => (
        <div key={dept.id} className="border border-gray-200/80 rounded-2xl p-5 bg-white shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {dept.deptCode}
              </span>
              <span className="text-[9px] text-gray-400">Status: {dept.status}</span>
            </div>
            <h4 className="font-bold text-gray-900 text-sm mb-1">{dept.deptName}</h4>
            <p className="text-xs text-gray-500 line-clamp-2">{dept.description || "No description provided."}</p>
          </div>

          <div className="border-t pt-2.5 mt-3 text-xs space-y-1 bg-gray-50/50 p-2 rounded-lg">
            <div className="flex justify-between">
              <span className="text-gray-400">Head of Dept:</span>
              <span className="font-semibold text-gray-800">{dept.head || "--"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Parent Dept:</span>
              <span className="font-semibold text-gray-800">{dept.parentDept || "None"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Branch Location:</span>
              <span className="font-semibold text-gray-800">{dept.branch || "--"}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Department;
