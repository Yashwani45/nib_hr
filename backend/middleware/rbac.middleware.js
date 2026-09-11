const ApiError = require('../utils/apiError');
const { User, Role, Permission, Employee } = require('../models');

/**
 * Middleware factory to check user's roles and permissions contextually
 * @param {string} module - E.g. "employees", "payroll", "leaves", "recruitment"
 * @param {string} action - E.g. "create", "read", "update", "delete", "approve"
 */
const checkAccess = (module, action) => {
  return async (req, res, next) => {
    try {
      const user = await User.findByPk(req.user.id, {
        include: [{
          model: Role,
          as: 'role',
          include: [{
            model: Permission,
            as: 'assignedPermissions'
          }]
        }]
      });

      if (!user || !user.role) {
        return next(new ApiError(403, 'Access denied: Role context unassigned.'));
      }

      // Org Admins / Super Admins bypass scope boundaries automatically
      if (user.role.roleName === 'Admin' || user.role.roleName === 'SuperAdmin') {
        req.accessScope = 'Global';
        return next();
      }

      // Check if user is assigned the required permission
      const permission = (user.role.assignedPermissions || []).find(
        p => p.module === module && p.action === action
      );

      if (!permission) {
        return next(new ApiError(403, `Access denied: Insufficient permission to perform [${action}] on module [${module}].`));
      }

      // Attach resolved scope context
      req.accessScope = permission.scope || 'Global';

      // Fetch employee profile details to resolve IDs
      const employee = await Employee.findOne({
        where: { userId: req.user.id }
      });

      if (employee) {
        req.userEmpId = employee.id;
        req.userDeptId = employee.departmentId;
      }

      next();
    } catch (err) {
      console.error('[RBAC Check Error]', err);
      next(new ApiError(500, 'Internal RBAC permission authorization failure.'));
    }
  };
};

module.exports = {
  checkAccess
};
