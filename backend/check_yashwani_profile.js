require('dotenv').config();
const { masterSequelize } = require('./config/database');

async function main() {
  try {
    const [yash] = await masterSequelize.query(`SELECT * FROM \`nib_insurance\`.employees WHERE email = 'yashwani@gmail.com'`);
    console.log('Yashwani profile:', yash[0]);

    const [logs] = await masterSequelize.query(`SELECT * FROM \`nib_insurance\`.daily_attendance WHERE empId = 'TVN2007' OR name LIKE '%Yashwani%'`);
    console.log('Yashwani logs count:', logs.length);
    console.log('Yashwani dates:', logs.map(l => l.date));
  } catch (e) {
    console.error(e.message);
  } finally {
    process.exit(0);
  }
}
main();
