const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({ host: '127.0.0.1', user: 'root', password: '' });
  for (const db of ['nib_insurance', 'yashtech', 'nib_insurance_alt']) {
    console.log(`\n============================`);
    console.log(`DATABASE: ${db}`);
    console.log(`============================`);
    try {
      const [branches] = await conn.query(`SELECT * FROM \`${db}\`.branches`);
      console.log(`Branches in ${db} (${branches.length}):`, branches.map(b => ({
        id: b.id,
        branchName: b.branchName || b.branch_name,
        branchCode: b.branchCode || b.branch_code,
        city: b.city,
        status: b.status
      })));
    } catch (e) {
      console.log(`Error reading branches in ${db}:`, e.message);
    }

    try {
      const [comp] = await conn.query(`SELECT * FROM \`${db}\`.company`);
      console.log(`Company in ${db}:`, comp);
    } catch (e) {
      console.log(`Error reading company in ${db}:`, e.message);
    }

    try {
      const [empCount] = await conn.query(`SELECT COUNT(*) as count FROM \`${db}\`.employees`);
      console.log(`Employees count in ${db}:`, empCount[0].count);
    } catch (e) {
      console.log(`Error reading employees in ${db}:`, e.message);
    }
  }
  await conn.end();
  process.exit(0);
}
main();
