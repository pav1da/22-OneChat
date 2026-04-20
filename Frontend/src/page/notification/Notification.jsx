import { useState, useEffect, useMemo } from "react";
import { Container, Form, Spinner } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import "./notification.css";

function NotificationPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [expandedNotifs, setExpandedNotifs] = useState(new Set());
    const [filterUser, setFilterUser] = useState(""); 
    const [allChannels, setAllChannels] = useState([]); // [{ id, platform, channel_name }]
    const [filterPlatform, setFilterPlatform] = useState("all"); // "all" | "line" | "facebook"
    const [filterChannelId, setFilterChannelId] = useState("all"); // "all" | id
    const navigate = useNavigate();

    // ดึง notifications จาก API
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = sessionStorage.getItem("token");
            const res = await fetch("/api/notifications", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลการแจ้งเตือนได้");
            const data = await res.json();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ดึงรายชื่อลูกค้าจากตาราง customer
    const fetchCustomers = async () => {
        try {
            const token = sessionStorage.getItem("token");
            const res = await fetch("/api/customers", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setCustomers(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Fetch customers error:", err);
        }
    };

    const fetchChannels = async () => {
        try {
            const token = sessionStorage.getItem("token");
            const res = await fetch("/api/channels", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const resData = await res.json();
                setAllChannels(Array.isArray(resData?.data) ? resData.data : []);
            }
        } catch (err) {
            console.error("Fetch channels error:", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        fetchCustomers();
        fetchChannels();
        // Auto mark all unread notifications as read when visiting page
        markAllAsRead();
    }, []);

    // Mark all unread notifications as read
    const markAllAsRead = async () => {
        try {
            const token = sessionStorage.getItem("token");
            // Mark all unread notifications via API
            await fetch("/api/notifications/mark-all-read", {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch {
            // silent fail
        }
    };

    // Socket.IO: real-time notification updates
    useEffect(() => {
        const socket = io();

        // Trigger หลัก: ใช้ new-message เพราะทำงาน real-time ได้ปกติ
        // เมื่อลูกค้าส่งข้อความ → รอให้ backend สร้าง notification แล้ว re-fetch
        socket.on("new-message", (msg) => {
            if (msg.sender === "customer") {
                setTimeout(() => fetchNotifications(), 1000);
            }
        });

        // Backup: ฟัง notification events ด้วย
        socket.on("new-notifications", (newNotifs) => {
            const userId = JSON.parse(sessionStorage.getItem("user"))?.emp_id;
            const myNotifs = newNotifs.filter(n => String(n.receiver_id) === String(userId));
            if (myNotifs.length > 0) {
                setNotifications((prev) => [...myNotifs, ...prev]);
            }
        });

        socket.on("update-notifications", (updatedNotifs) => {
            const userId = JSON.parse(sessionStorage.getItem("user"))?.emp_id;
            const myNotifs = updatedNotifs.filter(n => String(n.receiver_id) === String(userId));

            setNotifications((prev) =>
                prev.map((n) => {
                    const updated = myNotifs.find(un => un.id === n.id);
                    return updated || n;
                })
            );
        });

        return () => socket.disconnect();
    }, []);

    // Mark as read
    const handleMarkAsRead = async (id) => {
        try {
            const token = sessionStorage.getItem("token");
            await fetch(`/api/notifications/${id}/read`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
            );
        } catch {
            // silent fail
        }
    };

    // Handle notification click
    const handleNotificationClick = async (notif) => {
        // Mark as read
        if (!notif.is_read) {
            await handleMarkAsRead(notif.id);
        }

        // Navigate to customer chat if it's a customer message
        if (notif.type === "customer_message" && notif.ref_id) {
            navigate("/inbox", { state: { customerId: notif.ref_id } });
        }
    };

    // Toggle expand/collapse
    const toggleExpand = (notifId, e) => {
        e.stopPropagation();
        const newExpanded = new Set(expandedNotifs);
        if (newExpanded.has(notifId)) {
            newExpanded.delete(notifId);
        } else {
            newExpanded.add(notifId);
        }
        setExpandedNotifs(newExpanded);
    };

    // Parse messages array from notification
    const getMessages = (notif) => {
        try {
            const parsed = JSON.parse(notif.text);
            return Array.isArray(parsed) ? parsed : [{ type: "text", content: notif.text }];
        } catch {
            return [{ type: "text", content: notif.text }];
        }
    };

    // Get customer name from ref_id
    const getCustomerName = (notif) => {
        // Try to get from notification or fallback to "ลูกค้า"
        return notif.customer_name || notif.sender_name || "ลูกค้า";
    };

    const uniqueTypes = useMemo(
        () => [...new Set(notifications.map((n) => n.type).filter(Boolean))],
        [notifications],
    );

    // จัดรูปแบบ type เป็นภาษาไทย
    const typeLabel = (type) => {
        const map = {
            access: "เข้าถึงข้อความ",
            new_msg: "ข้อความใหม่",
            customer_message: "ข้อความจากลูกค้า",
            system: "ระบบ",
        };
        return map[type] || type;
    };

    // Filter logic
    const filtered = useMemo(() => {
        return notifications.filter((item) => {
            // 1. กรองโดยผู้ใช้/ลูกค้า (ชื่อ)
            if (filterUser !== "" && item.sender_name !== filterUser && item.customer_name !== filterUser) return false;

            // 2. Platform Filter
            if (filterPlatform !== "all" && item.platform !== filterPlatform) return false;

            // 3. Shop (Channel) Filter
            if (filterChannelId !== "all" && item.channel_id !== Number(filterChannelId)) return false;

            return true;
        });
    }, [notifications, filterUser, filterPlatform, filterChannelId]);

    // จัดรูปแบบวันที่
    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const localDateStr = dateStr.replace(" ", "T");
        const d = new Date(localDateStr);
        return d.toLocaleDateString("th-TH", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return "";
        const localDateStr = dateStr.replace(" ", "T");
        const d = new Date(localDateStr);
        return d.toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="page-wrap kanit-regular pt-3">
            <Container fluid>
                {/* --- Header --- */}
                <div className="d-flex justify-content-end align-items-center mb-3">
                    {/* Filters */}
                    <div className="d-flex flex-column flex-sm-row gap-3">
                        {/* กรองโดยผู้ใช้ */}
                        <div className="d-flex align-items-center gap-2">
                            <span className="text-nowrap" style={{ fontSize: "var(--fs-xs)", color: "#6b7280" }}>
                                ค้นหาลูกค้า:
                            </span>
                            <Form.Select
                                value={filterUser}
                                onChange={(e) => setFilterUser(e.target.value)}
                                className="bg-light border-0 rounded-3 text-muted"
                                style={{ minWidth: "160px", fontSize: "var(--fs-xs)", cursor: "pointer" }}
                            >
                                <option value="">ทั้งหมด</option>
                                {[...new Set(notifications.map(n => n.customer_name || n.sender_name).filter(Boolean))].map((name, idx) => (
                                    <option key={idx} value={name}>{name}</option>
                                ))}
                            </Form.Select>
                        </div>

                        {/* กรองช่องทาง */}
                        <div className="d-flex align-items-center gap-2">
                            <span className="text-nowrap" style={{ fontSize: "var(--fs-xs)", color: "#6b7280" }}>
                                ช่องทาง:
                            </span>
                            <Form.Select
                                value={filterPlatform}
                                onChange={(e) => { setFilterPlatform(e.target.value); setFilterChannelId("all"); }}
                                className="bg-light border-0 rounded-3 text-muted"
                                style={{ minWidth: "140px", fontSize: "var(--fs-xs)", cursor: "pointer" }}
                            >
                                <option value="all">ทุกช่องทาง</option>
                                <option value="line">LINE OA</option>
                                <option value="facebook">Messenger</option>
                            </Form.Select>
                        </div>

                        {/* กรองร้านค้า (Cascading) */}
                        <div className="d-flex align-items-center gap-2">
                            <span className="text-nowrap" style={{ fontSize: "var(--fs-xs)", color: "#6b7280" }}>
                                ร้านค้า:
                            </span>
                            <Form.Select
                                value={filterChannelId}
                                onChange={(e) => setFilterChannelId(e.target.value)}
                                className="bg-light border-0 rounded-3 text-muted"
                                style={{ minWidth: "160px", fontSize: "var(--fs-xs)", cursor: "pointer" }}
                            >
                                <option value="all">ทุกร้าน</option>
                                {allChannels
                                    .filter(ch => filterPlatform === "all" || ch.platform === filterPlatform)
                                    .map(ch => (
                                        <option key={ch.id} value={ch.id}>{ch.channel_name}</option>
                                    ))
                                }
                            </Form.Select>
                        </div>
                    </div>
                </div>
                {/* --- Notification List --- */}
                <div className="d-flex flex-column gap-2">
                    {loading ? (
                        <div className="text-center">
                            <Spinner animation="border" variant="secondary" />
                            <p className="mt-3 text-muted">กำลังโหลดการแจ้งเตือน...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center text-danger">
                            <i className="bi bi-exclamation-triangle display-6 mb-3 d-block"></i>
                            <p>{error}</p>
                        </div>
                    ) : filtered.length > 0 ? (
                        filtered.map((item) => {
                            const messages = getMessages(item);
                            const isExpanded = expandedNotifs.has(item.id);
                            const customerName = getCustomerName(item);
                            const latestMsg = messages[messages.length - 1];

                            return (
                                <div
                                    key={item.id}
                                    className={`notification-card ${!item.is_read ? "unread" : ""}`}
                                    style={{ cursor: "pointer" }}
                                >
                                    {/* Main notification row */}
                                    <div
                                        className="d-flex align-items-center p-3"
                                        onClick={() => handleNotificationClick(item)}
                                    >
                                        {/* Avatar */}
                                        <div
                                            className="px-2"
                                            style={{ flexShrink: 0, marginRight: "15px" }}
                                        >
                                            {item.customer_avatar ? (
                                                <img
                                                    src={item.customer_avatar}
                                                    alt={customerName}
                                                    className="notif-avatar"
                                                    style={{
                                                        width: "48px",
                                                        height: "48px",
                                                        borderRadius: "50%",
                                                        objectFit: "cover"
                                                    }}
                                                />
                                            ) : (
                                                <div className="notif-avatar-placeholder">
                                                    {customerName.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className=" flex-grow-1">
                                            <div className="d-flex align-items-center gap-2">
                                                <span className="fw-bold" style={{ color: "var(--text-main)" }}>{customerName}</span>
                                                {item.platform && (
                                                    <div className="d-flex align-items-center gap-1" style={{ fontSize: "0.7rem", color: "#6b7280", opacity: 0.8 }}>
                                                        {item.platform === "line" ? (
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="#06C755"><path d="M12 2C6.48 2 2 5.88 2 10.54c0 4.24 3.76 7.78 8.84 8.44.34.07.81.22.93.52.1.27.07.68.03.95l-.15.91c-.05.27-.22 1.06.93.58s6.19-3.65 8.44-6.25C22.97 13.42 22 12.06 22 10.54 22 5.88 17.52 2 12 2z" /></svg>
                                                        ) : (
                                                            <i className="bi bi-messenger" style={{ color: "#0084FF", fontSize: "11px" }}></i>
                                                        )}
                                                        <span>{item.shop_name}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="notif-text">
                                                {latestMsg?.content || "ส่งข้อความ"}
                                                {messages.length > 1 && (
                                                    <span className="text-muted ms-2" style={{ fontSize: '0.8rem' }}>
                                                        ({messages.length} ข้อความ)
                                                    </span>
                                                )}
                                            </div>
                                            <div className="notif-date">
                                                {formatDate(item.updated_at || item.created_at)} เวลา{" "}
                                                {formatTime(item.updated_at || item.created_at)}
                                            </div>
                                        </div>

                                        {/* Expand button */}
                                        {messages.length > 1 && (
                                            <button
                                                className="btn btn-sm btn-link text-muted p-0 me-2"
                                                onClick={(e) => toggleExpand(item.id, e)}
                                                style={{ fontSize: "1.2rem" }}
                                            >
                                                <i className={`bi bi-chevron-${isExpanded ? "up" : "down"}`}></i>
                                            </button>
                                        )}

                                        {/* Unread dot */}
                                        {!item.is_read && <div className="notif-unread-dot"></div>}
                                    </div>

                                    {/* Expanded message list */}
                                    {isExpanded && messages.length > 1 && (
                                        <div className="px-3 py-2" style={{ borderTop: "1px solid var(--border-light)" }}>
                                            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                                                {messages.slice().reverse().map((msg, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="py-2 px-3 my-1"
                                                        style={{
                                                            backgroundColor: "var(--bg-hover)",
                                                            borderRadius: "8px",
                                                            fontSize: "0.9rem",
                                                            color: "var(--text-main)"
                                                        }}
                                                    >
                                                        <div className="d-flex align-items-center gap-2">
                                                            {msg.type === "image" && (
                                                                <i className="bi bi-image text-primary"></i>
                                                            )}
                                                            {msg.type === "sticker" && (
                                                                <i className="bi bi-emoji-smile text-warning"></i>
                                                            )}
                                                            <span>{msg.content}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div
                            className="text-center py-5"
                            style={{ color: "var(--text-muted)" }}
                        >
                            <i className="bi bi-bell-slash display-6 mb-3 d-block"></i>
                            ไม่พบการแจ้งเตือน
                        </div>
                    )}
                </div>
            </Container>
        </div>
    );
}

export default NotificationPage;
