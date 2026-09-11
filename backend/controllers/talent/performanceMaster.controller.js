// backend/controllers/talent/performanceMaster.controller.js
const performanceMasterService = require('../../services/talent/performanceMaster.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getPerformanceMasters = asyncHandler(async (req, res) => {
  const result = await performanceMasterService.getAll();
  res.status(200).json(new ApiResponse(200, result, 'Performance Master records retrieved successfully.'));
});

const getPerformanceMasterById = asyncHandler(async (req, res) => {
  const result = await performanceMasterService.getById(req.params.id);
  res.status(200).json(new ApiResponse(200, result, 'Performance Master record details retrieved successfully.'));
});

const createPerformanceMaster = asyncHandler(async (req, res) => {
  const reqInfo = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
  const result = await performanceMasterService.create(req.body, req.user, reqInfo);
  res.status(201).json(new ApiResponse(201, result, 'Performance Master record created successfully.'));
});

const updatePerformanceMaster = asyncHandler(async (req, res) => {
  const result = await performanceMasterService.update(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, result, 'Performance Master record updated successfully.'));
});

const togglePerformanceMasterStatus = asyncHandler(async (req, res) => {
  const result = await performanceMasterService.toggleStatus(req.params.id, req.body.status);
  res.status(200).json(new ApiResponse(200, result, 'Performance Master status updated successfully.'));
});

const deletePerformanceMaster = asyncHandler(async (req, res) => {
  await performanceMasterService.delete(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Performance Master record deleted successfully.'));
});

module.exports = {
  getPerformanceMasters,
  getPerformanceMasterById,
  createPerformanceMaster,
  updatePerformanceMaster,
  togglePerformanceMasterStatus,
  deletePerformanceMaster,
};
