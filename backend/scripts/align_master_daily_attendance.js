const { getTenantConnection } = require('../config/connectionManager');
const { sequelize } = require('../config/database');

async function syncSchema() {
  try {
    const tenantDb = await getTenantConnection('nib_insurance');
    const [tenantCols] = await tenantDb.query('SHOW COLUMNS FROM daily_attendance');
    const [masterCols] = await sequelize.query('SHOW COLUMNS FROM daily_attendance');
    
    const masterColNames = new Set(masterCols.map(c => c.Field));
    const missing = tenantCols.filter(c => !masterColNames.has(c.Field));
    
    console.log('Columns missing in system_master_db.daily_attendance:', missing.map(m => `${m.Field} (${m.Type})`));
    
    for (const col of missing) {
      const nullClause = col.Null === 'YES' ? 'NULL' : 'NOT NULL';
      const defClause = col.Default !== null ? `DEFAULT '${col.Default}'` : (col.Null === 'YES' ? 'DEFAULT NULL' : '');
      const sql = `ALTER TABLE daily_attendance ADD COLUMN \`${col.Field}\` ${col.Type} ${nullClause} ${defClause}`;
      console.log('Executing:', sql);
      await sequelize.query(sql);
    }
    console.log('Successfully aligned daily_attendance in system_master_db!');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    process.exit(0);
  }
}

syncSchema();
