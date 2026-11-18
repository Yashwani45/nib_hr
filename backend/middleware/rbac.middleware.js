const ApiError = require('../utils/apiError');
const { User, Role, Permission, Employee } = require('../models');
const { Op } = require('sequelize');

/**
 * Middleware factory to check user's roles and permissions contextually
 * @param {string} module - E.g. "employees", "payroll", "leaves", "recruitment"
 * @param {string} action - E.g. "create", "read", "update", "delete", "approve"
 */
const checkAccess = (module, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ApiError(401, 'Unauthorized access request.'));
      }

      // 1. Resolve role from req.user context (populated in verifyJWT)
      const roleName = String(
        req.user.role?.roleName || 
        req.user.role?.name || 
        (typeof req.user.role === 'string' ? req.user.role : '') || 
        ''
      ).trim();

      // Org Admins / Super Admins bypass scope boundaries automatically
      if (['Admin', 'SuperAdmin', 'Finance', 'Payroll', 'Payroll Approver'].includes(roleName)) {
        req.accessScope = 'Global';
        return next();
      }

      // Department HR has Department-wide access
      if (['DepartmentHR', 'HR'].includes(roleName)) {
        req.accessScope = 'Department';
        req.userDeptId = req.user.departmentId || req.user.department;
        return next();
      }

      // Self-service modules allowed for standard employees
      const employeeSelfServiceModules = [
        'payslip',
        'payroll',
        'attendance',
        'loan',
        'leave',
        'leaves',
        'performance',
        'ticket',
        'support',
        'profile',
        'asset',
        'holiday',
      ];

      if (roleName === 'Employee') {
        const isSelfService =
          employeeSelfServiceModules.includes(String(module || '').toLowerCase()) &&
          ['view', 'read', 'create', 'download', 'submit', 'request'].includes(String(action || '').toLowerCase());

        if (isSelfService) {
          req.accessScope = 'Self';
          if (req.user.employee?.id) {
            req.userEmpId = req.user.employee.id;
            req.userDeptId = req.user.departmentId || req.user.department;
          } else {
            try {
              const employee = await Employee.findOne({
                where: {
                  [Op.or]: [
                    { userId: req.user.id },
                    { id: req.user.id },
                    { email: req.user.email || '' }
                  ]
                }
              });
              if (employee) {
                req.userEmpId = employee.id;
                req.userDeptId = employee.departmentId || employee.department;
              }
            } catch (e) {}
          }
          return next();
        }
      }

      if (roleName === 'Manager') {
        const isManagerAllowed =
          employeeSelfServiceModules.includes(String(module || '').toLowerCase()) ||
          ['approve', 'reject', 'manage', 'review', 'view', 'read'].includes(String(action || '').toLowerCase());

        if (isManagerAllowed) {
          req.accessScope = 'Department';
          if (req.user.employee?.id) {
            req.userEmpId = req.user.employee.id;
            req.userDeptId = req.user.departmentId || req.user.department;
          }
          return next();
        }
      }

      // 2. Try loading granular permissions from database if available
      try {
        const user = await User.findByPk(req.user.id, {
          include: [{
            model: Role,
            as: 'role',
            include: [{
              model: Permission,
              as: 'assignedPermissions',
              required: false,
            }],
          }],
        });

        if (user && user.role) {
          const userRoleName = user.role.name || user.role.roleName;
          if (['Admin', 'SuperAdmin'].includes(userRoleName)) {
            req.accessScope = 'Global';
            return next();
          }

          const permission = (user.role.assignedPermissions || []).find(
            p => p.module === module && p.action === action
          );

          if (permission) {
            req.accessScope = permission.scope || 'Global';
            return next();
          }
        }
      } catch (dbErr) {
        // Table might not exist in tenant DB
      }

      if (!roleName) {
        return next(new ApiError(403, 'Access denied: Role context unassigned.'));
      }

      return next(new ApiError(403, `Access denied: Insufficient permission to perform [${action}] on module [${module}].`));
    } catch (err) {
      console.error('[RBAC Check Error]', err);
      next(new ApiError(500, 'Internal RBAC permission authorization failure.'));
    }
  };
};

module.exports = {
  checkAccess
};
