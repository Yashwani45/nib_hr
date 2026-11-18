require('dotenv').config();
const { masterSequelize } = require('./config/database');

async function main() {
  try {
    // 1. In nib_insurance, set GEO = 1, FACE = 0, BIOMETRIC = 0, QR = 0
    await masterSequelize.query(`UPDATE \`nib_insurance\`.org_attendance_methods SET is_enabled = 1 WHERE method_type = 'GEO'`);
    await masterSequelize.query(`UPDATE \`nib_insurance\`.org_attendance_methods SET is_enabled = 0 WHERE method_type IN ('FACE', 'BIOMETRIC', 'QR', 'WEB', 'WIFI', 'RFID', 'MANUAL', 'FIELD')`);
    
    // Also in master table if present
    const [cfg] = await masterSequelize.query(`SELECT id FROM org_attendance_configs WHERE company_code = 'nib_insurance' OR company_name = 'NIB Insurance'`);
    if (cfg && cfg.length > 0) {
      await masterSequelize.query(`UPDATE org_attendance_methods SET is_enabled = 1 WHERE config_id = ? AND method_type = 'GEO'`, { replacements: [cfg[0].id] });
      await masterSequelize.query(`UPDATE org_attendance_methods SET is_enabled = 0 WHERE config_id = ? AND method_type != 'GEO'`, { replacements: [cfg[0].id] });
    }

    const [methods] = await masterSequelize.query(`SELECT method_type, is_enabled FROM \`nib_insurance\`.org_attendance_methods`);
    console.log('Updated nib_insurance methods:', methods);
  } catch (e) {
    console.error(e.message);
  } finally {
    process.exit(0);
  }
}
main();
