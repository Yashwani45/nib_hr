// backend/controllers/operations/leaveType.controller.js
const leaveTypeService = require('../../services/operations/leaveType.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getLeaveTypes = asyncHandler(async (req, res) => {
  const result = await leaveTypeService.getAll();
  res.status(200).json(new ApiResponse(200, result, 'Leave types retrieved successfully.'));
});

const getLeaveTypeById = asyncHandler(async (req, res) => {
  const result = await leaveTypeService.getById(req.params.id);
  res.status(200).json(new ApiResponse(200, result, 'Leave type details retrieved successfully.'));
});

const createLeaveType = asyncHandler(async (req, res) => {
  const reqInfo = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
  const result = await leaveTypeService.create(req.body, req.user, reqInfo);
  res.status(201).json(new ApiResponse(201, result, 'Leave type created successfully.'));
});

const updateLeaveType = asyncHandler(async (req, res) => {
  const reqInfo = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
  const result = await leaveTypeService.update(req.params.id, req.body, req.user, reqInfo);
  res.status(200).json(new ApiResponse(200, result, 'Leave type updated successfully.'));
});

const toggleLeaveTypeStatus = asyncHandler(async (req, res) => {
  const result = await leaveTypeService.toggleStatus(req.params.id, req.body.status);
  res.status(200).json(new ApiResponse(200, result, 'Leave type status updated successfully.'));
});

const deleteLeaveType = asyncHandler(async (req, res) => {
  await leaveTypeService.delete(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Leave type deleted successfully.'));
});

module.exports = {
  getLeaveTypes,
  getLeaveTypeById,
  createLeaveType,
  updateLeaveType,
  toggleLeaveTypeStatus,
  deleteLeaveType,
};
