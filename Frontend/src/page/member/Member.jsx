import React, { useState, useEffect } from "react";
import { Form, Button, Modal } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./member.css";
// นำเข้า useSocket จาก SocketContext เพื่อใช้ตรวจสอบสถานะ online/offline ของ user
import { useSocket } from "../../context/SocketContext";

const Member = () => {
  // ================== 1. STATE MANAGEMENT ==================
  const [allMembers, setAllMembers] = useState([]);
  const [teams, setTeams] = useState([]);

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
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState("");

  // Modals
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedTeamForEdit, setSelectedTeamForEdit] = useState("");

  const [activePopupId, setActivePopupId] = useState(null);

  // ===== Socket.IO: ดึงฟังก์ชันเช็คสถานะ online จาก SocketContext =====
  // isUserOnline(emp_id) จะ return true ถ้า user คนนั้นกำลัง online อยู่
  // ข้อมูลจะอัปเดตแบบ real-time โดยอัตโนมัติผ่าน Socket.IO events
  const { isUserOnline } = useSocket();

  // ================== 2. INITIALIZATION (FROM API) ==================
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const res = await fetch("/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const users = await res.json();
          // map API fields to component fields
          const mapped = users.map((u) => ({
            id: u.emp_id,
            name: u.username || u.name,
            role: u.role || "staff",
            team: u.team || "",
            color: "#607D8B",
            email: u.email,
            phone: u.phone,
            image: u.image || "",
          }));
          setAllMembers(mapped);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
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
  const toggleTeam = (id) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isOpen: !t.isOpen } : t)),
    );
  };

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) return;

    const newTeam = {
      id: Date.now(),
      name: newTeamName,
      memberCount: 0,
      isOpen: true,
      members: [],
    };

    setTeams([...teams, newTeam]);
    setNewTeamName("");
    setShowCreateTeamModal(false);
  };

  // --- 🔴 ฟังก์ชันลบทีม ---
  const handleDeleteTeam = (teamId, teamName) => {
    if (window.confirm(`ต้องการลบทีม "${teamName}" ใช่หรือไม่?`)) {
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
      setAllMembers((prev) =>
        prev.map((member) =>
          member.team === teamName ? { ...member, team: "" } : member,
        ),
      );
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setSelectedTeamForEdit(user.team);
    setSelectedRoleForEdit(user.role);
    setShowEditModal(true);
    setActivePopupId(null);
  };

  const handleSaveEdit = () => {
    const updatedMembers = allMembers.map((user) =>
      user.id === editingUser.id
        ? { ...user, team: selectedTeamForEdit, role: selectedRoleForEdit }
        : user,
    );

    setAllMembers(updatedMembers);
    setShowEditModal(false);
  };

  const handleRemoveFromTeam = (userId) => {
    if (window.confirm("ยืนยันการนำสมาชิกออกจากทีม?")) {
      setAllMembers((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, team: "" } : user)),
      );
      setActivePopupId(null);
    }
  };

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
      <div className="member-table-header">
        <div className="col-name">ชื่อ</div>
        <div className="col-team">ทีม</div>
        <div className="col-role">บทบาท</div>
        <div className="col-status">สถานะ</div>
        <div className="col-actions"></div>
      </div>

      {/* Member List */}
      <div className="d-flex flex-column pb-5">
        {displayMembers.map((member) => {
          // ตรวจสอบว่า user คนนี้ online หรือไม่ ผ่าน SocketContext
          // ค่า online จะเปลี่ยนแบบ real-time เมื่อ server broadcast event
          const online = isUserOnline(member.id);
          return (
            <div key={member.id} className="member-row">
              {/* ชื่อ + Avatar พร้อมตัวบ่งชี้สถานะ online/offline */}
              <div className="col-name">
                {/* avatar-wrapper: ครอบ avatar + จุดสถานะ (position: relative) */}
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
                  {/* จุดสถานะมุมขวาล่างของ avatar */}
                  <span className={`avatar-status-dot ${online ? "dot-online" : "dot-offline"}`}></span>
                </div>
                <span>{member.name}</span>
              </div>

              <div className="col-team">{member.team}</div>

              <div className="col-role">{member.role}</div>

              {/* Badge แสดงสถานะ: "ออนไลน์" (พื้นเขียวอ่อน) หรือ "ออฟไลน์" (พื้นเทา) */}
              <div className="col-status">
                <span className={`status-badge ${online ? "status-online" : "status-offline"}`}>
                  {/* จุดเล็กๆ ใน badge: dot-green (เขียว) หรือ dot-gray (เทา) */}
                  <span className={`status-dot ${online ? "dot-green" : "dot-gray"}`}></span>
                  {online ? "ออนไลน์" : "ออฟไลน์"}
                </span>
              </div>

              {/* Actions */}
              <div className="col-actions">
                <Button
                  variant="secondary"
                  className="btn-action"
                  onClick={() => openEditModal(member)}
                >
                  <i
                    className="bi bi-pencil-fill"
                    style={{ fontSize: "0.8rem" }}
                  ></i>
                </Button>

                {/* Popup */}
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
            </div>
          );
        })}

        {displayMembers.length === 0 && (
          <div className="text-center py-5 text-muted">ไม่พบข้อมูลสมาชิก</div>
        )}
      </div>

      {/* ================= MODALS ================= */}
      {/* Create Team Modal */}
      <Modal
        show={showCreateTeamModal}
        onHide={() => setShowCreateTeamModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">สร้างทีมใหม่</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Label>ชื่อทีม</Form.Label>
          <Form.Control
            type="text"
            placeholder="กรอกชื่อทีม"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowCreateTeamModal(false)}
          >
            ยกเลิก
          </Button>
          <Button
            variant="warning"
            className="text-white"
            onClick={handleCreateTeam}
          >
            สร้างทีม
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">แก้ไขทีม</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            สมาชิก:
            <strong>{editingUser?.name}</strong>
          </p>
          <Form.Group>
            <Form.Label>เลือกทีม</Form.Label>
            <Form.Select
              value={selectedTeamForEdit}
              onChange={(e) => setSelectedTeamForEdit(e.target.value)}
            >
              <option value="">-- ไม่ระบุทีม --</option>
              {teams.map((team) => (
                <option key={team.id} value={team.name}>
                  {team.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Label>บทบาท</Form.Label>
            <Form.Select
              value={selectedRoleForEdit}
              onChange={(e) => setSelectedRoleForEdit(e.target.value)}
            >
              <option value="หัวหน้า">หัวหน้า</option>
              <option value="สมาชิก">สมาชิก</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            ยกเลิก
          </Button>
          <Button variant="primary" onClick={handleSaveEdit}>
            บันทึก
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Member;
