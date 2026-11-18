const { masterSequelize } = require('./config/database');
const Attendance = require('./models/operations/attendance.model');

async function syncAllDatabases() {
  const tenants = ['system_master_db', 'nib_insurance', 'yashtech', 'aarogya_homeopathy_clinic'];
  const modelAttributes = Object.keys(Attendance.rawAttributes);

  for (const db of tenants) {
    console.log(`\nChecking database: ${db}`);
    try {
      const [cols] = await masterSequelize.query(`SHOW COLUMNS FROM \`${db}\`.daily_attendance`);
      const colNames = cols.map(c => c.Field);

      for (const attrName of modelAttributes) {
        const attr = Attendance.rawAttributes[attrName];
        const fieldName = attr.field || attrName;
        if (!colNames.includes(fieldName)) {
          let sqlColType = 'VARCHAR(255) NULL';
          if (fieldName === 'day') sqlColType = 'VARCHAR(50) NULL';
          else if (fieldName === 'workingHours') sqlColType = 'DECIMAL(12,2) NULL';
          else if (fieldName === 'working_hours') sqlColType = 'DECIMAL(12,2) NULL';
          else if (fieldName === 'break_hours') sqlColType = 'DECIMAL(5,2) NULL DEFAULT 0.00';
          else if (fieldName === 'lateComing' || fieldName === 'earlyLeaving' || fieldName === 'overtime') sqlColType = 'INT NULL DEFAULT 0';
          else if (fieldName === 'latitude') sqlColType = 'DECIMAL(10, 8) NULL';
          else if (fieldName === 'longitude') sqlColType = 'DECIMAL(11, 8) NULL';
          else if (fieldName === 'accuracy') sqlColType = 'DECIMAL(8, 2) NULL';
          else if (fieldName === 'selfie_url' || fieldName === 'remarks') sqlColType = 'TEXT NULL';
          else if (fieldName === 'verification_method') sqlColType = "ENUM('GEO', 'FACE', 'BIOMETRIC', 'QR', 'MANUAL') DEFAULT 'MANUAL'";
          else if (fieldName === 'verification_status') sqlColType = "VARCHAR(50) DEFAULT 'VERIFIED'";

          console.log(`Adding ${fieldName} to ${db}.daily_attendance...`);
          await masterSequelize.query(`ALTER TABLE \`${db}\`.daily_attendance ADD COLUMN \`${fieldName}\` ${sqlColType}`);
          console.log(`✓ Added ${fieldName} to ${db}`);
        }
      }
    } catch (err) {
      console.warn(`Error on ${db}:`, err.message);
    }
  }
  console.log('\nAll daily_attendance tables fully synchronized!');
  process.exit(0);
}

syncAllDatabases();
