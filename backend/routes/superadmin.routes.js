// backend/routes/superadmin.routes.js
const express = require('express');
const { getTenants, createTenant, deleteTenant } = require('../controllers/superadmin.controller');
const verifyJWT = require('../middleware/auth.middleware');
const { authorizeRole } = require('../middleware/role.middleware');

const router = express.Router();

// All super-admin routes require JWT verification and SuperAdmin role
router.use(verifyJWT);
router.use(authorizeRole(['SuperAdmin']));

router.get('/tenants', getTenants);
router.post('/tenants', createTenant);
router.delete('/tenants/:id', deleteTenant);

module.exports = router;
