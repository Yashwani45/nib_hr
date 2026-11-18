const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.join(__dirname, '..', '.env');
let content = fs.readFileSync(envPath, 'utf8');

let modified = false;
if (!content.includes('ACCESS_TOKEN_SECRET=')) {
  const secret = crypto.randomBytes(32).toString('hex');
  content += `\nACCESS_TOKEN_SECRET=${secret}`;
  modified = true;
}

if (!content.includes('REFRESH_TOKEN_SECRET=')) {
  const secret = crypto.randomBytes(32).toString('hex');
  content += `\nREFRESH_TOKEN_SECRET=${secret}`;
  modified = true;
}

if (!content.includes('NODE_ENV=')) {
  content += `\nNODE_ENV=development`;
  modified = true;
}

if (modified) {
  fs.writeFileSync(envPath, content, 'utf8');
  console.log('Successfully added ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, and NODE_ENV to .env');
} else {
  console.log('Secrets already present.');
}
process.exit(0);
