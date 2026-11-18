// backend/controllers/operations/attendance.controller.js
const attendanceService = require('../../services/operations/attendance.service');
const companyQrService = require('../../services/operations/companyQr.service');
const employeeQrService = require('../../services/operations/employeeQr.service');
const ApiResponse = require('../../utils/apiResponse');
const ApiError = require('../../utils/apiError');
const asyncHandler = require('../../utils/asyncHandler');

const isPrivilegedUser = (user) => {
  if (!user) return false;
  const role = (user.role?.name || user.role?.roleName || user.role || user.role_name || '').toLowerCase();
  return ['admin', 'superadmin', 'hr', 'departmenthr', 'manager'].some(r => role.includes(r));
};

const checkEmployeeAuthorization = (user, requestedTargetId) => {
  if (!user || isPrivilegedUser(user)) return true;
  if (!requestedTargetId) return true;
  
  const targetStr = String(requestedTargetId).trim().toLowerCase();
  const allowedIds = [
    user.id,
    user.userId,
    user.user_id,
    user.emp_id,
    user.employeeId,
    user.employee?.id,
    user.employee?.employeeCode,
    user.employee?.emp_code,
    user.employee?.empId,
    user.email
  ].filter(Boolean).map(id => String(id).trim().toLowerCase());

  if (!allowedIds.includes(targetStr)) {
    throw new ApiError(403, 'You are not authorized to modify attendance for another employee.');
  }
  return true;
};

const clockIn = asyncHandler(async (req, res) => {
  const targetId = req.body.employeeId || req.body.empId || req.body.empCode || req.user?.id || req.user?.userId || req.user?.user_id;
  
  checkEmployeeAuthorization(req.user, targetId);

  const context = {
    ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    companyCode: req.body?.companyCode || req.companyCode || req.headers['x-company-code'],
    employeeId: req.body.employeeId || req.body.empId || req.user?.employee?.id || req.user?.emp_id || targetId,
    actorId: req.user?.id,
    user: req.user
  };

  const attendance = await attendanceService.clockIn(targetId, req.body, context);
  res.status(201).json(new ApiResponse(201, attendance, 'Checked in successfully.'));
});

const clockOut = asyncHandler(async (req, res) => {
  const targetId = req.body.employeeId || req.body.empId || req.body.empCode || req.user?.id;
  
  checkEmployeeAuthorization(req.user, targetId);

  const context = {
    ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    companyCode: req.body?.companyCode || req.companyCode || req.headers['x-company-code'],
    employeeId: req.body.employeeId || req.body.empId || req.user?.employee?.id || req.user?.emp_id || targetId,
    actorId: req.user?.id,
    user: req.user
  };

  const attendance = await attendanceService.clockOut(targetId, req.body, context);
  res.status(200).json(new ApiResponse(200, attendance, 'Checked out successfully.'));
});

const getDailyRoster = asyncHandler(async (req, res) => {
  const date = req.query.date || req.params.date || new Date().toISOString().split('T')[0];
  const companyCode = req.query.companyCode || req.companyCode || req.headers['x-company-code'];
  const context = {
    companyCode,
    employeeId: req.user?.employee?.id || req.user?.emp_id,
    user: req.user
  };
  const roster = await attendanceService.getDailyRoster(date, companyCode, context);
  res.status(200).json(new ApiResponse(200, roster, 'Daily attendance roster retrieved successfully.'));
});

const getEmployeeAttendanceByDate = asyncHandler(async (req, res) => {
  const targetId = req.params.employeeId || req.query.employeeId || req.user?.id;
  const date = req.params.date || req.query.date || new Date().toISOString().split('T')[0];

  checkEmployeeAuthorization(req.user, targetId);

  const context = {
    companyCode: req.companyCode || req.headers['x-company-code'],
    employeeId: req.user?.employee?.id || req.user?.emp_id,
    user: req.user
  };
  const record = await attendanceService.getEmployeeAttendanceByDate(targetId, date, context);
  res.status(200).json(new ApiResponse(200, record, 'Employee attendance retrieved successfully.'));
});

