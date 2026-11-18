const { tenantStorage } = require('../config/database');
const { getTenantConnection } = require('../config/connectionManager');

(async () => {
  const db = await getTenantConnection('nib_insurance');
  const [items] = await db.query('SELECT * FROM payroll_items ORDER BY created_at DESC LIMIT 1');
  console.log('Latest payroll_item:', JSON.stringify(items[0], null, 2));
  process.exit(0);
})();
