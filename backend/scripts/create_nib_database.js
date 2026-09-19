const mysql = require('c:/Users/admin/nib_hr/backend/node_modules/mysql2/promise');
const crypto = require('crypto');

(async () => {
  try {
    const rootConn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''
    });

    console.log('1. Creating database `nib_insurance`...');
    await rootConn.query('CREATE DATABASE IF NOT EXISTS `nib_insurance` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    console.log('Database `nib_insurance` created successfully!');

    // Connect to source (yashtech) and destination (nib_insurance)
    const yashConn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'yashtech' });
    const nibConn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'nib_insurance' });

    // Disable FK checks during migration
    await nibConn.query('SET FOREIGN_KEY_CHECKS = 0;');

    console.log('2. Copying table schemas from `yashtech` to `nib_insurance`...');
    const [tables] = await yashConn.query('SHOW TABLES');
    const tableKey = Object.keys(tables[0])[0];

    for (const row of tables) {
      const tbl = row[tableKey];
      try {
        const [createRes] = await yashConn.query(`SHOW CREATE TABLE \`${tbl}\``);
        const createSql = createRes && createRes[0] ? (createRes[0]['Create Table'] || createRes[0]['Create View']) : null;
        if (!createSql) {
          console.log(` - Skipping non-table: ${tbl}`);
          continue;
        }

        await nibConn.query(`DROP TABLE IF EXISTS \`${tbl}\``);
        await nibConn.query(createSql);
        console.log(` - Created table: ${tbl}`);
      } catch (tableErr) {
        console.warn(` - Could not create table ${tbl}:`, tableErr.message);
      }
    }

    console.log('3. Copying all data from `yashtech` to `nib_insurance`...');
    for (const row of tables) {
      const tbl = row[tableKey];
      try {
        const [dataRows] = await yashConn.query(`SELECT * FROM \`${tbl}\``);
        if (dataRows && dataRows.length > 0) {
          for (const item of dataRows) {
            const keys = Object.keys(item).map(k => `\`${k}\``).join(', ');
            const placeholders = Object.keys(item).map(() => '?').join(', ');
            const values = Object.values(item);
            await nibConn.query(`INSERT IGNORE INTO \`${tbl}\` (${keys}) VALUES (${placeholders})`, values);
          }
          console.log(` - Copied ${dataRows.length} rows into ${tbl}`);
        }
      } catch (dataErr) {
        console.warn(` - Could not copy data for ${tbl}:`, dataErr.message);
      }
    }

    // Re-enable FK checks
    await nibConn.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('4. Registering `NIB Insurance` in `system_master_db.tenants`...');
    const masterConn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'system_master_db' });
    
    // Check if tenant already exists
    const [existing] = await masterConn.query('SELECT * FROM tenants WHERE db_name = "nib_insurance" OR company_name = "NIB Insurance"');
    if (existing.length === 0) {
      const tenantId = crypto.randomUUID();
      await masterConn.query(`
        INSERT INTO tenants (
          id, company_name, db_host, db_port, db_name, db_username, db_password,
          db_ssl, status, created_at, updated_at, admin_email, admin_password,
          plan, trial_status, expiry_date, monthly_fee, max_seats
        ) VALUES (
          ?, 'NIB Insurance', 'localhost', 3306, 'nib_insurance', 'root', '',
          1, 'Active', NOW(), NOW(), 'admin@nibinsurance.com', '$2a$10$9sxWcrzFT4L/jD7Rw48daOriOUOfKSAfnf2gysOPwUb6p2aqBiSai',
          'YEARLY', 'Trial Active', DATE_ADD(NOW(), INTERVAL 1 YEAR), '9000.00', 100
        )
      `, [tenantId]);
      console.log('Registered `NIB Insurance` in system_master_db.tenants!');
    } else {
      console.log('Tenant already registered:', existing[0].company_name);
    }

    await rootConn.end();
    await yashConn.end();
    await nibConn.end();
    await masterConn.end();
    console.log('SUCCESS! Database `nib_insurance` is completely created and populated.');
  } catch (err) {
    console.error('Error creating nib_insurance database:', err);
  }
})();
