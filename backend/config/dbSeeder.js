// backend/config/dbSeeder.js
const logger = require('./logger');
const { Role, User, Branch, Department, Employee } = require('../models');

/**
 * Seeds default roles, branches, departments, designations, shifts, users, and employee profiles
 * inside the newly synchronized tenant database connection.
 * 
 * @param {Sequelize} tenantDb - Active tenant Sequelize database instance
 */
const seedTenantDB = async (tenantDb) => {
  try {


    
    // Self-healing migrations: Ensure users table has correct columns to map model associations
    try {
      await tenantDb.query('ALTER TABLE users ADD COLUMN role_id CHAR(36) NULL');
      logger.info('[Migration] Added missing role_id column to users table.');
    } catch (e) {
      // Ignore error if column already exists
    }

    try {
      await tenantDb.query('ALTER TABLE users ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP');
    } catch (e) {}

    try {
      await tenantDb.query('ALTER TABLE users ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    } catch (e) {}

    try {
      await tenantDb.query('ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL');
    } catch (e) {}

    // Department table migrations for HR credentials & module mapping
    try {
      await tenantDb.query('ALTER TABLE departments ADD COLUMN hr_email VARCHAR(150) NULL');
    } catch (e) {}
    try {
      await tenantDb.query('ALTER TABLE departments ADD COLUMN hr_password VARCHAR(255) NULL');
    } catch (e) {}
    try {
      await tenantDb.query('ALTER TABLE departments ADD COLUMN assigned_modules JSON NULL');
    } catch (e) {}

    // Ensure designations table exists to satisfy foreign key constraints
    try {
      await tenantDb.query("UPDATE designations SET updated_at = NOW() WHERE updated_at IS NULL OR updated_at = '0000-00-00 00:00:00'");
    } catch (e) {}

    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS designations (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure shifts table exists to satisfy foreign key constraints
    await tenantDb.query(`
      CREATE TABLE IF NOT EXISTS shifts (
        id CHAR(36) NOT NULL,
        name VARCHAR(100) NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 1. Seed Roles
    const [superAdminRole] = await Role.findOrCreate({
      where: { roleName: 'SuperAdmin' },
      defaults: { description: 'SaaS Platform Owner with unrestricted global administrative access.' }
    });

    const [adminRole] = await Role.findOrCreate({
      where: { roleName: 'Admin' },
      defaults: { description: 'Company HR Administrator with full organizational command.' }
    });

    const [managerRole] = await Role.findOrCreate({
      where: { roleName: 'Manager' },
      defaults: { description: 'Department Manager with reporting hierarchy privileges.' }
    });

    const [employeeRole] = await Role.findOrCreate({
      where: { roleName: 'Employee' },
      defaults: { description: 'Regular employee with self-service dashboard portal.' }
    });

    // 2. Seed Default Branch
    const [branch] = await Branch.findOrCreate({
      where: { branchCode: 'NIB-HO' },
      defaults: {
        branchName: 'NIB Head Office',
        address: 'B-45, Phase III, Okhla Industrial Area',
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        timezone: 'IST',
        status: 'Active'
      }
    });

    // 3. Purge legacy default department rows (ADMIN / Administration / DEPT-GEN)
    try {
      await tenantDb.query("DELETE FROM departments WHERE dept_code = 'DEPT-GEN' OR dept_name = 'General Administration' OR dept_code = 'ADMIN' OR dept_name = 'Administration'");
    } catch (e) {}

    // Define seed profiles mapping
    const userSeeds = [
      { email: 'superadmin@nib.com', roleId: superAdminRole.id, roleName: 'SuperAdmin', empCode: 'EMP001', firstName: 'Super', lastName: 'Admin' },
      { email: 'admin@nib.com', roleId: adminRole.id, roleName: 'Admin', empCode: 'EMP002', firstName: 'HR', lastName: 'Admin' },
      { email: 'manager@nib.com', roleId: managerRole.id, roleName: 'Manager', empCode: 'EMP003', firstName: 'Team', lastName: 'Manager' },
      { email: 'employee@nib.com', roleId: employeeRole.id, roleName: 'Employee', empCode: 'EMP004', firstName: 'Standard', lastName: 'Employee' }
    ];

    // 4. Seed Designations and Shifts via raw SQL to satisfy foreign keys
    for (const seed of userSeeds) {
      try {
        await tenantDb.query(`
          INSERT INTO designations (id, desig_code, desig_name, status, created_at, updated_at)
          VALUES (:id, :code, :name, 'Active', NOW(), NOW())
          ON DUPLICATE KEY UPDATE desig_name = :name, updated_at = NOW()
        `, { replacements: { id: seed.roleId, code: 'DES-' + seed.roleName.substring(0, 3).toUpperCase(), name: seed.roleName + ' Designation' } });
      } catch (desigErr) {
        // Fallback for legacy designation table structure if desig_name doesn't exist yet
        await tenantDb.query(`
          INSERT INTO designations (id, name, status)
          VALUES (:id, :name, 'Active')
          ON DUPLICATE KEY UPDATE name = :name
        `, { replacements: { id: seed.roleId, name: seed.roleName + ' Designation' } }).catch(() => {});
      }

      await tenantDb.query(`
        INSERT INTO shifts (id, name, start_time, end_time, status)
        VALUES (:id, :name, '09:00:00', '17:30:00', 'Active')
        ON DUPLICATE KEY UPDATE name = :name
      `, { replacements: { id: seed.roleId, name: seed.roleName + ' Shift' } });
    }

    // 5. Seed Users & Employee Profiles
    for (const seed of userSeeds) {
      // Find or create User. Pass raw password string to trigger model bcrypt creation hook exactly once
      let user = await User.findOne({ where: { email: seed.email } });
      let created = false;

      if (!user) {
        user = await User.create({
          email: seed.email,
          password: 'securepassword',
          roleId: seed.roleId,
          status: 'Active'
        });
        created = true;
      } else {
        // Force update password to guarantee matches 'securepassword' if tables were polluted
        user.password = 'securepassword';
        user.roleId = seed.roleId;
        user.status = 'Active';
        await user.save();
      }

      if (created || !(await Employee.findOne({ where: { email: user.email } }))) {
        // Create matching Employee Profile
        await Employee.create({
          id: require('crypto').randomUUID(),
          employeeName: (seed.firstName + ' ' + seed.lastName).trim(),
          email: seed.email,
          department: seed.roleName === 'SuperAdmin' ? 'Administration' : 'IT'
        }).catch(err => {
          logger.warn(`[Seeder Warning] Failed to seed employee profile for '${seed.email}': ` + err.message);
        });
      }
    }

    // Seed Professional Tax Rules
    try {
      const [ptCount] = await tenantDb.query("SELECT COUNT(*) as count FROM professional_tax_rules");
      if (ptCount && ptCount.length > 0 && ptCount[0].count === 0) {
        await tenantDb.query(`
          INSERT INTO professional_tax_rules (id, state, min_salary, max_salary, tax_amount, effective_from, created_at, updated_at) VALUES
          (UUID(), 'Maharashtra', 0.00, 7500.00, 0.00, '2026-04-01', NOW(), NOW()),
          (UUID(), 'Maharashtra', 7501.00, 10000.00, 175.00, '2026-04-01', NOW(), NOW()),
          (UUID(), 'Maharashtra', 10001.00, 9999999.00, 200.00, '2026-04-01', NOW(), NOW()),
          (UUID(), 'Karnataka', 0.00, 25000.00, 0.00, '2026-04-01', NOW(), NOW()),
          (UUID(), 'Karnataka', 25001.00, 9999999.00, 200.00, '2026-04-01', NOW(), NOW()),
          (UUID(), 'Tamil Nadu', 0.00, 12000.00, 0.00, '2026-04-01', NOW(), NOW()),
          (UUID(), 'Tamil Nadu', 12001.00, 30000.00, 185.00, '2026-04-01', NOW(), NOW()),
          (UUID(), 'Tamil Nadu', 30001.00, 9999999.00, 200.00, '2026-04-01', NOW(), NOW())
        `);
        logger.info('[Seeder] Default Professional Tax rules seeded.');
      }
    } catch (ptSeederErr) {
      logger.warn('[Seeder Warning] Professional Tax rules seeding skipped: ' + ptSeederErr.message);
    }

    logger.info(`[Multi-Tenant Seeder] Finished seeding test accounts inside target database.`);

  } catch (err) {
    logger.error(`[Multi-Tenant Seeder Error] Failed to seed tenant database: ` + err.message);
  }
};

module.exports = {
  seedTenantDB
};
