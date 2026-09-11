// backend/repositories/finance/payslip.repository.js
const BaseRepository = require('../base.repository');
const { Payslip } = require('../../models');

class PayslipRepository extends BaseRepository {
  constructor() {
    super(Payslip);
  }
}

module.exports = new PayslipRepository();
