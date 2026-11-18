import React, { useState, useEffect, useRef } from "react";
import {
  XMarkIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  NoSymbolIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  QrCodeIcon,
  BuildingOffice2Icon
} from "@heroicons/react/24/outline";
import { apiFetch } from "../../services/hrApi";

const employeeQrCache = new Map();
const employeeQrRequests = new Map();

const getEmployeeQrCacheKey = (employeeId, companyCode) =>
  `${String(companyCode || "").toLowerCase()}:${String(employeeId || "")}`;

const EmployeeQrCardModal = ({ isOpen, onClose, employee, onUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const printCardRef = useRef(null);

  const empId = employee?.id || employee?.employeeCode || employee?.employeeId || employee?.emp_id;

  const fetchQr = async () => {
    if (!empId) {
      setLoading(false);
      setErrorMsg("Employee identifier is missing.");
      return;
    }
    const cacheKey = getEmployeeQrCacheKey(empId, employee?.companyCode);
    const cachedQr = employeeQrCache.get(cacheKey);
    if (cachedQr) {
      setQrData(cachedQr);
      setLoading(false);
      setErrorMsg("");
      return;
    }
    if (!employee?.qrDataUrl) {
      setLoading(true);
    }
    setErrorMsg("");
    let request = employeeQrRequests.get(cacheKey);
    if (!request) {
      const companyParam = employee?.companyCode ? `?companyCode=${encodeURIComponent(employee.companyCode)}` : "";
      request = apiFetch(`/api/operations/attendance/employee-qr/${encodeURIComponent(empId)}${companyParam}`);
      employeeQrRequests.set(cacheKey, request);
    }
    try {
      const res = await request;
      if (res?.success && res.data) {
        setQrData(res.data);
        employeeQrCache.set(cacheKey, res.data);
      } else if (!employee?.qrDataUrl) {
        setErrorMsg(res?.error || res?.message || "Failed to load employee QR card.");
      }
    } catch (err) {
      if (!employee?.qrDataUrl) {
        setErrorMsg(err.message || "Failed to load employee QR card.");
      }
    } finally {
      if (employeeQrRequests.get(cacheKey) === request) {
        employeeQrRequests.delete(cacheKey);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && empId) {
      const cacheKey = getEmployeeQrCacheKey(empId, employee?.companyCode);
      const cachedQr = employeeQrCache.get(cacheKey);
      const qrDataUrl = employee?.qrDataUrl || employee?.qr_data_url || employee?.qr_code_data_url;
      if (cachedQr) {
        setQrData(cachedQr);
        setLoading(false);
      } else if (qrDataUrl) {
        const employeeQr = {
          employeeId: employee.id || employee.employeeId,
          employeeCode: employee.employeeCode,
          employeeName: employee.fullName || employee.name,
          company: employee.company || employee.companyCode || "Technovani",
          department: employee.department,
          designation: employee.designation,
          photo: employee.photo,
          qrToken: employee.qrToken || employee.qr_token || employee.qr_code_token,
          qrDataUrl,
          status: "ACTIVE",
          generatedAt: employee.generatedAt || new Date().toISOString()
        };
        setQrData(employeeQr);
        employeeQrCache.set(cacheKey, employeeQr);
        setLoading(false);
        setErrorMsg("");
      } else {
        setQrData(null);
        setErrorMsg("");
        fetchQr();
      }
    } else {
      setQrData(null);
      setLoading(false);
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [isOpen, empId, employee?.companyCode, employee?.qrDataUrl, employee?.qr_data_url, employee?.qr_code_data_url]);

  if (!isOpen) return null;

  // Print ID Badge
  const handlePrint = () => {
    const printContent = printCardRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank", "width=600,height=800");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Employee ID Badge - ${qrData?.employeeName || "Badge"}</title>
          <style>
            @page {
              size: auto;
              margin: 15mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background-color: #f8fafc;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .badge-card {
              width: 320px;
              border: 1px solid #cbd5e1;
              border-radius: 16px;
              overflow: hidden;
              background: #ffffff;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              text-align: center;
            }
            .badge-header {
              background: #0f172a;
              color: #ffffff;
              padding: 16px;
            }
            .badge-header h3 {
              margin: 0;
              font-size: 15px;
              font-weight: 800;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
            .badge-header p {
              margin: 4px 0 0 0;
              font-size: 10px;
              color: #94a3b8;
              font-weight: 600;
            }
            .badge-body {
              padding: 20px;
            }
            .photo-wrap {
              width: 90px;
              height: 90px;
              border-radius: 50%;
              margin: 0 auto 12px auto;
              border: 3px solid #6366f1;
              overflow: hidden;
              background: #e2e8f0;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 28px;
              font-weight: 800;
              color: #4338ca;
            }
            .photo-wrap img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .emp-name {
              font-size: 17px;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 4px 0;
            }
            .emp-designation {
              font-size: 11px;
              font-weight: 700;
              color: #4f46e5;
              margin: 0 0 2px 0;
            }
            .emp-department {
              font-size: 10px;
              font-weight: 600;
              color: #64748b;
              margin: 0 0 16px 0;
            }
            .qr-wrap {
              background: #f8fafc;
              border: 2px dashed #cbd5e1;
              border-radius: 12px;
              padding: 12px;
              display: inline-block;
              margin-bottom: 12px;
            }
            .qr-wrap img {
              width: 200px;
              height: 200px;
              display: block;
            }
            .emp-code-pill {
              background: #0f172a;
              color: #ffffff;
              font-family: monospace;
              font-size: 11px;
              font-weight: 700;
              padding: 4px 10px;
              border-radius: 6px;
              display: inline-block;
              letter-spacing: 0.5px;
            }
            .badge-footer {
              border-top: 1px solid #f1f5f9;
              padding: 10px;
              font-size: 9px;
              color: #94a3b8;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="badge-card">
            <div class="badge-header">
              <h3>${qrData?.company || "Company ID Badge"}</h3>
              <p>Official Access & Attendance Pass</p>
            </div>
            <div class="badge-body">
              <div class="photo-wrap">
                ${
                  qrData?.photo
                    ? `<img src="${qrData.photo}" alt="Photo" />`
                    : `<span>${(qrData?.employeeName || "E")[0].toUpperCase()}</span>`
                }
              </div>
              <h2 class="emp-name">${qrData?.employeeName || "Employee"}</h2>
              <p class="emp-designation">${qrData?.designation || "Staff Member"}</p>
              <p class="emp-department">${qrData?.department || "Department"}</p>
              <div class="qr-wrap">
                ${qrData?.qrDataUrl ? `<img src="${qrData.qrDataUrl}" alt="QR" />` : ""}
              </div>
              <div>
                <span class="emp-code-pill">${qrData?.employeeCode || "ID: " + empId}</span>
              </div>
            </div>
            <div class="badge-footer">
              Scan at office entrance to mark attendance
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Download QR PNG
  const handleDownloadPng = () => {
    if (!qrData?.qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrData.qrDataUrl;
    link.download = `QR_Badge_${qrData.employeeCode || "employee"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Regenerate QR
  const handleRegenerate = async () => {
    if (qrData && !window.confirm("Regenerating this QR code will instantly deactivate any previous printed badge for this employee. Continue?")) {
      return;
    }
    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const companyParam = employee?.companyCode ? `?companyCode=${encodeURIComponent(employee.companyCode)}` : "";
      const res = await apiFetch(`/api/operations/attendance/employee-qr/${encodeURIComponent(empId)}/regenerate${companyParam}`, {
        method: "POST",
        body: JSON.stringify({ companyCode: employee?.companyCode })
      });
      if (res?.success && res.data) {
        setQrData(res.data);
        employeeQrCache.set(getEmployeeQrCacheKey(empId, employee?.companyCode), res.data);
        setSuccessMsg("Fresh unique QR code generated successfully. Previous badge is now invalid.");
        if (onUpdated) onUpdated(res.data);
      } else {
        setErrorMsg(res?.error || res?.message || "Failed to regenerate QR code.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to regenerate QR code.");
    } finally {
      setActionLoading(false);
    }
  };

  // Revoke QR
  const handleRevoke = async () => {
    const reason = window.prompt("Reason for revoking this card (e.g., lost card, employee resigned):", "Lost badge card");
    if (reason === null) return;

    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const companyParam = employee?.companyCode ? `?companyCode=${encodeURIComponent(employee.companyCode)}` : "";
      const res = await apiFetch(`/api/operations/attendance/employee-qr/${encodeURIComponent(empId)}/revoke${companyParam}`, {
        method: "POST",
        body: JSON.stringify({ reason, companyCode: employee?.companyCode })
      });
      if (res?.success) {
        const revokedQr = { ...qrData, status: "REVOKED" };
        setQrData(revokedQr);
        employeeQrCache.set(getEmployeeQrCacheKey(empId, employee?.companyCode), revokedQr);
        setSuccessMsg(res.message || "Employee QR code has been REVOKED. Scans using this card are now blocked.");
        if (onUpdated) onUpdated();
      } else {
        setErrorMsg(res?.error || res?.message || "Failed to revoke QR code.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to revoke QR code.");
    } finally {
      setActionLoading(false);
    }
  };

  const isRevoked = qrData?.status === "REVOKED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center">
              <QrCodeIcon className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-wide uppercase">Employee QR ID Badge</h3>
              <p className="text-[10px] text-slate-400 font-medium">Unique Attendance Pass & ID Card</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={fetchQr}
                className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-[11px] font-bold shrink-0 transition cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-500 font-bold">Loading Employee QR Badge...</p>
            </div>
          ) : qrData ? (
            <>
              {/* Printable ID Badge Container */}
              <div
                ref={printCardRef}
                className={`relative mx-auto w-full max-w-[340px] sm:max-w-[380px] rounded-2xl border-2 overflow-hidden shadow-lg transition text-center ${
                  isRevoked
                    ? "bg-slate-50 border-rose-300 opacity-90"
                    : "bg-white border-slate-200 hover:shadow-xl"
                }`}
              >
                {/* Badge Top Header */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4">
                  <div className="flex items-center justify-center gap-1.5 text-indigo-400 text-xs font-black uppercase tracking-wider mb-0.5">
                    <BuildingOffice2Icon className="w-4 h-4" />
                    <span>{qrData.company || "Corporate Enterprise"}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest">
                    Official Attendance & Access Card
                  </p>
                </div>

                {/* Badge Body */}
                <div className="p-5 space-y-3">
                  {/* Avatar / Photo */}
                  <div className="relative mx-auto w-20 h-20 rounded-full border-3 border-indigo-600 overflow-hidden bg-slate-100 shadow-inner flex items-center justify-center">
                    {qrData.photo ? (
                      <img src={qrData.photo} alt="Employee" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-black text-indigo-600 uppercase">
                        {(qrData.employeeName || "E")[0]}
                      </span>
                    )}
                    {isRevoked && (
                      <div className="absolute inset-0 bg-rose-950/80 backdrop-blur-xs flex items-center justify-center">
                        <NoSymbolIcon className="w-8 h-8 text-rose-400" />
                      </div>
                    )}
                  </div>

                  {/* Name and Designation */}
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900 leading-tight">
                      {qrData.employeeName}
                    </h4>
                    <p className="text-xs font-bold text-indigo-600 mt-0.5">{qrData.designation}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{qrData.department}</p>
                  </div>

                  {/* QR Code Container */}
                  <div className="relative inline-block p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    {qrData.qrDataUrl ? (
                      <img
                        src={qrData.qrDataUrl}
                        alt="Employee QR Code"
                        className="w-60 h-60 sm:w-72 sm:h-72 mx-auto object-contain"
                      />
                    ) : (
                      <div className="w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center text-xs text-slate-400">
                        No QR Image
                      </div>
                    )}

                    {isRevoked && (
                      <div className="absolute inset-0 bg-rose-950/85 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center p-2 text-white">
                        <NoSymbolIcon className="w-8 h-8 text-rose-300 mb-1" />
                        <span className="text-xs font-black tracking-wider uppercase text-rose-200">REVOKED</span>
                        <span className="text-[9px] text-rose-300 text-center mt-1">This card cannot be scanned</span>
                      </div>
                    )}
                  </div>

                  {/* Employee Code & Status */}
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <span className="px-3 py-1 bg-slate-900 text-white font-mono text-xs font-extrabold rounded-lg tracking-wider">
                      {qrData.employeeCode || qrData.employeeId}
                    </span>
                    <span
                      className={`px-2 py-1 text-[10px] font-black uppercase rounded-lg border ${
                        isRevoked
                          ? "bg-rose-50 text-rose-700 border-rose-300"
                          : "bg-emerald-50 text-emerald-700 border-emerald-300"
                      }`}
                    >
                      {qrData.status}
                    </span>
                  </div>
                </div>

                {/* Badge Bottom Footer */}
                <div className="bg-slate-50 border-t border-slate-100 py-2 px-3 text-[9px] text-slate-400 font-semibold">
                  Hold close to office laptop scanner to record attendance
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={isRevoked || actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-sm transition cursor-pointer"
                  title="Print official PVC ID Badge"
                >
                  <PrinterIcon className="w-4 h-4" />
                  <span>Print ID Card</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={isRevoked || actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-sm transition cursor-pointer"
                  title="Download high-resolution QR PNG"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span>Download PNG</span>
                </button>

                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  title="Generate a new QR if card was lost or reissued"
                >
                  <ArrowPathIcon className={`w-3.5 h-3.5 text-slate-500 ${actionLoading ? "animate-spin" : ""}`} />
                  <span>Regenerate</span>
                </button>

                {!isRevoked && (
                  <button
                    type="button"
                    onClick={handleRevoke}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition cursor-pointer"
                    title="Revoke QR code immediately if card is reported lost"
                  >
                    <NoSymbolIcon className="w-3.5 h-3.5 text-rose-500" />
                    <span>Revoke</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="py-12 text-center space-y-3">
              <p className="text-xs text-slate-500 font-medium">No active QR badge found for this employee.</p>
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={actionLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer"
              >
                Generate QR Badge
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeQrCardModal;
