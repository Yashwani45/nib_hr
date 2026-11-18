require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { getTenantConnection } = require('../config/connectionManager');

(async () => {
  try {
    const tenantDb = await getTenantConnection('nib_insurance');
    const [tables] = await tenantDb.query("SHOW TABLES");
    console.log('Tables in nib_insurance:', tables);

    const [branchRows] = await tenantDb.query("SELECT * FROM branch").catch(e => tenantDb.query("SELECT * FROM branches")).catch(e => [[]]);
    console.log('Branch rows:', branchRows);

    const [empRows] = await tenantDb.query("SELECT id, employeeCode, firstName, lastName, branch_id, branchName, branch FROM employees").catch(e => [[]]);
    console.log('Employees total:', empRows.length, empRows.map(e => ({ code: e.employeeCode, name: `${e.firstName} ${e.lastName || ''}`.trim(), branch: e.branchName || e.branch, branch_id: e.branch_id })));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
