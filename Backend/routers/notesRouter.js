const express = require('express');
const router = express.Router();
const Note = require('../models/note.js');
const auth = require('../middleware/auth.js');
const Log = require('../models/log.js');

/**
 * @swagger
 * tags:
 *   name: Notes
 *   description: การจัดการโน้ตสำหรับลูกค้า (Notes)
 */

/**
 * @swagger
 * /api/notes:
 *   get:
 *     summary: ดึงโน้ตทั้งหมด (ใช้ในหน้ารวม Notes)
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: สำเร็จ
 */
// GET /api/notes — ดึงโน้ตทั้งหมด
router.get('/', auth, async (req, res) => {
  try {
    const notes = await Note.findAll();
    res.json({ status: 'success', data: notes });
  } catch (err) {
    console.error('Get all notes error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโน้ตทั้งหมด' });
  }
});

/**
 * @swagger
 * /api/notes/{customerId}:
 *   get:
 *     summary: ดึงโน้ตของลูกค้าด้วย ID
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: สำเร็จ
 */
// GET /api/notes/:customerId — ดึงโน้ตของลูกค้า
router.get('/:customerId', auth, async (req, res) => {
  try {
    const notes = await Note.findByCustomerId(req.params.customerId);
    res.json(notes);
  } catch (err) {
    console.error('Get notes error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงโน้ต' });
  }
});

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
 *             properties:
 *               customer_id:
 *                 type: integer
 *               text:
 *                 type: string
 *               author:
 *                 type: string
 *     responses:
 *       201:
 *         description: สร้างสำเร็จ
 */
// POST /api/notes — สร้างโน้ตใหม่
router.post('/', auth, async (req, res) => {
  try {
    const { customer_id, text, author } = req.body;

    if (!customer_id || !text) {
      return res.status(400).json({ message: 'กรุณาระบุ customer_id และข้อความ' });
    }

    const newId = await Note.create({ customer_id, text, author });
    
    // บันทึก Log
    await Log.create({
        user: req.user?.username || author || 'Admin',
        avatar: '',
        action: 'Create Note',
        target: 'Notes Management',
        details: `Created a note for customer_id: ${customer_id}`
    }).catch(err => console.error(err));

    const newNote = { id: newId, customer_id, text, author, created_at: new Date() };

    // Emit Socket
    const io = req.app.get('io');
    if (io) io.emit('new_note', newNote);

    res.status(201).json({ message: 'สร้างโน้ตสำเร็จ', id: newId });
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: สำเร็จ
 */
// PUT /api/notes/:id — แก้ไขโน้ต
router.put('/:id', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'กรุณาระบุข้อความ' });

    const success = await Note.update(req.params.id, text);
    if (!success) return res.status(404).json({ message: 'ไม่พบโน้ต' });

    // Emit Socket
    const updatedNote = { id: parseInt(req.params.id), text };
    const io = req.app.get('io');
    if (io) io.emit('updated_note', updatedNote);

    res.json({ message: 'แก้ไขโน้ตสำเร็จ' });
  } catch (err) {
    console.error('Update note error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

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
 *     responses:
 *       200:
 *         description: สำเร็จ
 */
// DELETE /api/notes/:id — ลบโน้ต
router.delete('/:id', auth, async (req, res) => {
  try {
    const success = await Note.delete(req.params.id);
    if (!success) return res.status(404).json({ message: 'ไม่พบโน้ต' });

    // Emit Socket
    const io = req.app.get('io');
    if (io) io.emit('deleted_note', { id: parseInt(req.params.id) });

    res.json({ message: 'ลบโน้ตสำเร็จ' });
  } catch (err) {
    console.error('Delete note error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;
