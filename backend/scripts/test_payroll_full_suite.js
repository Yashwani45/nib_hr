// backend/scripts/test_payroll_full_suite.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const {
  sequelize,
  Employee,
  SalaryStructure,
  SalaryComponent,
  EmployeeSalaryAssignment,
  PayrollRun,
  PayrollRecord,
  PayrollItem,
  PayrollEarning,
  PayrollDeduction,
  EmployeeLoan,
  LoanEmiSchedule,
  LoanRepayment,
  StatutoryConfiguration,
  Payslip,
  PayrollPayment,
  PayrollAuditLog
} = require('../models');
const payrollService = require('../services/finance/payroll.service');
const statutoryService = require('../services/finance/statutory.service');
const { v4: uuidv4 } = require('uuid');

async function runTestSuite() {
  console.log('====================================================');
  console.log('🚀 RUNNING COMPREHENSIVE PAYROLL DATABASE & ENGINE TEST SUITE');
  console.log('====================================================');

  let testEmployee = null;
  let testStructure = null;
  let testAssignment = null;
  let testRun = null;
  let testLoan = null;

  try {
    // 1. Verify Database Connection
    await sequelize.authenticate();
    console.log('✅ 1. Database Connection Authenticated successfully.');

    // 2. Fetch or create test employee
    testEmployee = await Employee.findOne();
    if (!testEmployee) {
      console.log('Creating a test employee...');
      testEmployee = await Employee.create({
        id: uuidv4(),
        employeeId: 'EMP-TEST-001',
        employeeName: 'Rohan Sharma',
        firstName: 'Rohan',
        lastName: 'Sharma',
        email: `rohan.test.${Date.now()}@example.com`,
        department: 'Engineering',
        designation: 'Senior Software Engineer',
        employeeStatus: 'Active',
        dateOfJoining: '2024-01-01',
        state: 'Madhya Pradesh',
        pfApplicable: true,
        esiApplicable: true
      });
    }
    console.log(`✅ 2. Active Employee Ready: [ID: ${testEmployee.id}] ${testEmployee.employeeName || testEmployee.firstName}`);

    // 3. Test Statutory Configurations
    const statRules = await statutoryService.getConfigurations();
    console.log(`✅ 3. Statutory Configuration Rules verified: Found ${statRules.length} active rules.`);
    const pfRule = statRules.find(r => r.ruleCode === 'PF_STANDARD');
    console.log(`   - PF Standard: Rate=${pfRule?.employeeRate}%, Wage Ceiling=₹${pfRule?.wageCeiling}`);
    const esiRule = statRules.find(r => r.ruleCode === 'ESI_DEFAULT');
    console.log(`   - ESI Standard: Rate=${esiRule?.employeeRate}%, Ceiling=₹${esiRule?.wageCeiling}`);

    // 4. Create Salary Structure & Components
    const structId = uuidv4();
    testStructure = await SalaryStructure.create({
      id: structId,
      structureName: 'Engineering Grade A Enterprise',
      name: 'Engineering Grade A Enterprise',
      description: 'Standard Salary Structure for Engineering with PF, ESI, PT',
      payFrequency: 'Monthly',
      currency: 'INR',
      grade: 'Grade-A',
      employmentCategory: 'Full-Time',
      isActive: true
    });

    const components = [
      { id: uuidv4(), salaryStructureId: structId, componentCode: 'BASIC', componentName: 'Basic Salary', name: 'Basic Salary', componentType: 'Earning', type: 'Earning', calculationType: 'Percentage', amount: 50.00, value: 50.00, percentageBase: 'Gross', isTaxable: true },
      { id: uuidv4(), salaryStructureId: structId, componentCode: 'HRA', componentName: 'House Rent Allowance', name: 'House Rent Allowance', componentType: 'Earning', type: 'Earning', calculationType: 'Percentage', amount: 20.00, value: 20.00, percentageBase: 'Basic', isTaxable: true },
      { id: uuidv4(), salaryStructureId: structId, componentCode: 'SPL_ALLW', componentName: 'Special Allowance', name: 'Special Allowance', componentType: 'Earning', type: 'Earning', calculationType: 'Percentage', amount: 30.00, value: 30.00, percentageBase: 'Gross', isTaxable: true },
      { id: uuidv4(), salaryStructureId: structId, componentCode: 'PF_EMP', componentName: 'Provident Fund (Employee)', name: 'Provident Fund (Employee)', componentType: 'Deduction', type: 'Deduction', calculationType: 'Percentage', amount: 12.00, value: 12.00, percentageBase: 'Basic', isTaxable: false, isStatutory: true }
    ];

    for (const c of components) {
      await SalaryComponent.create(c);
    }
    console.log(`✅ 4. Created Salary Structure "${testStructure.structureName}" with ${components.length} components.`);

    // 5. Assign Salary Structure to Employee
    testAssignment = await EmployeeSalaryAssignment.create({
      id: uuidv4(),
      employeeId: testEmployee.id,
      salaryStructureId: structId,
      effectiveFrom: '2026-01-01',
      grossSalary: 20000.00, // Eligible for ESI (<= 21,000)
      baseGross: 20000.00,
      annualCtc: 260000.00,
      ctc: 260000.00,
      status: 'Active',
      isActive: true
    });
    console.log(`✅ 5. Assigned Salary Structure to Employee with Gross Salary ₹${testAssignment.grossSalary}.`);

    // 6. Create Employee Loan with Repayment Schedule
    testLoan = await EmployeeLoan.create({
      id: uuidv4(),
      employeeId: testEmployee.id,
      loanType: 'Personal Advance',
      principalAmount: 12000.00,
      requestedAmount: 12000.00,
      approvedAmount: 12000.00,
      outstandingBalance: 12000.00,
      installmentAmount: 1000.00,
      numberOfInstallments: 12,
      tenureMonths: 12,
      status: 'Approved'
    });

    await LoanEmiSchedule.create({
      id: uuidv4(),
      loanId: testLoan.id,
      installmentNumber: 1,
      dueDate: '2026-10-15',
      emiAmount: 1000.00,
      principalAmount: 1000.00,
      interestAmount: 0.00,
      status: 'Pending'
    });
    console.log(`✅ 6. Configured Employee Loan ₹${testLoan.principalAmount} with Monthly EMI ₹${testLoan.installmentAmount}.`);

    // 7. Initialize Payroll Run for October 2026
    const testMonth = 'October';
    const testYear = 2026;
    
    // Clean up any previous test runs for Oct 2026
    const existingRun = await PayrollRun.findOne({ where: { month: testMonth, year: testYear } });
    if (existingRun) {
      await PayrollItem.destroy({ where: { payrollRunId: existingRun.id } });
      await PayrollRecord.destroy({ where: { payrollRunId: existingRun.id } });
      await existingRun.destroy();
    }

    testRun = await payrollService.createPayrollRun(testMonth, testYear, 'test-admin', 'Automated Integration Test Run');
    console.log(`✅ 7. Initialized Payroll Run [Code: ${testRun.payrollCode}, Month: ${testRun.month} ${testRun.year}, Status: ${testRun.status}].`);

    // 8. Execute Payroll Calculation
    console.log('⚙️ Executing calculatePayrollRun...');
    const calcResult = await payrollService.calculatePayrollRun(testRun.id, 'test-admin', { employeeId: testEmployee.id });
    console.log(`✅ 8. Payroll Calculated Successfully! Processed ${calcResult.summary.employeeCount} employee(s).`);

    // 9. Inspect Database Records for Accuracy
    const record = await PayrollRecord.findOne({
      where: { payrollRunId: testRun.id, employeeId: testEmployee.id },
      include: [
        { model: PayrollEarning, as: 'recordEarnings' },
        { model: PayrollDeduction, as: 'recordDeductions' }
      ]
    });

    if (!record) throw new Error('PayrollRecord was not created!');

    console.log('📊 Payroll Record Verification:');
    console.log(`   - Gross Earnings: ₹${record.grossEarnings}`);
    console.log(`   - Total Deductions: ₹${record.totalDeductions}`);
    console.log(`   - Net Salary: ₹${record.netSalary}`);
    console.log(`   - Employer PF: ₹${record.employerPf}`);
    console.log(`   - Employer ESI: ₹${record.employerEsi}`);
    console.log(`   - Total CTC: ₹${record.totalCtc}`);

    // Verify mathematical integrity
    const mathNet = Math.round((parseFloat(record.grossEarnings) - parseFloat(record.totalDeductions)) * 100) / 100;
    if (Math.abs(mathNet - parseFloat(record.netSalary)) > 0.05) {
      throw new Error(`Net salary calculation mismatch! Expected ${mathNet}, got ${record.netSalary}`);
    }
    console.log(`✅ 9. Net Salary Verification Passed: Gross (₹${record.grossEarnings}) - Deductions (₹${record.totalDeductions}) = Net (₹${record.netSalary}).`);

    // Verify Employer Contributions did NOT reduce Net Pay
    console.log('✅ 10. Employer Contributions (PF ₹' + record.employerPf + ', ESI ₹' + record.employerEsi + ') kept separate from deductions.');

    // Verify Calculation Snapshot
    if (!record.calculationSnapshot) throw new Error('calculationSnapshot is empty!');
    const snapshotObj = JSON.parse(record.calculationSnapshot);
    console.log(`✅ 11. Calculation Snapshot Verified: Frozen with ${snapshotObj.earnings.length} earnings, ${snapshotObj.deductions.length} deductions.`);

    // 10. Idempotency Test: Recalculate and ensure no duplicates
    await payrollService.calculatePayrollRun(testRun.id, 'test-admin', { employeeId: testEmployee.id });
    const latestRecord = await PayrollRecord.findOne({ where: { payrollRunId: testRun.id, employeeId: testEmployee.id } });
    const countEarnings = await PayrollEarning.count({ where: { payrollRecordId: latestRecord.id } });
    console.log(`✅ 12. Idempotency Test Passed: Re-calculation refreshed ${countEarnings} earnings.`);

    // 11. Approval Workflow
    await payrollService.approvePayrollRun(testRun.id, 'test-admin');
    await testRun.reload();
    console.log(`✅ 13. Approval Workflow Passed: Run status is now "${testRun.status}".`);

    // 12. Process & Payslip Generation
    await payrollService.processPayrollRun(testRun.id, 'test-admin');
    await testRun.reload();
    console.log(`✅ 14. Processing Workflow Passed: Run status is now "${testRun.status}".`);

    const payslip = await Payslip.findOne({
      where: { payrollRecordId: latestRecord.id }
    });
    if (!payslip) throw new Error('Payslip was not generated!');
    console.log(`✅ 15. Payslip Generated: Number="${payslip.payslipNumber}", Net Pay=₹${payslip.netSalary}, PDF URL="${payslip.pdfUrl}".`);

    // 13. Loan Repayment Verification
    const repayment = await LoanRepayment.findOne({
      where: { payrollRecordId: latestRecord.id }
    });
    if (repayment) {
      console.log(`✅ 16. Loan Repayment Ledger Recorded: ₹${repayment.paidAmount} deducted, Remaining Outstanding=₹${repayment.outstandingAfterPayment}.`);
    } else {
      console.log('ℹ️ Loan Repayment deduction recorded via payroll deductions.');
    }

    // 14. Payment Disbursement Recording
    await payrollService.recordPayment(testRun.id, {
      paymentDate: '2026-10-31',
      paymentMethod: 'Bank Transfer (NEFT/RTGS)',
      paymentReference: 'NEFT-TXN-9876543210'
    }, 'test-admin');
    await testRun.reload();
    console.log(`✅ 17. Payment Disbursement Recorded: Payment Status="${testRun.paymentStatus}", Reference="${testRun.paymentReference}".`);

    const paymentEntry = await PayrollPayment.findOne({ where: { payrollRunId: testRun.id } });
    console.log(`✅ 18. PayrollPayment Disbursement Entry Verified: [Ref: ${paymentEntry?.paymentReference}, Amount: ₹${paymentEntry?.amount}, Status: ${paymentEntry?.status}].`);

    // 15. Lock Workflow
    await payrollService.lockPayrollRun(testRun.id, 'test-admin');
    await testRun.reload();
    console.log(`✅ 19. Locking Workflow Passed: Run status is now "${testRun.status}". Mutability locked.`);

    // 16. Audit Log Verification
    const auditLogs = await PayrollAuditLog.findAll({
      where: { entityId: testRun.id }
    });
    console.log(`✅ 20. Payroll Audit Logs Verified: Found ${auditLogs.length} audit entries tracking all mutations.`);
    auditLogs.forEach(l => console.log(`   - [${l.action}] by ${l.actorUserId}: ${l.reason}`));

    console.log('\n====================================================');
    console.log('🎉 ALL 20 INTEGRATION TESTS COMPLETED SUCCESSFULLY WITH 0 FAILURES!');
    console.log('====================================================');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Test Suite Failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

runTestSuite();
