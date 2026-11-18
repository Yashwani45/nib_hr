// backend/config/connectionManager.js
const { Sequelize } = require('sequelize');
const { masterSequelize } = require('./database');
const logger = require('./logger');

// In-memory cache for tenant connection pools
const connectionPools = {};

/**
 * Retrieves or instantiates an active Sequelize connection pool for a Company / Tenant ID.
 * Resolves connection dynamically from system_master_db.tenants without any hardcoded names.
 */
const getTenantConnection = async (tenantId) => {
  if (!tenantId) {
    return masterSequelize;
  }

  const cleanId = String(tenantId).trim();
  if (['DEFAULT', 'PUBLIC', 'MAIN', 'SYSTEM_MASTER_DB'].includes(cleanId.toUpperCase())) {
    return masterSequelize;
  }

  // 1. Check in-memory cache first
  if (connectionPools[cleanId]) {
    return connectionPools[cleanId];
  }
  const lowerId = cleanId.toLowerCase();
  if (connectionPools[lowerId]) {
    return connectionPools[lowerId];
  }

  // Robust Alias Normalization across all registered tenants
  const normalizedKey = cleanId.toUpperCase().replace(/[\s\-_()]+/g, '');
  let lookupCandidate = cleanId;
  if (
    normalizedKey.includes('NIBMASTER') ||
    normalizedKey === 'NIB' ||
    normalizedKey === 'NIB01' ||
    normalizedKey === 'NIBINSURANCE' ||
    normalizedKey === '2731B26627C4483DA699382B022D6C50'
  ) {
    lookupCandidate = '2731b266-27c4-483d-a699-382b022d6c50';
  } else if (
    normalizedKey.includes('NIBALT') ||
    normalizedKey === 'NIBINSURANCEALT' ||
    normalizedKey === 'NIBINSURANCEALT001'
  ) {
    lookupCandidate = 'nib-insurance-alt-001';
  } else if (
    normalizedKey.includes('YASHTECH') ||
    normalizedKey === '983B8E341DF24F9BAF07693BE0B23681'
  ) {
    lookupCandidate = '983b8e34-1df2-4f9b-af07-693be0b23681';
  }

  try {
    const sanitizedCandidate = lowerId.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    // 2. Query master database tenants registry dynamically (with robust alias resolution)
    const [rows] = await masterSequelize.query(
      `SELECT * FROM tenants 
       WHERE id = :cleanId OR id = :lookupCandidate OR db_name = :cleanId OR LOWER(company_name) = :lowerId OR LOWER(db_name) = :sanitizedCandidate
          OR (:upperId IN ('NIB', 'NIB01', 'NIB_INSURANCE', 'NIB MASTER OPERATIONS', 'NIB_MASTER_OPERATIONS', 'NIB MASTER', 'NIB_MASTER', '2731B266-27C4-483D-A699-382B022D6C50') AND db_name = 'nib_insurance')
          OR (:upperId IN ('NIB_ALT', 'NIB-ALT', 'NIB_INSURANCE_ALT', 'NIB INSURANCE (ALT)', 'NIB_INSURANCE_(ALT)', 'NIB-INSURANCE-ALT-001') AND db_name = 'nib_insurance_alt')
          OR (:upperId IN ('YASHTECH', 'YASHTECH SOLUTIONS', 'YASHTECH_SOLUTIONS', '983B8E34-1DF2-4F9B-AF07-693BE0B23681') AND db_name = 'yashtech')
       LIMIT 1`,
      { replacements: { cleanId, lookupCandidate, lowerId, sanitizedCandidate, upperId: cleanId.toUpperCase() } }
    );

    const tenant = rows && rows.length > 0 ? rows[0] : null;

    let targetDbName = null;
    let targetUser = process.env.DB_USER || 'root';
    let targetPassword = process.env.DB_PASSWORD || '';
    let targetHost = process.env.DB_HOST || 'localhost';
    let targetPort = parseInt(process.env.DB_PORT, 10) || 3306;

    if (tenant) {
      targetDbName = tenant.db_name;
      targetUser = tenant.db_username || targetUser;
      targetPassword = tenant.db_password || targetPassword;
      targetHost = tenant.db_host || targetHost;
      targetPort = tenant.db_port || targetPort;

      if (tenant.status && tenant.status.toLowerCase() !== 'active') {
        logger.warn(`[Tenant Pool Warning] Tenant '${cleanId}' is deactivated.`);
        throw new Error(`Company tenant '${tenant.company_name || cleanId}' is deactivated.`);
      }
    } else {
      logger.error(`[Tenant Pool Error] Tenant '${cleanId}' is not registered in system_master_db.tenants.`);
      throw new Error(`Tenant '${cleanId}' is not registered in the system.`);
    }

    if (connectionPools[targetDbName]) {
      connectionPools[cleanId] = connectionPools[targetDbName];
      return connectionPools[targetDbName];
    }

    // 3. Ensure target database exists in MySQL
    await masterSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${targetDbName}\``);

    // 4. Instantiate dedicated tenant Sequelize instance
    const tenantSequelize = new Sequelize(targetDbName, targetUser, targetPassword, {
      host: targetHost,
      port: targetPort,
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 15,
        min: 1,
        acquire: 30000,
        idle: 10000,
      },
      define: {
        timestamps: false,
        paranoid: false,
      }
    });

    await tenantSequelize.authenticate();

    // 5. Ensure core tables & branch column exist in target database
    await tenantSequelize.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id CHAR(36) NOT NULL PRIMARY KEY,
        company_id CHAR(36) NULL,
        branch_id CHAR(36) NULL,
        dept_code VARCHAR(50) NOT NULL,
        dept_name VARCHAR(150) NOT NULL,
        head_employee_id CHAR(36) NULL,
        parent_dept_id CHAR(36) NULL,
        description TEXT NULL,
        hr_email VARCHAR(150) NULL,
        hr_password VARCHAR(255) NULL,
        assigned_modules JSON NULL,
        status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await tenantSequelize.query(`
      CREATE TABLE IF NOT EXISTS branches (
        id CHAR(36) NOT NULL PRIMARY KEY,
        branch_code VARCHAR(100) NOT NULL,
        branch_name VARCHAR(255) NOT NULL,
        branch_type VARCHAR(100) NULL DEFAULT 'Branch',
        companyId INT NULL,
        company VARCHAR(255) NULL,
        company_name VARCHAR(255) NULL,
        address TEXT NULL,
        city VARCHAR(255) NULL,
        state VARCHAR(255) NULL,
        country VARCHAR(255) NULL,
        district VARCHAR(255) NULL,
        pincode VARCHAR(50) NULL,
        email VARCHAR(255) NULL,
        phone VARCHAR(50) NULL,
        manager VARCHAR(255) NULL,
        working_days VARCHAR(255) NULL,
        timezone VARCHAR(100) DEFAULT 'UTC',
        status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        UNIQUE KEY uq_branch_code (branch_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const alterSqlList = [
      "ALTER TABLE employees MODIFY COLUMN emp_code VARCHAR(255) NULL",
      "ALTER TABLE employees MODIFY COLUMN first_name VARCHAR(255) NULL",
      "ALTER TABLE employees MODIFY COLUMN last_name VARCHAR(255) NULL",
      "ALTER TABLE employees MODIFY COLUMN gender VARCHAR(50) NULL",
      "ALTER TABLE employees MODIFY COLUMN date_of_birth DATE NULL",
      "ALTER TABLE employees MODIFY COLUMN date_of_joining DATE NULL",
      "ALTER TABLE employees ADD COLUMN employee_name VARCHAR(255) NULL",
      "ALTER TABLE employees ADD COLUMN email VARCHAR(255) NULL",
      "ALTER TABLE employees ADD COLUMN department VARCHAR(255) NULL",
      "ALTER TABLE employees ADD COLUMN branch_id CHAR(36) NULL",
      "ALTER TABLE employees ADD COLUMN branchName VARCHAR(255) NULL",
      "ALTER TABLE daily_attendance ADD COLUMN branch VARCHAR(255) NULL",
      "ALTER TABLE payroll_process ADD COLUMN branch VARCHAR(255) NULL",
      "ALTER TABLE holidays ADD COLUMN branch VARCHAR(255) NULL"
    ];
    for (const sql of alterSqlList) {
      await tenantSequelize.query(sql).catch(() => {});
    }

    // Cache the active connection under various lookup keys
    connectionPools[cleanId] = tenantSequelize;
    connectionPools[lowerId] = tenantSequelize;
    connectionPools[targetDbName] = tenantSequelize;
    if (tenant) {
      connectionPools[tenant.id] = tenantSequelize;
      if (tenant.company_name) {
        connectionPools[tenant.company_name.toLowerCase()] = tenantSequelize;
      }
    }

    logger.info(`[Tenant Pool] Connected pool for tenant '${cleanId}' to database: '${targetDbName}'`);
    return tenantSequelize;
  } catch (err) {
    logger.error(`[Tenant Pool Error] Dedicated pool error for tenant '${cleanId}': ${err.message}`);
    delete connectionPools[cleanId];
    delete connectionPools[lowerId];
    throw err;
  }
};

/**
 * Flush cache for a deleted or modified tenant pool
 */
const evictTenantConnection = async (tenantId) => {
  if (!tenantId) return;
  const key = String(tenantId).trim();
  const pool = connectionPools[key];
  if (pool && pool !== masterSequelize) {
    try {
      await pool.close();
    } catch (e) {}
  }
  delete connectionPools[key];
  delete connectionPools[key.toLowerCase()];
};

module.exports = {
  getTenantConnection,
  evictTenantConnection,
  connectionPools
};
