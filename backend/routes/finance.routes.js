// backend/routes/finance.routes.js
const express = require('express');
const { processPayroll, getEmployeePayrolls } = require('../controllers/finance/payroll.controller');
const verifyJWT = require('../middleware/auth.middleware');
const { authorizeRole } = require('../middleware/role.middleware');

const router = express.Router();

router.use(verifyJWT);

// Process payroll restricted to Admins
router.post('/payroll', authorizeRole(['Admin']), processPayroll);
router.get('/payroll/:employeeId', getEmployeePayrolls);

module.exports = router;
