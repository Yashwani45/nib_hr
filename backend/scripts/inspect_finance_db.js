const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { getTenantConnection } = require('../config/connectionManager');

async function inspect() {
  try {
    for (const tenant of ['nib_insurance', 'yashtech']) {
      console.log(`\n=== INSPECTING ${tenant} ===`);
      const conn = await getTenantConnection(tenant);
      const [tables] = await conn.query('SHOW TABLES;');
      const tableNames = tables.map(t => Object.values(t)[0]);
      console.log('Tables:', tableNames.sort());
      
      const financeKeywords = ['salary', 'payroll', 'loan', 'payslip', 'esi', 'tax', 'bonus', 'tds', 'deduction', 'earning'];
      const financeTables = tableNames.filter(name => financeKeywords.some(k => name.toLowerCase().includes(k)));
      console.log('Finance Tables found:', financeTables);

      for (const ft of financeTables) {
        const [cols] = await conn.query(`DESCRIBE \`${ft}\`;`);
        console.log(`\n--- Schema for ${ft} ---`);
        console.log(cols.map(c => `${c.Field} (${c.Type}) ${c.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${c.Key} default: ${c.Default}`).join('\n'));
      }
    }
  } catch (err) {
    console.error('Inspection error:', err);
  } finally {
    process.exit(0);
  }
}

inspect();
