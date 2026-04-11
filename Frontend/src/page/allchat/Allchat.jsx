import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Container, Dropdown, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useChat } from "../../context/ChatContext";
import EmojiPicker from "../../components/EmojiPicker";
import "./allChat.css";

// Helper: ตรวจว่าข้อความเป็น emoji ล้วนหรือไม่
const EMOJI_REGEX = /^(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji}\u200D\p{Emoji}|\uFE0F|\u200D|\s)+$/u;
const isEmojiOnly = (text) => {
  if (!text || !text.trim()) return false;
  return EMOJI_REGEX.test(text.trim());
};

// Helper: LINE emoji
const LINE_EMOJI_PATTERN = /\[line-emoji:([^:]+):([^\]]+)\]/g;
const hasLineEmoji = (text) => text && LINE_EMOJI_PATTERN.test(text);
const isLineEmojiOnly = (text) => {
  if (!text) return false;
  const stripped = text.replace(LINE_EMOJI_PATTERN, "").trim();
  return stripped === "" && LINE_EMOJI_PATTERN.test(text);
};
const renderTextWithLineEmoji = (text, size = 24) => {
  if (!text) return null;
  const regex = /\[line-emoji:([^:]+):([^\]]+)\]/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.substring(lastIndex, match.index));
    const [, productId, emojiId] = match;
    parts.push(
      <img key={`${match.index}-${emojiId}`} src={`https://stickershop.line-scdn.net/sticonshop/v1/sticon/${productId}/android/${emojiId}.png`}
        alt="emoji" style={{ width: size, height: size, verticalAlign: "middle", display: "inline" }} loading="lazy" />
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.substring(lastIndex));
  return parts;
};

// === Helper: แปลงเวลา ===
const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return time;
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" }) + " " + time;
};

const FILTER_TABS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "not_started", label: "ยังไม่เริ่ม" },
  { key: "in_progress", label: "กำลังดำเนินการ" },
  { key: "done", label: "เสร็จสิ้น" },
];

const AVAILABLE_TAGS = ["Urgent", "VIP", "Active", "Follow up"];

// === Status badge config (fixed colors) ===
const STATUS_STYLE = {
  "ยังไม่เริ่ม": { bg: "#6b7280", color: "#fff" },
  "กำลังดำเนินการ": { bg: "#d97706", color: "#fff" },
  "เสร็จสิ้น": { bg: "#16a34a", color: "#fff" },
};

