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

// รับ props onLogin
function SignUpPage({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Validation 
  const isEmailValid = email.includes("@"); 
  const isPasswordValid = password.length >= 4;
  const isFormValid = isEmailValid && isPasswordValid;

  const handleSignUp = (event) => {
    event.preventDefault();

    if (isFormValid) {
      // สร้าง User ใหม่จำลอง
      const newUser = {
          id: Date.now(),
          name: "New User", 
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
      <div style={logoStyle}></div>

      <Card.Body>
        <Container className="text-center" >
          <h1 className="fw-bold mb-5" style={{ color: "#F26623" }}>
            ONE CHAT
          </h1>
          <p className="fs-5 text-dark mb-1">Welcome to One Chat</p>
          <p className="text-muted mb-5">
            Sign up and start create your account.
          </p>
          <div className="d-flex align-content-center justify-content-center mb-5 mt-5">
            <Form className="d-grid gap-3" style={{ width: "300px" }} onSubmit={handleSignUp}>
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
            By creating an account, you agree to our
            <Link to="/terms" className=" mx-1" style={{ color: "#F26623" }}>
              Terms of Service
            </Link>
            and
            <Link to="/privacy" className=" ms-1" style={{ color: "#F26623" }}>
              Privacy & Cookie Statement
            </Link>
            .
          </p>

          <p className="mt-4">
            Already have an account?
            <Link
              to="/signin"
              className="fw-bold text-decoration-underline ms-1"
              style={{ color: "#F26623" }}
            >
              Sign in
            </Link>
          </p>
        </Container>
      </Card.Body>
    </div>
  );
}

export default SignUpPage;