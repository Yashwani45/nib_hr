// backend/services/operations/companyQr.service.js
const qrAdapter = require('./attendance/adapters/qr.adapter');
const geoAdapter = require('./attendance/adapters/geo.adapter');
const attendanceService = require('./attendance.service');
const attendanceConfigRepository = require('../../repositories/core/attendanceConfig.repository');
const attendanceRepository = require('../../repositories/operations/attendance.repository');
const auditLogService = require('../core/auditLog.service');
const ApiError = require('../../utils/apiError');
const { tenantStorage, sequelize, masterSequelize } = require('../../config/database');
const { getTenantConnection } = require('../../config/connectionManager');
const { Op } = require('sequelize');

class CompanyQrService {
  /**
   * Helper to resolve active DB for tenant operations.
   */
  getActiveDb() {
    return tenantStorage.getStore() || sequelize;
  }

  /**
   * Enforces strict RBAC company isolation:
   * SuperAdmin has multi-tenant authority.
   * Company Admin is strictly restricted to their authorized company.
   */
  validateAdminCompanyAccess(user, requestedCompanyCode) {
    if (!user) {
      throw new ApiError(401, 'Authentication required to manage company QR code.');
    }

    const roleName = String(user.role?.name || user.role || '').toLowerCase();
    const isSuperAdmin = roleName === 'superadmin' || String(user.email || '').toLowerCase() === 'superadmin@nib.com';

    if (isSuperAdmin) {
      return true; // SuperAdmin can manage any company
    }

    const userCompany = String(user.companyCode || user.company || '').toLowerCase().trim();
    const targetCompany = String(requestedCompanyCode || '').toLowerCase().trim();

    if (userCompany && targetCompany && userCompany !== targetCompany) {
      throw new ApiError(403, `Access Denied: You are not authorized to generate or manage QR codes for company "${requestedCompanyCode}". You can only manage "${user.companyCode || user.company}".`);
    }

    return true;
  }

  /**
   * Resolve company display name and official code.
   */
  async resolveCompanyDetails(companyCode) {
    const cleanCode = String(companyCode || 'YASHTECH').trim();
    const activeDb = this.getActiveDb();

    let companyName = cleanCode;
    try {
      const [rows] = await activeDb.query(
        'SELECT companyName, company_name, companyCode, company_code FROM company WHERE LOWER(companyCode) = ? OR LOWER(company_code) = ? LIMIT 1',
        { replacements: [cleanCode.toLowerCase(), cleanCode.toLowerCase()] }
      );
      if (rows && rows.length > 0) {
        companyName = rows[0].companyName || rows[0].company_name || cleanCode;
      }
    } catch (e) {
      // Fallback
    }

    if (companyName === cleanCode && activeDb !== masterSequelize) {
      try {
        const [mRows] = await masterSequelize.query(
          'SELECT company_name, company_code FROM tenants WHERE LOWER(id) = ? OR LOWER(company_code) = ? LIMIT 1',
          { replacements: [cleanCode.toLowerCase(), cleanCode.toLowerCase()] }
        );
        if (mRows && mRows.length > 0) {
          companyName = mRows[0].company_name || cleanCode;
        }
      } catch (me) {}
    }

    return {
      companyCode: cleanCode,
      companyName,
    };
  }

  /**
   * Retrieves current QR Attendance configuration and status for a company.
   */
  async getCompanyQrStatus(companyCode, user) {
    this.validateAdminCompanyAccess(user, companyCode);
    const { companyName } = await this.resolveCompanyDetails(companyCode);

    const config = await attendanceConfigRepository.getConfigWithMethods(companyCode);
    const qrMethod = (config?.methods || []).find(m => String(m.method_type).toUpperCase() === 'QR');

    const isEnabled = qrMethod ? Boolean(qrMethod.is_enabled) : false;
    const settings = qrMethod?.settings || {};

    return {
      companyCode: String(companyCode).toLowerCase(),
      companyName,
      isEnabled,
      status: isEnabled ? 'ACTIVE' : 'DISABLED',
      rotationSeconds: parseInt(settings.rotationSeconds || 60, 10),
      lastRevokedAt: settings.lastRevokedAt || null,
      requireDynamic: settings.requireDynamic !== false,
      allowSelfScan: settings.allowSelfScan !== false,
    };
  }

