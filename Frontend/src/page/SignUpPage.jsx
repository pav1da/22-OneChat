import { useState } from "react";
import { Container, Form, Button, Card } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

function SignUpPage({ onLogin }) {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Validation
  const isUsernameValid = username.trim().length > 0;
  const isEmailValid = email.includes("@");
  const isPasswordValid = password.length >= 4;
  const isFormValid = isUsernameValid && isEmailValid && isPasswordValid;

  const handleSignUp = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "สมัครสมาชิกไม่สำเร็จ");
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
          <h1 className="fw-bold mb-4 text-brand">ONE CHAT</h1>

          <h5 className="fw-bold text-dark mb-2">Welcome to One Chat</h5>
          <p className="text-dark mb-4" style={{ fontSize: "0.95rem" }}>
            Sign up and start create your account.
          </p>

          {error && (
            <div className="alert alert-danger mx-auto" style={{ maxWidth: "320px" }}>
              {error}
            </div>
          )}

          <div className="d-flex align-content-center justify-content-center mb-5 mt-4">
            <Form
              className="d-grid gap-3"
              style={{ width: "320px" }}
              onSubmit={handleSignUp}
            >
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

              <Button
                type="submit"
                size="lg"
                className="rounded-3 border-0 mt-2"
                disabled={!isFormValid || loading}
                style={{
                  backgroundColor: "var(--brand-peach)",
                  color: "#fff",
                  fontWeight: "500",
                }}
              >
                {loading ? "กำลังสมัคร..." : "Continue"}
              </Button>
            </Form>
          </div>

          <p className="small text-muted mt-3" style={{ fontSize: "0.75rem" }}>
            By creating an account, you agree to our
            <Link to="/terms" className="text-decoration-none mx-1 text-brand">
              Terms of Service
            </Link>
            and
            <Link
              to="/privacy"
              className="text-decoration-none ms-1 text-brand"
            >
              Privacy & Cookie Statement.
            </Link>
          </p>

          <p className="mt-5" style={{ fontSize: "0.9rem" }}>
            Already have an account?
            <Link
              to="/signin"
              className="fw-bold text-decoration-underline ms-1 text-brand"
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
