import { Nav } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useTeam } from "../context/TeamContext";
import UserProfileDropdown from "../components/UserProfileDropdown";
import defaultProfile from "../assets/Image/Admins/pav1da.png";
import { io } from "socket.io-client";
import axios from "axios";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Sidebar.css";

const Sidebar = ({ onLogout, currentUser }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname.startsWith(path);

  const userImage =
    currentUser?.image?.startsWith("/") ||
    currentUser?.image?.startsWith("http")
      ? currentUser.image
      : defaultProfile;
  const userName = currentUser?.name || "User";

  const [starredOpen, setStarredOpen] = useState(true);
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const teamDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

  const {
    teams: visibleTeams,
    selectedTeam,
    setSelectedTeam,
    isAllTeams,
    isPrivilegedUser,
  } = useTeam();

  const isPrivilegedUserLocal =
    currentUser?.role === "manager" || currentUser?.role === "admin";

  // ดึงจำนวน notification ที่ยังไม่อ่าน + real-time update
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    const userId = String(user?.emp_id);

    // Fetch initial count
    if (token) {
      axios
        .get("/api/notifications/unread-count", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setUnreadCount(res.data?.count || 0))
        .catch(() => {});
    }

    // Socket.IO: ใช้ new-message เป็น trigger (เพราะทำงาน real-time ได้ปกติ)
    const socket = io();
    socket.on("new-message", (msg) => {
      // เฉพาะข้อความจากลูกค้า → เพิ่ม badge 1
      if (msg.sender === "customer") {
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => socket.disconnect();
  }, []);

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        teamDropdownRef.current &&
        !teamDropdownRef.current.contains(e.target)
      ) {
        setTeamDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectTeam = (team) => {
    setSelectedTeam(team);
    setTeamDropdownOpen(false);
  };

  const handleSelectAllTeams = () => {
    setSelectedTeam(null);
    setTeamDropdownOpen(false);
  };

  // ชื่อทีมที่แสดงใน header
  const displayTeamName = isAllTeams
    ? "All teams"
    : selectedTeam?.name || `${userName}'s team`;

  const displayTeamColor = selectedTeam?.color || "#9C27B0";
  const displayTeamInitial = isAllTeams
    ? "A"
    : displayTeamName.charAt(0).toUpperCase();

  return (
    <div className="kanit-regular sidebar-container">
      {/* User Profile Header */}
      <div
        className="sidebar-header my-3"
        ref={userDropdownRef}
        style={{ position: "relative" }}
      >
        <div
          className="sidebar-user-info"
          onClick={() => setUserDropdownOpen(!userDropdownOpen)}
          style={{ cursor: "pointer" }}
        >
          <img src={userImage} alt="Profile" className="sidebar-avatar" />
          <span className="sidebar-username">
            {userName}{" "}
            <i
              className="bi bi-chevron-down"
              style={{ marginLeft: "0.5rem", fontSize: "0.6rem" }}
            ></i>
          </span>
        </div>

        {userDropdownOpen && (
          <UserProfileDropdown
            userImage={userImage}
            userName={userName}
            userEmail={currentUser?.email || "pavida.jg@gmail.com"}
            onLogout={onLogout}
            onClose={() => setUserDropdownOpen(false)}
          />
        )}
      </div>
      {/* Main Nav */}
      <Nav className="flex-column sidebar-nav">
        <Nav.Link
          as={Link}
          to="/allchat"
          className={`sidebar-nav-item ${isActive("/allchat") ? "active" : ""}`}
        >
          <i className="bi bi-chat"></i>
          <span>Inbox</span>
        </Nav.Link>

        <Nav.Link
          as={Link}
          to="/notification"
          className={`sidebar-nav-item ${isActive("/notification") ? "active" : ""}`}
          onClick={() => setUnreadCount(0)}
        >
          <i className="bi bi-bell"></i>
          <span>การแจ้งเตือน</span>
          {unreadCount > 0 && (
            <span className="sidebar-notif-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Nav.Link>
        <Nav.Link
          as={Link}
          to="/notes"
          className={`sidebar-nav-item ${isActive("/notes") ? "active" : ""}`}
        >
          <i className="bi bi-file-earmark"></i>
          <span>Notes</span>
        </Nav.Link>
        <Nav.Link
          as={Link}
          to="/cardmessage"
          className={`sidebar-nav-item ${isActive("/cardmessage") ? "active" : ""}`}
        >
          <i className="bi bi-grid-3x3-gap"></i>
          <span>Templates</span>
        </Nav.Link>
      </Nav>

      <div className="sidebar-divider"></div>

      {/* Starred Section */}
      <div className="sidebar-starred-section">
        <button
          className="sidebar-starred-toggle"
          onClick={() => setStarredOpen(!starredOpen)}
        >
          <i
            className={`bi bi-chevron-${starredOpen ? "down" : "right"}`}
            style={{ fontSize: "0.65rem" }}
          ></i>
          <span>control</span>
        </button>
        {starredOpen && (
          <Nav className="flex-column sidebar-nav sidebar-starred-list">
            {(isPrivilegedUserLocal || currentUser?.role === "staff") && (
              <>
                <Nav.Link
                  as={Link}
                  to="/member"
                  className={`sidebar-nav-item ${isActive("/member") ? "active" : ""}`}
                >
                  <i className="bi bi-people"></i>
                  <span>Members</span>
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/teams"
                  className={`sidebar-nav-item ${isActive("/teams") ? "active" : ""}`}
                >
                  <i className="bi bi-people"></i>
                  <span>Teams</span>
                </Nav.Link>
              </>
            )}
            {(isPrivilegedUserLocal || currentUser?.role === "admin") && (
              <>
                <Nav.Link
                  as={Link}
                  to="/log"
                  className={`sidebar-nav-item ${isActive("/log") ? "active" : ""}`}
                >
                  <i className="bi bi-file-earmark-text"></i>
                  <span>ตรวจสอบบันทึก</span>
                </Nav.Link>

                {/* <Nav.Link
                  as={Link}
                  to="/tokenreport"
                  className={`sidebar-nav-item ${isActive("/tokenreport") ? "active" : ""}`}
                >
                  <i className="bi bi-bar-chart-line"></i>
                  <span>รายงาน Token</span>
                </Nav.Link> */}
              </>
            )}
          </Nav>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
