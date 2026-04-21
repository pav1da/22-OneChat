const pool = require('../config/db.js');

const Channel = {
    // ดึงช่องทางการเชื่อมต่อทั้งหมด
    findAll: async () => {
        const [rows] = await pool.query(
            'SELECT * FROM channels ORDER BY created_at DESC'
        );
        return rows;
    },

    // ดึงข้อมูลช่องทางการเชื่อมต่อตาม ID
    findById: async (id) => {
        const [rows] = await pool.query('SELECT * FROM channels WHERE id = ?', [id]);
        return rows[0] || null;
    },

    // สร้างช่องทางการเชื่อมต่อใหม่
    create: async ({ platform, channel_name, channel_id, access_token, channel_secret, webhook_url, destination_id, created_by }) => {
        const [result] = await pool.query(
            `INSERT INTO channels (platform, channel_name, channel_id, access_token, channel_secret, webhook_url, destination_id, status, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
            [platform, channel_name, channel_id || null, access_token || null, channel_secret || null, webhook_url || null, destination_id || null, created_by || null]
        );
        return result.insertId;
    },

    // อัปเดตข้อมูลช่องทางการเชื่อมต่อ
    update: async (id, { channel_name, channel_id, access_token, channel_secret, webhook_url, destination_id }) => {
        await pool.query(
            `UPDATE channels SET channel_name=?, channel_id=?, access_token=?, channel_secret=?, webhook_url=?, destination_id=?, updated_at=NOW() WHERE id=?`,
            [channel_name, channel_id || null, access_token || null, channel_secret || null, webhook_url || null, destination_id || null, id]
        );
    },

    // เปลี่ยนสถานะการใช้งาน (active/inactive)
    toggleStatus: async (id, status) => {
        await pool.query('UPDATE channels SET status=?, updated_at=NOW() WHERE id=?', [status, id]);
    },

    // ลบช่องทางการเชื่อมต่อตาม ID
    deleteById: async (id) => {
        await pool.query('DELETE FROM channels WHERE id=?', [id]);
    },

    // ดึงชื่อ bot จาก LINE API แล้วอัปเดต channel_name อัตโนมัติ
    syncLineBotNames: async () => {
        try {
            const [rows] = await pool.query(
                `SELECT id, access_token, channel_name FROM channels WHERE platform = 'line' AND access_token IS NOT NULL AND access_token != ''`
            );
            for (const ch of rows) {
                try {
                    const res = await fetch('https://api.line.me/v2/bot/info', {
                        headers: { Authorization: `Bearer ${ch.access_token}` },
                    });
                    if (res.ok) {
                        const data = await res.json();
                        const botName = data.displayName || data.basicId || null;
                        if (botName && botName !== ch.channel_name) {
                            await pool.query('UPDATE channels SET channel_name = ?, updated_at = NOW() WHERE id = ?', [botName, ch.id]);
                            console.log(`[Channel] Synced LINE bot name: "${botName}" (id=${ch.id})`);
                        }
                    }
                } catch (err) {
                    console.error(`[Channel] Failed to fetch bot info for channel id=${ch.id}:`, err.message);
                }
            }
        } catch (err) {
            console.error('[Channel] syncLineBotNames error:', err.message);
        }
    }
};

// Auto-sync LINE bot names on startup
Channel.syncLineBotNames();

module.exports = Channel;
