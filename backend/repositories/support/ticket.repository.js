// backend/repositories/support/ticket.repository.js
const BaseRepository = require('../base.repository');
const { Ticket } = require('../../models');

class TicketRepository extends BaseRepository {
  constructor() {
    super(Ticket);
  }
}

module.exports = new TicketRepository();
