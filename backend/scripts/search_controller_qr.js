const fs = require('fs');

const content = fs.readFileSync('backend/controllers/operations/attendance.controller.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, i) => {
  if (line.includes('employee-qr') || line.includes('scan-punch') || line.includes('scanPunch') || line.includes('identify')) {
    console.log(`${i + 1}: ${line}`);
  }
});
