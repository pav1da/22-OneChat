import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button, Modal, Form } from "react-bootstrap";
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

  // ===== Edit Modal State =====
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  // ===== Info Modal State =====
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [memberInfo, setMemberInfo] = useState(null);

  const handleOpenInfo = (member) => {
    if (!isAdmin) return;
    setMemberInfo(member);
    setShowInfoModal(true);
  };

  // ===== Socket.IO: ดึงฟังก์ชันเช็คสถานะ online จาก SocketContext =====
  const { isUserOnline } = useSocket();

  // ===== Role-based permission =====
  const currentUserRole = currentUser?.role || "";
  const canManage = ["admin", "manager"].includes(currentUserRole);
  const isAdmin = currentUserRole === "admin";

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
            displayName: u.display_name || "",
            role: u.role || "staff",
            teams: u.teams || [], // array of { team_id, team_name, role_in_team }
            color: "#607D8B",
            email: u.email,
            phone: u.phone,
            image: u.image || "",
            chatCount: u.chat_count || 0,
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
  // ใช้ useMemo เพื่อไม่ให้ re-sort/re-filter ทุก render (ป้องกัน UI กระพริบ)
  const { onlineUsers } = useSocket();

  const displayMembers = useMemo(() => {
    let result = [...allMembers];

    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter((member) =>
        member.name.toLowerCase().includes(q) ||
        (member.displayName && member.displayName.toLowerCase().includes(q)),
      );
    }

    // === เรียง user ออนไลน์ไว้ข้างบนเสมอ ===
    result.sort((a, b) => {
      const onlineA = onlineUsers.has(a.id) ? 1 : 0;
      const onlineB = onlineUsers.has(b.id) ? 1 : 0;

      // ออนไลน์ก่อน
      if (onlineA !== onlineB) return onlineB - onlineA;

      // ถ้าเปิดเรียงลำดับ → เรียงตามชื่อ
      if (isSorted) {
        const nameA = a.name;
        const nameB = b.name;

        const isEngA = /^[a-zA-Z]/.test(nameA);
        const isEngB = /^[a-zA-Z]/.test(nameB);

        if (isEngA && !isEngB) return -1;
        if (!isEngA && isEngB) return 1;

        return nameA.localeCompare(nameB, "th");
      }

      return 0;
    });

    return result;
  }, [allMembers, searchTerm, isSorted, onlineUsers]);

  // ================== 4. HELPER FUNCTIONS ==================
  const confirmDeleteUser = async () => {
    if (!memberToDelete) return;
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`/api/users/${memberToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAllMembers((prev) => prev.filter((user) => user.id !== memberToDelete.id));
      } else {
        const data = await res.json();
        alert(data.message || "ลบไม่สำเร็จ");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setShowDeleteModal(false);
      setMemberToDelete(null);
    }
  };

  // ===== เปิด Edit Modal =====
  const handleOpenEdit = (member) => {
    setEditingMember(member);
    setEditDisplayName(member.displayName || "");
    setEditPassword("");
    setShowEditModal(true);
    setActivePopupId(null);
  };

  // ===== บันทึกการแก้ไข =====
  const handleSaveEdit = async () => {
    if (!editingMember) return;
    setEditSaving(true);
    try {
      const token = sessionStorage.getItem("token");
      const body = {};
      // ส่ง display_name เสมอ (อาจเป็นค่าว่าง)
      body.display_name = editDisplayName.trim();
      // ส่ง password เฉพาะเมื่อกรอก
      if (editPassword.trim()) {
        body.password = editPassword.trim();
      }

      const res = await fetch(`/api/members/${editingMember.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        // อัปเดต state ในฝั่ง frontend
        setAllMembers((prev) =>
          prev.map((m) =>
            m.id === editingMember.id
              ? { ...m, displayName: body.display_name }
              : m,
          ),
        );
        setShowEditModal(false);
        setEditingMember(null);
      } else {
        const data = await res.json();
        alert(data.message || "แก้ไขไม่สำเร็จ");
      }
    } catch (err) {
      console.error("Edit error:", err);
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
    setEditSaving(false);
  };

  // ================== 5. RENDER UI ==================
  return (
    <div className="member-container" onClick={() => setActivePopupId(null)}>
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
            <div 
              key={member.id} 
              className={`member-row ${isAdmin ? "clickable-row" : ""}`} 
              onClick={() => { if(isAdmin) handleOpenInfo(member); }}
            >
              {/* ชื่อ + Avatar */}
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
                <div className="member-name-group">
                  {member.displayName && (
                    <span className="member-display-name">{member.displayName}</span>
                  )}
                  <span className="member-username">{member.name}</span>
                </div>
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
                      <div className="action-popup" onClick={(e) => e.stopPropagation()}>
                        {/* ปุ่มแก้ไข — admin/manager */}
                        <div
                          className="action-item action-item-edit"
                          onClick={(e) => { e.stopPropagation(); handleOpenEdit(member); }}
                        >
                          <i className="bi bi-pencil-square me-2"></i>
                          แก้ไข
                        </div>
                        {isAdmin && (
                          <div
                            className="action-item action-item-delete"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setMemberToDelete(member);
                              setShowDeleteModal(true);
                              setActivePopupId(null);
                            }}
                          >
                            <i className="bi bi-trash me-2"></i>
                            ลบ
                          </div>
                        )}
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

      {/* ===== Delete Confirmation Modal ===== */}
      <Modal show={showDeleteModal} onHide={() => { setShowDeleteModal(false); setMemberToDelete(null); }} centered>
        <Modal.Body className="text-center p-5">
          <div className="mb-4">
            <div className="mx-auto bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: "80px", height: "80px" }}>
              <i className="bi bi-trash text-danger" style={{ fontSize: "2.5rem" }}></i>
            </div>
          </div>
          <h5 className="fw-bold mb-3" style={{ color: "var(--text-heading, #1e293b)" }}>ยืนยันการลบสมาชิก</h5>
          <p className="mb-4" style={{ color: "var(--text-secondary, #4b5563)", fontSize: "1rem" }}>
            คุณต้องการลบ <strong>{memberToDelete?.name} {memberToDelete?.displayName ? `(${memberToDelete.displayName})` : ""}</strong> ออกจากระบบใช่หรือไม่?<br/>
            การกระทำนี้จะไม่สามารถเรียกคืนได้
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Button 
              variant="light" 
              onClick={() => { setShowDeleteModal(false); setMemberToDelete(null); }} 
              className="px-4 py-2" 
              style={{ fontWeight: 600, color: "var(--text-secondary, #4b5563)", border: "1px solid var(--border-medium, #cbd5e1)" }}
            >
              ยกเลิก
            </Button>
            <Button 
              variant="danger" 
              onClick={confirmDeleteUser} 
              className="px-4 py-2" 
              style={{ fontWeight: 600 }}
            >
              ลบสมาชิก
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* ===== Edit Member Modal ===== */}
      <Modal
        show={showEditModal}
        onHide={() => { setShowEditModal(false); setEditingMember(null); }}
        centered
        className="edit-member-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-pencil-square me-2"></i>
            แก้ไขข้อมูลสมาชิก
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingMember && (
            <Form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
              {/* Username — read-only */}
              <Form.Group className="mb-3">
                <Form.Label className="edit-form-label">
                  <i className="bi bi-person-fill me-1"></i>
                  Username
                </Form.Label>
                <Form.Control
                  type="text"
                  value={editingMember.name}
                  disabled
                  className="edit-input-disabled"
                />
                <Form.Text className="text-muted">
                  ไม่สามารถเปลี่ยน username ได้
                </Form.Text>
              </Form.Group>

              {/* Display Name — editable */}
              <Form.Group className="mb-3">
                <Form.Label className="edit-form-label">
                  <i className="bi bi-card-text me-1"></i>
                  ชื่อที่แสดง (Display Name)
                </Form.Label>
                <Form.Control
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder="กรอกชื่อที่ต้องการแสดง"
                  className="edit-input"
                />
              </Form.Group>

              {/* Password — editable (optional) */}
              <Form.Group className="mb-3">
                <Form.Label className="edit-form-label">
                  <i className="bi bi-lock-fill me-1"></i>
                  รหัสผ่านใหม่
                </Form.Label>
                <Form.Control
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="กรอกเฉพาะเมื่อต้องการเปลี่ยน"
                  className="edit-input"
                />
                <Form.Text className="text-muted">
                  เว้นว่างถ้าไม่ต้องการเปลี่ยนรหัสผ่าน
                </Form.Text>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => { setShowEditModal(false); setEditingMember(null); }}
            className="btn-cancel"
          >
            ยกเลิก
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveEdit}
            disabled={editSaving}
            className="btn-save"
          >
            {editSaving ? (
              <>
                <span className="spinner-border spinner-border-sm me-1"></span>
                กำลังบันทึก...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-1"></i>
                บันทึก
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== Info Member Modal ===== */}
      <Modal show={showInfoModal} onHide={() => { setShowInfoModal(false); setMemberInfo(null); }} centered className="member-info-modal">
        <Modal.Header closeButton style={{ borderBottom: "none", paddingBottom: 0 }}>
        </Modal.Header>
        <Modal.Body className="text-center p-4">
          {memberInfo && (
            <>
              <div className="mb-3 d-flex justify-content-center position-relative">
                {memberInfo.image ? (
                  <img src={memberInfo.image} alt="avatar" className="rounded-circle shadow-sm" style={{ width: "110px", height: "110px", objectFit: "cover" }} />
                ) : (
                  <div className="rounded-circle shadow-sm d-flex align-items-center justify-content-center text-white" style={{ width: "110px", height: "110px", fontSize: "3rem", backgroundColor: getAvatarColor(memberInfo.name) }}>
                    {getInitial(memberInfo.name)}
                  </div>
                )}
                {isUserOnline(memberInfo.id) && (
                  <span className="position-absolute bottom-0 translate-middle p-2 bg-success border border-light rounded-circle" style={{ right: "50%", marginRight: "-55px", marginBottom: "5px" }}>
                    <span className="visually-hidden">Online</span>
                  </span>
                )}
              </div>
              <h4 className="fw-bold mb-4" style={{ color: "var(--text-main)", fontSize: "1.5rem" }}>{memberInfo.displayName || memberInfo.name}</h4>
              
              <div className="text-start bg-light p-3 rounded-4 mb-2 shadow-sm" style={{ fontSize: "0.95rem" }}>
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm me-3" style={{ width: "36px", height: "36px", color: "var(--primary-color)" }}>
                    <i className="bi bi-person-badge"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "-2px" }}>ผู้ใช้งาน</div>
                    <div className="fw-medium text-dark">
                      @{memberInfo.name}
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center mb-3">
                  <div className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm me-3" style={{ width: "36px", height: "36px", color: "var(--primary-color)" }}>
                    <i className="bi bi-info-lg"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "-2px" }}>ตำแหน่ง</div>
                    <div className="fw-medium text-dark">
                      <span className="text-uppercase" style={{ fontSize: "0.85rem" }}>{memberInfo.role}</span>
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center mb-3">
                  <div className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm me-3" style={{ width: "36px", height: "36px", color: "var(--primary-color)" }}>
                    <i className="bi bi-chat-dots-fill"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "-2px" }}>จำนวนแชทที่รับผิดชอบ</div>
                    <div className="fw-bold" style={{ fontSize: "1.1rem", color: "var(--primary-color)" }}>
                      {memberInfo.chatCount} แชท
                    </div>
                  </div>
                </div>
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm me-3" style={{ width: "36px", height: "36px", color: "var(--primary-color)" }}>
                    <i className="bi bi-envelope"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "-2px" }}>อีเมล</div>
                    <div className="fw-medium">{memberInfo.email || "-"}</div>
                  </div>
                </div>

                <div className="d-flex align-items-center mb-3">
                  <div className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm me-3" style={{ width: "36px", height: "36px", color: "var(--primary-color)" }}>
                    <i className="bi bi-telephone"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "-2px" }}>เบอร์โทรศัพท์</div>
                    <div className="fw-medium">{memberInfo.phone || "-"}</div>
                  </div>
                </div>

                <div className="d-flex align-items-start">
                  <div className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm me-3 mt-1" style={{ width: "36px", height: "36px", color: "var(--primary-color)" }}>
                    <i className="bi bi-people"></i>
                  </div>
                  <div className="w-100">
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>ทีมที่สังกัด</div>
                    <div className="d-flex flex-wrap gap-2">
                      {memberInfo.teams && memberInfo.teams.length > 0 ? (
                        memberInfo.teams.map(t => (
                          <span key={t.team_id} className="team-badge-pill" style={{ fontSize: "0.80rem", padding: "3px 12px" }}>
                            {t.team_name}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted fw-medium">-</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Member;
