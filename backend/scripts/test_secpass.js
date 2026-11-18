const bcrypt = require('bcryptjs');

const hash = '$2a$10$nCNSnHUttJVWxsWNJ8tKA.EHadi./IKSqg6IV6Gkd7lZoQjiWfB9q';
async function test() {
  const match = await bcrypt.compare('securepassword', hash);
  console.log('Does securepassword match?', match);
  process.exit(0);
}
test();
