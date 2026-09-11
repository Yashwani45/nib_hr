// backend/services/core/auditLog.service.js
const auditLogRepository = require('../../repositories/core/auditLog.repository');
const { Op } = require('sequelize');

class AuditLogService {
  async log({
    userId,
    username,
    roleName,
    actionType,
    moduleName,
    recordId,
    previousValues,
    newValues,
    httpMethod,
    apiEndpoint,
    requestBody,
    ipAddress,
    userAgent,
    browser,
    device,
    os,
    status = 'Success',
    failureReason,
  }) {
    try {
      let cleanRoleName = roleName;
      if (roleName && typeof roleName === 'object') {
        cleanRoleName = roleName.roleName || roleName.name || 'Admin';
      }

      const payload = {
        userId,
        username,
        roleName: cleanRoleName || 'Admin',
        actionType,
        moduleName,
        recordId,
        previousValues: previousValues ? JSON.stringify(previousValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        httpMethod,
        apiEndpoint,
        requestBody: requestBody ? JSON.stringify(requestBody) : null,
        ipAddress,
        userAgent,
        browser,
        device,
        os,
        status,
        failureReason,
      };
      return await auditLogRepository.create(payload);
    } catch (error) {
      console.error('Failed to write audit log to database:', error);
      // Fail silently to prevent interrupting application execution for logging issues
      return null;
    }
  }

  async getAuditLogs(options = {}, currentUser) {
    const {
      page = 1,
      limit = 10,
      search = '',
      userId,
      roleName,
      moduleName,
      actionType,
      ipAddress,
      status,
      startDate,
      endDate,
      sortBy = 'id',
      sortOrder = 'DESC',
    } = options;

    const offset = (page - 1) * limit;
    const where = {};

    // RBAC filtering constraints:
    // HR/Admin roles can view all logs.
    // Managers can only view logs related to their department/team (for now, we'll let them see their own or we filter based on department details if we join).
    // Employees can ONLY view their own logs.
    const userRole = currentUser?.role?.roleName || currentUser?.role?.name;
    if (userRole === 'Employee') {
      where.userId = currentUser.id;
    } else if (userRole === 'Manager') {
      // Limit to manager's own activities + their team members' activities if requested
      // For simplicity, we filter where userId is current manager's ID OR they can see logs matching team member IDs.
      where.userId = currentUser.id;
    }

    // Direct filters
    if (userId && userRole !== 'Employee') {
      where.userId = userId;
    }
    if (roleName) {
      where.roleName = roleName;
    }
    if (moduleName) {
      where.moduleName = moduleName;
    }
    if (actionType) {
      where.actionType = actionType;
    }
    if (ipAddress) {
      where.ipAddress = ipAddress;
    }
    if (status) {
      where.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.timestamp[Op.lte] = new Date(endDate);
      }
    }

    // Search query matches
    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { actionType: { [Op.like]: `%${search}%` } },
        { moduleName: { [Op.like]: `%${search}%` } },
        { apiEndpoint: { [Op.like]: `%${search}%` } },
      ];
    }

    const queryOptions = {
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [[sortBy, sortOrder]],
      where,
    };

    return await auditLogRepository.findAndCountAll(queryOptions);
  }
}

module.exports = new AuditLogService();
