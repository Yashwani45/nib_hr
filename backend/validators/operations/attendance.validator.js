// backend/validators/operations/attendance.validator.js
const { body } = require('express-validator');
const validate = require('../validate');

const attendanceValidator = [
  body('checkIn')
    .optional()
    .trim()
    .matches(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Please supply check-in time in HH:MM format.'),
  body('checkOut')
    .optional()
    .trim()
    .matches(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Please supply check-out time in HH:MM format.'),
  body('date')
    .notEmpty().withMessage('Date is required.')
    .isISO8601().withMessage('Date must be in valid YYYY-MM-DD format.'),
  validate,
];

module.exports = {
  attendanceValidator,
};
