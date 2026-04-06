const express = require('express');
const router = express.Router();
const Customer = require('../models/customer.js');
const auth = require('../middleware/auth.js');

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: จัดการข้อมูลลูกค้า (LINE/Facebook)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       properties:
 *         cus_id:
 *           type: integer
 *           example: 1
 *         cus_name:
 *           type: string
 *           nullable: true
 *           example: "ชื่อที่ตั้งเอง"
 *         display_name:
 *           type: string
 *           example: "Pheemwit"
 *         platform:
 *           type: string
 *           example: "line"
 *         platform_id:
 *           type: string
 *           example: "U1234567890abcdef"
 *         channel_id:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         displayname:
 *           type: string
 *           nullable: true
 *         cus_picture:
 *           type: string
 *           nullable: true
 *           example: "https://profile.line-scdn.net/..."
 *         updated_at:
 *           type: string
 *           example: "2026-03-24 19:00:00"
 */

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: ดึงลูกค้าทั้งหมด
 *     tags: [Customers]
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
 *                 $ref: '#/components/schemas/Customer'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: ดึงลูกค้าจาก ID
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       404:
 *         description: ไม่พบลูกค้า
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/customers/{id}/name:
 *   put:
 *     summary: อัปเดตชื่อลูกค้า
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
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
 *                 example: "ชื่อใหม่"
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
 *                   example: "อัปเดตชื่อสำเร็จ"
 *       400:
 *         description: กรุณาระบุชื่อ
 *       404:
 *         description: ไม่พบลูกค้า
 *       500:
 *         description: Server error
 */

// GET /api/customers — ดึงลูกค้าทั้งหมด
router.get('/', auth, async (req, res) => {
  try {
    const customers = await Customer.findAll();
    res.json(customers);
  } catch (err) {
    console.error('Get customers error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า' });
  }
});

// GET /api/customers/:id — ดึงลูกค้าจาก ID
router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'ไม่พบลูกค้า' });
    res.json(customer);
  } catch (err) {
    console.error('Get customer error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// PUT /api/customers/:id/name — อัปเดตชื่อลูกค้า
router.put('/:id/name', auth, async (req, res) => {
  try {
    const { name } = req.body;
    // name เป็น null = ล้าง displayname → fallback ไปใช้ cus_name
    const success = await Customer.updateName(req.params.id, name || null);
    if (!success) return res.status(404).json({ message: 'ไม่พบลูกค้า' });

    res.json({ message: 'อัปเดตชื่อสำเร็จ' });
  } catch (err) {
    console.error('Update customer name error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// PUT /api/customers/:id/status — อัปเดต status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['ยังไม่เริ่ม', 'กำลังดำเนินการ', 'เสร็จสิ้น'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'status ไม่ถูกต้อง' });

    const success = await Customer.updateStatus(req.params.id, status);
    if (!success) return res.status(404).json({ message: 'ไม่พบลูกค้า' });
    res.json({ message: 'อัปเดต status สำเร็จ' });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;
