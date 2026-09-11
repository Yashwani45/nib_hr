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
const upload = require('../middleware/upload.middleware');
const path = require('path');
const fs = require('fs');
const { masterSequelize } = require('../config/database');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { sanitizeCompanyFolder } = require('../utils/companyFolderScaffolder');

const { getAuditLogs } = require('../controllers/core/auditLog.controller');
const { getAccessibleUIConfig } = require('../controllers/core/navigation.controller');
const auditLogger = require('../middleware/audit.middleware');

const router = express.Router();

const {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  toggleDepartmentStatus,
  deleteDepartment
} = require('../controllers/core/department.controller');
const {
  departmentCreateValidator,
  departmentUpdateValidator,
  departmentStatusToggleValidator
} = require('../validators/core/department.validator');

const {
  getDesignations,
  getDesignationById,
  createDesignation,
  updateDesignation,
  toggleDesignationStatus,
  deleteDesignation
} = require('../controllers/core/designation.controller');

// All core routes require authentication
router.use(verifyJWT);

// Employee Routes
router.get('/employees', auditLogger('Core'), getAllEmployees);
router.get('/employees/:id', auditLogger('Core'), getEmployeeById);

// Creation, Updating and Deletion restricted to Admin/Manager roles
router.post('/employees', auditLogger('Core'), authorizeRole(['Admin', 'Manager']), employeeValidator, createEmployee);
router.put('/employees/:id', auditLogger('Core'), authorizeRole(['Admin', 'Manager']), employeeValidator, updateEmployee);
router.delete('/employees/:id', auditLogger('Core'), authorizeRole(['Admin']), deleteEmployee);

// Department Master Routes
router.get('/departments', auditLogger('Department'), getDepartments);
router.get('/departments/:id', auditLogger('Department'), getDepartmentById);
router.post('/departments', auditLogger('Department'), authorizeRole(['Admin', 'SuperAdmin', 'Manager']), departmentCreateValidator, createDepartment);
router.put('/departments/:id', auditLogger('Department'), authorizeRole(['Admin', 'SuperAdmin', 'Manager']), departmentUpdateValidator, updateDepartment);
router.patch('/departments/:id/status', auditLogger('Department'), authorizeRole(['Admin', 'SuperAdmin', 'Manager']), departmentStatusToggleValidator, toggleDepartmentStatus);
router.delete('/departments/:id', auditLogger('Department'), authorizeRole(['Admin', 'SuperAdmin']), deleteDepartment);

// Designation Master Routes
router.get('/designations', auditLogger('Designation'), getDesignations);
router.get('/designations/:id', auditLogger('Designation'), getDesignationById);
router.post('/designations', auditLogger('Designation'), authorizeRole(['Admin', 'SuperAdmin', 'Manager']), createDesignation);
router.put('/designations/:id', auditLogger('Designation'), authorizeRole(['Admin', 'SuperAdmin', 'Manager']), updateDesignation);
router.patch('/designations/:id/status', auditLogger('Designation'), authorizeRole(['Admin', 'SuperAdmin', 'Manager']), toggleDesignationStatus);
router.delete('/designations/:id', auditLogger('Designation'), authorizeRole(['Admin', 'SuperAdmin']), deleteDesignation);

// Audit logs retrieval (filtered internally by role)
router.get('/audit-logs', auditLogger('Core'), getAuditLogs);

// Dynamic UI layout config resolver (Menus/Widgets)
router.get('/ui-config', getAccessibleUIConfig);

// File upload endpoint for employee workspace folder
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No file was uploaded.');
    }

    const tenantId = req.headers['x-company-code'] || req.user?.companyCode || 'NIB01';
    
    // Resolve Company Name from master DB
    const [tenantRows] = await masterSequelize.query(
      `SELECT company_name FROM tenants WHERE id = ? LIMIT 1`,
      { replacements: [tenantId] }
    );
    const companyName = tenantRows && tenantRows.length > 0 ? tenantRows[0].company_name : tenantId;
    const cleanCompanyFolder = sanitizeCompanyFolder(companyName);

    const empIdentifier = req.body.employeeName || req.body.employeeId || req.user?.employee?.first_name || 'Employee';
    const cleanEmployeeName = String(empIdentifier).replace(/[^a-zA-Z0-9]/g, '');

    const companyBaseDir = path.join(__dirname, '..', '..', 'Frontend', 'src', 'Company');
    const employeeDir = path.join(companyBaseDir, cleanCompanyFolder, 'Employee', cleanEmployeeName);

    if (!fs.existsSync(employeeDir)) {
      fs.mkdirSync(employeeDir, { recursive: true });
    }

    const targetFilePath = path.join(employeeDir, req.file.filename);
    fs.renameSync(req.file.path, targetFilePath);

    const relativeUrl = `/src/Company/${cleanCompanyFolder}/Employee/${cleanEmployeeName}/${req.file.filename}`;

    return res.status(200).json(new ApiResponse(200, relativeUrl, 'File uploaded and saved to employee workspace successfully.'));
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    next(err);
  }
});

module.exports = router;
