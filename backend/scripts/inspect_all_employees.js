require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { getTenantConnection } = require('../config/connectionManager');
const { QueryTypes } = require('sequelize');

(async () => {
  try {
    const tenantDb = await getTenantConnection('nib_insurance');
    const emps = await tenantDb.query('SELECT id, employee_name, email, designation, department, branch, branch_id FROM employees', { type: QueryTypes.SELECT });
    console.log(JSON.stringify(emps, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
