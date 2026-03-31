import { useRef, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useChat } from "../../context/ChatContext";
import ChatList from "./chatList/ChatList";
import "./inbox.css";

const Inbox = ({ currentUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const msgRef = useRef(null);
  const endRef = useRef(null);
  const fileInputRef = useRef(null);

  // Shared context
  const {
    messages,
    customers: customer,
    sendMessage,
    sendImageMessage,
    updateCustomerStatus,
    updateCustomerName,
    STATUS,
  } = useChat();

  const [selectedChatId, setSelectedChatId] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [sortBy, setSortBy] = useState("latest");
  const [newMessage, setNewMessage] = useState("");

  // Image picker panel state
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [panelFiles, setPanelFiles] = useState([]); // [{ file, url, selected }]

  // Notes state
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingText, setEditingText] = useState("");

  // Members list for "ผู้รับผิดชอบ" dropdown
  const [members, setMembers] = useState([]);
  const [assignedMap, setAssignedMap] = useState({}); // { customerId: { emp_id, username } }

  // ---------- Derived state ----------
  const selectedCustomer = customer.find((c) => c.id === selectedChatId);
  const chatMessages = messages[selectedChatId] || [];

  // ---------- Sort logic ----------
  const sortedCustomers = [...customer].sort((a, b) => {
    if (sortBy === "latest") return a.id - b.id;
    if (sortBy === "name_asc") return a.name.localeCompare(b.name);
    if (sortBy === "name_desc") return b.name.localeCompare(a.name);
    return 0;
  });

  const handleSortToggle = () => {
    setSortBy((prev) => {
      if (prev === "latest") return "name_asc";
      if (prev === "name_asc") return "name_desc";
      return "latest";
    });
  };

  // ---------- Status helpers ----------
  const getStatusVariant = (status) => {
    switch (status) {
      case STATUS.NOT_STARTED: return "secondary";
      case STATUS.IN_PROGRESS: return "warning";
      case STATUS.DONE: return "success";
      default: return "secondary";
    }
  };

  // ---------- Message handlers ----------
  const handleSendMessage = (e) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed || !selectedCustomer) return;

    sendMessage(selectedChatId, trimmed);
    setNewMessage("");
    if (msgRef.current) msgRef.current.style.height = "40px";
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const autoResize = (e) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  const handleUploadImage = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !selectedCustomer) return;
    const newEntries = files.map((file) => ({ file, url: URL.createObjectURL(file), selected: true }));
    setPanelFiles((prev) => [...prev, ...newEntries]);
    setShowImagePanel(true);
    e.target.value = "";
  };

  const handleTogglePanelFile = (idx) => {
    setPanelFiles((prev) => prev.map((f, i) => i === idx ? { ...f, selected: !f.selected } : f));
  };

  const handleRemovePanelFile = (idx) => {
    setPanelFiles((prev) => {
      URL.revokeObjectURL(prev[idx].url);
      const next = prev.filter((_, i) => i !== idx);
      if (!next.length) setShowImagePanel(false);
      return next;
    });
  };

  const handleSendPanelImages = () => {
    const toSend = panelFiles.filter((f) => f.selected);
    toSend.forEach((f) => sendImageMessage(selectedChatId, f.file));
    panelFiles.filter((f) => !f.selected).forEach((f) => URL.revokeObjectURL(f.url));
    setPanelFiles([]);
    setShowImagePanel(false);
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCloseImagePanel = () => {
    panelFiles.forEach((f) => URL.revokeObjectURL(f.url));
    setPanelFiles([]);
    setShowImagePanel(false);
  };

  // ---------- Chat select ----------
  const handleChatSelect = (id) => {
    setSelectedChatId(id);
    setIsEditingName(false);
  };

  // ---------- Name editing ----------
  const handleNameChange = (e) => {
    if (!selectedCustomer) return;
    updateCustomerName(selectedCustomer.id, e.target.value);
  };

  const handleNameSave = () => setIsEditingName(false);

  // ---------- Fetch members for assignment dropdown ----------
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const res = await fetch("/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setMembers(data);
        }
      } catch (err) {
        console.error("Error fetching members:", err);
      }
    };
    fetchMembers();
  }, []);

  // ---------- Assignment handler ----------
  const handleAssignChange = (customerId, empId) => {
    const member = members.find((m) => m.emp_id === Number(empId));
    if (member) {
      setAssignedMap((prev) => ({
        ...prev,
        [customerId]: { emp_id: member.emp_id, username: member.username },
      }));
    }
  };

  const getAssignedUser = (customerId) => {
    if (assignedMap[customerId]) return assignedMap[customerId];
    // Default: current user
    if (currentUser) return { emp_id: currentUser.emp_id, username: currentUser.username || currentUser.name };
    return null;
  };

  // ---------- Helper: get auth headers ----------
  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${sessionStorage.getItem("token")}`,
  });

  // ---------- Load notes from API ----------
  useEffect(() => {
    if (!selectedChatId) return;
    const fetchNotes = async () => {
      try {
        const res = await fetch(`/api/notes/${selectedChatId}`, { headers: getHeaders() });
        if (res.ok) {
          const data = await res.json();
          setNotes(data.map((n) => ({ ...n, date: new Date(n.created_at) })));
        }
      } catch (err) {
        console.error("Fetch notes error:", err);
      }
    };
    fetchNotes();
  }, [selectedChatId]);

  // ---------- Note handlers (API-backed) ----------
  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedChatId) return;
    const author = currentUser?.username || currentUser?.name || "Admin";

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ customer_id: selectedChatId, text: newNote, author }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotes([{ id: data.id, text: newNote, author, date: new Date(), customer_id: selectedChatId }, ...notes]);
      }
    } catch (err) {
      console.error("Add note error:", err);
    }
    setNewNote("");
    setIsAddingNote(false);
  };

  const handleDeleteNote = async (id) => {
    setNotes(notes.filter((n) => n.id !== id));
    try {
      await fetch(`/api/notes/${id}`, { method: "DELETE", headers: getHeaders() });
    } catch (err) {
      console.error("Delete note error:", err);
    }
  };

  const handleEditNote = (note) => {
    setEditingNoteId(note.id);
    setEditingText(note.text);
  };

  const handleSaveEdit = async (id) => {
    if (!editingText.trim()) return;
    setNotes(notes.map((n) => (n.id === id ? { ...n, text: editingText } : n)));
    setEditingNoteId(null);
    setEditingText("");
    try {
      await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ text: editingText }),
      });
    } catch (err) {
      console.error("Edit note error:", err);
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingText("");
  };

  // ---------- Effects ----------
  // Effect 1: กดจาก notification → เปิดแชทของลูกค้าที่ถูกต้อง
  useEffect(() => {
    const cid = location.state?.customerId || location.state?.chatId;
    if (cid) {
      setSelectedChatId(Number(cid));
      // ใช้ replaceState แทน navigate เพื่อไม่ให้ component remount
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [location.state?.customerId, location.state?.chatId, location.pathname]);

  // Effect 2: โหลดครั้งแรก → เปิดแชทแรก (เฉพาะกรณีที่ยังไม่ได้ select และไม่ได้มาจาก notification)
  useEffect(() => {
    const hasNavState = !!(location.state?.customerId || location.state?.chatId);
    if (customer.length > 0 && selectedChatId === null && !hasNavState) {
      setSelectedChatId(customer[0].id);
    }
  }, [customer.length, selectedChatId]);

  // Scroll to latest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedChatId]);

  // ---------- Render ----------
  return (
    <div className="kanit-regular inbox-container px-3">

      {/* ========== LEFT — Chat List ========== */}
      <div className="customer-list">
        <div className="search-sort-row">
          <input placeholder="Search" className="custom-search-input" />
          <div className="custom-icon-sort" onClick={handleSortToggle} style={{ cursor: "pointer" }}>
            <i className="bi bi-arrow-down-up"></i>
          </div>
        </div>

        <div className="list">
          <ChatList
            customers={sortedCustomers}
            selectedChatId={selectedChatId}
            onChatSelect={handleChatSelect}
          />
        </div>
      </div>

      {/* ========== CENTER — Chat Area ========== */}
      <div className="chat-section">
        {/* Top bar */}
        <div className="d-flex gap-3 custom-top-chat mx-1">
          <div className="d-flex gap-3 align-items-center">
            {selectedCustomer && (
              <>
                <img
                  src={selectedCustomer.img}
                  className="rounded-circle"
                  style={{ width: "46px", height: "46px", objectFit: "cover" }}
                  alt={selectedCustomer.name}
                />
                <div className="d-flex flex-column">
                  <span style={{ fontSize: "18px", fontWeight: 500 }}>
                    {selectedCustomer.name}
                  </span>
                  <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                    {selectedCustomer.app}
                  </span>
                </div>
              </>
            )}
          </div>

          {selectedCustomer && (
            <div className="d-flex gap-3 align-items-center">
              <select
                className={`status-select status-${getStatusVariant(selectedCustomer.status)}`}
                value={selectedCustomer.status}
                onChange={(e) => updateCustomerStatus(selectedCustomer.id, e.target.value)}
              >
                {Object.values(STATUS).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button className="icon-btn" aria-label="more-options">
                <i className="bi bi-three-dots-vertical fs-5"></i>
              </button>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-grow-1 overflow-y-auto d-flex flex-column gap-2 chat-messages-area">
          {chatMessages.map((msg) => (
            <div key={msg.id} className={`message ${msg.sender === "own" ? "own" : ""}`}>
              {msg.sender === "customer" && (
                <img src={selectedCustomer?.img} alt="Customer" />
              )}
              {msg.message_type === "sticker" ? (
                <div className="sticker">
                  <img
                    src={msg.image}
                    alt="sticker"
                    style={{ width: "120px", height: "120px", objectFit: "contain" }}
                  />
                </div>
              ) : msg.image ? (
                <div className="chat-image">
                  <img
                    src={msg.image}
                    alt="upload"
                    style={{ maxWidth: "320px", maxHeight: "420px", borderRadius: "12px", objectFit: "cover", cursor: "pointer" }}
                    onClick={() => window.open(msg.image, "_blank")}
                  />
                </div>
              ) : (
                <div className="texts">
                  <p className={msg.sender === "own" ? "own" : ""}>{msg.text}</p>
                </div>
              )}
              {msg.sender === "own" && (
                <img src={currentUser?.image} alt="Admin" />
              )}
            </div>
          ))}
          <div ref={endRef}></div>
        </div>

        {/* Image picker panel */}
        {showImagePanel && (
          <div className="image-picker-panel">
            <div className="image-picker-header">
              <span>{panelFiles.filter(f => f.selected).length} รูปที่เลือก</span>
              <div className="d-flex gap-2">
                <button
                  className="icon-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="เพิ่มรูป"
                >
                  <i className="bi bi-plus-lg"></i>
                </button>
                <button className="icon-btn" onClick={handleCloseImagePanel} title="ปิด">
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
            </div>

            <div className="image-picker-grid">
              {panelFiles.map((f, idx) => (
                <div
                  key={idx}
                  className={`image-picker-thumb${f.selected ? " selected" : ""}`}
                  onClick={() => handleTogglePanelFile(idx)}
                >
                  <img src={f.url} alt={f.file.name} />
                  {f.selected && (
                    <div className="image-picker-check">
                      <i className="bi bi-check-lg"></i>
                    </div>
                  )}
                  <button
                    className="image-picker-remove"
                    onClick={(e) => { e.stopPropagation(); handleRemovePanelFile(idx); }}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                </div>
              ))}
            </div>

            <div className="image-picker-footer">
              <button
                className="image-picker-send-btn"
                disabled={!panelFiles.some(f => f.selected)}
                onClick={handleSendPanelImages}
              >
                <i className="bi bi-send-fill me-2"></i>
                ส่ง {panelFiles.filter(f => f.selected).length} รูป
              </button>
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="flex-shrink-0 pt-3">
          <form onSubmit={handleSendMessage}>
            <div className="d-flex flex-row p-1 pe-3 gap-1 align-items-center custom-bottom-chat">
              <div className="d-flex ps-2">
                <button type="button" className="icon-btn" aria-label="emoji">
                  <i className="bi bi-emoji-smile fs-4" style={{ lineHeight: 1 }}></i>
                </button>
              </div>

              <textarea
                rows={1}
                placeholder="พิมพ์ข้อความ"
                ref={msgRef}
                value={newMessage}
                onChange={(e) => { setNewMessage(e.target.value); autoResize(e); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) handleSendMessage(e);
                }}
                className="w-100 pt-2 custom-text-input message-input"
                style={{ overflow: "hidden", resize: "none", minHeight: "40px", maxHeight: "120px" }}
              />

              <div className="d-flex ps-2 gap-1">
                <button type="button" className="icon-btn" aria-label="mic">
                  <i className="bi bi-mic fs-4" style={{ lineHeight: 1 }}></i>
                </button>
                <button
                  type="button"
                  className={`icon-btn${showImagePanel ? " active" : ""}`}
                  aria-label="image"
                  onClick={() => showImagePanel ? handleCloseImagePanel() : fileInputRef.current?.click()}
                >
                  <i className="bi bi-image fs-4" style={{ lineHeight: 1 }}></i>
                </button>
                <input type="file" accept="image/*" multiple hidden ref={fileInputRef} onChange={handleUploadImage} />
                <button type="submit" className="icon-btn send-btn" aria-label="send">
                  <i className="bi bi-send-fill fs-5" style={{ lineHeight: 1 }}></i>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* ========== RIGHT — Detail Panel ========== */}
      <div className="detail-panel">
        {selectedCustomer ? (
          <>
            {/* Profile image */}
            <div className="detail-avatar-wrapper">
              <img
                src={selectedCustomer.img}
                className="detail-avatar"
                alt={selectedCustomer.name}
              />
            </div>

            {/* Name (editable) */}
            <div className="detail-name-section">
              {isEditingName ? (
                <input
                  type="text"
                  value={selectedCustomer.name}
                  onChange={handleNameChange}
                  onBlur={handleNameSave}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleNameSave(); } }}
                  className="detail-name-input"
                  autoFocus
                />
              ) : (
                <p className="detail-name" onClick={() => setIsEditingName(true)}>
                  {selectedCustomer.name}
                  <i className="bi bi-pencil ms-2" style={{ cursor: "pointer", fontSize: "14px" }}></i>
                </p>
              )}

              {selectedCustomer.originalName &&
                selectedCustomer.originalName !== selectedCustomer.name && (
                  <p className="detail-original-name">{selectedCustomer.originalName}</p>
                )}
            </div>

            {/* Assigned to */}
            <div className="detail-assigned">
              <span>ผู้รับผิดชอบ :</span>
              <div className="detail-assigned-user">
                <select
                  className="assign-select"
                  value={getAssignedUser(selectedChatId)?.emp_id || ""}
                  onChange={(e) => handleAssignChange(selectedChatId, e.target.value)}
                >
                  {members.map((m) => (
                    <option key={m.emp_id} value={m.emp_id}>
                      {m.username} ({m.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <hr className="detail-divider" />

            {/* Notes */}
            <div className="detail-notes">
              <div className="detail-notes-header">
                <div className="d-flex align-items-center gap-2">
                  <span>โน๊ต</span>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => navigate("/notes")}
                    title="ไปหน้าโน๊ตรวม"
                    style={{ padding: "2px 6px" }}
                  >
                    <i className="bi bi-box-arrow-up-right" style={{ fontSize: "14px" }}></i>
                  </button>
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setIsAddingNote(!isAddingNote)}
                >
                  <i className="bi bi-plus fs-4"></i>
                </button>
              </div>

              {isAddingNote && (
                <div className="note-form">
                  <textarea
                    rows={3}
                    placeholder="เขียนโน๊ต..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="note-textarea"
                  />
                  <div className="note-form-actions">
                    <button type="button" className="note-btn note-btn-save" onClick={handleAddNote}>บันทึก</button>
                    <button type="button" className="note-btn note-btn-cancel" onClick={() => { setIsAddingNote(false); setNewNote(""); }}>ยกเลิก</button>
                  </div>
                </div>
              )}

              <div className="notes-list">
                {notes.map((note) => (
                  <div key={note.id} className="note-card">
                    {editingNoteId === note.id ? (
                      <div>
                        <textarea
                          rows={3}
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="note-textarea"
                        />
                        <div className="note-form-actions">
                          <button type="button" className="note-btn note-btn-save" onClick={() => handleSaveEdit(note.id)}>บันทึก</button>
                          <button type="button" className="note-btn note-btn-cancel" onClick={handleCancelEdit}>ยกเลิก</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="note-text">{note.text}</p>
                        <div className="note-footer">
                          <small className="note-date">
                            {note.date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}{" "}
                            {note.date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                          </small>
                          <div className="note-actions">
                            <button type="button" className="icon-btn" onClick={() => handleEditNote(note)}>
                              <i className="bi bi-pencil" style={{ fontSize: "14px" }}></i>
                            </button>
                            <button type="button" className="icon-btn" onClick={() => handleDeleteNote(note.id)}>
                              <i className="bi bi-trash" style={{ fontSize: "14px" }}></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="detail-empty">
            <p>เลือกแชทเพื่อดูข้อมูลลูกค้า</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;
