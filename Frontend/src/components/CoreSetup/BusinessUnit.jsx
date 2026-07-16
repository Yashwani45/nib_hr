import React from "react";

const BusinessUnit = ({ records }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {records.map(bu => (
        <div key={bu.id} className="border border-gray-200/80 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-mono text-gray-500">BU Code: {bu.buCode}</span>
              <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">{bu.status}</span>
            </div>
            <h4 className="font-bold text-sm text-gray-900 mb-1">{bu.buName}</h4>
            <p className="text-xs text-gray-500 line-clamp-2">{bu.description || "No descriptions."}</p>
          </div>
          <div className="border-t pt-2.5 mt-4 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-400">Business Head:</span>
              <span className="font-semibold text-gray-800">{bu.head || "--"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Branch Office:</span>
              <span className="font-semibold text-gray-800">{bu.branch || "--"}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BusinessUnit;
