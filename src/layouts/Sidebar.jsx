import { Nav } from "react-bootstrap";
import { useState } from "react";
import "./Sidebar.css";

const Sidebar = ({ collapsed, toggleSidebar }) => {
  return (
    <div className={`sidebar-container p-3 position-relative ${collapsed ? "collapsed" : ""}`}>
      
      {/* ปุ่ม Toggle */}
      <div className="toggle-btn" onClick={toggleSidebar}>
        {collapsed ? ">" : "<"}
      </div>

      {/* Top Section */}
      <div>
        <div className="d-flex align-items-center mb-5">
          <div className="logo-box me-2"></div>
          <span className="logo-text">ONE CHAT</span>
        </div>

        <Nav className="flex-column">
          <Nav.Link href="#dashboard" className="menu-item active d-flex align-items-center">
            <i className="bi bi-columns-gap"></i>
            <span className="menu-text ms-2">Dashboard</span>
          </Nav.Link>

          <Nav.Link href="#inbox" className="menu-item d-flex align-items-center">
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
          <Nav.Link href="#setting" className="menu-item d-flex align-items-center">
            <i className="bi bi-gear"></i>
            <span className="menu-text ms-2">Setting</span>
          </Nav.Link>

          <Nav.Link href="#logout" className="menu-item d-flex align-items-center">
            <i className="bi bi-box-arrow-right"></i>
            <span className="menu-text ms-2">Log out</span>
          </Nav.Link>
        </Nav>
      </div>

    </div>
  );
};

export default Sidebar;
