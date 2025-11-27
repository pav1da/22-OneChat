import { Nav, Dropdown } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Sidebar.css";
import { useState } from "react";
import AiPanel from "../components/AiPanel";

const Sidebar = ({ onLogout, currentUser }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname.startsWith(path);
  
  const defaultProfile = "/img/default.png"; 
  const userImage = currentUser?.image || defaultProfile;

  const [showAiPanel, setShowAiPanel] = useState(false);

  const handleShowAiPanel = () => setShowAiPanel(true);
  const handleCloseAiPanel = () => setShowAiPanel(false);

  const handleThemeToggle = () => {
    console.log("Toggle Theme Clicked");
    alert("ฟังก์ชันเปลี่ยนธีม (Light/Dark) จะทำงานเมื่อเชื่อมต่อระบบ Theme");
  };

  const handleAiClick = (event) => {
    setShowAiPanel((prev) => !prev);
  };

  // ✅ เช็คสิทธิ์ตรงนี้ (หรือจะเช็ค Inline ใน JSX เลยก็ได้)
  const isPrivilegedUser = currentUser?.role === 'it' || currentUser?.role === 'admin';

  return (
    <div className="kanit-regular sidebar-container d-flex flex-column justify-content-between">
      {/* ... (ส่วนบน Menu เหมือนเดิม) ... */}
      <div className="d-flex flex-column align-items-center w-100 pt-4">
        {/* ... Logo & Nav ... */}
        <div className="brand-logo mb-5">
          <img src="/public/sb-logo.png" alt="Logo" style={{ width: "90%", height: "auto" }} />
        </div>
        <Nav className="flex-column w-100 align-content-center gap-2">
           {/* ... Nav Links ... */}
           <Nav.Link as={Link} to="/allchat" className={`sidebar-item ${isActive("/allchat") ? "active" : ""}`}><i className="bi bi-chat-square-dots"></i></Nav.Link>
           <Nav.Link as={Link} to="/dashboard" className={`sidebar-item ${isActive("/dashboard") ? "active" : ""}`}><i className="bi bi-columns-gap"></i></Nav.Link>
           <Nav.Link as={Link} to="/cardmessage" className={`sidebar-item ${isActive("/cardmessage") ? "active" : ""}`}><i className="bi bi-files"></i></Nav.Link>
           <Nav.Link as={Link} to="/notification" className={`sidebar-item ${isActive("/notification") ? "active" : ""}`}><i className="bi bi-bell"></i></Nav.Link>
           <Nav.Link as={Link} to="/member" className={`sidebar-item ${isActive("/member") ? "active" : ""}`}><i className="bi bi-person"></i></Nav.Link>
           
           <div className="sidebar-profile mb-2">
            <img src={userImage} alt="Profile" style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }} />
          </div>
        </Nav>
      </div>

      {/* ================= ส่วนล่าง ================= */}
      <div className="d-flex flex-column align-items-center w-100 pb-4 gap-2">
        <Dropdown drop="up" className="w-100 d-flex justify-content-center">
          <Dropdown.Toggle as="div" className={`sidebar-item ${isActive("/setting") ? "active" : ""}`} style={{ cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <i className="bi bi-list" style={{ fontSize: "1.8rem" }}></i>
          </Dropdown.Toggle>

          <Dropdown.Menu className="mb-2 shadow border-0 rounded-4 p-2" style={{ minWidth: "220px" }}>
            
            {/* 1. Setting (ทุกคนเห็น) */}
            <Dropdown.Item as={Link} to="/setting" className="py-3">
              <i className="bi bi-gear me-2"></i> Setting
            </Dropdown.Item>

            {/* 🔒 2. & 3. เฉพาะ IT หรือ Admin เท่านั้นที่เห็น */}
            {isPrivilegedUser && (
              <>
                <Dropdown.Item as={Link} to="/log" className="py-3">
                  <i className="bi bi-file-earmark-text me-2"></i> ตรวจสอบบันทึก
                </Dropdown.Item>

                <Dropdown.Item as={Link} to="/tokenreport" className="py-3">
                  <i className="bi bi-bar-chart-line me-2"></i> รายงานการใช้ Token
                </Dropdown.Item>
              </>
            )}

            {/* 4. สลับโหมด */}
            <Dropdown.Item onClick={handleThemeToggle} className="py-3">
              <i className="bi bi-moon-stars me-2"></i> สลับโหมด (Light/Dark)
            </Dropdown.Item>

            <Dropdown.Divider />

            {/* 5. ออกจากระบบ */}
            <Dropdown.Item onClick={onLogout} className="text-danger py-3">
              <i className="bi bi-box-arrow-right me-2"></i> ออกจากระบบ
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        <div className={`sidebar-item ${showAiPanel ? "active" : ""}`} onClick={handleAiClick} style={{ cursor: "pointer" }}>
          <i className={`bi bi-${showAiPanel ? "x-circle" : "circle"}`}></i>
        </div>
      </div>

      <AiPanel show={showAiPanel} handleClose={handleCloseAiPanel} />
    </div>
  );
};

export default Sidebar;