// === Mini Chat Panel ===
const MiniChatPanel = ({ customer, chatMessages, onOpenFull, onClose, onSend }) => {
  const [replyText, setReplyText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
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
          <button title="เปิดแชทเต็ม" onClick={(e) => { e.stopPropagation(); onOpenFull(customer.id); }}>
            <i className="bi bi-box-arrow-up-right"></i>
          </button>
          <button title="ปิด" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="mini-chat-messages" ref={messagesContainerRef}>
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`mini-msg ${msg.sender === "own" ? "own" : "customer"}`}>
            {msg.sender === "customer" && (
              <img src={customer.img} alt="" className="mini-avatar" />
            )}
            {msg.message_type === "sticker" ? (
              <div style={{ background: "transparent", padding: 0 }}>
                <img src={msg.image} alt="sticker" style={{ width: "80px", height: "80px", objectFit: "contain" }} />
              </div>
            ) : msg.image ? (
              <img src={msg.image} alt="upload" style={{ maxWidth: "180px", maxHeight: "180px", borderRadius: "8px", display: "block" }} />
            ) : isLineEmojiOnly(msg.text) ? (
              <span style={{ lineHeight: 1.2 }}>{renderTextWithLineEmoji(msg.text, 36)}</span>
            ) : isEmojiOnly(msg.text) ? (
              <span style={{ fontSize: "28px", letterSpacing: "2px", lineHeight: 1.2 }}>{msg.text}</span>
            ) : (
              <div className="bubble">{hasLineEmoji(msg.text) ? renderTextWithLineEmoji(msg.text) : msg.text}</div>
            )}
            {msg.created_at && (
              <span className="mini-msg-time">{formatTime(msg.created_at)}</span>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <form className="mini-chat-input" onSubmit={handleSubmit}>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <button
            type="button"
            className={`icon-btn mini-emoji-btn${showEmoji ? " active" : ""}`}
            onClick={() => setShowEmoji((v) => !v)}
            title="Emoji"
          >
            <i className="bi bi-emoji-smile"></i>
          </button>
          {showEmoji && (
            <EmojiPicker
              onSelect={(emoji) => {
                setReplyText((prev) => prev + emoji);
                inputRef.current?.focus();
              }}
              onClose={() => setShowEmoji(false)}
            />
          )}
        </div>
        <input
          ref={inputRef}
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

// === Main Component ===
const AllChat = () => {
  const navigate = useNavigate();
  const { messages, customers, sendMessage, unreadCounts, markAsRead, STATUS } = useChat();

  const [expandedChatIds, setExpandedChatIds] = useState([]);
  const [cols, setCols] = useState(4);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  // === New Filter States ===
  const [members, setMembers] = useState([]);
  const [sortOrder, setSortOrder] = useState("latest"); // "latest" | "oldest"
  const [filterAssignee, setFilterAssignee] = useState("all"); // "all" | "unassigned" | emp_id
  const [filterTags, setFilterTags] = useState([]);

  // Fetch members to show assignee info
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const res = await fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setMembers(await res.json());
      } catch (err) {}
    };
    fetchMembers();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width <= 575) setCols(1);
      else if (width <= 991) setCols(2);
      else if (width <= 1200) setCols(3);
      else setCols(4);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // === Get last message time for a customer ===
  const getLastMsgTime = useCallback((customerId) => {
    const msgs = messages[customerId];
    if (!msgs || msgs.length === 0) return 0;
    const timeStr = msgs[msgs.length - 1].created_at;
    return timeStr ? new Date(timeStr).getTime() : 0;
  }, [messages]);

  // === Filter logic ===
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // 1. Status tab filter
      if (activeFilter === "not_started" && c.status !== STATUS.NOT_STARTED) return false;
      if (activeFilter === "in_progress" && c.status !== STATUS.IN_PROGRESS) return false;
      if (activeFilter === "done" && c.status !== STATUS.DONE) return false;

      // 2. Assignee Filter
      if (filterAssignee !== "all") {
        if (filterAssignee === "unassigned" && c.assigned_to) return false;
        if (filterAssignee !== "unassigned" && c.assigned_to !== Number(filterAssignee)) return false;
      }

      // 3. Tag Filter (c.tags array must contain ALL selected tags)
      if (filterTags.length > 0) {
        const cTags = c.tags || [];
        const hasAllTags = filterTags.every(t => cTags.includes(t));
        if (!hasAllTags) return false;
      }

      // 4. Search text
      if (searchText) {
        const q = searchText.toLowerCase();
        return c.name.toLowerCase().includes(q) || (c.last && c.last.toLowerCase().includes(q));
      }
      return true;
    }).sort((a, b) => {
      // 5. Sorting
      const timeA = getLastMsgTime(a.id);
      const timeB = getLastMsgTime(b.id);
      return sortOrder === "latest" ? timeB - timeA : timeA - timeB;
    });
  }, [customers, activeFilter, filterAssignee, filterTags, searchText, sortOrder, getLastMsgTime, STATUS]);

  // === Count per status (for tab badges) ===
  const statusCounts = {
    all: customers.length,
    not_started: customers.filter((c) => c.status === STATUS.NOT_STARTED).length,
    in_progress: customers.filter((c) => c.status === STATUS.IN_PROGRESS).length,
    done: customers.filter((c) => c.status === STATUS.DONE).length,
  };

  const handleCardClick = useCallback((customerId) => {
    setExpandedChatIds((prev) =>
      prev.includes(customerId) ? prev.filter((id) => id !== customerId) : [...prev, customerId],
    );
    markAsRead(customerId);
  }, [markAsRead]);

  const handleOpenFullChat = useCallback(
    (customerId) => {
      navigate("/inbox", { state: { customerId: customerId } });
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

  const renderUserCard = (customer, isActive) => {
    const style = STATUS_STYLE[customer.status] || STATUS_STYLE["ยังไม่เริ่ม"];
    const lastTime = getLastMsgTime(customer.id);
    const assignedMember = members.find(m => m.emp_id === customer.assigned_to);

    // DYNAMIC TAGS (with a fallback map if 'tags' is undefined to hide the empty mockup)
    // สำหรับการทดสอบ ถ้ายังไม่มี array tags ให้ถือว่าเป็น array ว่าง
    const tags = customer.tags || [];

    return (
      <div
        className={`user-card ${isActive ? "active-card" : ""}`}
        onClick={() => handleCardClick(customer.id)}
      >
        <div className="user-card-main">
          <div className="position-relative" style={{ flexShrink: 0 }}>
            <img
              src={customer.img}
              className="rounded-circle user-card-avatar"
              alt={customer.name}
            />
            {(unreadCounts[customer.id] || 0) > 0 && (
              <span className="allchat-unread-badge">
                {unreadCounts[customer.id] > 99 ? "99+" : unreadCounts[customer.id]}
              </span>
            )}
          </div>
          <div className="user-card-info">
            <div className="user-card-top">
              <span className="user-card-name">{customer.name}</span>
              <span
                className="user-card-status"
                style={{ backgroundColor: style.bg, color: style.color }}
              >
                {customer.status}
              </span>
            </div>
            <div className="user-card-bottom">
              <p className="user-card-last">{customer.last}</p>
              {lastTime && <span className="user-card-time">{formatTime(lastTime)}</span>}
            </div>
            {customer.platform && (
              <div className="d-flex align-items-center gap-1 mt-1" style={{ fontSize: "0.65rem", color: "#6b7280" }}>
                {customer.platform === "line" ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#06C755"><path d="M12 2C6.48 2 2 5.88 2 10.54c0 4.24 3.76 7.78 8.84 8.44.34.07.81.22.93.52.1.27.07.68.03.95l-.15.91c-.05.27-.22 1.06.93.58s6.19-3.65 8.44-6.25C22.97 13.42 22 12.06 22 10.54 22 5.88 17.52 2 12 2z"/></svg>
                ) : (
                  <i className="bi bi-messenger" style={{ color: "#0084FF", fontSize: "12px" }}></i>
                )}
                <span>{customer.channel_name || customer.app}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="user-card-footer">
          <div className="staff-group d-flex align-items-center gap-1">
            {assignedMember ? (
              <>
                <img 
                  src={assignedMember.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignedMember.username)}&background=random&size=40`} 
                  alt={assignedMember.username} 
                  className="border"
                  style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                />
                <span style={{ fontSize: "0.7rem", color: "#374151", fontWeight: 500, whiteSpace: "nowrap" }}>
                  {assignedMember.username}
                </span>
              </>
            ) : (
              <>
                <div 
                  className="border d-flex align-items-center justify-content-center text-muted" 
                  style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#f3f4f6", fontSize: "10px", flexShrink: 0 }}
                >
                  <i className="bi bi-person"></i>
                </div>
                <span style={{ fontSize: "0.7rem", color: "#9ca3af", whiteSpace: "nowrap" }}>
                  ยังไม่กำหนด
                </span>
              </>
            )}
          </div>
          <div className="tag-group">
              {/* Static mock — เหมือน Inbox, รอระบบ tags จาก DB */}
              <span className="tag-badge badge-red">Urgent</span>
              <span className="tag-badge badge-purple">VIP</span>
              <span className="tag-badge badge-green">Active</span>

              {/* Dynamic tags — เปิดใช้เมื่อมี customer.tags จาก API */}
              {/* {tags.map((tag, i) => {
                const type = tag.toLowerCase();
                let badgeClass = "badge-gray";
                if (type.includes("urgent")) badgeClass = "badge-red";
                else if (type.includes("vip")) badgeClass = "badge-purple";
                else if (type.includes("active")) badgeClass = "badge-green";
                const isLong = tag.length > 12;
                return (
                  <span key={i} className={`tag-badge ${badgeClass} ${isLong ? 'tag-dot' : ''}`} title={tag}>
                    {!isLong && tag}
                  </span>
                );
              })} */}
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="kanit-regular d-flex flex-column allChat">
      {/* Header Section */}
      <div className="allchat-toolbar d-flex flex-column gap-2 mb-3">
        {/* Top Row: Tabs + Search */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="filter-tabs">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                className={`nav-search ${activeFilter === tab.key ? "nav-search-active" : ""}`}
                onClick={() => setActiveFilter(tab.key)}
              >
                {tab.label}
                {statusCounts[tab.key] > 0 && (
                  <span className="tab-count">{statusCounts[tab.key]}</span>
                )}
              </button>
            ))}
          </div>
          <div className="sidebar-search">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="ค้นหา (ชื่อ/ข้อความ)"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>

        {/* Bottom Row: Additional Filters */}
        <div className="d-flex align-items-center flex-wrap gap-2">
          <select 
            className="form-select form-select-sm w-auto rounded-pill px-3 shadow-none border-light-subtle" 
            style={{ fontSize: "0.85rem", cursor: "pointer" }}
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="latest">จัดเรียง: ล่าสุด</option>
            <option value="oldest">จัดเรียง: เก่าสุด</option>
          </select>

          <select 
            className="form-select form-select-sm w-auto rounded-pill px-3 shadow-none border-light-subtle"
            style={{ fontSize: "0.85rem", cursor: "pointer" }}
            value={filterAssignee} 
            onChange={(e) => setFilterAssignee(e.target.value)}
          >
            <option value="all">ผู้รับผิดชอบ: ทั้งหมด</option>
            <option value="unassigned">ผู้รับผิดชอบ: ยังไม่ได้กำหนด</option>
            {members.map(m => (
               <option key={m.emp_id} value={m.emp_id}>{m.username}</option>
            ))}
          </select>

          <Dropdown>
            <Dropdown.Toggle 
              variant="light" 
              size="sm" 
              className="rounded-pill border-light-subtle shadow-none d-flex align-items-center gap-1 bg-white"
              style={{ fontSize: "0.85rem", letterSpacing: "0.2px" }}
            >
              <i className="bi bi-tags"></i>
              แท็ก {filterTags.length > 0 ? `(${filterTags.length})` : ""}
            </Dropdown.Toggle>
            <Dropdown.Menu className="p-2 border-0 shadow-sm rounded-3">
              {AVAILABLE_TAGS.map(tag => (
                <Form.Check 
                  key={tag}
                  type="checkbox"
                  id={`tag-${tag}`}
                  label={tag}
                  className="mb-1"
                  style={{ fontSize: "0.85rem", cursor: "pointer" }}
                  checked={filterTags.includes(tag)}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (e.target.checked) setFilterTags([...filterTags, tag]);
                    else setFilterTags(filterTags.filter(t => t !== tag));
                  }}
                />
              ))}
              {filterTags.length > 0 && (
                <>
                  <Dropdown.Divider />
                  <div className="text-center">
                    <button 
                      className="btn btn-link text-danger text-decoration-none p-0" 
                      style={{ fontSize: "0.75rem" }}
                      onClick={(e) => { e.stopPropagation(); setFilterTags([]); }}
                    >
                      ล้างแท็กทั้งหมด
                    </button>
                  </div>
                </>
              )}
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      {/* Scrollable Area */}
      <div className="flex-grow-1 overflow-auto">
        <Container fluid>
          {filteredCustomers.length === 0 ? (
            <div className="allchat-empty">
              <i className="bi bi-chat-square-dots"></i>
              <p>ไม่พบแชทที่ตรงกับตัวกรอง</p>
            </div>
          ) : (
            <div className="d-flex w-100" style={{ gap: "1.5rem" }}>
              {Array.from({ length: cols }).map((_, colIndex) => {
                const colItems = [];
                for (let i = 0; i < filteredCustomers.length; i++) {
                  if (i % cols === colIndex) {
                    const customer = filteredCustomers[i];
                    const isExpanded = expandedChatIds.includes(customer.id);
                    colItems.push(
                      <div key={customer.id} className="w-100 mb-3">
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
                      </div>,
                    );
                  }
                }
                return (
                  <div key={`col-${colIndex}`} className="d-flex flex-column" style={{ flex: 1, minWidth: 0 }}>
                    {colItems}
                  </div>
                );
              })}
            </div>
          )}
        </Container>
      </div>
    </div>
  );
};

export default AllChat;
