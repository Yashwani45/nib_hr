import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
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
  CommandLineIcon,
  ShieldCheckIcon,
  QrCodeIcon,
  XMarkIcon,
  ArrowRightIcon,
  PhotoIcon
} from "@heroicons/react/24/outline";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import jsQR from "jsqr";
import { apiFetch } from "../services/hrApi";
import { useAuth } from "../auth/AuthProvider";

// Audio chime using Web Audio API (singleton to prevent handle/memory leaks)
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

export default function AdminEmployeeQrScannerPage({ standalone = false, onBackToDirectory = null }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [scannerActive, setScannerActive] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Core Attendance Punch Mode: 'clock-in' | 'clock-out'
  const [punchMode, setPunchMode] = useState("clock-in");
  const punchModeRef = useRef("clock-in");

  // Verification & Confirmation States
  const [verifying, setVerifying] = useState(false);
  const [punchSuccess, setPunchSuccess] = useState(null); // Success message payload
  const [errorMessage, setErrorMessage] = useState("");
  const [recentPunches, setRecentPunches] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // USB Hardware scanner input fallback
  const [usbInput, setUsbInput] = useState("");
  const usbInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const html5QrCodeRef = useRef(null);
  const isScanningRef = useRef(false);
  const animFrameRef = useRef(null);
  const offscreenCanvasRef = useRef(null);
  const lastScannedTokenRef = useRef("");
  const lastScannedActionRef = useRef("");
  const lastScanTimestampRef = useRef(0);
  const readerElementId = "admin-employee-qr-viewport";

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Enumerate cameras
  const discoverCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras().catch(() => []);
      if (devices && devices.length > 0) {
        setCameras(devices);
        return devices;
      }
    } catch (err) {
      console.warn("Camera discovery notice:", err?.message || err);
    }
    return [];
  };

  // Lightweight, Zero-Leak jsQR Frame Loop
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
        // Evaluate frames every 70ms (~14 fps) - light on CPU, decodes in < 1s
        if (timestamp - lastScanTime >= 70) {
          lastScanTime = timestamp;
          const video = document.querySelector(`#${readerElementId} video`);

          if (video && video.videoWidth > 0 && video.videoHeight > 0) {
            const vw = video.videoWidth;
            const vh = video.videoHeight;

            // Target fixed 640px width - NEVER dynamically change width/height repeatedly to avoid GPU memory leaks
            const targetW = Math.min(640, vw);
            const targetH = Math.round((vh / vw) * targetW);

            if (canvas.width !== targetW || canvas.height !== targetH) {
              canvas.width = targetW;
              canvas.height = targetH;
            }

            ctx.drawImage(video, 0, 0, targetW, targetH);
            const imgData = ctx.getImageData(0, 0, targetW, targetH);

            let qrCode = null;
            try {
              qrCode = jsQR(imgData.data, targetW, targetH, {
                inversionAttempts: "attemptBoth"
              });
            } catch (_) {}

            if (qrCode && qrCode.data && qrCode.data.trim()) {
              handleQrScanDecoded(qrCode.data.trim());
            }
          }
        }
      } catch (err) {
        console.warn("Scan frame notice:", err);
      }

      animFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameRef.current = requestAnimationFrame(scanFrame);
  };

  // Start Scanner
  const startScanner = async (preferredCameraId) => {
    try {
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
      isScanningRef.current = false;

      // Clean container DOM
      const container = document.getElementById(readerElementId);
      if (container) {
        container.innerHTML = "";
      }

      // Step 1: Query cameras
      const devices = await discoverCameras();

      // Step 2: Build prioritized configurations
      const configsToTry = [];
      let chosenId = preferredCameraId || selectedCameraId;
      if (!chosenId && devices.length > 0) {
        const physicalCam = devices.find((d) => !/transcreen|virtual|obs|manycam/i.test(d.label)) || devices[0];
        chosenId = physicalCam.id;
      }

      if (chosenId) {
        configsToTry.push(chosenId);
      }

      devices.forEach((d) => {
        if (d.id && d.id !== chosenId) {
          configsToTry.push(d.id);
        }
      });

      configsToTry.push({ facingMode: "user" });
      configsToTry.push({ facingMode: "environment" });

      let started = false;
      let lastErr = null;

      for (const config of configsToTry) {
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

          // Pure ZXing decoder with native BarcodeDetector explicitly disabled
          const html5QrCode = new Html5Qrcode(readerElementId, {
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            verbose: false,
            useBarCodeDetectorIfSupported: false,
            experimentalFeatures: { useBarCodeDetectorIfSupported: false },
          });
          html5QrCodeRef.current = html5QrCode;

          const cameraConstraints =
            typeof config === "string"
              ? {
                  deviceId: { exact: config },
                  width: { ideal: 1280, min: 640 },
                  height: { ideal: 720, min: 480 },
                }
              : {
                  ...config,
                  width: { ideal: 1280, min: 640 },
                  height: { ideal: 720, min: 480 },
                };

          await html5QrCode.start(
            config,
            {
              fps: 10,
              disableFlip: true,
              videoConstraints: cameraConstraints,
            },
            handleQrScanDecoded,
            () => {}
          );
          started = true;
          if (typeof config === "string") {
            setSelectedCameraId(config);
          } else if (config?.deviceId) {
            setSelectedCameraId(typeof config.deviceId === "string" ? config.deviceId : config.deviceId.exact);
          }
          break;
        } catch (err) {
          lastErr = err;
          console.warn("Camera attempt notice:", config, err.message || err);
          if (String(err).includes("NotReadableError") || String(err).includes("video source")) {
            await new Promise((r) => setTimeout(r, 400));
          }
        }
      }

      if (!started) {
        throw lastErr || new Error("Failed to start camera");
      }

      isScanningRef.current = true;
      setScannerActive(true);
      setCameraPermissionDenied(false);

      // Launch auxiliary high-speed jsQR frame engine
      startFastJsQrLoop();

      discoverCameras().then((devs) => {
        if (devs && devs.length > 0 && !selectedCameraId) {
          const physicalCam = devs.find((d) => !/transcreen|virtual|obs|manycam/i.test(d.label)) || devs[0];
          setSelectedCameraId(physicalCam.id);
        }
      });
    } catch (err) {
      console.error("Camera startup error:", err);
      setScannerActive(false);
      if (err.name === "NotAllowedError" || String(err).toLowerCase().includes("permission")) {
        setCameraPermissionDenied(true);
      }
    }
  };

  // Pause Scanner frame processing
  const pauseScanner = () => {
    isScanningRef.current = false;
  };

  // Resume Scanner for next punch or employee
  const resumeScanner = (newMode = null) => {
    const targetMode = newMode || punchModeRef.current || punchMode;
    punchModeRef.current = targetMode;
    setPunchMode(targetMode);
    setPunchSuccess(null);
    setErrorMessage("");
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

  // Stop Scanner completely
  const stopScanner = async () => {
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

  // Initial mount
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        startScanner();
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, []);

  // Handle QR Decoded from Camera
  const handleQrScanDecoded = async (decodedText) => {
    if (verifying || !isScanningRef.current) return;
    const token = decodedText?.trim();
    if (!token) return;

    const now = Date.now();
    if (
      lastScannedTokenRef.current === token &&
      lastScannedActionRef.current === punchMode &&
      now - lastScanTimestampRef.current < 2000
    ) {
      return;
    }

    lastScannedTokenRef.current = token;
    lastScannedActionRef.current = punchMode;
    lastScanTimestampRef.current = now;
    pauseScanner();
    verifyAndPunchQr(token, punchMode);
  };

  // Verify the QR and record attendance punch
  const verifyAndPunchQr = async (rawQrString, targetMode = punchMode) => {
    if (!rawQrString || !rawQrString.trim()) {
      isScanningRef.current = true;
      return;
    }
    const cleanToken = rawQrString.trim();
    setVerifying(true);
    setErrorMessage("");
    setPunchSuccess(null);

    try {
      // 1. Identify employee
      const idRes = await apiFetch("/api/operations/attendance/employee-qr/identify", {
        method: "POST",
        body: JSON.stringify({
          qrToken: cleanToken,
          companyCode: user?.companyCode || user?.companyName || user?.company,
        }),
      });

      if (!idRes?.success || !idRes?.data) {
        throw new Error(idRes?.error || idRes?.message || "QR Code verification failed.");
      }

      const empData = idRes.data;

      // Check if both check-in and check-out are already completed today
      if (empData.nextAction === "completed") {
        if (soundEnabled) playChime("success");
        setPunchSuccess({
          action: "completed",
          employee: empData.employee,
          checkInTime: empData.checkInTime,
          checkOutTime: empData.checkOutTime,
          workingHours: empData.workingHours,
          message: "Shift completed for today. Both Check-In and Check-Out punches are recorded.",
          date: new Date().toISOString().split("T")[0],
        });
        return;
      }

      // Action to execute
      let actionToExecute = targetMode;
      if (targetMode === "auto" || !targetMode) {
        actionToExecute = empData.nextAction === "clock-out" ? "clock-out" : "clock-in";
      }

      // Smart auto-transition:
      if (actionToExecute === "clock-in" && empData.checkInTime && !empData.checkOutTime) {
        actionToExecute = "clock-out";
        setPunchMode("clock-out");
        punchModeRef.current = "clock-out";
      }

      if (actionToExecute === "clock-out" && !empData.checkInTime) {
        actionToExecute = "clock-in";
        setPunchMode("clock-in");
        punchModeRef.current = "clock-in";
      }

      // 2. Submit punch
      const punchRes = await apiFetch("/api/operations/attendance/employee-qr/scan-punch", {
        method: "POST",
        body: JSON.stringify({
          qrToken: cleanToken,
          action: actionToExecute,
          companyCode: empData.resolvedCompanyCode || user?.companyCode || user?.companyName,
        }),
      });

      if (punchRes?.success && punchRes.data) {
        if (soundEnabled) playChime("success");
        const successData = {
          action: punchRes.data.action,
          message: punchRes.message || (actionToExecute === "clock-in" ? "Check-In Confirmed" : "Check-Out Confirmed"),
          time: punchRes.data.time,
          workingHours: punchRes.data.workingHours,
          employee: punchRes.data.employee || empData.employee,
          checkInTime: punchRes.data.checkInTime || empData.checkInTime,
          checkOutTime: punchRes.data.checkOutTime,
          date: punchRes.data.date || new Date().toISOString().split("T")[0],
        };

        setPunchSuccess(successData);
        setRecentPunches((prev) => [successData, ...prev.slice(0, 9)]);
        window.dispatchEvent(new Event("silent-refresh"));
      } else {
        throw new Error(punchRes?.error || punchRes?.message || "Failed to mark attendance.");
      }
    } catch (err) {
      if (soundEnabled) playChime("error");
      setErrorMessage(err.message || "Failed to process employee QR code.");
      setTimeout(() => {
        isScanningRef.current = true;
      }, 2500);
    } finally {
      setVerifying(false);
    }
  };

  // Image File QR upload fallback
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setVerifying(true);
      const tempScanner = html5QrCodeRef.current || new Html5Qrcode(readerElementId, { verbose: false });
      const decodedResult = await tempScanner.scanFile(file, true);
      if (decodedResult) {
        verifyAndPunchQr(decodedResult, punchMode);
      }
    } catch (err) {
      if (soundEnabled) playChime("error");
      setErrorMessage("Could not detect QR code in image. Please upload a clear photo or type the Employee Code below.");
      setVerifying(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle USB scanner input enter
  const handleUsbSubmit = (e) => {
    e.preventDefault();
    if (usbInput.trim()) {
      pauseScanner();
      verifyAndPunchQr(usbInput.trim(), punchMode);
      setUsbInput("");
    }
  };

  return (
    <div className={`space-y-6 font-sans select-none ${standalone ? "max-w-7xl mx-auto p-4 sm:p-6" : ""}`}>
      {/* 1. Header Command Strip */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="space-y-2 max-w-2xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-wide">
            <CameraIcon className="w-4 h-4 text-cyan-400" />
            <span>Admin Laptop QR Scanner Console</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <span>Employee QR Attendance Scanner</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
            Select <b>Check-In</b> or <b>Check-Out</b>. Show employee QR badge or phone to the camera for instant scan.
          </p>
        </div>

        {/* Live Clock & Navigation */}
        <div className="flex flex-wrap items-center gap-3 z-10">
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl px-4 py-2.5 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Live Clock</span>
            <span className="text-lg font-mono font-black text-cyan-300">
              {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
            </span>
          </div>

          {onBackToDirectory ? (
            <button
              type="button"
              onClick={onBackToDirectory}
              className="flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition cursor-pointer"
            >
              <QrCodeIcon className="w-4 h-4" />
              <span>QR Directory</span>
            </button>
          ) : (
            <Link
              to="/hr-hub?category=ATTENDANCE&tab=QR%20Attendance"
              className="flex items-center gap-2 px-4 py-3 bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition cursor-pointer"
            >
              <QrCodeIcon className="w-4 h-4" />
              <span>QR Directory</span>
            </Link>
          )}
        </div>
      </div>

      {/* 2. PRIMARY ACTION BUTTONS: 🟢 CHECK-IN vs 🔴 CHECK-OUT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* CHECK-IN CARD */}
        <button
          type="button"
          onClick={() => resumeScanner("clock-in")}
          className={`p-5 rounded-3xl border-2 transition-all flex items-center justify-between gap-4 cursor-pointer shadow-sm text-left ${
            punchMode === "clock-in"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20 ring-2 ring-emerald-400/50 scale-[1.01]"
              : "bg-white hover:bg-emerald-50 text-slate-800 border-slate-200"
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${punchMode === "clock-in" ? "bg-white animate-ping" : "bg-emerald-500"}`}></span>
              <span className="text-base font-black uppercase tracking-wider">🟢 PUNCH CHECK-IN</span>
            </div>
            <p className={`text-xs ${punchMode === "clock-in" ? "text-emerald-100" : "text-slate-500"}`}>
              Click to open camera for Morning Check-In punch
            </p>
          </div>
          <CheckCircleIcon className={`w-8 h-8 shrink-0 ${punchMode === "clock-in" ? "text-white" : "text-emerald-500"}`} />
        </button>

        {/* CHECK-OUT CARD */}
        <button
          type="button"
          onClick={() => resumeScanner("clock-out")}
          className={`p-5 rounded-3xl border-2 transition-all flex items-center justify-between gap-4 cursor-pointer shadow-sm text-left ${
            punchMode === "clock-out"
              ? "bg-amber-600 text-white border-amber-500 shadow-amber-500/20 ring-2 ring-amber-400/50 scale-[1.01]"
              : "bg-white hover:bg-amber-50 text-slate-800 border-slate-200"
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${punchMode === "clock-out" ? "bg-white animate-ping" : "bg-amber-500"}`}></span>
              <span className="text-base font-black uppercase tracking-wider">🔴 PUNCH CHECK-OUT</span>
            </div>
            <p className={`text-xs ${punchMode === "clock-out" ? "text-amber-100" : "text-slate-500"}`}>
              Click to open camera for Out-Time &amp; Complete Shift
            </p>
          </div>
          <ClockIcon className={`w-8 h-8 shrink-0 ${punchMode === "clock-out" ? "text-white" : "text-amber-500"}`} />
        </button>
      </div>

      {/* 3. Main Scanning Layout (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Webcam Viewport & Camera Controls (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CameraIcon className="w-5 h-5 text-indigo-600" />
              <h3 className="font-black text-slate-900 text-sm">
                Webcam Viewfinder —{" "}
                <span className={punchMode === "clock-in" ? "text-emerald-600 uppercase" : "text-amber-600 uppercase"}>
                  {punchMode === "clock-in" ? "Check-In Active" : "Check-Out Active"}
                </span>
              </h3>
              <span className={`w-2.5 h-2.5 rounded-full ${scannerActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                title={soundEnabled ? "Mute audio chime" : "Enable audio chime"}
              >
                {soundEnabled ? <SpeakerWaveIcon className="w-4 h-4 text-indigo-600" /> : <SpeakerXMarkIcon className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => resumeScanner(punchMode)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                title="Restart scanner"
              >
                <ArrowPathIcon className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Camera Viewport Container */}
          <div className="relative w-full max-w-[480px] mx-auto bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 flex items-center justify-center shadow-inner min-h-[300px]">
            {/* HTML5 QR Code Mount Node */}
            <div id={readerElementId} className="w-full"></div>

            {/* Viewfinder Target Overlay with Laser Scan Animation */}
            {scannerActive && !punchSuccess && (
              <div className="absolute inset-3 pointer-events-none">
                <div
                  className={`absolute inset-0 border-2 rounded-2xl relative shadow-lg ${
                    punchMode === "clock-in"
                      ? "border-emerald-400/80 shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                      : "border-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.3)]"
                  }`}
                >
                  {/* Glowing Corner accents */}
                  <div
                    className={`absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 rounded-tl-xl ${
                      punchMode === "clock-in"
                        ? "border-emerald-400 shadow-[0_0_8px_#34d399]"
                        : "border-amber-400 shadow-[0_0_8px_#fbbf24]"
                    }`}
                  ></div>
                  <div
                    className={`absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 rounded-tr-xl ${
                      punchMode === "clock-in"
                        ? "border-emerald-400 shadow-[0_0_8px_#34d399]"
                        : "border-amber-400 shadow-[0_0_8px_#fbbf24]"
                    }`}
                  ></div>
                  <div
                    className={`absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 rounded-bl-xl ${
                      punchMode === "clock-in"
                        ? "border-emerald-400 shadow-[0_0_8px_#34d399]"
                        : "border-amber-400 shadow-[0_0_8px_#fbbf24]"
                    }`}
                  ></div>
                  <div
                    className={`absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 rounded-br-xl ${
                      punchMode === "clock-in"
                        ? "border-emerald-400 shadow-[0_0_8px_#34d399]"
                        : "border-amber-400 shadow-[0_0_8px_#fbbf24]"
                    }`}
                  ></div>

                  {/* Animated laser line */}
                  <div
                    className={`w-full h-0.5 shadow-lg animate-pulse absolute top-1/2 -translate-y-1/2 ${
                      punchMode === "clock-in"
                        ? "bg-gradient-to-r from-transparent via-emerald-300 to-transparent shadow-emerald-400"
                        : "bg-gradient-to-r from-transparent via-amber-300 to-transparent shadow-amber-400"
                    }`}
                  ></div>
                </div>

                <div className="absolute bottom-3 left-0 right-0 text-center px-4">
                  <span
                    className={`inline-block px-3.5 py-1 bg-slate-900/90 backdrop-blur-md text-[11px] font-bold rounded-full border shadow-lg ${
                      verifying
                        ? "text-cyan-300 border-cyan-500/40 animate-pulse"
                        : punchMode === "clock-in"
                        ? "text-emerald-300 border-emerald-500/30"
                        : "text-amber-300 border-amber-500/30"
                    }`}
                  >
                    {verifying
                      ? "⚡ Recording Attendance..."
                      : "⚡ High-Speed Scanner Active — Hold QR code in front of camera"}
                  </span>
                </div>
              </div>
            )}

            {/* Permission Denied Warning */}
            {cameraPermissionDenied && (
              <div className="absolute inset-0 bg-slate-900/90 text-white p-6 flex flex-col items-center justify-center text-center space-y-3 z-20">
                <ExclamationTriangleIcon className="w-12 h-12 text-rose-400" />
                <h4 className="font-extrabold text-sm text-white">Camera Access Blocked</h4>
                <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
                  Please allow camera permissions in your browser settings, or enter Employee Code below.
                </p>
                <button
                  type="button"
                  onClick={() => startScanner(selectedCameraId)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Retry Camera Permissions
                </button>
              </div>
            )}
          </div>

          {/* Camera Selection Dropdown & File Upload */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {cameras.length > 0 && (
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <span className="text-xs text-slate-500 font-bold whitespace-nowrap">Camera:</span>
                <select
                  value={selectedCameraId}
                  onChange={(e) => {
                    setSelectedCameraId(e.target.value);
                    startScanner(e.target.value);
                  }}
                  className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 cursor-pointer focus:ring-2 focus:ring-indigo-500"
                >
                  {cameras.map((c, i) => (
                    <option key={c.id} value={c.id}>
                      {c.label || `Camera ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="admin-qr-file-upload"
              />
              <label
                htmlFor="admin-qr-file-upload"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer shadow-xs transition"
              >
                <PhotoIcon className="w-4 h-4 text-indigo-600" />
                <span>Upload QR Photo</span>
              </label>
            </div>
          </div>

          {/* Attached Hardware / Manual Code Entry */}
          <form onSubmit={handleUsbSubmit} className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <CommandLineIcon className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={usbInputRef}
              type="text"
              placeholder="Or type Employee Code (e.g. TVN2004, EMP01) / USB scanner..."
              value={usbInput}
              onChange={(e) => setUsbInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!usbInput.trim() || verifying}
              className={`px-4 py-2 font-bold text-xs rounded-xl shrink-0 transition cursor-pointer text-white disabled:opacity-40 disabled:cursor-not-allowed ${
                punchMode === "clock-in" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-amber-600 hover:bg-amber-500"
              }`}
            >
              Punch {punchMode === "clock-in" ? "In" : "Out"}
            </button>
          </form>
        </div>

        {/* Right Column: Verification & Confirmation Action Panel (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {/* Card State 1: Awaiting Scan */}
          {!punchSuccess && !errorMessage && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center flex flex-col items-center justify-center space-y-4 shadow-xs h-full">
              <div
                className={`w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center animate-pulse ${
                  punchMode === "clock-in"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-600"
                    : "bg-amber-50 border-amber-300 text-amber-600"
                }`}
              >
                <QrCodeIcon className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-slate-900 text-base">
                  Ready to Record {punchMode === "clock-in" ? "Check-In" : "Check-Out"}
                </h4>
                <p className="text-xs text-slate-500 font-medium max-w-xs leading-relaxed">
                  Hold employee QR badge or phone in front of the camera box. Attendance will be recorded instantly.
                </p>
              </div>
              <div className="pt-2">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full ${
                    punchMode === "clock-in" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  Waiting for QR Code...
                </span>
              </div>
            </div>
          )}

          {/* Card State 2: Error Notification */}
          {errorMessage && (
            <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-6 text-center space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <ExclamationTriangleIcon className="w-12 h-12 text-rose-500 mx-auto" />
              <h4 className="font-black text-rose-900 text-sm">Scan Rejected</h4>
              <p className="text-xs text-rose-700 font-bold leading-relaxed">{errorMessage}</p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => resumeScanner(punchMode)}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-xs"
                >
                  Scan Next Employee
                </button>
              </div>
            </div>
          )}

          {/* Card State 3: Punch Success Confirmation Card */}
          {punchSuccess && (
            <div
              className={`border-2 rounded-3xl p-6 text-center space-y-4 shadow-sm animate-in fade-in zoom-in-95 duration-200 ${
                punchSuccess.status === "warning"
                  ? "bg-amber-50 border-amber-300"
                  : punchSuccess.action === "completed"
                  ? "bg-cyan-50 border-cyan-200"
                  : punchSuccess.action === "clock-in"
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-amber-50 border-amber-200"
              }`}
            >
              <div
                className={`w-14 h-14 rounded-full border flex items-center justify-center mx-auto shadow-xs ${
                  punchSuccess.status === "warning"
                    ? "bg-amber-100 border-amber-400 text-amber-700"
                    : punchSuccess.action === "completed"
                    ? "bg-cyan-100 border-cyan-300 text-cyan-600"
                    : punchSuccess.action === "clock-in"
                    ? "bg-emerald-100 border-emerald-300 text-emerald-600"
                    : "bg-amber-100 border-amber-300 text-amber-600"
                }`}
              >
                {punchSuccess.status === "warning" ? (
                  <ExclamationTriangleIcon className="w-8 h-8" />
                ) : (
                  <CheckCircleIcon className="w-8 h-8" />
                )}
              </div>

              <div className="space-y-1">
                <span
                  className={`px-3.5 py-1 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-xs ${
                    punchSuccess.status === "warning"
                      ? "bg-amber-600"
                      : "bg-emerald-600"
                  }`}
                >
                  {punchSuccess.status === "warning"
                    ? "ATTENTION"
                    : punchSuccess.action === "clock-in"
                    ? "✓ CHECK-IN SUCCESSFUL!"
                    : "✓ CHECK-OUT SUCCESSFUL!"}
                </span>
                <h3 className="font-black text-slate-900 text-lg pt-1">
                  {punchSuccess.employee?.name || punchSuccess.employee?.fullName}
                </h3>
                <p className="font-mono text-xs font-bold text-indigo-700">
                  {punchSuccess.employee?.employeeCode} • {punchSuccess.employee?.department || "Operations"}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1.5">
                {punchSuccess.action === "clock-in" && (
                  <>
                    <p className="text-xs text-slate-500 font-semibold">
                      Check-In Time:{" "}
                      <b className="text-emerald-600 font-mono text-sm">{punchSuccess.time || punchSuccess.checkInTime}</b>
                    </p>
                    <p className="text-[11px] text-amber-600 font-bold pt-1 border-t border-slate-100">
                      👉 Check-In confirmed! Proceed to Check-Out whenever ready.
                    </p>
                  </>
                )}

                {(punchSuccess.action === "clock-out" || punchSuccess.action === "completed") && (
                  <>
                    <div className="flex items-center justify-around text-slate-700 text-xs font-bold border-b border-slate-100 pb-1.5">
                      <div>
                        In: <span className="font-mono text-emerald-600">{punchSuccess.checkInTime || "--"}</span>
                      </div>
                      <div>
                        Out: <span className="font-mono text-amber-600">{punchSuccess.checkOutTime || punchSuccess.time || "--"}</span>
                      </div>
                    </div>
                    {punchSuccess.workingHours !== undefined && (
                      <p className="text-xs text-indigo-600 font-bold">
                        Total Shift Duration: <b>{punchSuccess.workingHours} hrs</b>
                      </p>
                    )}
                    <p className="text-[11px] text-cyan-600 font-bold pt-1">
                      🏆 Both punches complete! Today's shift is complete.
                    </p>
                  </>
                )}

                {punchSuccess.action === "completed" && (
                  <>
                    <div className="flex items-center justify-around text-slate-700 text-xs font-bold border-b border-slate-100 pb-1.5">
                      <div>
                        In: <span className="font-mono text-emerald-600">{punchSuccess.checkInTime || "--"}</span>
                      </div>
                      <div>
                        Out: <span className="font-mono text-amber-600">{punchSuccess.checkOutTime || "--"}</span>
                      </div>
                    </div>
                    {punchSuccess.workingHours !== undefined && (
                      <p className="text-xs text-cyan-700 font-bold">
                        Shift: <b>{punchSuccess.workingHours} hrs</b>
                      </p>
                    )}
                    <p className="text-[11px] text-emerald-600 font-bold pt-1">
                      {punchSuccess.message}
                    </p>
                  </>
                )}

                {punchSuccess.status === "warning" && (
                  <p className="text-xs text-amber-800 font-bold">{punchSuccess.message}</p>
                )}
              </div>

              {/* EXACT USER WORKFLOW BUTTONS */}
              <div className="pt-2 space-y-2">
                {/* Check-In success -> Prominent PROCEED TO CHECK-OUT */}
                {punchSuccess.action === "clock-in" && (
                  <button
                    type="button"
                    onClick={() => resumeScanner("clock-out")}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                  >
                    <ClockIcon className="w-4 h-4" />
                    <span>🔴 Proceed to Check-Out (Open Camera)</span>
                  </button>
                )}

                {punchSuccess.warningType === "need-checkin-first" && (
                  <button
                    type="button"
                    onClick={() => resumeScanner("clock-in")}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>🟢 Punch Check-In First</span>
                  </button>
                )}

                {punchSuccess.warningType === "already-checked-in" && (
                  <button
                    type="button"
                    onClick={() => resumeScanner("clock-out")}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                  >
                    <ClockIcon className="w-4 h-4" />
                    <span>🔴 Proceed to Check-Out</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => resumeScanner(punchMode)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>Scan Next Employee</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. Session Recent Punches List */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4 text-indigo-600" />
                <span>Today's Scanned Punches</span>
              </h4>
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                {recentPunches.length} Scanned
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {recentPunches.length > 0 ? (
                recentPunches.map((punch, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs hover:bg-indigo-50/40 transition"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-black text-slate-900 truncate">
                        {punch.employee?.name || punch.employee?.fullName}
                      </p>
                      <p className="text-[10px] font-mono text-indigo-600 font-bold">
                        {punch.employee?.employeeCode} • {punch.employee?.department || "Operations"}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border ${
                          punch.action === "clock-in"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-amber-100 text-amber-800 border-amber-200"
                        }`}
                      >
                        {punch.action === "clock-in" ? "In" : "Out"}
                      </span>
                      <p className="text-[10px] font-mono font-bold text-slate-700 mt-0.5">
                        {punch.time}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-[11px] text-slate-400 font-medium">
                  No punches recorded in this session yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
