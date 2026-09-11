// backend/services/finance/bonus.service.js
const bonusRepository = require('../../repositories/finance/bonus.repository');
const auditLogService = require('../core/auditLog.service');
const ApiError = require('../../utils/apiError');

class BonusService {
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
    return await bonusRepository.findAll({
      order: [['created_at', 'DESC']]
    });
  }

  async getById(id) {
    const item = await bonusRepository.findById(id);
    if (!item) throw new ApiError(404, 'Bonus Master record not found.');
    return item;
  }

  async create(data, currentUser, reqInfo = {}) {
    const item = await bonusRepository.create(data);
    const userInfo = this._extractReqInfo(currentUser, reqInfo);
    auditLogService.logAction({
      userId: userInfo.userId,
      username: userInfo.username,
      roleName: userInfo.roleName,
      action: 'CREATE_BONUS_MASTER',
      module: 'BonusMaster',
      resourceId: item.id,
      details: { bonusName: item.bonusName, bonusType: item.bonusType },
      ipAddress: userInfo.ipAddress,
      userAgent: userInfo.userAgent
    });
    return item;
  }

  async update(id, data) {
    const item = await bonusRepository.update(id, data);
    if (!item) throw new ApiError(404, 'Bonus Master record not found.');
    return item;
  }

  async toggleStatus(id, status) {
    const item = await bonusRepository.update(id, { status });
    if (!item) throw new ApiError(404, 'Bonus Master record not found.');
    return item;
  }

  async delete(id) {
    const success = await bonusRepository.delete(id);
    if (!success) throw new ApiError(404, 'Bonus Master record not found.');
    return true;
  }
}

module.exports = new BonusService();
