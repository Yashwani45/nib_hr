const mysql = require('mysql2/promise');
async function run() {
    const c = await mysql.createConnection({host:'localhost',user:'root',password:'',database:'yashtech'});
    const [rows] = await c.query('SELECT * FROM daily_attendance');
    console.log('Rows in yashtech:', rows.length);
    console.log(rows);
    process.exit(0);
}
run();
