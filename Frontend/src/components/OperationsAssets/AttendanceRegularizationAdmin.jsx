import React, { useState } from "react";
import { apiFetch } from "../../services/hrApi";

const AttendanceRegularizationAdmin = ({ records = [], dbData = [], openCreateTrigger }) => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAction = async (req, action) => {
    setLoading(true);
    try {
      const now = new Date();
      const updatedStatus = action === "Approve" ? "Approved" : "Rejected";

      // 1. Update Regularization request status
      await apiFetch(`/api/table/attendance_regularization/${req.id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: updatedStatus,
          remarks: remarks,
          approvedBy: "HR Admin"
        })
      });

      // 2. If approved, write/update daily_attendance record
      if (updatedStatus === "Approved") {
        const attendanceList = dbData["daily_attendance"] || dbData["Daily Attendance"] || [];
        const existingAtt = attendanceList.find(a => a.date === req.date && String(a.empId).toLowerCase() === String(req.empId).toLowerCase());

        const payload = {
          empId: req.empId,
          name: req.employee,
          date: req.date,
          checkIn: req.requestedCheckIn || "09:00:00",
          checkOut: req.requestedCheckOut || "18:00:00",
          status: "Present",
          workingHours: 8.0,
          lateComing: 0,
          earlyLeaving: 0,
          overtime: 0,
          remarks: `Regularized by HR. Remarks: ${remarks}`
        };

        if (existingAtt && existingAtt.id) {
          await apiFetch(`/api/table/daily_attendance/${existingAtt.id}`, {
            method: "PUT",
            body: JSON.stringify(payload)
          });
        } else {
          await apiFetch("/api/table/daily_attendance", {
            method: "POST",
            body: JSON.stringify({
              ...payload,
              id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : "att-" + Math.random().toString(36).substring(2, 15)
            })
          });
        }
      }

      // 3. Write Audit Log
      await apiFetch("/api/table/audit_logs", {
        method: "POST",
        body: JSON.stringify({
          userId: "admin-user",
          username: "admin@yashtech.com",
          roleName: "HRAdmin",
          actionType: `${action} Regularization`,
          moduleName: "Attendance",
          recordId: req.id,
          previousValues: JSON.stringify(req),
          newValues: JSON.stringify({ status: updatedStatus, remarks: remarks }),
          httpMethod: "PUT",
          apiEndpoint: `/api/table/attendance_regularization/${req.id}`,
          requestBody: JSON.stringify({ status: updatedStatus }),
          ipAddress: "127.0.0.1",
          userAgent: navigator.userAgent,
          browser: "Chrome",
          device: "Desktop PC",
          os: "Windows",
          status: "Success",
          timestamp: now.toISOString()
        })
      });

      alert(`Regularization request ${action === "Approve" ? "approved" : "rejected"} successfully!`);
      setSelectedRequest(null);
      setRemarks("");
      window.location.reload(); // Refresh table state
    } catch (err) {
      console.error(err);
      alert("Failed to process action.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h4 className="font-extrabold text-sm text-slate-800">
          📋 Attendance Regularization Requests Queue
        </h4>
        <button 
          onClick={openCreateTrigger}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition"
        >
          + Add Regularization
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-bold text-slate-600">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px]">
              <th className="py-3">Employee</th>
              <th>Date</th>
              <th>Punch Type</th>
              <th>Check In Correction</th>
              <th>Check Out Correction</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map(req => (
              <tr key={req.id} className="hover:bg-slate-50/50 transition">
                <td className="py-3 text-slate-800">{req.employee} ({req.empId})</td>
                <td>{req.date}</td>
                <td>{req.punchType}</td>
                <td>{req.requestedCheckIn || "--"}</td>
                <td>{req.requestedCheckOut || "--"}</td>
                <td className="text-slate-400 font-semibold">{req.reason}</td>
                <td>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                    req.status === "Approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                    req.status === "Rejected" ? "bg-red-50 text-red-700 border border-red-100" :
                    "bg-yellow-50 text-yellow-700 border border-yellow-100"
                  }`}>
                    {req.status || "Pending"}
                  </span>
                </td>
                <td>
                  {(!req.status || req.status === "Pending") ? (
                    <button 
                      onClick={() => setSelectedRequest(req)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-[10px] font-extrabold uppercase transition"
                    >
                      Review
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-extrabold">Decision Made</span>
                  )}
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-6 text-slate-400 font-bold">No regularization requests found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Review Dialog Drawer overlay */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-slate-150 max-w-md w-full shadow-xl space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800">Review Regularization Request</h3>
            <div className="text-xs space-y-2 text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p><span className="text-slate-400 uppercase font-black tracking-wider text-[9px] block">Employee</span> {selectedRequest.employee}</p>
              <p><span className="text-slate-400 uppercase font-black tracking-wider text-[9px] block">Request Date</span> {selectedRequest.date}</p>
              <p><span className="text-slate-400 uppercase font-black tracking-wider text-[9px] block">Requested Check-In</span> {selectedRequest.requestedCheckIn || "--"}</p>
              <p><span className="text-slate-400 uppercase font-black tracking-wider text-[9px] block">Requested Check-Out</span> {selectedRequest.requestedCheckOut || "--"}</p>
              <p><span className="text-slate-400 uppercase font-black tracking-wider text-[9px] block">Reason</span> {selectedRequest.reason}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Decision Remarks</label>
              <input 
                type="text" 
                placeholder="Enter remarks..."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button 
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Close
              </button>
              <button 
                onClick={() => handleAction(selectedRequest, "Reject")}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                Reject
              </button>
              <button 
                onClick={() => handleAction(selectedRequest, "Approve")}
                disabled={loading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceRegularizationAdmin;
