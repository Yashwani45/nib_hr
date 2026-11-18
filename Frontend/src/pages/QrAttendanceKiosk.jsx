import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  QrCodeIcon,
  CameraIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  UserIcon,
  ClockIcon,
  BuildingOffice2Icon,
  SparklesIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowLeftIcon,
  CommandLineIcon
} from "@heroicons/react/24/outline";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { apiFetch } from "../services/hrApi";

// Audio chime using Web Audio API
const playChime = (type = "success") => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.setValueAtTime(180, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {}
};

export default function QrAttendanceKiosk() {
  const navigate = useNavigate();
  const [scannerActive, setScannerActive] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [cameraZoomRange, setCameraZoomRange] = useState(null);
  const [cameraZoom, setCameraZoom] = useState(1);
  const [cameraZoomError, setCameraZoomError] = useState("");
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Punch Processing states
  const [processing, setProcessing] = useState(false);
  const [verifiedEmployee, setVerifiedEmployee] = useState(null);
  const [scanResult, setScanResult] = useState(null); // { status, action, message, employee, time, workingHours }
  const [recentPunches, setRecentPunches] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Manual USB scanner input
  const [manualInput, setManualInput] = useState("");
  const usbInputRef = useRef(null);

  const html5QrCodeRef = useRef(null);
  const isScanningRef = useRef(false);
  const processedTokensHistoryRef = useRef(new Map());
  const readerElementId = "kiosk-qr-scanner-viewport";

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial cameras
  useEffect(() => {
    let mounted = true;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!mounted) return;
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back/environment camera on phones, first camera on laptop
          const backCam = devices.find(d => /back|rear|environment/i.test(d.label));
          const chosenId = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(chosenId);
          startScanner(chosenId);
        } else {
          setCameraPermissionDenied(true);
        }
      })
      .catch((err) => {
        console.warn("Camera enumeration error:", err);
        setCameraPermissionDenied(true);
      });

    return () => {
      mounted = false;
      stopScanner();
    };
  }, []);

  // Start Scanner
  const startScanner = async (cameraId) => {
    try {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
          html5QrCodeRef.current.clear();
        } catch (_) {}
        html5QrCodeRef.current = null;
      }
      isScanningRef.current = false;

      const container = document.getElementById(readerElementId);
      if (container) {
        container.innerHTML = "";
      }

      const html5QrCode = new Html5Qrcode(readerElementId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      html5QrCodeRef.current = html5QrCode;

      const cameraConfig = cameraId || { facingMode: "environment" };
      const cameraConstraints = typeof cameraConfig === "string"
        ? {
            deviceId: { exact: cameraConfig },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
        : {
            ...cameraConfig,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          };

      await html5QrCode.start(
        cameraConfig,
        {
          fps: 15,
          disableFlip: true,
          videoConstraints: cameraConstraints,
        },
        handleQrScanDecoded,
        () => {} // silent on scan failure frames
      );

      isScanningRef.current = true;
      setScannerActive(true);
      setCameraPermissionDenied(false);
    } catch (err) {
      console.error("Camera startup error:", err);
      setScannerActive(false);
      if (err.name === "NotAllowedError" || String(err).includes("Permission")) {
        setCameraPermissionDenied(true);
      }
    }
  };

  // Stop Scanner
  const stopScanner = async () => {
    if (html5QrCodeRef.current && isScanningRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {}
      isScanningRef.current = false;
    }
    setScannerActive(false);
  };

  // Scanned QR string handler
  const handleQrScanDecoded = (decodedText) => {
    if (processing || !isScanningRef.current) return;
    const token = decodedText ? decodedText.trim() : "";
    if (!token) return;

    // Anti-rapid re-scan guard (15 seconds)
    const lastProcessedTime = processedTokensHistoryRef.current.get(token);
    if (lastProcessedTime && (Date.now() - lastProcessedTime) < 15000) {
      return;
    }

    isScanningRef.current = false;
    processToken(token);
  };

  // Verify the badge and show attendance choices before recording a punch.
  const processToken = async (qrToken) => {
    if (!qrToken || !qrToken.trim()) return;
    setProcessing(true);

    try {
      const res = await apiFetch("/api/operations/attendance/employee-qr/identify", {
        method: "POST",
        body: JSON.stringify({ qrToken: qrToken.trim() })
      });

      if (res?.success && res.data) {
        if (soundEnabled) playChime("success");
        setVerifiedEmployee({ ...res.data, qrToken: qrToken.trim() });
      } else {
        if (soundEnabled) playChime("error");
        setScanResult({
          status: "error",
          message: res?.error || res?.message || "Employee QR verification failed.",
        });
        setTimeout(() => {
          setScanResult(null);
          setProcessing(false);
          isScanningRef.current = true;
        }, 2000);
      }
    } catch (err) {
      if (soundEnabled) playChime("error");
      setScanResult({
        status: "error",
        message: err.message || "Attendance punch failed.",
      });
      setTimeout(() => {
        setScanResult(null);
        setProcessing(false);
        isScanningRef.current = true;
      }, 2000);
    }
  };

  const handleConfirmAttendance = async (action) => {
    if (!verifiedEmployee?.qrToken || processing === false) return;

    try {
      const res = await apiFetch("/api/operations/attendance/employee-qr/scan-punch", {
      method: "POST",
      body: JSON.stringify({ qrToken: verifiedEmployee.qrToken, action })
      });

      if (res?.success && res.data) {
      processedTokensHistoryRef.current.set(verifiedEmployee.qrToken, Date.now());
      if (soundEnabled) playChime("success");
      const punchData = {
        status: "success",
        action: res.data.action,
        message: res.message || "Attendance recorded successfully.",
        employee: res.data.employee,
        time: res.data.time,
        checkInTime: res.data.checkInTime,
        checkOutTime: res.data.checkOutTime,
        workingHours: res.data.workingHours,
        date: res.data.date,
      };
      setVerifiedEmployee(null);
      setScanResult(punchData);
      setRecentPunches((prev) => [punchData, ...prev.slice(0, 9)]);
      setTimeout(() => {
        setScanResult(null);
        setProcessing(false);
        isScanningRef.current = true;
      }, 2000);
      } else {
      throw new Error(res?.error || res?.message || "Attendance punch failed.");
      }
    } catch (err) {
      if (soundEnabled) playChime("error");
      setVerifiedEmployee(null);
      setScanResult({ status: "error", message: err.message || "Attendance punch failed." });
      setTimeout(() => {
      setScanResult(null);
      setProcessing(false);
      isScanningRef.current = true;
      }, 2000);
    }
  };

  const handleScanNext = () => {
    setVerifiedEmployee(null);
    setScanResult(null);
    setProcessing(false);
    isScanningRef.current = true;
  };

  const handleCameraZoomChange = (value) => {
    const zoom = Number(value);
    setCameraZoom(zoom);
    setCameraZoomError("");
    try {
      const videoElem = document.querySelector(`#${readerElementId} video`);
      if (videoElem) {
        videoElem.style.transform = `scale(${zoom})`;
        videoElem.style.transformOrigin = "center center";
        videoElem.style.transition = "transform 0.2s ease-out";
      }
    } catch (_) {}
  };

  // USB Scanner / Manual Enter form
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      processToken(manualInput.trim());
      setManualInput("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none">
      {/* Top Header Bar */}
      <header className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
            title="Go Back"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <QrCodeIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>Employee QR Attendance Kiosk</span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-full uppercase tracking-wider animate-pulse">
                Live Scanner
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Show your Employee QR ID Card to camera • Instant Clock-In & Clock-Out
            </p>
          </div>
        </div>

        {/* Live Clock & Camera Switcher */}
        <div className="flex items-center gap-3">
          {cameras.length > 1 && (
            <select
              value={selectedCameraId}
              onChange={(e) => {
                const newId = e.target.value;
                setSelectedCameraId(newId);
                startScanner(newId);
              }}
              className="bg-slate-800 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {cameras.map((c, i) => (
                <option key={c.id} value={c.id}>
                  📷 {c.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              soundEnabled
                ? "bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700"
                : "bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700"
            }`}
            title={soundEnabled ? "Sound Effects ON" : "Sound Muted"}
          >
            {soundEnabled ? <SpeakerWaveIcon className="w-5 h-5" /> : <SpeakerXMarkIcon className="w-5 h-5" />}
          </button>

          <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-2 rounded-xl flex items-center gap-2 font-mono text-xs font-bold text-slate-200">
            <ClockIcon className="w-4 h-4 text-indigo-400 animate-spin-slow" />
            <span>{currentTime.toLocaleTimeString([], { hour12: true })}</span>
          </div>
        </div>
      </header>

      {/* Main Kiosk Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Scanner Viewport & Scan Feedback */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {cameraZoomRange && (
            <label className="flex items-center gap-3 max-w-sm text-xs font-bold text-slate-300">
              <span className="whitespace-nowrap">QR Zoom (far)</span>
              <input
                type="range"
                min={cameraZoomRange.min}
                max={cameraZoomRange.max}
                step={cameraZoomRange.step}
                value={cameraZoom}
                onChange={(event) => handleCameraZoomChange(event.target.value)}
                className="w-full accent-indigo-500"
                aria-label="Camera zoom for distant QR codes"
              />
            </label>
          )}
          {!cameraZoomRange && scannerActive && (
            <p className="text-xs text-slate-400">
            Is camera me zoom supported nahi hai; far scan camera resolution par depend karega.
            </p>
          )}
          {cameraZoomError && <p className="text-xs text-rose-400">{cameraZoomError}</p>}
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-center min-h-[420px]">
            {/* HTML5 QR Code Mount Element (Undistorted Natural Aspect Ratio) */}
            <div
              id={readerElementId}
              className="w-full max-w-[480px] rounded-2xl overflow-hidden"
            />

            {/* Scanning Overlay Grid Frame */}
            {scannerActive && !scanResult && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-64 h-64 border-2 border-indigo-500/60 rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.25)] flex items-center justify-center">
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-xl" />

                  {/* Laser Scan Animation */}
                  <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-laser-scan shadow-[0_0_12px_#38bdf8]" />

                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-200/80 bg-slate-950/80 px-3 py-1 rounded-full border border-indigo-500/30 backdrop-blur-xs">
                    Align Employee QR
                  </span>
                </div>
              </div>
            )}

            {/* Permission Denied Notice */}
            {cameraPermissionDenied && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <CameraIcon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Camera Permission Needed</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Please allow camera access in browser settings to scan employee QR badges.
                  </p>
                </div>
                <button
                  onClick={() => startScanner(selectedCameraId)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>Retry Camera</span>
                </button>
              </div>
            )}

            {/* Fullscreen Overlay: Success Scan Result */}
            {scanResult && scanResult.status === "success" && (
              <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center z-20 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-20 h-20 rounded-full border-4 border-emerald-400 overflow-hidden mb-3 bg-slate-800 shadow-xl shadow-emerald-500/20">
                  {scanResult.employee?.photo ? (
                    <img src={scanResult.employee.photo} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-black text-emerald-400 bg-emerald-500/10">
                      {scanResult.employee?.name?.[0] || "E"}
                    </div>
                  )}
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                  <span>{scanResult.action === "clock-in" ? "Clocked In Successfully" : "Clocked Out Successfully"}</span>
                </div>

                <h2 className="text-2xl font-black text-white tracking-tight">{scanResult.employee?.name}</h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Code: <b className="text-white">{scanResult.employee?.employeeCode}</b> • {scanResult.employee?.department || "Operations"}
                </p>

                <div className="mt-4 p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center gap-6 min-w-[280px]">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Time</span>
                    <span className="text-base font-black font-mono text-cyan-300">{scanResult.time}</span>
                  </div>
                  {scanResult.workingHours !== undefined && scanResult.workingHours > 0 && (
                    <div className="border-l border-slate-800 pl-6">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Shift Duration</span>
                      <span className="text-base font-black font-mono text-emerald-300">{scanResult.workingHours} hrs</span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 mt-4 flex items-center gap-1.5 animate-pulse">
                  <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                  <span>Next scan ready in 3 seconds...</span>
                </p>
              </div>
            )}

            {/* Overlay: Error Scan Result */}
            {scanResult && scanResult.status === "error" && (
              <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center z-20 animate-in fade-in duration-200">
                <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mb-3">
                  <ExclamationTriangleIcon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-white">Verification Failed</h3>
                <p className="text-xs text-rose-300 max-w-sm mt-1">{scanResult.message}</p>
                <p className="text-[11px] text-slate-500 mt-4 animate-pulse">
                  Resetting scanner...
                </p>
              </div>
            )}
          </div>

          {/* USB Barcode / QR Scanner Input Field */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <CommandLineIcon className="w-5 h-5 text-indigo-400 shrink-0" />
              <span><b>USB Barcode Gun:</b> Plug scanner in USB port and trigger. Auto-punches on scan.</span>
            </div>
            <form onSubmit={handleManualSubmit} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                ref={usbInputRef}
                type="text"
                placeholder="Scan / paste token..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs px-3 py-1.5 rounded-xl font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-48"
              />
              <button
                type="submit"
                disabled={!manualInput.trim()}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Punch
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Instructions & Real-time Live Log */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Quick Guide */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-black uppercase text-indigo-300 tracking-wider flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-indigo-400" />
              <span>How To Use Kiosk</span>
            </h3>
            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside font-medium leading-relaxed">
              <li>
                Employee shows their <b>Employee QR Badge</b> (printed PVC card or on their phone screen) within 6-12 inches of camera.
              </li>
              <li>
                <b>1st Scan of the Day:</b> Automatically clocks in as <b>Present</b>.
              </li>
              <li>
                <b>2nd Scan of the Day:</b> Automatically clocks out and records total hours worked.
              </li>
              <li>
                Tamper-proof HMAC cryptographic verification guarantees authenticity.
              </li>
            </ol>
          </div>

          {/* Real-time Today Scans Stream */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span>Recent Kiosk Punches</span>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded-full">
                  {recentPunches.length}
                </span>
              </h3>
              <span className="text-[10px] font-bold text-slate-500">Live Session Log</span>
            </div>

            <div className="mt-3 space-y-2.5 overflow-y-auto max-h-[360px] pr-1">
              {recentPunches.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs font-semibold">
                  No employee scans in this session yet. Waiting for first badge scan...
                </div>
              ) : (
                recentPunches.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-indigo-400 text-xs shrink-0 overflow-hidden">
                        {p.employee?.photo ? (
                          <img src={p.employee.photo} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          p.employee?.name?.[0] || "E"
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-white truncate">{p.employee?.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {p.employee?.employeeCode} • {p.employee?.department}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          p.action === "clock-in"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        }`}
                      >
                        {p.action === "clock-in" ? "Clock In" : "Clock Out"}
                      </span>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">{p.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
