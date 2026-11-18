const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { getTenantConnection } = require('../config/connectionManager');

async function check() {
  const db = await getTenantConnection('nib_insurance');
  const [rows] = await db.query('SELECT qr_token, qr_data_url FROM employee_qr_codes WHERE employee_code="TVN2004" AND status="ACTIVE"');
  if (rows.length) {
    console.log('Token in DB:', rows[0].qr_token);
    console.log('qr_data_url length:', rows[0].qr_data_url ? rows[0].qr_data_url.length : 0);
  }
  process.exit(0);
}
check();
