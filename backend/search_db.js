const mysql = require('mysql2/promise');
async function run() {
    const c = await mysql.createConnection({host:'localhost',user:'root',password:''});
    const [rows] = await c.query('SHOW DATABASES');
    console.log(rows.map(r => Object.values(r)[0]).filter(d => !['information_schema', 'mysql', 'performance_schema', 'sys'].includes(d)));
    process.exit(0);
}
run();
