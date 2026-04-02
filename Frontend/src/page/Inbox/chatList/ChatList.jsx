import "./chatList.css";
import { Card } from "react-bootstrap";
import React from "react";

const STATUS = {
  NOT_STARTED: "ยังไม่เริ่ม",
  IN_PROGRESS: "กำลังดำเนินการ",
  DONE: "เสร็จสิ้น",
};

const ChatList = ({ customers, selectedChatId, onChatSelect, unreadCounts = {} }) => {
  return (
    <div className="overflow-y-auto flex-grow-1 pt-3">
      <Card className="custom-card-chat">
        {customers.map((cus) => {
          const isSelected = cus.id === selectedChatId;
          const unread = unreadCounts[cus.id] || 0;

          return (
            <Card.Body
              onClick={() => onChatSelect(cus.id)}
              className={`d-flex align-items-center ${isSelected ? "selected-chat-item" : ""}`}
              key={cus.id}
            >
              {/* Profile Picture with unread badge */}
              <div className="position-relative me-3" style={{ flexShrink: 0 }}>
                <img
                  src={cus.img}
                  className="rounded-circle custom-img"
                  style={{ width: "60px", height: "60px", objectFit: "cover" }}
                />
                {unread > 0 && (
                  <span className="unread-badge">{unread > 99 ? "99+" : unread}</span>
                )}
              </div>

              <div className="d-flex flex-column gap-2 flex-grow-1 chat-text-container" style={{ minWidth: 0 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "baseline", gap: "6px" }}>
                  <span className="text-truncate username-text">{cus.name}</span>
                  <span
                    className="custom-badge"
                    style={{
                      backgroundColor:
                        cus.status === STATUS.DONE ? '#16a34a'
                        : cus.status === STATUS.IN_PROGRESS ? '#d97706'
                        : '#6b7280',
                      color: '#ffffff',
                      borderRadius: '12px',
                    }}
                  >
                    {cus.status}
                  </span>
                </div>
                <p className="custom-text text-truncate mb-0">
                  {cus.last}
                </p>
              </div>
            </Card.Body>
          );
        })}
      </Card>
    </div>
  );
};

export default ChatList;
