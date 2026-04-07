import { useState, useEffect } from "react";
import { Container, Row, Col, Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import AccountModal from "../components/AccountModal";

const Home = () => {
  const [showModal, setShowModal] = useState(false);
  const [theme, setTheme] = useState(
    document.documentElement.getAttribute("data-theme") || "light"
  );

  // Background Image features - keeping them for compatibility if user uploads bg
  const [backgroundImage, setBackgroundImage] = useState(null);
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const newImageUrl = URL.createObjectURL(file);
      setBackgroundImage(newImageUrl);
    }
  };

  // Keep track of theme changes (optional listener if ThemeContext changes attribute)
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

  return (
    <div 
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        transition: "background-image 0.3s ease-in-out",
        position: "relative"
      }}
    >
      {/* Background Animated Orbs (Hidden if custom image is used) */}
      {!backgroundImage && (
        <div className="bg-orbs-container">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>
      )}

      {/* Background Image Upload (Hidden but kept logic) */}
      <div style={{ position: "fixed", bottom: "20px", left: "20px", zIndex: 100 }}>
        <Form.Control
          type="file"
          id="bg-upload"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImageChange}
        />
        <label htmlFor="bg-upload" style={{
            fontSize: "12px", 
            cursor: "pointer", 
            color: "var(--text-muted)", 
            background: "var(--bg-glass)",
            padding: "4px 8px",
            borderRadius: "4px",
            backdropFilter: "blur(4px)"
        }}>
          Customize BG
        </label>
      </div>

      {/* Floating Header */}
      <header className="fixed-top mt-3 mx-auto animate-fade-up" style={{ maxWidth: "1200px" }}>
        <div className="glass-nav rounded-pill px-4 py-2 d-flex justify-content-between align-items-center shadow-sm">
          <div className="d-flex align-items-center gap-2">
             <img src="./sb-logo.png" alt="Logo" height="36" style={{ filter: theme === 'dark' ? 'invert(1) hue-rotate(180deg)' : 'none' }} />
             <span className="fw-bold fs-5 text-heading" style={{ letterSpacing: "-0.5px" }}>ONE CHAT</span>
          </div>

          <div className="d-flex align-items-center gap-3">
             <Link to="/signin" className="nav-signin-btn text-decoration-none fw-semibold">
                Sign In
             </Link>
             <Link to="/signup" className="nav-signup-link">
                <button className="btn-brand nav-signup-btn rounded-pill px-4 py-2" style={{ fontSize: "15px" }}>
                   Get Started
                </button>
             </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", paddingTop: "80px", position: "relative", zIndex: 1 }}>
        <Container>
          <Row className="align-items-center">
            <Col lg={7} className="text-center text-lg-start mb-5 mb-lg-0">
              <div className="glass-panel p-5 animate-fade-up animate-delay-1" style={{ borderRadius: "24px" }}>
                <span className="badge rounded-pill mb-3" style={{ background: "var(--primary-light)", color: "var(--brand-orange)", border: "1px solid rgba(242, 102, 35, 0.3)", padding: "8px 16px", fontWeight: "600" }}>
                  v2.0 UI Revamp
                </span>
                
                <h1 className="display-3 fw-bolder mb-3" style={{ letterSpacing: "-1.5px", lineHeight: "1.2" }}>
                  Connect Everyone in <b className="gradient-text">One Place.</b>
                </h1>
                
                <p className="fs-5 text-secondary mb-4" style={{ lineHeight: "1.6", maxWidth: "600px", margin: "0 auto" }}>
                  Experience seamless communication with <strong className="text-heading">One Chat</strong>. Whether you are
                  supporting a customer or collaborating with your team, we bring
                  everything together in a single, secure platform.
                </p>
                
                <div className="d-flex gap-3 justify-content-center justify-content-lg-start">
                  <button 
                    className="btn-brand btn-lg rounded-pill px-5" 
                    onClick={() => setShowModal(true)}
                  >
                    Explore Features
                  </button>
                  <Link to="/signup">
                    <button className="btn-brand-outline btn-lg rounded-pill px-4">
                      Create Account
                    </button>
                  </Link>
                </div>
              </div>
            </Col>
            
            {/* Right side illustration / mockup */}
            <Col lg={5} className="d-none d-lg-block">
               <div className="position-relative" style={{ height: "400px" }}>
                  {/* Decorative Elements */}
                  <div className="glass-panel position-absolute animate-fade-up animate-delay-2" style={{ width: "250px", height: "180px", right: "0", top: "10%", transform: "rotate(5deg)", padding: "20px" }}>
                     <div className="d-flex align-items-center gap-3 mb-3">
                        <div className="rounded-circle" style={{ width: "40px", height: "40px", background: "linear-gradient(to bottom right, #f4a460, #F26623)" }}></div>
                        <div>
                            <div className="fw-bold text-heading" style={{ fontSize: "14px" }}>Admin Panel</div>
                            <div className="text-muted" style={{ fontSize: "12px" }}>Active Now</div>
                        </div>
                     </div>
                     <div className="rounded-pill mb-2" style={{ height: "10px", width: "100%", background: "var(--border-medium)" }}></div>
                     <div className="rounded-pill mb-2" style={{ height: "10px", width: "80%", background: "var(--border-medium)" }}></div>
                     <div className="rounded-pill" style={{ height: "10px", width: "60%", background: "var(--border-medium)" }}></div>
                  </div>

                  <div className="glass-panel position-absolute animate-fade-up animate-delay-3" style={{ width: "280px", height: "160px", left: "0", bottom: "10%", padding: "20px", zIndex: 2 }}>
                    <div className="fw-bold mb-3 d-flex justify-content-between">
                        <span>New Message</span>
                        <span className="badge bg-danger rounded-pill">1</span>
                    </div>
                    <div className="p-2 rounded-3 mb-2" style={{ background: "var(--bg-bubble-other)", width: "fit-content", color: "var(--text-bubble-other)", fontSize: "13px" }}>
                        Hello! 👋 I have a question.
                    </div>
                    <div className="p-2 rounded-3 text-end ms-auto" style={{ background: "var(--bg-bubble-admin)", width: "fit-content", color: "var(--text-bubble-admin)", fontSize: "13px" }}>
                        Hi! How can we help you?
                    </div>
                  </div>
               </div>
            </Col>
          </Row>
        </Container>
      </main>

      <AccountModal show={showModal} onHide={() => setShowModal(false)} />
    </div>
  );
};

export default Home;
