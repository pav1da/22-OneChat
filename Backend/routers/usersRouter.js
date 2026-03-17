const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const upload = require('../middleware/upload');

// === Public Routes (ไม่ต้อง Login) ===
// 1. ลงทะเบียน
router.post('/register', usersController.register);
// 2. เข้าสู่ระบบ
router.post('/login', usersController.login);

// === Protected Routes (ต้อง Login) ===
// 3. ดึงข้อมูลผู้ใช้ปัจจุบัน
router.get('/me', auth, usersController.getMe);
// 4. เปลี่ยนชื่อผู้ใช้
router.put('/me/username', auth, usersController.updateUsername);
// 5. เปลี่ยนอีเมล
router.put('/me/email', auth, usersController.updateEmail);
// 6. เปลี่ยนเบอร์โทรศัพท์
router.put('/me/phone', auth, usersController.updatePhone);
// 7. เปลี่ยนรหัสผ่าน
router.put('/me/password', auth, usersController.updatePassword);
// 8. อัปโหลด/เปลี่ยนรูปโปรไฟล์
router.put('/me/avatar', auth, upload.single('image'), usersController.updateAvatar);

// === Admin Only Routes ===
// 9. ลบผู้ใช้
router.delete('/:id', auth, authorize('admin'), usersController.deleteUser);
// 10. ดึงรายชื่อผู้ใช้ทั้งหมด
router.get('/', auth, authorize('admin'), usersController.getAllUsers);

module.exports = router;
