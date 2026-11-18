// backend/migrations/provision_employee_qr.js
const dotenv = require('dotenv');
dotenv.config();
const { masterSequelize } = require('../config/database');
const { getTenantConnection } = require('../config/connectionManager');
const crypto = require('crypto');
const QRCode = require('qrcode');

async function provisionEmployeeQr() {
  console.log('=== [Migration] Provisioning Employee QR System ===');

  try {
    const [tenants] = await masterSequelize.query('SELECT id, company_name, db_name FROM tenants').catch(() => [[]]);
    const dbs = ['system_master_db', ...tenants.map(t => t.db_name).filter(Boolean)];
    const uniqueDbs = Array.from(new Set(dbs));

    const secretKey = process.env.QR_ATTENDANCE_SECRET || process.env.ACCESS_TOKEN_SECRET || 'qr_attendance_master_secret_key_2026';

    for (const dbName of uniqueDbs) {
      console.log(`\nChecking database: ${dbName}...`);

      // 1. Ensure employee_qr_codes table exists
      await masterSequelize.query(`
        CREATE TABLE IF NOT EXISTS \`${dbName}\`.employee_qr_codes (
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
      `).catch(err => console.warn(`[${dbName}] Table creation warning:`, err.message));

      // 2. Add columns to employees table if table exists
      const [tableExists] = await masterSequelize.query(`
        SELECT TABLE_NAME FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'employees'
      `, { replacements: [dbName] }).catch(() => [[]]);

      if (tableExists.length > 0) {
        // Add qr_code_token
        await masterSequelize.query(`
          ALTER TABLE \`${dbName}\`.employees ADD COLUMN qr_code_token TEXT NULL
        `).catch(() => {});

        // Add qr_code_data_url
        await masterSequelize.query(`
          ALTER TABLE \`${dbName}\`.employees ADD COLUMN qr_code_data_url LONGTEXT NULL
        `).catch(() => {});

        // 3. Backfill existing employees who don't have an active QR code
        const [employees] = await masterSequelize.query(`
          SELECT id, employeeCode, emp_code, firstName, lastName, email, company
          FROM \`${dbName}\`.employees
        `).catch(() => [[]]);

        console.log(`Found ${employees.length} employees in ${dbName}. Generating unique QR badges...`);

        const companyCode = (dbName === 'nib_insurance' ? 'NIB_INSURANCE' : dbName === 'yashtech' ? 'YASHTECH' : dbName === 'aarogya_homeopathy_clinic' ? 'AAROGYA' : 'SYSTEM_MASTER').toUpperCase();

        for (const emp of employees) {
          const empCode = emp.employeeCode || emp.emp_code || `EMP-${String(emp.id).slice(0, 6).toUpperCase()}`;

          // Check if active QR already exists
          const [existing] = await masterSequelize.query(`
            SELECT id FROM \`${dbName}\`.employee_qr_codes 
            WHERE employee_id = ? AND status = 'ACTIVE' LIMIT 1
          `, { replacements: [String(emp.id)] }).catch(() => [[]]);

          if (existing.length === 0) {
            // Generate opaque token
            const nonce = crypto.randomBytes(16).toString('hex');
            const payload = {
              type: 'EMPLOYEE_QR',
              purpose: 'EMPLOYEE_ATTENDANCE_BADGE',
              org: companyCode.toLowerCase(),
              companyCode: companyCode.toUpperCase(),
              empId: String(emp.id),
              empCode: String(empCode),
              ts: Date.now(),
              nonce,
              v: 1
            };

            const payloadStr = JSON.stringify(payload);
            const encodedPayload = Buffer.from(payloadStr, 'utf8').toString('base64url');
            const signature = crypto.createHmac('sha256', secretKey).update(encodedPayload).digest('base64url');
            const token = `${encodedPayload}.${signature}`;

            let qrDataUrl = '';
            try {
              qrDataUrl = await QRCode.toDataURL(token, {
                errorCorrectionLevel: 'H',
                width: 450,
                margin: 2,
                color: {
                  dark: '#0f172a',
                  light: '#ffffff'
                }
              });
            } catch (e) {}

            const qrId = crypto.randomUUID ? crypto.randomUUID() : `qr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

            await masterSequelize.query(`
              INSERT INTO \`${dbName}\`.employee_qr_codes 
                (id, employee_id, employee_code, company_code, qr_token, qr_data_url, status, generated_at, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', NOW(), NOW(), NOW())
            `, {
              replacements: [qrId, String(emp.id), String(empCode), companyCode, token, qrDataUrl]
            }).catch(err => console.warn(`Error inserting QR for ${emp.id}:`, err.message));

            await masterSequelize.query(`
              UPDATE \`${dbName}\`.employees 
              SET qr_code_token = ?, qr_code_data_url = ? 
              WHERE id = ?
            `, {
              replacements: [token, qrDataUrl, emp.id]
            }).catch(() => {});
          }
        }
      }
    }

    console.log('\n=== [Migration Completed Successfully] ===');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

provisionEmployeeQr();
