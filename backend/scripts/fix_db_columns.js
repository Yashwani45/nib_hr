const { sequelize } = require('../config/database');

async function fixStatutoryTables() {
  const [dbs] = await sequelize.query('SHOW DATABASES');
  const validDbs = dbs.map(d => Object.values(d)[0]).filter(name => !['information_schema', 'performance_schema', 'mysql', 'sys'].includes(name));
  
  for (const db of validDbs) {
    const queries = [
      `ALTER TABLE \`${db}\`.\`esi_contributions\` ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Filed'`,
      `ALTER TABLE \`${db}\`.\`esi_contributions\` ADD COLUMN payroll_item_id CHAR(36) NULL`,
      `ALTER TABLE \`${db}\`.\`esi_contributions\` ADD COLUMN payroll_record_id CHAR(36) NULL`,
      `ALTER TABLE \`${db}\`.\`professional_tax_contributions\` ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Filed'`,
      `ALTER TABLE \`${db}\`.\`professional_tax_contributions\` ADD COLUMN payroll_item_id CHAR(36) NULL`,
      `ALTER TABLE \`${db}\`.\`professional_tax_contributions\` ADD COLUMN payroll_record_id CHAR(36) NULL`
    ];
    for (const q of queries) {
      await sequelize.query(q).catch(() => {});
    }
  }
  console.log('Fixed statutory contributions tables across all databases.');
  process.exit(0);
}

fixStatutoryTables();
