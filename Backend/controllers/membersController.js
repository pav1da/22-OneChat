// =============================================
// Members Controller
// ดึงข้อมูลสมาชิกจากตาราง EMP ใน Database
// ใช้ในหน้า Member (Frontend) เพื่อแสดงรายชื่อสมาชิกทั้งหมด
// =============================================

const pool = require('../config/db.js');

// GET /api/members — ดึงข้อมูลสมาชิกทั้งหมด (ไม่รวม password)
exports.getAllMembers = async (req, res) => {
    try {
        // ใช้ SELECT * เพื่อดึงทุก field จากตาราง EMP แล้วลบ password ออก
        const [rows] = await pool.query('SELECT * FROM EMP ORDER BY created_at ASC');
        // ลบ password ออกก่อนส่งกลับ
        const members = rows.map(({ password, ...rest }) => rest);
        res.json(members);
    } catch (err) {
        console.error('GetAllMembers error:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสมาชิก' });
    }
};

// GET /api/members/:id — ดึงข้อมูลสมาชิกรายคน
exports.getMemberById = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM EMP WHERE emp_id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบสมาชิก' });
        }
        // ลบ password ออกก่อนส่งกลับ
        const { password, ...member } = rows[0];
        res.json(member);
    } catch (err) {
        console.error('GetMemberById error:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
};
