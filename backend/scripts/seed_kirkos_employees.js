require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { getTenantConnection } = require('../config/connectionManager');
const { QueryTypes } = require('sequelize');
const crypto = require('crypto');

(async () => {
  try {
    const tenantDb = await getTenantConnection('nib_insurance');
    const kirkosBranchId = 'fbb0499e-a019-4b84-9a0c-5d62bf494302';
    const kirkosBranchName = 'NIB Insurance – Kirkos Branch';

    // 1. Assign Arun to Kirkos Branch
    await tenantDb.query(
      `UPDATE employees 
       SET branch = :bName, branchName = :bName, branch_id = :bId 
       WHERE email = 'arun2345@gmail.com'`,
      { replacements: { bName: kirkosBranchName, bId: kirkosBranchId } }
    );

    // 2. Check if Selamawit Bekele exists in employees
    const existingSelam = await tenantDb.query(
      `SELECT id FROM employees WHERE email = 'selamawit.bekele@nibinsurance.com' OR employee_name LIKE '%Selamawit%'`,
      { type: QueryTypes.SELECT }
    );

    if (existingSelam.length === 0) {
      const newId = crypto.randomUUID();
      await tenantDb.query(
        `INSERT INTO employees (
          id, employee_name, employeeName, firstName, lastName, email, officialEmail, personalEmail,
          department, designation, branch, branchName, branch_id,
          company, employeeType, employeeStatus, employeeCode, employeeId
        ) VALUES (
          :id, 'Selamawit Bekele', 'Selamawit Bekele', 'Selamawit', 'Bekele', 'selamawit.bekele@nibinsurance.com', 'selamawit.bekele@nibinsurance.com', 'selamawit.bekele@nibinsurance.com',
          'Operations', 'Branch Manager', :bName, :bName, :bId,
          'NIB Insurance', 'Full Time', 'Active', 'BR-MGR-2045', 'EMP-204501'
        )`,
        { replacements: { id: newId, bName: kirkosBranchName, bId: kirkosBranchId } }
      );
      console.log('Inserted Selamawit Bekele as Kirkos Branch Manager');
    } else {
      await tenantDb.query(
        `UPDATE employees 
         SET branch = :bName, branchName = :bName, branch_id = :bId 
         WHERE id = :id`,
        { replacements: { id: existingSelam[0].id, bName: kirkosBranchName, bId: kirkosBranchId } }
      );
      console.log('Updated existing Selamawit Bekele');
    }

    // Check counts per branch now
    const emps = await tenantDb.query('SELECT branch_id, branch, COUNT(*) as cnt FROM employees GROUP BY branch_id, branch', { type: QueryTypes.SELECT });
    console.log('Updated branch counts:', emps);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
