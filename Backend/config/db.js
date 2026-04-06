require('dotenv').config();
const mysql = require('mysql2/promise');


// สร้างการเชื่อมต่อแบบ Pool (รองรับ Promise และ async/await)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    timezone: '+07:00',
    dateStrings: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ตรวจสอบการเชื่อมต่อเมื่อเริ่มต้น
pool.getConnection()
    .then(connection => {
        console.log('Connected to MySQL successfully!');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to MySQL:', err.message);
    });

module.exports = pool;