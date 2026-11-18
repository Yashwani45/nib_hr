// backend/routes/operations.routes.js
const express = require('express');
const {
  clockIn,
  clockOut,
  getHistory,
  getAllowedMethods,
  getQrToken,
  getOrgConfig,
  updateOrgConfig,
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
} = require('../controllers/operations/attendance.controller');
const { attendanceValidator } = require('../validators/operations/attendance.validator');
const { getHolidays, createHoliday, updateHoliday, toggleHolidayStatus, deleteHoliday } = require('../controllers/operations/holiday.controller');
const { getLeaveTypes, createLeaveType, updateLeaveType, toggleLeaveTypeStatus, deleteLeaveType } = require('../controllers/operations/leaveType.controller');
const { getOvertimes, createOvertime, updateOvertime, toggleOvertimeStatus, deleteOvertime } = require('../controllers/operations/overtime.controller');
const verifyJWT = require('../middleware/auth.middleware');
const auditLogger = require('../middleware/audit.middleware');
const { authorizeRole } = require('../middleware/role.middleware');
const apiRateLimiter = require('../middleware/rateLimiter.middleware');
const biometricAttendanceController = require('../controllers/operations/biometricAttendance.controller');

const router = express.Router();

// Face Recognition Attendance Actions
const { enrollFace, getEnrollmentStatus, verifyFace, liveFaceScan, getLiveFaceScan, triggerPhoneCamera, snapPhoneCamera, getTodayStatus, resetTodayAttendance, getAttendanceModalInit } = require('../controllers/operations/attendance.controller');

// Fast modal initialization (all employees + face status + today's attendance in 1 shot)
router.get('/attendance/modal-init', getAttendanceModalInit);

// Live face scan from phone camera scanner over USB / Kiosk & direct API verification (optional auth)
router.post('/attendance/face/live-scan', liveFaceScan);
router.get('/attendance/face/live-scan', getLiveFaceScan);
router.get('/attendance/face/snap-phone', snapPhoneCamera);
router.post('/attendance/face/snap-phone', snapPhoneCamera);
router.post('/attendance/face/trigger-phone-cam', triggerPhoneCamera);
router.get('/attendance/today-status', getTodayStatus);
router.post('/attendance/reset-today', resetTodayAttendance);
router.get('/attendance/face/status', getEnrollmentStatus);
router.get('/attendance/face/enrollment-status', getEnrollmentStatus);
router.post('/attendance/face/enroll', enrollFace);
router.post('/attendance/face/verify', verifyFace);

// Public / Kiosk QR Attendance Actions (Cryptographically verified by HMAC-SHA256 badge signature)
router.post('/attendance/employee-qr/identify', identifyEmployeeQr);
router.post('/attendance/employee-qr/scan-punch', apiRateLimiter.companyQrPunchLimiter, scanEmployeeQrPunch);
router.post('/attendance/company-qr/scan-punch', apiRateLimiter.companyQrPunchLimiter, scanCompanyQrPunch);

// Device-to-server events are authenticated with a per-environment HMAC secret.
router.post('/attendance/biometric/events', apiRateLimiter.biometricDeviceLimiter, biometricAttendanceController.receiveDeviceEvent);
router.post('/attendance/biometric/heartbeat', apiRateLimiter.biometricDeviceLimiter, biometricAttendanceController.receiveHeartbeat);

router.use(verifyJWT);

// Employee Attendance Actions
router.post('/attendance/clock-in', attendanceValidator, clockIn);
router.post('/attendance/clock-out', attendanceValidator, clockOut);
router.post('/attendance/check-in', attendanceValidator, clockIn);
router.post('/attendance/check-out', attendanceValidator, clockOut);
router.get('/attendance/roster', getDailyRoster);
router.get('/attendance/daily', getDailyRoster);
router.get('/attendance/employee/:employeeId/:date?', getEmployeeAttendanceByDate);
router.put('/attendance/:id', updateAttendanceRecord);
router.get('/attendance/history', getHistory);
router.get('/attendance/allowed-methods', getAllowedMethods);
router.get('/attendance/biometric/status', biometricAttendanceController.getEmployeeStatus);
router.get('/attendance/biometric/device-users', authorizeRole(['Admin', 'SuperAdmin', 'DepartmentHR', 'HR']), biometricAttendanceController.listDeviceUsers);
router.post('/attendance/biometric/device-users', authorizeRole(['Admin', 'SuperAdmin', 'DepartmentHR', 'HR']), biometricAttendanceController.registerDeviceUser);
router.delete('/attendance/biometric/device-users/:id', authorizeRole(['Admin', 'SuperAdmin', 'DepartmentHR', 'HR']), biometricAttendanceController.deactivateDeviceUser);
router.get('/attendance/qr-token', getQrToken);
router.post('/attendance/face/check-in', clockIn);
router.post('/attendance/face/check-out', clockOut);

