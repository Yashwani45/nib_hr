// backend/repositories/finance/professionalTaxContribution.repository.js
const BaseRepository = require('../base.repository');
const { ProfessionalTaxContribution } = require('../../models');

class ProfessionalTaxContributionRepository extends BaseRepository {
  constructor() {
    super(ProfessionalTaxContribution);
  }
}

module.exports = new ProfessionalTaxContributionRepository();
