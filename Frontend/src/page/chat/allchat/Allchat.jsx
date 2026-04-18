import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Container, Dropdown, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useChat } from "../../../context/ChatContext";
import EmojiPicker from "../../../components/EmojiPicker";
import TemplatePicker from "../../../components/TemplatePicker";
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


// === Status badge config (fixed colors) ===
const STATUS_STYLE = {
  "ยังไม่เริ่ม": { bg: "#6b7280", color: "#fff" },
  "กำลังดำเนินการ": { bg: "#d97706", color: "#fff" },
  "เสร็จสิ้น": { bg: "#16a34a", color: "#fff" },
};

// === Mini Chat Panel ===
const MiniChatPanel = ({ customer, chatMessages, onOpenFull, onClose, onSend, onSendImage, onSendCarousel }) => {
  const [replyText, setReplyText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onSendImage) onSendImage(customer.id, file);
    e.target.value = "";
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file && onSendImage) onSendImage(customer.id, file);
        return;
      }
    }
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
            ) : msg.message_type === "carousel" ? (
              <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', maxWidth: '260px', scrollbarWidth: 'none' }}>
                {(() => {
                  try {
                    const cards = JSON.parse(msg.text);
                    return cards.map((c, i) => (
                      <div key={i} style={{ flex: '0 0 200px', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.1)', backgroundColor: 'var(--bg-surface, #fff)' }}>
                        {c.isEndCard ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px' }}>
                            <span style={{ color: '#42659a', fontWeight: 500, fontSize: '0.85rem' }}>{c.message || "ดูเพิ่มเติม"}</span>
                          </div>
                        ) : (
                          <div style={{ position: 'relative', width: '200px', height: '200px' }}>
                            {c.image && <img src={c.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                            {c.tag && (
                              <div style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 500 }}>{c.tag}</div>
                            )}
                            {c.message && (
                              <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(0,0,0,0.65)', color: '#fff', padding: '3px 12px', borderRadius: '14px', fontSize: '0.78rem', fontWeight: 500, whiteSpace: 'nowrap' }}>{c.message}</div>
                            )}
                          </div>
                        )}
                      </div>
                    ));
                  } catch { return <span>Invalid carousel</span>; }
                })()}
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

      {/* Template Picker Overlay */}
      {showTemplatePicker && (
        <div style={{ position: 'absolute', bottom: '60px', left: 0, right: 0, zIndex: 200 }} onClick={(e) => e.stopPropagation()}>
          <TemplatePicker
            onSelectText={(text) => { onSend(customer.id, text); setShowTemplatePicker(false); }}
            onSelectImage={(url) => { /* image templates not common */ setShowTemplatePicker(false); }}
            onSelectCarousel={(cards) => { if (onSendCarousel) onSendCarousel(customer.id, cards); setShowTemplatePicker(false); }}
            onClose={() => setShowTemplatePicker(false)}
          />
        </div>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

      {/* Input */}
      <form className="mini-chat-input" onSubmit={handleSubmit}>
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: '2px' }}>
          {/* Template Picker */}
          <button
            type="button"
            className={`icon-btn${showTemplatePicker ? " active" : ""}`}
            onClick={() => setShowTemplatePicker((v) => !v)}
            title="Card Template"
          >
            <i className="bi bi-window"></i>
          </button>
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="พิมพ์ข้อความ..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onPaste={handlePaste}
        />
      </form>
    </div>
  );
};

