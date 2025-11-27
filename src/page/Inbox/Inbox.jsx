import { useRef, useEffect, useState } from "react";
import { Badge, Button, Form, Dropdown } from "react-bootstrap";
import "./inbox.css";
import ChatList from "./chatList/ChatList";
import { fetchCustomer } from "../../data/customer";
import { initialChatMessages } from "../../data/messages"; // ข้อความตัวอย่าง


const Inbox = ({ currentUser }) => {
    const msgRef = useRef(null);
    const endRef = useRef(null);

    const [customer, setCustomer] = useState([]);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [isEditingName, setIsEditingName] = useState(false);
    //   ใช้ initialChatMessages เป็น State เริ่มต้น
    const [messages, setMessages] = useState(initialChatMessages);
    const [newMessage, setNewMessage] = useState("");

    //   เก็บค่า Status ของลูกค้า
    const Status = (id, newStatusValue) => {
        setCustomer((prev) =>
            prev.map((c) => (c.id === id ? { ...c, status: newStatusValue } : c))
        );
    };

    const handleNameChange = (e) => {
        // ใช้ selectedCustomer เพื่อหา ID ที่ถูกต้อง
        if (!selectedCustomer) return;

        // อัปเดตชื่อใน State ด้วยค่าใหม่
        setCustomer((prev) =>
            prev.map((c) =>
                // ชื่อเดิม
                c.id === selectedCustomer.id ? { ...c, name: e.target.value } : c
            )
        );
    };

    const handleNameSave = () => {
        setIsEditingName(false);
    };

    // อัปเดต ID ของแชทที่ถูกเลือก
    const handleChatSelect = (id) => {
        setSelectedChatId(id);
        setIsEditingName(false);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        const trimmedMessage = newMessage.trim();

        if (!trimmedMessage || !selectedCustomer) return;

        const newMsg = {
            id: Date.now(),
            sender: "own",
            text: trimmedMessage,
        }; // 1. อัปเดต State messages

        setMessages((prevMessages) => ({
            ...prevMessages, // คัดลอกข้อความแชทอื่นๆ ทั้งหมด
            [selectedChatId]: [
                ...(prevMessages[selectedChatId] || []), // นำข้อความเดิมมา
                newMsg, // เพิ่มข้อความใหม่
            ],
        }));

        setCustomer((prevCustomers) =>
            prevCustomers.map((c) =>
                c.id === selectedCustomer.id ? { ...c, last: trimmedMessage } : c
            )
        );

        setNewMessage("");
        if (msgRef.current) {
            msgRef.current.style.height = "40px";
        }
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const autoResize = (e) => {
        const el = e.target;
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
    };

    // ดึงข้อมูลและตั้งค่าลูกค้าคนแรกเป็นคนที่ถูกเลือกเริ่มต้น
    useEffect(() => {
        const allCustomers = fetchCustomer();
        const normalizedCustomers = allCustomers.map((c) => ({
            ...c,
            // เก็บชื่อเดิมไว้
            originalName: c.name,
            status: c.inprocess ? STATUS.IN_PROGRESS : STATUS.DONE,
        }));

        setCustomer(normalizedCustomers);
        if (normalizedCustomers.length > 0) {
            setSelectedChatId(normalizedCustomers[0].id);
        }
    }, []);

    useEffect(() => {
        if (msgRef.current) {
            msgRef.current.style.height = "auto";
            msgRef.current.style.height = msgRef.current.scrollHeight + "px";
        }
    }, []);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, selectedChatId]);

    // ค้นหาข้อมูลลูกค้าที่ถูกเลือกจาก ID
    const selectedCustomer = customer.find((c) => c.id === selectedChatId);

    return (
        <div className="kanit-regular d-flex flex-column mx-4">
            {/* Start Header Section*/}
            <div className="d-flex gap-2 mb-3">
                {/* ปุ่มย้อนกลับ */}
                <button className="btn-sm-circle">
                    <i className="bi bi-arrow-left"></i>
                </button>
                {/* หัวข้อ อาจจะชื่อร้านที่รับผิดชอบ */}
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
                    {/* Start Search Section */}
                    <div className="d-flex gap-2 flex-shrink-0 align-items-center border-bottom border-secondary-subtle pb-3">
                        <Form.Control
                            placeholder="Search"
                            className="custom-search-input"
                        />
                        <div className="custom-icon-sort">
                            <i className="bi bi-arrow-down-up"></i>
                        </div>
                    </div>
                    {/* End Search Section */}

                    {/* Start Chat List */}
                    <div className="list">
                        <ChatList
                            customers={customer}
                            selectedChatId={selectedChatId}
                            onChatSelect={handleChatSelect}
                        />
                    </div>
                </div>
                {/* End ChatList Section */}

                {/* Start Chat Section */}
                <div className="flex-grow-1 bg-white rounded-4 p-3 d-flex flex-column h-100">
                    {/* Start Top Section */}
                    <div className="d-flex gap-3 custom-top-chat pb-3 mx-1 border-secondary-subtle border-bottom">
                        <div className="d-flex gap-3">
                            {/* Profile */}
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
                        {(messages[selectedChatId] || []).map((msg) => (
                            <div
                                key={msg.id}
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
                        <div ref={endRef}></div>
                    </div>

                    {/* Text Section */}
                    <div className="flex-shrink-0 pt-3">
                        <Form onSubmit={handleSendMessage}>
                            <div className="d-flex flex-row p-1 pe-3 gap-1 align-items-center custom-bottom-chat">
                                {/* Icons Button */}
                                <div className="d-flex ps-2">
                                    {/* Emoji Icon */}
                                    <Button variant="link" className="text-black p-1">
                                        <i
                                            className="bi bi-emoji-smile fs-4"
                                            style={{ lineHeight: 1 }}
                                        />
                                    </Button>
                                </div>

                                {/* Text Area: Controlled Component */}
                                <Form.Control
                                    as="textarea"
                                    rows={1}
                                    placeholder="พิมพ์ข้อความ"
                                    ref={msgRef}
                                    // NEW: เชื่อมกับ state และ handler
                                    value={newMessage}
                                    onChange={(e) => {
                                        setNewMessage(e.target.value);
                                        autoResize(e); // ปรับขนาด
                                    }}
                                    onKeyDown={(e) => {
                                        // ดักจับการกด Enter เพื่อส่งข้อความ (และป้องกัน Enter ขึ้นบรรทัดใหม่)
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
                                    {/* Mic Icon */}
                                    <Button variant="link" className="text-black p-1">
                                        <i className="bi bi-mic fs-4" style={{ lineHeight: 1 }}></i>
                                    </Button>
                                    {/* Image Icon */}
                                    <Button variant="link" className="text-black p-1">
                                        <i
                                            className="bi bi-image fs-4"
                                            style={{ lineHeight: 1 }}
                                        ></i>
                                    </Button>
                                    {/* Card Message Icon */}
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

                {/* Start Profile Section*/}
                {selectedCustomer && (
                    <div
                        key={selectedCustomer.id}
                        className="bg-white-translucent align-items-center rounded-4 pt-3 d-flex flex-column h-100"
                        style={{ minWidth: "300px", maxWidth: "250px" }}
                    >
                        {/* Profile */}
                        <img
                            src={selectedCustomer.img}
                            className="rounded-circle mt-5"
                            style={{ width: "140px", height: "140px", objectFit: "cover" }}
                        />
                    </div>
                )
                }
                {selectedCustomer && (
                    <div
                        className="d-flex flex-column align-items-center mt-4"
                        style={{ padding: "0 10px" }}
                    >
                        {/* ชื่อปัจจุบัน (แก้ไขได้) */}
                        {isEditingName ? (
                            <Form.Control
                                type="text"
                                value={selectedCustomer.name}
                                onChange={handleNameChange}
                                onBlur={handleNameSave}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleNameSave();
                                    }
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

                        {/* *** ชื่อเดิม (ชื่อเก่า) *** */}
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
                {/* ผู้รับผิดชอบ */}
                {selectedCustomer && (
                    <div className="mt-5">
                        <p>
                            ผู้รับผิดชอบ : &nbsp;&nbsp;
                            <img
                                src={currentUser?.image || "https://i.pravatar.cc/150?img=12"}
                                alt="Admin Profile"
                                className="rounded-circle"
                                style={{ width: "40px", height: "40px", objectFit: "cover" }}
                            />
                            &nbsp; {currentUser?.name || "Admin"}
                        </p>
                        <hr />
                        {/* Note Section */}
                        <div className="flex-grow-1 w-100">
                            {/* Title */}
                            <div className="d-flex justify-content-between">
                                <p>โน๊ต</p>
                                <i className="bi bi-plus"></i>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Inbox;