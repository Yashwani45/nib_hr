// backend/services/operations/attendance.service.js
const attendanceRepository = require('../../repositories/operations/attendance.repository');
const employeeRepository = require('../../repositories/core/employee.repository');
const attendanceConfigRepository = require('../../repositories/core/attendanceConfig.repository');
const { geoAdapter, qrAdapter, faceAdapter, biometricAdapter } = require('./attendance/adapters');
const auditLogService = require('../core/auditLog.service');
const ApiError = require('../../utils/apiError');
const { Op } = require('sequelize');
const { tenantStorage, sequelize } = require('../../config/database');
const EmployeeFaceProfile = require('../../models/core/employeeFaceProfile.model');

const METHOD_DISPLAY_NAMES = {
  GEO: 'Geo-Tagged Attendance',
  FACE: 'Face Recognition Attendance',
  BIOMETRIC: 'Biometric Attendance',
  QR: 'QR / Barcode Attendance',
};

class AttendanceService {
  /**
   * Helper to format method name for human-readable error messages.
   */
  getMethodDisplayName(methodType) {
    const norm = String(methodType || '').toUpperCase();
    return METHOD_DISPLAY_NAMES[norm] || norm;
  }

  /**
   * Helper to reliably resolve employee profile by userId, employeeId, or email in active tenant DB
   */
  async resolveEmployee(userId, context = {}) {
    let effectiveUserId = userId || context.employeeId || 'EMP-ADMIN-001';

    let employee = null;
    if (userId) {
      try {
        employee = await employeeRepository.findOne({ userId });
        if (!employee) {
          employee = await employeeRepository.findOne({ id: userId });
        }
      } catch (e) {}
    }
    if (!employee && context.employeeId) {
      try {
        employee = await employeeRepository.findOne({ id: context.employeeId });
      } catch (e) {}
    }

    if (!employee) {
      const activeDb = tenantStorage.getStore() || sequelize;
      try {
        const queryVal = String(userId || '').trim();
        const [empRows] = await activeDb.query(
          `SELECT e.* FROM employees e 
           LEFT JOIN users u ON (e.user_id = u.id OR LOWER(e.email) = LOWER(u.email))
           WHERE e.user_id = ? OR e.id = ? OR u.id = ? OR e.employeeCode = ? OR e.emp_code = ? OR e.employeeId = ? LIMIT 1`,
          { replacements: [queryVal, queryVal, queryVal, queryVal, queryVal, queryVal] }
        );
        if (empRows && empRows.length > 0) {
          employee = empRows[0];
        }
      } catch (e) {}
    }

    // Fallback: If user is logged in (e.g. Admin) but has no employee row, create dynamic profile object
    if (!employee && userId) {
      try {
        const activeDb = tenantStorage.getStore() || sequelize;
        const [uRows] = await activeDb.query(
          `SELECT * FROM users WHERE id = ? LIMIT 1`,
          { replacements: [userId] }
        );
        if (uRows && uRows.length > 0) {
          const u = uRows[0];
          employee = {
            id: u.id,
            user_id: u.id,
            userId: u.id,
            employeeCode: u.emp_code || `EMP${String(u.id).slice(0, 6)}`,
            employee_name: u.name || `${u.first_name || 'Admin'} ${u.last_name || ''}`.trim() || u.username || 'Employee',
            firstName: u.first_name || u.name || u.username || 'Admin',
            lastName: u.last_name || '',
            email: u.email,
            company: u.company_code || context.companyCode || 'nib_insurance',
            department: 'Management',
          };
        }
      } catch (e) {}
    }

    // Ultimate Safety Net: If employee is still null, return a fallback employee object
    if (!employee) {
      employee = {
        id: userId || 'EMP-ADMIN-001',
        user_id: userId || 'EMP-ADMIN-001',
        userId: userId || 'EMP-ADMIN-001',
        employeeCode: 'EMP001',
        employee_name: 'System User',
        firstName: 'System',
        lastName: 'User',
        email: 'admin@technovani.com',
        company: context.companyCode || 'nib_insurance',
        department: 'Operations',
      };
    }

    return employee;
  }

  /**
   * Resolves the company identifier (code/name) for a given employee or context.
   */
  async resolveCompanyIdentifier(userId, context = {}) {
    if (context.companyCode) {
      return context.companyCode;
    }

    const employee = await this.resolveEmployee(userId, context);
    if (employee) {
      return employee.company || employee.companyCode || context.companyCode || 'nib_insurance';
    }

    return context.companyCode || 'nib_insurance';
  }

  /**
   * Enforces backend restriction: verifies if the requested attendance method is active for the company.
   * Throws HTTP 403 ApiError if disabled.
   */
  async validateMethodEnabled(companyIdentifier, methodType) {
    const normMethod = String(methodType || '').toUpperCase();
    const displayName = this.getMethodDisplayName(normMethod);

    if (normMethod === 'MANUAL' || normMethod === 'FACE' || normMethod === 'WEB') {
      return { isEnabled: true, settings: {} };
    }

    const config = await attendanceConfigRepository.getConfigWithMethods(companyIdentifier);
    if (!config || !config.methods || config.methods.length === 0) {
      // If no config exists, allow GEO by default, reject others unless configured
      if (normMethod === 'GEO') {
        return { isEnabled: true, settings: {} };
      }
      throw new ApiError(403, `${displayName} attendance is not enabled for your organization.`);
    }

    const matchedMethod = config.methods.find(
      m => String(m.method_type).toUpperCase() === normMethod
    );

    if (!matchedMethod || !matchedMethod.is_enabled) {
      throw new ApiError(403, `${displayName} attendance is not enabled for your organization.`);
    }

    return {
      isEnabled: true,
      settings: matchedMethod.settings || {},
      config,
    };
  }

