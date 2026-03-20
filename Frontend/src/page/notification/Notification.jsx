import { useState, useEffect, useMemo } from "react";
import { Container, Form, Spinner } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./notification.css";

function NotificationPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterUser, setFilterUser] = useState("");
  const [filterAction, setFilterAction] = useState("");

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
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      // silent fail
    }
  };

  // สร้าง unique lists สำหรับ filter dropdowns
  const uniqueSenders = useMemo(
    () => [...new Set(notifications.map((n) => n.sender_name).filter(Boolean))],
    [notifications]
  );
  const uniqueTypes = useMemo(
    () => [...new Set(notifications.map((n) => n.type).filter(Boolean))],
    [notifications]
  );

  // จัดรูปแบบ type เป็นภาษาไทย
  const typeLabel = (type) => {
    const map = {
      access: "เข้าถึงข้อความ",
      new_msg: "ข้อความใหม่",
      system: "ระบบ",
    };
    return map[type] || type;
  };

  // Filter logic
  const filtered = notifications.filter((item) => {
    const matchUser =
      filterUser === "" || item.sender_name === filterUser;
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
    <Container fluid className="kanit-regular px-5 py-4 mx-4 page-wrap">
      {/* --- Header --- */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 mx-3 mt-3">
        <p className="fs-2 mb-0" style={{ color: "var(--primary-color)" }}>
          Notification
        </p>

        {/* Filters */}
        <div className="d-flex gap-4 align-items-center flex-wrap">
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
                <option key={u} value={u}>{u}</option>
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
                <option key={t} value={t}>{typeLabel(t)}</option>
              ))}
            </Form.Select>
          </div>
        </div>
      </div>

      <hr className="notif-divider" />

      {/* --- Notification List --- */}
      <div className="d-flex flex-column gap-3">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="secondary" />
            <p className="mt-3 text-muted">กำลังโหลดการแจ้งเตือน...</p>
          </div>
        ) : error ? (
          <div className="text-center py-5 text-danger">
            <i className="bi bi-exclamation-triangle display-6 mb-3 d-block"></i>
            <p>{error}</p>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`d-flex align-items-center p-3 notification-card ${!item.is_read ? "unread" : ""}`}
              onClick={() => !item.is_read && handleMarkAsRead(item.id)}
            >
              {/* Avatar */}
              <div className="px-2" style={{ flexShrink: 0, marginRight: "15px" }}>
                {item.sender_avatar ? (
                  <img
                    src={item.sender_avatar}
                    alt="avatar"
                    className="notif-avatar"
                  />
                ) : (
                  <div className="notif-avatar-placeholder">
                    {(item.sender_name || "?").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="py-3 flex-grow-1">
                <div className="notif-text">
                  {item.text}
                </div>
                <div className="notif-date">
                  วันที่ {formatDate(item.created_at)} เวลา {formatTime(item.created_at)}
                </div>
              </div>

              {/* Unread dot */}
              {!item.is_read && (
                <div className="notif-unread-dot"></div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-5" style={{ color: "var(--text-muted)" }}>
            <i className="bi bi-bell-slash display-6 mb-3 d-block"></i>
            ไม่พบการแจ้งเตือน
          </div>
        )}
      </div>
    </Container>
  );
}

export default NotificationPage;
