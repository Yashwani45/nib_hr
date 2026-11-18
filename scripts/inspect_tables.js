const { masterSequelize } = require('../backend/config/database');
const { getTenantConnection } = require('../backend/config/connectionManager');

async function test() {
  try {
    const tenantDb = await getTenantConnection('nib_insurance');
    const [tables] = await tenantDb.query("SHOW TABLES");
    console.log('Tables in nib_insurance:', tables.map(t => Object.values(t)[0]));
  } catch(e) {
    console.error(e.message);
  } finally {
    process.exit(0);
  }
}
test();
