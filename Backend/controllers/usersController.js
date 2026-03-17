const jwt = require('jsonwebtoken');
const User = require('../models/user');
require('dotenv').config();

// =============================================
// 1. POST /api/users/register — ลงทะเบียนผู้ใช้งานใหม่
// =============================================
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
    }

    // ตรวจสอบ email ซ้ำ
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
    }

    // ตรวจสอบ username ซ้ำ
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' });
    }

    // สร้าง user ใหม่
    const newUserId = await User.create({ username, email, password });
    const newUser = await User.findById(newUserId);

    // สร้าง token
    const token = jwt.sign(
      { emp_id: newUser.emp_id, username: newUser.username, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'ลงทะเบียนสำเร็จ',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลงทะเบียน' });
  }
};

// =============================================
// 2. POST /api/users/login — เข้าสู่ระบบ
// =============================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    // เทียบ password (plain text ตาม DB schema ปัจจุบัน)
    if (user.password !== password) {
      return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    // สร้าง token
    const token = jwt.sign(
      { emp_id: user.emp_id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ส่ง user กลับโดยไม่มี password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: userWithoutPassword
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
  }
};

// =============================================
// 3. GET /api/users/me — ดึงข้อมูลผู้ใช้ปัจจุบัน
// =============================================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.emp_id);
    if (!user) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }
    res.json(user);
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// =============================================
// 4. PUT /api/users/me/username — เปลี่ยนชื่อผู้ใช้
// =============================================
exports.updateUsername = async (req, res) => {
  try {
    const { username, currentPassword } = req.body;

    if (!username || !currentPassword) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
    }

    // ตรวจสอบ password
    const user = await User.findByIdWithPassword(req.user.emp_id);
    if (user.password !== currentPassword) {
      return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
    }

    // ตรวจสอบ username ซ้ำ
    const existing = await User.findByUsername(username);
    if (existing && existing.emp_id !== req.user.emp_id) {
      return res.status(400).json({ message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' });
    }

    await User.updateUsername(req.user.emp_id, username);
    const updatedUser = await User.findById(req.user.emp_id);

    res.json({ message: 'เปลี่ยนชื่อผู้ใช้สำเร็จ', user: updatedUser });
  } catch (err) {
    console.error('UpdateUsername error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// =============================================
// 5. PUT /api/users/me/email — เปลี่ยนอีเมล
// =============================================
exports.updateEmail = async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body;

    if (!newEmail || !currentPassword) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
    }

    // ตรวจสอบ password
    const user = await User.findByIdWithPassword(req.user.emp_id);
    if (user.password !== currentPassword) {
      return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
    }

    // ตรวจสอบ email ซ้ำ
    const existing = await User.findByEmail(newEmail);
    if (existing && existing.emp_id !== req.user.emp_id) {
      return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
    }

    await User.updateEmail(req.user.emp_id, newEmail);
    res.json({ message: 'เปลี่ยนอีเมลสำเร็จ' });
  } catch (err) {
    console.error('UpdateEmail error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// =============================================
// 6. PUT /api/users/me/phone — เปลี่ยนเบอร์โทรศัพท์
// =============================================
exports.updatePhone = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'กรุณากรอกเบอร์โทรศัพท์' });
    }

    await User.updatePhone(req.user.emp_id, phone);
    res.json({ message: 'เปลี่ยนเบอร์โทรศัพท์สำเร็จ' });
  } catch (err) {
    console.error('UpdatePhone error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// =============================================
// 7. PUT /api/users/me/password — เปลี่ยนรหัสผ่าน
// =============================================
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
    }

    // ตรวจสอบ password เดิม
    const user = await User.findByIdWithPassword(req.user.emp_id);
    if (user.password !== currentPassword) {
      return res.status(401).json({ message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
    }

    await User.updatePassword(req.user.emp_id, newPassword);
    res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (err) {
    console.error('UpdatePassword error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// =============================================
// 8. PUT /api/users/me/avatar — อัปโหลด/เปลี่ยนรูปโปรไฟล์
// =============================================
exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'กรุณาเลือกไฟล์รูปภาพ' });
    }

    const imageUrl = `/uploads/avatars/${req.file.filename}`;
    res.json({ message: 'อัปโหลดรูปโปรไฟล์สำเร็จ', imageUrl });
  } catch (err) {
    console.error('UpdateAvatar error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// =============================================
// 9. DELETE /api/users/:id — ลบผู้ใช้ (admin only)
// =============================================
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }

    await User.deleteById(id);
    res.json({ message: 'ลบผู้ใช้สำเร็จ' });
  } catch (err) {
    console.error('DeleteUser error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// =============================================
// 10. GET /api/users — ดึงรายชื่อผู้ใช้ทั้งหมด (admin only)
// =============================================
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    console.error('GetAllUsers error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};
