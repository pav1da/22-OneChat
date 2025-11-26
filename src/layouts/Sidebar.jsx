import { NavLink } from "react-router-dom";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./Sidebar.css";


const Sidebar = ({ toggleSidebar, onLogout }) => {
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






      {/* Bottom Section: Dropup */}
      <div className="bottom-section d-flex flex-column align-items-center">
        <div className="btn-group dropup w-100 mb-2">
          <button className="menu-item menu-btn dropdown-toggle w-100" data-bs-toggle="dropdown" aria-expanded="false">
            <img src="src/assets/Icon/icon-menu.png" className="menu-pic" alt="" />
            <span className="menu-text">Menu</span>
          </button>

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
    </div>
  );
};

export default Sidebar;