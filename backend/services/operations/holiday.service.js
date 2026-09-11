// backend/services/operations/holiday.service.js
const holidayRepository = require('../../repositories/operations/holiday.repository');
const auditLogService = require('../core/auditLog.service');
const ApiError = require('../../utils/apiError');

class HolidayService {
  _extractReqInfo(currentUser, reqInfo = {}) {
    return {
      userId: currentUser?.id || currentUser?.userId,
      username: currentUser?.email || currentUser?.username || 'Admin',
      roleName: currentUser?.role || 'Admin',
      ipAddress: reqInfo.ipAddress || reqInfo.ip || '::1',
      userAgent: reqInfo.userAgent || 'Web Console'
    };
  }

  async getAll(queryParams = {}) {
    return await holidayRepository.findAll({
      order: [['holiday_date', 'ASC']]
    });
  }

  async getById(id) {
    const item = await holidayRepository.findById(id);
    if (!item) throw new ApiError(404, 'Holiday record not found.');
    return item;
  }

  async create(data, currentUser, reqInfo = {}) {
    const item = await holidayRepository.create(data);
    const userInfo = this._extractReqInfo(currentUser, reqInfo);
    auditLogService.logAction({
      userId: userInfo.userId,
      username: userInfo.username,
      roleName: userInfo.roleName,
      action: 'CREATE_HOLIDAY',
      module: 'HolidayMaster',
      resourceId: item.id,
      details: { holidayName: item.holidayName, holidayDate: item.holidayDate },
      ipAddress: userInfo.ipAddress,
      userAgent: userInfo.userAgent
    });
    return item;
  }

  async update(id, data, currentUser, reqInfo = {}) {
    const item = await holidayRepository.update(id, data);
    if (!item) throw new ApiError(404, 'Holiday record not found.');
    const userInfo = this._extractReqInfo(currentUser, reqInfo);
    auditLogService.logAction({
      userId: userInfo.userId,
      username: userInfo.username,
      roleName: userInfo.roleName,
      action: 'UPDATE_HOLIDAY',
      module: 'HolidayMaster',
      resourceId: item.id,
      details: data,
      ipAddress: userInfo.ipAddress,
      userAgent: userInfo.userAgent
    });
    return item;
  }

  async toggleStatus(id, status) {
    const item = await holidayRepository.update(id, { status });
    if (!item) throw new ApiError(404, 'Holiday record not found.');
    return item;
  }

  async delete(id) {
    const success = await holidayRepository.delete(id);
    if (!success) throw new ApiError(404, 'Holiday record not found.');
    return true;
  }
}

module.exports = new HolidayService();
