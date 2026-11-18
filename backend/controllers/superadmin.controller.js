// backend/controllers/superadmin.controller.js
const { Sequelize, QueryTypes } = require('sequelize');
const { masterSequelize, tenantStorage, sequelize } = require('../config/database');
const { User, Role, Employee, Company, Branch, Department } = require('../models');
const { evictTenantConnection, getTenantConnection } = require('../config/connectionManager');
const crypto = require('crypto');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const MAX_COMPANIES = 50;

/**
 * Get all registered tenants from the master registry.
 * SuperAdmin sees all companies; Company Admin sees only their authorized company.
 */
const getTenants = asyncHandler(async (req, res) => {
  // Query all active physical databases on MySQL server to verify existence
  const [existingDbRows] = await masterSequelize.query('SHOW DATABASES');
  const existingDbSet = new Set(existingDbRows.map(row => Object.values(row)[0].toLowerCase()));

  // Query Master Database directly
  const [tenants] = await masterSequelize.query(
    `SELECT id, id AS code, company_name AS name, db_name AS db, admin_email, admin_password, status, created_at, max_companies, max_branches FROM tenants`
  );

  const userRoleStr = String(req.user?.role?.name || req.user?.role || '').toLowerCase();
  const isSuperAdmin = userRoleStr === 'superadmin' || 
                       userRoleStr === 'admin' ||
                       req.user?.email === 'superadmin@nib.com' ||
                       req.user?.email === 'admin@nib.com' ||
                       req.user?.email === 'admin@nibinsurance.com';

  const resolvedTenants = [];
  for (const tenant of tenants) {
    const dbExists = existingDbSet.has(String(tenant.db).toLowerCase());
    
    // Auto-cleanup: If the tenant's physical database was deleted from MySQL, purge orphaned records
    if (!dbExists) {
      console.log(`[Superadmin] Database '${tenant.db}' does not exist in MySQL. Purging orphaned tenant record '${tenant.name}' (${tenant.id})...`);
      await masterSequelize.query(`DELETE FROM tenants WHERE id = ?`, { replacements: [tenant.id] }).catch(() => {});
      await masterSequelize.query(`DELETE FROM company WHERE companyCode = ? OR companyName = ?`, { replacements: [tenant.db, tenant.name] }).catch(() => {});
      continue;
    }

    // Role-based visibility: Company Admin only sees their own company
    if (!isSuperAdmin) {
      const userCompany = String(req.user?.companyCode || req.user?.tenantDb || req.user?.companyName || '').toLowerCase();
      const isMatch = (
        String(tenant.id).toLowerCase() === userCompany ||
        String(tenant.db).toLowerCase() === userCompany ||
        String(tenant.name).toLowerCase() === userCompany
      );
      if (!isMatch) {
        continue;
      }
    }

    let ownerName = 'N/A';
    let emailAddress = tenant.admin_email || 'N/A';
    let phone = 'N/A';
    let address = 'N/A';
    let gst = 'N/A';
    let activeUsers = 0;
    let activeBranches = 0;

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
        const [branchCountRows] = await masterSequelize.query(
          `SELECT COUNT(*) as count FROM \`${tenantDbName}\`.branches WHERE deleted_at IS NULL`
        ).catch(() => masterSequelize.query(`SELECT COUNT(*) as count FROM \`${tenantDbName}\`.branches`).catch(() => [[{ count: 0 }]]));
        activeBranches = branchCountRows && branchCountRows[0] ? (branchCountRows[0][0]?.count || branchCountRows[0]?.count || 0) : 0;

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

        // Self-healing backfill for admin credentials
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
      branchesCount: typeof activeBranches !== 'undefined' ? Number(activeBranches) : 0,
      maxCompanies: Number(tenant.max_companies) || 50,
      maxBranches: typeof tenant.max_branches !== 'undefined' && tenant.max_branches !== null ? Number(tenant.max_branches) : 50,
      plan: 'YEARLY',
      trialStatus: 'Trial Active',
      expiryDate: new Date(new Date(tenant.created_at).setFullYear(new Date(tenant.created_at).getFullYear() + 1)).toISOString().slice(0, 10),
      remainingDays: Math.max(0, Math.round((new Date(new Date(tenant.created_at).setFullYear(new Date(tenant.created_at).getFullYear() + 1)) - new Date()) / 86400000))
    });
  }

  res.status(200).json(new ApiResponse(200, resolvedTenants, 'Tenants retrieved successfully.'));
});

/**
 * Register a new company and provision its isolated tenant database.
 * Atomic concurrency lock ensures safe sequential database provisioning.
 * Enforces a maximum of 50 registered companies and 50 branches per company.
 * Rollback compensation handling ensures complete atomicity.
 */
