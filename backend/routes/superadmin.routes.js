// backend/routes/superadmin.routes.js
const express = require('express');
const { 
  getTenants, 
  createTenant, 
  deleteTenant, 
  getTenantLiveData,
  getSystemCapacity,
  getTenantBranches,
  addTenantBranch,
  toggleTenantBranchStatus
} = require('../controllers/superadmin.controller');
const { getOrgConfig, updateOrgConfig } = require('../controllers/operations/attendance.controller');
const verifyJWT = require('../middleware/auth.middleware');
const { authorizeRole } = require('../middleware/role.middleware');

const router = express.Router();

// All super-admin routes require JWT verification
router.use(verifyJWT);

// System-wide Metrics (Max 100 Companies & 50 Branches per Company)
router.get('/capacity', authorizeRole(['SuperAdmin', 'Admin']), getSystemCapacity);

// Tenants directory can be read by SuperAdmin and Admin for platform overview
router.get('/tenants', authorizeRole(['SuperAdmin', 'Admin']), getTenants);

// Provisioning and live-data inspection (SuperAdmin & Admin authorized)
router.post('/tenants', authorizeRole(['SuperAdmin', 'Admin']), createTenant);
router.delete('/tenants/:id', authorizeRole(['SuperAdmin', 'Admin']), deleteTenant);

// Tenant Branch Management (SuperAdmin / Admin authorized)
router.get('/tenants/:companyCode/branches', authorizeRole(['SuperAdmin', 'Admin']), getTenantBranches);
router.post('/tenants/:companyCode/branches', authorizeRole(['SuperAdmin', 'Admin']), addTenantBranch);
router.put('/tenants/:companyCode/branches/:branchId/status', authorizeRole(['SuperAdmin', 'Admin']), toggleTenantBranchStatus);

// Live Tenant Data & Inspector for SuperAdmin
router.get('/tenants/:companyCode/live-data', authorizeRole(['SuperAdmin', 'Admin']), getTenantLiveData);

// Tenant Attendance Method Configuration
router.get('/tenants/:companyCode/attendance-config', authorizeRole(['SuperAdmin', 'Admin']), getOrgConfig);
router.put('/tenants/:companyCode/attendance-config', authorizeRole(['SuperAdmin', 'Admin']), updateOrgConfig);

module.exports = router;
