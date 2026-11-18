const path = require('path');
const esbuild = require(path.resolve('Frontend/node_modules/esbuild'));
const fs = require('fs');

try {
  const content = fs.readFileSync('Frontend/src/components/CoreSetup/Branch.jsx', 'utf8');
  esbuild.transformSync(content, { loader: 'jsx' });
  console.log('JSX Valid! Branch.jsx compiles with zero syntax errors.');
} catch (e) {
  console.error('JSX Compilation Error:', e.message);
  process.exit(1);
}
