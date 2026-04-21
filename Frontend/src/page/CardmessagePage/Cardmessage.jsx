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
  const [previewItem, setPreviewItem] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewCardIndex, setPreviewCardIndex] = useState(0);
  const [sortDesc, setSortDesc] = useState(true);

  // Delete Confirmation State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Crop State
  const [imgSrc, setImgSrc] = useState(""); // file for raw image string
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);

  const [items, setItems] = useState([]);

  const fetchItems = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch("/api/templates/picker", {
        headers: { Authorization: `Bearer ${token}` },
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
              ? typeof item.content === "string"
                ? JSON.parse(item.content)
                : item.content
              : null;
            textPreview = c?.message || c?.text || "";
          } catch (e) {
            textPreview = "";
          }

          return {
            id: item.id,
            type: item.type,
            title: item.name,
            textPreview,
            created: new Date(item.created_at).toLocaleString(),
            createdTimestamp: new Date(item.created_at).getTime(),
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
  const [cards, setCards] = useState([
    { id: 1, image: "", message: "", tag: "", isEndCard: false },
  ]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const handleShow = () => setShow(true);
  const handleClose = () => {
    setShow(false);
    setEditingItem(null);
    setNewItem({ type: "รูปภาพ", title: "", image: "", message: "" });
    setCards([{ id: 1, image: "", message: "", tag: "", isEndCard: false }]);
    setActiveCardIndex(0);
  };

  const handleAddCard = () => {
    if (cards.length >= 10) return;
    const newCards = [
      ...cards,
      { id: Date.now(), image: "", message: "", tag: "", isEndCard: false },
    ];
    setCards(newCards);
    setActiveCardIndex(newCards.length - 1);
  };

  const handleAddEndCard = () => {
    if (cards.length >= 10) return;
    const newCards = [
      ...cards,
      {
        id: Date.now(),
        image: "",
        message: "ดูเพิ่มเติม",
        tag: "",
        isEndCard: true,
      },
    ];
    setCards(newCards);
    setActiveCardIndex(newCards.length - 1);
  };

  const handleDeleteCard = (indexToDelete) => {
    if (cards.length <= 1) return; // ต้องมีอย่างน้อย  1 การ์ด
    const newCards = cards.filter((_, i) => i !== indexToDelete);
    setCards(newCards);
    // ปรับ index หลังลบไม่ให้เกินขอบเขต
    setActiveCardIndex((prev) => Math.min(prev, newCards.length - 1));
  };

  const handleUpdateCard = (field, value) => {
    const updated = [...cards];
    updated[activeCardIndex][field] = value;
    setCards(updated);

    // Sync to newItem so the original logic handles saving Card 1 perfectly without restructuring the DB
    if (activeCardIndex === 0) {
      setNewItem((prev) => ({ ...prev, [field]: value }));
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const token = sessionStorage.getItem("token");
      await fetch(`/api/templates/${itemToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchItems();
    } catch (error) {
      console.error("Error deleting template:", error);
    } finally {
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.type.toLowerCase().includes(search.toLowerCase()),
  );

  const sortedItems = [...filteredItems].sort((a, b) => {
    return sortDesc ? b.createdTimestamp - a.createdTimestamp : a.createdTimestamp - b.createdTimestamp;
  });

  const textItems = sortedItems.filter(item => item.type === "ข้อความ");
  const imageItems = sortedItems.filter(item => item.type === "รูปภาพ");

  const renderCard = (item) => (
    <Col xs={12} sm={6} xl={6} key={item.id} className="d-flex">
      <div className="cm-template-card w-100" onClick={() => handlePreview(item.id)} style={{ cursor: "pointer", display: "flex", flexDirection: "column" }}>
        {/* Image/Preview Header */}
        <div className="cm-card-preview" style={{ flexShrink: 0 }}>
          {item.type === "รูปภาพ" ? (
            <img
              src={`/api/templates/${item.id}/image`}
              alt={item.title}
              loading="lazy"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div className="cm-text-preview-container flex-grow-1">
              <div
                className="cm-text-preview-content"
                title={item.textPreview}
              >
                {item.textPreview || "ไม่มีข้อความตัวอย่าง"}
              </div>
            </div>
          )}

          {/* Dropdown Action Menu */}
          <div className="cm-card-actions" onClick={(e) => e.stopPropagation()}>
            <Dropdown>
              <Dropdown.Toggle as="div" className="cm-card-action-btn">
                <i className="bi bi-three-dots-vertical"></i>
              </Dropdown.Toggle>

              <Dropdown.Menu
                align="end"
                className="shadow-sm border-0"
                style={{ borderRadius: "12px" }}
              >
                <Dropdown.Item
                  onClick={async () => {
                    try {
                      const token = sessionStorage.getItem("token");
                      const res = await fetch(
                        `/api/templates/${item.id}`,
                        {
                          headers: { Authorization: `Bearer ${token}` },
                        },
                      );
                      const data = await res.json();
                      if (data.status === "success") {
                        let content = {};
                        try {
                          content =
                            typeof data.data.content === "string"
                              ? JSON.parse(data.data.content)
                              : data.data.content;
                        } catch (e) { }
                        const imageValue =
                          content?.image ||
                          (Array.isArray(content?.images) &&
                            content.images.length > 0
                            ? content.images[0]
                            : "");
                        let restoredCards;
                        if (
                          Array.isArray(content?.cards) &&
                          content.cards.length > 0
                        ) {
                          restoredCards = content.cards.map((c, i) => ({
                            id: i + 1,
                            image: c.image || "",
                            message: c.message || "",
                            tag: c.tag || "",
                            isEndCard: c.isEndCard || false,
                          }));
                        } else {
                          restoredCards = [
                            {
                              id: 1,
                              image: imageValue,
                              message: content?.message || "",
                              tag: "",
                              isEndCard: false,
                            },
                          ];
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
                      console.error(
                        "Error fetching template for edit:",
                        error,
                      );
                    }
                  }}
                  className="py-2 px-3"
                >
                  <i className="bi bi-pencil-square me-2 text-primary"></i>
                  แก้ไข
                </Dropdown.Item>

                <Dropdown.Divider />

                <Dropdown.Item
                  onClick={() => {
                    setItemToDelete(item);
                    setShowDeleteModal(true);
                  }}
                  className="py-2 px-3 text-danger"
                >
                  <i className="bi bi-trash me-2"></i>ลบเทมเพลต
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        {/* Card Body Information */}
        <div className="cm-card-body d-flex flex-column" style={{ flexGrow: 1 }}>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <h6
              className="cm-card-title text-truncate me-2 mb-0"
              title={item.title}
            >
              {item.title}
            </h6>
            <span
              className={`cm-type-badge shrink-0 ${item.type === "ข้อความ" ? "text" : ""}`}
            >
              {item.type === "รูปภาพ" ? "การ์ดเมสเสจ" : item.type}
            </span>
          </div>
          <div className="cm-card-meta mt-auto">
            {item.created.split(",")[0]}
          </div>
        </div>
      </div>
    </Col>
  );

  // Preview: fetch full template data and open preview modal
  const handlePreview = async (itemId) => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`/api/templates/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "success") {
        let content = {};
        try {
          content =
            typeof data.data.content === "string"
              ? JSON.parse(data.data.content)
              : data.data.content;
        } catch (e) { }
        const imageValue =
          content?.image ||
          (Array.isArray(content?.images) && content.images.length > 0
            ? content.images[0]
            : "");
        let previewCards;
        if (Array.isArray(content?.cards) && content.cards.length > 0) {
          previewCards = content.cards.map((c, i) => ({
            id: i + 1,
            image: c.image || "",
            message: c.message || "",
            tag: c.tag || "",
            isEndCard: c.isEndCard || false,
          }));
        } else {
          previewCards = [
            {
              id: 1,
              image: imageValue,
              message: content?.message || "",
              tag: "",
              isEndCard: false,
            },
          ];
        }
        setPreviewItem({
          id: data.data.id,
          type: data.data.type,
          title: data.data.name,
          cards: previewCards,
          created: new Date(data.data.created_at).toLocaleString(),
        });
        setPreviewCardIndex(0);
        setShowPreview(true);
      }
    } catch (error) {
      console.error("Error fetching template for preview:", error);
    }
  };

  const handleCreateItem = async () => {
    if (!newItem.title) {
      alert("กรุณากรอกชื่อไอเทม");
      return;
    }

    const currentUser = JSON.parse(sessionStorage.getItem("myAppUser") || "{}");

    // Single cards are now wrapped in carousel payload for LINE Flex compatibility
    let contentPayload;
    if (newItem.type === "รูปภาพ") {
      contentPayload = {
        type: "carousel",
        cards: cards.map((c) => ({
          image: c.image,
          message: c.message,
          tag: c.tag || "",
          isEndCard: c.isEndCard || false,
        })),
      };
    } else {
      // ข้อความ — always single card, use cards[0].message
      contentPayload = { message: cards[0].message };
    }

    const payload = {
      name: newItem.title,
      type: newItem.type,
      content: contentPayload,
      created_by: currentUser?.emp_id || null,
    };

    try {
      const token = sessionStorage.getItem("token");
      if (editingItem) {
        await fetch(`/api/templates/${editingItem.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/templates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
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
    <div className="main-content kanit-regular">
      {/* Top Header Bar */}
      <div className="cm-page-header d-flex justify-content-between align-items-center">
        <div
          className="fw-bold"
          style={{ fontSize: "1.05rem", color: "var(--text-heading, #1e293b)" }}
        >
          เทมเพลตทั้งหมด
        </div>

        <div className="d-flex gap-3 align-items-center">
          {/* Search */}
          <div className="cm-search-wrap">
            <i className="bi bi-search cm-search-icon"></i>
            <input
              type="search"
              className="cm-search-input"
              placeholder="ค้นหาเทมเพลต..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Sort */}
          <button className="cm-sort-btn" onClick={() => setSortDesc(!sortDesc)}>
            <i className="bi bi-arrow-down-up"></i>
            เรียงลำดับ {sortDesc ? "(ใหม่สุด)" : "(เก่าสุด)"}
          </button>

          {/* Create */}
          <button className="cm-create-btn" onClick={() => handleShow()}>
            <i className="bi bi-plus-lg me-1"></i>
            สร้าง
          </button>
        </div>
      </div>

      <Container fluid className="cm-card-grid pb-5">
        <Row className="g-4">
          {/* ฝั่งข้อความ */}
          <Col xs={12} lg={6} className="cm-column-section">
            <div className="d-flex align-items-center mb-3">
              <h5 className="mb-0 fw-bold kanit-semibold" style={{ color: "var(--text-heading, #1e293b)" }}>
                ข้อความ
              </h5>
            </div>
            <Row className="g-3 align-items-stretch">
              {textItems.length > 0 ? textItems.map(renderCard) : (
                <Col xs={12}>
                  <div className="text-muted small border rounded p-4 text-center bg-light w-100">ไม่มีเทมเพลตข้อความ</div>
                </Col>
              )}
            </Row>
          </Col>

          {/* ฝั่งรูปภาพ (การ์ดเมสเสจ) */}
          <Col xs={12} lg={6} className="cm-column-section">
            <div className="d-flex align-items-center mb-3">
              <h5 className="mb-0 fw-bold kanit-semibold" style={{ color: "var(--text-heading, #1e293b)" }}>
                รูปภาพ
              </h5>
            </div>
            <Row className="g-3 align-items-stretch">
              {imageItems.length > 0 ? imageItems.map(renderCard) : (
                <Col xs={12}>
                  <div className="text-muted small border rounded p-4 text-center bg-light w-100">ไม่มีเทมเพลตการ์ดเมสเสจ</div>
                </Col>
              )}
            </Row>
          </Col>
        </Row>
      </Container>

      {/* Modal UI สำหรับสร้างเทมเพลตใหม่ (LINE OA Inspired Split-Pane) */}
      <Modal
        show={show}
        onHide={handleClose}
        size="xl"
        dialogClassName="cm-builder-modal"
        centered
      >
        <Modal.Header closeButton className="border-bottom-0 pb-0 pt-3 pe-4">
          <Modal.Title
            className="fs-5 fw-bold ms-3"
            style={{ color: "var(--text-heading, #111827)" }}
          >
            {editingItem ? "แก้ไข การ์ดเมสเสจ" : "สร้าง การ์ดเมสเสจ"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-0 position-relative">
          <div className="cm-builder-container">
            {/* Left Column: Mobile Preview Pane */}
            <div className="cm-builder-left">
              <div className="cm-preview-header">ดูตัวอย่าง</div>
              <div className="cm-preview-wrapper position-relative">
                {/* Arrow Left */}
                {activeCardIndex > 0 && (
                  <button
                    className="cm-nav-arrow left"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveCardIndex(activeCardIndex - 1);
                    }}
                  >
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
                        <img
                          src={cards[activeCardIndex].image}
                          alt="preview"
                          className="cm-preview-img"
                        />
                        {cards[activeCardIndex].tag && (
                          <div className="cm-tag-top-left">
                            {cards[activeCardIndex].tag}
                          </div>
                        )}
                        {cards[activeCardIndex].message && (
                          <div className="cm-tag-bottom-center">
                            {cards[activeCardIndex].message}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="cm-preview-placeholder">
                        <div className="cm-placeholder-content">
                          <i
                            className="bi bi-image"
                            style={{
                              fontSize: "2rem",
                              color: "var(--text-muted, #9ca3af)",
                              marginBottom: "8px",
                            }}
                          ></i>
                          <span
                            style={{
                              color: "var(--text-muted, #9ca3af)",
                              fontSize: "0.9rem",
                              fontWeight: "500",
                            }}
                          >
                            ยังไม่มีรูปภาพ
                          </span>
                          <span
                            style={{
                              color: "var(--text-muted, #9ca3af)",
                              fontSize: "0.75rem",
                              opacity: "0.8",
                            }}
                          >
                            อัปโหลดทางด้านขวาเพื่อดูตัวอย่าง
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="cm-preview-chat-bubble">
                    <div className="cm-bubble-text">
                      {cards[activeCardIndex]?.message ||
                        "ตัวอย่างข้อความแชท..."}
                    </div>
                  </div>
                )}

                {/* Arrow Right */}
                {activeCardIndex < cards.length - 1 && (
                  <button
                    className="cm-nav-arrow right"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveCardIndex(activeCardIndex + 1);
                    }}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                )}
              </div>

              <div className="cm-pagination-dots pb-3 d-flex justify-content-center">
                {cards.map((c, i) => (
                  <div
                    key={c.id}
                    className={`cm-dot ${activeCardIndex === i ? "active" : ""}`}
                  />
                ))}
              </div>
            </div>

            {/* Right Column: Form Inputs */}
            <div className="cm-builder-right">
              <Form className="cm-builder-form">
                {/* ชื่อไอเทม */}
                <Form.Group className="mb-4">
                  <Form.Label className="cm-form-label">
                    ชื่อไอเทม <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="ตั้งชื่อ เทมเพลต/การ์ด ของคุณ"
                    className="cm-custom-input"
                    value={newItem.title}
                    onChange={(e) =>
                      setNewItem({ ...newItem, title: e.target.value })
                    }
                  />
                  <Form.Text
                    className="text-muted"
                    style={{ fontSize: "0.8rem" }}
                  >
                    ชื่อนี้จะแสดงเฉพาะผู้ดูแลระบบ เพื่อค้นหาได้ง่าย
                  </Form.Text>
                </Form.Group>

                {/* Tabs UI */}
                {newItem.type === "รูปภาพ" && (
                  <div className="cm-tabs-row d-flex align-items-center mb-4">
                    {cards.map((c, i) => (
                      <div
                        key={c.id}
                        className="cm-tab-item d-flex align-items-center"
                      >
                        <button
                          className={`cm-tab-btn ${activeCardIndex === i ? "active" : ""}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveCardIndex(i);
                          }}
                        >
                          {c.isEndCard ? (
                            <i
                              className="bi bi-flag-fill"
                              style={{ fontSize: "0.7rem" }}
                            />
                          ) : (
                            i + 1
                          )}
                        </button>
                        {cards.length > 1 && (
                          <button
                            className="cm-tab-delete-btn"
                            title="ลบการ์ดนี้"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteCard(i);
                            }}
                          >
                            <i className="bi bi-x" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      className="cm-tab-btn-add ms-2"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddCard();
                      }}
                    >
                      เพิ่มการ์ด
                    </button>
                    {/* <button
                      className="cm-tab-btn-add-end ms-2"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddEndCard();
                      }}
                    >
                      เพิ่มการ์ดปิดท้าย
                    </button> */}
                  </div>
                )}

                {/* ประเภทการ์ด */}
                <div
                  style={{
                    backgroundColor: "var(--bg-hover, #f9fafb)",
                    padding: "16px",
                    borderRadius: "12px",
                    border: "1px solid var(--border-light, #e5e7eb)",
                  }}
                >
                  <Form.Group className="mb-0">
                    <Form.Label className="cm-form-label mb-2">
                      ตั้งค่าการ์ดเมสเสจ
                    </Form.Label>
                    <div className="d-flex align-items-center mb-3">
                      <span
                        className="me-3"
                        style={{
                          fontSize: "0.9rem",
                          color: "var(--text-secondary, #4b5563)",
                        }}
                      >
                        ประเภทการ์ด
                      </span>
                      <Form.Select
                        className="cm-custom-select"
                        style={{width: "125px"}}
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

                  {/* ถ้าเป็นการ์ดปิดท้าย ไม่ต้องอัพรูปลง Flex แต่ให้ใส่ Action เเทนได้ */}
                  {/* {newItem.type === "รูปภาพ" &&
                    cards[activeCardIndex]?.isEndCard && (
                      <div
                        className="mt-4 p-3 bg-white"
                        style={{
                          borderRadius: "8px",
                          border: "1px dashed #cbd5e1",
                        }}
                      >
                        <Form.Group className="mb-0">
                          <Form.Label className="cm-form-label">
                            ป้ายปิดท้าย (Action Label)
                          </Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="เช่น ดูเพิ่มเติม"
                            className="cm-custom-input"
                            value={cards[activeCardIndex]?.message || ""}
                            onChange={(e) =>
                              handleUpdateCard("message", e.target.value)
                            }
                          />
                        </Form.Group>
                      </div>
                    )
                  } */}

                  {/* ถ้าเป็นรูปภาพปกติ → อัพโหลดรูป + tag overlay */}
                  {newItem.type === "รูปภาพ" &&
                    !cards[activeCardIndex]?.isEndCard && (
                      <>
                        <Form.Group
                          className="mb-0 mt-4 p-3 bg-white"
                          style={{
                            borderRadius: "8px",
                            border: "1px dashed var(--border-medium, #cbd5e1)",
                          }}
                        >
                          <Form.Label className="cm-form-label">
                            อัปโหลดรูปภาพ
                            (ขนาดที่แนะนำ 1:1)</Form.Label>
                          <Form.Control
                            type="file"
                            accept="image/*"
                            className="cm-custom-file mb-3"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (!file) return;

                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setImgSrc(reader.result);
                                setShowCropModal(true);
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                          <Form.Label className="cm-form-label">
                            ป้ายทับรูปล่างกลาง (Label)
                          </Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="เช่น 1,790"
                            className="cm-custom-input mb-3"
                            value={cards[activeCardIndex]?.message || ""}
                            onChange={(e) =>
                              handleUpdateCard("message", e.target.value)
                            }
                          />

                          <Form.Label className="cm-form-label">
                            ป้ายทับรูปมุมซ้ายบน (Tag)
                          </Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="เช่น ดอกไม้สด"
                            className="cm-custom-input"
                            value={cards[activeCardIndex]?.tag || ""}
                            onChange={(e) =>
                              handleUpdateCard("tag", e.target.value)
                            }
                          />
                        </Form.Group>
                      </>
                    )}

                  {/* ถ้าเป็นข้อความ → พิมพ์ข้อความ */}
                  {newItem.type === "ข้อความ" && (
                    <Form.Group className="mb-0 mt-4">
                      <Form.Label className="cm-form-label">
                        ใส่ข้อความ
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        placeholder="พิมพ์ใจความสำคัญ..."
                        className="cm-custom-input"
                        value={cards[activeCardIndex]?.message || ""}
                        onChange={(e) =>
                          handleUpdateCard("message", e.target.value)
                        }
                      />
                    </Form.Group>
                  )}
                </div>
              </Form>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer className="border-top-0 pt-0 pb-4 pe-4">
          <Button
            variant="light"
            className="px-4 py-2 me-2"
            onClick={handleClose}
            style={{ fontWeight: 600, color: "var(--text-secondary, #6b7280)" }}
          >
            ยกเลิก
          </Button>
          <Button className="px-5 py-2 btn-brand" onClick={handleCreateItem}>
            {editingItem ? "บันทึก" : "เพิ่มการ์ดใหม่"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== Preview Modal (Phone-like) ===== */}
      <Modal
        show={showPreview}
        onHide={() => setShowPreview(false)}
        centered
        dialogClassName="cm-preview-modal"
      >
        <Modal.Body className="p-0">
          {previewItem && (
            <div className="cm-pv-phone">
              {/* Header */}
              <div className="cm-pv-header">ดูตัวอย่าง</div>
              <button className="cm-pv-close" onClick={() => setShowPreview(false)}>
                <i className="bi bi-x-lg"></i>
              </button>

              {/* Preview Area */}
              <div className="cm-pv-body">
                <div className="cm-pv-card-area position-relative">
                  {/* Arrow Left */}
                  {previewCardIndex > 0 && (
                    <button className="cm-nav-arrow left" onClick={() => setPreviewCardIndex(previewCardIndex - 1)}>
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  )}

                  {previewItem.type === "รูปภาพ" ? (
                    <div className="cm-preview-card">
                      {previewItem.cards[previewCardIndex]?.isEndCard ? (
                        <div className="cm-preview-end-card">
                          <div className="cm-preview-end-card-text">
                            {previewItem.cards[previewCardIndex].message || "ดูเพิ่มเติม"}
                          </div>
                        </div>
                      ) : previewItem.cards[previewCardIndex]?.image ? (
                        <>
                          <img
                            src={previewItem.cards[previewCardIndex].image}
                            alt="preview"
                            className="cm-preview-img"
                          />
                          {previewItem.cards[previewCardIndex].tag && (
                            <div className="cm-tag-top-left">
                              {previewItem.cards[previewCardIndex].tag}
                            </div>
                          )}
                          {previewItem.cards[previewCardIndex].message && (
                            <div className="cm-tag-bottom-center">
                              {previewItem.cards[previewCardIndex].message}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="cm-preview-placeholder">
                          <div className="cm-placeholder-content">
                            <i className="bi bi-image" style={{ fontSize: "2rem", color: "#9ca3af", marginBottom: "8px" }}></i>
                            <span style={{ color: "#9ca3af", fontSize: "0.9rem" }}>ไม่มีรูปภาพ</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="cm-preview-chat-bubble">
                      <div className="cm-bubble-text">
                        {previewItem.cards[previewCardIndex]?.message || "ไม่มีข้อความ"}
                      </div>
                    </div>
                  )}

                  {/* Arrow Right */}
                  {previewCardIndex < previewItem.cards.length - 1 && (
                    <button className="cm-nav-arrow right" onClick={() => setPreviewCardIndex(previewCardIndex + 1)}>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Pagination Dots */}
              <div className="cm-pagination-dots pb-3 d-flex justify-content-center">
                {previewItem.cards.map((c, i) => (
                  <div
                    key={c.id}
                    className={`cm-dot ${previewCardIndex === i ? "active" : ""}`}
                    onClick={() => setPreviewCardIndex(i)}
                    style={{ cursor: "pointer" }}
                  />
                ))}
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => { setShowDeleteModal(false); setItemToDelete(null); }} centered>
        <Modal.Body className="text-center p-5">
          <div className="mb-4">
            <div className="mx-auto bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: "80px", height: "80px" }}>
              <i className="bi bi-trash text-danger" style={{ fontSize: "2.5rem" }}></i>
            </div>
          </div>
          <h5 className="fw-bold mb-3" style={{ color: "var(--text-heading, #1e293b)" }}>ยืนยันการลบเทมเพลต</h5>
          <p className="mb-4" style={{ color: "var(--text-secondary, #4b5563)", fontSize: "1rem" }}>
            คุณต้องการลบเทมเพลต <strong>{itemToDelete?.title}</strong> ใช่หรือไม่?<br />
            การกระทำนี้จะไม่สามารถเรียกคืนได้
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Button
              variant="light"
              onClick={() => { setShowDeleteModal(false); setItemToDelete(null); }}
              className="px-4 py-2"
              style={{ fontWeight: 600, color: "var(--text-secondary, #4b5563)", border: "1px solid var(--border-medium, #cbd5e1)" }}
            >
              ยกเลิก
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              className="px-4 py-2"
              style={{ fontWeight: 600 }}
            >
              ลบเทมเพลต
            </Button>
          </div>
        </Modal.Body>
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
                setCrop({ x: 0, y: 0 });
                setZoom(1);
                setImgSrc("");
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
