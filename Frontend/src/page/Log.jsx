import { useState } from "react";
import { Form } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";
import { mockLogs } from "../data/logData";

const Log = () => {
  const [filterUser, setFilterUser] = useState("");
  const [filterAction, setFilterAction] = useState("");

  return (
    // 🔴 แก้ไขจุดที่ 1: ปรับ Padding ที่ div หลัก
    // - py-4 : บนล่างห่างระดับ 4
    // - px-5 : ซ้ายขวาห่างระดับ 5 (Bootstrap Standard)
    // - style : เพิ่ม padding ซ้ายขวาเป็น 5% (เพื่อให้เว้นเยอะๆ เหมือนในรูป)
    <div
      className="kanit-regular h-100 d-flex flex-column bg-white rounded-4 py-4 px-5 mx-4"
      style={{ paddingLeft: "20px", paddingRight: "6%" }}
    >
      {/* ================= Header Section ================= */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-1 gap-3 pt-4">
        {/* Title */}
        <h2 className="fs-3 mb-0 section-title">ตรวจสอบบันทึก</h2>

        {/* Filters */}
        <div className="d-flex flex-column flex-sm-row gap-4">
          {/* Filter by User */}
          <div className="d-flex align-items-center gap-3">
            <span className="fs-6 text-nowrap">กรองโดยผู้ใช้ :</span>
            <Form.Select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="bg-light border-0 rounded-3"
              style={{ minWidth: "250px" }}
            >
              <option value="">ค้นหาสมาชิก</option>
              <option value="pav1da">pav1da</option>
              <option value="Ham">Ham</option>
              <option value="Pheem">Pheem</option>
            </Form.Select>
          </div>

          {/* Filter by Action */}
          <div className="d-flex align-items-center gap-3">
            <span className="fs-6 text-nowrap">กรองโดยการกระทำ :</span>
            <Form.Select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-light border-0 rounded-3"
              style={{ minWidth: "250px" }}
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
            className="d-flex align-items-center p-3 rounded-4 w-100 log-item"
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
              <div className="fs-5 text-dark" style={{ fontSize: "1.1rem" }}>
                <span className="fs-5">{log.user}</span>
                <span className="mx-2">{log.action}</span>
                <span className="fs-5">{log.target}</span>
                {log.details && (
                  <span className="ms-2 text-secondary">{log.details}</span>
                )}
              </div>

              <div
                className="text-secondary mt-2 fw-medium"
                style={{ fontSize: "0.85rem" }}
              >
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
