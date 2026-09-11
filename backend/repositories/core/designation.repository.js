// backend/repositories/core/designation.repository.js
const BaseRepository = require('../base.repository');
const Designation = require('../../models/core/designation.model');

class DesignationRepository extends BaseRepository {
  constructor() {
    super(Designation);
  }
}

module.exports = new DesignationRepository();
