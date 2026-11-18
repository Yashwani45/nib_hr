// backend/scripts/test_jwt_qr_endpoint.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const jwt = require('jsonwebtoken');
const http = require('http');

const token = jwt.sign(
  { id: 'admin-test', email: 'admin@nib.com', role: 'Admin' },
  process.env.ACCESS_TOKEN_SECRET || 'access_secret_123',
  { expiresIn: '1h' }
);

function test(path, companyCode) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Company-Code': companyCode
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        console.log(`[${companyCode}] ${path} -> Status:`, res.statusCode);
        try {
          const j = JSON.parse(body);
          const count = Array.isArray(j.data) ? j.data.length : 'not array';
          console.log(`   Success: ${j.success}, Count: ${count}`);
          if (Array.isArray(j.data) && j.data.length > 0) {
            const sample = j.data[0];
            console.log(`   Sample emp: code=${sample.employeeCode}, name=${sample.fullName || sample.name || sample.firstName}, dept=${sample.department}, hasQrDataUrl=${!!sample.qrDataUrl}`);
          }
        } catch (e) {
          console.log('   Error parsing:', body.slice(0, 100));
        }
        resolve();
      });
    });
    req.on('error', e => {
      console.error(e);
      resolve();
    });
    req.end();
  });
}

async function run() {
  await test('/api/operations/attendance/employee-qr/all', 'NIB01');
  await test('/api/operations/attendance/employee-qr/all', 'yashtech');
  await test('/api/table/employees', 'NIB01');
  process.exit(0);
}

run();
