import { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

function SignUpPage({ onLogin }) {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
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
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
             {/* Animated Orbs Background */}
            <div className="bg-orbs-container">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div className="orb orb-3"></div>
            </div>

            <div className="glass-panel p-5 d-flex flex-column align-items-center animate-fade-up" style={{ width: "100%", maxWidth: "450px", position: "relative", zIndex: 1, marginTop: "2rem", marginBottom: "2rem" }}>
                <img 
                    className="mb-4" 
                    src="./sb-logo.png" 
                    alt="App Logo" 
                    height="42" 
                    style={{ filter: theme === "dark" ? "invert(1) hue-rotate(180deg)" : "none" }} 
                />
                
                <h2 className="fw-bolder mb-1 text-center" style={{ letterSpacing: "-0.5px" }}>
                    Create Account
                </h2>
                <p className="text-secondary mb-4 text-center fs-6">
                    Join <span className="gradient-text fw-bold">ONE CHAT</span> today
                </p>

                {error && (
                    <div className="alert alert-danger w-100 text-center py-2" style={{ borderRadius: "8px", fontSize: "14px" }}>
                        {error}
                    </div>
                )}

                <Form className="w-100" onSubmit={handleSignUp}>
                    <Form.Group className="mb-3">
                        <Form.Control
                            type="text"
                            placeholder="Username"
                            className="custom-input rounded-3 shadow-none py-2"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Control
                            type="email"
                            placeholder="Email Address"
                            className="custom-input rounded-3 shadow-none py-2"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                        className="btn-brand w-100 py-2 mb-3 mt-2"
                        disabled={!isFormValid || loading}
                    >
                        {loading ? "Creating account..." : "Sign Up"}
                    </Button>
                </Form>

                <p className="text-muted text-center mb-4" style={{ fontSize: "13px", lineHeight: "1.5" }}>
                    By creating an account, you agree to our{" "}
                    <Link to="/terms" className="text-brand text-decoration-none fw-medium">
                        Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-brand text-decoration-none fw-medium">
                        Privacy Policy
                    </Link>.
                </p>

                <div className="text-center w-100 pt-3" style={{ borderTop: "1px solid var(--border-medium)" }}>
                    <span className="text-secondary fs-6">Already have an account? </span>
                    <Link to="/signin" className="text-brand fw-bold text-decoration-none flex-grow-1">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default SignUpPage;
