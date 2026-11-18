const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { getTenantConnection } = require('../config/connectionManager');

async function test() {
  try {
    const conn = await getTenantConnection('yashtech');
    console.log('Conn config database:', conn.config.database);
    const [rows] = await conn.query('SELECT COUNT(*) as cnt FROM employees');
    console.log('Employees count:', rows);
  } catch (e) {
    console.error('Stack error:', e);
  }
  process.exit(0);
}
test();
