
import { Form } from 'react-bootstrap';
import { ChevronRight } from 'react-bootstrap-icons';

function Chats() {
    return (
        <div>

            <div>
                {/* (รายการที่ 1) */}
               <div className="profile-info-item big-item d-flex justify-content-between align-items-center">

                    <h5 className="mb-0">สำรองข้อมูลแชท</h5>
                    <ChevronRight size={20} className="text-muted" />
                </div>

                {/* (รายการที่ 2) */}
               <div className="profile-info-item big-item d-flex justify-content-between align-items-center">

                    <h5 className="mb-0">ลบข้อมูลแชท</h5>
                    <ChevronRight size={20} className="text-muted" />
                </div>

                {/* (รายการที่ 3) */}
               <div className="profile-info-item big-item d-flex justify-content-between align-items-center">

                    <h5 className="mb-">ห้องแชทที่ซ่อน</h5>
                    <ChevronRight size={20} className="text-muted" />
                </div>
            </div>


            
            <h5 className=" mb-1 pt-3" style={{ marginLeft: '20px' }}>ส่งข้อความอัตโนมัติซ้ำอีกครั้ง</h5>

          
            <div className="profile-info-item chat-item d-flex justify-content-between align-items-center py-3">

                <div>
                    <p className="text-muted mb-0" style={{ fontSize: '0.9em', color: '#A8A8A8' }}>
                        เมื่อมือถือความไม่สำเร็จที่ส่งไป One Chat จะพยายามส่งข้อความอีกครั้งโดยอัตโนมัติในอีกไม่กี่ระยะเวลาหนึ่ง
                    </p>
                </div>
                <Form.Check
                    type="switch"
                    id="auto-resend-switch"
                    label=""
                />
            </div>
        </div>
    );
}

export default Chats;