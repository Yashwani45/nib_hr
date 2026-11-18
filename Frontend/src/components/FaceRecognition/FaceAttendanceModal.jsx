import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { apiFetch } from '../../services/hrApi';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  ArrowPathIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

// Synchronously retrieve cached employee list & logged in user to eliminate modal loading lag
const getInitialEmployeeState = () => {
  try {
    const cached = JSON.parse(localStorage.getItem('cached_attendance_employees') || '[]');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user && Array.isArray(cached) && cached.length > 0) {
      const uEmail = (user.email || '').toLowerCase().trim();
      const uEmpId = (user.employeeId || user.emp_id || user.employeeCode || '').toLowerCase().trim();
      const matched = cached.find(e => 
        (e.email && e.email.toLowerCase().trim() === uEmail) ||
        (e.officialEmail && e.officialEmail.toLowerCase().trim() === uEmail) ||
        (e.employeeCode && e.employeeCode.toLowerCase().trim() === uEmpId) ||
        (e.empCode && e.empCode.toLowerCase().trim() === uEmpId) ||
        (e.id && String(e.id).toLowerCase().trim() === uEmpId)
      );
      return { employees: cached, selected: matched || cached[0] };
    }
    if (user) {
      const fallback = {
        id: user.employeeId || user.id || user.emp_id,
        employeeCode: user.employeeCode || user.emp_code || user.employeeId || 'EMP',
        empCode: user.employeeCode || user.emp_code || user.employeeId || 'EMP',
        firstName: user.firstName || user.name || 'Employee',
        lastName: user.lastName || '',
        name: `${user.firstName || user.name || 'Employee'} ${user.lastName || ''}`.trim(),
        department: user.department || 'Operations',
        shift: user.shift || 'General Shift',
      };
      return { employees: [fallback], selected: fallback };
    }
  } catch (e) {}
  return { employees: [], selected: null };
};

