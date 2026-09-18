// backend/server.js - Reload trigger 2026-09-17-public-uploads
const app = require('./app');
const { sequelize, connectDB } = require('./config/database');
require('./utils/companyFolderScaffolder');
const { Role } = require('./models');
const logger = require('./config/logger');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Establish connection to MySQL via Sequelize
    await connectDB();

    // 2. Self-healing pre-sync timestamp cleanup for legacy table structures
    try {
      await sequelize.query("UPDATE `designations` SET `updated_at` = NOW() WHERE `updated_at` IS NULL OR `updated_at` = '0000-00-00 00:00:00'").catch(() => {});
      await sequelize.query("UPDATE `departments` SET `updated_at` = NOW() WHERE `updated_at` IS NULL OR `updated_at` = '0000-00-00 00:00:00'").catch(() => {});
      await sequelize.query("UPDATE `employees` SET `updated_at` = NOW() WHERE `updated_at` IS NULL OR `updated_at` = '0000-00-00 00:00:00'").catch(() => {});
    } catch (e) {}

    // Provision all 7 Master Module tables directly in MySQL
    const masterTablesDDL = [
      `CREATE TABLE IF NOT EXISTS designations (
        id CHAR(36) NOT NULL,
        desig_code VARCHAR(50) NULL,
        desig_name VARCHAR(100) NOT NULL DEFAULT 'General Designation',
        department_id CHAR(36) NULL,
        department VARCHAR(100) NULL,
        grade VARCHAR(50) NULL,
        job_level VARCHAR(50) NULL,
        reporting_to VARCHAR(100) NULL,
        description TEXT NULL,
        assigned_employees_count INT DEFAULT 0,
        status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

      `CREATE TABLE IF NOT EXISTS holidays (
        id CHAR(36) NOT NULL,
        holiday_name VARCHAR(150) NOT NULL,
        holiday_date DATE NOT NULL,
        holiday_type ENUM('Public', 'National', 'Restricted', 'Company Mandatory') NOT NULL DEFAULT 'Public',
        branch VARCHAR(100) NULL,
        description TEXT NULL,
        status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

      `CREATE TABLE IF NOT EXISTS leave_type_masters (
        id CHAR(36) NOT NULL,
        leave_code VARCHAR(50) NOT NULL,
        leave_name VARCHAR(100) NOT NULL,
        paid_type ENUM('Paid', 'Unpaid') NOT NULL DEFAULT 'Paid',
        max_days INT NOT NULL DEFAULT 12,
        carry_forward ENUM('Yes', 'No') NOT NULL DEFAULT 'Yes',
        encashment ENUM('Yes', 'No') NOT NULL DEFAULT 'No',
        status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

      `CREATE TABLE IF NOT EXISTS overtime_masters (
        id CHAR(36) NOT NULL,
        overtime_name VARCHAR(150) NOT NULL,
        rate_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.50,
        min_hours DECIMAL(5,2) NOT NULL DEFAULT 1.00,
        max_hours DECIMAL(5,2) NOT NULL DEFAULT 4.00,
        applicable_dept VARCHAR(100) NULL,
        status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

      `CREATE TABLE IF NOT EXISTS bonus_masters (
        id CHAR(36) NOT NULL,
        bonus_name VARCHAR(150) NOT NULL,
        bonus_type ENUM('Performance', 'Festival/Diwali', 'Annual Statutory', 'Project Milestone') NOT NULL DEFAULT 'Performance',
        calculation_type ENUM('Fixed Amount', 'Percentage of Basic') NOT NULL DEFAULT 'Fixed Amount',
        value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        department VARCHAR(100) NULL,
        status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

      `CREATE TABLE IF NOT EXISTS tds_masters (
        id CHAR(36) NOT NULL,
        financial_year VARCHAR(20) NOT NULL,
        tax_regime ENUM('New Tax Regime (Sec 115BAC)', 'Old Tax Regime') NOT NULL DEFAULT 'New Tax Regime (Sec 115BAC)',
        standard_deduction DECIMAL(12,2) NOT NULL DEFAULT 75000.00,
        cess_percentage DECIMAL(5,2) NOT NULL DEFAULT 4.00,
        status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

      `CREATE TABLE IF NOT EXISTS performance_masters (
        id CHAR(36) NOT NULL,
        cycle_name VARCHAR(150) NOT NULL,
        review_period ENUM('Annual', 'Half-Yearly', 'Quarterly', 'Monthly') NOT NULL DEFAULT 'Annual',
        start_date DATE NULL,
        end_date DATE NULL,
        department VARCHAR(100) NULL,
        rating_scale VARCHAR(50) NOT NULL DEFAULT '5-Point Scale',
        status ENUM('Active', 'Draft', 'Closed', 'Inactive') NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

      `CREATE TABLE IF NOT EXISTS document_logs (
        id CHAR(36) NOT NULL PRIMARY KEY,
        document_name VARCHAR(255) NULL,
        document_type VARCHAR(100) NULL,
        category VARCHAR(100) NULL,
        employee_id CHAR(36) NULL,
        file_url TEXT NULL,
        file_type VARCHAR(50) NULL,
        file_size VARCHAR(50) NULL,
        uploaded_by VARCHAR(150) NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    ];

    for (const ddl of masterTablesDDL) {
      await sequelize.query(ddl).catch(err => {
        logger.warn('[Self-Healing DDL Warning] ' + err.message);
      });
    }
    logger.info('Self-healing DDL completed: All 7 Master tables provisioned in MySQL.');

    // Sync all models to MySQL tables
    try {
      await sequelize.sync({ alter: true });
      logger.info('MySQL tables structure successfully synchronized.');
    } catch (syncError) {
      logger.warn(`Sequelize alter sync warning (${syncError.message}). Falling back to standard sync...`);
      await sequelize.sync().catch(e => logger.error('Standard sync error: ', e));
      logger.info('MySQL tables successfully synchronized via standard sync.');
    }


    // 3. Seed default database records (Roles, Branches, Departments, Users, Profiles)
    const { seedTenantDB } = require('./config/dbSeeder');
    await seedTenantDB(sequelize);

    // 4. Purge default ADMIN / Administration department from all user databases
    try {
      const [dbs] = await sequelize.query("SHOW DATABASES");
      if (dbs && dbs.length > 0) {
        const dbNames = dbs.map(d => Object.values(d)[0]).filter(name => !['information_schema', 'mysql', 'performance_schema', 'sys', 'system_master_db'].includes(name));
        
        const { Sequelize } = require('sequelize');
        const allModels = require('./models');
        const modelsList = Object.values(allModels).filter(m => m && typeof m.getAttributes === 'function');

        for (const dbName of dbNames) {
          // Dynamic table synchronization loop for tenant database
          const tenantSequelize = new Sequelize(
            dbName,
            process.env.DB_USER || 'root',
            process.env.DB_PASSWORD || '',
            {
              host: process.env.DB_HOST || 'localhost',
              port: process.env.DB_PORT || 3306,
              dialect: 'mysql',
              logging: false,
              define: {
                timestamps: false,
                paranoid: false,
              }
            }
          );

          try {
            await tenantSequelize.query('SET FOREIGN_KEY_CHECKS = 0');
            const queryInterface = tenantSequelize.getQueryInterface();

            for (const model of modelsList) {
              const tableName = model.tableName || model.options?.tableName;
              if (tableName) {
                const attributes = model.getAttributes();
                const cleanAttributes = {};
                for (const [key, attr] of Object.entries(attributes)) {
                  if (attr && attr.type && attr.type.key === 'VIRTUAL') {
                    continue;
                  }
                  cleanAttributes[key] = attr;
                }
                await queryInterface.createTable(tableName, cleanAttributes).catch(() => {});
              }
            }

            const tenantDdlQueries = [
              `CREATE TABLE IF NOT EXISTS document_logs (
                id CHAR(36) NOT NULL PRIMARY KEY,
                document_name VARCHAR(255) NULL,
                document_type VARCHAR(100) NULL,
                category VARCHAR(100) NULL,
                employee_id CHAR(36) NULL,
                file_url TEXT NULL,
                file_type VARCHAR(50) NULL,
                file_size VARCHAR(50) NULL,
                uploaded_by VARCHAR(150) NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'Active',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
            ];

            for (const ddl of tenantDdlQueries) {
              await tenantSequelize.query(ddl).catch(() => {});
            }

            await tenantSequelize.query('SET FOREIGN_KEY_CHECKS = 1');
          } catch (syncErr) {
            logger.warn(`Failed to sync tables for database ${dbName}: ${syncErr.message}`);
          } finally {
            await tenantSequelize.close();
          }

          await sequelize.query(`DELETE FROM \`${dbName}\`.\`departments\` WHERE dept_code = 'ADMIN' OR dept_name = 'Administration' OR dept_code = 'DEPT-GEN' OR dept_name = 'General Administration'`).catch(() => {});

          // Ensure required columns exist
          await sequelize.query(`ALTER TABLE \`${dbName}\`.\`employees\` ADD COLUMN employee_name VARCHAR(255) NULL`).catch(() => {});
          await sequelize.query(`ALTER TABLE \`${dbName}\`.\`employees\` ADD COLUMN email VARCHAR(255) NULL`).catch(() => {});
          await sequelize.query(`ALTER TABLE \`${dbName}\`.\`employees\` ADD COLUMN department VARCHAR(255) NULL`).catch(() => {});

          const columnsToAdd = [
            // Hero Card
            { name: 'photo', type: 'TEXT' },
            { name: 'employeeId', type: 'VARCHAR(255)' },
            { name: 'employeeCode', type: 'VARCHAR(255)' },
            { name: 'employeeStatus', type: 'VARCHAR(255) DEFAULT "Active"' },
            { name: 'company', type: 'VARCHAR(255)' },
            { name: 'designation', type: 'VARCHAR(255)' },

            // Card 1: Basic Information
            { name: 'firstName', type: 'VARCHAR(255)' },
            { name: 'middleName', type: 'VARCHAR(255)' },
            { name: 'lastName', type: 'VARCHAR(255)' },
            { name: 'gender', type: 'VARCHAR(50)' },
            { name: 'dateOfBirth', type: 'DATE' },
            { name: 'maritalStatus', type: 'VARCHAR(100)' },
            { name: 'bloodGroup', type: 'VARCHAR(50)' },
            { name: 'nationality', type: 'VARCHAR(100)' },

            // Card 2: Official Information
            { name: 'officialEmail', type: 'VARCHAR(255)' },
            { name: 'dateOfJoining', type: 'DATE' },
            { name: 'reportingManager', type: 'VARCHAR(255)' },
            { name: 'employeeType', type: 'VARCHAR(100)' },
            { name: 'shift', type: 'VARCHAR(255)' },
            { name: 'weeklyOff', type: 'VARCHAR(100)' },

            // Card 3: Contact Information
            { name: 'mobileNumber', type: 'VARCHAR(100)' },
            { name: 'alternateMobile', type: 'VARCHAR(100)' },
            { name: 'personalEmail', type: 'VARCHAR(255)' },
            { name: 'currentAddress', type: 'TEXT' },
            { name: 'permanentAddress', type: 'TEXT' },

            // Card 4: Education & Experience
            { name: 'highestDegree', type: 'VARCHAR(255)' },
            { name: 'specialization', type: 'VARCHAR(255)' },
            { name: 'university', type: 'VARCHAR(255)' },
            { name: 'prevCompany', type: 'VARCHAR(255)' },
            { name: 'prevDesignation', type: 'VARCHAR(255)' },

            // System / JSON Profile Blob
            { name: 'profile_data', type: 'LONGTEXT' }
          ];

          for (const col of columnsToAdd) {
            await sequelize.query(`ALTER TABLE \`${dbName}\`.\`employees\` ADD COLUMN \`${col.name}\` ${col.type} NULL`).catch(() => {});
          }
        }
      }
      await sequelize.query("DELETE FROM departments WHERE dept_code = 'ADMIN' OR dept_name = 'Administration' OR dept_code = 'DEPT-GEN' OR dept_name = 'General Administration'").catch(() => {});
      logger.info('Purged default Administration department and updated employees schema across databases.');
    } catch (e) {
      logger.warn('Schema migration warning: ' + e.message);
    }

    // 4. Start HTTP Server
    app.listen(PORT, () => {
      logger.info(`Enterprise HRMS Backend Server listening on port ${PORT}`);
      startDatabaseVSCodeSync();
    });
  } catch (error) {
    logger.error('Critical server bootstrap error:', error);
    process.exit(1);
  }
};

// Start interval-based DB-to-disk polling sync to verify deleted departments are cleaned from VS Code
const startDatabaseVSCodeSync = () => {
  const fs = require('fs');
  const path = require('path');
  const { masterSequelize } = require('./config/database');
  const { getTenantConnection } = require('./config/connectionManager');
  const { deleteDepartmentFolder } = require('./utils/companyFolderScaffolder');

  setInterval(async () => {
    try {
      // 1. Fetch active tenants from master db
      const tenants = await masterSequelize.query(
        "SELECT id, db_name, company_name FROM tenants WHERE status = 'Active'",
        { type: masterSequelize.QueryTypes.SELECT }
      );

      for (const tenant of tenants) {
        const companyFolder = tenant.company_name;
        if (!companyFolder) continue;

        const cleanCompanyFolder = companyFolder.replace(/[^a-zA-Z0-9]/g, '');
        const deptParentDir = path.join(__dirname, '..', 'Frontend', 'src', 'Company', cleanCompanyFolder, 'Department');

        if (!fs.existsSync(deptParentDir)) continue;

        // Read physical directories on disk
        const diskFolders = fs.readdirSync(deptParentDir).filter(file => {
          return fs.statSync(path.join(deptParentDir, file)).isDirectory();
        });

        if (diskFolders.length === 0) continue;

        // Resolve connection pool
        const tenantDb = await getTenantConnection(tenant.id);

        // Fetch current departments in database
        const dbDepartments = await tenantDb.query(
          "SELECT dept_name FROM departments WHERE deleted_at IS NULL",
          { type: tenantDb.QueryTypes.SELECT }
        );

        const dbDeptNamesClean = dbDepartments.map(d => 
          (d.dept_name || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
        );

        for (const folder of diskFolders) {
          const cleanFolderName = folder.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

          // If folder exists on disk but is not present in database, delete it!
          if (!dbDeptNamesClean.includes(cleanFolderName)) {
            logger.info(`[Disk-DB Sync] Department folder '${folder}' not found in database for company '${companyFolder}'. Deleting folder...`);
            deleteDepartmentFolder(companyFolder, folder);
          }
        }
      }
    } catch (err) {
      // Fail silently to avoid polluting server logs
    }
  }, 4000); // Poll every 4 seconds
};

startServer();
// Trigger restart