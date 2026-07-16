// backend/controllers/talent/recruitment.controller.js
const recruitmentService = require('../../services/talent/recruitment.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const createJob = asyncHandler(async (req, res) => {
  const job = await recruitmentService.createJobRequisition(req.body, req.user?.id);
  res.status(201).json(new ApiResponse(201, job, 'Job Requisition created successfully.'));
});

const getJobById = asyncHandler(async (req, res) => {
  const job = await recruitmentService.getJobById(req.params.id);
  res.status(200).json(new ApiResponse(200, job, 'Job Requisition retrieved successfully.'));
});

const updateJob = asyncHandler(async (req, res) => {
  const job = await recruitmentService.updateJob(req.params.id, req.body, req.user?.id);
  res.status(200).json(new ApiResponse(200, job, 'Job Requisition updated successfully.'));
});

const deleteJob = asyncHandler(async (req, res) => {
  await recruitmentService.deleteJob(req.params.id, req.user?.id);
  res.status(200).json(new ApiResponse(200, null, 'Job Requisition deleted successfully.'));
});

const getAllJobs = asyncHandler(async (req, res) => {
  const { page, limit, search, sortBy, sortOrder } = req.query;
  const jobs = await recruitmentService.getAllJobs({ page, limit, search, sortBy, sortOrder });
  res.status(200).json(new ApiResponse(200, jobs, 'Job listings retrieved successfully.'));
});

module.exports = {
  createJob,
  getJobById,
  updateJob,
  deleteJob,
  getAllJobs,
};
