const pool = require('../config/db.js');

const Note = {
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
