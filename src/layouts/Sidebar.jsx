import { Nav, Dropdown } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./Sidebar.css";

const defaultProfile = "https://i.pravatar.cc/150?img=12";

const Sidebar = ({ onLogout, currentUser }) => {
    const location = useLocation();
    const isActive = (path) => location.pathname.startsWith(path);
    const userImage = currentUser?.image || defaultProfile;

    // ฟังก์ชันจำลองการสลับโหมด (คุณต้องไปเขียน Logic จริงเพิ่มใน App.js ภายหลัง)
    const handleThemeToggle = () => {
        console.log("Toggle Theme Clicked");
        alert("ฟังก์ชันเปลี่ยนธีม (Light/Dark) จะทำงานเมื่อเชื่อมต่อระบบ Theme");
    };

    return (
        <div className="sidebar-container d-flex flex-column justify-content-between">

            {/* ================= ส่วนบน (Logo & Menu) เหมือนเดิม ================= */}
            <div className="d-flex flex-column align-items-center w-100 pt-4">
                <div className="brand-logo mb-5">
                    <img src="/public/sb-logo.png" alt="Logo" style={{ width: '90%', height: 'auto' }} />
                </div>
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
                    <Nav.Link as={Link} to="/notification" className={`sidebar-item ${isActive('/notificationpage') ? 'active' : ''}`}>
                        <i className="bi bi-bell"></i>
                    </Nav.Link>
                    <Nav.Link as={Link} to="/member" className={`sidebar-item ${isActive('/member') ? 'active' : ''}`}>
                        <i className="bi bi-person"></i>
                    </Nav.Link>
                </Nav>
            </div>

            {/* ================= ส่วนล่าง ================= */}
            <div className="d-flex flex-column align-items-center w-100 pb-5 gap-4">

                {/* รูปโปรไฟล์ */}
                <div className="sidebar-profile">
                    <img
                        src={userImage}
                        alt="Profile"
                        style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                </div>

                {/* Dropdown Menu (ปุ่ม 3 ขีด) */}
                <Dropdown drop="up" className="w-100 d-flex justify-content-center">

                    {/* ปุ่มกด (Toggle) */}
                    <Dropdown.Toggle
                        as="div"
                        className={`sidebar-item ${isActive('/setting') ? 'active' : ''}`}
                        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                    >
                        <i className="bi bi-list" style={{ fontSize: '1.8rem' }}></i>
                    </Dropdown.Toggle>

                    {/* รายการเมนู */}
                    <Dropdown.Menu className="mb-2 shadow border-0 rounded-4 p-2" style={{ minWidth: '220px' }}>

                        {/* 1. Setting */}
                        <Dropdown.Item as={Link} to="/setting">
                            <i className="bi bi-gear me-2"></i> Setting
                        </Dropdown.Item>

                        {/* 2. Log (ตรวจสอบบันทึก) */}
                        {/* อย่าลืมไปเปิด Route /log ใน App.js ด้วยนะครับ */}
                        <Dropdown.Item as={Link} to="/log">
                            <i className="bi bi-file-earmark-text me-2"></i> ตรวจสอบบันทึก
                        </Dropdown.Item>

                        {/* 3. สลับโหมด (Light/Dark) */}
                        <Dropdown.Item onClick={handleThemeToggle}>
                            <i className="bi bi-moon-stars me-2"></i> สลับโหมด (Light/Dark)
                        </Dropdown.Item>

                        <Dropdown.Divider />

                        {/* 4. ออกจากระบบ (ย้ายจากปุ่มหูฟังมาไว้ที่นี่) */}
                        <Dropdown.Item onClick={onLogout} className="text-danger">
                            <i className="bi bi-box-arrow-right me-2"></i> ออกจากระบบ
                        </Dropdown.Item>

                    </Dropdown.Menu>
                </Dropdown>

                {/* ลบปุ่มหูฟัง (Logout เดิม) ออก เพราะย้ายเข้าไปข้างในแล้ว */}

            </div>
        </div>
    );
};

export default Sidebar;