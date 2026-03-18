import React, { useEffect, useRef } from "react";
import "./UserProfileDropdown.css";

const UserProfileDropdown = ({
  userImage,
  userName,
  userEmail,
  onLogout,
  onClose,
}) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    // Use mousedown to detect outside clicks
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      className="user-profile-dropdown kanit-regular"
      ref={dropdownRef}
      onClick={(e) => e.stopPropagation()} // Prevent click from bubbling up to the toggle button
    >
      {/* Top Section */}
      <div className="upd-top">
        <div className="upd-avatar-wrapper">
          <img src={userImage} alt="user" className="upd-avatar-large" />
        </div>
        <div className="upd-name">{userName}</div>
        <div className="upd-email">{userEmail}</div>
      </div>

      <div className="upd-divider"></div>

      {/* Menu Items */}
      <div className="upd-menu-item">
        <i className="bi bi-window-sidebar upd-icon"></i>
        <span className="upd-menu-text">Theme</span>
        <i className="bi bi-chevron-right upd-arrow"></i>
      </div>
      <div className="upd-menu-item">
        <i className="bi bi-sliders2 upd-icon"></i>
        <span className="upd-menu-text">Settings</span>
      </div>

      <div className="upd-divider"></div>

      <div className="upd-menu-item" onClick={onLogout}>
        <i className="bi bi-box-arrow-right upd-icon"></i>
        <span className="upd-menu-text">Log out</span>
      </div>
    </div>
  );
};

export default UserProfileDropdown;
