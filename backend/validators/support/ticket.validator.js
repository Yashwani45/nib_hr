// backend/validators/support/ticket.validator.js
const { body } = require('express-validator');
const validate = require('../validate');

const ticketValidator = [
  body('subject')
    .trim()
    .notEmpty().withMessage('Ticket subject is required.'),
  body('description')
    .trim()
    .notEmpty().withMessage('Ticket description details are required.'),
  body('priority')
    .optional()
    .trim()
    .isIn(['Low', 'Medium', 'High']).withMessage('Priority must be Low, Medium, or High.'),
  validate,
];

module.exports = {
  ticketValidator,
};
