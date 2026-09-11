// backend/repositories/operations/holiday.repository.js
const BaseRepository = require('../base.repository');
const Holiday = require('../../models/operations/holiday.model');

class HolidayRepository extends BaseRepository {
  constructor() {
    super(Holiday);
  }
}

module.exports = new HolidayRepository();
