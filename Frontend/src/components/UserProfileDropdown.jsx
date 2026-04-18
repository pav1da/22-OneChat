import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import "./UserProfileDropdown.css";

const UserProfileDropdown = ({
  userImage,
  userName,
  userEmail,
  onLogout,
  onClose,
  onSetting,
}) => {
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleThemeSelect = (selectedTheme) => {
    if (theme !== selectedTheme) {
      toggleTheme();
    }
    setShowThemeMenu(false);
  };

  return (
    <div
      className="user-profile-dropdown kanit-regular"
      ref={dropdownRef}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Section */}
      <div className="upd-top">
        <div className="upd-avatar-wrapper">
          {userImage ? (
            <img src={userImage} alt="user" className="upd-avatar-large" />
          ) : (
            <div className="upd-avatar-large d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '500', borderRadius: '50%' }}>
              No IMG
            </div>
          )}
        </div>
        <div className="upd-name">{userName}</div>
        <div className="upd-email">{userEmail}</div>
      </div>

      <div className="upd-divider"></div>

      {/* Theme Menu Item */}
      <div
        className="upd-menu-item"
        onClick={() => setShowThemeMenu(!showThemeMenu)}
      >
        <i className={`bi ${theme === 'light' ? 'bi-sun' : 'bi-moon-stars-fill'} upd-icon`}></i>
        <span className="upd-menu-text">Theme</span>
        <i className={`bi bi-chevron-${showThemeMenu ? 'down' : 'right'} upd-arrow`}></i>
      </div>

      {/* Theme Submenu */}
      {showThemeMenu && (
        <div className="upd-theme-submenu">
          <div
            className={`upd-theme-option ${theme === 'light' ? 'active' : ''}`}
            onClick={() => handleThemeSelect('light')}
          >
            <i className="bi bi-sun upd-theme-icon"></i>
            <span>สว่าง</span>
            {theme === 'light' && <i className="bi bi-check2 upd-theme-check"></i>}
          </div>
          <div
            className={`upd-theme-option ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => handleThemeSelect('dark')}
          >
            <i className="bi bi-moon-stars-fill upd-theme-icon"></i>
            <span>มืด</span>
            {theme === 'dark' && <i className="bi bi-check2 upd-theme-check"></i>}
          </div>
        </div>
      )}

      {/* Settings */}
      <div
        className="upd-menu-item"
        onClick={() => {
          if (onSetting) {
            onSetting();
          } else {
            navigate("/setting", { state: { background: location } });
          }
          if (onClose) onClose();
        }}
      >
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
