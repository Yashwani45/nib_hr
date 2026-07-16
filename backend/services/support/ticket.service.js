// backend/services/support/ticket.service.js
const ticketRepository = require('../../repositories/support/ticket.repository');
const employeeRepository = require('../../repositories/core/employee.repository');
const ApiError = require('../../utils/apiError');

class TicketService {
  async createTicket(userId, ticketData) {
    const employee = await employeeRepository.findOne({ userId });
    if (!employee) {
      throw new ApiError(404, 'Employee profile not associated with this account.');
    }

    const ticketNum = 'TKT-' + Math.floor(100000 + Math.random() * 900000);
    const payload = {
      ...ticketData,
      ticketNum,
      employeeId: employee.id,
      createdBy: userId,
    };

    return await ticketRepository.create(payload);
  }

  async getEmployeeTickets(userId) {
    const employee = await employeeRepository.findOne({ userId });
    if (!employee) {
      throw new ApiError(404, 'Employee profile not associated with this account.');
    }
    return await ticketRepository.findAll({
      where: { employeeId: employee.id },
      order: [['id', 'DESC']],
    });
  }

  async resolveTicket(ticketId, resolutionDetails, executorId) {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new ApiError(404, 'Ticket not found.');
    }

    const payload = {
      status: 'Resolved',
      description: ticket.description + `\n\nResolution [by Admin/HR]: ` + resolutionDetails,
      updatedBy: executorId,
    };

    return await ticketRepository.update(ticketId, payload);
  }
}

module.exports = new TicketService();
