// backend/controllers/operations/overtime.controller.js
const overtimeService = require('../../services/operations/overtime.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getOvertimes = asyncHandler(async (req, res) => {
  const result = await overtimeService.getAll();
  res.status(200).json(new ApiResponse(200, result, 'Overtime records retrieved successfully.'));
});

const getOvertimeById = asyncHandler(async (req, res) => {
  const result = await overtimeService.getById(req.params.id);
  res.status(200).json(new ApiResponse(200, result, 'Overtime record details retrieved successfully.'));
});

const createOvertime = asyncHandler(async (req, res) => {
  const reqInfo = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
  const result = await overtimeService.create(req.body, req.user, reqInfo);
  res.status(201).json(new ApiResponse(201, result, 'Overtime record created successfully.'));
});

const updateOvertime = asyncHandler(async (req, res) => {
  const result = await overtimeService.update(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, result, 'Overtime record updated successfully.'));
});

const toggleOvertimeStatus = asyncHandler(async (req, res) => {
  const result = await overtimeService.toggleStatus(req.params.id, req.body.status);
  res.status(200).json(new ApiResponse(200, result, 'Overtime status updated successfully.'));
});

const deleteOvertime = asyncHandler(async (req, res) => {
  await overtimeService.delete(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Overtime record deleted successfully.'));
});

module.exports = {
  getOvertimes,
  getOvertimeById,
  createOvertime,
  updateOvertime,
  toggleOvertimeStatus,
  deleteOvertime,
};
