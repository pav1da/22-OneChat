import "./chatList.css";
import { Card, Badge, Dropdown } from "react-bootstrap";
import React, { useState } from "react";

const STATUS = {
  NOT_STARTED: "ยังไม่เริ่ม",
  IN_PROGRESS: "กำลังดำเนินการ",
  DONE: "เสร็จสิ้น",
};

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

const ChatList = ({ customers, selectedChatId, onChatSelect }) => {
  return (
    <div className="overflow-y-auto flex-grow-1 pt-3">
      <Card className="custom-card-chat">
        {customers.map((cus) => { // ใช้ customers ที่ถูกเรียงแล้ว
          const isSelected = cus.id === selectedChatId;

          return (
            <Card.Body
              onClick={() => onChatSelect(cus.id)}
              className={`d-flex align-items-center ${
                isSelected ? "selected-chat-item" : ""
              }`}
              key={cus.id}
            >
              {/* Profile Picture */}
              <img
                src={cus.img}
                className="rounded-circle custom-img me-3"
                style={{
                  width: "60px",
                  height: "60px",
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />

              <div
                className="d-flex flex-column gap-2 flex-grow-1 chat-text-container"
                style={{ height: "60px" }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    alignItems: "baseline",
                  }}
                >
                  <span className="text-truncate username-text">
                    {cus.name}
                  </span>

                  <Badge
                    bg={getStatusVariant(cus.status)}
                    className="custom-badge"
                  >
                    {cus.status}
                  </Badge>
                </div>
                <p
                  className="custom-text text-truncate mb-0"
                  style={{ width: "200px" }}
                >
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
