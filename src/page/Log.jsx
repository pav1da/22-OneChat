import { useState } from "react";
import { Form } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

// ข้อมูลจำลอง (Mock Data)
const mockLogs = [
  {
    id: 1,
    user: "Ham",
    avatar: "https://i.pravatar.cc/150?img=11",
    action: "ได้สร้าง โน้ต สำหรับ",
    target: "Jane Doe",
    details: "",
    date: "25 ธันวาคม 2560",
    time: "14:30",
  },
  {
    id: 2,
    user: "pav1da",
    avatar: "/src/assets/Image/Admins/pav1da.png", 
    action: "เป็น ผู้รับผิดชอบ สำหรับ",
    target: "Harumasa",
    details: "ที่ Facebook : Dew Flower Shop",
    date: "25 ธันวาคม 2560",
    time: "12:00",
  },
  {
    id: 3,
    user: "Pheem",
    avatar: "https://i.pravatar.cc/150?img=8",
    action: "ได้เข้าร่วมทีม",
    target: "Facebook",
    details: "",
    date: "1 ธันวาคม 2560",
    time: "16:25",
  },
  {
    id: 4,
    user: "pav1da",
    avatar: "/src/assets/Image/Admins/pav1da.png",
    action: "ได้เพิ่ม Pheem ในทีม",
    target: "Facebook",
    details: "",
    date: "1 ธันวาคม 2560",
    time: "16:25",
  },
];

const Log = () => {
  const [filterUser, setFilterUser] = useState("");
  const [filterAction, setFilterAction] = useState("");

  return (
    // 🔴 แก้ไขจุดที่ 1: ปรับ Padding ที่ div หลัก
    // - py-4 : บนล่างห่างระดับ 4
    // - px-5 : ซ้ายขวาห่างระดับ 5 (Bootstrap Standard)
    // - style : เพิ่ม padding ซ้ายขวาเป็น 5% (เพื่อให้เว้นเยอะๆ เหมือนในรูป)
    <div 
      className="kanit-regular h-100 d-flex flex-column bg-white rounded-4 py-4 px-5"
      style={{ paddingLeft: '20px', paddingRight: '6%' }} 
    >
      
      {/* ================= Header Section ================= */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3 pt-2">
        {/* Title */}
        <h2 className="fw-bold mb-0" style={{ color: "#FF7A00" }}>
          ตรวจสอบบันทึก
        </h2>

        {/* Filters */}
        <div className="d-flex flex-column flex-sm-row gap-3">
          {/* Filter by User */}
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold text-nowrap">กรองโดยผู้ใช้ :</span>
            <Form.Select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="bg-light border-0 rounded-3"
              style={{ minWidth: "150px" }}
            >
              <option value="">ค้นหาสมาชิก</option>
              <option value="pav1da">pav1da</option>
              <option value="Ham">Ham</option>
              <option value="Pheem">Pheem</option>
            </Form.Select>
          </div>

          {/* Filter by Action */}
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold text-nowrap">กรองโดยการกระทำ :</span>
            <Form.Select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-light border-0 rounded-3"
              style={{ minWidth: "150px" }}
            >
              <option value="">ค้นหาการกระทำ</option>
              <option value="create">สร้างโน้ต</option>
              <option value="assign">รับผิดชอบ</option>
              <option value="join">เข้าร่วมทีม</option>
            </Form.Select>
          </div>
        </div>
      </div>

      <hr className="mb-4 text-muted" />

      {/* ================= Log List Section ================= */}
      {/* 🔴 แก้ไขจุดที่ 2: ลบ px-2 ออก เพื่อให้ List ยืดเต็มพื้นที่ padding ที่เรากำหนดไว้ข้างบน */}
      <div className="d-flex flex-column gap-3 overflow-auto pb-3">
        {mockLogs.map((log) => (
          <div
            key={log.id}
            className="d-flex align-items-center p-3 rounded-4 w-100"
            style={{
              backgroundColor: "#F8F9FA", 
              border: "1px solid #E9ECEF",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#EAEBEF";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#F8F9FA";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* 1. Avatar */}
            <div className="flex-shrink-0">
              <img
                src={log.avatar}
                alt={log.user}
                className="rounded-circle"
                style={{ width: "55px", height: "55px", objectFit: "cover" }}
              />
            </div>

            {/* 2. Content Info */}
            <div className="flex-grow-1 ms-3">
              <div className="fs-5 text-dark" style={{fontSize: '1.1rem'}}>
                <span className="fw-bold">{log.user}</span> 
                <span className="mx-2">{log.action}</span> 
                <span className="fw-bold">{log.target}</span>
                {log.details && <span className="ms-2 text-secondary">{log.details}</span>}
              </div>

              <div className="text-secondary mt-2 fw-medium" style={{ fontSize: "0.85rem" }}>
                วันที่ {log.date} เวลา {log.time}
              </div>
            </div>

            {/* 3. Icon Chevron */}
            <div className="flex-shrink-0 ms-3">
              <i className="bi bi-chevron-right text-muted fs-5"></i>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Log;