const express = require('express');
const router = express.Router();
const Tag = require('../models/tag.js');
const auth = require('../middleware/auth.js');

// GET /api/tags — ดึงแท็กทั้งหมด (bulk load)
router.get('/', auth, async (req, res) => {
  try {
    const tags = await Tag.findAll();
    res.json({ status: 'success', data: tags });
  } catch (err) {
    console.error('Get all tags error:', err);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการดึงแท็ก' });
  }
});

// GET /api/tags/:customerId — ดึงแท็กของลูกค้า
router.get('/:customerId', auth, async (req, res) => {
  try {
    const tags = await Tag.findByCustomerId(req.params.customerId);
    res.json(tags);
  } catch (err) {
    console.error('Get tags error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงแท็ก' });
  }
});

// POST /api/tags — สร้างแท็กใหม่
router.post('/', auth, async (req, res) => {
  try {
    const { customer_id, text, color } = req.body;

    if (!text || !customer_id) {
      return res.status(400).json({ message: 'กรุณาระบุ customer_id และข้อความแท็ก' });
    }

    const newId = await Tag.create({ customer_id, text, color });

    res.status(201).json({ status: 'success', message: 'สร้างแท็กสำเร็จ', id: newId });
  } catch (err) {
    console.error('Create tag error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// DELETE /api/tags/:id — ลบแท็ก
router.delete('/:id', auth, async (req, res) => {
  try {
    const tagId = parseInt(req.params.id);
    const success = await Tag.deleteById(tagId);
    if (!success) return res.status(404).json({ message: 'ไม่พบแท็ก' });

    res.json({ message: 'ลบแท็กสำเร็จ' });
  } catch (err) {
    console.error('Delete tag error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;
