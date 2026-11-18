// backend/controllers/finance/salaryStructure.controller.js
const salaryStructureService = require('../../services/finance/salaryStructure.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const createSalaryStructure = asyncHandler(async (req, res) => {
  const structure = await salaryStructureService.createSalaryStructure(req.body, req.user?.id);
  res.status(201).json(new ApiResponse(201, structure, 'Salary structure created successfully.'));
});

const getSalaryStructures = asyncHandler(async (req, res) => {
  const result = await salaryStructureService.getSalaryStructures(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Salary structures retrieved successfully.'));
});

const getStructureDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const structure = await salaryStructureService.getStructureDetails(id);
  res.status(200).json(new ApiResponse(200, structure, 'Salary structure details retrieved.'));
});

const getApplicableStructures = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const structures = await salaryStructureService.getApplicableStructures(employeeId, req.query.effectiveDate);
  res.status(200).json(new ApiResponse(200, structures, 'Applicable salary structures retrieved.'));
});

const updateSalaryStructure = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const structure = await salaryStructureService.updateSalaryStructure(id, req.body, req.user?.id);
  res.status(200).json(new ApiResponse(200, structure, 'Salary structure updated successfully.'));
});

const toggleStructureStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const structure = await salaryStructureService.toggleStructureStatus(id, req.user?.id);
  res.status(200).json(new ApiResponse(200, structure, `Salary structure ${structure.isActive ? 'activated' : 'archived'} successfully.`));
});

const assignSalaryStructure = asyncHandler(async (req, res) => {
  const result = await salaryStructureService.assignSalaryStructure(req.body, req.user?.id);
  res.status(201).json(new ApiResponse(201, result, 'Salary structure assigned successfully to employee.'));
});

const approveSalaryAssignment = asyncHandler(async (req, res) => {
  const assignment = await salaryStructureService.approveSalaryAssignment(req.params.id, req.user?.id);
  res.status(200).json(new ApiResponse(200, assignment, 'Salary assignment approved successfully.'));
});

const getEmployeeSalaryHistory = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const history = await salaryStructureService.getEmployeeSalaryHistory(employeeId);
  res.status(200).json(new ApiResponse(200, history, 'Employee salary revision history retrieved.'));
});

const previewCalculation = asyncHandler(async (req, res) => {
  const preview = await salaryStructureService.previewCalculation(req.body);
  res.status(200).json(new ApiResponse(200, preview, 'Salary breakdown preview calculated.'));
});

module.exports = {
  createSalaryStructure,
  getSalaryStructures,
  getStructureDetails,
  getApplicableStructures,
  updateSalaryStructure,
  toggleStructureStatus,
  assignSalaryStructure,
  approveSalaryAssignment,
  getEmployeeSalaryHistory,
  previewCalculation,
};
