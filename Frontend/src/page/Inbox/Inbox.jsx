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

  // Notes state
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingText, setEditingText] = useState("");

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
    const file = e.target.files[0];
    if (!file || !selectedCustomer) return;
    const url = URL.createObjectURL(file);
    sendImageMessage(selectedChatId, url);
    endRef.current?.scrollIntoView({ behavior: "smooth" });
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

  // ---------- Helper: get auth headers ----------
  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
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
    const author = currentUser?.name || "Admin";

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
  // Select first chat on load
  useEffect(() => {
    if (customer.length > 0 && selectedChatId === null) {
      setSelectedChatId(customer[0].id);
    }
  }, [customer, selectedChatId]);

  // Scroll to latest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedChatId]);

  // Accept chatId from navigation state
  useEffect(() => {
    if (location.state?.chatId) {
      setSelectedChatId(location.state.chatId);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

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
              <div className="texts">
                {msg.image ? (
                  <img
                    src={msg.image}
                    alt="upload"
                    style={{ maxWidth: "220px", borderRadius: "8px" }}
                  />
                ) : (
                  <p className={msg.sender === "own" ? "own" : ""}>{msg.text}</p>
                )}
              </div>
              {msg.sender === "own" && (
                <img src={currentUser?.image} alt="Admin" />
              )}
            </div>
          ))}
          <div ref={endRef}></div>
        </div>

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
               <button type="button" className="icon-btn" aria-label="image" onClick={() => fileInputRef.current?.click()}>
                  <i className="bi bi-image fs-4" style={{ lineHeight: 1 }}></i>
                </button>
                <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleUploadImage} />
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
                <img
                  src={currentUser?.image}
                  alt="Admin"
                  className="rounded-circle"
                  style={{ width: "28px", height: "28px", objectFit: "cover" }}
                />
                <span>{currentUser?.name}</span>
              </div>
            </div>

            <hr className="detail-divider" />

            {/* Notes */}
            <div className="detail-notes">
              <div className="detail-notes-header">
                <span>โน๊ต</span>
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
