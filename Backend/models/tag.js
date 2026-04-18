const pool = require('../config/db.js');

const Tag = {
  // ============================================
  // 1. Global Tags (ตาราง tags)
  // ============================================

  // ดึงแท็กทั้งหมดพร้อมจำนวนลูกค้าที่ใช้งาน
  findAllGlobalTags: async () => {
    const [rows] = await pool.query(`
      SELECT t.id, t.text, t.color, t.created_at,
             COUNT(ct.customer_id) AS count
      FROM tags t
      LEFT JOIN customer_tags ct ON t.id = ct.tag_id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `);
    return rows;
  },

  // สร้างแท็กส่วนกลางใหม่
  createGlobalTag: async (text, color) => {
    const [result] = await pool.query(
      'INSERT INTO tags (text, color) VALUES (?, ?)',
      [text, color || '#6b7280']
    );
    return result.insertId;
  },

  // อัปเดตชื่อ/สีแท็ก
  updateGlobalTag: async (id, text, color) => {
    const [result] = await pool.query(
      'UPDATE tags SET text = ?, color = ? WHERE id = ?',
      [text, color, id]
    );
    return result.affectedRows > 0;
  },

  // ลบแท็ก (ON DELETE CASCADE จะลบ customer_tags อัตโนมัติ)
  deleteGlobalTag: async (id) => {
    const [result] = await pool.query('DELETE FROM tags WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  // หาแท็กจากหม่ายเลขไอดี
  findById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM tags WHERE id = ?', [id]);
    return rows[0] || null;
  },

  // หาแท็กที่มีชื่อเดียวกัน (case-insensitive) — ใช้ใน findOrCreate
  findByText: async (text) => {
    const [rows] = await pool.query(
      'SELECT * FROM tags WHERE LOWER(text) = LOWER(?)',
      [text]
    );
    return rows[0] || null;
  },

  // ============================================
  // 2. Customer Tags (ตาราง customer_tags)
  // ============================================

  // ดึงแท็กทั้งหมดที่ลูกค้า 1 คนมี (JOIN กับตาราง tags)
  findTagsByCustomerId: async (customerId) => {
    const [rows] = await pool.query(`
      SELECT t.id, t.text, t.color
      FROM tags t
      INNER JOIN customer_tags ct ON t.id = ct.tag_id
      WHERE ct.customer_id = ?
      ORDER BY ct.created_at ASC
    `, [customerId]);
    return rows;
  },

  // ติดแท็กให้ลูกค้า — ถ้ามีอยู่แล้วก็ไม่ทำซ้ำ (INSERT IGNORE)
  addTagToCustomer: async (customerId, tagId) => {
    await pool.query(
      'INSERT IGNORE INTO customer_tags (customer_id, tag_id) VALUES (?, ?)',
      [customerId, tagId]
    );
  },

  // ถอดแท็กออกจากลูกค้า
  removeTagFromCustomer: async (customerId, tagId) => {
    const [result] = await pool.query(
      'DELETE FROM customer_tags WHERE customer_id = ? AND tag_id = ?',
      [customerId, tagId]
    );
    return result.affectedRows > 0;
  },

  // ดึงแท็กของลูกค้าทุกคนในครั้งเดียว (batch load สำหรับ AllChat)
  // คืนค่า: { [customer_id]: [{ id, text, color }] }
  findAllCustomerTagMap: async () => {
    const [rows] = await pool.query(`
      SELECT ct.customer_id, t.id, t.text, t.color
      FROM customer_tags ct
      INNER JOIN tags t ON t.id = ct.tag_id
      ORDER BY ct.customer_id, ct.created_at ASC
    `);
    const map = {};
    rows.forEach(({ customer_id, id, text, color }) => {
      if (!map[customer_id]) map[customer_id] = [];
      map[customer_id].push({ id, text, color });
    });
    return map;
  },
};

module.exports = Tag;
