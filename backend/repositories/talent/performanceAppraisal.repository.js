// backend/repositories/talent/performanceAppraisal.repository.js
const BaseRepository = require('../base.repository');
const { PerformanceAppraisal } = require('../../models');

class PerformanceAppraisalRepository extends BaseRepository {
  constructor() {
    super(PerformanceAppraisal);
  }
}

module.exports = new PerformanceAppraisalRepository();
