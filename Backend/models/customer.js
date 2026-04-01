const pool = require('../config/db.js');

const Customer = {
  // ดึงลูกค้าทั้งหมด
  findAll: async () => {
    const [rows] = await pool.query(
      'SELECT cus_id, cus_name, platform, platform_id, channel_id, displayname, cus_picture, updated_at FROM customers ORDER BY updated_at DESC'
    );
    return rows;
  },

  // ดึงลูกค้าจาก ID
  findById: async (id) => {
    const [rows] = await pool.query(
      'SELECT cus_id, cus_name, platform, platform_id, channel_id, displayname, cus_picture, updated_at FROM customers WHERE cus_id = ?',
      [id]
    );
    return rows[0] || null;
  },

  // อัปเดตชื่อลูกค้า
  updateName: async (id, name) => {
    const [result] = await pool.query(
      'UPDATE customers SET cus_name = ? WHERE cus_id = ?',
      [name, id]
    );
    return result.affectedRows > 0;
  },
};

module.exports = Customer;
