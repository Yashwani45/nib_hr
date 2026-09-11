// backend/controllers/core/exit.controller.js
const exitService = require('../../services/core/exit.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/apiError');
const fs = require('fs');
const path = require('path');

const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await exitService.getExitDashboardStats(req.tenantDb);
  res.status(200).json(new ApiResponse(200, stats, 'Exit dashboard stats retrieved.'));
});

const getResignations = asyncHandler(async (req, res) => {
  const resignations = await exitService.getResignations(req.tenantDb, req.user);
  res.status(200).json(new ApiResponse(200, resignations, 'Resignations list retrieved.'));
});

const createResignation = asyncHandler(async (req, res) => {
  const result = await exitService.createResignation(req.tenantDb, req.body, req.user);
  res.status(201).json(new ApiResponse(201, result, 'Resignation submitted successfully.'));
});

const approveResignation = asyncHandler(async (req, res) => {
  const { approved_lwd, remarks } = req.body;
  await exitService.approveResignation(req.tenantDb, req.params.id, approved_lwd, remarks, req.user);
  res.status(200).json(new ApiResponse(200, null, 'Resignation approved and exit lifecycle initiated.'));
});

const rejectResignation = asyncHandler(async (req, res) => {
  const { remarks } = req.body;
  await exitService.rejectResignation(req.tenantDb, req.params.id, remarks, req.user);
  res.status(200).json(new ApiResponse(200, null, 'Resignation rejected successfully.'));
});

const getNoticePeriods = asyncHandler(async (req, res) => {
  const periods = await exitService.getNoticePeriods(req.tenantDb, req.user);
  res.status(200).json(new ApiResponse(200, periods, 'Notice period records retrieved.'));
});

const updateNoticePeriod = asyncHandler(async (req, res) => {
  await exitService.updateNoticePeriod(req.tenantDb, req.params.id, req.body, req.user);
  res.status(200).json(new ApiResponse(200, null, 'Notice period updated successfully.'));
});

const getClearances = asyncHandler(async (req, res) => {
  const clearances = await exitService.getClearances(req.tenantDb, req.user);
  res.status(200).json(new ApiResponse(200, clearances, 'Clearance records retrieved.'));
});

const updateClearance = asyncHandler(async (req, res) => {
  const { status, remarks, rejection_reason } = req.body;
  await exitService.updateClearance(req.tenantDb, req.params.id, status, remarks, rejection_reason, req.user);
  res.status(200).json(new ApiResponse(200, null, 'Clearance status updated successfully.'));
});

const getAssetReturns = asyncHandler(async (req, res) => {
  const returns = await exitService.getAssetReturns(req.tenantDb, req.user);
  res.status(200).json(new ApiResponse(200, returns, 'Asset return records retrieved.'));
});

const updateAssetReturn = asyncHandler(async (req, res) => {
  const { status, remarks, condition_after } = req.body;
  await exitService.updateAssetReturn(req.tenantDb, req.params.id, status, remarks, condition_after, req.user);
  res.status(200).json(new ApiResponse(200, null, 'Asset return updated.'));
});

const getNoDuesList = asyncHandler(async (req, res) => {
  const list = await exitService.getNoDuesList(req.tenantDb, req.user);
  res.status(200).json(new ApiResponse(200, list, 'No dues records retrieved.'));
});

const approveNoDues = asyncHandler(async (req, res) => {
  const { remarks } = req.body;
  await exitService.approveNoDues(req.tenantDb, req.params.id, remarks, req.user);
  res.status(200).json(new ApiResponse(200, null, 'No dues cleared successfully.'));
});

const getFnfList = asyncHandler(async (req, res) => {
  const list = await exitService.getFnfList(req.tenantDb, req.user);
  res.status(200).json(new ApiResponse(200, list, 'F&F settlement details retrieved.'));
});

const saveFnf = asyncHandler(async (req, res) => {
  await exitService.saveFnf(req.tenantDb, req.params.id, req.body, req.user);
  res.status(200).json(new ApiResponse(200, null, 'F&F details updated successfully.'));
});

const approveFnf = asyncHandler(async (req, res) => {
  await exitService.approveFnf(req.tenantDb, req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, null, 'F&F settlement approved.'));
});

const payFnf = asyncHandler(async (req, res) => {
  await exitService.payFnf(req.tenantDb, req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, null, 'F&F settlement marked as Paid.'));
});

const getInterviews = asyncHandler(async (req, res) => {
  const list = await exitService.getInterviews(req.tenantDb, req.user);
  res.status(200).json(new ApiResponse(200, list, 'Exit interviews retrieved.'));
});

const submitInterview = asyncHandler(async (req, res) => {
  await exitService.submitInterview(req.tenantDb, req.body, req.user);
  res.status(201).json(new ApiResponse(201, null, 'Exit interview feedback submitted.'));
});

const getExperienceLetters = asyncHandler(async (req, res) => {
  const letters = await exitService.getExperienceLetters(req.tenantDb, req.user);
  res.status(200).json(new ApiResponse(200, letters, 'Experience letters retrieved.'));
});

const generateExperienceLetter = asyncHandler(async (req, res) => {
  await exitService.generateExperienceLetter(req.tenantDb, req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, null, 'Experience letter generated.'));
});

const downloadExperienceLetter = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { QueryTypes } = require('sequelize');

  const [letter] = await req.tenantDb.query('SELECT storage_key FROM `experience_letters` WHERE id = ? LIMIT 1', {
    replacements: [id],
    type: QueryTypes.SELECT
  });

  if (!letter || !letter.storage_key) {
    throw new ApiError(404, 'Experience letter file has not been generated yet.');
  }

  const filePath = path.join(__dirname, '../../uploads', letter.storage_key);
  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, 'Letter template file not found on server.');
  }

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', `attachment; filename="Experience_Letter_${id}.html"`);
  
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

const getExitHistory = asyncHandler(async (req, res) => {
  const history = await exitService.getExitHistory(req.tenantDb, req.user);
  res.status(200).json(new ApiResponse(200, history, 'Exit history records retrieved.'));
});

module.exports = {
  getDashboardStats,
  getResignations,
  createResignation,
  approveResignation,
  rejectResignation,
  getNoticePeriods,
  updateNoticePeriod,
  getClearances,
  updateClearance,
  getAssetReturns,
  updateAssetReturn,
  getNoDuesList,
  approveNoDues,
  getFnfList,
  saveFnf,
  approveFnf,
  payFnf,
  getInterviews,
  submitInterview,
  getExperienceLetters,
  generateExperienceLetter,
  downloadExperienceLetter,
  getExitHistory
};
