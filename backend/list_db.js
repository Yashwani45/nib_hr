const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({ host: '127.0.0.1', user: 'root', password: '' });
  const [dbs] = await conn.query('SHOW DATABASES');
  console.log('ALL DATABASES:', dbs.map(d => Object.values(d)[0]));
  const [tenants] = await conn.query('SELECT id, company_name, db_name, status FROM system_master_db.tenants');
  console.log('TENANTS IN SYSTEM_MASTER_DB:', tenants);
  await conn.end();
  process.exit(0);
})();