const createTenant = asyncHandler(async (req, res) => {
  const {
    companyName,
    companyCode,
    companyEmail,
    companyPhone,
    website,
    companyType,
    industry,
    firstName,
    lastName,
    adminEmail,
    mobileNumber,
    adminDesignation,
    password,
    status = 'Active',
    state,
    city,
    pincode,
    country,
    address,
    gst,
    panNumber,
    cinNumber,
    currency,
    timezone,
    requireBranchManagement = false,
    branches = [],
    totalCompanies = 1,
    branchesPerCompany = 0,
    createNewCompany = true,
    setupMode = 'FULL_COMPANY_BRANCH',
    targetCompanyId,
    targetCompanyDb
  } = req.body;

  // =========================================================================
  // PATH A: STANDALONE ADMIN CREATION (NO NEW COMPANY, NO NEW BRANCHES)
  // SuperAdmin creates an Admin and links directly to an existing Company
  // =========================================================================
  if (createNewCompany === false || setupMode === 'ADMIN_ONLY') {
    if (!adminEmail || !password || !firstName) {
      throw new ApiError(400, 'Missing required Admin fields: First Name, Admin Email, and Password.');
    }
    const targetComp = targetCompanyId || targetCompanyDb || req.body.companyId || req.body.companyCode;
    if (!targetComp) {
      throw new ApiError(400, 'Please select an existing target company to assign this Admin account.');
    }

    // Find company in Master database
    const [tenantList] = await masterSequelize.query(
      `SELECT * FROM tenants WHERE id = :id OR db_name = :db OR company_name = :name LIMIT 1`,
      { replacements: { id: targetComp, db: targetComp, name: targetComp }, type: QueryTypes.SELECT }
    );
    const tenant = tenantList && (Array.isArray(tenantList) ? tenantList[0] : tenantList);
    if (!tenant) {
      throw new ApiError(404, 'Selected company was not found in the master enterprise registry.');
    }

    const authService = require('../services/auth.service');
    if (await authService.isEmailRegisteredGlobally(adminEmail)) {
      throw new ApiError(400, `The email '${adminEmail}' is already registered in the system.`);
    }

    const tenantDb = await getTenantConnection(tenant.db_name || tenant.id);
    const bcrypt = require('bcryptjs');
    const hashedAdminPassword = await bcrypt.hash(password, 10);
    const newAdminUserId = crypto.randomUUID();
    const cleanAdminEmail = String(adminEmail).trim().toLowerCase();
    const ownerFullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Admin User';

    // 1. Get or create Admin role in tenant database
    let [adminRole] = await tenantDb.query(
      "SELECT id FROM roles WHERE name = 'Admin' LIMIT 1",
      { type: QueryTypes.SELECT }
    ).catch(() => [null]);

    let adminRoleId = adminRole?.id;
    if (!adminRoleId) {
      adminRoleId = crypto.randomUUID();
      await tenantDb.query(
        "INSERT INTO roles (id, name, description, created_at, updated_at) VALUES (?, 'Admin', 'Tenant Administrator', NOW(), NOW())",
        { replacements: [adminRoleId] }
      ).catch(() => {});
    }

    // 2. Insert into tenant users table
    await tenantDb.query(
      `INSERT INTO users (id, email, password, role_id, role, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'Admin', 'Active', NOW(), NOW())`,
      { replacements: [newAdminUserId, cleanAdminEmail, hashedAdminPassword, adminRoleId] }
    );

    // 3. Insert into master DB users table (for global cross-tenant authentication)
    await masterSequelize.query(
      `INSERT IGNORE INTO users (id, email, password, role_id, role, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'Admin', 'Active', NOW(), NOW())`,
      { replacements: [newAdminUserId, cleanAdminEmail, hashedAdminPassword, adminRoleId] }
    ).catch(() => {});

    // 4. Resolve default branch for this tenant
    const [branchRows] = await tenantDb.query(
      "SELECT id, branch_name, branchName FROM branches ORDER BY created_at ASC LIMIT 1",
      { type: QueryTypes.SELECT }
    ).catch(() => [null]);
    const branchRecord = branchRows && (Array.isArray(branchRows) ? branchRows[0] : branchRows);
    const branchId = branchRecord?.id || null;
    const branchName = branchRecord?.branch_name || branchRecord?.branchName || 'Main Branch';

    // 5. Insert into tenant employees and employee_profile tables
    const newEmployeeId = crypto.randomUUID();
    await tenantDb.query(
      `INSERT INTO employees (id, employee_name, firstName, lastName, email, user_id, department, designation, branch_id, branchName, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'Administration', ?, ?, ?, NOW(), NOW())`,
      { replacements: [newEmployeeId, ownerFullName, firstName, lastName || '', cleanAdminEmail, newAdminUserId, adminDesignation || 'Administrator', branchId, branchName] }
    ).catch(() => {});

    await tenantDb.query(
      `INSERT INTO employee_profile (id, employee_name, firstName, lastName, officialEmail, personalEmail, department, designation, branch, branch_id, branchName, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'Administration', ?, ?, ?, ?, NOW(), NOW())`,
      { replacements: [newEmployeeId, ownerFullName, firstName, lastName || '', cleanAdminEmail, cleanAdminEmail, adminDesignation || 'Administrator', branchName, branchId, branchName] }
    ).catch(() => {});

    // Multi-Company Mapping: Link this Admin to additional existing companies if requested
    const extraCompIds = Array.isArray(req.body.additionalCompanyIds) ? req.body.additionalCompanyIds : [];
    for (const extraId of extraCompIds) {
      if (extraId === targetComp) continue;
      try {
        const extraTenantDb = await getTenantConnection(extraId);
        let [exAdminRole] = await extraTenantDb.query(
          "SELECT id FROM roles WHERE name = 'Admin' LIMIT 1",
          { type: QueryTypes.SELECT }
        ).catch(() => [null]);
        let exAdminRoleId = exAdminRole?.id;
        if (!exAdminRoleId) {
          exAdminRoleId = crypto.randomUUID();
          await extraTenantDb.query(
            "INSERT INTO roles (id, name, description, created_at, updated_at) VALUES (?, 'Admin', 'Tenant Administrator', NOW(), NOW())",
            { replacements: [exAdminRoleId] }
          ).catch(() => {});
        }
        await extraTenantDb.query(
          `INSERT IGNORE INTO users (id, email, password, role_id, role, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'Admin', 'Active', NOW(), NOW())`,
          { replacements: [newAdminUserId, cleanAdminEmail, hashedAdminPassword, exAdminRoleId] }
        ).catch(() => {});
        const [exBr] = await extraTenantDb.query(
          "SELECT id, branch_name, branchName FROM branches ORDER BY created_at ASC LIMIT 1",
          { type: QueryTypes.SELECT }
        ).catch(() => [null]);
        const exBranchRecord = exBr && (Array.isArray(exBr) ? exBr[0] : exBr);
        const exBranchId = exBranchRecord?.id || null;
        const exBranchName = exBranchRecord?.branch_name || exBranchRecord?.branchName || 'Main Branch';
        const exEmpId = crypto.randomUUID();
        await extraTenantDb.query(
          `INSERT INTO employees (id, employee_name, firstName, lastName, email, user_id, department, designation, branch_id, branchName, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 'Administration', ?, ?, ?, NOW(), NOW())`,
          { replacements: [exEmpId, ownerFullName, firstName, lastName || '', cleanAdminEmail, newAdminUserId, adminDesignation || 'Administrator', exBranchId, exBranchName] }
        ).catch(() => {});
      } catch (exErr) {
        console.warn(`[Superadmin] Notice: could not link admin to extra company ${extraId}:`, exErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: `Admin account '${cleanAdminEmail}' successfully created and assigned to '${tenant.company_name}'!`,
      data: {
        userId: newAdminUserId,
        email: cleanAdminEmail,
        companyName: tenant.company_name,
        companyCode: tenant.id
      }
    });
  }

  // =========================================================================
  // PATH B: FULL COMPANY & BRANCH PROVISIONING
  // =========================================================================
  if (!companyName || !companyEmail || !firstName || !lastName || !adminEmail || !password) {
    throw new ApiError(400, 'Missing required fields for tenant registration.');
  }

  // Parse and validate totalCompanies and branchesPerCompany
  const numCompanies = req.body.totalCompanies !== undefined ? parseInt(req.body.totalCompanies, 10) : (parseInt(totalCompanies, 10) || 1);
  const numBranches = req.body.branchesPerCompany !== undefined ? parseInt(req.body.branchesPerCompany, 10) : (parseInt(branchesPerCompany, 10) || (requireBranchManagement ? 1 : 0));

  if (isNaN(numCompanies) || numCompanies < 1 || numCompanies > 50) {
    throw new ApiError(400, 'Total Companies must be a valid number between 1 and 50.');
  }
  if (isNaN(numBranches) || numBranches < 0 || numBranches > 50) {
    throw new ApiError(400, 'Branches per Company must be a valid number between 0 and 50.');
  }

  // 1. Concurrency lock to prevent race conditions during database provisioning
  let lockAcquired = false;
  try {
    const [lockRes] = await masterSequelize.query("SELECT GET_LOCK('tenant_reg_atomic_lock', 10) AS locked");
    lockAcquired = lockRes && lockRes[0] && lockRes[0].locked === 1;
    if (!lockAcquired) {
      throw new ApiError(429, 'Another company registration is currently processing. Please try again in a few seconds.');
    }

    const [companyCountRows] = await masterSequelize.query('SELECT COUNT(*) AS total FROM tenants');
    const companyCount = Number(companyCountRows && companyCountRows[0] && companyCountRows[0].total) || 0;
    if (companyCount + numCompanies > MAX_COMPANIES) {
      throw new ApiError(400, `Registering ${numCompanies} company(ies) exceeds the maximum limit of ${MAX_COMPANIES} registered companies. Currently registered: ${companyCount}.`);
    }

    const authService = require('../services/auth.service');
    if (await authService.isEmailRegisteredGlobally(adminEmail)) {
      throw new ApiError(400, 'This admin email is already registered.');
    }

    const createdDatabases = [];
    const createdTenants = [];
    const bcrypt = require('bcryptjs');
    const hashedAdminPassword = await bcrypt.hash(password, 10);

    for (let cIdx = 0; cIdx < numCompanies; cIdx++) {
      const isPrimary = cIdx === 0;
      const currCompanyName = isPrimary ? String(companyName).trim() : `${String(companyName).trim()} ${cIdx + 1}`;

      // Generate database name using ONLY the company name (lowercase, underscores)
      const baseDbName = String(companyName)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');

      if (!baseDbName) {
        throw new ApiError(400, 'Company name is invalid for database creation.');
      }

      let currDbName = isPrimary ? baseDbName : `${baseDbName}_${cIdx + 1}`;

      // Check if company name or db_name already exists in master registry
      const [existingTenants] = await masterSequelize.query(
        `SELECT id FROM tenants WHERE company_name = ? OR db_name = ? LIMIT 1`,
        { replacements: [currCompanyName, currDbName] }
      );

      if (existingTenants.length > 0) {
        if (isPrimary) {
          throw new ApiError(400, `Company '${currCompanyName}' or database '${currDbName}' is already registered.`);
        } else {
          currDbName = `${baseDbName}_${cIdx + 1}_${crypto.randomBytes(2).toString('hex')}`;
        }
      }

      let currAdminEmail = String(adminEmail).trim();
      if (!isPrimary) {
        if (currAdminEmail.includes('@')) {
          const [u, d] = currAdminEmail.split('@');
          currAdminEmail = `${u}+c${cIdx + 1}@${d}`;
        } else {
          currAdminEmail = `${currAdminEmail}_c${cIdx + 1}`;
        }
      }

      const tenantDbName = currDbName;

      // 3. Create the physical database in MySQL
      await masterSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${tenantDbName}\``);
      createdDatabases.push(tenantDbName);
      console.log(`[Superadmin] Database '${tenantDbName}' created successfully for company '${currCompanyName}'.`);

    // 4. Connect to the new database
    const tenantSequelize = new Sequelize(
      tenantDbName,
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        dialect: 'mysql',
        logging: false,
        define: {
          timestamps: false,
          paranoid: false,
        }
      }
    );

    await tenantSequelize.authenticate();

    // 5. Provision tables, default roles, default metadata, and Admin user inside AsyncLocalStorage
    let firstBranchId = null;
    let firstBranchName = null;
    try {
      await tenantStorage.run(tenantSequelize, async () => {
        await tenantSequelize.query('SET FOREIGN_KEY_CHECKS = 0');

        // Clone all tables from primary template database 'nib_insurance'
        try {
          const [sourceTables] = await masterSequelize.query('SHOW TABLES FROM `nib_insurance`');
          if (sourceTables && sourceTables.length > 0) {
            console.log(`[Superadmin] Cloning ${sourceTables.length} tables from 'nib_insurance' template to '${tenantDbName}'...`);
            for (const tblObj of sourceTables) {
              const tbl = Object.values(tblObj)[0];
              const [createRes] = await masterSequelize.query(`SHOW CREATE TABLE \`nib_insurance\`.\`${tbl}\``);
              if (createRes && createRes[0] && createRes[0]['Create Table']) {
                const createSql = createRes[0]['Create Table'];
                await tenantSequelize.query(`DROP TABLE IF EXISTS \`${tbl}\``);
                await tenantSequelize.query(createSql);
              }
            }
          }
        } catch (cloneErr) {
          console.warn('[Superadmin] Template cloning notice, falling back to model sync:', cloneErr.message);
        }

        // Provision any remaining models via QueryInterface
        const allModels = require('../models');
        const modelsList = Object.values(allModels).filter(m => m && typeof m.getAttributes === 'function');
        const queryInterface = tenantSequelize.getQueryInterface();

        for (const model of modelsList) {
          const tableName = model.tableName || model.options?.tableName;
          if (tableName) {
            const attributes = model.getAttributes();
            const cleanAttributes = {};
            for (const [key, attr] of Object.entries(attributes)) {
              if (attr && attr.type && attr.type.key === 'VIRTUAL') continue;
              cleanAttributes[key] = attr;
            }
            await queryInterface.createTable(tableName, cleanAttributes).catch(() => {});
          }
        }

        // Ensure employees table has branch_id column
        await tenantSequelize.query("ALTER TABLE employees ADD COLUMN branch_id CHAR(36) NULL").catch(() => {});
        await tenantSequelize.query("ALTER TABLE employees ADD COLUMN branchName VARCHAR(255) NULL").catch(() => {});

        // Re-enable foreign key checks
        await tenantSequelize.query('SET FOREIGN_KEY_CHECKS = 1');

        // Seed default roles
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

        // Seed Branches: ONLY the requested number of branches!
        // If numBranches === 0, company operates with only headquarters and 0 branch records.
        if (numBranches > 0) {
          for (let b = 0; b < numBranches; b++) {
            const brId = crypto.randomUUID();
            const customBr = Array.isArray(req.body.branchesList) && req.body.branchesList[b] ? req.body.branchesList[b] : null;
            const brCode = customBr?.branchCode?.trim() || (b === 0 ? 'MAIN' : `BR-${String(b + 1).padStart(3, '0')}`);
            const brName = customBr?.branchName?.trim() || (b === 0 ? 'Main Branch' : `Branch ${b + 1}`);
            const brType = b === 0 ? 'HQ' : (customBr?.branchType || 'Branch');
            const brAddress = customBr?.address?.trim() || address || '';
            const brCity = customBr?.city?.trim() || city || '';
            const brState = customBr?.state?.trim() || state || '';
            const brPincode = customBr?.pincode?.trim() || pincode || '';

            if (b === 0) {
              firstBranchId = brId;
              firstBranchName = brName;
            }

            await tenantSequelize.query(`
              INSERT IGNORE INTO branches (
                id, branch_code, branch_name, branch_type, branchCode, branchName, branchType,
                address, city, state, pincode, manager, email, phone, status, working_days, workingDays, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `, {
              replacements: [
                brId,
                brCode,
                brName,
                brType,
                brCode,
                brName,
                brType,
                brAddress,
                brCity,
                brState,
                brPincode,
                `${firstName || ''} ${lastName || ''}`.trim() || 'Head Office Admin',
                currAdminEmail,
                mobileNumber || '',
                'Active',
                'Monday - Friday, 8:30 AM - 5:30 PM',
                'Monday - Friday, 8:30 AM - 5:30 PM'
              ]
            });
          }
          console.log(`[Superadmin] Successfully seeded ${numBranches} branch(es) for '${currDbName}'.`);
        } else {
          console.log(`[Superadmin] Company '${currDbName}' registered with 0 branches (Headquarters only).`);
        }

        // Purge default Administration department
        await tenantSequelize.query(`
          DELETE FROM departments WHERE dept_code = 'ADMIN' OR dept_name = 'Administration' OR dept_code = 'DEPT-GEN' OR dept_name = 'General Administration'
        `).catch(() => {});

        // Seed Default Designation
        const defaultDesignationId = crypto.randomUUID();
        await tenantSequelize.query(`
          INSERT IGNORE INTO designations (id, desig_code, desig_name, status, created_at, updated_at)
          VALUES (?, 'CEO', 'Chief Executive Officer', 'Active', NOW(), NOW())
        `, { replacements: [defaultDesignationId] });

        // Seed Default Shift
        await tenantSequelize.query(`
          INSERT IGNORE INTO shift_master (id, shiftCode, shiftName, startTime, endTime, status)
          VALUES (1, 'GEN', 'General Shift', '09:00:00', '18:00:00', 'Active')
        `).catch(() => {});

        // Seed Company Profile
        await tenantSequelize.query(`DELETE FROM company`);
        await tenantSequelize.query(`
          INSERT INTO company (
            companyCode, companyName, shortName, email, phone, website,
            address1, city, state, pincode, country,
            gstNumber, cinNumber, regNumber, panNumber, tanNumber, pfNumber, esiNumber,
            currency, financialYear, timezone, type, status
          ) VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, 'Active'
          )
        `, {
          replacements: [
            companyCode || tenantDbName,
            companyName,
            req.body.shortName || companyName,
            companyEmail || adminEmail || '',
            companyPhone || mobileNumber || req.body.phone || '+91 98765 43210',
            website || req.body.website || `https://www.${String(companyName).toLowerCase().replace(/\s+/g, '')}.com`,
            address || 'Corporate Headquarters',
            city || 'Corporate City',
            state || 'State',
            pincode || '100001',
            country || req.body.country || 'India',
            gst || req.body.gstNumber || '',
            cinNumber || req.body.cinNumber || '',
            req.body.regNumber || '',
            panNumber || req.body.panNumber || '',
            req.body.tanNumber || '',
            req.body.pfNumber || '',
            req.body.esiNumber || '',
            currency || req.body.currency || 'INR (₹)',
            req.body.financialYear || '2026-2027',
            timezone || req.body.timezone || 'IST (GMT+5:30)',
            companyType || industry || req.body.type || 'Pvt Ltd'
          ]
        });

        // Seed Admin User
        const newAdminUserId = crypto.randomUUID();
        await tenantSequelize.query(`
          INSERT IGNORE INTO users (id, email, password, role_id, role, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'Admin', 'Active', NOW(), NOW())
        `, { replacements: [newAdminUserId, currAdminEmail, hashedAdminPassword, adminRoleId] });

        // Seed Employee linked to Admin
        const newEmployeeId = crypto.randomUUID();
        const ownerFullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Admin User';
        await tenantSequelize.query(`
          INSERT IGNORE INTO employees (id, employee_name, email, user_id, department, designation, branch_id, branchName, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'Administration', ?, ?, ?, NOW(), NOW())
        `, { replacements: [newEmployeeId, ownerFullName, currAdminEmail, newAdminUserId, adminDesignation || 'Managing Director', firstBranchId, firstBranchName] }).catch(() => {});
      });

    } catch (provisionErr) {
      // Rollback database creation if provisioning fails
      await tenantSequelize.close().catch(() => {});
      await masterSequelize.query(`DROP DATABASE IF EXISTS \`${tenantDbName}\``).catch(() => {});
      throw provisionErr;
    } finally {
      await tenantSequelize.close().catch(() => {});
    }

    // 6. Insert tenant record into master database
    const tenantId = crypto.randomUUID();

    try {
      await masterSequelize.query(
        `INSERT INTO tenants (id, company_name, db_host, db_port, db_name, db_username, db_password, admin_email, admin_password, status, max_companies, max_branches)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        {
          replacements: [
            tenantId,
            currCompanyName,
            process.env.DB_HOST || 'localhost',
            parseInt(process.env.DB_PORT, 10) || 3306,
            tenantDbName,
            process.env.DB_USER || 'root',
            process.env.DB_PASSWORD || '',
            currAdminEmail,
            hashedAdminPassword,
            status || 'Active',
            numCompanies,
            numBranches
          ]
        }
      );

      // Sync to Master DB company registry
      await masterSequelize.query(`
        INSERT INTO company (companyCode, companyName, email, phone, gstNumber, state, city, pincode, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, {
        replacements: [
          tenantDbName,
          currCompanyName,
          companyEmail || currAdminEmail || '',
          mobileNumber || '',
          gst || '',
          state || '',
          city || '',
          pincode || '',
          status || 'Active'
        ]
      }).catch(() => {});

      // Auto-scaffold physical folder hierarchy
      try {
        const { scaffoldCompanyFolder } = require('../utils/companyFolderScaffolder');
        scaffoldCompanyFolder(currCompanyName, []);
      } catch (e) {}

      createdTenants.push({
        tenantId,
        companyCode: tenantDbName,
        companyName: currCompanyName,
        database: tenantDbName,
        adminEmail: currAdminEmail,
        branchesCount: numBranches,
        status: status || 'Active'
      });

    } catch (masterInsertErr) {
      // Compensation: drop created database if master record insert fails
      await masterSequelize.query(`DROP DATABASE IF EXISTS \`${tenantDbName}\``).catch(() => {});
      throw new ApiError(500, `Failed to register tenant metadata for ${currCompanyName}: ${masterInsertErr.message}`);
    }
  }

  // Multi-Company Mapping: Also link this Admin user to any selected existing companies
  const extraCompIds = Array.isArray(req.body.additionalCompanyIds) ? req.body.additionalCompanyIds : [];
  if (extraCompIds.length > 0) {
    const ownerFullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Admin User';
    const cleanAdminEmail = String(adminEmail).trim().toLowerCase();
    for (const extraId of extraCompIds) {
      try {
        const extraTenantDb = await getTenantConnection(extraId);
        let [exAdminRole] = await extraTenantDb.query(
          "SELECT id FROM roles WHERE name = 'Admin' LIMIT 1",
          { type: QueryTypes.SELECT }
        ).catch(() => [null]);
        let exAdminRoleId = exAdminRole?.id;
        if (!exAdminRoleId) {
          exAdminRoleId = crypto.randomUUID();
          await extraTenantDb.query(
            "INSERT INTO roles (id, name, description, created_at, updated_at) VALUES (?, 'Admin', 'Tenant Administrator', NOW(), NOW())",
            { replacements: [exAdminRoleId] }
          ).catch(() => {});
        }
        const extraUserId = crypto.randomUUID();
        await extraTenantDb.query(
          `INSERT IGNORE INTO users (id, email, password, role_id, role, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'Admin', 'Active', NOW(), NOW())`,
          { replacements: [extraUserId, cleanAdminEmail, hashedAdminPassword, exAdminRoleId] }
        ).catch(() => {});
        const [exBr] = await extraTenantDb.query(
          "SELECT id, branch_name, branchName FROM branches ORDER BY created_at ASC LIMIT 1",
          { type: QueryTypes.SELECT }
        ).catch(() => [null]);
        const exBranchRecord = exBr && (Array.isArray(exBr) ? exBr[0] : exBr);
        const exBranchId = exBranchRecord?.id || null;
        const exBranchName = exBranchRecord?.branch_name || exBranchRecord?.branchName || 'Main Branch';
        const exEmpId = crypto.randomUUID();
        await extraTenantDb.query(
          `INSERT INTO employees (id, employee_name, firstName, lastName, email, user_id, department, designation, branch_id, branchName, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 'Administration', ?, ?, ?, NOW(), NOW())`,
          { replacements: [exEmpId, ownerFullName, firstName, lastName || '', cleanAdminEmail, extraUserId, adminDesignation || 'Administrator', exBranchId, exBranchName] }
        ).catch(() => {});
      } catch (exErr) {
        console.warn(`[Superadmin] Notice: could not link admin to extra company ${extraId}:`, exErr.message);
      }
    }
  }

  const primaryTenant = createdTenants[0] || {};

  res.status(201).json(new ApiResponse(201, {
    tenantId: primaryTenant.tenantId,
    companyCode: primaryTenant.companyCode,
    companyName: primaryTenant.companyName || companyName,
    database: primaryTenant.database,
    createdTenants,
    totalCompanies: createdTenants.length,
    branchesCount: numBranches,
    status: status || 'Active'
  }, `${createdTenants.length} company(ies) registered with ${numBranches} branch(es) each and dynamic database(s) provisioned successfully.`));

} catch (err) {
  for (const db of (createdDatabases || [])) {
    await masterSequelize.query(`DROP DATABASE IF EXISTS \`${db}\``).catch(() => {});
  }
  for (const t of (createdTenants || [])) {
    await masterSequelize.query(`DELETE FROM tenants WHERE id = ?`, { replacements: [t.tenantId] }).catch(() => {});
    await masterSequelize.query(`DELETE FROM company WHERE companyCode = ?`, { replacements: [t.companyCode] }).catch(() => {});
  }
  throw err;
} finally {
  if (lockAcquired) {
    await masterSequelize.query("SELECT RELEASE_LOCK('tenant_reg_atomic_lock')").catch(() => {});
  }
}
});

