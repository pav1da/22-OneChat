import { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

function SignInPage({ onLogin }) {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(
    document.documentElement.getAttribute("data-theme") || "light"
  );

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-theme") {
          setTheme(document.documentElement.getAttribute("data-theme"));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      {/* Animated Orbs Background */}
      <div className="bg-orbs-container">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="glass-panel p-5 d-flex flex-column align-items-center animate-fade-up" style={{ width: "100%", maxWidth: "450px", position: "relative", zIndex: 1 }}>
        <img 
            className="mb-4" 
            src="./sb-logo.png" 
            alt="App Logo" 
            height="48" 
            style={{ filter: theme === "dark" ? "invert(1) hue-rotate(180deg)" : "none" }} 
        />
        
        <h1 className="fw-bolder mb-1" style={{ letterSpacing: "-1px" }}>
            Welcome to <span className="gradient-text">ONE CHAT</span>
        </h1>
        <p className="text-secondary mb-4 text-center">
            Sign in to your account to continue
        </p>

        {error && (
          <div className="alert alert-danger w-100 text-center py-2" style={{ borderRadius: "8px", fontSize: "14px" }}>
            {error}
          </div>
        )}

        <Form className="w-100" onSubmit={handleSignIn}>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              placeholder="Username or Email"
              className="custom-input rounded-3 shadow-none py-2"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Control
              type="password"
              placeholder="Password"
              className="custom-input rounded-3 shadow-none py-2"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Group>

          <Button
            type="submit"
            className="btn-brand w-100 py-2 mb-3"
            disabled={!isFormValid || loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </Form>

        <p className="small text-muted mt-2 mb-4">
          <Link to="/terms" className="text-brand text-decoration-none fw-medium">
            Forgot password?
          </Link>
        </p>

        <div className="text-center w-100 pt-3" style={{ borderTop: "1px solid var(--border-medium)" }}>
          <span className="text-secondary fs-6">Don't have an account? </span>
          <Link to="/signup" className="text-brand fw-bold text-decoration-none flex-grow-1">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SignInPage;
