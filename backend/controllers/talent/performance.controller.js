// backend/controllers/talent/performance.controller.js
const performanceService = require('../../services/talent/performance.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

// Dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await performanceService.getPerformanceDashboard(req.user);
  res.status(200).json(new ApiResponse(200, dashboard, 'Performance dashboard data retrieved.'));
});

// Master Cycles
const createReviewCycle = asyncHandler(async (req, res) => {
  const cycle = await performanceService.createReviewCycle(req.body, req.user?.id);
  res.status(201).json(new ApiResponse(201, cycle, 'Review cycle created successfully.'));
});

const getReviewCycles = asyncHandler(async (req, res) => {
  const cycles = await performanceService.getReviewCycles();
  res.status(200).json(new ApiResponse(200, cycles, 'Review cycles retrieved successfully.'));
});

// KPIs
const createKpi = asyncHandler(async (req, res) => {
  const kpi = await performanceService.createKpi(req.body, req.user?.id);
  res.status(201).json(new ApiResponse(201, kpi, 'KPI created successfully.'));
});

const getKpis = asyncHandler(async (req, res) => {
  const kpis = await performanceService.getKpis(req.query, req.user);
  res.status(200).json(new ApiResponse(200, kpis, 'KPIs retrieved.'));
});

const updateKpiProgress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { actualAchievement, remarks } = req.body;
  const kpi = await performanceService.updateKpiProgress(id, actualAchievement, req.user?.id, remarks);
  res.status(200).json(new ApiResponse(200, kpi, 'KPI progress logged.'));
});

// Goals
const createGoal = asyncHandler(async (req, res) => {
  const goal = await performanceService.createGoal(req.body, req.user?.id);
  res.status(201).json(new ApiResponse(201, goal, 'Goal assigned successfully.'));
});

const getGoals = asyncHandler(async (req, res) => {
  const goals = await performanceService.getGoals(req.query, req.user);
  res.status(200).json(new ApiResponse(200, goals, 'Goals retrieved.'));
});

const updateGoalProgress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { progress, comments, supportingDocument } = req.body;
  const goal = await performanceService.updateGoalProgress(goalId = id, progress, comments, supportingDocument, req.user?.id);
  res.status(200).json(new ApiResponse(200, goal, 'Goal progress logged successfully.'));
});

const approveGoal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, comments } = req.body;
  const goal = await performanceService.approveGoal(id, status, comments, req.user?.id);
  res.status(200).json(new ApiResponse(200, goal, 'Goal status updated.'));
});

// Appraisals
const initiateAppraisal = asyncHandler(async (req, res) => {
  const { employeeId, performanceMasterId } = req.body;
  const appraisal = await performanceService.initiateAppraisal(employeeId, performanceMasterId, req.user?.id);
  res.status(201).json(new ApiResponse(201, appraisal, 'Appraisal workflow initiated.'));
});

const getAppraisals = asyncHandler(async (req, res) => {
  const appraisals = await performanceService.getAppraisals(req.query, req.user);
  res.status(200).json(new ApiResponse(200, appraisals, 'Appraisals retrieved.'));
});

const getAppraisalDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const appraisal = await performanceService.getAppraisalDetails(id);
  res.status(200).json(new ApiResponse(200, appraisal, 'Appraisal details loaded.'));
});

const submitSelfAssessment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const appraisal = await performanceService.submitSelfAssessment(id, req.body, req.user?.id);
  res.status(200).json(new ApiResponse(200, appraisal, 'Self assessment submitted successfully.'));
});

const submitManagerReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const appraisal = await performanceService.submitManagerReview(id, req.body, req.user?.id);
  res.status(200).json(new ApiResponse(200, appraisal, 'Manager review saved.'));
});

const submitHrReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const appraisal = await performanceService.submitHrReview(id, req.body, req.user?.id);
  res.status(200).json(new ApiResponse(200, appraisal, 'HR review completed and final score generated.'));
});

const acknowledgeAppraisal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const appraisal = await performanceService.acknowledgeAppraisal(id, req.user?.id);
  res.status(200).json(new ApiResponse(200, appraisal, 'Appraisal feedback acknowledged by employee.'));
});

// Promotions & Increments
const recommendPromotion = asyncHandler(async (req, res) => {
  const promotion = await performanceService.recommendPromotion(req.body, req.user?.id);
  res.status(201).json(new ApiResponse(201, promotion, 'Promotion recommended.'));
});

const approvePromotion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const promotion = await performanceService.approvePromotion(id, req.user?.id);
  res.status(200).json(new ApiResponse(200, promotion, 'Promotion approved and designation synchronized.'));
});

const recommendIncrement = asyncHandler(async (req, res) => {
  const increment = await performanceService.recommendIncrement(req.body, req.user?.id);
  res.status(201).json(new ApiResponse(201, increment, 'Increment recommended successfully.'));
});

const approveIncrement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const increment = await performanceService.approveIncrement(id, req.user?.id);
  res.status(200).json(new ApiResponse(200, increment, 'Salary increment approved and salary assignment revision created.'));
});

// Reports
const getReport = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const data = await performanceService.getPerformanceReport(type, req.query);
  res.status(200).json(new ApiResponse(200, data, 'Performance report compiled.'));
});

const exportCsv = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const csvContent = await performanceService.exportReportCsv(type, req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${type}_performance_report.csv"`);
  res.status(200).send(csvContent);
});

module.exports = {
  getDashboard,
  createReviewCycle,
  getReviewCycles,
  createKpi,
  getKpis,
  updateKpiProgress,
  createGoal,
  getGoals,
  updateGoalProgress,
  approveGoal,
  initiateAppraisal,
  getAppraisals,
  getAppraisalDetails,
  submitSelfAssessment,
  submitManagerReview,
  submitHrReview,
  acknowledgeAppraisal,
  recommendPromotion,
  approvePromotion,
  recommendIncrement,
  approveIncrement,
  getReport,
  exportCsv,
};
