import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Modal,
  Container,
  Form,
  Row,
  Col,
  Card,
  Dropdown,
} from "react-bootstrap";
import { io } from "socket.io-client";
import "./notes.css";

function Dashboard({ user }) {
  const navigate = useNavigate();

  // state สำหรับควบคุม Modal เปิด/ปิด
  const [show, setShow] = useState(false);

  // เก็บรายการโน้ตทั้งหมด
  const [notes, setNotes] = useState([]);

  // การเรียงลำดับ: 'newest' = ใหม่ไปเก่า, 'oldest' = เก่าไปใหม่
  const [sortOrder, setSortOrder] = useState("newest");

  // คำค้นหา
  const [searchText, setSearchText] = useState("");

  // state สำหรับ Form ตอนสร้างหรือแก้ไขโน้ต
  const [newNote, setNewNote] = useState({ user: "", content: "" });

  // เก็บ ID ของโน้ตที่กำลังถูกแก้ไข (ถ้า null แปลว่ากำลังสร้างใหม่)
  const [editingId, setEditingId] = useState(null);

  // โหลดโน้ตจาก API และตั้งค่า Socket.io
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const res = await fetch("/api/notes", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.status === "success") {
          setNotes(data.data);
        }
      } catch (err) {
        console.error("Error fetching notes:", err);
      }
    };

    fetchNotes();

    const socket = io();

    socket.on("new_note", (note) => {
      setNotes((prev) => [note, ...prev]);
    });

    socket.on("updated_note", (updatedNote) => {
      setNotes((prev) =>
        prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)),
      );
    });

    socket.on("deleted_note", ({ id }) => {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ปิด Modal
  const handleClose = () => {
    setShow(false);
    setNewNote({ user: "", content: "" });
    setEditingId(null);
  };

  // เปิด Modal
  const handleShow = () => setShow(true);

  // เตรียมข้อมูลเข้าไปแก้ไข
  const handleEditNote = (note) => {
    setNewNote({ user: note.user, content: note.content });
    setEditingId(note.id);
    handleShow();
  };

  // บันทึกโน้ต หรือ แก้ไขโน้ต
  const handleSaveNote = async () => {
    if (newNote.user && newNote.content) {
      try {
        const token = sessionStorage.getItem("token");
        if (editingId) {
          // โหมดแก้ไข
          const currentUsername = user?.username || user?.name || 'unknown';
          await fetch(`/api/notes/${editingId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ text: newNote.content, edited_by: currentUsername }),
          });
        } else {
          // สร้างใหม่
          await fetch("/api/notes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              customer_id: null,
              text: newNote.content,
              author: newNote.user,
            }),
          });
        }
        handleClose();
      } catch (error) {
        console.error("Error saving note:", error);
      }
    }
  };

  // ลบโน้ต
  const handleDeleteNote = async (id) => {
    if (window.confirm("ยืนยันการลบโน้ต?")) {
      try {
        const token = sessionStorage.getItem("token");
        await fetch(`/api/notes/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        console.error("Error deleting note:", error);
      }
    }
  };

  // จัดรูปแบบวันที่-เวลา
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr.replace(" ", "T"));
    if (isNaN(d)) return "";
    return (
      d.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }) +
      " " +
      d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })
    );
  };

  // กรองและเรียงลำดับโน้ต
  const filteredNotes = notes
    .filter(
      (n) =>
        !searchText ||
        (n.content || "").toLowerCase().includes(searchText.toLowerCase()) ||
        (n.author || "").toLowerCase().includes(searchText.toLowerCase()),
    )
    .sort((a, b) => {
      const da = new Date(a.created_at || 0);
      const db = new Date(b.created_at || 0);
      return sortOrder === "newest" ? db - da : da - db;
    });

  // จำนวนช่องใน Grid ทั้งหมด (มีทั้งโน้ตจริงและช่องว่าง)
  const totalCells = Math.max(
    20,
    filteredNotes.length + (4 - (filteredNotes.length % 4 || 4)),
  );

  // เตรียมช่อง Grid แต่ละช่อง (ถ้า index มีโน้ต จะโชว์โน้ต ถ้าไม่มีก็ว่าง)
  const cells = Array.from({ length: totalCells }, (_, index) => {
    const note = filteredNotes[index];

    return (
      <Col key={index}>
        {note ? (
          // การ์ดแสดงรายละเอียดโน้ต
          <Card
            className="rounded-4 border-light-subtle"
            style={{ height: "180px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}
          >
            <Card.Body className="d-flex flex-column justify-content-between p-3">
              {/* เนื้อหาโน้ต (มี Scroll ถ้าข้อความยาว) */}
              <div
                className="flex-grow-1 mb-2"
                style={{
                  maxHeight: "90px",
                  overflowY: "auto",
                  cursor: note.customer_id ? "pointer" : "default",
                }}
                onClick={() => {
                  if (note.customer_id) {
                    navigate("/inbox", {
                      state: { customerId: note.customer_id },
                    });
                  }
                }}
                title={
                  note.customer_id
                    ? "คลิกเพื่อไปยังหน้าแชทของลูกค้ารายนี้"
                    : "โน้ตนี้ไม่ได้ผูกกับลูกค้า"
                }
              >
                <Card.Text
                  className="fs-6"
                  style={{
                    lineHeight: "1.5",
                    whiteSpace: "pre-wrap",
                    overflowWrap: "break-word",
                  }}
                >
                  {note.content}
                </Card.Text>
              </div>

              <hr className="my-0" style={{ opacity: 0.1 }} />

              {/* Footer: customer avatar + name | author + menu */}
              <div className="d-flex justify-content-between align-items-center pt-2">
                {/* ซ้าย: รูปลูกค้า + ชื่อลูกค้า */}
                <div className="d-flex align-items-center gap-2">
                  {note.customer_avatar ? (
                    <img
                      src={note.customer_avatar}
                      alt={note.user}
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        background: "var(--bg-hover)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.65rem",
                        fontWeight: "600",
                        color: "var(--text-secondary)",
                        flexShrink: 0,
                      }}
                    >
                      {note.user ? note.user.charAt(0).toUpperCase() : "?"}
                    </div>
                  )}
                  <div style={{ lineHeight: 1.2 }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: "600" }}>
                      {note.user || "ไม่ระบุ"}
                    </div>
                    <div
                      style={{
                        fontSize: "0.65rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      สร้างโดย: {note.author || "-"}
                    </div>
                    {note.created_at && (
                      <div
                        style={{
                          fontSize: "0.6rem",
                          color: "var(--text-secondary)",
                          marginTop: "1px",
                        }}
                      >
                        <i className="bi bi-clock me-1"></i>
                        {formatDateTime(note.created_at)}
                      </div>
                    )}
                    {note.edited_by && (
                      <div
                        style={{
                          fontSize: "0.6rem",
                          color: "#d97706",
                          marginTop: "1px",
                        }}
                      >
                        <i className="bi bi-pencil me-1"></i>
                        แก้ไขโดย: {note.edited_by}
                        {note.updated_at && (
                          <span style={{ color: "var(--text-secondary)", marginLeft: "4px" }}>
                            · {formatDateTime(note.updated_at)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ขวา: เมนู */}
                <Dropdown align="end">
                  <Dropdown.Toggle
                    as="div"
                    className="p-0 text-dark border-0 no-caret-toggle"
                    id={`dropdown-${note.id}`}
                    style={{ boxShadow: "none", cursor: "pointer" }}
                  >
                    <i className="bi bi-three-dots-vertical fs-5"></i>
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => handleEditNote(note)}>
                      <i className="bi bi-pencil me-2"></i> แก้ไข
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-danger"
                    >
                      <i className="bi bi-trash me-2"></i> ลบ
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </Card.Body>
          </Card>
        ) : (
          // ช่องว่าง (Placeholder)
          <div
            style={{
              height: "180px",
              border: "2px dashed #e9ecef",
              borderRadius: "1rem",
            }}
          ></div>
        )}
      </Col>
    );
  });

  return (
    <div className="kanit-regular notes-container">
      {/* Modal สำหรับสร้าง/แก้ไขโน้ต */}
      <Modal
        show={show}
        onHide={handleClose}
        centered
        className="kanit-regular "
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fs-4 px-2">
            {editingId ? "แก้ไขโน้ต" : "สร้างโน้ตใหม่"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="pt-2 mx-2">
          <div>
            {/* ช่องกรอกชื่อผู้ใช้ */}
            <Form.Group className="mb-3">
              <Form.Label className="text-muted fs-6">เขียนถึง</Form.Label>
              <Form.Control
                type="text"
                placeholder="ระบุชื่อผู้ใช้"
                autoFocus={!editingId}
                className="rounded-3 bg-light border-0 px-3 py-2"
                value={newNote.user}
                disabled={!!editingId}
                onChange={(e) =>
                  setNewNote({ ...newNote, user: e.target.value })
                }
              />
            </Form.Group>

            {/* ช่องเนื้อหาโน้ต */}
            <Form.Group className="mb-3">
              <Form.Label className="text-muted fs-6">รายละเอียด</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder="พิมพ์ข้อความที่นี่..."
                className="rounded-3 bg-light border-0 px-3 py-3"
                style={{ resize: "none" }}
                value={newNote.content}
                onChange={(e) =>
                  setNewNote({ ...newNote, content: e.target.value })
                }
              />
            </Form.Group>
          </div>
        </Modal.Body>

        {/* ปุ่มบันทึก / ยกเลิก */}
        <Modal.Footer className="border-0 pt-0">
          <Button
            variant="link"
            className="text-muted text-decoration-none me-2 fs-6"
            onClick={handleClose}
          >
            ยกเลิก
          </Button>
          <Button
            style={{ background: "#000000", border: "none" }}
            className="rounded-3 px-5 fs-6"
            onClick={handleSaveNote}
          >
            บันทึก
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Top controls: left = filter pills, right = compact search */}
      <div className="dashboard-top d-flex align-items-center justify-content-between mb-3 px-1">
        <div className="d-flex gap-2 align-items-center">
          <button
            className={`nav-search${sortOrder === "newest" ? " active" : ""}`}
            onClick={() => setSortOrder("newest")}
          >
            ล่าสุด
          </button>
          <button
            className={`nav-search${sortOrder === "oldest" ? " active" : ""}`}
            onClick={() => setSortOrder("oldest")}
          >
            เก่าสุด
          </button>
        </div>

        <div>
          <div className="sidebar-search">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="ค้นหา"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>
      </div>
      {/* โซน Grid แสดงโน้ต */}
      <Container fluid>
        <div style={{ overflowY: "auto", paddingBottom: "12px" }}>
          <Row className="g-3 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-xl-4">
            {cells}
          </Row>
        </div>
      </Container>
    </div>
  );
}

export default Dashboard;
