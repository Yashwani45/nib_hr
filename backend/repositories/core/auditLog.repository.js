// backend/repositories/core/auditLog.repository.js
const BaseRepository = require('../base.repository');
const { AuditLog } = require('../../models');

class AuditLogRepository extends BaseRepository {
  constructor() {
    super(AuditLog);
  }
}

module.exports = new AuditLogRepository();
