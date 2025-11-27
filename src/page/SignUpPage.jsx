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
  width: "40px",
  height: "40px",
  borderRadius: "6px",
};

// รับ props onLogin
function SignUpPage({ onLogin }) {
  const navigate = useNavigate();
  
  // 1. เพิ่ม state สำหรับ username
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Validation 
  const isUsernameValid = username.trim().length > 0;
  const isEmailValid = email.includes("@");
  const isPasswordValid = password.length >= 4;
  
  // ต้องกรอกครบทั้ง 3 ช่องถึงจะกดปุ่มได้
  const isFormValid = isUsernameValid && isEmailValid && isPasswordValid;

  const handleSignUp = (event) => {
    event.preventDefault();

    if (isFormValid) {
      // สร้าง User ใหม่จำลอง
      const newUser = {
          id: Date.now(),
          name: username, // ใช้ username ที่กรอกมา
          role: "user",     
          color: "#000000",
          email: email
      };

      alert("สมัครสมาชิกสำเร็จ! ระบบจะพาเข้าสู่หน้า Dashboard");

      // สั่ง Login เลยโดยไม่ต้องไปหน้า Sign In อีก
      if(onLogin) onLogin(newUser);

      navigate("/dashboard");
    }
  };

  return (
    <div style={pageStyle}>
      <img style={logoStyle} src="./sb-logo.png" alt="App Logo" />
      <Card.Body>
        <Container className="text-center">
        
          {/* หัวข้อ ONE CHAT */}
          <h1 className="fw-bold mb-4" style={{ color: "#F26623" }}>
            ONE CHAT
          </h1>

          {/* Welcome Text */}
          <h5 className="fw-bold text-dark mb-2">Welcome to One Chat</h5>
          <p className="text-dark mb-4" style={{ fontSize: "0.95rem" }}>
            Sign up and start create your account.
          </p>

          {/* Form Area */}
          <div className="d-flex align-content-center justify-content-center mb-5 mt-4">
            <Form className="d-grid gap-3" style={{ width: "320px" }} onSubmit={handleSignUp}>
              
              {/* 2. ช่อง Username (เพิ่มใหม่) */}
              <Form.Group>
                <Form.Control
                  type="text"
                  placeholder="Username"
                  required
                  size="lg"
                  className="rounded-3"
                  style={{ fontSize: "0.95rem", backgroundColor: "#fff" }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </Form.Group>

              {/* ช่อง Email (แก้ Placeholder) */}
              <Form.Group>
                <Form.Control
                  type="email"
                  placeholder="Email" 
                  required
                  size="lg"
                  className="rounded-3"
                  style={{ fontSize: "0.95rem", backgroundColor: "#fff" }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Form.Group>

              {/* ช่อง Password */}
              <Form.Group>
                <Form.Control
                  type="password"
                  placeholder="Password"
                  required
                  size="lg"
                  className="rounded-3"
                  style={{ fontSize: "0.95rem", backgroundColor: "#fff" }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Form.Group>

              {/* 3. ปุ่ม Continue สีส้มพีช */}
              <Button
                type="submit"
                size="lg"
                className="rounded-3 border-0 mt-2"
                disabled={!isFormValid}
                style={{ 
                    backgroundColor: "#F4A482", // สีส้มอ่อนตามภาพ
                    color: "#fff",
                    fontWeight: "500"
                }}
              >
                Continue
              </Button>
            </Form>
          </div>
          
          {/* Footer Links 1 */}
          <p className="small text-muted mt-3" style={{ fontSize: "0.75rem" }}>
            By creating an account, you agree to our
            <Link to="/terms" className="text-decoration-none mx-1" style={{ color: "#F26623" }}>
              Terms of Service
            </Link>
            and
            <Link to="/privacy" className="text-decoration-none ms-1" style={{ color: "#F26623" }}>
              Privacy & Cookie Statement.
            </Link>
          </p>

          {/* Footer Links 2 */}
          <p className="mt-5" style={{ fontSize: "0.9rem" }}>
            Already have an account?
            <Link
              to="/signin"
              className="fw-bold text-decoration-underline ms-1"
              style={{ color: "#F26623" }}
            >
              Sign in.
            </Link>
          </p>
        </Container>
      </Card.Body>
    </div>
  );
}

export default SignUpPage;