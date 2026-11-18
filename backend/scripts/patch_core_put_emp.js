const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'routes', 'core.routes.js');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

content = content.replace(
  "router.put('/employees/:id', auditLogger('Core'), authorizeRole(['Admin', 'Manager']), employeeValidator, updateEmployee);",
  "router.put('/employees/:id', auditLogger('Core'), authorizeRole(['Admin', 'Manager', 'Employee']), employeeValidator, updateEmployee);"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated core.routes.js PUT /employees/:id authorization');
process.exit(0);
