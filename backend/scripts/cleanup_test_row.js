const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { masterSequelize } = require('../config/database');
masterSequelize.query("DELETE FROM `nib_insurance`.daily_attendance WHERE employeeId = '1eb79ac4-a6e6-4f85-a9d9-6973681058d7'").then(() => {
  console.log('Cleaned up test rows.');
  process.exit(0);
});
