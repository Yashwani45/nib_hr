// backend/controllers/finance/payroll.controller.js
const payrollService = require('../../services/finance/payroll.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const createPayrollRun = asyncHandler(async (req, res) => {
  const { month, year } = req.body;
  const run = await payrollService.createPayrollRun(month, year, req.user?.id);
  res.status(201).json(new ApiResponse(201, run, 'Payroll run created successfully.'));
});

const getPayrollRuns = asyncHandler(async (req, res) => {
  const runs = await payrollService.getPayrollRuns(req.query);
  res.status(200).json(new ApiResponse(200, runs, 'Payroll runs retrieved successfully.'));
});

const getPayrollRunDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const run = await payrollService.getPayrollRunDetails(id);
  res.status(200).json(new ApiResponse(200, run, 'Payroll run details retrieved successfully.'));
});

const calculatePayrollRun = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const run = await payrollService.calculatePayrollRun(id, req.user?.id);
  res.status(200).json(new ApiResponse(200, run, 'Payroll calculations processed successfully.'));
});

const approvePayrollRun = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const run = await payrollService.approvePayrollRun(id, req.user?.id);
  res.status(200).json(new ApiResponse(200, run, 'Payroll run approved successfully.'));
});

const processPayrollRun = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const run = await payrollService.processPayrollRun(id, req.user?.id);
  res.status(200).json(new ApiResponse(200, run, 'Payroll run processed and payslips generated successfully.'));
});

const lockPayrollRun = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const run = await payrollService.lockPayrollRun(id, req.user?.id);
  res.status(200).json(new ApiResponse(200, run, 'Payroll run locked successfully. No further edits allowed.'));
});

const cancelPayrollRun = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const run = await payrollService.cancelPayrollRun(id, req.user?.id);
  res.status(200).json(new ApiResponse(200, run, 'Payroll run cancelled successfully.'));
});

module.exports = {
  createPayrollRun,
  getPayrollRuns,
  getPayrollRunDetails,
  calculatePayrollRun,
  approvePayrollRun,
  processPayrollRun,
  lockPayrollRun,
  cancelPayrollRun,
};
