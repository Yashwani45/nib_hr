// backend/controllers/finance/esi.controller.js
const esiService = require('../../services/finance/esi.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getEsiContributions = asyncHandler(async (req, res) => {
  const contributions = await esiService.getEsiContributions(req.query);
  res.status(200).json(new ApiResponse(200, contributions, 'ESI contributions retrieved.'));
});

const getEsiReport = asyncHandler(async (req, res) => {
  const report = await esiService.getEsiReport(req.query);
  res.status(200).json(new ApiResponse(200, report, 'ESI report compiled successfully.'));
});

module.exports = {
  getEsiContributions,
  getEsiReport,
};
