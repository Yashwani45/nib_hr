// backend/controllers/table.controller.js
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const crypto = require('crypto');
const logger = require('../config/logger');

// Whitelist of valid database tables to protect against SQL injection
const ALLOWED_TABLES = new Set([
  'announcements_surveys',
  'asset_allocation',
  'ats_applicant_tracking',
  'branch',
  'branches',
  'business_unit',
  'business_units',
  'candidate_database',
  'company',
  'complaint_management',
  'cost_center',
  'cost_centers',
  'courses',
  'daily_attendance',
  'department',
  'departments',
  'designation',
  'designations',
  'document_log',
  'email_notifications',
  'employee',
  'employee_profile',
  'employees',
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
  'reporting_hierarchies',
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

const TABLE_ALIASES = {
  branch: 'branches',
  department: 'departments',
  designation: 'designations',
  business_unit: 'business_units',
  cost_center: 'cost_centers',
  reporting_hierarchy: 'reporting_hierarchies',
  employee: 'employees',
  employee_profile: 'employees'
};

const validateTable = (tableName) => {
  if (!tableName || typeof tableName !== 'string') return null;
  const clean = tableName.trim().toLowerCase();
  return ALLOWED_TABLES.has(clean) ? clean : null;
};

/**
 * Resolve physical table name in current tenant DB
 */
const resolveTable = async (tableName) => {
  const safe = validateTable(tableName);
  if (!safe) return null;

  // 1. Direct match check
  try {
    await sequelize.query(`SELECT 1 FROM \`${safe}\` LIMIT 1`, { type: QueryTypes.SELECT });
    return safe;
  } catch (err) {
    // 2. Check alias
    const alias = TABLE_ALIASES[safe];
    if (alias) {
      try {
        await sequelize.query(`SELECT 1 FROM \`${alias}\` LIMIT 1`, { type: QueryTypes.SELECT });
        return alias;
      } catch (aliasErr) {}
    }
    // 3. Fallback
    return safe;
  }
};

/**
 * Check which branch column exists in the target table (cached per connection)
 */
const getBranchColumn = async (tableName) => {
  try {
    const cols = await sequelize.query(`DESCRIBE \`${tableName}\``, { type: QueryTypes.SELECT });
    const colNames = cols.map(c => c.Field);
    if (colNames.includes('branch_id')) return 'branch_id';
    if (colNames.includes('branch')) return 'branch';
    if (colNames.includes('branchName')) return 'branchName';
    if (colNames.includes('branchCode')) return 'branchCode';
    return null;
  } catch (e) {
    return null;
  }
};

/**
 * GET /api/table/:tableName
 * Fetch all records from a specified table with tenant & branch awareness
 */
exports.getAll = async (req, res) => {
  const reqTable = validateTable(req.params.tableName);
  if (!reqTable) {
    return res.status(400).json({
      success: false,
      message: `Invalid or unauthorized table name: ${req.params.tableName}`
    });
  }

  const targetTable = await resolveTable(reqTable);
  const branchId = req.headers['x-branch-id'] || req.query.branchId;
  const branchName = req.headers['x-branch-name'] || req.query.branchName;
  const branchCode = req.headers['x-branch-code'] || req.query.branchCode;

  const isBranchScoped = branchId && branchId !== 'ALL' && !['branches', 'branch', 'company'].includes(targetTable);

  try {
    let queryStr = `SELECT * FROM \`${targetTable}\``;
    const replacements = {};

    if (isBranchScoped) {
      const branchCol = await getBranchColumn(targetTable);
      if (branchCol) {
        if (branchCol === 'branch_id') {
          queryStr += ` WHERE (${branchCol} = :branchId OR ${branchCol} IS NULL)`;
          replacements.branchId = branchId;
        } else {
          queryStr += ` WHERE (${branchCol} = :branchName OR ${branchCol} = :branchCode OR ${branchCol} LIKE :branchSearch OR ${branchCol} = 'Headquarters' OR ${branchCol} = 'Head Office' OR ${branchCol} IS NULL)`;
          replacements.branchName = branchName || branchId;
          replacements.branchCode = branchCode || branchId;
          replacements.branchSearch = `%${branchName || branchId}%`;
        }
      }
    }

    try {
      const rows = await sequelize.query(
        `${queryStr} ORDER BY id DESC`,
        { replacements, type: QueryTypes.SELECT }
      );
      return res.status(200).json({
        success: true,
        count: rows ? rows.length : 0,
        data: rows || []
      });
    } catch (orderErr) {
      // If table doesn't have 'id' column, query without ORDER BY id
      const rows = await sequelize.query(
        queryStr,
        { replacements, type: QueryTypes.SELECT }
      );
      return res.status(200).json({
        success: true,
        count: rows ? rows.length : 0,
        data: rows || []
      });
    }
  } catch (error) {
    logger.warn(`Table query warning for "${targetTable}": ${error.message}`);
    return res.status(200).json({
      success: true,
      count: 0,
      data: [],
      warning: `Table "${targetTable}" might not be initialized yet in MySQL.`
    });
  }
};

/**
 * GET /api/table/:tableName/:id
 * Fetch a single record by primary key ID
 */
exports.getById = async (req, res) => {
  const reqTable = validateTable(req.params.tableName);
  const { id } = req.params;

  if (!reqTable) {
    return res.status(400).json({
      success: false,
      message: `Invalid or unauthorized table name: ${req.params.tableName}`
    });
  }

  const targetTable = await resolveTable(reqTable);

  try {
    const rows = await sequelize.query(
      `SELECT * FROM \`${targetTable}\` WHERE id = :id LIMIT 1`,
      {
        replacements: { id },
        type: QueryTypes.SELECT
      }
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Record with id ${id} not found in ${targetTable}`
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    logger.error(`Error getting record from ${targetTable}:`, error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * POST /api/table/:tableName
 * Insert a new record into the specified table (with branch capacity & uniqueness enforcement)
 */
exports.create = async (req, res) => {
  const reqTable = validateTable(req.params.tableName);
  if (!reqTable) {
    return res.status(400).json({
      success: false,
      message: `Invalid or unauthorized table name: ${req.params.tableName}`
    });
  }

  const targetTable = await resolveTable(reqTable);
  const payload = req.body || {};

  // Check branch capacity limits and duplicate codes when inserting into branches
  if (targetTable === 'branches') {
    // 1. Authoritative check: Max 50 branches per company
    let countRows = [];
    try {
      countRows = await sequelize.query(`SELECT COUNT(*) AS total FROM \`branches\` WHERE deleted_at IS NULL`, { type: QueryTypes.SELECT });
    } catch (e) {
      countRows = await sequelize.query(`SELECT COUNT(*) AS total FROM \`branches\``, { type: QueryTypes.SELECT });
    }

    const currentBranchCount = countRows && countRows[0] ? Number(countRows[0].total) : 0;
    if (currentBranchCount >= 50) {
      return res.status(400).json({
        success: false,
        message: 'Maximum capacity limit of 50 branches reached for this company.'
      });
    }

    // 2. Authoritative check: Unique branch code in this company
    const newCode = String(payload.branchCode || payload.branch_code || '').trim().toUpperCase();
    if (newCode) {
      let existing = [];
      try {
        existing = await sequelize.query(
          `SELECT id FROM \`branches\` WHERE (branch_code = :code OR branchCode = :code) AND deleted_at IS NULL LIMIT 1`,
          { replacements: { code: newCode }, type: QueryTypes.SELECT }
        );
      } catch (e) {
        existing = await sequelize.query(
          `SELECT id FROM \`branches\` WHERE branch_code = :code LIMIT 1`,
          { replacements: { code: newCode }, type: QueryTypes.SELECT }
        );
      }

      if (existing && existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Branch code '${newCode}' already exists in this company.`
        });
      }
    }
  }

  // Ensure UUID id is present for tables with UUID PKs
  if (!payload.id && ['branches', 'departments', 'designations', 'employees', 'roles', 'users'].includes(targetTable)) {
    payload.id = crypto.randomUUID();
  }

  // Double map camelCase / snake_case for branches
  if (targetTable === 'branches') {
    const bCode = payload.branchCode || payload.branch_code || '';
    const bName = payload.branchName || payload.branch_name || '';
    const bType = payload.branchType || payload.branch_type || 'Branch';
    payload.branch_code = bCode;
    payload.branchCode = bCode;
    payload.branch_name = bName;
    payload.branchName = bName;
    payload.branch_type = bType;
    payload.branchType = bType;
    if (!payload.status) payload.status = 'Active';
  }

  // Sanitize column names: only alphanumeric and underscore
  const safeKeys = Object.keys(payload).filter(
    (key) => /^[a-zA-Z0-9_]+$/.test(key)
  );

  if (safeKeys.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No valid data fields provided for insertion.'
    });
  }

  // Only insert columns that physically exist in the target table
  let physicalColumns = null;
  try {
    const descRows = await sequelize.query(`DESCRIBE \`${targetTable}\``, { type: QueryTypes.SELECT });
    physicalColumns = new Set(descRows.map(c => c.Field));
  } catch (descErr) {}

  const validKeys = physicalColumns 
    ? safeKeys.filter(k => physicalColumns.has(k)) 
    : safeKeys;

  if (validKeys.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No matching columns found in database table for provided data.'
    });
  }

  const columns = validKeys.map((key) => `\`${key}\``).join(', ');
  const placeholders = validKeys.map((key) => `:${key}`).join(', ');

  const cleanPayload = {};
  validKeys.forEach((key) => {
    cleanPayload[key] = payload[key] !== undefined ? payload[key] : null;
  });

  try {
    const [insertResult] = await sequelize.query(
      `INSERT INTO \`${targetTable}\` (${columns}) VALUES (${placeholders})`,
      {
        replacements: cleanPayload,
        type: QueryTypes.INSERT
      }
    );

    const newId = cleanPayload.id || (typeof insertResult === 'number' ? insertResult : insertResult?.insertId || insertResult);

    let createdRecord = null;
    if (newId) {
      try {
        const rows = await sequelize.query(
          `SELECT * FROM \`${targetTable}\` WHERE id = :id LIMIT 1`,
          {
            replacements: { id: newId },
            type: QueryTypes.SELECT
          }
        );
        createdRecord = rows?.[0];
      } catch (fetchErr) {}
    }

    if (targetTable === 'employees') {
      try {
        const employeeQrService = require('../services/operations/employeeQr.service');
        const empId = createdRecord?.id || newId;
        const compCode = createdRecord?.companyCode || createdRecord?.company || req.companyCode || 'YASHTECH';
        await employeeQrService.generateEmployeeQr(empId, compCode, req.user);
      } catch (qrErr) {
        logger.warn(`Auto-generating QR code failed for new employee in ${targetTable}: ${qrErr.message}`);
      }
    }

    return res.status(201).json({
      success: true,
      message: `Record successfully inserted into ${targetTable}`,
      data: createdRecord || { id: newId, ...cleanPayload }
    });
  } catch (error) {
    logger.error(`Error inserting into ${targetTable}:`, error);
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
  const reqTable = validateTable(req.params.tableName);
  const { id } = req.params;

  if (!reqTable) {
    return res.status(400).json({
      success: false,
      message: `Invalid or unauthorized table name: ${req.params.tableName}`
    });
  }

  const targetTable = await resolveTable(reqTable);
  const payload = req.body || {};

  // Check unique branch code when updating
  if (targetTable === 'branches') {
    const newCode = String(payload.branchCode || payload.branch_code || '').trim().toUpperCase();
    if (newCode) {
      let existing = [];
      try {
        existing = await sequelize.query(
          `SELECT id FROM \`branches\` WHERE (branch_code = :code OR branchCode = :code) AND id != :id AND deleted_at IS NULL LIMIT 1`,
          { replacements: { code: newCode, id }, type: QueryTypes.SELECT }
        );
      } catch (e) {
        existing = await sequelize.query(
          `SELECT id FROM \`branches\` WHERE branch_code = :code AND id != :id LIMIT 1`,
          { replacements: { code: newCode, id }, type: QueryTypes.SELECT }
        );
      }

      if (existing && existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Branch code '${newCode}' is already used by another branch in this company.`
        });
      }
    }
  }

  // Sanitize column names: only alphanumeric and underscore (exclude 'id')
  const safeKeys = Object.keys(payload).filter(
    (key) => /^[a-zA-Z0-9_]+$/.test(key) && key !== 'id'
  );

  if (safeKeys.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No valid fields provided for update.'
    });
  }

  let physicalColumns = null;
  try {
    const descRows = await sequelize.query(`DESCRIBE \`${targetTable}\``, { type: QueryTypes.SELECT });
    physicalColumns = new Set(descRows.map(c => c.Field));
  } catch (descErr) {}

  const validKeys = physicalColumns 
    ? safeKeys.filter(k => physicalColumns.has(k)) 
    : safeKeys;

  const setClause = validKeys.map((key) => `\`${key}\` = :${key}`).join(', ');
  const cleanPayload = { id };
  validKeys.forEach((key) => {
    cleanPayload[key] = payload[key] !== undefined ? payload[key] : null;
  });

  try {
    await sequelize.query(
      `UPDATE \`${targetTable}\` SET ${setClause} WHERE id = :id`,
      {
        replacements: cleanPayload,
        type: QueryTypes.UPDATE
      }
    );

    const rows = await sequelize.query(
      `SELECT * FROM \`${targetTable}\` WHERE id = :id LIMIT 1`,
      {
        replacements: { id },
        type: QueryTypes.SELECT
      }
    );

    return res.status(200).json({
      success: true,
      message: `Record updated successfully in ${targetTable}`,
      data: rows?.[0] || { id, ...cleanPayload }
    });
  } catch (error) {
    logger.error(`Error updating record in ${targetTable}:`, error);
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
  const reqTable = validateTable(req.params.tableName);
  const { id } = req.params;

  if (!reqTable) {
    return res.status(400).json({
      success: false,
      message: `Invalid or unauthorized table name: ${req.params.tableName}`
    });
  }

  const targetTable = await resolveTable(reqTable);

  try {
    await sequelize.query(
      `DELETE FROM \`${targetTable}\` WHERE id = :id`,
      {
        replacements: { id },
        type: QueryTypes.DELETE
      }
    );

    return res.status(200).json({
      success: true,
      message: `Record with id ${id} deleted successfully from ${targetTable}`
    });
  } catch (error) {
    logger.error(`Error deleting record from ${targetTable}:`, error);
    return res.status(500).json({
      success: false,
      message: `Failed to delete record: ${error.message}`
    });
  }
};
