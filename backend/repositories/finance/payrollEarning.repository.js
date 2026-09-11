// backend/repositories/finance/payrollEarning.repository.js
const BaseRepository = require('../base.repository');
const { PayrollEarning } = require('../../models');

class PayrollEarningRepository extends BaseRepository {
  constructor() {
    super(PayrollEarning);
  }
}

module.exports = new PayrollEarningRepository();
