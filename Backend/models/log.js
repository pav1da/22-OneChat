const db = require('../config/db');

const Log = {
    findAll: async (filters) => {
        let sql = 'SELECT * FROM LOGS WHERE 1=1';
        let params = [];

        if (filters.user) {
            sql += ' AND user = ?';
            params.push(filters.user);
        }

        if (filters.action) {
            sql += ' AND action = ?';
            params.push(filters.action);
        }

        const [rows] = await db.query(sql, params);
        return rows;
    },

    create: async ({ user, avatar, action, target, details }) => {
        const sql = `
      INSERT INTO LOGS (user, avatar, action, target, details)
      VALUES (?, ?, ?, ?, ?)
    `;
        const [result] = await db.query(sql, [user, avatar, action, target, details]);
        return result;
    }
};

module.exports = Log;