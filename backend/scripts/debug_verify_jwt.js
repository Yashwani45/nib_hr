const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const verifyJWT = require('../middleware/auth.middleware');

async function testNonExistent() {
  const token = jwt.sign(
    { id: 'non-existent-user-uuid-99999', email: 'intruder@attacker.com' },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '1h' }
  );

  const req = { headers: { authorization: `Bearer ${token}` } };
  const err = await new Promise((resolve) => {
    verifyJWT(req, {}, (e) => {
      resolve(e);
    });
  });
  console.log('Resulting error status:', err?.statusCode, err?.message);
  process.exit(0);
}

testNonExistent();
