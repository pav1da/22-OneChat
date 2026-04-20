import { useState, useEffect } from "react";
import { Container, Row, Col, Button, Form, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import AccountModal from "../components/AccountModal";
import { ChatSquareDots, Diagram3, Layers, Inbox, LightningCharge, EmojiSmile, ShieldCheck, People, GraphUp, Headset } from "react-bootstrap-icons";

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

  // Scroll Animation Observer for sections
  useEffect(() => {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.15 }
    );

    // Give it a tiny delay to allow React rendering to finish
    setTimeout(() => {
        const hiddenElements = document.querySelectorAll(".reveal");
        hiddenElements.forEach((el) => sectionObserver.observe(el));
    }, 100);

    return () => sectionObserver.disconnect();
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
          <div className="bg-grid"></div>
          <div className="bg-noise"></div>
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
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", paddingTop: "80px", position: "relative", zIndex: 1 }}>
        <Container>
          <Row className="align-items-center">
            <Col lg={7} className="text-center text-lg-start mb-5 mb-lg-0">
              <div className="glass-panel p-5 animate-fade-up animate-delay-1" style={{ borderRadius: "24px" }}>
                <span className="badge rounded-pill mb-3" style={{ background: "var(--primary-light)", color: "var(--brand-orange)", border: "1px solid rgba(242, 102, 35, 0.3)", padding: "8px 16px", fontWeight: "600" }}>
                  v2.0 UI Revamp
                </span>
                
                <h1 className="display-3 fw-bolder mb-3" style={{ letterSpacing: "-1.5px", lineHeight: "1.2" }}>
                  แชทเดียว ครบทุกอย่าง <b className="gradient-text">One Place</b>
                </h1>
                
                <p className="fs-5 text-secondary mb-4" style={{ lineHeight: "1.6", maxWidth: "600px", margin: "0 auto" }}>
                  คุยกับลูกค้า บันทึกโน๊ต และจัดการข้อมูลสำคัญได้ในที่เดียวแบบง่ายๆ <strong className="text-heading">แชทแบบเรียลไทม์</strong>
                  สร้างโน๊ตระหว่างคุยได้ทันที ใช้เทมเพลตช่วยตอบให้เร็วขึ้น จัดการข้อมูลลูกค้าอย่างเป็นระบบ เริ่มใช้งานได้ทันทีไม่ต้องติดตั้งอะไรเพิ่ม!
                </p>
                
                <div className="d-flex gap-3 justify-content-center justify-content-lg-start">
                  <button 
                    className="btn-brand btn-lg rounded-pill px-5" 
                    onClick={() => setShowModal(true)}
                  >
                    เรียนรู้การใช้งานเพิ่มเติม
                  </button>
                  <Link to="/signup">
                    <button className="btn-brand-outline btn-lg rounded-pill px-4">
                      สมัครการใช้งาน
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
                        สวัสดีค่ะ! 👋 ขอสอบถามหน่อยได้ไหมคะ
                    </div>
                    <div className="p-2 rounded-3 text-end ms-auto" style={{ background: "var(--bg-bubble-admin)", width: "fit-content", color: "var(--text-bubble-admin)", fontSize: "13px" }}>
                        สวัสดีค่ะ! มีอะไรให้ช่วยไหมคะ
                    </div>
                  </div>
               </div>
            </Col>
          </Row>
        </Container>
      </main>

      {/* --- SaaS Sections Start --- */}
      
      {/* 1. What is One Chat? */}
      <section className="py-5" style={{ zIndex: 1, position: "relative" }}>
        <Container>
          <div className="text-center mb-5 reveal">
            <span className="badge rounded-pill mb-3" style={{ background: "rgba(242,102,35,0.1)", color: "var(--brand-orange)", border: "1px solid rgba(242, 102, 35, 0.2)", padding: "6px 12px" }}>
              เข้าใจง่าย ตรงประเด็น
            </span>
            <h2 className="display-6 fw-bold mb-3">ยกระดับการสื่อสาร รวมทุกแชทไว้ในที่เดียว</h2>
            <p className="fs-5 text-secondary mx-auto" style={{ maxWidth: "700px" }}>
              One Chat รวมทุกการพูดคุยกับลูกค้ามาไว้ในพื้นที่ทำงานอัจฉริยะเพียงหน้าเดียว เลิกปวดหัวกับการสลับหน้าจอ แล้วเริ่มให้บริการลูกค้าอย่างรวดเร็วและตรงใจ จากทุกที่ที่คุณต้องการ
            </p>
          </div>
        </Container>
      </section>

      {/* 2. How It Works */}
      <section className="py-5" style={{ zIndex: 1, position: "relative" }}>
        <Container>
            <div className="text-center mb-5 reveal">
                <h3 className="fw-bolder">เริ่มต้นใช้งานง่ายๆ พร้อมตั้งค่าเสร็จในไม่กี่นาที</h3>
                <p className="text-muted">ระบบการทำงานที่ออกแบบมาเพื่อความรวดเร็วและลื่นไหล</p>
            </div>
            <Row className="text-center px-lg-5">
                <Col md={4} className="mb-4 reveal stagger-1">
                    <div className="glass-panel p-4 h-100 d-flex flex-column align-items-center">
                        <div className="rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: "60px", height: "60px", background: "rgba(242,102,35,0.1)", color: "var(--brand-orange)", fontSize: "24px" }}>
                            <Diagram3 />
                        </div>
                        <h5>1. เชื่อมต่อทุกช่องทาง</h5>
                        <p className="text-secondary small">เชื่อมโยง LINE, Facebook Messenger ผ่านระบบ Webhooks ที่ปลอดภัย</p>
                    </div>
                </Col>
                <Col md={4} className="mb-4 reveal stagger-2">
                    <div className="glass-panel p-4 h-100 d-flex flex-column align-items-center">
                        <div className="rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: "60px", height: "60px", background: "rgba(242,102,35,0.1)", color: "var(--brand-orange)", fontSize: "24px" }}>
                            <Inbox />
                        </div>
                        <h5>2. รวมแชทไว้ที่เดียว</h5>
                        <p className="text-secondary small">รับและจัดสรรทุกข้อความจากลูกค้าโดยอัตโนมัติ เข้าสู่อินบ็อกซ์ที่จัดการง่ายและเป็นระเบียบ</p>
                    </div>
                </Col>
                <Col md={4} className="mb-4 reveal stagger-3">
                    <div className="glass-panel p-4 h-100 d-flex flex-column align-items-center">
                        <div className="rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: "60px", height: "60px", background: "linear-gradient(135deg, #F26623, #e05512)", color: "#fff", fontSize: "24px" }}>
                            <ChatSquareDots />
                        </div>
                        <h5>3. ตอบกลับและแก้ปัญหา</h5>
                        <p className="text-secondary small">ทำงานร่วมกับทีมของคุณ และตอบกลับลูกค้าได้โดยตรง พร้อมรองรับการส่งรูปภาพและไฟล์ต่างๆ อย่างครบครัน</p>
                    </div>
                </Col>
            </Row>
        </Container>
      </section>

      {/* 3. Key Features */}
      <section className="py-5 mt-4" style={{ zIndex: 1, position: "relative" }}>
        <Container>
            <div className="mb-5 reveal">
                <h3 className="fw-bolder">ครบทุกฟีเจอร์ เพื่อการเติบโตของธุรกิจคุณ</h3>
                <p className="text-muted">อัดแน่นด้วยฟีเจอร์ทรงพลัง ภายใต้หน้าตาการใช้งานที่เรียบง่ายสบายตา</p>
            </div>
            <Row>
                {[
                    { icon: <Layers />, title: "จัดการง่ายในหน้าเดียว", desc: "จัดการทุกการพูดคุยกับลูกค้าได้อย่างลื่นไหล โดยไม่ต้องสลับแอปพลิเคชันไปมาให้วุ่นวาย" },
                    { icon: <LightningCharge />, title: "อัปเดตข้อมูลแบบเรียลไทม์", desc: "รับส่งข้อความรวดเร็วทันใจ ตอบสนองลูกค้าได้ทันทีแบบไม่มีสะดุด" },
                    { icon: <EmojiSmile />, title: "รองรับสื่อทุกรูปแบบ", desc: "รองรับการแสดงผลทั้งสติกเกอร์, อิโมจิ และการส่งไฟล์รูปภาพต่างๆ ได้อย่างสมบูรณ์แบบ" },
                    { icon: <People />, title: "ทำงานร่วมกันเป็นทีม", desc: "แชร์ข้อมูลเคสลูกค้ากันภายใน และส่งต่องานระหว่างแอดมิน ได้อย่างราบรื่นไร้รอยต่อ" },
                    { icon: <GraphUp />, title: "ภาพรวมและสถิติเชิงลึก", desc: "ตรวจสอบความเร็วในการตอบกลับ และบริหารจัดการปริมาณแชทของทีมได้อย่างมีประสิทธิภาพ" },
                    { icon: <ShieldCheck />, title: "ปลอดภัยระดับมาตรฐานสากล", desc: "ระบบจัดเก็บข้อความแบบเข้ารหัสขั้นสูง เพื่อปกป้องข้อมูลสำคัญของธุรกิจและลูกค้าของคุณ" }
                ].map((feature, idx) => (
                    <Col md={4} sm={6} className={`mb-4 reveal stagger-${(idx % 6) + 1}`} key={idx}>
                        <div className="glass-panel p-4 h-100" style={{ borderLeft: "3px solid var(--brand-orange)", borderTopLeftRadius: "0", borderBottomLeftRadius: "0" }}>
                            <div className="mb-3 text-brand fs-4">{feature.icon}</div>
                            <h6 className="fw-bold">{feature.title}</h6>
                            <p className="text-secondary small mb-0">{feature.desc}</p>
                        </div>
                    </Col>
                ))}
            </Row>
        </Container>
      </section>

      {/* 4. Use Cases */}
      <section className="py-5 mt-4" style={{ zIndex: 1, position: "relative" }}>
        <Container>
            <div className="text-center mb-5 reveal">
                <h3 className="fw-bolder">ออกแบบมาเพื่อทีมยุคใหม่</h3>
            </div>
            <Row className="justify-content-center">
                <Col lg={10}>
                    <div className="glass-panel p-0 overflow-hidden reveal stagger-1">
                        <Row className="g-0">
                            <Col md={4} className="p-4 border-end border-light" style={{ borderColor: 'var(--border-light)' }}>
                                <Headset className="fs-2 text-brand mb-3" />
                                <h5 className="fw-bold">ทีมบริการลูกค้า</h5>
                                <p className="text-secondary small">ปิดเคสและแก้ปัญหาได้ไวขึ้น พร้อมให้ความช่วยเหลือลูกค้าได้อย่างตรงจุด ด้วยข้อมูลประวัติการแชทที่ครบถ้วน</p>
                            </Col>
                            <Col md={4} className="p-4 border-end border-light" style={{ borderColor: 'var(--border-light)' }}>
                                <LightningCharge className="fs-2 text-brand mb-3" />
                                <h5 className="fw-bold">ทีมเซลส์และการขาย</h5>
                                <p className="text-secondary small">เข้าถึงและพูดคุยกับว่าที่ลูกค้า ผ่านแพลตฟอร์มที่พวกเขาใช้งานเป็นประจำได้แบบอัตโนมัติ</p>
                            </Col>
                            <Col md={4} className="p-4">
                                <People className="fs-2 text-brand mb-3" />
                                <h5 className="fw-bold">บริหารจัดการคอมมูนิตี้</h5>
                                <p className="text-secondary small">สร้างความสัมพันธ์อันดี บรอดแคสต์อัปเดตข่าวสาร และดูแลจัดการทุกการสนทนาได้อย่างทั่วถึง</p>
                            </Col>
                        </Row>
                    </div>
                </Col>
            </Row>
        </Container>
      </section>

      {/* 5. Call to Action */}
      <section className="py-5 my-5" style={{ zIndex: 1, position: "relative" }}>
        <Container>
            <div className="p-5 rounded-4 text-center reveal stagger-1 text-white shadow-lg overflow-hidden position-relative" style={{ background: "linear-gradient(135deg, #F26623, #d95115)", border: "1px solid rgba(255,255,255,0.2)" }}>
                {/* Decorative BG pattern */}
                <div style={{ position: "absolute", right: "-10%", top: "-50%", opacity: "0.1", transform: "scale(2)", pointerEvents: "none" }}>
                    <Diagram3 size={300} />
                </div>
                <div className="position-relative z-1">
                    <h2 className="fw-bold mb-3">พลิกโฉมการทำงานของคุณให้ง่ายขึ้นตั้งแต่วันนี้</h2>
                    <p className="fs-5 mb-4 text-white-50 mx-auto" style={{ maxWidth: "600px" }}>
                        ก้าวไปพร้อมกับทีมธุรกิจยุคใหม่ที่เติบโตอย่างต่อเนื่อง ซึ่งเลือกใช้ One Chat ในการเชื่อมต่อและพูดคุยกับลูกค้าอย่างปลอดภัยในทุกๆ วัน
                    </p>
                    <Link to="/signup">
                        <button className="btn btn-light rounded-pill px-5 py-3 fw-bold shadow-sm" style={{ color: "var(--brand-orange)", transition: "transform 0.2s" }} onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"} onMouseLeave={(e) => e.target.style.transform = "scale(1)"}>
                            สร้างบัญชีของคุณกันเลย!
                        </button>
                    </Link>
                </div>
            </div>
        </Container>
      </section>

      <AccountModal show={showModal} onHide={() => setShowModal(false)} />
    </div>
  );
};

export default Home;
