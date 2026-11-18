const { sequelize } = require('../config/database');
(async () => {
  try {
    const [cols] = await sequelize.query('SHOW COLUMNS FROM daily_attendance');
    console.log(cols.map(c => c.Field));
  } catch (e) {
    console.error(e.message);
  } finally {
    process.exit(0);
  }
})();
