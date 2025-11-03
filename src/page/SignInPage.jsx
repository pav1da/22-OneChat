import React, { useState } from "react";
import { Container, Form, Button, Card } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

const pageStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  width: "100%",
  backgroundColor: "#ffffff",
};

const logoStyle = {
  position: "absolute",
  top: "24px",
  left: "24px",
  width: "32px",
  height: "32px",
  backgroundColor: "#111",
  borderRadius: "6px",
};

function SignInPage() {
  // เรียกใช้ useNavigate
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isEmailValid = email.includes("@gmail.com");
  const isPasswordValid = password.length >= 8;
  const isFormValid = isEmailValid && isPasswordValid;

  // สร้างฟังก์ชันสำหรับจัดการการ Submit
  const handleSignIn = (event) => {
    // ป้องกันไม่ให้หน้าเว็บโหลดใหม่ (พฤติกรรมปกติของ Form)
    event.preventDefault();

    // ตรวจสอบอีกครั้งว่า Form Valid จริง
    // (ถึงแม้ปุ่มจะ disable อยู่แล้ว แต่กูกันเหนียว)
    if (isFormValid) {
      console.log("Login successful, navigating to home...");

      //คำสั่งให้เด้งไปหน้า Home
      navigate("/home");
    }
  };

  return (
    <div style={pageStyle}>
      <div style={logoStyle}></div>
      {/* <Card style={{
                width: '100%',
                maxWidth: '440px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                border: 'none',
                borderRadius: '8px'
            }}> */}
      <Card.Body>
        <Container className="text-center">
          <h1 className="fw-bold mb-5" style={{ color: "#F26623" }}>
            ONE CHAT
          </h1>
          <p className="fs-5 text-dark mb-1">Sign In</p>
          <p className="text-muted mb-5">
            to continue to your One Chat account.
          </p>

          <div className="d-flex align-content-center justify-content-center mb-5 mt-5">
            {/* ผูก Form เข้ากับฟังก์ชัน handleSignIn โดยใช้ onSubmit  */}
            <Form className="d-grid gap-3" style={{ width: "35%" }} onSubmit={handleSignIn}>
              <Form.Group>
                <Form.Control
                  type="email"
                  placeholder="Username or Email"
                  required
                  size="lg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Form.Group>
              <Form.Group>
                <Form.Control
                  type="password"
                  placeholder="Password"
                  required
                  size="lg"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Form.Group>

              {/*กดปุ่มนี้ มันจะไปสั่งให้ <Form> ทำงาน */}
              <Button
                variant="dark"
                type="submit"
                size="lg"
                disabled={!isFormValid}
              >
                Continue
              </Button>
            </Form>
          </div>
          <p className="small text-muted mt-3">
            <Link to="/terms" className=" mx-1" style={{ color: "#F26623" }}>
              Forgot password?
            </Link>
          </p>

          <p className="mt-4">
            Don't have an account?
            <Link
              to="/signup"
              className="fw-bold text-decoration-underline ms-1"
              style={{ color: "#F26623" }}
            >
              Sign up
            </Link>
          </p>
        </Container>
      </Card.Body>
      {/* </Card> */}
    </div>
  );
}

export default SignInPage;