const updateAttendanceRecord = asyncHandler(async (req, res) => {
  const recordId = req.params.id;
  if (!isPrivilegedUser(req.user)) {
    throw new ApiError(403, 'Only administrators and HR managers can modify attendance records.');
  }

  const context = {
    companyCode: req.companyCode || req.headers['x-company-code'],
    employeeId: req.user?.employee?.id || req.user?.emp_id,
    user: req.user
  };

  const updated = await attendanceService.updateAttendanceRecord(recordId, req.body, context);
  res.status(200).json(new ApiResponse(200, updated, 'Attendance record updated successfully.'));
});

const getTodayStatus = asyncHandler(async (req, res) => {
  const { tenantStorage, sequelize } = require('../../config/database');
  const targetId = req.query.employeeId || req.query.empId || req.query.empCode || req.user?.id;
  const context = {
    companyCode: req.companyCode || req.headers['x-company-code'],
    employeeId: req.user?.employee?.id || req.user?.emp_id,
  };
  const employee = await attendanceService.resolveEmployee(targetId, context);
  if (!employee) {
    return res.status(200).json(new ApiResponse(200, { isCheckedIn: false, isCheckedOut: false, nextAction: 'clock-in' }));
  }

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const empCode = employee.employeeCode || employee.emp_code || employee.employeeId || String(employee.id);

  const activeDb = tenantStorage.getStore() || sequelize;
  const [rows] = await activeDb.query(
    `SELECT * FROM daily_attendance WHERE (emp_id = ? OR empId = ? OR employeeId = ?) AND date = ? ORDER BY id DESC LIMIT 1`,
    { replacements: [empCode, empCode, employee.id, dateStr] }
  );

  if (!rows || rows.length === 0) {
    return res.status(200).json(new ApiResponse(200, {
      employee: {
        id: employee.id,
        empId: empCode,
        name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.employee_name || 'Employee'
      },
      isCheckedIn: false,
      isCheckedOut: false,
      nextAction: 'clock-in'
    }));
  }

  const record = rows[0];
  const inVal = record.check_in || record.checkIn;
  const outVal = record.check_out || record.checkOut;
  const isCheckedIn = !!inVal && inVal !== '--';
  const isCheckedOut = !!outVal && outVal !== '--';

  return res.status(200).json(new ApiResponse(200, {
    employee: {
      id: employee.id,
      empId: empCode,
      name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.employee_name || 'Employee'
    },
    attendanceId: record.id,
    checkInTime: inVal,
    checkOutTime: outVal,
    isCheckedIn,
    isCheckedOut,
    nextAction: !isCheckedIn ? 'clock-in' : (!isCheckedOut ? 'clock-out' : 'clock-in')
  }));
});

const resetTodayAttendance = asyncHandler(async (req, res) => {
  const { tenantStorage, sequelize } = require('../../config/database');
  const targetId = req.body?.employeeId || req.body?.empId || req.query?.empId || req.query?.employeeId || req.user?.id;
  const context = {
    companyCode: req.body?.companyCode || req.query?.companyCode || req.companyCode || req.headers['x-company-code'],
    employeeId: req.user?.employee?.id || req.user?.emp_id,
  };
  const employee = await attendanceService.resolveEmployee(targetId, context);
  if (!employee) {
    return res.status(404).json(new ApiResponse(404, null, 'Employee profile not found.'));
  }
  const empCode = employee.employeeCode || employee.emp_code || employee.employeeId || String(employee.id);
  const now = new Date();
  const dateStr = req.body?.date || now.toISOString().split('T')[0];

  const activeDb = tenantStorage.getStore() || sequelize;
  await activeDb.query(
    'DELETE FROM daily_attendance WHERE (emp_id = ? OR employeeId = ?) AND date = ?',
    { replacements: [empCode, employee.id, dateStr] }
  );

  res.status(200).json(new ApiResponse(200, { reset: true, empCode }, 'Today attendance reset successfully for employee.'));
});

