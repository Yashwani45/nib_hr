const { masterSequelize } = require('./config/database');
const { Sequelize } = require('sequelize');
const { Attendance } = require('./models');

async function clearAllTenants() {
    try {
        const [tenants] = await masterSequelize.query('SELECT * FROM tenants');
        const today = new Date().toISOString().split('T')[0];
        
        for (const tenant of tenants) {
            console.log(`Clearing attendance for tenant ${tenant.db_name}...`);
            const tenantDb = new Sequelize(tenant.db_name, tenant.db_username, tenant.db_password, {
                host: tenant.db_host,
                port: tenant.db_port,
                dialect: 'mysql',
                logging: false,
            });
            await tenantDb.query(`DELETE FROM daily_attendance WHERE date = '${today}'`);
            console.log(`Cleared for ${tenant.db_name}`);
            await tenantDb.close();
        }
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
clearAllTenants();
