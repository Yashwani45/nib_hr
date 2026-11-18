const fs = require('fs');
const path = require('path');

function searchDir(dir, filter) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat.isDirectory() && !full.includes('node_modules') && !full.includes('.git') && !full.includes('dist') && !full.includes('build')) {
        results = results.concat(searchDir(full, filter));
      } else if (filter(file, full)) {
        results.push(full);
      }
    });
  } catch (e) {}
  return results;
}

const empFiles = searchDir('Frontend/src', (f) => f.toLowerCase().includes('employee'));
console.log('Frontend Employee files:', empFiles);
