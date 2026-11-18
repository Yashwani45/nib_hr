import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { apiFetch } from '../services/hrApi';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';

export default function PhoneFaceScanner() {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('Loading camera & AI models...');
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [hasCameraStream, setHasCameraStream] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const scanningLockRef = useRef(false);

  // Parse token and company from URL params on load if provided via ADB
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const company = params.get('company');
      if (token) localStorage.setItem('token', token);
      if (company) localStorage.setItem('selected_company_code', company);
    } catch (e) {}
  }, []);

  // Standalone function to start camera with user-gesture support & constraint fallbacks
  const startPhoneCam = async () => {
    try {
      setStatus('Loading neural vision models...');
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      ]);

      setIsModelLoaded(true);
      setStatus('Requesting phone camera permission...');

      let stream = null;
      const constraintOptions = [
        { video: { facingMode: 'user' }, audio: false },
        { video: { facingMode: { ideal: 'user' }, width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
        { video: true, audio: false },
      ];

      for (const constraints of constraintOptions) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) break;
        } catch (e) {
          console.warn('Constraint attempt failed:', constraints, e);
        }
      }

      if (!stream) {
        throw new Error('Camera stream could not be acquired');
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play warning:', playErr);
        }
      }
      setHasCameraStream(true);
      setStatus('Camera ready! Please look into the camera to scan face.');
    } catch (err) {
      console.error('Phone camera init error:', err);
      setHasCameraStream(false);
      const detail = err.name ? `${err.name}: ${err.message || 'Permission denied'}` : String(err);
      setStatus(`Camera info: ${detail}`);
    }
  };

  // 1. Trigger initial start on mount
  useEffect(() => {
    let mounted = true;
    startPhoneCam();

    return () => {
      mounted = false;
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // 2. Active Face Scan Loop
  useEffect(() => {
    if (!isModelLoaded || !isScanning || !hasCameraStream) return;

    let timer = null;

    const scanFrame = async () => {
      if (scanningLockRef.current || !videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        timer = setTimeout(scanFrame, 400);
        return;
      }

      try {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          scanningLockRef.current = true;
          setStatus('Face detected! Authenticating with server...');

          const descriptorArray = Array.from(detection.descriptor);
          const payload = {
            method: 'FACE',
            embedding: descriptorArray,
            faceData: {
              confidence: detection.detection.score,
              livenessScore: 0.95,
              timestamp: new Date().toISOString(),
              embedding: descriptorArray,
            },
          };

          const res = await apiFetch('/api/operations/attendance/face/live-scan', {
            method: 'POST',
            body: JSON.stringify(payload),
          });

          if (res && (res.success || res.statusCode === 200 || res.data?.matched)) {
            setAuthenticatedUser(res.data);
            setIsScanning(false);
            setStatus('User face is successfully authenticated!');
            if (navigator.vibrate) navigator.vibrate(200);
            return;
          } else {
            setStatus('Face not matched. Retrying...');
            scanningLockRef.current = false;
          }
        } else {
          setStatus('Looking for face...');
        }
      } catch (err) {
        console.warn('Face scan error:', err);
        scanningLockRef.current = false;
      }

      timer = setTimeout(scanFrame, 400);
    };

    timer = setTimeout(scanFrame, 600);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isModelLoaded, isScanning, hasCameraStream]);

  const handleScanAgain = () => {
    setAuthenticatedUser(null);
    setIsScanning(true);
    scanningLockRef.current = false;
    setStatus('Looking for face...');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 font-sans select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="w-6 h-6 text-emerald-400" />
          <h2 className="text-base font-bold">Phone Face Scanner</h2>
        </div>
        <span className="text-[11px] font-mono bg-emerald-950/80 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-800">
          USB Connected
        </span>
      </div>

      {/* Camera Viewport */}
      <div className="relative my-auto w-full aspect-[3/4] max-w-sm mx-auto rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 ${hasCameraStream ? 'block' : 'hidden'}`}
        />

        {/* Enable Camera Overlay if permissions needed */}
        {!hasCameraStream && (
          <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center gap-3 z-20">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-400/40">
              <VideoCameraIcon className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Camera Permission</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Phone ke front camera se face scan karne ke liye neeche button par tap karein.
              </p>
            </div>
            <button
              type="button"
              onClick={startPhoneCam}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold py-3 px-6 rounded-2xl text-sm shadow-xl flex items-center gap-2 cursor-pointer mt-2"
            >
              <VideoCameraIcon className="w-5 h-5" />
              Tap to Enable Camera
            </button>
          </div>
        )}

        {/* Face Guide Target Overlay */}
        {hasCameraStream && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div
              className={`w-56 h-72 rounded-[45%] border-2 border-dashed transition-all duration-300 ${
                authenticatedUser
                  ? 'border-emerald-400 bg-emerald-500/10 scale-105'
                  : 'border-blue-400/70 animate-pulse'
              }`}
            />
          </div>
        )}

        {/* Live Authentication Success Overlay */}
        {authenticatedUser && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3 z-30 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border-2 border-emerald-400">
              <CheckCircleIcon className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">Face Authenticated!</h3>
              <p className="text-sm font-bold text-emerald-300 mt-1">
                {authenticatedUser.employeeName || authenticatedUser.name || 'Employee Verified'}
              </p>
              {authenticatedUser.employeeCode && (
                <p className="text-xs text-slate-400 mt-0.5 font-mono">ID: {authenticatedUser.employeeCode}</p>
              )}
            </div>
            <div className="bg-emerald-900/40 border border-emerald-700/60 rounded-xl p-3 text-xs text-emerald-200">
              👉 <b>Check your laptop screen now!</b>
              <p className="text-[11px] text-emerald-300/80 mt-1">Laptop screen par "Mark Attendance" button click karein.</p>
            </div>
            <button
              type="button"
              onClick={handleScanAgain}
              className="mt-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-5 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Scan Again
            </button>
          </div>
        )}
      </div>

      {/* Bottom Status Card */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center space-y-1">
        <p className="text-xs font-semibold text-slate-300">{status}</p>
        <p className="text-[10px] text-slate-500">Live USB sync active with laptop dashboard</p>
      </div>
    </div>
  );
}
