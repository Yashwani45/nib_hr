// backend/controllers/finance/professionalTax.controller.js
const ptService = require('../../services/finance/professionalTax.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getPtRules = asyncHandler(async (req, res) => {
  const rules = await ptService.getPtRules(req.query);
  res.status(200).json(new ApiResponse(200, rules, 'Professional tax rules retrieved.'));
});

const createPtRule = asyncHandler(async (req, res) => {
  const rule = await ptService.createPtRule(req.body, req.user?.id);
  res.status(201).json(new ApiResponse(201, rule, 'Professional tax rule created successfully.'));
});

const getPtContributions = asyncHandler(async (req, res) => {
  const contributions = await ptService.getPtContributions(req.query);
  res.status(200).json(new ApiResponse(200, contributions, 'Professional tax contributions retrieved.'));
});

const getPtReport = asyncHandler(async (req, res) => {
  const report = await ptService.getPtReport(req.query);
  res.status(200).json(new ApiResponse(200, report, 'Professional tax report compiled.'));
});

module.exports = {
  getPtRules,
  createPtRule,
  getPtContributions,
  getPtReport,
};
