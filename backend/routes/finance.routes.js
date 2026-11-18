// backend/routes/finance.routes.js
const express = require('express');
const verifyJWT = require('../middleware/auth.middleware');
const auditLogger = require('../middleware/audit.middleware');
const { checkAccess } = require('../middleware/rbac.middleware');

// Controllers
const payrollController = require('../controllers/finance/payroll.controller');
const payslipController = require('../controllers/finance/payslip.controller');
const loanController = require('../controllers/finance/loan.controller');
const esiController = require('../controllers/finance/esi.controller');
const ptController = require('../controllers/finance/professionalTax.controller');
const salaryStructureController = require('../controllers/finance/salaryStructure.controller');
const reportController = require('../controllers/finance/report.controller');
const statutoryController = require('../controllers/finance/statutory.controller');

const { getBonuses, createBonus, updateBonus, toggleBonusStatus, deleteBonus } = require('../controllers/finance/bonus.controller');
const { getTdsMasters, createTdsMaster, updateTdsMaster, toggleTdsMasterStatus, deleteTdsMaster } = require('../controllers/finance/tdsMaster.controller');

const router = express.Router();

router.use(verifyJWT);

// ==================== PAYROLL RUNS ====================
router.post('/runs', checkAccess('payroll', 'create'), auditLogger('Payroll Process'), payrollController.createPayrollRun);
router.get('/runs', checkAccess('payroll', 'view'), payrollController.getPayrollRuns);
router.get('/runs/:id', checkAccess('payroll', 'view'), payrollController.getPayrollRunDetails);
router.post('/runs/:id/calculate', checkAccess('payroll', 'calculate'), auditLogger('Payroll Process'), payrollController.calculatePayrollRun);
router.post('/runs/:id/approve', checkAccess('payroll', 'approve'), auditLogger('Payroll Process'), payrollController.approvePayrollRun);
router.post('/runs/:id/process', checkAccess('payroll', 'process'), auditLogger('Payroll Process'), payrollController.processPayrollRun);
router.post('/runs/:id/lock', checkAccess('payroll', 'lock'), auditLogger('Payroll Process'), payrollController.lockPayrollRun);
router.post('/runs/:id/cancel', checkAccess('payroll', 'lock'), auditLogger('Payroll Process'), payrollController.cancelPayrollRun);
router.post('/runs/:id/payout', checkAccess('payroll', 'process'), auditLogger('Payroll Process'), payrollController.recordPayment);
router.get('/runs/:id/export-bank', checkAccess('payroll', 'view'), payrollController.exportBankPaymentInstructions);

// ==================== ENTERPRISE PAYROLL RECORDS ====================
router.get('/records', checkAccess('payroll', 'view'), payrollController.getPayrollRecords);
router.get('/records/:id', checkAccess('payroll', 'view'), payrollController.getPayrollRecordById);

// ==================== PAYROLL PAYMENTS & DISBURSEMENTS ====================
router.get('/payments', checkAccess('payroll', 'view'), payrollController.getPayrollPayments);

// ==================== PAYROLL AUDIT LOGS ====================
router.get('/audit-logs', checkAccess('payroll', 'view'), payrollController.getPayrollAuditLogs);

// ==================== STATUTORY CONFIGURATIONS ====================
router.get('/statutory-configurations', checkAccess('statutory', 'view'), statutoryController.getConfigurations);
router.get('/statutory-configurations/:id', checkAccess('statutory', 'view'), statutoryController.getConfigurationById);
router.post('/statutory-configurations', checkAccess('statutory', 'create'), auditLogger('Statutory Configuration'), statutoryController.createConfiguration);
router.put('/statutory-configurations/:id', checkAccess('statutory', 'update'), auditLogger('Statutory Configuration'), statutoryController.updateConfiguration);
router.patch('/statutory-configurations/:id/status', checkAccess('statutory', 'update'), auditLogger('Statutory Configuration'), statutoryController.toggleStatus);

// ==================== PAYSLIPS ====================
router.get('/payslips', checkAccess('payslip', 'view'), payslipController.getPayslips);
router.get('/payslips/:id', checkAccess('payslip', 'view'), payslipController.getPayslipDetails);
router.get('/payslips/:id/pdf', checkAccess('payslip', 'download'), payslipController.getPayslipPdf);

// ==================== LOAN MANAGEMENT ====================
router.post('/loans', checkAccess('loan', 'create'), auditLogger('Loan Management'), loanController.requestLoan);
router.get('/loans', checkAccess('loan', 'view'), loanController.getLoans);
router.get('/loans/:id', checkAccess('loan', 'view'), loanController.getLoanDetails);
router.post('/loans/:id/approve', checkAccess('loan', 'approve'), auditLogger('Loan Management'), loanController.approveLoan);
router.post('/loans/:id/reject', checkAccess('loan', 'reject'), auditLogger('Loan Management'), loanController.rejectLoan);
router.post('/loans/:id/repayment', checkAccess('loan', 'approve'), auditLogger('Loan Management'), loanController.recordRepayment);
router.get('/loans/:id/repayments', checkAccess('loan', 'view'), loanController.getLoanRepayments);
router.post('/loans/:id/close', checkAccess('loan', 'approve'), auditLogger('Loan Management'), loanController.closeLoan);

