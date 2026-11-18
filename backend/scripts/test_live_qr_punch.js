// backend/scripts/test_live_qr_punch.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const employeeQrService = require('../services/operations/employeeQr.service');
const { masterSequelize } = require('../config/database');

async function testLiveFlow() {
  console.log('=== STARTING LIVE END-TO-END QR ATTENDANCE TEST ===\n');

  // 1. Fetch an existing active employee QR from nib_insurance
  const [qrs] = await masterSequelize.query(
    "SELECT * FROM `nib_insurance`.employee_qr_codes WHERE status = 'ACTIVE' LIMIT 1"
  );
  if (!qrs || qrs.length === 0) {
    throw new Error('No active employee QR code found in nib_insurance');
  }

  const existingQr = qrs[0];
  console.log('1. Found existing employee QR badge:');
  console.log(`   Employee ID: ${existingQr.employee_id}`);
  console.log(`   Employee Code: ${existingQr.employee_code}`);
  console.log(`   Company: ${existingQr.company_code}`);
  console.log(`   QR Token: ${existingQr.qr_token.slice(0, 50)}...\n`);

  const qrToken = existingQr.qr_token;
  const adminUser = {
    id: 'admin-tester-01',
    email: 'admin@nib.com',
    role: { name: 'Admin', roleName: 'Admin' },
    companyCode: 'nib_insurance',
  };

  // Clean up any test attendance for today for this employee first to test fresh check-in
  const todayStr = new Date().toISOString().split('T')[0];
  await masterSequelize.query(
    "DELETE FROM `nib_insurance`.daily_attendance WHERE (empId = ? OR emp_id = ? OR employeeId = ?) AND date = ?",
    { replacements: [String(existingQr.employee_code), String(existingQr.employee_code), String(existingQr.employee_id), todayStr] }
  );
  console.log(`Cleaned up today (${todayStr}) daily_attendance for test employee.\n`);

  // STEP 1: Verify & Identify employee from scanned QR code
  console.log('STEP 1: Testing verifyAndIdentify()...');
  const idResult = await employeeQrService.verifyAndIdentify(qrToken, 'nib_insurance');
  console.log('✓ verifyAndIdentify SUCCESS:');
  console.log(`   Identified: ${idResult.identified}`);
  console.log(`   Employee Name: ${idResult.employee.name}`);
  console.log(`   Employee Code: ${idResult.employee.employeeCode}`);
  console.log(`   Department: ${idResult.employee.department}`);
  console.log(`   Company: ${idResult.employee.company}`);
  console.log(`   Next Action: ${idResult.nextAction}`);
  console.log(`   Status Text: ${idResult.statusText}\n`);

  if (idResult.nextAction !== 'clock-in') {
    throw new Error(`Expected nextAction to be 'clock-in', got: ${idResult.nextAction}`);
  }

  // STEP 2: Confirm Check-In
  console.log('STEP 2: Testing Admin Confirm Check-In...');
  const inResult = await employeeQrService.scanEmployeeQrPunch(adminUser, qrToken, {
    action: 'clock-in',
    companyCode: 'nib_insurance',
  });
  console.log('✓ Check-In Recorded:');
  console.log(`   Action: ${inResult.action}`);
  console.log(`   Attendance ID: ${inResult.attendanceId}`);
  console.log(`   Time: ${inResult.time}`);
  console.log(`   Message: ${inResult.message}\n`);

  // STEP 3: Test Duplicate Check-In Rejection
  console.log('STEP 3: Testing Duplicate Check-In Prevention...');
  try {
    await employeeQrService.scanEmployeeQrPunch(adminUser, qrToken, {
      action: 'clock-in',
      companyCode: 'nib_insurance',
    });
    console.error('✗ FAILED: Duplicate check-in was not rejected!');
  } catch (err) {
    console.log(`✓ Duplicate check-in successfully rejected: "${err.message}"\n`);
  }

  // STEP 4: Verify status after Check-In (Next action should be clock-out)
  console.log('STEP 4: Testing verifyAndIdentify() after check-in...');
  const afterInResult = await employeeQrService.verifyAndIdentify(qrToken, 'nib_insurance');
  console.log('✓ verifyAndIdentify SUCCESS:');
  console.log(`   Next Action: ${afterInResult.nextAction}`);
  console.log(`   Check-in Time: ${afterInResult.checkInTime}`);
  console.log(`   Status Text: ${afterInResult.statusText}\n`);

  if (afterInResult.nextAction !== 'clock-out') {
    throw new Error(`Expected nextAction to be 'clock-out', got: ${afterInResult.nextAction}`);
  }

  // Wait for 3.2s debounce cooldown to pass
  console.log('Waiting 3.2s for camera bounce cooldown to expire before check-out test...');
  await new Promise(r => setTimeout(r, 3200));

  // STEP 5: Confirm Check-Out
  console.log('STEP 5: Testing Admin Confirm Check-Out...');
  const outResult = await employeeQrService.scanEmployeeQrPunch(adminUser, qrToken, {
    action: 'clock-out',
    companyCode: 'nib_insurance',
  });
  console.log('✓ Check-Out Recorded:');
  console.log(`   Action: ${outResult.action}`);
  console.log(`   Attendance ID: ${outResult.attendanceId}`);
  console.log(`   Check-Out Time: ${outResult.time}`);
  console.log(`   Working Hours: ${outResult.workingHours} hrs`);
  console.log(`   Message: ${outResult.message}\n`);

  // STEP 6: Test Duplicate Check-Out / Completed Rejection
  console.log('STEP 6: Testing Duplicate Check-Out / Completed Rejection...');
  try {
    await employeeQrService.scanEmployeeQrPunch(adminUser, qrToken, {
      action: 'clock-out',
      companyCode: 'nib_insurance',
    });
    console.error('✗ FAILED: Duplicate check-out was not rejected!');
  } catch (err) {
    console.log(`✓ Duplicate check-out successfully rejected: "${err.message}"\n`);
  }

  // STEP 7: Verify attendance record in MySQL table
  console.log('STEP 7: Verifying final daily_attendance row in MySQL...');
  const [rows] = await masterSequelize.query(
    "SELECT * FROM `nib_insurance`.daily_attendance WHERE (empId = ? OR emp_id = ? OR employeeId = ?) AND date = ?",
    { replacements: [String(existingQr.employee_code), String(existingQr.employee_code), String(existingQr.employee_id), todayStr] }
  );
  console.log(`Total rows in daily_attendance: ${rows.length}`);
  if (rows.length !== 1) {
    throw new Error(`Expected exactly 1 attendance row for today, but found ${rows.length}`);
  }
  const attRow = rows[0];
  console.log(`   Row ID: ${attRow.id}`);
  console.log(`   Date: ${attRow.date} (${attRow.day})`);
  console.log(`   CheckIn: ${attRow.checkIn}`);
  console.log(`   CheckOut: ${attRow.checkOut}`);
  console.log(`   Working Hours: ${attRow.workingHours}`);
  console.log(`   Status: ${attRow.status}`);
  console.log(`   Verification Method: ${attRow.verification_method}`);
  console.log(`   Remarks: ${attRow.remarks}\n`);

  // STEP 8: Test Tampered / Invalid QR token
  console.log('STEP 8: Testing Tampered / Invalid QR token rejection...');
  try {
    const tampered = qrToken.slice(0, -6) + 'abc123';
    await employeeQrService.verifyAndIdentify(tampered, 'nib_insurance');
    console.error('✗ FAILED: Tampered QR was not rejected!');
  } catch (err) {
    console.log(`✓ Tampered QR successfully rejected: "${err.message}"\n`);
  }

  console.log('===================================================');
  console.log('   ALL 8 END-TO-END ATTENDANCE TESTS PASSED!       ');
  console.log('===================================================');
  process.exit(0);
}

testLiveFlow().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
