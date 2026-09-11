// backend/repositories/finance/employeeLoan.repository.js
const BaseRepository = require('../base.repository');
const { EmployeeLoan } = require('../../models');

class EmployeeLoanRepository extends BaseRepository {
  constructor() {
    super(EmployeeLoan);
  }
}

module.exports = new EmployeeLoanRepository();
