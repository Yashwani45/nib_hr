const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'services', 'auth.service.js');
let content = fs.readFileSync(filePath, 'utf8');

const oldMethod = `  generateTokens(user) {
    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.ACCESS_TOKEN_SECRET || 'access_secret_123',
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET || 'refresh_secret_123',
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }`;

const newMethod = `  generateTokens(user, extraClaims = {}) {
    const role = user.role_name || user.role || extraClaims.role || 'Employee';
    const roleName = typeof role === 'object' ? (role.name || role.roleName || 'Employee') : String(role);
    const companyCode = user.companyCode || user.company_code || extraClaims.companyCode || '';

    const payload = {
      id: user.id,
      email: user.email,
      role: roleName,
      companyCode: String(companyCode).toUpperCase(),
      ...extraClaims
    };

    const accessToken = jwt.sign(
      payload,
      process.env.ACCESS_TOKEN_SECRET || 'access_secret_123',
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      { id: user.id, companyCode: String(companyCode).toUpperCase() },
      process.env.REFRESH_TOKEN_SECRET || 'refresh_secret_123',
      { expiresIn: '30d' }
    );

    return { accessToken, refreshToken };
  }`;

// Normalize line endings for replacement
const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedOld = oldMethod.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedOld)) {
  const updated = normalizedContent.replace(normalizedOld, newMethod);
  fs.writeFileSync(filePath, updated, 'utf8');
  console.log('Successfully updated generateTokens in auth.service.js');
} else {
  console.error('Could not locate old generateTokens in auth.service.js');
}
process.exit(0);
