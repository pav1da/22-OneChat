import { useState } from "react";
import { Container, Form, Button, Card } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

function SignInPage({ onLogin }) {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isFormValid = identifier.trim().length >= 1 && password.length >= 1;

  const handleSignIn = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "เข้าสู่ระบบไม่สำเร็จ");
        setLoading(false);
        return;
      }

      // เก็บ token ไว้ใน sessionStorage
      sessionStorage.setItem("token", data.token);

      if (onLogin) onLogin(data.user);
      navigate("/dashboard");
    } catch (err) {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
      setLoading(false);
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

          {error && (
            <div className="alert alert-danger mx-auto" style={{ maxWidth: "500px" }}>
              {error}
            </div>
          )}

          <div className="d-flex align-content-center justify-content-center mb-5">
            <Form
              className="d-grid gap-3"
              style={{ width: "500px" }}
              onSubmit={handleSignIn}
            >
              <Form.Group>
                <Form.Control
                  type="text"
                  placeholder="Username or Email"
                  required
                  size="lg"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
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
                disabled={!isFormValid || loading}
              >
                {loading ? "กำลังเข้าสู่ระบบ..." : "Continue"}
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
