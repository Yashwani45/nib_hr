const mysql = require('mysql2/promise');

async function insertCurrentData() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'yashtech'
    });

    const [employees] = await connection.execute('SELECT id, employeeCode, emp_code, firstName, lastName, employeeName, employee_name, company, department, shift FROM employees LIMIT 5');
    
    if (employees.length === 0) {
        console.log("No employees found to insert data for.");
        return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    
    for (const emp of employees) {
        const empCode = emp.employeeCode || emp.emp_code || emp.id;
        const empName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.employeeName || emp.employee_name || 'Employee';
        
        await connection.execute(`
            INSERT INTO daily_attendance 
            (empId, name, date, checkIn, checkOut, workingHours, status, lateComing, earlyLeaving, overtime, company, branch, department, shift, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
            empCode, 
            empName, 
            todayStr, 
            "09:00:00", 
            "18:00:00", 
            9.0, 
            "Present", 
            0, 
            0, 
            0,
            emp.company || "YashTech",
            "Headquarters",
            emp.department || "Operations",
            emp.shift || "General Shift"
        ]);
        console.log(`Inserted current data for ${empName} (${empCode})`);
    }

    await connection.end();
}

insertCurrentData().catch(console.error);