const getHistory = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const context = {
    companyCode: req.companyCode || req.headers['x-company-code'],
    employeeId: req.user?.employee?.id || req.user?.emp_id,
  };
  const history = await attendanceService.getEmployeeAttendanceHistory(userId, context);
  res.status(200).json(new ApiResponse(200, history, 'Attendance history retrieved.'));
});

const getAllowedMethods = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const companyCode = req.companyCode || req.headers['x-company-code'];
  const context = {
    companyCode,
    employeeId: req.user?.employee?.id || req.user?.emp_id,
  };
  const allowed = await attendanceService.getEmployeeAllowedMethods(userId, companyCode, context);
  res.status(200).json(new ApiResponse(200, allowed, 'Allowed attendance methods retrieved.'));
});

const getQrToken = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const context = {
    companyCode: req.companyCode || req.headers['x-company-code'],
    employeeId: req.user?.employee?.id || req.user?.emp_id,
  };
  const tokenData = await attendanceService.generateEmployeeQrToken(userId, context);
  res.status(200).json(new ApiResponse(200, tokenData, 'Dynamic QR token generated.'));
});

const getOrgConfig = asyncHandler(async (req, res) => {
  const companyCode = req.params.companyCode || req.companyCode || req.headers['x-company-code'];
  const config = await attendanceService.getOrganizationAttendanceConfig(companyCode);
  res.status(200).json(new ApiResponse(200, config, 'Organization attendance configuration retrieved.'));
});

const updateOrgConfig = asyncHandler(async (req, res) => {
  const companyCode = req.params.companyCode || req.companyCode || req.headers['x-company-code'];
  const methodsPayload = req.body.methods || req.body;
  const updated = await attendanceService.updateOrganizationAttendanceConfig(companyCode, methodsPayload, req.user);
  res.status(200).json(new ApiResponse(200, updated, 'Organization attendance configuration updated successfully.'));
});

const enrollFace = asyncHandler(async (req, res) => {
  const userId = req.body?.employeeId || req.body?.empId || req.user?.id;
  const context = {
    companyCode: req.body?.companyCode || req.body?.company || req.companyCode || req.headers['x-company-code'],
    employeeId: req.body?.employeeId || req.body?.empId || req.user?.employee?.id || req.user?.emp_id,
  };
  const profile = await attendanceService.enrollFace(userId, req.body, context);
  res.status(201).json(new ApiResponse(201, profile, 'Face enrolled successfully.'));
});

const getEnrollmentStatus = asyncHandler(async (req, res) => {
  const userId = req.query?.employeeId || req.query?.empId || req.user?.id;
  const context = {
    companyCode: req.query?.companyCode || req.query?.company || req.companyCode || req.headers['x-company-code'],
    employeeId: req.query?.employeeId || req.query?.empId || req.user?.employee?.id || req.user?.emp_id,
  };
  const status = await attendanceService.getFaceEnrollmentStatus(userId, context);
  res.status(200).json(new ApiResponse(200, status, 'Enrollment status retrieved.'));
});

const verifyFace = asyncHandler(async (req, res) => {
  const userId = req.body?.employeeId || req.body?.empId || req.user?.id;
  const context = {
    ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    companyCode: req.body?.company || req.companyCode || req.headers['x-company-code'],
    employeeId: req.body?.employeeId || req.body?.empId || req.user?.employee?.id || req.user?.emp_id,
  };
  const result = await attendanceService.verifyFace(userId, req.body, context);
  res.status(200).json(new ApiResponse(200, result, 'Face verified successfully.'));
});

let latestLiveScan = null;

