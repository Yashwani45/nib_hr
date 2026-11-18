// backend/scripts/inspect_existing_qrs.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { masterSequelize } = require('../config/database');

async function inspectExistingQrs() {
  const dbs = ['nib_insurance', 'yashtech', 'aarogya_homeopathy_clinic', 'system_master_db'];
  for (const db of dbs) {
    console.log(`\n================ DB: ${db} ================`);
    try {
      const [qrs] = await masterSequelize.query(`SELECT * FROM \`${db}\`.employee_qr_codes LIMIT 5`);
      console.log(`Found ${qrs.length} QR records in ${db}`);
      for (const q of qrs) {
        console.log(`- ID: ${q.id}, emp_id: ${q.employee_id}, emp_code: ${q.employee_code}, company: ${q.company_code}, status: ${q.status}`);
        if (q.qr_token) {
          try {
            const parts = q.qr_token.split('.');
            const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
            console.log('  Decoded Token Payload:', payload);
          } catch(e) {
            console.log('  Token is raw string/JSON:', q.qr_token);
          }
        }
      }
    } catch(err) {
      console.log(`Error querying ${db}:`, err.message);
    }
  }
  process.exit(0);
}

inspectExistingQrs();
