const express = require('express');
const router = express.Router();
const ApiKey = require('../models/apikey.js');
const auth = require('../middleware/auth.js');

/**
 * @swagger
 * tags:
 *   name: API Keys
 *   description: จัดการ API Keys สำหรับเชื่อมต่อแพลตฟอร์มภายนอก
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ApiKey:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "LINE Channel Token"
 *         type:
 *           type: string
 *           enum: [DEFAULT, SECRET, WEB_SDK]
 *           example: "DEFAULT"
 *         key:
 *           type: string
 *           example: "ok_a1b2c3d4e5f6..."
 *         enabled:
 *           type: boolean
 *           example: true
 *         created_by:
 *           type: integer
 *           example: 1
 *         created_by_name:
 *           type: string
 *           example: "johndoe"
 *         created_at:
 *           type: string
 *           example: "2026-03-01 12:00:00"
 */

/**
 * @swagger
 * /api/api-keys:
 *   get:
 *     summary: ดึง API Keys ทั้งหมด
 *     tags: [API Keys]
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
 *                 keys:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ApiKey'
 *       401:
 *         description: ไม่พบ Token
 *       500:
 *         description: Server error
 */
// GET /api/api-keys — ดึง API Keys ทั้งหมด
router.get('/', auth, async (req, res) => {
    try {
        const keys = await ApiKey.findAll();
        res.json({ keys });
    } catch (err) {
        console.error('Get API keys error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/api-keys:
 *   post:
 *     summary: สร้าง API Key ใหม่
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "LINE Channel Token"
 *               type:
 *                 type: string
 *                 enum: [DEFAULT, SECRET, WEB_SDK]
 *                 example: "DEFAULT"
 *     responses:
 *       201:
 *         description: สร้าง API Key สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "สร้าง API Key สำเร็จ"
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 key:
 *                   type: string
 *                   example: "ok_a1b2c3d4e5f6..."
 *       400:
 *         description: ไม่ได้ระบุชื่อ Key
 *       401:
 *         description: ไม่พบ Token
 *       500:
 *         description: Server error
 */
// POST /api/api-keys — สร้าง API Key ใหม่ 
router.post('/', auth, async (req, res) => {
    try {
        const { name, type } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'กรุณาระบุชื่อ Key' });
        }

        const result = await ApiKey.create({
            name,
            type: type || 'DEFAULT',
            created_by: req.user.emp_id,
        });

        res.status(201).json({
            message: 'สร้าง API Key สำเร็จ',
            id: result.id,
            key: result.key,
        });
    } catch (err) {
        console.error('Create API key error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/api-keys/{id}/toggle:
 *   put:
 *     summary: เปิด/ปิด API Key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "รหัส API Key"
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [enabled]
 *             properties:
 *               enabled:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: เปลี่ยนสถานะสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ปิดใช้งาน API Key แล้ว"
 *       401:
 *         description: ไม่พบ Token
 *       404:
 *         description: ไม่พบ API Key
 *       500:
 *         description: Server error
 */
// PUT /api/api-keys/:id/toggle — เปิด/ปิดการใช้งาน API Key
router.put('/:id/toggle', auth, async (req, res) => {
    try {
        const { enabled } = req.body;
        const success = await ApiKey.toggle(req.params.id, enabled);

        if (!success) {
            return res.status(404).json({ message: 'ไม่พบ API Key' });
        }

        res.json({ message: enabled ? 'เปิดใช้งาน API Key แล้ว' : 'ปิดใช้งาน API Key แล้ว' });
    } catch (err) {
        console.error('Toggle API key error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/api-keys/reset-personal:
 *   post:
 *     summary: รีเซ็ต Personal Key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reset สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Reset สำเร็จ"
 *                 newKey:
 *                   type: string
 *                   example: "pk_a1b2c3d4e5f6..."
 *       401:
 *         description: ไม่พบ Token
 *       500:
 *         description: Server error
 */
// POST /api/api-keys/reset-personal — รีเซ็ต Personal API Key ของผู้ใช้
router.post('/reset-personal', auth, async (req, res) => {
    try {
        const newKey = await ApiKey.resetPersonal(req.user.emp_id);
        res.json({ message: 'Reset สำเร็จ', newKey });
    } catch (err) {
        console.error('Reset personal key error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
