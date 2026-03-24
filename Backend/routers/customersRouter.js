const express = require('express');
const router = express.Router();
const Customer = require('../models/customer.js');
const auth = require('../middleware/auth.js');

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
    if (!name) return res.status(400).json({ message: 'กรุณาระบุชื่อ' });

    const success = await Customer.updateName(req.params.id, name);
    if (!success) return res.status(404).json({ message: 'ไม่พบลูกค้า' });

    res.json({ message: 'อัปเดตชื่อสำเร็จ' });
  } catch (err) {
    console.error('Update customer name error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;
