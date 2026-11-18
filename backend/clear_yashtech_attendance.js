const mysql = require('mysql2/promise');

async function clearYashtechAttendance() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'yashtech'
    });

    const [result] = await connection.execute('DELETE FROM daily_attendance');
    console.log('Deleted rows:', result.affectedRows);
    
    await connection.end();
}

clearYashtechAttendance().catch(console.error);
