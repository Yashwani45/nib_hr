// backend/repositories/talent/employeeIncrement.repository.js
const BaseRepository = require('../base.repository');
const { EmployeeIncrement } = require('../../models');

class EmployeeIncrementRepository extends BaseRepository {
  constructor() {
    super(EmployeeIncrement);
  }
}

module.exports = new EmployeeIncrementRepository();
