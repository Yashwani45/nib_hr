// backend/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { sequelize, tenantStorage, masterSequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

// Dynamically resolve tenant identifier into canonical database name from master database
async function resolveTenantDbName(val) {
  if (!val) return '';
  const s = String(val).trim();
  try {
    const [rows] = await masterSequelize.query(
      `SELECT db_name FROM tenants WHERE id = ? OR db_name = ? OR LOWER(company_name) = ? LIMIT 1`,
      { replacements: [s, s, s.toLowerCase()] }
    );
    if (rows && rows.length > 0) {
      return rows[0].db_name.toLowerCase();
    }
  } catch (e) {}
  return s.toLowerCase().replace(/[^a-z0-9_]/g, '');
}

// Compare company codes dynamically for tenant isolation
async function isTenantMatch(userTenant, requestTenant) {
  if (!userTenant || !requestTenant) return true;
  const u = await resolveTenantDbName(userTenant);
  const r = await resolveTenantDbName(requestTenant);
  if (u === r) return true;
  if (u === 'system_master_db' || r === 'system_master_db') return true;
  return false;
}

const verifyJWT = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new ApiError(401, 'Unauthorized access request. Token missing.');
  }

  // Strictly restrict mock tokens to test environment (automated test suites)
  if (process.env.NODE_ENV === 'test') {
    if (token === 'mock-token-12345' || token === 'mock-token-dept-hr') {
      req.user = {
        id: '349f7e8a-e9b4-4b57-9d7a-123456789abc',
        email: token === 'mock-token-dept-hr' ? 'hr.engineering@company.com' : 'admin@nib.com',
        role: { name: token === 'mock-token-dept-hr' ? 'DepartmentHR' : 'Admin', roleName: token === 'mock-token-dept-hr' ? 'DepartmentHR' : 'Admin' },
        hasCompanyWideAccess: token !== 'mock-token-dept-hr'
      };
      return next();
    }
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || 'access_secret_123');
    const activeDb = tenantStorage.getStore() || sequelize;

    let authenticatedUser = null;

    // 0. SuperAdmin priority check in Master DB
    const isSuperAdminCandidate = 
      decoded.role === 'SuperAdmin' || 
      decoded.roleName === 'SuperAdmin' || 
      decoded.role?.name === 'SuperAdmin' || 
      decoded.email === 'superadmin@nib.com';

    if (isSuperAdminCandidate) {
      try {
        const masterUsers = await masterSequelize.query(
          `SELECT u.*, r.name as role_name 
           FROM users u 
           LEFT JOIN roles r ON u.role_id = r.id 
           WHERE (u.id = ? OR u.email = ?) AND u.status = 'Active' LIMIT 1`,
          { replacements: [decoded.id || '', decoded.email || ''], type: QueryTypes.SELECT }
        );
        if (masterUsers && masterUsers.length > 0) {
          const mUser = masterUsers[0];
          authenticatedUser = {
            id: mUser.id,
            email: mUser.email,
            companyCode: 'system_master_db',
            hasCompanyWideAccess: true,
            role: {
              id: mUser.role_id || mUser.id,
              name: 'SuperAdmin',
              roleName: 'SuperAdmin'
            }
          };
        } else if (decoded.email === 'superadmin@nib.com' || decoded.role === 'SuperAdmin' || decoded.roleName === 'SuperAdmin') {
          authenticatedUser = {
            id: decoded.id || 'superadmin-master-id',
            email: decoded.email,
            companyCode: 'system_master_db',
            hasCompanyWideAccess: true,
            role: {
              id: 'super-admin-role',
              name: 'SuperAdmin',
              roleName: 'SuperAdmin'
            }
          };
        }
      } catch (smErr) {
        if (decoded.email === 'superadmin@nib.com' || decoded.role === 'SuperAdmin' || decoded.roleName === 'SuperAdmin') {
          authenticatedUser = {
            id: decoded.id || 'superadmin-master-id',
            email: decoded.email,
            companyCode: 'system_master_db',
            hasCompanyWideAccess: true,
            role: {
              id: 'super-admin-role',
              name: 'SuperAdmin',
              roleName: 'SuperAdmin'
            }
          };
        }
      }
    }

    // 1. Try finding in active tenant users table
    if (!authenticatedUser) {
      try {
        const users = await activeDb.query(
          `SELECT u.*, r.name as role_name, r.id as role_id, 
                  e.id as emp_id, e.firstName, e.lastName, e.department, e.company as emp_company,
                  e.branch_id, e.branchName
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

          const resolvedRole = user.role_name || (user.role && user.role !== 'Employee' ? user.role : (decoded.role || user.role || 'Employee'));
          const hasCompanyWideAccess = ['SuperAdmin', 'Admin'].includes(resolvedRole) || decoded.hasCompanyWideAccess === true;

          authenticatedUser = {
            id: user.id,
            email: user.email,
            companyCode: user.company_code || user.emp_company || decoded.companyCode || '',
            department: user.department || '',
            departmentName: user.department || '',
            departmentId: user.department_id || '',
            branchId: user.branch_id || null,
            branchName: user.branchName || null,
            hasCompanyWideAccess,
            role: {
              id: user.role_id || user.id,
              name: resolvedRole,
              roleName: resolvedRole
            },
            employee: (user.emp_id || user.department) ? {
              id: user.emp_id || user.id,
              first_name: user.firstName || user.first_name || '',
              last_name: user.lastName || user.last_name || '',
              department: user.department || '',
              company: user.emp_company || '',
              branchId: user.branch_id || null,
              branchName: user.branchName || null
            } : null
          };
        }
      } catch (uErr) {
        // Continue to next lookup
      }
    }

    // 2. Direct search in employees table (for employee self-service login)
    if (!authenticatedUser) {
      try {
        const empRows = await activeDb.query(
          `SELECT * FROM employees WHERE id = ? OR LOWER(email) = ? OR LOWER(officialEmail) = ? LIMIT 1`,
          { replacements: [decoded.id || '', decoded.email || '', decoded.email || ''], type: QueryTypes.SELECT }
        );
        if (empRows && empRows.length > 0) {
          const emp = empRows[0];
          const empStatus = String(emp.employeeStatus || emp.status || 'Active').toLowerCase();
          if (['inactive', 'terminated', 'resigned', 'suspended'].includes(empStatus)) {
            throw new ApiError(403, 'Your employee account is inactive.');
          }

          authenticatedUser = {
            id: emp.id,
            email: emp.email || emp.officialEmail || decoded.email,
            companyCode: emp.company || emp.companyCode || decoded.companyCode || '',
            department: emp.department || '',
            departmentName: emp.department || '',
            branchId: emp.branch_id || null,
            branchName: emp.branchName || null,
            hasCompanyWideAccess: false,
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
              department: emp.department || '',
              company: emp.company || '',
              branchId: emp.branch_id || null,
              branchName: emp.branchName || null
            }
          };
        }
      } catch (empErr) {
        if (empErr instanceof ApiError) throw empErr;
      }
    }

    // 3. Try finding in Master tenants table (Company Admin)
    if (!authenticatedUser) {
      try {
        const tenantRows = await masterSequelize.query(
          `SELECT * FROM tenants WHERE id = ? OR admin_email = ? LIMIT 1`,
          { replacements: [decoded.id || '', decoded.email || ''], type: QueryTypes.SELECT }
        );
        if (tenantRows && tenantRows.length > 0) {
          const tenant = tenantRows[0];
          authenticatedUser = {
            id: tenant.id,
            email: tenant.admin_email || decoded.email,
            companyCode: tenant.id,
            companyName: tenant.company_name,
            hasCompanyWideAccess: true,
            role: {
              id: tenant.id,
              name: 'Admin',
              roleName: 'Admin'
            }
          };
        }
      } catch (tErr) {
        // Continue
      }
    }

    // 4. Try finding in departments table (Department HR)
    if (!authenticatedUser) {
      try {
        const deptRows = await activeDb.query(
          `SELECT * FROM departments WHERE id = ? OR hr_email = ? LIMIT 1`,
          { replacements: [decoded.id || '', decoded.email || ''], type: QueryTypes.SELECT }
        );
        if (deptRows && deptRows.length > 0) {
          const dept = deptRows[0];
          authenticatedUser = {
            id: dept.id,
            email: dept.hr_email || decoded.email,
            departmentId: dept.id,
            departmentCode: dept.dept_code,
            departmentName: dept.dept_name,
            branchId: dept.branch_id || null,
            hasCompanyWideAccess: false,
            companyCode: req.companyCode || decoded.companyCode || '',
            role: {
              id: dept.id,
              name: 'DepartmentHR',
              roleName: 'DepartmentHR'
            }
          };
        }
      } catch (dErr) {
        // Continue
      }
    }

    // 5. Try Master DB Users (SuperAdmin or global admin)
    if (!authenticatedUser) {
      try {
        const masterUsers = await masterSequelize.query(
          `SELECT u.*, r.name as role_name 
           FROM users u 
           LEFT JOIN roles r ON u.role_id = r.id 
           WHERE (u.id = ? OR u.email = ?) AND u.status = 'Active' LIMIT 1`,
          { replacements: [decoded.id || '', decoded.email || ''], type: QueryTypes.SELECT }
        );
        if (masterUsers && masterUsers.length > 0) {
          const mUser = masterUsers[0];
          const isSuper = mUser.role_name === 'SuperAdmin' || mUser.email === 'superadmin@nib.com';
          authenticatedUser = {
            id: mUser.id,
            email: mUser.email,
            companyCode: 'system_master_db',
            hasCompanyWideAccess: true,
            role: {
              id: mUser.role_id || mUser.id,
              name: isSuper ? 'SuperAdmin' : (mUser.role_name || 'Admin'),
              roleName: isSuper ? 'SuperAdmin' : (mUser.role_name || 'Admin')
            }
          };
        }
      } catch (mErr) {
        // Continue
      }
    }

    // If still not found in any database table, reject request
    if (!authenticatedUser) {
      throw new ApiError(401, 'Unauthorized access request. User account not found or access revoked.');
    }

    // 6. Cross-Tenant Isolation Enforcement
    if (req.companyCode && authenticatedUser.role?.name !== 'SuperAdmin') {
      const userTenant = authenticatedUser.companyCode || authenticatedUser.employee?.company;
      if (userTenant) {
        const match = await isTenantMatch(userTenant, req.companyCode);
        if (!match) {
          throw new ApiError(403, `Cross-tenant access denied: You are assigned to company '${userTenant}', not '${req.companyCode}'.`);
        }
      }
    }

    // 7. Cross-Branch Security Enforcement
    if (!authenticatedUser.hasCompanyWideAccess && authenticatedUser.branchId) {
      if (req.branchId && req.branchId !== authenticatedUser.branchId) {
        throw new ApiError(403, `Cross-branch access denied: You are restricted to branch '${authenticatedUser.branchName || authenticatedUser.branchId}'.`);
      }
      if (req.isAllBranches) {
        req.branchId = authenticatedUser.branchId;
        req.branchName = authenticatedUser.branchName;
        req.isAllBranches = false;
      }
    }

    req.user = authenticatedUser;
    return next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, error.message || 'Invalid Access Token.');
  }
});

module.exports = verifyJWT;
