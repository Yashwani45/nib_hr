// backend/validators/auth.validator.js
const { body } = require('express-validator');
const validate = require('./validate');

const registerValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required.')
    .isEmail().withMessage('Please supply a valid email address.')
    .normalizeEmail(),
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
  body('roleName')
    .optional()
    .trim()
    .isIn(['Admin', 'Manager', 'Employee']).withMessage('Invalid role specified.'),
  validate,
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required.')
    .isEmail().withMessage('Please supply a valid email address.')
    .normalizeEmail(),
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required.'),
  validate,
];

module.exports = {
  registerValidator,
  loginValidator,
};
