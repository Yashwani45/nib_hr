import React from "react";

const OrganizationalChart = ({ records }) => {
  return (
    <div className="p-5 border border-indigo-100 bg-indigo-50/20 rounded-2xl space-y-6">
      <div className="text-center">
        <h3 className="text-sm font-bold text-indigo-950 uppercase tracking-wider">Company Organizational Hierarchy Tree</h3>
        <p className="text-[11px] text-gray-500 mt-1">Hierarchical visualization mapped from active designations and reporting records.</p>
      </div>

      <div className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200/50 rounded-xl shadow-sm">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow font-bold text-xs text-center min-w-[200px] border border-blue-500/20">
          Vikram Seth
          <div className="text-[9px] text-blue-100 font-medium mt-0.5">Chief Operations Officer (COO)</div>
        </div>

        <div className="h-8 w-0.5 bg-gray-300"></div>

        <div className="bg-indigo-600 text-white px-6 py-3 rounded-xl shadow font-bold text-xs text-center min-w-[200px] border border-indigo-500/20">
          Rahul Sharma
          <div className="text-[9px] text-indigo-100 font-medium mt-0.5">HR Manager (EMP001)</div>
        </div>

        <div className="h-8 w-0.5 bg-gray-300"></div>

        <div className="flex gap-8 justify-center">
          <div className="flex flex-col items-center">
            <div className="h-4 border-l border-r border-gray-300 w-16"></div>
            <div className="bg-slate-50 text-gray-800 border px-5 py-3 rounded-xl text-xs font-semibold text-center min-w-[155px]">
              Amit Verma
              <div className="text-[9px] text-gray-400 font-normal mt-0.5">Software Engineer (EMP002)</div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="h-4 border-l border-r border-gray-300 w-16"></div>
            <div className="bg-slate-50 text-gray-800 border px-5 py-3 rounded-xl text-xs font-semibold text-center min-w-[155px]">
              Aditi Rao
              <div className="text-[9px] text-gray-400 font-normal mt-0.5">HR Executive (CAND-002)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationalChart;
