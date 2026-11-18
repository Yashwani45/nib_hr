const fs = require('fs');
const path = require('path');

const coreRoutes = fs.readFileSync(path.join(__dirname, '..', 'routes', 'core.routes.js'), 'utf8');
const lines = coreRoutes.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('employees') || l.includes('profile')) {
    console.log(`Line ${idx + 1}: ${l.trim()}`);
  }
});
process.exit(0);
