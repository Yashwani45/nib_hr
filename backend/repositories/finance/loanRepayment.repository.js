// backend/repositories/finance/loanRepayment.repository.js
const BaseRepository = require('../base.repository');
const { LoanRepayment } = require('../../models');

class LoanRepaymentRepository extends BaseRepository {
  constructor() {
    super(LoanRepayment);
  }
}

module.exports = new LoanRepaymentRepository();
