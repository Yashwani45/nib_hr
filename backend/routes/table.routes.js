// backend/routes/table.routes.js
const express = require('express');
const {
  getTableData,
  createTableRecord,
  updateTableRecord,
  deleteTableRecord
} = require('../controllers/core/table.controller');
const verifyJWT = require('../middleware/auth.middleware');
const auditLogger = require('../middleware/audit.middleware');

const router = express.Router();

// Require session JWT validation for all database table inspections
router.use(verifyJWT);

router.get('/:tableName', auditLogger('Database Table'), getTableData);
router.post('/:tableName', auditLogger('Database Table'), createTableRecord);
router.put('/:tableName/:id', auditLogger('Database Table'), updateTableRecord);
router.delete('/:tableName/:id', auditLogger('Database Table'), deleteTableRecord);

module.exports = router;