/**
 * Delete a company tenant completely.
 */
const deleteTenant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(400, 'Tenant ID is required.');
  }

  // Find tenant in master registry
  const [tenants] = await masterSequelize.query(
    `SELECT id, company_name, db_name FROM tenants WHERE id = ? OR db_name = ? LIMIT 1`,
    { replacements: [id, id] }
  );

  let tenantDbName = null;
  let companyName = null;
  let tenantId = id;

  if (tenants.length > 0) {
    const tenant = tenants[0];
    tenantId = tenant.id;
    tenantDbName = tenant.db_name;
    companyName = tenant.company_name;

    // 1. Evict connection pool
    await evictTenantConnection(tenantId);
    if (tenantDbName) await evictTenantConnection(tenantDbName);

    // 2. Drop physical database if exists
    if (tenantDbName) {
      try {
        await masterSequelize.query(`DROP DATABASE IF EXISTS \`${tenantDbName}\``);
        console.log(`[Superadmin] Dropped physical database '${tenantDbName}'.`);
      } catch (err) {
        console.error(`[Superadmin] Failed to drop database '${tenantDbName}':`, err.message);
      }
    }

    // 3. Remove company folder in Frontend
    if (companyName) {
      try {
        const fs = require('fs');
        const path = require('path');
        const companyFolder = path.join(__dirname, '../../Frontend/src/Company', companyName);
        if (fs.existsSync(companyFolder)) {
          fs.rmSync(companyFolder, { recursive: true, force: true });
        }
      } catch (err) {}
    }

    // 4. Delete from master tables
    await masterSequelize.query(`DELETE FROM tenants WHERE id = ?`, { replacements: [tenantId] });
    await masterSequelize.query(`DELETE FROM company WHERE companyCode = ? OR companyName = ?`, { replacements: [tenantDbName, companyName] }).catch(() => {});
  }

  res.status(200).json(new ApiResponse(200, { id: tenantId }, 'Company and database deleted successfully.'));
});

