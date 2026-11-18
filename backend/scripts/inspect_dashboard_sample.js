const { getTenantConnection } = require('../config/connectionManager');
const { tenantStorage } = require('../config/database');

async function inspectSampleData() {
  const tenantDb = await getTenantConnection('nib_insurance');
  await tenantStorage.run(tenantDb, async () => {
    const branches = await tenantDb.query("SELECT * FROM branches", { type: tenantDb.QueryTypes.SELECT }).catch(() => []);
    console.log('Branches in nib_insurance:', branches);

    const emps = await tenantDb.query("SELECT id, employeeCode, employee_name, branch, branch_id, branchName FROM employees LIMIT 5", { type: tenantDb.QueryTypes.SELECT });
    console.log('Employees in nib_insurance:', emps);

    const atts = await tenantDb.query("SELECT id, name, empId, date, checkIn, checkOut, status FROM daily_attendance ORDER BY id DESC LIMIT 5", { type: tenantDb.QueryTypes.SELECT });
    console.log('Attendance in nib_insurance:', atts);

    const leaves = await tenantDb.query("SELECT * FROM leave_requests ORDER BY id DESC LIMIT 5", { type: tenantDb.QueryTypes.SELECT }).catch(() => []);
    console.log('Leaves count:', leaves.length);

    const reqs = await tenantDb.query("SELECT * FROM job_requisition ORDER BY id DESC LIMIT 5", { type: tenantDb.QueryTypes.SELECT }).catch(() => []);
    console.log('Job Requisitions count:', reqs.length);
  });
  process.exit(0);
}

inspectSampleData();
