const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    if (f.name === 'node_modules' || f.name === '.git' || f.name === 'dist') continue;
    const full = path.join(dir, f.name);
    if (f.isDirectory()) {
      searchDir(full);
    } else if (f.isFile() && (f.name.endsWith('.js') || f.name.endsWith('.jsx') || f.name.endsWith('.sql') || f.name.endsWith('.json') || f.name.endsWith('.md'))) {
      try {
        const content = fs.readFileSync(full, 'utf8');
        if (content.includes('superadmin@nib.com')) {
          console.log('Found in:', full);
        }
      } catch (e) {}
    }
  }
}

searchDir('.');
process.exit(0);
