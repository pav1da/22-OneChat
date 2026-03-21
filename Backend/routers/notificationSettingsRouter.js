const express = require('express');
const router = express.Router();
const controller = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// ดึงค่า setting (ต้อง login)
router.get('/', auth, controller.getNotification);

// อัปเดตค่า setting (ต้อง login)
router.patch('/', auth, controller.updateNotification);

module.exports = router;