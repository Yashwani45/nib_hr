// backend/routes/support.routes.js
const express = require('express');
const { createTicket, getEmployeeTickets, resolveTicket } = require('../controllers/support/ticket.controller');
const { ticketValidator } = require('../validators/support/ticket.validator');
const verifyJWT = require('../middleware/auth.middleware');
const { authorizeRole } = require('../middleware/role.middleware');

const router = express.Router();

router.use(verifyJWT);

router.post('/tickets', ticketValidator, createTicket);
router.get('/tickets', getEmployeeTickets);

// Resolving tickets restricted to Admin or Manager support reps
router.put('/tickets/:id/resolve', authorizeRole(['Admin', 'Manager']), resolveTicket);

module.exports = router;