  /**
   * Generates a fresh dynamic, cryptographically signed Company QR code.
   * Auto-refreshes every 30-60 seconds.
   */
  async generateCompanyQr(companyCode, user, options = {}) {
    this.validateAdminCompanyAccess(user, companyCode);
    const { companyName } = await this.resolveCompanyDetails(companyCode);

    const config = await attendanceConfigRepository.getConfigWithMethods(companyCode);
    let qrMethod = (config?.methods || []).find(m => String(m.method_type).toUpperCase() === 'QR');

    // Auto-enable QR method if not configured yet or requested
    if (!qrMethod || options.forceEnable) {
      await attendanceConfigRepository.upsertConfig(
        companyCode,
        {
          QR: {
            isEnabled: true,
            settings: {
              rotationSeconds: options.rotationSeconds || 60,
              requireDynamic: true,
              allowSelfScan: true,
            },
          },
        },
        { companyCode, companyName }
      );
      const reloaded = await attendanceConfigRepository.getConfigWithMethods(companyCode);
      qrMethod = (reloaded?.methods || []).find(m => String(m.method_type).toUpperCase() === 'QR');
    }

    let settings = qrMethod?.settings || {};
    const requestedRotation = options.rotationSeconds ? parseInt(options.rotationSeconds, 10) : null;
    if (requestedRotation && requestedRotation > 0 && requestedRotation !== settings.rotationSeconds) {
      settings = {
        ...settings,
        rotationSeconds: requestedRotation,
      };
      await attendanceConfigRepository.upsertConfig(
        companyCode,
        {
          QR: {
            isEnabled: qrMethod ? Boolean(qrMethod.is_enabled) : true,
            settings,
          },
        },
        { companyCode, companyName }
      );
      const reloaded = await attendanceConfigRepository.getConfigWithMethods(companyCode);
      qrMethod = (reloaded?.methods || []).find(m => String(m.method_type).toUpperCase() === 'QR');
    }

    const rotationSeconds = parseInt(options.rotationSeconds || settings.rotationSeconds || 60, 10);

    const qrResult = await qrAdapter.generateCompanyToken(
      {
        companyCode,
        companyName,
        rotationSeconds,
      },
      settings
    );

    return {
      ...qrResult,
      isEnabled: Boolean(qrMethod?.is_enabled),
      lastRevokedAt: settings.lastRevokedAt || null,
    };
  }

  /**
   * Revokes the current Company QR code immediately.
   * Sets lastRevokedAt = now() so all past tokens/screenshots are instantly rejected,
   * and generates a new signed token.
   */
  async revokeCompanyQr(companyCode, user) {
    this.validateAdminCompanyAccess(user, companyCode);
    const { companyName } = await this.resolveCompanyDetails(companyCode);

    const nowIso = new Date().toISOString();
    const config = await attendanceConfigRepository.getConfigWithMethods(companyCode);
    const qrMethod = (config?.methods || []).find(m => String(m.method_type).toUpperCase() === 'QR');
    const existingSettings = qrMethod?.settings || {};

    const updatedSettings = {
      ...existingSettings,
      lastRevokedAt: nowIso,
    };

    await attendanceConfigRepository.upsertConfig(
      companyCode,
      {
        QR: {
          isEnabled: qrMethod ? Boolean(qrMethod.is_enabled) : true,
          settings: updatedSettings,
        },
      },
      { companyCode, companyName }
    );

    // Audit log revocation
    await auditLogService.log({
      userId: user.id || 'admin',
      username: user.email || 'Admin',
      roleName: user.role?.name || 'Admin',
      actionType: 'Revoke Company QR Code',
      moduleName: 'Attendance',
      recordId: companyCode,
      newValues: { lastRevokedAt: nowIso },
      httpMethod: 'POST',
      apiEndpoint: '/api/operations/attendance/company-qr/revoke',
      status: 'Success',
    });

    // Generate fresh token immediately
    const freshQr = await qrAdapter.generateCompanyToken(
      {
        companyCode,
        companyName,
        rotationSeconds: updatedSettings.rotationSeconds || 60,
      },
      updatedSettings
    );

    return {
      success: true,
      message: 'Company QR Code has been revoked. All previous tokens and screenshots are now invalid.',
      revokedAt: nowIso,
      freshQr,
    };
  }

