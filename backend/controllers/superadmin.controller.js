// backend/controllers/superadmin.controller.js
const { Sequelize } = require('sequelize');
const { masterSequelize, tenantStorage, sequelize } = require('../config/database');
const { User, Role, Employee, Company, Branch, Department } = require('../models');
const crypto = require('crypto');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get all registered tenants from the master registry.
 */
const getTenants = asyncHandler(async (req, res) => {
  // Query Master Database directly
  const [tenants] = await masterSequelize.query(
    `SELECT id, id AS code, company_name AS name, db_name AS db, admin_email, admin_password, status, created_at FROM tenants`
  );

  const resolvedTenants = [];
  for (const tenant of tenants) {
    let ownerName = 'N/A';
    let emailAddress = tenant.admin_email || 'N/A';
    let phone = 'N/A';
    let address = 'N/A';
    let gst = 'N/A';
    let activeUsers = 0;

    if (tenant.status === 'Active') {
      try {
        const tenantDbName = tenant.db;
        const [empRows] = await masterSequelize.query(
          `SELECT employee_name, email FROM \`${tenantDbName}\`.employees LIMIT 1`
        ).catch(() => [[]]);
        const [userRows] = await masterSequelize.query(
          `SELECT email, password FROM \`${tenantDbName}\`.users LIMIT 1`
        ).catch(() => [[]]);
        const [compRows] = await masterSequelize.query(
          `SELECT gstNumber, address1, city, state, pincode FROM \`${tenantDbName}\`.company LIMIT 1`
        ).catch(() => [[]]);
        const [userCountRows] = await masterSequelize.query(
          `SELECT COUNT(*) as count FROM \`${tenantDbName}\`.users`
        ).catch(() => [[{ count: 0 }]]);

        if (empRows && empRows.length > 0) {
          ownerName = empRows[0].employee_name || ownerName;
          if (!emailAddress || emailAddress === 'N/A') {
            emailAddress = empRows[0].email || emailAddress;
          }
        }
        if (compRows.length > 0) {
          gst = compRows[0].gstNumber || 'N/A';
          address = `${compRows[0].address1 || ''}, ${compRows[0].city || ''}, ${compRows[0].state || ''} - ${compRows[0].pincode || ''}`.replace(/^,\s*|,\s*$/g, '') || 'N/A';
        }
        if (userCountRows.length > 0) {
          activeUsers = userCountRows[0].count;
        }

        // Self-healing backfill: Update NULL admin_email and admin_password in master tenants table
        if ((!tenant.admin_email || !tenant.admin_password) && userRows.length > 0) {
          const backfillEmail = tenant.admin_email || userRows[0].email;
          const backfillPass = tenant.admin_password || userRows[0].password;
          await masterSequelize.query(
            `UPDATE tenants SET admin_email = ?, admin_password = ? WHERE id = ?`,
            { replacements: [backfillEmail, backfillPass, tenant.id] }
          );
          emailAddress = backfillEmail;
        }
      } catch (err) {
        console.error(`Failed to fetch dynamic stats for tenant database: ${tenant.db}`, err.message);
      }
    }

    resolvedTenants.push({
      id: tenant.id,
      code: tenant.code,
      name: tenant.name,
      db: tenant.db,
      adminEmail: emailAddress,
      status: tenant.status,
      createdAt: tenant.created_at,
      ownerName,
      emailAddress,
      phone,
      address,
      gst,
      activeUsers,
      plan: 'YEARLY',
      trialStatus: 'Trial Active',
      expiryDate: new Date(new Date(tenant.created_at).setFullYear(new Date(tenant.created_at).getFullYear() + 1)).toISOString().slice(0, 10),
      remainingDays: Math.max(0, Math.round((new Date(new Date(tenant.created_at).setFullYear(new Date(tenant.created_at).getFullYear() + 1)) - new Date()) / 86400000))
    });
  }

  res.status(200).json(new ApiResponse(200, resolvedTenants, 'Tenants retrieved successfully.'));
});

/**
 * Register a new company and provision its isolated database, initial models, and CEO user.
 */
