// =============================================
// Members Router
// เส้นทาง API สำหรับดึงข้อมูลสมาชิกจาก Database
// ใช้ในหน้า Member (Frontend)
// =============================================

const express = require('express');
const router = express.Router();
const membersController = require('../controllers/membersController.js');
const auth = require('../middleware/auth.js');

// GET /api/members — ดึงข้อมูลสมาชิกทั้งหมด (ต้อง login ก่อน)
router.get('/', auth, membersController.getAllMembers);

// GET /api/members/:id — ดึงข้อมูลสมาชิกรายคน (ต้อง login ก่อน)
router.get('/:id', auth, membersController.getMemberById);

module.exports = router;
