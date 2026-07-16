import React from "react";

const CostCenter = ({ records }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {records.map(cc => (
        <div key={cc.id} className="border border-gray-200/80 rounded-2xl p-5 bg-white shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-sm text-gray-900">{cc.ccName}</h4>
              <span className="text-[10px] text-gray-400 font-mono">CC Code: {cc.ccCode}</span>
            </div>
            <span className="text-[9px] text-gray-400 uppercase font-bold">{cc.status}</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg text-center">
            <span className="text-[10px] text-gray-400 font-semibold block uppercase tracking-wider">Allocated Budget</span>
            <span className="text-lg font-black text-blue-600">₹{Number(cc.budget || 0).toLocaleString('en-IN')}</span>
          </div>

          <div className="text-xs space-y-1 border-t pt-2.5">
            <div className="flex justify-between">
              <span className="text-gray-400">Department:</span>
              <span className="font-semibold text-gray-800">{cc.department || "--"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Effective Date:</span>
              <span className="font-semibold text-gray-800">{cc.effectiveDate || "--"}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CostCenter;
