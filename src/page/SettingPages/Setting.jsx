// src/page/settingpages/Setting.jsx

import { useState } from "react";
import { Container, Row, Col, Nav } from "react-bootstrap";
import {
    PersonCircle, ChevronRight, PersonVcard, ShieldLock, Bell,
    Chat as ChatIcon, Robot, Plug, SlashCircle, FileEarmarkText,
    Telephone, InfoCircle
} from "react-bootstrap-icons";

import "./SettingPage.css";

// ⭐️ 1. Import ไฟล์ลูกทั้งหมดที่คุณสร้าง ⭐️
// import Profile from './Profile';
import Privacy from './Privacy';
import Account from './Account'; 
import Notifications from './Notifications'; 
import Chats from './Chats';
import Ai from './Ai';
import Connect from './Connect'; 
import Disconnect from './Disconnect'; 
import Policy from './Policy';
import Contact from './Contact';
import About from './About';

function Setting() {
   
    const [activeKey, setActiveKey] = useState('profile');

    const handleSelect = (selectedKey) => {
        setActiveKey(selectedKey);
    };

    
    const renderContent = () => {
        switch (activeKey) {
            case 'account':
                return <Account />; 
            case 'Privacy':
                return <Privacy />; 
            case 'notifications':
                return <Notifications />; 
            case 'chat':
                return <Chats />;
            case 'ai':
                return <Ai />;
            case 'connect':
                return <Connect />;
            case 'disconnect':
                return <Disconnect />;
            case 'policy':
                return <Policy />;
            case 'contact':
                return <Contact />;
            case 'about':
                return <About />;

            
            default:
                return <Account />; 
        }
    };

    return (
        <div className="settings-page-wrapper">
            <Container fluid className="h-100 d-flex flex-column">
                <h1 className="fw-bold mb-4 pt-3" style={{ marginLeft: '20px', marginTop: '20px' }}>Setting</h1>
                <hr className="my-4" />

                <Row className="flex-grow-1" style={{ overflow: 'hidden' }}>
                    {/* ===== คอลัมน์ซ้าย: เมนู (Left Menu) ===== */}
                    <Col md={4} lg={3} className="custom-vertical-divider pe-md-4 scrollable-col">

                        
                        <div
                            className={`profile-nav-item d-flex align-items-center mb-4 p-3 ${activeKey === 'profile' ? 'active' : ''}`}
                            onClick={() => handleSelect('profile')} // สั่งให้ State เปลี่ยน
                            style={{ cursor: 'pointer' }} // เพิ่มให้รู้ว่ากดได้
                        >
                            <div className="profile-placeholder-sm">
                                <PersonCircle size={28} className="text-muted" />
                            </div>
                            <div className="flex-grow-1">
                                <h5 className="fw-bold m-0">Profile</h5>
                            </div>
                            <ChevronRight size={20} className="text-muted" />
                        </div>

                        
                        <Nav
                            className="flex-column settings-nav "
                            activeKey={activeKey}
                            onSelect={handleSelect} 
                        >
                            <div className="nav-heading">ข้อมูลส่วนตัว</div>
                            <Nav.Link eventKey="account">
                                <PersonVcard /> บัญชี
                            </Nav.Link>
                            <Nav.Link eventKey="Privacy">
                                <ShieldLock /> ความเป็นส่วนตัว
                            </Nav.Link>

                            <div className="nav-heading">ทั่วไป</div>
                            <Nav.Link eventKey="notifications">
                                <Bell /> การแจ้งเตือน
                            </Nav.Link>

                            <Nav.Link eventKey="chat">
                                <ChatIcon /> แชท
                            </Nav.Link>
                            <Nav.Link eventKey="ai">
                                <Robot /> เอไอ เมต้าแชท
                            </Nav.Link>

                            <div className="nav-heading">การเชื่อมต่อบัญชี</div>
                            <Nav.Link eventKey="connect">
                                <Plug /> เชื่อมต่อบัญชีใหม่
                            </Nav.Link>
                            <Nav.Link eventKey="disconnect">
                                <SlashCircle /> ยกเลิกการเชื่อมต่อ
                            </Nav.Link>

                            <div className="nav-heading">ข้อมูลเกี่ยวกับแอป</div>
                            <Nav.Link eventKey="policy">
                                <FileEarmarkText /> นโยบายความเป็นส่วนตัว
                            </Nav.Link>
                            <Nav.Link eventKey="contact">
                                <Telephone /> ติดต่อเรา
                            </Nav.Link>
                            <Nav.Link eventKey="about">
                                <InfoCircle /> เกี่ยวกับ One Chat
                            </Nav.Link>
                        </Nav>
                    </Col>

                    {/* ===== คอลัมน์ขวา: เนื้อหา (Content) ===== */}
                    <Col md={8} lg={9} className="ps-md-5 mt-4 mt-md-0 scrollable-col">

                        {/* เรียกใช้ฟังก์ชันสลับหน้า */}
                        {renderContent()}

                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default Setting; 