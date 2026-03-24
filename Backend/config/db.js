require('dotenv').config();
const mysql = require('mysql2/promise');

// ===== สร้างการเชื่อมต่อ MySQL =====
// รองรับทั้ง MYSQL_URL (Railway) และแยก field (local)
const poolConfig = process.env.MYSQL_URL
    ? {
        uri: process.env.MYSQL_URL,
        timezone: '+07:00',
        dateStrings: true,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
    }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        timezone: '+07:00',
        dateStrings: true,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
    };

const pool = mysql.createPool(poolConfig);

// ตรวจสอบการเชื่อมต่อเมื่อเริ่มต้น
pool.getConnection()
    .then(connection => {
        console.log('✅ Connected to MySQL successfully!');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Error connecting to MySQL:', err.message);
    });

module.exports = pool;