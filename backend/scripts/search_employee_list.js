const fs = require('fs');
const path = require('path');

function searchContent(dir, text) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat.isDirectory() && !full.includes('node_modules') && !full.includes('.git') && !full.includes('dist')) {
        results = results.concat(searchContent(full, text));
      } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
        const content = fs.readFileSync(full, 'utf8');
        if (content.includes(text)) {
          results.push(full);
        }
      }
    });
  } catch (e) {}
  return results;
}

const files = searchContent('Frontend/src', '/api/employees');
console.log('Files with /api/employees:', files);
const files2 = searchContent('Frontend/src', 'EmployeeProfile');
console.log('Files with EmployeeProfile:', files2);
