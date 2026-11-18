const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const employeeQrService = require('../services/operations/employeeQr.service');

async function run() {
  const ids = [
    '2731b266-27c4-483d-a699-382b022d6c50',
    '983b8e34-1df2-4f9b-af07-693be0b23681',
    'f89f01d7-b684-4b1f-bfac-319253da7bf3'
  ];
  for (const id of ids) {
    try {
      const res = await employeeQrService.getAllEmployeeQrs(id);
      console.log(id, '->', res.length);
    } catch (e) {
      console.log(id, '-> Error:', e.message);
    }
  }
  process.exit(0);
}

run();