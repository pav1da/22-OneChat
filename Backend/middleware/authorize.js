/**
 * Role-based authorization middleware
 * ใช้หลัง auth middleware เพื่อเช็คว่า user มี role ที่อนุญาตหรือไม่
 * @param  {...string} allowedRoles - roles ที่อนุญาต เช่น 'admin', 'manager'
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อน' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึง' });
    }

    next();
  };
};

module.exports = authorize;
