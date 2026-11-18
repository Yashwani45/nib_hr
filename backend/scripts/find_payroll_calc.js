const fs = require('fs');
const code = fs.readFileSync('backend/services/finance/payroll.service.js', 'utf8');
const lines = code.split('\n');
lines.forEach((l, i) => {
  if (l.includes('netSalary') || l.includes('payableDays') || l.includes('netPay')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
