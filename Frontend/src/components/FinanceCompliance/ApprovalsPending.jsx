import React from "react";
import { 
  CheckCircleIcon, 
  CalendarDaysIcon, 
  InboxIcon, 
  UserIcon 
} from "@heroicons/react/24/outline";

const ApprovalsPending = ({ records = [] }) => {
  // Helper for dates
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  // Filter records to display only approved leave requests
  const approvedLeaves = records.filter(
    (item) => String(item.status || "").toUpperCase() === "APPROVED"
  );

  return (
    <div className="space-y-6">
      {/* Overview Stats Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm gap-4">
        <div>
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Leave Approval History</span>
          <h3 className="text-sm font-black text-slate-900 mt-0.5 flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-emerald-500 stroke-[2]" />
            Approved Leave Records
          </h3>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-100 px-4 py-2 rounded-xl text-xs font-bold">
          <span>Total Approved:</span>
          <span className="bg-emerald-600 text-white font-black px-2 py-0.5 rounded-full text-[10px]">
            {approvedLeaves.length}
          </span>
        </div>
      </div>

      {/* Main List */}
      {approvedLeaves.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-3xl bg-gray-50/50 p-6 flex flex-col items-center justify-center space-y-3">
          <InboxIcon className="h-10 w-10 text-slate-350 stroke-1" />
          <h4 className="font-bold text-slate-800 text-sm">No approved leaves found</h4>
          <p className="text-xs text-slate-400">
            Once leave requests are approved by an Admin/HR, they will appear in this history log.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-150 text-left">
                <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4">Leave ID</th>
                    <th scope="col" className="px-6 py-4">Employee Name</th>
                    <th scope="col" className="px-6 py-4">Leave Type</th>
                    <th scope="col" className="px-6 py-4">From Date</th>
                    <th scope="col" className="px-6 py-4">To Date</th>
                    <th scope="col" className="px-6 py-4 text-center">Days</th>
                    <th scope="col" className="px-6 py-4">Approved By</th>
                    <th scope="col" className="px-6 py-4">Approval Date</th>
                    <th scope="col" className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {approvedLeaves.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition">
                      <td className="px-6 py-4 font-mono font-bold text-slate-500">
                        #{item.reqId || `LRQ-${item.id}`}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {item.empName || item.employeeName || "Employee"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] border border-slate-200">
                          {item.leaveType || item.leave_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">{formatDate(item.fromDate || item.start_date)}</td>
                      <td className="px-6 py-4">{formatDate(item.toDate || item.end_date)}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-900">
                        {item.totalDays || item.total_days || 1}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {item.approvedBy || item.approved_by || "Admin"}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {formatDate(item.approvalDate || item.approval_date || item.updated_at)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2.5 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider bg-green-50 text-green-700 border-green-200">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card Grid View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
            {approvedLeaves.map((item) => (
              <div key={item.id} className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-bold text-xs text-slate-500 font-mono">#{item.reqId || `LRQ-${item.id}`}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider bg-green-50 text-green-700 border-green-200">
                    {item.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-800">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 uppercase text-[9px] font-bold tracking-wider">Employee</span>
                    <p className="font-extrabold text-slate-900">{item.empName || item.employeeName || "Employee"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 uppercase text-[9px] font-bold tracking-wider">Leave Type</span>
                    <p className="font-extrabold text-slate-900">{item.leaveType || item.leave_type}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 uppercase text-[9px] font-bold tracking-wider">From Date</span>
                    <p className="font-bold text-slate-700">{formatDate(item.fromDate || item.start_date)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 uppercase text-[9px] font-bold tracking-wider">To Date</span>
                    <p className="font-bold text-slate-700">{formatDate(item.toDate || item.end_date)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 uppercase text-[9px] font-bold tracking-wider">Days</span>
                    <p className="font-bold text-slate-900">{item.totalDays || item.total_days || 1} Days</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 uppercase text-[9px] font-bold tracking-wider">Approved By</span>
                    <p className="font-bold text-slate-700">{item.approvedBy || item.approved_by || "Admin"}</p>
                  </div>
                  <div className="space-y-0.5 col-span-2">
                    <span className="text-slate-400 uppercase text-[9px] font-bold tracking-wider">Approval Date</span>
                    <p className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5 text-slate-800">
                      <CalendarDaysIcon className="h-3.5 w-3.5 text-slate-400" />
                      {formatDate(item.approvalDate || item.approval_date || item.updated_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ApprovalsPending;
