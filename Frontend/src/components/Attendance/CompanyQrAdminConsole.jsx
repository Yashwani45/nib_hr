import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  QrCodeIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ClockIcon,
  BuildingOffice2Icon,
  PowerIcon,
  UserIcon
} from "@heroicons/react/24/outline";
import { apiFetch } from "../../services/hrApi";
import { useAuth } from "../../auth/AuthProvider";

const DEFAULT_ROTATION_SECONDS = 60; // Default auto-refresh cycle

const CompanyQrAdminConsole = ({ onClose, initialCompanyCode = null, isInline = false }) => {
  const { user } = useAuth();
  const userRole = typeof user?.role === "object" ? user?.role?.name : user?.role;
  const isSuperAdmin = userRole === "SuperAdmin" || user?.email === "superadmin@nib.com";

  // Active Company Selection
  const [selectedCompany, setSelectedCompany] = useState(
    initialCompanyCode || user?.companyCode || user?.company || "YASHTECH"
  );
  const [companiesList, setCompaniesList] = useState([
    { code: "YASHTECH", name: "Yash Technologies / Technovani" },
    { code: "NIB01", name: "National Insurance Broker" }
  ]);

  // QR State
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rotationSeconds, setRotationSeconds] = useState(DEFAULT_ROTATION_SECONDS);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_ROTATION_SECONDS);
  const [isRotating, setIsRotating] = useState(true);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const containerRef = useRef(null);
  const timerRef = useRef(null);

  // Clock ticker
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Fetch Companies if SuperAdmin
  useEffect(() => {
    if (isSuperAdmin) {
      apiFetch("/api/company")
        .then((res) => {
          const list = res?.data || res || [];
          if (Array.isArray(list) && list.length > 0) {
            setCompaniesList(
              list.map((c) => ({
                code: c.companyCode || c.company_code || c.id,
                name: c.companyName || c.company_name || c.name || c.companyCode
              }))
            );
          }
        })
        .catch(() => {});
    }
  }, [isSuperAdmin]);

  // Fetch QR Token
  const fetchQrToken = useCallback(async (showSpinner = false, customSeconds = null) => {
    if (showSpinner) setLoading(true);
    const secs = customSeconds || rotationSeconds;
    try {
      const query = `?companyCode=${encodeURIComponent(selectedCompany)}&rotationSeconds=${secs}`;
      const res = await apiFetch(`/api/operations/attendance/company-qr/token${query}`);
      const data = res?.data || res;
      if (data && data.token) {
        setQrData(data);
        setError(null);
        if (data.rotationSeconds && !customSeconds) {
          setRotationSeconds(data.rotationSeconds);
          setTimeLeft(data.rotationSeconds);
        } else {
          setTimeLeft(secs);
        }
      } else {
        throw new Error(res?.message || "Failed to generate company QR code.");
      }
    } catch (err) {
      setError(err?.message || "Error loading Company QR code.");
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [selectedCompany, rotationSeconds]);

  // Fetch Recent Scans
  const fetchRecentScans = useCallback(async () => {
    try {
      const res = await apiFetch(
        `/api/operations/attendance/company-qr/recent-scans?companyCode=${encodeURIComponent(selectedCompany)}&limit=10`
      );
      const data = res?.data || res || [];
      if (Array.isArray(data)) {
        setRecentScans(data);
      }
    } catch (err) {
      // Quiet fail
    }
  }, [selectedCompany]);

  // Initial load & Company switch
  useEffect(() => {
    fetchQrToken(true);
    fetchRecentScans();
  }, [selectedCompany, fetchQrToken, fetchRecentScans]);

  // Rotation Countdown Timer
  useEffect(() => {
    if (!isRotating) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          fetchQrToken(false);
          fetchRecentScans();
          return rotationSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRotating, rotationSeconds, fetchQrToken, fetchRecentScans]);

  // Poll recent scans every 12 seconds
  useEffect(() => {
    const scansInterval = setInterval(fetchRecentScans, 12000);
    return () => clearInterval(scansInterval);
  }, [fetchRecentScans]);

  // Update Expiry Duration
  const handleExpiryChange = async (newSeconds) => {
    const secs = parseInt(newSeconds, 10);
    setRotationSeconds(secs);
    setTimeLeft(secs);
    setLoading(true);
    try {
      const res = await apiFetch("/api/operations/attendance/company-qr/regenerate", {
        method: "POST",
        body: JSON.stringify({
          companyCode: selectedCompany,
          rotationSeconds: secs
        })
      });
      const data = res?.data || res;
      if (data && data.token) {
        setQrData(data);
        setError(null);
      }
    } catch (err) {
      alert(err?.message || "Failed to update QR expiry duration.");
    } finally {
      setLoading(false);
    }
  };

  // Force Regenerate
  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/operations/attendance/company-qr/regenerate", {
        method: "POST",
        body: JSON.stringify({
          companyCode: selectedCompany,
          rotationSeconds: rotationSeconds
        })
      });
      const data = res?.data || res;
      if (data && data.token) {
        setQrData(data);
        setTimeLeft(rotationSeconds);
        setError(null);
      }
    } catch (err) {
      alert(err?.message || "Failed to regenerate QR code.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle Enable / Disable
  const handleToggle = async () => {
    const newStatus = !(qrData?.isEnabled ?? true);
    setIsToggling(true);
    try {
      const res = await apiFetch("/api/operations/attendance/company-qr/toggle", {
        method: "PATCH",
        body: JSON.stringify({
          companyCode: selectedCompany,
          isEnabled: newStatus
        })
      });
      const data = res?.data || res;
      setQrData((prev) => ({
        ...prev,
        isEnabled: data.isEnabled ?? newStatus,
        status: data.status || (newStatus ? "ACTIVE" : "DISABLED")
      }));
    } catch (err) {
      alert(err?.message || "Failed to update QR attendance status.");
    } finally {
      setIsToggling(false);
    }
  };

  // Revoke QR Code
  const handleRevoke = async () => {
    const confirmRevoke = window.confirm(
      `Are you sure you want to REVOKE the QR Code for "${qrData?.companyName || selectedCompany}"?\n\nThis will instantly invalidate all previous tokens and photos/screenshots taken by anyone.`
    );
    if (!confirmRevoke) return;

    setIsRevoking(true);
    try {
      const res = await apiFetch("/api/operations/attendance/company-qr/revoke", {
        method: "POST",
        body: JSON.stringify({ companyCode: selectedCompany })
      });
      const data = res?.data || res;
      if (data && data.freshQr) {
        setQrData(data.freshQr);
        setTimeLeft(ROTATION_SECONDS);
        alert("Company QR Code revoked successfully! A new dynamic token has been generated.");
      }
    } catch (err) {
      alert(err?.message || "Failed to revoke QR code.");
    } finally {
      setIsRevoking(false);
    }
  };

  // Download QR Code as PNG
  const handleDownload = () => {
    if (!qrData?.qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrData.qrDataUrl;
    a.download = `${selectedCompany.toUpperCase()}_Attendance_QR.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Print Kiosk Standee
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${qrData?.companyName || selectedCompany} - Attendance QR Standee</title>
          <style>
            @page { size: A4 portrait; margin: 20mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #1e293b;
              text-align: center;
              padding: 40px;
              margin: 0;
            }
            .card {
              border: 3px solid #3b82f6;
              border-radius: 24px;
              padding: 40px;
              max-width: 520px;
              margin: 0 auto;
              box-shadow: 0 10px 25px rgba(0,0,0,0.08);
            }
            .badge {
              display: inline-block;
              background: #eff6ff;
              color: #1d4ed8;
              font-weight: 800;
              font-size: 14px;
              padding: 6px 16px;
              border-radius: 9999px;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 12px;
            }
            h1 {
              font-size: 26px;
              margin: 8px 0;
              color: #0f172a;
            }
            p.sub {
              font-size: 14px;
              color: #64748b;
              margin: 0 0 24px 0;
            }
            .qr-box {
              background: #ffffff;
              padding: 16px;
              border-radius: 16px;
              display: inline-block;
              border: 2px dashed #cbd5e1;
              margin-bottom: 24px;
            }
            .qr-box img {
              width: 320px;
              height: 320px;
              display: block;
            }
            .instructions {
              text-align: left;
              background: #f8fafc;
              border-radius: 12px;
              padding: 16px 20px;
              font-size: 13px;
              line-height: 1.6;
              color: #334155;
            }
            .instructions ol {
              margin: 8px 0;
              padding-left: 20px;
            }
            .footer {
              margin-top: 24px;
              font-size: 11px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">Official Attendance Kiosk</div>
            <h1>${qrData?.companyName || selectedCompany.toUpperCase()}</h1>
            <p class="sub">Scan this QR code with your Technovani HRMS Mobile App / Portal</p>
            
            <div class="qr-box">
              <img src="${qrData?.qrDataUrl}" alt="Company QR Code" />
            </div>

            <div class="instructions">
              <strong>How to Mark Attendance:</strong>
              <ol>
                <li>Open <strong>Technovani HRMS</strong> on your phone or tablet.</li>
                <li>Tap <strong>Scan Company QR</strong> on your dashboard.</li>
                <li>Align your camera with this code to punch <strong>Check-In</strong> or <strong>Check-Out</strong>.</li>
              </ol>
            </div>

            <div class="footer">
              Generated on ${new Date().toLocaleDateString()} • Technovani HRMS Multi-Tenant Security
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const formatTimeRemaining = (seconds) => {
    if (seconds >= 3600) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      return `${h}h ${m}m`;
    }
    if (seconds >= 60) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}m ${s}s`;
    }
    return `${seconds}s`;
  };

  const isEnabled = qrData?.isEnabled !== false;
  const progressPercent = Math.min(100, Math.max(0, ((rotationSeconds - timeLeft) / rotationSeconds) * 100));

  return (
    <div
      ref={containerRef}
      className={`bg-slate-900 text-slate-100 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 transition-all ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none flex flex-col justify-between p-6 sm:p-8 bg-slate-900 overflow-y-auto"
          : isInline
          ? "w-full shadow-lg"
          : "w-full max-w-5xl mx-auto"
      }`}
    >
      {/* Top Header Bar */}
      <div className="bg-slate-950/80 px-6 py-4 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <QrCodeIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white tracking-wide">
                Company QR Attendance Console
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border flex items-center gap-1 ${
                  isEnabled
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isEnabled ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                  }`}
                />
                {isEnabled ? "ACTIVE" : "DISABLED"}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
              <BuildingOffice2Icon className="w-3.5 h-3.5 text-indigo-400" />
              <span>{qrData?.companyName || selectedCompany.toUpperCase()}</span>
              <span>•</span>
              <span className="font-mono text-slate-500">{selectedCompany.toUpperCase()}</span>
            </p>
          </div>
        </div>

        {/* Company Selector for SuperAdmin & Header Actions */}
        <div className="flex items-center gap-2.5">
          {isSuperAdmin && (
            <div className="relative">
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="bg-slate-800 border border-slate-700 hover:border-indigo-500 text-xs font-bold text-slate-200 rounded-xl px-3 py-2 pr-7 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/40 transition appearance-none"
              >
                {companiesList.map((c) => (
                  <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title={isFullscreen ? "Exit Fullscreen Kiosk Mode" : "Fullscreen Kiosk Mode"}
          >
            {isFullscreen ? (
              <ArrowsPointingInIcon className="w-4 h-4" />
            ) : (
              <ArrowsPointingOutIcon className="w-4 h-4" />
            )}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 transition"
              title="Close Console"
            >
              <XCircleIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Big Interactive QR Display & Timer */}
        <div className="lg:col-span-6 bg-slate-950/60 rounded-2xl border border-slate-800 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Subtle Cyber Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-5 pointer-events-none" />

          {/* Clock Header */}
          <div className="flex items-center gap-2 mb-4 text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-3 py-1.5 rounded-full">
            <ClockIcon className="w-3.5 h-3.5 animate-spin-slow" />
            <span>{currentTime.toLocaleTimeString()}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">{currentTime.toDateString()}</span>
          </div>

          {/* QR Code Container */}
          <div className="relative group p-4 bg-white rounded-3xl shadow-2xl border-4 border-slate-700/50 flex items-center justify-center">
            {loading ? (
              <div className="w-64 h-64 flex flex-col items-center justify-center gap-3 text-slate-500">
                <ArrowPathIcon className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="text-xs font-bold text-slate-700">Generating dynamic token...</span>
              </div>
            ) : error ? (
              <div className="w-64 h-64 flex flex-col items-center justify-center gap-2 p-4 text-rose-500">
                <ExclamationTriangleIcon className="w-8 h-8" />
                <span className="text-xs font-bold text-center">{error}</span>
                <button
                  onClick={() => fetchQrToken(true)}
                  className="mt-2 px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold"
                >
                  Retry
                </button>
              </div>
            ) : qrData?.qrDataUrl ? (
              <div className="relative">
                <img
                  src={qrData.qrDataUrl}
                  alt="Company QR Code"
                  className={`w-64 h-64 sm:w-72 sm:h-72 object-contain transition-opacity duration-300 ${
                    !isEnabled ? "opacity-25 grayscale" : "opacity-100"
                  }`}
                />
                {!isEnabled && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 rounded-2xl p-4 text-white">
                    <PowerIcon className="w-10 h-10 text-rose-400 mb-1" />
                    <span className="font-extrabold text-sm text-rose-400">QR Punch Disabled</span>
                    <span className="text-[11px] text-slate-300 mt-1">Enable to allow punches</span>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Rotating Progress Bar */}
          {isEnabled && !loading && (
            <div className="w-full max-w-xs mt-5 space-y-2">
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ArrowPathIcon className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  Auto-rotates in:
                </span>
                <span className="font-mono text-cyan-300 text-xs">{formatTimeRemaining(timeLeft)}</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${100 - progressPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 font-medium">
                Short-lived HMAC cryptographic signature prevents screenshots & token replay.
              </p>
            </div>
          )}

          {/* Quick Action Badges */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
            >
              <ArrowDownTrayIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download PNG</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
            >
              <PrinterIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Print Standee</span>
            </button>
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-3.5 h-3.5 text-emerald-400 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Now</span>
            </button>
          </div>
        </div>

        {/* Right Column: Controls, Security Settings & Realtime Scans */}
        <div className="lg:col-span-6 space-y-6">
          {/* Security & Lifecycle Controls */}
          <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-indigo-400" />
              <span>Admin QR Controls & Security</span>
            </h3>

            {/* Expiry Duration Selector */}
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold text-slate-200 flex items-center gap-1.5">
                  <ClockIcon className="w-4 h-4 text-cyan-400" />
                  <span>QR Expiry & Rotation Duration</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Select how long each generated QR code remains valid before rotating
                </p>
              </div>
              <div className="relative">
                <select
                  value={rotationSeconds}
                  onChange={(e) => handleExpiryChange(e.target.value)}
                  className="bg-slate-800 border border-slate-700 hover:border-cyan-500 text-xs font-bold text-cyan-300 rounded-xl px-3 py-2 pr-8 outline-none cursor-pointer focus:ring-2 focus:ring-cyan-500/40 transition appearance-none"
                >
                  <option value={30}>30 Seconds (High Security)</option>
                  <option value={45}>45 Seconds (Fast Dynamic)</option>
                  <option value={60}>1 Minute (Standard)</option>
                  <option value={120}>2 Minutes</option>
                  <option value={300}>5 Minutes</option>
                  <option value={900}>15 Minutes</option>
                  <option value={3600}>1 Hour</option>
                  <option value={28800}>8 Hours (Full Shift Standee)</option>
                  <option value={86400}>24 Hours (Full Day Display)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-cyan-400">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Enable/Disable Button */}
              <button
                onClick={handleToggle}
                disabled={isToggling}
                className={`p-3 rounded-xl border flex items-center justify-between transition cursor-pointer text-left ${
                  isEnabled
                    ? "bg-emerald-950/20 border-emerald-800/40 hover:bg-emerald-950/40 text-emerald-300"
                    : "bg-amber-950/20 border-amber-800/40 hover:bg-amber-950/40 text-amber-300"
                }`}
              >
                <div>
                  <p className="text-xs font-extrabold">
                    {isEnabled ? "Deactivate QR Attendance" : "Activate QR Attendance"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {isEnabled ? "Allow employees to punch" : "Attendance currently paused"}
                  </p>
                </div>
                <PowerIcon className="w-5 h-5 flex-shrink-0" />
              </button>

              {/* Revoke Button */}
              <button
                onClick={handleRevoke}
                disabled={isRevoking}
                className="p-3 rounded-xl border bg-rose-950/20 border-rose-800/40 hover:bg-rose-950/40 text-rose-300 flex items-center justify-between transition cursor-pointer text-left"
              >
                <div>
                  <p className="text-xs font-extrabold">
                    {isRevoking ? "Revoking..." : "Revoke QR Code"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Invalidate all prior tokens immediately
                  </p>
                </div>
                <ExclamationTriangleIcon className="w-5 h-5 text-rose-400 flex-shrink-0" />
              </button>
            </div>

            {/* Revocation audit info */}
            {qrData?.lastRevokedAt && (
              <p className="text-[10px] text-amber-400/80 font-mono bg-amber-950/30 p-2 rounded-lg border border-amber-900/30">
                Last Revocation: {new Date(qrData.lastRevokedAt).toLocaleString()}
              </p>
            )}
          </div>

          {/* Live Recent QR Scans Audit Trail */}
          <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                <span>Real-Time QR Attendance Activity</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                Auto-updating • {recentScans.length} scans
              </span>
            </div>

            {recentScans.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No QR attendance scans recorded yet today for {selectedCompany.toUpperCase()}.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs font-medium text-slate-300">
                  <thead className="sticky top-0 bg-slate-950/90 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2">Employee</th>
                      <th>Time</th>
                      <th>Action</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-bold">
                    {recentScans.map((scan) => {
                      const isCheckOut = scan.checkOut && scan.checkOut !== "--";
                      return (
                        <tr key={scan.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-indigo-300 font-bold">
                                {scan.name?.charAt(0) || "E"}
                              </div>
                              <div>
                                <p className="text-white text-xs">{scan.name}</p>
                                <p className="font-mono text-[9px] text-slate-400">{scan.empId}</p>
                              </div>
                            </div>
                          </td>
                          <td className="font-mono text-slate-300 text-xs">
                            {isCheckOut ? scan.checkOut : scan.checkIn}
                          </td>
                          <td>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                isCheckOut
                                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              }`}
                            >
                              {isCheckOut ? "Punch Out" : "Punch In"}
                            </span>
                          </td>
                          <td>
                            <span className="text-[10px] text-slate-400">
                              {scan.status || "Present"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Kiosk Footer */}
      <div className="bg-slate-950/80 px-6 py-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
          <span>Strict Tenant Isolation • Cryptographic HMAC-SHA256 • Replay Protected</span>
        </div>
        <div className="font-mono text-slate-500">
          Technovani HRMS • Build 2026.10
        </div>
      </div>
    </div>
  );
};

export default CompanyQrAdminConsole;
