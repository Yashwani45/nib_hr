// backend/repositories/finance/tdsMaster.repository.js
const BaseRepository = require('../base.repository');
const TdsMaster = require('../../models/finance/tdsMaster.model');

class TdsMasterRepository extends BaseRepository {
  constructor() {
    super(TdsMaster);
  }
}

module.exports = new TdsMasterRepository();
