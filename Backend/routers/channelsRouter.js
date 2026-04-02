const express = require('express');
const router = express.Router();
const channelController = require('../controllers/channelController.js');
const auth = require('../middleware/auth.js');

/**
 * @swagger
 * tags:
 *   name: Channels
 *   description: จัดการช่องทางการเชื่อมต่อ (LINE, Facebook ฯลฯ)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Channel:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         platform:
 *           type: string
 *           enum: [line, facebook, instagram, website]
 *           example: "line"
 *         channel_name:
 *           type: string
 *           example: "LINE Official Account"
 *         channel_id:
 *           type: string
 *           nullable: true
 *           example: "1234567890"
 *         access_token:
 *           type: string
 *           nullable: true
 *           example: "eyJhbGciOiJIUzI1NiJ9..."
 *         channel_secret:
 *           type: string
 *           nullable: true
 *           example: "abc123secret"
 *         webhook_url:
 *           type: string
 *           nullable: true
 *           example: "https://example.com/webhook"
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           example: "active"
 *         created_by:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         created_at:
 *           type: string
 *           example: "2026-03-01 10:00:00"
 *         updated_at:
 *           type: string
 *           nullable: true
 *           example: "2026-03-24 18:00:00"
 */

/**
 * @swagger
 * /api/channels:
 *   get:
 *     summary: ดึงช่องทางทั้งหมด
 *     tags: [Channels]
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
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Channel'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', auth, channelController.getAllChannels);

/**
 * @swagger
 * /api/channels/{id}:
 *   get:
 *     summary: ดึงช่องทางตาม ID
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Channel ID
 *     responses:
 *       200:
 *         description: สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Channel'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: ไม่พบช่องทาง
 *       500:
 *         description: Server error
 */
router.get('/:id', auth, channelController.getChannelById);

/**
 * @swagger
 * /api/channels:
 *   post:
 *     summary: เพิ่มช่องทางใหม่
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [platform, channel_name]
 *             properties:
 *               platform:
 *                 type: string
 *                 enum: [line, facebook, instagram, website]
 *                 example: "line"
 *               channel_name:
 *                 type: string
 *                 example: "LINE Official Account"
 *               channel_id:
 *                 type: string
 *                 nullable: true
 *                 example: "1234567890"
 *               access_token:
 *                 type: string
 *                 nullable: true
 *               channel_secret:
 *                 type: string
 *                 nullable: true
 *               webhook_url:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: เชื่อมต่อสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "เชื่อมต่อสำเร็จ"
 *                 id:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: กรุณาระบุ platform และ channel_name
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', auth, channelController.createChannel);

/**
 * @swagger
 * /api/channels/{id}:
 *   put:
 *     summary: แก้ไขข้อมูลช่องทาง
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Channel ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [channel_name]
 *             properties:
 *               channel_name:
 *                 type: string
 *                 example: "LINE OA Updated"
 *               channel_id:
 *                 type: string
 *                 nullable: true
 *               access_token:
 *                 type: string
 *                 nullable: true
 *               channel_secret:
 *                 type: string
 *                 nullable: true
 *               webhook_url:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: แก้ไขสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "แก้ไขสำเร็จ"
 *       400:
 *         description: กรุณาระบุ channel_name
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/:id', auth, channelController.updateChannel);

/**
 * @swagger
 * /api/channels/{id}/toggle:
 *   put:
 *     summary: เปิด/ปิดช่องทาง
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Channel ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: "inactive"
 *     responses:
 *       200:
 *         description: เปลี่ยนสถานะสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "เปลี่ยนสถานะเป็น inactive สำเร็จ"
 *       400:
 *         description: status ต้องเป็น active หรือ inactive
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/:id/toggle', auth, channelController.toggleChannel);

/**
 * @swagger
 * /api/channels/{id}:
 *   delete:
 *     summary: ลบช่องทาง
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Channel ID
 *     responses:
 *       200:
 *         description: ลบสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "ลบสำเร็จ"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: ไม่พบช่องทาง
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, channelController.deleteChannel);

module.exports = router;
