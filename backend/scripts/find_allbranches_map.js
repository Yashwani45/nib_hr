const fs = require('fs');
const content = fs.readFileSync('Frontend/src/components/CoreSetup/Branch.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('allBranches.map') || l.includes('branchHeadcountMap')) {
    console.log(`${i+1}: ${l}`);
  }
});
