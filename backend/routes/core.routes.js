// backend/routes/core.routes.js
const express = require('express');
const {
  createEmployee,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getAllEmployees,
} = require('../controllers/core/employee.controller');
const { employeeValidator } = require('../validators/core/employee.validator');
const verifyJWT = require('../middleware/auth.middleware');
const { authorizeRole } = require('../middleware/role.middleware');

const router = express.Router();

// All core routes require authentication
router.use(verifyJWT);

router.get('/employees', getAllEmployees);
router.get('/employees/:id', getEmployeeById);

// Creation, Updating and Deletion restricted to Admin/Manager roles
router.post('/employees', authorizeRole(['Admin', 'Manager']), employeeValidator, createEmployee);
router.put('/employees/:id', authorizeRole(['Admin', 'Manager']), employeeValidator, updateEmployee);
router.delete('/employees/:id', authorizeRole(['Admin']), deleteEmployee);

module.exports = router;
