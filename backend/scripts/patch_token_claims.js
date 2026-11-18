const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'services', 'auth.service.js');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. masterUser
content = content.replace(
  'const { accessToken, refreshToken } = this.generateTokens(masterUser);',
  `const { accessToken, refreshToken } = this.generateTokens(masterUser, { role: masterUser.role_name || 'SuperAdmin', companyCode: 'NIB' });`
);

// 2. tenantAdmin
content = content.replace(
  'const { accessToken, refreshToken } = this.generateTokens({ id: tenantAdmin.id, email: tenantAdmin.admin_email });',
  `const { accessToken, refreshToken } = this.generateTokens({ id: tenantAdmin.id, email: tenantAdmin.admin_email }, { role: 'Admin', companyCode: tenantAdmin.id });`
);

// 3. tenantUser
content = content.replace(
  'const { accessToken, refreshToken } = this.generateTokens(tenantUser);',
  `const { accessToken, refreshToken } = this.generateTokens(tenantUser, { role: tenantUser.role_name, companyCode: tenant.id });`
);

// 4. empRecord
content = content.replace(
  'const { accessToken, refreshToken } = this.generateTokens({ id: empRecord.id, email: empEmail });',
  `const { accessToken, refreshToken } = this.generateTokens({ id: empRecord.id, email: empEmail }, { role: 'Employee', companyCode: tenant.id });`
);

// 5. deptHr
content = content.replace(
  'const { accessToken, refreshToken } = this.generateTokens({ id: deptHr.id, email: deptHr.hr_email });',
  `const { accessToken, refreshToken } = this.generateTokens({ id: deptHr.id, email: deptHr.hr_email }, { role: 'DepartmentHR', companyCode: tenant.id });`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated all token generation calls with role and companyCode.');
process.exit(0);
