const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const auth = require('../middleware/auth');

// GET /api/messages — ดึงข้อความทั้งหมด (by customer_id)
router.get('/', auth, async (req, res) => {
  try {
    const grouped = await Message.findAllGrouped();
    res.json(grouped);
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อความ' });
  }
});

// GET /api/messages/:customerId — ดึงข้อความของลูกค้า
router.get('/:customerId', auth, async (req, res) => {
  try {
    const messages = await Message.findByCustomerId(req.params.customerId);
    res.json(messages);
  } catch (err) {
    console.error('Get messages by customer error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// POST /api/messages — ส่งข้อความใหม่
router.post('/', auth, async (req, res) => {
  try {
    const { customer_id, sender, message_type, message_text } = req.body;

    if (!customer_id || !message_text) {
      return res.status(400).json({ message: 'กรุณาระบุ customer_id และข้อความ' });
    }

    const newId = await Message.create({
      customer_id,
      sender: sender || 'own',
      message_type: message_type || 'text',
      message_text,
    });

    // ส่ง real-time event ผ่าน Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('new-message', { id: newId, customer_id, sender, message_type, message_text });
    }

    res.status(201).json({ message: 'ส่งข้อความสำเร็จ', id: newId });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการส่งข้อความ' });
  }
});

module.exports = router;
