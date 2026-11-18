// backend/scripts/test_multi_employee_attendance.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { getTenantConnection } = require('../config/connectionManager');
const { tenantStorage } = require('../config/database');
const attendanceService = require('../services/operations/attendance.service');

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✅ [PASS] ${message}`);
}

async function runMultiEmployeeAttendanceSuite() {
  console.log('================================================================');
  console.log('👥 RUNNING MULTI-EMPLOYEE ATTENDANCE ISOLATION & LIFECYCLE SUITE');
  console.log('================================================================\n');

  const tenantCode = 'nib_insurance';
  const tenantDb = await getTenantConnection(tenantCode);

  await tenantStorage.run(tenantDb, async () => {
    try {
      // 1. Fetch 3 distinct active employees
      const emps = await tenantDb.query(
        "SELECT id, employeeCode, emp_code, employeeId, employee_name, firstName, lastName FROM employees WHERE employeeStatus = 'Active' LIMIT 3",
        { type: tenantDb.QueryTypes.SELECT }
      );
      assert(emps.length >= 3, `Found ${emps.length} active employees for multi-employee test`);

      const empA = emps[0];
      const empB = emps[1];
      const empC = emps[2];
      const codeA = empA.employeeCode || empA.emp_code || empA.id;
      const codeB = empB.employeeCode || empB.emp_code || empB.id;
      const codeC = empC.employeeCode || empC.emp_code || empC.id;
      const nameA = empA.employee_name || empA.firstName;
      const nameB = empB.employee_name || empB.firstName;
      const nameC = empC.employee_name || empC.firstName;

      console.log(`Employee A: ${nameA} (${codeA})`);
      console.log(`Employee B: ${nameB} (${codeB})`);
      console.log(`Employee C: ${nameC} (${codeC})`);

      const testDate = '2026-10-26'; // Distinct test workday

      // Clean up any existing attendance for this test date
      await tenantDb.query("DELETE FROM daily_attendance WHERE date = ? OR attendance_date = ?", {
        replacements: [testDate, testDate]
      });

      console.log('\n--- STEP 1: Multi-Employee Independent Check-Ins ---');
      // Employee A checks in at 09:00:00
      const punchInA = await attendanceService.clockIn(empA.id, {
        method: 'WEB',
        date: testDate,
        checkIn: '09:00:00',
        shiftStart: '09:00:00'
      }, { companyCode: tenantCode });
      assert(punchInA && punchInA.checkIn === '09:00:00', `Employee A (${nameA}) checked in at 09:00:00`);

      // Employee B checks in at 09:15:00
      const punchInB = await attendanceService.clockIn(empB.id, {
        method: 'WEB',
        date: testDate,
        checkIn: '09:15:00',
        shiftStart: '09:00:00'
      }, { companyCode: tenantCode });
      assert(punchInB && punchInB.checkIn === '09:15:00', `Employee B (${nameB}) checked in at 09:15:00`);

      // Employee C checks in at 09:30:00
      const punchInC = await attendanceService.clockIn(empC.id, {
        method: 'WEB',
        date: testDate,
        checkIn: '09:30:00',
        shiftStart: '09:00:00'
      }, { companyCode: tenantCode });
      assert(punchInC && punchInC.checkIn === '09:30:00', `Employee C (${nameC}) checked in at 09:30:00`);

      // Verify all 3 records exist independently in the database
      const [recordsAfterIn] = await tenantDb.query(
        "SELECT id, empId, name, checkIn, checkOut, workingHours FROM daily_attendance WHERE date = ? ORDER BY id ASC",
        { replacements: [testDate] }
      );
      assert(recordsAfterIn.length === 3, 'Exactly 3 distinct database records created for the 3 employees');
      assert(recordsAfterIn[0].checkOut === '--' && recordsAfterIn[1].checkOut === '--' && recordsAfterIn[2].checkOut === '--', 'All 3 employees are currently checked in (checkOut = --)');

      console.log('\n--- STEP 2: Duplicate Check-In Prevention ---');
      let dupInErr = null;
      try {
        await attendanceService.clockIn(empA.id, {
          method: 'WEB',
          date: testDate,
          checkIn: '09:45:00'
        }, { companyCode: tenantCode });
      } catch (e) {
        dupInErr = e;
      }
      assert(dupInErr && dupInErr.statusCode === 400, `Duplicate check-in for Employee A rejected (${dupInErr?.message})`);

      console.log('\n--- STEP 3: Employee A Checks Out Independently ---');
      // Employee A checks out at 18:00:00
      const punchOutA = await attendanceService.clockOut(empA.id, {
        method: 'WEB',
        date: testDate,
        checkOut: '18:00:00'
      }, { companyCode: tenantCode });
      assert(punchOutA && punchOutA.checkOut === '18:00:00', `Employee A checked out at 18:00:00. Working hours: ${punchOutA.workingHours} hrs`);
      assert(punchOutA.workingHours === 9.00, 'Employee A working hours calculated correctly: 9.00 hrs (09:00 to 18:00)');

      // Critical Isolation Assertion: Verify Employee B and C are STILL checked in and untouched!
      const [empBRecord] = await tenantDb.query(
        "SELECT checkIn, checkOut, workingHours FROM daily_attendance WHERE (empId = ? OR employeeId = ?) AND date = ?",
        { replacements: [codeB, empB.id, testDate], type: tenantDb.QueryTypes.SELECT }
      );
      assert(empBRecord && (empBRecord.checkOut === '--' || !empBRecord.checkOut), 'ISOLATION VERIFIED: Checking out Employee A did NOT check out Employee B (Employee B checkOut is still --)');

      const [empCRecord] = await tenantDb.query(
        "SELECT checkIn, checkOut, workingHours FROM daily_attendance WHERE (empId = ? OR employeeId = ?) AND date = ?",
        { replacements: [codeC, empC.id, testDate], type: tenantDb.QueryTypes.SELECT }
      );
      assert(empCRecord && (empCRecord.checkOut === '--' || !empCRecord.checkOut), 'ISOLATION VERIFIED: Checking out Employee A did NOT check out Employee C (Employee C checkOut is still --)');

      console.log('\n--- STEP 4: Employee B Checks Out Independently ---');
      // Employee B checks out at 18:15:00
      const punchOutB = await attendanceService.clockOut(empB.id, {
        method: 'WEB',
        date: testDate,
        checkOut: '18:15:00'
      }, { companyCode: tenantCode });
      assert(punchOutB && punchOutB.checkOut === '18:15:00', `Employee B checked out at 18:15:00. Working hours: ${punchOutB.workingHours} hrs`);
      assert(punchOutB.workingHours === 9.00, 'Employee B working hours calculated correctly: 9.00 hrs (09:15 to 18:15)');

      // Verify Employee C is still untouched
      const [empCRecordStillIn] = await tenantDb.query(
        "SELECT checkIn, checkOut FROM daily_attendance WHERE (empId = ? OR employeeId = ?) AND date = ?",
        { replacements: [codeC, empC.id, testDate], type: tenantDb.QueryTypes.SELECT }
      );
      assert(empCRecordStillIn && (empCRecordStillIn.checkOut === '--' || !empCRecordStillIn.checkOut), 'ISOLATION VERIFIED: Employee C still remains checked in after Employee B check out');

      console.log('\n--- STEP 5: Employee C Checks Out Independently ---');
      // Employee C checks out at 18:30:00
      const punchOutC = await attendanceService.clockOut(empC.id, {
        method: 'WEB',
        date: testDate,
        checkOut: '18:30:00'
      }, { companyCode: tenantCode });
      assert(punchOutC && punchOutC.checkOut === '18:30:00', `Employee C checked out at 18:30:00. Working hours: ${punchOutC.workingHours} hrs`);
      assert(punchOutC.workingHours === 9.00, 'Employee C working hours calculated correctly: 9.00 hrs (09:30 to 18:30)');

      console.log('\n--- STEP 6: Anti-Duplicate Check-Out & Post-Departure Protection ---');
      // Employee A tries to check out again
      let dupOutErr = null;
      try {
        await attendanceService.clockOut(empA.id, {
          method: 'WEB',
          date: testDate,
          checkOut: '19:00:00'
        }, { companyCode: tenantCode });
      } catch (e) {
        dupOutErr = e;
      }
      assert(dupOutErr && dupOutErr.statusCode === 400, `Duplicate check-out for Employee A rejected (${dupOutErr?.message})`);

      // Employee A tries to check in again after completed day
      let checkInAfterDoneErr = null;
      try {
        await attendanceService.clockIn(empA.id, {
          method: 'WEB',
          date: testDate,
          checkIn: '19:30:00'
        }, { companyCode: tenantCode });
      } catch (e) {
        checkInAfterDoneErr = e;
      }
      assert(checkInAfterDoneErr && checkInAfterDoneErr.statusCode === 400, `Re-check-in after completed workday rejected (${checkInAfterDoneErr?.message})`);

      console.log('\n================================================================');
      console.log('🎉 ALL MULTI-EMPLOYEE ATTENDANCE ISOLATION TESTS PASSED (100%)!');
      console.log('================================================================');
      process.exit(0);

    } catch (err) {
      console.error('\n❌ Multi-Employee Attendance Test Suite Failed:', err.message);
      process.exit(1);
    }
  });
}

runMultiEmployeeAttendanceSuite();
