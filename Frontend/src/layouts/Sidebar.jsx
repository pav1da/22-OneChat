import React, { useState, useEffect, useRef, useMemo } from "react";
import { Nav, Form } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import UserProfileDropdown from "../components/UserProfileDropdown";
import { useChat } from "../context/ChatContext";
import { io } from "socket.io-client";
import axios from "axios";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Sidebar.css";

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

  // ดึง unreadCounts + customers จาก ChatContext (real-time จาก Socket.IO)
  const { unreadCounts, customers } = useChat();

  // State
  const [notifUnreadCount, setNotifUnreadCount] = useState(0);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(true);

  const userDropdownRef = useRef(null);

  // === คำนวณ badge สำหรับ My Chat และ All Chat ===
  // All Chat = ผลรวม unread ทั้งหมดจากทุกลูกค้า
  // My Chat = เฉพาะลูกค้าที่ assigned_to === currentUser.emp_id
  const allChatUnread = useMemo(() => {
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  }, [unreadCounts]);

  const myChatUnread = useMemo(() => {
    const myEmpId = currentUser?.emp_id;
    if (!myEmpId) return 0;
    // หา customer IDs ที่ assign ให้ฉัน
    const myCustomerIds = new Set(
      customers.filter((c) => c.assigned_to === myEmpId).map((c) => c.id),
    );
    // รวม unread เฉพาะลูกค้าที่ assign ให้ฉัน
    return Object.entries(unreadCounts).reduce((sum, [cusId, count]) => {
      return myCustomerIds.has(Number(cusId)) ? sum + count : sum;
    }, 0);
  }, [unreadCounts, customers, currentUser?.emp_id]);

  // User Info
  const userImage =
    currentUser?.image?.startsWith("/") ||
    currentUser?.image?.startsWith("http")
      ? currentUser.image
      : null;
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

  // ดึงจำนวน notification (bell icon) + real-time update
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (token) {
      axios
        .get("/api/notifications/unread-count", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setNotifUnreadCount(res.data?.count || 0))
        .catch(() => {});
    }

    const socket = io();
    socket.on("new-message", (msg) => {
      if (msg.sender === "customer") setNotifUnreadCount((prev) => prev + 1);
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
              {userImage ? (
                <img
                  src={userImage}
                  alt="Profile"
                  className="saas-header-avatar"
                />
              ) : (
                <div className="saas-header-avatar d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)', fontSize: '0.55rem', fontWeight: '500' }}>
                  No IMG
                </div>
              )}
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
              badge={myChatUnread} /* จำนวน unread ของฉัน (real-time) */
            />
            <SidebarItem
              to="/allchat"
              icon="bi bi-chat"
              label="ทั้งหมด"
              isActive={isActivePath("/allchat")}
              badge={allChatUnread} /* จำนวน unread ทั้งหมด (real-time) */
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
                    badge={notifUnreadCount}
                    isActive={isActivePath("/notification")}
                    onClick={() => setNotifUnreadCount(0)}
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