/**
 * Get comprehensive live data for a specific tenant directly from their isolated MySQL database.
 */
const getTenantLiveData = asyncHandler(async (req, res) => {
  const { companyCode } = req.params;
  if (!companyCode) {
    throw new ApiError(400, 'Company code or Tenant ID is required.');
  }

  const [tenants] = await masterSequelize.query(
    `SELECT id, id AS code, company_name AS name, db_name AS db, admin_email, status, created_at 
     FROM tenants 
     WHERE id = ? OR db_name = ? OR company_name = ? LIMIT 1`,
    { replacements: [companyCode, companyCode, companyCode] }
  );

  if (!tenants || tenants.length === 0) {
    throw new ApiError(404, `Tenant '${companyCode}' not found in master registry.`);
  }

  const tenant = tenants[0];
  const tenantDb = await getTenantConnection(tenant.id);

  let companyProfile = null;
  let employeesCount = 0;
  let departmentsCount = 0;
  let usersCount = 0;
  let attendanceTodayCount = 0;
  let branchesCount = 0;
  let recentEmployees = [];
  let departments = [];

  try {
    const compRows = await tenantDb.query(`SELECT * FROM company LIMIT 1`, { type: QueryTypes.SELECT }).catch(() => []);
    if (compRows && compRows.length > 0) companyProfile = compRows[0];
  } catch (e) {}

  try {
    const empCountRows = await tenantDb.query(`SELECT COUNT(*) as count FROM employees`, { type: QueryTypes.SELECT }).catch(() => [{ count: 0 }]);
    employeesCount = empCountRows[0]?.count || 0;
  } catch (e) {}

  try {
    const deptCountRows = await tenantDb.query(`SELECT COUNT(*) as count FROM departments`, { type: QueryTypes.SELECT }).catch(() => [{ count: 0 }]);
    departmentsCount = deptCountRows[0]?.count || 0;
  } catch (e) {}

  try {
    const userCountRows = await tenantDb.query(`SELECT COUNT(*) as count FROM users`, { type: QueryTypes.SELECT }).catch(() => [{ count: 0 }]);
    usersCount = userCountRows[0]?.count || 0;
  } catch (e) {}

  try {
    const attTodayRows = await tenantDb.query(`SELECT COUNT(*) as count FROM daily_attendance WHERE date = CURDATE()`, { type: QueryTypes.SELECT }).catch(() => [{ count: 0 }]);
    attendanceTodayCount = attTodayRows[0]?.count || 0;
  } catch (e) {}

  let branches = [];
  let transfers = [];
  let holidays = [];

  try {
    const brCountRows = await tenantDb.query(`SELECT COUNT(*) as count FROM branches WHERE deleted_at IS NULL`, { type: QueryTypes.SELECT }).catch(() => [{ count: 0 }]);
    branchesCount = brCountRows[0]?.count || 0;
  } catch (e) {}

  try {
    branches = await tenantDb.query(
      `SELECT b.*, 
        (SELECT COUNT(*) FROM employees e WHERE e.branch_id = b.id OR e.branchName = b.branch_name OR e.branch = b.branch_name) as employee_count 
       FROM branches b 
       WHERE b.deleted_at IS NULL 
       ORDER BY b.created_at DESC`,
      { type: QueryTypes.SELECT }
    ).catch(async () => {
      return await tenantDb.query(`SELECT * FROM branches ORDER BY id DESC`, { type: QueryTypes.SELECT });
    });
  } catch (e) {}

  try {
    transfers = await tenantDb.query(
      `SELECT * FROM employee_transfers ORDER BY created_at DESC LIMIT 20`,
      { type: QueryTypes.SELECT }
    ).catch(() => []);
  } catch (e) {}

  try {
    holidays = await tenantDb.query(
      `SELECT * FROM branch_holidays ORDER BY holiday_date ASC LIMIT 20`,
      { type: QueryTypes.SELECT }
    ).catch(() => []);
  } catch (e) {}

  try {
    recentEmployees = await tenantDb.query(`SELECT * FROM employees LIMIT 10`, { type: QueryTypes.SELECT }).catch(() => []);
  } catch (e) {}

  try {
    departments = await tenantDb.query(`SELECT * FROM departments LIMIT 20`, { type: QueryTypes.SELECT }).catch(() => []);
  } catch (e) {}

  res.status(200).json(new ApiResponse(200, {
    tenant: {
      id: tenant.id,
      code: tenant.code,
      name: tenant.name,
      db: tenant.db,
      adminEmail: tenant.admin_email,
      status: tenant.status,
      createdAt: tenant.created_at,
    },
    companyProfile,
    stats: {
      employeesCount,
      departmentsCount,
      usersCount,
      attendanceTodayCount,
      branchesCount: branches.length || branchesCount
    },
    branches,
    transfers,
    holidays,
    recentEmployees,
    departments,
  }, 'Live tenant data retrieved successfully.'));
});

