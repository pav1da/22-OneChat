import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Nav } from "react-bootstrap";
import {
    Person,
    Link45deg,
    Bell,
    ChatDots,
    FileText,
    InfoCircle,
    Send
} from "react-bootstrap-icons";

import "./SettingPage.css";

import Account from './Account';
import Notifications from './Notifications';
import Chats from './Chats';
import Ai from './Ai';
import Connect from './Connect';
import Policy from './Policy';
import Contact from './Contact';
import About from './About';

function Setting({ user }) {
    const [activeKey, setActiveKey] = useState('account');
    const navigate = useNavigate();

    // ฟังก์ชันตรวจสอบสิทธิ์
    const allow = (roles) => {
        if (!user) return false;
        if (user.role === 'it') return true; // it เห็นหมด
        return roles.includes(user.role);
    };

    const handleSelect = (selectedKey) => {
        setActiveKey(selectedKey);
    };

    const renderContent = () => {
        switch (activeKey) {
            // 👇 แก้บรรทัดนี้ครับ (เดิมเป็น <Account /> เฉยๆ)
            case 'account':
                return <Account user={user} />;

            // ป้องกันการเข้าถึงเนื้อหาด้วย (เผื่อคนกดเล่น)
            case 'connect': return allow([]) ? <Connect /> : null;

            // ... (ส่วนอื่นๆ เหมือนเดิม)
            case 'notifications': return <Notifications />;
            case 'chat': return <Chats />;
            case 'ai': return <Ai />;
            case 'policy': return <Policy />;
            case 'contact': return <Contact />;
            case 'about': return <About />;

            // 👇 แก้บรรทัดนี้ด้วยครับ (Default case)
            default:
                return <Account user={user} />;
        }
    };

    return (
        <div className="kanit-regular settings-page-wrapper mx-4 px-3 py-3 modal-open">
            <Container fluid className="h-100 d-flex flex-column">

                <Row className="flex-grow-1 h-100">
                    {/* ===== คอลัมน์ซ้าย: เมนู (Left Menu) ===== */}
                    <Col md={3} lg={3} className="custom-vertical-divider pe-0 py-4 scrollable-col settings-sidebar">

                        <h4 className="mb-4 px-3 fs-3">Setting</h4>

                        <Nav
                            className="flex-column settings-nav px-2"
                            activeKey={activeKey}
                            onSelect={handleSelect}
                        >
                            {/* --- กลุ่ม 1: ตั้งค่าผู้ใช้ --- */}
                            <div className="nav-heading mt-2">ตั้งค่าผู้ใช้</div>

                            <Nav.Link eventKey="account">
                                <Person size={20} /> บัญชีของฉัน
                            </Nav.Link>

                            {/* ========== แก้ไขตรงนี้ ========== */}
                            {/* ใช้ allow([]) เพื่อให้เห็นแค่ IT เท่านั้น (User/Admin จะไม่เห็น) */}
                            {allow([]) && (
                                <Nav.Link eventKey="connect">
                                    <Link45deg size={20} /> เชื่อมต่อบัญชีใหม่
                                </Nav.Link>
                            )}
                            {/* =============================== */}


                            {/* --- กลุ่ม 2: ทั่วไป --- */}
                            <div className="nav-heading mt-4">ทั่วไป</div>

                            <Nav.Link eventKey="notifications">
                                <Bell size={18} /> การแจ้งเตือน
                            </Nav.Link>

                            <Nav.Link eventKey="chat">
                                <ChatDots size={18} /> แชท
                            </Nav.Link>

                            <Nav.Link eventKey="ai">
                                <span style={{ fontWeight: 'bold', fontSize: '0.9rem', marginRight: '4px' }}>AI</span> เอไอ เมต้าแชท
                            </Nav.Link>


                            {/* --- กลุ่ม 3: ข้อมูลเกี่ยวกับแอป --- */}
                            <div className="nav-heading mt-4">ข้อมูลเกี่ยวกับแอป</div>

                            <Nav.Link eventKey="policy">
                                <FileText size={18} /> นโยบายความเป็นส่วนตัว
                            </Nav.Link>

                            <Nav.Link eventKey="contact">
                                <Send size={18} style={{ transform: 'rotate(-45deg)' }} /> ติดต่อเรา
                            </Nav.Link>

                            <Nav.Link eventKey="about">
                                <InfoCircle size={18} /> เกี่ยวกับ One Chat
                            </Nav.Link>
                        </Nav>
                    </Col>

                    {/* ===== คอลัมน์ขวา: เนื้อหา (Content) ===== */}
                    <Col md={9} lg={9} className="ps-md-5 py-4 scrollable-col bg-transparent">
                        {/* background content kept empty because settings will show as centered modal overlay */}
                    </Col>
                </Row>
            </Container>

            {/* Centered modal overlay with internal nav + content */}
            <div className="settings-modal-overlay">
                <div className="floating-modal">
                    <button
                        className="settings-close-btn"
                        onClick={() => navigate(-1)}
                        aria-label="Close settings"
                    >
                        ×
                    </button>
                    <Container fluid>
                        <Row>
                            {/* Left menu inside modal */}
                            <Col md={3} className="modal-left-nav pe-3">
                                <h5 className="mb-3">Setting</h5>
                                <Nav
                                    className="flex-column settings-nav px-1"
                                    activeKey={activeKey}
                                    onSelect={handleSelect}
                                >
                                    <div className="nav-heading mt-2">ตั้งค่าผู้ใช้</div>
                                    <Nav.Link eventKey="account">
                                        <Person size={18} /> บัญชีของฉัน
                                    </Nav.Link>
                                    {allow([]) && (
                                        <Nav.Link eventKey="connect">
                                            <Link45deg size={18} /> เชื่อมต่อบัญชีใหม่
                                        </Nav.Link>
                                    )}

                                    <div className="nav-heading mt-4">ทั่วไป</div>
                                    <Nav.Link eventKey="notifications">
                                        <Bell size={16} /> การแจ้งเตือน
                                    </Nav.Link>
                                    <Nav.Link eventKey="chat">
                                        <ChatDots size={16} /> แชท
                                    </Nav.Link>
                                    <Nav.Link eventKey="ai">
                                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem', marginRight: '4px' }}>AI</span> เอไอ เมต้าแชท
                                    </Nav.Link>

                                    <div className="nav-heading mt-4">ข้อมูลเกี่ยวกับแอป</div>
                                    <Nav.Link eventKey="policy">
                                        <FileText size={16} /> นโยบายความเป็นส่วนตัว
                                    </Nav.Link>
                                    <Nav.Link eventKey="contact">
                                        <Send size={16} style={{ transform: 'rotate(-45deg)' }} /> ติดต่อเรา
                                    </Nav.Link>
                                    <Nav.Link eventKey="about">
                                        <InfoCircle size={16} /> เกี่ยวกับ One Chat
                                    </Nav.Link>
                                </Nav>
                            </Col>

                            {/* Right content inside modal */}
                            <Col md={9} className="ps-4 modal-content-col">
                                {renderContent()}
                            </Col>
                        </Row>
                    </Container>
                </div>
            </div>
        </div>
    );
}

export default Setting;