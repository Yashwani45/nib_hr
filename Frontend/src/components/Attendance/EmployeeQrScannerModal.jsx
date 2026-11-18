import React, { useState, useEffect, useRef } from "react";
import {
  XMarkIcon,
  CameraIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  QrCodeIcon,
  UserIcon,
  ClockIcon,
  BoltIcon,
  PhotoIcon
} from "@heroicons/react/24/outline";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import jsQR from "jsqr";
import { apiFetch } from "../../services/hrApi";
import { useAuth } from "../../auth/AuthProvider";

// Audio chime using Web Audio API
let globalAudioCtx = null;
const playChime = (type = "success") => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!globalAudioCtx || globalAudioCtx.state === "closed") {
      globalAudioCtx = new AudioContextClass();
    }
    if (globalAudioCtx.state === "suspended") {
      globalAudioCtx.resume();
    }
    const osc = globalAudioCtx.createOscillator();
    const gain = globalAudioCtx.createGain();
    osc.connect(gain);
    gain.connect(globalAudioCtx.destination);

    if (type === "success") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, globalAudioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, globalAudioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.18, globalAudioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, globalAudioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(globalAudioCtx.currentTime + 0.35);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, globalAudioCtx.currentTime);
      osc.frequency.setValueAtTime(190, globalAudioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, globalAudioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, globalAudioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(globalAudioCtx.currentTime + 0.35);
    }
  } catch (e) {}
};

