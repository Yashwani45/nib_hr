const fs = require('fs');
const content = fs.readFileSync('Frontend/src/routes/AppRoutes.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.toLowerCase().includes('qr') || l.toLowerCase().includes('kiosk') || l.toLowerCase().includes('scanner')) {
    console.log(`${i+1}: ${l}`);
  }
});
