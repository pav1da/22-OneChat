const pool = require('../config/db.js');

// Helper: แปลง row ดิบจาก DB ให้อยู่ในรูปแบบที่ Frontend ใช้
const transformRow = (row) => {
    let imageUrl = null;
    if (row.message_type === 'image') {
        if (row.message_text && (row.message_text.startsWith('http://') || row.message_text.startsWith('https://'))) {
            imageUrl = row.message_text;
        } else {
            imageUrl = `/uploads/chat-images/${row.message_text}`;
        }
    }

    return {
        id: row.message_id,
        customer_id: row.customer_id,
        sender: row.sender || 'customer',
        message_type: row.message_type,
        text: (row.message_type === 'text' || row.message_type === 'carousel') ? row.message_text : null,
        image: row.message_type === 'image' ? imageUrl
            : row.message_type === 'sticker' ? row.message_text
                : null,
        created_at: row.created_at,
        // Reply / Quote fields
        reply_to_id: row.reply_to_id || null,
        reply_preview_text: row.reply_preview_text || null,
        reply_preview_image: row.reply_preview_image || null,
        line_quote_token: row.line_quote_token || null,
    };
};

const SELECT_COLS = 'message_id, customer_id, sender, message_type, message_text, created_at, reply_to_id, reply_preview_text, reply_preview_image, line_quote_token';

const Message = {
    // ดึงข้อความทั้งหมดของลูกค้า
    findByCustomerId: async (customerId) => {
        const [rows] = await pool.query(
            `SELECT ${SELECT_COLS} FROM chat_messages WHERE customer_id = ? ORDER BY created_at ASC`,
            [customerId]
        );
        return rows.map(transformRow);
    },

    // ดึงข้อความทั้งหมดจัดกลุ่มตาม customer_id
    findAllGrouped: async () => {
        const [rows] = await pool.query(
            `SELECT ${SELECT_COLS} FROM chat_messages ORDER BY created_at ASC`
        );
        const grouped = {};
        for (const row of rows) {
            const cid = row.customer_id;
            if (!grouped[cid]) grouped[cid] = [];
            grouped[cid].push(transformRow(row));
        }
        return grouped;
    },

    // สร้างข้อความใหม่ (รองรับ reply_to_id และ line_quote_token)
    create: async ({ customer_id, sender, message_type, message_text, reply_to_id, reply_preview_text, reply_preview_image, line_quote_token }) => {
        const [result] = await pool.query(
            'INSERT INTO chat_messages (customer_id, sender, message_type, message_text, reply_to_id, reply_preview_text, reply_preview_image, line_quote_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [customer_id, sender || 'own', message_type || 'text', message_text, reply_to_id || null, reply_preview_text || null, reply_preview_image || null, line_quote_token || null]
        );
        return result.insertId;
    },

    // ดึง quote_token
    getQuoteTokenById: async (messageId) => {
        const [rows] = await pool.query('SELECT line_quote_token FROM chat_messages WHERE message_id = ? LIMIT 1', [messageId]);
        return rows.length > 0 ? rows[0].line_quote_token : null;
    },
};

module.exports = Message;
