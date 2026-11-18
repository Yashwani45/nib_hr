// backend/controllers/finance/esi.controller.js
const esiService = require('../../services/finance/esi.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getEsiContributions = asyncHandler(async (req, res) => {
  const contributions = await esiService.getEsiContributions(req.query);
  res.status(200).json(new ApiResponse(200, contributions, 'ESI contributions retrieved successfully.'));
});

const getEsiReport = asyncHandler(async (req, res) => {
  const report = await esiService.getEsiReport(req.query);
  res.status(200).json(new ApiResponse(200, report, 'ESI statutory summary and statement generated.'));
});

const updateEsiChallan = asyncHandler(async (req, res) => {
  const result = await esiService.updateEsiChallan(req.body, req.user?.id);
  res.status(200).json(new ApiResponse(200, result, 'ESI challan details updated successfully.'));
});

const exportEsiCsv = asyncHandler(async (req, res) => {
  const csv = await esiService.exportEsiCsv(req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="ESI_Contribution_Register.csv"');
  res.status(200).send(csv);
});

module.exports = {
  getEsiContributions,
  getEsiReport,
  updateEsiChallan,
  exportEsiCsv,
};
