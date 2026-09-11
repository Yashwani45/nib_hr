// backend/services/talent/performanceMaster.service.js
const performanceMasterRepository = require('../../repositories/talent/performanceMaster.repository');
const auditLogService = require('../core/auditLog.service');
const ApiError = require('../../utils/apiError');

class PerformanceMasterService {
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
    return await performanceMasterRepository.findAll({
      order: [['created_at', 'DESC']]
    });
  }

  async getById(id) {
    const item = await performanceMasterRepository.findById(id);
    if (!item) throw new ApiError(404, 'Performance Master record not found.');
    return item;
  }

  async create(data, currentUser, reqInfo = {}) {
    const item = await performanceMasterRepository.create(data);
    const userInfo = this._extractReqInfo(currentUser, reqInfo);
    auditLogService.logAction({
      userId: userInfo.userId,
      username: userInfo.username,
      roleName: userInfo.roleName,
      action: 'CREATE_PERFORMANCE_MASTER',
      module: 'PerformanceMaster',
      resourceId: item.id,
      details: { cycleName: item.cycleName, reviewPeriod: item.reviewPeriod },
      ipAddress: userInfo.ipAddress,
      userAgent: userInfo.userAgent
    });
    return item;
  }

  async update(id, data) {
    const item = await performanceMasterRepository.update(id, data);
    if (!item) throw new ApiError(404, 'Performance Master record not found.');
    return item;
  }

  async toggleStatus(id, status) {
    const item = await performanceMasterRepository.update(id, { status });
    if (!item) throw new ApiError(404, 'Performance Master record not found.');
    return item;
  }

  async delete(id) {
    const success = await performanceMasterRepository.delete(id);
    if (!success) throw new ApiError(404, 'Performance Master record not found.');
    return true;
  }
}

module.exports = new PerformanceMasterService();
