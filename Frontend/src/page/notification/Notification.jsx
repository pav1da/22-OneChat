import { useState } from "react";
import { Container, Form, InputGroup } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./notification.css";

// ข้อมูลจำลอง (Mock Data) - เพิ่ม field 'sender' และ 'type' เพื่อให้กรองง่ายขึ้น
const mockNotifications = [
  {
    id: 1,
    avatar: new URL('../../assets/Image/Admins/pav1da.png', import.meta.url).href,
    text: "pav1da ได้เข้าถึงข้อความของ Harumasa บน Facebook : Dew Flower Shop",
    date: "25 ธันวาคม 2560 เวลา 14:40",
    sender: "pav1da", // ใช้สำหรับกรองผู้ใช้
    type: "access", // ใช้สำหรับกรองการกระทำ (access = เข้าถึง)
  },
  {
    id: 2,
    avatar: new URL('../../assets/Image/Customers/Harumasa.png', import.meta.url).href,
    text: "มีข้อความใหม่จาก Harumasa ที่ Facebook: Dew Flower Shop",
    date: "25 ธันวาคม 2560 เวลา 14:30",
    sender: "Harumasa", // ใช้สำหรับกรองผู้ใช้
    type: "new_msg", // ใช้สำหรับกรองการกระทำ (new_msg = ข้อความใหม่)
  },
  {
    id: 3,
    avatar: new URL('../../assets/Image/Customers/JaneDoe.png', import.meta.url).href,
    text: "มีข้อความใหม่จาก Jane Dose ที่ Facebook: Dew Flower Shop",
    date: "25 ธันวาคม 2560 เวลา 12:00",
    sender: "Jane Dose", // ใช้สำหรับกรองผู้ใช้
    type: "new_msg", // ใช้สำหรับกรองการกระทำ
  },
];

function NotificationPage() {
  // State สำหรับตัวกรองทั้ง 3 ตัว
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterAction, setFilterAction] = useState("");

  // --- Logic การกรองข้อมูล ---
  const filteredNotifications = mockNotifications.filter((item) => {
    // 1. กรองจากคำค้นหา (Search) - ค้นหาใน text หรือ date
    const matchSearch =
      item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.date.includes(searchTerm);

    // 2. กรองจากผู้ใช้ (User)
    const matchUser = filterUser === "" || item.sender === filterUser;

    // 3. กรองจากการกระทำ (Action)
    const matchAction = filterAction === "" || item.type === filterAction;

    // ต้องตรงตามเงื่อนไขทั้ง 3 ข้อ
    return matchSearch && matchUser && matchAction;
  });

  return (
    <Container fluid className="kanit-regular px-5 py-4 mx-4 page-wrap">
      {/* --- ส่วนหัว (Header) --- */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 mx-3 mt-3">
        {/* หัวข้อสีส้ม */}
        <p className="fs-2 mb-0" style={{ color: "#F26623" }}>
          Notification
        </p>

        {/* ส่วนเครื่องมือกรอง (Filters & Search) */}
        <div className="d-flex gap-4 align-items-center flex-wrap">
          {/* 2. กรองโดยผู้ใช้ */}
          <div className="d-flex align-items-center gap-2">
            <span
              className="fs-6"
              style={{
                whiteSpace: "nowrap",
              }}
            >
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
              <option value="pav1da">pav1da (แอดมิน)</option>
              <option value="Harumasa">Harumasa</option>
              <option value="Jane Dose">Jane Dose</option>
            </Form.Select>
          </div>

          {/* 3. กรองโดยการกระทำ */}
          <div className="d-flex align-items-center gap-2">
            <span
              className="fs-6"
              style={{
                whiteSpace: "nowrap",
              }}
            >
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
              <option value="access">เข้าถึงข้อความ</option>
              <option value="new_msg">ข้อความใหม่</option>
            </Form.Select>
          </div>
        </div>
      </div>

      <hr style={{ borderTop: "1px solid #444", marginBottom: "25px" }} />

      {/* --- รายการแจ้งเตือน (Notification List) --- */}
      <div className="d-flex flex-column gap-3">
        {/* ใช้ filteredNotifications แทน mockNotifications เดิม */}
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((item) => (
            <div
              key={item.id}
              className="d-flex align-items-center p-3 notification-card"
              style={{
                backgroundColor: "#fff",
                borderRadius: "16px",
                border: "1px solid #c5c5c5",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#EAEBEF";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#fff";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* รูปโปรไฟล์ */}
              <div
                className="px-2"
                style={{ flexShrink: 0, marginRight: "15px" }}
              >
                <img
                  src={item.avatar}
                  alt="avatar"
                  style={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              </div>

              {/* ข้อความ */}
              <div className="py-3 ">
                <div
                  className="fs-5"
                  style={{
                    color: "#000",
                    marginBottom: "4px",
                  }}
                >
                  {item.text}
                </div>
                <div className="fs-6" style={{ color: "#666" }}>
                  วันที่ {item.date}
                </div>
              </div>
            </div>
          ))
        ) : (
          // กรณีไม่พบข้อมูล
          <div className="text-center py-5 text-muted">
            <i className="bi bi-search display-6 mb-3 d-block"></i>
            ไม่พบการแจ้งเตือนที่ค้นหา
          </div>
        )}
      </div>
    </Container>
  );
}

export default NotificationPage;
