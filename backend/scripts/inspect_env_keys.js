const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');
  const keys = lines
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => l.split('=')[0].trim());
  console.log('Environment variable keys present:', keys);
} else {
  console.log('.env does not exist');
}
process.exit(0);
