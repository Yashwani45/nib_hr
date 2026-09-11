// backend/controllers/table.controller.js
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const logger = require('../config/logger');

// Whitelist of valid database tables to protect against SQL injection
const ALLOWED_TABLES = new Set([
  'announcements_surveys',
  'asset_allocation',
  'ats_applicant_tracking',
  'branch',
  'business_unit',
  'candidate_database',
  'company',
  'complaint_management',
  'cost_center',
  'courses',
  'daily_attendance',
  'department',
  'designation',
  'document_log',
  'email_notifications',
  'employee_profile',
  'exit_logs',
  'expense_claims',
  'hr_tickets',
  'incentives_claims',
  'inventory',
  'job_requisition',
  'kpi_okr',
  'leave_requests',
  'leave_types',
  'lms_progress',
  'login_history',
  'logs',
  'performance_reviews',
  'pf_registry',
  'push_notifications',
  'query_resolution',
  'rbac_roles',
  'reporting_hierarchy',
  'salary_structure',
  'service_requests',
  'shift_master',
  'sms_notifications',
  'tax_declarations',
  'ticket_tracking',
  'approvals_pending',
  'audit_logs',
  'users',
  'payrolls',
  'permissions',
  'notifications'
]);

const validateTable = (tableName) => {
  if (!tableName || typeof tableName !== 'string') return null;
  const clean = tableName.trim().toLowerCase();
  return ALLOWED_TABLES.has(clean) ? clean : null;
};

/**
 * GET /api/table/:tableName
 * Fetch all records from a specified table
 */
exports.getAll = async (req, res) => {
  const safeTable = validateTable(req.params.tableName);
  if (!safeTable) {
    return res.status(400).json({
      success: false,
      message: `Invalid or unauthorized table name: ${req.params.tableName}`
    });
  }

  try {
    const rows = await sequelize.query(
      `SELECT * FROM \`${safeTable}\` ORDER BY id DESC`,
      { type: QueryTypes.SELECT }
    );
    return res.status(200).json({
      success: true,
      count: rows ? rows.length : 0,
      data: rows || []
    });
  } catch (error) {
    // If table doesn't exist yet or has different columns, fallback gracefully
    logger.warn(`Table query warning for "${safeTable}": ${error.message}`);
    
    // Try without ORDER BY id in case table has no 'id' column
    try {
      const fallbackRows = await sequelize.query(
        `SELECT * FROM \`${safeTable}\``,
        { type: QueryTypes.SELECT }
      );
      return res.status(200).json({
        success: true,
        count: fallbackRows ? fallbackRows.length : 0,
        data: fallbackRows || []
      });
    } catch (fallbackError) {
      logger.error(`Error querying table ${safeTable}:`, fallbackError);
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        warning: `Table "${safeTable}" might not be initialized yet in MySQL.`
      });
    }
  }
};

/**
 * GET /api/table/:tableName/:id
 * Fetch a single record by primary key ID
 */
