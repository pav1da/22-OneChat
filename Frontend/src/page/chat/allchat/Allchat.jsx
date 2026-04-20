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
const MiniChatPanel = ({ customer, chatMessages, onOpenFull, onClose, onSend, onSendImage, onSendCarousel, draftRefs, focusedNodeRef }) => {
    const [replyText, setReplyText] = useState(() => {
        return draftRefs?.current?.[customer.id] || "";
    });
    const [replyTo, setReplyTo] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [pastedImage, setPastedImage] = useState(null);
    const [showEmoji, setShowEmoji] = useState(false);
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);
    const messagesContainerRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);

    // Sync draft changes
    useEffect(() => {
        if (draftRefs?.current) {
            draftRefs.current[customer.id] = replyText;
        }
    }, [replyText, customer.id, draftRefs]);

    // Restore focus if this input was the active one before unmount/remount
    useEffect(() => {
        if (focusedNodeRef?.current === customer.id && inputRef.current) {
            const timer = setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    const len = inputRef.current.value.length;
                    inputRef.current.setSelectionRange(len, len);
                }
            }, 10);
            return () => clearTimeout(timer);
        }
    }, [customer.id, focusedNodeRef]);

    const handleFocus = () => {
        if (focusedNodeRef) focusedNodeRef.current = customer.id;
    };

    const handleBlur = () => {
        if (focusedNodeRef) {
            setTimeout(() => {
                if (focusedNodeRef.current === customer.id && document.activeElement !== inputRef.current) {
                    focusedNodeRef.current = null;
                }
            }, 50);
        }
    };
    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Handle sending image if preview exists
        if (pastedImage) {
            if (onSendImage) onSendImage(customer.id, pastedImage.file, replyTo);
            setPastedImage(null);

            // If there's no text with it, refocus and return
            if (!replyText.trim()) {
                setTimeout(() => {
                    const inputField = document.getElementById(`chat-input-${customer.id}`);
                    if (inputField) inputField.focus();
                }, 50);
                return;
            }
        }

        const trimmed = replyText.trim();
        if (!trimmed) return;
        onSend(customer.id, trimmed, replyTo);
        setReplyText("");
        setReplyTo(null);
        setTimeout(() => {
            const inputField = document.getElementById(`chat-input-${customer.id}`);
            if (inputField) inputField.focus();
        }, 50);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setPastedImage({ file, previewUrl });
        }
        e.target.value = "";
    };

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                e.preventDefault();
                const file = items[i].getAsFile();
                if (file) {
                    const previewUrl = URL.createObjectURL(file);
                    setPastedImage({ file, previewUrl });
                }
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
                    <div
                        id={`mini-msg-${customer.id}-${msg.id}`}
                        key={msg.id}
                        className={`mini-msg ${msg.sender === "own" ? "own" : "customer"}`}
                        style={{ transition: 'background-color 0.5s ease' }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setContextMenu({
                                x: e.pageX,
                                y: e.pageY,
                                msg: msg
                            });
                        }}
                    >
                        {msg.sender === "customer" && (
                            <img src={customer.img} alt="" className="mini-avatar" />
                        )}
                        <div className="mini-msg-content-wrapper position-relative" style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: msg.sender === "own" ? "flex-end" : "flex-start" }}>
                            {/* Quoted Preview */}
                            {msg.reply_to_id && (
                                <div
                                    className="quoted-message pointer"
                                    onClick={() => {
                                        const target = document.getElementById(`mini-msg-${customer.id}-${msg.reply_to_id}`);
                                        if (target) {
                                            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            target.style.backgroundColor = "rgba(129, 140, 248, 0.2)";
                                            setTimeout(() => { target.style.backgroundColor = "transparent"; }, 2000);
                                        }
                                    }}
                                    style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--text-secondary)',
                                        backgroundColor: 'var(--bg-input)',
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                        marginBottom: '-2px',
                                        borderLeft: `3px solid ${msg.sender === "own" ? "var(--primary-color)" : "var(--border-light)"}`,
                                        maxWidth: '180px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        opacity: 0.8,
                                    }}
                                >
                                    <span style={{ fontWeight: 600 }}>ตอบกลับ</span>
                                    <span className="ms-1" style={{ opacity: 0.8 }}>
                                        {msg.reply_preview_text || (msg.reply_preview_image ? "📷 รูปภาพ" : "ข้อความ")}
                                    </span>
                                </div>
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
                                <img src={msg.image} alt="upload" style={{ maxWidth: "180px", maxHeight: "180px", borderRadius: "8px", display: "block", cursor: "pointer" }} onClick={() => window.open(msg.image, "_blank")} />
                            ) : isLineEmojiOnly(msg.text) ? (
                                <span style={{ lineHeight: 1.2 }}>{renderTextWithLineEmoji(msg.text, 36)}</span>
                            ) : isEmojiOnly(msg.text) ? (
                                <span style={{ fontSize: "28px", letterSpacing: "2px", lineHeight: 1.2 }}>{msg.text}</span>
                            ) : (
                                <div className="bubble" style={{ whiteSpace: "pre-wrap" }}>{hasLineEmoji(msg.text) ? renderTextWithLineEmoji(msg.text) : msg.text}</div>
                            )}


                        </div>
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

            {/* Global Context Menu in MiniChatPanel */}
            {contextMenu && (
                <>
                    <div
                        style={{ position: 'absolute', inset: 0, zIndex: 999 }}
                        onClick={(e) => { e.stopPropagation(); setContextMenu(null); }}
                        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu(null); }}
                    />
                    <div
                        className="shadow-sm border"
                        style={{
                            position: 'fixed',
                            top: contextMenu.y,
                            left: contextMenu.x,
                            backgroundColor: 'var(--bg-surface)',
                            borderRadius: '12px',
                            padding: '6px 0',
                            zIndex: 1000,
                            minWidth: '150px',
                        }}
                    >
                        <button
                            className="dropdown-item px-3 py-2 d-flex align-items-center justify-content-between"
                            style={{ fontSize: '0.85rem' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setReplyTo({
                                    id: contextMenu.msg.id,
                                    preview_text: contextMenu.msg.message_type === 'text' ? contextMenu.msg.text : null,
                                    preview_image: contextMenu.msg.message_type === 'image' ? contextMenu.msg.image : null
                                });
                                setContextMenu(null);
                                inputRef.current?.focus();
                            }}
                        >
                            <span>ตอบกลับข้อความ</span>
                            <i className="bi bi-reply-fill"></i>
                        </button>
                    </div>
                </>
            )}

            {/* Hidden file input */}
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

            {/* Input Form with Preview */}
            {pastedImage && (
                <div className="image-picker-panel" style={{ border: 'none', borderTop: '1px solid var(--border-medium)', background: 'var(--bg-card)' }}>
                    <div className="image-picker-header" style={{ padding: '6px 12px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>1 รูปที่เลือก</span>
                    </div>
                    <div className="image-picker-grid" style={{ padding: '8px 12px' }}>
                        <div className="image-picker-thumb selected" style={{ width: '70px', height: '70px', cursor: 'default' }}>
                            <img src={pastedImage.previewUrl} alt="preview" />
                            <div className="image-picker-check" style={{ width: '18px', height: '18px', top: '3px', right: '3px' }}>
                                <i className="bi bi-check-lg" style={{ fontSize: '10px' }}></i>
                            </div>
                            <button
                                type="button"
                                className="image-picker-remove"
                                onClick={() => setPastedImage(null)}
                                style={{ width: '18px', height: '18px', bottom: '3px', right: '3px' }}
                            >
                                <i className="bi bi-x" style={{ fontSize: '12px' }}></i>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reply Preview Box */}
            {replyTo && (
                <div className="reply-preview-bar d-flex align-items-center justify-content-between p-2" style={{ backgroundColor: "var(--bg-surface)", borderTop: "1px solid var(--border-medium)" }}>
                    <div className="d-flex flex-column" style={{ fontSize: "0.75rem", color: "var(--text-secondary)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                        <span style={{ fontWeight: "600", color: "var(--primary-color)" }}>กำลังตอบกลับ</span>
                        <span>{replyTo.preview_text || (replyTo.preview_image ? "📷 รูปภาพ" : "ข้อความ")}</span>
                    </div>
                    <button type="button" className="btn-close ms-2" style={{ fontSize: "0.5rem" }} onClick={() => setReplyTo(null)}></button>
                </div>
            )}

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
                    id={`chat-input-${customer.id}`}
                    ref={inputRef}
                    type="text"
                    placeholder="พิมพ์ข้อความ..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onPaste={handlePaste}
                    onKeyDown={(e) => {
                        if (e.key === "Tab") {
                            e.preventDefault();
                            const inputs = Array.from(document.querySelectorAll('input[id^="chat-input-"]'));
                            if (inputs.length <= 1) return;

                            // Sort inputs purely by their visual coordinates (Top-to-Bottom, Left-to-Right)
                            inputs.sort((a, b) => {
                                const rectA = a.getBoundingClientRect();
                                const rectB = b.getBoundingClientRect();
                                // If they are roughly on the same row, sort horizontally
                                if (Math.abs(rectA.top - rectB.top) < 50) {
                                    return rectA.left - rectB.left;
                                }
                                // Otherwise sort vertically
                                return rectA.top - rectB.top;
                            });

                            const currentIndex = inputs.findIndex(input => input.id === `chat-input-${customer.id}`);
                            if (currentIndex !== -1) {
                                let nextIndex = currentIndex + (e.shiftKey ? -1 : 1);
                                if (nextIndex >= inputs.length) nextIndex = 0;
                                if (nextIndex < 0) nextIndex = inputs.length - 1;

                                inputs[nextIndex].focus();

                                // Scroll the selected card into view
                                const targetCustomerId = inputs[nextIndex].id.replace('chat-input-', '');
                                const card = document.getElementById(`allchat-card-${targetCustomerId}`);
                                if (card) {
                                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                            }
                        }
                    }}
                />
            </form>
        </div>
    );
};

// === Main Component ===
const AllChat = () => {
    const navigate = useNavigate();
    const { messages, customers, sendMessage, sendImageMessage, sendCarouselMessage, unreadCounts, markAsRead, STATUS, updateCustomerStatus, updateCustomerAssign } = useChat();

    const [expandedChatIds, setExpandedChatIds] = useState([]);
    const draftRefs = useRef({});
    const focusedNodeRef = useRef(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [openSubMenu, setOpenSubMenu] = useState(null);
    const [cols, setCols] = useState(4);
    const [activeFilter, setActiveFilter] = useState("all");
    const [searchText, setSearchText] = useState("");

    // === New Filter States ===
    const [members, setMembers] = useState([]);
    const [sortOrder, setSortOrder] = useState("latest"); // "latest" | "oldest"
    const [filterAssignee, setFilterAssignee] = useState("all"); // "all" | "unassigned" | emp_id
    const [filterTags, setFilterTags] = useState([]); // เก็บ tag id ที่เลือก

    // === Cascading Filter States ===
    const [allChannels, setAllChannels] = useState([]); // [{ id, platform, channel_name }]
    const [filterPlatform, setFilterPlatform] = useState("all"); // "all" | "line" | "facebook"
    const [filterChannelId, setFilterChannelId] = useState("all"); // "all" | id

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
            } catch (err) { }
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
            .catch(() => { });

        fetch('/api/tags/customers/all', { headers })
            .then(r => r.ok ? r.json() : {})
            .then(data => setCustomerTagsMap(typeof data === 'object' ? data : {}))
            .catch(() => { });

        // Fetch all active channels for filtering
        fetch('/api/channels', { headers })
            .then(r => r.ok ? r.json() : { data: [] })
            .then(res => setAllChannels(Array.isArray(res?.data) ? res.data : []))
            .catch(() => { });
    }, []);


    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
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

    // === Get last message time for a customer (For display) ===
    const getLastMsgTime = useCallback((customerId) => {
        const msgs = messages[customerId];
        if (!msgs || msgs.length === 0) return 0;
        const timeStr = msgs[msgs.length - 1].created_at;
        return timeStr ? new Date(timeStr).getTime() : 0;
    }, [messages]);

    // === Get last message time for SORTING (Only consider customer's own messages so our replies don't make them jump to top) ===
    const getSortMsgTime = useCallback((customerId) => {
        const msgs = messages[customerId];
        if (!msgs || msgs.length === 0) return 0;

        for (let i = msgs.length - 1; i >= 0; i--) {
            if (msgs[i].sender !== "own") {
                return msgs[i].created_at ? new Date(msgs[i].created_at).getTime() : 0;
            }
        }
        // Fallback to first message
        const fallbackTime = msgs[0].created_at;
        return fallbackTime ? new Date(fallbackTime).getTime() : 0;
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

            // 4. Platform Filter
            if (filterPlatform !== "all" && c.platform !== filterPlatform) return false;

            // 5. Shop (Channel) Filter
            if (filterChannelId !== "all" && c.channel_id !== Number(filterChannelId)) return false;

            // 6. Search text
            if (searchText) {
                const q = searchText.toLowerCase();
                return c.name.toLowerCase().includes(q) || (c.last && c.last.toLowerCase().includes(q));
            }
            return true;
        }).sort((a, b) => {
            // 7. Sorting (using getSortMsgTime so replying doesn't jump the chat)
            const timeA = getSortMsgTime(a.id);
            const timeB = getSortMsgTime(b.id);
            return sortOrder === "latest" ? timeB - timeA : timeA - timeB;
        });
    }, [customers, activeFilter, filterAssignee, filterTags, filterPlatform, filterChannelId, searchText, sortOrder, getSortMsgTime, STATUS, customerTagsMap]);

    // === Count per status (for tab badges) ===
    const statusCounts = {
        all: customers.length,
        not_started: customers.filter((c) => c.status === STATUS.NOT_STARTED).length,
        in_progress: customers.filter((c) => c.status === STATUS.IN_PROGRESS).length,
        done: customers.filter((c) => c.status === STATUS.DONE).length,
    };

    const handleContextMenu = useCallback((e, customer) => {
        e.preventDefault();

        // คำนวณพิกัดเพื่อไม่ให้เมนูหลุดจอ
        const menuWidth = 160;
        const menuHeight = 150;
        let x = e.clientX;
        let y = e.clientY;

        if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
        if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10;

        setContextMenu({
            mouseX: x,
            mouseY: y,
            customer: customer
        });
        setOpenSubMenu(null);
    }, []);

    const handleToggleContextTag = useCallback(async (customerId, tagId) => {
        const token = sessionStorage.getItem("token");
        try {
            const currentTags = customerTagsMap[customerId] || [];
            const hasTag = currentTags.some((t) => t.id === tagId);

            if (hasTag) {
                await fetch(`/api/tags/customer/${customerId}/${tagId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCustomerTagsMap(prev => ({
                    ...prev,
                    [customerId]: prev[customerId].filter(t => t.id !== tagId)
                }));
            } else {
                const selectedTag = globalTags.find(t => t.id === tagId);
                if (selectedTag) {
                    await fetch(`/api/tags/customer/${customerId}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ text: selectedTag.text, color: selectedTag.color })
                    });
                    setCustomerTagsMap(prev => ({
                        ...prev,
                        [customerId]: [...(prev[customerId] || []), selectedTag]
                    }));
                }
            }
        } catch (err) {
            console.error("Context Tag Error:", err);
        }
    }, [customerTagsMap, globalTags]);

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
        (customerId, text, replyTo = null) => {
            sendMessage(customerId, text, replyTo);
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
                onContextMenu={(e) => handleContextMenu(e, customer)}
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
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#06C755"><path d="M12 2C6.48 2 2 5.88 2 10.54c0 4.24 3.76 7.78 8.84 8.44.34.07.81.22.93.52.1.27.07.68.03.95l-.15.91c-.05.27-.22 1.06.93.58s6.19-3.65 8.44-6.25C22.97 13.42 22 12.06 22 10.54 22 5.88 17.52 2 12 2z" /></svg>
                                ) : (
                                    <i className="bi bi-messenger" style={{ color: "#0084FF", fontSize: "12px" }}></i>
                                )}
                                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {customer.channel_name || customer.app}
                                </span>
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

                        {/* Dropdown กรองช่องทางหลัก */}
                        <Dropdown onSelect={(val) => { setFilterPlatform(val); setFilterChannelId("all"); }}>
                            <Dropdown.Toggle as="div" className="nav-search shadow-none pointer">
                                <i className={`bi bi-${filterPlatform === "line" ? "line" : filterPlatform === "facebook" ? "messenger" : "grid"} me-1`}></i>
                                {filterPlatform === "all" ? "ทุกช่องทาง" : filterPlatform === "line" ? "LINE OA" : "Messenger"}
                                <i className="bi bi-chevron-down ms-1" style={{ fontSize: "10px" }}></i>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="p-2 border-0 shadow-sm rounded-3" style={{ backgroundColor: "var(--bg-main)", border: "1px solid var(--border-light)" }}>
                                <Dropdown.Item eventKey="all" className="rounded"><span style={{ color: "var(--text-main)" }}>ทุกช่องทาง</span></Dropdown.Item>
                                <Dropdown.Item eventKey="line" className="rounded"><span style={{ color: "var(--text-main)" }}>LINE OA</span></Dropdown.Item>
                                <Dropdown.Item eventKey="facebook" className="rounded"><span style={{ color: "var(--text-main)" }}>Messenger</span></Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>

                        {/* Dropdown กรองชื่อร้าน (Cascading) */}
                        <Dropdown onSelect={(val) => setFilterChannelId(val)}>
                            <Dropdown.Toggle as="div" className="nav-search shadow-none pointer">
                                <i className="bi bi-shop me-1"></i>
                                {filterChannelId === "all" ? "ทุกร้าน" : allChannels.find(ch => ch.id === Number(filterChannelId))?.channel_name || "เลือกร้าน"}
                                <i className="bi bi-chevron-down ms-1" style={{ fontSize: "10px" }}></i>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="p-2 border-0 shadow-sm rounded-3" style={{ backgroundColor: "var(--bg-main)", border: "1px solid var(--border-light)", maxHeight: '250px', overflowY: 'auto' }}>
                                <Dropdown.Item eventKey="all" className="rounded"><span style={{ color: "var(--text-main)" }}>ทุกร้าน</span></Dropdown.Item>
                                {allChannels
                                    .filter(ch => filterPlatform === "all" || ch.platform === filterPlatform)
                                    .map(ch => (
                                        <Dropdown.Item key={ch.id} eventKey={ch.id.toString()} className="rounded">
                                            <span style={{ color: "var(--text-main)" }}>{ch.channel_name}</span>
                                        </Dropdown.Item>
                                    ))
                                }
                            </Dropdown.Menu>
                        </Dropdown>

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
                                                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: tag.color, flexShrink: 0 }} />
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
                        <div
                            style={{
                                display: "flex",
                                gap: "1.5rem",
                                alignItems: "flex-start",
                                width: "100%"
                            }}
                        >
                            {Array.from({ length: cols }).map((_, colIndex) => (
                                <div key={`col-${colIndex}`} style={{ flex: 1, minWidth: 0 }}>
                                    {filteredCustomers
                                        .filter((_, i) => i % cols === colIndex)
                                        .map((customer) => {
                                            const isExpanded = expandedChatIds.includes(customer.id);
                                            return (
                                                <div key={customer.id} id={`allchat-card-${customer.id}`} className="w-100 mb-3">
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
                                                                draftRefs={draftRefs}
                                                                focusedNodeRef={focusedNodeRef}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    }
                                </div>
                            ))}
                        </div>
                    )}
                </Container>
            </div>

            {/* Context Menu Overlay */}
            {contextMenu && (
                <div
                    className="allchat-context-menu"
                    style={{
                        position: "fixed",
                        top: contextMenu.mouseY,
                        left: contextMenu.mouseX,
                        zIndex: 9999,
                        backgroundColor: "var(--bg-surface, #ffffff)",
                        border: "1px solid var(--border-medium, #e5e7eb)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        borderRadius: "8px",
                        padding: "4px 0",
                        minWidth: "160px",
                        fontSize: "0.85rem"
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    {/* Status Submenu */}
                    <Dropdown drop="end" className="w-100" show={openSubMenu === 'status'}>
                        <Dropdown.Toggle
                            as="div"
                            className="context-menu-item d-flex justify-content-between align-items-center px-3 py-2"
                            style={{ cursor: "pointer", backgroundColor: openSubMenu === 'status' ? 'var(--bg-hover, #f3f4f6)' : 'transparent', transition: "background-color 0.1s" }}
                            onClick={() => setOpenSubMenu(openSubMenu === 'status' ? null : 'status')}
                        >
                            <span><i className="bi bi-circle-half me-2"></i>สถานะ</span>
                            <i className="bi bi-chevron-right" style={{ fontSize: "10px" }}></i>
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="border-0 shadow-sm" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-medium, #e5e7eb)" }}>
                            {Object.entries(STATUS_STYLE).map(([status, style]) => (
                                <Dropdown.Item
                                    key={status}
                                    onClick={() => {
                                        updateCustomerStatus(contextMenu.customer.id, status);
                                        setContextMenu(null);
                                    }}
                                >
                                    <span style={{ color: style.bg, fontWeight: 500 }}>{status}</span>
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    </Dropdown>

                    {/* Assignee Submenu */}
                    <Dropdown drop="end" className="w-100" show={openSubMenu === 'assignee'}>
                        <Dropdown.Toggle
                            as="div"
                            className="context-menu-item d-flex justify-content-between align-items-center px-3 py-2"
                            style={{ cursor: "pointer", backgroundColor: openSubMenu === 'assignee' ? 'var(--bg-hover, #f3f4f6)' : 'transparent', transition: "background-color 0.1s" }}
                            onClick={() => setOpenSubMenu(openSubMenu === 'assignee' ? null : 'assignee')}
                        >
                            <span><i className="bi bi-person-check me-2"></i>ผู้รับผิดชอบ</span>
                            <i className="bi bi-chevron-right" style={{ fontSize: "10px" }}></i>
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="border-0 shadow-sm" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-medium, #e5e7eb)", maxHeight: "200px", overflowY: "auto" }}>
                            <Dropdown.Item
                                onClick={() => {
                                    updateCustomerAssign(contextMenu.customer.id, null);
                                    setContextMenu(null);
                                }}
                            >
                                <i className="bi bi-dash-circle me-2 text-muted"></i> นำออก
                            </Dropdown.Item>
                            <Dropdown.Divider style={{ borderColor: "var(--border-medium, #e5e7eb)" }} />
                            {members.map((m) => (
                                <Dropdown.Item
                                    key={m.emp_id}
                                    onClick={() => {
                                        updateCustomerAssign(contextMenu.customer.id, m.emp_id);
                                        setContextMenu(null);
                                    }}
                                >
                                    <img src={m.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.username)}`} alt="" style={{ width: "20px", height: "20px", borderRadius: "50%", marginRight: "8px" }} />
                                    {m.username}
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    </Dropdown>

                    {/* Tags Submenu */}
                    <Dropdown drop="end" className="w-100" show={openSubMenu === 'tag'}>
                        <Dropdown.Toggle
                            as="div"
                            className="context-menu-item d-flex justify-content-between align-items-center px-3 py-2"
                            style={{ cursor: "pointer", backgroundColor: openSubMenu === 'tag' ? 'var(--bg-hover, #f3f4f6)' : 'transparent', transition: "background-color 0.1s" }}
                            onClick={() => setOpenSubMenu(openSubMenu === 'tag' ? null : 'tag')}
                        >
                            <span><i className="bi bi-tags me-2"></i>แท็ก</span>
                            <i className="bi bi-chevron-right" style={{ fontSize: "10px" }}></i>
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="border-0 shadow-sm p-2" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-medium, #e5e7eb)", maxHeight: "250px", overflowY: "auto", minWidth: "380px" }}>
                            {globalTags.length === 0 ? (
                                <div className="px-3 py-2 text-muted text-center" style={{ fontSize: "0.8rem" }}>ไม่มีแท็กในระบบ</div>
                            ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
                                    {globalTags.map((t) => {
                                        const cTags = customerTagsMap[contextMenu.customer.id] || [];
                                        const hasTag = cTags.some((ct) => ct.id === t.id);
                                        return (
                                            <div
                                                key={t.id}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleToggleContextTag(contextMenu.customer.id, t.id);
                                                }}
                                                style={{
                                                    cursor: "pointer",
                                                    backgroundColor: hasTag ? t.color : t.color + '1A',
                                                    color: hasTag ? '#fff' : t.color,
                                                    border: `1px solid ${hasTag ? t.color : t.color + '4D'}`,
                                                    borderRadius: "6px",
                                                    padding: "4px 4px",
                                                    fontSize: "0.7rem",
                                                    fontWeight: 600,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    textAlign: "center",
                                                    userSelect: "none",
                                                    transition: "all 0.15s ease"
                                                }}
                                                title={t.text}
                                            >
                                                <span style={{
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    maxWidth: "100%"
                                                }}>
                                                    {t.text}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            )}
        </div>
    );
};

export default AllChat;
