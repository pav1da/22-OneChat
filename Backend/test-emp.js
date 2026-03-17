// ทดสอบดึงข้อมูลจากตาราง EMP ใน DB onechat
const pool = require('./config/db');

async function testEMP() {
  try {
    console.log('🔌 กำลังเชื่อมต่อ MySQL...');
    
    // ดึงข้อมูลทั้งหมดจากตาราง EMP
    const [rows] = await pool.query('SELECT * FROM EMP');
    
    console.log('✅ เชื่อมต่อสำเร็จ!');
    console.log(`📊 จำนวนข้อมูลในตาราง EMP: ${rows.length} rows`);
    console.log('-----------------------------------');
    
    if (rows.length > 0) {
      // แสดง columns
      console.log('📋 Columns:', Object.keys(rows[0]).join(', '));
      console.log('-----------------------------------');
      
      // แสดงข้อมูลทั้งหมด
      console.table(rows);
    } else {
      console.log('⚠️ ตาราง EMP ไม่มีข้อมูล (empty table)');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testEMP();
