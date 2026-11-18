const { masterSequelize } = require('./config/database');
const { Sequelize } = require('sequelize');

async function enableManual() {
    try {
        const [tenants] = await masterSequelize.query('SELECT * FROM tenants');
        
        for (const tenant of tenants) {
            console.log(`Enabling MANUAL in tenant ${tenant.db_name}...`);
            const tenantDb = new Sequelize(tenant.db_name, tenant.db_username, tenant.db_password, {
                host: tenant.db_host,
                port: tenant.db_port,
                dialect: 'mysql',
                logging: false,
            });
            
            const [configs] = await tenantDb.query('SELECT id FROM org_attendance_configs');
            for (const config of configs) {
                const configId = config.id;
                // Upsert MANUAL
                await tenantDb.query(`
                    INSERT INTO org_attendance_methods (id, config_id, method_type, is_enabled, settings)
                    VALUES (UUID(), '${configId}', 'MANUAL', 1, '{}')
                    ON DUPLICATE KEY UPDATE is_enabled = 1
                `);
            }
            console.log(`Enabled MANUAL for ${tenant.db_name}`);
            await tenantDb.close();
        }
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
enableManual();
