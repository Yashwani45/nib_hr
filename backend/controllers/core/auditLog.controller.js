// backend/controllers/core/auditLog.controller.js
const auditLogService = require('../../services/core/auditLog.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getAuditLogs = asyncHandler(async (req, res) => {
  const result = await auditLogService.getAuditLogs(req.query, req.user);
  res.status(200).json(new ApiResponse(200, result, 'Audit logs retrieved successfully.'));
});

module.exports = {
  getAuditLogs,
};
