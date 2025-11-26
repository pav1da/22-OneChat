import React, { useState } from 'react';
import { Container, Row, Col, Form, Card } from 'react-bootstrap';
import { ChevronRight } from 'react-bootstrap-icons';

// Mock Data: ข้อมูลตัวอย่าง (ในอนาคตดึงจาก API)
const initialLogs = [
    {
        id: 1,
        user: "pav1da",
        action: "ได้สร้าง โน้ต สำหรับ",
        target: "Harumasa",
        date: "25 ธันวาคม 2560",
        time: "14:30",
        avatar: "https://i.pravatar.cc/150?img=1" // ใส่รูปโปรไฟล์จริงตรงนี้
    },
    {
        id: 2,
        user: "pav1da",
        action: "เป็น ผู้รับผิดชอบ สำหรับ",
        target: "Harumasa",
        date: "25 ธันวาคม 2560",
        time: "12:00",
        avatar: "https://i.pravatar.cc/150?img=1"
    },
    {
        id: 3,
        user: "Pheem",
        action: "ได้เข้าร่วมทีม",
        target: "Facebook",
        date: "1 ธันวาคม 2560",
        time: "16:25",
        avatar: "https://i.pravatar.cc/150?img=12"
    },
    {
        id: 4,
        user: "pav1da",
        action: "ได้เพิ่ม Pheem ในทีม",
        target: "Facebook",
        date: "1 ธันวาคม 2560",
        time: "16:25",
        avatar: "https://i.pravatar.cc/150?img=1"
    }
];

function ActivityLog() {
    const [searchTerm, setSearchTerm] = useState("");
    const [actionFilter, setActionFilter] = useState("");

    // ฟังก์ชันกรองข้อมูล (Filter Logic)
    const filteredLogs = initialLogs.filter(log => {
        const matchesUser = log.user.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesAction = log.action.toLowerCase().includes(actionFilter.toLowerCase()) || 
                              log.target.toLowerCase().includes(actionFilter.toLowerCase());
        return matchesUser && matchesAction;
    });

    return (
        <Container fluid className="py-4 px-4" style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
            
            {/* --- Header & Filters --- */}
            <Row className="mb-4 align-items-center">
                <Col md={4}>
                    <h3 className="fw-bold mb-0">ตรวจสอบบันทึก</h3>
                </Col>
                 
                <Col md={8}>
                    <div className="d-flex justify-content-md-end gap-3 align-items-center flex-wrap">
                        {/* Filter 1: กรองโดยผู้ใช้ */}
                        <div className="d-flex align-items-center gap-2">
                            <span className="fw-bold" style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}>กรองโดยผู้ใช้ :</span>
                            <Form.Control 
                                type="text" 
                                placeholder="ค้นหาสมาชิก"  
                                className="bg-light border-0"
                                style={{ width: '200px' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filter 2: กรองโดยการกระทำ */}
                        <div className="d-flex align-items-center gap-2">
                            <span className="fw-bold" style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}>กรองโดยการกระทำ :</span>
                            <Form.Select 
                                className="bg-light border-0" 
                                style={{ width: '200px' }}
                                onChange={(e) => setActionFilter(e.target.value)}
                            >
                                <option value="">ทั้งหมด</option>
                                <option value="สร้าง โน้ต">สร้าง โน้ต</option>
                                <option value="ผู้รับผิดชอบ">ผู้รับผิดชอบ</option>
                                <option value="เข้าร่วมทีม">เข้าร่วมทีม</option>
                                <option value="เพิ่ม">เพิ่มสมาชิก</option>
                            </Form.Select>
                        </div>
                    </div>
                </Col>
            </Row>

            <hr className="mb-4 text-muted" />

            {/* --- Log List --- */}
            <div className="d-flex flex-column gap-3">
                {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                        <Card key={log.id} className="border-0 bg-light rounded-4 shadow-sm p-3">
                            <div className="d-flex align-items-center justify-content-between">
                                
                                {/* ส่วนซ้าย: รูป + ข้อความ */}
                                <div className="d-flex align-items-center gap-3">
                                    {/* Avatar Image */}
                                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                                        <img 
                                            src={log.avatar} 
                                            alt={log.user} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        />
                                    </div>
                                    
                                    {/* Text Info */} 
                                    <div>
                                        <div className="mb-1" style={{ fontSize: '1rem', color: '#000' }}>
                                            <span className="fw-bold">{log.user}</span> {log.action} <span className="fw-bold">{log.target}</span>
                                        </div>
                                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                                            วันที่ {log.date} เวลา {log.time}
                                        </div>
                                    </div>
                                </div>

                                {/* ส่วนขวา: ไอคอนลูกศร */}
                                <div className="text-muted pe-2" style={{ cursor: 'pointer' }}>
                                    <ChevronRight size={20} />
                                </div>

                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="text-center text-muted py-5">
                        ไม่พบข้อมูลการแจ้งเตือน
                    </div>
                )}
            </div>

        </Container>
    );
}

export default ActivityLog;