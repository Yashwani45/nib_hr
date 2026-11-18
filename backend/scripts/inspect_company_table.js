const { getTenantConnection } = require('../config/connectionManager');

async function inspectCompany() {
  const conn = await getTenantConnection('nib_insurance');
  const [rows] = await conn.query('SELECT * FROM company').catch(e => {
    return [[{ error: e.message }]];
  });
  console.log('Company rows in nib_insurance:', rows);
  process.exit(0);
}

inspectCompany();
