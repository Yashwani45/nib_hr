import React, { useState, useMemo } from "react";
import { apiFetch } from "../../services/hrApi";
import { useAuth } from "../../auth/AuthProvider";

const DailyAttendance = ({ records = [], checkedIn, punchTime, handlePunchClick, dbData = [] }) => {
  const { user } = useAuth();
  const employees = dbData["employees"] || dbData["employee_profile"] || [];

  const userRole = typeof user?.role === "object" ? user?.role?.name : user?.role;
  const isEmployee = userRole === "Employee";

  const myEmpCode = user?.username || "";
  const myProfile = employees.find(e => 
    String(e.email || "").toLowerCase() === String(user?.email || "").toLowerCase()
  );
  const myCode = myProfile?.employeeCode || myProfile?.emp_code || myEmpCode;

  const visibleRecords = isEmployee 
    ? records.filter(r => 
        String(r.empId).toLowerCase().trim() === String(myCode).toLowerCase().trim()
      )
    : records;

  const [editingRecord, setEditingRecord] = useState(null);
  const [creatingRecord, setCreatingRecord] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [formEmpCode, setFormEmpCode] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formCheckIn, setFormCheckIn] = useState("");
  const [formCheckOut, setFormCheckOut] = useState("");
  const [formStatus, setFormStatus] = useState("Present");
  const [formLate, setFormLate] = useState("0");
  const [formOvertime, setFormOvertime] = useState("0");
  const [formRemarks, setFormRemarks] = useState("");

  const handleOpenEdit = (rec) => {
    setEditingRecord(rec);
    setFormEmpCode(rec.empId);
    setFormDate(rec.date);
    setFormCheckIn(rec.checkIn || "");
    setFormCheckOut(rec.checkOut || "");
    setFormStatus(rec.status || "Present");
    setFormLate(String(rec.lateComing || 0));
    setFormOvertime(String(rec.overtime || 0));
    setFormRemarks(rec.remarks || "");
  };

  const handleOpenCreate = () => {
    setCreatingRecord(true);
    setFormEmpCode("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormCheckIn("09:00:00");
    setFormCheckOut("18:00:00");
    setFormStatus("Present");
    setFormLate("0");
    setFormOvertime("0");
    setFormRemarks("Manual HR attendance creation");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const now = new Date();
      const matchedEmp = employees.find(emp => String(emp.employeeCode || emp.emp_code || emp.id).toLowerCase() === formEmpCode.toLowerCase());
      const empName = matchedEmp ? `${matchedEmp.firstName || ""} ${matchedEmp.lastName || ""}`.trim() : "Employee";

      // Calculate working hours
      let workingHours = 8.0;
      if (formCheckIn && formCheckOut && formCheckOut !== "--") {
        const [ciH, ciM] = formCheckIn.split(":").map(Number);
        const [coH, coM] = formCheckOut.split(":").map(Number);
        const diffHrs = (coH + coM/60) - (ciH + ciM/60);
        workingHours = Math.max(0, diffHrs - 1.0); // Less 1 hour lunch break
      }

      const payload = {
        empId: formEmpCode,
        name: empName,
        date: formDate,
        checkIn: formCheckIn,
        checkOut: formCheckOut || "--",
        workingHours: Number(workingHours.toFixed(2)),
        status: formStatus,
        lateComing: Number(formLate),
        earlyLeaving: 0,
        overtime: Number(formOvertime),
        remarks: formRemarks,
        company: matchedEmp?.company || "NIB Technologies Pvt Ltd",
        branch: matchedEmp?.branch || "Headquarters",
        department: matchedEmp?.department || "Operations",
        shift: "General Shift"
      };

      if (editingRecord) {
        // Edit record
        await apiFetch(`/api/table/daily_attendance/${editingRecord.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });

        // Write Audit Log
        await apiFetch("/api/table/audit_logs", {
          method: "POST",
          body: JSON.stringify({
            userId: "admin-user",
            username: "admin@yashtech.com",
            roleName: "HRAdmin",
            actionType: "Edit Attendance",
            moduleName: "Attendance",
            recordId: editingRecord.id,
            previousValues: JSON.stringify(editingRecord),
            newValues: JSON.stringify(payload),
            httpMethod: "PUT",
            apiEndpoint: `/api/table/daily_attendance/${editingRecord.id}`,
            requestBody: JSON.stringify(payload),
            ipAddress: "127.0.0.1",
            userAgent: navigator.userAgent,
            browser: "Chrome",
            device: "Desktop PC",
            os: "Windows",
            status: "Success",
            timestamp: now.toISOString()
          })
        });

        alert("Attendance record updated successfully!");
      } else {
        // Create record
        const newId = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : "att-" + Math.random().toString(36).substring(2, 15);
        await apiFetch("/api/table/daily_attendance", {
          method: "POST",
          body: JSON.stringify({
            ...payload,
            id: newId
          })
        });

        // Write Audit Log
        await apiFetch("/api/table/audit_logs", {
          method: "POST",
          body: JSON.stringify({
            userId: "admin-user",
            username: "admin@yashtech.com",
            roleName: "HRAdmin",
            actionType: "Create Attendance",
            moduleName: "Attendance",
            recordId: newId,
            previousValues: "None",
            newValues: JSON.stringify(payload),
            httpMethod: "POST",
            apiEndpoint: "/api/table/daily_attendance",
            requestBody: JSON.stringify(payload),
            ipAddress: "127.0.0.1",
            userAgent: navigator.userAgent,
            browser: "Chrome",
            device: "Desktop PC",
            os: "Windows",
            status: "Success",
            timestamp: now.toISOString()
          })
        });

        alert("Manual attendance record created successfully!");
      }

      setEditingRecord(null);
      setCreatingRecord(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to save attendance record.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Simulation Box for Admin Punch In */}
      {!isEmployee && (
        <div className="p-5 border border-emerald-100 bg-emerald-50/20 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${checkedIn ? "bg-emerald-500 animate-ping" : "bg-red-400"}`}></span>
              Daily Check-In & Punch Console (HR Admin Check-in Simulation)
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Punch check-in/out simulation for HR Admin user account
            </p>
            {checkedIn && (
              <div className="mt-2 text-xs text-emerald-800 font-medium">
                Checked in at: <span className="font-bold">{punchTime}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePunchClick}
              className={`px-5 py-3 rounded-lg text-xs font-bold text-white shadow transition-all shrink-0 ${
                checkedIn
                  ? "bg-red-500 hover:bg-red-600 hover:shadow-red-200"
                  : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-200"
              }`}
            >
              {checkedIn ? "Punch Check-Out" : "Punch Web Check-In"}
            </button>
          </div>
        </div>
      )}

      {/* Daily Records List */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h4 className="font-extrabold text-sm text-slate-800">
            📜 Active Daily Logs
          </h4>
          {!isEmployee && (
            <button 
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
            >
              + Create Attendance
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bold text-slate-600">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px]">
                <th className="py-2.5">Date</th>
                <th>Employee Code</th>
                <th>Employee Name</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Working Hours</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRecords.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-3 text-slate-800">{rec.date}</td>
                  <td className="font-mono">{rec.empId}</td>
                  <td>{rec.name}</td>
                  <td>{rec.checkIn}</td>
                  <td>{rec.checkOut}</td>
                  <td>{rec.workingHours || 0} Hrs</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      rec.status === "Present" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                      rec.status === "Late" ? "bg-yellow-50 text-yellow-700 border border-yellow-100" :
                      "bg-red-50 text-red-700 border border-red-100"
                    }`}>
                      {rec.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      {!isEmployee && (
                        <button 
                          onClick={() => handleOpenEdit(rec)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-[10px] font-extrabold uppercase transition"
                        >
                          Edit
                        </button>
                      )}
                      <button 
                        onClick={() => setViewingRecord(rec)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-extrabold uppercase transition"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visibleRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-slate-400 font-bold">No daily logs recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Form Overlay Drawer */}
      {(editingRecord || creatingRecord) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-slate-150 max-w-md w-full shadow-xl space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800">
              {editingRecord ? "Edit Attendance Log" : "Create Manual Attendance"}
            </h3>
            <form onSubmit={handleSave} className="space-y-4 text-xs font-bold text-slate-600">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Employee Code</label>
                <select 
                  value={formEmpCode}
                  onChange={e => setFormEmpCode(e.target.value)}
                  disabled={!!editingRecord}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select Employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.employeeCode || emp.emp_code || emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode || emp.emp_code || emp.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Date</label>
                <input 
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  disabled={!!editingRecord}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Check In Time</label>
                  <input 
                    type="text"
                    placeholder="e.g. 09:00:00"
                    value={formCheckIn}
                    onChange={e => setFormCheckIn(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Check Out Time</label>
                  <input 
                    type="text"
                    placeholder="e.g. 18:00:00"
                    value={formCheckOut}
                    onChange={e => setFormCheckOut(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Status</label>
                  <select 
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option>Present</option>
                    <option>Late</option>
                    <option>Half Day</option>
                    <option>Absent</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Late (Min)</label>
                  <input 
                    type="number"
                    value={formLate}
                    onChange={e => setFormLate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Overtime (Hrs)</label>
                  <input 
                    type="number"
                    value={formOvertime}
                    onChange={e => setFormOvertime(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">HR Remarks</label>
                <textarea 
                  rows="3"
                  value={formRemarks}
                  onChange={e => setFormRemarks(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button 
                  type="button"
                  onClick={() => { setEditingRecord(null); setCreatingRecord(false); }}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail Form Overlay Drawer */}
      {viewingRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl border border-slate-150 max-w-lg w-full shadow-xl space-y-6">
            <div className="flex justify-between items-start border-b pb-3 border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">Employee Punch Audit Details</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  ID: {viewingRecord.id}
                </p>
              </div>
              <button 
                onClick={() => setViewingRecord(null)}
                className="text-slate-400 hover:text-slate-600 font-black text-sm"
              >
                ✕
              </button>
            </div>

            {/* Profile Detail Layout similar to payroll cards */}
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              {/* Profile Avatar / Selfie URL */}
              <div className="h-16 w-16 rounded-full border border-slate-200 overflow-hidden bg-slate-200 flex items-center justify-center">
                {viewingRecord.selfieUrl || viewingRecord.selfie_url ? (
                  <img 
                    src={viewingRecord.selfieUrl || viewingRecord.selfie_url} 
                    alt="Selfie verification" 
                    className="h-full w-full object-cover" 
                  />
                ) : (
                  <span className="text-xl">👤</span>
                )}
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-850">{viewingRecord.name}</h4>
                <p className="text-xs text-slate-500 font-black">
                  {viewingRecord.empId} • {(() => {
                    const emp = employees.find(e => String(e.employeeCode || e.emp_code || e.id).toLowerCase() === String(viewingRecord.empId).toLowerCase());
                    return viewingRecord.department || emp?.department || "Operations";
                  })()}
                </p>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                  {(() => {
                    const emp = employees.find(e => String(e.employeeCode || e.emp_code || e.id).toLowerCase() === String(viewingRecord.empId).toLowerCase());
                    return `${viewingRecord.company || emp?.company || "Yashtech"} • ${viewingRecord.branch || emp?.branch || "Headquarters"}`;
                  })()}
                </p>
              </div>
            </div>

            {/* Attendance Punch details grid */}
            <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-600">
              <div className="border p-3 rounded-xl bg-slate-50/20">
                <span className="text-[9px] text-slate-400 block uppercase">Punch Date</span>
                <span className="text-slate-800 font-black mt-0.5 block">{viewingRecord.date}</span>
              </div>
              <div className="border p-3 rounded-xl bg-slate-50/20">
                <span className="text-[9px] text-slate-400 block uppercase">Attendance Status</span>
                <span className="mt-0.5 block">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                    viewingRecord.status === "Present" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                    viewingRecord.status === "Late" ? "bg-yellow-50 text-yellow-700 border border-yellow-100" :
                    "bg-red-50 text-red-700 border border-red-100"
                  }`}>
                    {viewingRecord.status}
                  </span>
                </span>
              </div>
              <div className="border p-3 rounded-xl bg-slate-50/20">
                <span className="text-[9px] text-slate-400 block uppercase">Check In Time</span>
                <span className="text-slate-800 font-black mt-0.5 block">{viewingRecord.checkIn}</span>
              </div>
              <div className="border p-3 rounded-xl bg-slate-50/20">
                <span className="text-[9px] text-slate-400 block uppercase">Check Out Time</span>
                <span className="text-slate-800 font-black mt-0.5 block">{viewingRecord.checkOut}</span>
              </div>
              <div className="border p-3 rounded-xl bg-slate-50/20">
                <span className="text-[9px] text-slate-400 block uppercase">Working Hours</span>
                <span className="text-slate-800 font-black mt-0.5 block">{viewingRecord.workingHours || 0} Hrs</span>
              </div>
              <div className="border p-3 rounded-xl bg-slate-50/20">
                <span className="text-[9px] text-slate-400 block uppercase">Break Hours</span>
                <span className="text-slate-800 font-black mt-0.5 block">{viewingRecord.break_hours || viewingRecord.breakHours || 1.0} Hr</span>
              </div>
              <div className="border p-3 rounded-xl bg-slate-50/20">
                <span className="text-[9px] text-slate-400 block uppercase">Late Arrival</span>
                <span className="text-slate-800 font-black mt-0.5 block">{viewingRecord.lateComing || 0} Min</span>
              </div>
              <div className="border p-3 rounded-xl bg-slate-50/20">
                <span className="text-[9px] text-slate-400 block uppercase">Overtime</span>
                <span className="text-slate-800 font-black mt-0.5 block">{viewingRecord.overtime || 0} Hrs</span>
              </div>
            </div>

            {/* Audit coordinates */}
            <div className="space-y-2 border-t pt-4">
              <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Device & Location Telemetry</h5>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-bold text-slate-500 space-y-1.5">
                <p><span className="font-extrabold text-slate-700">IP Address:</span> {viewingRecord.ip_address || viewingRecord.ipAddress || "127.0.0.1"}</p>
                <p className="truncate"><span className="font-extrabold text-slate-700">User Agent:</span> {viewingRecord.device_info || viewingRecord.deviceInfo || "Desktop PC (Chrome)"}</p>
                <p><span className="font-extrabold text-slate-700">Coordinates:</span> {viewingRecord.gps_location || viewingRecord.gpsLocation || "19.0760° N, 72.8777° E"}</p>
                <p><span className="font-extrabold text-slate-700">Remarks:</span> {viewingRecord.remarks || "No remarks recorded"}</p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button 
                onClick={() => setViewingRecord(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyAttendance;
