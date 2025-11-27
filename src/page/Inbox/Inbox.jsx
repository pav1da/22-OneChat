import { useRef, useEffect, useState } from "react";
import { Badge, Button, Form, Dropdown } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";

import { fetchCustomer } from "../../data/customer";
import { initialChatMessages } from "../../data/messages";
import ChatList from "./chatList/ChatList";

import "./inbox.css";

// สถานะของแชทลูกค้า
const STATUS = {
  NOT_STARTED: "ยังไม่เริ่ม",
  IN_PROGRESS: "กำลังดำเนินการ",
  DONE: "เสร็จสิ้น",
};

const Inbox = ({ currentUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const msgRef = useRef(null);
  const endRef = useRef(null);

  // Start Customer & Selection State Section
  const [customer, setCustomer] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [sortBy, setSortBy] = useState("latest");

  // Start Message State Section
  const [messages, setMessages] = useState(initialChatMessages);
  const [newMessage, setNewMessage] = useState("");

  // Start Note State Section
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingText, setEditingText] = useState("");

  // Start Sort Logic Section
  const sortedCustomers = [...customer].sort((a, b) => {
    if (sortBy === "latest") {
      // เรียงตาม ID จากมากไปน้อย (ใหม่สุดอยู่บน)
      return b.id - a.id;
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
    setCustomer((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatusValue } : c))
    );
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

  // ฟังก์ชันสำหรับเพิ่มโน้ตใหม่
  const handleAddNote = () => {
    if (newNote.trim()) {
      const noteObj = {
        id: Date.now(),
        text: newNote,
        date: new Date(),
        customerName: selectedCustomer?.name || "ลูกค้า",
        author: currentUser?.name || "Admin",
        color: "#FFF8DC",
      };

      setNotes([...notes, noteObj]);

      // บันทึกโน้ตลงใน sessionStorage (ใช้สำหรับจำลองการเก็บข้อมูลข้ามหน้า)
      const existingNotes = JSON.parse(
        sessionStorage.getItem("dashboardNotes") || "[]"
      );
      const updatedNotes = [noteObj, ...existingNotes];
      sessionStorage.setItem("dashboardNotes", JSON.stringify(updatedNotes));

      // รีเซ็ตฟอร์ม
      setNewNote("");
      setIsAddingNote(false);
    }
  };

  // ฟังก์ชันสำหรับลบโน้ต
  const handleDeleteNote = (id) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  // เริ่มต้นโหมดแก้ไขโน้ต
  const handleEditNote = (note) => {
    setEditingNoteId(note.id);
    setEditingText(note.text);
  };

  // บันทึกการแก้ไขโน้ต
  const handleSaveEdit = (id) => {
    if (editingText.trim()) {
      setNotes(
        notes.map((note) =>
          note.id === id ? { ...note, text: editingText } : note
        )
      );
      setEditingNoteId(null);
      setEditingText("");
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

    setCustomer((prev) =>
      prev.map((c) =>
        // ชื่อเดิม
        c.id === selectedCustomer.id ? { ...c, name: e.target.value } : c
      )
    );
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

    const newMsg = {
      id: Date.now(),
      sender: "own",
      text: trimmedMessage,
    };

    // อัปเดต State messages โดยเพิ่มข้อความใหม่เข้าไปในแชทที่ถูกเลือก
    setMessages((prevMessages) => ({
      ...prevMessages,
      [selectedChatId]: [...(prevMessages[selectedChatId] || []), newMsg],
    }));

    // อัปเดตข้อความล่าสุด (last) ในรายการลูกค้า
    setCustomer((prevCustomers) =>
      prevCustomers.map((c) =>
        c.id === selectedCustomer.id ? { ...c, last: trimmedMessage } : c
      )
    );

    // รีเซ็ตฟอร์มและเลื่อนหน้าจอ
    setNewMessage("");
    if (msgRef.current) {
      msgRef.current.style.height = "40px"; // รีเซ็ตความสูง Textarea
    }
    endRef.current?.scrollIntoView({ behavior: "smooth" }); // เลื่อนลงล่าง
  };

  // ดึงข้อมูลลูกค้าเริ่มต้นและกำหนดสถานะเริ่มต้น
  useEffect(() => {
    const allCustomers = fetchCustomer();

    // แปลงข้อมูลลูกค้าจาก inprocess (boolean/null) เป็น Status (string)
    const normalizedCustomers = allCustomers.map((c) => ({
      ...c,
      originalName: c.name, // เก็บชื่อเดิมไว้สำหรับการเปรียบเทียบ
      status:
        c.inprocess === true
          ? STATUS.IN_PROGRESS // true = กำลังดำเนินการ
          : c.inprocess === false
            ? STATUS.DONE // false = เสร็จสิ้น
            : STATUS.NOT_STARTED, // null/undefined = ยังไม่เริ่ม
    }));

    setCustomer(normalizedCustomers);
    // กำหนดแชทแรกเป็นแชทที่ถูกเลือกเริ่มต้น
    if (normalizedCustomers.length > 0) {
      setSelectedChatId(normalizedCustomers[0].id);
    }
  }, []);

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
    <div className="kanit-regular mx-4 d-flex flex-column">
      {/* Start Header Section */}
      <div className="d-flex gap-2 mb-3">
        {/* ปุ่มย้อนกลับ */}
        <button className="btn-sm-circle" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left"></i>
        </button>
        {/* หัวข้อ */}
        <div className="w-100 rounded-5 ps-4 d-flex align-items-center fs-5 bg-white">
          All Chats
        </div>
      </div>
      {/* End Header Section */}

      <div className="d-flex gap-2 flex-grow-1 height-fix">
        {/* Start ChatList Section */}
        <div
          className="bg-white rounded-4 p-3 d-flex flex-column h-100"
          style={{ minWidth: "350px", maxWidth: "300px" }}
        >
          {/* Start Search & Sort Section */}
          <div className="d-flex gap-2 flex-shrink-0 align-items-center border-bottom border-secondary-subtle pb-3">
            {/* Search bar */}
            <Form.Control
              placeholder="Search"
              className="custom-search-input"
            />
            {/* Sort Button */}
            <div
              className="custom-icon-sort"
              onClick={handleSortToggle}
              style={{ cursor: "pointer" }}
            >
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
        <div className="flex-grow-1 bg-white rounded-4 p-3 d-flex flex-column h-100">
          {/* Start Top Section: Profile และ Status Dropdown */}
          <div className="d-flex gap-3 custom-top-chat pb-3 mx-1 border-secondary-subtle border-bottom">
            <div className="d-flex gap-3">
              {/* Profile Picture */}
              <img
                src={selectedCustomer?.img}
                className="rounded-circle "
                style={{ width: "46px", height: "46px", objectFit: "cover" }}
              />
              {/* Username */}
              <span style={{ fontSize: "18px" }} className="pt-2">
                {selectedCustomer?.name}
              </span>
            </div>

            {/* Status Dropdown และ More Options */}
            {selectedCustomer && (
              <div className="d-flex gap-3 align-items-center">
                <Dropdown>
                  <Dropdown.Toggle
                    as={Badge}
                    variant={getStatusVariant(selectedCustomer.status)}
                    id="dropdown-custom-status"
                    className="custom-badge-top"
                    style={{ cursor: "pointer" }}
                  >
                    {selectedCustomer.status}
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    {/* Map ค่า STATUS เพื่อให้ผู้ใช้เลือกอัปเดตสถานะ */}
                    {Object.values(STATUS).map((statusValue) => (
                      <Dropdown.Item
                        key={statusValue}
                        onClick={() => Status(selectedCustomer.id, statusValue)}
                        active={selectedCustomer.status === statusValue}
                      >
                        {statusValue}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
                <i className="bi bi-three-dots-vertical fs-5"></i>
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
                // กำหนด Class 'own' เพื่อจัดตำแหน่งข้อความผู้ดูแลระบบ
                className={`message ${msg.sender === "own" ? "own" : ""}`}
              >
                {msg.sender === "customer" && (
                  <img src={selectedCustomer?.img} alt="Customer" />
                )}
                <div className="texts">
                  <p>{msg.text}</p>
                </div>
                {msg.sender === "own" && (
                  <img
                    src={currentUser?.image || "placeholder_image_path"}
                    alt="Admin"
                  />
                )}
              </div>
            ))}
            <div ref={endRef}></div> {/* Div ปลายทางสำหรับการ Scroll */}
          </div>

          {/* Text Section */}
          <div className="flex-shrink-0 pt-3">
            <Form onSubmit={handleSendMessage}>
              <div className="d-flex flex-row p-1 pe-3 gap-1 align-items-center custom-bottom-chat">
                {/* Icons Button */}
                <div className="d-flex ps-2">
                  <Button variant="link" className="text-black p-1">
                    <i
                      className="bi bi-emoji-smile fs-4"
                      style={{ lineHeight: 1 }}
                    />
                  </Button>
                </div>

                {/* Text Area: ช่องพิมพ์ข้อความ */}
                <Form.Control
                  as="textarea"
                  rows={1}
                  placeholder="พิมพ์ข้อความ"
                  ref={msgRef} // ผูกกับ msgRef เพื่อใช้ Auto-Resize
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    autoResize(e); // ปรับขนาด Textarea
                  }}
                  onKeyDown={(e) => {
                    // ดักจับ Enter (ยกเว้น Shift+Enter) เพื่อส่งข้อความ
                    if (e.key === "Enter" && !e.shiftKey) {
                      handleSendMessage(e);
                    }
                  }}
                  className="w-100 pt-2 custom-text-input"
                  style={{
                    overflow: "hidden",
                    resize: "none",
                    minHeight: "40px",
                    maxHeight: "120px",
                  }}
                />

                {/* Icons Button */}
                <div className="d-flex ps-2">
                  <Button variant="link" className="text-black p-1">
                    <i className="bi bi-mic fs-4" style={{ lineHeight: 1 }}></i>
                  </Button>
                  <Button variant="link" className="text-black p-1">
                    <i
                      className="bi bi-image fs-4"
                      style={{ lineHeight: 1 }}
                    ></i>
                  </Button>
                  <Button variant="link" className="text-black p-1">
                    <i
                      className="bi bi-sticky fs-4"
                      style={{ lineHeight: 1 }}
                    ></i>
                  </Button>
                </div>
              </div>
            </Form>
          </div>
        </div>
        {/* End Chat Section */}

        {/* Start Profile Section */}
        {selectedCustomer && (
          <div
            key={selectedCustomer.id}
            className="bg-white align-items-center rounded-4 pt-3 d-flex flex-column h-100"
            style={{ minWidth: "350px", maxWidth: "500px" }}
          >
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

                    {/* Notes List: แสดงโน้ตทั้งหมด */}
                    <div className="d-flex flex-column gap-2">
                      {notes.map((note) => (
                        <div
                          key={note.id}
                          className="border rounded-3 p-3 bg-white"
                        >
                          {editingNoteId === note.id ? (
                            // Edit Mode: แสดง Textarea สำหรับแก้ไข
                            <div>
                              <Form.Control style={{ borderRadius: 10 }} as="textarea" rows={3} value={editingText} onChange={(e) => setEditingText(e.target.value)} className="mb-2"/>
                              <div className="d-flex gap-2">
                                <Button size="sm" variant="primary" onClick={() => handleSaveEdit(note.id)}>
                                  บันทึก
                                </Button>
                                <Button size="sm" variant="secondary" onClick={handleCancelEdit}>
                                  ยกเลิก
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // View Mode: แสดงข้อความโน้ตและเวลา
                            <div>
                              <p className="mb-2" style={{ whiteSpace: "pre-wrap", fontSize: "15px", }}>
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
                                  <Button variant="link" size="sm" className="text-secondary p-0" onClick={() => handleEditNote(note)}>
                                    <i className="bi bi-pencil" style={{ fontSize: "16px" }}></i>
                                  </Button>
                                  {/* ปุ่ม Delete */}
                                  <Button variant="link" size="sm" className="text-secondary p-0" onClick={() => handleDeleteNote(note.id)}>
                                    <i className="bi bi-trash" style={{ fontSize: "16px" }}></i>
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
        )}
      </div>
    </div>
  );
};

export default Inbox;