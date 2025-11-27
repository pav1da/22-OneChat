import React, { useState } from "react"; // 1. Import useState
// 2. Import Form (สำหรับปุ่มอัปโหลด)
import { Container, Row, Col, Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";

const orangeButtonStyle = {
    backgroundColor: "#F26623",
    borderColor: "#F26623",
};

const orangeTextColor = {
    color: "#F26623",
};

const logoStyle = {
  position: "absolute",
  top: "24px",
  left: "24px",
  width: "40px",
  height: "40px",
  borderRadius: "6px",
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
                            <img style={logoStyle} src="./sb-logo.png" alt="App Logo" />
                        </Col> 
                        <Col xs="auto">
                           
                            <div
                                className="d-flex align-items-center border bg-white shadow "
                                style={{
                                    borderRadius: "10px",  
                                    padding: "4px 4px 4px 20px",
                                    borderColor: "#A8A8A8" 
                                }}
                            >
                                <Link
                                    to="/signin"
                                    className="text-decoration-none text-dark fw-bold me-3"
                                    style={{ fontSize: "16px" }}
                                >
                                    Sign in
                                </Link>

                                <Link to="/signup">
                                    <Button
                                        className="border-0 fw-bold"
                                        style={{
                                            backgroundColor: "#F26623",
                                            borderRadius: "5px", 
                                            padding: "6px 20px"  
                                        }}
                                    >
                                        Sign up
                                    </Button>
                                </Link>

                            </div>
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
                            <h1 className="display-2 fw-bold my-3" style={{ color: "#F26623" }}>
                                Connect Everyone in <span className="text-dark">One Place.</span>
                            </h1>
                            <p className="fs-5 text-muted">
                                Experience seamless communication with One Chat.
                                Whether you are supporting a customer or collaborating with your team,
                                we bring everything together in a single, secure platform.
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
