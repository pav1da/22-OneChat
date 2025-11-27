import { useState } from 'react';
import { Container, Form } from 'react-bootstrap';
import "./notification.css"

// ข้อมูลจำลอง (Mock Data)
const mockNotifications = [
    {
        id: 1,
        avatar: "./src/assets/Image/Admins/pav1da.png",
        text: "pav1da ได้เข้าถึงข้อความของ Harumasa บน Facebook : Dew Flower Shop",
        date: "25 ธันวาคม 2560 เวลา 14:40"
    },
    {
        id: 2,
        avatar: "./src/assets/Image/Customers/Harumasa.png",
        text: "มีข้อความใหม่จาก Harumasa ที่ Facebook: Dew Flower Shop",
        date: "25 ธันวาคม 2560 เวลา 14:30"
    },
    {
        id: 3,
        avatar: "./src/assets/Image/Customers/JaneDoe.png",
        text: "มีข้อความใหม่จาก Jane Dose ที่ Facebook: Dew Flower Shop",
        date: "25 ธันวาคม 2560 เวลา 12:00"
    }
];

function NotificationPage() {
    const [filterUser, setFilterUser] = useState("");
    const [filterAction, setFilterAction] = useState("");

    return (
        <Container fluid className="kanit-regular px-5 py-4 mx-4 page-wrap">

            {/* --- ส่วนหัว (Header) --- */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 mx-3 mt-3" >
                {/* หัวข้อสีส้ม */}
                <h4 className="mb-3 mb-md-0 fs-3" style={{ color: '#F26623' }}>
                    Notification
                </h4>

                {/* ตัวกรอง (Filters) */}
                <div className="d-flex gap-3 align-items-center flex-wrap">

                    {/* กรองโดยผู้ใช้ */}
                    <div className="d-flex align-items-center gap-2">
                        <span className='fs-6' style={{ whiteSpace: 'nowrap' }}>กรองโดยผู้ใช้ :</span>
                        <Form.Select
                            size="m"
                            className='custom-filters'
                            value={filterUser}
                            onChange={(e) => setFilterUser(e.target.value)}
                        >
                            <option value="">ค้นหาสมาชิก</option>
                            <option value="pav1da">pav1da</option>
                            <option value="system">System</option>
                        </Form.Select>
                    </div>

                    {/* กรองโดยการกระทำ */}
                    <div className="d-flex align-items-center gap-2">
                        <span className='fs-6' style={{ whiteSpace: 'nowrap' }}>กรองโดยการกระทำ :</span>
                        <Form.Select
                            size="m"
                            className='custom-filters'
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                        >
                            <option value="" className='option-filter'>ค้นหาการกระทำ</option>
                            <option value="access" className='option-filter'>เข้าถึงข้อความ</option>
                            <option value="new_msg" className='option-filter'>ข้อความใหม่</option>
                        </Form.Select>
                    </div>
                </div>
            </div>

            <hr style={{ borderTop: '1px solid #444', marginBottom: '25px' }} />

            {/* --- รายการแจ้งเตือน (Notification List) --- */}
            <div className="d-flex flex-column gap-3">
                {mockNotifications.map((item) => (
                    <div
                        key={item.id}
                        className="d-flex align-items-center p-3 notification-card"
                        style={{
                            backgroundColor: '#fff', // สีพื้นหลังเดิม
                            borderRadius: '16px',
                            border: '1px solid #c5c5c5',
                            cursor: 'pointer',           // เปลี่ยนเมาส์เป็นรูปมือ
                            transition: 'all 0.2s ease'  // เพิ่ม transition ให้ลื่นไหล
                        }}
                        // เพิ่ม Event เมื่อเมาส์ชี้ (Hover)
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#EAEBEF"; // เปลี่ยนสีเข้มขึ้น
                            e.currentTarget.style.transform = "translateY(-2px)"; // ลอยขึ้นนิดนึง
                            e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)"; // มีเงา
                        }}
                        // เพิ่ม Event เมื่อเมาส์ออก (Reset กลับ)
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#F7F8F9"; // กลับสีเดิม
                            e.currentTarget.style.transform = "translateY(0)"; // กลับที่เดิม
                            e.currentTarget.style.boxShadow = "none"; // เอาเงาออก
                        }}
                    >
                        {/* รูปโปรไฟล์ */}
                        <div style={{ flexShrink: 0, marginRight: '20px' }}>
                            <img
                                src={item.avatar}
                                alt="avatar"
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    objectFit: 'cover'
                                }}
                            />
                        </div>

                        {/* ข้อความ */}
                        <div>
                            <div className='fs-5' style={{ color: '#000', marginBottom: '4px' }}>
                                {item.text}
                            </div>
                            <div className="fs-6" style={{ color: '#666' }}>
                                วันที่ {item.date}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Container>
    );
}

export default NotificationPage;