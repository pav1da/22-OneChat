import { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Dropdown from "react-bootstrap/Dropdown";
import InputGroup from "react-bootstrap/InputGroup";
import "./dashboard.css";

function Dashboard() {
  // state สำหรับควบคุม Modal เปิด/ปิด
  const [show, setShow] = useState(false);

  // เก็บรายการโน้ตทั้งหมด
  const [notes, setNotes] = useState([]);

  // state สำหรับ Form ตอนสร้างหรือแก้ไขโน้ต
  const [newNote, setNewNote] = useState({ user: "", content: "" });

  // เก็บ ID ของโน้ตที่กำลังถูกแก้ไข (ถ้า null แปลว่ากำลังสร้างใหม่)
  const [editingId, setEditingId] = useState(null);

  // โหลดโน้ตจาก sessionStorage ตอนเปิดหน้า
  useEffect(() => {
    const savedNotes = JSON.parse(
      sessionStorage.getItem("dashboardNotes") || "[]"
    );

    // แปลง Format ให้เหมือนกับโครงสร้างใหม่ของระบบ
    const formattedNotes = savedNotes.map((note) => ({
      ...note,
      content: note.text || note.content, // ถ้าเคยใช้ key: text ก็เอามาแทน
      user: note.customerName || note.user || "Unknown",
      id: note.id,
    }));

    setNotes(formattedNotes);
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
  const handleSaveNote = () => {
    if (newNote.user && newNote.content) {
      let updatedNotes;

      // ถ้าอยู่ในโหมดแก้ไข - อัปเดตเฉพาะตัวนั้น
      if (editingId) {
        updatedNotes = notes.map((note) =>
          note.id === editingId ? { ...note, ...newNote } : note
        );
      }
      // ถ้ากำลังเพิ่มใหม่ - สร้าง id ใหม่ด้วย Date.now()
      else {
        updatedNotes = [{ ...newNote, id: Date.now() }, ...notes];
      }

      // เซ็ต state ใหม่
      setNotes(updatedNotes);

      // เก็บลง sessionStorage
      sessionStorage.setItem("dashboardNotes", JSON.stringify(updatedNotes));

      handleClose();
    }
  };

  // ลบโน้ต
  const handleDeleteNote = (id) => {
    if (window.confirm("ยืนยันการลบโน้ต?")) {
      const updatedNotes = notes.filter((note) => note.id !== id);

      setNotes(updatedNotes);
      sessionStorage.setItem("dashboardNotes", JSON.stringify(updatedNotes));
    }
  };

  // จำนวนช่องใน Grid ทั้งหมด (มีทั้งโน้ตจริงและช่องว่าง)
  const totalCells = 20;

  // เตรียมช่อง Grid แต่ละช่อง (ถ้า index มีโน้ต จะโชว์โน้ต ถ้าไม่มีก็ว่าง)
  const cells = Array.from({ length: totalCells }, (_, index) => {
    const note = notes[index];

    return (
      <Col key={index}>
        {note ? (
          // การ์ดแสดงรายละเอียดโน้ต
          <Card
            className="rounded-4 border-light-subtle"
            style={{ height: "250px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}
          >
            <Card.Body className="d-flex flex-column justify-content-between p-4">
              {/* เนื้อหาโน้ต (มี Scroll ถ้าข้อความยาว) */}
              <div
                className="flex-grow-1 mb-3"
                style={{ maxHeight: "150px", overflowY: "auto" }}
              >
                <Card.Text
                  className="fs-5"
                  style={{
                    lineHeight: "1.6",
                    whiteSpace: "pre-wrap",
                    overflowWrap: "break-word",
                  }}
                >
                  {note.content}
                </Card.Text>
              </div>

              <hr className="my-0" style={{ opacity: 0.1 }} />

              {/* รายชื่อผู้เขียน + เมนูแก้ไข/ลบ */}
              <div className="d-flex justify-content-between align-items-center pt-3">
                <span className="fs-6" style={{ fontSize: "0.95rem" }}>
                  {note.user}
                </span>

                <Dropdown align="end">
                  <Dropdown.Toggle
                    as="div"
                    className="p-0 text-dark border-0 no-caret-toggle"
                    id={`dropdown-${note.id}`}
                    style={{
                      boxShadow: "none",
                      cursor: "pointer",
                    }}
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
              height: "250px",
              border: "2px dashed #e9ecef",
              borderRadius: "1rem",
            }}
          ></div>
        )}
      </Col>
    );
  });

  return (
    <div className="kanit-regular px-5 py-4 mx-4 bg-white rounded-4 db-height">
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
            {/* ช่องกรอกชื่อผู้เขียน */}
            <Form.Group className="mb-3">
              <Form.Label className="text-muted fs-6">ผู้เขียน</Form.Label>
              <Form.Control
                type="text"
                placeholder="ระบุชื่อผู้เขียน"
                autoFocus
                className="rounded-3 bg-light border-0 px-3 py-2"
                value={newNote.user}
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

      {/* Navbar ด้านบนของหน้า */}
      <Navbar expand="lg" className="mb-0 bg-white rounded-4 px-2">
        <Container fluid>
          <Navbar.Brand className="fs-3">
            <i
              className="bi bi-journal-text me-2"
              style={{ color: "#F26623" }}
            ></i>
            NOTE
          </Navbar.Brand>

          <Navbar.Toggle />

          <Navbar.Collapse>
            <Nav className="me-auto"></Nav>

            <div className="d-flex gap-3 align-items-center">
              {/* ช่องค้นหา (ตอนนี้ยังไม่ผูกฟังก์ชันค้นหา) */}
              <InputGroup style={{ width: "250px" }}>
                <InputGroup.Text
                  className="bg-white border-1 rounded-start-3 py-2 ps-3 pe-2"
                  style={{ borderColor: "#c5c5c5" }}
                >
                  <i className="bi bi-search text-muted"></i>
                </InputGroup.Text>

                <Form.Control
                  type="search"
                  placeholder="ค้นหา..."
                  className="rounded-end-3 border-1 border-start-0 custom-search"
                />
              </InputGroup>

              {/* ปุ่มเรียงลำดับ (ยังไม่ทำงาน) */}
              <Button
                variant="none"
                className="d-flex align-item-center gap-1 rounded-3 border-1 px-4 py-2"
                style={{
                  background: "#fff",
                  color: "#4e4e4e",
                  borderColor: "#c5c5c5",
                }}
              >
                <i className="bi bi-arrow-down-up"></i>
                เรียงลำดับ
              </Button>

              {/* ปุ่มสร้างโน้ต */}
              <button
                style={{
                  background: "#F26623",
                  borderRadius: "0.375rem",
                  border: "0px",
                  color: "white",
                  whiteSpace: "nowrap",
                  padding: "8px 25px",
                }}
                onClick={handleShow}
              >
                สร้างโน๊ต <i className="bi bi-plus"></i>
              </button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <hr className="mb-4" />
      {/* โซน Grid แสดงโน้ต */}
      <Container fluid>
        <div style={{ maxHeight: "85vh", overflowY: "auto" }}>
          <Row className="g-4 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-xl-4">
            {cells}
          </Row>
        </div>
      </Container>
    </div>
  );
}

export default Dashboard;
