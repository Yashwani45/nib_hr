require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { masterSequelize } = require('../config/database');
const { getTenantConnection } = require('../config/connectionManager');

(async () => {
  try {
    const [tenants] = await masterSequelize.query('SELECT * FROM tenants LIMIT 5');
    console.log('Tenants:', tenants.map(t => ({ id: t.id, company_name: t.company_name, db_name: t.db_name })));

    for (const t of tenants) {
      console.log(`\n================ Tenant: ${t.company_name} (${t.db_name}) ================`);
      const tenantDb = await getTenantConnection(t.db_name);
      
      const [branches] = await tenantDb.query('SELECT id, branch_name, branch_code, is_head_office FROM branches').catch(e => [[]]);
      console.log('Branches in DB:', branches);

      const [emps] = await tenantDb.query('SELECT id, employeeCode, firstName, lastName, branch_id, branchName, branch, department FROM employees LIMIT 10').catch(e => [[]]);
      console.log(`Employees sample (total found ${emps.length}):`, emps);

      const [deptSample] = await tenantDb.query('SELECT id, department_name, branch_id FROM departments LIMIT 10').catch(e => [[]]);
      console.log(`Departments sample:`, deptSample);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
})();
