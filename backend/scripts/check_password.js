const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
  });

  const [users] = await conn.query("SELECT email, password FROM yashtech.users WHERE email = 'yashwani@gmail.com'");
  if (users.length > 0) {
    const hash = users[0].password;
    console.log('Stored hash:', hash);
    const commonPasswords = ['password', 'password123', 'admin', 'admin123', 'yashwani', 'yashwani@123', 'yashtech@123', '123456', '12345678', 'securepassword'];
    for (const p of commonPasswords) {
      const match = await bcrypt.compare(p, hash);
      if (match) {
        console.log(`MATCH FOUND! Password is: "${p}"`);
        break;
      }
    }
  }

  await conn.end();
})();
