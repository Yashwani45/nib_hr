// backend/repositories/operations/attendance.repository.js
const BaseRepository = require('../base.repository');
const { Attendance } = require('../../models');

class AttendanceRepository extends BaseRepository {
  constructor() {
    super(Attendance);
  }

  async findTodayRecord(employeeId, dateStr) {
    return await this.findOne({ employeeId, date: dateStr });
  }
}

module.exports = new AttendanceRepository();
