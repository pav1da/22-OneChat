import { useRef, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useChat } from "../../context/ChatContext";
import ChatList from "./chatlist/ChatList";
import EmojiPicker from "../../components/EmojiPicker";
import TemplatePicker from "../../components/TemplatePicker";
import { Modal } from "react-bootstrap";
import "./chat.css";

// ===== Timestamp helpers =====
const THAI_MONTHS = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
];

/** แปลง timestamp เป็น Date object (รองรับทั้ง ISO string และ MySQL datetime) */
const toDate = (ts) => {
    if (!ts) return null;
    if (ts instanceof Date) return ts;
    // MySQL datetime เช่น "2026-04-10 14:35:00" → เปลี่ยนเป็น ISO
    const str = String(ts).includes("T") ? ts : ts.replace(" ", "T");
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
};

/** Format เวลาเป็น HH:mm (ใช้ local timezone) */
const formatTime = (ts) => {
    const d = toDate(ts);
    if (!d) return "";
    return d.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
};

/** Format วันที่แบบไทย เช่น "10 เม.ย. 2026" */
const formatDateThai = (ts) => {
    const d = toDate(ts);
    if (!d) return "";
    const day = d.getDate();
    const month = THAI_MONTHS[d.getMonth()];
    const year = d.getFullYear() + 543; // พ.ศ.
    return `${day} ${month} ${year}`;
};

/** ตรวจว่า 2 timestamp อยู่คนละวันหรือไม่ */
const isDifferentDay = (ts1, ts2) => {
    const d1 = toDate(ts1);
    const d2 = toDate(ts2);
    if (!d1 || !d2) return true;
    return (
        d1.getFullYear() !== d2.getFullYear() ||
        d1.getMonth() !== d2.getMonth() ||
        d1.getDate() !== d2.getDate()
    );
};

/**
 * ตรวจว่าควรแสดงเวลาหรือไม่
 * — แสดงถ้า: ข้อความสุดท้ายของกลุ่ม หรือ ห่างจากข้อความถัดไป > 1 นาที หรือ sender เปลี่ยน
 */
const shouldShowTime = (currentMsg, nextMsg) => {
    if (!nextMsg) return true; // ข้อความสุดท้าย → แสดงเสมอ
    if (currentMsg.sender !== nextMsg.sender) return true; // sender เปลี่ยน
    const d1 = toDate(currentMsg.created_at);
    const d2 = toDate(nextMsg.created_at);
    if (!d1 || !d2) return true;
    return Math.abs(d2 - d1) > 60 * 1000; // ห่างกัน > 1 นาที
};

/**
 * ตรวจว่าข้อความนี้เป็นข้อความ "แรก" ของกลุ่มหรือไม่
 * (sender เปลี่ยน หรือ ห่างจากข้อความก่อนหน้า > 1 นาที)
 */
const isFirstInGroup = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    if (currentMsg.sender !== prevMsg.sender) return true;
    const d1 = toDate(prevMsg.created_at);
    const d2 = toDate(currentMsg.created_at);
    if (!d1 || !d2) return true;
    return Math.abs(d2 - d1) > 60 * 1000;
};

/**
 * ตรวจว่าข้อความนี้เป็นข้อความ "สุดท้าย" ของกลุ่มหรือไม่
 * (เหมือน shouldShowTime — ถ้าข้อความถัดไปเป็นคนละ sender หรือห่าง > 5 นาที)
 */
const isLastInGroup = (currentMsg, nextMsg) =>
    shouldShowTime(currentMsg, nextMsg);

const EMOJI_REGEX =
    /^(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji}\u200D\p{Emoji}|\uFE0F|\u200D|\s)+$/u;
const isEmojiOnly = (text) => {
    if (!text || !text.trim()) return false;
    return EMOJI_REGEX.test(text.trim());
};

// Helper: ตรวจว่าข้อความมี LINE emoji marker หรือไม่
const LINE_EMOJI_PATTERN = /\[line-emoji:([^:]+):([^\]]+)\]/g;
const hasLineEmoji = (text) => text && LINE_EMOJI_PATTERN.test(text);

// Helper: ตรวจว่าข้อความเป็น LINE emoji ล้วน (ไม่มีข้อความอื่น)
const isLineEmojiOnly = (text) => {
    if (!text) return false;
    const stripped = text.replace(LINE_EMOJI_PATTERN, "").trim();
    return stripped === "" && LINE_EMOJI_PATTERN.test(text);
};

// Helper: แปลง [line-emoji:productId:emojiId] เป็น <img> และเก็บข้อความปกติ
const renderTextWithLineEmoji = (text, size = 24) => {
    if (!text) return null;
    // Reset regex lastIndex
    const regex = /\[line-emoji:([^:]+):([^\]]+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
        // เพิ่มข้อความก่อนหน้า emoji
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }
        // เพิ่ม emoji image
        const [, productId, emojiId] = match;
        const url = `https://stickershop.line-scdn.net/sticonshop/v1/sticon/${productId}/android/${emojiId}.png`;
        parts.push(
            <img
                key={`${match.index}-${emojiId}`}
                src={url}
                alt="LINE emoji"
                className="line-emoji-inline"
                style={{
                    width: size,
                    height: size,
                    verticalAlign: "middle",
                    display: "inline",
                }}
                loading="lazy"
            />,
        );
        lastIndex = regex.lastIndex;
    }
    // เพิ่มข้อความหลัง emoji ตัวสุดท้าย
    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }
    return parts;
};