exports.getById = async (req, res) => {
  const safeTable = validateTable(req.params.tableName);
  const { id } = req.params;

  if (!safeTable) {
    return res.status(400).json({
      success: false,
      message: `Invalid or unauthorized table name: ${req.params.tableName}`
    });
  }

  try {
    const rows = await sequelize.query(
      `SELECT * FROM \`${safeTable}\` WHERE id = :id LIMIT 1`,
      {
        replacements: { id },
        type: QueryTypes.SELECT
      }
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Record with id ${id} not found in ${safeTable}`
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    logger.error(`Error getting record from ${safeTable}:`, error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * POST /api/table/:tableName
 * Insert a new record into the specified table
 */
exports.create = async (req, res) => {
  const safeTable = validateTable(req.params.tableName);
  if (!safeTable) {
    return res.status(400).json({
      success: false,
      message: `Invalid or unauthorized table name: ${req.params.tableName}`
    });
  }

  const payload = req.body || {};
  // Sanitize column names: only alphanumeric and underscore
  const safeKeys = Object.keys(payload).filter(
    (key) => /^[a-zA-Z0-9_]+$/.test(key) && key !== 'id'
  );

  if (safeKeys.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No valid data fields provided for insertion.'
    });
  }

  const columns = safeKeys.map((key) => `\`${key}\``).join(', ');
  const placeholders = safeKeys.map((key) => `:${key}`).join(', ');

  const cleanPayload = {};
  safeKeys.forEach((key) => {
    cleanPayload[key] = payload[key] !== undefined ? payload[key] : null;
  });

  try {
    const [insertResult] = await sequelize.query(
      `INSERT INTO \`${safeTable}\` (${columns}) VALUES (${placeholders})`,
      {
        replacements: cleanPayload,
        type: QueryTypes.INSERT
      }
    );

    const newId = typeof insertResult === 'number' ? insertResult : insertResult?.insertId || insertResult;

    let createdRecord = null;
    if (newId) {
      const rows = await sequelize.query(
        `SELECT * FROM \`${safeTable}\` WHERE id = :id LIMIT 1`,
        {
          replacements: { id: newId },
          type: QueryTypes.SELECT
        }
      );
      createdRecord = rows?.[0];
    }

    return res.status(201).json({
      success: true,
      message: `Record successfully inserted into ${safeTable}`,
      data: createdRecord || { id: newId, ...cleanPayload }
    });
  } catch (error) {
    logger.error(`Error inserting into ${safeTable}:`, error);
    return res.status(500).json({
      success: false,
      message: `Failed to insert record: ${error.message}`
    });
  }
};

/**
 * PUT /api/table/:tableName/:id
 * Update an existing record in the specified table
 */
exports.update = async (req, res) => {
  const safeTable = validateTable(req.params.tableName);
  const { id } = req.params;

  if (!safeTable) {
    return res.status(400).json({
      success: false,
      message: `Invalid or unauthorized table name: ${req.params.tableName}`
    });
  }

  const payload = req.body || {};
  // Sanitize column names: only alphanumeric and underscore (do not update 'id')
  const safeKeys = Object.keys(payload).filter(
    (key) => /^[a-zA-Z0-9_]+$/.test(key) && key !== 'id'
  );

  if (safeKeys.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No valid fields provided for update.'
    });
  }

  const setClause = safeKeys.map((key) => `\`${key}\` = :${key}`).join(', ');
  const cleanPayload = { id };
  safeKeys.forEach((key) => {
    cleanPayload[key] = payload[key] !== undefined ? payload[key] : null;
  });

  try {
    await sequelize.query(
      `UPDATE \`${safeTable}\` SET ${setClause} WHERE id = :id`,
      {
        replacements: cleanPayload,
        type: QueryTypes.UPDATE
      }
    );

    const rows = await sequelize.query(
      `SELECT * FROM \`${safeTable}\` WHERE id = :id LIMIT 1`,
      {
        replacements: { id },
        type: QueryTypes.SELECT
      }
    );

    return res.status(200).json({
      success: true,
      message: `Record updated successfully in ${safeTable}`,
      data: rows?.[0] || { id, ...cleanPayload }
    });
  } catch (error) {
    logger.error(`Error updating record in ${safeTable}:`, error);
    return res.status(500).json({
      success: false,
      message: `Failed to update record: ${error.message}`
    });
  }
};

/**
 * DELETE /api/table/:tableName/:id
 * Delete a record by ID from the specified table
 */
exports.remove = async (req, res) => {
  const safeTable = validateTable(req.params.tableName);
  const { id } = req.params;

  if (!safeTable) {
    return res.status(400).json({
      success: false,
      message: `Invalid or unauthorized table name: ${req.params.tableName}`
    });
  }

  try {
    await sequelize.query(
      `DELETE FROM \`${safeTable}\` WHERE id = :id`,
      {
        replacements: { id },
        type: QueryTypes.DELETE
      }
    );

    return res.status(200).json({
      success: true,
      message: `Record with id ${id} deleted successfully from ${safeTable}`
    });
  } catch (error) {
    logger.error(`Error deleting record from ${safeTable}:`, error);
    return res.status(500).json({
      success: false,
      message: `Failed to delete record: ${error.message}`
    });
  }
};
