const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const employeeQrService = require('../services/operations/employeeQr.service');

async function test() {
  for (const company of ['yashtech', 'YASHTECH', 'nib_insurance', 'NIB01']) {
    try {
      console.log(`\nTesting getAllEmployeeQrs('${company}')...`);
      const res = await employeeQrService.getAllEmployeeQrs(company);
      console.log(`Result length for '${company}':`, res.length);
      if (res.length > 0) {
        console.log('First 2 employees:', res.slice(0, 2).map(e => ({ name: e.fullName, code: e.employeeCode, company: e.companyCode })));
      }
    } catch (e) {
      console.error(`Error for '${company}':`, e.message);
    }
  }
  process.exit(0);
}
test();