/**
 * System metrics summary for Multi-Company & Branch Counts
 */
const getSystemCapacity = asyncHandler(async (req, res) => {
  const [rows] = await masterSequelize.query('SELECT COUNT(*) AS total FROM tenants');
  const totalCompanies = rows && rows[0] ? Number(rows[0].total) : 0;
  const maxCompanies = MAX_COMPANIES;
  const maxBranchesPerCompany = 50;

  res.status(200).json(new ApiResponse(200, {
    totalCompanies,
    maxCompanies,
    remainingCompanies: Math.max(0, maxCompanies - totalCompanies),
    isLimitReached: totalCompanies >= maxCompanies,
    maxBranchesPerCompany
  }, 'System metrics retrieved successfully.'));
});

/**
 * Fetch branches and branch count for a specific company tenant
 */
const getTenantBranches = asyncHandler(async (req, res) => {
  const { companyCode } = req.params;
  if (!companyCode) {
    throw new ApiError(400, 'Company code or Tenant ID is required.');
  }

  // Authorization check: non-superadmin can only query their own company
  const userRoleStr = String(req.user?.role?.name || req.user?.role || '').toLowerCase();
  const isSuperAdmin = userRoleStr === 'superadmin' || 
                       userRoleStr === 'admin' ||
                       req.user?.email === 'superadmin@nib.com' ||
                       req.user?.email === 'admin@nib.com' ||
                       req.user?.email === 'admin@nibinsurance.com';
  if (!isSuperAdmin) {
    const userCompany = String(req.user?.companyCode || req.user?.tenantDb || req.user?.companyName || '').toLowerCase();
    const reqCompany = String(companyCode).toLowerCase();
    let uDb = userCompany;
    let rDb = reqCompany;
    try {
      const [uRows] = await masterSequelize.query(`SELECT db_name FROM tenants WHERE id = ? OR db_name = ? OR LOWER(company_name) = ? LIMIT 1`, { replacements: [userCompany, userCompany, userCompany] });
      if (uRows && uRows.length > 0) uDb = uRows[0].db_name.toLowerCase();
      const [rRows] = await masterSequelize.query(`SELECT db_name FROM tenants WHERE id = ? OR db_name = ? OR LOWER(company_name) = ? LIMIT 1`, { replacements: [reqCompany, reqCompany, reqCompany] });
      if (rRows && rRows.length > 0) rDb = rRows[0].db_name.toLowerCase();
    } catch (e) {}

    if (uDb !== rDb) {
      throw new ApiError(403, 'Cross-company branch access denied.');
    }
  }

  const tenantDb = await getTenantConnection(companyCode);

  let branches = [];
  try {
    branches = await tenantDb.query(
      `SELECT * FROM branches WHERE deleted_at IS NULL ORDER BY created_at DESC`,
      { type: QueryTypes.SELECT }
    );
  } catch (err) {
    try {
      branches = await tenantDb.query(
        `SELECT * FROM branches ORDER BY id DESC`,
        { type: QueryTypes.SELECT }
      );
    } catch (fallbackErr) {
      branches = [];
    }
  }

  const count = branches.length;
  const maxBranches = 50;

  res.status(200).json(new ApiResponse(200, {
    companyCode,
    branches,
    count,
    maxBranches,
    remainingBranches: Math.max(0, maxBranches - count),
    isLimitReached: count >= maxBranches
  }, 'Tenant branches retrieved successfully.'));
});

