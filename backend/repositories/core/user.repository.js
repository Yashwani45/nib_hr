// backend/repositories/core/user.repository.js
const BaseRepository = require('../base.repository');
const { User } = require('../../models');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email, include = []) {
    return await this.findOne({ email }, include);
  }
}

module.exports = new UserRepository();
