require('dotenv').config();
const { masterSequelize } = require('./config/database');

async function main() {
  try {
    const [tenants] = await masterSequelize.query('SELECT * FROM tenants');
    console.log('Tenants count:', tenants.length);
    tenants.forEach(t => {
      console.log(`- ID: ${t.id}, Name: ${t.company_name}, DB: ${t.db_name}, Admin: ${t.admin_email}`);
    });

    try {
      const [configs] = await masterSequelize.query('SELECT * FROM org_attendance_configs');
      console.log('\nMaster Configs count:', configs.length);
      configs.forEach(c => console.log(c));
    } catch(e) {
      console.log('No org_attendance_configs in master:', e.message);
    }

    try {
      const [methods] = await masterSequelize.query('SELECT * FROM org_attendance_methods');
      console.log('\nMaster Methods count:', methods.length);
      methods.forEach(m => console.log(m));
    } catch(e) {
      console.log('No org_attendance_methods in master:', e.message);
    }

    for (const t of tenants) {
      console.log(`\n=== Checking Tenant DB: ${t.db_name} ===`);
      try {
        const [tConfigs] = await masterSequelize.query(`SELECT * FROM \`${t.db_name}\`.org_attendance_configs`);
        console.log(`Configs in ${t.db_name}:`, tConfigs);
        for (const cfg of tConfigs) {
          const [tMethods] = await masterSequelize.query(`SELECT id, config_id, method_type, is_enabled FROM \`${t.db_name}\`.org_attendance_methods WHERE config_id = ?`, { replacements: [cfg.id] });
          console.log(`Methods for config ${cfg.id}:`, tMethods);
        }
      } catch (err) {
        console.log(`Error checking ${t.db_name}:`, err.message);
      }
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
}

main();
