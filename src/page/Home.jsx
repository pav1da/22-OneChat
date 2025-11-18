import React, { useState } from "react"; // 1. Import useState
// 2. Import Form (สำหรับปุ่มอัปโหลด)
import { Container, Row, Col, Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import Dashboard from "./Dashboard";

// ... (สไตล์ logoStyle, orangeButtonStyle, orangeTextColor เหมือนเดิม) ...
const logoStyle = {
  width: "40px",
  height: "40px",
  backgroundColor: "#F26623",
  borderRadius: "8px",
};

const orangeButtonStyle = {
  backgroundColor: "#F26623",
  borderColor: "#F26623",
};

const orangeTextColor = {
  color: "#F26623",
};

const Home = () => {
  // 3. สร้าง State เพื่อเก็บ URL ของรูปพื้นหลัง
  const [backgroundImage, setBackgroundImage] = useState(null);

  // 4. ฟังก์ชันที่จะทำงานเมื่อผู้ใช้เลือกไฟล์
  const handleImageChange = (event) => {
    const file = event.target.files[0]; // ดึงไฟล์ที่ผู้ใช้เลือก

    if (file) {
      // สร้าง URL ชั่วคราวสำหรับไฟล์นั้น
      const newImageUrl = URL.createObjectURL(file);
      setBackgroundImage(newImageUrl);
    }
  };

  // 5. สร้าง object style สำหรับ Container หลัก
  const mainContainerStyle = {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    transition: "background-image 0.3s ease-in-out", // ทำให้ตอนเปลี่ยนรูปมันนุ่มนวล
  };

  // 6. ถ้ามีรูปใน State (backgroundImage ไม่ใช่ null)
  //    ให้เพิ่ม style background เข้าไป
  if (backgroundImage) {
    mainContainerStyle.backgroundImage = `
            linear-gradient(
                to bottom,
                rgba(255, 255, 255, 0.9) 0%,
                rgba(255, 255, 255, 0) 50%
            ),
            url(${backgroundImage})
        `;

    mainContainerStyle.backgroundSize = "cover";
    mainContainerStyle.backgroundPosition = "center";
  }

  return (
    // 7. ใช้ mainContainerStyle
    <Container fluid style={mainContainerStyle}>
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 100,
        }}
      >
        <Form.Label htmlFor="bg-upload" className="btn btn-dark">
          Change Background
        </Form.Label>
        <Form.Control
          type="file"
          id="bg-upload"
          accept="image/*" // รับเฉพาะไฟล์รูป
          style={{ display: "none" }} // ซ่อนปุ่ม "Choose file" ที่ไม่สวย
          onChange={handleImageChange} // เรียกฟังก์ชันเมื่อเลือกไฟล์
        />
      </div>

      <header>
        <Container fluid>
          <Row className="p-3 d-flex justify-content-between align-items-center">
            <Col xs="auto">
              <div style={logoStyle}></div>
            </Col>
            <Col xs="auto" className="d-flex gap-2">
              <Link to="/signin">
                <Button variant="outline-secondary">Sign in</Button>
              </Link>
              <Link to="/signup">
                <Button style={orangeButtonStyle}>Sign up</Button>
              </Link>
            </Col>
          </Row>
        </Container>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center" }}>
        <Container>
          <Row>
            <Col md={7} className="mt-5" style={{ marginTop: "-50px" }}>
              <h3 className="fw-light">
                Welcome To{" "}
                <span style={orangeTextColor}>
                  <b>ONE CHAT</b>
                </span>
              </h3>
              <h1 className="display-2 fw-bold my-3">Lorem Ipsum</h1>
              <p className="fs-5 text-muted">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat.
              </p>
              <Link to="/dashboard" className="mt-4 d-inline-block">
                <Button style={orangeButtonStyle} size="lg">
                  Get Start
                </Button>
              </Link>
            </Col>
          </Row>
        </Container>
      </main>
    </Container>
  );
};

export default Home;
