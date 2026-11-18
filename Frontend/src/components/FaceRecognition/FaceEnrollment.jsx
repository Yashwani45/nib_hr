import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';
import CameraModule from './CameraModule';
import { apiFetch } from '../../services/hrApi';
import { CheckCircleIcon, ExclamationTriangleIcon, UserIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const REQUIRED_SAMPLES = 5;

const SAMPLE_INSTRUCTIONS = [
  'Look straight ahead at the camera with a neutral expression',
  'Turn your head slightly to the right',
  'Turn your head slightly to the left',
  'Tilt your head slightly upward',
  'Smile gently facing the camera'
];

export default function FaceEnrollment({ targetEmployee, onComplete, onCancel }) {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [modelStatus, setModelStatus] = useState('Loading face recognition models...');
  const [enrolledSamples, setEnrolledSamples] = useState([]);
  const [captureStep, setCaptureStep] = useState(0);
  const [statusMsg, setStatusMsg] = useState('Position your face inside the indicator area');
  const [validationError, setValidationError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState(false);
  const [existingEnrollment, setExistingEnrollment] = useState(null);

  const videoRefLocal = useRef(null);

  // Load faceapi neural net models
  useEffect(() => {
    let isMounted = true;
    const loadModels = async () => {
      try {
        setModelStatus('Loading Face Detection & Recognition models...');
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);
        if (isMounted) {
          setIsModelLoaded(true);
          setModelStatus('Models ready for face enrollment.');
        }
      } catch (err) {
        console.error('Error loading face-api models:', err);
        if (isMounted) {
          setModelStatus('Failed to load face recognition models. Ensure /models directory exists.');
        }
      }
    };

    loadModels();
    return () => {
      isMounted = false;
    };
  }, []);

  // Check if target employee already has an active enrollment
  useEffect(() => {
    const checkEnrollmentStatus = async () => {
      try {
        const empIdentifier = targetEmployee?.employeeCode || targetEmployee?.emp_code || targetEmployee?.id;
        const queryPath = targetEmployee?.id 
          ? `/api/operations/attendance/face/status?employeeId=${encodeURIComponent(targetEmployee.id)}&empId=${encodeURIComponent(empIdentifier || '')}`
          : '/api/operations/attendance/face/status';
        const res = await apiFetch(queryPath);
        if (res && res.data) {
          setExistingEnrollment(res.data);
        }
      } catch (e) {
        console.warn('Could not fetch face enrollment status:', e.message);
      }
    };
    checkEnrollmentStatus();
  }, [targetEmployee]);

  // Handle camera element reference from CameraModule
  const handleCameraReady = useCallback(({ videoRef }) => {
    videoRefLocal.current = videoRef.current;
  }, []);

  // Capture single sample frame and validate
  const captureSample = async () => {
    if (!videoRefLocal.current || !isModelLoaded) return;

    setIsProcessing(true);
    setValidationError('');
    setStatusMsg('Analyzing face frame...');

    try {
      const videoEl = videoRefLocal.current;
      if (videoEl.paused || videoEl.ended || !videoEl.videoWidth) {
        setValidationError('Camera video feed is inactive.');
        setIsProcessing(false);
        return;
      }

      // Run SSD Mobilenet or TinyFaceDetector
      const detection = await faceapi
        .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setValidationError('No face detected. Please ensure good lighting and look directly into the camera.');
        setIsProcessing(false);
        return;
      }

      // Validation 1: Quality / Score Threshold
      const score = detection.detection.score;
      if (score < 0.70) {
        setValidationError(`Face image quality too low (${Math.round(score * 100)}%). Enhance lighting and face straight.`);
        setIsProcessing(false);
        return;
      }

      // Validation 2: Face distance (box width)
      const box = detection.detection.box;
      const boxWidth = box.width;
      if (boxWidth < 80) {
        setValidationError('Face is too far from the camera. Please move closer.');
        setIsProcessing(false);
        return;
      }
      if (boxWidth > 380) {
        setValidationError('Face is too close to the camera. Please step back slightly.');
        setIsProcessing(false);
        return;
      }

      // Validation 3: Check for multiple faces
      const allDetections = await faceapi.detectAllFaces(videoEl, new faceapi.TinyFaceDetectorOptions());
      if (allDetections.length > 1) {
        setValidationError('Multiple faces detected. Ensure only one person is visible in the frame.');
        setIsProcessing(false);
        return;
      }

      // Capture descriptor vector
      const descriptor = Array.from(detection.descriptor);

      const nextSamples = [...enrolledSamples, descriptor];
      setEnrolledSamples(nextSamples);

      const nextStep = captureStep + 1;
      setCaptureStep(nextStep);

      if (nextStep >= REQUIRED_SAMPLES) {
        setStatusMsg('All 5 samples captured successfully! Submitting enrollment...');
        await submitEnrollment(nextSamples);
      } else {
        setStatusMsg(`Sample ${nextStep} captured! ${SAMPLE_INSTRUCTIONS[nextStep] || 'Adjust pose for next sample.'}`);
      }
    } catch (err) {
      console.error('Face capture error:', err);
      setValidationError(err.message || 'An error occurred during face scan.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit complete enrollment payload to backend
  const submitEnrollment = async (samples) => {
    setIsProcessing(true);
    try {
      // Calculate averaged embedding descriptor vector
      const vectorLen = samples[0].length;
      const avgEmbedding = new Array(vectorLen).fill(0);
      for (const sample of samples) {
        for (let i = 0; i < vectorLen; i++) {
          avgEmbedding[i] += sample[i];
        }
      }
      for (let i = 0; i < vectorLen; i++) {
        avgEmbedding[i] /= samples.length;
      }

      const payload = {
        employeeId: targetEmployee?.id,
        embedding: avgEmbedding,
        embeddings: samples,
        sampleCount: samples.length,
        modelVersion: 'face-api-v1',
      };

      const res = await apiFetch('/api/operations/attendance/face/enroll', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res && (res.success || res.statusCode === 201 || res.statusCode === 200)) {
        setEnrollSuccess(true);
        setExistingEnrollment({ isEnrolled: true, ...(res.data || {}) });
        setStatusMsg('Employee face successfully enrolled!');
        if (onComplete) {
          setTimeout(() => onComplete(res.data), 2000);
        }
      } else {
        const errorMsg = res?.message || 'Face enrollment failed on server.';
        setValidationError(errorMsg);
        if (errorMsg.includes('Face already registered')) {
          setExistingEnrollment({ isEnrolled: true, message: errorMsg });
        }
      }
    } catch (err) {
      console.error('Enrollment submission error:', err);
      const errorMsg = err.message || 'Server connection failed while saving enrollment.';
      setValidationError(errorMsg);
      if (errorMsg.includes('Face already registered')) {
        setExistingEnrollment({ isEnrolled: true, message: errorMsg });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-2xl mx-auto overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-4 text-white flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            <UserIcon className="w-6 h-6 text-blue-200" />
            Employee Face Enrollment
          </h3>
          <p className="text-xs text-blue-100">
            {targetEmployee ? `Enrolling: ${targetEmployee.employeeName || targetEmployee.name || targetEmployee.firstName}` : 'Enroll Biometric Face Profile'}
          </p>
        </div>
        {existingEnrollment && (
          <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-bold px-3 py-1 rounded-full">
            Enrollment Active
          </span>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Model Status Bar */}
        {!isModelLoaded && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            <span>{modelStatus}</span>
          </div>
        )}

        {/* Permanent Lock Banner if Face is Already Registered */}
        {existingEnrollment?.isEnrolled ? (
          <div className="bg-amber-50 border-2 border-amber-300 text-amber-900 p-6 rounded-2xl text-center space-y-3 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto text-amber-600 text-2xl font-bold">
              🔒
            </div>
            <h4 className="font-extrabold text-lg text-amber-950">One-Time Registration Active</h4>
            <div className="p-3.5 bg-white rounded-xl border border-amber-300 text-xs font-extrabold text-amber-900 shadow-sm">
              Face already registered for this Employee ID. Re-registration is not allowed.
            </div>
            <div className="text-xs text-slate-700 space-y-1 font-medium">
              <p>
                <b>Employee:</b> {existingEnrollment.employeeName || targetEmployee?.employeeName || targetEmployee?.firstName || 'Employee'} (
                {existingEnrollment.employeeCode || targetEmployee?.employeeCode || 'EMP'})
              </p>
              {existingEnrollment.enrolledAt && (
                <p>
                  <b>Registration Date:</b> {new Date(existingEnrollment.enrolledAt).toLocaleString()}
                </p>
              )}
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              For daily attendance marking, please open the <b>Face Attendance</b> screen.
            </p>
            {onCancel && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-6 rounded-xl text-xs cursor-pointer shadow-sm transition"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        ) : enrollSuccess ? (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-6 rounded-2xl text-center space-y-3 animate-fade-in">
            <CheckCircleIcon className="w-16 h-16 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-xl text-emerald-900">One-Time Face Registration Complete!</h4>
            <p className="text-sm text-emerald-700 max-w-md mx-auto">
              5 high-quality face samples registered in the secure database. This face is now permanently locked to this Employee ID for daily attendance verification.
            </p>
            <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-900">
              🔒 One-Time Registration Completed. Re-registration is now permanently locked.
            </div>
            <div className="pt-2 flex gap-3 justify-center">
              {onComplete && (
                <button
                  type="button"
                  onClick={onComplete}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-xl text-xs cursor-pointer shadow transition"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Step Checkmarks Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Sample Capture Progress</span>
                <span className="text-blue-600 font-extrabold">{captureStep} of {REQUIRED_SAMPLES} Samples</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((stepNum) => {
                  const isDone = captureStep >= stepNum;
                  const isCurrent = captureStep === stepNum - 1;
                  return (
                    <div
                      key={stepNum}
                      className={`py-2 rounded-xl text-center text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : isCurrent
                          ? 'bg-blue-100 text-blue-800 border-2 border-blue-500 animate-pulse'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      <span>Capture {stepNum}</span>
                      {isDone && <CheckCircleIcon className="w-4 h-4 text-emerald-600" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Instruction Banner */}
            <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-2.5 rounded-xl text-xs text-center font-medium">
              💡 <span className="font-bold">Pose Guidance:</span> {SAMPLE_INSTRUCTIONS[captureStep] || 'Hold steady'}
            </div>

            {/* Reusable Camera Component */}
            <CameraModule
              onCameraReady={handleCameraReady}
              statusText={statusMsg}
              overlayText={`Capture ${captureStep + 1} of ${REQUIRED_SAMPLES}`}
            />

            {/* Validation Error Alert */}
            {validationError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-start gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Validation Warning</p>
                  <p>{validationError}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={captureSample}
                disabled={!isModelLoaded || isProcessing || captureStep >= REQUIRED_SAMPLES}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing Scan...
                  </>
                ) : (
                  `Take Capture Sample (${captureStep + 1}/${REQUIRED_SAMPLES})`
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
