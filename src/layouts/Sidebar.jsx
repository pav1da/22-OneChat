import { Nav } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Sidebar.css";

const profilePic = "https://i.pravatar.cc/150?img=12";

const Sidebar = ({ onLogout }) => {
    const location = useLocation();
    const isActive = (path) => location.pathname.startsWith(path);

    return (
        <div className="sidebar-container d-flex flex-column justify-content-between">

            {/* ================= ส่วนบน ================= */}
            {/* เพิ่ม pt-4 เป็น pt-5 เพื่อดันโลโก้ลงมาอีกนิด */}
            <div className="d-flex flex-column align-items-center w-100 pt-5">

                {/* 1. LOGO */}
                {/* เพิ่ม mb-4 เป็น mb-5 เพื่อเว้นระยะห่างจากโลโก้ถึงเมนูแรกให้มากขึ้น */}
                <div className="brand-logo mb-5">
                    <img
                        src="/public/logo.svg"   // เปลี่ยนเป็น path รูปของคุณ
                        alt="Logo"
                        style={{ width: '60%', height: 'auto' }} // ปรับขนาดรูปตามต้องการ
                    />
                </div>

                {/* 2. เมนูหลัก */}
                {/* เปลี่ยน gap-3 เป็น gap-4 เพื่อให้ไอคอนแต่ละอันห่างกันสวยงาม */}
                <Nav className="flex-column w-100 align-items-center gap-4">

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
                        to="/notificationpage"  
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
                    <img src={profilePic} alt="Profile" />
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