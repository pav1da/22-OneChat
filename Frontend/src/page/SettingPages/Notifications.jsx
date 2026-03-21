import { useState, useEffect } from 'react';
import { Stack, Form, Spinner, Alert } from 'react-bootstrap';

function Notifications() {
    const [settings, setSettings] = useState({
        main_notification: true,
        push_notification: true,
        email_notification: false,
        notification_level: 'none'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // ดึงการตั้งค่าเมื่อโหลดหน้า
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('token');
            const res = await fetch('/api/notification-settings', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('ไม่สามารถดึงการตั้งค่าได้');
            const data = await res.json();
            setSettings(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateSettings = async (updatedSettings) => {
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch('/api/notification-settings', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(updatedSettings)
            });
            if (!res.ok) throw new Error('ไม่สามารถอัพเดทการตั้งค่าได้');
            const data = await res.json();
            setSettings(data.settings);
            setSuccessMessage('บันทึกการตั้งค่าสำเร็จ');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleToggle = (field) => {
        const newSettings = { ...settings, [field]: !settings[field] };
        setSettings(newSettings);
        updateSettings(newSettings);
    };

    const handleLevelChange = (e) => {
        const newSettings = { ...settings, notification_level: e.target.value };
        setSettings(newSettings);
        updateSettings(newSettings);
    };

    // Style สำหรับหัวข้อตัวหนา
    const titleStyle = {
        fontSize: '1.1rem',
        fontWeight: '500',
        color: '#212529',
        marginBottom: '4px'
    };

    // Style สำหรับคำอธิบายตัวเล็กสีเทา
    const descStyle = {
        fontSize: '0.9rem',
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

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">กำลังโหลดการตั้งค่า...</p>
            </div>
        );
    }

    return (
        <div className="p-2 mt-3 pt-5">
            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            {successMessage && (
                <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>
                    {successMessage}
                </Alert>
            )}

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
                        checked={settings.main_notification}
                        onChange={() => handleToggle('main_notification')}
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
                        checked={settings.push_notification}
                        onChange={() => handleToggle('push_notification')}
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
                        checked={settings.email_notification}
                        onChange={() => handleToggle('email_notification')}
                    />
                </div>

                {/* --- 4. ปิดการแจ้งเตือนชั่วคราว (Snooze) --- */}
                <div className="mt-2">
                    <div style={titleStyle}>ปิดการแจ้งเตือนชั่วคราว</div>
                    <div style={descStyle} className="mb-3">
                        One Chat จะไม่ส่งแจ้งเตือนไปที่อุปกรณ์ของคุณเลือกใช้การตั้งค่านี้ เพื่อควบคุมระยะเวลาปิดการแจ้งเตือนชั่วคราว
                    </div>

                    <Form.Select
                        style={selectStyle}
                        aria-label="Snooze duration"
                        value={settings.notification_level}
                        onChange={handleLevelChange}
                    >
                        <option value="none">ไม่ปิด</option>
                        <option value="1h">1 ชั่วโมง</option>
                        <option value="2h">2 ชั่วโมง</option>
                        <option value="4h">4 ชั่วโมง</option>
                        <option value="8h">8 ชั่วโมง</option>
                        <option value="until_8am">จนถึง 8.00 น.</option>
                    </Form.Select>
                </div>

            </Stack>
        </div>
    );
}

export default Notifications;