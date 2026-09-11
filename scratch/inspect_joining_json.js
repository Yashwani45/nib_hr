const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

async function main() {
  const masterSequelize = new Sequelize('system_master_db', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
  });

  const output = {
    master_databases: [],
    tenants: [],
    tenant_records: {}
  };

  try {
    const databases = await masterSequelize.query("SHOW DATABASES", { type: Sequelize.QueryTypes.SELECT });
    output.master_databases = databases.map(d => Object.values(d)[0]);

    const tenants = await masterSequelize.query("SELECT * FROM tenants", { type: Sequelize.QueryTypes.SELECT });
    output.tenants = tenants;

    for (const tenant of tenants) {
      const dbName = tenant.db_name;
      const tenantSeq = new Sequelize(dbName, 'root', '', {
        host: 'localhost',
        dialect: 'mysql',
        logging: false
      });

      try {
        const tables = await tenantSeq.query("SHOW TABLES", { type: Sequelize.QueryTypes.SELECT });
        const tableNames = tables.map(t => Object.values(t)[0]);

        if (tableNames.includes('joining_records')) {
          const rows = await tenantSeq.query("SELECT * FROM `joining_records`", { type: Sequelize.QueryTypes.SELECT });
          output.tenant_records[dbName] = rows;
        }
      } catch (err) {
        output.tenant_records[dbName] = { error: err.message };
      } finally {
        await tenantSeq.close();
      }
    }

  } catch (err) {
    output.error = err.message;
  } finally {
    await masterSequelize.close();
  }

  fs.writeFileSync(path.join(__dirname, 'db_result.json'), JSON.stringify(output, null, 2));
  console.log("Database results written to scratch/db_result.json");
}

main();
