require('dotenv').config();
const { masterSequelize } = require('./config/database');

async function main() {
  try {
    for (const dbName of ['nib_insurance', 'yashtech']) {
      try {
        const [logs] = await masterSequelize.query(`SELECT * FROM \`${dbName}\`.daily_attendance ORDER BY date DESC LIMIT 20`);
        console.log(`Logs in ${dbName} (${logs.length}):`, logs.map(l => ({
          date: l.date,
          empId: l.employeeId,
          checkIn: l.checkIn,
          checkOut: l.checkOut,
          status: l.status,
          method: l.verification_method || l.remarks
        })));
      } catch (e) {
        console.log(`Error in ${dbName}:`, e.message);
      }
    }
  } catch (e) {
    console.error(e.message);
  } finally {
    process.exit(0);
  }
}
main();
