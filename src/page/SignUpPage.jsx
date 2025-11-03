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

function SignUpPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isEmailValid = email.includes("@gmail.com");
  const isPasswordValid = password.length >= 8;
  const isFormValid = isEmailValid && isPasswordValid;

  const handleSignUp = (event) => {
    // ป้องกันไม่ให้หน้าเว็บโหลดใหม่
    event.preventDefault();

    // ตรวจสอบอีกครั้งว่า Form Valid จริง
    // (ถึงแม้ปุ่มจะ disable อยู่แล้ว แต่กูกันเหนียวไว้)
    if (isFormValid) {
      console.log("Login successful, navigating to home...");

      // คำสั่งให้เด้งไปหน้า Home
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
        <Container className="text-center" >
          <h1 className="fw-bold mb-5" style={{ color: "#F26623" }}>
            ONE CHAT
          </h1>
          <p className="fs-5 text-dark mb-1">Welcome to One Chat</p>
          <p className="text-muted mb-5">
            Sign up and start create your account.
          </p>
          <div className="d-flex align-content-center justify-content-center mb-5 mt-5">
            <Form className="d-grid gap-3" style={{ width: "35%" }} onSubmit={handleSignUp}>
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

              {/*กดปุ่มนี้มันจะไปสั่งให้ <Form> ทำงาน */}
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

          {/* <div className="d-flex align-items-center my-4">
                            <hr className="flex-grow-1" />
                            <span className="mx-3 text-muted small">or</span>
                            <hr className="flex-grow-1" />
                        </div> */}

          {/* <Button variant="light" className="w-100 border d-flex justify-content-center align-items-center gap-2" size="lg">
                            <i className="bi bi-google"></i>
                            Continue with Google
                        </Button> */}

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
      {/* </Card> */}
    </div>
  );
}

export default SignUpPage;
