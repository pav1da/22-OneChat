const db = require('../config/db');


//คิดว่าจะให้แอดมิน เพิ่มลบ แก้ไขโน้ตได้นะ เพราะถ้าusers ใช้งานอาจจะมีโน้ตเยอะเกินไปทำให้มีปัญหาเวลาจัดการได้ เดี๋ยวขอดูก่อนว่าจะทำดีไหม
const Note = {
    // สร้าง Note ใหม่
    create: async ({ user, content, created_by }) => {
        const [result] = await db.query(
            'INSERT INTO notes (user, content, created_by) VALUES (?, ?, ?)',
            [user, content, created_by]
        );
        return result.insertId;
    },

    // ค้นหา Note ทั้งหมด (เรียงจากใหม่ไปเก่า)
    findAll: async () => {
        const [rows] = await db.query('SELECT * FROM notes ORDER BY created_at DESC');
        return rows;
    },

    // ค้นหา Note ตาม ID
    findById: async (id) => {
        const [rows] = await db.query('SELECT * FROM notes WHERE id = ?', [id]);
        return rows[0] || null;
    },

    // อัพเดท Note
    update: async (id, { user, content }) => {
        const [result] = await db.query(
            'UPDATE notes SET user = ?, content = ? WHERE id = ?',
            [user, content, id]
        );
        return result.affectedRows > 0;
    },

    // ลบ Note
    deleteById: async (id) => {
        const [result] = await db.query('DELETE FROM notes WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
};

module.exports = Note;
