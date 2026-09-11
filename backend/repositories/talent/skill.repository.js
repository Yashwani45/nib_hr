// backend/repositories/talent/skill.repository.js
const BaseRepository = require('../base.repository');
const { Skill } = require('../../models');

class SkillRepository extends BaseRepository {
  constructor() {
    super(Skill);
  }
}

module.exports = new SkillRepository();
