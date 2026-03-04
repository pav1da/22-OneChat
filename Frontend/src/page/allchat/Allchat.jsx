import {
  Badge,
  Button,
  Form,
  InputGroup,
  Container,
  Row,
  Col,
} from "react-bootstrap";
import { fetchCustomer } from "../../data/customer";
import { useNavigate } from "react-router-dom";
import "./allChat.css";

const AllChat = () => {
  const navigate = useNavigate();
  const customers = fetchCustomer();
  const totalEmptyCells = 21;

  // ฟังก์ชันนำทางไปยังหน้าแชท Inbox เมื่อคลิกที่ UserCard
  const handleCardClick = (customerId) => {
    navigate("/inbox", { state: { chatId: customerId } });
  };

  // คอมโพเนนต์สำหรับแสดงข้อมูลลูกค้าแต่ละคน
  const UserCard = ({ customer }) => {
    let statusBadge = null; // ตัวแปรสำหรับเก็บ Element ของ Badge สถานะ

    // 1. ตรรกะการกำหนด Badge สถานะ
    if (customer.inprocess === true) {
      // กำลังดำเนินการ (สีส้ม/เหลือง)
      statusBadge = (
        <Badge
          bg="warning"
          text="white" 
          className="px-3 py-2 rounded-3"
          style={{
            fontSize: "0.8rem",
            whiteSpace: "nowrap", // ป้องกัน Badge ขึ้นบรรทัดใหม่
            fontWeight: "500",
          }}
        >
          กำลังดำเนินการ
        </Badge>
      );
    } else if (customer.inprocess === false) {
      // เสร็จสิ้น (สีเขียว)
      statusBadge = (
        <Badge
          bg="success"
          className="px-3 py-2 rounded-3"
          style={{
            fontSize: "0.8rem",
            whiteSpace: "nowrap",
            fontWeight: "500",
          }}
        >
          เสร็จสิ้น
        </Badge>
      );
    }

    return (
      <div
        className="border rounded-4 p-1 d-flex align-items-center justify-content-between shadow-sm user-card"
        style={{ minHeight: "100px", cursor: "pointer" }}
        onClick={() => handleCardClick(customer.id)}
      >
        {/* รูปภาพโปรไฟล์ */}
        <img
          src={customer.img}
          className="rounded-circle custom-img mx-3"
          style={{
            width: "60px",
            height: "60px",
            objectFit: "cover",
            flexShrink: 0, // ป้องกันการหดตัวของรูป
          }}
          alt={customer.name}
        />

        {/* ข้อมูลข้อความ (ชื่อ, สถานะ, ข้อความล่าสุด) */}
        <div
          className="d-flex flex-column gap-2 flex-grow-1"
          style={{ height: "70px" }}
        >
          <div
          className=" pe-3"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto", // ชื่อยืดเต็มพื้นที่, Badge ตามขนาดเนื้อหา
              alignItems: "baseline",
              gap: "10px",
            }}
          >
            <span className="text-truncate username-text">{customer.name}</span>
            {statusBadge} {/* แสดง Badge สถานะ */}
          </div>

          {/* ข้อความล่าสุด */}
          <p
            className="custom-text text-truncate mb-0 pe-3"
            style={{ width: "200px" }}
          >
            {customer.last}
          </p>
        </div>
      </div>
    );
  };

  // คอมโพเนนต์สำหรับช่องว่าง (Placeholder Card)
  const EmptyCard = () => (
    <div
      className="empty-card border-dashed-light-gray rounded-4 p-4"
      style={{ minHeight: "100px" }}
    ></div>
  );

  return (
    <div className="kanit-regular d-flex flex-column mx-4 allChat">
      {/* Header Section */}
      <div className="d-flex justify-content-between">
        <div className="fs-3" style={{ color: "#f26623" }}>
          All
        </div>
        <div className="d-flex gap-3 align-items-center">
          {/* Search Input */}
          <InputGroup style={{ width: "250px" }}>
            <InputGroup.Text
              className="bg-white border-1 rounded-start-3 py-2 ps-3 pe-2"
              style={{ borderColor: "#c5c5c5" }}
            >
              <i className="bi bi-search text-muted"></i>
            </InputGroup.Text>
            <Form.Control
              type="search"
              placeholder="ค้นหา..."
              className="rounded-end-3 border-1 border-start-0 custom-search"
            />
          </InputGroup>

          {/* Sort Button */}
          <Button
            className="d-flex align-items-center gap-1 rounded-3 border-1 px-4 py-2"
            style={{
              background: "#ffffff",
              color: "#707070",
              borderColor: "#c5c5c5",
            }}
          >
            <i className="bi bi-arrow-down-up"></i>เรียงลำดับ
          </Button>
        </div>
      </div>
      <hr />

      {/*  ส่วนแสดงรายการ UserCard และ EmptyCard */}
      <Container fluid className="px-0">
        {/* กำหนดความสูงและ Scrollbar แนวตั้ง */}
        <div style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
          <Row className="g-4">
            {/* แสดงลูกค้าจริง */}
            {customers.map((customer) => (
              <Col key={customer.id} lg={3} md={4} sm={6} xs={12}>
                <UserCard customer={customer} />
              </Col>
            ))}

            {/* แสดงช่องว่างเพื่อเติมเต็ม Grid Layout */}
            {Array.from({ length: totalEmptyCells }).map((_, index) => (
              <Col key={`empty-${index}`} lg={3} md={4} sm={6} xs={12}>
                <EmptyCard />
              </Col>
            ))}
          </Row>
        </div>
      </Container>
    </div>
  );
};

export default AllChat;
