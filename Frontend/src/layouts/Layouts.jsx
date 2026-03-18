
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const Layouts = ({ onLogout, user }) => {
  return (
    // 1. Container แม่: ล็อคความสูงเต็มจอ (100vh) และห้ามเลื่อน (overflow: hidden)
    <div className="d-flex" style={{height: '100vh', width: '100vw', overflow: 'hidden' }}> 
       
      <aside style={{ zIndex: 1050, position: 'relative' }}>
        <Sidebar onLogout={onLogout} currentUser={user}/>
      </aside>

      {/* 2. Main Content (กล่องขาว): กำหนดให้ Scroll ได้เฉพาะในนี้ */}
      <div
        style={{
          width: "100vw",
          
          // --- การจัดการ Scroll ---
          boxSizing: "border-box", 
          overflowY: "hidden", // ซ่อน Scroll แนวตั้ง
          overflowX: "hidden", // ซ่อน Scroll แนวนอน
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{padding: '13px 25px', borderBottom: '1px solid var(--border-light)'}}>
          nevbar
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default Layouts;