const { getTenantConnection } = require('../config/connectionManager');
const { sequelize } = require('../config/database');

async function checkCols() {
  const dbs = ['system_master_db', 'nib_insurance', 'yashtech', 'aarogya_homeopathy_clinic'];
  for (const dbName of dbs) {
    try {
      let conn;
      if (dbName === 'system_master_db') {
        conn = sequelize;
      } else {
        conn = await getTenantConnection(dbName);
      }
      const [cols] = await conn.query('SHOW COLUMNS FROM daily_attendance');
      const colNames = cols.map(c => c.Field);
      console.log(`\nDB: ${dbName} (Total cols: ${colNames.length})`);
      console.log('Has attendance_date?', colNames.includes('attendance_date'));
      console.log('Has check_in_time?', colNames.includes('check_in_time'));
      console.log('Has total_working_minutes?', colNames.includes('total_working_minutes'));
      console.log('Has attendance_status?', colNames.includes('attendance_status'));
    } catch (e) {
      console.log(`DB ${dbName} error:`, e.message);
    }
  }
  process.exit(0);
}

checkCols();
