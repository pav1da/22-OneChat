const pool = require('../config/db.js');

// Auto-migrate: สร้างตาราง customer_tags ถ้ายังไม่มี
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customer_tags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        text VARCHAR(100) NOT NULL,
        color VARCHAR(20) NOT NULL DEFAULT '#3b82f6',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_customer_id (customer_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('customer_tags: table ready');
  } catch (err) {
    console.error('customer_tags migration error:', err.message);
  }
})();

const Tag = {
  // ดึงแท็กทั้งหมดของลูกค้า
  findByCustomerId: async (customerId) => {
    const [rows] = await pool.query(
      'SELECT id, customer_id, text, color, created_at FROM customer_tags WHERE customer_id = ? ORDER BY created_at ASC',
      [customerId]
    );
    return rows;
  },

  // ดึงแท็กทั้งหมด (สำหรับ bulk load)
  findAll: async () => {
    const [rows] = await pool.query(
      'SELECT id, customer_id, text, color, created_at FROM customer_tags ORDER BY created_at ASC'
    );
    return rows;
  },

  // สร้างแท็กใหม่
  create: async ({ customer_id, text, color }) => {
    const [result] = await pool.query(
      'INSERT INTO customer_tags (customer_id, text, color) VALUES (?, ?, ?)',
      [customer_id, text, color || '#3b82f6']
    );
    return result.insertId;
  },

  // ลบแท็ก
  deleteById: async (id) => {
    const [result] = await pool.query(
      'DELETE FROM customer_tags WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },
};

module.exports = Tag;
