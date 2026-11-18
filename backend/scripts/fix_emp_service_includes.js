const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'services', 'core', 'employee.service.js');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

content = content.replace(
  "findById(id, ['companyDetails', 'branchDetails', 'departmentDetails'])",
  "findById(id)"
);

content = content.replace(
  "include: ['departmentDetails', 'companyDetails'],",
  "include: [],"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated employee.service.js includes.');
process.exit(0);
