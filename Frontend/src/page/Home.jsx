import { useState } from "react";
import { Container, Row, Col, Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import AccountModal from "../components/AccountModal";

const orangeButtonStyle = {
  backgroundColor: "#F26623",
  borderColor: "#F26623",
};

const orangeTextColor = {
  color: "var(--brand-orange)",
};

const Home = () => {
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleImageChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      const newImageUrl = URL.createObjectURL(file);
      setBackgroundImage(newImageUrl);
    }
  };

  const mainContainerStyle = {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    transition: "background-image 0.3s ease-in-out",
  };

  return (
    <Container fluid style={mainContainerStyle}>
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 100,
        }}
      >
        {/* <Form.Label htmlFor="bg-upload" className="btn btn-dark">
                    Change Background
                </Form.Label> */}
        <Form.Control
          type="file"
          id="bg-upload"
          accept="image/*" // รับเฉพาะไฟล์รูป
          style={{ display: "none" }} // ซ่อนปุ่ม "Choose file" ที่ไม่สวย
          onChange={handleImageChange}
        />
      </div>

      <header>
        <Container fluid>
          <Row className="p-3 d-flex justify-content-between align-items-center">
            <Col xs="auto">
              <img className="app-logo" src="./sb-logo.png" alt="App Logo" />
            </Col>
            <Col xs="auto">
              <div
                className="d-flex align-items-center border bg-white shadow "
                style={{
                  borderRadius: "10px",
                  padding: "4px 4px 4px 20px",
                  borderColor: "#A8A8A8",
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
                      padding: "6px 20px",
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
              <h1 className="display-2 fw-bold my-3 text-brand">
                Connect Everyone in{" "}
                <span className="text-dark">One Place.</span>
              </h1>
              <p className="fs-5 text-muted">
                Experience seamless communication with One Chat. Whether you are
                supporting a customer or collaborating with your team, we bring
                everything together in a single, secure platform.
              </p>
              <Button 
                style={orangeButtonStyle} 
                size="lg" 
                className="mt-4"
                onClick={() => setShowModal(true)}
              >
                Get Started
              </Button>
            </Col>
          </Row>
        </Container>
      </main>

      <AccountModal show={showModal} onHide={() => setShowModal(false)} />
    </Container>
  );
};

export default Home;
