// backend/repositories/finance/loanEmiSchedule.repository.js
const BaseRepository = require('../base.repository');
const { LoanEmiSchedule } = require('../../models');

class LoanEmiScheduleRepository extends BaseRepository {
  constructor() {
    super(LoanEmiSchedule);
  }
}

module.exports = new LoanEmiScheduleRepository();
