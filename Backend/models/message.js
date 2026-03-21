const pool = require('../config/db');

const Message = {
    /**
     * สร้างข้อความใหม่สำหรับส่งหรือรับ
     * @param {Object} data 
     * @param {number} data.customer_id - ID ของลูกค้าในตาราง customers
     * @param {string} data.message_type - ประเภท ('text', 'image', 'sticker', 'template')
     * @param {string|number} data.message_text - ข้อความ, URL รูปภาพ, หรือ Template ID (ถ้าเป็น template)
     */
    create: async ({ customer_id, message_type, message_text }) => {
        const [result] = await pool.query(
            'INSERT INTO chat_messages (customer_id, message_type, message_text) VALUES (?, ?, ?)',
            [customer_id, message_type, message_text]
        );
        return result.insertId;
    },

    // แสดงข้อความทั้งหมดของ customer คนใดคนหนึ่ง
    findByCustomerId: async (customer_id) => {
        const [rows] = await pool.query(
            'SELECT * FROM chat_messages WHERE customer_id = ? ORDER BY created_at ASC',
            [customer_id]
        );
        return rows;
    },

    // อัพเดทสถานะการอ่าน
    markAsRead: async (customer_id) => {
        const [result] = await pool.query(
            'UPDATE chat_messages SET is_read = 1 WHERE customer_id = ? AND is_read = 0',
            [customer_id]
        );
        return result.affectedRows;
    }
};

module.exports = Message;
