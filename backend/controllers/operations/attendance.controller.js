// backend/controllers/operations/attendance.controller.js
const attendanceService = require('../../services/operations/attendance.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const clockIn = asyncHandler(async (req, res) => {
  const { checkIn, date } = req.body;
  const userId = req.user?.id;
  const attendance = await attendanceService.clockIn(userId, checkIn, date);
  res.status(201).json(new ApiResponse(201, attendance, 'Checked in successfully.'));
});

const clockOut = asyncHandler(async (req, res) => {
  const { checkOut, date } = req.body;
  const userId = req.user?.id;
  const attendance = await attendanceService.clockOut(userId, checkOut, date);
  res.status(200).json(new ApiResponse(200, attendance, 'Checked out successfully.'));
});

const getHistory = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const history = await attendanceService.getEmployeeAttendanceHistory(userId);
  res.status(200).json(new ApiResponse(200, history, 'Attendance history retrieved.'));
});

module.exports = {
  clockIn,
  clockOut,
  getHistory,
};
