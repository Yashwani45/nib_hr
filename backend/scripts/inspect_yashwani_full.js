const { getTenantConnection } = require('../config/connectionManager');
const { tenantStorage } = require('../config/database');

async function inspectYashwani() {
  const tenantDb = await getTenantConnection('nib_insurance');
  await tenantStorage.run(tenantDb, async () => {
    const [emp] = await tenantDb.query("SELECT * FROM employees WHERE employeeCode = 'TVN2007' OR id = '0e009a4b-0d9c-41ca-a224-905b1f5250d0'", { type: tenantDb.QueryTypes.SELECT });
    console.log('Yashwani profile data:');
    console.log(emp);
  });
  process.exit(0);
}

inspectYashwani();
