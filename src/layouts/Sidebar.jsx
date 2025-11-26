import { Nav } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Sidebar.css";



const Sidebar = ({ onLogout, currentUser }) => {
    const location = useLocation();
    const isActive = (path) => location.pathname.startsWith(path);

    // 2. เช็คว่ามี currentUser ไหม? ถ้ามีให้ใช้รูปของเขา ถ้าไม่มีใช้รูป default
    // เครื่องหมาย ?. คือการกัน Error (ถ้า currentUser เป็น null จะไม่พัง)
    const userImage = currentUser?.image || defaultProfile;

    return (
        <div className="sidebar-container d-flex flex-column justify-content-between">

            {/* ================= ส่วนบน ================= */}
            {/* เพิ่ม pt-4 เป็น pt-5 เพื่อดันโลโก้ลงมาอีกนิด */}
            <div className="d-flex flex-column align-items-center w-100 pt-4">
                <div className="brand-logo mb-5">
                    <img
                        src="/public/sb-logo.png"
                        alt="Logo"
                        style={{ width: '90%', height: 'auto' }}
                    />
                </div>

                {/* 2. เมนูหลัก */}
                {/* เปลี่ยน gap-3 เป็น gap-4 เพื่อให้ไอคอนแต่ละอันห่างกันสวยงาม */}
                <Nav className="flex-column w-100 align-items-center gap-2">

                    <Nav.Link as={Link} to="/inbox" className={`sidebar-item ${isActive('/inbox') ? 'active' : ''}`}>
                        <i className="bi bi-chat-dots"></i>
                    </Nav.Link>

                    <Nav.Link as={Link} to="/dashboard" className={`sidebar-item ${isActive('/dashboard') ? 'active' : ''}`}>
                        <i className="bi bi-grid"></i>
                    </Nav.Link>

                    <Nav.Link as={Link} to="/card-message" className={`sidebar-item ${isActive('/card-message') ? 'active' : ''}`}>
                        <i className="bi bi-chat-square-quote"></i>
                    </Nav.Link>

                    <Nav.Link
                        as={Link}
                        to="/notification"
                        className={`sidebar-item ${isActive('/notificationpage') ? 'active' : ''}`}
                    >
                        <i className="bi bi-bell"></i>
                    </Nav.Link>

                    <Nav.Link as={Link} to="/member" className={`sidebar-item ${isActive('/member') ? 'active' : ''}`}>
                        <i className="bi bi-person"></i>
                    </Nav.Link>

                </Nav>
            </div>


            {/* ================= ส่วนล่าง ================= */}
            {/* เพิ่ม pb-4 เป็น pb-5 และ gap-3 เป็น gap-4 */}
            <div className="d-flex flex-column align-items-center w-100 pb-5 gap-4">

                {/* รูปโปรไฟล์ */}
                <div className="sidebar-profile">
                    <img 
                        src={userImage} 
                        alt="Profile" 
                        style={{ 
                            width: '50px',     // บังคับขนาด
                            height: '50px',    // บังคับขนาด
                            borderRadius: '50%', // ทำเป็นวงกลม
                            objectFit: 'cover'   // กันภาพเบี้ยว
                        }}
                    />
                </div>

                {/* Setting */}
                <Nav.Link as={Link} to="/setting" className={`sidebar-item ${isActive('/setting') ? 'active' : ''}`}>
                    <i className="bi bi-list" style={{ fontSize: '1.8rem' }}></i>
                </Nav.Link>

                {/* Logout */}
                <Nav.Link onClick={onLogout} className="sidebar-item" style={{ cursor: 'pointer' }}>
                    <i className="bi bi-headset"></i>
                </Nav.Link>

            </div>
        </div>
    );
};

export default Sidebar;