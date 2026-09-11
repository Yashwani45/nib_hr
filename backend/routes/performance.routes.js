// backend/routes/performance.routes.js
const express = require('express');
const verifyJWT = require('../middleware/auth.middleware');
const auditLogger = require('../middleware/audit.middleware');
const { checkAccess } = require('../middleware/rbac.middleware');

const ctrl = require('../controllers/talent/performance.controller');

const router = express.Router();

router.use(verifyJWT);

// ==================== DASHBOARD ====================
router.get('/dashboard', checkAccess('performance', 'view'), ctrl.getDashboard);

// ==================== CYCLE MASTER ====================
router.post('/cycles', checkAccess('performance', 'manage'), auditLogger('Performance Master'), ctrl.createReviewCycle);
router.get('/cycles', checkAccess('performance', 'view'), ctrl.getReviewCycles);

// ==================== KPIs ====================
router.post('/kpis', checkAccess('performance', 'manage'), auditLogger('Performance KPI'), ctrl.createKpi);
router.get('/kpis', checkAccess('performance', 'view'), ctrl.getKpis);
router.patch('/kpis/:id/progress', checkAccess('performance', 'manage'), auditLogger('Performance KPI'), ctrl.updateKpiProgress);

// ==================== GOALS ====================
router.post('/goals', checkAccess('performance', 'manage'), auditLogger('Performance Goal'), ctrl.createGoal);
router.get('/goals', checkAccess('performance', 'view'), ctrl.getGoals);
router.patch('/goals/:id/progress', checkAccess('performance', 'create'), auditLogger('Performance Goal'), ctrl.updateGoalProgress);
router.post('/goals/:id/approve', checkAccess('performance', 'manage'), auditLogger('Performance Goal'), ctrl.approveGoal);

// ==================== APPRAISALS ====================
router.post('/appraisals', checkAccess('performance', 'manage'), auditLogger('Performance Appraisal'), ctrl.initiateAppraisal);
router.get('/appraisals', checkAccess('performance', 'view'), ctrl.getAppraisals);
router.get('/appraisals/:id', checkAccess('performance', 'view'), ctrl.getAppraisalDetails);
router.post('/appraisals/:id/self-assessment', checkAccess('performance', 'create'), auditLogger('Performance Appraisal'), ctrl.submitSelfAssessment);
router.post('/appraisals/:id/manager-review', checkAccess('performance', 'manage'), auditLogger('Performance Appraisal'), ctrl.submitManagerReview);
router.post('/appraisals/:id/hr-review', checkAccess('performance', 'manage'), auditLogger('Performance Appraisal'), ctrl.submitHrReview);
router.post('/appraisals/:id/acknowledge', checkAccess('performance', 'create'), auditLogger('Performance Appraisal'), ctrl.acknowledgeAppraisal);

// ==================== PROMOTIONS ====================
router.post('/promotions', checkAccess('performance', 'manage'), auditLogger('Promotion Recommendations'), ctrl.recommendPromotion);
router.post('/promotions/:id/approve', checkAccess('performance', 'manage'), auditLogger('Promotion Recommendations'), ctrl.approvePromotion);

// ==================== INCREMENTS ====================
router.post('/increments', checkAccess('performance', 'manage'), auditLogger('Salary Increments'), ctrl.recommendIncrement);
router.post('/increments/:id/approve', checkAccess('performance', 'manage'), auditLogger('Salary Increments'), ctrl.approveIncrement);

// ==================== REPORTS ====================
router.get('/reports', checkAccess('performance', 'view'), ctrl.getReport);
router.get('/reports/export', checkAccess('performance', 'manage'), ctrl.exportCsv);

module.exports = router;
