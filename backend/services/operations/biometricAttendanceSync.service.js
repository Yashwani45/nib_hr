const { Op } = require('sequelize');
const attendanceRepository = require('../../repositories/operations/attendance.repository');
const attendanceConfigRepository = require('../../repositories/core/attendanceConfig.repository');
const auditLogService = require('../core/auditLog.service');
const ApiError = require('../../utils/apiError');
const logger = require('../../config/logger');
const { sequelize } = require('../../config/database');
const Employee = require('../../models/core/employee.model');
const BiometricDeviceUser = require('../../models/operations/biometricDeviceUser.model');
const BiometricAttendanceEvent = require('../../models/operations/biometricAttendanceEvent.model');
const BiometricDevice = require('../../models/operations/biometricDevice.model');

const SOURCE = 'ZKTECO_DEVICE_SDK_BRIDGE';
const ACTIVE = 'ACTIVE';

const normalize = value => String(value || '').trim();

const getConfiguredDevice = async (companyCode, deviceId) => {
  const config = await attendanceConfigRepository.getConfigWithMethods(companyCode);
  const biometricMethod = config?.methods?.find(method =>
    String(method.method_type).toUpperCase() === 'BIOMETRIC'
  );

  if (!biometricMethod || !biometricMethod.is_enabled) {
    throw new ApiError(403, 'Biometric attendance is not enabled for this organization.');
  }

  const devices = Array.isArray(biometricMethod.settings?.devices)
    ? biometricMethod.settings.devices
    : [];
  const device = devices.find(item =>
    normalize(item.deviceId).toLowerCase() === normalize(deviceId).toLowerCase()
  );

  if (!device) {
    throw new ApiError(403, `Device "${deviceId}" is not registered in organization attendance settings.`);
  }
  if (String(device.status || 'Active').toLowerCase() === 'inactive') {
    throw new ApiError(403, `Device "${deviceId}" is inactive. Enable it in attendance settings before syncing.`);
  }
  return device;
};

const getActiveEmployee = async employeeId => {
  const employee = await Employee.findByPk(employeeId);
  if (!employee) {
    throw new ApiError(404, 'Mapped HRMS employee no longer exists. Update the device User ID mapping.');
  }
  const status = employee.employeeStatus || employee.status;
  if (status && String(status).toLowerCase() !== 'active') {
    throw new ApiError(403, 'The mapped HRMS employee is inactive.');
  }
  return employee;
};

const formatMissingMigrationError = error => {
  if (error?.original?.code === 'ER_NO_SUCH_TABLE' || error?.parent?.code === 'ER_NO_SUCH_TABLE') {
    return new ApiError(503, 'Biometric attendance tables are missing. Apply backend/migrations/biometric_attendance.sql to this tenant database.');
  }
  return error;
};

