// backend/scripts/migrate_attendance_configs.js
const { masterSequelize } = require('../config/database');
const { getTenantConnection } = require('../config/connectionManager');
const { v4: uuidv4 } = require('uuid');

async function migrate() {
  console.log('--- Starting Attendance Config & Schema Migration ---');

  const createConfigTableDDL = `
    CREATE TABLE IF NOT EXISTS org_attendance_configs (
      id CHAR(36) NOT NULL PRIMARY KEY,
      company_id VARCHAR(100) NOT NULL,
      company_code VARCHAR(50) NOT NULL,
      company_name VARCHAR(255) NOT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      INDEX idx_comp_id (company_id),
      INDEX idx_comp_code (company_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createMethodsTableDDL = `
    CREATE TABLE IF NOT EXISTS org_attendance_methods (
      id CHAR(36) NOT NULL PRIMARY KEY,
      config_id CHAR(36) NOT NULL,
      method_type ENUM('GEO', 'FACE', 'BIOMETRIC', 'QR') NOT NULL,
      is_enabled TINYINT(1) NOT NULL DEFAULT 1,
      settings JSON NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      UNIQUE KEY unique_org_method (config_id, method_type),
      INDEX idx_config_id (config_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const alterDailyAttendanceDDL = [
    "ALTER TABLE daily_attendance ADD COLUMN verification_method ENUM('GEO', 'FACE', 'BIOMETRIC', 'QR', 'MANUAL') DEFAULT 'MANUAL'",
    "ALTER TABLE daily_attendance ADD COLUMN verification_status VARCHAR(50) DEFAULT 'VERIFIED'",
    "ALTER TABLE daily_attendance ADD COLUMN latitude DECIMAL(10, 8) NULL",
    "ALTER TABLE daily_attendance ADD COLUMN longitude DECIMAL(11, 8) NULL",
    "ALTER TABLE daily_attendance ADD COLUMN accuracy DECIMAL(8, 2) NULL",
    "ALTER TABLE daily_attendance ADD COLUMN attendance_location VARCHAR(255) NULL",
    "ALTER TABLE daily_attendance ADD COLUMN device_id VARCHAR(100) NULL",
  ];

  // 1. Run on Master DB
  console.log('1. Provisioning master tables in system_master_db...');
  await masterSequelize.query(createConfigTableDDL);
  await masterSequelize.query(createMethodsTableDDL);

  // 2. Fetch all tenants
  const [tenants] = await masterSequelize.query('SELECT id, company_name, db_name, status FROM tenants');
  console.log(`Found ${tenants.length} tenants in master registry.`);

  for (const tenant of tenants) {
    console.log(`\nProcessing tenant: ${tenant.company_name} (${tenant.db_name})...`);
    try {
      const tenantDb = await getTenantConnection(tenant.id);

      // Provision tables in tenant DB
      await tenantDb.query(createConfigTableDDL);
      await tenantDb.query(createMethodsTableDDL);

      // Check daily_attendance columns
      for (const alterQuery of alterDailyAttendanceDDL) {
        await tenantDb.query(alterQuery).catch(() => {
          // Column already exists, safe to ignore
        });
      }

      // Check if config already exists in tenant DB or master DB
      const [existingConfig] = await tenantDb.query(
        'SELECT * FROM org_attendance_configs WHERE company_id = ? OR company_code = ? LIMIT 1',
        { replacements: [tenant.id, tenant.db_name] }
      );

      let configId;
      if (existingConfig && existingConfig.length > 0) {
        configId = existingConfig[0].id;
        console.log(`  Config already exists (id: ${configId})`);
      } else {
        configId = uuidv4();
        await tenantDb.query(
          `INSERT INTO org_attendance_configs (id, company_id, company_code, company_name, is_active)
           VALUES (?, ?, ?, ?, 1)`,
          { replacements: [configId, tenant.id, tenant.db_name, tenant.company_name] }
        );
        console.log(`  Created org_attendance_config (id: ${configId})`);

        // Seed default methods:
        // By default: GEO enabled, QR enabled, FACE enabled, BIOMETRIC disabled
        const defaultMethods = [
          {
            type: 'GEO',
            enabled: 1,
            settings: JSON.stringify({
              locations: [
                {
                  id: 'loc-hq',
                  name: `${tenant.company_name} Headquarters`,
                  address: 'Corporate Headquarters Office',
                  latitude: 19.0760,
                  longitude: 72.8777,
                  radiusMeters: 500,
                  isActive: true,
                }
              ]
            })
          },
          {
            type: 'FACE',
            enabled: 1,
            settings: JSON.stringify({
              provider: 'local-vision',
              minConfidenceScore: 0.85,
              livenessRequired: true,
            })
          },
          {
            type: 'BIOMETRIC',
            enabled: 0,
            settings: JSON.stringify({
              devices: [
                {
                  deviceId: 'BIO-01',
                  deviceName: 'Main Gate Biometric Terminal',
                  serialNumber: 'ZK-TECO-88901',
                  ipAddress: '192.168.1.201',
                  location: 'Main Reception',
                  status: 'Active',
                  lastSync: new Date().toISOString()
                }
              ]
            })
          },
          {
            type: 'QR',
            enabled: 1,
            settings: JSON.stringify({
              rotationSeconds: 60,
              requireDynamic: true,
              allowSelfScan: true,
            })
          }
        ];

        for (const m of defaultMethods) {
          await tenantDb.query(
            `INSERT INTO org_attendance_methods (id, config_id, method_type, is_enabled, settings)
             VALUES (?, ?, ?, ?, ?)`,
            { replacements: [uuidv4(), configId, m.type, m.enabled, m.settings] }
          );
        }
        console.log(`  Seeded 4 attendance methods for ${tenant.company_name}`);
      }

      // Also mirror to Master DB for quick SuperAdmin access
      const [masterConfig] = await masterSequelize.query(
        'SELECT * FROM org_attendance_configs WHERE company_id = ? OR company_code = ? LIMIT 1',
        { replacements: [tenant.id, tenant.db_name] }
      );
      if (!masterConfig || masterConfig.length === 0) {
        await masterSequelize.query(
          `INSERT INTO org_attendance_configs (id, company_id, company_code, company_name, is_active)
           VALUES (?, ?, ?, ?, 1)`,
          { replacements: [configId, tenant.id, tenant.db_name, tenant.company_name] }
        );
        const [methods] = await tenantDb.query('SELECT * FROM org_attendance_methods WHERE config_id = ?', { replacements: [configId] });
        for (const meth of methods) {
          await masterSequelize.query(
            `INSERT INTO org_attendance_methods (id, config_id, method_type, is_enabled, settings)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled), settings = VALUES(settings)`,
            { replacements: [meth.id, configId, meth.method_type, meth.is_enabled, typeof meth.settings === 'string' ? meth.settings : JSON.stringify(meth.settings)] }
          );
        }
      }

    } catch (err) {
      console.error(`Error configuring tenant ${tenant.company_name}:`, err);
    }
  }

  console.log('\n--- Migration Completed Successfully ---');
  process.exit(0);
}

migrate().catch(e => {
  console.error('Fatal migration error:', e);
  process.exit(1);
});
