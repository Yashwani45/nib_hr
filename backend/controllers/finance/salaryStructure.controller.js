// backend/controllers/finance/salaryStructure.controller.js
const salaryStructureService = require('../../services/finance/salaryStructure.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const createSalaryStructure = asyncHandler(async (req, res) => {
  const structure = await salaryStructureService.createSalaryStructure(req.body, req.user?.id);
  res.status(201).json(new ApiResponse(201, structure, 'Salary structure created successfully.'));
});

const getSalaryStructures = asyncHandler(async (req, res) => {
  const structures = await salaryStructureService.getSalaryStructures(req.query);
  res.status(200).json(new ApiResponse(200, structures, 'Salary structures retrieved.'));
});

const getStructureDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const structure = await salaryStructureService.getStructureDetails(id);
  res.status(200).json(new ApiResponse(200, structure, 'Salary structure details retrieved.'));
});

const updateSalaryStructure = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const structure = await salaryStructureService.updateSalaryStructure(id, req.body, req.user?.id);
  res.status(200).json(new ApiResponse(200, structure, 'Salary structure updated successfully.'));
});

const assignSalaryStructure = asyncHandler(async (req, res) => {
  const assignment = await salaryStructureService.assignSalaryStructure(req.body, req.user?.id);
  res.status(201).json(new ApiResponse(201, assignment, 'Salary structure assigned successfully to employee.'));
});

module.exports = {
  createSalaryStructure,
  getSalaryStructures,
  getStructureDetails,
  updateSalaryStructure,
  assignSalaryStructure,
};
