const express = require('express');
const router = express.Router();
const Log = require('../models/log');

// GET /api/logs
router.get('/', async (req, res) => {
    try {
        const logs = await Log.findAll(req.query);
        res.json({ logs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/logs
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