const fs = require('fs');
['core.routes.js', 'operations.routes.js', 'finance.routes.js'].forEach(f => {
  const p = 'backend/routes/' + f;
  if (fs.existsSync(p)) {
    const lines = fs.readFileSync(p, 'utf8').split('\n');
    console.log('=== ' + f + ' ===');
    lines.filter(l => l.includes('router.get')).forEach(l => console.log('  ' + l.trim()));
  }
});
