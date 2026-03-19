
import { Outlet, useLocation } from "react-router-dom";
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
        <div style={{padding: '13px 25px', borderBottom: '1px solid var(--border-light)', position: 'sticky', top: 0, zIndex: 1200, background: 'var(--bg-main, #fff)'}}>
          <NavIndicator />
        </div>
        
        <Outlet />
      </div>
    </div>
  );
};

const NavIndicator = () => {
  const location = useLocation();

  // map base paths (first segment) to readable names
  const baseMap = {
    '': 'Home',
    home: 'Home',
    dashboard: 'Dashboard',
    inbox: 'Inbox',
    allchat: 'All Chat',
    cardmessage: 'Card Message',
    log: 'Log',
    notification: 'Notification',
    member: 'Member',
    tokenreport: 'Token Report',
    setting: 'Setting',
  };

  const segments = location.pathname.split('/').filter(Boolean);
  const base = segments[0] || '';
  const baseName = baseMap[base] || (base ? base.replace(/-/g, ' ') : 'Page');

  // If there's an id or parameter after the base, show it as secondary info
  let secondary = null;
  if (segments.length > 1) {
    const param = segments.slice(1).join('/');
    // if looks like numeric id or uuid-ish, display short version
    if (/^[0-9]+$/.test(param)) secondary = param;
    else if (/^[0-9a-fA-F\-]{8,}$/.test(param)) secondary = param.substring(0, 8) + '...';
    else secondary = param.replace(/-/g, ' ');
  }

  return (
    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
      <strong>{baseName}</strong>
      {secondary && <span style={{color: 'var(--text-muted, #6c757d)'}}>/ {secondary}</span>}
    </div>
  );
};

export default Layouts;