const liveFaceScan = asyncHandler(async (req, res) => {
  let userId = req.user?.id;
  let companyCode = req.companyCode || req.headers['x-company-code'];

  if (!userId && req.headers.authorization) {
    try {
      const token = req.headers.authorization.replace('Bearer ', '');
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || 'access_secret_123');
      if (decoded) {
        userId = decoded.id;
        if (!companyCode && decoded.companyCode) companyCode = decoded.companyCode;
      }
    } catch (e) {}
  }

  const context = {
    ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    companyCode: companyCode || 'nib_insurance',
    employeeId: req.user?.employee?.id || req.user?.emp_id,
  };
  const result = await attendanceService.verifyFace(userId, req.body, context);
  if (result && result.matched) {
    latestLiveScan = {
      ...result,
      embedding: req.body.embedding || (req.body.faceData && req.body.faceData.embedding),
      confidence: result.confidence || 0.95,
      timestamp: Date.now(),
    };
  }
  res.status(200).json(new ApiResponse(200, result, 'Live face scan authenticated successfully.'));
});

const getLiveFaceScan = asyncHandler(async (req, res) => {
  if (latestLiveScan && Date.now() - latestLiveScan.timestamp < 15000) {
    const scan = { ...latestLiveScan };
    latestLiveScan = null; // Single-use consumption: immediately cleared!
    return res.status(200).json(new ApiResponse(200, scan, 'Live authenticated face scan available.'));
  }
  latestLiveScan = null;
  res.status(200).json(new ApiResponse(200, null, 'No active live face scan.'));
});

const triggerPhoneCamera = asyncHandler(async (req, res) => {
  const { exec } = require('child_process');
  const adbPath = 'C:\\Users\\admin\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';
  
  exec(`"${adbPath}" shell "am start -n com.android.camera/.CameraActivity || am start -a android.media.action.STILL_IMAGE_CAMERA"`, (err) => {
    if (err) console.warn('Native camera launch error:', err.message);
  });
  res.status(200).json(new ApiResponse(200, { launched: true }, 'Native camera opened on phone.'));
});

const snapPhoneCamera = asyncHandler(async (req, res) => {
  const { spawn } = require('child_process');
  const adbPath = 'C:\\Users\\admin\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';

  const adb = spawn(adbPath, ['exec-out', 'screencap', '-p']);
  const chunks = [];
  let errorOutput = '';

  adb.stdout.on('data', (chunk) => chunks.push(chunk));
  adb.stderr.on('data', (chunk) => (errorOutput += chunk.toString()));

  adb.on('close', (code) => {
    if (code !== 0 || chunks.length === 0) {
      const isNoDevice = (errorOutput || '').toLowerCase().includes('no devices') || (errorOutput || '').toLowerCase().includes('device not found');
      const friendlyMsg = isNoDevice 
        ? 'Phone is not connected via USB. Please connect your phone with a USB cable and enable USB Debugging.' 
        : (errorOutput.trim() || 'Phone camera frame capture failed. Check USB connection.');
      return res.status(400).json(new ApiResponse(400, null, friendlyMsg));
    }
    const buf = Buffer.concat(chunks);
    const base64 = `data:image/png;base64,${buf.toString('base64')}`;
    res.status(200).json(new ApiResponse(200, { image: base64 }, 'Phone camera frame captured successfully.'));
  });
});

