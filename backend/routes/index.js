// backend/routes/index.js
const express = require('express');

const authRoutes = require('./auth.routes');
const coreRoutes = require('./core.routes');
const talentRoutes = require('./talent.routes');
const operationsRoutes = require('./operations.routes');
const financeRoutes = require('./finance.routes');
const supportRoutes = require('./support.routes');
const performanceRoutes = require('./performance.routes');

const tableRoutes = require('./table.routes');
const superAdminRoutes = require('./superadmin.routes');
const documentRoutes = require('./document.routes');
const exitRoutes = require('./exit.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/core', coreRoutes);
router.use('/table', tableRoutes);
router.use('/talent', talentRoutes);
router.use('/operations', operationsRoutes);
router.use('/finance', financeRoutes);
router.use('/support', supportRoutes);
router.use('/performance', performanceRoutes);
router.use('/super-admin', superAdminRoutes);
router.use('/documents', documentRoutes);
router.use('/employee/documents', documentRoutes);
router.use('/exit', exitRoutes);

module.exports = router;
