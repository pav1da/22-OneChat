const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController.js');
const auth = require('../middleware/auth.js');
const authorize = require('../middleware/authorize.js');
const upload = require('../middleware/upload.js');

// ============================================================
//  Swagger Component Schemas
// ============================================================

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         emp_id:
 *           type: integer
 *           example: 1
 *         username:
 *           type: string
 *           example: "johndoe"
 *         email:
 *           type: string
 *           example: "john@example.com"
 *         phone:
 *           type: string
 *           example: "0812345678"
 *         role:
 *           type: string
 *           example: "staff"
 *         image:
 *           type: string
 *           nullable: true
 *           example: "/uploads/avatars/avatar1.jpg"
 *         created_at:
 *           type: string
 *           example: "2026-03-01 12:00:00"
 *
 *     LoginResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "เข้าสู่ระบบสำเร็จ"
 *         token:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5..."
 *         user:
 *           $ref: '#/components/schemas/User'
 *
 *     RegisterResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "ลงทะเบียนสำเร็จ"
 *         token:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5..."
 *         user:
 *           $ref: '#/components/schemas/User'
 */

// ============================================================
//  Routes
// ============================================================

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: จัดการผู้ใช้งาน (Authentication & Profile)
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: ลงทะเบียนผู้ใช้งานใหม่
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: "johndoe"
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: ลงทะเบียนสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponse'
 *       400:
 *         description: ข้อมูลไม่ครบ / อีเมลหรือ username ซ้ำ
 *       500:
 *         description: Server error
 */
// POST /api/users/register — ลงทะเบียนผู้ใช้งานใหม่
router.post('/register', usersController.register);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: เข้าสู่ระบบ (รองรับ username หรือ email)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, password]
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: "ชื่อผู้ใช้หรืออีเมล"
 *                 example: "johndoe"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: เข้าสู่ระบบสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: ข้อมูลไม่ครบ
 *       401:
 *         description: ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง
 *       500:
 *         description: Server error
 */
// POST /api/users/login — เข้าสู่ระบบสมาชิก
router.post('/login', usersController.login);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: ดึงข้อมูลผู้ใช้ปัจจุบัน
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: ไม่พบ Token / Token หมดอายุ
 *       404:
 *         description: ไม่พบผู้ใช้
 *       500:
 *         description: Server error
 */
// GET /api/users/me — ดึงข้อมูลส่วนตัวของผู้ใช้ปัจจุบัน
router.get('/me', auth, usersController.getMe);

/**
 * @swagger
 * /api/users/me/displayname:
 *   put:
 *     summary: เปลี่ยนชื่อแสดงผล
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [displayName]
 *             properties:
 *               displayName:
 *                 type: string
 *                 example: "NewDisplayName"
 *     responses:
 *       200:
 *         description: เปลี่ยนชื่อแสดงผลสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ครบ
 *       500:
 *         description: Server error
 */
// PUT /api/users/me/displayname — อัปเดตชื่อแสดงผล (Display Name)
router.put('/me/displayname', auth, usersController.updateDisplayName);

/**
 * @swagger
 * /api/users/me/username:
 *   put:
 *     summary: เปลี่ยนชื่อผู้ใช้
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, currentPassword]
 *             properties:
 *               username:
 *                 type: string
 *                 example: "newusername"
 *               currentPassword:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: เปลี่ยนชื่อผู้ใช้สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "เปลี่ยนชื่อผู้ใช้สำเร็จ"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: ข้อมูลไม่ครบ / ชื่อผู้ใช้ซ้ำ
 *       401:
 *         description: รหัสผ่านไม่ถูกต้อง
 *       500:
 *         description: Server error
 */
// PUT /api/users/me/username — เปลี่ยนชื่อผู้ใช้ (Username)
router.put('/me/username', auth, usersController.updateUsername);

