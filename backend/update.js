const { Sequelize } = require('sequelize');
async function go() {
    const db = new Sequelize('nib_insurance', 'root', '', { host: 'localhost', dialect: 'mysql' });
    await db.query("UPDATE daily_attendance SET emp_id = empId, check_in = checkIn, check_out = checkOut, working_hours = workingHours WHERE date = '2026-09-28'");
    process.exit(0);
}
go();
