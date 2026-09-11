// backend/repositories/finance/employeeSalaryAssignment.repository.js
const BaseRepository = require('../base.repository');
const { EmployeeSalaryAssignment } = require('../../models');

class EmployeeSalaryAssignmentRepository extends BaseRepository {
  constructor() {
    super(EmployeeSalaryAssignment);
  }
}

module.exports = new EmployeeSalaryAssignmentRepository();
