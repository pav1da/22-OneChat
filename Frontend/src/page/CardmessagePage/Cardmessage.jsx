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
      const response = await fetch("http://localhost:3000/api/templates");
      const resData = await response.json();
      if (resData.status === "success") {
        const backendItems = resData.data.map((item) => {
          let content = {};
          try {
            content =
              typeof item.content === "string"
                ? JSON.parse(item.content)
                : item.content;
          } catch (e) {}
          return {
            id: item.id,
            type: item.type,
            title: item.name,
            created: new Date(item.created_at).toLocaleString(),
            images: content?.images || [],
            message: content?.message || "",
          };
        });
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
    type: "ข้อความ",
    title: "",
    image: "",
    images: [],
    message: "",
  });

  const handleShow = () => setShow(true);
  const handleClose = () => {
    (setShow(false), setEditingItem(null));
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

    const payload = {
      name: newItem.title,
      type: newItem.type,
      content: {
        image: newItem.image,
        message: newItem.message,
        images: newItem.images,
      },
      created_by: 1,
    };

    try {
      if (editingItem) {
        await fetch(`http://localhost:3000/api/templates/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("http://localhost:3000/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setShow(false);
      setEditingItem(null);
      setNewItem({
        type: "ข้อความ",
        title: "",
        image: "",
        images: [],
        message: "",
      });
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
              {item.type === "รูปภาพ" && item.images?.length > 0 ? (
                <img
                  src={item.images[0]}
                  alt="preview"
                  className="item-image"
                />
              ) : (
                <span
                  style={{
                    display: "inline-block",
                    maxWidth: "120px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontWeight: 500,
                  }}
                >
                  {item.title}
                </span>
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
                  <i className="bi bi-three-dots-vertical"></i>
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item
                    onClick={async () => {
                      if (window.confirm("คุณต้องการลบเทมเพลตนี้ใช่หรือไม่?")) {
                        try {
                          await fetch(
                            `http://localhost:3000/api/templates/${item.id}`,
                            { method: "DELETE" },
                          );
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
                <option value="ข้อความ">ข้อความ</option>
                <option value="รูปภาพ">รูปภาพ</option>
              </Form.Select>
            </Form.Group>

            {/* ถ้าเป็นรูปภาพ → ให้ผู้ใช้อัพโหลดรูปรวมทั้งหมด 10 รูป*/}
            {newItem.type === "รูปภาพ" && (
              <Form.Group className="mb-3">
                <Form.Label>
                  เลือกรูปภาพ (รวมสูงสุด 10 ภาพ -
                  เลือกทีละรูปหรือทีละหลายรูปได้)
                </Form.Label>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Form.Control
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={newItem.images?.length >= 10}
                    onChange={(e) => {
                      const remain = 10 - (newItem.images?.length || 0);
                      const files = Array.from(e.target.files).slice(0, remain);
                      if (!files.length) return;

                      const imagePromises = files.map((file) => {
                        return new Promise((resolve) => {
                          const reader = new FileReader();
                          reader.onloadend = () => resolve(reader.result);
                          reader.readAsDataURL(file);
                        });
                      });
                      Promise.all(imagePromises).then((results) => {
                        setNewItem((prev) => ({
                          ...prev,
                          images: [...(prev.images || []), ...results],
                        }));
                      });

                      // Clear file input so same file can be selected again if needed
                      e.target.value = null;
                    }}
                  />
                  <small className="text-muted text-nowrap">
                    {newItem.images?.length || 0}/10
                  </small>
                </div>
                {newItem.images && newItem.images.length > 0 && (
                  <div className="mt-2 d-flex flex-wrap gap-2 p-2 border rounded bg-light">
                    {newItem.images.map((img, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: "relative",
                          display: "inline-block",
                        }}
                      >
                        <img
                          src={img}
                          alt={`preview-${idx}`}
                          style={{
                            width: "65px",
                            height: "65px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            border: "1px solid #ddd",
                          }}
                        />
                        <button
                          type="button"
                          className="btn-close btn-sm bg-white rounded-circle shadow-sm"
                          style={{
                            position: "absolute",
                            top: -5,
                            right: -5,
                            padding: "4px",
                            fontSize: "10px",
                          }}
                          onClick={() => {
                            setNewItem((prev) => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== idx),
                            }));
                          }}
                        ></button>
                      </div>
                    ))}
                  </div>
                )}
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
