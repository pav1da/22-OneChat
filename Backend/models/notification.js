const db = require('../config/db.js');

// Auto-migrate: เพิ่ม column updated_at ถ้ายังไม่มี และเปลี่ยน text เป็น TEXT type
(async () => {
    try {
        // 1. เช็ค updated_at column
        const [cols] = await db.query(
            `SHOW COLUMNS FROM notifications LIKE 'updated_at'`
        );
        if (cols.length === 0) {
            await db.query(
                `ALTER TABLE notifications ADD COLUMN updated_at DATETIME DEFAULT NULL`
            );
            console.log('notifications: added updated_at column');
        } else {
            console.log('notifications: updated_at column already exists');
        }

        // 2. เปลี่ยน text column จาก VARCHAR เป็น TEXT (รองรับ JSON array ยาวๆ)
        const [textCol] = await db.query(
            `SHOW COLUMNS FROM notifications WHERE Field = 'text'`
        );
        if (textCol.length > 0 && textCol[0].Type.startsWith('varchar')) {
            await db.query(
                `ALTER TABLE notifications MODIFY COLUMN text TEXT NOT NULL`
            );
            console.log('notifications: changed text column to TEXT type');
        }
    } catch (err) {
        console.error('Migration error:', err.message);
    }
})();

const Notification = {
    // สร้างการแจ้งเตือนใหม่
    create: async ({ text, sender_id, receiver_id, type, ref_id, ref_type }) => {
        const [result] = await db.query(
            `INSERT INTO notifications 
       (text, sender_id, receiver_id, type, ref_id, ref_type) 
       VALUES (?, ?, ?, ?, ?, ?)`,
            [text, sender_id, receiver_id, type, ref_id, ref_type]
        );
        return result;
    },

    // ดึงข้อมูลการแจ้งเตือนทั้งหมดของผู้ใช้รายบุคคล
    getByUser: async (userId) => {
        try {
            const [rows] = await db.query(
                `SELECT n.*, 
                        e.username AS sender_name, 
                        e.username AS sender_username,
                        COALESCE(c.displayname, c.cus_name) AS customer_name,
                        c.cus_picture AS customer_avatar,
                        ch.platform AS platform,
                        ch.channel_name AS shop_name,
                        ch.id AS channel_id
                 FROM notifications n
                 LEFT JOIN EMP e ON n.sender_id = e.emp_id
                 LEFT JOIN customers c ON n.ref_id = c.cus_id AND n.ref_type = 'customer_message'
                 LEFT JOIN channels ch ON c.channel_id = ch.id
                 WHERE n.receiver_id = ? 
                 ORDER BY COALESCE(n.updated_at, n.created_at) DESC`,
                [userId]
            );
            return rows;
        } catch (err) {
            // Fallback: ถ้า updated_at ยังไม่มี
            const [rows] = await db.query(
                `SELECT n.*, 
                        e.username AS sender_name, 
                        e.username AS sender_username
                 FROM notifications n
                 LEFT JOIN EMP e ON n.sender_id = e.emp_id
                 WHERE n.receiver_id = ? 
                 ORDER BY n.created_at DESC`,
                [userId]
            );
            return rows;
        }
    },

    // ทำเครื่องหมายการแจ้งเตือนว่าอ่านแล้วตาม ID
    markAsRead: async (id) => {
        const [result] = await db.query(
            `UPDATE notifications 
       SET is_read = true 
       WHERE id = ?`,
            [id]
        );
        return result;
    },

    // ทำเครื่องหมายการแจ้งเตือนทั้งหมดของผู้ใช้ว่าอ่านแล้ว
    markAllAsRead: async (userId) => {
        const [result] = await db.query(
            `UPDATE notifications 
       SET is_read = true 
       WHERE receiver_id = ? AND is_read = false`,
            [userId]
        );
        return result;
    },

    // ดึงจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน
    getUnreadCount: async (userId) => {
        const [rows] = await db.query(
            `SELECT text FROM notifications 
       WHERE receiver_id = ? AND is_read = false`,
            [userId]
        );
        let count = 0;
        for (const row of rows) {
            try {
                const messages = JSON.parse(row.text);
                count += Array.isArray(messages) ? messages.length : 1;
            } catch {
                count += 1;
            }
        }
        return { count };
    },

    // หา notification ที่ยังไม่อ่านของลูกค้าคนนี้ (สำหรับ grouping)
    // ค้นหาการแจ้งเตือนที่ยังไม่ได้อ่านของลูกค้ารายเจาะจง (ใช้จัดการ grouping)
    findUnreadByCustomer: async (customerId, receiverId) => {
        const [rows] = await db.query(
            `SELECT * FROM notifications 
       WHERE ref_id = ? AND ref_type = 'customer_message' 
       AND receiver_id = ? AND is_read = false
       ORDER BY created_at DESC LIMIT 1`,
            [customerId, receiverId]
        );
        return rows[0] || null;
    },

    // อัพเดท notification ด้วยข้อความใหม่ (เพิ่มข้อความเข้าไป)
    // อัปเดตการแจ้งเตือนเดิมด้วยข้อความใหม่ (Append ข้อความเข้าไปใน Array JSON)
    updateWithNewMessage: async (id, newMessage) => {
        // ดึง notification ปัจจุบัน
        const current = await Notification.getById(id);
        if (!current) return null;
        
        // Parse messages array (ถ้าเป็น string ให้แปลงเป็น array)
        let messages = [];
        try {
            messages = typeof current.text === 'string' 
                ? JSON.parse(current.text) 
                : current.text;
            if (!Array.isArray(messages)) {
                messages = [current.text];
            }
        } catch {
            messages = [current.text];
        }
        
        // เพิ่มข้อความใหม่
        messages.push(newMessage);
        
        try {
            const [result] = await db.query(
                `UPDATE notifications 
           SET text = ?, updated_at = NOW() 
           WHERE id = ?`,
                [JSON.stringify(messages), id]
            );
            return result;
        } catch {
            // Fallback: ถ้า updated_at ยังไม่มี
            const [result] = await db.query(
                `UPDATE notifications 
           SET text = ? 
           WHERE id = ?`,
                [JSON.stringify(messages), id]
            );
            return result;
        }
    },

    // ดึง notification by ID
    // ดึงข้อมูลการแจ้งเตือนรายข้อความตาม ID
    getById: async (id) => {
        const [rows] = await db.query(
            `SELECT * FROM notifications WHERE id = ?`,
            [id]
        );
        return rows[0] || null;
    }
};

module.exports = Notification;