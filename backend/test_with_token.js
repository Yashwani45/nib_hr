const http = require('http');

function postLogin(email, password, companyCode) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ email, password, companyCode });
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Company-Code': companyCode,
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: JSON.parse(body) });
      });
    });
    req.on('error', e => resolve({ error: e.message }));
    req.write(data);
    req.end();
  });
}

function testGet(path, token, companyCode) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Company-Code': companyCode,
        'X-Branch-Id': 'ALL'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch(e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', e => resolve({ error: e.message }));
    req.end();
  });
}

async function run() {
  console.log('=== LOGGING IN AS SUPERADMIN ===');
  const loginRes = await postLogin('superadmin@nib.com', 'securepassword', 'system_master_db');
  console.log('Login status:', loginRes.status);
  const token = loginRes.body?.data?.accessToken;
  console.log('Got token:', !!token);

  if (!token) return;

  const testCompanies = [
    { code: '2731b266-27c4-483d-a699-382b022d6c50', name: 'NIB Insurance' },
    { code: '983b8e34-1df2-4f9b-af07-693be0b23681', name: 'YashTech' },
    { code: 'nib-insurance-alt-001', name: 'NIB Insurance (Alt)' }
  ];

  for (const c of testCompanies) {
    console.log(`\n--- Testing ${c.name} (${c.code}) ---`);
    const br = await testGet('/api/table/branch', token, c.code);
    console.log(`  branch count: ${br.body?.count}, data sample:`, br.body?.data?.slice(0, 2).map(b => b.branchName || b.branch_name));
    const emps = await testGet('/api/table/employees', token, c.code);
    console.log(`  employees count: ${emps.body?.count}`);
    const depts = await testGet('/api/table/departments', token, c.code);
    console.log(`  departments count: ${depts.body?.count}`);
  }
  process.exit(0);
}

run();
