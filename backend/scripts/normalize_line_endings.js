const fs = require('fs');
const filePath = 'Frontend/src/components/CoreSetup/Branch.jsx';
let content = fs.readFileSync(filePath, 'utf8');
console.log('CRLF count:', (content.match(/\r\n/g) || []).length);
console.log('LF count:', (content.match(/[^\r]\n/g) || []).length);

// Normalize to LF
content = content.replace(/\r\n/g, '\n');
fs.writeFileSync(filePath, content, 'utf8');
console.log('Normalized to LF!');
