// AiMain.jsx
import { Form, Button } from 'react-bootstrap';

function AiMain({ onNavigate }) { // รับ props onNavigate
    const btnStyle = {
        backgroundColor: '#333', borderColor: '#333', borderRadius: '6px', 
        padding: '6px 20px', fontSize: '0.9rem', fontWeight: '500'
    }; 

    return (
        <div className="px-3 pt-2 mt-3" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="mb-4">
                <h5 className="mb-2 fw-bold" style={{ fontSize: '1.1rem' }}>AI Chat</h5>
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                    กำหนดข้อความล่วงหน้าเพื่อให้ระบบตอบไปยังผู้ใช้อัตโนมัติ
                </p>
            </div>

            {/* กล่องที่ 1 */}
            <div className="d-flex justify-content-between align-items-center border rounded-3 p-3 mb-3 bg-white">
                <div>
                    <h6 className="mb-1 fw-bold" style={{ fontSize: '1rem' }}>ข้อความตอบกลับอัตโนมัติ</h6>
                    <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>0 คำตอบ</p>
                </div>
                {/* ส่งชื่อหัวข้อกลับไปให้ตัวพ่อ */}
                <Button variant="dark" style={btnStyle} onClick={() => onNavigate('ข้อความตอบกลับอัตโนมัติ')}>
                    สร้างคำตอบ
                </Button>
            </div>

            {/* กล่องที่ 2 */}
            <div className="d-flex justify-content-between align-items-center border rounded-3 p-3 mb-3 bg-white">
                <div>
                    <h6 className="mb-1 fw-bold" style={{ fontSize: '1rem' }}>คำตอบเริ่มต้น</h6>
                    <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                        ตั้งค่า คำตอบเริ่มต้น (Greeting Message) สำหรับลูกค้าใหม่
                    </p>
                </div>
                <Button variant="dark" style={btnStyle} onClick={() => onNavigate('คำตอบเริ่มต้น')}>
                    ตั้งค่า
                </Button>
            </div>

             <hr className="mb-4 mt-3" style={{ borderTop: '1px solid #666666ff' }} />

            <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-bold" style={{ fontSize: '1rem' }}>ระบบ AI ตอบแชทอัตโนมัติ</h6>
                <Form.Check type="switch" id="ai-system-toggle" style={{ transform: 'scale(1.3)' }} />
            </div>
        </div>
    );
}

export default AiMain;