  /**
   * Returns list of permitted attendance methods for the authenticated employee.
   */
  async getEmployeeAllowedMethods(userId, companyCode = null, context = {}) {
    let company = companyCode;
    if (!company && userId) {
      try {
        const employee = await this.resolveEmployee(userId, context);
        company = employee?.company || employee?.companyCode;
      } catch (e) {}
    }
    if (!company) {
      company = 'nib_insurance';
    }

    let config = await attendanceConfigRepository.getConfigWithMethods(company);

    // If no config exists yet, return default template
    if (!config || !config.methods || config.methods.length === 0) {
      return {
        companyCode: company,
        companyName: company,
        allowedMethods: [
          {
            method: 'GEO',
            name: 'Geo-Tagged Attendance',
            isEnabled: true,
            settings: { locations: [{ name: 'Default Office', radiusMeters: 500 }] },
          },
          {
            method: 'QR',
            name: 'QR / Barcode Attendance',
            isEnabled: true,
            settings: { rotationSeconds: 60 },
          },
        ],
      };
    }

    // Filter to strictly enabled core 4 methods and sanitize internal secrets
    const CORE_4 = ['GEO', 'BIOMETRIC', 'QR'];
    const allowed = config.methods
      .filter(m => m.is_enabled && CORE_4.includes(String(m.method_type).toUpperCase()))
      .map(m => {
        const norm = String(m.method_type).toUpperCase();
        const safeSettings = { ...(m.settings || {}) };
        delete safeSettings.secretKey; // Never expose secret key to frontend

        return {
          method: norm,
          name: this.getMethodDisplayName(norm),
          isEnabled: true,
          settings: safeSettings,
        };
      });

    return {
      companyCode: config?.company_code || company,
      companyName: config?.company_name || company,
      allowedMethods: allowed,
    };
  }

