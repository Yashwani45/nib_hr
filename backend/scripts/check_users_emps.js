const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
  });

  const [cols] = await conn.query('DESCRIBE yashtech.employees');
  console.log('yashtech.employees columns:', cols.map(c => c.Field));

  const [emps] = await conn.query('SELECT * FROM yashtech.employees LIMIT 5');
  console.log('sample emps:', emps);

  await conn.end();
})();