// === Main Component ===
const AllChat = () => {
  const navigate = useNavigate();
  const { messages, customers, sendMessage, sendImageMessage, sendCarouselMessage, unreadCounts, markAsRead, STATUS } = useChat();

  const [expandedChatIds, setExpandedChatIds] = useState([]);
  const [cols, setCols] = useState(4);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  // === New Filter States ===
  const [members, setMembers] = useState([]);
  const [sortOrder, setSortOrder] = useState("latest"); // "latest" | "oldest"
  const [filterAssignee, setFilterAssignee] = useState("all"); // "all" | "unassigned" | emp_id
  const [filterTags, setFilterTags] = useState([]); // เก็บ tag id ที่เลือก

  // แท็กจริงจาก DB
  const [globalTags, setGlobalTags] = useState([]);       // แท็กส่วนกลาง (สำหรับ dropdown)
  const [customerTagsMap, setCustomerTagsMap] = useState({}); // { [cus_id]: [{ id, text, color }] }

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

  // Fetch global tags (for dropdown) + all customer-tag map (for cards & filter)
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    fetch('/api/tags', { headers })
      .then(r => r.ok ? r.json() : [])
      .then(data => setGlobalTags(Array.isArray(data) ? data : []))
      .catch(() => {});

    fetch('/api/tags/customers/all', { headers })
      .then(r => r.ok ? r.json() : {})
      .then(data => setCustomerTagsMap(typeof data === 'object' ? data : {}))
      .catch(() => {});
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

      // 3. Tag Filter — เทียบ tag id จาก customerTagsMap
      if (filterTags.length > 0) {
        const cTagIds = (customerTagsMap[c.id] || []).map(t => t.id);
        const hasAllTags = filterTags.every(id => cTagIds.includes(id));
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
  }, [customers, activeFilter, filterAssignee, filterTags, searchText, sortOrder, getLastMsgTime, STATUS, customerTagsMap]);

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

    // Tags ตามจริงจาก DB map
    const tags = customerTagsMap[customer.id] || [];

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
              {tags.map((tag, i) => (
                <span
                  key={tag.id || i}
                  className="tag-badge"
                  style={{ backgroundColor: tag.color + '22', color: tag.color, border: `1px solid ${tag.color}55`, fontSize: '0.68rem', fontWeight: 600 }}
                  title={tag.text}
                >
                  {tag.text.length > 10 ? tag.text.substring(0, 9) + '…' : tag.text}
                </span>
              ))}
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="kanit-regular d-flex flex-column allChat">
      {/* Header Section */}
      <div className="allchat-toolbar d-flex flex-column mb-3">
        {/* Toolbar: Filters (Left) + Search (Right) */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 w-100">
          
          {/* Left Side: Tabs + Dropdowns */}
          <div className="d-flex align-items-center flex-wrap gap-2">
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

            <Dropdown>
              <Dropdown.Toggle 
                as="div" 
                className="nav-search shadow-none"
              >
                จัดเรียง: {sortOrder === "latest" ? "ล่าสุด" : "เก่าสุด"}
                <i className="bi bi-chevron-down ms-1" style={{ fontSize: "10px" }}></i>
              </Dropdown.Toggle>
              <Dropdown.Menu className="p-2 border-0 shadow-sm rounded-3" style={{ backgroundColor: "var(--bg-main)", border: "1px solid var(--border-light)" }}>
                <Dropdown.Item onClick={() => setSortOrder("latest")} className="rounded"><span style={{ color: "var(--text-main)" }}>ล่าสุด</span></Dropdown.Item>
                <Dropdown.Item onClick={() => setSortOrder("oldest")} className="rounded"><span style={{ color: "var(--text-main)" }}>เก่าสุด</span></Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <Dropdown>
              <Dropdown.Toggle 
                as="div" 
                className="nav-search shadow-none"
              >
                ผู้รับผิดชอบ: {filterAssignee === "all" ? "ทั้งหมด" : filterAssignee === "unassigned" ? "ยังไม่ได้กำหนด" : members.find(m => m.emp_id === filterAssignee)?.username || filterAssignee}
                <i className="bi bi-chevron-down ms-1" style={{ fontSize: "10px" }}></i>
              </Dropdown.Toggle>
              <Dropdown.Menu className="p-2 border-0 shadow-sm rounded-3" style={{ backgroundColor: "var(--bg-main)", border: "1px solid var(--border-light)" }}>
                <Dropdown.Item onClick={() => setFilterAssignee("all")} className="rounded"><span style={{ color: "var(--text-main)" }}>ทั้งหมด</span></Dropdown.Item>
                <Dropdown.Item onClick={() => setFilterAssignee("unassigned")} className="rounded"><span style={{ color: "var(--text-main)" }}>ยังไม่ได้กำหนด</span></Dropdown.Item>
                {members.map(m => (
                  <Dropdown.Item key={m.emp_id} onClick={() => setFilterAssignee(m.emp_id)} className="rounded"><span style={{ color: "var(--text-main)" }}>{m.username}</span></Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>

            <Dropdown>
              <Dropdown.Toggle 
                as="div" 
                className="nav-search shadow-none"
              >
                <i className="bi bi-tags"></i>
                แท็ก {filterTags.length > 0 ? `(${filterTags.length})` : ""}
              </Dropdown.Toggle>
              <Dropdown.Menu className="p-2 shadow-sm rounded-3" style={{ backgroundColor: "var(--bg-main)", border: "1px solid var(--border-light)" }}>
                {globalTags.length === 0 ? (
                  <div className="text-muted px-2" style={{ fontSize: '0.8rem' }}>ยังไม่มีแท็ก กรุณาเพิ่มในหน้าตั้งค่า</div>
                ) : globalTags.map(tag => (
                  <Form.Check
                    key={tag.id}
                    type="checkbox"
                    id={`tag-${tag.id}`}
                    className="mb-1 d-flex align-items-center gap-2"
                    style={{ fontSize: "0.85rem", cursor: "pointer", color: "var(--text-main)" }}
                    checked={filterTags.includes(tag.id)}
                    label={
                      <span className="d-flex align-items-center gap-2" style={{ color: "var(--text-main)" }}>
                        <span style={{ display:'inline-block', width:'10px', height:'10px', borderRadius:'50%', backgroundColor: tag.color, flexShrink:0 }} />
                        {tag.text}
                      </span>
                    }
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.checked) setFilterTags([...filterTags, tag.id]);
                      else setFilterTags(filterTags.filter(id => id !== tag.id));
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

          {/* Right Side: Search */}
          <div className="sidebar-search bg-white">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="ค้นหา (ชื่อ/ข้อความ)"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
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
                              onSendImage={sendImageMessage}
                              onSendCarousel={sendCarouselMessage}
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
