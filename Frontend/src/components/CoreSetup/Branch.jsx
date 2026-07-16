import React from "react";

const Branch = ({ records }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {records.map(br => (
        <div key={br.id} className="border border-gray-200/80 rounded-2xl p-5 bg-white shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h4 className="font-bold text-sm text-gray-900">{br.branchName}</h4>
              <span className="text-[10px] text-gray-400 font-mono">Code: {br.branchCode} | Type: {br.branchType}</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${br.status === "Active" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"} border`}>
              {br.status || "Active"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-400">Branch Manager</span>
              <p className="font-semibold text-gray-800">{br.manager || "Not Assigned"}</p>
            </div>
            <div>
              <span className="text-gray-400">Working Days</span>
              <p className="font-semibold text-gray-800">{br.workingDays || "Mon-Fri"}</p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-400">Contact Details</span>
              <p className="font-semibold text-gray-700">{br.email} | {br.phone}</p>
            </div>
          </div>

          <div className="text-xs border-t pt-2.5">
            <span className="text-gray-400">Location Address</span>
            <p className="text-gray-600 mt-0.5">{br.address}, {br.city}, {br.state} - {br.pincode}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Branch;
