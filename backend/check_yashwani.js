require('dotenv').config();
const { masterSequelize } = require('./config/database');

async function main() {
  try {
    const [users] = await masterSequelize.query(`SELECT * FROM users`);
    console.log('Users in master:', users.map(u => ({ id: u.id, email: u.email, name: u.name, companyCode: u.companyCode, company_code: u.company_code })));

    for (const dbName of ['nib_insurance', 'yashtech', 'aarogya_homeopathy_clinic']) {
      try {
        const [emps] = await masterSequelize.query(`SELECT * FROM \`${dbName}\`.employees`);
        console.log(`Employees in ${dbName}:`, emps.map(e => ({ id: e.id, name: e.employee_name || e.employeeName, email: e.email, dept: e.department })));
      } catch (e) {
        console.log(`Error querying ${dbName}:`, e.message);
      }
    }
  } catch (e) {
    console.error(e.message);
  } finally {
    process.exit(0);
  }
}
main();
