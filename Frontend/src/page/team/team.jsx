import React, { useState, useEffect, useCallback } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./team.css";
import { useSocket } from "../../context/SocketContext";

const Teams = () => {
  // ================== STATE ==================
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===== Role-based permission =====
  const currentUser = JSON.parse(sessionStorage.getItem("myAppUser") || "{}");
  const canManageTeams = ["admin", "manager"].includes(currentUser.role);
  const [searchTerm, setSearchTerm] = useState("");

  // Accordion open state (team_id -> boolean)
  const [openTeams, setOpenTeams] = useState({});

  // Modal: สร้างทีม
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [creating, setCreating] = useState(false);

  // Modal: เปลี่ยนชื่อทีม
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renamingTeam, setRenamingTeam] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  // Modal: เพิ่มสมาชิก
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberTeamId, setAddMemberTeamId] = useState(null);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");

  // Modal: ยืนยันลบสมาชิกออกจากทีม
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);
  const [removingMember, setRemovingMember] = useState(null); // { teamId, empId, name }

  // SocketContext สำหรับ online status
  const { isUserOnline } = useSocket();

  // ===== Avatar helpers =====
  const avatarColors = [
    "#F26623", "#E8913A", "#D4614B", "#C7956D",
    "#5B8C5A", "#3A7CA5", "#6C5B7B", "#C06C84",
    "#355C7D", "#F67280", "#2A9D8F", "#264653",
  ];
  const getAvatarColor = (name) => {
    let hash = 0;
    for (let i = 0; i < (name || "").length; i++)
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return avatarColors[Math.abs(hash) % avatarColors.length];
  };
  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "?");

  // ===== Helper: get auth header =====
  const authHeaders = () => {
    const token = sessionStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // ================== FETCH TEAMS ==================
  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch("/api/teams", { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch (err) {
      console.error("Error fetching teams:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // ================== SEARCH ==================
  const filteredTeams = teams.filter((t) =>
    t.team_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ================== ACCORDION ==================
  const toggleTeam = (teamId) => {
    setOpenTeams((prev) => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  // ================== CREATE TEAM ==================
  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ team_name: newTeamName.trim() }),
      });
      if (res.ok) {
        const created = await res.json();
        setTeams((prev) => [...prev, created]);
        setOpenTeams((prev) => ({ ...prev, [created.team_id]: true }));
        setNewTeamName("");
        setShowCreateModal(false);
      } else {
        const data = await res.json();
        alert(data.message || "สร้างทีมไม่สำเร็จ");
      }
    } catch (err) {
      console.error("Create team error:", err);
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setCreating(false);
    }
  };

  // ================== RENAME TEAM ==================
  const openRenameModal = (team) => {
    setRenamingTeam(team);
    setRenameValue(team.team_name);
    setShowRenameModal(true);
  };

  const handleRenameTeam = async () => {
    if (!renameValue.trim() || !renamingTeam) return;
    try {
      const res = await fetch(`/api/teams/${renamingTeam.team_id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ team_name: renameValue.trim() }),
      });
      if (res.ok) {
        setTeams((prev) =>
          prev.map((t) =>
            t.team_id === renamingTeam.team_id
              ? { ...t, team_name: renameValue.trim() }
              : t
          )
        );
        setShowRenameModal(false);
      } else {
        const data = await res.json();
        alert(data.message || "เปลี่ยนชื่อไม่สำเร็จ");
      }
    } catch (err) {
      console.error("Rename team error:", err);
    }
  };

  // ================== DELETE TEAM ==================
  const handleDeleteTeam = async (team) => {
    if (!window.confirm(`ต้องการลบทีม "${team.team_name}" ใช่หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/teams/${team.team_id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        setTeams((prev) => prev.filter((t) => t.team_id !== team.team_id));
      } else {
        const data = await res.json();
        alert(data.message || "ลบทีมไม่สำเร็จ");
      }
    } catch (err) {
      console.error("Delete team error:", err);
    }
  };

  // ================== ADD MEMBER ==================
  const openAddMemberModal = async (teamId) => {
    setAddMemberTeamId(teamId);
    setMemberSearch("");
    setShowAddMemberModal(true);
    try {
      const res = await fetch("/api/teams/available-members", {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableMembers(data);
      }
    } catch (err) {
      console.error("Fetch available members error:", err);
    }
  };

  const handleAddMember = async (empId) => {
    try {
      const res = await fetch(`/api/teams/${addMemberTeamId}/members`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ emp_id: empId }),
      });
      if (res.ok) {
        const newMember = await res.json();
        setTeams((prev) =>
          prev.map((t) =>
            t.team_id === addMemberTeamId
              ? { ...t, members: [...(t.members || []), newMember] }
              : t
          )
        );
        setShowAddMemberModal(false);
      } else {
        const data = await res.json();
        alert(data.message || "เพิ่มสมาชิกไม่สำเร็จ");
      }
    } catch (err) {
      console.error("Add member error:", err);
    }
  };

  // ================== REMOVE MEMBER ==================
  const openConfirmRemove = (teamId, empId, name) => {
    setRemovingMember({ teamId, empId, name });
    setShowConfirmRemove(true);
  };

  const handleConfirmRemoveMember = async () => {
    if (!removingMember) return;
    const { teamId, empId } = removingMember;
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${empId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        setTeams((prev) =>
          prev.map((t) =>
            t.team_id === teamId
              ? {
                  ...t,
                  members: (t.members || []).filter(
                    (m) => m.emp_id !== empId
                  ),
                }
              : t
          )
        );
      } else {
        const data = await res.json();
        alert(data.message || "ลบสมาชิกไม่สำเร็จ");
      }
    } catch (err) {
      console.error("Remove member error:", err);
    } finally {
      setShowConfirmRemove(false);
      setRemovingMember(null);
    }
  };

  // ================== RENDER ==================

  // สมาชิกที่อยู่ในทีมนี้แล้ว (สำหรับ disable ใน modal เพิ่มสมาชิก)
  const currentTeamMemberIds = addMemberTeamId
    ? (teams.find((t) => t.team_id === addMemberTeamId)?.members || []).map(
        (m) => m.emp_id
      )
    : [];

  const filteredAvailable = availableMembers.filter(
    (m) =>
      (m.name || m.username || "")
        .toLowerCase()
        .includes(memberSearch.toLowerCase())
  );

  return (
    <div className="teams-container px-4">
      {/* ===== Header ===== */}
      <div className="teams-header">
        <h1 className="teams-title">ทีม</h1>
        {canManageTeams && (
          <button
            className="btn-create-team"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="bi bi-plus-lg"></i>
            สร้างทีม
          </button>
        )}
      </div>

      {/* ===== Search ===== */}
      <div className="teams-search-wrapper">
        <i className="bi bi-search teams-search-icon"></i>
        <input
          className="teams-search-input"
          type="text"
          placeholder="ค้นหาทีม..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* ===== Loading ===== */}
      {loading && (
        <div className="teams-loading">
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
        </div>
      )}

      {/* ===== Team List ===== */}
      {!loading && filteredTeams.length === 0 && (
        <div className="teams-empty">
          <i className="bi bi-people teams-empty-icon"></i>
          <span className="teams-empty-text">
            {searchTerm ? "ไม่พบทีมที่ค้นหา" : "ยังไม่มีทีม — กดสร้างทีมใหม่เลย!"}
          </span>
        </div>
      )}

      <div className="d-flex flex-column pb-5">
        {filteredTeams.map((team) => {
          const isOpen = openTeams[team.team_id] || false;
          const members = team.members || [];

          return (
            <div key={team.team_id} className="team-card">
              {/* Team Header */}
              <div
                className="team-header"
                onClick={() => toggleTeam(team.team_id)}
              >
                <div className="team-header-left">
                  <i
                    className={`bi bi-chevron-right team-chevron ${isOpen ? "open" : ""}`}
                  ></i>
                  <span className="team-name">{team.team_name}</span>
                  <span className="team-member-count">
                    {members.length} สมาชิก
                  </span>
                </div>

                {canManageTeams && (
                  <div
                    className="team-header-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="btn-team-action"
                      title="เปลี่ยนชื่อทีม"
                      onClick={() => openRenameModal(team)}
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button
                      className="btn-team-action danger"
                      title="ลบทีม"
                      onClick={() => handleDeleteTeam(team)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                )}
              </div>

              {/* Team Members (Accordion) */}
              <div
                className={`team-members-area ${isOpen ? "open" : ""}`}
              >
                {members.length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "1rem",
                      color: "#9ca3af",
                      fontSize: "0.9rem",
                    }}
                  >
                    ยังไม่มีสมาชิกในทีม
                  </div>
                )}

                {members.map((member) => {
                  const online = isUserOnline(member.emp_id);
                  const displayName = member.name || member.username || "—";

                  return (
                    <div key={member.emp_id} className="team-member-row">
                      {/* ชื่อ + avatar */}
                      <div className="team-member-name">
                        <div className="avatar-wrapper">
                          {member.image ? (
                            <img
                              src={member.image}
                              alt={displayName}
                              className={`member-avatar ${online ? "avatar-online" : "avatar-offline"}`}
                            />
                          ) : (
                            <div
                              className={`member-avatar-initials ${online ? "avatar-online" : "avatar-offline"}`}
                              style={{
                                backgroundColor: getAvatarColor(displayName),
                              }}
                            >
                              {getInitial(displayName)}
                            </div>
                          )}
                          <span
                            className={`avatar-status-dot ${online ? "dot-online" : "dot-offline"}`}
                          ></span>
                        </div>
                        <span>{displayName}</span>
                      </div>

                      {/* Role in team */}
                      <div>
                        <span
                          className={`team-role-badge ${
                            member.role_in_team === "หัวหน้า"
                              ? "team-role-leader"
                              : "team-role-member"
                          }`}
                        >
                          {member.role_in_team || "สมาชิก"}
                        </span>
                      </div>

                      {/* สถานะ online/offline */}
                      <div>
                        <span
                          className={`status-badge ${online ? "status-online" : "status-offline"}`}
                        >
                          <span
                            className={`status-dot ${online ? "dot-green" : "dot-gray"}`}
                          ></span>
                          {online ? "ออนไลน์" : "ออฟไลน์"}
                        </span>
                      </div>

                      {/* ปุ่มลบสมาชิก — เฉพาะ admin/manager */}
                      {canManageTeams && (
                        <div>
                          <button
                            className="btn-remove-member"
                            title="นำออกจากทีม"
                            onClick={() =>
                              openConfirmRemove(team.team_id, member.emp_id, displayName)
                            }
                          >
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* ปุ่มเพิ่มสมาชิก — เฉพาะ admin/manager */}
                {canManageTeams && (
                  <button
                    className="btn-add-member"
                    onClick={() => openAddMemberModal(team.team_id)}
                  >
                    <i className="bi bi-plus-circle"></i>
                    เพิ่มสมาชิก
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= MODALS ================= */}

      {/* Modal: สร้างทีมใหม่ */}
      <Modal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
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
            onKeyDown={(e) => e.key === "Enter" && handleCreateTeam()}
            autoFocus
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowCreateModal(false)}
          >
            ยกเลิก
          </Button>
          <Button
            variant="warning"
            className="text-white"
            onClick={handleCreateTeam}
            disabled={creating || !newTeamName.trim()}
          >
            {creating ? "กำลังสร้าง..." : "สร้างทีม"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal: เปลี่ยนชื่อทีม */}
      <Modal
        show={showRenameModal}
        onHide={() => setShowRenameModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">เปลี่ยนชื่อทีม</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Label>ชื่อทีมใหม่</Form.Label>
          <Form.Control
            type="text"
            placeholder="กรอกชื่อทีมใหม่"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRenameTeam()}
            autoFocus
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowRenameModal(false)}
          >
            ยกเลิก
          </Button>
          <Button
            variant="primary"
            onClick={handleRenameTeam}
            disabled={!renameValue.trim()}
          >
            บันทึก
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal: เพิ่มสมาชิก */}
      <Modal
        show={showAddMemberModal}
        onHide={() => setShowAddMemberModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">เพิ่มสมาชิกเข้าทีม</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <input
            className="modal-search-input"
            type="text"
            placeholder="ค้นหาสมาชิก..."
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
          />
          <div className="add-member-list">
            {filteredAvailable.length === 0 && (
              <div className="text-center py-3 text-muted">
                ไม่พบสมาชิก
              </div>
            )}
            {filteredAvailable.map((m) => {
              const alreadyInTeam = currentTeamMemberIds.includes(m.emp_id);
              const displayName = m.name || m.username || "—";

              return (
                <div
                  key={m.emp_id}
                  className={`add-member-item ${alreadyInTeam ? "disabled" : ""}`}
                  onClick={() => !alreadyInTeam && handleAddMember(m.emp_id)}
                >
                  <div className="avatar-wrapper">
                    {m.image ? (
                      <img
                        src={m.image}
                        alt={displayName}
                        className="member-avatar avatar-offline"
                        style={{ width: 34, height: 34 }}
                      />
                    ) : (
                      <div
                        className="member-avatar-initials avatar-offline"
                        style={{
                          width: 34,
                          height: 34,
                          fontSize: "0.85rem",
                          backgroundColor: getAvatarColor(displayName),
                        }}
                      >
                        {getInitial(displayName)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="add-member-item-name">{displayName}</div>
                    <div className="add-member-item-role">{m.role}</div>
                  </div>
                  {alreadyInTeam && (
                    <span className="add-member-item-badge">
                      อยู่ในทีมแล้ว
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Modal.Body>
      </Modal>

      {/* Modal: ยืนยันลบสมาชิก */}
      <Modal
        show={showConfirmRemove}
        onHide={() => setShowConfirmRemove(false)}
        centered
        size="sm"
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold" style={{ fontSize: "1.1rem" }}>
            ยืนยันนำออกจากทีม
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ต้องการนำ <strong>{removingMember?.name}</strong> ออกจากทีมใช่หรือไม่?
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConfirmRemove(false)}
          >
            ยกเลิก
          </Button>
          <Button variant="danger" onClick={handleConfirmRemoveMember}>
            <i className="bi bi-trash me-1"></i>
            นำออก
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Teams;
