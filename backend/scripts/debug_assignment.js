const { getTenantConnection } = require('../config/connectionManager');
const { tenantStorage } = require('../config/database');
const { EmployeeSalaryAssignment, SalaryStructure, SalaryComponent } = require('../models');

async function debugAssignment() {
  const tenantDb = await getTenantConnection('NIB01');
  await tenantStorage.run(tenantDb, async () => {
    const assignment = await EmployeeSalaryAssignment.findOne({
      order: [['id', 'DESC']],
      include: [{ model: SalaryStructure, as: 'structure', include: [{ model: SalaryComponent, as: 'components' }] }]
    });
    console.log('Assignment fields:', {
      id: assignment.id,
      baseGross: assignment.baseGross,
      grossSalary: assignment.grossSalary,
      effectiveFrom: assignment.effectiveFrom
    });
    console.log('Structure components:', assignment.structure?.components?.map(c => ({
      name: c.name || c.componentName,
      type: c.type || c.componentType,
      calculationType: c.calculationType,
      amount: c.amount,
      value: c.value
    })));
  });
  process.exit(0);
}

debugAssignment();
