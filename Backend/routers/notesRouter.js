const express = require('express');
const router = express.Router();
const Note = require('../models/note.js');
const auth = require('../middleware/auth.js');

/**
 * @swagger
 * tags:
 *   name: Notes
 *   description: จัดการโน้ตของลูกค้า (Customer Notes)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Note:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         customer_id:
 *           type: integer
 *           example: 1
 *         text:
 *           type: string
 *           example: "ลูกค้าสนใจสินค้า A"
 *         author:
 *           type: string
 *           nullable: true
 *           example: "admin1"
 *         created_at:
 *           type: string
 *           example: "2026-03-24 19:00:00"
 */

/**
 * @swagger
 * /api/notes/{customerId}:
 *   get:
 *     summary: ดึงโน้ตทั้งหมดของลูกค้า
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
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
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Note'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/notes:
 *   post:
 *     summary: สร้างโน้ตใหม่
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customer_id, text]
 *             properties:
 *               customer_id:
 *                 type: integer
 *                 example: 1
 *               text:
 *                 type: string
 *                 example: "ลูกค้าสนใจสินค้า A"
 *               author:
 *                 type: string
 *                 example: "admin1"
 *     responses:
 *       201:
 *         description: สร้างสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "สร้างโน้ตสำเร็จ"
 *                 id:
 *                   type: integer
 *                   example: 5
 *       400:
 *         description: กรุณาระบุ customer_id และข้อความ
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/notes/{id}:
 *   put:
 *     summary: แก้ไขโน้ต
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Note ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *                 example: "ข้อความโน้ตที่แก้ไขแล้ว"
 *     responses:
 *       200:
 *         description: แก้ไขสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "แก้ไขโน้ตสำเร็จ"
 *       400:
 *         description: กรุณาระบุข้อความ
 *       404:
 *         description: ไม่พบโน้ต
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/notes/{id}:
 *   delete:
 *     summary: ลบโน้ต
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Note ID
 *     responses:
 *       200:
 *         description: ลบสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ลบโน้ตสำเร็จ"
 *       404:
 *         description: ไม่พบโน้ต
 *       500:
 *         description: Server error
 */

// GET /api/notes — ดึงโน๊ตทั้งหมด (สำหรับหน้า Notes รวม)
router.get('/', auth, async (req, res) => {
  try {
    const notes = await Note.findAll();
    res.json({ status: 'success', data: notes });
  } catch (err) {
    console.error('Get all notes error:', err);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการดึงโน๊ต' });
  }
});

// GET /api/notes/:customerId — ดึงโน๊ตของลูกค้า
router.get('/:customerId', auth, async (req, res) => {
  try {
    const notes = await Note.findByCustomerId(req.params.customerId);
    res.json(notes);
  } catch (err) {
    console.error('Get notes error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงโน๊ต' });
  }
});

// POST /api/notes — สร้างโน้ตใหม่
router.post('/', auth, async (req, res) => {
  try {
    const { customer_id, text, author } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'กรุณาระบุข้อความ' });
    }

    const newId = await Note.create({ customer_id: customer_id || null, text, author });

    // ส่ง real-time event ให้ Notes page อัพเดท
    const io = req.app.get('io');
    if (io) {
      const [newNote] = await Note.findAll().then(rows => rows.filter(r => r.id === newId));
      io.emit('new_note', newNote || { id: newId, customer_id, content: text, author, user: author });
    }

    res.status(201).json({ message: 'สร้างโน้ตสำเร็จ', id: newId });
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// PUT /api/notes/:id — แก้ไขโน้ต
router.put('/:id', auth, async (req, res) => {
  try {
    const { text, edited_by } = req.body;
    if (!text) return res.status(400).json({ message: 'กรุณาระบุข้อความ' });

    const success = await Note.update(req.params.id, text, edited_by);
    if (!success) return res.status(404).json({ message: 'ไม่พบโน้ต' });

    // ดึงข้อมูลโน้ตที่อัปเดตแล้ว (พร้อม customer info) เพื่อ broadcast
    const allNotes = await Note.findAll();
    const updatedNote = allNotes.find(n => n.id === parseInt(req.params.id));

    // Broadcast real-time update
    const io = req.app.get('io');
    if (io && updatedNote) {
      io.emit('updated_note', updatedNote);
    }

    res.json({ message: 'แก้ไขโน้ตสำเร็จ', data: updatedNote });
  } catch (err) {
    console.error('Update note error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// DELETE /api/notes/:id — ลบโน้ต
router.delete('/:id', auth, async (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    const success = await Note.delete(noteId);
    if (!success) return res.status(404).json({ message: 'ไม่พบโน้ต' });

    // Broadcast real-time delete
    const io = req.app.get('io');
    if (io) {
      io.emit('deleted_note', { id: noteId });
    }

    res.json({ message: 'ลบโน้ตสำเร็จ' });
  } catch (err) {
    console.error('Delete note error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;
