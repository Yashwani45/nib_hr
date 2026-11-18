const { Sequelize } = require('sequelize');
const seq = new Sequelize('nib_insurance', 'root', '', { host: 'localhost', dialect: 'mysql', logging: false });

async function run() {
  const [rows] = await seq.query('SELECT id, email FROM users LIMIT 5');
  console.log('Users:', rows);
  const [tenants] = await seq.query('SELECT id, name, company_code, db_name FROM system_master_db.tenants');
  console.log('Tenants:', tenants);
  const [branches] = await seq.query('SELECT id, branch_name, branch_code FROM branches LIMIT 5');
  console.log('Branches:', branches);
}

run().catch(console.error).finally(() => seq.close());
