// backend/services/operations/attendance.service.js
const attendanceRepository = require('../../repositories/operations/attendance.repository');
const employeeRepository = require('../../repositories/core/employee.repository');
const ApiError = require('../../utils/apiError');

class AttendanceService {
  async clockIn(userId, checkInTimeStr, dateStr) {
    const employee = await employeeRepository.findOne({ userId });
    if (!employee) {
      throw new ApiError(404, 'Employee profile not associated with this account.');
    }

    const existing = await attendanceRepository.findTodayRecord(employee.id, dateStr);
    if (existing) {
      throw new ApiError(400, 'Employee already checked in for today.');
    }

    const payload = {
      employeeId: employee.id,
      date: dateStr,
      checkIn: checkInTimeStr,
      checkOut: '--',
      workingHours: 0.0,
      status: 'Present',
      createdBy: userId,
    };

    return await attendanceRepository.create(payload);
  }

  async clockOut(userId, checkOutTimeStr, dateStr) {
    const employee = await employeeRepository.findOne({ userId });
    if (!employee) {
      throw new ApiError(404, 'Employee profile not associated with this account.');
    }

    const record = await attendanceRepository.findOne({ employeeId: employee.id, date: dateStr, checkOut: '--' });
    if (!record) {
      throw new ApiError(400, 'No active check-in record found to check out.');
    }

    // Parse checkIn and checkOut hours to estimate working hours
    let workingHours = 8.5; // fallback
    try {
      const [inH, inM] = record.checkIn.split(':').map(Number);
      const [outH, outM] = checkOutTimeStr.split(':').map(Number);
      const diffMs = (outH * 60 + outM) - (inH * 60 + inM);
      if (diffMs > 0) {
        workingHours = parseFloat((diffMs / 60).toFixed(2));
      }
    } catch (e) {
      // ignore
    }

    const payload = {
      checkOut: checkOutTimeStr,
      workingHours,
      updatedBy: userId,
    };

    return await attendanceRepository.update(record.id, payload);
  }

  async getEmployeeAttendanceHistory(userId) {
    const employee = await employeeRepository.findOne({ userId });
    if (!employee) {
      throw new ApiError(404, 'Employee profile not associated with this account.');
    }
    return await attendanceRepository.findAll({
      where: { employeeId: employee.id },
      order: [['date', 'DESC']],
    });
  }
}

module.exports = new AttendanceService();
