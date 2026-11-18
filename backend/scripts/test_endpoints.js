require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  {
    id: 'test-admin',
    email: 'palakmalviya@gmail.com',
    role: 'SuperAdmin',
    companyCode: 'nib_insurance',
    tenantDb: 'nib_insurance'
  },
  process.env.ACCESS_TOKEN_SECRET,
  { expiresIn: '1h' }
);

(async () => {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'X-Company-Code': 'nib_insurance'
  };

  const r1 = await fetch('http://localhost:5000/api/table/employee', { headers });
  console.log('/api/table/employee status:', r1.status, await r1.json());

  const r2 = await fetch('http://localhost:5000/api/table/employees', { headers });
  const d2 = await r2.json();
  console.log('/api/table/employees status:', r2.status, 'success:', d2.success, 'count:', d2.count);
})();
