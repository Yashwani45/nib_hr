// backend/repositories/finance/payrollDeduction.repository.js
const BaseRepository = require('../base.repository');
const { PayrollDeduction } = require('../../models');

class PayrollDeductionRepository extends BaseRepository {
  constructor() {
    super(PayrollDeduction);
  }
}

module.exports = new PayrollDeductionRepository();
