const { sequelize } = require('../config/database');

async function inspectCols() {
  const [rows] = await sequelize.query('DESCRIBE `payslips`');
  const genBy = rows.find(r => r.Field === 'generated_by');
  console.log('generated_by type:', genBy);
  process.exit(0);
}

inspectCols();
