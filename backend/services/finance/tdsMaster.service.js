// backend/services/finance/tdsMaster.service.js
const tdsMasterRepository = require('../../repositories/finance/tdsMaster.repository');
const auditLogService = require('../core/auditLog.service');
const ApiError = require('../../utils/apiError');

class TdsMasterService {
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
    return await tdsMasterRepository.findAll({
      order: [['created_at', 'DESC']]
    });
  }

  async getById(id) {
    const item = await tdsMasterRepository.findById(id);
    if (!item) throw new ApiError(404, 'TDS Master record not found.');
    return item;
  }

  async create(data, currentUser, reqInfo = {}) {
    const item = await tdsMasterRepository.create(data);
    const userInfo = this._extractReqInfo(currentUser, reqInfo);
    auditLogService.logAction({
      userId: userInfo.userId,
      username: userInfo.username,
      roleName: userInfo.roleName,
      action: 'CREATE_TDS_MASTER',
      module: 'TDSMaster',
      resourceId: item.id,
      details: { financialYear: item.financialYear, taxRegime: item.taxRegime },
      ipAddress: userInfo.ipAddress,
      userAgent: userInfo.userAgent
    });
    return item;
  }

  async update(id, data) {
    const item = await tdsMasterRepository.update(id, data);
    if (!item) throw new ApiError(404, 'TDS Master record not found.');
    return item;
  }

  async toggleStatus(id, status) {
    const item = await tdsMasterRepository.update(id, { status });
    if (!item) throw new ApiError(404, 'TDS Master record not found.');
    return item;
  }

  async delete(id) {
    const success = await tdsMasterRepository.delete(id);
    if (!success) throw new ApiError(404, 'TDS Master record not found.');
    return true;
  }
}

module.exports = new TdsMasterService();
