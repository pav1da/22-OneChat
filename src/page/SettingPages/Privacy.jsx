
import { Stack, Form, Button } from 'react-bootstrap';

function Privacy() {
    return (
        <div>
           
            <Stack gap={4} style={{ maxWidth: '500px' }}>
                <div className="profile-info-item no-border">
                    <div className="label">รหัสผ่าน</div>
                    <div className="value">XXXXXXXX</div>
                </div>
            </Stack>

            <hr className="my-4" />

            {/* 2. ส่วนเปลี่ยนรหัสผ่าน */}
            <div className="mt-5">
                <h4 className="fw-bold m-0">เปลี่ยนรหัสผ่าน</h4>

                <Form style={{ maxWidth: '1500px', color: '#A8A8A8' }} className="mt-4">
                    <Form.Group className="mb-3" controlId="formOldPassword">
                        <Form.Label className="label">ป้อนรหัสผ่านเดิม</Form.Label>
                        <Form.Control
                            type="password"
                            className="form-control-custom"
                        />
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="formNewPassword">
                        <Form.Label className="label">ป้อนรหัสผ่านใหม่</Form.Label>
                        <Form.Control
                            type="password"
                            className="form-control-custom" 
                        />
                    </Form.Group>

                    <div className="d-flex justify-content-end">
                        <Button variant="primary" type="submit" className="btn-custom-orange">
                            ใช้รหัสผ่านนี้
                        </Button>
                    </div>
                </Form>

                <hr className="my-4" />

            </div>

            {/* 3. ส่วนการยืนยันตัวตน (2FA) */}
            <div className="mt-5">
                <h4 className="fw-bold m-0">การยืนยันตัวตนสองชั้นตอน (2FA)</h4>

                <Stack gap={3} className="mt-4" style={{ maxWidth: '1500px', color: '#A8A8A8' }}>

                    {/* สวิตช์ 1: เปิด/ปิด */}
                    <div className="d-flex justify-content-between align-items-center">
                        <span className="value">เปิด/ปิด การใช้งาน</span>
                        <Form.Check
                            type="switch"
                            id="2fa-switch"
                        />
                    </div>

                    {/* สวิตช์ 2: SMS OTP */}
                    <div className="d-flex justify-content-between align-items-center">
                        <span className="value">เชื่อมต่อ SMS OTP</span>
                        <Form.Check
                            type="switch"
                            id="sms-otp-switch"
                        />
                    </div>

                </Stack>
            </div>
        </div>
    );
}

export default Privacy;