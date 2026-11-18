const fs = require('fs');
const content = fs.readFileSync('backend/routes/operations.routes.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('employee-qr') || l.includes('employeeQr')) {
    console.log(`${i + 1}: ${l}`);
  }
});
