
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const Layouts = ({ onLogout }) => {
  return (
    // 1. Container แม่: ล็อคความสูงเต็มจอ (100vh) และห้ามเลื่อน (overflow: hidden)
    <div className="d-flex" style={{height: '100vh', width: '100vw', overflow: 'hidden' }}> 
       
      <aside>
        <Sidebar onLogout={onLogout} />
      </aside>

      {/* 2. Main Content (กล่องขาว): กำหนดให้ Scroll ได้เฉพาะในนี้ */}
      <div
        className="flex-grow-1"
        style={{
          // --- จัดตำแหน่ง (Position) ---
          marginLeft: "100px", 
          marginTop: "20px",
          marginBottom: "20px",

          // --- จัดขนาด (Size) ---
          width: "calc(100% - 160px)", // เว้นขวาพอประมาณ
          height: "calc(100vh - 40px)", // ความสูงเต็มจอ ลบขอบบนล่าง
          
          // --- ตกแต่ง (Decoration) ---
          
          borderRadius: "30px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          
          // --- การจัดการ Scroll ---
          boxSizing: "border-box", 
          overflowY: "hidden", // ซ่อน Scroll แนวตั้ง
          overflowX: "hidden", // ซ่อน Scroll แนวนอน
        }}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default Layouts;