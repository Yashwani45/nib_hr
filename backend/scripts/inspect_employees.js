// backend/scripts/inspect_employees.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { masterSequelize } = require('../config/database');

async function run() {
  try {
    const [tenants] = await masterSequelize.query('SELECT * FROM tenants').catch(() => [[]]);
    const dbs = ['system_master_db', ...tenants.map(t => t.db_name).filter(Boolean)];
    for (const db of dbs) {
      try {
        const [emps] = await masterSequelize.query(`SELECT id, emp_code, employeeCode, employeeId, firstName, lastName, employee_name, department, employeeStatus FROM \`${db}\`.employees`);
        console.log(`DB: ${db} -> Total employees: ${emps.length}`);
        emps.forEach(e => {
          console.log(`   id=${e.id}, code=${e.emp_code || e.employeeCode || e.employeeId}, name=${e.firstName || e.employee_name}, dept=${e.department}, status=${e.employeeStatus}`);
        });
      } catch (err) {
        console.log(`DB: ${db} -> Error: ${err.message}`);
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
