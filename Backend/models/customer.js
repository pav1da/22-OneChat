const pool = require('../config/db.js');

const COLS = `c.cus_id, c.cus_name, c.displayname AS display_name, c.platform, c.platform_id, c.channel_id, c.cus_picture, c.status, c.assigned_to, c.updated_at, ch.channel_name`;

const Customer = {
  // ดึงข้อมูลลูกค้าทั้งหมดพร้อมข้อมูลช่องทางที่เชื่อมต่อ
  findAll: async () => {
    const [rows] = await pool.query(
      `SELECT ${COLS} FROM customers c LEFT JOIN channels ch ON c.channel_id = ch.id ORDER BY c.updated_at DESC`
    );
    return rows;
  },

  // ดึงข้อมูลลูกค้าตาม ID
  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT ${COLS} FROM customers c LEFT JOIN channels ch ON c.channel_id = ch.id WHERE c.cus_id = ?`, [id]
    );
    return rows[0] || null;
  },

  // อัปเดตชื่อแสดงผล (Display Name) ของลูกค้า
  updateName: async (id, name) => {
    const [r] = await pool.query('UPDATE customers SET displayname = ? WHERE cus_id = ?', [name, id]);
    return r.affectedRows > 0;
  },

  // อัปเดตสถานะของลูกค้า (เช่น 'ยังไม่เริ่ม', 'เสร็จสิ้น')
  updateStatus: async (id, status) => {
    const [r] = await pool.query('UPDATE customers SET status = ? WHERE cus_id = ?', [status, id]);
    return r.affectedRows > 0;
  },

  // กำหนดผู้รับผิดชอบ (พนักงาน) ให้กับลูกค้า
  updateAssignedTo: async (id, empId) => {
    const [r] = await pool.query('UPDATE customers SET assigned_to = ? WHERE cus_id = ?', [empId, id]);
    return r.affectedRows > 0;
  },
};

module.exports = Customer;
