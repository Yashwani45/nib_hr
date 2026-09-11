// backend/services/core/designation.service.js
const designationRepository = require('../../repositories/core/designation.repository');
const auditLogService = require('./auditLog.service');
const ApiError = require('../../utils/apiError');

class DesignationService {
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
    return await designationRepository.findAll({
      order: [['created_at', 'DESC']]
    });
  }

  async getById(id) {
    const item = await designationRepository.findById(id);
    if (!item) throw new ApiError(404, 'Designation record not found.');
    return item;
  }

  async create(data, currentUser, reqInfo = {}) {
    const item = await designationRepository.create(data);
    
    // Audit logging
    const userInfo = this._extractReqInfo(currentUser, reqInfo);
    auditLogService.logAction({
      userId: userInfo.userId,
      username: userInfo.username,
      roleName: userInfo.roleName,
      action: 'CREATE_DESIGNATION',
      module: 'DesignationMaster',
      resourceId: item.id,
      details: { desigCode: item.desigCode, desigName: item.desigName },
      ipAddress: userInfo.ipAddress,
      userAgent: userInfo.userAgent
    });

    return item;
  }

  async update(id, data, currentUser, reqInfo = {}) {
    const item = await designationRepository.update(id, data);
    if (!item) throw new ApiError(404, 'Designation record not found.');

    const userInfo = this._extractReqInfo(currentUser, reqInfo);
    auditLogService.logAction({
      userId: userInfo.userId,
      username: userInfo.username,
      roleName: userInfo.roleName,
      action: 'UPDATE_DESIGNATION',
      module: 'DesignationMaster',
      resourceId: item.id,
      details: data,
      ipAddress: userInfo.ipAddress,
      userAgent: userInfo.userAgent
    });

    return item;
  }

  async toggleStatus(id, status, currentUser, reqInfo = {}) {
    const item = await designationRepository.update(id, { status });
    if (!item) throw new ApiError(404, 'Designation record not found.');
    return item;
  }

  async delete(id, currentUser, reqInfo = {}) {
    const success = await designationRepository.delete(id);
    if (!success) throw new ApiError(404, 'Designation record not found.');
    return true;
  }
}

module.exports = new DesignationService();
