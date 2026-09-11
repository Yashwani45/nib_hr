import React, { useState } from "react";
import { updateTableRecord } from "../../services/hrApi";
import { useAuth } from "../../auth/AuthProvider";
import { 
  CheckIcon, 
  XMarkIcon, 
  PaperClipIcon, 
  InboxIcon, 
  ClockIcon, 
  XCircleIcon 
} from "@heroicons/react/24/outline";

const LeaveRequests = ({ records = [], onRefreshData }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "rejected"
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [showRejectInput, setShowRejectInput] = useState({});

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

  // 1. Separate records based on status
  const pendingRequests = records.filter(
    (item) => String(item.status || "").toUpperCase() === "PENDING"
  );
  const rejectedRequests = records.filter(
    (item) => String(item.status || "").toUpperCase() === "REJECTED"
  );

  const displayedRecords = activeTab === "pending" ? pendingRequests : rejectedRequests;

  const handleApprove = async (id) => {
    try {
      const approvedBy = user?.email || "Admin";
      const approvalDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      
      await updateTableRecord("leave_requests", id, { 
        status: "Approved",
        approvedBy: approvedBy,
        approved_by: approvedBy,
        approvalDate: approvalDate,
        approval_date: approvalDate
      });
      
      alert("Leave request approved successfully!");
      if (onRefreshData) onRefreshData();
    } catch (e) {
      console.error(e);
      alert("Failed to approve leave request.");
    }
  };

  const handleReject = async (id) => {
    const reason = rejectionReasons[id] || "";
    if (!reason.trim()) {
      alert("Please enter a reason for rejection.");
      return;
    }
    try {
      await updateTableRecord("leave_requests", id, { 
        status: "Rejected", 
        rejectionReason: reason,
        rejection_reason: reason
      });
      
      alert("Leave request rejected successfully.");
      setShowRejectInput(prev => ({ ...prev, [id]: false }));
      if (onRefreshData) onRefreshData();
    } catch (e) {
      console.error(e);
      alert("Failed to reject leave request.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Selector & Stats Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "pending"
                ? "bg-amber-50 text-amber-700 border border-amber-200/50 shadow-inner"
                : "bg-slate-50 text-slate-600 border border-slate-200/40 hover:bg-slate-100/50"
            }`}
          >
            <ClockIcon className="h-4 w-4" />
            <span>Pending Requests</span>
            <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-black">
              {pendingRequests.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("rejected")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "rejected"
                ? "bg-rose-50 text-rose-700 border border-rose-200/50 shadow-inner"
                : "bg-slate-50 text-slate-600 border border-slate-200/40 hover:bg-slate-100/50"
            }`}
          >
            <XCircleIcon className="h-4 w-4" />
            <span>Rejected History</span>
            <span className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.5 rounded-full font-black">
              {rejectedRequests.length}
            </span>
          </button>
        </div>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
          Actions taken immediately update the leave system.
        </p>
      </div>

      {/* Main List */}
      {displayedRecords.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-3xl bg-gray-50/50 p-6 flex flex-col items-center justify-center space-y-3">
          <InboxIcon className="h-10 w-10 text-slate-350 stroke-1" />
          <h4 className="font-bold text-slate-800 text-sm">
            No {activeTab === "pending" ? "pending" : "rejected"} leave requests
          </h4>
          <p className="text-xs text-slate-400">
            {activeTab === "pending" 
              ? "All caught up! Newly submitted requests will appear here." 
              : "No rejected requests found in the history."}
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
                    <th scope="col" className="px-6 py-4">Reason</th>
                    <th scope="col" className="px-6 py-4">Applied Date</th>
                    <th scope="col" className="px-6 py-4 text-center">Status</th>
                    {activeTab === "pending" && (
                      <th scope="col" className="px-6 py-4 text-right">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {displayedRecords.map((item) => (
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
                      <td className="px-6 py-4 max-w-[200px] truncate text-slate-500 font-medium" title={item.reason}>
                        {item.reason || "--"}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {formatDate(item.created_at || item.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border uppercase tracking-wider ${
                          activeTab === "pending"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      
                      {activeTab === "pending" && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end space-y-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(item.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold shadow-xs transition flex items-center gap-1"
                              >
                                <CheckIcon className="h-3.5 w-3.5" />
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  if (showRejectInput[item.id]) {
                                    handleReject(item.id);
                                  } else {
                                    setShowRejectInput(prev => ({ ...prev, [item.id]: true }));
                                  }
                                }}
                                className="px-3 py-1.5 bg-red-650 hover:bg-red-700 text-white rounded-xl text-[10px] font-bold shadow-xs transition flex items-center gap-1"
                              >
                                <XMarkIcon className="h-3.5 w-3.5" />
                                {showRejectInput[item.id] ? "Confirm" : "Reject"}
                              </button>
                            </div>
                            
                            {showRejectInput[item.id] && (
                              <div className="flex gap-2 items-center mt-2 w-48 justify-end">
                                <input
                                  type="text"
                                  placeholder="Rejection reason..."
                                  value={rejectionReasons[item.id] || ""}
                                  onChange={(e) => setRejectionReasons(prev => ({ ...prev, [item.id]: e.target.value }))}
                                  className="w-full px-2 py-1 border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-red-500 focus:outline-none"
                                />
                                <button
                                  onClick={() => setShowRejectInput(prev => ({ ...prev, [item.id]: false }))}
                                  className="text-[9px] text-slate-400 hover:underline hover:text-slate-600 font-bold"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card Grid View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
            {displayedRecords.map((item) => (
              <div key={item.id} className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-bold text-xs text-slate-500 font-mono">#{item.reqId || `LRQ-${item.id}`}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                    activeTab === "pending"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}>
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
                    <span className="text-slate-400 uppercase text-[9px] font-bold tracking-wider">Applied Date</span>
                    <p className="font-bold text-slate-700">{formatDate(item.created_at || item.createdAt)}</p>
                  </div>
                  <div className="space-y-0.5 col-span-2">
                    <span className="text-slate-400 uppercase text-[9px] font-bold tracking-wider">Reason</span>
                    <p className="font-medium text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-0.5">
                      {item.reason || "--"}
                    </p>
                  </div>
                  
                  {item.attachment && (
                    <div className="space-y-0.5 col-span-2">
                      <span className="text-slate-400 uppercase text-[9px] font-bold tracking-wider">Attachment</span>
                      <p className="font-bold text-indigo-600 flex items-center gap-1">
                        <PaperClipIcon className="h-3 w-3" />
                        <a href={item.attachment} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          View Attachment
                        </a>
                      </p>
                    </div>
                  )}

                  {item.rejectionReason && (
                    <div className="space-y-0.5 col-span-2">
                      <span className="text-rose-400 uppercase text-[9px] font-bold tracking-wider">Rejection Reason</span>
                      <p className="font-bold text-rose-700 bg-rose-50/50 p-2 rounded-lg border border-rose-100">
                        {item.rejectionReason || item.rejection_reason}
                      </p>
                    </div>
                  )}
                </div>

                {activeTab === "pending" && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleApprove(item.id)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold shadow-xs transition flex items-center gap-1"
                      >
                        <CheckIcon className="h-3.5 w-3.5" />
                        Approve Request
                      </button>
                      <button
                        onClick={() => {
                          if (showRejectInput[item.id]) {
                            handleReject(item.id);
                          } else {
                            setShowRejectInput(prev => ({ ...prev, [item.id]: true }));
                          }
                        }}
                        className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-bold shadow-xs transition flex items-center gap-1"
                      >
                        <XMarkIcon className="h-3.5 w-3.5" />
                        {showRejectInput[item.id] ? "Confirm Reject" : "Reject Request"}
                      </button>
                    </div>






                    {showRejectInput[item.id] && (
                      <div className="flex gap-2 items-center mt-2">
                        <input
                          type="text"
                          placeholder="Rejection reason..."
                          value={rejectionReasons[item.id] || ""}
                          onChange={(e) => setRejectionReasons(prev => ({ ...prev, [item.id]: e.target.value }))}
                          className="flex-1 px-2 py-1.5 border border-slate-200 rounded-xl text-[10px] focus:ring-1 focus:ring-red-500 focus:outline-none"
                        />
                        <button
                          onClick={() => setShowRejectInput(prev => ({ ...prev, [item.id]: false }))}
                          className="text-[10px] text-slate-400 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LeaveRequests;
