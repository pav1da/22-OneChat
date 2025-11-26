import { Nav } from "react-bootstrap";
import { Link } from "react-router-dom";
import "./Sidebar.css";


const Sidebar = ({ collapsed, toggleSidebar, onLogout }) => {
  return (
    <div
      className={`sidebar-container d-flex flex-column justify-content-between p-3 ${collapsed ? "collapsed" : ""
        }`}
    >
      {/* Top Section */}
      <div className="top-section">
        <div className="d-flex align-items-center mb-3">
          <div className="logo-box me-2"></div>
          {/* <span className="logo-text">ONE CHAT</span> */}
        </div>

        {/* ปุ่มกดย่อ/ขยาย*/}
        {/* <div className="toggle-btn mt-2 mb-4 " onClick={toggleSidebar}>
          {collapsed ? (
            <i className="bi bi-chevron-right"></i>
          ) : (
            <i className="bi bi-chevron-left"></i>
          )}
        </div> */}

        <Nav className="flex-column">
          {/* Inbox */}
          <Nav.Link
            as={Link}
            to="/inbox"
            className="menu-item"
          >
            <img src="src/assets/Icon/icon-chat.png" className="menu-pic" alt="" />
            <span className="menu-text ">Inbox</span>
          </Nav.Link>

          {/* Card Message */}
          <Nav.Link
            as={Link}
            to="/dashboard"
            className="menu-item"
          >
            <img src="src/assets/Icon/icon-card-message.png" className="menu-pic" alt="" />
            <span className="menu-text ">Card Message</span>
          </Nav.Link>


          {/* Note */}
          <Nav.Link
            as={Link}
            to="/dashboard"
            className="menu-item"
          >
            <img src="src/assets/Icon/icon-note.png" className="menu-pic" alt="" />
            <span className="menu-text ">Note</span>
          </Nav.Link>

          {/* Member */}
          <Nav.Link
            as={Link}
            to="/dashboard"
            className="menu-item"
          >
            <img src="src/assets/Icon/icon-user-edit.png" className="menu-pic" alt="" />
            <span className="menu-text ">Member</span>
          </Nav.Link>

          {/* Log */}
          <Nav.Link
            as={Link}
            to="/dashboard"
            className="menu-item"
          >
            <img src="src/assets/Icon/icon-chat.png" className="menu-pic" alt="" />
            <span className="menu-text ">Log</span>
          </Nav.Link>
        </Nav>
      </div>

      {/* Bottom Section */}
      <div className="bottom-section">
        <div className="profile d-flex align-items-center mb-3">
          <div className="profile-pic me-2"></div>
          <div className="profile-info">
            {/* <div className="fw-bold">pav1da</div>
            <div className="small text-muted">admin</div> */}
          </div>
        </div>

        <Nav className="flex-column">
          {/* Menu */}
          <Nav.Link
            as={Link}
            to="/setting"
            className="menu-item "
          >
            <img src="src/assets/Icon/icon-menu.png" className="menu-pic" alt="" />
            <span className="menu-text">Menu</span>
          </Nav.Link>

          {/* AI Chat */}
          <Nav.Link
            onClick={onLogout}
            style={{ cursor: "pointer" }}
            className="menu-item "
          >
            <img src="src/assets/Icon/icon-ai.png"className="menu-pic" alt="" />
            <span className="menu-text">AI Chat</span>
          </Nav.Link>
        </Nav>
      </div>
    </div>
  );
};

export default Sidebar;