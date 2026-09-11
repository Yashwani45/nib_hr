// backend/middleware/role.middleware.js
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { Role, Permission } = require('../models');

// Restrict access to specific roles
const authorizeRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(403, 'Access denied. User context missing.');
    }

    const rawRole = req.user.role || req.user.roleName;
    const roleName = typeof rawRole === 'string' ? rawRole : (rawRole?.name || rawRole?.roleName || '');

    if (!roleName) {
      throw new ApiError(403, 'Access denied. Role not assigned.');
    }

    const normalizedAllowed = allowedRoles.map(r => String(r).toLowerCase().trim());
    const normalizedUserRole = String(roleName).toLowerCase().trim();

    if (!normalizedAllowed.includes(normalizedUserRole) && normalizedUserRole !== 'superadmin') {
      console.warn('[Role Middleware Access Denied]', {
        allowedRoles,
        userRole: roleName,
        userEmail: req.user.email
      });
      throw new ApiError(403, 'Access forbidden. You do not have the required role.');
    }

    next();
  };
};

// Restrict access by permissions
const authorizePermission = (requiredPermission) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user || !req.user.roleId) {
      throw new ApiError(403, 'Access denied. Role not assigned.');
    }

    const role = await Role.findByPk(req.user.roleId, {
      include: [
        {
          model: Permission,
          as: 'assignedPermissions',
          where: { name: requiredPermission },
          required: true,
        },
      ],
    });

    if (!role) {
      throw new ApiError(403, `Access forbidden. Missing required permission: ${requiredPermission}`);
    }

    next();
  });
};

module.exports = { authorizeRole, authorizePermission };