// ==================== ESI MANAGEMENT ====================
router.get('/esi', checkAccess('esi', 'view'), esiController.getEsiContributions);
router.get('/esi/report', checkAccess('esi', 'view'), esiController.getEsiReport);
router.post('/esi/challan', checkAccess('esi', 'manage'), auditLogger('ESI Management'), esiController.updateEsiChallan);
router.get('/esi/export', checkAccess('esi', 'view'), esiController.exportEsiCsv);

// ==================== PROFESSIONAL TAX ====================
router.get('/professional-tax', checkAccess('professional_tax', 'view'), ptController.getPtContributions);
router.get('/professional-tax/rules', checkAccess('professional_tax', 'view'), ptController.getPtRules);
router.post('/professional-tax/rules', checkAccess('professional_tax', 'manage'), auditLogger('Statutory & Tax'), ptController.createPtRule);
router.put('/professional-tax/rules/:id', checkAccess('professional_tax', 'manage'), auditLogger('Statutory & Tax'), ptController.updatePtRule);
router.delete('/professional-tax/rules/:id', checkAccess('professional_tax', 'manage'), auditLogger('Statutory & Tax'), ptController.deletePtRule);
router.get('/professional-tax/report', checkAccess('professional_tax', 'view'), ptController.getPtReport);
router.post('/professional-tax/challan', checkAccess('professional_tax', 'manage'), auditLogger('Statutory & Tax'), ptController.updatePtChallan);
router.get('/professional-tax/export', checkAccess('professional_tax', 'view'), ptController.exportPtCsv);

// ==================== SALARY STRUCTURES ====================
router.post('/salary-structures', checkAccess('salary_structure', 'create'), auditLogger('Salary Structure'), salaryStructureController.createSalaryStructure);
router.get('/salary-structures', checkAccess('salary_structure', 'view'), salaryStructureController.getSalaryStructures);
router.get('/salary-structures/applicable/:employeeId', checkAccess('salary_structure', 'view'), salaryStructureController.getApplicableStructures);
router.get('/salary-structures/:id', checkAccess('salary_structure', 'view'), salaryStructureController.getStructureDetails);
router.put('/salary-structures/:id', checkAccess('salary_structure', 'update'), auditLogger('Salary Structure'), salaryStructureController.updateSalaryStructure);
router.patch('/salary-structures/:id/status', checkAccess('salary_structure', 'update'), auditLogger('Salary Structure'), salaryStructureController.toggleStructureStatus);
router.post('/salary-structures/assign', checkAccess('salary_structure', 'create'), auditLogger('Salary Structure'), salaryStructureController.assignSalaryStructure);
router.post('/salary-structures/assignments/:id/approve', checkAccess('salary_structure', 'approve'), auditLogger('Salary Structure'), salaryStructureController.approveSalaryAssignment);
router.get('/salary-structures/employee/:employeeId', checkAccess('salary_structure', 'view'), salaryStructureController.getEmployeeSalaryHistory);
router.post('/salary-structures/preview', checkAccess('salary_structure', 'view'), salaryStructureController.previewCalculation);

// ==================== REPORTS ====================
router.get('/reports', checkAccess('payroll_reports', 'view'), reportController.getReportData);
router.get('/reports/export', checkAccess('payroll_reports', 'export'), reportController.exportCsv);

// ==================== EXISTING MASTERS (BACKWARDS COMPATIBILITY) ====================
router.get('/bonuses', auditLogger('BonusMaster'), getBonuses);
router.post('/bonuses', auditLogger('BonusMaster'), checkAccess('payroll', 'create'), createBonus);
router.put('/bonuses/:id', auditLogger('BonusMaster'), checkAccess('payroll', 'create'), updateBonus);
router.patch('/bonuses/:id/status', auditLogger('BonusMaster'), checkAccess('payroll', 'create'), toggleBonusStatus);
router.delete('/bonuses/:id', auditLogger('BonusMaster'), checkAccess('payroll', 'create'), deleteBonus);

router.get('/tds', auditLogger('TDSMaster'), getTdsMasters);
router.post('/tds', auditLogger('TDSMaster'), checkAccess('payroll', 'create'), createTdsMaster);
router.put('/tds/:id', auditLogger('TDSMaster'), checkAccess('payroll', 'create'), updateTdsMaster);
router.patch('/tds/:id/status', auditLogger('TDSMaster'), checkAccess('payroll', 'create'), toggleTdsMasterStatus);
router.delete('/tds/:id', auditLogger('TDSMaster'), checkAccess('payroll', 'create'), deleteTdsMaster);

module.exports = router;
