// backend/scripts/inspect_users2.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { masterSequelize } = require('../config/database');

async function run() {
  try {
    const [cols] = await masterSequelize.query('DESCRIBE system_master_db.users');
    console.log('Users columns:', cols.map(c => c.Field));

    const [users] = await masterSequelize.query('SELECT * FROM system_master_db.users LIMIT 5');
    console.log('Users:', users.map(u => ({ id: u.id, email: u.email, role: u.role, company: u.company || u.company_id || u.tenant_id })));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
