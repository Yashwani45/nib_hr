const { tenantStorage, sequelize } = require('../config/database');
const { getTenantConnection } = require('../config/connectionManager');
const { Department } = require('../models');

async function run() {
  try {
    const tenantId = 'fdcd11ae-2efd-4847-afdd-37ac289b8bb4';
    const tenantDb = await getTenantConnection(tenantId);

    await tenantStorage.run(tenantDb, async () => {
      console.log('ACTIVE STORE:', tenantStorage.getStore() ? 'Defined' : 'Undefined');
      console.log('Querying department by findByPk...');
      const [dept] = await sequelize.query(
        "SELECT * FROM departments WHERE id = '742e6c3f-d984-4994-8f4b-83a5553e96a6' LIMIT 1",
        { type: sequelize.QueryTypes.SELECT, logging: console.log }
      );
      console.log('Department found via proxy raw query:', dept);
    });
  } catch (err) {
    console.error('Error during query:', err);
  } finally {
    process.exit(0);
  }
}

run();
