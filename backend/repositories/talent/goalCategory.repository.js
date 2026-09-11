// backend/repositories/talent/goalCategory.repository.js
const BaseRepository = require('../base.repository');
const { GoalCategory } = require('../../models');

class GoalCategoryRepository extends BaseRepository {
  constructor() {
    super(GoalCategory);
  }
}

module.exports = new GoalCategoryRepository();
