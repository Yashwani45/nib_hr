// backend/repositories/talent/performanceGoalHistory.repository.js
const BaseRepository = require('../base.repository');
const { PerformanceGoalHistory } = require('../../models');

class PerformanceGoalHistoryRepository extends BaseRepository {
  constructor() {
    super(PerformanceGoalHistory);
  }
}

module.exports = new PerformanceGoalHistoryRepository();
