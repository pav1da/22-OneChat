import React, { useState, useEffect } from "react";
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

  const [items, setItems] = useState([]);

  const fetchItems = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch("/api/templates", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error:", response.status, errorText);
        return;
      }
      const resData = await response.json();
      if (resData.status === "success") {
        const backendItems = resData.data.map((item) => ({
          id: item.id,
          type: item.type,
          title: item.name,
          created: new Date(item.created_at).toLocaleString(),
        }));
        setItems(backendItems);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);
  // Modal สร้างเทมเพลตใหม่
  const [newItem, setNewItem] = useState({
    type: "รูปภาพ",
    title: "",
    image: "",
    message: "",
  });

  const handleShow = () => setShow(true);
  const handleClose = () => {
    setShow(false);
    setEditingItem(null);
    setNewItem({ type: "รูปภาพ", title: "", image: "", message: "" });
  };

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.type.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreateItem = async () => {
    if (!newItem.title) {
      alert("กรุณากรอกชื่อไอเทม");
      return;
    }

    const currentUser = JSON.parse(sessionStorage.getItem('myAppUser') || '{}');
    const payload = {
      name: newItem.title,
      type: newItem.type,
      content: { image: newItem.image, message: newItem.message },
      created_by: currentUser?.emp_id || null
    };

    try {
      const token = sessionStorage.getItem('token');
      if (editingItem) {
        await fetch(`/api/templates/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      }
      setShow(false);
      setEditingItem(null);
      setNewItem({ type: "รูปภาพ", title: "", image: "", message: "" });
      fetchItems();
    } catch (error) {
      console.error("Error saving template:", error);
    }
  };

  return (
    <div className="main-content flex-grow-1 kanit-regular px-4">
      {/* หัวข้อเทมเพลต */}
      <div className="d-flex justify-content-between align-items-center">
        <div className="fs-6 fw-regular">เทมเพลตทั้งหมด</div>

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

      <Container fluid className="mt-3 card-table-container">
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
              {item.type === "รูปภาพ" ? (
                <span>🖼️ รูปภาพ</span>
              ) : (
                <span>💬 ข้อความ</span>
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
                  <i className="bi bi-three-dots" style={{ fontSize: "1.2rem", cursor: "pointer" }}></i>
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item
                    onClick={async () => {
                      if(window.confirm("คุณต้องการลบเทมเพลตนี้ใช่หรือไม่?")) {
                         try {
                           const token = sessionStorage.getItem('token');
                           await fetch(`/api/templates/${item.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
                           fetchItems();
                         } catch (error) {
                           console.error("Error deleting template:", error);
                         }
                      }
                    }}
                  >
                    ลบ
                  </Dropdown.Item>

                  <Dropdown.Item
                    onClick={async () => {
                      try {
                        const token = sessionStorage.getItem('token');
                        const res = await fetch(`/api/templates/${item.id}`, {
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        const data = await res.json();
                        if (data.status === 'success') {
                          let content = {};
                          try {
                            content = typeof data.data.content === 'string' ? JSON.parse(data.data.content) : data.data.content;
                          } catch(e){}
                          const imageValue = content?.image || (Array.isArray(content?.images) && content.images.length > 0 ? content.images[0] : "");
                          const editData = {
                            id: data.data.id,
                            type: data.data.type,
                            title: data.data.name,
                            image: imageValue,
                            message: content?.message || "",
                          };
                          setEditingItem(editData);
                          setNewItem(editData);
                          setShow(true);
                        }
                      } catch (error) {
                        console.error("Error fetching template for edit:", error);
                      }
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
                value={newItem.title}
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
                  value={newItem.message}
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
