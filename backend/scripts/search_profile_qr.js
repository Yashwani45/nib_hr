const fs = require('fs');

const content = fs.readFileSync('Frontend/src/components/CoreSetup/EmployeeProfile.jsx', 'utf8');
const lines = content.split('\n');
console.log('Lines matching qr or QR in EmployeeProfile:');
lines.forEach((line, i) => {
  if (line.toLowerCase().includes('qr')) {
    console.log(`${i + 1}: ${line}`);
  }
});

console.log('\nSearching for table headers or actions in EmployeeProfile:');
lines.forEach((line, i) => {
  if (line.includes('Actions') || line.includes('Action') || line.includes('<td') || line.includes('openViewModal')) {
    if (i > 1500 && i < 2500) {
      console.log(`${i + 1}: ${line.trim()}`);
    }
  }
});
