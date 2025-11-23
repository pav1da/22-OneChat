import React, { useState } from "react";
import { Container, Form, Button, Card, Row, Col } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

import { user as mockUser } from "../data/mockUser"; 

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

// 2. รับ prop onLogin
function SignInPage({ onLogin }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // แก้ Validation ไม่ต้องบังคับ @gmail เพราะใช้ @onechat
  const isEmailValid = email.includes("@") && email.includes("."); 
  const isPasswordValid = password.length >= 4; 
  const isFormValid = isEmailValid && isPasswordValid;

  // Login ปกติ (พิมพ์เอง แต่มึงอย่าพิมเลย)
  const handleSignIn = (event) => {
    event.preventDefault();

    // ค้นหา User ใน Mock
    const foundUser = mockUser.find((u) => u.email === email);

    if (foundUser) {
      // ถ้าเจอ: ส่งข้อมูลกลับไป App และย้ายหน้า
      if(onLogin) onLogin(foundUser);
      navigate("/dashboard");
    } else {
      // ถ้าไม่เจอ
      alert("กูทำปุ่มลัดให้กดยังเสือกจะพิมเมลไอเชี้ยนี่");
    }
  };

  // Login ลัด 
  const handleQuickLogin = (role) => {
     const userToLogin = mockUser.find(u => u.role === role);
     if(userToLogin && onLogin) {
         onLogin(userToLogin);
         navigate("/dashboard");
     }
  }

  return (
    <div style={pageStyle}>
      <div style={logoStyle}></div>
      <Card.Body>
        <Container className="text-center">
          <h1 className="fw-bold mb-5" style={{ color: "#F26623" }}>
            ONE CHAT
          </h1>
          <p className="fs-5 text-dark mb-1">Sign In</p>
          <p className="text-muted mb-4">
            to continue to your One Chat account.
          </p>

            {/* ปุ่มลัด */}
            <div className="mb-4 p-3 bg-light rounded border mx-auto" style={{maxWidth: '320px'}}>
                <small className="text-muted d-block mb-2">Developer Mode: Login As...</small>
                <div className="d-flex justify-content-center gap-2 flex-wrap">
                    <Button variant="danger" size="sm" onClick={() => handleQuickLogin('admin')}>Admin</Button>
                    <Button variant="dark" size="sm" onClick={() => handleQuickLogin('it')}>IT Support</Button>
                    <Button variant="primary" size="sm" onClick={() => handleQuickLogin('user')}>User</Button>
                </div>
            </div>
            

          <div className="d-flex align-content-center justify-content-center mb-5">
            <Form className="d-grid gap-3" style={{ width: "300px" }} onSubmit={handleSignIn}>
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
    </div>
  );
}

export default SignInPage;