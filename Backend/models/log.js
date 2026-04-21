const db = require('../config/db.js');

const Log = {
    // ดึง Log ทั้งหมด พร้อมกรองเงื่อนไขและดึงรูปโปรไฟล์พนักงาน
    findAll: async (filters) => {
        let sql = `
            SELECT LOGS.*, EMP.image AS current_avatar 
            FROM LOGS 
            LEFT JOIN EMP ON LOGS.user = EMP.username 
            WHERE 1=1
        `;
        let orderBy = ' ORDER BY created_at DESC';
        let params = [];

        if (filters.user) {
            sql += ' AND LOGS.user = ?';
            params.push(filters.user);
        }

        if (filters.action) {
            sql += ' AND LOGS.action = ?';
            params.push(filters.action);
        }

        const [rows] = await db.query(sql + orderBy, params);
        return rows.map(row => {
            const { current_avatar, ...rest } = row;
            return {
                ...rest,
                avatar: current_avatar || rest.avatar || null
            };
        });
    },

    // สร้าง Log ใหม่บันทึกกิจกรรมลงในระบบ
    create: async ({ user, avatar, action, target, details }) => {
        const sql = `
      INSERT INTO LOGS (user, avatar, action, target, details)
      VALUES (?, ?, ?, ?, ?)
    `;
        const [result] = await db.query(sql, [user, avatar, action, target, details]);
        return result;
    }
};

module.exports = Log;