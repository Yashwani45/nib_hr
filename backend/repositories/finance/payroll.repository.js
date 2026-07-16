// backend/repositories/finance/payroll.repository.js
const BaseRepository = require('../base.repository');
const { Payroll } = require('../../models');

class PayrollRepository extends BaseRepository {
  constructor() {
    super(Payroll);
  }
}

module.exports = new PayrollRepository();
