const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
  });

  console.log('=== YashTech Departments ===');
  const [depts] = await conn.query(`
    SELECT 
      d.id,
      d.dept_code,
      d.dept_name,
      d.head_employee_id,
      e.employee_name as head_name,
      e.email as head_email,
      e.employeeCode as head_code,
      e.designation as head_designation,
      d.hr_email,
      d.status
    FROM yashtech.departments d
    LEFT JOIN yashtech.employees e ON d.head_employee_id = e.id
  `);
  console.log(JSON.stringify(depts, null, 2));

  console.log('\n=== Reporting Managers named in employees table ===');
  const [managers] = await conn.query(`
    SELECT DISTINCT reportingManager, department FROM yashtech.employees WHERE reportingManager IS NOT NULL AND reportingManager != ''
  `);
  console.log(JSON.stringify(managers, null, 2));

  console.log('\n=== YashTech Users Table ===');
  const [users] = await conn.query(`
    SELECT id, email, role FROM yashtech.users
  `);
  console.log(JSON.stringify(users, null, 2));

  console.log('\n=== Tenant Details from system_master_db ===');
  const [tenants] = await conn.query(`
    SELECT * FROM system_master_db.tenants WHERE company_name LIKE '%Yash%' OR db_name = 'yashtech'
  `);
  console.log(JSON.stringify(tenants, null, 2));

  await conn.end();
})();
