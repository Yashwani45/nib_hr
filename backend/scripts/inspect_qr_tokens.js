const mysql = require('mysql2/promise');

async function check() {
  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '' });
  for (const db of ['yashtech', 'nib_insurance', 'system_master_db']) {
    try {
      const [rows] = await conn.query(`SELECT id, employee_id, employee_code, company_code, status, LENGTH(qr_token) as token_len, LEFT(qr_token, 40) as token_start FROM \`${db}\`.employee_qr_codes ORDER BY id DESC LIMIT 5`);
      console.log(`\n=== DB: ${db} ===`);
      console.table(rows);
    } catch (e) {
      console.log(`DB ${db} query error:`, e.message);
    }
  }
  await conn.end();
}

check();
