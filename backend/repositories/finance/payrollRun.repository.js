// backend/repositories/finance/payrollRun.repository.js
const BaseRepository = require('../base.repository');
const { PayrollRun } = require('../../models');

class PayrollRunRepository extends BaseRepository {
  constructor() {
    super(PayrollRun);
  }
}

module.exports = new PayrollRunRepository();
