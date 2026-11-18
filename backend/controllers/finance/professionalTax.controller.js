// backend/controllers/finance/professionalTax.controller.js
const ptService = require('../../services/finance/professionalTax.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getPtContributions = asyncHandler(async (req, res) => {
  const contributions = await ptService.getPtContributions(req.query);
  res.status(200).json(new ApiResponse(200, contributions, 'Professional tax contributions retrieved.'));
});

const getPtRules = asyncHandler(async (req, res) => {
  const rules = await ptService.getPtRules(req.query);
  res.status(200).json(new ApiResponse(200, rules, 'State professional tax slabs retrieved.'));
});

const createPtRule = asyncHandler(async (req, res) => {
  const rule = await ptService.createPtRule(req.body, req.user?.id);
  res.status(201).json(new ApiResponse(201, rule, 'Professional tax rule created successfully.'));
});

const updatePtRule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const rule = await ptService.updatePtRule(id, req.body, req.user?.id);
  res.status(200).json(new ApiResponse(200, rule, 'Professional tax rule updated successfully.'));
});

const deletePtRule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await ptService.deletePtRule(id, req.user?.id);
  res.status(200).json(new ApiResponse(200, result, 'Professional tax rule deleted successfully.'));
});

const getPtReport = asyncHandler(async (req, res) => {
  const report = await ptService.getPtReport(req.query);
  res.status(200).json(new ApiResponse(200, report, 'Professional tax register and liability summary generated.'));
});

const updatePtChallan = asyncHandler(async (req, res) => {
  const result = await ptService.updatePtChallan(req.body, req.user?.id);
  res.status(200).json(new ApiResponse(200, result, 'Professional tax challan reference updated.'));
});

const exportPtCsv = asyncHandler(async (req, res) => {
  const csv = await ptService.exportPtCsv(req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="Professional_Tax_Register.csv"');
  res.status(200).send(csv);
});

module.exports = {
  getPtContributions,
  getPtRules,
  createPtRule,
  updatePtRule,
  deletePtRule,
  getPtReport,
  updatePtChallan,
  exportPtCsv,
};
