const { Attendance } = require('./models');

async function clearAttendance() {
    try {
        await Attendance.destroy({
            where: {}
        });
        
        console.log('Deleted all attendance records.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

clearAttendance();
