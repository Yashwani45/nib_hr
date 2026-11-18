const fs = require('fs');

const content = fs.readFileSync('Frontend/src/components/CoreSetup/EmployeeProfile.jsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, i) => {
  if (line.includes('Add Employee') || line.includes('Export') || line.includes('Total Employees') || line.includes('handleOpenCreateForm')) {
    if (i < 1350) {
      console.log(`${i + 1}: ${line.trim()}`);
    }
  }
});
