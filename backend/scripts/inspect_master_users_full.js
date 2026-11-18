const { masterSequelize } = require('../config/database');

async function showCols() {
  const [cols] = await masterSequelize.query('SHOW COLUMNS FROM users');
  console.log('Columns in system_master_db.users:', cols.map(c => c.Field));
  const [rows] = await masterSequelize.query('SELECT * FROM users');
  console.log('Rows in system_master_db.users:', rows);
  process.exit(0);
}

showCols();
