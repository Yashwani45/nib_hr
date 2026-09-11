// backend/repositories/finance/esiContribution.repository.js
const BaseRepository = require('../base.repository');
const { EsiContribution } = require('../../models');

class EsiContributionRepository extends BaseRepository {
  constructor() {
    super(EsiContribution);
  }
}

module.exports = new EsiContributionRepository();
