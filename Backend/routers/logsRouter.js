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
        res.json({ message: 'created', result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;