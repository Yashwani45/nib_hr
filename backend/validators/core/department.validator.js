// backend/validators/core/department.validator.js
const { body, param, query } = require('express-validator');
const validate = require('../validate');

const departmentCreateRules = [
  body('deptCode')
    .trim()
    .notEmpty()
    .withMessage('Department Code is required.')
    .isLength({ min: 2, max: 20 })
    .withMessage('Department Code must be between 2 and 20 characters.')
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage('Department Code can only contain letters, numbers, hyphens, and underscores.'),

  body('deptName')
    .trim()
    .notEmpty()
    .withMessage('Department Name is required.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Department Name must be between 2 and 100 characters.'),

  body('branchId')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('Invalid Branch ID format.'),

  body('headEmployeeId')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('Invalid Department Head Employee ID format.'),

  body('parentDeptId')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('Invalid Parent Department ID format.'),

  body('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be either Active or Inactive.'),

  body('description')
    .optional({ nullable: true })
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters.'),

  body('hrEmail')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('Invalid HR Email format.'),

  body('hrPassword')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 4 })
    .withMessage('HR Password must be at least 4 characters long.'),

  body('assignedModules')
    .optional({ nullable: true })
    .isArray()
    .withMessage('Assigned modules must be an array.')
];

const departmentUpdateRules = [
  param('id')
    .isUUID()
    .withMessage('Invalid Department ID format.'),

  body('deptCode')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Department Code cannot be empty.')
    .isLength({ min: 2, max: 20 })
    .withMessage('Department Code must be between 2 and 20 characters.')
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage('Department Code can only contain letters, numbers, hyphens, and underscores.'),

  body('deptName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Department Name cannot be empty.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Department Name must be between 2 and 100 characters.'),

  body('branchId')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('Invalid Branch ID format.'),

  body('headEmployeeId')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('Invalid Department Head Employee ID format.'),

  body('parentDeptId')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('Invalid Parent Department ID format.'),

  body('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be either Active or Inactive.'),

  body('description')
    .optional({ nullable: true })
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters.'),

  body('hrEmail')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('Invalid HR Email format.'),

  body('hrPassword')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 4 })
    .withMessage('HR Password must be at least 4 characters long.'),

  body('assignedModules')
    .optional({ nullable: true })
    .isArray()
    .withMessage('Assigned modules must be an array.')
];

const departmentStatusToggleRules = [
  param('id')
    .isUUID()
    .withMessage('Invalid Department ID format.'),

  body('status')
    .notEmpty()
    .withMessage('Status is required.')
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be either Active or Inactive.')
];

module.exports = {
  departmentCreateValidator: [departmentCreateRules, validate],
  departmentUpdateValidator: [departmentUpdateRules, validate],
  departmentStatusToggleValidator: [departmentStatusToggleRules, validate]
};
