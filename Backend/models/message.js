const pool = require('../config/db.js');

// Helper: แปลง row ดิบจาก DB ให้อยู่ในรูปแบบที่ Frontend ใช้
const transformRow = (row) => {
  let imageUrl = null;
  if (row.message_type === 'image') {
    // เช็คว่า message_text เป็น URL (http/https) หรือไม่
    if (row.message_text && (row.message_text.startsWith('http://') || row.message_text.startsWith('https://'))) {
      imageUrl = row.message_text; // ใช้ URL จาก Cloudinary ได้เลย
    } else {
      imageUrl = `/uploads/chat-images/${row.message_text}`; // ใช้ path เดิมสำหรับรูปเก่าในเครื่อง
    }
  }

  return {
    id: row.message_id,
    customer_id: row.customer_id,
    sender: row.sender || 'customer',
    message_type: row.message_type,
    text: row.message_type === 'text' ? row.message_text : null,
    image: row.message_type === 'image' ? imageUrl
         : row.message_type === 'sticker' ? row.message_text
         : null,
    created_at: row.created_at,
  };
};

const Message = {
  // ดึงข้อความทั้งหมดของลูกค้า
  findByCustomerId: async (customerId) => {
    const [rows] = await pool.query(
      'SELECT message_id, customer_id, sender, message_type, message_text, created_at FROM chat_messages WHERE customer_id = ? ORDER BY created_at ASC',
      [customerId]
    );
    return rows.map(transformRow);
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
      grouped[cid].push(transformRow(row));
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
