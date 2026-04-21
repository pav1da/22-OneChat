const pool = require('../config/db.js');

const User = {
    // ค้นหา user จาก email
    findByEmail: async (email) => {
        const [rows] = await pool.query('SELECT * FROM EMP WHERE email = ?', [email]);
        return rows[0] || null;
    },

    // ค้นหา user จาก emp_id
    findById: async (id) => {
        const [rows] = await pool.query('SELECT * FROM EMP WHERE emp_id = ?', [id]);
        if (!rows[0]) return null;
        const { password, ...userWithoutPassword } = rows[0];
        return userWithoutPassword;
    },

    // ค้นหา user จาก emp_id (รวม password สำหรับตรวจสอบ)
    findByIdWithPassword: async (id) => {
        const [rows] = await pool.query('SELECT * FROM EMP WHERE emp_id = ?', [id]);
        return rows[0] || null;
    },

    // ค้นหา user จาก username
    findByUsername: async (username) => {
        const [rows] = await pool.query('SELECT * FROM EMP WHERE username = ?', [username]);
        return rows[0] || null;
    },

    // สร้าง user ใหม่
    create: async ({ username, email, password }) => {
        const [result] = await pool.query(
            'INSERT INTO EMP (username, display_name, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [username, username, email, password, 'staff']
        );
        return result.insertId;
    },

    // อัพเดท username
    updateUsername: async (id, username) => {
        const [result] = await pool.query(
            'UPDATE EMP SET username = ? WHERE emp_id = ?',
            [username, id]
        );
        return result.affectedRows > 0;
    },

    // อัพเดท email
    updateEmail: async (id, email) => {
        const [result] = await pool.query(
            'UPDATE EMP SET email = ? WHERE emp_id = ?',
            [email, id]
        );
        return result.affectedRows > 0;
    },

    // อัพเดท phone
    updatePhone: async (id, phone) => {
        const [result] = await pool.query(
            'UPDATE EMP SET phone = ? WHERE emp_id = ?',
            [phone, id]
        );
        return result.affectedRows > 0;
    },

    // อัพเดท password
    updatePassword: async (id, password) => {
        const [result] = await pool.query(
            'UPDATE EMP SET password = ? WHERE emp_id = ?',
            [password, id]
        );
        return result.affectedRows > 0;
    },

    // ลบ user (ลบข้อมูลที่เกี่ยวข้องก่อน เพื่อหลีกเลี่ยง foreign key constraint)
    deleteById: async (id) => {
        // ลบจาก team_members ก่อน
        await pool.query('DELETE FROM team_members WHERE emp_id = ?', [id]);
        // แล้วค่อยลบจาก EMP
        const [result] = await pool.query(
            'DELETE FROM EMP WHERE emp_id = ?',
            [id]
        );
        return result.affectedRows > 0;
    },

    // อัพเดท avatar
    updateAvatar: async (id, imageUrl) => {
        const [result] = await pool.query(
            'UPDATE EMP SET image = ? WHERE emp_id = ?',
            [imageUrl, id]
        );
        return result.affectedRows > 0;
    },

    // อัพเดท display_name
    updateDisplayName: async (id, displayName) => {
        const [result] = await pool.query(
            'UPDATE EMP SET display_name = ? WHERE emp_id = ?',
            [displayName, id]
        );
        return result.affectedRows > 0;
    },

    // อัพเดท member โดย admin/manager (display_name + password)
    updateMemberByAdmin: async (id, { display_name, password }) => {
        if (display_name !== undefined && password) {
            const [result] = await pool.query(
                'UPDATE EMP SET display_name = ?, password = ? WHERE emp_id = ?',
                [display_name, password, id]
            );
            return result.affectedRows > 0;
        } else if (display_name !== undefined) {
            const [result] = await pool.query(
                'UPDATE EMP SET display_name = ? WHERE emp_id = ?',
                [display_name, id]
            );
            return result.affectedRows > 0;
        } else if (password) {
            const [result] = await pool.query(
                'UPDATE EMP SET password = ? WHERE emp_id = ?',
                [password, id]
            );
            return result.affectedRows > 0;
        }
        return false;
    },

    // ดึง user ทั้งหมด (ไม่รวม password)
    findAll: async () => {
        const [rows] = await pool.query('SELECT * FROM EMP');
        return rows.map(({ password, ...rest }) => rest);
    }
};

module.exports = User;
