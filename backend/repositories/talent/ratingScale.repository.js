// backend/repositories/talent/ratingScale.repository.js
const BaseRepository = require('../base.repository');
const { RatingScale } = require('../../models');

class RatingScaleRepository extends BaseRepository {
  constructor() {
    super(RatingScale);
  }
}

module.exports = new RatingScaleRepository();
