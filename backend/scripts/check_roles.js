const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
  });

  const [roles] = await conn.query('SELECT * FROM yashtech.roles');
  console.log('roles:', roles);

  await conn.end();
})();
