const fs = require('fs');
const path = require('path');

function search(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    if (f.name === 'node_modules' || f.name === '.git' || f.name === 'dist') continue;
    const full = path.join(dir, f.name);
    if (f.isDirectory()) {
      search(full);
    } else if (f.isFile() && (f.name.endsWith('.js') || f.name.endsWith('.jsx'))) {
      try {
        const text = fs.readFileSync(full, 'utf8');
        if (text.includes('Company Profile') || text.includes('company_profile') || text.includes('CompanyProfile') || text.includes('Organization Profile')) {
          console.log('Found in:', full);
        }
      } catch (e) {}
    }
  }
}

search('./Frontend/src');
process.exit(0);
