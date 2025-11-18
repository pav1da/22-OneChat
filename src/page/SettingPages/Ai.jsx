import { Form } from 'react-bootstrap';
import { ChevronRight } from 'react-bootstrap-icons';

function Ai() {
  return (
    <div className='ai-page'>

      {/* เปิด/ปิด ระบบ AI */}
      <div className="profile-info-item d-flex justify-content-between align-items-center">
        <h5 className="mb-0">เปิด/ปิด ระบบ AI ตอบแชทอัตโนมัติ</h5>
        <Form.Check
          type="switch"
          id="ai-system-toggle"
          label=""
        />
      </div>

      {/* ตั้งค่า AI Meta Chat (แบบมีคำอธิบาย) */}
      <div className="profile-info-item d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-1">ตั้งค่า AI Meta Chat</h5>
          <p className="text-muted mb-0" style={{ fontSize: '0.9em' }}>
            ตั้งค่าโหมดต่างๆใน AI Meta Chat
          </p>
        </div>
        <ChevronRight size={20} className="text-muted" />
      </div>

      {/* ตั้งค่า คำตอบเริ่มต้น */}
      <div className="profile-info-item d-flex justify-content-between align-items-center">
        <h5 className="mb-0">ตั้งค่า คำตอบเริ่มต้น</h5>
        <ChevronRight size={20} className="text-muted" />
      </div>

      {/* ตั้งค่า คำตอบสำหรับคำถามที่พบบ่อย */}
      <div className="profile-info-item d-flex justify-content-between align-items-center">
        <h5 className="mb-0">ตั้งค่า คำตอบสำหรับคำถามที่พบบ่อย</h5>
        <ChevronRight size={20} className="text-muted" />
      </div>

    </div>
  );
}

export default Ai;