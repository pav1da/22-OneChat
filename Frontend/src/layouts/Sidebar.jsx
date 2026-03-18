import { Nav } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useTeam } from "../context/TeamContext";
import UserProfileDropdown from "../components/UserProfileDropdown";
import defaultProfile from "../assets/Image/Admins/pav1da.png";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Sidebar.css";

const Sidebar = ({ onLogout, currentUser }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname.startsWith(path);

  const userImage = currentUser?.image?.startsWith("/") || currentUser?.image?.startsWith("http") ? currentUser.image : defaultProfile;
  const userName = currentUser?.name || "User";

  const [starredOpen, setStarredOpen] = useState(true);
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

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
    currentUser?.role === "it" || currentUser?.role === "admin";

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
      <div className="sidebar-header my-3" ref={userDropdownRef} style={{ position: "relative" }}>
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
          to="/member"
          className={`sidebar-nav-item ${isActive("/member") ? "active" : ""}`}
        >
          <i className="bi bi-people"></i>
          <span>Members</span>
        </Nav.Link>
      </Nav>

      <div className="sidebar-divider"></div>

      {/* Team Section */}
      <div className="sidebar-team-section" ref={teamDropdownRef}>
        <div
          className="sidebar-team-header"
          onClick={() => setTeamDropdownOpen(!teamDropdownOpen)}
        >
          <div className="sidebar-team-info d-flex justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <span
                className="sidebar-team-avatar"
                style={{ background: displayTeamColor }}
              >
                {displayTeamInitial}
              </span>
              <span className="sidebar-team-name">{displayTeamName}</span>
            </div>
            <i
              className={`bi bi-chevron-${teamDropdownOpen ? "up" : "down"}`}
              style={{ fontSize: "0.6rem", color: "#888" }}
            ></i>
          </div>
        </div>

        {/* Team Dropdown */}
        {teamDropdownOpen && (
          <div className="team-dropdown">
            {isPrivilegedUser && (
              <div
                className={`team-dropdown-item ${isAllTeams ? "selected" : ""}`}
                onClick={handleSelectAllTeams}
              >
                <div className="team-dropdown-check">
                  {isAllTeams && <i className="bi bi-check2"></i>}
                </div>
                <span
                  className="sidebar-team-avatar"
                  style={{ background: "#666" }}
                >
                  A
                </span>
                <span className="team-dropdown-name">All teams</span>
              </div>
            )}

            {/* รายการทีม */}
            {visibleTeams.map((team) => {
              const isSelected = selectedTeam?.id === team.id;
              return (
                <div
                  key={team.id}
                  className={`team-dropdown-item ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelectTeam(team)}
                >
                  <div className="team-dropdown-check">
                    {isSelected && <i className="bi bi-check2"></i>}
                  </div>
                  <span
                    className="sidebar-team-avatar"
                    style={{ background: team.color }}
                  >
                    {team.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="team-dropdown-name">{team.name}</span>
                </div>
              );
            })}

            <div className="team-dropdown-divider"></div>

            {/* Create new */}
            <div className="team-dropdown-item team-dropdown-create">
              <div className="team-dropdown-check"></div>
              <i className="bi bi-plus" style={{ fontSize: "1.1rem" }}></i>
              <span className="team-dropdown-name">Create new</span>
            </div>
          </div>
        )}
      </div>

      <Nav className="flex-column sidebar-nav">
        <Nav.Link
          as={Link}
          to="/dashboard"
          className={`sidebar-nav-item ${isActive("/dashboard") ? "active" : ""}`}
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
            {isPrivilegedUserLocal && (
              <>
                <Nav.Link
                  as={Link}
                  to="/log"
                  className={`sidebar-nav-item ${isActive("/log") ? "active" : ""}`}
                >
                  <i className="bi bi-file-earmark-text"></i>
                  <span>ตรวจสอบบันทึก</span>
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/tokenreport"
                  className={`sidebar-nav-item ${isActive("/tokenreport") ? "active" : ""}`}
                >
                  <i className="bi bi-bar-chart-line"></i>
                  <span>รายงาน Token</span>
                </Nav.Link>
              </>
            )}
          </Nav>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
