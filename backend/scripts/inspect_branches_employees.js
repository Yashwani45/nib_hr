require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { getTenantConnection } = require('../config/connectionManager');
const { QueryTypes } = require('sequelize');

(async () => {
  try {
    const tenantDb = await getTenantConnection('nib_insurance');
    const branches = await tenantDb.query('SELECT * FROM branches', { type: QueryTypes.SELECT });
    console.log('Branches in nib_insurance:');
    console.log(JSON.stringify(branches, null, 2));

    const emps = await tenantDb.query('SELECT id, employee_name, branch, branch_id FROM employees', { type: QueryTypes.SELECT });
    console.log(`Total Employees in nib_insurance: ${emps.length}`);

    // Distribution
    const dist = {};
    emps.forEach(e => {
      const key = `${e.branch_id || 'no-id'} | ${e.branch || 'no-branch'}`;
      dist[key] = (dist[key] || 0) + 1;
    });
    console.log('Employee Branch distribution:', dist);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
