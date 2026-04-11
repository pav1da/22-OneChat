const pool = require('../config/db.js');

// Auto-migrate: เพิ่ม column edited_by และ updated_at ถ้ายังไม่มี
(async () => {
  try {
    const [cols] = await pool.query(`SHOW COLUMNS FROM notes LIKE 'edited_by'`);
    if (cols.length === 0) {
      await pool.query(`ALTER TABLE notes ADD COLUMN edited_by VARCHAR(100) DEFAULT NULL`);
      console.log('notes: added edited_by column');
    }
    const [cols2] = await pool.query(`SHOW COLUMNS FROM notes LIKE 'updated_at'`);
    if (cols2.length === 0) {
      await pool.query(`ALTER TABLE notes ADD COLUMN updated_at DATETIME DEFAULT NULL`);
      console.log('notes: added updated_at column');
    }
  } catch (err) {
    console.error('Notes migration error:', err.message);
  }
})();

const Note = {
  // ดึงโน้ตทั้งหมด (สำหรับหน้า Notes รวม)
  findAll: async () => {
    const [rows] = await pool.query(
      `SELECT n.id, n.customer_id, n.text AS content, n.author, n.created_at,
              n.edited_by, n.updated_at,
              COALESCE(c.displayname, c.cus_name) AS user,
              c.cus_picture AS customer_avatar
       FROM notes n
       LEFT JOIN customers c ON n.customer_id = c.cus_id
       ORDER BY n.created_at DESC`
    );
    return rows;
  },

  // ดึงโน้ตตาม customer_id
  findByCustomerId: async (customerId) => {
    const [rows] = await pool.query(
      'SELECT id, customer_id, text, author, created_at, edited_by, updated_at FROM notes WHERE customer_id = ? ORDER BY created_at DESC',
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

  // ดึงโน้ตตาม ID (ใช้หลัง create/update เพื่อ emit socket)
  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT n.id, n.customer_id, n.text AS content, n.author, n.created_at,
              n.edited_by, n.updated_at,
              COALESCE(c.displayname, c.cus_name) AS user,
              c.cus_picture AS customer_avatar
       FROM notes n
       LEFT JOIN customers c ON n.customer_id = c.cus_id
       WHERE n.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  // แก้ไขโน้ต
  update: async (id, text, editedBy) => {
    const [result] = await pool.query(
      'UPDATE notes SET text = ?, edited_by = ?, updated_at = NOW() WHERE id = ?',
      [text, editedBy || null, id]
    );
    return result.affectedRows > 0;
  },

  // ลบโน้ต
  deleteById: async (id) => {
    const [result] = await pool.query(
      'DELETE FROM notes WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },

  delete: async (id) => {
    const [result] = await pool.query(
      'DELETE FROM notes WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },
};

module.exports = Note;
