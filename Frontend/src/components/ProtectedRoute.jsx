import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles, user }) => {
  // ถ้ายังไม่ได้ Login ให้กลับไปหน้า Login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // ถ้า Login แล้วแต่ Role ไม่ตรงกับที่อนุญาต -> ล้าง session แล้วไป SignIn
  if (!allowedRoles.includes(user.role)) {
    localStorage.removeItem("myAppUser");
    localStorage.removeItem("token");
    return <Navigate to="/signin" replace />;
  }

  // ถ้าผ่านทุกเงื่อนไข -> ให้เข้าหน้าเว็บได้
  return children;
};

export default ProtectedRoute;
