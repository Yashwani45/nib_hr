const { getTenantConnection } = require('../config/connectionManager');
const { tenantStorage } = require('../config/database');
const { PayrollItem, PayrollEarning, PayrollDeduction, EmployeeSalaryAssignment, SalaryStructure, SalaryComponent } = require('../models');

async function debugItem() {
  const tenantDb = await getTenantConnection('NIB01');
  await tenantStorage.run(tenantDb, async () => {
    const item = await PayrollItem.findOne({ order: [['id', 'DESC']] });
    if (!item) {
      console.log('No item found');
      return;
    }
    console.log('Last PayrollItem:', {
      id: item.id,
      employeeId: item.employeeId,
      workingDays: item.workingDays,
      presentDays: item.presentDays,
      grossSalary: item.grossSalary,
      totalDeductions: item.totalDeductions,
      netSalary: item.netSalary,
      employerPf: item.employerPf,
      employerEsi: item.employerEsi
    });

    const earnings = await PayrollEarning.findAll({ where: { payrollItemId: item.id } });
    console.log('Earnings count:', earnings.length, earnings.map(e => ({ name: e.name || e.componentName, amount: e.amount || e.calculatedAmount })));

    const deductions = await PayrollDeduction.findAll({ where: { payrollItemId: item.id } });
    console.log('Deductions count:', deductions.length, deductions.map(d => ({ name: d.name || d.deductionName, amount: d.amount || d.calculatedAmount })));
  });
  process.exit(0);
}

debugItem();