  /**
   * Enables or disables QR attendance for a company.
   */
  async toggleCompanyQr(companyCode, isEnabled, user) {
    this.validateAdminCompanyAccess(user, companyCode);
    const { companyName } = await this.resolveCompanyDetails(companyCode);

    const config = await attendanceConfigRepository.getConfigWithMethods(companyCode);
    const qrMethod = (config?.methods || []).find(m => String(m.method_type).toUpperCase() === 'QR');
    const existingSettings = qrMethod?.settings || {};

    await attendanceConfigRepository.upsertConfig(
      companyCode,
      {
        QR: {
          isEnabled: Boolean(isEnabled),
          settings: existingSettings,
        },
      },
      { companyCode, companyName }
    );

    await auditLogService.log({
      userId: user.id || 'admin',
      username: user.email || 'Admin',
      roleName: user.role?.name || 'Admin',
      actionType: isEnabled ? 'Enable QR Attendance' : 'Disable QR Attendance',
      moduleName: 'Attendance',
      recordId: companyCode,
      newValues: { is_enabled: Boolean(isEnabled) },
      httpMethod: 'PATCH',
      apiEndpoint: '/api/operations/attendance/company-qr/toggle',
      status: 'Success',
    });

    return {
      companyCode,
      isEnabled: Boolean(isEnabled),
      status: isEnabled ? 'ACTIVE' : 'DISABLED',
      message: `Company QR Attendance is now ${isEnabled ? 'ACTIVE' : 'DISABLED'}.`,
    };
  }

  /**
   * Core Employee Action: Scans Company QR Code from device camera.
   * Auto-records Check-In (1st scan) or Check-Out (2nd scan).
   */
  async scanCompanyQrPunch(userId, qrToken, context = {}) {
    if (!qrToken || typeof qrToken !== 'string') {
      throw new ApiError(400, 'QR Token payload is required for scanning.');
    }

    // 1. Resolve Authenticated Employee from Session / JWT
    const employee = await attendanceService.resolveEmployee(userId, context);
    if (!employee) {
      throw new ApiError(404, 'Employee profile not associated with this account. Please contact HR.');
    }

    const employeeCompany = String(context.companyCode || employee.company || 'YASHTECH').toLowerCase().trim();

    // 2. Decode and Verify QR Token Signature & Expiry
    const parts = qrToken.trim().split('.');
    if (parts.length !== 2) {
      throw new ApiError(400, 'Malformed QR code token. Please scan an authorized Company QR code.');
    }

    let tokenPayload;
    try {
      const decodedJson = Buffer.from(parts[0], 'base64url').toString('utf8');
      tokenPayload = JSON.parse(decodedJson);
    } catch (e) {
      throw new ApiError(400, 'Invalid QR code data format.');
    }

    const targetCompanyCode = String(tokenPayload.companyCode || tokenPayload.org || '').toLowerCase().trim();

    // 3. Fetch Company Attendance Config & Check if QR Method is Active
    const config = await attendanceConfigRepository.getConfigWithMethods(targetCompanyCode);
    const qrMethod = (config?.methods || []).find(m => String(m.method_type).toUpperCase() === 'QR');

    if (!qrMethod || !qrMethod.is_enabled) {
      throw new ApiError(403, `QR Attendance is currently disabled by Admin for ${tokenPayload.companyName || targetCompanyCode.toUpperCase()}.`);
    }

    const settings = qrMethod.settings || {};

    // 4. Verify Cryptographic Signature, Expiration, Revocation & Replay via Adapter
    const verificationResult = qrAdapter.verify(qrToken, employeeCompany, employee.id, settings);
    if (!verificationResult.verified) {
      throw new ApiError(400, verificationResult.message);
    }

    // 5. Date and Server Time
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now);

    const empCode = employee.employeeCode || employee.emp_code || employee.employeeId || String(employee.id);
    const empName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.employee_name || 'Employee';

    // 6. Find and record attendance inside a database transaction to prevent race conditions & duplicates
    const activeDb = this.getActiveDb();

