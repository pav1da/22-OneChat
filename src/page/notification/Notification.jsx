import React, { useState } from 'react';
import { Container, Form, Row, Col } from 'react-bootstrap';
import "./notification.css"

// ข้อมูลจำลอง (Mock Data) - แก้ไขรูปภาพและข้อความตรงนี้ได้เลย
const mockNotifications = [
    {
        id: 1,
        // ใช้รูป placeholder หรือเปลี่ยนเป็น path รูปจริงของคุณ เช่น "/images/profile1.jpg"
        avatar: "https://i.pravatar.cc/150?img=5",
        text: "pav1da ได้เข้าถึงข้อความของ Harumasa บน Facebook : Dew Flower Shop",
        date: "25 ธันวาคม 2560 เวลา 14:40"
    },
    {
        id: 2,
        avatar: "https://i.pravatar.cc/150?img=11",
        text: "มีข้อความใหม่จาก Harumasa ที่ Facebook: Dew Flower Shop",
        date: "25 ธันวาคม 2560 เวลา 14:30"
    },
    {
        id: 3,
        avatar: "https://i.pravatar.cc/150?img=9",
        text: "มีข้อความใหม่จาก Jane Dose ที่ Facebook: Dew Flower Shop",
        date: "25 ธันวาคม 2560 เวลา 12:00"
    }
];

function NotificationPage() {
    const [filterUser, setFilterUser] = useState("");
    const [filterAction, setFilterAction] = useState("");

    return (
        <Container fluid className="px-4 py-3 mx-4 page-wrap">

            {/* --- ส่วนหัว (Header) --- */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 mx-3 mt-3" >
                {/* หัวข้อสีส้ม */}
                <h4 className="fw-bold mb-3 mb-md-0" style={{ color: '#F26623' }}>
                    Notification
                </h4>

                {/* ตัวกรอง (Filters) */}
                <div className="d-flex gap-3 align-items-center flex-wrap">

                    {/* กรองโดยผู้ใช้ */}
                    <div className="d-flex align-items-center gap-2">
                        <span style={{ fontSize: '0.9rem', fontWeight: '500', whiteSpace: 'nowrap' }}>กรองโดยผู้ใช้ :</span>
                        <Form.Select
                            size="sm"
                            style={{ width: '150px', backgroundColor: '#F0F0F0', border: 'none', borderRadius: '6px' }}
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
                        <span style={{ fontSize: '0.9rem', fontWeight: '500', whiteSpace: 'nowrap' }}>กรองโดยการกระทำ :</span>
                        <Form.Select
                            size="sm"
                            style={{ width: '150px', backgroundColor: '#F0F0F0', border: 'none', borderRadius: '6px' }}
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                        >
                            <option value="">ค้นหาการกระทำ</option>
                            <option value="access">เข้าถึงข้อความ</option>
                            <option value="new_msg">ข้อความใหม่</option>
                        </Form.Select>
                    </div>
                </div>
            </div>

            <hr style={{ borderTop: '1px solid #b42929ff', marginBottom: '25px' }} />

            {/* --- รายการแจ้งเตือน (Notification List) --- */}
            <div className="d-flex flex-column gap-3">
                {mockNotifications.map((item) => (
                    <div
                        key={item.id}
                        className="d-flex align-items-center p-3"
                        style={{
                            backgroundColor: '#F7F8F9', // สีพื้นหลังเทาอ่อนๆ ตามรูป
                            borderRadius: '16px',       // ขอบมน
                            border: '1px solid #EAEAEA' // เส้นขอบจางๆ
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
                            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#000', marginBottom: '4px' }}>
                                {item.text}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#666' }}>
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