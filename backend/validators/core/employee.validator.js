// backend/validators/core/employee.validator.js
const { body } = require('express-validator');
const validate = require('../validate');

const employeeValidator = [
  body('empCode')
    .trim()
    .notEmpty().withMessage('Employee code is required.'),
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required.'),
  body('companyEmail')
    .optional()
    .trim()
    .isEmail().withMessage('Please supply a valid company email address.'),
  body('personalEmail')
    .optional()
    .trim()
    .isEmail().withMessage('Please supply a valid personal email address.'),
  validate,
];

module.exports = {
  employeeValidator,
};
