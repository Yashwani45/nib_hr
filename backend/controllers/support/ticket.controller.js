// backend/controllers/support/ticket.controller.js
const ticketService = require('../../services/support/ticket.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const createTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.createTicket(req.user?.id, req.body);
  res.status(201).json(new ApiResponse(201, ticket, 'Support ticket created successfully.'));
});

const getEmployeeTickets = asyncHandler(async (req, res) => {
  const tickets = await ticketService.getEmployeeTickets(req.user?.id);
  res.status(200).json(new ApiResponse(200, tickets, 'Employee support tickets retrieved.'));
});

const resolveTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { resolutionDetails } = req.body;
  const ticket = await ticketService.resolveTicket(id, resolutionDetails, req.user?.id);
  res.status(200).json(new ApiResponse(200, ticket, 'Support ticket resolved.'));
});

module.exports = {
  createTicket,
  getEmployeeTickets,
  resolveTicket,
};
