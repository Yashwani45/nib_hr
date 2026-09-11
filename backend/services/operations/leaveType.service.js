// backend/services/operations/leaveType.service.js
const leaveTypeRepository = require('../../repositories/operations/leaveType.repository');
const auditLogService = require('../core/auditLog.service');
const ApiError = require('../../utils/apiError');

class LeaveTypeService {
  _extractReqInfo(currentUser, reqInfo = {}) {
    return {
      userId: currentUser?.id || currentUser?.userId,
      username: currentUser?.email || currentUser?.username || 'Admin',
      roleName: currentUser?.role || 'Admin',
      ipAddress: reqInfo.ipAddress || reqInfo.ip || '::1',
      userAgent: reqInfo.userAgent || 'Web Console'
    };
  }

  async getAll() {
    return await leaveTypeRepository.findAll({
      order: [['created_at', 'DESC']]
    });
  }

  async getById(id) {
    const item = await leaveTypeRepository.findById(id);
    if (!item) throw new ApiError(404, 'Leave Type record not found.');
    return item;
  }

  async create(data, currentUser, reqInfo = {}) {
    const item = await leaveTypeRepository.create(data);
    const userInfo = this._extractReqInfo(currentUser, reqInfo);
    auditLogService.logAction({
      userId: userInfo.userId,
      username: userInfo.username,
      roleName: userInfo.roleName,
      action: 'CREATE_LEAVE_TYPE',
      module: 'LeaveTypeMaster',
      resourceId: item.id,
      details: { leaveCode: item.leaveCode, leaveName: item.leaveName },
      ipAddress: userInfo.ipAddress,
      userAgent: userInfo.userAgent
    });
    return item;
  }

  async update(id, data, currentUser, reqInfo = {}) {
    const item = await leaveTypeRepository.update(id, data);
    if (!item) throw new ApiError(404, 'Leave Type record not found.');
    return item;
  }

  async toggleStatus(id, status) {
    const item = await leaveTypeRepository.update(id, { status });
    if (!item) throw new ApiError(404, 'Leave Type record not found.');
    return item;
  }

  async delete(id) {
    const success = await leaveTypeRepository.delete(id);
    if (!success) throw new ApiError(404, 'Leave Type record not found.');
    return true;
  }
}

module.exports = new LeaveTypeService();
