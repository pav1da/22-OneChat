const pool = require('../config/db.js');

const Message = {
  // ดึงข้อความทั้งหมดของลูกค้า
  findByCustomerId: async (customerId) => {
    const [rows] = await pool.query(
      'SELECT message_id, customer_id, sender, message_type, message_text, created_at FROM chat_messages WHERE customer_id = ? ORDER BY created_at ASC',
      [customerId]
    );
    return rows;
  },

  // ดึงข้อความทั้งหมดจัดกลุ่มตาม customer_id
  findAllGrouped: async () => {
    const [rows] = await pool.query(
      'SELECT message_id, customer_id, sender, message_type, message_text, created_at FROM chat_messages ORDER BY created_at ASC'
    );

    // จัดกลุ่มข้อความตาม customer_id
    const grouped = {};
    for (const row of rows) {
      const cid = row.customer_id;
      if (!grouped[cid]) grouped[cid] = [];
      grouped[cid].push({
        id: row.id,
        sender: row.sender || 'customer',
        message_type: row.message_type,
        text: row.message_type === 'text' ? row.message_text : null,
        image: row.message_type === 'image' ? `/uploads/chat-images/${row.message_text}`
             : row.message_type === 'sticker' ? row.message_text
             : null,
        created_at: row.created_at,
      });
    }
    return grouped;
  },

  // สร้างข้อความใหม่
  create: async ({ customer_id, sender, message_type, message_text }) => {
    const [result] = await pool.query(
      'INSERT INTO chat_messages (customer_id, sender, message_type, message_text) VALUES (?, ?, ?, ?)',
      [customer_id, sender || 'own', message_type || 'text', message_text]
    );
    return result.insertId;
  },
};

module.exports = Message;
