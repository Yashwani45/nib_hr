import React from "react";

const Company = ({ records }) => {
  return (
    <div className="grid grid-cols-1 gap-6">
      {records.map(comp => (
        <div key={comp.id} className="border border-gray-200/80 rounded-2xl p-6 bg-gradient-to-br from-white to-gray-50/40 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start border-b pb-4 gap-3">
            <div>
              <h3 className="text-lg font-black text-gray-900">{comp.companyName}</h3>
              <p className="text-xs text-gray-500 font-mono mt-0.5">Code: {comp.companyCode} | Short: {comp.shortName || comp.companyCode}</p>
            </div>
            <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 text-xs font-bold rounded-full">
              {comp.status || "Active"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-xs">
            <div className="space-y-1">
              <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Company Type</span>
              <p className="font-bold text-gray-800">{comp.type || "Pvt Ltd"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">CIN / PAN</span>
              <p className="font-bold text-gray-800 font-mono">{comp.cinNumber || "--"} / {comp.panNumber || "--"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">GST Number</span>
              <p className="font-bold text-gray-800 font-mono">{comp.gstNumber || "--"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">PF / ESI Registry</span>
              <p className="font-bold text-gray-800 font-mono">{comp.pfNumber || "--"} / {comp.esiNumber || "--"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Email Address</span>
              <p className="font-bold text-blue-600 underline">{comp.email || "--"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Contact Office</span>
              <p className="font-bold text-gray-800">{comp.phone || "--"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Time Zone / Currency</span>
              <p className="font-bold text-gray-800">{comp.timezone || "IST"} ({comp.currency || "INR"})</p>
            </div>
            <div className="space-y-1">
              <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Financial Year</span>
              <p className="font-bold text-gray-800">{comp.financialYear || "2026-27"}</p>
            </div>
          </div>

          <div className="border-t pt-4 text-xs">
            <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Registered Office Address</span>
            <p className="text-gray-700 mt-1">
              {comp.address1}{comp.address2 ? `, ${comp.address2}` : ""}, {comp.city}, {comp.district}, {comp.state} - {comp.pincode}, {comp.country}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Company;
