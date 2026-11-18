const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'services', 'auth.service.js');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

lines.forEach((line, idx) => {
  if (line.includes('generateTokens(')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
process.exit(0);
