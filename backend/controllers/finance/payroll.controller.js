// backend/controllers/finance/payroll.controller.js
const payrollService = require('../../services/finance/payroll.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const createPayrollRun = asyncHandler(async (req, res) => {
  const { month, year, notes } = req.body;
  const run = await payrollService.createPayrollRun(month, year, req.user?.id, notes);
  res.status(201).json(new ApiResponse(201, run, 'Payroll run created successfully as Draft.'));
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
  const run = await payrollService.calculatePayrollRun(id, req.user?.id, req.body);
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

const recordPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const run = await payrollService.recordPayment(id, req.body, req.user?.id);
  res.status(200).json(new ApiResponse(200, run, 'Payment transaction details recorded successfully.'));
});

const exportBankPaymentInstructions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const csv = await payrollService.exportBankPaymentInstructions(id);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="Bank_Payment_Instructions_${id}.csv"`);
  res.status(200).send(csv);
});

const getPayrollRecords = asyncHandler(async (req, res) => {
  const records = await payrollService.getPayrollRecords(req.query);
  res.status(200).json(new ApiResponse(200, records, 'Payroll records retrieved successfully.'));
});

const getPayrollRecordById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const record = await payrollService.getPayrollRecordById(id);
  res.status(200).json(new ApiResponse(200, record, 'Payroll record retrieved successfully.'));
});

const getPayrollAuditLogs = asyncHandler(async (req, res) => {
  const logs = await payrollService.getPayrollAuditLogs(req.query);
  res.status(200).json(new ApiResponse(200, logs, 'Payroll audit logs retrieved successfully.'));
});

const getPayrollPayments = asyncHandler(async (req, res) => {
  const payments = await payrollService.getPayrollPayments(req.query);
  res.status(200).json(new ApiResponse(200, payments, 'Payroll payments retrieved successfully.'));
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
  recordPayment,
  exportBankPaymentInstructions,
  getPayrollRecords,
  getPayrollRecordById,
  getPayrollAuditLogs,
  getPayrollPayments,
};
