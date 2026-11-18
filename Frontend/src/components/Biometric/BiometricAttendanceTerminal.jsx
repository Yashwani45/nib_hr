import React, { useState, useEffect, useRef, useMemo } from 'react';
import { apiFetch } from '../../services/hrApi';
import { useAuth } from '../../auth/AuthProvider';
import {
  FingerPrintIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ComputerDesktopIcon,
  SignalIcon,
  ClockIcon,
  UserIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';

/**
 * High-tech Web Audio Synthesizer for Biometric Hardware Sound Effects
 */
const playBiometricSound = (type = 'scan') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'scan') {
      // Rapid optical sweep chirp
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.23);
    } else if (type === 'success') {
      // Harmonious double chime
      const now = ctx.currentTime;
      [659.25, 880.0].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.12, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.36);
      });
    } else if (type === 'error') {
      // Low dual warning buzzer
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(175, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.29);
    }
  } catch (e) {
    // Graceful fallback if Web Audio is muted/blocked
  }
};

export default function BiometricAttendanceTerminal({ dbData = {}, onClose = null }) {
  const { user } = useAuth();

  // Active terminal configuration
  const [terminalConfig, setTerminalConfig] = useState({
    deviceId: '',
    deviceName: 'Biometric terminal not configured',
    serialNumber: '',
    ipAddress: '',
    location: '',
    sensorType: 'Physical device event sync',
    status: 'Unknown'
  });

  // Mode: 'IN' (Check In) or 'OUT' (Check Out)
  const [punchMode, setPunchMode] = useState('IN');

  // Employee Selection
  const [employeeList, setEmployeeList] = useState([]);
  const [selectedEmpCode, setSelectedEmpCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  // Scanner status states: 'IDLE' | 'SCANNING' | 'VERIFIED' | 'FAILED'
  const [scannerState, setScannerState] = useState('IDLE');
  const [statusMessage, setStatusMessage] = useState('Fingerprint verification takes place on the physical device.');
  const [lastPunchResult, setLastPunchResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Live Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Biometric Logs list
  const [biometricLogs, setBiometricLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Attendance records for status checking
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  const handleScanAndPunch = () => {
    const message = 'This browser cannot trigger or verify a fingerprint. Use the physical terminal; attendance appears after its authenticated SDK bridge syncs the event.';
    setScannerState('FAILED');
    setErrorMessage(message);
    setStatusMessage(message);
  };

  // Live clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Organization Attendance Configuration for Biometric Devices
  const fetchTerminalConfig = async () => {
    try {
      const res = await apiFetch('/api/operations/attendance/config');
      if (res && res.data && res.data.methods) {
        const bioMethod = res.data.methods.find(m => m.method_type === 'BIOMETRIC');
        if (bioMethod && bioMethod.settings && Array.isArray(bioMethod.settings.devices) && bioMethod.settings.devices.length > 0) {
          const primaryDev = bioMethod.settings.devices[0];
          setTerminalConfig(prev => ({
            ...prev,
            deviceId: primaryDev.deviceId || prev.deviceId,
            deviceName: primaryDev.deviceName || prev.deviceName,
            serialNumber: primaryDev.serialNumber || prev.serialNumber,
            ipAddress: primaryDev.ipAddress || prev.ipAddress,
            location: primaryDev.location || prev.location,
            status: primaryDev.status || 'Active'
          }));
        }
      }
    } catch (e) {
      console.warn('Could not fetch biometric terminal config:', e.message);
    }
  };

  // Fetch Employees for the current organization
  const fetchEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      // 1. Blazing fast unified attendance init endpoint (~10ms)
      try {
        const initRes = await apiFetch('/api/operations/attendance/modal-init');
        if (initRes && initRes.data && Array.isArray(initRes.data.employees) && initRes.data.employees.length > 0) {
          setEmployeeList(initRes.data.employees);
          if (!selectedEmpCode) {
            const first = initRes.data.employees[0];
            const code = first.employeeCode || first.empCode || first.emp_code || String(first.id);
            setSelectedEmpCode(code);
          }
          setIsLoadingEmployees(false);
          return;
        }
      } catch (initErr) {
        // Fallback to table fetch if modal-init fails
      }

      // Fallback: try dbData if provided
      let list = dbData['employees'] || dbData['employee_profile'] || dbData['Employee Profile'] || [];
      if (!list || list.length === 0) {
        const res = await apiFetch('/api/core/table/employees');
        if (res && res.data) {
          list = Array.isArray(res.data) ? res.data : (res.data.records || []);
        }
      }
      setEmployeeList(list || []);

      // Auto select first employee if none selected
      if (list && list.length > 0 && !selectedEmpCode) {
        const first = list[0];
        const code = first.employeeCode || first.emp_code || first.employeeId || String(first.id);
        setSelectedEmpCode(code);
      }
    } catch (e) {
      console.error('Failed to load employees for biometric terminal:', e);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  // Fetch Biometric Logs
  const fetchBiometricLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await apiFetch('/api/core/table/biometric_logs');
      if (res && res.data) {
        const logs = Array.isArray(res.data) ? res.data : (res.data.records || []);
        // Sort descending by punchTime or created_at
        logs.sort((a, b) => new Date(b.punchTime || b.created_at || 0) - new Date(a.punchTime || a.created_at || 0));
        setBiometricLogs(logs);
      }

      // Also fetch today's attendance for status lookup
      const attRes = await apiFetch('/api/core/table/daily_attendance');
      if (attRes && attRes.data) {
        const attList = Array.isArray(attRes.data) ? attRes.data : (attRes.data.records || []);
        setAttendanceRecords(attList);
      }
    } catch (e) {
      console.warn('Failed to load biometric logs:', e.message);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchTerminalConfig();
    fetchEmployees();
    fetchBiometricLogs();
  }, []);

  // Filtered employees based on search
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employeeList;
    const q = searchQuery.toLowerCase().trim();
    return employeeList.filter(emp => {
      const name = `${emp.firstName || ''} ${emp.lastName || ''} ${emp.name || ''}`.toLowerCase();
      const code = String(emp.employeeCode || emp.emp_code || emp.id || '').toLowerCase();
      const dept = String(emp.department || '').toLowerCase();
      return name.includes(q) || code.includes(q) || dept.includes(q);
    });
  }, [employeeList, searchQuery]);

  // Selected Employee Details
  const selectedEmployee = useMemo(() => {
    return employeeList.find(emp => {
      const code = emp.employeeCode || emp.emp_code || emp.employeeId || String(emp.id);
      return String(code).toLowerCase() === String(selectedEmpCode).toLowerCase();
    }) || employeeList[0];
  }, [employeeList, selectedEmpCode]);

  // Lookup today's punch status for selected employee
  const todayDateStr = useMemo(() => currentTime.toISOString().split('T')[0], [currentTime]);

  const selectedEmpTodayRecord = useMemo(() => {
    if (!selectedEmployee) return null;
    const empCode = selectedEmployee.employeeCode || selectedEmployee.emp_code || selectedEmployee.employeeId || String(selectedEmployee.id);
    return attendanceRecords.find(r => {
      const matchesEmp = String(r.empId).toLowerCase() === String(empCode).toLowerCase() || String(r.employeeId) === String(selectedEmployee.id);
      return matchesEmp && r.date === todayDateStr;
    });
  }, [selectedEmployee, attendanceRecords, todayDateStr]);

  // Auto-detect and suggest punch mode (IN vs OUT) based on current punch status
  useEffect(() => {
    if (selectedEmployee) {
      const empCode = selectedEmployee.employeeCode || selectedEmployee.emp_code || selectedEmployee.employeeId || String(selectedEmployee.id);
      const empToday = attendanceRecords.find(r => {
        const matchesEmp = String(r.empId).toLowerCase() === String(empCode).toLowerCase() || String(r.employeeId) === String(selectedEmployee.id);
        return matchesEmp && r.date === todayDateStr;
      });
      const isPunchedIn = empToday && empToday.checkIn && empToday.checkIn !== '--' && (!empToday.checkOut || empToday.checkOut === '--');
      if (isPunchedIn) {
        setPunchMode('OUT');
        setStatusMessage(`Punched in at ${empToday.checkIn}. Ready for Check-Out fingerprint scan.`);
      } else {
        setPunchMode('IN');
        setStatusMessage('Ready for Check-In fingerprint scan.');
      }
    }
  }, [selectedEmpCode, attendanceRecords, todayDateStr]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Top Banner / Hardware Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        {/* Futuristic background grid accent */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-indigo-600/30 border border-indigo-500/40 rounded-2xl text-indigo-400 shadow-inner">
              <FingerPrintIcon className="w-10 h-10 animate-pulse text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                  Biometric Attendance Terminal
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  DEVICE LINK UNVERIFIED
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-300 mt-1 flex items-center gap-3 flex-wrap">
                <span className="font-semibold text-indigo-300">{terminalConfig.deviceName} ({terminalConfig.deviceId})</span>
                <span>•</span>
                <span className="text-cyan-400 font-mono text-[11px]">{terminalConfig.sensorType}</span>
              </p>
            </div>
          </div>

          {/* Live Terminal Clock & Refresh */}
          <div className="flex items-center gap-4 bg-slate-800/80 border border-slate-700/80 rounded-xl px-5 py-3 self-start lg:self-auto shadow-sm">
            <div className="text-right">
              <div className="text-lg md:text-xl font-mono font-black text-cyan-300 tracking-wider">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </div>
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <button
              onClick={() => {
                fetchTerminalConfig();
                fetchEmployees();
                fetchBiometricLogs();
              }}
              title="Sync Terminal Data"
              className="p-2 hover:bg-slate-700/60 rounded-lg text-slate-300 hover:text-white transition"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isLoadingLogs ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                title="Close Biometric Terminal"
                className="p-2 hover:bg-rose-500/30 rounded-lg text-slate-300 hover:text-rose-300 transition"
              >
                <XCircleIcon className="w-6 h-6 text-slate-300 hover:text-white" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Employee Selection & Mode (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Mode Switch Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <ClockIcon className="w-4 h-4 text-indigo-600" />
              1. Select Punch Action
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPunchMode('IN');
                  setScannerState('IDLE');
                  setStatusMessage('Ready for Check-In fingerprint scan.');
                  setErrorMessage('');
                }}
                className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-bold text-sm transition-all border ${
                  punchMode === 'IN'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 ring-2 ring-emerald-400/30'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span>PUNCH IN (Check In)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPunchMode('OUT');
                  setScannerState('IDLE');
                  setStatusMessage('Ready for Check-Out fingerprint scan.');
                  setErrorMessage('');
                }}
                className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-bold text-sm transition-all border ${
                  punchMode === 'OUT'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20 ring-2 ring-amber-400/30'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                <span>PUNCH OUT (Check Out)</span>
              </button>
            </div>
          </div>

          {/* Employee Picker Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col h-[460px]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <UserIcon className="w-4 h-4 text-indigo-600" />
                2. Select Employee ({employeeList.length})
              </h2>
              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                Active Organization
              </span>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by name, code (e.g. TVN2007, Yash)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Scrollable list of Employees */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {isLoadingEmployees ? (
                <div className="flex items-center justify-center h-40 text-slate-400 text-xs gap-2">
                  <ArrowPathIcon className="w-4 h-4 animate-spin text-indigo-600" />
                  Loading organization employees...
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No employees matched "{searchQuery}"
                </div>
              ) : (
                filteredEmployees.map((emp) => {
                  const empCode = emp.employeeCode || emp.emp_code || emp.employeeId || String(emp.id);
                  const empName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.employee_name || 'Employee';
                  const isSelected = String(empCode).toLowerCase() === String(selectedEmpCode).toLowerCase();

                  // Check punch status for today
                  const empToday = attendanceRecords.find(r => 
                    (String(r.empId).toLowerCase() === String(empCode).toLowerCase() || String(r.employeeId) === String(emp.id)) &&
                    r.date === todayDateStr
                  );

                  const isShiftDone = empToday && empToday.checkOut && empToday.checkOut !== '--';
                  const isPunchedIn = empToday && empToday.checkIn && empToday.checkIn !== '--' && !isShiftDone;

                  return (
                    <div
                      key={emp.id || empCode}
                      onClick={() => {
                        setSelectedEmpCode(empCode);
                        setScannerState('IDLE');
                        setStatusMessage(`Ready to scan fingerprint for ${empName} (${empCode}).`);
                        setErrorMessage('');
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-50/80 border-indigo-400 ring-1 ring-indigo-400/30 shadow-xs'
                          : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {empName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {empName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 truncate">
                            <span className="font-mono font-semibold text-slate-600">{empCode}</span>
                            <span>•</span>
                            <span>{emp.department || 'Operations'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0 text-right">
                        {isShiftDone ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Done ({empToday.checkOut})
                          </span>
                        ) : isPunchedIn ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            In ({empToday.checkIn})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-50 text-slate-400 border border-slate-200">
                            Not In
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Holographic Biometric Scanner UI (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 shadow-2xl relative overflow-hidden flex flex-col items-center justify-between min-h-[580px]">
            {/* Ambient Background Glow */}
            <div className={`absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
              scannerState === 'SCANNING' ? 'bg-cyan-500/25' :
              scannerState === 'VERIFIED' ? 'bg-emerald-500/30' :
              scannerState === 'FAILED' ? 'bg-rose-500/30' : 'bg-indigo-600/15'
            }`}></div>
            <div className={`absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
              scannerState === 'SCANNING' ? 'bg-indigo-500/25' :
              scannerState === 'VERIFIED' ? 'bg-emerald-500/30' :
              scannerState === 'FAILED' ? 'bg-rose-500/30' : 'bg-cyan-600/15'
            }`}></div>

            {/* Scanner Header Bar */}
            <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-4 relative z-10">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
                  Physical Device Event Sync
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">
                  Mode: <strong className={punchMode === 'IN' ? 'text-emerald-400' : 'text-amber-400'}>{punchMode === 'IN' ? 'CHECK-IN' : 'CHECK-OUT'}</strong>
                </span>
              </div>
            </div>

            {/* Central Holographic Fingerprint Scanning Bed */}
            <div className="my-auto flex flex-col items-center justify-center relative z-10 py-6">
              {/* Target Employee Preview Badge */}
              {selectedEmployee && (
                <div className="mb-6 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Target:</span>
                  <span className="font-bold text-white">
                    {`${selectedEmployee.firstName || ''} ${selectedEmployee.lastName || ''}`.trim() || 'Employee'}
                  </span>
                  <span className="text-cyan-400 font-mono font-bold">
                    ({selectedEmployee.employeeCode || selectedEmployee.emp_code || selectedEmployee.id})
                  </span>
                </div>
              )}

              {/* The Scanner Touch Plate */}
              <div
                className={`relative w-56 h-56 md:w-64 md:h-64 rounded-full flex items-center justify-center cursor-default select-none transition-all duration-500 ${
                  scannerState === 'SCANNING'
                    ? 'ring-4 ring-cyan-400/80 shadow-[0_0_50px_rgba(34,211,238,0.4)] scale-102 bg-slate-900/90'
                    : scannerState === 'VERIFIED'
                    ? 'ring-4 ring-emerald-400 shadow-[0_0_60px_rgba(52,211,153,0.5)] bg-emerald-950/40'
                    : scannerState === 'FAILED'
                    ? 'ring-4 ring-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.4)] bg-rose-950/40'
                    : 'ring-2 ring-slate-700/80 hover:ring-cyan-500/80 shadow-[0_0_30px_rgba(99,102,241,0.15)] hover:shadow-[0_0_40px_rgba(34,211,238,0.25)] bg-slate-900/60 hover:scale-102'
                }`}
              >
                {/* Rotating HUD Ring */}
                <div className={`absolute inset-2 rounded-full border border-dashed transition-all duration-1000 ${
                  scannerState === 'SCANNING'
                    ? 'border-cyan-400 animate-spin [animation-duration:3s]'
                    : scannerState === 'VERIFIED'
                    ? 'border-emerald-400 animate-pulse'
                    : 'border-slate-700/60'
                }`}></div>

                {/* Laser Sweep Beam (during scanning) */}
                {scannerState === 'SCANNING' && (
                  <div className="absolute inset-x-4 h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-bounce [animation-duration:1s] z-20 pointer-events-none rounded-full"></div>
                )}

                {/* Fingerprint Vector Graphic with minutiae ridges */}
                <div className="relative z-10 p-6">
                  <FingerPrintIcon className={`w-32 h-32 md:w-36 md:h-36 transition-all duration-500 ${
                    scannerState === 'SCANNING'
                      ? 'text-cyan-300 drop-shadow-[0_0_20px_#22d3ee] animate-pulse'
                      : scannerState === 'VERIFIED'
                      ? 'text-emerald-400 drop-shadow-[0_0_25px_#34d399]'
                      : scannerState === 'FAILED'
                      ? 'text-rose-400 drop-shadow-[0_0_20px_#f43f5e]'
                      : 'text-slate-500 hover:text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                  }`} />
                </div>

                {/* Verified Checkmark Overlay */}
                {scannerState === 'VERIFIED' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 rounded-full z-20 backdrop-blur-xs">
                    <CheckCircleIcon className="w-20 h-20 text-emerald-400 animate-scale" />
                  </div>
                )}

                {/* Failed Error Overlay */}
                {scannerState === 'FAILED' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 rounded-full z-20 backdrop-blur-xs">
                    <XCircleIcon className="w-20 h-20 text-rose-500 animate-scale" />
                  </div>
                )}
              </div>

              {/* Status Text & Instruction */}
              <div className="mt-6 text-center max-w-md">
                <p className={`text-sm font-semibold tracking-wide transition-colors ${
                  scannerState === 'SCANNING' ? 'text-cyan-300 animate-pulse' :
                  scannerState === 'VERIFIED' ? 'text-emerald-400 font-bold' :
                  scannerState === 'FAILED' ? 'text-rose-400 font-bold' : 'text-slate-300'
                }`}>
                  {statusMessage}
                </p>

                {errorMessage && (
                  <div className="mt-2 text-xs bg-rose-500/15 border border-rose-500/30 text-rose-300 px-3 py-1.5 rounded-lg">
                    {errorMessage}
                  </div>
                )}

                <p className="text-[11px] text-slate-500 mt-2">
                  {scannerState === 'IDLE' ? 'Click scanner bed or press button below to verify fingerprint' : ''}
                </p>
              </div>
            </div>

            {/* Bottom Action Button */}
            <div className="w-full relative z-10 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
                <span>SuperAdmin Biometric Policy: <strong className="text-white">Active & Enforced</strong></span>
              </div>

              <button
                type="button"
                disabled
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2.5 transition-all shadow-lg ${
                'bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <FingerPrintIcon className="w-5 h-5" />
                <span>Fingerprint scan must be completed on the physical terminal</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal / Banner Card */}
      {lastPunchResult && lastPunchResult.success && (
        <div className="bg-gradient-to-r from-emerald-900/40 via-slate-900 to-emerald-900/40 border border-emerald-500/40 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircleIcon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  Attendance Recorded Successfully!
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  lastPunchResult.mode === 'IN' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                }`}>
                  PUNCH {lastPunchResult.mode}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                <strong className="text-emerald-300">{lastPunchResult.empName}</strong> ({lastPunchResult.empCode}) verified via optical sensor at <strong className="text-white">{lastPunchResult.time}</strong> on <strong className="text-white">{lastPunchResult.terminal}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setLastPunchResult(null);
                setScannerState('IDLE');
                setStatusMessage('Ready for next fingerprint scan.');
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
            >
              Scan Next Employee
            </button>
          </div>
        </div>
      )}

      {/* Quick Punch Bar for Organization Employees */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              One-Touch Biometric Punch Desk
            </h2>
            <p className="text-xs text-slate-400">
              This screen cannot punch on behalf of an employee. Physical device events appear after authenticated bridge synchronization.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {employeeList.length} Active Profiles
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {employeeList.slice(0, 6).map((emp) => {
            const empCode = emp.employeeCode || emp.emp_code || emp.employeeId || String(emp.id);
            const empName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.employee_name || 'Employee';

            const empToday = attendanceRecords.find(r => 
              (String(r.empId).toLowerCase() === String(empCode).toLowerCase() || String(r.employeeId) === String(emp.id)) &&
              r.date === todayDateStr
            );

            const isShiftDone = empToday && empToday.checkOut && empToday.checkOut !== '--';
            const isPunchedIn = empToday && empToday.checkIn && empToday.checkIn !== '--' && !isShiftDone;

            return (
              <div
                key={emp.id || empCode}
                className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 flex items-center justify-between hover:border-indigo-300 hover:bg-white transition"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-slate-800 truncate">{empName}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{empCode} • {emp.department || 'Operations'}</p>
                  <div className="mt-1">
                    {isShiftDone ? (
                      <span className="text-[9px] font-bold text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
                        Shift Complete
                      </span>
                    ) : isPunchedIn ? (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                        In: {empToday.checkIn}
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
                        Not Punched
                      </span>
                    )}
                  </div>
                </div>

                <span className="shrink-0 text-[10px] text-slate-500">Device sync only</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Biometric Machine Logs Audit Trail */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ComputerDesktopIcon className="w-4 h-4 text-indigo-600" />
              Live Terminal Punch Logs (ZK-Teco Sync)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Legacy device logs. Verified attendance is created only from signed SDK bridge events.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Filter logs..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
              />
            </div>

            <button
              onClick={fetchBiometricLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition"
            >
              <ArrowPathIcon className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin text-indigo-600' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Table of Biometric Logs */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Punch Time</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Punch Type</th>
                <th className="py-3 px-4">Device / Terminal</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4">Sync Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingLogs ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    <ArrowPathIcon className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-1" />
                    Loading terminal logs...
                  </td>
                </tr>
              ) : biometricLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No biometric punch logs recorded yet. Place a fingerprint on the scanner to record the first log.
                  </td>
                </tr>
              ) : (
                biometricLogs
                  .filter((log) => {
                    if (!logSearchQuery) return true;
                    const q = logSearchQuery.toLowerCase();
                    return (
                      String(log.empId || log.emp_id || '').toLowerCase().includes(q) ||
                      String(log.employee || '').toLowerCase().includes(q) ||
                      String(log.deviceName || log.device_name || '').toLowerCase().includes(q)
                    );
                  })
                  .slice(0, 15)
                  .map((log) => {
                    const isPunchIn = String(log.punchType || log.punch_type).toUpperCase() === 'IN';
                    const rawTime = log.punchTime || log.punch_time || log.created_at;
                    const timeFormatted = rawTime ? new Date(rawTime).toLocaleString() : '--';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-600">
                          {timeFormatted}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {log.employee || 'Employee'}
                          <span className="block text-[10px] font-mono text-slate-400 font-normal">
                            {log.empId || log.emp_id || 'ID'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            isPunchIn
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            PUNCH {isPunchIn ? 'IN' : 'OUT'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-600">
                          {log.deviceName || log.device_name || 'BIO-01'}
                          <span className="block text-[10px] font-mono text-slate-400">
                            Machine ID: {log.machineId || log.machine_id || 'BIO-01'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                            <ShieldCheckIcon className="w-3.5 h-3.5" />
                            Biometric (500 DPI)
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                            {log.syncStatus || log.sync_status || 'Synced'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
