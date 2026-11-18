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
      res.on('end', () => resolve(JSON.parse(body)));
    });
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
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
    });
    req.end();
  });
}

async function run() {
  const loginRes = await postLogin('superadmin@nib.com', 'securepassword', 'system_master_db');
  const token = loginRes.data?.accessToken;

  const res1 = await testGet('/api/table/branch', token, '2731b266-27c4-483d-a699-382b022d6c50');
  console.log('NIB Branch response:', res1);

  const res2 = await testGet('/api/table/employees', token, '2731b266-27c4-483d-a699-382b022d6c50');
  console.log('NIB Employees response:', res2);

  const res3 = await testGet('/api/table/branch', token, '983b8e34-1df2-4f9b-af07-693be0b23681');
  console.log('YashTech Branch response:', res3);

  const res4 = await testGet('/api/table/employees', token, '983b8e34-1df2-4f9b-af07-693be0b23681');
  console.log('YashTech Employees response:', res4);

  process.exit(0);
}
run();
