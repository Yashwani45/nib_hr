// backend/routes/index.js
const express = require('express');

const authRoutes = require('./auth.routes');
const coreRoutes = require('./core.routes');
const talentRoutes = require('./talent.routes');
const operationsRoutes = require('./operations.routes');
const financeRoutes = require('./finance.routes');
const supportRoutes = require('./support.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/core', coreRoutes);
router.use('/talent', talentRoutes);
router.use('/operations', operationsRoutes);
router.use('/finance', financeRoutes);
router.use('/support', supportRoutes);

module.exports = router;
