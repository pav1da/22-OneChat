const express = require('express');
const router = express.Router();
const ApiKey = require('../models/apiKey');
const auth = require('../middleware/auth');

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

// PUT /api/api-keys/:id/toggle — เปิด/ปิด API Key
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

// POST /api/api-keys/reset-personal — รีเซ็ต Personal Key
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
