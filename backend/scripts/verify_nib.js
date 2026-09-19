const mysql = require('c:/Users/admin/nib_hr/backend/node_modules/mysql2/promise');
(async () => {
  try {
    const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '' });
    const [dbs] = await conn.query('SHOW DATABASES');
    console.log('DATABASES NOW IN MYSQL:');
    console.log(dbs.map(d => d.Database));

    const nibConn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'nib_insurance' });
    const [docs] = await nibConn.query('SELECT employee_id, employee_name, title, file_url FROM documents');
    console.log('\nDOCUMENTS IN `nib_insurance`:');
    console.log(docs);
    await conn.end();
    await nibConn.end();
  } catch(e) {
    console.error(e);
  }
})();