// Org Attendance Method Configuration (Admin & SuperAdmin)
router.get('/attendance/config', authorizeRole(['Admin', 'SuperAdmin']), getOrgConfig);
router.get('/attendance/config/:companyCode', authorizeRole(['Admin', 'SuperAdmin']), getOrgConfig);
router.put('/attendance/config', authorizeRole(['Admin', 'SuperAdmin']), updateOrgConfig);
router.put('/attendance/config/:companyCode', authorizeRole(['Admin', 'SuperAdmin']), updateOrgConfig);

// Company QR Code Attendance Administration (Admin & SuperAdmin)
router.get('/attendance/company-qr/status', authorizeRole(['Admin', 'SuperAdmin']), getCompanyQrStatus);
router.get('/attendance/company-qr/token', authorizeRole(['Admin', 'SuperAdmin']), generateCompanyQr);
router.post('/attendance/company-qr/regenerate', authorizeRole(['Admin', 'SuperAdmin']), generateCompanyQr);
router.post('/attendance/company-qr/revoke', authorizeRole(['Admin', 'SuperAdmin']), revokeCompanyQr);
router.patch('/attendance/company-qr/toggle', authorizeRole(['Admin', 'SuperAdmin']), toggleCompanyQr);
router.get('/attendance/company-qr/recent-scans', authorizeRole(['Admin', 'SuperAdmin']), getRecentCompanyQrScans);

// Employee-Specific QR Code Attendance Actions (Management)
router.get('/attendance/employee-qr/all', getAllEmployeeQrs);
router.get('/attendance/employee-qr/:employeeId', getEmployeeQr);
router.post('/attendance/employee-qr/:employeeId/regenerate', authorizeRole(['Admin', 'SuperAdmin', 'DepartmentHR', 'HR', 'Manager']), generateEmployeeQr);
router.post('/attendance/employee-qr/:employeeId/revoke', authorizeRole(['Admin', 'SuperAdmin', 'DepartmentHR', 'HR', 'Manager']), revokeEmployeeQr);

// Holiday Master
router.get('/holidays', auditLogger('HolidayMaster'), getHolidays);
router.post('/holidays', auditLogger('HolidayMaster'), authorizeRole(['Admin', 'SuperAdmin', 'Manager']), createHoliday);
router.put('/holidays/:id', auditLogger('HolidayMaster'), authorizeRole(['Admin', 'SuperAdmin', 'Manager']), updateHoliday);
router.patch('/holidays/:id/status', auditLogger('HolidayMaster'), authorizeRole(['Admin', 'SuperAdmin', 'Manager']), toggleHolidayStatus);
router.delete('/holidays/:id', auditLogger('HolidayMaster'), authorizeRole(['Admin', 'SuperAdmin']), deleteHoliday);

// Leave Type Master
router.get('/leave-types', auditLogger('LeaveTypeMaster'), getLeaveTypes);
router.post('/leave-types', auditLogger('LeaveTypeMaster'), authorizeRole(['Admin', 'SuperAdmin', 'Manager']), createLeaveType);
router.put('/leave-types/:id', auditLogger('LeaveTypeMaster'), authorizeRole(['Admin', 'SuperAdmin', 'Manager']), updateLeaveType);
router.patch('/leave-types/:id/status', auditLogger('LeaveTypeMaster'), authorizeRole(['Admin', 'SuperAdmin', 'Manager']), toggleLeaveTypeStatus);
router.delete('/leave-types/:id', auditLogger('LeaveTypeMaster'), authorizeRole(['Admin', 'SuperAdmin']), deleteLeaveType);

// Overtime Master
router.get('/overtime', auditLogger('OvertimeMaster'), getOvertimes);
router.post('/overtime', auditLogger('OvertimeMaster'), authorizeRole(['Admin', 'SuperAdmin', 'Manager']), createOvertime);
router.put('/overtime/:id', auditLogger('OvertimeMaster'), authorizeRole(['Admin', 'SuperAdmin', 'Manager']), updateOvertime);
router.patch('/overtime/:id/status', auditLogger('OvertimeMaster'), authorizeRole(['Admin', 'SuperAdmin', 'Manager']), toggleOvertimeStatus);
router.delete('/overtime/:id', auditLogger('OvertimeMaster'), authorizeRole(['Admin', 'SuperAdmin']), deleteOvertime);

module.exports = router;
