// backend/migrations/migrate_attendance_multi_emp.js
const { getTenantConnection } = require('../config/connectionManager');
const { masterSequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function migrateTenantAttendanceTable(tenantName) {
  try {
    const conn = await getTenantConnection(tenantName);
    if (!conn) return;

    // Check existing columns
    const [cols] = await conn.query('DESCRIBE daily_attendance');
    const existing = new Set(cols.map(c => c.Field.toLowerCase()));

    const columnsToAdd = [
      { name: 'attendance_date', type: 'VARCHAR(50) NULL DEFAULT NULL' },
      { name: 'check_in_time', type: 'VARCHAR(50) NULL DEFAULT NULL' },
      { name: 'check_out_time', type: 'VARCHAR(50) NULL DEFAULT NULL' },
      { name: 'attendance_status', type: 'VARCHAR(50) NULL DEFAULT "Present"' },
      { name: 'check_in_method', type: 'VARCHAR(50) NULL DEFAULT "MANUAL"' },
      { name: 'check_out_method', type: 'VARCHAR(50) NULL DEFAULT NULL' },
      { name: 'total_working_minutes', type: 'INT NULL DEFAULT 0' },
      { name: 'late_minutes', type: 'INT NULL DEFAULT 0' },
      { name: 'early_departure_minutes', type: 'INT NULL DEFAULT 0' },
    ];

    for (const col of columnsToAdd) {
      if (!existing.has(col.name.toLowerCase())) {
        console.log(`[${tenantName}] Adding column ${col.name}...`);
        await conn.query(`ALTER TABLE daily_attendance ADD COLUMN ${col.name} ${col.type}`);
      }
    }

    // Backfill any existing rows where attendance_date or check_in_time are null
    await conn.query(`
      UPDATE daily_attendance 
      SET 
        attendance_date = COALESCE(attendance_date, date),
        check_in_time = COALESCE(check_in_time, check_in, checkIn),
        check_out_time = COALESCE(check_out_time, IF(check_out = '--' OR checkOut = '--', NULL, COALESCE(check_out, checkOut))),
        attendance_status = COALESCE(attendance_status, status, 'Present'),
        check_in_method = COALESCE(check_in_method, verification_method, 'MANUAL'),
        total_working_minutes = COALESCE(total_working_minutes, ROUND(COALESCE(working_hours, workingHours, 0) * 60)),
        late_minutes = COALESCE(late_minutes, late_coming, lateComing, 0),
        early_departure_minutes = COALESCE(early_departure_minutes, early_leaving, earlyLeaving, 0)
      WHERE attendance_date IS NULL OR check_in_time IS NULL
    `);

    console.log(`[${tenantName}] Attendance schema migration verified successfully.`);
  } catch (err) {
    console.error(`[${tenantName}] Migration error:`, err.message);
  }
}

async function runAll() {
  const tenants = ['yashtech', 'nib_insurance'];
  try {
    const dbTenants = await masterSequelize.query(`SELECT id, db_name FROM tenants`, { type: QueryTypes.SELECT }).catch(() => []);
    for (const t of dbTenants) {
      const name = t.db_name || t.id;
      if (name && !tenants.includes(name)) tenants.push(name);
    }
  } catch (e) {}

  for (const t of tenants) {
    await migrateTenantAttendanceTable(t);
  }
  console.log('All migrations completed.');
}

if (require.main === module) {
  runAll().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { migrateTenantAttendanceTable, runAll };
