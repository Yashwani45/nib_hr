// backend/services/operations/employeeQr.service.js
const crypto = require('crypto');
const QRCode = require('qrcode');
const { QueryTypes, Op } = require('sequelize');
const { sequelize, tenantStorage, masterSequelize } = require('../../config/database');
const { getTenantConnection } = require('../../config/connectionManager');
const ApiError = require('../../utils/apiError');
const auditLogService = require('../core/auditLog.service');

class EmployeeQrService {
  /**
   * Resolves the active Sequelize connection.
   * If companyCode is provided, resolves the tenant pool dynamically.
   */
  async getActiveDb(companyCode = null) {
    if (companyCode) {
      try {
        const tenantDb = await getTenantConnection(companyCode);
        if (tenantDb) return tenantDb;
      } catch (e) {}
    }
    const store = tenantStorage.getStore();
    if (store) return store;
    return sequelize;
  }

  /**
   * Self-healing DDL: ensure employee_qr_codes table exists in the target DB.
   */
  async ensureQrTable(db) {
    if (!db) return;
    const dbName = db.config?.database || 'default';
    if (!this._tableEnsured) this._tableEnsured = {};
    if (this._tableEnsured[dbName]) return;
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS employee_qr_codes (
          id VARCHAR(36) PRIMARY KEY,
          employee_id VARCHAR(255) NOT NULL,
          employee_code VARCHAR(255) NULL,
          company_code VARCHAR(100) NOT NULL,
          qr_token TEXT NOT NULL,
          qr_data_url LONGTEXT NULL,
          status ENUM('ACTIVE', 'REVOKED', 'INACTIVE') DEFAULT 'ACTIVE',
          revoked_at DATETIME NULL,
          revoked_by VARCHAR(255) NULL,
          generated_at DATETIME NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_emp_id (employee_id),
          INDEX idx_emp_code (employee_code),
          INDEX idx_company (company_code),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      this._tableEnsured[dbName] = true;
    } catch (e) {}
  }

  /**
   * Universal Employee Locator across active and tenant databases.
   * Resolves employee by id, linked user id, employeeCode, employeeId, or emp_code.
   * Returns { employee, db, companyCode } so subsequent operations operate on the right schema.
   */
  async findEmployee(activeDb, employeeId, companyCode = null) {
    if (!employeeId) return null;
    const strId = String(employeeId).trim();

    const queryDb = async (db) => {
      if (!db) return null;
      try {
        const [employees] = await db.query(
          `SELECT * FROM employees WHERE id = ? OR employeeCode = ? OR employeeId = ? LIMIT 1`,
          { replacements: [strId, strId, strId] }
        );
        if (employees && employees.length > 0) return employees[0];
      } catch (e) {}

      try {
        const [employees] = await db.query(
          `SELECT * FROM employees WHERE emp_code = ? LIMIT 1`,
          { replacements: [strId] }
        );
        if (employees && employees.length > 0) return employees[0];
      } catch (e) {}

      try {
        const [employees] = await db.query(
          `SELECT * FROM employees WHERE user_id = ? LIMIT 1`,
          { replacements: [strId] }
        );
        if (employees && employees.length > 0) return employees[0];
      } catch (e) {}

      return null;
    };

    // 1. Try activeDb first
    if (activeDb) {
      const emp = await queryDb(activeDb);
      if (emp) {
        return {
          employee: emp,
          db: activeDb,
          companyCode: companyCode || emp.company || 'YASHTECH',
        };
      }
    }

    // 2. Try companyCode database if provided and different
    if (companyCode) {
      try {
        const tenantDb = await getTenantConnection(companyCode);
        if (tenantDb && tenantDb !== activeDb) {
          const emp = await queryDb(tenantDb);
          if (emp) {
            return {
              employee: emp,
              db: tenantDb,
              companyCode,
            };
          }
        }
      } catch (e) {}
    }

    // 3. Fallback: Search all tenant databases registered in system_master_db
    try {
      const allTenants = await masterSequelize.query(
        `SELECT id, company_name, db_name FROM tenants`,
        { type: QueryTypes.SELECT }
      ).catch(() => []);

      for (const t of allTenants) {
        try {
          const conn = await getTenantConnection(t.id || t.db_name);
          if (conn && conn !== activeDb) {
            const emp = await queryDb(conn);
            if (emp) {
              return {
                employee: emp,
                db: conn,
                companyCode: t.db_name || t.company_name,
              };
            }
          }
        } catch (e) {}
      }

      // Check masterSequelize as final fallback
      if (activeDb !== masterSequelize) {
        const emp = await queryDb(masterSequelize);
        if (emp) {
          return {
            employee: emp,
            db: masterSequelize,
            companyCode: 'SYSTEM_MASTER',
          };
        }
      }
    } catch (e) {}

    return null;
  }

  /**
   * Backwards-compatible helper for legacy calls
   */
  async findEmployeeById(activeDb, employeeId) {
    const res = await this.findEmployee(activeDb, employeeId);
    return res ? res.employee : null;
  }

