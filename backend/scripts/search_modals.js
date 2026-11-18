const fs = require('fs');

const content = fs.readFileSync('Frontend/src/components/CoreSetup/EmployeeProfile.jsx', 'utf8');
const lines = content.split('\n');

console.log('Searching for modal states in EmployeeProfile:');
lines.forEach((line, i) => {
  if (line.includes('useState') && (line.includes('Modal') || line.includes('modal') || line.includes('viewDetails'))) {
    console.log(`${i + 1}: ${line}`);
  }
});