class BiometricAttendanceSyncService {
  async registerDeviceUser({ employeeId, deviceId, deviceUserId, actor, companyCode }) {
    const cleanEmployeeId = normalize(employeeId);
    const cleanDeviceId = normalize(deviceId);
    const cleanDeviceUserId = normalize(deviceUserId);
    if (!cleanEmployeeId || !cleanDeviceId || !cleanDeviceUserId) {
      throw new ApiError(400, 'employeeId, deviceId and deviceUserId are required.');
    }

    try {
      await getConfiguredDevice(companyCode, cleanDeviceId);
      await getActiveEmployee(cleanEmployeeId);

      const deviceUser = await BiometricDeviceUser.findOne({
        where: { deviceId: cleanDeviceId, deviceUserId: cleanDeviceUserId },
      });
      if (deviceUser && deviceUser.employeeId !== cleanEmployeeId) {
        throw new ApiError(409, 'That device User ID is already mapped to another HRMS employee.');
      }

      const employeeDevice = await BiometricDeviceUser.findOne({
        where: { employeeId: cleanEmployeeId, deviceId: cleanDeviceId },
      });
      if (employeeDevice && employeeDevice.deviceUserId !== cleanDeviceUserId) {
        throw new ApiError(409, 'This employee already has a different User ID on this device. Deactivate the old mapping first.');
      }

      if (deviceUser) {
        await deviceUser.update({ status: ACTIVE, createdBy: String(actor.id || '') });
        return deviceUser;
      }

      return await BiometricDeviceUser.create({
        employeeId: cleanEmployeeId,
        deviceId: cleanDeviceId,
        deviceUserId: cleanDeviceUserId,
        status: ACTIVE,
        createdBy: String(actor.id || ''),
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ApiError(409, 'The employee or device User ID is already mapped. Check existing mappings.');
      }
      throw formatMissingMigrationError(error);
    }
  }

  async listDeviceUsers(companyCode) {
    try {
      const mappings = await BiometricDeviceUser.findAll({
        order: [['createdAt', 'DESC']],
      });
      const employeeIds = [...new Set(mappings.map(mapping => mapping.employeeId))];
      const employees = employeeIds.length
        ? await Employee.findAll({ where: { id: { [Op.in]: employeeIds } } })
        : [];
      const employeeMap = new Map(employees.map(employee => [String(employee.id), employee]));
      return mappings.map(mapping => {
        const employee = employeeMap.get(String(mapping.employeeId));
        return {
          id: mapping.id,
          employeeId: mapping.employeeId,
          employeeName: employee
            ? `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.employeeName
            : null,
          deviceId: mapping.deviceId,
          deviceUserId: mapping.deviceUserId,
          status: mapping.status,
        };
      });
    } catch (error) {
      throw formatMissingMigrationError(error);
    }
  }

  async deactivateDeviceUser(id) {
    try {
      const mapping = await BiometricDeviceUser.findByPk(id);
      if (!mapping) {
        throw new ApiError(404, 'Biometric employee mapping was not found.');
      }
      await mapping.update({ status: 'INACTIVE' });
      return mapping;
    } catch (error) {
      throw formatMissingMigrationError(error);
    }
  }

  async recordHeartbeat(companyCode, deviceId) {
    const cleanDeviceId = normalize(deviceId);
    if (!cleanDeviceId) {
      throw new ApiError(400, 'deviceId is required.');
    }
    await getConfiguredDevice(companyCode, cleanDeviceId);
    try {
      const [device] = await BiometricDevice.findOrCreate({
        where: { deviceId: cleanDeviceId },
        defaults: { deviceId: cleanDeviceId },
      });
      await device.update({ lastSeenAt: new Date() });
      return { deviceId: cleanDeviceId, receivedAt: device.lastSeenAt };
    } catch (error) {
      throw formatMissingMigrationError(error);
    }
  }

  async processDeviceEvent(companyCode, input) {
    const deviceId = normalize(input.deviceId);
    const deviceEventId = normalize(input.eventId);
    const deviceUserId = normalize(input.deviceUserId);
    const occurredAt = normalize(input.occurredAt);
    const punchType = normalize(input.punchType).toUpperCase();

    if (!deviceId || !deviceEventId || !deviceUserId || !occurredAt || !['IN', 'OUT'].includes(punchType)) {
      throw new ApiError(400, 'deviceId, eventId, deviceUserId, occurredAt and punchType (IN or OUT) are required.');
    }
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?[+-]\d{2}:\d{2}$/.test(occurredAt)) {
      throw new ApiError(400, 'occurredAt must be an ISO-8601 timestamp that includes its UTC offset.');
    }
    const eventDate = new Date(occurredAt);
    if (!Number.isFinite(eventDate.getTime())) {
      throw new ApiError(400, 'occurredAt is not a valid timestamp.');
    }
    if (eventDate.getTime() > Date.now() + 5 * 60 * 1000) {
      throw new ApiError(400, 'The device event timestamp is more than five minutes in the future. Check the device clock.');
    }

    const device = await getConfiguredDevice(companyCode, deviceId);
    try {
      const transaction = await sequelize.transaction();
      let result;
      try {
        const existingEvent = await BiometricAttendanceEvent.findOne({
          where: { deviceId, deviceEventId },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (existingEvent) {
          await transaction.rollback();
          return {
            duplicate: true,
            accepted: existingEvent.status === 'SYNCED',
            status: existingEvent.status,
            eventId: existingEvent.id,
            attendanceId: existingEvent.attendanceId,
            message: existingEvent.status === 'SYNCED'
              ? 'This physical device event was already synchronized.'
              : 'This device event was already processed and rejected as a duplicate punch.',
          };
        }

        const mapping = await BiometricDeviceUser.findOne({
          where: { deviceId, deviceUserId, status: ACTIVE },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!mapping) {
          throw new ApiError(403, `Device User ID "${deviceUserId}" has no active HRMS employee mapping.`);
        }

        const employee = await getActiveEmployee(mapping.employeeId);
        const employeeCode = employee.employeeCode || employee.emp_code || employee.employeeId || String(employee.id);
        const employeeName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim()
          || employee.employeeName
          || employee.employee_name
          || 'Employee';
        const date = occurredAt.slice(0, 10);
        const time = occurredAt.slice(11, 19);
        const todayAttendance = await attendanceRepository.model.findOne({
          where: {
            date,
            [Op.or]: [{ employeeId: employee.id }, { empId: employeeCode }],
          },
          order: [['id', 'DESC']],
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        const checkIn = todayAttendance?.checkIn || todayAttendance?.check_in;
        const checkOut = todayAttendance?.checkOut || todayAttendance?.check_out;
        let attendanceRecord = todayAttendance;
        let rejection = null;

        if (punchType === 'IN') {
          if (checkIn && checkIn !== '--') {
            rejection = 'REJECTED_DUPLICATE_PUNCH';
          } else {
            const day = new Intl.DateTimeFormat('en-US', { weekday: 'long' })
              .format(new Date(`${date}T00:00:00Z`));
            attendanceRecord = await attendanceRepository.create({
              empId: employeeCode,
              emp_id: employeeCode,
              employeeId: employee.id,
              name: employeeName,
              date,
              day,
              checkIn: time,
              check_in: time,
              checkOut: '--',
              check_out: '--',
              workingHours: 0,
              working_hours: 0,
              status: 'Present',
              verification_method: 'BIOMETRIC',
              verification_status: 'VERIFIED',
              device_id: deviceId,
              company: employee.company || companyCode,
              department: employee.department || 'Operations',
              shift: employee.shift || 'General Shift',
              device_info: SOURCE,
              attendance_location: device.location || device.deviceName || 'Biometric device',
              remarks: 'Verified physical device event synchronized by the trusted SDK bridge.',
            }, { transaction });
          }
        } else if (!todayAttendance || !checkIn || checkIn === '--' || (checkOut && checkOut !== '--')) {
          rejection = 'REJECTED_NO_ACTIVE_CHECK_IN';
        } else {
          const checkInDate = new Date(`${date}T${String(checkIn).slice(0, 8)}`);
          const workingHours = Number.isFinite(checkInDate.getTime())
            ? Math.max(0, Number(((eventDate.getTime() - checkInDate.getTime()) / 3600000).toFixed(2)))
            : 0;
          await todayAttendance.update({
            checkOut: time,
            check_out: time,
            workingHours,
            working_hours: workingHours,
            verification_method: 'BIOMETRIC',
            verification_status: 'VERIFIED',
            device_id: deviceId,
            device_info: SOURCE,
            remarks: 'Verified physical device event synchronized by the trusted SDK bridge.',
          }, { transaction });
        }

        const syncedEvent = await BiometricAttendanceEvent.create({
          deviceId,
          deviceEventId,
          employeeId: employee.id,
          deviceUserId,
          eventTimestamp: eventDate,
          punchType,
          source: SOURCE,
          attendanceId: attendanceRecord?.id || todayAttendance?.id || null,
          status: rejection || 'SYNCED',
          createdAt: new Date(),
        }, { transaction });

        await BiometricDevice.upsert({
          deviceId,
          lastSeenAt: new Date(),
        }, { transaction });
        await transaction.commit();

        result = {
          duplicate: false,
          accepted: !rejection,
          status: rejection || 'SYNCED',
          eventId: syncedEvent.id,
          attendanceId: syncedEvent.attendanceId,
          employeeId: employee.id,
          employeeName,
          deviceId,
          deviceUserId,
          punchType,
          occurredAt,
          message: rejection
            ? punchType === 'IN'
              ? 'A check-in already exists for this employee and date. The duplicate device event was retained but did not change attendance.'
              : 'No active check-in exists for this employee and date. The device event was retained but did not change attendance.'
            : `Punch ${punchType === 'IN' ? 'In' : 'Out'} Successful`,
        };
      } catch (error) {
        if (!transaction.finished) {
          await transaction.rollback();
        }
        if (error.name === 'SequelizeUniqueConstraintError') {
          const savedEvent = await BiometricAttendanceEvent.findOne({ where: { deviceId, deviceEventId } });
          if (savedEvent) {
            return {
              duplicate: true,
              accepted: savedEvent.status === 'SYNCED',
              status: savedEvent.status,
              eventId: savedEvent.id,
              attendanceId: savedEvent.attendanceId,
              message: 'This physical device event was already synchronized.',
            };
          }
        }
        throw error;
      }

      await auditLogService.log({
        userId: result.employeeId,
        username: result.employeeName || 'Employee',
        roleName: 'Employee',
        actionType: `Biometric Punch ${punchType}`,
        moduleName: 'Attendance',
        recordId: String(result.attendanceId || result.eventId),
        newValues: {
          deviceId,
          deviceUserId,
          eventId: deviceEventId,
          eventTimestamp: occurredAt,
          punchType,
          source: SOURCE,
          status: result.status,
        },
        httpMethod: 'POST',
        apiEndpoint: '/api/operations/attendance/biometric/events',
        status: result.accepted ? 'Success' : 'Failure',
        failureReason: result.accepted ? undefined : result.message,
      });

      if (!result.accepted) {
        logger.warn(`Rejected biometric punch event ${deviceEventId} for mapped employee ${result.employeeId}: ${result.status}`);
      } else {
        logger.info(`Synchronized biometric ${punchType} event ${deviceEventId} for employee ${result.employeeId} from device ${deviceId}.`);
      }
      return result;
    } catch (error) {
      throw formatMissingMigrationError(error);
    }
  }

  async getEmployeeStatus(user, companyCode) {
    const identityConditions = [];
    if (user?.employee?.id) identityConditions.push({ id: user.employee.id });
    if (user?.id) {
      identityConditions.push({ id: user.id });
      identityConditions.push({ userId: user.id });
    }
    if (user?.email) {
      identityConditions.push({ email: user.email });
      identityConditions.push({ officialEmail: user.email });
    }
    if (!identityConditions.length) {
      throw new ApiError(401, 'The authenticated session has no employee identity.');
    }

    const employee = await Employee.findOne({ where: { [Op.or]: identityConditions } });
    if (!employee) {
      throw new ApiError(403, 'This account is not linked to an HRMS employee profile. Contact HR to link it before using biometric attendance.');
    }

    const mapping = await BiometricDeviceUser.findAll({
      where: { employeeId: employee.id, status: ACTIVE },
    }).catch(error => { throw formatMissingMigrationError(error); });
    const devices = await Promise.all(mapping.map(async item => {
      const device = await BiometricDevice.findByPk(item.deviceId).catch(error => {
        throw formatMissingMigrationError(error);
      });
      const lastSeen = device?.lastSeenAt ? new Date(device.lastSeenAt) : null;
      const ttlSeconds = Number.parseInt(process.env.BIOMETRIC_DEVICE_HEARTBEAT_TTL_SECONDS || '180', 10);
      const connected = Boolean(lastSeen && Date.now() - lastSeen.getTime() <= ttlSeconds * 1000);
      return {
        deviceId: item.deviceId,
        deviceUserId: item.deviceUserId,
        connectionStatus: connected ? 'CONNECTED' : lastSeen ? 'OFFLINE' : 'UNKNOWN',
        lastSeenAt: lastSeen,
      };
    }));

    const latestEvent = await BiometricAttendanceEvent.findOne({
      where: { employeeId: employee.id },
      order: [['eventTimestamp', 'DESC']],
    }).catch(error => { throw formatMissingMigrationError(error); });

    const today = new Date().toISOString().slice(0, 10);
    const employeeCode = employee.employeeCode || employee.emp_code || employee.employeeId || String(employee.id);
    const attendance = await attendanceRepository.model.findOne({
      where: {
        date: today,
        [Op.or]: [{ employeeId: employee.id }, { empId: employeeCode }],
      },
      order: [['id', 'DESC']],
    });
    const checkIn = attendance?.checkIn || attendance?.check_in || null;
    const checkOut = attendance?.checkOut || attendance?.check_out || null;
    const isCheckedIn = Boolean(checkIn && checkIn !== '--');
    const isCheckedOut = Boolean(checkOut && checkOut !== '--');

    return {
      employee: {
        id: employee.id,
        employeeCode,
        name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.employeeName || 'Employee',
      },
      mappingConfigured: devices.length > 0,
      devices,
      today: { checkIn, checkOut, isCheckedIn, isCheckedOut },
      nextAction: !isCheckedIn ? 'IN' : !isCheckedOut ? 'OUT' : 'DONE',
      latestEvent: latestEvent ? {
        id: latestEvent.id,
        deviceId: latestEvent.deviceId,
        deviceUserId: latestEvent.deviceUserId,
        occurredAt: latestEvent.eventTimestamp,
        punchType: latestEvent.punchType,
        status: latestEvent.status,
      } : null,
    };
  }
}

module.exports = new BiometricAttendanceSyncService();
