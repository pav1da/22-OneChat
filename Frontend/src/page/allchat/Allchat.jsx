import { useState, useRef, useEffect, useCallback } from "react";
import {
  Badge,
  Button,
  Form,
  InputGroup,
  Container,
  Row,
  Col,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useChat } from "../../context/ChatContext";
import "./allChat.css";

// === Mini Chat Panel (แยกออกนอก AllChat เพื่อไม่ให้ re-mount ทุกครั้ง) ===
const MiniChatPanel = ({
  customer,
  chatMessages,
  onOpenFull,
  onClose,
  onSend,
}) => {
  const [replyText, setReplyText] = useState("");
  const messagesContainerRef = useRef(null);

  // Scroll ภายใน container ข้อความเท่านั้น
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed) return;
    onSend(customer.id, trimmed);
    setReplyText("");
  };

  return (
    <div className="mini-chat-panel" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="mini-chat-header">
        <div className="profile-info">
          <img src={customer.img} alt={customer.name} />
          <span>{customer.name}</span>
        </div>
        <div className="header-actions">
          <button
            title="เปิดแชทเต็ม"
            onClick={(e) => {
              e.stopPropagation();
              onOpenFull(customer.id);
            }}
          >
            <i className="bi bi-box-arrow-up-right"></i>
          </button>
          <button
            title="ปิด"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="mini-chat-messages" ref={messagesContainerRef}>
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`mini-msg ${msg.sender === "own" ? "own" : "customer"}`}
          >
            {msg.sender === "customer" && (
              <img src={customer.img} alt="" className="mini-avatar" />
            )}
            <div className="bubble">{msg.text}</div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form className="mini-chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="พิมพ์ข้อความ..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
        />
        <button type="submit" className="send-btn" disabled={!replyText.trim()}>
          <i className="bi bi-send-fill"></i>
        </button>
      </form>
    </div>
  );
};

const AllChat = () => {
  const navigate = useNavigate();
  const { messages, customers, sendMessage } = useChat();
  const totalEmptyCells = 21;

  const [expandedChatIds, setExpandedChatIds] = useState([]);

  const handleCardClick = useCallback((customerId) => {
    setExpandedChatIds((prev) => 
      prev.includes(customerId) 
        ? prev.filter((id) => id !== customerId) 
        : [...prev, customerId]
    );
  }, []);

  const handleOpenFullChat = useCallback(
    (customerId) => {
      navigate("/inbox", { state: { chatId: customerId } });
    },
    [navigate],
  );

  const handleCloseMiniChat = useCallback((customerId) => {
    setExpandedChatIds((prev) => prev.filter((id) => id !== customerId));
  }, []);

  const handleSendQuickReply = useCallback(
    (customerId, text) => {
      sendMessage(customerId, text);
    },
    [sendMessage],
  );

  // Helper function: สร้าง UserCard (ใช้ร่วมกันทั้ง normal grid และ split layout)
  const renderUserCard = (customer, isActive) => {
    let statusBadge = null;
    if (customer.inprocess === true) {
      statusBadge = (
        <Badge
          bg="warning"
          text="white"
          className="px-3 py-2 rounded-3"
          style={{
            fontSize: "0.8rem",
            whiteSpace: "nowrap",
            fontWeight: "500",
          }}
        >
          กำลังดำเนินการ
        </Badge>
      );
    } else if (customer.inprocess === false) {
      statusBadge = (
        <Badge
          bg="success"
          className="px-3 py-2 rounded-3"
          style={{
            fontSize: "0.8rem",
            whiteSpace: "nowrap",
            fontWeight: "500",
          }}
        >
          เสร็จสิ้น
        </Badge>
      );
    }

    return (
      <div
        className={`border rounded-4 p-1 d-flex align-items-center justify-content-between shadow-sm user-card ${isActive ? "active-card" : ""}`}
        style={{ minHeight: "100px", cursor: "pointer" }}
        onClick={() => handleCardClick(customer.id)}
      >
        <img
          src={customer.img}
          className="rounded-circle custom-img mx-3"
          style={{
            width: "60px",
            height: "60px",
            objectFit: "cover",
            flexShrink: 0,
          }}
          alt={customer.name}
        />
        <div
          className="d-flex flex-column gap-2 flex-grow-1"
          style={{ height: "70px" }}
        >
          <div
            className="pe-3"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              alignItems: "baseline",
              gap: "10px",
            }}
          >
            <span className="text-truncate username-text">{customer.name}</span>
            {statusBadge}
          </div>
          <p
            className="custom-text text-truncate mb-0 pe-3"
            style={{ width: "200px" }}
          >
            {customer.last}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="kanit-regular d-flex flex-column mx-4 allChat">
      {/* Header Section */}
      <div className="d-flex justify-content-between flex-shrink-0">
        <div className="fs-3" style={{ color: "#f26623" }}>
          All
        </div>
        <div className="d-flex gap-3 align-items-center">
          <InputGroup style={{ width: "250px" }}>
            <InputGroup.Text
              className="bg-white border-1 rounded-start-3 py-2 ps-3 pe-2"
              style={{ borderColor: "#c5c5c5" }}
            >
              <i className="bi bi-search text-muted"></i>
            </InputGroup.Text>
            <Form.Control
              type="search"
              placeholder="ค้นหา..."
              className="rounded-end-3 border-1 border-start-0 custom-search"
            />
          </InputGroup>
          <Button
            className="d-flex align-items-center gap-1 rounded-3 border-1 px-4 py-2"
            style={{
              background: "#ffffff",
              color: "#707070",
              borderColor: "#c5c5c5",
            }}
          >
            <i className="bi bi-arrow-down-up"></i>เรียงลำดับ
          </Button>
        </div>
      </div>
      <hr className="flex-shrink-0" />

      {/* Scrollable Area */}
      <div className="flex-grow-1 overflow-auto pe-2">
        <Container fluid className="px-0 pb-4">
        <div className="wrapping-grid">
          {customers.map((customer) => {
            const isExpanded = expandedChatIds.includes(customer.id);
            return (
              <div key={customer.id} className="wrapping-item">
                {renderUserCard(customer, isExpanded)}

                {isExpanded && (
                  <div className="mt-2" style={{ width: "100%", animation: "slideDown 0.25s ease-out" }}>
                    <MiniChatPanel
                      customer={customer}
                      chatMessages={messages[customer.id] || []}
                      onOpenFull={handleOpenFullChat}
                      onClose={() => handleCloseMiniChat(customer.id)}
                      onSend={handleSendQuickReply}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Render empty dashed cell placeholders */}
          {Array.from({ length: totalEmptyCells }).map((_, idx) => (
            <div key={`empty-${idx}`} className="wrapping-item">
              <div 
                className="border-dashed-light-gray rounded-4 w-100" 
                style={{ height: "100px" }}
              ></div>
            </div>
          ))}
        </div>
      </Container>
      </div>
    </div>
  );
};

export default AllChat;
