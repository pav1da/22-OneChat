import React, { useState, useEffect } from "react";
import { Form, Button, Modal } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

// Import ข้อมูลตั้งต้น
import { usersData, initialTeams } from "../data/memberData";

const Member = () => {
    // ================== 1. STATE MANAGEMENT ==================
    const [allMembers, setAllMembers] = useState([]);
    const [teams, setTeams] = useState([]);

    // Search & Sort (Member Section)
    const [searchTerm, setSearchTerm] = useState("");
    const [isSorted, setIsSorted] = useState(false);

    // Modals
    const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState("");

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [selectedTeamForEdit, setSelectedTeamForEdit] = useState("");

    const [activePopupId, setActivePopupId] = useState(null);

    // ================== 2. INITIALIZATION ==================
    useEffect(() => {
        const validMembers = usersData.filter(
            (user) => user.role !== "it" && user.role !== "customer"
        );
        setAllMembers(validMembers);
        setTeams(initialTeams);
    }, []);

    // ================== 3. LOGIC (SORT & SEARCH) ==================
    const getProcessedMembers = () => {
        let result = [...allMembers];

        // Search
        if (searchTerm) {
            result = result.filter((member) =>
                member.name.toLowerCase().includes(searchTerm.toLowerCase())
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
            prev.map((t) =>
                t.id === id ? { ...t, isOpen: !t.isOpen } : t
            )
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

    const openEditModal = (user) => {
        setEditingUser(user);
        setSelectedTeamForEdit(user.team);
        setShowEditModal(true);
        setActivePopupId(null);
    };

    const handleSaveEdit = () => {
        const updatedMembers = allMembers.map((user) =>
            user.id === editingUser.id
                ? { ...user, team: selectedTeamForEdit }
                : user
        );

        setAllMembers(updatedMembers);
        setShowEditModal(false);
    };

    const handleDeleteUser = (userId) => {
        if (window.confirm("ยืนยันการลบสมาชิกนี้?")) {
            setAllMembers((prev) =>
                prev.filter((user) => user.id !== userId)
            );
            setActivePopupId(null);
        }
    };

    // ================== 5. RENDER UI ==================
    return (
        <div
            className="kanit-regular h-100 d-flex flex-column bg-white rounded-4 py-4 px-5"
            style={{ paddingLeft: "6%", paddingRight: "6%", overflowY: "auto" }}
            onClick={() => setActivePopupId(null)}
        >
            {/* TEAM HEADER */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold mb-0" style={{ color: "#FF7A00" }}>
                    Team
                </h4>

                <div className="d-flex gap-2">
                    <div className="position-relative">
                        <Form.Control
                            type="text"
                            placeholder="ค้นหาทีม"
                            size="sm"
                            className="ps-5 bg-light border-0 rounded-3"
                            style={{ minWidth: "200px", height: "38px" }}
                        />
                        <i
                            className="bi bi-search position-absolute text-muted"
                            style={{ top: "8px", left: "15px" }}
                        ></i>
                    </div>

                    <Button
                        variant="warning"
                        className="text-white fw-bold d-flex align-items-center gap-2 rounded-3 px-3"
                        style={{ backgroundColor: "#FF7A00", border: "none" }}
                        onClick={() => setShowCreateTeamModal(true)}
                    >
                        สร้างทีม <i className="bi bi-plus-lg"></i>
                    </Button>
                </div>
            </div>


             <hr className="mb-4 mt-2" style={{ borderTop: '1px solid #666666ff' }} />


            {/* TEAM LIST */}
            <div className="d-flex flex-column gap-3 mb-5">
                {teams.map((team) => {
                    const membersInTeam = allMembers
                        .filter(
                            (u) =>
                                u.team?.toLowerCase() ===
                                team.name.toLowerCase()
                        )
                        .sort((a, b) =>
                            a.role === "หัวหน้า" ? -1 : 1
                        );

                    return (
                        <div
                            key={team.id}
                            className="rounded-4 overflow-hidden"
                            style={{ border: "1px solid #E9ECEF" }}
                        >
                            {/* Team Header */}
                            <div
                                className="d-flex justify-content-between align-items-center p-3"
                                style={{ backgroundColor: "#fff", cursor: "pointer" }}
                                onClick={() => toggleTeam(team.id)}
                            >
                                <div>
                                    <div className="fw-bold fs-5">{team.name}</div>
                                    <div
                                        className="text-muted"
                                        style={{ fontSize: "0.85rem" }}
                                    >
                                        สมาชิก {membersInTeam.length} คน
                                    </div>
                                </div>
                                <i
                                    className={`bi bi-chevron-${team.isOpen ? "down" : "right"} text-muted`}
                                ></i>
                            </div>

                            {/* Team Members */}
                            {team.isOpen && (
                                <div
                                    className="bg-light border-top"
                                    style={{ backgroundColor: "#f8f9fa" }}
                                >
                                    {membersInTeam.length > 0 ? (
                                        membersInTeam.map((member) => (
                                            <div
                                                key={member.id}
                                                className="d-flex justify-content-between align-items-center p-3 border-bottom border-light ps-5"
                                            >
                                                <div className="d-flex align-items-center gap-3">
                                                    <img
                                                        src={
                                                            member.image ||
                                                            "/img/default.png"
                                                        }
                                                        alt={member.name}
                                                        className="rounded-circle"
                                                        style={{
                                                            width: "40px",
                                                            height: "40px",
                                                            objectFit: "cover",
                                                        }}
                                                    />
                                                    <div>
                                                        <div className="fw-bold">
                                                            {member.name}
                                                        </div>
                                                        <small
                                                            className={
                                                                member.role ===
                                                                    "หัวหน้า"
                                                                    ? "text-primary fw-bold"
                                                                    : "text-muted"
                                                            }
                                                        >
                                                            {member.role}
                                                        </small>
                                                    </div>
                                                </div>

                                                {/* Team Member Popup */}
                                                <div className="position-relative">
                                                    <Button
                                                        variant="link"
                                                        className="text-muted p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActivePopupId(
                                                                activePopupId ===
                                                                    `team-${member.id}`
                                                                    ? null
                                                                    : `team-${member.id}`
                                                            );
                                                        }}
                                                    >
                                                        <i className="bi bi-three-dots-vertical"></i>
                                                    </Button>

                                                    {activePopupId ===
                                                        `team-${member.id}` && (
                                                            <div
                                                                className="position-absolute bg-white shadow rounded-2 p-2"
                                                                style={{
                                                                    right: 0,
                                                                    top: "100%",
                                                                    zIndex: 10,
                                                                    minWidth: "100px",
                                                                }}
                                                            >
                                                                <div
                                                                    className="text-danger cursor-pointer px-2 py-1 hover-bg-light"
                                                                    style={{
                                                                        cursor: "pointer",
                                                                    }}
                                                                    onClick={() =>
                                                                        handleDeleteUser(
                                                                            member.id
                                                                        )
                                                                    }
                                                                >
                                                                    <i className="bi bi-trash me-2"></i>
                                                                    ลบ
                                                                </div>
                                                            </div>
                                                        )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-3 text-center text-muted">
                                            ไม่มีสมาชิกในทีมนี้
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ================= SECTION: ALL MEMBERS ================= */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold mb-0" style={{ color: "#FF7A00" }}>
                    Member
                </h4>

                <div className="d-flex gap-2">
                    {/* Search */}
                    <div className="position-relative">
                        <Form.Control
                            type="text"
                            placeholder="ค้นหาสมาชิก"
                            size="sm"
                            className="ps-5 bg-light border-0 rounded-3"
                            style={{ minWidth: "200px", height: "38px" }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <i
                            className="bi bi-search position-absolute text-muted"
                            style={{ top: "8px", left: "15px" }}
                        ></i>
                    </div>

                    {/* Sort */}
                    <Button
                        variant={isSorted ? "secondary" : "light"}
                        className="d-flex align-items-center gap-2 rounded-3 px-3 border"
                        style={{
                            backgroundColor: isSorted ? "#6c757d" : "#F8F9FA",
                            color: isSorted ? "white" : "black",
                        }}
                        onClick={() => setIsSorted(!isSorted)}
                    >
                        <i className="bi bi-arrow-down-up"></i>
                        {isSorted ? "เรียงแล้ว (Eng-Thai)" : "เรียงลำดับ"}
                    </Button>
                </div>
            </div>

            <hr className="mb-4 mt-2" style={{ borderTop: '1px solid #666666ff' }} />

            {/* Header */}
            <div
                className="d-flex px-3 py-2 fw-bold text-dark"
                style={{ borderBottom: "1px solid #dee2e6" }}
            >
                <div style={{ width: "25%" }}>ชื่อ</div>
                <div style={{ width: "25%" }}>ทีม</div>
                <div style={{ width: "25%" }}>บทบาท</div>
                <div style={{ width: "25%" }}>สถานะ</div>
                <div style={{ width: "80px" }}></div>
            </div>

            {/* Member List */}
            <div className="d-flex flex-column pb-5">
                {displayMembers.map((member) => (
                    <div
                        key={member.id}
                        className="d-flex align-items-center px-3 py-3 border-bottom"
                        style={{ backgroundColor: "white" }}
                    >
                        {/* Name */}
                        <div
                            style={{ width: "25%" }}
                            className="d-flex align-items-center gap-3"
                        >
                            <img
                                src={member.image || "/img/default.png"}
                                alt={member.name}
                                className="rounded-circle"
                                style={{
                                    width: "40px",
                                    height: "40px",
                                    objectFit: "cover",
                                }}
                            />
                            <span className="fw-bold">{member.name}</span>
                        </div>

                        <div style={{ width: "25%" }} className="fw-bold">
                            {member.team}
                        </div>

                        <div
                            style={{ width: "25%" }}
                            className="fw-bold text-uppercase"
                        >
                            {member.role}
                        </div>

                        <div style={{ width: "25%" }} className="fw-bold">
                            {member.status}
                        </div>

                        {/* Actions */}
                        <div
                            style={{ width: "80px" }}
                            className="d-flex gap-2 justify-content-end position-relative"
                        >
                            <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-2 p-0 d-flex justify-content-center align-items-center"
                                style={{
                                    width: "30px",
                                    height: "30px",
                                    backgroundColor: "#555",
                                    border: "none",
                                }}
                                onClick={() => openEditModal(member)}
                            >
                                <i
                                    className="bi bi-pencil-fill"
                                    style={{ fontSize: "0.7rem" }}
                                ></i>
                            </Button>

                            {/* Popup */}
                            <div className="position-relative">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="rounded-2 p-0 d-flex justify-content-center align-items-center"
                                    style={{
                                        width: "30px",
                                        height: "30px",
                                        backgroundColor: "#555",
                                        border: "none",
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActivePopupId(
                                            activePopupId ===
                                                `member-${member.id}`
                                                ? null
                                                : `member-${member.id}`
                                        );
                                    }}
                                >
                                    <i className="bi bi-three-dots"></i>
                                </Button>

                                {activePopupId === `member-${member.id}` && (
                                    <div
                                        className="position-absolute bg-white shadow rounded-2 p-2"
                                        style={{
                                            right: 0,
                                            top: "100%",
                                            zIndex: 10,
                                            minWidth: "100px",
                                            border: "1px solid #eee",
                                        }}
                                    >
                                        <div
                                            className="text-danger cursor-pointer px-2 py-1"
                                            onClick={() =>
                                                handleDeleteUser(member.id)
                                            }
                                        >
                                            <i className="bi bi-trash me-2"></i>
                                            ลบ
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {displayMembers.length === 0 && (
                    <div className="text-center py-5 text-muted">
                        ไม่พบข้อมูลสมาชิก
                    </div>
                )}
            </div>

            {/* ================= MODALS ================= */}
            {/* Create Team */}
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

            {/* Edit Member */}
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
                        สมาชิก:{" "}
                        <strong>{editingUser?.name}</strong>
                    </p>
                    <Form.Group>
                        <Form.Label>เลือกทีม</Form.Label>
                        <Form.Select
                            value={selectedTeamForEdit}
                            onChange={(e) =>
                                setSelectedTeamForEdit(e.target.value)
                            }
                        >
                            <option value="">-- ไม่ระบุทีม --</option>
                            {teams.map((team) => (
                                <option key={team.id} value={team.name}>
                                    {team.name}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowEditModal(false)}
                    >
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