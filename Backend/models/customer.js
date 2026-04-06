const pool = require('../config/db.js');

const COLS = 'cus_id, cus_name, displayname AS display_name, platform, platform_id, channel_id, cus_picture, status, updated_at';

const Customer = {
  findAll: async () => {
    const [rows] = await pool.query(`SELECT ${COLS} FROM customers ORDER BY updated_at DESC`);
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.query(`SELECT ${COLS} FROM customers WHERE cus_id = ?`, [id]);
    return rows[0] || null;
  },

  updateName: async (id, name) => {
    const [r] = await pool.query('UPDATE customers SET displayname = ? WHERE cus_id = ?', [name, id]);
    return r.affectedRows > 0;
  },

  updateStatus: async (id, status) => {
    const [r] = await pool.query('UPDATE customers SET status = ? WHERE cus_id = ?', [status, id]);
    return r.affectedRows > 0;
  },
};

module.exports = Customer;
