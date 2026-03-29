const pool = require('../config/db.js');

const Note = {
  // ดึงโน้ตทั้งหมด (สำหรับหน้า Notes รวม)
  findAll: async () => {
    const [rows] = await pool.query(
      `SELECT n.id, n.customer_id, n.text AS content, n.author, n.created_at,
              c.display_name AS user,
              c.picture_url AS customer_avatar
       FROM notes n
       LEFT JOIN customers c ON n.customer_id = c.id
       ORDER BY n.created_at DESC`
    );
    return rows;
  },

  // ดึงโน้ตตาม customer_id
  findByCustomerId: async (customerId) => {
    const [rows] = await pool.query(
      'SELECT id, customer_id, text, author, created_at FROM notes WHERE customer_id = ? ORDER BY created_at DESC',
      [customerId]
    );
    return rows;
  },

  // สร้างโน้ตใหม่
  create: async ({ customer_id, text, author }) => {
    const [result] = await pool.query(
      'INSERT INTO notes (customer_id, text, author) VALUES (?, ?, ?)',
      [customer_id, text, author]
    );
    return result.insertId;
  },

  // แก้ไขโน้ต
  update: async (id, text) => {
    const [result] = await pool.query(
      'UPDATE notes SET text = ? WHERE id = ?',
      [text, id]
    );
    return result.affectedRows > 0;
  },

  // ลบโน้ต
  delete: async (id) => {
    const [result] = await pool.query(
      'DELETE FROM notes WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },
};

module.exports = Note;
