const fs = require('fs');
const files = [
  "Frontend/src/components/OperationsAssets/AttendanceReportsAdmin.jsx",
  "Frontend/src/components/OperationsAssets/LeaveBalanceReports.jsx",
  "Frontend/src/components/OperationsAssets/LeaveDashboard.jsx",
  "Frontend/src/components/OperationsAssets/LeaveReports.jsx",
  "Frontend/src/components/OperationsAssets/MonthlyAttendance.jsx"
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/dbData\["employees"\]\s*\|\|\s*dbData\["employee_profile"\]\s*\|\|\s*\[\]/g, 'dbData["employees"] || dbData["employee_profile"] || dbData["Employee Profile"] || dbData["Employee"] || []');
  content = content.replace(/dbData\["employees"\]\s*\|\|\s*dbData\["employee_profile"\]\s*\|\|\s*dbData\["Employee Profile"\]\s*\|\|\s*\[\]/g, 'dbData["employees"] || dbData["employee_profile"] || dbData["Employee Profile"] || dbData["Employee"] || []');
  fs.writeFileSync(file, content);
}
console.log("Done.");
