import { useState } from "react";
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
                return <Account currentUserId={user?.id} />;

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
                return <Account currentUserId={user?.id} />;
        }
    };

    return (
        <div className="settings-page-wrapper mx-4">
            <Container fluid className="h-100 d-flex flex-column">

                <Row className="flex-grow-1 h-100">
                    {/* ===== คอลัมน์ซ้าย: เมนู (Left Menu) ===== */}
                    <Col md={3} lg={3} className="custom-vertical-divider pe-0 py-4 scrollable-col settings-sidebar">

                        <h4 className="fw-bold mb-4 px-3" style={{ fontSize: '1.5rem' }}>Setting</h4>

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
                    <Col md={9} lg={9} className="ps-md-5 py-4 scrollable-col bg-white">
                        {renderContent()}
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default Setting;