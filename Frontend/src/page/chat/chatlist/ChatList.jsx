import "./chatList.css";
import React from "react";

const STATUS = {
  NOT_STARTED: "ยังไม่เริ่ม",
  IN_PROGRESS: "กำลังดำเนินการ",
  DONE: "เสร็จสิ้น",
};

const ChatList = ({
  customers,
  selectedChatId,
  onChatSelect,
  unreadCounts = {},
  tagsMap = {},
  members = [],
}) => {
  return (
    <div className="overflow-y-auto flex-grow-1">
      <div className="chatlist-container">
        {customers.map((cus) => {
          const isSelected = cus.id === selectedChatId;
          const unread = unreadCounts[cus.id] || 0;
          const tags = tagsMap[cus.id] || [];

          // Find assigned staff member
          const assignedMember = cus.assigned_to
            ? members.find((m) => m.emp_id === cus.assigned_to)
            : null;

          return (
            <div
              key={cus.id}
              onClick={() => onChatSelect(cus.id)}
              className={`chatlist-card ${isSelected ? "selected-chat-item" : ""}`}
            >
              <div className="chatlist-card-main">
                <div className="position-relative" style={{ flexShrink: 0 }}>
                  <img
                    src={cus.img || undefined}
                    alt={cus.name}
                    className="chatlist-avatar"
                  />
                  {unread > 0 && (
                    <span className="unread-badge">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </div>

                <div className="chatlist-info">
                  <div className="chatlist-top">
                    <span className="chatlist-name">{cus.name}</span>
                    <span
                      className="chatlist-status"
                      style={{
                        backgroundColor:
                          cus.status === STATUS.DONE
                            ? "#16a34a"
                            : cus.status === STATUS.IN_PROGRESS
                            ? "#d97706"
                            : "#6b7280",
                        color: "#ffffff",
                      }}
                    >
                      {cus.status}
                    </span>
                  </div>
                  <div className="chatlist-bottom">
                    <p className="chatlist-last">{cus.last}</p>
                  </div>
                </div>
              </div>

              {/* Bottom Section — Real Data */}
              <div className="chatlist-card-footer">
                {assignedMember && (
                  <div className="staff-group">
                    <div
                      className="staff-avatar"
                      style={{ backgroundColor: "#818cf8" }}
                      title={assignedMember.username}
                    >
                      {assignedMember.username?.charAt(0)?.toUpperCase()}
                    </div>
                  </div>
                )}
                {tags.length > 0 && (
                  <div className="tag-group">
                    {tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={tag.id || i}
                        className="tag-badge"
                        style={{
                          backgroundColor: tag.color + "22",
                          color: tag.color,
                          borderColor: tag.color + "44",
                        }}
                        title={tag.text}
                      >
                        <span
                          className="tag-badge-dot"
                          style={{ backgroundColor: tag.color }}
                        ></span>
                        {tag.text.length > 8
                          ? tag.text.substring(0, 8) + "…"
                          : tag.text}
                      </span>
                    ))}
                    {tags.length > 3 && (
                      <span
                        className="tag-badge tag-badge-more"
                        title={tags.slice(3).map((t) => t.text).join(", ")}
                      >
                        +{tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatList;
