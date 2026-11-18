// backend/scripts/inspect_sample.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const employeeQrService = require('../services/operations/employeeQr.service');

async function run() {
  const qrs = await employeeQrService.getAllEmployeeQrs('nib_insurance');
  console.log('Total:', qrs.length);
  if (qrs.length > 0) {
    const s = { ...qrs[0] };
    s.qrToken = s.qrToken?.slice(0, 20) + '...';
    s.qrDataUrl = s.qrDataUrl?.slice(0, 30) + '...';
    console.log('Sample:', s);
  }
  process.exit(0);
}
run();