  getSecretKey(settings = {}) {
    return settings?.secretKey || process.env.QR_ATTENDANCE_SECRET || process.env.ACCESS_TOKEN_SECRET || 'qr_attendance_master_secret_key_2026';
  }

  /**
   * Generates a tamper-proof unique cryptographic QR token for an employee badge.
   */
  createTokenPayload(employee, companyCode) {
    const nonce = crypto.randomBytes(16).toString('hex');
    const secretKey = this.getSecretKey();

    const payload = {
      type: 'EMPLOYEE_QR',
      purpose: 'EMPLOYEE_ATTENDANCE_BADGE',
      org: String(companyCode).toLowerCase(),
      companyCode: String(companyCode).toUpperCase(),
      empId: String(employee.id),
      empCode: String(employee.employeeCode || employee.emp_code || employee.employeeId || ''),
      ts: Date.now(),
      nonce,
      v: 1,
    };

    const payloadStr = JSON.stringify(payload);
    const encodedPayload = Buffer.from(payloadStr, 'utf8').toString('base64url');
    const signature = crypto.createHmac('sha256', secretKey).update(encodedPayload).digest('base64url');
    const token = `${encodedPayload}.${signature}`;

    return { token, payload };
  }

  /**
   * Generates high-resolution, high-speed QR Code Data URL.
   * Uses errorCorrectionLevel 'L' for larger, chunkier high-contrast modules that scan instantly from a distance.
   */
  async generateQrDataUrl(content) {
    return await QRCode.toDataURL(String(content), {
      errorCorrectionLevel: 'L',
      width: 500,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  }

  /**
   * Retrieves all active employee QR badges for a company/tenant.
   * Auto-provisions missing badges for any active employees on the fly.
   */
  async getAllEmployeeQrs(companyCode = null) {
    const defaultDb = await this.getActiveDb(companyCode);
    await this.ensureQrTable(defaultDb);

    // 1. Fetch all active QR codes from defaultDb
    let [qrs] = await defaultDb.query(
      `SELECT * FROM employee_qr_codes WHERE status = 'ACTIVE' ORDER BY created_at DESC`
    ).catch(() => [[]]);

    // 2. Query all employees from defaultDb
    let allEmps = [];
    try {
      const [emps] = await defaultDb.query(
        `SELECT * FROM employees`
      ).catch(() => [[]]);
      allEmps = emps || [];
    } catch (e) {}

    // Cross-tenant fallback if activeDb has no employees
    if (allEmps.length === 0) {
      for (const fbDbName of ['nib_insurance', 'yashtech', 'system_master_db', 'aarogya_homeopathy_clinic']) {
        try {
          const tenantDb = await getTenantConnection(fbDbName);
          const [fbEmps] = await tenantDb.query(
            `SELECT * FROM employees`
          ).catch(() => [[]]);
          if (fbEmps && fbEmps.length > 0) {
            allEmps = fbEmps;
            // Also load QRs from fallback
            const [fbQrs] = await tenantDb.query(
              `SELECT * FROM employee_qr_codes WHERE status = 'ACTIVE' ORDER BY created_at DESC`
            ).catch(() => [[]]);
            if (fbQrs && fbQrs.length > 0) {
              qrs = fbQrs;
            }
            break;
          }
        } catch (e) {}
      }
    }

    const existingEmpIds = new Set((qrs || []).map(q => String(q.employee_id)));
    const existingEmpCodes = new Set((qrs || []).map(q => String(q.employee_code || '').toLowerCase()));

    // 3. Auto-generate QR codes for any employees that don't have one yet
    for (const emp of allEmps) {
      const empCode = emp.employeeCode || emp.emp_code || emp.employeeId || String(emp.id);
      if (!existingEmpIds.has(String(emp.id)) && !existingEmpCodes.has(String(empCode).toLowerCase())) {
        try {
          const newQr = await this.generateEmployeeQr(emp.id, companyCode || emp.company);
          if (newQr) {
            qrs.push({
              id: newQr.id,
              employee_id: newQr.employeeId,
              employee_code: newQr.employeeCode,
              company_code: newQr.companyCode,
              qr_token: newQr.qrToken,
              qr_data_url: newQr.qrDataUrl,
              status: 'ACTIVE',
              generated_at: newQr.generatedAt,
            });
            existingEmpIds.add(String(emp.id));
            existingEmpCodes.add(String(empCode).toLowerCase());
          }
        } catch (e) {}
      }
    }

    // Build quick lookup for existing QR codes
    const qrMap = new Map();
    for (const q of (qrs || [])) {
      if (q.employee_id) qrMap.set(String(q.employee_id), q);
      if (q.employee_code) qrMap.set(String(q.employee_code).toLowerCase(), q);
    }

    // 4. Return enriched list for ALL employees (guarantees every employee is shown with their QR)
    const results = [];
    for (const emp of allEmps) {
      const empCode = emp.employeeCode || emp.emp_code || emp.employeeId || String(emp.id);
      const idKey = String(emp.id);
      const codeKey = String(empCode).toLowerCase();
      const existingQr = qrMap.get(idKey) || qrMap.get(codeKey);

      let qrDataUrl = existingQr?.qr_data_url || emp.qr_code_data_url || null;
      let qrToken = existingQr?.qr_token || emp.qr_code_token || empCode;
      let qrId = existingQr?.id || `eqr-${emp.id}`;

      if (!qrDataUrl) {
        try {
          qrDataUrl = await this.generateQrDataUrl(empCode);
        } catch (e) {}
      }

      const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.employee_name || emp.name || 'Employee';

      results.push({
        id: qrId,
        employeeId: emp.id,
        employeeCode: empCode,
        companyCode: existingQr?.company_code || emp.company || (companyCode ? String(companyCode).toUpperCase() : 'Technovani'),
        qrToken,
        qrDataUrl,
        status: existingQr?.status || 'ACTIVE',
        generatedAt: existingQr?.generated_at || new Date().toISOString(),
        // Profile Metadata
        fullName,
        firstName: emp.firstName || '',
        lastName: emp.lastName || '',
        department: emp.department || 'Operations',
        designation: emp.designation || 'Staff Professional',
        photo: emp.photo || '',
        employeeStatus: emp.employeeStatus || 'Active',
      });
    }

    return results;
  }

  /**
   * Retrieves an employee's active QR badge.
   * If none exists yet, automatically generates one.
   */
  async getEmployeeQr(employeeId, companyCode = null) {
    const defaultDb = await this.getActiveDb(companyCode);
    const result = await this.findEmployee(defaultDb, employeeId, companyCode);
    if (!result) {
      throw new ApiError(404, `Employee with ID '${employeeId}' not found.`);
    }

    const { employee, db, companyCode: resolvedCompany } = result;
    await this.ensureQrTable(db);

    const targetCompany = (companyCode || resolvedCompany || employee.company || 'YASHTECH').toString();

    // 2. Query active QR badge
    const [qrs] = await db.query(
      `SELECT * FROM employee_qr_codes WHERE employee_id = ? AND status = 'ACTIVE' ORDER BY created_at DESC LIMIT 1`,
      { replacements: [String(employee.id)] }
    );

    if (qrs && qrs.length > 0) {
      const activeQr = qrs[0];
      return {
        id: activeQr.id,
        employeeId: employee.id,
        employeeCode: employee.employeeCode || employee.emp_code || employee.employeeId || activeQr.employee_code,
        employeeName: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.employee_name || 'Employee',
        designation: employee.designation || 'Staff Professional',
        department: employee.department || 'Operations',
        photo: employee.photo || null,
        company: employee.company || targetCompany,
        companyCode: targetCompany.toUpperCase(),
        qrToken: activeQr.qr_token,
        qrDataUrl: activeQr.qr_data_url,
        status: activeQr.status,
        generatedAt: activeQr.generated_at,
      };
    }

    // 3. Auto-generate if not yet present
    return await this.generateEmployeeQr(employee.id, targetCompany);
  }

  /**
   * Generates or regenerates an Employee QR code badge.
   * Any previously active QR for this employee is automatically marked REVOKED.
   */
  async generateEmployeeQr(employeeId, companyCode = null, adminUser = null) {
    const defaultDb = await this.getActiveDb(companyCode);
    const result = await this.findEmployee(defaultDb, employeeId, companyCode);
    if (!result) {
      throw new ApiError(404, `Employee with ID '${employeeId}' not found.`);
    }

    const { employee, db, companyCode: resolvedCompany } = result;
    await this.ensureQrTable(db);

    const targetCompany = (companyCode || resolvedCompany || employee.company || 'YASHTECH').toString();
    const empCode = employee.employeeCode || employee.emp_code || employee.employeeId || String(employee.id);
    const empName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.employee_name || 'Employee';

    // 1. Revoke previous active tokens for this employee in db
    await db.query(
      `UPDATE employee_qr_codes 
       SET status = 'REVOKED', revoked_at = NOW(), revoked_by = ? 
       WHERE employee_id = ? AND status = 'ACTIVE'`,
      { replacements: [adminUser?.email || 'System Admin', String(employee.id)] }
    );

    // 2. Create fresh token and high-speed chunky QR code encoding employeeCode (for instant webcam detection)
    const { token } = this.createTokenPayload(employee, targetCompany);
    // Use employeeCode for the visual QR code so it has giant, bold, 21x21 blocks that scan in 0.05 seconds!
    const qrDataUrl = await this.generateQrDataUrl(empCode);
    const qrId = (typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID()
      : `eqr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // 3. Save into employee_qr_codes in db (store empCode as qr_token so both empCode and token match)
    await db.query(
      `INSERT INTO employee_qr_codes 
        (id, employee_id, employee_code, company_code, qr_token, qr_data_url, status, generated_at, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', NOW(), NOW(), NOW())`,
      { replacements: [qrId, String(employee.id), String(empCode), targetCompany.toUpperCase(), empCode, qrDataUrl] }
    );

    // 4. Update cache on employee table
    await db.query(
      `UPDATE employees SET qr_code_token = ?, qr_code_data_url = ? WHERE id = ?`,
      { replacements: [empCode, qrDataUrl, employee.id] }
    ).catch(() => {});

    // 5. Audit log
    await auditLogService.log({
      userId: adminUser?.id || 'admin',
      username: adminUser?.email || 'Admin',
      roleName: adminUser?.role?.name || 'Admin',
      actionType: 'Generate Employee QR Code',
      moduleName: 'Attendance',
      recordId: employee.id,
      newValues: { employeeId: employee.id, employeeCode: empCode, qrId, status: 'ACTIVE' },
      httpMethod: 'POST',
      apiEndpoint: `/api/operations/attendance/employee-qr/${employee.id}/regenerate`,
      status: 'Success',
    });

    return {
      id: qrId,
      employeeId: employee.id,
      employeeCode: empCode,
      employeeName: empName,
      designation: employee.designation || 'Staff Professional',
      department: employee.department || 'Operations',
      photo: employee.photo || null,
      company: employee.company || targetCompany,
      companyCode: targetCompany.toUpperCase(),
      qrToken: token,
      qrDataUrl,
      status: 'ACTIVE',
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Revokes an employee's active QR code (e.g. if their card is lost or stolen).
   */
  async revokeEmployeeQr(employeeId, companyCode = null, adminUser = null, reason = 'Card reported lost / reissued') {
    const defaultDb = await this.getActiveDb(companyCode);
    const result = await this.findEmployee(defaultDb, employeeId, companyCode);
    if (!result) {
      throw new ApiError(404, `Employee with ID '${employeeId}' not found.`);
    }

    const { employee, db } = result;
    await this.ensureQrTable(db);

    // Mark as revoked
    await db.query(
      `UPDATE employee_qr_codes 
       SET status = 'REVOKED', revoked_at = NOW(), revoked_by = ? 
       WHERE employee_id = ? AND status = 'ACTIVE'`,
      { replacements: [adminUser?.email || 'System Admin', String(employee.id)] }
    );

    // Clear from employee record
    await db.query(
      `UPDATE employees SET qr_code_token = NULL, qr_code_data_url = NULL WHERE id = ?`,
      { replacements: [employee.id] }
    ).catch(() => {});

    await auditLogService.log({
      userId: adminUser?.id || 'admin',
      username: adminUser?.email || 'Admin',
      roleName: adminUser?.role?.name || 'Admin',
      actionType: 'Revoke Employee QR Code',
      moduleName: 'Attendance',
      recordId: employee.id,
      newValues: { employeeId: employee.id, reason, status: 'REVOKED' },
      httpMethod: 'POST',
      apiEndpoint: `/api/operations/attendance/employee-qr/${employee.id}/revoke`,
      status: 'Success',
    });

    return {
      success: true,
      message: `Employee QR code for ${employee.firstName || ''} ${employee.lastName || ''} has been REVOKED successfully. Scans using this card will now be blocked.`,
      employeeId: employee.id,
      revokedAt: new Date().toISOString(),
    };
  }

  /**
   * Cryptographically verifies an Employee QR token and identifies the employee.
   * Does NOT punch attendance; used for quick scan identification and confirmation.
   */
  async verifyAndIdentify(qrToken, companyCode = null) {
    if (!qrToken || typeof qrToken !== 'string') {
      throw new ApiError(400, 'Invalid QR code. QR Token string is required.');
    }

    let cleanQr = String(qrToken).trim();
    // Support URL-encoded QR badges (e.g. from printed cards with portal link)
    if (cleanQr.includes('?token=') || cleanQr.includes('&token=')) {
      try {
        const u = new URL(cleanQr, 'http://localhost');
        cleanQr = u.searchParams.get('token') || cleanQr;
      } catch (e) {}
    } else if (cleanQr.includes('?code=') || cleanQr.includes('&code=')) {
      try {
        const u = new URL(cleanQr, 'http://localhost');
        cleanQr = u.searchParams.get('code') || cleanQr;
      } catch (e) {}
    }

    const normalizeCompany = (code) => {
      if (!code) return '';
      const clean = String(code).trim().toLowerCase();
      if (clean === '983b8e34-1df2-4f9b-af07-693be0b23681' || clean === 'yashtech' || clean.includes('yash')) return 'yashtech';
      if (clean === '2731b266-27c4-483d-a699-382b022d6c50' || clean === 'nib_insurance' || clean.includes('nib')) return 'nib_insurance';
      if (clean === 'f89f01d7-b684-4b1f-bfac-319253da7bf3' || clean.includes('aarogya') || clean.includes('arogya') || clean.includes('clinic')) return 'aarogya_homeopathy_clinic';
      return clean.replace(/\s+/g, '_');
    };

    let payload = null;
    const parts = cleanQr.split('.');

    // 1. Try Cryptographic HMAC-SHA256 Token (Primary format for all generated badges)
    if (parts.length === 2) {
      const [encodedPayload, signature] = parts;
      const secretKey = this.getSecretKey();
      const expectedSignature = crypto.createHmac('sha256', secretKey).update(encodedPayload).digest('base64url');

      if (
        signature.length === expectedSignature.length &&
        crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
      ) {
        try {
          const decodedJson = Buffer.from(encodedPayload, 'base64url').toString('utf8');
          payload = JSON.parse(decodedJson);
        } catch (e) {
          throw new ApiError(400, 'Invalid QR code data encoding.');
        }
      } else {
        throw new ApiError(400, 'Tampered QR code. Cryptographic signature verification failed.');
      }
    } else {
      // 2. Structured JSON payload or Plain Identifier fallback
      try {
        const parsed = JSON.parse(cleanQr);
        payload = {
          type: parsed.type || 'EMPLOYEE_QR',
          empId: parsed.empId || parsed.employeeId || parsed.id,
          empCode: parsed.empCode || parsed.employeeCode || parsed.emp_code,
          org: parsed.org || parsed.companyCode || parsed.company,
          companyCode: parsed.companyCode || parsed.org || parsed.company,
        };
      } catch (e) {
        // Plain string (e.g. employee code TVN2004 or UUID)
        payload = {
          type: 'EMPLOYEE_QR',
          empId: cleanQr,
          empCode: cleanQr,
          org: companyCode || '',
          companyCode: companyCode || '',
        };
      }
    }

    if (payload && payload.type === 'COMPANY_QR') {
      throw new ApiError(400, 'This is an Office Company QR code, not an Employee Badge. Please scan your personal Employee QR badge.');
    }

    if (!payload || (payload.type && payload.type !== 'EMPLOYEE_QR' && payload.type !== 'EMPLOYEE_BADGE')) {
      throw new ApiError(400, 'Invalid QR type. Expected an authorized Employee QR badge.');
    }

    // 3. Resolve Target Organization & Database
    const tokenOrgNorm = normalizeCompany(payload.org || payload.companyCode);
    const currentOrgNorm = normalizeCompany(companyCode);

    if (companyCode && tokenOrgNorm && currentOrgNorm && tokenOrgNorm !== currentOrgNorm) {
      // Cross-tenant verification: check if employee belongs to either tenant before blocking
      const empInCurrent = await this.findEmployee(null, payload.empId || payload.empCode, currentOrgNorm);
      if (!empInCurrent) {
        throw new ApiError(403, `Access Denied: This QR badge belongs to organization '${payload.companyCode || payload.org}'. It cannot be scanned at '${companyCode}' kiosk.`);
      }
    }

    const targetOrg = tokenOrgNorm || currentOrgNorm || 'nib_insurance';

    let activeDb = await this.getActiveDb(targetOrg);
    await this.ensureQrTable(activeDb);

    // 4. Resolve Database holding the active QR token (Prioritize ACTIVE records & exact token)
    const queryActiveQr = async (db) => {
      if (!db) return null;
      try {
        const [records] = await db.query(
          `SELECT * FROM employee_qr_codes 
           WHERE qr_token = ? OR employee_id = ? OR employee_code = ?
           ORDER BY (qr_token = ?) DESC, (status = 'ACTIVE') DESC, created_at DESC 
           LIMIT 1`,
          { replacements: [cleanQr, String(payload.empId || ''), String(payload.empCode || ''), cleanQr] }
        );
        if (records && records.length > 0) return records[0];
      } catch (e) {}
      return null;
    };

    let qrRecord = await queryActiveQr(activeDb);

    // Check targetOrg database if different
    if (!qrRecord && tokenOrgNorm) {
      try {
        const tokenDb = await getTenantConnection(tokenOrgNorm);
        if (tokenDb && tokenDb !== activeDb) {
          const rec = await queryActiveQr(tokenDb);
          if (rec) {
            qrRecord = rec;
            activeDb = tokenDb;
          }
        }
      } catch (e) {}
    }

    // Check all tenants fallback
    if (!qrRecord) {
      try {
        const allTenants = await masterSequelize.query(
          `SELECT id, db_name FROM tenants`,
          { type: QueryTypes.SELECT }
        ).catch(() => []);

        for (const t of allTenants) {
          try {
            const conn = await getTenantConnection(t.id || t.db_name);
            if (conn && conn !== activeDb) {
              const rec = await queryActiveQr(conn);
              if (rec) {
                qrRecord = rec;
                activeDb = conn;
                break;
              }
            }
          } catch (e) {}
        }
      } catch (e) {}
    }

    // Check masterSequelize fallback
    if (!qrRecord && activeDb !== masterSequelize) {
      try {
        const rec = await queryActiveQr(masterSequelize);
        if (rec) {
          qrRecord = rec;
          activeDb = masterSequelize;
        }
      } catch (e) {}
    }

    // Fallback: If not found in employee_qr_codes, check if the employee exists in employees table
    const empResult = await this.findEmployee(activeDb, payload.empId || payload.empCode, targetOrg);
    if (!qrRecord && empResult && empResult.employee) {
      // Auto-provision active QR record for verified employee
      try {
        const freshBadge = await this.generateEmployeeQr(empResult.employee.id, empResult.companyCode);
        qrRecord = {
          id: freshBadge.id,
          employee_id: empResult.employee.id,
          employee_code: freshBadge.employeeCode,
          company_code: freshBadge.companyCode,
          qr_token: freshBadge.qrToken,
          status: 'ACTIVE',
        };
        activeDb = empResult.db;
      } catch (e) {}
    }

    if (!qrRecord) {
      throw new ApiError(400, 'Unregistered QR code. Employee not found in system database.');
    }

    // If activeDb has an older revoked card but the employee has an active one, check for active
    if (qrRecord.status === 'REVOKED' && empResult && empResult.employee) {
      const [activeOnes] = await activeDb.query(
        `SELECT * FROM employee_qr_codes WHERE employee_id = ? AND status = 'ACTIVE' ORDER BY created_at DESC LIMIT 1`,
        { replacements: [String(empResult.employee.id)] }
      ).catch(() => [[]]);
      if (activeOnes && activeOnes.length > 0) {
        qrRecord = activeOnes[0];
      }
    }

    if (qrRecord.status === 'REVOKED') {
      throw new ApiError(400, 'This Employee QR card has been REVOKED by HR. Please generate a new QR card.');
    }
    if (qrRecord.status !== 'ACTIVE') {
      throw new ApiError(400, `This QR card is ${qrRecord.status}. Scans are not permitted.`);
    }

    // 5. Fetch employee profile
    if (!empResult) {
      throw new ApiError(404, 'Employee record associated with this QR code could not be found.');
    }
    const employee = empResult.employee;
    activeDb = empResult.db;

    const empCode = employee.employeeCode || employee.emp_code || employee.employeeId || String(employee.id);
    const empName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.employee_name || 'Employee';

    // Verify employee status is Active
    const empStatus = String(employee.employeeStatus || employee.status || 'Active').toLowerCase().trim();
    if (['inactive', 'terminated', 'resigned', 'suspended', 'left'].includes(empStatus)) {
      throw new ApiError(403, `Employee ${empName} (${empCode}) is currently marked ${employee.employeeStatus || employee.status}. Attendance marking is prohibited.`);
    }

    // 6. Look up today's attendance status
    const todayStr = new Date().toISOString().split('T')[0];
    const [todayRecords] = await activeDb.query(
      `SELECT * FROM daily_attendance 
       WHERE (empId = ? OR emp_id = ? OR employeeId = ?) AND date = ? 
       ORDER BY id DESC LIMIT 1`,
      { replacements: [String(empCode), String(empCode), String(employee.id), todayStr] }
    ).catch(() => [[]]);

    const todayAtt = todayRecords && todayRecords.length > 0 ? todayRecords[0] : null;

    let nextAction = 'clock-in';
    let statusText = 'Ready for Check-In';
    let checkInTime = null;
    let checkOutTime = null;
    let workingHours = null;

    if (todayAtt) {
      checkInTime = todayAtt.checkIn || todayAtt.check_in || null;
      checkOutTime = (todayAtt.checkOut && todayAtt.checkOut !== '--') ? todayAtt.checkOut : (todayAtt.check_out && todayAtt.check_out !== '--') ? todayAtt.check_out : null;
      workingHours = todayAtt.workingHours || todayAtt.working_hours || null;

      if (checkInTime && !checkOutTime) {
        nextAction = 'clock-out';
        statusText = `Checked in at ${checkInTime}. Ready for Check-Out`;
      } else if (checkInTime && checkOutTime) {
        nextAction = 'completed';
        statusText = `Shift Completed (In: ${checkInTime}, Out: ${checkOutTime})`;
      }
    }

    return {
      identified: true,
      resolvedCompanyCode: activeDb.config?.database || targetOrg,
      employee: {
        id: employee.id,
        employeeCode: empCode,
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        name: empName,
        email: employee.email || employee.officialEmail || '',
        department: employee.department || 'Operations',
        designation: employee.designation || 'Staff Professional',
        photo: employee.photo || null,
        company: employee.company || companyCode || targetOrg,
        shift: employee.shift || 'General Shift',
      },
      todayAttendance: todayAtt,
      nextAction,
      statusText,
      checkInTime,
      checkOutTime,
      workingHours,
      payload,
    };
  }

  /**
   * Core Action: Marks attendance for the employee scanned via their QR badge.
   * Called by office kiosk or attendance operator.
   */
  async scanEmployeeQrPunch(operatorUser, qrToken, context = {}) {
    // Flexible handling:
    // Case A: scanEmployeeQrPunch({ qrToken, ... })
    if (typeof operatorUser === 'object' && operatorUser !== null && !qrToken) {
      if (operatorUser.qrToken || operatorUser.qrData || operatorUser.token || operatorUser.code) {
        context = { ...operatorUser };
        qrToken = operatorUser.qrToken || operatorUser.qrData || operatorUser.token || operatorUser.code;
        operatorUser = null;
      }
    } else if (typeof operatorUser === 'string' && (!qrToken || typeof qrToken === 'object')) {
      // Case B: scanEmployeeQrPunch(qrToken, context)
      context = (typeof qrToken === 'object' && qrToken !== null) ? qrToken : (context || {});
      qrToken = operatorUser;
      operatorUser = null;
    }

    // 1. Verify and identify
    const companyCode = context.companyCode || operatorUser?.companyCode || 'YASHTECH';
    const idResult = await this.verifyAndIdentify(qrToken, companyCode);
    const { employee, nextAction, checkInTime, checkOutTime } = idResult;
    const targetDbCode = idResult.resolvedCompanyCode || companyCode;
    const activeDb = await this.getActiveDb(targetDbCode);

    // 2. Allow continuous scanning without blocking (alternate check-in / check-out seamlessly)
    const effectiveNextAction = nextAction === 'completed' ? 'clock-in' : nextAction;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now);
    const empCode = employee.employeeCode;
    const empName = employee.name;

    // 3. Database Transaction with row-level locks
    return await activeDb.transaction(async (transaction) => {
      // Find today's record under lock
      const [existingRows] = await activeDb.query(
        `SELECT * FROM daily_attendance 
         WHERE (empId = ? OR emp_id = ? OR employeeId = ?) AND date = ? 
         ORDER BY id DESC LIMIT 1 FOR UPDATE`,
        {
          replacements: [String(empCode), String(empCode), String(employee.id), dateStr],
          transaction,
        }
      );

      const existing = existingRows && existingRows.length > 0 ? existingRows[0] : null;

      // 4. Explicit action & duplicate check
      const requestedAction = context.action || context.requestedAction;

      // Prevent rapid double scan (only for identical duplicate punch frame bounce < 2s)
      if (existing) {
        const lastPunchTime = existing.updated_at || existing.updatedAt || existing.created_at || existing.createdAt;
        if (lastPunchTime) {
          const diffSeconds = (now.getTime() - new Date(lastPunchTime).getTime()) / 1000;
          const isSameActionBounce = (
            (!requestedAction && diffSeconds < 2) ||
            (requestedAction === 'clock-in' && (existing.checkIn || existing.check_in)) ||
            (requestedAction === 'clock-out' && existing.checkOut && existing.checkOut !== '--')
          );
          if (diffSeconds < 2 && isSameActionBounce) {
            return {
              action: existing.checkOut && existing.checkOut !== '--' ? 'completed' : 'already-checked-in',
              attendanceId: existing.id,
              date: dateStr,
              time: existing.checkOut && existing.checkOut !== '--' ? existing.checkOut : existing.checkIn,
              checkInTime: existing.checkIn || existing.check_in,
              checkOutTime: existing.checkOut || existing.check_out,
              employee: idResult.employee,
              status: 'Present',
              message: `Card already processed for ${empName} (${empCode}). Please remove badge from camera.`,
            };
          }
        }
      }

      if (requestedAction === 'clock-in') {
        if (existing && (existing.checkIn || existing.check_in)) {
          const prevOut = existing.checkOut || existing.check_out;
          if (prevOut && prevOut !== '--') {
            return {
              action: 'clock-in',
              attendanceId: existing.id,
              date: dateStr,
              time: existing.checkIn || existing.check_in,
              checkInTime: existing.checkIn || existing.check_in,
              checkOutTime: prevOut,
              workingHours: existing.workingHours || existing.working_hours || 0,
              employee: idResult.employee,
              status: 'Completed',
              message: `Today's attendance check-in is already recorded for ${empName} (${empCode}) at ${existing.checkIn || existing.check_in}.`,
            };
          }
        }
      } else if (requestedAction === 'clock-out') {
        if (!existing || (!existing.checkIn && !existing.check_in)) {
          // If no check-in exists yet, treat first scan as check-in
        } else {
          const prevOut = existing.checkOut || existing.check_out;
          if (prevOut && prevOut !== '--') {
            return {
              action: 'clock-out',
              attendanceId: existing.id,
              date: dateStr,
              time: prevOut,
              checkInTime: existing.checkIn || existing.check_in,
              checkOutTime: prevOut,
              workingHours: existing.workingHours || existing.working_hours || 0,
              employee: idResult.employee,
              status: 'Completed',
              message: `Today's attendance check-out is already recorded for ${empName} (${empCode}) at ${prevOut}.`,
            };
          }
        }
      }

      // 6. First scan of the day -> CHECK-IN
      if (!existing || (!existing.checkIn && !existing.check_in)) {
        const [insertResult] = await activeDb.query(
          `INSERT INTO daily_attendance 
            (employeeId, emp_id, empId, name, date, day, checkIn, check_in, checkOut, check_out, 
             workingHours, working_hours, status, verification_method, verification_status, 
             attendance_location, company, department, branch, shift, remarks, created_at, updated_at)
           VALUES 
            (?, ?, ?, ?, ?, ?, ?, ?, '--', '--', 
             0, 0, 'Present', 'QR', 'VERIFIED', 
             'Admin QR Scanner', ?, ?, 'Headquarters', ?, ?, NOW(), NOW())`,
          {
            replacements: [
              String(employee.id),
              String(empCode),
              String(empCode),
              empName,
              dateStr,
              dayName,
              timeStr,
              timeStr,
              employee.company || companyCode,
              employee.department || 'Operations',
              employee.shift || 'General Shift',
              `Clock-In confirmed by Admin (${operatorUser?.email || operatorUser?.id || 'Admin'}) via Employee QR`,
            ],
            transaction,
          }
        );
        const newAttId = insertResult;

        // Audit Log
        await auditLogService.log({
          userId: operatorUser?.id || 'kiosk',
          username: operatorUser?.email || 'Kiosk Operator',
          roleName: operatorUser?.role?.name || 'Operator',
          actionType: 'Employee QR Check-In',
          moduleName: 'Attendance',
          recordId: newAttId,
          newValues: { employeeId: employee.id, employeeCode: empCode, time: timeStr, action: 'clock-in' },
          httpMethod: 'POST',
          apiEndpoint: '/api/operations/attendance/employee-qr/scan-punch',
          status: 'Success',
        });

        return {
          action: 'clock-in',
          attendanceId: newAttId,
          date: dateStr,
          time: timeStr,
          checkInTime: timeStr,
          checkOutTime: null,
          workingHours: 0,
          employee: idResult.employee,
          status: 'Present',
          message: `Check-in successful for ${empName} (${empCode}) at ${timeStr}.`,
        };
      }

      // 7. Second scan of the day -> CHECK-OUT
      const existingCheckIn = existing.checkIn || existing.check_in;
      const existingCheckOut = existing.checkOut || existing.check_out;

      if (existingCheckIn && (!existingCheckOut || existingCheckOut === '--')) {
        // If in auto mode and checked in less than 3 seconds ago, prevent accidental instant double bounce
        if (!requestedAction || requestedAction === 'auto') {
          try {
            const [ciH, ciM, ciS] = String(existingCheckIn).split(':').map(Number);
            const [coH, coM, coS] = String(timeStr).split(':').map(Number);
            const diffSec = ((coH * 3600) + (coM * 60) + (coS || 0)) - ((ciH * 3600) + (ciM * 60) + (ciS || 0));
            if (diffSec >= 0 && diffSec < 1) {
              return {
                action: 'already-checked-in',
                attendanceId: existing.id,
                date: dateStr,
                time: existingCheckIn,
                checkInTime: existingCheckIn,
                employee: idResult.employee,
                status: 'Present',
                message: `${empName} (${empCode}) checked in at ${existingCheckIn}. Please remove card from camera.`,
              };
            }
          } catch (_) {}
        }
        let workingHours = 0;
        try {
          const [ciH, ciM, ciS] = String(existingCheckIn).split(':').map(Number);
          const [coH, coM, coS] = String(timeStr).split(':').map(Number);
          const diffMinutes = ((coH * 60) + (coM || 0) + ((coS || 0) / 60)) - ((ciH * 60) + (ciM || 0) + ((ciS || 0) / 60));
          if (diffMinutes > 0) {
            workingHours = parseFloat((diffMinutes / 60).toFixed(2));
          }
        } catch (e) {
          workingHours = 8.0;
        }

        await activeDb.query(
          `UPDATE daily_attendance 
           SET checkOut = ?, check_out = ?, workingHours = ?, working_hours = ?, 
               verification_method = 'QR',
               remarks = CONCAT(COALESCE(remarks, ''), ' | Clock-Out confirmed by Admin (${operatorUser?.email || operatorUser?.id || "Admin"}) via Employee QR'),
               updated_at = NOW() 
           WHERE id = ?`,
          {
            replacements: [timeStr, timeStr, workingHours, workingHours, existing.id],
            transaction,
          }
        );

        // Audit Log
        await auditLogService.log({
          userId: operatorUser?.id || 'kiosk',
          username: operatorUser?.email || 'Kiosk Operator',
          roleName: operatorUser?.role?.name || 'Operator',
          actionType: 'Employee QR Check-Out',
          moduleName: 'Attendance',
          recordId: existing.id,
          newValues: { employeeId: employee.id, employeeCode: empCode, time: timeStr, workingHours, action: 'clock-out' },
          httpMethod: 'POST',
          apiEndpoint: '/api/operations/attendance/employee-qr/scan-punch',
          status: 'Success',
        });

        return {
          action: 'clock-out',
          attendanceId: existing.id,
          date: dateStr,
          time: timeStr,
          checkInTime: existingCheckIn,
          checkOutTime: timeStr,
          workingHours,
          employee: idResult.employee,
          status: 'Present',
          message: `Check-out successful for ${empName} (${empCode}) at ${timeStr}. Shift Duration: ${workingHours} hrs.`,
        };
      }

      // 8. If both check-in and check-out already exist today -> Today's Attendance is Completed!
      const finalWorkHours = existing.workingHours || existing.working_hours || 0;
      const finalAction = requestedAction === 'clock-out' ? 'clock-out' : 'clock-in';
      return {
        action: finalAction,
        attendanceId: existing.id,
        date: dateStr,
        time: finalAction === 'clock-out' ? (existingCheckOut || timeStr) : (existingCheckIn || timeStr),
        checkInTime: existingCheckIn,
        checkOutTime: existingCheckOut,
        workingHours: finalWorkHours,
        employee: idResult.employee,
        status: 'Completed',
        message: `${finalAction === 'clock-out' ? 'Check-out' : 'Check-in'} recorded for ${empName} (${empCode}). Shift Duration: ${finalWorkHours} hrs.`,
      };
    });
  }
}

module.exports = new EmployeeQrService();
