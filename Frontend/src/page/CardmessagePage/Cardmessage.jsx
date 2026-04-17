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
import Cropper from "react-easy-crop";
import "./Cardmessage.css";

// Helper function to crop the image
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    }, 'image/jpeg');
  });
}

const Cardmessage = () => {
  const [search, setSearch] = useState("");
  const [show, setShow] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Crop State
  const [imgSrc, setImgSrc] = useState(""); // file for raw image string
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);

  const [items, setItems] = useState([]);

  const fetchItems = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch("/api/templates/picker", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error:", response.status, errorText);
        return;
      }
      const resData = await response.json();
      if (resData.status === "success") {
        const backendItems = resData.data.map((item) => {
          // parse content เพื่อเอา message preview
          let textPreview = "";
          try {
            const c = item.content
              ? (typeof item.content === 'string' ? JSON.parse(item.content) : item.content)
              : null;
            textPreview = c?.message || c?.text || "";
          } catch (e) { textPreview = ""; }

          return {
            id: item.id,
            type: item.type,
            title: item.name,
            textPreview,
            created: new Date(item.created_at).toLocaleString(),
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
    type: "รูปภาพ",
    title: "",
    image: "",
    message: "",
  });
  const [cards, setCards] = useState([{ id: 1, image: "", message: "", tag: "", isEndCard: false }]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const handleShow = () => setShow(true);
  const handleClose = () => {
    setShow(false);
    setEditingItem(null);
    setNewItem({ type: "รูปภาพ", title: "", image: "", message: "" });
    setCards([{ id: 1, image: "", message: "", tag: "", isEndCard: false }]);
    setActiveCardIndex(0);
  };

  const handleUpdateCard = (field, value) => {
    const updated = [...cards];
    updated[activeCardIndex][field] = value;
    setCards(updated);
    
    // Sync to newItem so the original logic handles saving Card 1 perfectly without restructuring the DB
    if (activeCardIndex === 0) {
      setNewItem(prev => ({ ...prev, [field]: value }));
    }
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

    // Single cards are now wrapped in carousel payload for LINE Flex compatibility
    let contentPayload;
    if (newItem.type === "รูปภาพ") {
      contentPayload = {
        type: 'carousel',
        cards: [{ image: cards[0].image, message: cards[0].message, tag: cards[0].tag || "", isEndCard: false }]
      };
    } else {
      // ข้อความ — always single card, use cards[0].message
      contentPayload = { message: cards[0].message };
    }

    const payload = {
      name: newItem.title,
      type: newItem.type,
      content: contentPayload,
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
      setCards([{ id: 1, image: "", message: "", tag: "", isEndCard: false }]);
      setActiveCardIndex(0);
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
          <Col className="col-item">ตัวอย่าง</Col>
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

          {/* ตัวอย่างเนื้อหา */}
          <Col className="col-item">
            {item.type === "รูปภาพ" ? (
              <img
                src={`/api/templates/${item.id}/image`}
                alt={item.title}
                loading="lazy"
                style={{
                  width: 52,
                  height: 52,
                  objectFit: "cover",
                  borderRadius: 6,
                  border: "1px solid #eee",
                }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted, #555)",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  maxWidth: 180,
                }}
                title={item.textPreview}
              >
                {item.textPreview || "-"}
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
                          // Restore cards array from content (supports single & carousel formats)
                          const imageValue = content?.image || (Array.isArray(content?.images) && content.images.length > 0 ? content.images[0] : "");
                          let restoredCards;
                          if (Array.isArray(content?.cards) && content.cards.length > 0) {
                            // Multi-card carousel format
                            restoredCards = content.cards.map((c, i) => ({ id: i + 1, image: c.image || "", message: c.message || "", tag: c.tag || "", isEndCard: c.isEndCard || false }));
                          } else {
                            // Single-card / old format
                            restoredCards = [{ id: 1, image: imageValue, message: content?.message || "", tag: "", isEndCard: false }];
                          }
                          const editData = {
                            id: data.data.id,
                            type: data.data.type,
                            title: data.data.name,
                            image: restoredCards[0].image,
                            message: restoredCards[0].message,
                          };
                          setEditingItem(editData);
                          setNewItem(editData);
                          setCards(restoredCards);
                          setActiveCardIndex(0);
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

      {/* Modal UI สำหรับสร้างเทมเพลตใหม่ (LINE OA Inspired Split-Pane) */}
      <Modal show={show} onHide={handleClose} size="xl" dialogClassName="cm-builder-modal" centered>
        <Modal.Header closeButton className="border-bottom-0 pb-0 pt-3 pe-4">
          <Modal.Title className="fs-5 fw-bold ms-3" style={{ color: "var(--text-heading, #111827)" }}>
            {editingItem ? "แก้ไข การ์ดเมสเสจ" : "สร้าง การ์ดเมสเสจ"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-0 position-relative">
          <div className="cm-builder-container">
            
            {/* Left Column: Mobile Preview Pane */}
            <div className="cm-builder-left">
              <div className="cm-preview-header">
                ดูตัวอย่าง
              </div>
              <div className="cm-preview-wrapper position-relative">
                
                {/* Arrow Left */}
                {activeCardIndex > 0 && (
                  <button className="cm-nav-arrow left" onClick={(e) => { e.preventDefault(); setActiveCardIndex(activeCardIndex - 1); }}>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                )}

                {newItem.type === "รูปภาพ" ? (
                  <div className="cm-preview-card">
                    {cards[activeCardIndex]?.isEndCard ? (
                      <div className="cm-preview-end-card">
                         <div className="cm-preview-end-card-text">
                            {cards[activeCardIndex].message || "ดูเพิ่มเติม"}
                         </div>
                      </div>
                    ) : cards[activeCardIndex]?.image ? (
                      <>
                        <img src={cards[activeCardIndex].image} alt="preview" className="cm-preview-img" />
                        {cards[activeCardIndex].tag && (
                           <div className="cm-tag-top-left">{cards[activeCardIndex].tag}</div>
                        )}
                        {cards[activeCardIndex].message && (
                           <div className="cm-tag-bottom-center">{cards[activeCardIndex].message}</div>
                        )}
                      </>
                    ) : (
                      <div className="cm-preview-placeholder">
                        <div className="cm-placeholder-content">
                          <i className="bi bi-image" style={{ fontSize: "2rem", color: "var(--text-muted, #9ca3af)", marginBottom: "8px" }}></i>
                          <span style={{ color: "var(--text-muted, #9ca3af)", fontSize: "0.9rem", fontWeight: "500" }}>ยังไม่มีรูปภาพ</span>
                          <span style={{ color: "var(--text-muted, #9ca3af)", fontSize: "0.75rem", opacity: "0.8" }}>อัปโหลดทางด้านขวาเพื่อดูตัวอย่าง</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="cm-preview-chat-bubble">
                    <div className="cm-bubble-text">
                        {cards[activeCardIndex]?.message || "ตัวอย่างข้อความแชท..."}
                    </div>
                  </div>
                )}

                {/* Arrow Right */}
                {activeCardIndex < cards.length - 1 && (
                  <button className="cm-nav-arrow right" onClick={(e) => { e.preventDefault(); setActiveCardIndex(activeCardIndex + 1); }}>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Form Inputs */}
            <div className="cm-builder-right">
              <Form className="cm-builder-form">
                {/* ชื่อไอเทม */}
                <Form.Group className="mb-4">
                  <Form.Label className="cm-form-label">ชื่อไอเทม <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="ตั้งชื่อ เทมเพลต/การ์ด ของคุณ"
                    className="cm-custom-input"
                    value={newItem.title}
                    onChange={(e) =>
                      setNewItem({ ...newItem, title: e.target.value })
                    }
                  />
                  <Form.Text className="text-muted" style={{ fontSize: "0.8rem" }}>
                    ชื่อนี้จะแสดงเฉพาะผู้ดูแลระบบ เพื่อค้นหาได้ง่าย
                  </Form.Text>
                </Form.Group>

                {/* ประเภทการ์ด */}
                <div style={{ backgroundColor: "var(--bg-hover, #f9fafb)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-light, #e5e7eb)" }}>
                    <Form.Group className="mb-0">
                    <Form.Label className="cm-form-label mb-2">ตั้งค่าการ์ดเมสเสจ</Form.Label>
                    <div className="d-flex align-items-center mb-3">
                        <span className="me-3" style={{ fontSize: "0.9rem", color: "var(--text-secondary, #4b5563)" }}>ประเภทการ์ด</span>
                        <Form.Select
                            className="cm-custom-select w-auto"
                            value={newItem.type}
                            onChange={(e) =>
                                setNewItem({ ...newItem, type: e.target.value })
                            }
                        >
                            <option value="รูปภาพ">รูปภาพ</option>
                            <option value="ข้อความ">ข้อความ</option>
                        </Form.Select>
                    </div>
                    </Form.Group>

                    {/* ถ้าเป็นรูปภาพปกติ → อัพโหลดรูป + tag overlay */}
                    {newItem.type === "รูปภาพ" && !cards[activeCardIndex]?.isEndCard && (
                    <>
                    <Form.Group className="mb-0 mt-4 p-3 bg-white" style={{ borderRadius: "8px", border: "1px dashed var(--border-medium, #cbd5e1)" }}>
                        <Form.Label className="cm-form-label">อัปโหลดรูปภาพ (ขนาดที่แนะนำ 1:1)</Form.Label>
                        <Form.Control
                        type="file"
                        accept="image/*"
                        className="cm-custom-file mb-3"
                        onChange={(e) => {
                            const file = e.target.files[0];
                            if (!file) return;

                            const reader = new FileReader();
                            reader.addEventListener('load', () => {
                                setImgSrc(reader.result?.toString() || '');
                                setShowCropModal(true);
                            });
                            reader.readAsDataURL(file);
                            e.target.value = ''; // Reset input so user can re-select the same file
                        }}
                        />
                        <Form.Label className="cm-form-label">ป้ายทับรูปล่างกลาง (Label)</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="เช่น 1,790"
                            className="cm-custom-input mb-3"
                            value={cards[activeCardIndex]?.message || ""}
                            onChange={(e) => handleUpdateCard('message', e.target.value)}
                        />
                        
                        <Form.Label className="cm-form-label">ป้ายทับรูปมุมซ้ายบน (Tag)</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="เช่น ดอกไม้สด"
                            className="cm-custom-input"
                            value={cards[activeCardIndex]?.tag || ""}
                            onChange={(e) => handleUpdateCard('tag', e.target.value)}
                        />
                    </Form.Group>
                    </>
                    )}

                    {/* ถ้าเป็นข้อความ → พิมพ์ข้อความ */}
                    {newItem.type === "ข้อความ" && (
                    <Form.Group className="mb-0 mt-4">
                        <Form.Label className="cm-form-label">ใส่ข้อความ</Form.Label>
                        <Form.Control
                        as="textarea"
                        rows={4}
                        placeholder="พิมพ์ใจความสำคัญ..."
                        className="cm-custom-input"
                        value={cards[activeCardIndex]?.message || ""}
                        onChange={(e) => handleUpdateCard('message', e.target.value)}
                        />
                    </Form.Group>
                    )}
                </div>
              </Form>
            </div>
            
          </div>
        </Modal.Body>

        <Modal.Footer className="border-top-0 pt-0 pb-4 pe-4">
          <Button variant="light" className="px-4 py-2 me-2" onClick={handleClose} style={{ fontWeight: 600, color: "var(--text-secondary, #6b7280)" }}>
            ยกเลิก
          </Button>
          <Button
            className="px-5 py-2 btn-brand"
            onClick={handleCreateItem}
          >
            {editingItem ? "บันทึก" : "เพิ่มการ์ดใหม่"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Crop Modal */}
      <Modal show={showCropModal} onHide={() => setShowCropModal(false)} centered size="lg" backdrop="static">
        <Modal.Header closeButton className="border-bottom-0 pb-0 pt-3 pe-4">
          <Modal.Title className="fs-5 fw-bold ms-3" style={{ color: "var(--text-heading, #111827)" }}>
            ครอบตัดรูปภาพ
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 d-flex flex-column align-items-center">
          <div style={{ position: 'relative', width: '100%', height: '400px', backgroundColor: '#333' }}>
            <Cropper
              image={imgSrc}
              crop={crop}
              zoom={zoom}
              aspect={1} 
              onCropChange={setCrop}
              onCropComplete={(croppedArea, croppedAreaPixels) => {
                setCroppedAreaPixels(croppedAreaPixels);
              }}
              onZoomChange={setZoom}
            />
          </div>
          <div className="w-100 mt-4 d-flex align-items-center">
             <span className="me-3" style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>ซูม:</span>
             <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(e.target.value)}
                className="w-100"
             />
          </div>
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-0 pb-4 pe-4">
          <Button variant="light" className="px-4 py-2 me-2" onClick={() => setShowCropModal(false)} style={{ fontWeight: 600, color: "var(--text-secondary, #6b7280)" }}>
            ยกเลิก
          </Button>
          <Button
            className="px-5 py-2 btn-brand"
            onClick={async () => {
              try {
                const croppedImageBase64 = await getCroppedImg(imgSrc, croppedAreaPixels);
                handleUpdateCard('image', croppedImageBase64);
                setShowCropModal(false);
              } catch (e) {
                console.error("Cropping failed:", e);
                alert("เกิดข้อผิดพลาดในการตัดรูปภาพ");
              }
            }}
          >
            ใช้
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Cardmessage;
