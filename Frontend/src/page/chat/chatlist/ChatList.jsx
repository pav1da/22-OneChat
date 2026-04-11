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
}) => {
  return (
    <div className="overflow-y-auto flex-grow-1">
      <div className="chatlist-container">
        {customers.map((cus) => {
          const isSelected = cus.id === selectedChatId;
          const unread = unreadCounts[cus.id] || 0;

          // Mock Data if not exist
          // const staffs = cus.staff || [];
          // const tags = cus.tags || [];

          return (
            <div
              key={cus.id}
              onClick={() => onChatSelect(cus.id)}
              className={`chatlist-card ${isSelected ? "selected-chat-item" : ""}`}
            >
              <div className="chatlist-card-main">
                <div className="position-relative" style={{ flexShrink: 0 }}>
                  <img
                    src={cus.img}
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
                    <span className="chatlist-time">03:47</span> {/* Mock Time like image */}
                  </div>
                </div>
              </div>

              {/* Bottom Section */}
              <div className="chatlist-card-footer">
                <div className="staff-group">
                  <img
                    src=""
                    alt="staff"
                    style={{ backgroundColor: "black" }}
                    className="staff-avatar"
                  />
                  {/* Dynamic map example */}
                  {/* {staffs.length > 0 &&
                    staffs.map((staff, i) => (
                      <img
                        key={i}
                        src={staff.avatar || staff.img || staff}
                        alt="staff"
                        title={staff.name || "Staff"}
                        className="staff-avatar"
                      />
                    ))} */}
                </div>
                <div className="tag-group">
                  {/* Static mocks added by user */}
                  <span className="tag-badge badge-red">Urgent</span>
                  <span className="tag-badge badge-purple">VIP</span>
                  <span className="tag-badge badge-green">Active</span>
                  {/* Mock a long tag rendering as dot */}
                  <span className="tag-badge badge-gray tag-dot" title="Demo - Do not delete"></span>
                  
                  {/* Dynamic map example */}
                  {/* {tags.length > 0 &&
                    tags.map((tag, i) => {
                      const tagLabel = typeof tag === "string" ? tag : tag.label;
                      const type = tagLabel ? tagLabel.toLowerCase() : "";
                      let badgeClass = "badge-gray";
                      if (type.includes("urgent")) badgeClass = "badge-red";
                      else if (type.includes("vip")) badgeClass = "badge-purple";
                      else if (type.includes("active")) badgeClass = "badge-green";

                      const isLong = tagLabel.length > 12;

                      return (
                        <span 
                          key={i} 
                          className={`tag-badge ${badgeClass} ${isLong ? 'tag-dot' : ''}`}
                          title={tagLabel}
                        >
                          {!isLong && tagLabel}
                        </span>
                      );
                    })} */}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatList;
