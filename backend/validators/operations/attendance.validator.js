// backend/validators/operations/attendance.validator.js
const { body } = require('express-validator');
const validate = require('../validate');

const attendanceValidator = [
  body('checkIn')
    .optional()
    .trim()
    .matches(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).withMessage('Please supply check-in time in HH:MM or HH:MM:SS format.'),
  body('checkOut')
    .optional()
    .trim()
    .matches(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).withMessage('Please supply check-out time in HH:MM or HH:MM:SS format.'),
  body('date')
    .optional()
    .isISO8601().withMessage('Date must be in valid YYYY-MM-DD format.'),
  body('method')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(['GEO', 'FACE', 'BIOMETRIC', 'QR', 'MANUAL', 'WEB']).withMessage('Invalid attendance method.'),
  validate,
];

module.exports = {
  attendanceValidator,
};
