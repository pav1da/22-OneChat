import { Stack, Form } from 'react-bootstrap';

function Notifications() {
    // Style สำหรับหัวข้อตัวหนา
    const titleStyle = {
        fontSize: '1rem',
        fontWeight: '600',
        color: '#212529',
        marginBottom: '4px'
    };

    // Style สำหรับคำอธิบายตัวเล็กสีเทา
    const descStyle = {
        fontSize: '0.85rem',
        color: '#adb5bd'
    };

    // Style สำหรับ Dropdown
    const selectStyle = {
        backgroundColor: '#F8F9FA',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '10px 15px',
        fontSize: '0.95rem',
        color: '#495057',
        maxWidth: '100%' 
    };

    return (
        // ลบ style margin เดิมที่ wrapper ออก เพื่อให้ไม่ดันไปทางขวา
        <div className="p-2"> 
            
            {/* เพิ่ม margin: '0 auto' ที่นี่ เพื่อจัดกึ่งกลาง Stack ที่มีความกว้าง 750px */}
            <Stack gap={4} style={{ maxWidth: '750px', margin: '0 auto' }}>

                {/* --- 1. การแจ้งเตือนหลัก --- */}
                <div className="d-flex justify-content-between align-items-start">
                    <div>
                        <div style={titleStyle}>การแจ้งเตือน</div>
                        <div style={descStyle}>เปิด/ปิด การใช้งานการแจ้งเตือนทั้งหมด</div>
                    </div>
                    <Form.Check 
                        type="switch" 
                        id="notify-all" 
                        style={{ transform: 'scale(1.2)' }} 
                        defaultChecked 
                    />
                </div>

                {/* --- 2. Web & Mobile Push --- */}
                <div className="d-flex justify-content-between align-items-start">
                    <div>
                        <div style={titleStyle}>การแจ้งเตือนในแอป (Web & Mobile Push)</div>
                        <div style={descStyle}>เปิด/ปิด การใช้งานการแจ้งเตือนภายในแอปทั้งหมด</div>
                    </div>
                    <Form.Check 
                        type="switch" 
                        id="notify-push" 
                        style={{ transform: 'scale(1.2)' }}
                        defaultChecked
                    />
                </div>

                {/* --- 3. Email --- */}
                <div className="d-flex justify-content-between align-items-start border-bottom pb-4">
                    <div>
                        <div style={titleStyle}>การแจ้งเตือนผ่าน E-mail</div>
                        <div style={descStyle}>เปิด/ปิด การใช้งานการแจ้งเตือนผ่าน E-mail</div>
                    </div>
                    <Form.Check 
                        type="switch" 
                        id="notify-email" 
                        style={{ transform: 'scale(1.2)' }}
                    />
                </div>

                {/* --- 4. ปิดการแจ้งเตือนชั่วคราว (Snooze) --- */}
                <div className="mt-2">
                    <div style={titleStyle}>ปิดการแจ้งเตือนชั่วคราว</div>
                    <div style={descStyle} className="mb-3">
                        One Chat จะไม่ส่งแจ้งเตือนไปที่อุปกรณ์ของคุณเลือกใช้การตั้งค่านี้ เพื่อควบคุมระยะเวลาปิดการแจ้งเตือนชั่วคราว
                    </div>
                    
                    <Form.Select style={selectStyle} aria-label="Snooze duration">
                        <option value="1">1 ชั่วโมง</option>
                        <option value="2">2 ชั่วโมง</option>
                        <option value="4">4 ชั่วโมง</option>
                        <option value="8">8 ชั่วโมง</option>
                        <option value="until_8am">จนถึง 8.00 น.</option>
                    </Form.Select>
                </div>

            </Stack>
        </div>
    );
}

export default Notifications;