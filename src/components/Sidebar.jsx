// 1. Import Link เข้ามา
import { Link } from "react-router-dom";
import { Nav } from "react-bootstrap";
import "./Sidebar.css";


const Sidebar = () => {
  return (
    <div className="sidebar-container d-flex flex-column justify-content-between p-3">
      {/* Top Section */}
      <div>
        {/* Logo */}
        <div className="d-flex align-items-center mb-5">
          <div className="logo-box me-2"></div>
          <span className="logo-text">ONE CHAT</span>
        </div>


        {/* Menu (แก้ไขตรงนี้) */}
        <Nav className="flex-column">
          {/* เปลี่ยน href="#dashboard" เป็น as={Link} และ to="/dashboard" */}
          <Nav.Link as={Link} to="/dashboard" className="menu-item">
            <i className="bi bi-columns-gap"></i> Dashboard
          </Nav.Link>


          {/* เปลี่ยน href="#inbox" เป็น as={Link} และ to="/inbox" */}
          <Nav.Link as={Link} to="/inbox" className="menu-item">
            <i className="bi bi-inbox me-2"></i> Inbox
          </Nav.Link>
        </Nav>
      </div>


      {/* Bottom Section (แก้ไขตรงนี้) */}
      <div className="bottom-section">
        {/* ... (ส่วน Profile เหมือนเดิม) ... */}
        <div className="profile d-flex align-items-center mb-3">
          {/* ... */}
        </div>


        <Nav className="flex-column">
          {/* เปลี่ยน href="#setting" เป็น as={Link} และ to="/setting" */}
          <Nav.Link as={Link} to="/setting" className="menu-item">
            <i className="bi bi-gear me-2"></i> Setting
          </Nav.Link>


          {/* เปลี่ยน href="#logout" เป็น as={Link} และ to="/signin" (หรือหน้าที่คุณใช้ Log out) */}
          <Nav.Link as={Link} to="/signin" className="menu-item">
            <i className="bi bi-box-arrow-right me-2"></i> Log out
          </Nav.Link>
        </Nav>
      </div>
    </div>
  );
};


export default Sidebar;

