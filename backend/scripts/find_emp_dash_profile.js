const fs = require('fs');
const content = fs.readFileSync('./Frontend/src/pages/EmployeeDashboard.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('Basic Information')) {
    console.log(`Line ${i + 1}: ${l.trim()}`);
  }
});
process.exit(0);
