import React, { useState, useMemo, useEffect } from "react";
import { apiFetch } from "../../services/hrApi";
import { useAuth } from "../../auth/AuthProvider";
import { FingerPrintIcon, QrCodeIcon, CameraIcon } from "@heroicons/react/24/outline";
import BiometricAttendanceTerminal from "../Biometric/BiometricAttendanceTerminal";
import CompanyQrAdminConsole from "../Attendance/CompanyQrAdminConsole";
import CompanyQrScannerModal from "../Attendance/CompanyQrScannerModal";
import EmployeeQrScannerModal from "../Attendance/EmployeeQrScannerModal";
import EmployeeQrCardModal from "../Attendance/EmployeeQrCardModal";

const DailyAttendance = ({ records = [], checkedIn, punchTime, handlePunchClick, dbData = [] }) => {
  const { user } = useAuth();
  const [showBiometricTerminal, setShowBiometricTerminal] = useState(false);
  const [showCompanyQrAdmin, setShowCompanyQrAdmin] = useState(false);
  const [showCompanyQrScanner, setShowCompanyQrScanner] = useState(false);
  const [showEmployeeQrScanner, setShowEmployeeQrScanner] = useState(false);
  const [selectedEmployeeForQr, setSelectedEmployeeForQr] = useState(null);
  const employees = dbData["employees"] || dbData["employee_profile"] || dbData["Employee Profile"] || dbData["Employee"] || [];

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
  const [loadingEmpId, setLoadingEmpId] = useState(null);

  useEffect(() => {
    const handleRefreshComplete = () => {
      setLoadingEmpId(null);
    };
    window.addEventListener("refresh-complete", handleRefreshComplete);
    return () => window.removeEventListener("refresh-complete", handleRefreshComplete);
  }, []);

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
        company: matchedEmp?.company || localStorage.getItem("selected_company_name") || "Company",
        branch: matchedEmp?.branch || matchedEmp?.branchName || (localStorage.getItem("selected_branch_name") !== "All Branches" ? localStorage.getItem("selected_branch_name") : "") || "Branch",
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
      window.dispatchEvent(new Event('silent-refresh'));
    } catch (err) {
      console.error(err);
      alert("Failed to save attendance record.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Quick Punch Console (All Employees List) */}
      {!isEmployee && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h4 className="font-extrabold text-sm text-slate-800">
                ⚡ Admin Quick Punch Console
              </h4>
              <p className="text-[10px] text-slate-500 font-bold mt-1">Mark attendance for employees directly</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-bold text-slate-600">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px]">
                  <th className="py-2.5">Employee</th>
                  <th>Department</th>
                  <th>Current Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map(emp => {
                  const empCode = emp.employeeCode || emp.emp_code || emp.id;
                  const empName = `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.name || "Employee";
                  
                  // Find today's record for this employee
                  const todayStr = new Date().toISOString().split("T")[0];
                  const todayRecord = records.find(r => 
                    String(r.empId).toLowerCase() === String(empCode).toLowerCase() && 
                    r.date === todayStr
                  );
                  
                  const isCheckedIn = todayRecord && todayRecord.checkIn && (!todayRecord.checkOut || todayRecord.checkOut === "--");
                  const isShiftCompleted = todayRecord && todayRecord.checkOut && todayRecord.checkOut !== "--";

                  return (
                    <tr key={empCode} className="hover:bg-slate-50/50 transition">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600">
                            {empName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-slate-800">{empName}</p>
                            <p className="font-mono text-[9px] text-slate-400">{empCode}</p>
                          </div>
                        </div>
                      </td>
                      <td>{emp.department || "Operations"}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          isShiftCompleted ? "bg-slate-100 text-slate-600 border border-slate-200" :
                          isCheckedIn ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {isShiftCompleted ? `Completed (${todayRecord.checkOut})` : isCheckedIn ? `Punched In (${todayRecord.checkIn})` : "Not Punched In"}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedEmployeeForQr({
                              id: emp.id || empCode,
                              employeeCode: empCode,
                              name: empName,
                              department: emp.department || "Operations",
                              designation: emp.designation || "Staff",
                              photo: emp.photo || ""
                            })}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 text-slate-500 transition cursor-pointer"
                            title={`View / Print QR ID Card for ${empName}`}
                          >
                            <QrCodeIcon className="w-3.5 h-3.5" />
                          </button>
                          {isShiftCompleted ? (
                            <span className="text-[10px] text-slate-400 font-bold">Shift Done</span>
                          ) : (
                          <button
                            disabled={loadingEmpId === empCode}
                            onClick={async () => {
                              setLoadingEmpId(empCode);
                              try {
                                const now = new Date();
                                const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                                
                                if (!isCheckedIn) {
                                  // Punch In
                                  const newId = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : "att-" + Math.random().toString(36).substring(2, 15);
                                  await apiFetch("/api/table/daily_attendance", {
                                    method: "POST",
                                    body: JSON.stringify({
                                      id: newId,
                                      empId: String(empCode),
                                      name: empName,
                                      date: todayStr,
                                      checkIn: timeStr,
                                      checkOut: "--",
                                      workingHours: 0,
                                      status: "Present",
                                      lateComing: 0,
                                      earlyLeaving: 0,
                                      overtime: 0,
                                      remarks: "Admin Quick Punch In",
                                      company: emp.company || localStorage.getItem("selected_company_name") || "Company",
                                      branch: emp.branch || emp.branchName || (localStorage.getItem("selected_branch_name") !== "All Branches" ? localStorage.getItem("selected_branch_name") : "") || "Branch",
                                      department: emp.department || "Operations",
                                      shift: emp.shift || "General Shift"
                                    })
                                  });
                                } else {
                                  // Punch Out
                                  let workingHours = 0;
                                  if (todayRecord.checkIn && todayRecord.checkIn !== "--") {
                                    const [ciH, ciM] = todayRecord.checkIn.split(":").map(Number);
                                    const [coH, coM] = timeStr.split(":").map(Number);
                                    const diffHrs = (coH + coM/60) - (ciH + ciM/60);
                                    workingHours = Math.max(0, diffHrs);
                                  }
                                  await apiFetch(`/api/table/daily_attendance/${todayRecord.id}`, {
                                    method: "PUT",
                                    body: JSON.stringify({
                                      ...todayRecord,
                                      checkOut: timeStr,
                                      workingHours: Number(workingHours.toFixed(2)),
                                      remarks: "Admin Quick Punch Out"
                                    })
                                  });
                                }
                                window.dispatchEvent(new Event('silent-refresh'));
                              } catch(e) {
                                alert("Failed to punch.");
                              } finally {
                                // Do not clear loading state here, wait for 'refresh-complete'
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-white shadow-xs transition ${
                              loadingEmpId === empCode 
                                ? "bg-slate-300 text-slate-500 cursor-not-allowed" 
                                : isCheckedIn ? "bg-rose-500 hover:bg-rose-600" : "bg-emerald-500 hover:bg-emerald-600"
                            }`}
                          >
                            {loadingEmpId === empCode ? "..." : (isCheckedIn ? "Punch Out" : "Punch In")}
                          </button>
                        )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Records List */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h4 className="font-extrabold text-sm text-slate-800">
            📜 Active Daily Logs
          </h4>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowEmployeeQrScanner(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Scan Employee QR Badges via Webcam or USB Scanner"
            >
              <QrCodeIcon className="w-4 h-4 text-indigo-200" />
              <span>Scan Employee QR</span>
            </button>

            <button
              onClick={() => setShowCompanyQrScanner(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Scan Company QR Code to Clock In / Out"
            >
              <QrCodeIcon className="w-4 h-4 text-emerald-200" />
              <span>Scan Company QR</span>
            </button>

            {!isEmployee && (
              <button
                onClick={() => setShowCompanyQrAdmin(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white border border-slate-700 rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                title="Launch Company QR Kiosk Display & Settings"
              >
                <QrCodeIcon className="w-4 h-4 text-indigo-400" />
                <span>QR Kiosk Console</span>
              </button>
            )}


            {!isEmployee && (
              <button 
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
              >
                + Create Attendance
              </button>
            )}
          </div>
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
                      <button
                        onClick={() => {
                          const matchedEmp = employees.find(e => 
                            String(e.employeeCode || e.emp_code || e.id).toLowerCase() === String(rec.empId).toLowerCase()
                          );
                          setSelectedEmployeeForQr(matchedEmp || {
                            id: rec.empId,
                            employeeCode: rec.empId,
                            name: rec.name,
                            department: "Operations"
                          });
                        }}
                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded text-[10px] font-extrabold uppercase transition cursor-pointer"
                        title="View / Print Employee QR ID Badge"
                      >
                        Badge
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
                    return `${viewingRecord.company || emp?.company || "Company"} • ${viewingRecord.branch || emp?.branch || emp?.branchName || "Branch"}`;
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



      {/* Company QR Scanner Modal */}
      <CompanyQrScannerModal
        isOpen={showCompanyQrScanner}
        onClose={() => {
          setShowCompanyQrScanner(false);
          window.dispatchEvent(new Event("silent-refresh"));
        }}
        onSuccess={() => {
          window.dispatchEvent(new Event("silent-refresh"));
        }}
      />

      {/* Company QR Admin Console Modal */}
      {showCompanyQrAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-5xl my-8">
            <CompanyQrAdminConsole
              onClose={() => {
                setShowCompanyQrAdmin(false);
                window.dispatchEvent(new Event("silent-refresh"));
              }}
            />
          </div>
        </div>
      )}

      {/* Employee QR Scanner Modal (Webcam / USB scanner on Office Laptop) */}
      <EmployeeQrScannerModal
        isOpen={showEmployeeQrScanner}
        onClose={() => {
          setShowEmployeeQrScanner(false);
          window.dispatchEvent(new Event("silent-refresh"));
        }}
        onSuccess={() => {
          window.dispatchEvent(new Event("silent-refresh"));
        }}
      />

      {/* Employee QR ID Card / PVC Badge Modal */}
      {selectedEmployeeForQr && (
        <EmployeeQrCardModal
          isOpen={!!selectedEmployeeForQr}
          onClose={() => setSelectedEmployeeForQr(null)}
          employee={selectedEmployeeForQr}
          onUpdated={() => {
            window.dispatchEvent(new Event("silent-refresh"));
          }}
        />
      )}
    </div>
  );
};

export default DailyAttendance;
