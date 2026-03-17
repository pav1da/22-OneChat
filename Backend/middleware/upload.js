const multer = require('multer');
const path = require('path');
const fs = require('fs');

// สร้างโฟลเดอร์ uploads/avatars ถ้ายังไม่มี
const avatarDir = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    // ตั้งชื่อไฟล์: avatar-{userId}-{timestamp}.{ext}
    const ext = path.extname(file.originalname);
    const filename = `avatar-${req.user.emp_id}-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

// อนุญาตเฉพาะไฟล์รูปภาพ
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพ (jpeg, png, gif, webp)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = upload;
