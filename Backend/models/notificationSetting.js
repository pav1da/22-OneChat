const pool = require('../config/db');

// ดึง setting ของ user
const getByUserId = async (userId) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM notification_settings WHERE user_id = ?',
            [userId]
        );
        return rows[0] || null;
    } catch (error) {
        console.error('Error fetching notification settings:', error);
        throw error;
    }
};

// สร้าง default ถ้ายังไม่มี
const createDefault = async (userId) => {
    try {
        await pool.query(
            `INSERT INTO notification_settings 
       (user_id, main_notification, push_notification, email_notification, notification_level) 
       VALUES (?, 1, 1, 0, 'none')`,
            [userId]
        );
    } catch (error) {
        console.error('Error creating default notification settings:', error);
        throw error;
    }
};

// ดึง settings หรือสร้างใหม่ถ้ายังไม่มี
const getOrCreate = async (userId) => {
    let settings = await getByUserId(userId);

    if (!settings) {
        await createDefault(userId);
        settings = await getByUserId(userId);
    }

    return settings;
};

// อัปเดต setting
const updateByUserId = async (userId, data) => {
    try {
        const {
            main_notification,
            push_notification,
            email_notification,
            notification_level
        } = data;

        // แปลง boolean เป็น 1/0 สำหรับ MySQL
        const mainNotif = main_notification ? 1 : 0;
        const pushNotif = push_notification ? 1 : 0;
        const emailNotif = email_notification ? 1 : 0;

        await pool.query(
            `UPDATE notification_settings
       SET main_notification = ?,
           push_notification = ?,
           email_notification = ?,
           notification_level = ?
       WHERE user_id = ?`,
            [
                mainNotif,
                pushNotif,
                emailNotif,
                notification_level,
                userId
            ]
        );
    } catch (error) {
        console.error('Error updating notification settings:', error);
        throw error;
    }
};

module.exports = {
    getByUserId,
    createDefault,
    getOrCreate,
    updateByUserId
};