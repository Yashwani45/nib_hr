// backend/repositories/talent/performanceMaster.repository.js
const BaseRepository = require('../base.repository');
const PerformanceMaster = require('../../models/talent/performanceMaster.model');

class PerformanceMasterRepository extends BaseRepository {
  constructor() {
    super(PerformanceMaster);
  }
}

module.exports = new PerformanceMasterRepository();
