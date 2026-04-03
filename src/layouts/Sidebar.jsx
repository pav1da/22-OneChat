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
    <div className="sidebar-container d-flex flex-column">

      {/* Top Section: Logo */}
      <div className="top-section">
        <img src="src/assets/Image/Customers/Harumasa.png" className="logo-box" alt="" />
      </div>

      {/* Middle Section: Menu + Profile */}
      <div className="middle-section d-flex flex-column align-items-center">
        {/* Inbox */}
        <NavLink
          to="/inbox"
          className={({ isActive }) =>
            "menu-item justify-content-center " + (isActive ? "active" : "")
          }        >
          <img src="src/assets/Icon/icon-chat.png" className="menu-pic" alt="" />
          <span className="menu-text">Inbox</span>
        </NavLink>

        {/* Note */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            "menu-item justify-content-center " + (isActive ? "active" : "")
          }        >
          <img src="src/assets/Icon/icon-note.png" className="menu-pic" alt="" />
          <span className="menu-text">Note</span>
        </NavLink>

        {/* Card Message */}
        <NavLink
          to=""
          className={({ isActive }) =>
            "menu-item justify-content-center " + (isActive ? "active" : "")
          }        >
          <img src="src/assets/Icon/icon-card-message.png" className="menu-pic" alt="" />
          <span className="menu-text ">Card Message</span>
        </NavLink>


        {/* Notification */}
        <NavLink
          to=""
          className={({ isActive }) =>
            "menu-item justify-content-center " + (isActive ? "active" : "")
          }        >
          <img src="src/assets/Icon/icon-note.png" className="menu-pic" alt="" />
          <span className="menu-text ">Notification </span>
        </NavLink>

        {/* Member */}
        <NavLink
          to=""
          className={({ isActive }) =>
            "menu-item justify-content-center " + (isActive ? "active" : "")
          }        >
          <img src="src/assets/Icon/icon-user-edit.png" className="menu-pic" alt="" />
          <span className="menu-text ">Member</span>
        </NavLink>

        {/* Profile */}
        <NavLink
          to=""
          className={({ isActive }) =>
            "menu-item justify-content-center " + (isActive ? "active" : "")
          }        >
          <img src="src/assets/Image/Customers/Harumasa.png" className="menu-pic" alt="" />
          {/* <span className="menu-text "></span> */}
        </NavLink>

      </div>

      {/* ================= ส่วนล่าง ================= */}
      <div className="d-flex flex-column align-items-center w-100 pb-4 gap-2">
        <Dropdown drop="up" className="w-100 d-flex justify-content-center">
          <Dropdown.Toggle as="div" className={`sidebar-item ${isActive("/setting") ? "active" : ""}`} style={{ cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <i className="bi bi-list" style={{ fontSize: "1.8rem" }}></i>
          </Dropdown.Toggle>

          <ul className="dropdown-menu">
            <li>
              <NavLink to="/setting" className="dropdown-item d-flex align-items-center gap-2">
                <img src="src/assets/Icon/icon-menu.png" width="18" alt="" /> การตั้งค่า
              </NavLink>
            </li>
            <li>
              <NavLink to="/logs" className="dropdown-item d-flex align-items-center gap-2">
                <img src="src/assets/Icon/icon-history.png" width="18" alt="" /> ตรวจสอบบันทึก
              </NavLink>
            </li>
            <li>
              <NavLink to="/mode" className="dropdown-item d-flex align-items-center gap-2">
                <img src="src/assets/Icon/icon-menu.png" width="18" alt="" /> สลับโหมด
              </NavLink>
            </li>
            <li>
              <NavLink to="/logout" className="dropdown-item d-flex align-items-center gap-2">
                <img src="src/assets/Icon/icon-menu.png" width="18" alt="" /> ออกจากระบบ
              </NavLink>
            </li>
          </ul>
        </div>

        {/* AI Chat */}
        <NavLink
          to=""
          className={({ isActive }) =>
            "menu-item justify-content-center " + (isActive ? "active" : "")
          }        >
          <img src="src/assets/Icon/icon-ai.png" className="menu-pic" alt="" />
          <span className="menu-text ">AI Chat </span>
        </NavLink>
      </div>

      <AiPanel show={showAiPanel} handleClose={handleCloseAiPanel} />
    </div>
  );
};

export default Sidebar;