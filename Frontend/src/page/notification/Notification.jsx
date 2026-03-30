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
  const [filterUser, setFilterUser] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [expandedNotifs, setExpandedNotifs] = useState(new Set());
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

  useEffect(() => {
    fetchNotifications();
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

  // สร้าง unique lists สำหรับ filter dropdowns
  const uniqueSenders = useMemo(
    () => [...new Set(notifications.map((n) => n.sender_name).filter(Boolean))],
    [notifications],
  );
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
  const filtered = notifications.filter((item) => {
    const matchUser = filterUser === "" || item.sender_name === filterUser;
    const matchAction = filterAction === "" || item.type === filterAction;
    return matchUser && matchAction;
  });

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
    <div style={{ height: 'calc(100vh - 70px)', overflowY: 'auto', paddingBottom: '24px' }}>
    <Container fluid className="kanit-regular px-4">
      {/* --- Header --- */}
      <div className="d-flex justify-content-end align-items-end mb-4">
        {/* Filters */}
        <div className="d-flex gap-4 ">
          {/* กรองโดยผู้ใช้ */}
          <div className="d-flex align-items-center gap-2">
            <span className="fs-6" style={{ whiteSpace: "nowrap" }}>
              กรองโดยผู้ใช้ :
            </span>
            <Form.Select
              size="sm"
              className="custom-filters py-2"
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              style={{ minWidth: "250px", cursor: "pointer" }}
            >
              <option value="">ทั้งหมด</option>
              {uniqueSenders.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Form.Select>
          </div>

          {/* กรองโดยการกระทำ */}
          <div className="d-flex align-items-center gap-2">
            <span className="fs-6" style={{ whiteSpace: "nowrap" }}>
              กรองโดยการกระทำ :
            </span>
            <Form.Select
              size="sm"
              className="custom-filters py-2"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              style={{ minWidth: "250px", cursor: "pointer" }}
            >
              <option value="">ทั้งหมด</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>
                  {typeLabel(t)}
                </option>
              ))}
            </Form.Select>
          </div>

        </div>
      </div>
      {/* --- Notification List --- */}
      <div className="d-flex flex-column gap-3">
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
                  <div className="py-3 flex-grow-1">
                    <div className="fw-bold" style={{ color: "var(--text-main)" }}>{customerName}</div>
                    <div className="notif-text">
                      {latestMsg?.content || "ส่งข้อความ"}
                      {messages.length > 1 && (
                        <span className="text-muted ms-2">
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
                  <div className="px-3 pb-3" style={{ borderTop: "1px solid var(--border-light)" }}>
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
