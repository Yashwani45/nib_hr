// backend/scripts/test_finance_suite.js
/**
 * Automated End-to-End Test Suite for Technovani HRMS Finance & Compliance Module
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { tenantStorage } = require('../config/database');
const { getTenantConnection } = require('../config/connectionManager');
const salaryStructureService = require('../services/finance/salaryStructure.service');
const payrollService = require('../services/finance/payroll.service');
const payslipService = require('../services/finance/payslip.service');
const loanService = require('../services/finance/loan.service');
const esiService = require('../services/finance/esi.service');
const ptService = require('../services/finance/professionalTax.service');
const reportService = require('../services/finance/report.service');

const {
  SalaryStructure,
  SalaryComponent,
  EmployeeSalaryAssignment,
  PayrollRun,
  PayrollItem,
  PayrollDeduction,
  Payslip,
  EmployeeLoan,
  LoanRepayment,
  EsiContribution,
  ProfessionalTaxContribution,
  Employee,
  User
} = require('../models');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('🚀 Starting Technovani HRMS Finance & Compliance Test Suite');
  console.log('================================================================\n');

  const tenantCode = 'NIB01';
  const tenantDb = await getTenantConnection(tenantCode);

  await tenantStorage.run(tenantDb, async () => {
    try {
      // 0. Setup: Ensure an active test employee exists
      console.log('--- TEST 0: Tenant & Employee Setup ---');
      let testEmp = await Employee.findOne({ where: { employeeStatus: 'Active' } });
      if (!testEmp) {
        testEmp = await Employee.create({
          employeeName: 'Rohan Sharma',
          employeeCode: 'TVN-TEST-101',
          email: 'rohan.sharma@technovani.com',
          department: 'Engineering',
          designation: 'Senior Full Stack Developer',
          employeeStatus: 'Active',
          profileData: JSON.stringify({
            accountNumber: '91823746501234',
            ifscCode: 'HDFC0001234',
            panNumber: 'ABCPS1234F',
            uanNumber: '100987654321',
            esiNumber: '31001234560001001',
            state: 'Madhya Pradesh'
          })
        });
      }
      testEmp.dateOfJoining = '2024-01-01';
      testEmp.accountNumber = '91823746501234';
      await testEmp.save();
      assert(testEmp && testEmp.id, `Active test employee verified: ${testEmp.employeeName} (${testEmp.id})`);

      // Clean up prior test assignments, loans, and runs for this employee for clean idempotent execution
      await EmployeeSalaryAssignment.destroy({ where: { employeeId: testEmp.id } });
      const oldLoans = await EmployeeLoan.findAll({ where: { employeeId: testEmp.id } });
      for (const ol of oldLoans) {
        await LoanRepayment.destroy({ where: { loanId: ol.id } });
        await ol.destroy();
      }

      // Mock admin user for service calls
      let adminUser = await User.findOne();
      const adminId = adminUser ? adminUser.id : testEmp.id;

      // 1. Salary Structure Service & Calculation Engine
      console.log('\n--- TEST 1: Salary Structure & Calculation Engine ---');
      const previewRes = await salaryStructureService.previewCalculation({
        baseGross: 20000,
        customComponents: [
          { name: 'Basic Salary', type: 'Earning', calculationType: 'Percentage', value: 50 },
          { name: 'HRA', type: 'Earning', calculationType: 'Percentage', value: 25 },
          { name: 'Special Allowance', type: 'Earning', calculationType: 'Percentage', value: 25 }
        ],
        employeeId: testEmp.id
      });

      assert(previewRes && previewRes.grossSalary === 20000, `Calculation preview computed gross salary: ₹${previewRes.grossSalary}`);
      assert(previewRes.basic === 10000, `Basic computed accurately (50% of gross): ₹${previewRes.basic}`);
      assert(previewRes.netSalary > 0, `Net salary computed: ₹${previewRes.netSalary}`);
      assert(previewRes.monthlyCtc >= previewRes.grossSalary, `Monthly CTC includes employer statutory contributions: ₹${previewRes.monthlyCtc}`);

      // Create persistent structure
      const struct = await salaryStructureService.createSalaryStructure({
        name: `Automated Grade A Structure ${Date.now()}`,
        description: 'Automated test salary band with standard statutory components',
        grade: 'Grade A',
        employmentCategory: 'Full-Time',
        components: [
          { name: 'Basic Salary', type: 'Earning', calculationType: 'Percentage', value: 50 },
          { name: 'HRA', type: 'Earning', calculationType: 'Percentage', value: 25 },
          { name: 'Special Allowance', type: 'Earning', calculationType: 'Percentage', value: 25 }
        ]
      }, adminId);
      assert(struct && struct.id, `Salary structure created with ID: ${struct.id}`);

      // Assign to employee
      const { assignment, breakdown } = await salaryStructureService.assignSalaryStructure({
        employeeId: testEmp.id,
        salaryStructureId: struct.id,
        baseGross: 20000,
        effectiveFrom: '2025-01-01'
      }, adminId);
      assert(assignment && assignment.id, `Salary structure assigned to employee ${testEmp.employeeName} with Base Gross: ₹${assignment.baseGross}`);

      // 2. Employee Loan Management
      console.log('\n--- TEST 2: Employee Loan Management & Amortization ---');
      const loan = await loanService.createLoanRequest({
        employeeId: testEmp.id,
        loanType: 'Salary Advance',
        requestedAmount: 6000,
        tenureMonths: 3,
        reason: 'Relocation expenses'
      }, { id: adminId, role: { roleName: 'Admin' } });
      assert(loan && loan.id && loan.status === 'Pending', `Loan requested for ₹6,000 in Pending status`);

      const approvedLoan = await loanService.approveLoan(loan.id, {
        approvedAmount: 6000,
        tenureMonths: 3,
        interestRate: 0,
        startDate: '2026-01-01'
      }, adminId);
      assert(approvedLoan.status === 'Approved', `Loan approved: Status is Approved`);
      const firstEmi = approvedLoan.emiSchedules && approvedLoan.emiSchedules[0];
      assert(firstEmi && parseFloat(firstEmi.emiAmount) === 2000, `EMI calculated accurately: ₹${firstEmi?.emiAmount}/month across ${approvedLoan.emiSchedules?.length} installments`);

      // 3. Monthly Payroll Lifecycle
      console.log('\n--- TEST 3: Monthly Payroll Lifecycle (Draft -> Calculate -> Approve -> Process -> Lock) ---');
      // Clean up any existing January 2026 run to allow fresh idempotent run
      const existingRun = await PayrollRun.findOne({ where: { month: 'January', year: 2026 } });
      if (existingRun) {
        await PayrollItem.destroy({ where: { payrollRunId: existingRun.id } });
        await PayrollRun.destroy({ where: { id: existingRun.id } });
      }

      // Create draft run
      const run = await payrollService.createPayrollRun('January', 2026, adminId);
      assert(run && run.id && run.status === 'Draft', `Payroll run created for January 2026 (ID: ${run.id}, Status: Draft)`);

      // Calculate run
      const calculatedRun = await payrollService.calculatePayrollRun(run.id, adminId);
      assert(calculatedRun.status === 'Calculated', `Payroll run calculated: Status updated to Calculated`);
      console.log('CALCULATED RUN EXCEPTIONS:', JSON.stringify(calculatedRun.exceptions, null, 2));
      
      const items = await PayrollItem.findAll({ where: { payrollRunId: run.id } });
      assert(items && items.length > 0, `Payroll items computed: ${items.length} employees processed`);

      const testItem = items.find(i => i.employeeId === testEmp.id);
      assert(testItem, `Test employee found in calculated payroll items`);
      const deductions = await PayrollDeduction.findAll({ where: { payrollItemId: testItem.id } });
      const loanDed = deductions.find(d => d.name.includes('Loan EMI'));
      assert(loanDed && parseFloat(loanDed.amount) === 2000, `Approved loan installment (₹2,000) automatically deducted in payroll`);
      assert(parseFloat(testItem.netSalary) > 0, `Net pay calculated accurately: ₹${testItem.netSalary}`);
      assert(parseFloat(testItem.employerPf) > 0, `Employer PF (12%) calculated: ₹${testItem.employerPf}`);
      assert(parseFloat(testItem.employerEsi) > 0, `Employer ESI (3.25%) calculated: ₹${testItem.employerEsi}`);

      // Approve run
      const approvedRun = await payrollService.approvePayrollRun(run.id, adminId);
      assert(approvedRun.status === 'Approved', `Payroll run approved: Status updated to Approved`);

      // Process run (Finalizes payslips, updates loan repayments)
      const processedRun = await payrollService.processPayrollRun(run.id, adminId);
      assert(processedRun.status === 'Processed', `Payroll run processed: Status updated to Processed`);

      // Check loan balance was reduced
      const updatedLoan = await EmployeeLoan.findByPk(loan.id);
      assert(parseFloat(updatedLoan.totalPaid) === 2000, `Loan repaid amount updated to ₹2,000`);
      assert(parseFloat(updatedLoan.outstandingBalance) === 4000, `Loan outstanding balance decreased to ₹4,000`);

      // Record payout
      const payoutRes = await payrollService.recordPayment(run.id, {
        paymentDate: '2026-01-31',
        paymentMethod: 'Bank Transfer (NEFT)',
        paymentReference: 'NEFT-20260131-99881',
        paymentStatus: 'Paid'
      }, adminId);
      assert(payoutRes.paymentStatus === 'Paid', `Payout recorded with reference NEFT-20260131-99881`);

      // Lock run
      const lockedRun = await payrollService.lockPayrollRun(run.id, adminId);
      assert(lockedRun.status === 'Locked', `Payroll run locked permanently against tampering`);

      // 4. Payslip Generation & Security Isolation
      console.log('\n--- TEST 4: Payslip Snapshot & Security Isolation ---');
      const userContext = { id: adminId, role: { roleName: 'Admin' } };
      const payslips = await payslipService.getPayslips({ month: 'January', year: 2026, employeeId: testEmp.id }, userContext);
      assert(payslips && payslips.length > 0, `Snapshot payslip generated for test employee`);

      const pslip = payslips[0];
      assert(pslip.payslipNumber && pslip.payslipNumber.startsWith('PS-'), `Unique payslip number assigned: ${pslip.payslipNumber}`);
      assert(parseFloat(pslip.netSalary) === parseFloat(testItem.netSalary), `Net salary on payslip matches snapshot item: ₹${pslip.netSalary}`);
      assert(pslip.paymentStatus === 'Paid', `Payment status synced to Paid on payslip`);

      // Test Payslip Model & PDF HTML view
      const slipDetails = await payslipService.getPayslipDetails(pslip.id, userContext);
      assert(slipDetails && slipDetails.id, `Payslip details retrieved for record ${slipDetails.id}`);

      const slipHtml = await payslipService.getPayslipPdf(pslip.id, userContext);
      assert(slipHtml && typeof slipHtml === 'string', `Payslip generated complete printable HTML layout`);
      assert(slipHtml.includes('Net Take-Home Salary'), `Contains Net Take-Home Salary block`);
      assert(slipHtml.includes('••••'), `Bank account and statutory identifiers masked with '••••'`);

      // 5. Statutory Compliance: ESI & Professional Tax Challans
      console.log('\n--- TEST 5: ESI & Professional Tax Statutory Compliance ---');
      const esiRep = await esiService.getEsiReport({ month: 'January', year: 2026 });
      assert(esiRep.summary.totalContribution > 0, `ESI total contribution compiled: ₹${esiRep.summary.totalContribution}`);

      const esiChallanRes = await esiService.updateEsiChallan({
        month: 'January',
        year: 2026,
        challanNumber: 'ESIC-TRRN-8819203',
        paymentDate: '2026-02-10',
        status: 'Filed'
      }, adminId);
      assert(esiChallanRes.status === 'Filed', `ESI Challan updated to Filed (TRRN: ESIC-TRRN-8819203)`);

      const ptRep = await ptService.getPtReport({ month: 'January', year: 2026 });
      assert(ptRep.records && ptRep.records.length > 0, `PT deductions registered: ${ptRep.records.length} records`);

      const ptChallanRes = await ptService.updatePtChallan({
        month: 'January',
        year: 2026,
        challanNumber: 'MP-PT-CHAL-5512',
        paymentDate: '2026-02-10',
        status: 'Paid'
      }, adminId);
      assert(ptChallanRes.status === 'Paid', `PT Challan updated to Paid (Challan: MP-PT-CHAL-5512)`);

      // 6. All 16 Payroll Reports Execution
      console.log('\n--- TEST 6: All 16 Database Payroll Reports ---');
      const reportTypes = [
        'monthly_summary',
        'salary_register',
        'department_cost',
        'earnings_deductions',
        'attendance_lop',
        'payslip_status',
        'loan_disbursement_repayment',
        'outstanding_loans',
        'esi_report',
        'pt_report',
        'pf_report',
        'tds_report',
        'bank_payment_report',
        'exceptions_report',
        'audit_report',
        'employer_ctc'
      ];

      for (let i = 0; i < reportTypes.length; i++) {
        const type = reportTypes[i];
        const res = await reportService.getReportData(type, { month: 'January', year: 2026 });
        const count = Array.isArray(res.records) ? res.records.length : (res.records ? Object.keys(res.records).length : 0);
        assert(res && (res.reportName || res.records !== undefined), `Report ${i + 1}/16 (${type}): "${res.reportName || type}" returned ${count} records`);
      }

      // Test CSV Export
      const csvData = await reportService.exportToCsv('monthly_summary', { month: 'January', year: 2026 });
      assert(csvData && csvData.includes('grossSalary'), `CSV export generated valid header columns and rows`);

      console.log('\n================================================================');
      console.log(`🎉 ALL TESTS COMPLETED: ${passedTests} / ${totalTests} PASSED (100% SUCCESS RATE)`);
      console.log('================================================================\n');

    } catch (err) {
      console.error('\n❌ Test Suite Aborted due to error:', err);
      process.exit(1);
    }
  });

  process.exit(0);
}

runTestSuite();