/**
 * @swagger
 * /api/users/me/email:
 *   put:
 *     summary: เปลี่ยนอีเมล
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newEmail, currentPassword]
 *             properties:
 *               newEmail:
 *                 type: string
 *                 example: "newemail@example.com"
 *               currentPassword:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: เปลี่ยนอีเมลสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ครบ / อีเมลซ้ำ
 *       401:
 *         description: รหัสผ่านไม่ถูกต้อง
 *       500:
 *         description: Server error
 */
// PUT /api/users/me/email — เปลี่ยนอีเมล (Email)
router.put('/me/email', auth, usersController.updateEmail);

/**
 * @swagger
 * /api/users/me/phone:
 *   put:
 *     summary: เปลี่ยนเบอร์โทรศัพท์
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "0899999999"
 *     responses:
 *       200:
 *         description: เปลี่ยนเบอร์โทรศัพท์สำเร็จ
 *       400:
 *         description: ไม่ได้ระบุเบอร์โทรศัพท์
 *       401:
 *         description: ไม่พบ Token
 *       500:
 *         description: Server error
 */
// PUT /api/users/me/phone — เปลี่ยนเบอร์โทรศัพท์ (Phone)
router.put('/me/phone', auth, usersController.updatePhone);

/**
 * @swagger
 * /api/users/me/password:
 *   put:
 *     summary: เปลี่ยนรหัสผ่าน
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "password123"
 *               newPassword:
 *                 type: string
 *                 example: "newpassword456"
 *     responses:
 *       200:
 *         description: เปลี่ยนรหัสผ่านสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ครบ
 *       401:
 *         description: รหัสผ่านปัจจุบันไม่ถูกต้อง
 *       500:
 *         description: Server error
 */
// PUT /api/users/me/password — เปลี่ยนรหัสผ่าน (Password)
router.put('/me/password', auth, usersController.updatePassword);

/**
 * @swagger
 * /api/users/me/avatar:
 *   put:
 *     summary: อัปโหลด/เปลี่ยนรูปโปรไฟล์
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: "ไฟล์รูปภาพ (jpg, png, etc.)"
 *     responses:
 *       200:
 *         description: อัปโหลดรูปโปรไฟล์สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "อัปโหลดรูปโปรไฟล์สำเร็จ"
 *                 imageUrl:
 *                   type: string
 *                   example: "/uploads/avatars/abc123.jpg"
 *       400:
 *         description: ไม่ได้เลือกไฟล์
 *       401:
 *         description: ไม่พบ Token
 *       500:
 *         description: Server error
 */
// PUT /api/users/me/avatar — อัปโหลดรูปโปรไฟล์ (Avatar)
router.put('/me/avatar', auth, upload.single('image'), usersController.updateAvatar);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: ลบผู้ใช้ (Admin Only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "รหัสผู้ใช้ (emp_id)"
 *         example: 5
 *     responses:
 *       200:
 *         description: ลบผู้ใช้สำเร็จ
 *       401:
 *         description: ไม่พบ Token
 *       403:
 *         description: ไม่มีสิทธิ์ (ต้องเป็น admin)
 *       404:
 *         description: ไม่พบผู้ใช้
 *       500:
 *         description: Server error
 */
// DELETE /api/users/:id — ลบข้อมูลผู้ใช้งาน (Admin เท่านั้น)
router.delete('/:id', auth, authorize('admin'), usersController.deleteUser);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: ดึงรายชื่อผู้ใช้ทั้งหมด (Admin Only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: ไม่พบ Token
 *       403:
 *         description: ไม่มีสิทธิ์ (ต้องเป็น admin)
 *       500:
 *         description: Server error
 */
// GET /api/users — ดึงรายชื่อผู้ใช้ทั้งหมด
router.get('/', auth, usersController.getAllUsers);

// GET /api/users/:id — ดึงข้อมูลผู้ใช้ตาม ID
router.get('/:id', auth, usersController.getUserById);

module.exports = router;
