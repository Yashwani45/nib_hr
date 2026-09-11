// backend/controllers/finance/tdsMaster.controller.js
const tdsMasterService = require('../../services/finance/tdsMaster.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getTdsMasters = asyncHandler(async (req, res) => {
  const result = await tdsMasterService.getAll();
  res.status(200).json(new ApiResponse(200, result, 'TDS Master records retrieved successfully.'));
});

const getTdsMasterById = asyncHandler(async (req, res) => {
  const result = await tdsMasterService.getById(req.params.id);
  res.status(200).json(new ApiResponse(200, result, 'TDS Master record details retrieved successfully.'));
});

const createTdsMaster = asyncHandler(async (req, res) => {
  const reqInfo = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
  const result = await tdsMasterService.create(req.body, req.user, reqInfo);
  res.status(201).json(new ApiResponse(201, result, 'TDS Master record created successfully.'));
});

const updateTdsMaster = asyncHandler(async (req, res) => {
  const result = await tdsMasterService.update(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, result, 'TDS Master record updated successfully.'));
});

const toggleTdsMasterStatus = asyncHandler(async (req, res) => {
  const result = await tdsMasterService.toggleStatus(req.params.id, req.body.status);
  res.status(200).json(new ApiResponse(200, result, 'TDS Master status updated successfully.'));
});

const deleteTdsMaster = asyncHandler(async (req, res) => {
  await tdsMasterService.delete(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'TDS Master record deleted successfully.'));
});

module.exports = {
  getTdsMasters,
  getTdsMasterById,
  createTdsMaster,
  updateTdsMaster,
  toggleTdsMasterStatus,
  deleteTdsMaster,
};
