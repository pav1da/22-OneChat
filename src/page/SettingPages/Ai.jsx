
import { Form } from 'react-bootstrap';

function Ai() {
    return (
        <div className="px-3 pt-2" style={{maxWidth: '700px', marginLeft: '150px'}}>
            
            {/* 1. ส่วนหัวข้อด้านบน */}
            <div className="mb-4">
                <h5 className="mb-1 font-weight-bold" style={{ fontSize: '1.1rem' }}>AI Meta Chat</h5>
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                    อธิบายคร่าวๆ
                </p>
            </div>

            {/* 2. กล่องที่ 1: คำตอบเริ่มต้น */}
            <div className="d-flex justify-content-between align-items-center border rounded-3 p-3 mb-3 bg-white mt-2">
                <div>
                    <h6 className="mb-1 font-weight-bold" style={{ fontSize: '1rem' }}>คำตอบเริ่มต้น</h6>
                    <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>0 คำตอบ</p>
                </div>
                <button className="btn-edit-dark">
                    สร้างคำตอบ
                </button>
            </div>

            {/* 3. กล่องที่ 2: คำตอบสำหรับคำถามที่พบบ่อย */}
            <div className="d-flex justify-content-between align-items-center border rounded-3 p-3 mb-3 bg-white">
                <div>
                    <h6 className="mb-1 font-weight-bold" style={{ fontSize: '1rem' }}>คำตอบสำหรับคำถามที่พบบ่อย</h6>
                    <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>0 คำตอบ</p>
                </div>
                <button className="btn-edit-dark">
                    สร้างคำตอบ
                </button>
            </div>

             {/* 4. กล่องที่ 3: AI Meta Chat (ตั้งค่า) */}
             <div className="d-flex justify-content-between align-items-center border rounded-3 p-3 mb-3 bg-white">
                <div>
                    <h6 className="mb-1 font-weight-bold" style={{ fontSize: '1rem' }}>AI Meta Chat</h6>
                    <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>ตั้งค่าโหมดต่างๆใน AI Meta Chat</p>
                </div>
                <button className="btn-edit-dark">
                    ตั้งค่า
                </button>
            </div>


            {/* เส้นขีดคั่น */}
            <hr className="my-2 mt-3" style={{ borderTop: '1px solid #3e3e3fff' }} />

            {/* 5. ส่วนล่างสุด: สวิตช์เปิด/ปิด AI */}
            <div className="d-flex justify-content-between align-items-center py-2 mt-4 ">
                <h6 className="mb-0 font-weight-bold" style={{ fontSize: '1rem' }}>
                    ระบบ AI ตอบแชทอัตโนมัติ
                </h6>
                <Form.Check
                    type="switch"
                    id="ai-system-toggle"
                    label=""
                />
            </div>

        </div>
    );
}

export default Ai;