// backend/controllers/core/employee.controller.js
const employeeService = require('../../services/core/employee.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const createEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.createEmployee(req.body, req.user?.id);
  res.status(201).json(new ApiResponse(201, employee, 'Employee record created successfully.'));
});

const getEmployeeById = asyncHandler(async (req, res) => {
  const employee = await employeeService.getEmployeeById(req.params.id);
  res.status(200).json(new ApiResponse(200, employee, 'Employee record retrieved successfully.'));
});

const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.updateEmployee(req.params.id, req.body, req.user?.id);
  res.status(200).json(new ApiResponse(200, employee, 'Employee record updated successfully.'));
});

const deleteEmployee = asyncHandler(async (req, res) => {
  await employeeService.deleteEmployee(req.params.id, req.user?.id);
  res.status(200).json(new ApiResponse(200, null, 'Employee record deleted successfully.'));
});

const getAllEmployees = asyncHandler(async (req, res) => {
  const { page, limit, search, sortBy, sortOrder } = req.query;
  const employees = await employeeService.getAllEmployees({ page, limit, search, sortBy, sortOrder });
  res.status(200).json(new ApiResponse(200, employees, 'Employee list retrieved successfully.'));
});

module.exports = {
  createEmployee,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getAllEmployees,
};
