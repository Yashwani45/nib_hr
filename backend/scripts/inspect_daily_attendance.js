// backend/scripts/inspect_daily_attendance.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { masterSequelize } = require('../config/database');

async function run() {
  const dbs = ['nib_insurance', 'yashtech', 'aarogya_homeopathy_clinic', 'system_master_db'];
  for (const db of dbs) {
    try {
      console.log(`\n=== DB: ${db} - daily_attendance ===`);
      const [cols] = await masterSequelize.query(`DESCRIBE \`${db}\`.daily_attendance`);
      console.log('Columns:', cols.map(c => c.Field));
    } catch (e) {
      console.log(`Error in ${db}:`, e.message);
    }
  }
  process.exit(0);
}

run();
