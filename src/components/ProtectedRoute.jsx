import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles, user }) => {
  
  // ถ้ายังไม่ได้ Login เตะแม่งไป Login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // ถ้า Login แล้วแต่Role ไม่ตรงกับที่อนุญาต -> ดีดไปหน้า Unauthorized กูยังไม่ทำช่างแม่มัน
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ถ้าผ่านทุกเงื่อนไข -> ให้เข้าหน้าเว็บได้
  return children;
};

export default ProtectedRoute;