const Inbox = ({ currentUser }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const msgRef = useRef(null);
    const endRef = useRef(null);
    const fileInputRef = useRef(null);
    const chatAreaRef = useRef(null);
    const MSG_LIMIT = 50;

    const {
        messages,
        customers: customer,
        sendMessage,
        sendImageMessage,
        sendCarouselMessage,
        updateCustomerStatus,
        updateCustomerName,
        updateCustomerAssign,
        unreadCounts,
        markAsRead,
        STATUS,
    } = useChat();

    const [selectedChatId, setSelectedChatId] = useState(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [sortBy, setSortBy] = useState("latest");
    const [newMessage, setNewMessage] = useState("");

    // Image picker panel state
    const [showImagePanel, setShowImagePanel] = useState(false);
    const [panelFiles, setPanelFiles] = useState([]);
    const [showEmoji, setShowEmoji] = useState(false); // [{ file, url, selected }]
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);

    // Notes state
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState("");
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editingText, setEditingText] = useState("");

    // Members list for "ผู้รับผิดชอบ" dropdown
    const [members, setMembers] = useState([]);

    // Tags state
    const [tagsMap, setTagsMap] = useState({}); // { customerId: [{ id, text, color }] }
    const [allTags, setAllTags] = useState([]); // all unique tags from DB for suggestions
    const [newTagText, setNewTagText] = useState("");
    const [showTagInput, setShowTagInput] = useState(false);
    const TAG_COLORS = [
        "#818cf8", "#f472b6", "#fb923c", "#34d399",
        "#60a5fa", "#a78bfa", "#fbbf24", "#94a3b8",
    ];
    const [selectedTagColor, setSelectedTagColor] = useState(TAG_COLORS[0]);

    // Pagination
    const [visibleCount, setVisibleCount] = useState(50);

    // ---------- Derived state ----------
    const selectedCustomer = customer.find((c) => c.id === selectedChatId);
    const allMessages = messages[selectedChatId] || [];
    const chatMessages = allMessages.slice(-visibleCount);
    const hasMore = allMessages.length > visibleCount;

    // Tag suggestions derived
    const currentTags = tagsMap[selectedChatId] || [];
    const currentTagTexts = currentTags.map((t) => t.text.toLowerCase());

    // Unique tag suggestions from all data
    const tagSuggestions = (() => {
        const query = newTagText.trim().toLowerCase();
        // Collect unique tags from ALL customers
        const uniqueMap = new Map();
        allTags.forEach((t) => {
            const key = t.text.toLowerCase();
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, { text: t.text, color: t.color });
            }
        });
        // Filter: must match query AND not already on this customer
        return [...uniqueMap.values()].filter(
            (t) => {
                const lower = t.text.toLowerCase();
                return (
                    lower.includes(query) &&
                    !currentTagTexts.includes(lower)
                );
            }
        );
    })();

    // Clear image panel + reset pagination + close emoji when switching chats
    useEffect(() => {
        panelFiles.forEach((f) => URL.revokeObjectURL(f.url));
        setPanelFiles([]);
        setShowImagePanel(false);
        setShowEmoji(false);
        setVisibleCount(MSG_LIMIT);
    }, [selectedChatId]);

    // ---------- Sort logic ----------
    const sortedCustomers = [...customer].sort((a, b) => {
        if (sortBy === "latest") return 0;
        if (sortBy === "name_asc") return a.name.localeCompare(b.name);
        if (sortBy === "name_desc") return b.name.localeCompare(a.name);
        return 0;
    });

    const handleSortToggle = () => {
        setSortBy((prev) => {
            if (prev === "latest") return "name_asc";
            if (prev === "name_asc") return "name_desc";
            return "latest";
        });
    };

    // ---------- Status helpers ----------
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

    // ---------- Message handlers ----------
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (showImagePanel && panelFiles.some((f) => f.selected)) {
            handleSendPanelImages();
            return;
        }
        const trimmed = newMessage.trim();
        if (!trimmed || !selectedCustomer) return;

        sendMessage(selectedChatId, trimmed);
        setNewMessage("");
        if (msgRef.current) msgRef.current.style.height = "40px";
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const autoResize = (e) => {
        const el = e.target;
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
    };

    const handleUploadImage = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length || !selectedCustomer) return;
        const newEntries = files.map((file) => ({
            file,
            url: URL.createObjectURL(file),
            selected: true,
        }));
        setPanelFiles((prev) => [...prev, ...newEntries]);
        setShowImagePanel(true);
        e.target.value = "";
    };

    const handleTogglePanelFile = (idx) => {
        setPanelFiles((prev) =>
            prev.map((f, i) => (i === idx ? { ...f, selected: !f.selected } : f)),
        );
    };

    const handleRemovePanelFile = (idx) => {
        setPanelFiles((prev) => {
            URL.revokeObjectURL(prev[idx].url);
            const next = prev.filter((_, i) => i !== idx);
            if (!next.length) setShowImagePanel(false);
            return next;
        });
    };

    const handleSendPanelImages = () => {
        const toSend = panelFiles.filter((f) => f.selected);
        toSend.forEach((f) => sendImageMessage(selectedChatId, f.file));
        panelFiles
            .filter((f) => !f.selected)
            .forEach((f) => URL.revokeObjectURL(f.url));
        setPanelFiles([]);
        setShowImagePanel(false);
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleCloseImagePanel = () => {
        panelFiles.forEach((f) => URL.revokeObjectURL(f.url));
        setPanelFiles([]);
        setShowImagePanel(false);
    };

    // ---------- Chat select ----------
    const handleChatSelect = (id) => {
        setSelectedChatId(id);
        setIsEditingName(false);
        markAsRead(id);
    };

    // ---------- Name editing ----------
    const [editName, setEditName] = useState("");

    const handleStartEditName = () => {
        if (selectedCustomer) {
            setEditName(selectedCustomer.name);
            setIsEditingName(true);
        }
    };

    const handleNameChange = (e) => {
        setEditName(e.target.value);
    };

    const handleNameSave = () => {
        if (!selectedCustomer) return;
        const trimmed = editName.trim();
        if (trimmed) {
            updateCustomerName(selectedCustomer.id, trimmed);
        } else {
            updateCustomerName(selectedCustomer.id, null);
        }
        setIsEditingName(false);
    };

    // ---------- Fetch members for assignment dropdown ----------
    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const token = sessionStorage.getItem("token");
                const res = await fetch("/api/users", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setMembers(data);
                }
            } catch (err) {
                console.error("Error fetching members:", err);
            }
        };
        fetchMembers();
    }, []);

    // ---------- Assignment handler ----------
    const handleAssignChange = (customerId, empId) => {
        const numEmpId = empId ? Number(empId) : null;
        updateCustomerAssign(customerId, numEmpId);
    };

    const getAssignedUser = (customerId) => {
        const cust = customer.find((c) => c.id === customerId);
        if (cust?.assigned_to) {
            const member = members.find((m) => m.emp_id === cust.assigned_to);
            if (member) return { emp_id: member.emp_id, username: member.username };
        }
        return null;
    };

    // ---------- Load ALL tags on mount (for suggestions + chat list) ----------
    useEffect(() => {
        const fetchAllTags = async () => {
            try {
                const res = await fetch("/api/tags", {
                    headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setAllTags(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Fetch all tags error:", err);
            }
        };
        fetchAllTags();
    }, []);

    // ---------- Load tags per customer ----------
    useEffect(() => {
        if (!selectedChatId) return;
        if (tagsMap[selectedChatId]) return;
        const fetchTags = async () => {
            try {
                const res = await fetch(`/api/tags/customer/${selectedChatId}`, {
                    headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setTagsMap((prev) => ({ ...prev, [selectedChatId]: data }));
                }
            } catch (err) {
                console.error("Fetch tags error:", err);
            }
        };
        fetchTags();
    }, [selectedChatId]);

    // ---------- Tag handlers (API-backed) ----------
    const handleAddTag = async (tagText, tagColor, tagId = null) => {
        const text = (tagText || newTagText).trim();
        const color = tagColor || selectedTagColor;
        if (!text || !selectedChatId) return;

        // Duplicate check
        if (currentTagTexts.includes(text.toLowerCase())) return;

        // Reset input ทันที (no wait)
        setNewTagText("");
        setSelectedTagColor(TAG_COLORS[0]);

        if (tagId) {
            // แท็กที่มีอยู่ใน DB — รู้ id จริงแล้ว อัปเดต UI ทันทีแล้วหิง API ตาม
            setTagsMap((prev) => ({
                ...prev,
                [selectedChatId]: [...(prev[selectedChatId] || []), { id: tagId, text, color }],
            }));
            fetch(`/api/tags/customer/${selectedChatId}`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ text, color }),
            }).catch((err) => console.error("Add tag (bg) error:", err));
            return;
        }

        // แท็กใหม่ — ใช้ temp id ครองก่อน แล้วค่อยแทนในเมื่อ API ตอบกลับ
        const tempId = `temp-${Date.now()}`;
        const optimistic = { id: tempId, text, color };
        setTagsMap((prev) => ({
            ...prev,
            [selectedChatId]: [...(prev[selectedChatId] || []), optimistic],
        }));

        try {
            const res = await fetch(`/api/tags/customer/${selectedChatId}`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ text, color }),
            });
            if (res.ok) {
                const data = await res.json();
                const realTag = { id: data.id, text: data.text, color: data.color };
                // แทน temp ด้วย id จริง
                setTagsMap((prev) => ({
                    ...prev,
                    [selectedChatId]: (prev[selectedChatId] || []).map((t) =>
                        t.id === tempId ? realTag : t
                    ),
                }));
                setAllTags((prev) =>
                    prev.some((t) => t.id === data.id) ? prev : [...prev, realTag]
                );
            }
        } catch (err) {
            console.error("Add tag error:", err);
            // Rollback ถ้า API ล้ม
            setTagsMap((prev) => ({
                ...prev,
                [selectedChatId]: (prev[selectedChatId] || []).filter((t) => t.id !== tempId),
            }));
        }
        // ไม่ปิด Modal อัตโนมัติ
    };

    const handleSelectSuggestion = (suggestion) => {
        // ส่ง id จริงเพื่อ optimistic instant update
        handleAddTag(suggestion.text, suggestion.color, suggestion.id);
    };

    const handleRemoveTag = async (index) => {
        if (!selectedChatId) return;
        const tags = tagsMap[selectedChatId] || [];
        const tagToDelete = tags[index];
        if (!tagToDelete) return;

        setTagsMap((prev) => ({
            ...prev,
            [selectedChatId]: (prev[selectedChatId] || []).filter(
                (_, i) => i !== index,
            ),
        }));

        try {
            await fetch(`/api/tags/customer/${selectedChatId}/${tagToDelete.id}`, {
                method: "DELETE",
                headers: getHeaders(),
            });
        } catch (err) {
            console.error("Delete tag error:", err);
        }
    };

    // ---------- Helper: get auth headers ----------
    const getHeaders = () => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
    });

    // ---------- Load notes from API ----------
    useEffect(() => {
        if (!selectedChatId) return;
        const fetchNotes = async () => {
            try {
                const res = await fetch(`/api/notes/${selectedChatId}`, {
                    headers: getHeaders(),
                });
                if (res.ok) {
                    const data = await res.json();
                    setNotes(data.map((n) => ({ ...n, date: new Date(n.created_at) })));
                }
            } catch (err) {
                console.error("Fetch notes error:", err);
            }
        };
        fetchNotes();
    }, [selectedChatId]);

    // ---------- Note handlers (API-backed) ----------
    const handleAddNote = async () => {
        if (!newNote.trim() || !selectedChatId) return;
        const author = currentUser?.username || currentUser?.name || "Admin";

        try {
            const res = await fetch("/api/notes", {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({
                    customer_id: selectedChatId,
                    text: newNote,
                    author,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setNotes([
                    {
                        id: data.id,
                        text: newNote,
                        author,
                        date: new Date(),
                        customer_id: selectedChatId,
                    },
                    ...notes,
                ]);
            }
        } catch (err) {
            console.error("Add note error:", err);
        }
        setNewNote("");
        setIsAddingNote(false);
    };

    const handleDeleteNote = async (id) => {
        setNotes(notes.filter((n) => n.id !== id));
        try {
            await fetch(`/api/notes/${id}`, {
                method: "DELETE",
                headers: getHeaders(),
            });
        } catch (err) {
            console.error("Delete note error:", err);
        }
    };

    const handleEditNote = (note) => {
        setEditingNoteId(note.id);
        setEditingText(note.text);
    };

    const handleSaveEdit = async (id) => {
        if (!editingText.trim()) return;
        setNotes(notes.map((n) => (n.id === id ? { ...n, text: editingText } : n)));
        setEditingNoteId(null);
        setEditingText("");
        try {
            const editedBy = currentUser?.username || currentUser?.name || 'unknown';
            await fetch(`/api/notes/${id}`, {
                method: "PUT",
                headers: getHeaders(),
                body: JSON.stringify({ text: editingText, edited_by: editedBy }),
            });
        } catch (err) {
            console.error("Edit note error:", err);
        }
    };

    const handleCancelEdit = () => {
        setEditingNoteId(null);
        setEditingText("");
    };

    // ---------- Effects ----------
    // Effect 1: กดจาก notification → เปิดแชทของลูกค้าที่ถูกต้อง
    useEffect(() => {
        const cid = location.state?.customerId || location.state?.chatId;
        if (cid) {
            setSelectedChatId(Number(cid));
            // ใช้ replaceState แทน navigate เพื่อไม่ให้ component remount
            window.history.replaceState({}, "", window.location.pathname);
        }
    }, [location.state?.customerId, location.state?.chatId, location.pathname]);

    // Effect 2: โหลดครั้งแรก → เปิดแชทแรก (เฉพาะกรณีที่ยังไม่ได้ select และไม่ได้มาจาก notification)
    useEffect(() => {
        const hasNavState = !!(
            location.state?.customerId || location.state?.chatId
        );
        if (customer.length > 0 && selectedChatId === null && !hasNavState) {
            setSelectedChatId(customer[0].id);
        }
    }, [customer.length, selectedChatId]);

    // Scroll to latest message
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, selectedChatId]);

    // ---------- Render ----------
    return (
        <div className="kanit-regular inbox-container px-2">
            {/* ========== LEFT — Chat List ========== */}
            <div className="customer-list">
                <div className="search-sort-row">
                    <input placeholder="Search" className="custom-search-input" />
                    <div
                        className="custom-icon-sort"
                        onClick={handleSortToggle}
                        style={{ cursor: "pointer" }}
                    >
                        <i className="bi bi-arrow-down-up"></i>
                    </div>
                </div>

                <div className="list">
                    <ChatList
                        customers={sortedCustomers}
                        selectedChatId={selectedChatId}
                        onChatSelect={handleChatSelect}
                        unreadCounts={unreadCounts}
                        tagsMap={tagsMap}
                        members={members}
                    />
                </div>
            </div>

            {/* ========== CENTER — Chat Area ========== */}
            <div className="chat-section">
                {/* Top bar */}
                <div className="d-flex gap-3 custom-top-chat">
                    <div className="d-flex gap-3 align-items-center">
                        {selectedCustomer && (
                            <>
                                <img
                                    src={selectedCustomer.img || undefined}
                                    className="rounded-circle"
                                    style={{ width: "38px", height: "38px", objectFit: "cover" }}
                                    alt={selectedCustomer.name}
                                />
                                <div className="d-flex flex-column">
                                    <span style={{ fontSize: "16px", fontWeight: 500 }}>
                                        {selectedCustomer.name}
                                    </span>
                                    <span
                                        className="d-flex align-items-center gap-1"
                                        style={{ fontSize: "13px", color: "var(--text-secondary)" }}
                                    >
                                        {selectedCustomer.platform === "line" ? (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#06C755"><path d="M12 2C6.48 2 2 5.88 2 10.54c0 4.24 3.76 7.78 8.84 8.44.34.07.81.22.93.52.1.27.07.68.03.95l-.15.91c-.05.27-.22 1.06.93.58s6.19-3.65 8.44-6.25C22.97 13.42 22 12.06 22 10.54 22 5.88 17.52 2 12 2z" /></svg>
                                        ) : selectedCustomer.platform ? (
                                            <i className="bi bi-messenger" style={{ color: "#0084FF", fontSize: "13px" }}></i>
                                        ) : null}
                                        {selectedCustomer.channel_name || selectedCustomer.app}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    {selectedCustomer && (
                        <div className="d-flex gap-3 align-items-center">
                            <select
                                className={`status-select status-${getStatusVariant(selectedCustomer.status)}`}
                                value={selectedCustomer.status}
                                onChange={(e) =>
                                    updateCustomerStatus(selectedCustomer.id, e.target.value)
                                }
                            >
                                {Object.values(STATUS).map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                            <button className="icon-btn" aria-label="more-options">
                                <i className="bi bi-three-dots-vertical fs-5"></i>
                            </button>
                        </div>
                    )}
                </div>

                {/* Messages */}
                <div
                    ref={chatAreaRef}
                    className="flex-grow-1 overflow-y-auto d-flex flex-column chat-messages-area"
                    onScroll={(e) => {
                        if (e.currentTarget.scrollTop === 0 && hasMore) {
                            const prev = e.currentTarget.scrollHeight;
                            setVisibleCount((c) => c + MSG_LIMIT);
                            requestAnimationFrame(() => {
                                const next = chatAreaRef.current?.scrollHeight || 0;
                                chatAreaRef.current?.scrollBy({ top: next - prev });
                            });
                        }
                    }}
                >
                    {hasMore && (
                        <div className="text-center py-2">
                            <button
                                className="icon-btn px-3"
                                style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                                onClick={() => {
                                    const prev = chatAreaRef.current?.scrollHeight || 0;
                                    setVisibleCount((c) => c + MSG_LIMIT);
                                    requestAnimationFrame(() => {
                                        const next = chatAreaRef.current?.scrollHeight || 0;
                                        chatAreaRef.current?.scrollBy({ top: next - prev });
                                    });
                                }}
                            >
                                โหลดข้อความเก่า
                            </button>
                        </div>
                    )}
                    {chatMessages.map((msg, idx) => {
                        const prevMsg = idx > 0 ? chatMessages[idx - 1] : null;
                        const nextMsg =
                            idx < chatMessages.length - 1 ? chatMessages[idx + 1] : null;
                        const showDayDivider =
                            !prevMsg || isDifferentDay(prevMsg.created_at, msg.created_at);
                        const showTime = shouldShowTime(msg, nextMsg);
                        const timeStr = formatTime(msg.created_at);
                        const firstInGroup = showDayDivider || isFirstInGroup(msg, prevMsg);
                        const lastInGroup = isLastInGroup(msg, nextMsg);
                        // แสดง avatar เฉพาะข้อความสุดท้ายของกลุ่ม (แบบ LINE)
                        const showAvatar = lastInGroup;

                        // CSS class สำหรับจัด spacing
                        const wrapperCls = [
                            "msg-wrapper",
                            !firstInGroup ? "msg-grouped" : "",
                            lastInGroup ? "msg-group-last" : "",
                        ]
                            .filter(Boolean)
                            .join(" ");

                        return (
                            <div key={msg.id} className={wrapperCls}>
                                {/* Day divider */}
                                {showDayDivider && msg.created_at && (
                                    <div className="day-divider">
                                        <span className="day-divider-label">
                                            {formatDateThai(msg.created_at)}
                                        </span>
                                    </div>
                                )}

                                <div className={`message ${msg.sender === "own" ? "own" : ""}`}>
                                    {/* Customer avatar หรือ spacer */}
                                    {msg.sender === "customer" &&
                                        (showAvatar ? (
                                            <img
                                                src={selectedCustomer?.img || undefined}
                                                alt="Customer"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        ) : (
                                            <div className="avatar-spacer" />
                                        ))}

                                    {/* Timestamp ฝั่งซ้ายของ bubble (สำหรับ own) */}
                                    {msg.sender === "own" && showTime && timeStr && (
                                        <span className="msg-time msg-time-left">{timeStr}</span>
                                    )}

                                    {msg.message_type === "carousel" ? (
                                        <div className="chat-carousel-wrapper" style={{
                                            display: 'flex',
                                            overflowX: 'auto',
                                            gap: '10px',
                                            maxWidth: '340px',
                                            paddingBottom: '8px',
                                            scrollbarWidth: 'none'
                                        }}>
                                            {(() => {
                                                try {
                                                    const cards = JSON.parse(msg.text);
                                                    return cards.map((c, i) => (
                                                        <div key={i} className="carousel-card" style={{
                                                            flex: '0 0 300px',
                                                            backgroundColor: 'var(--bg-surface)',
                                                            borderRadius: '16px',
                                                            overflow: 'hidden',
                                                            boxShadow: '0 2px 12px rgba(0,0,0,0.12)'
                                                        }}>
                                                            {c.isEndCard ? (
                                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
                                                                    <span style={{ color: '#42659a', fontWeight: '500', fontSize: '1.1rem' }}>{c.message || "ดูเพิ่มเติม"}</span>
                                                                </div>
                                                            ) : (
                                                                <div style={{ position: 'relative', width: '300px', height: '300px' }}>
                                                                    {c.image && (
                                                                        <img src={c.image} alt="carousel-card" style={{
                                                                            width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', display: 'block'
                                                                        }} onClick={() => window.open(c.image, "_blank")} />
                                                                    )}
                                                                    {c.tag && (
                                                                        <div style={{ position: 'absolute', top: '14px', left: '14px', backgroundColor: 'rgba(0,0,0,0.55)', color: 'white', padding: '4px 14px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                                                            {c.tag}
                                                                        </div>
                                                                    )}
                                                                    {c.message && (
                                                                        <div style={{ position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(0,0,0,0.65)', color: 'white', padding: '6px 18px', borderRadius: '20px', fontSize: '0.95rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                                                            {c.message}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ));
                                                } catch (e) { return <span>Invalid Carousel Data</span>; }
                                            })()}
                                        </div>
                                    ) : msg.message_type === "sticker" ? (
                                        <div className="sticker">
                                            <img
                                                src={msg.image}
                                                alt="sticker"
                                                loading="lazy"
                                                decoding="async"
                                                style={{
                                                    width: "100px",
                                                    height: "100px",
                                                    objectFit: "contain",
                                                }}
                                            />
                                        </div>
                                    ) : msg.image ? (
                                        <div className="chat-image">
                                            <img
                                                src={msg.image}
                                                alt="upload"
                                                loading="lazy"
                                                decoding="async"
                                                style={{
                                                    maxWidth: "260px",
                                                    maxHeight: "360px",
                                                    borderRadius: "10px",
                                                    objectFit: "cover",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() => window.open(msg.image, "_blank")}
                                            />
                                        </div>
                                    ) : isLineEmojiOnly(msg.text) && msg.message_type !== 'carousel' ? (
                                        <div className="emoji-only">
                                            <span>{renderTextWithLineEmoji(msg.text, 40)}</span>
                                        </div>
                                    ) : isEmojiOnly(msg.text) && msg.message_type !== 'carousel' ? (
                                        <div className="emoji-only">
                                            <span>{msg.text}</span>
                                        </div>
                                    ) : msg.message_type !== 'carousel' ? (
                                        <div className="texts">
                                            <p className={msg.sender === "own" ? "own" : ""}>
                                                {hasLineEmoji(msg.text)
                                                    ? renderTextWithLineEmoji(msg.text)
                                                    : msg.text}
                                            </p>
                                        </div>
                                    ) : null}

                                    {/* Timestamp ฝั่งขวาของ bubble (สำหรับ customer) */}
                                    {msg.sender === "customer" && showTime && timeStr && (
                                        <span className="msg-time msg-time-right">{timeStr}</span>
                                    )}

                                    {/* Own avatar หรือ spacer */}
                                    {msg.sender === "own" &&
                                        (showAvatar ? (
                                            <img
                                                src={currentUser?.image || undefined}
                                                alt="Admin"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        ) : (
                                            <div className="avatar-spacer" />
                                        ))}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={endRef}></div>
                </div>

                {/* Image picker panel */}
                {showImagePanel && (
                    <div className="image-picker-panel">
                        <div className="image-picker-header">
                            <span>
                                {panelFiles.filter((f) => f.selected).length} รูปที่เลือก
                            </span>
                            <div className="d-flex gap-2">
                                <button
                                    className="icon-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                    title="เพิ่มรูป"
                                >
                                    <i className="bi bi-plus-lg"></i>
                                </button>
                                <button
                                    className="icon-btn"
                                    onClick={handleCloseImagePanel}
                                    title="ปิด"
                                >
                                    <i className="bi bi-x-lg"></i>
                                </button>
                            </div>
                        </div>

                        <div className="image-picker-grid">
                            {panelFiles.map((f, idx) => (
                                <div
                                    key={idx}
                                    className={`image-picker-thumb${f.selected ? " selected" : ""}`}
                                    onClick={() => handleTogglePanelFile(idx)}
                                >
                                    <img src={f.url} alt={f.file.name} />
                                    {f.selected && (
                                        <div className="image-picker-check">
                                            <i className="bi bi-check-lg"></i>
                                        </div>
                                    )}
                                    <button
                                        className="image-picker-remove"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemovePanelFile(idx);
                                        }}
                                    >
                                        <i className="bi bi-x"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input bar */}
                <div className="flex-shrink-0 custom-bottom-chat-wrapper">
                    <form onSubmit={handleSendMessage}>
                        <div className="chat-input-container">
                            {/* ช่องพิมพ์ข้อความ */}
                            <textarea
                                rows={1}
                                placeholder='พิมพ์ข้อความ...'
                                ref={msgRef}
                                value={newMessage}
                                onChange={(e) => {
                                    setNewMessage(e.target.value);
                                    autoResize(e);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) handleSendMessage(e);
                                }}
                                onPaste={(e) => {
                                    const items = e.clipboardData?.items;
                                    if (!items) return;
                                    for (let i = 0; i < items.length; i++) {
                                        if (items[i].type.indexOf("image") !== -1) {
                                            e.preventDefault();
                                            const file = items[i].getAsFile();
                                            if (!file || !selectedChatId) return;
                                            const url = URL.createObjectURL(file);
                                            setPanelFiles((prev) => [...prev, { file, url, selected: true }]);
                                            setShowImagePanel(true);
                                            return;
                                        }
                                    }
                                }}
                                className="chat-textarea"
                            />

                            {/* แถบเครื่องมือด้านล่าง */}
                            <div className="chat-toolbar">
                                <div
                                    className="chat-toolbar-left"
                                    style={{ position: "relative" }}
                                >
                                    {/* ไอคอนแนบไฟล์ / รูปภาพ */}
                                    <button
                                        type="button"
                                        className={`icon-btn${showImagePanel ? " active" : ""}`}
                                        aria-label="picture"
                                        title="Picture"
                                        onClick={() =>
                                            showImagePanel
                                                ? handleCloseImagePanel()
                                                : fileInputRef.current?.click()
                                        }
                                    >
                                        <i className="bi bi-image fs-5"></i>
                                    </button>

                                    {/* ไอคอน Emoji */}
                                    <button
                                        type="button"
                                        className={`icon-btn${showEmoji ? " active" : ""}`}
                                        aria-label="emoji"
                                        onClick={() => setShowEmoji((v) => !v)}
                                        title="Emoji"
                                    >
                                        <i className="bi bi-emoji-smile fs-5"></i>
                                    </button>

                                    {/* กล่องเลือก Emoji */}
                                    {showEmoji && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                bottom: "100%",
                                                left: "0",
                                                zIndex: 100,
                                                marginBottom: "10px",
                                            }}
                                        >
                                            <EmojiPicker
                                                onSelect={(emoji) => {
                                                    setNewMessage((prev) => prev + emoji);
                                                    msgRef.current?.focus();
                                                }}
                                                onClose={() => setShowEmoji(false)}
                                            />
                                        </div>
                                    )}

                                    {/* ไอคอน Template / Saved Replies */}
                                    <button
                                        type="button"
                                        className={`icon-btn${showTemplatePicker ? " active" : ""}`}
                                        aria-label="template"
                                        title="Template"
                                        onClick={() => setShowTemplatePicker((v) => !v)}
                                    >
                                        <i className="bi bi-window fs-5"></i>
                                    </button>

                                    {/* Template Picker */}
                                    {showTemplatePicker && (
                                        <TemplatePicker
                                            onSelectText={(text) => {
                                                setNewMessage(String(text || ""));
                                                msgRef.current?.focus();
                                            }}
                                            onSelectImage={async (imageUrl) => {
                                                if (!selectedChatId) return;
                                                try {
                                                    let blob;
                                                    if (imageUrl.startsWith("data:")) {
                                                        // base64 → Blob โดยตรงด้วย atob
                                                        const [header, b64] = imageUrl.split(",");
                                                        const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
                                                        const binary = atob(b64);
                                                        const bytes = new Uint8Array(binary.length);
                                                        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                                                        blob = new Blob([bytes], { type: mime });
                                                    } else {
                                                        const res = await fetch(imageUrl);
                                                        blob = await res.blob();
                                                    }
                                                    const ext = blob.type?.split("/")[1] || "jpg";
                                                    const file = new File([blob], `template.${ext}`, { type: blob.type || "image/jpeg" });
                                                    sendImageMessage(selectedChatId, file);
                                                    endRef.current?.scrollIntoView({ behavior: "smooth" });
                                                } catch (err) {
                                                    console.error("Send template image error:", err);
                                                    alert("ส่งรูปไม่ได้: " + err.message);
                                                }
                                            }}
                                            onSelectCarousel={async (cards) => {
                                                if (!selectedChatId) return;
                                                try {
                                                    await sendCarouselMessage(selectedChatId, cards);
                                                    endRef.current?.scrollIntoView({ behavior: "smooth" });
                                                } catch (err) {
                                                    console.error("Send carousel error:", err);
                                                    alert("ส่ง Carousel ไม่สำเร็จ: " + err.message);
                                                }
                                            }}
                                            onClose={() => setShowTemplatePicker(false)}
                                        />
                                    )}

                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        hidden
                                        ref={fileInputRef}
                                        onChange={handleUploadImage}
                                    />
                                </div>

                                <div className="chat-toolbar-right">
                                    {/* ปุ่มส่งข้อความ */}
                                    <button
                                        type="submit"
                                        className="icon-btn send-btn"
                                        aria-label="send"
                                        // ปิดปุ่มส่งถ้าไม่มีข้อความและไม่ได้เลือกรูป
                                        disabled={
                                            !newMessage.trim() &&
                                            panelFiles.filter((f) => f.selected).length === 0
                                        }
                                    >
                                        <i className="bi bi-send fs-5"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* ========== RIGHT — Detail Panel ========== */}
            <div className="detail-panel">
                {selectedCustomer ? (
                    <>
                        {/* Profile image */}
                        <div className="detail-avatar-wrapper">
                            <img
                                src={selectedCustomer.img || undefined}
                                className="detail-avatar"
                                alt={selectedCustomer.name}
                            />
                        </div>

                        {/* Name (editable) */}
                        <div className="detail-name-section">
                            {isEditingName ? (
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={handleNameChange}
                                    onBlur={handleNameSave}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleNameSave();
                                        }
                                    }}
                                    className="detail-name-input"
                                    autoFocus
                                />
                            ) : (
                                <p className="detail-name" onClick={handleStartEditName}>
                                    {selectedCustomer.name}
                                    <i
                                        className="bi bi-pencil ms-2"
                                        style={{ cursor: "pointer", fontSize: "12px" }}
                                    ></i>
                                </p>
                            )}

                            {selectedCustomer.originalName &&
                                selectedCustomer.originalName !== selectedCustomer.name && (
                                    <p className="detail-original-name">
                                        {selectedCustomer.originalName}
                                    </p>
                                )}
                        </div>

                        {/* Assigned to */}
                        <div className="detail-assigned">
                            <span>ผู้รับผิดชอบ :</span>
                            <div className="detail-assigned-user">
                                <select
                                    className="assign-select"
                                    value={getAssignedUser(selectedChatId)?.emp_id || ""}
                                    onChange={(e) =>
                                        handleAssignChange(selectedChatId, e.target.value)
                                    }
                                >
                                    <option value="">ยังไม่ได้กำหนด</option>
                                    {members.map((m) => (
                                        <option key={m.emp_id} value={m.emp_id}>
                                            {m.username} ({m.role})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Chat Source */}
                        {selectedCustomer.platform && (
                            <div className="w-100 px-2 mt-3">
                                <div className="d-flex align-items-center gap-1 mb-1">
                                    <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>แหล่งที่มา</span>
                                </div>
                                <div
                                    className="d-flex align-items-center gap-2 px-3 py-2 rounded-3"
                                    style={{ backgroundColor: "#f9fafb", border: "1px solid #f3f4f6" }}
                                >
                                    {selectedCustomer.platform === "line" ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#06C755"><path d="M12 2C6.48 2 2 5.88 2 10.54c0 4.24 3.76 7.78 8.84 8.44.34.07.81.22.93.52.1.27.07.68.03.95l-.15.91c-.05.27-.22 1.06.93.58s6.19-3.65 8.44-6.25C22.97 13.42 22 12.06 22 10.54 22 5.88 17.52 2 12 2z" /></svg>
                                    ) : (
                                        <i className="bi bi-messenger" style={{ color: "#0084FF", fontSize: "18px" }}></i>
                                    )}
                                    <div style={{ lineHeight: 1.3 }}>
                                        <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                                            {selectedCustomer.channel_name || selectedCustomer.app}
                                        </div>
                                        <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>
                                            {selectedCustomer.platform === "line" ? "LINE" : "Facebook"} Messaging
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        <div className="tag-section">
                            <div className="tag-section-header">
                                <span className="tag-section-title">แท็ก</span>
                                <button
                                    type="button"
                                    className="tag-add-btn"
                                    onClick={() => setShowTagInput(!showTagInput)}
                                    title={showTagInput ? "ปิด" : "เพิ่มแท็ก"}
                                >
                                    <i className={`bi ${showTagInput ? "bi-x-lg" : "bi-plus"}`}></i>
                                </button>
                            </div>

                            {/* Tag pills */}
                            <div className="tag-pills-wrap">
                                {currentTags.map((tag, idx) => (
                                    <span
                                        key={tag.id || idx}
                                        className="tag-pill"
                                        style={{ backgroundColor: tag.color + "22", color: tag.color, borderColor: tag.color + "44" }}
                                    >
                                        <span className="tag-pill-dot" style={{ backgroundColor: tag.color }}></span>
                                        {tag.text}
                                        <button
                                            type="button"
                                            className="tag-pill-remove"
                                            onClick={() => handleRemoveTag(idx)}
                                            style={{ color: tag.color }}
                                        >
                                            <i className="bi bi-x"></i>
                                        </button>
                                    </span>
                                ))}
                                {currentTags.length === 0 && !showTagInput && (
                                    <span className="tag-empty-hint">ยังไม่มีแท็ก กด + เพื่อเพิ่ม</span>
                                )}
                            </div>

                            {/* Add tag form Modal */}
                            <Modal 
                                show={showTagInput} 
                                onHide={() => {
                                    setShowTagInput(false);
                                    setNewTagText("");
                                }} 
                                centered 
                                className="kanit-regular"
                                contentClassName="border-0 shadow-lg rounded-4"
                            >
                                <Modal.Header closeButton className="border-bottom-0 pb-0">
                                    <div className="w-100 text-center">
                                        <h6 className="m-0 fw-semibold" style={{ color: "var(--text-main)" }}>แก้ไขแท็ก</h6>
                                    </div>
                                </Modal.Header>
                                <Modal.Body className="px-4 py-3">
                                    {/* แท็กของแชทนี้ (ลบจากตรงนี้ได้เลย) */}
                                    {currentTags.length > 0 && (
                                        <div className="mb-3 d-flex flex-wrap gap-2">
                                            {currentTags.map((tag, idx) => (
                                                <span
                                                    key={tag.id || idx}
                                                    className="px-2 py-1 rounded-pill d-flex align-items-center gap-1"
                                                    style={{ backgroundColor: tag.color + "15", color: tag.color, border: `1px solid ${tag.color}40`, fontSize: "0.85rem", fontWeight: 500 }}
                                                >
                                                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: tag.color }}></span>
                                                    {tag.text}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveTag(idx)}
                                                        className="btn btn-link p-0 ms-1 d-flex"
                                                        style={{ color: tag.color, textDecoration: "none" }}
                                                    >
                                                        <i className="bi bi-x" style={{ fontSize: "1rem" }}></i>
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* ช่องค้นหา/เพิ่ม */}
                                    <div className="position-relative mb-3">
                                        <i className="bi bi-search position-absolute text-muted" style={{ left: "14px", top: "50%", transform: "translateY(-50%)" }}></i>
                                        <input
                                            type="text"
                                            className="form-control bg-light border-0"
                                            placeholder="ค้นหาหรือสร้างแท็กใหม่..."
                                            value={newTagText}
                                            onChange={(e) => setNewTagText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    if (newTagText.trim() && !currentTagTexts.includes(newTagText.trim().toLowerCase())) {
                                                        handleAddTag();
                                                    }
                                                }
                                            }}
                                            style={{ paddingLeft: "38px", borderRadius: "10px", fontSize: "0.9rem", boxShadow: "none" }}
                                            autoFocus
                                        />
                                    </div>

                                    {/* แนะนำแท็ก */}
                                    <div className="mb-3">
                                        {newTagText.trim() && tagSuggestions.length > 0 && (
                                            <>
                                                <div className="text-muted mb-2" style={{ fontSize: "0.75rem", fontWeight: 600 }}>แท็กที่มีอยู่</div>
                                                <div className="d-flex flex-wrap gap-2">
                                                    {tagSuggestions.map((s, i) => (
                                                        <button
                                                            key={i}
                                                            type="button"
                                                            className="btn btn-light px-3 py-1 rounded-pill d-flex align-items-center gap-2"
                                                            style={{ fontSize: "0.85rem", border: "1px solid #f3f4f6", backgroundColor: "#fff" }}
                                                            onClick={() => handleSelectSuggestion(s)}
                                                        >
                                                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: s.color }}></span>
                                                            <span style={{ color: "#374151" }}>{s.text}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        {!newTagText.trim() && tagSuggestions.length > 0 && (
                                            <>
                                                <div className="text-muted mb-2 mt-3" style={{ fontSize: "0.75rem", fontWeight: 600 }}>แท็กทั้งหมด</div>
                                                <div className="d-flex flex-wrap gap-2">
                                                    {tagSuggestions.map((s, i) => (
                                                        <button
                                                            key={i}
                                                            type="button"
                                                            className="btn btn-light px-3 py-1 rounded-pill d-flex align-items-center gap-2"
                                                            style={{ fontSize: "0.85rem", border: "1px solid #f3f4f6", backgroundColor: "#fff" }}
                                                            onClick={() => handleSelectSuggestion(s)}
                                                        >
                                                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: s.color }}></span>
                                                            <span style={{ color: "#374151" }}>{s.text}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* สร้างแท็กใหม่ (เมื่อพิมพ์และไม่เจอที่ซ้ำ) */}
                                    {newTagText.trim() && !tagSuggestions.some(s => s.text.toLowerCase() === newTagText.trim().toLowerCase()) && (
                                        <div className="p-3 bg-light rounded-4 mt-4">
                                            <div className="d-flex align-items-center mb-3">
                                                <span className="me-3 text-muted" style={{ fontSize: "0.8rem", fontWeight: 600 }}>สี:</span>
                                                <ChatTagColorPicker 
                                                    value={selectedTagColor} 
                                                    onChange={setSelectedTagColor} 
                                                    colors={TAG_COLORS} 
                                                />
                                            </div>

                                            <div className="d-grid mt-2">
                                                <button
                                                    type="button"
                                                    className="btn btn-primary rounded-pill py-2"
                                                    onClick={() => handleAddTag()}
                                                    disabled={!newTagText.trim() || currentTagTexts.includes(newTagText.trim().toLowerCase())}
                                                    style={{ fontSize: "0.95rem", fontWeight: 500, backgroundColor: "var(--primary-color)", border: "none" }}
                                                >
                                                    <i className="bi bi-plus-circle me-2"></i> สร้างแท็ก
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </Modal.Body>
                                <Modal.Footer className="border-top-0 pt-0 justify-content-center pb-4">
                                    <button 
                                        className="btn btn-light rounded-pill px-5 py-2" 
                                        style={{ fontSize: "0.95rem", fontWeight: 500, backgroundColor: "#f3f4f6", border: "none", color: "#4b5563" }}
                                        onClick={() => {
                                            setShowTagInput(false);
                                            setNewTagText("");
                                        }}
                                    >
                                        ยกเลิก
                                    </button>
                                </Modal.Footer>
                            </Modal>
                        </div>

                        <hr className="detail-divider" />

                        {/* Notes */}
                        <div className="detail-notes">
                            <div className="detail-notes-header">
                                <div className="d-flex align-items-center gap-2">
                                    <span>โน๊ต</span>
                                    <button
                                        type="button"
                                        className="icon-btn"
                                        onClick={() => navigate("/notes")}
                                        title="ไปหน้าโน๊ตรวม"
                                        style={{ padding: "2px 6px" }}
                                    >
                                        <i
                                            className="bi bi-box-arrow-up-right"
                                            style={{ fontSize: "12px" }}
                                        ></i>
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    className="icon-btn"
                                    onClick={() => setIsAddingNote(!isAddingNote)}
                                >
                                    <i className="bi bi-plus fs-4"></i>
                                </button>
                            </div>

                            {isAddingNote && (
                                <div className="note-form">
                                    <textarea
                                        rows={3}
                                        placeholder="เขียนโน๊ต..."
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        className="note-textarea"
                                    />
                                    <div className="note-form-actions">
                                        <button
                                            type="button"
                                            className="note-btn note-btn-save"
                                            onClick={handleAddNote}
                                        >
                                            บันทึก
                                        </button>
                                        <button
                                            type="button"
                                            className="note-btn note-btn-cancel"
                                            onClick={() => {
                                                setIsAddingNote(false);
                                                setNewNote("");
                                            }}
                                        >
                                            ยกเลิก
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="notes-list">
                                {notes.map((note) => (
                                    <div key={note.id} className="note-card">
                                        {editingNoteId === note.id ? (
                                            <div>
                                                <textarea
                                                    rows={3}
                                                    value={editingText}
                                                    onChange={(e) => setEditingText(e.target.value)}
                                                    className="note-textarea"
                                                />
                                                <div className="note-form-actions">
                                                    <button
                                                        type="button"
                                                        className="note-btn note-btn-save"
                                                        onClick={() => handleSaveEdit(note.id)}
                                                    >
                                                        บันทึก
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="note-btn note-btn-cancel"
                                                        onClick={handleCancelEdit}
                                                    >
                                                        ยกเลิก
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="note-text">{note.text}</p>
                                                <div className="note-footer">
                                                    <small className="note-date">
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
                                                    <div className="note-actions">
                                                        <button
                                                            type="button"
                                                            className="icon-btn"
                                                            onClick={() => handleEditNote(note)}
                                                        >
                                                            <i
                                                                className="bi bi-pencil"
                                                                style={{ fontSize: "12px" }}
                                                            ></i>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="icon-btn"
                                                            onClick={() => handleDeleteNote(note.id)}
                                                        >
                                                            <i
                                                                className="bi bi-trash"
                                                                style={{ fontSize: "12px" }}
                                                            ></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="detail-empty">
                        <p>เลือกแชทเพื่อดูข้อมูลลูกค้า</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ------ Component แยกสำหรับเลือกสีเพื่อป้องกันการ Re-render หน้าต่างแชทใหญ่ทั้งหมดเวลาย้ายเมาส์ ------
const ChatTagColorPicker = ({ value, onChange, colors }) => {
    const [localColor, setLocalColor] = useState(value || '#000000');

    // Sync from parent if value changes
    useEffect(() => {
        if (value && value !== localColor) {
            setLocalColor(value);
        }
    }, [value]);

    // Debounce state up to parent to prevent lag
    useEffect(() => {
        const handler = setTimeout(() => {
            if (localColor !== value && /^#[0-9A-Fa-f]{6}$/.test(localColor)) {
                onChange(localColor);
            }
        }, 120); 
        return () => clearTimeout(handler);
    }, [localColor, value, onChange]);

    return (
        <div className="d-flex flex-column gap-3 w-100">
            <div className="d-flex align-items-center gap-3 bg-white p-2 py-3 rounded-3 shadow-sm border border-light" style={{ width: "fit-content" }}>
                <div 
                    className="position-relative shadow-sm d-flex justify-content-center align-items-center" 
                    style={{ 
                        width: '42px', height: '42px', borderRadius: '50%', backgroundColor: localColor, 
                        border: '3px solid white', outline: `2px solid ${localColor?.length === 7 ? localColor : '#ccc'}`,
                        transition: 'all 0.2s',
                    }}
                    title="คลิกเพื่อเลือกสี"
                >
                    <i className="bi bi-palette text-white" style={{ fontSize: '1.2rem', mixBlendMode: 'difference', pointerEvents: "none" }}></i>
                    <input 
                        type="color" 
                        value={localColor?.length === 7 ? localColor : '#000000'} 
                        onChange={(e) => setLocalColor(e.target.value)} 
                        className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                        style={{ cursor: 'pointer' }}
                    />
                </div>
                
                <div style={{ flex: 1, maxWidth: "150px" }}>
                    <div className="input-group input-group-sm shadow-sm" style={{ borderRadius: "8px", overflow: "hidden" }}>
                        <span className="input-group-text bg-light border-end-0 text-muted" style={{ fontSize: "0.8rem", fontWeight: 600 }}>HEX</span>
                        <input
                            type="text"
                            className="form-control border-start-0 ps-0 fw-bold"
                            value={localColor?.toUpperCase() || ""}
                            onChange={(e) => {
                                let val = e.target.value.trim();
                                if (!val.startsWith('#')) val = '#' + val;
                                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                    setLocalColor(val);
                                }
                            }}
                            style={{ boxShadow: "none", fontSize: "0.9rem", color: "#334155" }}
                            maxLength={7}
                        />
                    </div>
                </div>
            </div>

            <div className="d-flex flex-wrap gap-2 px-1">
                {colors.map((c) => (
                    <button
                        key={c}
                        type="button"
                        className="border-0 p-0 shadow-sm"
                        style={{ 
                            width: "30px", height: "30px", borderRadius: "50%", backgroundColor: c,
                            outline: value === c ? `2px solid ${c}` : "none", outlineOffset: "2px",
                            transform: value === c ? "scale(1.15)" : "scale(1)", transition: "transform 0.1s"
                        }}
                        onClick={() => {
                           setLocalColor(c);
                           onChange(c);
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default Inbox;