    return await activeDb.transaction(async (transaction) => {
      const existing = await attendanceRepository.findOne({
        where: {
          [Op.or]: [
            { empId: empCode },
            { employeeId: employee.id },
          ],
          date: dateStr,
        },
        order: [['id', 'DESC']],
        transaction,
      });

      // 7. Physical presence & Geolocation verification
      const geoMethod = (config?.methods || []).find(m => String(m.method_type).toUpperCase() === 'GEO');
      let matchedLocation = `${tokenPayload.companyName || targetCompanyCode.toUpperCase()} Entrance Kiosk`;
      let verifiedLat = null;
      let verifiedLon = null;
      let verifiedAcc = null;

      const hasCoordinates = context.latitude !== undefined && context.latitude !== null && context.longitude !== undefined && context.longitude !== null && !isNaN(parseFloat(context.latitude)) && !isNaN(parseFloat(context.longitude));

      if (hasCoordinates) {
        if (geoMethod && geoMethod.is_enabled && Array.isArray(geoMethod.settings?.locations) && geoMethod.settings.locations.length > 0) {
          const geoResult = geoAdapter.verify(
            { latitude: context.latitude, longitude: context.longitude, accuracy: context.accuracy },
            geoMethod.settings
          );
          if (!geoResult.verified) {
            throw new ApiError(400, `Physical presence verification failed: ${geoResult.message}`);
          }
          matchedLocation = geoResult.matchedLocation || matchedLocation;
        }
        verifiedLat = parseFloat(context.latitude);
        verifiedLon = parseFloat(context.longitude);
        verifiedAcc = context.accuracy ? parseFloat(context.accuracy) : null;
      } else if (settings?.requireGeolocation === true || (geoMethod && geoMethod.is_enabled && geoMethod.settings?.enforceWithQr === true)) {
        throw new ApiError(400, 'Physical presence verification required: Please allow device location access to verify you are present at the office.');
      }

      let action = 'clock-in';
      let attendanceRecord = null;
      let message = '';

      // Check if employee has ALREADY completed both check-in and check-out today
      if (existing && existing.checkIn && existing.checkIn !== '--' && existing.checkOut && existing.checkOut !== '--') {
        throw new ApiError(400, `Attendance already completed for today. You checked in at ${existing.checkIn} and checked out at ${existing.checkOut}.`);
      }

      // CASE A: Fresh Check-In (No attendance record yet today or check-in not recorded)
      if (!existing || !existing.checkIn || existing.checkIn === '--') {
        // Calculate Shift & Late Arrival
        let status = 'Present';
        let lateComing = 0;
        const shiftStart = '09:00:00';
        const graceMinutes = 15;
        try {
          const [sh, sm] = shiftStart.split(':').map(Number);
          const shiftLimit = new Date();
          shiftLimit.setHours(sh, sm + graceMinutes, 0, 0);
          if (now > shiftLimit) {
            status = 'Late';
            lateComing = Math.floor((now - shiftLimit) / 60000);
          }
        } catch (e) {}

        const createPayload = {
          empId: empCode,
          emp_id: empCode,
          employeeId: employee.id,
          name: empName,
          date: dateStr,
          day: dayName,
          checkIn: timeStr,
          check_in: timeStr,
          checkOut: '--',
          check_out: '--',
          workingHours: 0.0,
          working_hours: 0.0,
          status,
          lateComing,
          earlyLeaving: 0,
          overtime: 0,
          verification_method: 'QR',
          verification_status: 'VERIFIED',
          latitude: verifiedLat,
          longitude: verifiedLon,
          accuracy: verifiedAcc,
          attendance_location: matchedLocation,
          device_id: 'COMPANY-QR',
          company: employee.company || targetCompanyCode,
          branch: employee.branch || 'Headquarters',
          department: employee.department || 'Operations',
          shift: employee.shift || 'General Shift',
          ip_address: context.ip || '127.0.0.1',
          device_info: context.userAgent || 'Mobile / Desktop QR Scanner',
          remarks: `Checked in via Company QR (${tokenPayload.companyName || targetCompanyCode.toUpperCase()})`,
        };

        if (existing) {
          await attendanceRepository.update(existing.id, createPayload, { transaction });
          attendanceRecord = await attendanceRepository.findById(existing.id, [], { transaction });
        } else {
          attendanceRecord = await attendanceRepository.create(createPayload, { transaction });
        }

        action = 'clock-in';
        message = `Punch In recorded at ${timeStr}. Verified via ${tokenPayload.companyName || targetCompanyCode.toUpperCase()} QR.`;
      } else {
        // CASE B: Check-Out (Active check-in exists, now marking check-out)
        // Rapid accidental double-scan safeguard: Prevent checkout if checked in within last 45 seconds
        try {
          const [inH, inM, inS] = (existing.checkIn || '09:00:00').split(':').map(Number);
          const checkInDate = new Date();
          checkInDate.setHours(inH, inM, inS || 0, 0);
          const diffMs = now - checkInDate;
          if (diffMs > 0 && diffMs < 45 * 1000) {
            throw new ApiError(400, `You have already checked in at ${existing.checkIn}. Please wait before checking out.`);
          }
        } catch (checkErr) {
          if (checkErr instanceof ApiError) throw checkErr;
        }

        // Calculate working hours
        let workingHours = 8.5;
        try {
          const [inH, inM] = existing.checkIn.split(':').map(Number);
          const inDate = new Date();
          inDate.setHours(inH, inM, 0, 0);
          const diffMs = now - inDate;
          if (diffMs > 0) {
            workingHours = parseFloat((diffMs / 3600000).toFixed(2));
          }
        } catch (e) {}

        const updatePayload = {
          checkOut: timeStr,
          check_out: timeStr,
          workingHours,
          working_hours: workingHours,
          day: existing.day || dayName,
          department: existing.department || employee.department || 'Operations',
          name: existing.name || empName,
          device_id: 'COMPANY-QR',
          latitude: verifiedLat || existing.latitude,
          longitude: verifiedLon || existing.longitude,
          accuracy: verifiedAcc || existing.accuracy,
          attendance_location: matchedLocation || existing.attendance_location,
          remarks: existing.remarks || `Checked out via Company QR (${tokenPayload.companyName || targetCompanyCode.toUpperCase()})`,
        };

        await attendanceRepository.update(existing.id, updatePayload, { transaction });
        attendanceRecord = await attendanceRepository.findById(existing.id, [], { transaction });

        action = 'clock-out';
        message = `Punch Out recorded at ${timeStr}. Shift Duration: ${workingHours} hrs. Verified via Company QR.`;
      }

      // 8. Write to Audit Log
      try {
        await auditLogService.log({
          userId,
          username: employee.email || employee.officialEmail || 'Employee',
          roleName: 'Employee',
          actionType: `Punch ${action === 'clock-in' ? 'In' : 'Out'} (Company QR)`,
          moduleName: 'Attendance',
          recordId: String(attendanceRecord.id),
          newValues: {
            empId: empCode,
            name: empName,
            action,
            time: timeStr,
            company: targetCompanyCode,
          },
          httpMethod: 'POST',
          apiEndpoint: '/api/operations/attendance/company-qr/scan-punch',
          ipAddress: context.ip,
          userAgent: context.userAgent,
          status: 'Success',
        });
      } catch (logErr) {}

      return {
        success: true,
        action,
        time: timeStr,
        date: dateStr,
        employee: {
          id: employee.id,
          empId: empCode,
          name: empName,
          department: employee.department || 'Operations',
        },
        company: {
          code: targetCompanyCode,
          name: tokenPayload.companyName || targetCompanyCode.toUpperCase(),
        },
        attendanceRecord: attendanceRecord.toJSON ? attendanceRecord.toJSON() : attendanceRecord,
        message,
      };
    });
  }

  /**
   * Fetch recent QR scans for a company to display in Admin console audit trail.
   */
  async getRecentCompanyQrScans(companyCode, limit = 15) {
    const cleanCode = String(companyCode || 'YASHTECH').trim().toLowerCase();
    const activeDb = this.getActiveDb();

    try {
      const [records] = await activeDb.query(
        `SELECT id, empId, name, date, day, department, checkIn, checkOut, workingHours, status, verification_method, created_at, updated_at
         FROM daily_attendance 
         WHERE (verification_method = 'QR' OR device_id = 'COMPANY-QR')
         ORDER BY id DESC LIMIT ?`,
        { replacements: [limit] }
      );
      return records || [];
    } catch (e) {
      return [];
    }
  }
}

module.exports = new CompanyQrService();
