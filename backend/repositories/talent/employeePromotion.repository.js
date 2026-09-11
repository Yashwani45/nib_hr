// backend/repositories/talent/employeePromotion.repository.js
const BaseRepository = require('../base.repository');
const { EmployeePromotion } = require('../../models');

class EmployeePromotionRepository extends BaseRepository {
  constructor() {
    super(EmployeePromotion);
  }
}

module.exports = new EmployeePromotionRepository();
