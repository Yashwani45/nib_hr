// backend/routes/exit.routes.js
const express = require('express');
const verifyJWT = require('../middleware/auth.middleware');
const exitController = require('../controllers/core/exit.controller');

const router = express.Router();

router.use(verifyJWT);

// Dashboard
router.get('/dashboard', exitController.getDashboardStats);

// Resignations
router.get('/resignations', exitController.getResignations);
router.post('/resignations', exitController.createResignation);
router.post('/resignations/:id/approve', exitController.approveResignation);
router.post('/resignations/:id/reject', exitController.rejectResignation);

// Notice Periods
router.get('/notice-periods', exitController.getNoticePeriods);
router.put('/notice-periods/:id', exitController.updateNoticePeriod);

// Clearances
router.get('/clearances', exitController.getClearances);
router.put('/clearances/:id', exitController.updateClearance);

// Asset Returns
router.get('/assets', exitController.getAssetReturns);
router.put('/assets/:id/return', exitController.updateAssetReturn);

// No Dues
router.get('/no-dues', exitController.getNoDuesList);
router.post('/no-dues/:id/approve', exitController.approveNoDues);

// F&F Settlement
router.get('/fnf', exitController.getFnfList);
router.put('/fnf/:id', exitController.saveFnf);
router.post('/fnf/:id/approve', exitController.approveFnf);
router.post('/fnf/:id/pay', exitController.payFnf);

// Exit Interviews
router.get('/interviews', exitController.getInterviews);
router.post('/interviews', exitController.submitInterview);

// Experience Letters
router.get('/experience-letters', exitController.getExperienceLetters);
router.post('/experience-letters/:id/generate', exitController.generateExperienceLetter);
router.get('/experience-letters/:id/download', exitController.downloadExperienceLetter);

// History
router.get('/history', exitController.getExitHistory);

module.exports = router;
