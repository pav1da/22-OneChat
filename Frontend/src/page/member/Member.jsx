import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./member.css";
// นำเข้า useSocket จาก SocketContext เพื่อใช้ตรวจสอบสถานะ online/offline ของ user
import { useSocket } from "../../context/SocketContext";

const Member = ({ currentUser }) => {
  // ================== 1. STATE MANAGEMENT ==================
  const [allMembers, setAllMembers] = useState([]);

  // ===== Avatar Helpers =====
  const avatarColors = [
    '#F26623', '#E8913A', '#D4614B', '#C7956D',
    '#5B8C5A', '#3A7CA5', '#6C5B7B', '#C06C84',
    '#355C7D', '#F67280', '#2A9D8F', '#264653',
  ];
  const getAvatarColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return avatarColors[Math.abs(hash) % avatarColors.length];
  };
  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

  // Search & Sort (Member Section)
  const [searchTerm, setSearchTerm] = useState("");
  const [isSorted, setIsSorted] = useState(false);

  const [activePopupId, setActivePopupId] = useState(null);

  // ===== Socket.IO: ดึงฟังก์ชันเช็คสถานะ online จาก SocketContext =====
  const { isUserOnline } = useSocket();

  // ===== Role-based permission =====
  const currentUserRole = currentUser?.role || "";
  const canManage = ["admin", "manager"].includes(currentUserRole);

  // ================== 2. INITIALIZATION (FROM API) ==================
  useEffect(() => {
    const fetchUsersWithTeams = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const res = await fetch("/api/members/with-teams", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const users = await res.json();
          // map API fields to component fields
          const mapped = users.map((u) => ({
            id: u.emp_id,
            name: u.username || u.name,
            role: u.role || "staff",
            teams: u.teams || [], // array of { team_id, team_name, role_in_team }
            color: "#607D8B",
            email: u.email,
            phone: u.phone,
            image: u.image || "",
          }));
          setAllMembers(mapped);
        }
      } catch (err) {
        console.error("Error fetching users with teams:", err);
      }
    };
    fetchUsersWithTeams();
  }, []);

  // ================== 3. LOGIC (SORT & SEARCH) ==================
  const getProcessedMembers = () => {
    let result = [...allMembers];

    // Search
    if (searchTerm) {
      result = result.filter((member) =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Sort
    if (isSorted) {
      result.sort((a, b) => {
        const nameA = a.name;
        const nameB = b.name;

        const isEngA = /^[a-zA-Z]/.test(nameA);
        const isEngB = /^[a-zA-Z]/.test(nameB);

        if (isEngA && !isEngB) return -1;
        if (!isEngA && isEngB) return 1;

        return nameA.localeCompare(nameB, "th");
      });
    }

    return result;
  };

  const displayMembers = getProcessedMembers();

  // ================== 4. HELPER FUNCTIONS ==================
  const handleDeleteUser = async (userId) => {
    if (window.confirm("ยืนยันการลบสมาชิกนี้ออกจากระบบ?")) {
      try {
        const token = sessionStorage.getItem("token");
        const res = await fetch(`/api/users/${userId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setAllMembers((prev) => prev.filter((user) => user.id !== userId));
        } else {
          const data = await res.json();
          alert(data.message || "ลบไม่สำเร็จ");
        }
      } catch (err) {
        console.error("Delete error:", err);
        alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
      }
      setActivePopupId(null);
    }
  };

  // ================== 5. RENDER UI ==================
  return (
    <div className="member-container px-4" onClick={() => setActivePopupId(null)}>
      {/* Search & Sort controls */}
      <div className="member-controls">
        <div className="member-controls-left">
          <h1 className="member-page-title">สมาชิก</h1>
        </div>
        <div className="member-controls-right">
          <div className="member-search-wrapper">
            <i className="bi bi-search member-search-icon"></i>
            <input
              className="member-search-input"
              type="text"
              placeholder="ค้นหาสมาชิก..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className={`btn-sort ${isSorted ? "active" : ""}`}
            onClick={() => setIsSorted(!isSorted)}
          >
            <i className="bi bi-arrow-down-up"></i>
            {isSorted ? "เรียงแล้ว" : "เรียงลำดับ"}
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="member-table-header">
        <div className="col-name">ชื่อ</div>
        <div className="col-team">ทีม</div>
        <div className="col-role">บทบาท</div>
        <div className="col-status">สถานะ</div>
        {canManage && <div className="col-actions"></div>}
      </div>

      {/* Member List */}
      <div className="d-flex flex-column pb-5">
        {displayMembers.map((member) => {
          const online = isUserOnline(member.id);
          return (
            <div key={member.id} className="member-row">
              {/* ชื่อ + Avatar พร้อมตัวบ่งชี้สถานะ online/offline */}
              <div className="col-name">
                <div className="avatar-wrapper">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className={`member-avatar ${online ? "avatar-online" : "avatar-offline"}`}
                    />
                  ) : (
                    <div
                      className={`member-avatar-initials ${online ? "avatar-online" : "avatar-offline"}`}
                      style={{ backgroundColor: getAvatarColor(member.name) }}
                    >
                      {getInitial(member.name)}
                    </div>
                  )}
                  <span className={`avatar-status-dot ${online ? "dot-online" : "dot-offline"}`}></span>
                </div>
                <span>{member.name}</span>
              </div>

              {/* ทีม — แสดงเป็น badge pills (รองรับหลายทีม) */}
              <div className="col-team">
                {member.teams.length > 0 ? (
                  <div className="team-badges-wrapper">
                    {member.teams.map((t) => (
                      <span key={t.team_id} className="team-badge-pill">
                        {t.team_name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="no-team-text">—</span>
                )}
              </div>

              <div className="col-role">{member.role}</div>

              {/* Badge แสดงสถานะ */}
              <div className="col-status">
                <span className={`status-badge ${online ? "status-online" : "status-offline"}`}>
                  <span className={`status-dot ${online ? "dot-green" : "dot-gray"}`}></span>
                  {online ? "ออนไลน์" : "ออฟไลน์"}
                </span>
              </div>

              {/* Actions — เฉพาะ admin/manager */}
              {canManage && (
                <div className="col-actions">
                  <div className="position-relative">
                    <Button
                      variant="secondary"
                      className="btn-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePopupId(
                          activePopupId === `member-${member.id}`
                            ? null
                            : `member-${member.id}`,
                        );
                      }}
                    >
                      <i className="bi bi-three-dots"></i>
                    </Button>

                    {activePopupId === `member-${member.id}` && (
                      <div className="action-popup">
                        <div
                          className="action-item"
                          onClick={() => handleDeleteUser(member.id)}
                        >
                          <i className="bi bi-trash me-2"></i>
                          ลบ
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {displayMembers.length === 0 && (
          <div className="text-center py-5 text-muted">ไม่พบข้อมูลสมาชิก</div>
        )}
      </div>
    </div>
  );
};

export default Member;
