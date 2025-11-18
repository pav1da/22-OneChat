
import { Stack, Form } from 'react-bootstrap';


function Notifications() {
    return (
        <div >

           
            <Stack gap={3} className="mt-4 profile-info-list" style={{ maxWidth: '1200px' }}> 

                {/* --- 1. การแจ้งเตือน --- */}
                <div className="profile-info-item d-flex justify-content-between align-items-center">
                    <div>
                        <div className="value" style={{ color: '#212529', fontWeight: '700', fontSize: '1.1rem' }}>การแจ้งเตือน</div>
                        <div className="label mt-1" style={{ color: '#A8A8A8', fontSize: '0.95rem' }}>เปิด/ปิด การใช้งานการแจ้งเตือนทั้งหมด</div>
                    </div>
                    <Form.Check
                        type="switch"
                        id="notify-all"
                    />
                </div>

                {/* --- 2. การแจ้งเตือนในแอปฯ --- */}
                <div className="profile-info-item d-flex justify-content-between align-items-center">
                    <div>
                        <div className="value" style={{ color: '#212529', fontWeight: '700', fontSize: '1.1rem' }}>การแจ้งเตือนในแอปฯ (Web & Mobile Push)</div>
                        <div className="label mt-1" style={{ fontSize: '0.95rem', color: '#A8A8A8' }}>เปิด/ปิด การใช้งานการแจ้งเตือนภายในแอปทั้งหมด</div>
                    </div>
                    <Form.Check
                        type="switch"
                        id="notify-push"
                    />
                </div>

                {/* --- 3. การแจ้งเตือนผ่าน E-mail --- */}
                <div className="profile-info-item d-flex justify-content-between align-items-center">
                    <div>
                        <div className="value" style={{ color: '#212529', fontWeight: '700', fontSize: '1.1rem' }}>การแจ้งเตือนผ่าน E-mail</div>
                        <div className="label mt-1" style={{ fontSize: '0.95rem', color: '#A8A8A8' }}>เปิด/ปิด การแจ้งเตือนผ่าน E-mail</div>
                    </div>
                    <Form.Check
                        type="switch"
                        id="notify-email"
                    />
                </div>

               
                {/* (เราจะใช้ .nav-heading ที่มีอยู่แล้ว) */}
                <div className="nav-heading" style={{ textTransform: 'none', fontSize: '1.1rem', fontWeight: '700', marginTop: '1rem', paddingLeft: 0, paddingBottom: 0, marginLeft: '20px' }}>
                    ปิดการแจ้งเตือนชั่วคราว
                </div>

                
                <div className="profile-info-item d-flex justify-content-between align-items-center">
                    <div className="value" style={{ color: '#A8A8A8', fontSize: '1.1rem' }}>ปิดการแจ้งเตือน 1 ชั่วโมง</div>
                    <Form.Check
                        type="switch"
                        id="notify-snooze-1h"
                    />
                </div>

                <div className="profile-info-item d-flex justify-content-between align-items-center">
                    <div className="value" style={{ color: '#A8A8A8', fontSize: '1.1rem' }}>ปิดการแจ้งเตือนถึง 8.00 น.</div>
                    <Form.Check
                        type="switch"
                        id="notify-snooze-8am"
                    />
                </div>

            </Stack>

        </div>
    );
}

export default Notifications;