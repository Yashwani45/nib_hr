// backend/repositories/finance/bonus.repository.js
const BaseRepository = require('../base.repository');
const Bonus = require('../../models/finance/bonus.model');

class BonusRepository extends BaseRepository {
  constructor() {
    super(Bonus);
  }
}

module.exports = new BonusRepository();