const createTenant = asyncHandler(async (req, res) => {
  const {
    companyName,
    companyEmail,
    firstName,
    lastName,
    adminEmail,
    mobileNumber,
    password,
    status = 'Active',
    state,
    city,
    pincode,
    gst
  } = req.body;

  if (!companyName || !companyEmail || !firstName || !lastName || !adminEmail || !password) {
    throw new ApiError(400, 'Missing required fields for tenant registration.');
  }

  const authService = require('../services/auth.service');
  if (await authService.isEmailRegisteredGlobally(adminEmail)) {
    throw new ApiError(400, 'This email is already exists.');
  }

  // Generate database name using ONLY the company name (lowercase, spaces to underscores, no special characters, no nib_hr_ prefix, no random numbers)
  const tenantDbName = String(companyName)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

  if (!tenantDbName) {
    throw new ApiError(400, 'Company name is invalid for database creation.');
  }

  // Check if company name or db_name already exists in master registry
  const [existingTenants] = await masterSequelize.query(
    `SELECT id FROM tenants WHERE company_name = ? OR db_name = ? LIMIT 1`,
    { replacements: [companyName, tenantDbName] }
  );

  if (existingTenants.length > 0) {
    throw new ApiError(400, `Company '${companyName}' or database '${tenantDbName}' is already registered.`);
  }

  // 2. Create the physical database
  try {
    await masterSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${tenantDbName}\``);
    console.log(`[Superadmin] Database '${tenantDbName}' created successfully.`);
  } catch (err) {
    throw new ApiError(500, `Failed to create database: ${err.message}`);
  }

  // 3. Connect to the new database
  const tenantSequelize = new Sequelize(
    tenantDbName,
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
    await tenantSequelize.authenticate();
  } catch (err) {
    throw new ApiError(500, `Failed to connect to newly created database: ${err.message}`);
  }

  // 4. Provision tables, default roles, default metadata, and Admin user inside AsyncLocalStorage
  try {
    await tenantStorage.run(tenantSequelize, async () => {
      // Temporarily disable foreign key constraints to prevent ordering issues during table creation
      await tenantSequelize.query('SET FOREIGN_KEY_CHECKS = 0');

      // Provision all database tables directly using tenantSequelize QueryInterface
      const allModels = require('../models');
      const modelsList = Object.values(allModels).filter(m => m && typeof m.getAttributes === 'function');
      const queryInterface = tenantSequelize.getQueryInterface();

      for (const model of modelsList) {
        const tableName = model.tableName || model.options?.tableName;
        if (tableName) {
          const attributes = model.getAttributes();
          const cleanAttributes = {};
          for (const [key, attr] of Object.entries(attributes)) {
            // Exclude VIRTUAL fields (like isActive) as they are JS-only getters and not physical SQL columns
            if (attr && attr.type && attr.type.key === 'VIRTUAL') {
              continue;
            }
            cleanAttributes[key] = attr;
          }
          await queryInterface.createTable(tableName, cleanAttributes).catch((err) => {
            console.warn(`[Sync Warning] Table '${tableName}' creation notice:`, err.message);
          });
        }
      }

      // Re-enable foreign key constraints
      await tenantSequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      console.log(`[Superadmin] Dynamic table synchronization completed for '${tenantDbName}'.`);

      // 1. Seed default roles
      const adminRoleId = crypto.randomUUID();
      const managerRoleId = crypto.randomUUID();
      const employeeRoleId = crypto.randomUUID();

      await tenantSequelize.query(`
        INSERT IGNORE INTO roles (id, name, description, created_at, updated_at)
        VALUES 
          (?, 'Admin', 'System administrator with complete access rights.', NOW(), NOW()),
          (?, 'Manager', 'Department manager with administrative privileges.', NOW(), NOW()),
          (?, 'Employee', 'Standard employee with employee portal rights.', NOW(), NOW())
      `, { replacements: [adminRoleId, managerRoleId, employeeRoleId] });

      // 2. Seed Default Branch
      const branchId = crypto.randomUUID();
      await tenantSequelize.query(`
        INSERT IGNORE INTO branches (id, branch_code, branch_name, status, created_at, updated_at)
        VALUES (?, 'MAIN', 'Main Branch', 'Active', NOW(), NOW())
      `, { replacements: [branchId] });

      // 3. Purge default/legacy Administration department if present
      await tenantSequelize.query(`
        DELETE FROM departments WHERE dept_code = 'ADMIN' OR dept_name = 'Administration' OR dept_code = 'DEPT-GEN' OR dept_name = 'General Administration'
      `).catch(() => {});

      // 4. Seed Default Designation using model-aligned designations table columns
      const defaultDesignationId = crypto.randomUUID();
      await tenantSequelize.query(`
        INSERT IGNORE INTO designations (id, desig_code, desig_name, status, created_at, updated_at)
        VALUES (?, 'CEO', 'Chief Executive Officer', 'Active', NOW(), NOW())
      `, { replacements: [defaultDesignationId] });

      // 5. Seed Default Shift using model-aligned shift_master table columns
      const defaultShiftId = 1;
      await tenantSequelize.query(`
        INSERT IGNORE INTO shift_master (id, shiftCode, shiftName, startTime, endTime, status)
        VALUES (?, 'GEN', 'General Shift', '09:00:00', '18:00:00', 'Active')
      `, { replacements: [defaultShiftId] });

      // 5. Seed Company profile in tenant DB (company table is singular and does not have timestamps)
      await tenantSequelize.query(`
        INSERT IGNORE INTO company (companyCode, companyName, email, gstNumber, state, city, pincode, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
      `, { replacements: [tenantDbName, companyName, companyEmail, gst || '', state || '', city || '', pincode || ''] });

      // 6. Seed User (Admin Credentials)
      const newAdminUserId = crypto.randomUUID();
      const hashedPassword = await require('bcryptjs').hash(password, 10);
      await tenantSequelize.query(`
        INSERT IGNORE INTO users (id, email, password, role_id, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'Active', NOW(), NOW())
      `, { replacements: [newAdminUserId, adminEmail, hashedPassword, adminRoleId] });

      // 7. Seed Employee record linked to Admin user (4 clean fields: employee_name, email, password, department)
      const newEmployeeId = crypto.randomUUID();
      const ownerFullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Admin User';
      try {
        await tenantSequelize.query(`
          INSERT IGNORE INTO employees (id, employee_name, email, password, department, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'Administration', NOW(), NOW())
        `, { replacements: [newEmployeeId, ownerFullName, adminEmail, hashedPassword] });
      } catch (empErr) {
        console.warn('[Tenant Employee Seed Warning]', empErr.message);
      }
      
      console.log(`[Superadmin] Successfully seeded roles, metadata, and CEO credentials in '${tenantDbName}'.`);
    });

  } catch (err) {
    console.error("DYNAMIC PROVISIONING CRASH ERROR DETAILS:", err);
    // If table creation/seeding fails, drop the database to clean up
    try {
      await masterSequelize.query(`DROP DATABASE IF EXISTS \`${tenantDbName}\``);
    } catch (dropErr) {
      console.error(`Failed to clean up database '${tenantDbName}':`, dropErr.message);
    }
    const validationMessage = err.errors ? err.errors.map(e => e.message).join(', ') : err.message;
    throw new ApiError(500, `Failed to provision tenant database: ${validationMessage}`);
  } finally {
    await tenantSequelize.close();
  }

  // 5. Insert the tenant metadata record into master database
  const tenantId = crypto.randomUUID();
  const bcrypt = require('bcryptjs');
  const targetAdminEmail = adminEmail || companyEmail || '';
  const hashedAdminPassword = password ? await bcrypt.hash(password, 10) : '';

  try {
    await masterSequelize.query(
      `INSERT INTO tenants (id, company_name, db_host, db_port, db_name, db_username, db_password, admin_email, admin_password, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          tenantId,
          companyName,
          process.env.DB_HOST || 'localhost',
          parseInt(process.env.DB_PORT) || 3306,
          tenantDbName,
          process.env.DB_USER || 'root',
          process.env.DB_PASSWORD || '',
          targetAdminEmail,
          hashedAdminPassword,
          status || 'Active'
        ]
      }
    );
    // Auto-scaffold physical folder hierarchy: Frontend/src/Company/[CompanyName]/...
    const { scaffoldCompanyFolder } = require('../utils/companyFolderScaffolder');
    scaffoldCompanyFolder(companyName, []);
  } catch (err) {
    // Clean up created database if master insert fails
    await masterSequelize.query(`DROP DATABASE IF EXISTS \`${tenantDbName}\``);
    throw new ApiError(500, `Failed to register tenant metadata in master table: ${err.message}`);
  }

  res.status(201).json(new ApiResponse(201, {
    tenantId,
    companyCode: tenantDbName,
    companyName,
    database: tenantDbName,
    status
  }, 'Company registered and dynamic database provisioned successfully.'));
});

module.exports = {
  getTenants,
  createTenant
};
