const express = require('express');
const router = express.Router();
const Notification = require('../models/notification');
const auth = require('../middleware/auth');

// 🔹 สร้าง notification
router.post('/', async (req, res) => {
    try {
        const result = await Notification.create(req.body);

        // ส่ง real-time event ถ้ามี Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.emit('new-notification', { ...req.body, id: result.insertId });
        }

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 ดึง notification ของ user ปัจจุบัน (ใช้ auth middleware)
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.id || req.user.emp_id;
        const data = await Notification.getByUser(userId);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 unread count (ใช้ auth middleware)
router.get('/unread-count', auth, async (req, res) => {
    try {
        const userId = req.user.id || req.user.emp_id;
        const count = await Notification.getUnreadCount(userId);
        res.json(count);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 mark as read
router.put('/:id/read', auth, async (req, res) => {
    try {
        const result = await Notification.markAsRead(req.params.id);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;