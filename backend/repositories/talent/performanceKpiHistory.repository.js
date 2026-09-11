// backend/repositories/talent/performanceKpiHistory.repository.js
const BaseRepository = require('../base.repository');
const { PerformanceKpiHistory } = require('../../models');

class PerformanceKpiHistoryRepository extends BaseRepository {
  constructor() {
    super(PerformanceKpiHistory);
  }
}

module.exports = new PerformanceKpiHistoryRepository();
