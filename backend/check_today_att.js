const { getTenantConnection } = require('./config/connectionManager');

(async () => {
  for (const tenant of ['nib_insurance', 'yashtech']) {
    try {
      const db = await getTenantConnection(tenant);
      const [rows] = await db.query(
        "SELECT id, empId, name, date, checkIn, checkOut, workingHours, status, verification_method FROM daily_attendance WHERE date = CURDATE() ORDER BY id DESC"
      );
      console.log(`=== TODAY'S ATTENDANCE IN ${tenant} (${rows.length} rows) ===`);
      console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
      console.error(`Error in ${tenant}:`, e.message);
    }
  }
  process.exit(0);
})();
