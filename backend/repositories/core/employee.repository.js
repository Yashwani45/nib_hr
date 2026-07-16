// backend/repositories/core/employee.repository.js
const BaseRepository = require('../base.repository');
const { Employee } = require('../../models');

class EmployeeRepository extends BaseRepository {
  constructor() {
    super(Employee);
  }

  async findByCode(empCode, include = []) {
    return await this.findOne({ empCode }, include);
  }
}

module.exports = new EmployeeRepository();
