import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  QrCodeIcon,
  CameraIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  ArrowUpTrayIcon,
  SparklesIcon,
  TvIcon
} from "@heroicons/react/24/outline";
import { apiFetch } from "../../services/hrApi";
import { useAuth } from "../../auth/AuthProvider";

// Play audio feedback using Web Audio API
const playChime = (type = "success") => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === "success") {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc1.frequency.setValueAtTime(880, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc1.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.35);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {}
};

const CompanyQrScannerModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("scanner"); // "scanner" | "display"
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [facingMode, setFacingMode] = useState("environment"); // "environment" | "user"
  const [isScanning, setIsScanning] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [cameraError, setCameraError] = useState(null);

  // Scan punch result state
  const [submitting, setSubmitting] = useState(false);
  const [punchResult, setPunchResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Office QR Display state (so users can see the code directly on-screen)
  const [officeQrData, setOfficeQrData] = useState(null);
  const [officeQrLoading, setOfficeQrLoading] = useState(false);
  const [officeTimeLeft, setOfficeTimeLeft] = useState(45);

  const html5QrCodeRef = useRef(null);
  const lastScannedTextRef = useRef(null);
  const officeTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch live Company QR for display
  const fetchOfficeQr = async () => {
    setOfficeQrLoading(true);
    try {
      const companyCode = user?.companyCode || user?.company || "YASHTECH";
      const res = await apiFetch(`/api/operations/attendance/company-qr/token?companyCode=${companyCode}&rotationSeconds=45`);
      const data = res?.data || res;
      if (data && data.token) {
        setOfficeQrData(data);
        setOfficeTimeLeft(45);
      }
    } catch (err) {
      console.error("Error fetching office QR:", err);
    } finally {
      setOfficeQrLoading(false);
    }
  };

  // Rotation timer for office QR display
  useEffect(() => {
    if (activeTab === "display" && isOpen) {
      fetchOfficeQr();
      officeTimerRef.current = setInterval(() => {
        setOfficeTimeLeft((prev) => {
          if (prev <= 1) {
            fetchOfficeQr();
            return 45;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (officeTimerRef.current) clearInterval(officeTimerRef.current);
      };
    }
  }, [activeTab, isOpen]);

  // Stop scanner safely
  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      }
    } catch (e) {}
    setIsScanning(false);
  };

  // Start scanner
  const startScanner = async () => {
    if (activeTab !== "scanner") return;
    setCameraLoading(true);
    setCameraError(null);
    lastScannedTextRef.current = null;

    try {
      await stopScanner();

      const html5QrCode = new Html5Qrcode("company-qr-reader");
      html5QrCodeRef.current = html5QrCode;

      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        throw new Error("No camera detected on this device. You can use 'Upload QR Image' or switch to 'View Office QR' tab.");
      }
      setCameras(devices);

      const cameraId = selectedCameraId || devices[0].id;
      const config = {
        fps: 20,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      };

      try {
        await html5QrCode.start({ facingMode: facingMode }, config, handleScanSuccess, () => {});
      } catch (modeErr) {
        await html5QrCode.start(cameraId, config, handleScanSuccess, () => {});
      }

      setIsScanning(true);
      setCameraLoading(false);
    } catch (err) {
      const isPermDenied = err?.name === "NotAllowedError" || (err?.message || "").toLowerCase().includes("permission");
      const friendlyError = isPermDenied
        ? "Camera permission denied. Please allow camera access in your browser address bar settings to scan the office QR code."
        : (err?.message || "Could not access device camera. Please check camera permissions.");
      setCameraError(friendlyError);
      setCameraLoading(false);
      setIsScanning(false);
    }
  };

  // Get device geolocation coordinates for office presence verification
  const getDeviceCoordinates = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => {
          console.warn("Geolocation coordinate acquisition skipped/unavailable:", err.message);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
      );
    });
  };

  // Scan Success Handler (Submits to Backend)
  const handleScanSuccess = async (decodedText) => {
    if (!decodedText || submitting) return;

    if (lastScannedTextRef.current === decodedText) return;
    lastScannedTextRef.current = decodedText;

    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.pause(true);
      }
    } catch (e) {}

    setSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Capture geolocation coordinates (if available on mobile device)
      const coords = await getDeviceCoordinates();

      const payload = {
        qrToken: decodedText.trim(),
        ...(coords ? {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        } : {})
      };

      let res;
      try {
        res = await apiFetch("/api/operations/attendance/company-qr/scan-punch", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } catch (companyErr) {
        try {
          res = await apiFetch("/api/operations/attendance/employee-qr/scan-punch", {
            method: "POST",
            body: JSON.stringify({ qrToken: decodedText.trim() }),
          });
        } catch (empErr) {
          throw companyErr;
        }
      }

      const data = res?.data || res;
      if (data && (data.success || data.action)) {
        playChime("success");
        setPunchResult(data);
        if (onSuccess) onSuccess(data);
        window.dispatchEvent(new Event("silent-refresh"));
      } else {
        throw new Error(res?.message || "Failed to record QR attendance punch.");
      }
    } catch (err) {
      playChime("error");
      setErrorMessage(
        err?.message || "Invalid or rejected QR code. Please scan the current code on the screen."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Upload QR Image File Scan
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("company-qr-reader");
      }
      const decodedText = await html5QrCodeRef.current.scanFile(file, true);
      if (decodedText) {
        await handleScanSuccess(decodedText);
      }
    } catch (err) {
      setErrorMessage("No valid Company QR code found in this image. Please upload a clear photo of the company QR.");
      setSubmitting(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Direct 1-Click Test Punch (For Single-Laptop Testing)
  const handleOneClickTestPunch = async () => {
    if (!officeQrData?.token) {
      await fetchOfficeQr();
    }
    const token = officeQrData?.token;
    if (token) {
      await handleScanSuccess(token);
    }
  };

  // Resume scanning for another punch
  const handleScanAgain = () => {
    setPunchResult(null);
    setErrorMessage(null);
    lastScannedTextRef.current = null;
    if (activeTab === "scanner") {
      setTimeout(() => {
        startScanner();
      }, 150);
    }
  };

  // Tab switch
  const handleTabChange = async (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setPunchResult(null);
    setErrorMessage(null);
    if (tab === "display") {
      await stopScanner();
      fetchOfficeQr();
    } else {
      setTimeout(() => startScanner(), 200);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === "scanner") {
      const t = setTimeout(() => startScanner(), 300);
      return () => clearTimeout(t);
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
      if (officeTimerRef.current) clearInterval(officeTimerRef.current);
    };
  }, [isOpen, activeTab, facingMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <QrCodeIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Company QR Attendance
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Scan office screen QR code or display live code to scan
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* View Mode Switcher: Camera Scanner vs Office QR Display */}
        <div className="bg-slate-950/60 p-2 border-b border-slate-800 flex gap-2">
          <button
            onClick={() => handleTabChange("scanner")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "scanner"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
            }`}
          >
            <CameraIcon className="w-4 h-4" />
            <span>📷 Camera Scanner</span>
          </button>
          <button
            onClick={() => handleTabChange("display")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "display"
                ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
            }`}
          >
            <TvIcon className="w-4 h-4" />
            <span>🏢 Office QR Code (Display)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 flex flex-col items-center">
          {/* Punch Success Card */}
          {punchResult ? (
            <div className="w-full bg-slate-950/80 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-4 animate-scale-up">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircleIcon className="w-10 h-10" />
              </div>
              <div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    punchResult.action === "clock-out"
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  }`}
                >
                  {punchResult.action === "clock-out" ? "PUNCH OUT RECORDED" : "PUNCH IN RECORDED"}
                </span>
                <h4 className="text-xl font-black text-white mt-2">
                  {punchResult.employee?.name}
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: {punchResult.employee?.empId} • {punchResult.employee?.department}
                </p>
              </div>

              <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 grid grid-cols-2 gap-2 text-left">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Time</span>
                  <span className="font-mono text-white text-sm font-bold flex items-center gap-1 mt-0.5">
                    <ClockIcon className="w-3.5 h-3.5 text-cyan-400" />
                    {punchResult.time}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Company</span>
                  <span className="text-white text-sm font-bold truncate block mt-0.5">
                    {punchResult.company?.name || punchResult.company?.code?.toUpperCase()}
                  </span>
                </div>
              </div>

              <p className="text-xs text-emerald-300 font-medium">{punchResult.message}</p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleScanAgain}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <ArrowPathIcon className="w-4 h-4 text-cyan-400" />
                  <span>Scan Another</span>
                </button>
                <button
                  onClick={() => {
                    stopScanner();
                    onClose();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : activeTab === "display" ? (
            /* TAB 2: OFFICE QR CODE DISPLAY (For Users to see the code & scan from phone) */
            <div className="w-full flex flex-col items-center text-center space-y-4">
              <div className="p-3 bg-white rounded-3xl border-4 border-indigo-500/40 shadow-2xl relative">
                {officeQrLoading ? (
                  <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-500 gap-2">
                    <ArrowPathIcon className="w-8 h-8 animate-spin text-indigo-500" />
                    <span className="text-xs font-bold">Generating Live QR...</span>
                  </div>
                ) : officeQrData?.qrDataUrl ? (
                  <img
                    src={officeQrData.qrDataUrl}
                    alt="Company QR Code"
                    className="w-56 h-56 object-contain"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-500">
                    Failed to load QR code
                  </div>
                )}
              </div>

              {/* Countdown Bar */}
              <div className="w-full max-w-xs space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-400">
                  <span className="flex items-center gap-1">
                    <ArrowPathIcon className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                    Auto-refreshes in:
                  </span>
                  <span className="font-mono text-cyan-300 text-xs">{officeTimeLeft}s</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-1000"
                    style={{ width: `${(officeTimeLeft / 45) * 100}%` }}
                  />
                </div>
              </div>

              {/* Instruction Banner */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 max-w-sm text-left text-xs text-slate-300 space-y-1">
                <p className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <SparklesIcon className="w-4 h-4" />
                  <span>How to scan this code:</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  • Apne mobile phone camera se is code ko scan karein.<br />
                  • Ya neeche diye gaye <strong>One-Click Test Punch</strong> button se direct attendance verify karein!
                </p>
              </div>

              {/* 1-Click Test Punch Button (For Single-Laptop Testing) */}
              <button
                onClick={handleOneClickTestPunch}
                disabled={submitting}
                className="w-full max-w-sm py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <SparklesIcon className="w-4 h-4 text-cyan-200" />
                <span>{submitting ? "Processing..." : "⚡ 1-Click Test Punch (Scan Now)"}</span>
              </button>
            </div>
          ) : (
            /* TAB 1: CAMERA SCANNER (Camera live feed) */
            <>
              {/* Camera Frame */}
              <div className="relative w-full aspect-square max-w-xs bg-black rounded-3xl overflow-hidden border-2 border-slate-700 shadow-inner flex items-center justify-center">
                <div id="company-qr-reader" className="w-full h-full" />

                {isScanning && !submitting && !cameraError && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-cyan-400/80 rounded-2xl relative shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-300" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-cyan-300" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-cyan-300" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-300" />
                      <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-laser-scan shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                    </div>
                  </div>
                )}

                {(cameraLoading || submitting) && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-white p-4">
                    <ArrowPathIcon className="w-8 h-8 text-cyan-400 animate-spin" />
                    <span className="text-xs font-bold text-center">
                      {submitting ? "Verifying Token & Recording Punch..." : "Starting Camera Feed..."}
                    </span>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center gap-2 p-6 text-center text-rose-400">
                    <ExclamationTriangleIcon className="w-10 h-10" />
                    <span className="text-xs font-bold">{cameraError}</span>
                    <button
                      onClick={startScanner}
                      className="mt-3 px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <ArrowPathIcon className="w-3.5 h-3.5" />
                      <span>Retry Camera</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="w-full max-w-xs mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-bold text-rose-400 flex items-start gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                  <div className="flex-1">
                    <span>{errorMessage}</span>
                    <button
                      onClick={handleScanAgain}
                      className="block text-[11px] underline text-cyan-400 hover:text-cyan-300 mt-1 font-semibold cursor-pointer"
                    >
                      Try scanning again
                    </button>
                  </div>
                </div>
              )}

              {/* Controls: Switch Camera & Upload QR Image */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CameraIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Switch Camera ({facingMode === "environment" ? "Rear" : "Front"})</span>
                </button>

                {/* Upload Image Option */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                  title="Upload a saved QR code image or screenshot to scan"
                >
                  <ArrowUpTrayIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Upload QR Image</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
            <span>Authenticated as <strong>{user?.name || user?.email}</strong></span>
          </div>
          <span className="font-mono text-slate-500">
            {user?.companyCode || user?.company || "YASHTECH"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CompanyQrScannerModal;
