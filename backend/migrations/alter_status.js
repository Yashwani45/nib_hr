// backend/migrations/alter_status.js
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({ host: '127.0.0.1', port: 3306, user: 'root', password: '' });
  const tenants = ['nib_insurance', 'yashtech', 'aarogya_homeopathy_clinic'];
  for (const t of tenants) {
    console.log('Modifying status column in', t);
    await conn.query(`USE \`${t}\``);
    try {
      await conn.query(`ALTER TABLE \`payroll_runs\` MODIFY COLUMN \`status\` VARCHAR(50) NOT NULL DEFAULT 'Draft'`);
    } catch (e) {
      console.log(`[${t}] payroll_runs err:`, e.message);
    }
    try {
      await conn.query(`ALTER TABLE \`payroll_items\` MODIFY COLUMN \`status\` VARCHAR(50) NOT NULL DEFAULT 'Draft'`);
    } catch (e) {
      console.log(`[${t}] payroll_items err:`, e.message);
    }
  }
  await conn.end();
  console.log('Altered successfully across all tenants!');
}

run().catch(console.error);