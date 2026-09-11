// backend/routes/operations.routes.js
const express = require('express');
const { clockIn, clockOut, getHistory } = require('../controllers/operations/attendance.controller');
const { attendanceValidator } = require('../validators/operations/attendance.validator');
const { getHolidays, createHoliday, updateHoliday, toggleHolidayStatus, deleteHoliday } = require('../controllers/operations/holiday.controller');
const { getLeaveTypes, createLeaveType, updateLeaveType, toggleLeaveTypeStatus, deleteLeaveType } = require('../controllers/operations/leaveType.controller');
const { getOvertimes, createOvertime, updateOvertime, toggleOvertimeStatus, deleteOvertime } = require('../controllers/operations/overtime.controller');
const verifyJWT = require('../middleware/auth.middleware');
const auditLogger = require('../middleware/audit.middleware');
const { authorizeRole } = require('../middleware/role.middleware');

const router = express.Router();

router.use(verifyJWT);

router.post('/attendance/clock-in', attendanceValidator, clockIn);
router.post('/attendance/clock-out', attendanceValidator, clockOut);
router.get('/attendance/history', getHistory);

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
