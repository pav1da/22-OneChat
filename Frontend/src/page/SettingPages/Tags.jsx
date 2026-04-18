import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Table, Form, Modal, Spinner, Alert } from 'react-bootstrap';
import { Pencil, Trash, Plus } from 'react-bootstrap-icons';

const TAG_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16",
  "#22c55e", "#06b6d4", "#3b82f6", "#6366f1",
  "#a855f7", "#ec4899", "#64748b"
];

const getToken = () => sessionStorage.getItem('token');
const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

function Tags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editTag, setEditTag] = useState(null); // null = create, object = edit

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tagToDelete, setTagToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // ---------- Fetch all tags ----------
  const fetchTags = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/tags', { headers: getHeaders() });
      if (!res.ok) throw new Error('โหลดแท็กไม่สำเร็จ');
      const data = await res.json();
      setTags(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  // ---------- Open modal ----------
  const openCreate = () => {
    setEditTag(null);
    setShowModal(true);
  };

  const openEdit = (tag) => {
    setEditTag(tag);
    setShowModal(true);
  };

  // ---------- Delete ----------
  const confirmDelete = (tag) => {
    setTagToDelete(tag);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    if (!tagToDelete) return;
    setDeletingId(tagToDelete.id);
    try {
      const res = await fetch(`/api/tags/${tagToDelete.id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        setTags((prev) => prev.filter((t) => t.id !== tagToDelete.id));
      }
    } catch (err) {
      console.error('Delete tag error:', err);
    } finally {
      setDeletingId(null);
      setShowDeleteModal(false);
    }
  };

  // ----- ใช้ useMemo เพื่อป้องกันการ Re-render ของรายชื่อแท็กเวลาที่เราลากเลือกสีใน Modal -----
  const renderedTags = useMemo(() => {
    return (
      <div className="d-grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {tags.map((tag) => (
          <div 
            key={tag.id} 
            className="p-4 rounded-4 position-relative" 
            style={{ 
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-medium)",
              boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
              transition: "all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)";
              e.currentTarget.style.boxShadow = `0 15px 30px ${tag.color}15`;
              e.currentTarget.style.borderColor = `${tag.color}50`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.03)";
              e.currentTarget.style.borderColor = "var(--border-medium)";
            }}
          >
            {/* Glowing Top Line Border */}
            <div className="position-absolute top-0 start-0 w-100" style={{ height: "4px", backgroundColor: tag.color, borderTopLeftRadius: "1rem", borderTopRightRadius: "1rem" }}></div>
            
            {/* Card Content Layout */}
            <div className="d-flex justify-content-between align-items-start mb-4 mt-2">
              {/* Tag Itself */}
              <div>
                <span
                  className="d-inline-flex align-items-center px-3 py-1 rounded-pill shadow-sm"
                  style={{ 
                    backgroundColor: tag.color + '15', 
                    color: tag.color, 
                    fontSize: "0.95rem", 
                    fontWeight: 700, 
                    border: `1px solid ${tag.color}60`,
                    backdropFilter: "blur(4px)"
                  }}
                >
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: tag.color, marginRight: "8px" }}></span>
                  {tag.text}
                </span>
                <div className="mt-2 text-muted" style={{ fontSize: "0.75rem", fontFamily: "monospace", letterSpacing: "1px" }}>
                   // <strong style={{ color: tag.color }}>{tag.color.toUpperCase()}</strong>
                </div>
              </div>
              
              {/* Action Buttons (Floating style) */}
              <div className="d-flex gap-2">
                <button 
                  className="btn rounded-circle shadow-sm d-flex align-items-center justify-content-center border-0"
                  style={{ width: "36px", height: "36px", color: "var(--primary-color)", backgroundColor: "var(--bg-hover)", transition: "all 0.2s" }}
                  onClick={() => openEdit(tag)}
                  title="แก้ไข"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--primary-light)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                >
                  <Pencil size={15} />
                </button>
                <button 
                  className="btn rounded-circle shadow-sm d-flex align-items-center justify-content-center border-0"
                  style={{ width: "36px", height: "36px", color: "#f43f5e", backgroundColor: "var(--bg-hover)", transition: "all 0.2s" }}
                  onClick={() => confirmDelete(tag)}
                  disabled={deletingId === tag.id || deletingId !== null}
                  title="ลบ"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(244, 63, 94, 0.15)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                >
                  {deletingId === tag.id ? <Spinner size="sm" animation="border" style={{width: "14px", height: "14px"}}/> : <Trash size={15} />}
                </button>
              </div>
            </div>
            
            {/* Decorative faint background circle */}
            <div className="position-absolute end-0 bottom-0" style={{ width: "80px", height: "80px", borderRadius: "100% 0 0 0", background: `radial-gradient(circle at bottom right, ${tag.color}15 0%, transparent 70%)`, pointerEvents: "none" }}></div>

            {/* Summary Footer */}
            <div className="pt-3 d-flex align-items-center justify-content-between position-relative z-1" style={{ borderTop: "1px solid var(--border-light)" }}>
              <div className="d-flex align-items-center text-muted" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                <i className="bi bi-people d-inline-block me-2" style={{ fontSize: "1.1rem", color: "var(--text-muted)" }}></i>
                สมาชิกกลุ่ม
              </div>
              <div className="badge rounded-pill px-3 py-1" style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-main)", border: "1px solid var(--border-medium)", fontSize: "0.85rem", fontWeight: 700 }}>
                {tag.count ?? 0} คน
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }, [tags, deletingId]);

  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Header Premium Style */}
      <div className="d-flex justify-content-between align-items-end mb-4 pb-3" style={{ borderBottom: "1px dashed #e2e8f0" }}>
        <div>
          <h4 className="fw-bold mb-1" style={{ 
            background: "linear-gradient(45deg, var(--primary-color), #f59e0b)", 
            WebkitBackgroundClip: "text", 
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.5px"
          }}>
            ระบบจัดการแท็กอัจฉริยะ ✦
          </h4>
          <p className="text-muted mb-0" style={{ fontSize: "0.9rem", fontWeight: 500 }}>
            บริหารหมวดหมู่ จัดกลุ่มลูกค้าของคุณให้เป็นระเบียบอย่างเหนือระดับ
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn border-0 shadow-sm px-4 py-2 rounded-pill d-flex align-items-center fw-semibold text-white"
          style={{
            background: "linear-gradient(135deg, var(--primary-color) 0%, #f97316 100%)",
            fontSize: "0.95rem",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
          onMouseEnter={(e) => { 
            e.currentTarget.style.transform = "translateY(-3px)"; 
            e.currentTarget.style.boxShadow = "0 10px 20px rgba(249, 115, 22, 0.25)"; 
            e.currentTarget.style.filter = "brightness(1.1)";
          }}
          onMouseLeave={(e) => { 
            e.currentTarget.style.transform = "none"; 
            e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)"; 
            e.currentTarget.style.filter = "none";
          }}
        >
          <Plus size={20} className="me-2" style={{ marginTop: "-2px" }} /> สร้างแท็กใหม่
        </button>
      </div>

      {/* Error */}
      {error && <Alert variant="danger" className="py-2">{error}</Alert>}

      {/* Loading */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="grow" variant="primary" style={{ width: "3rem", height: "3rem", opacity: 0.8 }} />
          <div className="mt-3 text-muted fw-medium">กำลังเตรียมข้อมูล...</div>
        </div>
      ) : (
        <div className="mt-2">
          {tags.length === 0 ? (
            <div className="text-center py-5 rounded-4" style={{ backgroundColor: "#fafafb", border: "1px dashed #ced4da" }}>
              <div className="mb-3">
                <i className="bi bi-tag" style={{ fontSize: "3rem", color: "#cbd5e1" }}></i>
              </div>
              <h6 className="text-muted fw-semibold">ยังไม่มีแท็กในระบบ</h6>
              <p className="text-muted small mb-0">กดปุ่ม "สร้างแท็กใหม่" ที่มุมขวาบนเพื่อเริ่มต้นจัดการ</p>
            </div>
          ) : (
            renderedTags
          )}
        </div>
      )}

      {/* Modal สร้าง/แก้ไข */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="fs-5" style={{ color: "var(--text-main)" }}>
            {editTag ? 'แก้ไขแท็ก' : 'สร้างแท็กใหม่'}
          </Modal.Title>
        </Modal.Header>
        <TagEditForm 
          editTag={editTag} 
          onClose={() => setShowModal(false)} 
          onSaveSuccess={() => { setShowModal(false); fetchTags(); }} 
        />
      </Modal>

      {/* Modal ยืนยันการลบแท็ก (Cascade Delete Warning) */}
      <Modal show={showDeleteModal} onHide={() => !deletingId && setShowDeleteModal(false)} centered>
        <Modal.Header closeButton={!deletingId} className="border-bottom-0 pb-0">
          <Modal.Title className="fs-5 text-danger">ยืนยันการลบแท็ก</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          {tagToDelete && tagToDelete.count > 0 ? (
            <Alert variant="danger" className="mb-0 d-flex gap-3 align-items-start border-danger" style={{ backgroundColor: "#fef2f2" }}>
              <i className="bi bi-exclamation-diamond-fill text-danger mt-1 fs-5"></i>
              <div>
                <p className="mb-2 fw-medium text-danger" style={{ fontSize: "0.95rem" }}>
                  มีลูกค้าติดแท็กนี้อยู่ {tagToDelete.count} คน
                </p>
                <p className="mb-0 text-danger" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                  คุณยืนยันที่จะลบแท็ก <strong className="px-2 py-1 mx-1 rounded bg-white border border-danger">{tagToDelete.text}</strong> ออกจากลูกค้าทั้งหมดและลบทิ้งอย่างถาวรหรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
                </p>
              </div>
            </Alert>
          ) : (
            <p className="mb-0 text-muted">
              คุณต้องการลบแท็ก <strong className="text-dark">{tagToDelete?.text}</strong> ใช่หรือไม่?
            </p>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-3">
          <Button variant="light" onClick={() => setShowDeleteModal(false)} disabled={deletingId !== null} style={{ borderRadius: "8px", fontWeight: 500 }}>
            ยกเลิก
          </Button>
          <Button variant="danger" onClick={executeDelete} disabled={deletingId !== null} style={{ borderRadius: "8px", fontWeight: 500, padding: "6px 20px" }}>
            {deletingId !== null ? <><Spinner animation="border" size="sm" className="me-2" />กำลังลบ...</> : 'ยืนยันลบถาวร'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

// ------ แยก Component Form ออกมาเพื่อป้องกัน UI หลักกระตุกเวลาลากสี ------
function TagEditForm({ editTag, onClose, onSaveSuccess }) {
  const [modalText, setModalText] = useState('');
  const [modalColor, setModalColor] = useState(TAG_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  // Setup initial values
  useEffect(() => {
    if (editTag) {
      setModalText(editTag.text);
      setModalColor(editTag.color || TAG_COLORS[0]);
    } else {
      setModalText('');
      setModalColor(TAG_COLORS[0]);
    }
  }, [editTag]);

  const handleSave = async () => {
    if (!modalText.trim()) {
      setModalError('กรุณาระบุชื่อแท็ก');
      return;
    }
    setSaving(true);
    setModalError('');
    try {
      const url = editTag ? `/api/tags/${editTag.id}` : '/api/tags';
      const method = editTag ? 'PUT' : 'POST';
      const token = sessionStorage.getItem('token');
      const headers = {
         'Content-Type': 'application/json',
         ...(token && { Authorization: `Bearer ${token}` }),
      };
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({ text: modalText.trim(), color: modalColor }),
      });
      const data = await res.json();

      if (!res.ok) {
        setModalError(data.message || 'เกิดข้อผิดพลาด');
        return;
      }
      onSaveSuccess();
    } catch (err) {
      setModalError('ไม่สามารถบันทึกได้');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal.Body className="pt-3">
        {modalError && <Alert variant="danger" className="py-2 mb-3">{modalError}</Alert>}
        {editTag && editTag.count > 0 && (
          <Alert variant="warning" className="py-2 mb-3 d-flex gap-2 align-items-center" style={{ fontSize: "0.85rem" }}>
            <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: "1.2rem" }}></i>
            <div>
              <strong>ข้อควรระวัง:</strong> มีลูกค้าติดแท็กนี้อยู่ {editTag.count} คน การแก้ไขนี้จะเปลี่ยนข้อมูลของลูกค้าทั้งหมดโดยอัตโนมัติ
            </div>
          </Alert>
        )}
        <Form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <Form.Group className="mb-4">
            <Form.Label className="fw-medium text-muted" style={{ fontSize: "0.85rem" }}>
              ชื่อแท็ก <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="เช่น ลูกค้าใหม่, สำคัญมาก, VIP..."
              value={modalText}
              onChange={(e) => setModalText(e.target.value)}
              className="py-2"
              style={{ borderRadius: "8px", fontSize: "0.95rem" }}
              autoFocus
            />
          </Form.Group>

          {/* Preview */}
          {modalText.trim() && (
            <div className="mb-3 d-flex align-items-center gap-2">
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>ตัวอย่าง:</span>
              <span
                className="px-3 py-1 rounded-pill"
                style={{ backgroundColor: modalColor + '22', color: modalColor, fontSize: "0.82rem", fontWeight: 600, border: `1px solid ${modalColor}44` }}
              >
                {modalText.trim()}
              </span>
            </div>
          )}

          <Form.Group className="mb-3">
            <Form.Label className="fw-medium text-muted mb-2" style={{ fontSize: "0.85rem" }}>เลือกสีหรือกำหนดโค้ดสีเอง</Form.Label>
            <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded-3" style={{ backgroundColor: "#f8fafc", border: "1px dashed #e2e8f0" }}>
              {/* Custom Color Picker Badge */}
              <div 
                className="position-relative shadow-sm d-flex justify-content-center align-items-center" 
                style={{ 
                  width: '46px', height: '46px', borderRadius: '50%', backgroundColor: modalColor, 
                  border: '3px solid white', outline: `2px solid ${modalColor.length === 7 ? modalColor : '#ccc'}`,
                  transition: 'all 0.2s',
                }}
                title="คลิกเพื่อเลือกสี"
              >
                <i className="bi bi-palette text-white" style={{ fontSize: '1.2rem', mixBlendMode: 'difference', pointerEvents: "none" }}></i>
                <input 
                  type="color" 
                  value={modalColor.length === 7 ? modalColor : '#000000'} 
                  onChange={(e) => setModalColor(e.target.value)} 
                  className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                  style={{ cursor: 'pointer' }}
                />
              </div>
              
              {/* Hex Text Field */}
              <div style={{ flex: 1, maxWidth: "160px" }}>
                <div className="input-group shadow-sm" style={{ borderRadius: "8px", overflow: "hidden" }}>
                  <span className="input-group-text bg-white border-end-0 text-muted" style={{ fontSize: "0.85rem", fontWeight: 600 }}>HEX</span>
                  <Form.Control
                    type="text"
                    value={modalColor.toUpperCase()}
                    onChange={(e) => {
                       let val = e.target.value.trim();
                       if (!val.startsWith('#')) val = '#' + val;
                       if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                           setModalColor(val);
                       }
                    }}
                    className="border-start-0 ps-0 fw-bold"
                    style={{ boxShadow: "none", fontSize: "0.95rem", color: "#334155" }}
                    maxLength={7}
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>
            </div>

            <Form.Label className="fw-medium text-muted" style={{ fontSize: "0.85rem" }}>หรือเลือกจากสีที่มีให้รวดเร็ว</Form.Label>
            <div className="d-flex flex-wrap gap-2 mt-1">
              {TAG_COLORS.map((color) => (
                <div
                  key={color}
                  onClick={() => setModalColor(color)}
                  style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    backgroundColor: color, cursor: 'pointer',
                    border: modalColor === color ? `3px solid white` : '2px solid transparent',
                    outline: modalColor === color ? `2.5px solid ${color}` : 'none',
                    outlineOffset: '2px',
                    transition: 'transform 0.1s',
                    transform: modalColor === color ? 'scale(1.15)' : 'scale(1)',
                  }}
                  title={color}
                />
              ))}
            </div>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer className="border-top-0 pt-0">
        <Button variant="light" onClick={onClose} disabled={saving} style={{ borderRadius: "8px", fontWeight: 500 }}>
          ยกเลิก
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={saving} style={{ borderRadius: "8px", fontWeight: 500, padding: "6px 20px" }}>
          {saving ? <><Spinner animation="border" size="sm" className="me-1" />บันทึก...</> : 'บันทึก'}
        </Button>
      </Modal.Footer>
    </>
  );
}

export default Tags;
