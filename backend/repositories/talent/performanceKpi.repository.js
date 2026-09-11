// backend/repositories/talent/performanceKpi.repository.js
const BaseRepository = require('../base.repository');
const { PerformanceKpi } = require('../../models');

class PerformanceKpiRepository extends BaseRepository {
  constructor() {
    super(PerformanceKpi);
  }
}

module.exports = new PerformanceKpiRepository();
