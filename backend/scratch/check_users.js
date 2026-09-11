// backend/scratch/check_users.js
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const run = async () => {
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

  try {
    await masterSequelize.authenticate();
    console.log('Connected to system_master_db.');

    // 1. Print all tenants in system_master_db
    const [tenants] = await masterSequelize.query('SELECT * FROM tenants');
    console.log('--- TENANTS IN MASTER DB ---');
    console.table(tenants.map(t => ({
      company_code: t.company_code,
      db_name: t.db_name,
      status: t.status
    })));

    // 2. Query each tenant's database
    for (const tenant of tenants) {
      console.log(`\nQuerying tenant database: ${tenant.db_name}...`);
      const tenantSequelize = new Sequelize(
        tenant.db_name,
        tenant.db_username,
        tenant.db_password || '',
        {
          host: tenant.db_host,
          port: tenant.db_port,
          dialect: 'mysql',
          logging: false
        }
      );

      try {
        const [users] = await tenantSequelize.query(`
          SELECT u.id, u.email, u.password, r.name as role_name
          FROM users u
          LEFT JOIN roles r ON u.role_id = r.id
        `);
        console.log(`--- USERS IN ${tenant.db_name} ---`);
        console.table(users);
      } catch (err) {
        console.error(`Failed to query users in ${tenant.db_name}:`, err.message);
      } finally {
        await tenantSequelize.close();
      }
    }

  } catch (err) {
    console.error('Error during inspection:', err);
  } finally {
    await masterSequelize.close();
  }
};

run();
