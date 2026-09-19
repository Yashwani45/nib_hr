const mysql = require('c:/Users/admin/nib_hr/backend/node_modules/mysql2/promise');

(async () => {
  try {
    for (const db of ['yashtech', 'nib_insurance', 'aarogya_homeopathy_clinic', 'system_master_db']) {
      const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: db });
      const [depts] = await conn.query('SELECT id, dept_code, dept_name, hr_email FROM departments WHERE dept_name LIKE "%Software%" OR hr_email LIKE "%abhishek%"');
      console.log(`[${db}] matching depts:`, depts);
      const [users] = await conn.query('SELECT id, username, email, role FROM users WHERE email LIKE "%abhishek%" OR email LIKE "%yashwani%"');
      console.log(`[${db}] matching users:`, users);
      await conn.end();
    }
  } catch(e) { console.error(e); }
})();
