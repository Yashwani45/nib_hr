const mysql = require('mysql2/promise');

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'yashtech'
    });

    const [cols] = await connection.execute('SHOW COLUMNS FROM employees');
    console.log(cols.map(c => c.Field).join(', '));
    await connection.end();
}

checkSchema().catch(console.error);
