import React from "react";
import { Row, Col, Card } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

const TokenReport = () => {
  // ข้อมูลจำลอง (Mock Data) สำหรับการแสดงผล
  const totalToken = "11,646,988";

  const summaryStats = [
    { label: "เฉลี่ยต่อวัน", value: "30,122" },
    { label: "ค่าใช้จ่ายเดือนนี้", value: "฿ 1,201" },
    { label: "แนวโน้ม", value: "+ 7.5%" },
  ];

  const breakdownStats = [
    {
      label: "ทั่วไป",
      percent: "48 %",
      value: "1,183,211",
      color: "#8FAAFF", // สีฟ้า
    },
    {
      label: "สนับสนุน",
      percent: "37 %",
      value: "1,183,211",
      color: "#D6B0F5", // สีม่วง
    },
    {
      label: "คำถามที่พบบ่อย",
      percent: "15 %",
      value: "479,720", // สมมติค่า
      color: "#90EE90", // สีเขียว
    },
  ];

  return (
    <div
      className="kanit-regular px-5 py-4 mx-4 h-100 d-flex flex-column bg-white rounded-4"
      style={{ paddingLeft: "6%", paddingRight: "6%", overflowY: "auto" }}
    >
      {/* ================= HEADER ================= */}
      <div className="mb-4 pt-3 px-3">
        <p className="mb-2 fs-3" style={{ color: "#FF7A00" }}>
          รายงานการใช้ Token
        </p>
        <p className="text-muted mb-3 fs-5">
          ติดตามการใช้งาน Token ของ AI และค่าใช้จ่ายที่เกี่ยวข้อง
        </p>
        <hr className="text-muted" style={{ opacity: 0.2 }} />
      </div>

      {/* ================= TOTAL TOKEN SECTION ================= */}
      <div className="text-center mb-5">
        <h5 className="mb-3">Token ทั้งหมด</h5>
        <h1 className="display-5" style={{ letterSpacing: "5px" }}>
          {totalToken}
        </h1>
      </div>

      {/* ================= SUMMARY CARDS (3 Boxes) ================= */}
      <Row className="g-4 mb-5 px-3">
        {summaryStats.map((item, index) => (
          <Col md={4} key={index}>
            <div
              className="border rounded-4 py-1 text-center h-100 d-flex flex-column justify-content-between"
              style={{ borderColor: "#E9ECEF" }}
            >
              <div className="text-dark pt-2 fs-5">{item.label}</div>
              <hr className="w-100 my-2 text-muted" style={{ opacity: 0.2 }} />
              <div className="fs-3 py-4">{item.value}</div>
            </div>
          </Col>
        ))}
      </Row>

      {/* ================= BREAKDOWN SECTION ================= */}
      <div className="mb-4 px-3">
        <h5 className="mb-4">การใช้ Token</h5>
        <Row className="g-4">
          {breakdownStats.map((item, index) => (
            <Col md={6} key={index}>
              <div
                className="border rounded-4 p-4 h-100"
                style={{ borderColor: "#E9ECEF" }}
              >
                {/* Header Card: Dot + Label + Percent */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      style={{
                        width: "25px",
                        height: "25px",
                        backgroundColor: item.color,
                        borderRadius: "50%",
                      }}
                    ></div>
                    <span className="fs-5">{item.label}</span>
                  </div>
                  <span className="fs-4">{item.percent}</span>
                </div>
                <hr />
                {/* Value */}
                <div className="text-center py-4">
                  <p className="mb-2 fs-2">{item.value}</p>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default TokenReport;
