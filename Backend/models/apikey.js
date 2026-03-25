const db = require('../config/db.js');
const crypto = require('crypto');

// สร้าง API Key แบบ random
const generateKey = (prefix = 'ok') => {
    const rand = crypto.randomBytes(24).toString('hex');
    return `${prefix}_${rand}`;
};

const ApiKey = {
    // ดึง keys ทั้งหมด
    findAll: async () => {
        const [rows] = await db.query(
            'SELECT ak.*, e.username AS created_by_name FROM api_keys ak LEFT JOIN EMP e ON ak.created_by = e.emp_id ORDER BY ak.created_at DESC'
        );
        return rows;
    },

    // ดึง key ตาม id
    findById: async (id) => {
        const [rows] = await db.query('SELECT * FROM api_keys WHERE id = ?', [id]);
        return rows[0] || null;
    },

    // สร้าง key ใหม่
    create: async ({ name, type, created_by }) => {
        const key = generateKey(type === 'SECRET' ? 'sk' : type === 'WEB_SDK' ? 'ws' : 'ok');
        const [result] = await db.query(
            'INSERT INTO api_keys (name, type, `key`, enabled, created_by) VALUES (?, ?, ?, true, ?)',
            [name, type || 'DEFAULT', key, created_by]
        );
        return { id: result.insertId, key };
    },

    // เปิด/ปิด key
    toggle: async (id, enabled) => {
        const [result] = await db.query(
            'UPDATE api_keys SET enabled = ? WHERE id = ?',
            [enabled, id]
        );
        return result.affectedRows > 0;
    },

    // Reset personal key (สร้าง key ใหม่แทนที่)
    resetPersonal: async (userId) => {
        const newKey = generateKey('pk');
        // หา personal key ของ user นี้ หรือสร้างใหม่
        const [existing] = await db.query(
            "SELECT id FROM api_keys WHERE created_by = ? AND type = 'DEFAULT' ORDER BY created_at ASC LIMIT 1",
            [userId]
        );

        if (existing.length > 0) {
            await db.query('UPDATE api_keys SET `key` = ? WHERE id = ?', [newKey, existing[0].id]);
        } else {
            await db.query(
                "INSERT INTO api_keys (name, type, `key`, enabled, created_by) VALUES ('Personal Key', 'DEFAULT', ?, true, ?)",
                [newKey, userId]
            );
        }
        return newKey;
    },

    // ลบ key
    deleteById: async (id) => {
        const [result] = await db.query('DELETE FROM api_keys WHERE id = ?', [id]);
        return result.affectedRows > 0;
    },
};

module.exports = ApiKey;
