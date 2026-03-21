const NotificationSettings = require('../models/notificationSetting');

// ดึงการตั้งค่าการแจ้งเตือน
const getNotification = async (req, res) => {
    try {
        const userId = req.user.id || req.user.emp_id;

        // ดึง settings หรือสร้างใหม่ถ้ายังไม่มี
        const settings = await NotificationSettings.getOrCreate(userId);

        res.json(settings);
    } catch (error) {
        console.error('Error fetching notification settings:', error);
        res.status(500).json({ error: error.message || 'ไม่สามารถดึงการตั้งค่าได้' });
    }
};

// อัพเดทการตั้งค่า
const updateNotification = async (req, res) => {
    try {
        const userId = req.user.id || req.user.emp_id;
        const settingsData = req.body;

        // ตรวจสอบว่ามี settings หรือยัง ถ้ายังก็สร้างก่อน
        await NotificationSettings.getOrCreate(userId);

        // อัพเดท
        await NotificationSettings.updateByUserId(userId, settingsData);

        // ดึงค่าใหม่ส่งกลับ
        const updated = await NotificationSettings.getByUserId(userId);

        res.json({
            message: 'อัพเดทการตั้งค่าสำเร็จ',
            settings: updated
        });
    } catch (error) {
        console.error('Error updating notification settings:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getNotification,
    updateNotification
};
