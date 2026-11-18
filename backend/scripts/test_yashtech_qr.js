const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const employeeQrService = require('../services/operations/employeeQr.service');
const { masterSequelize } = require('../config/database');

async function test() {
  try {
    const [qrs] = await masterSequelize.query('SELECT * FROM yashtech.employee_qr_codes WHERE employee_code = "TVN2004" LIMIT 1');
    if (qrs.length === 0) {
      console.log('No QR found for TVN2004 in yashtech');
      process.exit(1);
    }
    const qrToken = qrs[0].qr_token;
    console.log('Testing verifyAndIdentify with yashtech token...');
    const result = await employeeQrService.verifyAndIdentify(qrToken, 'yashtech');
    console.log('Employee Name:', result.employee.name, 'Next action:', result.nextAction);

    console.log('\nTesting scan punch check-in...');
    const punchIn = await employeeQrService.scanEmployeeQrPunch(
      { id: 'admin-1', email: 'admin@yashtech.com', role: 'SuperAdmin' },
      qrToken,
      { companyCode: 'yashtech', confirmedAction: 'clock-in' }
    );
    console.log('Punch In result message:', punchIn.message);
    console.log('Punch In Action:', punchIn.action);

    console.log('\nTesting verifyAndIdentify AFTER check-in...');
    const resultAfterCheckIn = await employeeQrService.verifyAndIdentify(qrToken, 'yashtech');
    console.log('Next action after checkin:', resultAfterCheckIn.nextAction);

    // Clean up test attendance
    await masterSequelize.query('DELETE FROM yashtech.daily_attendance WHERE employeeId = "1eb79ac4-a6e6-4f85-a9d9-6973681058d7"');
    console.log('Cleaned up test record.');
  } catch (e) {
    console.error('Error during test:', e);
  }
  process.exit(0);
}
test();
