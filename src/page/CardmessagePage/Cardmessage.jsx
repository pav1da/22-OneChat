import React, { useState } from "react";
import {
  Container,
  Button,
  Form,
  Col,
  Row,
  Dropdown,
  Modal,
} from "react-bootstrap";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Cardmessage.css";

const Cardmessage = () => {
  const [search, setSearch] = useState("");
  const [show, setShow] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [items, setItems] = useState([
    {
      id: "C001",
      type: "รูปภาพ",
      title: "ช่อวัน Congrats",
      created: "25/7/2025, 17:32:05 AM",
      image: "src/assets/Image/Product/image.png",
      message: "",
    },
    {
      id: "M001",
      type: "ข้อความ",
      title: "วิธีสั่งซื้อ",
      created: "20/7/2025, 13:02:12 AM",
      image: "",
      message: "วิธีสั่งซื้อ 1.เลือกแบบช่อที่ต้องการ",
    },
  ]);
  // Modal สร้างเทมเพลตใหม่
  const [newItem, setNewItem] = useState({
    type: "รูปภาพ",
    title: "",
    image: "",
    message: "",
  });

  const handleShow = () => setShow(true);
  const handleClose = () => {
    setShow(false), setEditingItem(null);
  };

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.type.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateItem = () => {
    if (!newItem.title) {
      alert("กรุณากรอกชื่อไอเทม");
      return;
    }

    if (editingItem) {
      const updated = items.map((i) =>
        i.id === editingItem.id ? { ...editingItem, ...newItem } : i
      );
      setItems(updated);
      setEditingItem(null);
      setShow(false);
      return;
    }

    const data = {
      id: "X" + (items.length + 1).toString().padStart(3, "0"),
      created: new Date().toLocaleString(),
      ...newItem,
    };

    setItems([...items, data]);
    setShow(false);

    // reset
    setNewItem({
      type: "รูปภาพ",
      title: "",
      image: "",
      message: "",
    });
  };

  return (
    <div className="main-content flex-grow-1 p-3 kanit-regular bg-white rounded-4">
      {/* หัวข้อ */}

      <p style={{ color: "#F26623" }} className="fs-3 px-3 pt-3" href="#">
        Card & Messages
      </p>

      <p
        style={{ color: "#919191", marginTop: "10px", marginLeft: "15px" }}
        className="fs-6"
        href="#"
      >
        ข้อความ และข้อความในรูปแบบการ์ดที่รวมเนื้อหาต่างๆ เอาไว้ในที่เดียว{" "}
        <br />
        โดยจะเเสดงเนื้อหาผ่านข้อความหรือภาพสไลด์ ตามที่ผู้ใช้กดเลือกใช้ได้ทันที
      </p>

      {/* “ขยาย/ย่อเมนูเป็นเบอเก้ออ” */}
      <Navbar.Toggle aria-controls="navbarScroll" />
      <Navbar.Collapse id="navbarScroll">
        <Nav
          className="me-auto my-2 my-lg-0"
          style={{ maxHeight: "100px" }}
          navbarScroll
        ></Nav>
      </Navbar.Collapse>

      {/* หัวข้อเทมเพลต */}
      <div className="d-flex justify-content-between align-items-center mt-3 ">
        <div className="fs-6 fw-regular ms-3 mt-3">เทมเพลตทั้งหมด</div>

        {/* กล่อง Search*/}
        <div className="d-flex gap-2 w-50">
          <Form className="w-50">
            <Form.Control
              type="search"
              placeholder="Search"
              className="me-2 "
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Form>

          {/* style ปุ่ม */}
          <Button className="w-25" variant="outline-dark light">
            <i className="bi bi-arrow-down-up pe-2"></i>
            เรียงลำดับ
          </Button>

          <button
          className="w-25"
            style={{
              background: "#F26623",
              borderRadius: "7px",
              border: "0px",
              color: "white",
              alignContent: "center",
            }}
            onClick={() => {
              handleShow();
            }}
          >
            <i className="bi bi-plus pe-2"></i>
            สร้าง
          </button>
        </div>
      </div>

      <hr />
      <Container fluid className=" p-0 card-table-container">
        {/* หัวข้อ */}
        <Row className="card-table-header">
          <Col className="col-id">ID</Col>
          <Col className="col-item">รูป/ข้อความ</Col>
          <Col>ชื่อไอเทม</Col>
          <Col className="col-created">วันสร้าง</Col>
          <Col className="col-type">ประเภท</Col>
          <Col style={{ width: "40px" }}></Col> {/* สำหรับจุดสามจุด */}
        </Row>

        {/* ข้อมูล */}
        {filteredItems.map((item) => (
          <Row key={item.id} className="card-table-row">
            {/* ID */}
            <Col className="col-id">{item.id}</Col>

            {/* รูป/ข้อความ */}
            <Col className="col-item">
              {item.type === "รูปภาพ" && item.image ? (
                <img src={item.image} alt={item.title} className="item-image" />
              ) : (
                <span>{item.message}</span>
              )}
            </Col>

            {/* ชื่อไอเทม */}
            <Col>{item.title}</Col>

            {/* วันสร้าง */}
            <Col className="col-created">{item.created}</Col>

            {/* ประเภท */}
            <Col className="col-type">{item.type}</Col>

            {/* จุดสามจุด + Dropdown */}
            <Col style={{ width: "40px", textAlign: "center" }}>
              <Dropdown>
                <Dropdown.Toggle
                  variant="link"
                  id={`dropdown-${item.id}`}
                  className="p-0 m-0 item-options"
                >
                  <img
                    src="src/assets/Icon/icon-dot-h.png"
                    alt="options"
                    style={{ width: "20px", height: "20px", cursor: "pointer" }}
                  />
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item
                    onClick={() => {
                      // ลบไอเทมนี้ออกจาก state
                      setItems(items.filter((i) => i.id !== item.id));
                    }}
                  >
                    ลบ
                  </Dropdown.Item>

                  <Dropdown.Item
                    onClick={() => {
                      setEditingItem(item);
                      setNewItem(item);
                      setShow(true);
                    }}
                  >
                    แก้ไข
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Col>
          </Row>
        ))}
      </Container>

      {/* Modal UI สำหรับสร้างเทมเพลตใหม่ */}
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingItem ? "แก้ไข Card / Message" : "สร้าง Card / Message"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            {/* ชื่อไอเทม */}
            <Form.Group className="mb-3">
              <Form.Label>ชื่อไอเทม</Form.Label>
              <Form.Control
                type="text"
                onChange={(e) =>
                  setNewItem({ ...newItem, title: e.target.value })
                }
              />
            </Form.Group>

            {/* ประเภท */}
            <Form.Group className="mb-3">
              <Form.Label>ประเภท</Form.Label>
              <Form.Select
                value={newItem.type}
                onChange={(e) =>
                  setNewItem({ ...newItem, type: e.target.value })
                }
              >
                <option value="รูปภาพ">รูปภาพ</option>
                <option value="ข้อความ">ข้อความ</option>
              </Form.Select>
            </Form.Group>

            {/* ถ้าเป็นรูปภาพ → ให้ผู้ใช้อัพโหลดรูป */}
            {newItem.type === "รูปภาพ" && (
              <Form.Group className="mb-3">
                <Form.Label>เลือกรูปภาพ</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    const reader = new FileReader();
                    // เก็บรูปไว้ใน state
                    reader.onloadend = () => {
                      setNewItem({ ...newItem, image: reader.result });
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </Form.Group>
            )}

            {/* ถ้าเป็นข้อความ → ให้ผู้ใช้พิมพ์ข้อความ*/}
            {newItem.type === "ข้อความ" && (
              <Form.Group className="mb-3">
                <Form.Label>ข้อความ</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  onChange={(e) =>
                    // เก็บค่าที่พิมพ์ลง state
                    setNewItem({ ...newItem, message: e.target.value })
                  }
                />
              </Form.Group>
            )}
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            ยกเลิก
          </Button>
          <Button
            style={{
              background: "#F26623",

              borderRadius: "7px",
              border: "0px",
              color: "white",
            }}
            onClick={handleCreateItem}
          >
            {editingItem ? "บันทึกการแก้ไข" : "สร้างใหม่"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Cardmessage;
