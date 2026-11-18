const fs = require('fs');
const content = fs.readFileSync('./Frontend/src/pages/HrConsolidationHub.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('Company') || l.includes('company')) {
    console.log(`Line ${i + 1}: ${l.trim()}`);
  }
});
process.exit(0);