const getAttendanceModalInit = asyncHandler(async (req, res) => {
  const { tenantStorage, sequelize } = require('../../config/database');
  const activeDb = tenantStorage.getStore() || sequelize;

  let targetId = req.query.employeeId || req.query.empId || req.query.empCode || req.user?.id;
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const branchId = req.branchId || req.query.branchId;
  const branchName = req.branchName || req.query.branchName;
  const branchCode = req.branchCode || req.query.branchCode;
  const isBranchScoped = branchId && String(branchId).toUpperCase() !== 'ALL' && !req.isAllBranches;

  let empWhere = "";
  let empReplacements = {};
  if (isBranchScoped) {
    empWhere = "WHERE (e.branch_id = :bId OR LOWER(e.branchName) = LOWER(:bName) OR UPPER(e.branchName) = UPPER(:bCode))";
    empReplacements = {
      bId: branchId,
      bName: branchName || branchId,
      bCode: branchCode || branchId
    };
  }

  // 1. Fetch lightweight employee directory with face registration status in 1 fast query
  const [employees] = await activeDb.query(`
    SELECT 
      e.id, 
      e.employeeCode, 
      COALESCE(e.employeeCode, e.emp_code, e.id) as empCode,
      e.firstName, 
      e.lastName, 
      COALESCE(e.employee_name, CONCAT(COALESCE(e.firstName, ''), ' ', COALESCE(e.lastName, ''))) as name,
      COALESCE(e.department, 'Operations') as department, 
      COALESCE(e.shift, 'General Shift') as shift, 
      e.company,
      e.email,
      e.officialEmail,
      e.photo,
      e.branch_id,
      e.branchName,
      (efp.id IS NOT NULL AND efp.status = 'ACTIVE') as isFaceEnrolled,
      efp.enrolled_at as faceEnrolledAt
    FROM employees e
    LEFT JOIN employee_face_profiles efp ON e.id = efp.employee_id
    ${empWhere}
    ORDER BY e.firstName ASC
  `, { replacements: empReplacements });

  // 2. Fetch today's attendance for the organization in 1 query
  const [todayAttendances] = await activeDb.query(`
    SELECT * FROM daily_attendance WHERE date = ?
  `, { replacements: [dateStr] });

  const attendanceMap = new Map();
  for (const att of todayAttendances) {
    const inVal = att.check_in || att.checkIn;
    const outVal = att.check_out || att.checkOut;
    const isCheckedIn = !!inVal && inVal !== '--';
    const isCheckedOut = !!outVal && outVal !== '--';
    const nextAction = (!isCheckedIn || isCheckedOut) ? 'clock-in' : 'clock-out';
    const statusObj = {
      isCheckedIn,
      isCheckedOut,
      nextAction,
      checkInTime: inVal && inVal !== '--' ? inVal : null,
      checkOutTime: outVal && outVal !== '--' ? outVal : null,
      workingHours: att.working_hours || att.workingHours || 0,
      status: att.status || 'Present',
      date: att.date,
      day: att.day
    };
    if (att.employeeId) attendanceMap.set(String(att.employeeId), statusObj);
    if (att.emp_id) attendanceMap.set(String(att.emp_id), statusObj);
    if (att.empId) attendanceMap.set(String(att.empId), statusObj);
  }

  const enrichedEmployees = employees.map(emp => {
    const today = attendanceMap.get(String(emp.id)) || 
                   attendanceMap.get(String(emp.employeeCode)) || 
                   attendanceMap.get(String(emp.empCode)) || {
      isCheckedIn: false,
      isCheckedOut: false,
      nextAction: 'clock-in',
      checkInTime: null,
      checkOutTime: null,
      workingHours: 0
    };
    return {
      ...emp,
      isEnrolled: Boolean(emp.isFaceEnrolled),
      isFaceRegistered: Boolean(emp.isFaceEnrolled),
      todayStatus: today
    };
  });

  // Resolve current/default selected employee
  let selected = null;
  if (targetId) {
    const tStr = String(targetId).toLowerCase().trim();
    selected = enrichedEmployees.find(e => 
      String(e.id).toLowerCase() === tStr || 
      String(e.employeeCode).toLowerCase() === tStr || 
      String(e.empCode).toLowerCase() === tStr ||
      (e.email && e.email.toLowerCase() === tStr) ||
      (e.officialEmail && e.officialEmail.toLowerCase() === tStr)
    );
  }
  if (!selected && enrichedEmployees.length > 0) {
    selected = enrichedEmployees[0];
  }

  res.status(200).json(new ApiResponse(200, {
    employees: enrichedEmployees,
    selectedEmployee: selected,
    todayStatus: selected ? selected.todayStatus : { isCheckedIn: false, isCheckedOut: false, nextAction: 'clock-in' },
    faceEnrollmentInfo: selected ? {
      isEnrolled: selected.isEnrolled,
      status: selected.isEnrolled ? 'ACTIVE' : 'NOT_REGISTERED',
      employeeId: selected.id,
      employeeCode: selected.employeeCode,
      enrolledAt: selected.faceEnrolledAt
    } : { isEnrolled: false }
  }, 'Attendance modal init data retrieved.'));
});

