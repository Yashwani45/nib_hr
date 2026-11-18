const fs = require('fs');
const content = fs.readFileSync('Frontend/src/pages/HrConsolidationHub.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('componentRegistry')) {
    console.log(`${i+1}: ${l}`);
  }
});
