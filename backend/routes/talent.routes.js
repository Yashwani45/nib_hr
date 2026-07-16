// backend/routes/talent.routes.js
const express = require('express');
const {
  createJob,
  getJobById,
  updateJob,
  deleteJob,
  getAllJobs,
} = require('../controllers/talent/recruitment.controller');
const verifyJWT = require('../middleware/auth.middleware');
const { authorizeRole } = require('../middleware/role.middleware');

const router = express.Router();

router.use(verifyJWT);

router.get('/jobs', getAllJobs);
router.get('/jobs/:id', getJobById);

router.post('/jobs', authorizeRole(['Admin', 'Manager']), createJob);
router.put('/jobs/:id', authorizeRole(['Admin', 'Manager']), updateJob);
router.delete('/jobs/:id', authorizeRole(['Admin']), deleteJob);

module.exports = router;
