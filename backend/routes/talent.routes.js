// backend/routes/talent.routes.js
const express = require('express');
const {
  createJob,
  getJobById,
  updateJob,
  deleteJob,
  getAllJobs,
} = require('../controllers/talent/recruitment.controller');
const { getPerformanceMasters, createPerformanceMaster, updatePerformanceMaster, togglePerformanceMasterStatus, deletePerformanceMaster } = require('../controllers/talent/performanceMaster.controller');
const verifyJWT = require('../middleware/auth.middleware');
const auditLogger = require('../middleware/audit.middleware');
const { authorizeRole } = require('../middleware/role.middleware');

const router = express.Router();

router.use(verifyJWT);

router.get('/jobs', getAllJobs);
router.get('/jobs/:id', getJobById);

router.post('/jobs', authorizeRole(['Admin', 'Manager']), createJob);
router.put('/jobs/:id', authorizeRole(['Admin', 'Manager']), updateJob);
router.delete('/jobs/:id', authorizeRole(['Admin']), deleteJob);

// Performance Master
router.get('/performance-masters', auditLogger('PerformanceMaster'), getPerformanceMasters);
router.post('/performance-masters', auditLogger('PerformanceMaster'), authorizeRole(['Admin', 'SuperAdmin', 'Manager']), createPerformanceMaster);
router.put('/performance-masters/:id', auditLogger('PerformanceMaster'), authorizeRole(['Admin', 'SuperAdmin', 'Manager']), updatePerformanceMaster);
router.patch('/performance-masters/:id/status', auditLogger('PerformanceMaster'), authorizeRole(['Admin', 'SuperAdmin', 'Manager']), togglePerformanceMasterStatus);
router.delete('/performance-masters/:id', auditLogger('PerformanceMaster'), authorizeRole(['Admin', 'SuperAdmin']), deletePerformanceMaster);

module.exports = router;
