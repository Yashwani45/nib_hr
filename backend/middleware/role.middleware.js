// backend/middleware/role.middleware.js
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { Role, Permission } = require('../models');

// Restrict access to specific roles
const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      throw new ApiError(403, 'Access denied. Role not assigned.');
    }

    if (!allowedRoles.includes(req.user.role.name)) {
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
