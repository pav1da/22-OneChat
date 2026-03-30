const pool = require('../config/db.js');

const Channel = {
    findAll: async () => {
        const [rows] = await pool.query(
            'SELECT * FROM channels ORDER BY created_at DESC'
        );
        return rows;
    },

    findById: async (id) => {
        const [rows] = await pool.query('SELECT * FROM channels WHERE id = ?', [id]);
        return rows[0] || null;
    },

    create: async ({ platform, channel_name, channel_id, access_token, channel_secret, webhook_url, created_by }) => {
        const [result] = await pool.query(
            `INSERT INTO channels (platform, channel_name, channel_id, access_token, channel_secret, webhook_url, status, created_by)
             VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
            [platform, channel_name, channel_id || null, access_token || null, channel_secret || null, webhook_url || null, created_by || null]
        );
        return result.insertId;
    },

    update: async (id, { channel_name, channel_id, access_token, channel_secret, webhook_url }) => {
        await pool.query(
            `UPDATE channels SET channel_name=?, channel_id=?, access_token=?, channel_secret=?, webhook_url=?, updated_at=NOW() WHERE id=?`,
            [channel_name, channel_id || null, access_token || null, channel_secret || null, webhook_url || null, id]
        );
    },

    toggleStatus: async (id, status) => {
        await pool.query('UPDATE channels SET status=?, updated_at=NOW() WHERE id=?', [status, id]);
    },

    deleteById: async (id) => {
        await pool.query('DELETE FROM channels WHERE id=?', [id]);
    }
};

module.exports = Channel;
