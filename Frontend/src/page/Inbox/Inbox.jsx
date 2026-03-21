import { useRef, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

import { useChat } from "../../context/ChatContext";
import ChatList from "./chatList/ChatList";

import "./inbox.css";

const Inbox = ({ currentUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const msgRef = useRef(null);
  const endRef = useRef(null);

  // ใช้ shared context สำหรับ messages และ customers
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

  // Start Message State Section
  const [newMessage, setNewMessage] = useState("");
  const fileInputRef = useRef(null);

  // Start Note State Section
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingText, setEditingText] = useState("");

  // โหลด Notes และ Socket.io
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/notes");
        const data = await res.json();
        if (data.status === "success") {
          const formatted = data.data.map(n => ({
            id: n.id,
            text: n.content,
            date: new Date(n.created_at),
            customerName: n.user,
            author: "Admin",
            color: "#FFF8DC"
          }));
          setNotes(formatted);
        }
      } catch (err) {
        console.error("Error fetching notes:", err);
      }
    };
    fetchNotes();

    const socket = io("http://localhost:3000");
    socket.on("new_note", (n) => {
      setNotes(prev => [{
        id: n.id, text: n.content, date: new Date(n.created_at || Date.now()), customerName: n.user, author: "Admin", color: "#FFF8DC"
      }, ...prev]);
    });
    socket.on("updated_note", (n) => {
      setNotes(prev => prev.map(old => old.id === n.id ? { ...old, text: n.content, customerName: n.user } : old));
    });
    socket.on("deleted_note", ({ id }) => {
      setNotes(prev => prev.filter(n => n.id !== id));
    });

    return () => socket.disconnect();
  }, []);

  // Start Sort Logic Section
  const sortedCustomers = [...customer].sort((a, b) => {
    if (sortBy === "latest") {
      // เรียงตาม ID จากน้อยไปมาก
      return a.id - b.id;
    }
    if (sortBy === "name_asc") {
      // เรียงตามชื่อ A-Z (ใช้ localeCompare เพื่อรองรับหลายภาษา)
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "name_desc") {
      // เรียงตามชื่อ Z-A
      return b.name.localeCompare(a.name);
    }
    return 0; // ไม่เรียง
  });

  // กำหนดสีของ Badge/Dropdown Toggle ตามสถานะ
  const getStatusVariant = (status) => {
    switch (status) {
      case STATUS.NOT_STARTED:
        return "secondary";
      case STATUS.IN_PROGRESS:
        return "warning";
      case STATUS.DONE:
        return "success";
      default:
        return "secondary";
    }
  };

  // อัปเดตค่า Status ของลูกค้าที่ถูกเลือก
  const Status = (id, newStatusValue) => {
    updateCustomerStatus(id, newStatusValue);
  };

  // ปรับขนาด Textarea อัตโนมัติเมื่อพิมพ์
  const autoResize = (e) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  // ฟังก์ชันสำหรับสลับโหมดการเรียงลำดับเมื่อกดปุ่ม Sort
  const handleSortToggle = () => {
    setSortBy((prevSortBy) => {
      if (prevSortBy === "latest") return "name_asc";
      if (prevSortBy === "name_asc") return "name_desc";
      return "latest";
    });
  };

  const handleUploadImage = (e) => {
    const file = e.target.files[0];
    if (!file || !selectedCustomer) return;

    const url = URL.createObjectURL(file);
    sendImageMessage(selectedChatId, url);

    endRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ฟังก์ชันสำหรับเพิ่มโน้ตใหม่
  const handleAddNote = async () => {
    if (newNote.trim()) {
      try {
        await fetch("http://localhost:3000/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: selectedCustomer?.name || "ลูกค้า", content: newNote, created_by: 1, admin_name: currentUser?.name || "Admin" })
        });
        setNewNote("");
        setIsAddingNote(false);
      } catch(err) { console.error("Error saving note :", err); }
    }
  };

  // ฟังก์ชันสำหรับลบโน้ต
  const handleDeleteNote = async (id) => {
    if(window.confirm("ยืนยันการลบโน้ต?")) {
      try {
        await fetch(`http://localhost:3000/api/notes/${id}`, { method: "DELETE" });
      } catch(err) { console.error("Error deleting note:", err); }
    }
  };

  // เริ่มต้นโหมดแก้ไขโน้ต
  const handleEditNote = (note) => {
    setEditingNoteId(note.id);
    setEditingText(note.text);
  };

  // บันทึกการแก้ไขโน้ต
  const handleSaveEdit = async (id) => {
    if (editingText.trim()) {
      try {
        const noteToEdit = notes.find(n => n.id === id);
        await fetch(`http://localhost:3000/api/notes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: noteToEdit.customerName, content: editingText, admin_name: currentUser?.name || "Admin" })
        });
        setEditingNoteId(null);
        setEditingText("");
      } catch(err) { console.error("Error editing note:", err); }
    }
  };

  // ยกเลิกการแก้ไขโน้ต
  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingText("");
  };

  // อัปเดต State ชื่อลูกค้าชั่วคราวขณะแก้ไข
  const handleNameChange = (e) => {
    if (!selectedCustomer) return;
    updateCustomerName(selectedCustomer.id, e.target.value);
  };

  // บันทึกการแก้ไขชื่อลูกค้า (ออกจากโหมดแก้ไข)
  const handleNameSave = () => {
    setIsEditingName(false);
  };

  // อัปเดต ID ของแชทที่ถูกเลือกเมื่อคลิกรายการแชท
  const handleChatSelect = (id) => {
    setSelectedChatId(id);
    setIsEditingName(false);
  };

  // ฟังก์ชันสำหรับส่งข้อความ
  const handleSendMessage = (e) => {
    e.preventDefault();
    const trimmedMessage = newMessage.trim();

    if (!trimmedMessage || !selectedCustomer) return;

    // ส่งข้อความผ่าน shared context
    sendMessage(selectedChatId, trimmedMessage);

    // รีเซ็ตฟอร์มและเลื่อนหน้าจอ
    setNewMessage("");
    if (msgRef.current) {
      msgRef.current.style.height = "40px";
    }
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // กำหนดแชทแรกเป็นแชทที่ถูกเลือกเริ่มต้น (ใช้ customers จาก context)
  useEffect(() => {
    if (customer.length > 0 && selectedChatId === null) {
      setSelectedChatId(customer[0].id);
    }
  }, [customer, selectedChatId]);

  // ปรับความสูง Textarea เริ่มต้นครั้งเดียว
  useEffect(() => {
    if (msgRef.current) {
      msgRef.current.style.height = "auto";
      msgRef.current.style.height = msgRef.current.scrollHeight + "px";
    }
  }, []);

  // เลื่อนไปข้อความล่าสุดทุกครั้งที่ messages หรือ selectedChatId เปลี่ยน
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedChatId]);

  // ค้นหาข้อมูลลูกค้าที่ถูกเลือกจาก ID (Derived State)
  const selectedCustomer = customer.find((c) => c.id === selectedChatId);

  // ดึง chatId ที่ส่งมาจากหน้าอื่นผ่าน useLocation state
  useEffect(() => {
    if (location.state && location.state.chatId) {
      setSelectedChatId(location.state.chatId);

      // ล้าง state ใน History เพื่อไม่ให้มันจำค่าเดิมตลอดเวลา
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  return (
    <div className="kanit-regular inbox-container p-4">
      {/* Start ChatList Section */}
      <div className="customer-list">
        {/* Start Search & Sort Section */}
        <div className="search-sort-row">
          {/* Search bar */}
          <input placeholder="Search" className="custom-search-input" />
          {/* Sort Button */}
          <div className="custom-icon-sort" onClick={handleSortToggle} style={{ cursor: "pointer" }}>
            <i className="bi bi-arrow-down-up"></i>
          </div>
        </div>
        {/* End Search & Sort Section */}

        {/* Start Chat List Component */}
        <div className="list">
          <ChatList
            // ข้อมูลที่ถูกเรียงลำดับแล้ว
            customers={sortedCustomers}
            selectedChatId={selectedChatId}
            onChatSelect={handleChatSelect}
          />
        </div>
      </div>
      {/* End ChatList Section */}

      {/* Start Chat Section */}
      <div className="chat-section">
        {/* Start Top Section: Profile และ Status Dropdown */}
        <div className="d-flex gap-3 custom-top-chat mx-1 border-secondary-subtle border-bottom">
          <div className="d-flex gap-3">
            {/* Profile Picture */}
            <img
              src={selectedCustomer?.img}
              className="rounded-circle mt-2"
              style={{ width: "46px", height: "46px", objectFit: "cover" }}
            />
            <div className="d-flex flex-column">
              {/* Username */}
              <span style={{ fontSize: "18px" }} className="pt-2">
                {selectedCustomer?.name}
              </span>
              <span style={{ fontSize: "14px" }}>{selectedCustomer?.app}</span>
            </div>
          </div>

          {/* Status Dropdown และ More Options */}
          {selectedCustomer && (
            <div className="d-flex gap-3 align-items-center">
              <select
                className={`status-select status-${getStatusVariant(selectedCustomer.status)}`}
                value={selectedCustomer.status}
                onChange={(e) => Status(selectedCustomer.id, e.target.value)}
                aria-label="Customer status"
              >
                {Object.values(STATUS).map((statusValue) => (
                  <option key={statusValue} value={statusValue}>
                    {statusValue}
                  </option>
                ))}
              </select>
              <button className="icon-btn" aria-label="more-options">
                <i className="bi bi-three-dots-vertical fs-5"></i>
              </button>
            </div>
          )}
        </div>
        {/* End Top Section */}

        {/* Chat container */}
          <div className="flex-grow-1 overflow-y-auto d-flex flex-column gap-2">
          {/* Map ข้อความในแชทที่ถูกเลือก */}
          {(messages[selectedChatId] || []).map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.sender === "own" ? "own" : ""}`}
            >
              {msg.sender === "customer" && (
                <img src={selectedCustomer?.img} alt="Customer" />
              )}
              <div className="texts">
                {msg.image ? (
                  <img
                    src={msg.image}
                    alt="upload"
                    style={{
                      maxWidth: "220px",
                      borderRadius: "8px",
                    }}
                  />
                ) : (
                  <p>{msg.text}</p>
                )}
              </div>

              {msg.sender === "own" && (
                <img src={currentUser?.image} alt="Admin" />
              )}
            </div>
          ))}
          <div ref={endRef}></div>
        </div>

        {/* Text Section */}
        <div className="flex-shrink-0 pt-3">
          <Form onSubmit={handleSendMessage}>
            <div className="d-flex flex-row p-1 pe-3 gap-1 align-items-center custom-bottom-chat">
              {/* Icons Button */}
              <div className="d-flex ps-2">
                <Button variant="link" className="text-black p-1">
                    <div className="flex-shrink-0 pt-3">
                      <form onSubmit={handleSendMessage}>
                        <div className="d-flex flex-row p-1 pe-3 gap-1 align-items-center custom-bottom-chat">
                          {/* Icons Button */}
                          <div className="d-flex ps-2">
                            <button type="button" className="icon-btn" aria-label="emoji">
                              <i className="bi bi-emoji-smile fs-4" style={{ lineHeight: 1 }} />
                            </button>
                          </div>

                          {/* Text Area: ช่องพิมพ์ข้อความ */}
                          <textarea
                            rows={1}
                            placeholder="พิมพ์ข้อความ"
                            ref={msgRef}
                            value={newMessage}
                            onChange={(e) => {
                              setNewMessage(e.target.value);
                              autoResize(e);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                handleSendMessage(e);
                              }
                            }}
                            className="w-100 pt-2 custom-text-input message-input"
                            style={{ overflow: "hidden", resize: "none", minHeight: "40px", maxHeight: "120px" }}
                          />

                          {/* Icons Button */}
                          <div className="d-flex ps-2">
                            <button type="button" className="icon-btn" aria-label="mic">
                              <i className="bi bi-mic fs-4" style={{ lineHeight: 1 }}></i>
                            </button>
                            <button type="button" className="icon-btn" aria-label="image" onClick={() => fileInputRef.current.click()}>
                              <i className="bi bi-image fs-4" style={{ lineHeight: 1 }}></i>
                            </button>
                            <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleUploadImage} />
                            <button type="button" className="icon-btn" aria-label="pin">
                              <i className="bi bi-sticky fs-4" style={{ lineHeight: 1 }}></i>
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                </Button>
              </div>
            </div>
          </Form>        
          {/* Profile */}
          <img
            src={selectedCustomer.img}
            className="rounded-circle mt-5"
            style={{ width: "140px", height: "140px", objectFit: "cover" }}
          />
          {selectedCustomer && (
            <div
              className="d-flex flex-column mt-4"
              style={{ padding: "0 10px" }}
            >
              {/* ชื่อปัจจุบัน (แก้ไขได้) */}
              {isEditingName ? (
                <Form.Control /* Textbox สำหรับแก้ไข */
                  type="text"
                  value={selectedCustomer.name}
                  onChange={handleNameChange}
                  onBlur={handleNameSave} // บันทึกเมื่อออกจากช่อง
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleNameSave();
                    } // บันทึกเมื่อกด Enter
                  }}
                  className="custom-edit-name"
                  autoFocus
                />
              ) : (
                <p className="mb-0" style={{ fontSize: "18px" }}>
                  {selectedCustomer.name}
                  <i
                    className="bi bi-pencil ms-2"
                    onClick={() => setIsEditingName(true)}
                    style={{ cursor: "pointer" }}
                  ></i>
                </p>
              )}

              {/* *** ชื่อเดิม (แสดงเมื่อมีการแก้ไขชื่อแล้ว) *** */}
              {selectedCustomer.originalName &&
                selectedCustomer.originalName !== selectedCustomer.name && (
                  <p
                    className="text-muted mt-1 mb-0"
                    style={{ fontSize: "16px" }}
                  >
                    {selectedCustomer.originalName}
                  </p>
                )}
            </div>
          )}

          {selectedCustomer && (
            <div
              className="mt-5 w-100"
              style={{ paddingLeft: "30px", paddingRight: "30px" }}
            >
              <p>
                ผู้รับผิดชอบ : &nbsp;&nbsp;
                {/* รูปภาพผู้ดูแลระบบ */}
                <img
                  src={currentUser?.image}
                  alt="Admin Profile"
                  className="rounded-circle"
                  style={{
                    width: "30px",
                    height: "30px",
                    objectFit: "cover",
                  }}
                />
                &nbsp; {currentUser?.name}
              </p>
              <hr />

              <div className="w-100 px-2">
                {/* Title: ส่วนโน้ต */}
                <div className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <p className="mb-0">โน๊ต</p>
                    {/* ปุ่มสลับการแสดง/ซ่อนฟอร์มเพิ่มโน้ต */}
                    <Button
                      variant="link"
                      className="text-black p-0"
                      onClick={() => setIsAddingNote(!isAddingNote)}
                    >
                      <i
                        className="bi bi-plus fs-4"
                        style={{ cursor: "pointer" }}
                      ></i>
                    </Button>
                  </div>

                  {/* Add Note Form: แสดงเมื่อ isAddingNote เป็น true */}
                  {isAddingNote && (
                    <div className="mb-3">
                      <Form.Control /* ช่องพิมพ์โน้ตใหม่ */
                        style={{ borderRadius: 10 }}
                        as="textarea"
                        rows={3}
                        placeholder="เขียนโน๊ต..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="mb-2"
                      />
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={handleAddNote}
                        >
                          บันทึก
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setIsAddingNote(false);
                            setNewNote("");
                          }}
                        >
                          ยกเลิก
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Notes List: แสดงโน้ตทั้งหมดของลูกค้าคนนี้ */}
                  <div className="d-flex flex-column gap-2">
                    {notes.filter(n => n.customerName === selectedCustomer?.name).map((note) => (
                      <div
                        key={note.id}
                        className="border rounded-3 p-3 bg-white"
                      >
                        {editingNoteId === note.id ? (
                          // Edit Mode: แสดง Textarea สำหรับแก้ไข
                          <div>
                            <Form.Control
                              style={{ borderRadius: 10 }}
                              as="textarea"
                              rows={3}
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="mb-2"
                            />
                            <div className="d-flex gap-2">
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleSaveEdit(note.id)}
                              >
                                บันทึก
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={handleCancelEdit}
                              >
                                ยกเลิก
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // View Mode: แสดงข้อความโน้ตและเวลา
                          <div>
                            <p
                              className="mb-2"
                              style={{
                                whiteSpace: "pre-wrap",
                                fontSize: "15px",
                              }}
                            >
                              {note.text}
                            </p>
                            <div className="d-flex justify-content-between align-items-center">
                              <small className="text-muted">
                                {/* แสดงวันที่และเวลา */}
                                {note.date.toLocaleDateString("th-TH", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}{" "}
                                {note.date.toLocaleTimeString("th-TH", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </small>
                              <div className="d-flex gap-2">
                                {/* ปุ่ม Edit */}
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="text-secondary p-0"
                                  onClick={() => handleEditNote(note)}
                                >
                                  <i
                                    className="bi bi-pencil"
                                    style={{ fontSize: "16px" }}
                                  ></i>
                                </Button>
                                {/* ปุ่ม Delete */}
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="text-secondary p-0"
                                  onClick={() => handleDeleteNote(note.id)}
                                >
                                  <i
                                    className="bi bi-trash"
                                    style={{ fontSize: "16px" }}
                                  ></i>
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
      </div>
    </div>
  );
};

export default Inbox;