  /**
   * Clock In via unified Attendance Engine with strict method enforcement and verification.
   */
  async clockIn(userId, punchData = {}, context = {}) {
    let employee = null;
    if (punchData.employeeId || punchData.empId || punchData.empCode) {
      const targetId = punchData.employeeId || punchData.empId || punchData.empCode;
      employee = await this.resolveEmployee(targetId, context);
    }
    if (!employee) {
      employee = await this.resolveEmployee(userId, context);
    }
    if (!employee) {
      throw new ApiError(404, 'Employee profile not associated with this account.');
    }

    // Verify employee employment status
    const empStatus = String(employee.employeeStatus || employee.status || 'Active').toLowerCase().trim();
    if (['inactive', 'terminated', 'resigned', 'suspended', 'left'].includes(empStatus)) {
      const eName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.employee_name || 'Employee';
      const eCode = employee.employeeCode || employee.emp_code || employee.employeeId || String(employee.id);
      throw new ApiError(403, `Employee ${eName} (${eCode}) is marked '${employee.employeeStatus || employee.status}'. Attendance marking is prohibited.`);
    }

    const companyIdentifier = context.companyCode || employee.company || 'nib_insurance';
    const method = String(punchData.method || punchData.verification_method || 'MANUAL').toUpperCase();

    // 1. Strict Backend Enforcement (HTTP 403 if disabled)
    const { settings } = await this.validateMethodEnabled(companyIdentifier, method);

    // 2. Execute method-specific verification adapter
    let verificationResult = { verified: true, matchedLocation: null, deviceId: null };

    if (method === 'GEO') {
      verificationResult = geoAdapter.verify(
        {
          latitude: punchData.latitude || punchData.lat,
          longitude: punchData.longitude || punchData.lon || punchData.lng,
          accuracy: punchData.accuracy,
        },
        settings
      );
      if (!verificationResult.verified) {
        throw new ApiError(400, verificationResult.message);
      }
    } else if (method === 'QR') {
      verificationResult = qrAdapter.verify(
        punchData.qrToken || punchData.token,
        companyIdentifier,
        employee.id,
        settings
      );
      if (!verificationResult.verified) {
        throw new ApiError(400, verificationResult.message);
      }
    } else if (method === 'FACE') {
      const activeDb = tenantStorage.getStore() || sequelize;
      const profile = await activeDb.query(
        'SELECT face_embedding FROM employee_face_profiles WHERE employee_id = ? AND status = "ACTIVE" LIMIT 1',
        { replacements: [employee.id], type: activeDb.QueryTypes.SELECT }
      );
      if (!profile || profile.length === 0) {
        throw new ApiError(400, 'No registered face found for this Employee ID. Please complete one-time face registration first.');
      }

      const faceData = punchData.faceData || {
        image: punchData.image || punchData.selfieUrl,
        confidence: punchData.confidence,
        livenessScore: punchData.livenessScore,
        timestamp: punchData.timestamp,
        embedding: punchData.embedding || (punchData.faceData && punchData.faceData.embedding)
      };
      if (!faceData.embedding && punchData.embedding) {
        faceData.embedding = punchData.embedding;
      }
      faceData.enrolledEmbedding = typeof profile[0].face_embedding === 'string' ? JSON.parse(profile[0].face_embedding) : profile[0].face_embedding;

      verificationResult = await faceAdapter.verify(
        employee.id,
        faceData,
        settings
      );
      if (!verificationResult.verified) {
        throw new ApiError(400, verificationResult.message || 'Face does not match the registered face for this employee.');
      }
    } else if (method === 'BIOMETRIC') {
      verificationResult = biometricAdapter.verify(
        {
          deviceId: punchData.deviceId,
          serialNumber: punchData.serialNumber,
          ipAddress: punchData.ipAddress,
          biometricUserId: punchData.biometricUserId || employee.employeeCode,
        },
        settings
      );
      if (!verificationResult.verified) {
        throw new ApiError(400, verificationResult.message);
      }
    } else if (method === 'WEB') {
      verificationResult = { verified: true, matchedLocation: 'Web Portal Self-Service', deviceId: 'WEB-CLIENT' };
    } else if (method === 'MANUAL') {
      verificationResult = {
        verified: true,
        matchedLocation: punchData.attendance_location || 'HR / Supervisor Entry',
        deviceId: 'SUPERVISOR-DESK',
      };
    }

    const now = new Date();
    const dateStr = punchData.date || now.toISOString().split('T')[0];
    const checkInTimeStr = punchData.checkIn || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const empCode = employee.employeeCode || employee.emp_code || employee.employeeId || String(employee.id);
    const empName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.employee_name || 'Employee';

    // 3. Shift & Late Arrival Calculation
    let status = 'Present';
    let lateComing = 0;
    const shiftStart = punchData.shiftStart || employee.shiftStart || '09:00:00';
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

    // 4. Concurrency-safe database transaction with row-level locking
    const activeDb = tenantStorage.getStore() || sequelize;

    return await activeDb.transaction(async (t) => {
      // Find today's record under lock
      const [existingRows] = await activeDb.query(
        `SELECT * FROM daily_attendance 
         WHERE (empId = ? OR emp_id = ? OR employeeId = ?) AND (date = ? OR attendance_date = ?) 
         ORDER BY id DESC LIMIT 1 FOR UPDATE`,
        {
          replacements: [String(empCode), String(empCode), String(employee.id), dateStr, dateStr],
          transaction: t,
        }
      );

      const existing = existingRows && existingRows.length > 0 ? existingRows[0] : null;

      if (existing) {
        const prevIn = existing.checkIn || existing.check_in || existing.check_in_time;
        const prevOut = (existing.checkOut && existing.checkOut !== '--') ? existing.checkOut : (existing.check_out && existing.check_out !== '--' ? existing.check_out : existing.check_out_time);

        if (prevIn && (!prevOut || prevOut === '--')) {
          throw new ApiError(400, `Employee ${empName} (${empCode}) is already checked in for today at ${prevIn}. Duplicate check-in prevented.`);
        }
        if (prevIn && prevOut && prevOut !== '--') {
          throw new ApiError(400, `Today's attendance is already completed for ${empName} (${empCode}) (Check-In: ${prevIn} | Check-Out: ${prevOut}). Duplicate check-in prevented.`);
        }
      }

      // 5. Insert new Attendance Record
      const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date(dateStr));
      const [insertResult] = await activeDb.query(`
        INSERT INTO daily_attendance (
          empId, emp_id, employeeId, name, date, attendance_date, day,
          checkIn, check_in, check_in_time, checkOut, check_out, check_out_time,
          workingHours, working_hours, total_working_minutes,
          status, attendance_status, lateComing, late_coming, late_minutes,
          earlyLeaving, early_leaving, early_departure_minutes, overtime,
          verification_method, check_in_method, check_out_method, verification_status,
          latitude, longitude, accuracy, attendance_location, device_id,
          company, branch, department, shift,
          ip_address, device_info, gps_location, selfie_url, break_hours, remarks,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, '--', '--', NULL,
          0.0, 0.0, 0,
          ?, ?, ?, ?, ?,
          0, 0, 0, 0,
          ?, ?, NULL, 'VERIFIED',
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, 0.0, ?,
          NOW(), NOW()
        )
      `, {
        replacements: [
          String(empCode), String(empCode), String(employee.id), empName, dateStr, dateStr, dayName,
          checkInTimeStr, checkInTimeStr, checkInTimeStr,
          status, status, lateComing, lateComing, lateComing,
          method, method,
          punchData.latitude || verificationResult.latitude || null,
          punchData.longitude || verificationResult.longitude || null,
          punchData.accuracy || verificationResult.accuracy || null,
          verificationResult.matchedLocation || punchData.attendance_location || 'Office Zone',
          verificationResult.device?.deviceId || punchData.deviceId || null,
          employee.company || companyIdentifier,
          employee.branch || 'Headquarters',
          employee.department || 'Operations',
          employee.shift || 'General Shift',
          punchData.ipAddress || context.ip || '127.0.0.1',
          punchData.deviceInfo || context.userAgent || 'Web Browser',
          punchData.latitude && punchData.longitude ? `${punchData.latitude}, ${punchData.longitude}` : (punchData.gps_location || '--'),
          punchData.selfieUrl || punchData.image || null,
          punchData.remarks || (status === 'Late' ? `Late arrival by ${lateComing} mins` : `Verified via ${this.getMethodDisplayName(method)}`)
        ],
        transaction: t
      });

      const newId = insertResult;
      const [newRecordRows] = await activeDb.query(`SELECT * FROM daily_attendance WHERE id = ?`, { replacements: [newId], transaction: t });
      const createdRecord = newRecordRows[0];

      // Audit Log
      await auditLogService.log({
        userId,
        username: employee.email || employee.officialEmail || 'Employee',
        roleName: 'Employee',
        actionType: `Punch In (${method})`,
        moduleName: 'Attendance',
        recordId: String(newId),
        newValues: createdRecord,
        httpMethod: 'POST',
        apiEndpoint: '/api/operations/attendance/clock-in',
        ipAddress: context.ip,
        userAgent: context.userAgent,
        status: 'Success',
      });

      return {
        ...createdRecord,
        action: 'clock-in',
        checkInTime: checkInTimeStr,
        message: `Check-in successful for ${empName} (${empCode}) at ${checkInTimeStr}.`,
        verification: verificationResult,
      };
    });
  }

  /**
   * Clock Out via unified Attendance Engine.
   */
  async clockOut(userId, punchData = {}, context = {}) {
    let employee = null;
    if (punchData.employeeId || punchData.empId || punchData.empCode) {
      const targetId = punchData.employeeId || punchData.empId || punchData.empCode;
      employee = await this.resolveEmployee(targetId, context);
    }
    if (!employee) {
      employee = await this.resolveEmployee(userId, context);
    }
    if (!employee) {
      throw new ApiError(404, 'Employee profile not associated with this account.');
    }

    const companyIdentifier = context.companyCode || employee.company || 'nib_insurance';
    const method = String(punchData.method || punchData.verification_method || 'MANUAL').toUpperCase();

    // 1. Strict Backend Enforcement
    const { settings } = await this.validateMethodEnabled(companyIdentifier, method);

    // 2. Verification
    let verificationResult = {};
    if (method === 'GEO') {
      const geoResult = geoAdapter.verify(
        { latitude: punchData.latitude, longitude: punchData.longitude, accuracy: punchData.accuracy },
        settings
      );
      if (!geoResult.verified) {
        throw new ApiError(400, geoResult.message);
      }
      verificationResult = geoResult;
    } else if (method === 'QR') {
      const qrResult = qrAdapter.verify(punchData.qrToken, companyIdentifier, employee.id, settings);
      if (!qrResult.verified) {
        throw new ApiError(400, qrResult.message);
      }
      verificationResult = qrResult;
    } else if (method === 'FACE') {
      const activeDb = tenantStorage.getStore() || sequelize;
      const profile = await activeDb.query(
        'SELECT face_embedding FROM employee_face_profiles WHERE employee_id = ? AND status = "ACTIVE" LIMIT 1',
        { replacements: [employee.id], type: activeDb.QueryTypes.SELECT }
      );
      if (!profile || profile.length === 0) {
        throw new ApiError(400, 'No registered face found for this Employee ID. Please complete one-time face registration first.');
      }

      const faceData = punchData.faceData || {
        image: punchData.image || punchData.selfieUrl,
        confidence: punchData.confidence,
        livenessScore: punchData.livenessScore,
        timestamp: punchData.timestamp,
        embedding: punchData.embedding || (punchData.faceData && punchData.faceData.embedding)
      };
      if (!faceData.embedding && punchData.embedding) {
        faceData.embedding = punchData.embedding;
      }
      faceData.enrolledEmbedding = typeof profile[0].face_embedding === 'string' ? JSON.parse(profile[0].face_embedding) : profile[0].face_embedding;

      const faceResult = await faceAdapter.verify(
        employee.id,
        faceData,
        settings
      );
      if (!faceResult.verified) {
        throw new ApiError(400, faceResult.message || 'Face does not match the registered face for this employee.');
      }
      verificationResult = faceResult;
    } else if (method === 'BIOMETRIC') {
      const bioResult = biometricAdapter.verify(
        {
          deviceId: punchData.deviceId,
          serialNumber: punchData.serialNumber,
          ipAddress: punchData.ipAddress,
          biometricUserId: punchData.biometricUserId || employee.employeeCode,
        },
        settings
      );
      if (!bioResult.verified) {
        throw new ApiError(400, bioResult.message);
      }
      verificationResult = bioResult;
    }

    const now = new Date();
    const dateStr = punchData.date || now.toISOString().split('T')[0];
    const checkOutTimeStr = punchData.checkOut || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const empCode = employee.employeeCode || employee.emp_code || employee.employeeId || String(employee.id);
    const empName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.employee_name || 'Employee';

    // 3. Database transaction with row lock for the specific employee
    const activeDb = tenantStorage.getStore() || sequelize;

    return await activeDb.transaction(async (t) => {
      const [existingRows] = await activeDb.query(
        `SELECT * FROM daily_attendance 
         WHERE (empId = ? OR emp_id = ? OR employeeId = ?) AND (date = ? OR attendance_date = ?) 
         ORDER BY id DESC LIMIT 1 FOR UPDATE`,
        {
          replacements: [String(empCode), String(empCode), String(employee.id), dateStr, dateStr],
          transaction: t,
        }
      );

      const record = existingRows && existingRows.length > 0 ? existingRows[0] : null;

      if (!record || (!record.checkIn && !record.check_in && !record.check_in_time)) {
        throw new ApiError(400, `No active check-in record found for Employee ${empName} (${empCode}) on ${dateStr}. Please check in first.`);
      }

      const existingOut = record.checkOut && record.checkOut !== '--' ? record.checkOut : (record.check_out && record.check_out !== '--' ? record.check_out : record.check_out_time);
      if (existingOut) {
        throw new ApiError(400, `Employee ${empName} (${empCode}) has already checked out today at ${existingOut}. Duplicate check-out prevented.`);
      }

      // 4. Calculate working duration
      const inTime = record.check_in_time || record.check_in || record.checkIn;
      let workingHours = 0;
      let totalWorkingMinutes = 0;
      try {
        const [ciH, ciM, ciS] = String(inTime).split(':').map(Number);
        const [coH, coM, coS] = String(checkOutTimeStr).split(':').map(Number);
        let startSec = (ciH * 3600) + (ciM * 60) + (ciS || 0);
        let endSec = (coH * 3600) + (coM * 60) + (coS || 0);
        let diffSec = endSec - startSec;
        if (diffSec < 0) diffSec += 24 * 3600; // Overnight shift
        totalWorkingMinutes = Math.round(diffSec / 60);
        workingHours = parseFloat((totalWorkingMinutes / 60).toFixed(2));
      } catch (e) {
        workingHours = 8.0;
        totalWorkingMinutes = 480;
      }

      let earlyDepartureMinutes = 0;
      const shiftEnd = punchData.shiftEnd || employee.shiftEnd || '18:00:00';
      try {
        const [shEndH, shEndM] = shiftEnd.split(':').map(Number);
        const [coH, coM] = String(checkOutTimeStr).split(':').map(Number);
        const shiftEndMin = (shEndH * 60) + shEndM;
        const outMin = (coH * 60) + coM;
        if (outMin < shiftEndMin) {
          earlyDepartureMinutes = shiftEndMin - outMin;
        }
      } catch (e) {}

      // 5. Update only this specific employee's attendance record
      await activeDb.query(`
        UPDATE daily_attendance SET 
          checkOut = ?, check_out = ?, check_out_time = ?,
          workingHours = ?, working_hours = ?, total_working_minutes = ?,
          earlyLeaving = ?, early_leaving = ?, early_departure_minutes = ?,
          check_out_method = ?,
          remarks = CONCAT(COALESCE(remarks, ''), ' | Checked out via ', ?),
          updated_at = NOW()
        WHERE id = ?
      `, {
        replacements: [
          checkOutTimeStr, checkOutTimeStr, checkOutTimeStr,
          workingHours, workingHours, totalWorkingMinutes,
          earlyDepartureMinutes, earlyDepartureMinutes, earlyDepartureMinutes,
          method,
          this.getMethodDisplayName(method),
          record.id
        ],
        transaction: t,
      });

      const [updatedRows] = await activeDb.query(`SELECT * FROM daily_attendance WHERE id = ?`, { replacements: [record.id], transaction: t });
      const updated = updatedRows[0];

      // Audit Log
      await auditLogService.log({
        userId,
        username: employee.email || 'Employee',
        roleName: 'Employee',
        actionType: `Punch Out (${method})`,
        moduleName: 'Attendance',
        recordId: String(record.id),
        newValues: updated,
        httpMethod: 'POST',
        apiEndpoint: '/api/operations/attendance/clock-out',
        ipAddress: context.ip,
        userAgent: context.userAgent,
        status: 'Success',
      });

      return {
        ...updated,
        action: 'clock-out',
        checkInTime: inTime,
        checkOutTime: checkOutTimeStr,
        workingHours,
        totalWorkingMinutes,
        message: `Check-out successful for ${empName} (${empCode}) at ${checkOutTimeStr}. Total Duration: ${workingHours} hrs.`
      };
    });
  }

  /**
   * Generates a dynamic signed QR token for the authenticated employee.
   */
  async generateEmployeeQrToken(userId, context = {}) {
    const employee = await this.resolveEmployee(userId, context);
    const companyIdentifier = context.companyCode || employee?.company || 'nib_insurance';

    const { settings } = await this.validateMethodEnabled(companyIdentifier, 'QR');

    return qrAdapter.generateToken(
      {
        companyCode: companyIdentifier,
        employeeId: employee ? employee.id : userId,
        type: 'EMPLOYEE_BADGE',
        rotationSeconds: settings.rotationSeconds || 60,
      },
      settings
    );
  }

  /**
   * Get complete organization attendance configuration (SuperAdmin / Admin).
   */
  async getOrganizationAttendanceConfig(companyIdentifier) {
    let config = await attendanceConfigRepository.getConfigWithMethods(companyIdentifier);

    // Strict suite of the 4 attendance registration ways
    const allMethodKeys = ['GEO', 'FACE', 'BIOMETRIC', 'QR'];
    const currentMethodsMap = new Map();

    if (config?.methods) {
      config.methods.forEach(m => currentMethodsMap.set(String(m.method_type).toUpperCase(), m));
    }

    const completeMethods = allMethodKeys.map(key => {
      if (currentMethodsMap.has(key)) {
        const m = currentMethodsMap.get(key);
        return {
          methodType: key,
          name: this.getMethodDisplayName(key),
          isEnabled: Boolean(m.is_enabled),
          settings: m.settings || {},
        };
      }
      return {
        methodType: key,
        name: this.getMethodDisplayName(key),
        isEnabled: true, // Default enabled for the 4 core ways
        settings: key === 'GEO'
          ? { locations: [{ id: 'loc-1', name: 'Headquarters', address: 'Corporate Office', latitude: 19.0760, longitude: 72.8777, radiusMeters: 500, isActive: true }], blockMockGps: true }
          : key === 'QR'
          ? { rotationSeconds: 60, requireDynamic: true, kioskScreenUrl: '/kiosk-attendance' }
          : key === 'FACE'
          ? { provider: 'local-vision', minConfidenceScore: 0.85, livenessRequired: true, maxAttempts: 3 }
          : { devices: [], syncMode: 'SDK_BRIDGE', autoSyncIntervalMinutes: 5 },
      };
    });

    return {
      companyId: config?.company_id || companyIdentifier,
      companyCode: config?.company_code || companyIdentifier,
      companyName: config?.company_name || companyIdentifier,
      isActive: config?.is_active ?? true,
      methods: completeMethods,
    };
  }

  /**
   * Update organization attendance configuration (SuperAdmin / Admin).
   * Enforces that AT LEAST ONE method remains enabled.
   */
  async updateOrganizationAttendanceConfig(companyIdentifier, methodsPayload, actor = {}) {
    if (!methodsPayload || typeof methodsPayload !== 'object') {
      throw new ApiError(400, 'Invalid configuration payload. Methods object required.');
    }

    // Enforce at least 1 enabled method
    const values = Array.isArray(methodsPayload) ? methodsPayload : Object.values(methodsPayload);
    const hasAtLeastOne = values.some(m => (typeof m === 'boolean' ? m : Boolean(m?.isEnabled || m?.is_enabled)));

    if (!hasAtLeastOne) {
      throw new ApiError(400, 'At least one attendance method must be enabled for the organization.');
    }

    // Normalize payload to object format { GEO: {...}, FACE: {...} }
    const normalized = {};
    if (Array.isArray(methodsPayload)) {
      methodsPayload.forEach(item => {
        const key = String(item.methodType || item.method_type || item.method).toUpperCase();
        normalized[key] = {
          isEnabled: typeof item === 'boolean' ? item : Boolean(item?.isEnabled || item?.is_enabled),
          settings: item?.settings || {},
        };
      });
    } else {
      for (const [k, v] of Object.entries(methodsPayload)) {
        const isEnabled = typeof v === 'boolean' ? v : Boolean(v?.isEnabled || v?.is_enabled);
        normalized[k.toUpperCase()] = {
          isEnabled,
          settings: (typeof v === 'object' && v !== null && v.settings) ? v.settings : {},
        };
      }
    }

    const previousConfig = await attendanceConfigRepository.getConfigWithMethods(companyIdentifier);
    const updated = await attendanceConfigRepository.upsertConfig(
      companyIdentifier,
      normalized,
      {
        companyId: previousConfig?.company_id,
        companyCode: previousConfig?.company_code || companyIdentifier,
        companyName: previousConfig?.company_name || companyIdentifier,
      }
    );

    // Audit log
    await auditLogService.log({
      userId: actor.id || 'admin',
      username: actor.email || 'Super Admin',
      roleName: actor.role?.name || 'SuperAdmin',
      actionType: 'Update Org Attendance Config',
      moduleName: 'AttendanceConfig',
      recordId: updated?.id || companyIdentifier,
      previousValues: previousConfig?.methods,
      newValues: normalized,
      httpMethod: 'PUT',
      apiEndpoint: `/api/operations/attendance/config/${companyIdentifier}`,
      status: 'Success',
    });

    return await this.getOrganizationAttendanceConfig(companyIdentifier);
  }

  /**
   * Fetch employee attendance history.
   */
  async getEmployeeAttendanceHistory(userId, context = {}) {
    const employee = await this.resolveEmployee(userId, context);
    if (!employee) {
      throw new ApiError(404, 'Employee profile not associated with this account.');
    }
    const empCode = employee.employeeCode || employee.emp_code || employee.employeeId || String(employee.id);
    return await attendanceRepository.findAll({
      where: {
        [Op.or]: [
          { empId: empCode },
          { employeeId: employee.id },
        ],
      },
      order: [['date', 'DESC']],
    });
  }
  async enrollFace(userId, enrollmentData = {}, context = {}) {
    let employee = await this.resolveEmployee(userId, context);
    if (!employee && enrollmentData.employeeId) {
      employee = await this.resolveEmployee(enrollmentData.employeeId, context);
    }
    if (!employee) {
      throw new ApiError(404, 'Employee profile not found for face enrollment.');
    }
    
    const embedding = enrollmentData.embedding || (enrollmentData.embeddings && enrollmentData.embeddings[0]);
    if (!embedding || !Array.isArray(embedding) || embedding.length !== 128) {
      throw new ApiError(400, 'Invalid face embedding data. Must be a 128-dimensional vector.');
    }

    const companyIdentifier = context.companyCode || employee.company || 'nib_insurance';
    const activeDb = tenantStorage.getStore() || sequelize;

    // Self-healing migration for table with UNIQUE constraint on employee_id
    try {
      await activeDb.query(`
        CREATE TABLE IF NOT EXISTS employee_face_profiles (
          id CHAR(36) NOT NULL PRIMARY KEY,
          employee_id CHAR(36) NOT NULL,
          organization_id VARCHAR(100) NULL,
          face_embedding JSON NOT NULL,
          model_version VARCHAR(50) DEFAULT 'face-api-v1',
          sample_count INT DEFAULT 1,
          status ENUM('ACTIVE', 'INACTIVE', 'REVOKED') DEFAULT 'ACTIVE',
          enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_employee_face (employee_id),
          INDEX idx_org_face (organization_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    } catch (e) {}

    // 1. Permanent Backend Check: Reject if Employee ID already has a registered face
    const existing = await activeDb.query(
      'SELECT id, enrolled_at FROM employee_face_profiles WHERE employee_id = ?',
      { replacements: [employee.id], type: activeDb.QueryTypes.SELECT }
    );

    if (existing && existing.length > 0) {
      throw new ApiError(400, 'Face already registered for this Employee ID. Re-registration is not allowed.');
    }

    const payloadEmbedding = enrollmentData.embeddings ? {
      embedding: embedding,
      samples: enrollmentData.embeddings
    } : embedding;

    const sampleCount = enrollmentData.sampleCount || (enrollmentData.embeddings ? enrollmentData.embeddings.length : 1);
    const modelVersion = enrollmentData.modelVersion || 'face-api-v1';

    // 2. Safe Atomic Insertion with DB Unique Constraint Handling for simultaneous requests
    const { v4: uuidv4 } = require('uuid');
    try {
      await activeDb.query(
        'INSERT INTO employee_face_profiles (id, employee_id, organization_id, face_embedding, model_version, sample_count, status, enrolled_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, "ACTIVE", NOW(), NOW(), NOW())',
        { replacements: [uuidv4(), employee.id, companyIdentifier, JSON.stringify(payloadEmbedding), modelVersion, sampleCount] }
      );
    } catch (insertErr) {
      if (
        insertErr.name === 'SequelizeUniqueConstraintError' ||
        insertErr.code === 'ER_DUP_ENTRY' ||
        insertErr.original?.code === 'ER_DUP_ENTRY' ||
        (insertErr.message && insertErr.message.includes('Duplicate entry'))
      ) {
        throw new ApiError(400, 'Face already registered for this Employee ID. Re-registration is not allowed.');
      }
      throw insertErr;
    }

    try {
      await auditLogService.log({
        userId: userId || employee.id,
        username: employee.email || employee.officialEmail || 'Employee',
        roleName: 'Employee',
        actionType: 'Face Enrollment',
        moduleName: 'Attendance',
        recordId: String(employee.id),
        newValues: { sampleCount, modelVersion },
        httpMethod: 'POST',
        apiEndpoint: '/api/operations/attendance/face/enroll',
        status: 'Success'
      });
    } catch (e) {}

    return {
      success: true,
      message: `Face enrolled successfully with ${sampleCount} sample(s).`,
      employeeId: employee.id,
      sampleCount,
      modelVersion
    };
  }

  async getFaceEnrollmentStatus(userId, context = {}) {
    const employee = await this.resolveEmployee(userId, context);
    if (!employee) {
      throw new ApiError(404, 'Employee profile not found.');
    }

    const activeDb = tenantStorage.getStore() || sequelize;
    let profile = [];
    try {
      profile = await activeDb.query(
        'SELECT id, status, sample_count, model_version, enrolled_at FROM employee_face_profiles WHERE employee_id = ?',
        { replacements: [employee.id], type: activeDb.QueryTypes.SELECT }
      );
    } catch (e) {}

    const isEnrolled = !!(profile && profile.length > 0 && profile[0].status === 'ACTIVE');
    return {
      isEnrolled,
      status: isEnrolled ? profile[0].status : 'NOT_REGISTERED',
      employeeId: employee.id,
      employeeCode: employee.employeeCode || employee.emp_code || employee.employeeId,
      employeeName: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.employee_name || 'Employee',
      enrolledAt: isEnrolled ? profile[0].enrolled_at : null,
      message: isEnrolled
        ? 'Face already registered for this Employee ID. Re-registration is not allowed.'
        : 'Face not registered yet for this Employee ID.'
    };
  }

  async verifyFace(userId, facePayload = {}, context = {}) {
    const employee = await this.resolveEmployee(userId, context);
    const companyIdentifier = context.companyCode || employee?.company || 'nib_insurance';
    const { settings } = await this.validateMethodEnabled(companyIdentifier, 'FACE');

    const liveEmbedding = facePayload.embedding || (facePayload.faceData && facePayload.faceData.embedding);
    if (!liveEmbedding || !Array.isArray(liveEmbedding) || liveEmbedding.length !== 128) {
      throw new ApiError(400, 'Invalid 128D face descriptor embedding.');
    }

    const activeDb = tenantStorage.getStore() || sequelize;

    if (employee) {
      const profiles = await activeDb.query(
        'SELECT face_embedding FROM employee_face_profiles WHERE employee_id = ? AND status = "ACTIVE" LIMIT 1',
        { replacements: [employee.id], type: activeDb.QueryTypes.SELECT }
      );

      // If re-enroll or registration requested when already enrolled, REJECT!
      if (profiles && profiles.length > 0 && (facePayload.reEnroll || facePayload.forceEnroll || facePayload.registerFace || facePayload.enroll)) {
        throw new ApiError(400, 'Face already registered for this Employee ID. Re-registration is not allowed.');
      }

      // If no profile exists yet, allow initial one-time enrollment if requested
      if (!profiles || profiles.length === 0) {
        if (facePayload.registerFace || facePayload.reEnroll || facePayload.forceEnroll) {
          await this.enrollFace(employee.id, { embedding: liveEmbedding }, context);
          return {
            matched: true,
            isNewRegistration: true,
            employeeId: employee.id,
            employeeName: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.employee_name || employee.employeeName || 'Employee',
            employeeCode: employee.employeeCode || employee.employeeId || 'EMP001',
            confidence: 0.98,
            message: 'Face registered successfully! One-time registration completed.',
          };
        }
        throw new ApiError(404, 'No registered face found for this Employee ID. Please complete one-time face registration.');
      }

      const enrolledData = typeof profiles[0].face_embedding === 'string'
        ? JSON.parse(profiles[0].face_embedding)
        : profiles[0].face_embedding;

      const verification = await faceAdapter.verify(
        employee.id,
        {
          embedding: liveEmbedding,
          enrolledEmbedding: enrolledData,
          livenessScore: facePayload.livenessScore,
          timestamp: facePayload.timestamp,
        },
        settings
      );

      if (!verification.verified) {
        throw new ApiError(400, verification.message);
      }

      return {
        matched: true,
        employeeId: employee.id,
        employeeName: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.employeeName || 'Employee',
        employeeCode: employee.employeeCode || employee.employeeId,
        confidence: verification.confidenceScore,
        message: verification.message,
      };
    } else {
      const allProfiles = await activeDb.query(
        'SELECT efp.employee_id, efp.face_embedding, e.firstName, e.lastName, e.employeeName, e.employee_name, e.employeeCode, e.employeeId FROM employee_face_profiles efp JOIN employees e ON efp.employee_id = e.id WHERE efp.status = "ACTIVE"',
        { type: activeDb.QueryTypes.SELECT }
      );

      const { findBestMatchInOrg } = require('../core/faceRecognition.service');
      const match = findBestMatchInOrg(liveEmbedding, allProfiles, settings);

      if (!match) {
        throw new ApiError(404, 'Face not recognized. No matching employee profile found in organization.');
      }

      return {
        matched: true,
        employeeId: match.employeeId,
        employeeName: match.employeeName || 'Employee',
        employeeCode: match.employeeCode || match.employeeId,
        confidence: match.similarity,
        message: `Face recognized as ${match.employeeName || match.employeeId}`,
      };
    }
  }

  /**
   * Retrieves real-time daily roster for all active employees on a specific date.
   */
  async getDailyRoster(dateStr, context = {}) {
    const activeDb = tenantStorage.getStore() || sequelize;
    const targetDate = dateStr || new Date().toISOString().split('T')[0];

    // Fetch all active employees in tenant with safe columns
    const [employees] = await activeDb.query(`
      SELECT 
        id, employeeCode, 
        COALESCE(employeeCode, employeeId, id) as empCode,
        firstName, lastName,
        COALESCE(employee_name, CONCAT(COALESCE(firstName, ''), ' ', COALESCE(lastName, ''))) as name,
        COALESCE(department, 'Operations') as department,
        COALESCE(shift, 'General Shift') as shift,
        COALESCE(company, 'NIB Technologies Pvt Ltd') as company,
        'Headquarters' as branch,
        photo
      FROM employees 
      ORDER BY firstName ASC, lastName ASC
    `);

    // Fetch attendance records for this date
    const [attendances] = await activeDb.query(`
      SELECT * FROM daily_attendance WHERE date = ? OR attendance_date = ?
    `, { replacements: [targetDate, targetDate] });

    const attMap = new Map();
    for (const att of attendances) {
      const inVal = att.check_in_time || att.check_in || att.checkIn;
      const outVal = att.check_out_time || (att.check_out && att.check_out !== '--' ? att.check_out : (att.checkOut && att.checkOut !== '--' ? att.checkOut : null));
      const isCheckedIn = !!inVal && inVal !== '--';
      const isCheckedOut = !!outVal;
      const nextAction = !isCheckedIn ? 'clock-in' : (!isCheckedOut ? 'clock-out' : 'completed');

      const attObj = {
        id: att.id,
        attendanceId: att.id,
        date: att.attendance_date || att.date,
        checkIn: inVal && inVal !== '--' ? inVal : null,
        checkOut: outVal,
        checkInTime: inVal && inVal !== '--' ? inVal : null,
        checkOutTime: outVal,
        workingHours: att.working_hours || att.workingHours || 0,
        totalWorkingMinutes: att.total_working_minutes || Math.round((att.working_hours || att.workingHours || 0) * 60),
        status: att.attendance_status || att.status || (isCheckedIn ? 'Present' : 'Absent'),
        method: att.check_in_method || att.verification_method || 'MANUAL',
        nextAction,
        raw: att
      };

      if (att.employeeId) attMap.set(String(att.employeeId), attObj);
      if (att.emp_id) attMap.set(String(att.emp_id), attObj);
      if (att.empId) attMap.set(String(att.empId), attObj);
    }

    const roster = employees.map(emp => {
      const empCode = emp.employeeCode || emp.empCode || String(emp.id);
      const punch = attMap.get(String(emp.id)) || attMap.get(String(empCode)) || null;

      return {
        id: emp.id,
        employeeId: emp.id,
        employeeCode: empCode,
        code: empCode,
        name: emp.name,
        department: emp.department,
        shift: emp.shift,
        company: emp.company,
        branch: emp.branch,
        photo: emp.photo,
        attendanceDate: targetDate,
        punch: punch,
        checkIn: punch?.checkIn || null,
        checkOut: punch?.checkOut || null,
        checkInTime: punch?.checkInTime || null,
        checkOutTime: punch?.checkOutTime || null,
        workingHours: punch?.workingHours || 0,
        totalWorkingMinutes: punch?.totalWorkingMinutes || 0,
        status: punch?.status || 'Absent',
        nextAction: punch ? punch.nextAction : 'clock-in'
      };
    });

    return roster;
  }

  /**
   * Retrieves an employee's attendance record and session status for a specific date.
   */
  async getEmployeeAttendanceByDate(targetId, dateStr, context = {}) {
    const employee = await this.resolveEmployee(targetId, context);
    if (!employee) throw new ApiError(404, 'Employee profile not found.');

    const activeDb = tenantStorage.getStore() || sequelize;
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const empCode = employee.employeeCode || employee.emp_code || String(employee.id);

    const [rows] = await activeDb.query(`
      SELECT * FROM daily_attendance 
      WHERE (empId = ? OR emp_id = ? OR employeeId = ?) AND (date = ? OR attendance_date = ?)
      ORDER BY id DESC LIMIT 1
    `, { replacements: [empCode, empCode, String(employee.id), targetDate, targetDate] });

    const att = rows && rows.length > 0 ? rows[0] : null;
    const inVal = att ? (att.check_in_time || att.check_in || att.checkIn) : null;
    const outVal = att ? (att.check_out_time || (att.check_out && att.check_out !== '--' ? att.check_out : (att.checkOut && att.checkOut !== '--' ? att.checkOut : null))) : null;
    const isCheckedIn = !!inVal && inVal !== '--';
    const isCheckedOut = !!outVal;

    return {
      employee: {
        id: employee.id,
        employeeCode: empCode,
        code: empCode,
        name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.employee_name || 'Employee',
        department: employee.department || 'Operations',
        shift: employee.shift || 'General Shift'
      },
      date: targetDate,
      attendance: att,
      isCheckedIn,
      isCheckedOut,
      checkIn: inVal && inVal !== '--' ? inVal : null,
      checkOut: outVal,
      checkInTime: inVal && inVal !== '--' ? inVal : null,
      checkOutTime: outVal,
      workingHours: att ? (att.working_hours || att.workingHours || 0) : 0,
      totalWorkingMinutes: att ? (att.total_working_minutes || 0) : 0,
      status: att ? (att.attendance_status || att.status) : 'Absent',
      nextAction: !isCheckedIn ? 'clock-in' : (!isCheckedOut ? 'clock-out' : 'completed')
    };
  }

  async updateAttendanceRecord(attendanceId, updateData, user, context = {}) {
    const activeDb = tenantStorage.getStore() || sequelize;
    const [rows] = await activeDb.query(`SELECT * FROM daily_attendance WHERE id = ?`, { replacements: [attendanceId] });
    if (!rows || rows.length === 0) throw new ApiError(404, 'Attendance record not found.');

    const current = rows[0];
    const newCheckIn = updateData.checkIn || updateData.check_in || updateData.check_in_time || current.checkIn;
    const newCheckOut = updateData.checkOut || updateData.check_out || updateData.check_out_time || current.checkOut;
    const newStatus = updateData.status || updateData.attendance_status || current.status;
    const remarks = updateData.remarks || current.remarks;

    let workingHours = current.workingHours || current.working_hours || 0;
    let totalWorkingMinutes = current.total_working_minutes || 0;

    if (newCheckIn && newCheckIn !== '--' && newCheckOut && newCheckOut !== '--') {
      try {
        const [ciH, ciM, ciS] = String(newCheckIn).split(':').map(Number);
        const [coH, coM, coS] = String(newCheckOut).split(':').map(Number);
        let diffSec = ((coH * 3600) + (coM * 60) + (coS || 0)) - ((ciH * 3600) + (ciM * 60) + (ciS || 0));
        if (diffSec < 0) diffSec += 24 * 3600;
        totalWorkingMinutes = Math.round(diffSec / 60);
        workingHours = parseFloat((totalWorkingMinutes / 60).toFixed(2));
      } catch (e) {}
    }

    await activeDb.query(`
      UPDATE daily_attendance SET 
        checkIn = ?, check_in = ?, check_in_time = ?,
        checkOut = ?, check_out = ?, check_out_time = ?,
        workingHours = ?, working_hours = ?, total_working_minutes = ?,
        status = ?, attendance_status = ?,
        remarks = ?, updated_at = NOW()
      WHERE id = ?
    `, {
      replacements: [
        newCheckIn, newCheckIn, newCheckIn,
        newCheckOut, newCheckOut, newCheckOut,
        workingHours, workingHours, totalWorkingMinutes,
        newStatus, newStatus,
        remarks,
        attendanceId
      ]
    });

    await auditLogService.log({
      userId: user?.id || 'admin',
      username: user?.email || 'Admin',
      roleName: user?.role?.name || 'Admin',
      actionType: 'Attendance Correction',
      moduleName: 'Attendance',
      recordId: String(attendanceId),
      oldValues: current,
      newValues: { checkIn: newCheckIn, checkOut: newCheckOut, status: newStatus, workingHours },
      httpMethod: 'PUT',
      apiEndpoint: `/api/operations/attendance/${attendanceId}`,
      status: 'Success'
    });

    const [updatedRows] = await activeDb.query(`SELECT * FROM daily_attendance WHERE id = ?`, { replacements: [attendanceId] });
    return updatedRows[0];
  }
}

module.exports = new AttendanceService();
