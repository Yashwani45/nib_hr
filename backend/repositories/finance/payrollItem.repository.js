// backend/repositories/finance/payrollItem.repository.js
const BaseRepository = require('../base.repository');
const { PayrollItem } = require('../../models');

class PayrollItemRepository extends BaseRepository {
  constructor() {
    super(PayrollItem);
  }
}

module.exports = new PayrollItemRepository();