// ==========================================
// Company QR Attendance Controllers
// ==========================================

const getCompanyQrStatus = asyncHandler(async (req, res) => {
  const companyCode = req.query.companyCode || req.companyCode || req.user?.companyCode || req.user?.company || 'YASHTECH';
  const status = await companyQrService.getCompanyQrStatus(companyCode, req.user);
  res.status(200).json(new ApiResponse(200, status, 'Company QR status retrieved.'));
});

const generateCompanyQr = asyncHandler(async (req, res) => {
  const companyCode = req.body?.companyCode || req.query?.companyCode || req.companyCode || req.user?.companyCode || req.user?.company || 'YASHTECH';
  const rotationSeconds = req.body?.rotationSeconds || req.query?.rotationSeconds;
  const qrData = await companyQrService.generateCompanyQr(companyCode, req.user, { rotationSeconds });
  res.status(200).json(new ApiResponse(200, qrData, 'Company QR generated successfully.'));
});

const revokeCompanyQr = asyncHandler(async (req, res) => {
  const companyCode = req.body?.companyCode || req.companyCode || req.user?.companyCode || req.user?.company || 'YASHTECH';
  const result = await companyQrService.revokeCompanyQr(companyCode, req.user);
  res.status(200).json(new ApiResponse(200, result, 'Company QR revoked successfully.'));
});

