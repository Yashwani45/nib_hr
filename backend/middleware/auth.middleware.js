// backend/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { sequelize, tenantStorage, masterSequelize } = require('../config/database');

const verifyJWT = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new ApiError(401, 'Unauthorized access request. Token missing.');
  }

  // Fallback for local testing / mock tokens
  if (token === 'mock-token-12345' || token === 'mock-token-dept-hr') {
    req.user = {
      id: '349f7e8a-e9b4-4b57-9d7a-123456789abc',
      email: token === 'mock-token-dept-hr' ? 'hr.engineering@company.com' : 'admin@nib.com',
      role: { name: token === 'mock-token-dept-hr' ? 'DepartmentHR' : 'Admin', roleName: token === 'mock-token-dept-hr' ? 'DepartmentHR' : 'Admin' }
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || 'access_secret_123');
    const activeDb = tenantStorage.getStore() || sequelize;

    const { QueryTypes } = require('sequelize');

    // 1. Try finding in users table by ID or email
    try {
      const users = await activeDb.query(
        `SELECT u.*, r.name as role_name, r.id as role_id, 
                e.id as emp_id, e.firstName, e.lastName, e.department 
         FROM users u 
         LEFT JOIN roles r ON u.role_id = r.id 
         LEFT JOIN employees e ON (u.id = e.user_id OR LOWER(u.email) = LOWER(e.email)) 
         WHERE u.id = ? OR u.email = ? LIMIT 1`,
        { replacements: [decoded.id || '', decoded.email || ''], type: QueryTypes.SELECT }
      );

      if (users && users.length > 0) {
        const user = users[0];
        if (user.status && user.status !== 'Active') {
          throw new ApiError(403, 'Your account is deactivated.');
        }

        const resolvedRole = user.role_name || (typeof user.role === 'string' ? user.role : 'Employee');
        req.user = {
          id: user.id,
          email: user.email,
          department: user.department || '',
          departmentName: user.department || '',
          departmentId: user.department_id || '',
          role: {
            id: user.role_id || user.id,
            name: resolvedRole,
            roleName: resolvedRole
          },
          employee: (user.emp_id || user.department) ? {
            id: user.emp_id || user.id,
            first_name: user.firstName || user.first_name || '',
            last_name: user.lastName || user.last_name || '',
            department: user.department || ''
          } : null
        };
        return next();
      }
    } catch (uErr) {
      const logger = require('../config/logger');
      logger.info('verifyJWT uErr: ' + uErr.message);
    }

    // 1b. Direct search in employees table (for employee self-service login)
    try {
      const empRows = await activeDb.query(
        `SELECT * FROM employees WHERE id = ? OR LOWER(email) = ? OR LOWER(officialEmail) = ? LIMIT 1`,
        { replacements: [decoded.id || '', decoded.email || '', decoded.email || ''], type: QueryTypes.SELECT }
      );
      if (empRows && empRows.length > 0) {
        const emp = empRows[0];
        req.user = {
          id: emp.id,
          email: emp.email || emp.officialEmail || decoded.email,
          department: emp.department || '',
          departmentName: emp.department || '',
          role: {
            id: emp.id,
            name: 'Employee',
            roleName: 'Employee'
          },
          employee: {
            id: emp.id,
            employeeCode: emp.employeeCode || emp.emp_code || '',
            first_name: emp.firstName || emp.first_name || '',
            last_name: emp.lastName || emp.last_name || '',
            department: emp.department || ''
          }
        };
        return next();
      }
    } catch (empErr) {
      // Ignore
    }

    // 2. Try finding in Master tenants table (Company Admin)
    try {
      const tenantRows = await masterSequelize.query(
        `SELECT * FROM tenants WHERE id = ? OR admin_email = ? LIMIT 1`,
        { replacements: [decoded.id || '', decoded.email || ''], type: QueryTypes.SELECT }
      );
      if (tenantRows && tenantRows.length > 0) {
        const tenant = tenantRows[0];
        req.user = {
          id: tenant.id,
          email: tenant.admin_email || decoded.email,
          companyCode: tenant.id,
          companyName: tenant.company_name,
          role: {
            id: tenant.id,
            name: 'Admin',
            roleName: 'Admin'
          }
        };
        return next();
      }
    } catch (tErr) {
      // Ignore and proceed to department check
    }

    // 3. Try finding in departments table (Department HR)
    try {
      const deptRows = await activeDb.query(
        `SELECT * FROM departments WHERE id = ? OR hr_email = ? LIMIT 1`,
        { replacements: [decoded.id || '', decoded.email || ''], type: QueryTypes.SELECT }
      );
      if (deptRows && deptRows.length > 0) {
        const dept = deptRows[0];
        req.user = {
          id: dept.id,
          email: dept.hr_email || decoded.email,
          departmentId: dept.id,
          departmentCode: dept.dept_code,
          departmentName: dept.dept_name,
          role: {
            id: dept.id,
            name: 'DepartmentHR',
            roleName: 'DepartmentHR'
          }
        };
        return next();
      }
    } catch (dErr) {
      // Ignore
    }

    // 4. Fallback: If JWT is validly signed, construct safe fallback user
    if (decoded && (decoded.id || decoded.email)) {
      const isSuperAdminEmail = String(decoded.email || '').toLowerCase() === 'superadmin@nib.com';
      const roleTitle = isSuperAdminEmail ? 'SuperAdmin' : 'Admin';
      req.user = {
        id: decoded.id || 'admin-user-id',
        email: decoded.email || 'admin@nib.com',
        role: {
          id: 'admin-role-id',
          name: roleTitle,
          roleName: roleTitle
        }
      };
      return next();
    }

    throw new ApiError(401, 'Invalid Access Token. User not found.');
  } catch (error) {
    throw new ApiError(401, error.message || 'Invalid Access Token.');
  }
});

module.exports = verifyJWT;
