// backend/repositories/operations/leaveType.repository.js
const BaseRepository = require('../base.repository');
const LeaveType = require('../../models/operations/leaveType.model');

class LeaveTypeRepository extends BaseRepository {
  constructor() {
    super(LeaveType);
  }
}

module.exports = new LeaveTypeRepository();
