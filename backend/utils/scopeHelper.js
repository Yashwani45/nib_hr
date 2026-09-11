// backend/utils/scopeHelper.js
const { Op } = require('sequelize');

/**
 * Applies row-level where clause filters to Sequelize queries based on req.accessScope context.
 * Useful in controllers and repositories.
 * 
 * @param {Object} req - Express Request object containing resolved scopes
 * @param {Object} queryOptions - Sequelize query options object
 * @returns {Object} Updated query options
 */
const applyAccessScope = (req, queryOptions = {}) => {
  const scope = req.accessScope;
  const where = queryOptions.where || {};

  if (!scope || scope === 'Global') {
    return queryOptions;
  }

  if (scope === 'Departmental') {
    where.departmentId = req.userDeptId;
  } 
  else if (scope === 'Team') {
    where.managerId = req.userEmpId;
  } 
  else if (scope === 'Self') {
    // If querying employee table, match 'id'. Otherwise match foreign key 'employeeId'
    if (queryOptions.modelName === 'Employee') {
      where.id = req.userEmpId;
    } else {
      where.employeeId = req.userEmpId;
    }
  }

  return {
    ...queryOptions,
    where
  };
};

module.exports = {
  applyAccessScope
};
