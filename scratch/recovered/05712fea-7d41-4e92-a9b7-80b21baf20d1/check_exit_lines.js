const fs = require('fs');
const content = fs.readFileSync('Frontend/src/components/SupportEngagement/ExitWorkspace.jsx', 'utf8');
const lines = content.split('\n');
for (let i = 160; i <= 180; i++) {
  console.log(`${i+1}: [${lines[i]}]`);
}
