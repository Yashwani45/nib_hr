const fs = require('fs');

const content = fs.readFileSync('Frontend/src/components/CoreSetup/EmployeeProfile.jsx', 'utf8');
const lines = content.split('\n');

console.log('Last 200 lines of EmployeeProfile:');
lines.slice(lines.length - 200).forEach((line, i) => {
  if (line.includes('return') || line.includes('Modal') || line.includes('export') || line.includes('setShow')) {
    console.log(`${lines.length - 200 + i + 1}: ${line}`);
  }
});
