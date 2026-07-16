// backend/routes/operations.routes.js
const express = require('express');
const { clockIn, clockOut, getHistory } = require('../controllers/operations/attendance.controller');
const { attendanceValidator } = require('../validators/operations/attendance.validator');
const verifyJWT = require('../middleware/auth.middleware');

const router = express.Router();

router.use(verifyJWT);

router.post('/attendance/clock-in', attendanceValidator, clockIn);
router.post('/attendance/clock-out', attendanceValidator, clockOut);
router.get('/attendance/history', getHistory);

module.exports = router;
