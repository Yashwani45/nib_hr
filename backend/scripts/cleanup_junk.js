const fs = require('fs');

const files = ['[[e.message]])', 'k.includes(\'Payroll\')', 'r.Field))', '{', '{}'];
files.forEach(f => {
  if (fs.existsSync(f)) {
    try {
      fs.unlinkSync(f);
      console.log('Removed junk file:', f);
    } catch (e) {
      console.warn('Could not remove:', f, e.message);
    }
  }
});
console.log('Cleanup finished.');
