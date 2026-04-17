import React, { useState, useEffect, useCallback, useMemo } from "react";
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

  // ================== STATS CALCULATION ==================
  const { totalMembers, onlineMembers } = useMemo(() => {
    const uniqueMembers = new Map();
    teams.forEach(t => {
      (t.members || []).forEach(m => {
        if (!uniqueMembers.has(m.emp_id)) {
          uniqueMembers.set(m.emp_id, m);
        }
      });
    });
    
    let onlineCount = 0;
    uniqueMembers.forEach((m, emp_id) => {
      if (isUserOnline(emp_id)) onlineCount++;
    });

    return {
      totalMembers: uniqueMembers.size,
      onlineMembers: onlineCount
    };
  }, [teams, isUserOnline]);

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
      (m.display_name || m.username || "")
        .toLowerCase()
        .includes(memberSearch.toLowerCase())
  );

  return (
    <div className="teams-page-wrapper">
      <div className="teams-container">
        
        {/* ===== Hero & Stats Section ===== */}
        <div className="teams-hero-section">
          <div className="teams-hero-content">
            <h1 className="teams-title">ทีมทำงาน</h1>
            <p className="teams-subtitle">สร้างและจัดการทีมของคุณเพื่อการทำงานที่ราบรื่น</p>
          </div>
          
          <div className="teams-stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper i-teams">
                <i className="bi bi-boxes"></i>
              </div>
              <div className="stat-info">
                <h3 className="stat-value">{teams.length}</h3>
                <span className="stat-label">ทีมทั้งหมด</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon-wrapper i-members">
                <i className="bi bi-people"></i>
              </div>
              <div className="stat-info">
                <h3 className="stat-value">{totalMembers}</h3>
                <span className="stat-label">สมาชิกในทีมรวม</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper i-online">
                <i className="bi bi-broadcast"></i>
              </div>
              <div className="stat-info">
                <h3 className="stat-value">{onlineMembers}</h3>
                <span className="stat-label">กำลังออนไลน์</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Toolbar Section ===== */}
        <div className="teams-toolbar">
          <div className="teams-search-wrapper">
            <i className="bi bi-search teams-search-icon"></i>
            <input
              className="teams-search-input"
              type="text"
              placeholder="ค้นหาทีมที่ต้องการ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {canManageTeams && (
            <button
              className="btn-create-team interactive-btn"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="bi bi-plus-lg"></i>
              <span>สร้างทีมใหม่</span>
            </button>
          )}
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
          <div className="teams-empty-state">
            <div className="empty-illustration">
              <i className="bi bi-stars"></i>
            </div>
            <h3 className="empty-title">ไม่พบทีมที่คุณค้นหา</h3>
            <p className="empty-desc">
              {searchTerm ? "ลองค้นหาด้วยคำคีย์เวิร์ดอื่น หรือตรวจสอบตัวสะกด" : "พื้นที่นี้ยังว่างเปล่า เริ่มต้นสร้างทีมแรกของคุณเลย"}
            </p>
            {!searchTerm && canManageTeams && (
               <button
                 className="btn-create-team interactive-btn empty-action"
                 onClick={() => setShowCreateModal(true)}
               >
                 <i className="bi bi-plus-lg"></i>
                 สร้างทีมใหม่
               </button>
            )}
          </div>
        )}

        <div className="teams-cards-container pb-5">
          {filteredTeams.map((team) => {
            const isOpen = openTeams[team.team_id] || false;
            const members = team.members || [];
            
            // Calc online in this team
            const onlineInTeam = members.filter(m => isUserOnline(m.emp_id)).length;

            return (
              <div key={team.team_id} className={`team-card premium-card ${isOpen ? 'active-card' : ''}`}>
                {/* Team Header */}
                <div
                  className="team-header"
                  onClick={() => toggleTeam(team.team_id)}
                >
                  <div className="team-header-left">
                    <div className={`team-header-icon gradient-bg-${team.team_id % 5 + 1}`}>
                      <i className="bi bi-diagram-3-fill"></i>
                    </div>
                    <div className="team-meta">
                      <span className="team-name">{team.team_name}</span>
                      <div className="team-submeta">
                        <span className="team-member-count badge-soft">
                          <i className="bi bi-person-fill"></i> {members.length} สมาชิก
                        </span>
                        {onlineInTeam > 0 && (
                           <span className="team-online-count badge-soft-success">
                             <span className="pulse-dot"></span> {onlineInTeam} ออนไลน์
                           </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="team-header-right">
                    {canManageTeams && (
                      <div
                        className="team-header-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="btn-team-action icon-btn"
                          title="เปลี่ยนชื่อทีม"
                          onClick={() => openRenameModal(team)}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button
                          className="btn-team-action danger icon-btn"
                          title="ลบทีม"
                          onClick={() => handleDeleteTeam(team)}
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      </div>
                    )}
                    <div className="team-chevron-wrapper">
                       <i className={`bi bi-chevron-down team-chevron ${isOpen ? "open" : ""}`}></i>
                    </div>
                  </div>
                </div>

                {/* Team Members (Accordion) */}
                <div
                  className={`team-members-area ${isOpen ? "open" : ""}`}
                >
                  <div className="team-members-inner">
                    {members.length === 0 && (
                      <div className="team-members-empty">
                        <i className="bi bi-person-x"></i>
                        <p>ยังไม่มีสมาชิกในทีมนี้</p>
                      </div>
                    )}

                    <div className="members-grid">
                      {members.map((member) => {
                        const online = isUserOnline(member.emp_id);
                        const displayName = member.display_name || member.username || "—";

                        return (
                          <div key={member.emp_id} className="team-member-row glass-row">
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
                              <div className="member-info-col">
                                <span className="m-name">{displayName}</span>
                                <span className="m-sub">{member.username && `@${member.username}`}</span>
                              </div>
                            </div>

                            <div className="member-role-col">
                              <span
                                className={`team-role-badge ${
                                  member.role_in_team === "หัวหน้า"
                                    ? "team-role-leader"
                                    : "team-role-member"
                                }`}
                              >
                                {member.role_in_team === "หัวหน้า" ? <i className="bi bi-star-fill"></i> : null}
                                {member.role_in_team || "สมาชิก"}
                              </span>
                            </div>

                            <div className="member-status-col">
                              <span
                                className={`status-pill ${online ? "status-online" : "status-offline"}`}
                              >
                                {online ? "ออนไลน์" : "ออฟไลน์"}
                              </span>
                            </div>

                            {/* ปุ่มลบสมาชิก — เฉพาะ admin/manager */}
                            <div className="member-action-col">
                              {canManageTeams && (
                                <button
                                  className="btn-remove-member icon-btn-small"
                                  title="นำออกจากทีม"
                                  onClick={() =>
                                    openConfirmRemove(team.team_id, member.emp_id, displayName)
                                  }
                                >
                                  <i className="bi bi-x-circle-fill"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* ปุ่มเพิ่มสมาชิก — เฉพาะ admin/manager */}
                    {canManageTeams && (
                      <div className="add-member-wrapper">
                        <button
                          className="btn-add-member dashed-btn"
                          onClick={() => openAddMemberModal(team.team_id)}
                        >
                          <i className="bi bi-person-plus-fill"></i>
                          <span>เพิ่มคนเข้าทีม</span>
                        </button>
                      </div>
                    )}
                  </div>
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
          className="premium-modal"
          backdrop="static"
        >
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold modal-title-styled">
              <i className="bi bi-boxes text-orange me-2"></i>สร้างทีมใหม่
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-2">
            <p className="text-muted mb-4 small">กำหนดชื่อทีมเพื่อใช้เป็นพื้นที่ทำงานร่วมกัน</p>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">ชื่อทีม <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="เช่น ทีมการตลาด, ทีมพัฒนา..."
                className="premium-input"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateTeam()}
                autoFocus
                size="lg"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button
              variant="light"
              className="px-4 rounded-pill fw-medium"
              onClick={() => setShowCreateModal(false)}
            >
              ยกเลิก
            </Button>
            <Button
              className="px-4 rounded-pill fw-medium premium-btn-orange"
              onClick={handleCreateTeam}
              disabled={creating || !newTeamName.trim()}
            >
              {creating ? <><i className="bi bi-hourglass-split me-2"></i>กำลังสร้าง...</> : "บันทึกและสร้างทีม"}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal: เปลี่ยนชื่อทีม */}
        <Modal
          show={showRenameModal}
          onHide={() => setShowRenameModal(false)}
          centered
          className="premium-modal"
          backdrop="static"
        >
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold modal-title-styled">
              <i className="bi bi-pencil-square text-orange me-2"></i>เปลี่ยนชื่อทีม
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-2">
            <p className="text-muted mb-4 small">แก้ไขชื่อทีม <strong>{renamingTeam?.team_name}</strong></p>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">ชื่อทีมใหม่ <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="กรอกชื่อทีมใหม่"
                className="premium-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRenameTeam()}
                autoFocus
                size="lg"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button
              variant="light"
              className="px-4 rounded-pill fw-medium"
              onClick={() => setShowRenameModal(false)}
            >
              ยกเลิก
            </Button>
            <Button
              className="px-4 rounded-pill fw-medium premium-btn-blue"
              onClick={handleRenameTeam}
              disabled={!renameValue.trim() || renameValue === renamingTeam?.team_name}
            >
              บันทึกการเปลี่ยนแปลง
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal: เพิ่มสมาชิก */}
        <Modal
          show={showAddMemberModal}
          onHide={() => setShowAddMemberModal(false)}
          centered
          className="premium-modal"
        >
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold modal-title-styled">
              <i className="bi bi-person-plus text-orange me-2"></i>เพิ่มสมาชิกเข้าทีม
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="search-input-wrapper mb-3">
              <i className="bi bi-search search-icon"></i>
              <input
                className="premium-input modal-search w-100"
                type="text"
                placeholder="ค้นหาชื่อ หรือ Username..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
            </div>
            
            <div className="add-member-list customized-scrollbar">
              {filteredAvailable.length === 0 && (
                <div className="empty-state-small text-center py-5">
                  <i className="bi bi-emoji-frown fs-2 text-muted mb-2 d-block"></i>
                  <span className="text-muted">ไม่พบสมาชิกที่ค้นหา</span>
                </div>
              )}
              {filteredAvailable.map((m) => {
                const alreadyInTeam = currentTeamMemberIds.includes(m.emp_id);
                const displayName = m.display_name || m.username || "—";

                return (
                  <div
                    key={m.emp_id}
                    className={`add-member-item-enhanced ${alreadyInTeam ? "disabled" : ""}`}
                    onClick={() => !alreadyInTeam && handleAddMember(m.emp_id)}
                  >
                    <div className="avatar-wrapper">
                      {m.image ? (
                        <img
                          src={m.image}
                          alt={displayName}
                          className="member-avatar avatar-offline"
                          style={{ width: 40, height: 40 }}
                        />
                      ) : (
                        <div
                          className="member-avatar-initials avatar-offline"
                          style={{
                            width: 40,
                            height: 40,
                            fontSize: "1rem",
                            backgroundColor: getAvatarColor(displayName),
                          }}
                        >
                          {getInitial(displayName)}
                        </div>
                      )}
                    </div>
                    <div className="member-info-right ms-2 flex-grow-1">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="add-member-item-name fw-semibold">{displayName}</div>
                        {alreadyInTeam && (
                          <span className="badge bg-light text-secondary rounded-pill border">อยู่ในทีมแล้ว</span>
                        )}
                        {!alreadyInTeam && (
                           <button className="btn btn-sm btn-outline-primary rounded-pill px-3 m-add-btn">เพิ่ม</button>
                        )}
                      </div>
                      <div className="add-member-item-role text-muted small">{m.role || 'Member'}</div>
                    </div>
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
          className="premium-modal danger-modal"
        >
          <Modal.Header closeButton className="border-0 pb-0">
          </Modal.Header>
          <Modal.Body className="text-center pt-0 pb-4">
            <div className="icon-circle-danger mx-auto mb-3">
              <i className="bi bi-exclamation-triangle-fill fs-2 text-danger"></i>
            </div>
            <h5 className="fw-bold mb-2">ยืนยันนำออกจากทีม?</h5>
            <p className="text-muted mb-0">
              คุณต้องการนำ <strong>{removingMember?.name}</strong> ออกจากทีมใช่หรือไม่?
            </p>
          </Modal.Body>
          <Modal.Footer className="border-0 justify-content-center pb-4 pt-0">
            <Button
              variant="light"
              className="px-4 rounded-pill fw-medium"
              onClick={() => setShowConfirmRemove(false)}
            >
              ยกเลิก
            </Button>
            <Button 
              variant="danger" 
              className="px-4 rounded-pill fw-medium shadow-sm"
              onClick={handleConfirmRemoveMember}
            >
              นำออกทันที
            </Button>
          </Modal.Footer>
        </Modal>

      </div>
    </div>
  );
};

export default Teams;
