
import { Form } from 'react-bootstrap';

function Chats() {
    // ข้อมูลสำหรับรายการตั้งค่า 3 ตัวบน
    const chatSettings = [
        { title: 'สำรองข้อมูลการแชท', subtitle: 'สำรองข้อมูล บลาๆ' },
        { title: 'ลบข้อมูลแชท', subtitle: 'ลบข้อมูลแชท บลาๆ' },
        { title: 'ห้องแชทที่ซ่อน', subtitle: 'ห้องแชทที่ซ่อน บลาๆ' },
    ];

    return (
        <div className="px-3" style={{maxWidth: '700px', margin: '0 auto'}}>

            <div className="pt-2">
                {chatSettings.map((item, index) => (
                    <div key={index} className="profile-info-item d-flex justify-content-between align-items-center py-4" 
                    style={{
                        // เช็คว่า: ถ้าเป็นตัวที่ 3 (index คือ 2) ให้มีเส้นตามปกติ (null คือใช้ค่าจาก CSS)
                        // แต่ถ้าไม่ใช่ (ตัวที่ 1 กับ 2) ให้สั่งปิดเส้น ('none')
                        borderBottom: index === 2 ? null : 'none'
                    }}>
                        <div>
                            <h5 className="mb-1 font-weight-bold" style={{ fontSize: '1.1rem' }}>{item.title}</h5>
                            <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>{item.subtitle}</p>
                        </div>
                        <button className="btn-edit-dark">
                            แก้ไข
                        </button>
                    </div>
                ))}
            </div>

            {/* เส้นขีดคั่น */}
            <hr className="my-2" style={{ borderTop: '1px solid #e9ecef' }} />

            {/* ส่วนส่งข้อความอัตโนมัติ */}
            <div className="profile-info-item d-flex justify-content-between align-items-start py-4" style={{ borderBottom: 'none' }}>
                <div style={{ maxWidth: '80%' }}>
                    <h5 className="mb-2 font-weight-bold" style={{ fontSize: '1.1rem' }}>ส่งข้อความอัตโนมัติอีกครั้ง</h5>
                    <p className="text-muted mb-0" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                        เมื่อมีข้อความที่ส่งไม่สำเร็จ One Chat จะพยายามส่งข้อความอีกครั้งโดยอัตโนมัติเป็นระยะเวลาหนึ่ง
                    </p>
                </div>
                <div className="pt-1"> {/* ดัน Switch ลงมานิดหน่อยให้สวยงาม */}
                    <Form.Check
                        type="switch"
                        id="auto-resend-switch"
                        label=""
                        defaultChecked={false}
                    />
                </div>
            </div>
        </div>
    );
}

export default Chats;