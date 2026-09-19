const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
  });

  const [tenants] = await conn.query('SELECT id, company_name, db_name, admin_email, status FROM system_master_db.tenants');
  console.log('tenants:', tenants);

  await conn.end();
})();
