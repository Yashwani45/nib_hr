import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CameraIcon, ArrowPathIcon, ExclamationTriangleIcon, VideoCameraIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

// Helper to filter out desktop screen mirroring apps like TranScreen
const isIgnoredDevice = (label = '') => {
  const l = label.toLowerCase();
  return (
    l.includes('transcreen') ||
    l.includes('obs-camera') ||
    l.includes('manycam') ||
    l.includes('splitcam')
  );
};

// Friendly camera label
const formatDeviceLabel = (device, index) => {
  const label = device.label || '';
  const l = label.toLowerCase();
  if (l.includes('front') || l.includes('user') || l.includes('selfie')) {
    return '📱 Front Camera (Selfie)';
  }
  if (l.includes('back') || l.includes('environment') || l.includes('rear')) {
    return '📷 Back Camera';
  }
  if (l.includes('droidcam')) {
    return '📱 Phone Camera (DroidCam)';
  }
  if (l.includes('usb') || l.includes('uvc') || l.includes('realtek')) {
    return `💻 Laptop / USB Webcam (${label || `Device ${index + 1}`})`;
  }
  return `📷 ${label || `Camera ${index + 1}`}`;
};

export default function CameraModule({
  onCameraReady,
  onStreamStop,
  autoStart = true,
  overlayText = 'Position face inside frame',
  statusText = 'Camera ready',
  className = '',
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const startingRef = useRef(false);

  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showPreview, setShowPreview] = useState(true);

  // Stop current active stream tracks safely
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      } catch (e) {
        console.warn('Error stopping stream tracks:', e);
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    if (onStreamStop) onStreamStop();
  }, [onStreamStop]);

  // Filter device list to keep Phone (DroidCam USB) and Laptop USB Webcam
  const filterDevices = (deviceList) => {
    const videoInputs = deviceList.filter((d) => d.kind === 'videoinput');
    // Exclude screen share apps like TranScreen
    const valid = videoInputs.filter((d) => !isIgnoredDevice(d.label));

    // Sort so Normal Laptop/USB Webcam appears first by default
    return valid.sort((a, b) => {
      const aUsb = (a.label || '').toLowerCase().includes('usb') || (a.label || '').toLowerCase().includes('realtek') || (a.label || '').toLowerCase().includes('front');
      const bUsb = (b.label || '').toLowerCase().includes('usb') || (b.label || '').toLowerCase().includes('realtek') || (b.label || '').toLowerCase().includes('front');
      if (aUsb && !bUsb) return -1;
      if (!aUsb && bUsb) return 1;
      return 0;
    });
  };

  // Fetch available camera devices
  const fetchDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return [];
      }
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const filtered = filterDevices(deviceList);
      setDevices(filtered);

      if (filtered.length > 0) {
        setSelectedDeviceId((prev) => {
          if (prev && filtered.some((d) => d.deviceId === prev)) {
            return prev;
          }
          return filtered[0].deviceId;
        });
      }
      return filtered;
    } catch (err) {
      console.warn('Error enumerating devices:', err);
      return [];
    }
  }, []);

  // Start stream with selected deviceId safely without race condition
  const startCameraStream = useCallback(
    async (deviceIdToUse) => {
      if (startingRef.current) return;
      startingRef.current = true;

      stopCameraStream();
      setIsLoading(true);
      setErrorMsg(null);

      const targetDeviceId = deviceIdToUse || selectedDeviceId;

      try {
        let stream = null;
        const constraints = {
          audio: false,
          video: targetDeviceId
            ? { deviceId: { exact: targetDeviceId } }
            : { facingMode: 'user' },
        };

        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (tier1Err) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: targetDeviceId ? { deviceId: targetDeviceId } : true,
            });
          } catch (tier2Err) {
            stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
          }
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (playErr) {
            if (playErr.name !== 'AbortError') {
              console.warn('Video play warning:', playErr);
            }
          }
        }

        setIsCameraActive(true);
        setIsLoading(false);

        // Re-enumerate to get labeled device names once permission is granted
        const updatedDevices = await fetchDevices();
        const activeDeviceId = targetDeviceId || (updatedDevices[0] && updatedDevices[0].deviceId) || 'USB-CAM';

        if (onCameraReady) {
          onCameraReady({
            stream,
            videoRef,
            deviceId: activeDeviceId,
          });
        }
      } catch (err) {
        setIsLoading(false);
        setIsCameraActive(false);

        if (err.name !== 'AbortError') {
          console.error('Camera access error:', err);
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setErrorMsg('Camera permission denied. Please allow camera permissions in browser settings.');
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setErrorMsg('No camera device found. Please connect your phone via USB or check webcam.');
          } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            setErrorMsg('Camera is currently in use by another application. If using DroidCam, ensure Start is clicked in DroidCam PC Client.');
          } else {
            setErrorMsg(`Camera error: ${err.message || 'Unable to access video stream.'}`);
          }
        }
      } finally {
        startingRef.current = false;
      }
    },
    [selectedDeviceId, stopCameraStream, fetchDevices, onCameraReady]
  );

  // Handle device selection change
  const handleDeviceChange = (e) => {
    const newDeviceId = e.target.value;
    setSelectedDeviceId(newDeviceId);
    startCameraStream(newDeviceId);
  };

  // Initial load
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      const devList = await fetchDevices();
      if (!isMounted) return;

      if (autoStart) {
        // Auto-select normal camera (Laptop/USB Webcam) first
        const preferredId = devList && devList.length > 0 ? devList[0].deviceId : undefined;
        startCameraStream(preferredId);
      }
    };

    initialize();

    return () => {
      isMounted = false;
      stopCameraStream();
    };
  }, []);

  const activeDeviceObj = devices.find((d) => d.deviceId === selectedDeviceId);
  const isDroidCam = (activeDeviceObj?.label || '').toLowerCase().includes('droidcam');

  return (
    <div className={`flex flex-col gap-3 w-full max-w-md mx-auto ${className}`}>
      {/* Device Selection Header */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <VideoCameraIcon className="w-4 h-4 text-blue-600" />
            Camera Input Device
          </span>
          <button
            type="button"
            onClick={fetchDevices}
            className="text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            title="Refresh connected camera list"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" />
            Refresh
          </button>
        </label>

        <select
          value={selectedDeviceId}
          onChange={handleDeviceChange}
          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
        >
          {devices.length === 0 ? (
            <option value="">Camera (USB / DroidCam)</option>
          ) : (
            devices.map((d, index) => (
              <option key={d.deviceId || index} value={d.deviceId}>
                {formatDeviceLabel(d, index)}
              </option>
            ))
          )}
        </select>

        {isDroidCam ? (
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <span>📱 Phone Camera (USB / DroidCam) Connected & Active ✓</span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span>💡 Phone camera ke liye: DroidCam PC Client me USB mode Start karein</span>
            <button
              type="button"
              onClick={fetchDevices}
              className="text-blue-600 hover:text-blue-700 font-bold ml-1.5 underline cursor-pointer"
            >
              Scan
            </button>
          </div>
        )}
      </div>

      {/* Clean Card View when Preview is Hidden */}
      {isCameraActive && !showPreview && !isLoading && !errorMsg && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-center shadow-lg border border-slate-800">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center animate-pulse border border-blue-500/30">
            <VideoCameraIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <h5 className="font-bold text-sm text-slate-100">Camera Active</h5>
            </div>
            <p className="text-xs text-slate-400 mt-1">Scanning face live...</p>
          </div>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 underline mt-1 cursor-pointer"
          >
            Show Video Preview Box
          </button>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="opacity-0 pointer-events-none absolute w-1 h-1"
          />
        </div>
      )}

      {/* Video Viewport with Live Overlay (When Preview is Enabled) */}
      {(showPreview || !isCameraActive || isLoading || errorMsg) && (
        <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-inner border-2 border-slate-200 flex items-center justify-center">
          {/* Main Video Stream */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transform -scale-x-100 ${isCameraActive ? 'block' : 'hidden'}`}
          />
          {/* Loading Spinner */}
          {isLoading && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-medium">Connecting camera stream...</p>
            </div>
          )}

          {/* Stopped / Inactive Placeholder */}
          {!isCameraActive && !isLoading && !errorMsg && (
            <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-slate-400">
              <CameraIcon className="w-12 h-12 stroke-1 text-slate-500" />
              <p className="text-xs font-semibold text-slate-300">Camera preview inactive</p>
              <button
                type="button"
                onClick={() => startCameraStream()}
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs transition cursor-pointer"
              >
                Start Camera
              </button>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="absolute inset-0 bg-red-950/90 p-4 flex flex-col items-center justify-center text-center gap-2 text-red-200 z-20">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-400 shrink-0" />
              <p className="text-xs font-bold text-red-100 leading-tight">{errorMsg}</p>
              <p className="text-[10px] text-red-300 max-w-xs mt-1">
                Ensure camera permissions are enabled and DroidCam is started in USB mode.
              </p>
              <button
                type="button"
                onClick={() => startCameraStream()}
                className="mt-2 bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-3 rounded-lg text-xs cursor-pointer"
              >
                Retry Camera Connection
              </button>
            </div>
          )}

          {/* Face Guide Frame Overlay */}
          {isCameraActive && showPreview && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-36 h-48 border-2 border-dashed border-blue-400/80 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-pulse flex items-center justify-center">
                <span className="text-[10px] text-blue-200 bg-slate-900/70 px-2 py-0.5 rounded-full font-semibold">
                  {overlayText}
                </span>
              </div>
            </div>
          )}

          {/* Live Status Pill & Hide Preview Link */}
          {isCameraActive && showPreview && (
            <>
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-2 text-white border border-slate-700/50">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-[11px] font-bold tracking-wide">{statusText}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-300 border border-slate-700/50 transition cursor-pointer"
              >
                Hide Video Box
              </button>
            </>
          )}
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex flex-col gap-2">
        {isCameraActive ? (
          <button
            type="button"
            onClick={stopCameraStream}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer"
          >
            Stop Camera
          </button>
        ) : (
          <button
            type="button"
            onClick={() => startCameraStream()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <CameraIcon className="w-4 h-4" />
            Start Camera
          </button>
        )}
      </div>
    </div>
  );
}
