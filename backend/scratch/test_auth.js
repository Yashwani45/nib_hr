const jwt = require('../node_modules/jsonwebtoken');
const { getTenantConnection } = require('../config/connectionManager');
const { masterSequelize } = require('../config/database');

async function run() {
  try {
    const email = 'technovani@gmail.com';
    console.log('1. Fetching tenant admin metadata...');
    const [tenantRows] = await masterSequelize.query(
      `SELECT * FROM tenants WHERE LOWER(admin_email) = ? LIMIT 1`,
      { replacements: [email.toLowerCase()], type: masterSequelize.QueryTypes.SELECT }
    );

    if (!tenantRows) {
      console.error('Tenant admin not found in master database.');
      return;
    }
    const tenant = tenantRows;
    console.log('Tenant Admin found:', { id: tenant.id, db_name: tenant.db_name, company_name: tenant.company_name });

    // Generate token payload just like auth.service.js does:
    const tokenPayload = { id: tenant.id, email: tenant.admin_email };
    const token = jwt.sign(tokenPayload, 'access_secret_123');
    console.log('Generated mock JWT token payload:', tokenPayload);

    // Verify JWT step:
    const decoded = jwt.verify(token, 'access_secret_123');
    console.log('Decoded token:', decoded);

    // Resolve tenant connection:
    const activeDb = await getTenantConnection(tenant.id);

    console.log('2. Querying user inside tenant database...');
    const [users] = await activeDb.query(
      `SELECT u.*, r.name as role_name, r.id as role_id 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ? OR u.email = ? LIMIT 1`,
      { replacements: [decoded.id || '', decoded.email || ''], type: activeDb.QueryTypes.SELECT }
    );

    if (users) {
      console.log('User found in tenant DB:', {
        id: users.id,
        email: users.email,
        role_id: users.role_id,
        role_name: users.role_name
      });
      const reqUser = {
        id: users.id,
        email: users.email,
        role: {
          id: users.role_id,
          name: users.role_name || 'Admin',
          roleName: users.role_name || 'Admin'
        }
      };
      console.log('Resolved req.user role check:', reqUser.role.name);
      console.log('Is Admin/SuperAdmin Allowed:', ['Admin', 'SuperAdmin'].includes(reqUser.role.name));
    } else {
      console.log('User NOT found in tenant DB.');
    }
  } catch (err) {
    console.error('Test failed with error:', err);
  } finally {
    process.exit(0);
  }
}

run();
