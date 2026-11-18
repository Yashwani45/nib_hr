const { Attendance } = require('../backend/models');
const { Op } = require('sequelize');

async function clearAttendance() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const result = await Attendance.destroy({
            where: {
                date: today
            }
        });
        
        console.log(`Deleted ${result} attendance records for today (${today}).`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

clearAttendance();
