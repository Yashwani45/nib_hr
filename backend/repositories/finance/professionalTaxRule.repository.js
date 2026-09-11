// backend/repositories/finance/professionalTaxRule.repository.js
const BaseRepository = require('../base.repository');
const { ProfessionalTaxRule } = require('../../models');

class ProfessionalTaxRuleRepository extends BaseRepository {
  constructor() {
    super(ProfessionalTaxRule);
  }
}

module.exports = new ProfessionalTaxRuleRepository();
