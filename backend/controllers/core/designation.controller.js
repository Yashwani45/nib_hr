// backend/controllers/core/designation.controller.js
const designationService = require('../../services/core/designation.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getDesignations = asyncHandler(async (req, res) => {
  const result = await designationService.getAll(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Designations retrieved successfully.'));
});

const getDesignationById = asyncHandler(async (req, res) => {
  const result = await designationService.getById(req.params.id);
  res.status(200).json(new ApiResponse(200, result, 'Designation details retrieved successfully.'));
});



const createDesignation = asyncHandler(async (req, res) => {
  const reqInfo = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
  const result = await designationService.create(req.body, req.user, reqInfo);
  res.status(201).json(new ApiResponse(201, result, 'Designation created successfully.'));
});

const updateDesignation = asyncHandler(async (req, res) => {
  const reqInfo = { ipAddress: req.ip, userAgent: req.headers['user-agent'] };
  const result = await designationService.update(req.params.id, req.body, req.user, reqInfo);
  res.status(200).json(new ApiResponse(200, result, 'Designation updated successfully.'));
});

const toggleDesignationStatus = asyncHandler(async (req, res) => {
  const result = await designationService.toggleStatus(req.params.id, req.body.status);
  res.status(200).json(new ApiResponse(200, result, 'Designation status updated successfully.'));
});

const deleteDesignation = asyncHandler(async (req, res) => {
  await designationService.delete(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Designation deleted successfully.'));
});

module.exports = {
  getDesignations,
  getDesignationById,
  createDesignation,
  updateDesignation,
  toggleDesignationStatus,
  deleteDesignation,
};
