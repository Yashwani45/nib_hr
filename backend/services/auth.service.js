// backend/services/auth.service.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const ApiError = require('../utils/apiError');
const { sequelize, tenantStorage } = require('../config/database');
const logger = require('../config/logger');

const { QueryTypes } = require('sequelize');

class AuthService {
  generateTokens(user) {
    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.ACCESS_TOKEN_SECRET || 'access_secret_123',
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET || 'refresh_secret_123',
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  async isEmailRegisteredGlobally(email, excludeUserId = null) {
    if (!email || String(email).trim() === '') return false;

    const { masterSequelize } = require('../config/database');
    const { getTenantConnection } = require('../config/connectionManager');

    const cleanEmail = String(email).trim().toLowerCase();

    // 1. Check in master database (tenants registry admin_email)
    const tenants = await masterSequelize.query(
      `SELECT id FROM tenants WHERE LOWER(admin_email) = ? LIMIT 1`,
      { replacements: [cleanEmail], type: QueryTypes.SELECT }
    );
    if (tenants && tenants.length > 0) return true;

    // 2. Check in master database (users table)
    let masterQuery = `SELECT id FROM users WHERE LOWER(email) = ?`;
    const masterReplacements = [cleanEmail];
    if (excludeUserId) {
      masterQuery += ` AND id != ?`;
      masterReplacements.push(excludeUserId);
    }
    masterQuery += ` LIMIT 1`;

    const masterUsers = await masterSequelize.query(
      masterQuery,
      { replacements: masterReplacements, type: QueryTypes.SELECT }
    );
    if (masterUsers && masterUsers.length > 0) return true;

    // 3. Check in master database (departments table hr_email)
    const masterDepts = await masterSequelize.query(
      `SELECT id FROM departments WHERE LOWER(hr_email) = ? LIMIT 1`,
      { replacements: [cleanEmail], type: QueryTypes.SELECT }
    );
    if (masterDepts && masterDepts.length > 0) {
      // Self-healing check: Verify if this department actively exists in any tenant database.
      // If it has been deleted from tenant DBs, it is an orphan and should not falsely block registration.
      let existsInAnyTenant = false;
      const allTenants = await masterSequelize.query(
        `SELECT id, db_name FROM tenants`,
        { type: QueryTypes.SELECT }
      ).catch(() => []);

      for (const t of allTenants) {
        try {
          const conn = await getTenantConnection(t.id);
          const tDepts = await conn.query(
            `SELECT id FROM departments WHERE LOWER(hr_email) = ? LIMIT 1`,
            { replacements: [cleanEmail], type: QueryTypes.SELECT }
          );
          if (tDepts && tDepts.length > 0) {
            existsInAnyTenant = true;
            break;
          }
        } catch (e) {}
      }

      if (existsInAnyTenant) {
        return true;
      } else {
        // Auto-heal orphaned record in masterSequelize
        try {
          await masterSequelize.query(`DELETE FROM departments WHERE LOWER(hr_email) = ?`, { replacements: [cleanEmail] });
          await masterSequelize.query(`DELETE FROM department WHERE LOWER(hr_email) = ?`, { replacements: [cleanEmail] });
        } catch (delErr) {}
      }
    }

    // 4. Check in all registered tenants' databases
    const allTenants = await masterSequelize.query(
      `SELECT id, db_name FROM tenants`,
      { type: QueryTypes.SELECT }
    );
    for (const t of allTenants) {
      try {
        const conn = await getTenantConnection(t.id);
        // Check users table in tenant DB
        let tQuery = `SELECT id FROM users WHERE LOWER(email) = ?`;
        const tReplacements = [cleanEmail];
        if (excludeUserId) {
          tQuery += ` AND id != ?`;
          tReplacements.push(excludeUserId);
        }
        tQuery += ` LIMIT 1`;

        const tUsers = await conn.query(
          tQuery,
          { replacements: tReplacements, type: QueryTypes.SELECT }
        );
        if (tUsers && tUsers.length > 0) return true;

        // Check departments table (hr_email) in tenant DB
        const tDepts = await conn.query(
          `SELECT id FROM departments WHERE LOWER(hr_email) = ? LIMIT 1`,
          { replacements: [cleanEmail], type: QueryTypes.SELECT }
        );
        if (tDepts && tDepts.length > 0) return true;
      } catch (e) {
        // Ignore if database or table doesn't exist
      }
    }

    return false;
  }

  async register(email, password, roleName = 'Employee') {
    const activeDb = tenantStorage.getStore() || sequelize;

    // 1. Check if user already exists globally
    if (await this.isEmailRegisteredGlobally(email)) {
      throw new ApiError(400, 'This email is already exists.');
    }

    // 2. Fetch role details
    const [roles] = await activeDb.query(
      `SELECT id, name FROM roles WHERE name = ? LIMIT 1`,
      { replacements: [roleName], type: QueryTypes.SELECT }
    );
    if (!roles) {
      throw new ApiError(400, `Requested role '${roleName}' does not exist.`);
    }

    // 3. Create user
    const newUserId = require('crypto').randomUUID();
    const hashedPassword = await bcrypt.hash(password, 10);
    const { accessToken, refreshToken } = this.generateTokens({ id: newUserId, email });

    await activeDb.query(
      `INSERT INTO users (id, email, password, role_id, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, 'Active', NOW(), NOW())`,
      { replacements: [newUserId, email, hashedPassword, roles.id] }
    );

    return {
      userId: newUserId,
      email,
      role: roles.name,
      accessToken,
      refreshToken,
    };
  }

  async login(email, password, companyCode) {
    const { masterSequelize, tenantStorage, sequelize } = require('../config/database');
    const { getTenantConnection } = require('../config/connectionManager');

    const cleanEmail = String(email).trim().toLowerCase();

    // 1. First search for the email in the Master database (system_master_db.users)
    const [masterUser] = await masterSequelize.query(
      `SELECT u.*, r.name as role_name, r.id as role_id 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE LOWER(u.email) = ? AND u.status = 'Active' LIMIT 1`,
      { replacements: [cleanEmail], type: QueryTypes.SELECT }
    );

    if (masterUser) {
      const isPasswordValid = await bcrypt.compare(password, masterUser.password);
      if (isPasswordValid) {
        const { accessToken, refreshToken } = this.generateTokens(masterUser);
        await masterSequelize.query(
          `UPDATE users SET last_login = NOW() WHERE id = ?`,
          { replacements: [masterUser.id] }
        );
        return {
          userId: masterUser.id,
          email: masterUser.email,
          role: masterUser.role_name,
          companyCode: 'NIB',
          companyName: 'NIB Master Operations',
          accessToken,
          refreshToken,
        };
      } else {
        throw new ApiError(401, 'Invalid email or password.');
      }
    }

    // 2. Next, check if it matches a Tenant Admin in the master database tenants table
    const [tenantAdmin] = await masterSequelize.query(
      `SELECT * FROM tenants WHERE LOWER(admin_email) = ? AND status = 'Active' LIMIT 1`,
      { replacements: [cleanEmail], type: QueryTypes.SELECT }
    );

    if (tenantAdmin) {
      let isValidAdmin = false;
      if (tenantAdmin.admin_password) {
        if (tenantAdmin.admin_password.startsWith('$2')) {
          isValidAdmin = await bcrypt.compare(password, tenantAdmin.admin_password);
        } else {
          isValidAdmin = (tenantAdmin.admin_password === password);
        }
      }

      if (isValidAdmin) {
        const { accessToken, refreshToken } = this.generateTokens({ id: tenantAdmin.id, email: tenantAdmin.admin_email });
        const adminDisplayName = tenantAdmin.admin_name || 'Rahul Sharma';
        return {
          userId: tenantAdmin.id,
          name: adminDisplayName,
          employeeName: adminDisplayName,
          email: tenantAdmin.admin_email,
          role: 'Admin',
          companyCode: tenantAdmin.id,
          companyName: tenantAdmin.company_name,
          departmentId: 'dept_admin_01',
          departmentCode: 'ADMIN',
          departmentName: 'Administration',
          accessToken,
          refreshToken
        };
      } else {
        throw new ApiError(401, 'Invalid email or password.');
      }
    }

    // 3. Search for the email inside each Tenant isolated database
    const allTenants = await masterSequelize.query(
      `SELECT id, db_name, company_name FROM tenants WHERE status = 'Active'`,
      { type: QueryTypes.SELECT }
    );

    for (const tenant of allTenants) {
      try {
        const tenantDb = await getTenantConnection(tenant.id);
        
        // Search inside tenant users table
        const [tenantUser] = await tenantDb.query(
          `SELECT u.*, r.name as role_name, r.id as role_id 
           FROM users u 
           LEFT JOIN roles r ON u.role_id = r.id 
           WHERE LOWER(u.email) = ? AND u.status = 'Active' LIMIT 1`,
          { replacements: [cleanEmail], type: QueryTypes.SELECT }
        );

        if (tenantUser) {
          const isPasswordValid = await bcrypt.compare(password, tenantUser.password);
          if (isPasswordValid) {
            const { accessToken, refreshToken } = this.generateTokens(tenantUser);
            await tenantDb.query(
              `UPDATE users SET last_login = NOW() WHERE id = ?`,
              { replacements: [tenantUser.id] }
            );

             // Fetch assigned department and employee info from employees table if available
             const [empInfo] = await tenantDb.query(
               `SELECT employee_name, first_name, last_name, department, profileStatus, profileCompletion FROM employees WHERE LOWER(email) = ? OR LOWER(company_email) = ? LIMIT 1`,
               { replacements: [cleanEmail, cleanEmail], type: QueryTypes.SELECT }
             ).catch(() => [null]);

             const resolvedName = empInfo?.employee_name || (empInfo?.first_name ? `${empInfo.first_name} ${empInfo.last_name || ''}`.trim() : null) || tenantUser.username || tenantUser.name || (tenantUser.role_name === 'Admin' ? 'Rahul Sharma' : tenantUser.email.split('@')[0]);

             return {
               userId: tenantUser.id,
               name: resolvedName,
               employeeName: resolvedName,
               email: tenantUser.email,
               role: tenantUser.role_name,
               departmentName: empInfo?.department || 'General Staff',
               profileStatus: empInfo?.profileStatus || 'Profile Incomplete',
               profileCompletion: empInfo?.profileCompletion !== undefined && empInfo?.profileCompletion !== null ? Number(empInfo.profileCompletion) : 0,
               companyCode: tenant.id,
               companyName: tenant.company_name,
               accessToken,
               refreshToken,
             };
           } else {
             throw new ApiError(401, 'Invalid email or password.');
           }
         }
 
         // Direct search inside tenant employees table (if user created directly via Add Employee)
         const [empRecord] = await tenantDb.query(
           `SELECT * FROM employees WHERE LOWER(email) = ? OR LOWER(company_email) = ? LIMIT 1`,
           { replacements: [cleanEmail, cleanEmail], type: QueryTypes.SELECT }
         ).catch(() => [null]);
 
         if (empRecord) {
           let isValidPassword = false;
           if (empRecord.password) {
             if (empRecord.password.startsWith('$2')) {
               isValidPassword = await bcrypt.compare(password, empRecord.password);
             } else {
               isValidPassword = (empRecord.password === password);
             }
           }
 
           if (isValidPassword) {
             const empEmail = empRecord.email || empRecord.company_email;
             const { accessToken, refreshToken } = this.generateTokens({ id: empRecord.id, email: empEmail });
             return {
               userId: empRecord.id,
               email: empEmail,
               employeeName: empRecord.employee_name || empRecord.first_name || 'Employee',
               role: 'Employee',
               departmentName: empRecord.department || 'General Staff',
               profileStatus: empRecord.profileStatus || 'Profile Incomplete',
               profileCompletion: empRecord.profileCompletion !== undefined && empRecord.profileCompletion !== null ? Number(empRecord.profileCompletion) : 0,
               companyCode: tenant.id,
               companyName: tenant.company_name,
               accessToken,
               refreshToken,
             };
          } else {
            throw new ApiError(401, 'Invalid email or password.');
          }
        }

        // Search inside tenant departments table for Department HR
        const [deptHr] = await tenantDb.query(
          `SELECT * FROM departments WHERE LOWER(hr_email) = ? AND (status IS NULL OR status = 'Active' OR status = '') LIMIT 1`,
          { replacements: [cleanEmail], type: QueryTypes.SELECT }
        );

        if (deptHr) {
          let isValidHp = deptHr.hr_password === password;
          if (!isValidHp && deptHr.hr_password && deptHr.hr_password.startsWith('$2')) {
            isValidHp = await bcrypt.compare(password, deptHr.hr_password);
          }

          if (isValidHp) {
            const { accessToken, refreshToken } = this.generateTokens({ id: deptHr.id, email: deptHr.hr_email });
            let modulesList = [];
            try {
              modulesList = typeof deptHr.assigned_modules === 'string' ? JSON.parse(deptHr.assigned_modules) : (deptHr.assigned_modules || []);
            } catch (e) {}
            if (!Array.isArray(modulesList) || modulesList.length === 0) {
              modulesList = [
                "Dashboard", "Organization Setup", "Employee Management", "Recruitment & Onboarding",
                "Attendance", "Leave Management", "Payroll", "Performance", "Learning",
                "Asset Management", "Document Management", "Employee Exit", "Workflow & Approval",
                "Employee Engagement", "Helpdesk", "Reports", "Notifications", "Departments",
                "Settings", "Profile"
              ];
            }

            const deptDisplayName = `${deptHr.dept_name} HR`;
            return {
              userId: deptHr.id,
              name: deptDisplayName,
              employeeName: deptDisplayName,
              email: deptHr.hr_email,
              role: 'DepartmentHR',
              departmentId: deptHr.id,
              departmentCode: deptHr.dept_code,
              departmentName: deptHr.dept_name,
              companyCode: tenant.id,
              companyName: tenant.company_name,
              assignedModules: modulesList,
              accessToken,
              refreshToken
            };
          } else {
            throw new ApiError(401, 'Invalid email or password.');
          }
        }
      } catch (err) {
        // Keep searching other databases if one fails
      }
    }

    throw new ApiError(401, 'Invalid email or password.');
  }

  async refresh(token) {
    if (!token) {
      throw new ApiError(400, 'Refresh Token is required.');
    }

    try {
      const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || 'refresh_secret_123');
      const activeDb = tenantStorage.getStore() || sequelize;

      // Fetch user details dynamically
      const [user] = await activeDb.query(
        `SELECT id, email, status FROM users WHERE id = ? AND status = 'Active' LIMIT 1`,
        { replacements: [decoded.id], type: QueryTypes.SELECT }
      );

      if (!user) {
        throw new ApiError(401, 'Invalid or expired Refresh Token.');
      }

      // Generate new tokens (stateless JWT, no DB storage required)
      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(user);

      return { accessToken, refreshToken: newRefreshToken };
    } catch (err) {
      throw new ApiError(401, 'Invalid Refresh Token.');
    }
  }

  async logout(userId) {
    return true;
  }
}

module.exports = new AuthService();
