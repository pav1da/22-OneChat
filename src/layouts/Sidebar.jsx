import React from "react";
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

        {/* Menu */}
        <Nav className="flex-column">
          <Nav.Link href="#dashboard" className="menu-item active">
            <i className="bi bi-columns-gap"></i> Dashboard
          </Nav.Link>
          <Nav.Link href="#inbox" className="menu-item">
            <i className="bi bi-inbox me-2"></i> Inbox
          </Nav.Link>
        </Nav>
      </div>

      {/* Bottom Section */}
      <div className="bottom-section">
        <div className="profile d-flex align-items-center mb-3">
          <div className="profile-pic me-2"></div>
          <div>
            <div className="fw-bold">pav1da</div>
            <div className="small text-muted">admin</div>
          </div>
        </div>

        <Nav className="flex-column">
          <Nav.Link href="#setting" className="menu-item">
            <i className="bi bi-gear me-2"></i> Setting
          </Nav.Link>
          <Nav.Link href="#logout" className="menu-item">
            <i className="bi bi-box-arrow-right me-2"></i> Log out
          </Nav.Link>
        </Nav>
      </div>
    </div>
  );
};

export default Sidebar;
