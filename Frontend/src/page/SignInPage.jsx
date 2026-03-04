import { useState } from "react";
import { Container, Form, Button, Card } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

import { user as mockUser } from "../data/mockUser";

function SignInPage({ onLogin }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isEmailValid = email.includes("@") && email.includes(".");
  const isPasswordValid = password.length >= 4;
  const isFormValid = isEmailValid && isPasswordValid;

  const handleSignIn = (event) => {
    event.preventDefault();

    const foundUser = mockUser.find((u) => u.email === email);

    if (foundUser) {
      if (onLogin) onLogin(foundUser);
      navigate("/dashboard");
    } else {
      alert("ไม่พบอีเมลนี้ในระบบ กรุณาตรวจสอบอีกครั้ง");
    }
  };

  const handleQuickLogin = (role) => {
    const userToLogin = mockUser.find((u) => u.role === role);
    if (userToLogin && onLogin) {
      onLogin(userToLogin);
      navigate("/dashboard");
    }
  };

  return (
    <div className="page-centered">
      <img className="app-logo" src="./sb-logo.png" alt="App Logo" />
      <Card.Body>
        <Container className="text-center">
          <h1 className="fw-bold mb-5 text-brand">ONE CHAT</h1>
          <p className="fs-5 text-dark mb-1">Sign In</p>
          <p className="text-muted mb-4">
            to continue to your One Chat account.
          </p>

          <div className="d-flex align-content-center justify-content-center mb-5">
            <Form
              className="d-grid gap-3"
              style={{ width: "500px" }}
              onSubmit={handleSignIn}
            >
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
            <Link to="/terms" className="mx-1 text-brand">
              Forgot password?
            </Link>
          </p>

          <p className="mt-4">
            Don't have an account?
            <Link
              to="/signup"
              className="fw-bold text-decoration-underline ms-1 text-brand"
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
