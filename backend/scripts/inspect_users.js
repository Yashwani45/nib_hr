require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { getTenantConnection } = require('../config/connectionManager');
const { QueryTypes } = require('sequelize');

(async () => {
  try {
    const tenantDb = await getTenantConnection('nib_insurance');
    const cols = await tenantDb.query('DESCRIBE users', { type: QueryTypes.SELECT });
    console.log(cols.map(c => c.Field));
    const users = await tenantDb.query('SELECT * FROM users LIMIT 5', { type: QueryTypes.SELECT });
    console.log(users);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
