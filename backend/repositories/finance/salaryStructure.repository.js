// backend/repositories/finance/salaryStructure.repository.js
const BaseRepository = require('../base.repository');
const { SalaryStructure } = require('../../models');

class SalaryStructureRepository extends BaseRepository {
  constructor() {
    super(SalaryStructure);
  }
}

module.exports = new SalaryStructureRepository();
