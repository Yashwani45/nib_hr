// backend/controllers/finance/report.controller.js
const reportService = require('../../services/finance/report.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getReportData = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const data = await reportService.getReportData(type, req.query);
  res.status(200).json(new ApiResponse(200, data, 'Report data retrieved.'));
});

const exportCsv = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const csvContent = await reportService.exportToCsv(type, req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${type}_report.csv"`);
  res.status(200).send(csvContent);
});

module.exports = {
  getReportData,
  exportCsv,
};
