const express = require('express');
const router = express.Router();
const Note = require('../models/note');
const auth = require('../middleware/auth');

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

// POST /api/notes — สร้างโน้ตใหม่
router.post('/', auth, async (req, res) => {
  try {
    const { customer_id, text, author } = req.body;

    if (!customer_id || !text) {
      return res.status(400).json({ message: 'กรุณาระบุ customer_id และข้อความ' });
    }

    const newId = await Note.create({ customer_id, text, author });
    res.status(201).json({ message: 'สร้างโน้ตสำเร็จ', id: newId });
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// PUT /api/notes/:id — แก้ไขโน้ต
router.put('/:id', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'กรุณาระบุข้อความ' });

    const success = await Note.update(req.params.id, text);
    if (!success) return res.status(404).json({ message: 'ไม่พบโน้ต' });

    res.json({ message: 'แก้ไขโน้ตสำเร็จ' });
  } catch (err) {
    console.error('Update note error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// DELETE /api/notes/:id — ลบโน้ต
router.delete('/:id', auth, async (req, res) => {
  try {
    const success = await Note.delete(req.params.id);
    if (!success) return res.status(404).json({ message: 'ไม่พบโน้ต' });

    res.json({ message: 'ลบโน้ตสำเร็จ' });
  } catch (err) {
    console.error('Delete note error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;
