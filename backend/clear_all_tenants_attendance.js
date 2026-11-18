const mysql = require('mysql2/promise');

async function run() {
    const dbs = [
        'aarogya',
        'aarogya_homeopathy_clinic',
        'admin_0001',
        'admin_0002',
        'admin_0003',
        'aman_aman',
        'defaultdb',
        'nib_insurance',
        'super_admin_db',
        'system_admin_db',
        'system_master_db',
        'vedant_devotions',
        'yashtech'
    ];
    
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: ''
    });

    for (const db of dbs) {
        try {
            const [result] = await connection.execute(`DELETE FROM \`${db}\`.daily_attendance`);
            console.log(`Cleared ${result.affectedRows} rows from ${db}.daily_attendance`);
        } catch (e) {
            console.log(`Could not clear ${db}.daily_attendance: ${e.message}`);
        }
    }
    
    await connection.end();
}

run().catch(console.error);
