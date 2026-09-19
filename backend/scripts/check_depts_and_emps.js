const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
  });
  console.log('=== nib_insurance.departments rows ===');
  const [rows] = await conn.query('SELECT * FROM nib_insurance.departments');
  console.log(rows);
  await conn.end();
})();