/**
 * Add a branch to an existing company (enforcing max 50 branches limit with atomic lock)
 */
const addTenantBranch = asyncHandler(async (req, res) => {
  const { companyCode } = req.params;
  const {
    branchName,
    branch_name,
    branchCode,
    branch_code,
    branchType,
    branch_type = 'Branch',
    address = '',
    city = '',
    state = '',
    pincode = '',
    manager = '',
    email = '',
    phone = '',
    status = 'Active'
  } = req.body;

  const finalName = (branchName || branch_name || '').trim();
  const finalCode = (branchCode || branch_code || '').trim().toUpperCase();

  if (!finalName) {
    throw new ApiError(400, 'Branch Name is required.');
  }
  if (!finalCode) {
    throw new ApiError(400, 'Branch Code is required.');
  }

  // Authorization check: non-superadmin can only add branch to their own company
  const userRoleStr = String(req.user?.role?.name || req.user?.role || '').toLowerCase();
  const isSuperAdmin = userRoleStr === 'superadmin' || 
                       userRoleStr === 'admin' ||
                       req.user?.email === 'superadmin@nib.com' ||
                       req.user?.email === 'admin@nib.com' ||
                       req.user?.email === 'admin@nibinsurance.com';
  if (!isSuperAdmin) {
    const userCompany = String(req.user?.companyCode || req.user?.tenantDb || req.user?.companyName || '').toLowerCase();
    const reqCompany = String(companyCode).toLowerCase();
    let uDb = userCompany;
    let rDb = reqCompany;
    try {
      const [uRows] = await masterSequelize.query(`SELECT db_name FROM tenants WHERE id = ? OR db_name = ? OR LOWER(company_name) = ? LIMIT 1`, { replacements: [userCompany, userCompany, userCompany] });
      if (uRows && uRows.length > 0) uDb = uRows[0].db_name.toLowerCase();
      const [rRows] = await masterSequelize.query(`SELECT db_name FROM tenants WHERE id = ? OR db_name = ? OR LOWER(company_name) = ? LIMIT 1`, { replacements: [reqCompany, reqCompany, reqCompany] });
      if (rRows && rRows.length > 0) rDb = rRows[0].db_name.toLowerCase();
    } catch (e) {}

    if (uDb !== rDb) {
      throw new ApiError(403, 'Cross-company branch creation denied.');
    }
  }

  const tenantDb = await getTenantConnection(companyCode);

  // Concurrency-safe lock for branch creation
  const branchLockKey = `branch_reg_${String(companyCode).replace(/[^a-zA-Z0-9_]/g, '')}`.slice(0, 60);
  let lockAcquired = false;

  try {
    const [lockRes] = await masterSequelize.query("SELECT GET_LOCK(?, 10) AS locked", { replacements: [branchLockKey] });
    lockAcquired = lockRes && lockRes[0] && lockRes[0].locked === 1;

    // 1. Authoritative check: verify current branch count < 50
    let countResult = [];
    try {
      countResult = await tenantDb.query(
        `SELECT COUNT(*) AS total FROM branches WHERE deleted_at IS NULL`,
        { type: QueryTypes.SELECT }
      );
    } catch (e) {
      countResult = await tenantDb.query(`SELECT COUNT(*) AS total FROM branches`, { type: QueryTypes.SELECT });
    }

    const currentCount = countResult && countResult[0] ? Number(countResult[0].total) : 0;
    if (currentCount >= 50) {
      throw new ApiError(400, `Maximum limit of 50 branches has been reached for this company (${currentCount}/50).`);
    }

    // 2. Authoritative check: unique branch_code
    let existingCode = [];
    try {
      existingCode = await tenantDb.query(
        `SELECT id FROM branches WHERE (branch_code = :code OR branchCode = :code) AND deleted_at IS NULL LIMIT 1`,
        { replacements: { code: finalCode }, type: QueryTypes.SELECT }
      );
    } catch (e) {
      existingCode = await tenantDb.query(
        `SELECT id FROM branches WHERE branch_code = :code LIMIT 1`,
        { replacements: { code: finalCode }, type: QueryTypes.SELECT }
      );
    }

    if (existingCode && existingCode.length > 0) {
      throw new ApiError(400, `Branch code '${finalCode}' already exists in this company.`);
    }

    const branchId = crypto.randomUUID();
    await tenantDb.query(`
      INSERT INTO branches (
        id, branch_code, branch_name, branch_type, branchCode, branchName, branchType,
        address, city, state, pincode, manager, email, phone, status, created_at, updated_at
      ) VALUES (
        :id, :code, :name, :type, :code, :name, :type,
        :address, :city, :state, :pincode, :manager, :email, :phone, :status, NOW(), NOW()
      )
    `, {
      replacements: {
        id: branchId,
        code: finalCode,
        name: finalName,
        type: branchType || branch_type || 'Branch',
        address,
        city,
        state,
        pincode,
        manager,
        email,
        phone,
        status
      }
    });

    const [newBranchRows] = await tenantDb.query(
      `SELECT * FROM branches WHERE id = :id LIMIT 1`,
      { replacements: { id: branchId }, type: QueryTypes.SELECT }
    );

    res.status(201).json(new ApiResponse(201, newBranchRows || { id: branchId, branch_code: finalCode, branch_name: finalName }, 'Branch created successfully.'));

  } finally {
    if (lockAcquired) {
      await masterSequelize.query("SELECT RELEASE_LOCK(?)", { replacements: [branchLockKey] }).catch(() => {});
    }
  }
});

