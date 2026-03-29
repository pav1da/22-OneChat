require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
    console.log('Connecting to:', process.env.DB_HOST, process.env.DB_PORT, process.env.DB_NAME);
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            connectTimeout: 10000
        });
        console.log('Connected!');
        
        const [rows] = await connection.query('SELECT id, name, type, created_by FROM templates LIMIT 3');
        console.log('Templates:', JSON.stringify(rows, null, 2));
        
        await connection.end();
    } catch(err) {
        console.error('ERROR:', err.message);
    }
    process.exit(0);
})();
