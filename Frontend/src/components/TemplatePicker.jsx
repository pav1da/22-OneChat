import { useState, useEffect, useMemo, useRef } from "react";
import "./TemplatePicker.css";

const TemplatePicker = ({ onSelectText, onSelectImage, onSelectCarousel, onClose }) => {
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
    const [isSubmitting, setIsSubmitting] = useState(false);
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
        try {
            setIsSubmitting(true);
            saveRecent(template.id);
            
            // For images, we MUST fetch the full template to get the base64 string, since /picker strips it out.
            let fullContent = null;
            if (template.type === "รูปภาพ") {
                const token = sessionStorage.getItem("token");
                const res = await fetch(`/api/templates/${template.id}`, { headers: { Authorization: `Bearer ${token}` } });
                if (res.ok) {
                    const fullData = await res.json();
                    if (fullData.data && fullData.data.content) {
                        fullContent = typeof fullData.data.content === "string" ? JSON.parse(fullData.data.content) : fullData.data.content;
                    }
                }
            } else {
                fullContent = typeof template.content === "string" ? JSON.parse(template.content) : template.content;
            }
            
            const contentToUse = fullContent || (typeof template.content === "string" ? JSON.parse(template.content) : template.content) || {};

            if (template.type === "ข้อความ") {
                const text = getTextContent(template) || "";
                onSelectText(String(text));
                onClose();
            } else if (template.type === "รูปภาพ") {
                // Carousel type: multi-card format
                if (contentToUse && contentToUse.type === "carousel" && Array.isArray(contentToUse.cards) && contentToUse.cards.length >= 1) {
                    if (typeof onSelectCarousel === "function") {
                        onSelectCarousel(contentToUse.cards);
                    }
                    onClose();
                } else if (contentToUse && contentToUse.image) {
                    // Single card format (backward compat)
                    if (typeof onSelectCarousel === "function") {
                        const singleCard = {
                            image: contentToUse.image,
                            message: contentToUse.message || "",
                            tag: contentToUse.tag || "",
                            isEndCard: false
                        };
                        onSelectCarousel([singleCard]);
                    }
                    onClose();
                } else {
                    // Fallback for extremely old legacy templates
                    const imageUrl = `/api/templates/${template.id}/image`;
                    if (typeof onSelectImage === "function") {
                        onSelectImage(imageUrl);
                    }
                    onClose();
                }
            }
        } catch (err) {
            console.error("Error formatting template selection:", err);
            setIsSubmitting(false);
        }
    };



    const FILTERS = ["ทั้งหมด", "ข้อความ", "รูปภาพ"];
    const [previewItem, setPreviewItem] = useState(null);

    return (
        <div className="tp-overlay">
            <div className="tp-drawer" ref={panelRef}>
                {/* Header */}
                <div className="tp-header">
                    <div className="tp-header-title">
                        <span>เลือกคอนเทนต์</span>
                    </div>
                    <button className="tp-close" onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                <div className="tp-body">
                    {/* Left Column: List + Search */}
                    <div className="tp-left">
                        {/* Filter tabs (styled as underline tabs in LINE OA but keeping our classes) */}
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

                        {/* Search */}
                        <div className="tp-search-bar">
                            <i className="bi bi-search tp-search-icon"></i>
                            <input
                                type="text"
                                className="tp-search-input"
                                placeholder="ค้นหาด้วยชื่อ..."
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
                                    const isSelected = previewItem && previewItem.id === template.id;

                                    return (
                                        <div
                                            key={template.id}
                                            className={`tp-item${isSelected ? " selected" : ""}`}
                                            onClick={() => setPreviewItem(template)}
                                        >
                                            <div className="tp-item-info">
                                                <div className="tp-item-name">
                                                    {isPinned && <i className="bi bi-star-fill tp-pin-icon"></i>}
                                                    {isRecent && !isPinned && <i className="bi bi-clock-history tp-recent-icon"></i>}
                                                    {template.name}
                                                </div>
                                                <div className="tp-item-meta">
                                                    {isText && (
                                                        <span className="tp-item-preview-text">
                                                            {getTextContent(template)?.substring(0, 40) || template.type}
                                                            {getTextContent(template)?.length > 40 ? "..." : ""}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Action for pin removed from hover to keep it simple, or keep it on right side */}
                                            <div className="tp-item-actions">
                                                <button
                                                    className={`tp-pin-btn${isPinned ? " active" : ""}`}
                                                    onClick={(e) => togglePin(template.id, e)}
                                                >
                                                    <i className={`bi ${isPinned ? "bi-star-fill" : "bi-star"}`}></i>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Column: Preview */}
                    <div className="tp-right">
                        <div className="tp-preview-header">
                            ดูตัวอย่าง
                            <i className="bi bi-question-circle"></i>
                        </div>
                        <div className="tp-preview-container">
                            {!previewItem ? (
                                <div className="tp-preview-empty">เลือกเทมเพลตเพื่อดูตัวอย่าง</div>
                            ) : previewItem.type === "รูปภาพ" ? (() => {
                                let c = {};
                                try { c = typeof previewItem.content === "string" ? JSON.parse(previewItem.content) : (previewItem.content || {}); } catch(e){}
                                return (
                                <div className="tp-preview-image-box" style={{ position: "relative" }}>
                                    <img 
                                        src={`/api/templates/${previewItem.id}/image`} 
                                        alt="preview"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = '<div class="tp-preview-no-image">ไม่มีรูปภาพ</div>';
                                        }}
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                    {c.tag && (
                                        <div style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: 'rgba(0, 0, 0, 0.55)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 500, zIndex: 10 }}>
                                            {c.tag}
                                        </div>
                                    )}
                                    {c.message && (
                                        <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(0, 0, 0, 0.65)', color: 'white', padding: '4px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 500, zIndex: 10, whiteSpace: 'nowrap' }}>
                                            {c.message}
                                        </div>
                                    )}
                                </div>
                            )})() : (
                                <div className="tp-preview-chat-bubble">
                                    <div className="tp-bubble-text">{getTextContent(previewItem)}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="tp-footer">
                    <button className="tp-btn-cancel" onClick={onClose} disabled={isSubmitting}>ยกเลิก</button>
                    <button 
                        className="tp-btn-submit" 
                        disabled={!previewItem || isSubmitting} 
                        onClick={() => handleSelect(previewItem)}
                    >
                        {isSubmitting ? "กำลังโหลด..." : "เลือก"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TemplatePicker;
