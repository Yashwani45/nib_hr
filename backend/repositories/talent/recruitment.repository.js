// backend/repositories/talent/recruitment.repository.js
const BaseRepository = require('../base.repository');
const { Recruitment } = require('../../models');

class RecruitmentRepository extends BaseRepository {
  constructor() {
    super(Recruitment);
  }
}

module.exports = new RecruitmentRepository();
