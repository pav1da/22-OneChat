const express = require('express');
const router = express.Router();
const Log = require('../models/log.js');

/**
 * @swagger
 * tags:
 *   name: Logs
 *   description: บันทึกกิจกรรมในระบบ (Activity Logs)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Log:
 *       type: object
 *       properties:
 *         log_id:
 *           type: integer
 *           example: 1
 *         user:
 *           type: string
 *           example: "johndoe"
 *         avatar:
 *           type: string
 *           nullable: true
 *           example: "/uploads/avatars/avatar1.jpg"
 *         action:
 *           type: string
 *           example: "เข้าสู่ระบบ"
 *         target:
 *           type: string
 *           example: ""
 *         details:
 *           type: string
 *           example: ""
 *         created_at:
 *           type: string
 *           example: "2026-03-01 12:00:00"
 */

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: ดึง Logs ทั้งหมด (รองรับ filter)
 *     tags: [Logs]
 *     parameters:
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: "กรองตามชื่อผู้ใช้"
 *         example: "johndoe"
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: "กรองตาม action"
 *         example: "เข้าสู่ระบบ"
 *     responses:
 *       200:
 *         description: สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Log'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
    try {
        const logs = await Log.findAll(req.query);
        res.json({ logs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/logs:
 *   post:
 *     summary: สร้าง Log ใหม่
 *     tags: [Logs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user, action]
 *             properties:
 *               user:
 *                 type: string
 *                 example: "johndoe"
 *               avatar:
 *                 type: string
 *                 nullable: true
 *                 example: ""
 *               action:
 *                 type: string
 *                 example: "เข้าสู่ระบบ"
 *               target:
 *                 type: string
 *                 example: ""
 *               details:
 *                 type: string
 *                 example: ""
 *     responses:
 *       200:
 *         description: สร้าง Log สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "created"
 *                 result:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.post('/', async (req, res) => {
    try {
        const result = await Log.create(req.body);

        // ส่ง event ไปยังทุก client ที่เชื่อมต่ออยู่
        const io = req.app.get('io');
        if (io) {
            const d = new Date();
            const pad = (n) => String(n).padStart(2, "0");
            const localDatetime = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
            
            io.emit('new-log', { ...req.body, log_id: result.insertId, created_at: localDatetime });
        }

        res.json({ message: 'created', result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;