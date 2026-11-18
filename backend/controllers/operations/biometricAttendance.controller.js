const crypto = require('crypto');
const biometricAttendanceSyncService = require('../../services/operations/biometricAttendanceSync.service');
const auditLogService = require('../../services/core/auditLog.service');
const ApiError = require('../../utils/apiError');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getSyncSecret = () => {
  const secret = process.env.BIOMETRIC_SYNC_SECRET || '';
  if (secret.length < 32) {
    throw new ApiError(503, 'Biometric SDK bridge is not configured. Set BIOMETRIC_SYNC_SECRET to a random value of at least 32 characters.');
  }
  return secret;
};

const verifyBridgeSignature = (req, operation, fields) => {
  const secret = getSyncSecret();
  const companyCode = String(req.companyCode || req.headers['x-company-code'] || '').trim().toUpperCase();
  const timestamp = String(req.headers['x-biometric-timestamp'] || '');
  const receivedSignature = String(req.headers['x-biometric-signature'] || '').toLowerCase();
  if (!companyCode) {
    throw new ApiError(400, 'X-Company-Code is required for biometric synchronization.');
  }
  if (!/^\d{10}$/.test(timestamp)) {
    throw new ApiError(401, 'Missing or invalid X-Biometric-Timestamp. Send the current Unix timestamp in seconds.');
  }
  if (Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp)) > 300) {
    throw new ApiError(401, 'Biometric bridge request expired. Check bridge clock synchronization and retry.');
  }
  if (!/^[a-f0-9]{64}$/.test(receivedSignature)) {
    throw new ApiError(401, 'Missing or invalid X-Biometric-Signature.');
  }

  const message = [companyCode, timestamp, operation, ...fields.map(value => String(value || '').trim())].join('\n');
  const expected = crypto.createHmac('sha256', secret).update(message, 'utf8').digest();
  const received = Buffer.from(receivedSignature, 'hex');
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    throw new ApiError(401, 'Biometric bridge signature is invalid.');
  }
  return companyCode;
};

const receiveDeviceEvent = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const fields = [body.deviceId, body.eventId, body.deviceUserId, body.occurredAt, String(body.punchType || '').toUpperCase()];
  const companyCode = verifyBridgeSignature(req, 'EVENT', fields);
  const result = await biometricAttendanceSyncService.processDeviceEvent(companyCode, {
    ...body,
    punchType: String(body.punchType || '').toUpperCase(),
  });

  const statusCode = result.accepted ? 200 : 409;
  res.status(statusCode).json(new ApiResponse(statusCode, result, result.message));
});

const receiveHeartbeat = asyncHandler(async (req, res) => {
  const deviceId = String(req.body?.deviceId || '').trim();
  const companyCode = verifyBridgeSignature(req, 'HEARTBEAT', [deviceId]);
  const result = await biometricAttendanceSyncService.recordHeartbeat(companyCode, deviceId);
  res.status(200).json(new ApiResponse(200, result, 'Biometric bridge heartbeat received.'));
});

const getEmployeeStatus = asyncHandler(async (req, res) => {
  const result = await biometricAttendanceSyncService.getEmployeeStatus(req.user, req.companyCode);
  res.status(200).json(new ApiResponse(200, result, 'Biometric attendance status retrieved.'));
});

const listDeviceUsers = asyncHandler(async (req, res) => {
  const mappings = await biometricAttendanceSyncService.listDeviceUsers(req.companyCode);
  res.status(200).json(new ApiResponse(200, mappings, 'Biometric employee mappings retrieved.'));
});

const registerDeviceUser = asyncHandler(async (req, res) => {
  const mapping = await biometricAttendanceSyncService.registerDeviceUser({
    employeeId: req.body?.employeeId,
    deviceId: req.body?.deviceId,
    deviceUserId: req.body?.deviceUserId,
    actor: req.user,
    companyCode: req.companyCode,
  });
  await auditLogService.log({
    userId: req.user?.id,
    username: req.user?.email || 'HR',
    roleName: req.user?.role,
    actionType: 'Register Biometric Device User',
    moduleName: 'Attendance',
    recordId: String(mapping.id),
    newValues: {
      employeeId: mapping.employeeId,
      deviceId: mapping.deviceId,
      deviceUserId: mapping.deviceUserId,
    },
    httpMethod: 'POST',
    apiEndpoint: '/api/operations/attendance/biometric/device-users',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    status: 'Success',
  });
  res.status(201).json(new ApiResponse(201, mapping, 'Biometric employee mapping registered.'));
});

const deactivateDeviceUser = asyncHandler(async (req, res) => {
  const mapping = await biometricAttendanceSyncService.deactivateDeviceUser(req.params.id);
  await auditLogService.log({
    userId: req.user?.id,
    username: req.user?.email || 'HR',
    roleName: req.user?.role,
    actionType: 'Deactivate Biometric Device User',
    moduleName: 'Attendance',
    recordId: String(mapping.id),
    newValues: {
      employeeId: mapping.employeeId,
      deviceId: mapping.deviceId,
      deviceUserId: mapping.deviceUserId,
      status: mapping.status,
    },
    httpMethod: 'DELETE',
    apiEndpoint: `/api/operations/attendance/biometric/device-users/${req.params.id}`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    status: 'Success',
  });
  res.status(200).json(new ApiResponse(200, mapping, 'Biometric employee mapping deactivated.'));
});

module.exports = {
  receiveDeviceEvent,
  receiveHeartbeat,
  getEmployeeStatus,
  listDeviceUsers,
  registerDeviceUser,
  deactivateDeviceUser,
};
