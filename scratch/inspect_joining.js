const { Sequelize } = require('sequelize');

async function main() {
  const masterSequelize = new Sequelize('system_master_db', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
  });

  try {
    const databases = await masterSequelize.query("SHOW DATABASES", { type: Sequelize.QueryTypes.SELECT });
    console.log("Databases found:", databases.map(d => Object.values(d)[0]));

    // Query active tenants
    const tenants = await masterSequelize.query("SELECT * FROM tenants", { type: Sequelize.QueryTypes.SELECT });
    console.log("Tenants:", tenants);

    for (const tenant of tenants) {
      const dbName = tenant.db_name;
      console.log(`\nChecking database: ${dbName}`);
      const tenantSeq = new Sequelize(dbName, 'root', '', {
        host: 'localhost',
        dialect: 'mysql',
        logging: false
      });

      try {
        const tables = await tenantSeq.query("SHOW TABLES", { type: Sequelize.QueryTypes.SELECT });
        const tableNames = tables.map(t => Object.values(t)[0]);
        console.log(`  Tables in ${dbName}:`, tableNames);

        if (tableNames.includes('joining_records')) {
          const rows = await tenantSeq.query("SELECT * FROM `joining_records`", { type: Sequelize.QueryTypes.SELECT });
          console.log(`  Rows in ${dbName}.joining_records:`, rows);
        }
      } catch (err) {
        console.error(`  Error querying database ${dbName}:`, err.message);
      } finally {
        await tenantSeq.close();
      }
    }

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await masterSequelize.close();
  }
}

main();
