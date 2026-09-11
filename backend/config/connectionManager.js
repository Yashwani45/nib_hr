// backend/config/connectionManager.js
const { Sequelize } = require('sequelize');
const { masterSequelize } = require('./database');
const logger = require('./logger');

// In-memory cache for tenant connection pools
const connectionPools = {};

/**
 * Retrieves or instantiates an active Sequelize connection pool for a Company Code.
 */
const getTenantConnection = async (tenantId) => {
  if (!tenantId) {
    return masterSequelize;
  }

  const cleanId = String(tenantId).trim();
  if (['DEFAULT', 'PUBLIC', 'MAIN'].includes(cleanId.toUpperCase())) {
    return masterSequelize;
  }

  const cacheKey = ['NIB', 'NIB01'].includes(cleanId.toUpperCase()) ? 'YashTech' : cleanId;

  // Return cached connection if active
  if (connectionPools[cacheKey]) {
    return connectionPools[cacheKey];
  }

  try {
    const sanitizedDbName = cacheKey.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    // 1. Check if tenant exists in master database
    const [rows] = await masterSequelize.query(
      `SELECT * FROM tenants WHERE id = ? OR db_name = ? OR company_name = ? LIMIT 1`,
      { replacements: [cacheKey, sanitizedDbName, cacheKey] }
    );

    const tenant = rows && rows.length > 0 ? rows[0] : null;
    const targetDbName = tenant ? tenant.db_name : sanitizedDbName;
    const targetUser = tenant ? (tenant.db_username || process.env.DB_USER || 'root') : (process.env.DB_USER || 'root');
    const targetPassword = tenant ? (tenant.db_password || process.env.DB_PASSWORD || '') : (process.env.DB_PASSWORD || '');
    const targetHost = tenant ? (tenant.db_host || process.env.DB_HOST || 'localhost') : (process.env.DB_HOST || 'localhost');
    const targetPort = tenant ? (tenant.db_port || parseInt(process.env.DB_PORT) || 3306) : (parseInt(process.env.DB_PORT) || 3306);

    // 2. Ensure target database exists in MySQL
    await masterSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${targetDbName}\``);

    // 3. Instantiate dedicated tenant Sequelize instance
    const tenantSequelize = new Sequelize(targetDbName, targetUser, targetPassword, {
      host: targetHost,
      port: targetPort,
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 10,
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

    // 4. Ensure departments table exists in target database
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
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const alterSqlList = [
      "ALTER TABLE employees MODIFY COLUMN emp_code VARCHAR(255) NULL",
      "ALTER TABLE employees MODIFY COLUMN first_name VARCHAR(255) NULL",
      "ALTER TABLE employees MODIFY COLUMN last_name VARCHAR(255) NULL",
      "ALTER TABLE employees MODIFY COLUMN gender VARCHAR(50) NULL",
      "ALTER TABLE employees MODIFY COLUMN date_of_birth DATE NULL",
      "ALTER TABLE employees MODIFY COLUMN date_of_joining DATE NULL",
      "ALTER TABLE employees MODIFY COLUMN company_email VARCHAR(255) NULL",
      "ALTER TABLE employees MODIFY COLUMN branch_id CHAR(36) NULL",
      "ALTER TABLE employees MODIFY COLUMN department_id CHAR(36) NULL",
      "ALTER TABLE employees MODIFY COLUMN designation_id CHAR(36) NULL",
      "ALTER TABLE employees MODIFY COLUMN shift_id CHAR(36) NULL",
      "ALTER TABLE employees ADD COLUMN employee_name VARCHAR(255) NULL",
      "ALTER TABLE employees ADD COLUMN email VARCHAR(255) NULL",
      "ALTER TABLE employees ADD COLUMN password VARCHAR(255) NULL",
      "ALTER TABLE employees ADD COLUMN department VARCHAR(255) NULL"
    ];
    for (const sql of alterSqlList) {
      await tenantSequelize.query(sql).catch(() => {});
    }

    await tenantSequelize.query(`
      DELETE FROM departments WHERE dept_code = 'ADMIN' OR dept_name = 'Administration' OR dept_code = 'DEPT-GEN' OR dept_name = 'General Administration';
    `).catch(() => {});

    connectionPools[cacheKey] = tenantSequelize;
    logger.info(`[Tenant Pool] Connected pool for tenant '${cacheKey}' to database: '${targetDbName}'`);
    return tenantSequelize;
  } catch (err) {
    logger.warn(`[Tenant Pool Warning] Failed to connect dedicated pool for '${cacheKey}': ${err.message}. Using master fallback.`);
    connectionPools[cacheKey] = masterSequelize;
    return masterSequelize;
  }
};

module.exports = {
  getTenantConnection
};
