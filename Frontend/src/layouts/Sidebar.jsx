import React, { useState, useEffect, useRef } from "react";
import { Nav, Form } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import UserProfileDropdown from "../components/UserProfileDropdown";
import { io } from "socket.io-client";
import axios from "axios";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Sidebar.css";
import defaultProfile from "../assets/Image/Admins/pav1da.png";

// ==========================================
// Component ย่อยสำหรับ Menu Item (SaaS Style)
// ==========================================
const SidebarItem = ({
  to,
  icon,
  label,
  badge,
  isActive,
  onClick,
  rightIcon,
}) => {
  return (
    <Nav.Link
      as={Link}
      to={to}
      className={`saas-nav-item ${isActive ? "active" : ""}`}
      onClick={onClick}
    >
      <i className={`${icon} saas-nav-icon`}></i>
      <span className="saas-nav-text">{label}</span>

      {badge > 0 && (
        <span className="saas-badge">{badge > 99 ? "99+" : badge}</span>
      )}
      {rightIcon && <i className={`${rightIcon} saas-nav-right-icon`}></i>}
    </Nav.Link>
  );
};

// ==========================================
// Main Component
// ==========================================
const Sidebar = ({ onLogout, currentUser }) => {
  const location = useLocation();
  const isActivePath = (path) => location.pathname.startsWith(path);

  // State
  const [unreadCount, setUnreadCount] = useState(0);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(true);

  const userDropdownRef = useRef(null);

  // User Info
  const userImage =
    currentUser?.image?.startsWith("/") ||
    currentUser?.image?.startsWith("http")
      ? currentUser.image
      : defaultProfile;
  const userName = currentUser?.name || "Workspace";
  const userRole = currentUser?.role || "user";
  const isPrivilegedUserLocal = userRole === "manager" || userRole === "admin";

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(e.target)
      ) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ดึงจำนวน notification + real-time update
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (token) {
      axios
        .get("/api/notifications/unread-count", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setUnreadCount(res.data?.count || 0))
        .catch(() => {});
    }

    const socket = io();
    socket.on("new-message", (msg) => {
      if (msg.sender === "customer") setUnreadCount((prev) => prev + 1);
    });
    return () => socket.disconnect();
  }, []);

  return (
    <div className="saas-sidebar-container kanit-regular">
      <div className="saas-sidebar-inner">
        {/* 1. Header (User Profile / Workspace) อยู่ด้านบนสุด */}
        <div className="saas-header" ref={userDropdownRef}>
          <div
            className="saas-header-btn"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
          >
            <div className="d-flex align-items-center gap-2">
              <img
                src={userImage}
                alt="Profile"
                className="saas-header-avatar"
              />
              <span className="saas-header-title">{userName}</span>
            </div>
            <i className="bi bi-chevron-down saas-header-chevron"></i>
          </div>

          {/* User Profile Dropdown (เปิดลงมาปกติ) */}
          {userDropdownOpen && (
            <div className="saas-user-dropdown-wrapper">
              <UserProfileDropdown
                userImage={userImage}
                userName={userName}
                userEmail={currentUser?.email || "user@onechat.com"}
                onLogout={onLogout}
                onClose={() => setUserDropdownOpen(false)}
              />
            </div>
          )}
        </div>

        {/* 2. Command / Search Box */}
        {/* <div className="saas-command-box">
          <div className="saas-search-wrapper">
            <i className="bi bi-search"></i>
            <Form.Control
              type="text"
              placeholder="Search"
              className="saas-search-input"
            />
          </div>
        </div> */}

        {/* 3. Main Navigation */}
        <div className="saas-scroll-area">
          <div className="saas-section-header">
            <span className="saas-section-title">WORKSPACE</span>
          </div>
          <Nav className="flex-column saas-nav-group">
            <SidebarItem
              to="/mychat"
              icon="bi bi-person"
              label="ข้อความของฉัน"
              isActive={isActivePath("/mychat")}
              badge={99} /* จำนวนข้อความของฉัน */
            />
            <SidebarItem
              to="/allchat"
              icon="bi bi-chat"
              label="ทั้งหมด"
              isActive={isActivePath("/allchat")}
              badge={unreadCount} /* จำนวนข้อความทั้งหมด */
            />
            <SidebarItem
              to="/notes"
              icon="bi bi-card-heading"
              label="Notes"
              isActive={isActivePath("/notes")}
            />
            <SidebarItem
              to="/cardmessage"
              icon="bi bi-journal-bookmark-fill"
              label="Template"
              isActive={isActivePath("/cardmessage")}
            />
            <SidebarItem
              to="/spam"
              icon="bi bi-exclamation-diamond"
              label="กล่องสแปม"
              isActive={isActivePath("/spam")}
            />
          </Nav>

          <hr className="saas-divider" />

          {/* 4. Section: Control */}
          <div className="saas-section">
            <div className="saas-section-header">
              <span className="saas-section-title">CONTROL</span>
            </div>

            <Nav className="flex-column saas-nav-group">
              {(isPrivilegedUserLocal || userRole === "staff") && (
                <>
                  <SidebarItem
                    to="/notification"
                    icon="bi bi-bell"
                    label="Notification"
                    badge={unreadCount}
                    isActive={isActivePath("/notification")}
                    onClick={() => setUnreadCount(0)}
                  />
                  <SidebarItem
                    to="/member"
                    icon="bi bi-people"
                    label="Members"
                    isActive={isActivePath("/member")}
                  />
                  <SidebarItem
                    to="/teams"
                    icon="bi bi-person-workspace"
                    label="Teams"
                    isActive={isActivePath("/teams")}
                  />
                </>
              )}
              {isPrivilegedUserLocal && (
                <SidebarItem
                  to="/log"
                  icon="bi bi-file-earmark-text"
                  label="History"
                  isActive={isActivePath("/log")}
                />
              )}
            </Nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
