const http = require('http');

async function testFetch(companyCode, tableName) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/table/${tableName}`,
      method: 'GET',
      headers: {
        'X-Company-Code': companyCode,
        'X-Branch-Id': 'ALL'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: JSON.parse(body) });
      });
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.end();
  });
}

async function run() {
  for (const comp of ['nib_insurance', 'yashtech', 'nib-insurance-alt-001', '2731b266-27c4-483d-a699-382b022d6c50', '983b8e34-1df2-4f9b-af07-693be0b23681']) {
    console.log(`\nTesting company: ${comp}`);
    const branchRes = await testFetch(comp, 'branch');
    console.log(`  /api/table/branch status: ${branchRes.status}, count: ${branchRes.body?.count}`);
    const empRes = await testFetch(comp, 'employees');
    console.log(`  /api/table/employees status: ${empRes.status}, count: ${empRes.body?.count}`);
    const deptRes = await testFetch(comp, 'departments');
    console.log(`  /api/table/departments status: ${deptRes.status}, count: ${deptRes.body?.count}`);
  }
  process.exit(0);
}

run();