/**
 * Toggle branch status (Active / Inactive) for a specific company tenant
 */
const toggleTenantBranchStatus = asyncHandler(async (req, res) => {
  const { companyCode, branchId } = req.params;
  const { status } = req.body;

  const [tenants] = await masterSequelize.query(
    `SELECT db_name FROM tenants WHERE id = ? OR company_name = ? LIMIT 1`,
    { replacements: [companyCode, companyCode] }
  );

  if (!tenants || tenants.length === 0) {
    throw new ApiError(404, 'Company tenant not found.');
  }

  const tenantDbName = tenants[0].db_name;

  const [branchRows] = await masterSequelize.query(
    `SELECT id, branch_name, branchName, status FROM \`${tenantDbName}\`.branches WHERE id = ? LIMIT 1`,
    { replacements: [branchId] }
  );

  if (!branchRows || branchRows.length === 0) {
    throw new ApiError(404, 'Branch not found in tenant database.');
  }

  const currentStatus = branchRows[0].status || 'Active';
  const newStatus = status ? status : (currentStatus === 'Active' ? 'Inactive' : 'Active');

  await masterSequelize.query(
    `UPDATE \`${tenantDbName}\`.branches SET status = ?, updated_at = NOW() WHERE id = ?`,
    { replacements: [newStatus, branchId] }
  );

  res.status(200).json(new ApiResponse(200, {
    branchId,
    previousStatus: currentStatus,
    status: newStatus
  }, `Branch status updated to ${newStatus} successfully.`));
});

module.exports = {
  getTenants,
  createTenant,
  deleteTenant,
  getTenantLiveData,
  getSystemCapacity,
  getTenantBranches,
  addTenantBranch,
  toggleTenantBranchStatus
};
