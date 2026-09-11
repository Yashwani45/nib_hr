// backend/repositories/finance/salaryComponent.repository.js
const BaseRepository = require('../base.repository');
const { SalaryComponent } = require('../../models');

class SalaryComponentRepository extends BaseRepository {
  constructor() {
    super(SalaryComponent);
  }
}

module.exports = new SalaryComponentRepository();
