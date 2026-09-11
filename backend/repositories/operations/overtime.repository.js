// backend/repositories/operations/overtime.repository.js
const BaseRepository = require('../base.repository');
const Overtime = require('../../models/operations/overtime.model');

class OvertimeRepository extends BaseRepository {
  constructor() {
    super(Overtime);
  }
}

module.exports = new OvertimeRepository();
