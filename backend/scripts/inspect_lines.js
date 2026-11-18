const fs = require('fs');
const content = fs.readFileSync('Frontend/src/components/CoreSetup/Branch.jsx', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(538, 590).map((l, i) => `${i + 539}: ${l}`).join('\n'));
