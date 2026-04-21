const express = require('express');
const router = express.Router();
const controller = require('../controllers/notificationController.js');
const auth = require('../middleware/auth.js');

/**
 * @swagger
 * tags:
 *   name: Notification Settings
 *   description: ตั้งค่าการแจ้งเตือนของผู้ใช้
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationSettings:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         user_id:
 *           type: integer
 *           example: 3
 *         email_notifications:
 *           type: boolean
 *           example: true
 *         push_notifications:
 *           type: boolean
 *           example: true
 *         sound_enabled:
 *           type: boolean
 *           example: true
 *         created_at:
 *           type: string
 *           example: "2026-03-01 12:00:00"
 */

/**
 * @swagger
 * /api/notification-settings:
 *   get:
 *     summary: ดึงค่า Notification Settings ของผู้ใช้ปัจจุบัน
 *     tags: [Notification Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationSettings'
 *       401:
 *         description: ไม่พบ Token
 *       500:
 *         description: Server error
 */
// GET /api/notification-settings — ดึงค่าการตั้งค่าการแจ้งเตือนของผู้ใช้ปัจจุบัน
router.get('/', auth, controller.getNotification);

/**
 * @swagger
 * /api/notification-settings:
 *   patch:
 *     summary: อัปเดตค่า Notification Settings
 *     tags: [Notification Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email_notifications:
 *                 type: boolean
 *                 example: false
 *               push_notifications:
 *                 type: boolean
 *                 example: true
 *               sound_enabled:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: อัปเดตสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "อัพเดทการตั้งค่าสำเร็จ"
 *                 settings:
 *                   $ref: '#/components/schemas/NotificationSettings'
 *       401:
 *         description: ไม่พบ Token
 *       500:
 *         description: Server error
 */
// PATCH /api/notification-settings — อัปเดตการตั้งค่าการแจ้งเตือนของผู้ใช้ปัจจุบัน
router.patch('/', auth, controller.updateNotification);

module.exports = router;