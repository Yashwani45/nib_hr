const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const masterSequelize = new Sequelize(
  process.env.MASTER_DB_NAME || 'system_master_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
  }
);

async function run() {
  try {
    await masterSequelize.authenticate();
    console.log('Connected to system_master_db');

    // Get all tenants
    const [tenants] = await masterSequelize.query('SELECT * FROM tenants');
    console.log(`Found ${tenants.length} tenants`);

    // Fix system_master_db designations table
    try {
      await masterSequelize.query("UPDATE `designations` SET `updated_at` = CURRENT_TIMESTAMP WHERE `updated_at` = '0000-00-00 00:00:00' OR `updated_at` IS NULL").catch(() => {});
      await masterSequelize.query("UPDATE `designations` SET `created_at` = CURRENT_TIMESTAMP WHERE `created_at` = '0000-00-00 00:00:00' OR `created_at` IS NULL").catch(() => {});
      await masterSequelize.query("ALTER TABLE `designations` MODIFY COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP").catch(() => {});
      await masterSequelize.query("ALTER TABLE `designations` MODIFY COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP").catch(() => {});
      console.log('Fixed master designations table successfully.');
    } catch (e) {
      console.error('Master designation fix error:', e.message);
    }

    for (const tenant of tenants) {
      console.log(`Fixing tenant DB: ${tenant.db_name}`);
      const tenantDb = new Sequelize(
        tenant.db_name,
        tenant.db_username || process.env.DB_USER || 'root',
        tenant.db_password || process.env.DB_PASSWORD || '',
        {
          host: tenant.db_host || process.env.DB_HOST || 'localhost',
          port: tenant.db_port || process.env.DB_PORT || 3306,
          dialect: 'mysql',
          logging: false
        }
      );

      try {
        await tenantDb.query("ALTER TABLE `designations` MODIFY COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
        console.log(`  Altered designations.created_at successfully.`);
      } catch (err) {
        console.error(`  Error altering designations.created_at: ${err.message}`);
      }

      try {
        await tenantDb.query("ALTER TABLE `designations` MODIFY COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        console.log(`  Altered designations.updated_at successfully.`);
      } catch (err) {
        console.error(`  Error altering designations.updated_at: ${err.message}`);
      }

      await tenantDb.close();
    }

    console.log('All database migrations/fixes completed successfully!');
  } catch (err) {
    console.error('Run failed:', err);
  } finally {
    await masterSequelize.close();
  }
}

run();
