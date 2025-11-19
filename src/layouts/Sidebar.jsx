import { Nav } from "react-bootstrap";
import "./Sidebar.css";

const Sidebar = ({ collapsed, toggleSidebar }) => {
  return (
    <div
      className={`sidebar-container d-flex flex-column justify-content-between p-3 ${
        collapsed ? "collapsed" : ""
      }`}
    >
      {/* Top Section */}
      <div className="top-section">
        <div className="d-flex align-items-center mb-3">
          <div className="logo-box me-2"></div>
          <span className="logo-text">ONE CHAT</span>
        </div>

        {/* ปุ่มกดย่อ/ขยาย*/}
        <div className="toggle-btn mt-2 mb-4 " onClick={toggleSidebar}>
          {collapsed ? (
            <i class="bi bi-chevron-right"></i>
          ) : (
            <i class="bi bi-chevron-left"></i>
          )}
        </div>

        <Nav className="flex-column">
          <Nav.Link
            href="/dashboard"
            className="menu-item active d-flex align-items-center"
          >
            <i className="bi bi-columns-gap"></i>
            <span className="menu-text ms-2">Dashboard</span>
          </Nav.Link>

          <Nav.Link
            href="/inbox"
            className="menu-item d-flex align-items-center"
          >
            <i className="bi bi-inbox"></i>
            <span className="menu-text ms-2">Inbox</span>
          </Nav.Link>
        </Nav>
      </div>

      {/* Bottom Section */}
      <div className="bottom-section">
        <div className="profile d-flex align-items-center mb-3">
          <div className="profile-pic me-2"></div>
          <div className="profile-info">
            <div className="fw-bold">pav1da</div>
            <div className="small text-muted">admin</div>
          </div>
        </div>

        <Nav className="flex-column">
          <Nav.Link
            href="/setting"
            className="menu-item d-flex align-items-center"
          >
            <i className="bi bi-gear"></i>
            <span className="menu-text ms-2">Setting</span>
          </Nav.Link>
          <Nav.Link
            href="#logout"
            className="menu-item d-flex align-items-center"
          >
            <i className="bi bi-box-arrow-right"></i>
            <span className="menu-text ms-2">Log out</span>
          </Nav.Link>
        </Nav>
      </div>
    </div>
  );
};

export default Sidebar;
