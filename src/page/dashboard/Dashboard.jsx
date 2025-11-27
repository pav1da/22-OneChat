import React, { useState } from "react";
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
  const [show, setShow] = useState(false);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState({ user: "", content: "" });
  const [editingId, setEditingId] = useState(null);

  const handleClose = () => {
    setShow(false);
    setNewNote({ user: "", content: "" });
    setEditingId(null);
  };

  const handleShow = () => setShow(true);

  const handleEditNote = (note) => {
    setNewNote({ user: note.user, content: note.content });
    setEditingId(note.id);
    handleShow();
  };

  const handleSaveNote = () => {
    if (newNote.user && newNote.content) {
      if (editingId) {
        setNotes(
          notes.map((note) =>
            note.id === editingId ? { ...note, ...newNote } : note
          )
        );
      } else {
        setNotes([...notes, { ...newNote, id: Date.now() }]);
      }
      handleClose();
    }
  };

  const handleDeleteNote = (id) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  // กำหนดจำนวนช่องว่าง Grid ทั้งหมด
  const totalCells = 20;

  // ลอจิกการสร้าง Grid แบบมีช่องว่าง (Placeholder)
  const cells = Array.from({ length: totalCells }, (_, index) => {
    const note = notes[index];

    return (
      <Col key={index}>
        {note ? (
          <Card
            className="rounded-4 border-light-subtle"
            style={{ height: "250px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}
          >
            <Card.Body className="d-flex flex-column justify-content-between p-4">
              {/* ส่วนเนื้อหาที่มี Scrollbar ภายใน Card (ถ้าข้อความยาวมาก) */}
              <div
                className="flex-grow-1 mb-3"
                style={{ maxHeight: "150px", overflowY: "auto" }}
              >
                <Card.Text
                  style={{
                    fontSize: "0.95rem",
                    lineHeight: "1.6",
                    whiteSpace: "pre-wrap",
                    overflowWrap: "break-word",
                  }}
                >
                  {note.content}
                </Card.Text>
              </div>

              <hr className="my-0" style={{ opacity: 0.1 }} />

              <div className="d-flex justify-content-between align-items-center pt-3">
                <span className="fw-medium" style={{ fontSize: "0.95rem" }}>
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
    <div className="kanit-regular bg-white rounded-4 p-3 mx-4 db-height">
      {/* Modal */}
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fs-5 fw-bold">
            {editingId ? "แก้ไขโน้ต" : "สร้างโน้ตใหม่"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <div>
            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
              <Form.Label
                className="text-muted fw-medium"
                style={{ fontSize: "0.9rem" }}
              >
                ผู้เขียน
              </Form.Label>
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
            <Form.Group
              className="mb-3"
              controlId="exampleForm.ControlTextarea1"
            >
              <Form.Label
                className="text-muted fw-medium"
                style={{ fontSize: "0.9rem" }}
              >
                รายละเอียด
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder="พิมพ์ข้อความที่นี่..."
                className="rounded-3 bg-light border-0 px-3 py-2"
                style={{ resize: "none" }}
                value={newNote.content}
                onChange={(e) =>
                  setNewNote({ ...newNote, content: e.target.value })
                }
              />
            </Form.Group>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button
            variant="link"
            className="text-muted text-decoration-none me-2"
            onClick={handleClose}
          >
            ยกเลิก
          </Button>
          <Button
            style={{ background: "#000000", border: "none" }}
            className="rounded-3 px-4"
            onClick={handleSaveNote}
          >
            บันทึก
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Navbar และ Controls */}
      <Navbar expand="lg" className="mb-4 bg-white rounded-4 px-2">
        <Container fluid>
          <Navbar.Brand className="fs-4 fw-bold" href="#">
            <i
              className="bi bi-journal-text me-2"
              style={{ color: "#F26623" }}
            ></i>
            NOTE
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbarScroll" />
          <Navbar.Collapse id="navbarScroll">
            <Nav className="me-auto my-2 my-lg-0" navbarScroll></Nav>

            <div className="d-flex gap-3 align-items-center">
              {/* ช่องค้นหา - สี่เหลี่ยมขอบมน, ไอคอนจัดกลาง */}
              <InputGroup style={{ width: "250px" }}>
                <InputGroup.Text
                  className="bg-white border-0 rounded-start-3 py-2 ps-3 pe-2"
                  style={{
                    boxShadow: "1px 1px 0px rgba(0,0,0,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i className="bi bi-search text-muted"></i>
                </InputGroup.Text>
                <Form.Control
                  type="search"
                  placeholder="ค้นหา..."
                  className="rounded-end-3 border-0 custom-search"
                  style={{
                    boxShadow: "1px 1px 0px rgba(0,0,0,0.1)"
                  }}
                  aria-label="Search"
                />
              </InputGroup>

              {/* ปุ่มเรียงลำดับ - สี่เหลี่ยมขอบมน */}
              <Button
                variant="light"
                className="d-flex align-items-center gap-1 rounded-3 border-0 px-3 py-2"
                style={{
                  background: "#ffffff",
                  color: "#6c757d",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <i className="bi bi-arrow-down-up"></i>
                เรียงลำดับ
              </Button>

              {/* ปุ่มสร้างโน้ต - สี่เหลี่ยมขอบมน */}
              <button
                style={{
                  background: "#F26623",
                  borderRadius: "0.375rem",
                  border: "0px",
                  color: "white",
                  whiteSpace: "nowrap",
                  padding: "8px 20px",
                  fontWeight: "500",
                  boxShadow: "0 2px 5px rgba(242, 102, 35, 0.4)",
                }}
                onClick={() => {
                  handleShow();
                }}
              >
                สร้างโน๊ต <i className="bi bi-plus"></i>
              </button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Grid Display - พื้นที่ Grid หลักที่มี Scrollbar (กลับมาใส่ div ห่อหุ้ม) */}
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