export default function EmployeeQrScannerModal({
  isOpen = true,
  onClose,
  onSuccess
}) {
  const { user } = useAuth();
  const [scannerActive, setScannerActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");

  // Punch Mode: 'clock-in' | 'clock-out'
  const [punchMode, setPunchMode] = useState("clock-in");
  const punchModeRef = useRef("clock-in");

  // Punch Processing states
  const [processing, setProcessing] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { status, action, message, employee, time, checkInTime, checkOutTime, workingHours }
  const [manualInput, setManualInput] = useState("");

  // Token memory to prevent infinite frame bounce loops
  const lastScannedTokenRef = useRef("");
  const lastScannedActionRef = useRef("");
  const lastScanTimestampRef = useRef(0);
  const fileInputRef = useRef(null);

  const html5QrCodeRef = useRef(null);
  const isScanningRef = useRef(false);
  const animFrameRef = useRef(null);
  const offscreenCanvasRef = useRef(null);
  const readerElementId = "employee-qr-scanner-viewport";

  // Clean up any active scanner instance
  const cleanupScanner = async () => {
    isScanningRef.current = false;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (e) {}
      html5QrCodeRef.current = null;
    }
    setScannerActive(false);
  };

  // High-Speed jsQR Frame Loop
  const startFastJsQrLoop = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement("canvas");
    }
    const canvas = offscreenCanvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let lastScanTime = 0;

    const scanFrame = (timestamp) => {
      if (!isScanningRef.current) {
        animFrameRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      try {
        if (timestamp - lastScanTime >= 70) {
          lastScanTime = timestamp;
          const video = document.querySelector(`#${readerElementId} video`);

          if (video && video.videoWidth > 0 && video.videoHeight > 0) {
            const vw = video.videoWidth;
            const vh = video.videoHeight;
            const targetW = Math.min(640, vw);
            const targetH = Math.round((vh / vw) * targetW);

            if (canvas.width !== targetW || canvas.height !== targetH) {
              canvas.width = targetW;
              canvas.height = targetH;
            }

            ctx.drawImage(video, 0, 0, targetW, targetH);
            const imgData = ctx.getImageData(0, 0, targetW, targetH);

            if (imgData && imgData.data) {
              const code = jsQR(imgData.data, targetW, targetH, {
                inversionAttempts: "dontInvert",
              });

              if (code && code.data && code.data.trim()) {
                handleDecodedToken(code.data.trim());
              }
            }
          }
        }
      } catch (err) {}

      animFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameRef.current = requestAnimationFrame(scanFrame);
  };

  // Start Camera
  const startScanner = async (preferredCameraId = null) => {
    try {
      setIsInitializing(true);
      setCameraError("");

      await cleanupScanner();

      const devices = await Html5Qrcode.getCameras().catch(() => []);
      if (devices && devices.length > 0) {
        setCameras(devices);
      }

      let chosenId = preferredCameraId || selectedCameraId;
      if (!chosenId && devices && devices.length > 0) {
        const physicalCam = devices.find((d) => !/transcreen|virtual|obs|manycam/i.test(d.label)) || devices[0];
        chosenId = physicalCam.id;
      }
      if (chosenId) {
        setSelectedCameraId(chosenId);
      }

      const candidatesToTry = [];
      if (chosenId) candidatesToTry.push(chosenId);
      if (devices && devices.length > 0) {
        devices.forEach((d) => {
          if (d.id && d.id !== chosenId) candidatesToTry.push(d.id);
        });
      }
      candidatesToTry.push({ facingMode: "user" });
      candidatesToTry.push({ facingMode: "environment" });

      let started = false;
      let lastErr = null;

      for (const candidate of candidatesToTry) {
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
          const containerElem = document.getElementById(readerElementId);
          if (containerElem) {
            containerElem.innerHTML = "";
          }

          const html5QrCode = new Html5Qrcode(readerElementId, {
            verbose: false,
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          });
          html5QrCodeRef.current = html5QrCode;

          const scanConfig = {
            fps: 20,
            qrbox: (w, h) => {
              const edge = Math.floor(Math.min(w, h) * 0.85);
              return { width: edge, height: edge };
            },
            aspectRatio: 1.333333,
            disableFlip: false,
          };

          await html5QrCode.start(
            candidate,
            scanConfig,
            (decodedText) => handleDecodedToken(decodedText),
            () => {}
          );

          started = true;
          if (typeof candidate === "string") {
            setSelectedCameraId(candidate);
          } else if (candidate.deviceId) {
            setSelectedCameraId(typeof candidate.deviceId === "string" ? candidate.deviceId : candidate.deviceId.exact);
          }
          break;
        } catch (err) {
          lastErr = err;
          if (err?.name === "NotAllowedError" || String(err).toLowerCase().includes("permission")) {
            throw err;
          }
          if (String(err).includes("NotReadableError") || String(err).includes("video source")) {
            await new Promise((r) => setTimeout(r, 400));
          }
        }
      }

      if (!started) {
        throw lastErr || new Error("Failed to start video source.");
      }

      isScanningRef.current = true;
      setScannerActive(true);
      setCameraError("");

      startFastJsQrLoop();
    } catch (err) {
      console.error("Camera startup error:", err);
      const isPerm = err.name === "NotAllowedError" || String(err).toLowerCase().includes("permission");
      setCameraError(
        isPerm
          ? "Camera access is blocked in your browser. Please allow Camera permission."
          : err.message || "Unable to start webcam."
      );
      setScannerActive(false);
      isScanningRef.current = false;
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      const timer = setTimeout(() => {
        if (isMounted) startScanner();
      }, 150);

      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    } else {
      cleanupScanner();
      setScanResult(null);
      setManualInput("");
      setCameraError("");
      lastScannedTokenRef.current = "";
      lastScannedActionRef.current = "";
      lastScanTimestampRef.current = 0;
    }

    return () => {
      cleanupScanner();
    };
  }, [isOpen]);

  const handleCameraChange = (e) => {
    const newCameraId = e.target.value;
    setSelectedCameraId(newCameraId);
    startScanner(newCameraId);
  };

  // Process Scanned QR Token
  const handleDecodedToken = async (rawToken) => {
    const cleanToken = String(rawToken || "").trim();
    if (!cleanToken) return;

    const now = Date.now();
    const currentMode = punchModeRef.current || punchMode;

    if (
      lastScannedTokenRef.current === cleanToken &&
      lastScannedActionRef.current === currentMode &&
      now - lastScanTimestampRef.current < 2500
    ) {
      return;
    }

    isScanningRef.current = false;
    lastScannedTokenRef.current = cleanToken;
    lastScannedActionRef.current = currentMode;
    lastScanTimestampRef.current = now;

    setProcessing(true);
    playChime("success");

    try {
      let candidateCode = cleanToken;
      try {
        if (cleanToken.startsWith("{") && cleanToken.endsWith("}")) {
          const parsed = JSON.parse(cleanToken);
          candidateCode = parsed.code || parsed.token || parsed.employeeId || parsed.empId || cleanToken;
        }
      } catch (e) {}

      // 1. Identify Employee
      const identifyRes = await apiFetch("/api/operations/attendance/employee-qr/identify", {
        method: "POST",
        body: JSON.stringify({ qrToken: cleanToken, code: candidateCode }),
      });

      if (!identifyRes || !identifyRes.success || !identifyRes.data) {
        throw new Error(identifyRes?.error || identifyRes?.message || "Invalid or unrecognized employee QR badge.");
      }

      const empData = identifyRes.data;

      // 2. Confirm Punch
      const punchRes = await apiFetch("/api/operations/attendance/employee-qr/scan-punch", {
        method: "POST",
        body: JSON.stringify({
          qrToken: cleanToken,
          action: currentMode,
        }),
      });

      if (punchRes && punchRes.success && punchRes.data) {
        playChime("success");
        let recordedAction = punchRes.data.action || currentMode;
        if (recordedAction === "completed") {
          recordedAction = currentMode;
        }

        setScanResult({
          status: "success",
          action: recordedAction,
          mode: currentMode,
          message: punchRes.data.message || `Attendance ${recordedAction === "clock-in" ? "Check-In" : "Check-Out"} Recorded!`,
          employee: punchRes.data.employee || empData.employee,
          time: punchRes.data.time,
          checkInTime: punchRes.data.checkInTime || (recordedAction === "clock-in" ? punchRes.data.time : empData.checkInTime),
          checkOutTime: punchRes.data.checkOutTime || (recordedAction === "clock-out" ? punchRes.data.time : null),
          workingHours: punchRes.data.workingHours !== undefined ? punchRes.data.workingHours : "0.00",
          qrToken: cleanToken,
        });

        if (onSuccess) onSuccess(punchRes.data);
        window.dispatchEvent(new Event("silent-refresh"));

        if (recordedAction === "clock-in") {
          // Workflow: After check-in success, automatically switch to Check-Out mode and keep camera open
          setTimeout(() => {
            setPunchMode("clock-out");
            punchModeRef.current = "clock-out";
            lastScannedTokenRef.current = "";
            lastScannedActionRef.current = "";
            lastScanTimestampRef.current = 0;
            isScanningRef.current = true;
            if (!scannerActive || !html5QrCodeRef.current || !html5QrCodeRef.current.isScanning) {
              startScanner();
            } else {
              startFastJsQrLoop();
            }
          }, 2000);
        } else {
          // Re-arm camera after checkout
          setTimeout(() => {
            lastScannedTokenRef.current = "";
            lastScannedActionRef.current = "";
            lastScanTimestampRef.current = 0;
            isScanningRef.current = true;
            if (!scannerActive || !html5QrCodeRef.current || !html5QrCodeRef.current.isScanning) {
              startScanner();
            } else {
              startFastJsQrLoop();
            }
          }, 1800);
        }
      } else {
        throw new Error(punchRes?.error || punchRes?.message || "Failed to confirm attendance punch.");
      }
    } catch (err) {
      playChime("error");
      setScanResult({
        status: "error",
        message: err.message || "Failed to process Employee QR scan.",
      });
      setTimeout(() => {
        isScanningRef.current = true;
      }, 2500);
    } finally {
      setProcessing(false);
    }
  };

  const handleModeChange = (newMode) => {
    punchModeRef.current = newMode;
    setPunchMode(newMode);
    setProcessing(false);
    setManualInput("");
    lastScannedTokenRef.current = "";
    lastScannedActionRef.current = "";
    lastScanTimestampRef.current = 0;
    isScanningRef.current = true;

    if (!scannerActive || !html5QrCodeRef.current || !html5QrCodeRef.current.isScanning) {
      startScanner();
    } else {
      startFastJsQrLoop();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setProcessing(true);
      const tempScanner = html5QrCodeRef.current || new Html5Qrcode(readerElementId, { verbose: false });
      const decodedResult = await tempScanner.scanFile(file, true);
      if (decodedResult) {
        handleDecodedToken(decodedResult);
      }
    } catch (err) {
      playChime("error");
      setScanResult({
        status: "error",
        message: "Could not read QR code from image file. Please upload a clearer photo.",
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setProcessing(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleDecodedToken(manualInput.trim());
      setManualInput("");
    }
  };

  const handleNextEmployee = () => {
    setScanResult(null);
    setManualInput("");
    setPunchMode("clock-in");
    punchModeRef.current = "clock-in";
    lastScannedTokenRef.current = "";
    lastScannedActionRef.current = "";
    lastScanTimestampRef.current = 0;
    isScanningRef.current = true;
    if (!scannerActive || !html5QrCodeRef.current || !html5QrCodeRef.current.isScanning) {
      startScanner();
    } else {
      startFastJsQrLoop();
    }
  };

  if (!isOpen) return null;

  const todayFormatted = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date());

  const isCheckoutPunch =
    scanResult?.action === "clock-out" ||
    scanResult?.mode === "clock-out" ||
    Boolean(scanResult?.checkOutTime && scanResult.checkOutTime !== "--:--:--" && scanResult.checkOutTime !== "--" && scanResult.action !== "clock-in");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs select-none animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-6 sm:p-7 space-y-4 overflow-hidden">
        
        {/* 1. Header with QR Icon, Title, and Subtitle */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs shrink-0">
              <QrCodeIcon className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Employee Attendance QR Scanner
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Scan employee QR badge or phone camera for instant attendance.
              </p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              title="Close scanner"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* 2. Top Two Toggle Action Cards: 🟢 Punch Check-In & 🟠 Punch Check-Out */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* PUNCH CHECK-IN CARD */}
          <button
            type="button"
            onClick={() => handleModeChange("clock-in")}
            className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center gap-3.5 cursor-pointer text-left ${
              punchMode === "clock-in"
                ? "bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-300/40 shadow-xs"
                : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckIcon className="w-6 h-6 stroke-[3]" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm sm:text-base font-black text-slate-900">Punch Check-In</h4>
              <p className="text-xs text-slate-500 font-medium">Record Morning Check-In</p>
            </div>
          </button>

          {/* PUNCH CHECK-OUT CARD */}
          <button
            type="button"
            onClick={() => handleModeChange("clock-out")}
            className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center gap-3.5 cursor-pointer text-left ${
              punchMode === "clock-out"
                ? "bg-amber-50/70 border-amber-400 ring-2 ring-amber-300/40 shadow-xs"
                : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ClockIcon className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm sm:text-base font-black text-slate-900">Punch Check-Out</h4>
              <p className="text-xs text-slate-500 font-medium">Record Out-Time &amp; Complete Shift</p>
            </div>
          </button>
        </div>

        {/* 3. Active Mode Strip */}
        <div className="bg-blue-50/70 border border-blue-100 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <BoltIcon className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-700">Active Mode:</span>
            <span className={`inline-flex items-center gap-1.5 font-black uppercase tracking-wide ${
              punchMode === "clock-in" ? "text-emerald-700" : "text-amber-700"
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                punchMode === "clock-in" ? "bg-emerald-500 animate-ping" : "bg-amber-500 animate-ping"
              }`}></span>
              {punchMode === "clock-in" ? "CHECK-IN MODE" : "CHECK-OUT MODE"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <CameraIcon className="w-4 h-4 text-blue-600" />
            <span>Ultra-Speed Engine: Hold QR code in front of camera</span>
          </div>
        </div>

        {/* 4. Main Two-Column Layout (Left: Viewfinder Card | Right: Scan Result Card) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          
          {/* Left Column: Camera Viewport Card with Corner Reticle Brackets */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 flex flex-col items-center justify-center relative min-h-[250px] max-h-[280px] overflow-hidden">
            {/* HTML5 video element for active camera stream */}
            <div id={readerElementId} className="w-full h-full overflow-hidden rounded-xl"></div>

            {/* Viewfinder Reticle Overlay with Corner Brackets & QR Prompt */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
              <div className="relative w-36 h-36 flex flex-col items-center justify-center">
                {/* 4 Blue Corner Brackets matching design */}
                <span className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-blue-500 rounded-tl-xl shadow-xs"></span>
                <span className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-blue-500 rounded-tr-xl shadow-xs"></span>
                <span className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-blue-500 rounded-bl-xl shadow-xs"></span>
                <span className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-blue-500 rounded-br-xl shadow-xs"></span>

                {/* Central QR Code Icon */}
                <QrCodeIcon className="w-12 h-12 text-blue-500" />
              </div>

              {/* Text: Scan QR Code / Position the QR code inside the frame */}
              <div className="text-center mt-3 space-y-0.5">
                <h4 className="text-xs font-black text-slate-800">Scan QR Code</h4>
                <p className="text-[11px] text-slate-400 font-medium">Position the QR code inside the frame</p>
              </div>

              {/* Connecting State */}
              {isInitializing && (
                <div className="absolute inset-0 bg-slate-50/90 flex flex-col items-center justify-center text-slate-700 space-y-2 pointer-events-auto">
                  <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-bold">Connecting webcam...</p>
                </div>
              )}

              {/* Recording Status Pill */}
              {processing && (
                <div className="absolute bottom-3 px-3 py-1 bg-slate-900/90 text-cyan-300 text-[11px] font-bold rounded-full shadow-lg border border-cyan-500/30 animate-pulse pointer-events-auto">
                  ⚡ Recording Attendance...
                </div>
              )}
            </div>

            {/* Camera Error / Permission Notice */}
            {cameraError && !scannerActive && (
              <div className="absolute inset-0 bg-white/95 p-4 flex flex-col items-center justify-center text-center space-y-2 z-15">
                <ExclamationTriangleIcon className="w-8 h-8 text-amber-500" />
                <p className="text-xs text-slate-600 font-medium max-w-xs">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => startScanner(selectedCameraId)}
                  className="px-3.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Retry Camera
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Scan Result Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between shadow-xs min-h-[260px] max-h-[290px]">
            {/* Top row: Title + Status Pill */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs sm:text-sm font-black text-slate-900">Scan Result</h4>
              {scanResult ? (
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black flex items-center gap-1.5 border ${
                  scanResult.status === "error"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : isCheckoutPunch
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    scanResult.status === "error"
                      ? "bg-rose-500"
                      : isCheckoutPunch
                      ? "bg-amber-500 animate-pulse"
                      : "bg-emerald-500 animate-pulse"
                  }`}></span>
                  {scanResult.status === "error"
                    ? "Scan Error"
                    : isCheckoutPunch
                    ? "Check-Out Successful"
                    : "Check-In Successful"}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 bg-slate-50 text-slate-500 border border-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  Ready to Scan
                </span>
              )}
            </div>

            {/* Employee Profile Section */}
            {scanResult && scanResult.employee ? (
              <>
                <div className="flex items-center gap-3.5 py-1">
                  <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden text-slate-400 shadow-inner">
                    {scanResult.employee.photo ? (
                      <img src={scanResult.employee.photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                        {scanResult.employee.name}
                      </h3>
                      {scanResult.action && (
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border ${
                          isCheckoutPunch
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : "bg-emerald-100 text-emerald-800 border-emerald-200"
                        }`}>
                          {isCheckoutPunch ? "CHECK-OUT" : "CHECK-IN"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      ID: <span className="font-mono font-bold text-slate-700">{scanResult.employee.employeeCode || scanResult.employee.code || scanResult.employee.id}</span>
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      Department: <span className="text-slate-700">{scanResult.employee.department || "Operations"}</span>
                    </p>
                  </div>
                </div>

                {/* Check-In and Check-Out Time Grid */}
                <div className="grid grid-cols-2 gap-4 py-1.5 border-t border-slate-100">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                      <ClockIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Check-In</span>
                    </div>
                    <div className="text-sm sm:text-base font-black font-mono text-slate-900">
                      {scanResult.checkInTime || (scanResult.action === "clock-in" ? scanResult.time : "--:--:--")}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      {todayFormatted}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                      <ClockIcon className="w-3.5 h-3.5 text-amber-600" />
                      <span>Check-Out</span>
                    </div>
                    <div className="text-sm sm:text-base font-black font-mono text-slate-900">
                      {scanResult.checkOutTime || (scanResult.action === "clock-out" ? scanResult.time : "--:--:--")}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      {todayFormatted}
                    </div>
                  </div>
                </div>

                {/* Total Shift Duration Box with Next Employee button */}
                <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-blue-500 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 block leading-tight">Total Shift Duration</span>
                      <span className="text-xs font-black font-mono text-blue-900 leading-tight">
                        {scanResult.workingHours !== undefined && scanResult.workingHours !== null ? `${scanResult.workingHours} hrs` : "In Progress"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleNextEmployee}
                    className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Next Employee</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Empty State before QR code is scanned */}
                <div className="flex flex-col items-center justify-center py-4 text-center space-y-1.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-400">
                    <UserIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">Awaiting QR Scan</h4>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Position employee QR badge or enter code
                    </p>
                  </div>
                </div>

                {/* Placeholder Timestamps */}
                <div className="grid grid-cols-2 gap-4 py-1.5 border-t border-slate-100 opacity-60">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                      <ClockIcon className="w-3.5 h-3.5" />
                      <span>Check-In</span>
                    </div>
                    <div className="text-sm font-black font-mono text-slate-400">--:--:--</div>
                    <div className="text-[10px] text-slate-400 font-medium">{todayFormatted}</div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                      <ClockIcon className="w-3.5 h-3.5" />
                      <span>Check-Out</span>
                    </div>
                    <div className="text-sm font-black font-mono text-slate-400">--:--:--</div>
                    <div className="text-[10px] text-slate-400 font-medium">{todayFormatted}</div>
                  </div>
                </div>

                {/* Placeholder Duration */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center gap-2 opacity-60">
                  <ClockIcon className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block leading-tight">Total Shift Duration</span>
                    <span className="text-xs font-mono font-bold text-slate-400">-- hrs</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 5. Bottom Action Bar: Only Next Employee Button */}
        <div className="rounded-2xl border border-slate-200 p-2.5 bg-white flex items-center justify-end shadow-xs">
          <button
            type="button"
            onClick={handleNextEmployee}
            title="Reset and scan next employee"
            className="w-full sm:w-auto px-6 py-2 rounded-xl font-black text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-500 transition cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-[0.99]"
          >
            <UserIcon className="w-4 h-4" />
            <span>Next Employee</span>
          </button>
        </div>
      </div>
    </div>
  );
}
