// backend/scripts/test_employee_qr_endpoint.js
const dotenv = require('dotenv');
dotenv.config();
const { masterSequelize } = require('../config/database');
const employeeQrService = require('../services/operations/employeeQr.service');

async function testEndpoint() {
  try {
    const [tenants] = await masterSequelize.query('SELECT * FROM tenants').catch(() => [[]]);
    console.log('Tenants:', tenants.map(t => ({ db_name: t.db_name, company_name: t.company_name })));

    const dbs = ['system_master_db', ...tenants.map(t => t.db_name).filter(Boolean)];

    for (const db of dbs) {
      console.log(`\n=== Testing DB: ${db} ===`);
      const [emps] = await masterSequelize.query(`SELECT * FROM \`${db}\`.employees LIMIT 3`).catch(e => {
        console.log(`[${db}] query error:`, e.message);
        return [[]];
      });

      console.log(`Employees in ${db}:`, emps.length);
      for (const emp of emps) {
        console.log(`- Emp: id=${emp.id}, emp_code=${emp.emp_code || emp.employeeCode || emp.employeeId}, name=${emp.firstName || emp.employee_name}`);
        try {
          const qr = await employeeQrService.getEmployeeQr(emp.id, db);
          console.log(`  -> getEmployeeQr(id=${emp.id}) SUCCESS: qrToken length=${qr.qrToken?.length}, dataUrl length=${qr.qrDataUrl?.length}`);
        } catch (e) {
          console.error(`  -> getEmployeeQr(id=${emp.id}) FAILED:`, e.message);
        }

        const code = emp.emp_code || emp.employeeCode || emp.employeeId;
        if (code && code !== emp.id) {
          try {
            const qr = await employeeQrService.getEmployeeQr(code, db);
            console.log(`  -> getEmployeeQr(code=${code}) SUCCESS`);
          } catch (e) {
            console.error(`  -> getEmployeeQr(code=${code}) FAILED:`, e.message);
          }
        }
      }
    }
  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    process.exit(0);
  }
}

testEndpoint();
