// backend/controllers/finance/payroll.controller.js
const payrollService = require('../../services/finance/payroll.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const processPayroll = asyncHandler(async (req, res) => {
  const { employeeId, month, year } = req.body;
  const payroll = await payrollService.processMonthlyPayroll(employeeId, month, year, req.user?.id);
  res.status(201).json(new ApiResponse(201, payroll, 'Monthly payroll processed successfully.'));
});

const getEmployeePayrolls = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const payrolls = await payrollService.getEmployeePayrolls(employeeId);
  res.status(200).json(new ApiResponse(200, payrolls, 'Payroll records retrieved successfully.'));
});

module.exports = {
  processPayroll,
  getEmployeePayrolls,
};
