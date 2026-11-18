const fs = require('fs');
const path = require('path');

function searchContent(dir, text) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat.isDirectory() && !full.includes('node_modules') && !full.includes('.git')) {
        results = results.concat(searchContent(full, text));
      } else if (file.endsWith('.js')) {
        const content = fs.readFileSync(full, 'utf8');
        if (content.includes(text)) {
          results.push(full);
        }
      }
    });
  } catch (e) {}
  return results;
}

const files = searchContent('backend/routes', 'scanEmployeeQrPunch');
console.log('Routes with scanEmployeeQrPunch:', files);
