require('dotenv').config();
const attendanceService = require('./services/operations/attendance.service');

async function main() {
  try {
    const nibAllowed = await attendanceService.getEmployeeAllowedMethods(null, 'nib_insurance');
    console.log('nib_insurance allowed:', nibAllowed);

    const yashAllowed = await attendanceService.getEmployeeAllowedMethods(null, 'yashtech');
    console.log('yashtech allowed:', yashAllowed);
  } catch (e) {
    console.error(e.message);
  } finally {
    process.exit(0);
  }
}
main();
