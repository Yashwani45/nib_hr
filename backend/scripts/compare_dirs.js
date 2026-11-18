const fs = require('fs');
console.log('C:/Users/admin/nib_hr mtime:', fs.statSync('C:/Users/admin/nib_hr/backend/controllers/core/table.controller.js').mtime);
console.log('C:/Users/admin/Downloads/nib_hr mtime:', fs.statSync('C:/Users/admin/Downloads/nib_hr/backend/controllers/core/table.controller.js').mtime);
