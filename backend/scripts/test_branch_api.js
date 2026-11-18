require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const jwt = require('jsonwebtoken');

(async () => {
  try {
    const token = jwt.sign(
      {
        id: 'test-admin',
        email: 'palakmalviya@gmail.com',
        role: 'SuperAdmin',
        companyCode: 'nib_insurance',
        companyId: '2731b266-27c4-483d-a699-382b022d6c50',
        tenantDb: 'nib_insurance'
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '1h' }
    );

    console.log('=== TEST 1: ALL BRANCHES VS SPECIFIC BRANCH FILTERING ===');
    const testBranches = [
      { name: 'ALL BRANCHES', id: 'ALL' },
      { name: 'MAIN BRANCH', id: '01f9ade2-2428-481a-a6ef-218c16f8ed8c', name_text: 'Main Branch', code: 'MAIN' },
      { name: 'HEAD OFFICE', id: '2a594afd-44e0-4e67-95ee-ff4bf1c4da76', name_text: 'NIB Insurance - Head Office', code: 'NIB-HQ-001' }
    ];

    for (const b of testBranches) {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'X-Company-Code': 'nib_insurance',
        'X-Branch-Id': b.id
      };
      if (b.name_text) headers['X-Branch-Name'] = b.name_text;
      if (b.code) headers['X-Branch-Code'] = b.code;

      const res = await fetch('http://localhost:5000/api/table/employees', { headers });
      const json = await res.json();
      console.log(`Branch [${b.name}]: returned ${json.data?.length} employees`);
    }

    console.log('\n=== TEST 2: SUPERADMIN CREATE ADMIN (ADMIN_ONLY / EXISTING COMPANY) ===');
    const newAdminEmail = `test_admin_${Date.now()}@testcompany.com`;
    const createRes = await fetch('http://localhost:5000/api/super-admin/tenants', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        setupMode: 'ADMIN_ONLY',
        createNewCompany: false,
        targetCompanyId: '2731b266-27c4-483d-a699-382b022d6c50',
        firstName: 'TestAdmin',
        lastName: 'Enterprise',
        adminEmail: newAdminEmail,
        mobileNumber: '+91 99999 88888',
        adminDesignation: 'Regional HR Director',
        password: 'securepassword123'
      })
    });

    const createJson = await createRes.json();
    console.log('Create Admin status:', createRes.status, createJson.message || createJson);

  } catch (err) {
    console.error('Test error:', err.message);
  } finally {
    process.exit(0);
  }
})();
