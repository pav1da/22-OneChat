import { useState, useEffect, useMemo, useRef } from "react";
import "./TemplatePicker.css";

const TemplatePicker = ({ onSelectText, onSelectImage, onClose }) => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("ทั้งหมด"); // ทั้งหมด | ข้อความ | รูปภาพ
    const [recentUsed, setRecentUsed] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("recentTemplates") || "[]");
        } catch {
            return [];
        }
    });
    const [pinned, setPinned] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("pinnedTemplates") || "[]");
        } catch {
            return [];
        }
    });
    const panelRef = useRef(null);

    // Fetch templates from API (lightweight — no base64 images)
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                setLoading(true);
                const token = sessionStorage.getItem("token");
                const res = await fetch("/api/templates/picker", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : data.data || [];
                    setTemplates(list);
                }
            } catch (err) {
                console.error("Error fetching templates:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTemplates();
    }, []);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    // Filter + search logic
    const filtered = useMemo(() => {
        let list = [...templates];

        // Type filter
        if (filter !== "ทั้งหมด") {
            list = list.filter((t) => t.type === filter);
        }

        // Search
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (t) =>
                    t.name?.toLowerCase().includes(q) ||
                    (t.type === "ข้อความ" &&
                        getTextContent(t)?.toLowerCase().includes(q))
            );
        }

        // Sort: pinned first, then recent, then rest
        list.sort((a, b) => {
            const aPin = pinned.includes(a.id) ? -1 : 0;
            const bPin = pinned.includes(b.id) ? -1 : 0;
            if (aPin !== bPin) return aPin - bPin;
            const aRecent = recentUsed.indexOf(a.id);
            const bRecent = recentUsed.indexOf(b.id);
            if (aRecent !== -1 && bRecent === -1) return -1;
            if (aRecent === -1 && bRecent !== -1) return 1;
            if (aRecent !== -1 && bRecent !== -1) return aRecent - bRecent;
            return 0;
        });

        return list;
    }, [templates, filter, search, pinned, recentUsed]);

    // Extract text content from template content JSON
    function getTextContent(template) {
        try {
            if (!template.content) return "";
            const content =
                typeof template.content === "string"
                    ? JSON.parse(template.content)
                    : template.content;
            if (typeof content === "string") return content;
            // Cardmessage stores text in content.message
            return content?.message || content?.text || content?.body || content?.altText || "";
        } catch {
            return typeof template.content === "string" ? template.content : "";
        }
    }

    // Extract image URL from template
    function getImageUrl(template) {
        try {
            const content =
                typeof template.content === "string"
                    ? JSON.parse(template.content)
                    : template.content;
            if (!content) return null;

            // content.image = string (base64 หรือ URL) — format ใหม่
            if (content.image && typeof content.image === "string" && content.image.length > 0) {
                return content.image;
            }
            // content.images = array — format เก่า ดึงตัวแรก
            if (Array.isArray(content.images) && content.images.length > 0 && content.images[0]) {
                return content.images[0];
            }
            // fallback
            return content?.imageUrl || content?.thumbnailImageUrl || content?.originalContentUrl || content?.url || null;
        } catch {
            return null;
        }
    }

    // Save recent used
    const saveRecent = (templateId) => {
        const updated = [
            templateId,
            ...recentUsed.filter((id) => id !== templateId),
        ].slice(0, 10);
        setRecentUsed(updated);
        localStorage.setItem("recentTemplates", JSON.stringify(updated));
    };

    // Toggle pin
    const togglePin = (templateId, e) => {
        e.stopPropagation();
        const updated = pinned.includes(templateId)
            ? pinned.filter((id) => id !== templateId)
            : [...pinned, templateId];
        setPinned(updated);
        localStorage.setItem("pinnedTemplates", JSON.stringify(updated));
    };

    // Handle select
    const handleSelect = async (template) => {
        saveRecent(template.id);
        if (template.type === "ข้อความ") {
            // ข้อความมีอยู่ใน content แล้ว
            const text = getTextContent(template) || "";
            console.log("[TemplatePicker] text selected:", text.substring(0, 50));
            onSelectText(String(text));
            onClose();
        } else if (template.type === "รูปภาพ") {
            // รูปภาพไม่มี content ใน list → fetch เต็มๆ ตาม ID
            try {
                const token = sessionStorage.getItem("token");
                const res = await fetch(`/api/templates/${template.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const full = data.data || data;
                const imageUrl = getImageUrl(full);
                console.log("[TemplatePicker] image url length:", imageUrl?.length || 0);
                if (imageUrl) {
                    onSelectImage(imageUrl);
                    onClose();
                } else {
                    alert("ไม่พบรูปภาพใน Template นี้");
                }
            } catch (err) {
                console.error("[TemplatePicker] fetch image error:", err);
                alert("โหลดรูปไม่สำเร็จ: " + err.message);
            }
        }
    };

    const FILTERS = ["ทั้งหมด", "ข้อความ", "รูปภาพ"];

    return (
        <div className="tp-overlay">
            <div className="tp-drawer" ref={panelRef}>
                {/* Header */}
                <div className="tp-header">
                    <div className="tp-header-title">
                        <i className="bi bi-window"></i>
                        <span>เลือก Template</span>
                    </div>
                    <button className="tp-close" onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                {/* Search */}
                <div className="tp-search-bar">
                    <i className="bi bi-search tp-search-icon"></i>
                    <input
                        type="text"
                        className="tp-search-input"
                        placeholder="ค้นหา Template..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                    {search && (
                        <button className="tp-search-clear" onClick={() => setSearch("")}>
                            <i className="bi bi-x"></i>
                        </button>
                    )}
                </div>

                {/* Filter tabs */}
                <div className="tp-filter-tabs">
                    {FILTERS.map((f) => (
                        <button
                            key={f}
                            className={`tp-filter-tab${filter === f ? " active" : ""}`}
                            onClick={() => setFilter(f)}
                        >
                            {f === "ข้อความ" && <i className="bi bi-chat-text me-1"></i>}
                            {f === "รูปภาพ" && <i className="bi bi-image me-1"></i>}
                            {f}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="tp-content">
                    {loading ? (
                        <div className="tp-loading">
                            <div className="tp-spinner"></div>
                            <span>กำลังโหลด...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="tp-empty">
                            <i className="bi bi-inbox"></i>
                            <span>ไม่พบ Template</span>
                        </div>
                    ) : (
                        filtered.map((template) => {
                            const isPinned = pinned.includes(template.id);
                            const isRecent = recentUsed.includes(template.id);
                            const isText = template.type === "ข้อความ";
                            const isImage = template.type === "รูปภาพ";

                            return (
                                <div
                                    key={template.id}
                                    className="tp-item"
                                    onClick={() => handleSelect(template)}
                                >
                                    {/* Thumbnail / Icon */}
                                    <div className="tp-item-thumb">
                                        {isImage ? (
                                            getImageUrl(template) ? (
                                                <img
                                                    src={getImageUrl(template)}
                                                    alt={template.name}
                                                    className="tp-thumb-img"
                                                />
                                            ) : (
                                                <div className="tp-thumb-placeholder">
                                                    <i className="bi bi-image"></i>
                                                </div>
                                            )
                                        ) : (
                                            <div className="tp-thumb-text-icon">
                                                <i className="bi bi-chat-text"></i>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="tp-item-info">
                                        <div className="tp-item-name">
                                            {isPinned && (
                                                <i className="bi bi-pin-fill tp-pin-icon"></i>
                                            )}
                                            {isRecent && !isPinned && (
                                                <i className="bi bi-clock-history tp-recent-icon"></i>
                                            )}
                                            {template.name}
                                        </div>
                                        <div className="tp-item-meta">
                                            <span
                                                className={`tp-type-badge ${isText ? "text" : "image"}`}
                                            >
                                                {template.type}
                                            </span>
                                            {isText && (
                                                <span className="tp-item-preview">
                                                    {getTextContent(template)?.substring(0, 60)}
                                                    {getTextContent(template)?.length > 60 ? "..." : ""}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="tp-item-actions">
                                        <button
                                            className={`tp-pin-btn${isPinned ? " active" : ""}`}
                                            onClick={(e) => togglePin(template.id, e)}
                                            title={isPinned ? "เลิกปักหมุด" : "ปักหมุด"}
                                        >
                                            <i
                                                className={`bi ${isPinned ? "bi-pin-fill" : "bi-pin"}`}
                                            ></i>
                                        </button>
                                        {isText ? (
                                            <button
                                                className="tp-send-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelect(template);
                                                }}
                                                title="ใช้ Template"
                                            >
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                        ) : (
                                            <button
                                                className="tp-send-btn image"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelect(template);
                                                }}
                                                title="ส่งรูปทันที"
                                            >
                                                <i className="bi bi-send"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default TemplatePicker;
