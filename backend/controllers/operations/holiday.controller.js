// backend/controllers/operations/holiday.controller.js
const holidayService = require('../../services/operations/holiday.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getHolidays = asyncHandler(async (req, res) => {
  const result = await holidayService.getAll(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Holidays retrieved successfully.'));
});

const getHolidayById = asyncHandler(async (req, res) => {
  const result = await holidayService.getById(req.params.id);
  res.status(200).json(new ApiResponse(200, result, 'Holiday details retrieved successfully.'));
});

const createHoliday = asyncHandler(async (req, res) => {
  const reqInfo = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
  const result = await holidayService.create(req.body, req.user, reqInfo);
  res.status(201).json(new ApiResponse(201, result, 'Holiday created successfully.'));
});

const updateHoliday = asyncHandler(async (req, res) => {
  const reqInfo = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
  const result = await holidayService.update(req.params.id, req.body, req.user, reqInfo);
  res.status(200).json(new ApiResponse(200, result, 'Holiday updated successfully.'));
});

const toggleHolidayStatus = asyncHandler(async (req, res) => {
  const result = await holidayService.toggleStatus(req.params.id, req.body.status);
  res.status(200).json(new ApiResponse(200, result, 'Holiday status updated successfully.'));
});

const deleteHoliday = asyncHandler(async (req, res) => {
  await holidayService.delete(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Holiday deleted successfully.'));
});

module.exports = {
  getHolidays,
  getHolidayById,
  createHoliday,
  updateHoliday,
  toggleHolidayStatus,
  deleteHoliday,
};
