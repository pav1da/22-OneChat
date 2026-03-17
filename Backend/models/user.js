const pool = require('../config/db');

const User = {
  // ค้นหา user จาก email
  findByEmail: async (email) => {
    const [rows] = await pool.query('SELECT * FROM EMP WHERE email = ?', [email]);
    return rows[0] || null;
  },

  // ค้นหา user จาก emp_id
  findById: async (id) => {
    const [rows] = await pool.query('SELECT emp_id, username, name, email, phone, role, supervisor_id, created_at FROM EMP WHERE emp_id = ?', [id]);
    return rows[0] || null;
  },

  // ค้นหา user จาก emp_id (รวม password สำหรับตรวจสอบ)
  findByIdWithPassword: async (id) => {
    const [rows] = await pool.query('SELECT * FROM EMP WHERE emp_id = ?', [id]);
    return rows[0] || null;
  },

  // ค้นหา user จาก username
  findByUsername: async (username) => {
    const [rows] = await pool.query('SELECT * FROM EMP WHERE username = ?', [username]);
    return rows[0] || null;
  },

  // สร้าง user ใหม่
  create: async ({ username, email, password }) => {
    const [result] = await pool.query(
      'INSERT INTO EMP (username, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [username, username, email, password, 'staff']
    );
    return result.insertId;
  },

  // อัพเดท username
  updateUsername: async (id, username) => {
    const [result] = await pool.query(
      'UPDATE EMP SET username = ?, name = ? WHERE emp_id = ?',
      [username, username, id]
    );
    return result.affectedRows > 0;
  },

  // อัพเดท email
  updateEmail: async (id, email) => {
    const [result] = await pool.query(
      'UPDATE EMP SET email = ? WHERE emp_id = ?',
      [email, id]
    );
    return result.affectedRows > 0;
  },

  // อัพเดท phone
  updatePhone: async (id, phone) => {
    const [result] = await pool.query(
      'UPDATE EMP SET phone = ? WHERE emp_id = ?',
      [phone, id]
    );
    return result.affectedRows > 0;
  },

  // อัพเดท password
  updatePassword: async (id, password) => {
    const [result] = await pool.query(
      'UPDATE EMP SET password = ? WHERE emp_id = ?',
      [password, id]
    );
    return result.affectedRows > 0;
  },

  // ลบ user
  deleteById: async (id) => {
    const [result] = await pool.query(
      'DELETE FROM EMP WHERE emp_id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },

  // ดึง user ทั้งหมด (ไม่รวม password)
  findAll: async () => {
    const [rows] = await pool.query(
      'SELECT emp_id, username, name, email, phone, role, supervisor_id, created_at FROM EMP'
    );
    return rows;
  }
};

module.exports = User;
