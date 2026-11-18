const fs = require('fs');

const content = fs.readFileSync('backend/services/operations/employeeQr.service.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, i) => {
  if (line.includes('scanEmployeeQrPunch')) {
    console.log(`${i + 1}: ${line}`);
  }
});