export default function FaceAttendanceModal({ action = 'auto', onSuccess, onCancel }) {
  const initialState = getInitialEmployeeState();
  const [employees, setEmployees] = useState(initialState.employees);
  const [selectedEmployee, setSelectedEmployee] = useState(initialState.selected);
  const [punchAction, setPunchAction] = useState(action === 'auto' ? 'clock-in' : action);
  const [todayStatus, setTodayStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const [statusText, setStatusText] = useState('Phone camera ready. Please look into your phone camera.');
  const [faceState, setFaceState] = useState('WAITING'); // 'WAITING' | 'AUTHENTICATED' | 'CHECKING' | 'MATCHED' | 'ERROR'
  const [errorDetails, setErrorDetails] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [phoneSnappedImg, setPhoneSnappedImg] = useState(null);
  const [isSnappingPhone, setIsSnappingPhone] = useState(false);
  const [faceEnrollmentInfo, setFaceEnrollmentInfo] = useState(null);
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(true);
  const [isOneTimeRegistering, setIsOneTimeRegistering] = useState(false);

  // Authenticated user information from camera/backend
  const [authenticatedInfo, setAuthenticatedInfo] = useState(null);
  const [cachedPayload, setCachedPayload] = useState(null);
  const [attendanceSuccess, setAttendanceSuccess] = useState(null);

  const phoneImgRef = useRef(null);
  const verifyingLockRef = useRef(false);
  const lastEmbeddingRef = useRef(null);
  const autoTransitionTimerRef = useRef(null);

  // Super-fast 1-shot modal initialization: loads employees + face status + today's attendance simultaneously
  useEffect(() => {
    let isMounted = true;
    const initModal = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const userEmpId = user?.employeeId || user?.emp_id || user?.id || '';
        const res = await apiFetch(`/api/operations/attendance/modal-init?employeeId=${encodeURIComponent(userEmpId)}`);
        
        if (isMounted && res && res.data) {
          const list = res.data.employees || [];
          setEmployees(list);
          try {
            localStorage.setItem('cached_attendance_employees', JSON.stringify(list));
          } catch (e) {}

          const current = res.data.selectedEmployee || list[0] || null;
          setSelectedEmployee(current);

          if (res.data.todayStatus) {
            setTodayStatus(res.data.todayStatus);
            const nextAct = res.data.todayStatus.nextAction || 'clock-in';
            const effectiveAct = (nextAct === 'completed' || res.data.todayStatus.isCheckedOut) ? 'clock-in' : nextAct;
            setPunchAction(effectiveAct);
          }

          if (res.data.faceEnrollmentInfo) {
            setFaceEnrollmentInfo(res.data.faceEnrollmentInfo);
          } else if (current) {
            setFaceEnrollmentInfo({
              isEnrolled: Boolean(current.isEnrolled),
              status: current.isEnrolled ? 'ACTIVE' : 'NOT_REGISTERED',
              employeeId: current.id,
              employeeCode: current.employeeCode,
            });
          }
        }
      } catch (err) {
        console.warn('Fast modal-init fallback:', err);
      } finally {
        if (isMounted) setIsCheckingEnrollment(false);
      }
    };

    initModal();
    return () => {
      isMounted = false;
    };
  }, []);

  // Check face enrollment status for selected employee
  const checkFaceEnrollmentStatus = useCallback(async (emp) => {
    if (!emp) return;
    setIsCheckingEnrollment(true);
    try {
      const empIdentifier = emp.employeeCode || emp.emp_code || emp.id;
      const res = await apiFetch(`/api/operations/attendance/face/status?employeeId=${encodeURIComponent(emp.id)}&empId=${encodeURIComponent(empIdentifier)}`);
      if (res && res.data) {
        setFaceEnrollmentInfo(res.data);
      } else {
        setFaceEnrollmentInfo({ isEnrolled: false });
      }
    } catch (err) {
      console.warn('Failed to fetch face enrollment status:', err);
      setFaceEnrollmentInfo({ isEnrolled: false });
    } finally {
      setIsCheckingEnrollment(false);
    }
  }, []);

  // Launch normal phone camera on phone
  const handleLaunchPhoneCamera = useCallback(async () => {
    setStatusText('Opening normal camera app on phone...');
    try {
      await apiFetch('/api/operations/attendance/face/trigger-phone-cam', { method: 'POST' });
      setStatusText('Phone camera is open. Position your face and click "Capture & Verify Face".');
    } catch (e) {
      console.warn('ADB launch error:', e);
    }
  }, []);

  // Load today's punch status for selected employee
  const refreshTodayStatus = useCallback(async (emp) => {
    if (!emp) return;
    setLoadingStatus(true);
    try {
      const empIdentifier = emp.employeeCode || emp.emp_code || emp.id;
      const res = await apiFetch(`/api/operations/attendance/today-status?empId=${encodeURIComponent(empIdentifier)}&employeeId=${encodeURIComponent(emp.id)}`);
      if (res && res.data) {
        setTodayStatus(res.data);
        const nextAct = res.data.nextAction || 'clock-in';
        // When checkout is already done, always return to clock-in (never stay on completed)
        const effectiveAct = (nextAct === 'completed' || res.data.isCheckedOut) ? 'clock-in' : nextAct;
        setPunchAction(effectiveAct);
        if (effectiveAct === 'clock-out') {
          setStatusText('Check In is already marked for today. Camera ready for Check Out. Position face and click Capture & Verify Face.');
        } else {
          setStatusText('Phone camera ready. Position face in camera and click "Capture & Verify Face (Check In)".');
        }
      }
    } catch (err) {
      console.warn('Failed to fetch today attendance status:', err);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  const proceedToCheckOutNow = useCallback(() => {
    if (autoTransitionTimerRef.current) clearTimeout(autoTransitionTimerRef.current);
    setAttendanceSuccess(null);
    setPunchAction('clock-out');
    setFaceState('WAITING');
    setPhoneSnappedImg(null); // Clear frozen camera picture
    setAuthenticatedInfo(null);
    setCachedPayload(null);
    verifyingLockRef.current = false;
    setStatusText('Phone camera ready for Check Out. Look into camera and click Capture & Verify Face.');
    handleLaunchPhoneCamera();
    if (selectedEmployee) refreshTodayStatus(selectedEmployee);
  }, [handleLaunchPhoneCamera, refreshTodayStatus, selectedEmployee]);

  const proceedToCheckInNow = useCallback(() => {
    if (autoTransitionTimerRef.current) clearTimeout(autoTransitionTimerRef.current);
    setAttendanceSuccess(null);
    setPunchAction('clock-in');
    setFaceState('WAITING');
    setPhoneSnappedImg(null); // Clear frozen camera picture
    setAuthenticatedInfo(null);
    setCachedPayload(null);
    verifyingLockRef.current = false;
    setStatusText('Phone camera ready. Position face in camera and click Capture & Verify Face.');
    handleLaunchPhoneCamera();
    if (selectedEmployee) refreshTodayStatus(selectedEmployee);
  }, [handleLaunchPhoneCamera, refreshTodayStatus, selectedEmployee]);

  // Clean up auto transition timers on unmount
  useEffect(() => {
    return () => {
      if (autoTransitionTimerRef.current) {
        clearTimeout(autoTransitionTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      refreshTodayStatus(selectedEmployee);
      checkFaceEnrollmentStatus(selectedEmployee);
    }
  }, [selectedEmployee, refreshTodayStatus, checkFaceEnrollmentStatus]);

  // 1. Auto-open phone camera on mount
  useEffect(() => {
    handleLaunchPhoneCamera();
  }, [handleLaunchPhoneCamera]);

  // 2. Load Face-API neural network models on component mount
  useEffect(() => {
    let isMounted = true;
    const loadModels = async () => {
      try {
        setStatusText('Loading neural face recognition models...');
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);
        if (isMounted) {
          setIsModelLoaded(true);
          setStatusText('Phone camera ready. Position your face in the camera and click "Capture & Verify Face".');
        }
      } catch (err) {
        console.error('Error loading face-api models:', err);
        if (isMounted) {
          setStatusText('Phone camera ready. Position your face in the camera.');
        }
      }
    };

    loadModels();
    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Poll backend for live scan from external phone camera
  useEffect(() => {
    if (faceState === 'MATCHED' || faceState === 'AUTHENTICATED') return;

    let pollInterval = setInterval(async () => {
      try {
        const res = await apiFetch('/api/operations/attendance/face/live-scan', { method: 'GET' });
        if (res && res.data && res.data.matched && !authenticatedInfo) {
          if (selectedEmployee && res.data.employeeId && String(res.data.employeeId) !== String(selectedEmployee.id)) {
            // Live scan matched a different person, do not bind to current employee
            return;
          }
          setFaceState('AUTHENTICATED');
          setAuthenticatedInfo(res.data);
          setCachedPayload({
            method: 'FACE',
            faceData: {
              confidence: res.data.confidence || 0.95,
              livenessScore: 0.95,
              timestamp: new Date().toISOString(),
              embedding: res.data.embedding,
            },
          });
          setStatusText('User face is successfully authenticated');
        }
      } catch (err) {
        console.warn('Polling live-scan error:', err);
      }
    }, 1200);

    return () => clearInterval(pollInterval);
  }, [faceState, authenticatedInfo]);

  // Execute Attendance Submission (Clock-In / Clock-Out)
  const submitAttendance = async (overrideAction = null) => {
    setIsProcessing(true);
    setErrorDetails('');

    try {
      let payload = cachedPayload;

      if (!payload) {
        setErrorDetails('Please scan your face using the camera first.');
        setIsProcessing(false);
        return;
      }

      const effectiveAction = overrideAction || punchAction || (action === 'auto' ? 'clock-in' : action);
      setStatusText(`Recording ${effectiveAction === 'clock-out' ? 'Check Out' : 'Check In'} in database...`);

      const targetEmpId = selectedEmployee?.employeeCode || selectedEmployee?.emp_code || selectedEmployee?.id || authenticatedInfo?.employeeCode;
      const targetEmployeeUuid = selectedEmployee?.id || authenticatedInfo?.employeeId;
      const targetEmpName = selectedEmployee?.firstName || selectedEmployee?.employee_name || authenticatedInfo?.employeeName || 'Employee';

      const submitPayload = {
        ...payload,
        employeeId: targetEmployeeUuid,
        empId: targetEmpId,
        empCode: targetEmpId,
        name: targetEmpName,
      };

      let targetEndpoint = '/api/operations/attendance/clock-in';
      if (effectiveAction === 'clock-out') {
        targetEndpoint = '/api/operations/attendance/clock-out';
      }

      const res = await apiFetch(targetEndpoint, {
        method: 'POST',
        body: JSON.stringify(submitPayload),
      });

      if (res && (res.success || res.statusCode === 200 || res.statusCode === 201)) {
        setFaceState('MATCHED');
        const matchedName = targetEmpName;

        if (effectiveAction === 'clock-in') {
          const inTime = res.data?.checkIn || res.data?.check_in || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setStatusText(`Check In marked successfully for ${matchedName} (${targetEmpId}) at ${inTime}!`);
          setAttendanceSuccess({
            type: 'CHECK_IN',
            empName: matchedName,
            empId: targetEmpId,
            time: inTime,
            message: 'Check-In Marked Successfully!',
          });

          if (selectedEmployee) {
            refreshTodayStatus(selectedEmployee);
          }

          if (onSuccess) {
            onSuccess({ action: 'clock-in', completed: false, checkIn: inTime, ...res.data });
          }

          if (autoTransitionTimerRef.current) clearTimeout(autoTransitionTimerRef.current);
          autoTransitionTimerRef.current = setTimeout(() => {
            proceedToCheckOutNow();
          }, 2500);
        } else {
          // Check-Out
          const outTime = res.data?.checkOut || res.data?.check_out || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const inTime = todayStatus?.checkInTime || todayStatus?.check_in || '--';
          const workingHours = res.data?.workingHours || res.data?.working_hours || '0.1';
          setStatusText(`Check Out marked successfully for ${matchedName} (${targetEmpId}) at ${outTime}!`);
          setAttendanceSuccess({
            type: 'CHECK_OUT',
            empName: matchedName,
            empId: targetEmpId,
            inTime,
            outTime,
            workingHours,
            message: 'Check-Out Marked Successfully!',
          });

          if (selectedEmployee) {
            refreshTodayStatus(selectedEmployee);
          }

          if (onSuccess) {
            onSuccess({ action: 'clock-out', completed: true, checkOut: outTime, workingHours, ...res.data });
          }

          // Return to Check-In state and reset camera (No Shift Completed block!)
          if (autoTransitionTimerRef.current) clearTimeout(autoTransitionTimerRef.current);
          autoTransitionTimerRef.current = setTimeout(() => {
            proceedToCheckInNow();
          }, 2500);
        }
      } else {
        const msg = res?.message || 'Face not recognized or attendance error.';
        if (msg.includes('already checked in')) {
          setFaceState('ALREADY_CHECKED_IN');
          setErrorDetails('You have already checked in for today.');
          setPunchAction('clock-out');
        } else {
          setFaceState('ERROR');
          setErrorDetails(msg);
        }
      }
    } catch (err) {
      console.error('Attendance submission error:', err);
      const msg = err.message || '';
      if (msg.includes('already checked in')) {
        setFaceState('ALREADY_CHECKED_IN');
        setErrorDetails('You have already checked in for today.');
        setPunchAction('clock-out');
      } else {
        setFaceState('ERROR');
        setErrorDetails(msg || 'Server connection failed during attendance submission.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetTodayAttendance = async () => {
    if (!selectedEmployee) return;
    setIsProcessing(true);
    setStatusText('Resetting today attendance records...');
    try {
      const empIdentifier = selectedEmployee.employeeCode || selectedEmployee.emp_code || selectedEmployee.id;
      await apiFetch('/api/operations/attendance/reset-today', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: selectedEmployee.id,
          empId: empIdentifier,
        }),
      });
      setPunchAction('clock-in');
      setFaceState('WAITING');
      setPhoneSnappedImg(null);
      setAuthenticatedInfo(null);
      setCachedPayload(null);
      verifyingLockRef.current = false;
      setErrorDetails('');
      setTodayStatus({ isCheckedIn: false, isCheckedOut: false, nextAction: 'clock-in' });
      setStatusText('Today attendance reset! Opening phone camera for Check In...');
      handleLaunchPhoneCamera();
      if (selectedEmployee) {
        refreshTodayStatus(selectedEmployee);
      }
    } catch (e) {
      console.warn('Reset today attendance failed:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSnapPhoneCamera = async () => {
    setIsSnappingPhone(true);
    setStatusText('Capturing photo from Phone Camera...');
    setErrorDetails('');
    try {
      const res = await apiFetch('/api/operations/attendance/face/snap-phone', { method: 'GET' });
      if (res && res.data && res.data.image) {
        setPhoneSnappedImg(res.data.image);
        setStatusText('Photo captured from phone! Detecting face...');

        const img = new Image();
        img.src = res.data.image;
        img.onload = async () => {
          try {
            const detection = await faceapi
              .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 }))
              .withFaceLandmarks()
              .withFaceDescriptor();

            if (detection) {
              const descriptorArray = Array.from(detection.descriptor);
              lastEmbeddingRef.current = descriptorArray;

              const targetEmpId = selectedEmployee?.employeeCode || selectedEmployee?.emp_code || selectedEmployee?.id;

              // If employee is not yet registered, prompt one-time registration
              if (faceEnrollmentInfo && faceEnrollmentInfo.isEnrolled === false) {
                setStatusText('Face captured! Click "Register Face (One-Time)" below to complete registration.');
                return;
              }

              setStatusText('Face detected! Verifying identity with server...');

              const payload = {
                method: 'FACE',
                employeeId: selectedEmployee?.id,
                empId: targetEmpId,
                empCode: targetEmpId,
                embedding: descriptorArray,
                faceData: {
                  confidence: detection.detection.score,
                  livenessScore: 0.95,
                  timestamp: new Date().toISOString(),
                  embedding: descriptorArray,
                  image: res.data.image,
                },
              };

              try {
                const verifyRes = await apiFetch('/api/operations/attendance/face/verify', {
                  method: 'POST',
                  body: JSON.stringify(payload),
                });

                if (verifyRes && (verifyRes.success || verifyRes.statusCode === 200 || verifyRes.data?.matched)) {
                  setFaceState('AUTHENTICATED');
                  setAuthenticatedInfo(verifyRes.data);
                  setCachedPayload(payload);
                  setErrorDetails('');
                  setStatusText('User face is successfully authenticated from Phone Camera!');
                } else {
                  setFaceState('ERROR');
                  setAuthenticatedInfo(null);
                  setCachedPayload(null);
                  const errMsg = verifyRes?.message || 'Face not detected: Live face does not match the registered face for this employee.';
                  setErrorDetails(errMsg);
                  setStatusText(errMsg);
                }
              } catch (verifyErr) {
                console.warn('Face verification rejected by server:', verifyErr);
                setFaceState('ERROR');
                setAuthenticatedInfo(null);
                setCachedPayload(null);
                const rawMsg = verifyErr?.message || '';
                const isMatchErr = rawMsg.toLowerCase().includes('match') || rawMsg.toLowerCase().includes('reject') || rawMsg.toLowerCase().includes('failed');
                const cleanErr = isMatchErr
                  ? 'Face not detected: Live face does not match the registered face for this employee. Attendance rejected.'
                  : (rawMsg || 'Face not detected on captured frame.');
                setErrorDetails(cleanErr);
                setStatusText(cleanErr);
              }
            } else {
              setFaceState('ERROR');
              setAuthenticatedInfo(null);
              setCachedPayload(null);
              const notDetectedMsg = 'Face not detected. Please look directly into the phone camera and try again.';
              setErrorDetails(notDetectedMsg);
              setStatusText(notDetectedMsg);
            }
          } catch (detErr) {
            console.error('Phone face detect error:', detErr);
            setFaceState('ERROR');
            setAuthenticatedInfo(null);
            setCachedPayload(null);
            const rawMsg = detErr?.message || '';
            const isMatchErr = rawMsg.toLowerCase().includes('match') || rawMsg.toLowerCase().includes('reject');
            const cleanErr = isMatchErr
              ? 'Face not detected: Live face does not match the registered face for this employee.'
              : (rawMsg || 'Face not detected on captured frame.');
            setErrorDetails(cleanErr);
            setStatusText(cleanErr);
          } finally {
            setIsSnappingPhone(false);
          }
        };
      } else {
        const msg = res?.message || 'Phone camera frame capture failed.';
        const cleanMsg = msg.toLowerCase().includes('no devices')
          ? 'Phone is not connected via USB. Please connect your phone with a USB cable and enable USB Debugging.'
          : msg;
        setErrorDetails(cleanMsg);
        setStatusText(cleanMsg);
        setIsSnappingPhone(false);
      }
    } catch (e) {
      console.error('Phone snap error:', e);
      const msg = e.message || '';
      const cleanMsg = msg.toLowerCase().includes('no devices')
        ? 'Phone is not connected via USB. Please connect your phone with a USB cable and enable USB Debugging.'
        : (msg || 'Phone frame capture failed.');
      setErrorDetails(cleanMsg);
      setStatusText(cleanMsg);
      setIsSnappingPhone(false);
    }
  };

  // One-Time Face Registration: strictly permitted only once per Employee ID
  const handleOneTimeRegisterFace = async () => {
    if (!lastEmbeddingRef.current || !selectedEmployee) {
      setErrorDetails('Please capture your face using the phone camera first.');
      return;
    }

    if (faceEnrollmentInfo?.isEnrolled) {
      const lockMsg = 'Face already registered for this Employee ID. Re-registration is not allowed.';
      setErrorDetails(lockMsg);
      setStatusText(lockMsg);
      return;
    }

    setIsProcessing(true);
    setIsOneTimeRegistering(true);
    setErrorDetails('');
    setStatusText('Registering face in database (One-Time Registration)...');

    const targetEmpId = selectedEmployee.employeeCode || selectedEmployee.emp_code || selectedEmployee.id;
    try {
      const payload = {
        employeeId: selectedEmployee.id,
        empId: targetEmpId,
        empCode: targetEmpId,
        embedding: lastEmbeddingRef.current,
        sampleCount: 1,
        modelVersion: 'face-api-v1',
      };

      const res = await apiFetch('/api/operations/attendance/face/enroll', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res && (res.success || res.statusCode === 201 || res.statusCode === 200)) {
        setFaceEnrollmentInfo({
          isEnrolled: true,
          status: 'ACTIVE',
          enrolledAt: new Date().toISOString(),
          employeeCode: targetEmpId,
          employeeName: selectedEmployee.firstName || 'Employee',
        });
        setFaceState('AUTHENTICATED');
        setAuthenticatedInfo({
          employeeId: selectedEmployee.id,
          employeeCode: targetEmpId,
          employeeName: `${selectedEmployee.firstName || ''} ${selectedEmployee.lastName || ''}`.trim() || 'Employee',
          confidence: 0.99,
        });
        setCachedPayload({
          method: 'FACE',
          employeeId: selectedEmployee.id,
          empId: targetEmpId,
          empCode: targetEmpId,
          faceData: {
            confidence: 0.99,
            livenessScore: 0.95,
            timestamp: new Date().toISOString(),
            embedding: lastEmbeddingRef.current,
          },
        });
        setStatusText('Face registered successfully! One-time registration is now complete and active.');
        checkFaceEnrollmentStatus(selectedEmployee);
      } else {
        const msg = res?.message || 'Face registration failed.';
        setErrorDetails(msg);
        setStatusText(msg);
        if (msg.includes('Face already registered')) {
          setFaceEnrollmentInfo({ isEnrolled: true, message: msg });
        }
      }
    } catch (e) {
      console.error('One-time face registration error:', e);
      const msg = e.message || 'Server error during face registration.';
      setErrorDetails(msg);
      setStatusText(msg);
      if (msg.includes('Face already registered')) {
        setFaceEnrollmentInfo({ isEnrolled: true, message: msg });
      }
    } finally {
      setIsProcessing(false);
      setIsOneTimeRegistering(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md mx-auto overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center">
            <DevicePhoneMobileIcon className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h4 className="font-bold text-sm tracking-wide">Phone Face Attendance</h4>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              {punchAction === 'clock-out' ? 'Check-Out Verification' : 'Check-In Verification'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-blue-300 font-mono bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700/60">
          <ClockIcon className="w-3.5 h-3.5 text-blue-400" />
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Employee Selector Dropdown & Face Registration / Today Status Badge */}
        <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs flex-wrap gap-1">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <span>👤</span> Employee Profile:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {isCheckingEnrollment || (!faceEnrollmentInfo && !selectedEmployee) ? (
                <span className="text-[10px] text-slate-400 font-semibold animate-pulse">Checking status...</span>
              ) : faceEnrollmentInfo?.isEnrolled ? (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  🔒 Face Registered (One-Time Active)
                </span>
              ) : (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                  ⚠️ No Face Registered
                </span>
              )}
              {todayStatus && (
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  todayStatus.isCheckedOut
                    ? 'bg-purple-100 text-purple-700'
                    : todayStatus.isCheckedIn
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {todayStatus.isCheckedOut
                    ? `🏁 Out: ${todayStatus.checkOutTime || '--'}`
                    : todayStatus.isCheckedIn
                    ? `🟢 In: ${todayStatus.checkInTime || '--'}`
                    : '⚪ Not Checked In'}
                </span>
              )}
            </div>
          </div>

          {employees.length > 0 ? (
            <select
              value={selectedEmployee?.id || ''}
              onChange={(e) => {
                const chosen = employees.find(emp => emp.id === e.target.value);
                if (chosen) {
                  setSelectedEmployee(chosen);
                  if (chosen.todayStatus) {
                    setTodayStatus(chosen.todayStatus);
                    const nextAct = chosen.todayStatus.nextAction || 'clock-in';
                    const effectiveAct = (nextAct === 'completed' || chosen.todayStatus.isCheckedOut) ? 'clock-in' : nextAct;
                    setPunchAction(effectiveAct);
                  }
                  setFaceEnrollmentInfo({
                    isEnrolled: Boolean(chosen.isEnrolled),
                    status: chosen.isEnrolled ? 'ACTIVE' : 'NOT_REGISTERED',
                    employeeId: chosen.id,
                    employeeCode: chosen.employeeCode || chosen.empCode
                  });
                }
                setFaceState('WAITING');
                setAuthenticatedInfo(null);
                setCachedPayload(null);
                verifyingLockRef.current = false;
              }}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.employeeCode || emp.emp_code || 'EMP'} - {emp.firstName || emp.employee_name || 'Employee'} {emp.lastName || ''} ({emp.department || 'Operations'})
                </option>
              ))}
            </select>
          ) : (
            <div className="text-xs font-medium text-slate-500 animate-pulse">Loading employee profile...</div>
          )}
        </div>

        {/* Dedicated Phone Camera Scanner Viewport */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-center border-2 border-slate-800 shadow-inner">
          {phoneSnappedImg ? (
            <div className={`relative w-48 h-48 rounded-xl overflow-hidden mx-auto shadow-lg transition-all ${
              faceState === 'ERROR'
                ? 'border-4 border-rose-500 ring-4 ring-rose-500/30 shadow-rose-500/40'
                : faceState === 'AUTHENTICATED' || faceState === 'MATCHED'
                ? 'border-4 border-emerald-400 ring-4 ring-emerald-400/30 shadow-emerald-400/40'
                : 'border-2 border-blue-400 shadow-md'
            }`}>
              <img
                src={phoneSnappedImg}
                alt="Phone Camera Snapshot"
                className="w-full h-full object-cover"
              />
              {/* Dynamic Status Overlay Badge */}
              {faceState === 'ERROR' ? (
                <div className="absolute inset-x-0 bottom-0 bg-rose-950/95 text-[11px] text-rose-200 font-extrabold py-1.5 px-2 border-t-2 border-rose-500 flex items-center justify-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  ❌ Face Not Detected / Mismatched
                </div>
              ) : faceState === 'AUTHENTICATED' || faceState === 'MATCHED' ? (
                <div className="absolute inset-x-0 bottom-0 bg-emerald-950/95 text-[11px] text-emerald-200 font-extrabold py-1.5 px-2 border-t-2 border-emerald-400 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  ✅ Face Verified & Matched
                </div>
              ) : (
                <div className="absolute bottom-1 right-1 bg-black/70 text-[10px] text-emerald-300 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Phone Live Capture
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setPhoneSnappedImg(null);
                  setAuthenticatedInfo(null);
                  setCachedPayload(null);
                  setFaceState('WAITING');
                  verifyingLockRef.current = false;
                  setStatusText('Camera preview cleared. Position face and click Capture & Verify Face.');
                }}
                className="absolute top-1 right-1 bg-black/75 hover:bg-black text-slate-200 hover:text-white text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition shadow"
                title="Clear current snapshot and take a fresh photo"
              >
                ✕ Retake
              </button>
            </div>
          ) : (
            <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all ${
              faceState === 'ERROR'
                ? 'bg-rose-500/20 border-rose-500 text-rose-400 ring-4 ring-rose-500/30'
                : 'bg-blue-500/10 border-blue-400/40 text-blue-400'
            }`}>
              <DevicePhoneMobileIcon className={`w-8 h-8 ${faceState === 'ERROR' ? 'animate-bounce' : 'animate-pulse'}`} />
            </div>
          )}

          <div>
            <h5 className="font-extrabold text-sm text-slate-100 flex items-center justify-center gap-1.5">
              <DevicePhoneMobileIcon className="w-4 h-4 text-blue-400" />
              Phone Camera (USB Mode)
            </h5>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {punchAction === 'clock-out'
                ? 'Camera ready for Check-Out. Look into your phone camera and click Capture & Verify Face.'
                : 'Camera ready for Check-In. Look into your phone camera and click Capture & Verify Face.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 w-full">
            <button
              type="button"
              onClick={handleLaunchPhoneCamera}
              className="text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 px-3.5 rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer transition hover:border-slate-600"
            >
              <ArrowPathIcon className="w-3.5 h-3.5 text-blue-400" />
              Open Phone Camera
            </button>

            <button
              type="button"
              onClick={handleSnapPhoneCamera}
              disabled={isSnappingPhone}
              className="text-xs font-extrabold bg-blue-600 hover:bg-blue-500 text-white py-2.5 px-5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md transition disabled:opacity-50 active:scale-95"
            >
              {isSnappingPhone ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Capturing & Verifying...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4 text-blue-200" />
                  {punchAction === 'clock-out' ? 'Capture & Verify Face (Check Out)' : 'Capture & Verify Face (Check In)'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Indicator Bar */}
        <div
          className={`p-3 rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-2 ${
            faceState === 'MATCHED' || faceState === 'AUTHENTICATED'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : faceState === 'CHECKING'
              ? 'bg-blue-100 text-blue-800 border border-blue-200 animate-pulse'
              : faceState === 'ALREADY_CHECKED_IN'
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : faceState === 'ERROR'
              ? 'bg-rose-100 text-rose-900 border-2 border-rose-400 font-extrabold shadow-sm'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {faceState === 'CHECKING' && (
            <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          )}
          <span>{statusText}</span>
        </div>

        {/* One-Time Registration Section (Strictly displayed only when employee has NO registered face) */}
        {faceEnrollmentInfo && !faceEnrollmentInfo.isEnrolled && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 p-3.5 rounded-xl flex flex-col gap-2.5 text-xs shadow-sm animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                <span>⭐</span> One-Time Face Registration Required
              </span>
              <span className="text-[10px] font-extrabold bg-blue-200 text-blue-900 px-2 py-0.5 rounded">
                1 Time Only
              </span>
            </div>
            <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
              This Employee ID ({selectedEmployee?.employeeCode || 'EMP'}) does not have a registered face yet. Capture face with phone camera and click <b>Register Face (One-Time)</b>. Once registered, re-registration will be permanently locked.
            </p>
            <button
              type="button"
              onClick={handleOneTimeRegisterFace}
              disabled={isProcessing || isOneTimeRegistering || !lastEmbeddingRef.current}
              className={`w-full py-2.5 px-4 rounded-lg text-xs font-extrabold flex items-center justify-center gap-2 transition shadow ${
                !lastEmbeddingRef.current
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer active:scale-95'
              }`}
            >
              {isOneTimeRegistering ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Registering Face...
                </>
              ) : !lastEmbeddingRef.current ? (
                '📷 Capture Face First to Enable Registration'
              ) : (
                '⭐ Register Face (One-Time)'
              )}
            </button>
          </div>
        )}

        {/* User Successfully Authenticated Banner */}
        {faceState === 'AUTHENTICATED' && (
          <div className="bg-emerald-50 border-2 border-emerald-500 p-4 rounded-xl text-center space-y-1.5 shadow-sm transition-all animate-fade-in">
            <CheckCircleIcon className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="font-extrabold text-sm text-emerald-950 flex items-center justify-center gap-1.5">
              <SparklesIcon className="w-4 h-4 text-emerald-600" />
              User Face Successfully Authenticated!
            </h4>
            <p className="text-xs font-extrabold text-emerald-800">
              {selectedEmployee?.firstName
                ? `${selectedEmployee.firstName} ${selectedEmployee.lastName || ''}`.trim()
                : authenticatedInfo?.employeeName || authenticatedInfo?.name || 'Authorized Employee'}
              {` (${selectedEmployee?.employeeCode || selectedEmployee?.emp_code || authenticatedInfo?.employeeCode || 'EMP'})`}
            </p>
            <div className="pt-1.5">
              {punchAction === 'clock-out' ? (
                <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300 inline-block shadow-sm">
                  🚪 Check In is recorded! Click <b>Mark Attendance (Check Out)</b> below.
                </span>
              ) : (
                <span className="text-[11px] font-bold text-emerald-900 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 inline-block shadow-sm">
                  👉 Click <b>Mark Attendance (Check In)</b> below to proceed.
                </span>
              )}
            </div>
          </div>
        )}

        {/* Dedicated Check-In / Check-Out Success Card with Smooth Countdown */}
        {attendanceSuccess && (
          <div className={`p-4 rounded-2xl text-center space-y-2 border-2 shadow-md animate-fade-in ${
            attendanceSuccess.type === 'CHECK_IN'
              ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
              : 'bg-purple-50 border-purple-500 text-purple-950'
          }`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto border-2 ${
              attendanceSuccess.type === 'CHECK_IN'
                ? 'bg-emerald-100 text-emerald-600 border-emerald-300'
                : 'bg-purple-100 text-purple-600 border-purple-300'
            }`}>
              <CheckCircleIcon className="w-8 h-8" />
            </div>

            <h4 className="font-extrabold text-base">
              {attendanceSuccess.type === 'CHECK_IN' ? '🎉 Check-In Marked Successfully!' : '🎉 Check-Out Marked Successfully!'}
            </h4>

            <div className="bg-white/95 border border-slate-200 rounded-xl px-4 py-2 inline-block shadow-xs text-xs">
              <div className="font-bold text-slate-800">
                {attendanceSuccess.empName} ({attendanceSuccess.empId})
              </div>
              <div className={`font-extrabold text-sm mt-0.5 ${
                attendanceSuccess.type === 'CHECK_IN' ? 'text-emerald-700' : 'text-purple-700'
              }`}>
                {attendanceSuccess.type === 'CHECK_IN'
                  ? `Time: ${attendanceSuccess.time} | Status: Present`
                  : `In: ${attendanceSuccess.inTime} | Out: ${attendanceSuccess.outTime} (${attendanceSuccess.workingHours} hrs)`}
              </div>
            </div>

            <p className="text-xs font-semibold opacity-90">
              {attendanceSuccess.type === 'CHECK_IN'
                ? 'Attendance recorded. Preparing camera for Check-Out...'
                : 'Check-Out recorded. Camera and state ready for next Check-In.'}
            </p>

            <button
              type="button"
              onClick={attendanceSuccess.type === 'CHECK_IN' ? proceedToCheckOutNow : proceedToCheckInNow}
              className={`mt-1 font-extrabold text-xs py-2 px-5 rounded-xl text-white shadow-md transition cursor-pointer active:scale-95 ${
                attendanceSuccess.type === 'CHECK_IN'
                  ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-300'
                  : 'bg-purple-600 hover:bg-purple-700 ring-2 ring-purple-300'
              }`}
            >
              {attendanceSuccess.type === 'CHECK_IN' ? 'Proceed to Check Out ➔' : 'Ready for Check In ➔'}
            </button>
          </div>
        )}

        {/* Already Checked In Handler Option */}
        {faceState === 'ALREADY_CHECKED_IN' && (
          <div className="bg-amber-50 border-2 border-amber-400 p-4 rounded-xl text-center space-y-2 shadow-sm animate-fade-in">
            <h5 className="font-extrabold text-sm text-amber-900">
              You have already checked in for today!
            </h5>
            <p className="text-xs text-amber-800">
              Would you like to mark <b>Check Out</b> now?
            </p>
            <button
              type="button"
              onClick={() => submitAttendance('clock-out')}
              disabled={isProcessing}
              className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-2 px-5 rounded-lg text-xs cursor-pointer shadow transition"
            >
              {isProcessing ? 'Recording Check Out...' : 'Proceed with Check Out'}
            </button>
          </div>
        )}

        {/* Error Details */}
        {errorDetails && faceState !== 'ALREADY_CHECKED_IN' && (
          <div className="bg-rose-50 border-2 border-rose-400 text-rose-800 p-3.5 rounded-xl text-xs flex items-start gap-2.5 shadow-sm animate-shake">
            <ExclamationTriangleIcon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-rose-950">❌ Face Not Detected / Verification Failed</p>
              <p className="font-medium mt-0.5 leading-relaxed">{errorDetails}</p>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col gap-2.5 pt-2">
          <div className="flex gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isProcessing}
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={() => submitAttendance()}
              disabled={isProcessing || faceState !== 'AUTHENTICATED' || !cachedPayload}
              className={`flex-1 font-extrabold py-3.5 px-6 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg ${
                faceState !== 'AUTHENTICATED' || !cachedPayload
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 opacity-75 shadow-none'
                  : punchAction === 'clock-out'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white ring-4 ring-amber-300 shadow-amber-500/30 active:scale-[0.98] cursor-pointer'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white ring-4 ring-emerald-300 shadow-emerald-500/30 active:scale-[0.98] cursor-pointer'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Recording Attendance...
                </>
              ) : faceState !== 'AUTHENTICATED' || !cachedPayload ? (
                `⚠️ Verify Registered Face First`
              ) : punchAction === 'clock-out' ? (
                `🚪 Mark Attendance (Check Out)`
              ) : (
                `✅ Mark Attendance (Check In)`
              )}
            </button>
          </div>

          {/* Optional Quick Reset Option for testing fresh cycle */}
          <button
            type="button"
            onClick={handleResetTodayAttendance}
            disabled={isProcessing}
            className="text-[11px] font-bold text-slate-400 hover:text-blue-700 py-1 text-center cursor-pointer transition flex items-center justify-center gap-1 mx-auto"
          >
            <span>↺</span> Reset Today's Attendance (Test Fresh Cycle)
          </button>
        </div>
      </div>
    </div>
  );
}