const toggleCompanyQr = asyncHandler(async (req, res) => {
  const companyCode = req.body?.companyCode || req.companyCode || req.user?.companyCode || req.user?.company || 'YASHTECH';
  const isEnabled = req.body?.isEnabled ?? req.body?.enabled ?? true;
  const result = await companyQrService.toggleCompanyQr(companyCode, isEnabled, req.user);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

const scanCompanyQrPunch = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const qrToken = req.body?.qrToken || req.body?.token;
  const context = {
    ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    companyCode: req.companyCode || req.headers['x-company-code'] || req.user?.companyCode || req.user?.company,
    employeeId: req.user?.employee?.id || req.user?.emp_id,
    latitude: req.body?.latitude,
    longitude: req.body?.longitude,
    accuracy: req.body?.accuracy,
  };

  const result = await companyQrService.scanCompanyQrPunch(userId, qrToken, context);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

const getRecentCompanyQrScans = asyncHandler(async (req, res) => {
  const companyCode = req.query?.companyCode || req.companyCode || req.user?.companyCode || req.user?.company || 'YASHTECH';
  const limit = parseInt(req.query?.limit || 15, 10);
  const scans = await companyQrService.getRecentCompanyQrScans(companyCode, limit);
  res.status(200).json(new ApiResponse(200, scans, 'Recent company QR scans retrieved.'));
});

const getAllEmployeeQrs = asyncHandler(async (req, res) => {
  const companyCode = req.query?.companyCode || req.companyCode || req.headers['x-company-code'] || req.user?.companyCode || req.user?.company || 'YASHTECH';
  const result = await employeeQrService.getAllEmployeeQrs(companyCode);
  res.status(200).json(new ApiResponse(200, result, 'All employee QR badges retrieved successfully.'));
});

const getEmployeeQr = asyncHandler(async (req, res) => {
  const roleName = String(req.user?.role?.name || req.user?.role || '').toLowerCase();
  const isAdminOrHr = ['admin', 'superadmin', 'departmenthr', 'hr', 'manager'].includes(roleName);

  let employeeId = req.params.employeeId;
  if (!isAdminOrHr) {
    // Non-admins can only fetch their own QR code
    employeeId = req.user?.employee?.id || req.user?.emp_id || req.user?.id;
  }
  if (!employeeId || employeeId === 'undefined' || employeeId === 'null') {
    employeeId = req.user?.employee?.id || req.user?.id;
  }

  const companyCode = req.query?.companyCode || req.companyCode || req.headers['x-company-code'] || req.user?.companyCode || req.user?.company || 'YASHTECH';
  const result = await employeeQrService.getEmployeeQr(employeeId, companyCode);
  res.status(200).json(new ApiResponse(200, result, 'Employee QR retrieved successfully.'));
});

const generateEmployeeQr = asyncHandler(async (req, res) => {
  const employeeId = req.params.employeeId;
  const companyCode = req.body?.companyCode || req.query?.companyCode || req.companyCode || req.headers['x-company-code'] || req.user?.companyCode || req.user?.company || 'YASHTECH';
  const result = await employeeQrService.generateEmployeeQr(employeeId, companyCode, req.user);
  res.status(200).json(new ApiResponse(200, result, 'Employee QR generated successfully.'));
});

const revokeEmployeeQr = asyncHandler(async (req, res) => {
  const employeeId = req.params.employeeId;
  const companyCode = req.body?.companyCode || req.query?.companyCode || req.companyCode || req.headers['x-company-code'] || req.user?.companyCode || req.user?.company || 'YASHTECH';
  const reason = req.body?.reason || 'Reported lost / re-issued';
  const result = await employeeQrService.revokeEmployeeQr(employeeId, companyCode, req.user, reason);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

const identifyEmployeeQr = asyncHandler(async (req, res) => {
  const qrToken = req.body?.qrToken || req.body?.token || req.body?.qrData || req.body?.code;
  const companyCode = req.body?.companyCode || req.query?.companyCode || req.companyCode || req.headers['x-company-code'] || req.user?.companyCode || req.user?.company || 'YASHTECH';
  const result = await employeeQrService.verifyAndIdentify(qrToken, companyCode);
  const { db, ...safeResult } = result || {};
  res.status(200).json(new ApiResponse(200, safeResult, 'Employee identified successfully.'));
});

const scanEmployeeQrPunch = asyncHandler(async (req, res) => {
  const qrToken = req.body?.qrToken || req.body?.token || req.body?.qrData || req.body?.code;
  const context = {
    ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    companyCode: req.body?.companyCode || req.companyCode || req.headers['x-company-code'] || req.user?.companyCode || req.user?.company || 'YASHTECH',
    action: req.body?.action || req.body?.requestedAction, // 'clock-in' or 'clock-out'
  };
  const result = await employeeQrService.scanEmployeeQrPunch(req.user, qrToken, context);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

module.exports = {
  clockIn,
  clockOut,
  getTodayStatus,
  getAttendanceModalInit,
  getHistory,
  getAllowedMethods,
  getQrToken,
  getOrgConfig,
  updateOrgConfig,
  enrollFace,
  getEnrollmentStatus,
  verifyFace,
  liveFaceScan,
  getLiveFaceScan,
  triggerPhoneCamera,
  snapPhoneCamera,
  resetTodayAttendance,
  getCompanyQrStatus,
  generateCompanyQr,
  revokeCompanyQr,
  toggleCompanyQr,
  scanCompanyQrPunch,
  getRecentCompanyQrScans,
  getAllEmployeeQrs,
  getEmployeeQr,
  generateEmployeeQr,
  revokeEmployeeQr,
  identifyEmployeeQr,
  scanEmployeeQrPunch,
  getDailyRoster,
  getEmployeeAttendanceByDate,
  updateAttendanceRecord,
};


