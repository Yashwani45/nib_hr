// backend/controllers/finance/payslip.controller.js
const payslipService = require('../../services/finance/payslip.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getPayslips = asyncHandler(async (req, res) => {
  const payslips = await payslipService.getPayslips(req.query, req.user);
  res.status(200).json(new ApiResponse(200, payslips, 'Payslips retrieved successfully.'));
});

const getPayslipDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payslip = await payslipService.getPayslipDetails(id, req.user);
  res.status(200).json(new ApiResponse(200, payslip, 'Payslip details retrieved successfully.'));
});

const getPayslipPdf = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const htmlContent = await payslipService.getPayslipPdf(id, req.user);
  // Send back raw html content. The client will embed this in an iframe to trigger browser-side PDF printing/saving.
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(htmlContent);
});

module.exports = {
  getPayslips,
  getPayslipDetails,
  getPayslipPdf,
};
