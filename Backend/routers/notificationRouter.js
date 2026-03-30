const express = require('express');
const router = express.Router();
const Notification = require('../models/notification.js');
const auth = require('../middleware/auth.js');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: จัดการการแจ้งเตือน
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         user_id:
 *           type: integer
 *           example: 3
 *         title:
 *           type: string
 *           example: "ข้อความใหม่"
 *         message:
 *           type: string
 *           example: "คุณมีข้อความใหม่จากลูกค้า"
 *         is_read:
 *           type: boolean
 *           example: false
 *         created_at:
 *           type: string
 *           example: "2026-03-01 12:00:00"
 */

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: สร้าง Notification ใหม่
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, title, message]
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 3
 *               title:
 *                 type: string
 *                 example: "ข้อความใหม่"
 *               message:
 *                 type: string
 *                 example: "คุณมีข้อความใหม่จากลูกค้า"
 *     responses:
 *       200:
 *         description: สร้าง Notification สำเร็จ
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: ดึง Notification ของ User ปัจจุบัน
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *       401:
 *         description: ไม่พบ Token
 *       500:
 *         description: Server error
 */
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.id || req.user.emp_id;
        const data = await Notification.getByUser(userId);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: ดึงจำนวน Notification ที่ยังไม่อ่าน
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 5
 *       401:
 *         description: ไม่พบ Token
 *       500:
 *         description: Server error
 */
router.get('/unread-count', auth, async (req, res) => {
    try {
        const userId = req.user.id || req.user.emp_id;
        const count = await Notification.getUnreadCount(userId);
        res.json(count);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: อ่าน Notification (Mark as Read)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "รหัส Notification"
 *         example: 1
 *     responses:
 *       200:
 *         description: อ่าน Notification สำเร็จ
 *       401:
 *         description: ไม่พบ Token
 *       500:
 *         description: Server error
 */
router.put('/:id/read', auth, async (req, res) => {
    try {
        const result = await Notification.markAsRead(req.params.id);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   put:
 *     summary: Mark all unread notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Marked all as read
 *       401:
 *         description: ไม่พบ Token
 *       500:
 *         description: Server error
 */
router.put('/mark-all-read', auth, async (req, res) => {
    try {
        const userId = req.user.id || req.user.emp_id;
        const result = await Notification.markAllAsRead(userId);
        res.json({ message: 'Marked all as read', result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;