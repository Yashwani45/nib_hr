// backend/repositories/talent/competency.repository.js
const BaseRepository = require('../base.repository');
const { Competency } = require('../../models');

class CompetencyRepository extends BaseRepository {
  constructor() {
    super(Competency);
  }
}

module.exports = new CompetencyRepository();
