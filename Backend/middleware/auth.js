const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'ไม่พบ Token กรุณาเข้าสู่ระบบ' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // attach user info ไว้ใน req.user
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
  }
};

module.exports = auth;
