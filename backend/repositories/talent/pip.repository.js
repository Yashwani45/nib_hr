// backend/repositories/talent/pip.repository.js
const BaseRepository = require('../base.repository');
const { PerformanceImprovementPlan } = require('../../models');

class PerformanceImprovementPlanRepository extends BaseRepository {
  constructor() {
    super(PerformanceImprovementPlan);
  }
}

module.exports = new PerformanceImprovementPlanRepository();
