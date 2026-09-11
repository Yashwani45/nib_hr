// backend/repositories/talent/performanceGoal.repository.js
const BaseRepository = require('../base.repository');
const { PerformanceGoal } = require('../../models');

class PerformanceGoalRepository extends BaseRepository {
  constructor() {
    super(PerformanceGoal);
  }
}

module.exports = new PerformanceGoalRepository();
