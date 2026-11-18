const { masterSequelize } = require('./config/database');

async function testGetTenants() {
  const [existingDbRows] = await masterSequelize.query('SHOW DATABASES');
  const existingDbSet = new Set(existingDbRows.map(row => Object.values(row)[0].toLowerCase()));

  const [tenants] = await masterSequelize.query(
    `SELECT id, id AS code, company_name AS name, db_name AS db, admin_email, admin_password, status, created_at, max_companies, max_branches FROM tenants`
  );

  console.log('All tenants in DB:');
  tenants.forEach(t => console.log(`  id: ${t.id}, name: ${t.name}, db: ${t.db}, email: ${t.admin_email}`));

  // Test 1: Called by SuperAdmin (superadmin@nib.com)
  console.log('\nWhen called by superadmin@nib.com:');
  for (const t of tenants) {
    console.log(`  Included: ${t.name} (${t.db})`);
  }

  // Test 2: Called by yashtech@gmail.com (role: Admin, companyCode: 983b8e34-1df2-4f9b-af07-693be0b23681)
  console.log('\nWhen called by yashtech@gmail.com (role: Admin):');
  const userRoleStr = 'admin';
  const isSuperAdmin = userRoleStr === 'superadmin' || 
                       userRoleStr === 'admin' ||
                       'yashtech@gmail.com' === 'superadmin@nib.com' ||
                       'yashtech@gmail.com' === 'admin@nib.com';
  console.log('  isSuperAdmin in backend:', isSuperAdmin);
  
  process.exit(0);
}
testGetTenants();
