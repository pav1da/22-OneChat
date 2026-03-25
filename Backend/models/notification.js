const db = require('../config/db.js');

const Notification = {
    create: async ({ text, sender_id, receiver_id, type, ref_id, ref_type }) => {
        const [result] = await db.query(
            `INSERT INTO notifications 
       (text, sender_id, receiver_id, type, ref_id, ref_type) 
       VALUES (?, ?, ?, ?, ?, ?)`,
            [text, sender_id, receiver_id, type, ref_id, ref_type]
        );
        return result;
    },

    getByUser: async (userId) => {
        const [rows] = await db.query(
            `SELECT n.*, 
                    e.name AS sender_name, 
                    e.username AS sender_username
             FROM notifications n
             LEFT JOIN EMP e ON n.sender_id = e.emp_id
             WHERE n.receiver_id = ? 
             ORDER BY n.created_at DESC`,
            [userId]
        );
        return rows;
    },

    markAsRead: async (id) => {
        const [result] = await db.query(
            `UPDATE notifications 
       SET is_read = true 
       WHERE id = ?`,
            [id]
        );
        return result;
    },

    getUnreadCount: async (userId) => {
        const [rows] = await db.query(
            `SELECT COUNT(*) AS count 
       FROM notifications 
       WHERE receiver_id = ? AND is_read = false`,
            [userId]
        );
        return rows[0];
    }
};

module.exports = Notification;