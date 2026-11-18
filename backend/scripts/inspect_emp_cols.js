require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { getTenantConnection } = require('../config/connectionManager');
const { QueryTypes } = require('sequelize');

(async () => {
  const tenantDb = await getTenantConnection('nib_insurance');
  const cols = await tenantDb.query('DESCRIBE employees', { type: QueryTypes.SELECT });
  console.log(cols.map(c => c.Field));
  process.exit(0);
})();
