const { getTenantConnection } = require('../config/connectionManager');
const { sequelize } = require('../config/database');

async function checkAudit() {
  const dbs = ['system_master_db', 'nib_insurance', 'yashtech', 'aarogya_homeopathy_clinic'];
  for (const dbName of dbs) {
    try {
      const conn = dbName === 'system_master_db' ? sequelize : await getTenantConnection(dbName);
      const [tables] = await conn.query("SHOW TABLES LIKE '%audit%'");
      console.log(`DB ${dbName} audit tables:`, tables.map(t => Object.values(t)[0]));
    } catch (e) {
      console.log(`DB ${dbName} error:`, e.message);
    }
  }
  process.exit(0);
}

checkAudit();
